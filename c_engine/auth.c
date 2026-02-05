#include "data_structures.h"

void init_auth(UserTable *table) {
    for (int i = 0; i < TABLE_SIZE; i++) {
        table->buckets[i] = NULL;
    }
}

int register_user(UserTable *table, const char *username, const char *password) {
    unsigned int index = hash(username);
    User *current = table->buckets[index];

    // Check if user exists
    while (current != NULL) {
        if (strcmp(current->username, username) == 0) {
            return 0; // User already exists
        }
        current = current->next;
    }

    // Create new user
    User *newUser = (User *)malloc(sizeof(User));
    strncpy(newUser->username, username, MAX_USERNAME - 1);
    newUser->username[MAX_USERNAME - 1] = '\0';
    strncpy(newUser->password, password, MAX_PASSWORD - 1);
    newUser->password[MAX_PASSWORD - 1] = '\0';
    
    // Insert at head
    newUser->next = table->buckets[index];
    table->buckets[index] = newUser;
    
    return 1; // Success
}

int login_user(UserTable *table, const char *username, const char *password) {
    unsigned int index = hash(username);
    User *current = table->buckets[index];

    while (current != NULL) {
        if (strcmp(current->username, username) == 0) {
            if (strcmp(current->password, password) == 0) {
                return 1; // Success
            } else {
                return 0; // Wrong password
            }
        }
        current = current->next;
    }
    return 0; // User not found
}

void save_users(UserTable *table, const char *filename) {
    FILE *file = fopen(filename, "w");
    if (!file) return;

    for (int i = 0; i < TABLE_SIZE; i++) {
        User *current = table->buckets[i];
        while (current != NULL) {
            fprintf(file, "%s,%s\n", current->username, current->password);
            current = current->next;
        }
    }
    fclose(file);
}

void load_users(UserTable *table, const char *filename) {
    FILE *file = fopen(filename, "r");
    if (!file) return;

    char line[256];
    while (fgets(line, sizeof(line), file)) {
        line[strcspn(line, "\n")] = 0;
        char *username = strtok(line, ",");
        char *password = strtok(NULL, ",");
        if (username && password) {
            register_user(table, username, password);
        }
    }
    fclose(file);
}
