#include "data_structures.h"

void init_mylist(ListTable *table) {
    for (int i = 0; i < TABLE_SIZE; i++) {
        table->buckets[i] = NULL;
    }
}

void add_to_list(ListTable *table, const char *username, int movie_id) {
    unsigned int index = hash(username);
    UserList *current = table->buckets[index];
    
    // Find user bucket
    while (current != NULL) {
        if (strcmp(current->username, username) == 0) break;
        current = current->next;
    }
    
    // Create bucket if needed
    if (current == NULL) {
        current = (UserList *)malloc(sizeof(UserList));
        strcpy(current->username, username);
        current->head = NULL;
        current->next = table->buckets[index];
        table->buckets[index] = current;
    }
    
    // Check duplication
    MovieNode *node = current->head;
    while (node != NULL) {
        if (node->movie_id == movie_id) return; // Already in list
        node = node->next;
    }
    
    // Add to list
    MovieNode *newNode = (MovieNode *)malloc(sizeof(MovieNode));
    newNode->movie_id = movie_id;
    newNode->next = current->head;
    current->head = newNode;
}

void remove_from_list(ListTable *table, const char *username, int movie_id) {
    unsigned int index = hash(username);
    UserList *current = table->buckets[index];
    
    while (current != NULL) {
        if (strcmp(current->username, username) == 0) {
            MovieNode *node = current->head;
            MovieNode *prev = NULL;
            
            while (node != NULL) {
                if (node->movie_id == movie_id) {
                    if (prev == NULL) current->head = node->next;
                    else prev->next = node->next;
                    free(node);
                    return;
                }
                prev = node;
                node = node->next;
            }
            break;
        }
        current = current->next;
    }
}

void print_user_list(ListTable *table, const char *username) {
    unsigned int index = hash(username);
    UserList *current = table->buckets[index];
    
    printf("[");
    // Find user
    while (current != NULL) {
        if (strcmp(current->username, username) == 0) {
            MovieNode *node = current->head;
            int first = 1;
            while (node != NULL) {
                if (!first) printf(",");
                printf("%d", node->movie_id);
                first = 0;
                node = node->next;
            }
            break;
        }
        current = current->next;
    }
    printf("]\n");
}

void save_lists(ListTable *table, const char *filename) {
    FILE *file = fopen(filename, "w");
    if (!file) return;
    
    for (int i = 0; i < TABLE_SIZE; i++) {
        UserList *ul = table->buckets[i];
        while (ul != NULL) {
            MovieNode *n = ul->head;
            while (n != NULL) {
                fprintf(file, "%s,%d\n", ul->username, n->movie_id);
                n = n->next;
            }
            ul = ul->next;
        }
    }
    fclose(file);
}

void load_lists(ListTable *table, const char *filename) {
    FILE *file = fopen(filename, "r");
    if (!file) return;
    
    char line[256];
    while (fgets(line, sizeof(line), file)) {
        line[strcspn(line, "\n")] = 0;
        char *user = strtok(line, ",");
        char *idStr = strtok(NULL, ",");
        
        if (user && idStr) {
            add_to_list(table, user, atoi(idStr));
        }
    }
    fclose(file);
}
