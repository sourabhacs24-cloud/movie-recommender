#include "data_structures.h"

// Global global data structures
UserTable userTable;
CommentTable commentTable;
ChatQueue chatQueue;
ListTable listTable;

// Data files
#define FILE_USERS "users.dat"
#define FILE_COMMENTS "comments.dat"
#define FILE_CHAT "chat.dat"
#define FILE_LISTS "mylist.dat"

void load_all() {
    init_auth(&userTable);
    init_comments(&commentTable);
    init_chat(&chatQueue);
    init_mylist(&listTable);
    
    load_users(&userTable, FILE_USERS);
    load_comments(&commentTable, FILE_COMMENTS);
    load_chat(&chatQueue, FILE_CHAT);
    load_lists(&listTable, FILE_LISTS);
}

void save_all() {
    save_users(&userTable, FILE_USERS);
    save_comments(&commentTable, FILE_COMMENTS);
    save_chat(&chatQueue, FILE_CHAT);
    save_lists(&listTable, FILE_LISTS);
}

int main(int argc, char *argv[]) {
    if (argc < 2) {
        printf("Error: Missing module argument\n");
        return 1;
    }
    
    // Change directory to executable location (handled by python usually, but good practice)
    // Actually, simple file loading assumes current working directory is correct.
    // Python will ensure CWD is c_engine/
    
    load_all();
    
    char *module = argv[1];
    
    // ================= AUTH MODULE =================
    if (strcmp(module, "auth") == 0) {
        if (argc < 3) return 1;
        char *action = argv[2];
        
        if (strcmp(action, "register") == 0 && argc == 5) {
            int result = register_user(&userTable, argv[3], argv[4]);
            if (result) printf("SUCCESS\n");
            else printf("FAILURE\n");
        } 
        else if (strcmp(action, "login") == 0 && argc == 5) {
            int result = login_user(&userTable, argv[3], argv[4]);
            if (result) printf("SUCCESS\n");
            else printf("FAILURE\n");
        }
    }
    
    // ================= COMMENTS MODULE =================
    else if (strcmp(module, "comments") == 0) {
        if (argc < 3) return 1;
        char *action = argv[2];
        
        if (strcmp(action, "add") == 0 && argc >= 6) {
            // ./movie_system comments add <movie_id> <user> <text...>
            int id = atoi(argv[3]);
            char *user = argv[4];
            
            // Reconstruct text from remaining args
            char text[MAX_COMMENT] = "";
            for (int i = 5; i < argc; i++) {
                strcat(text, argv[i]);
                if (i < argc - 1) strcat(text, " ");
            }
            
            add_comment(&commentTable, id, user, text);
            printf("SUCCESS\n");
        }
        else if (strcmp(action, "get") == 0 && argc == 4) {
            int id = atoi(argv[3]);
            print_comments(&commentTable, id);
        }
    }
    
    // ================= CHAT MODULE =================
    else if (strcmp(module, "chat") == 0) {
        if (argc < 3) return 1;
        char *action = argv[2];
        
        if (strcmp(action, "add") == 0 && argc >= 5) {
            char *user = argv[3];
            char text[MAX_MSG] = "";
            for (int i = 4; i < argc; i++) {
                strcat(text, argv[i]);
                if (i < argc - 1) strcat(text, " ");
            }
            add_chat_message(&chatQueue, user, text);
            printf("SUCCESS\n");
        }
        else if (strcmp(action, "get") == 0) {
            print_chat_messages(&chatQueue);
        }
    }
    
    // ================= MYLIST MODULE =================
    else if (strcmp(module, "mylist") == 0) {
        if (argc < 3) return 1;
        char *action = argv[2];
        
        if (strcmp(action, "add") == 0 && argc == 5) {
            add_to_list(&listTable, argv[3], atoi(argv[4]));
            printf("SUCCESS\n");
        }
        else if (strcmp(action, "remove") == 0 && argc == 5) {
            remove_from_list(&listTable, argv[3], atoi(argv[4]));
            printf("SUCCESS\n");
        }
        else if (strcmp(action, "get") == 0 && argc == 4) {
            print_user_list(&listTable, argv[3]);
        }
    }
    
    save_all();
    return 0;
}
