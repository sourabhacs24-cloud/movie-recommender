#include "data_structures.h"

// Global global data structures
UserTable userTable;
CommentTable commentTable;
ChatQueue chatQueue;
ListTable listTable;
FriendTable friendTable;

// Data files
#define FILE_USERS "users.dat"
#define FILE_COMMENTS "comments.dat"
#define FILE_CHAT "chat.dat"
#define FILE_LISTS "mylist.dat"
#define FILE_FRIENDS "friends.dat"

void load_all() {
  init_auth(&userTable);
  init_comments(&commentTable);
  init_chat(&chatQueue);
  init_mylist(&listTable);
  init_friends(&friendTable);

  load_users(&userTable, FILE_USERS);
  load_comments(&commentTable, FILE_COMMENTS);
  load_chat(&chatQueue, FILE_CHAT);
  load_lists(&listTable, FILE_LISTS);
  load_friends(&friendTable, FILE_FRIENDS);
}

void save_all() {
  save_users(&userTable, FILE_USERS);
  save_comments(&commentTable, FILE_COMMENTS);
  save_chat(&chatQueue, FILE_CHAT);
  save_lists(&listTable, FILE_LISTS);
  save_friends(&friendTable, FILE_FRIENDS);
}

int main(int argc, char *argv[]) {
  if (argc < 2) {
    printf("Error: Missing module argument\n");
    return 1;
  }

  // Change directory to executable location (handled by python usually, but
  // good practice) Actually, simple file loading assumes current working
  // directory is correct. Python will ensure CWD is c_engine/

  load_all();

  char *module = argv[1];

  // ================= AUTH MODULE =================
  if (strcmp(module, "auth") == 0) {
    if (argc < 3)
      return 1;
    char *action = argv[2];

    if (strcmp(action, "register") == 0 && argc == 5) {
      int result = register_user(&userTable, argv[3], argv[4]);
      if (result)
        printf("SUCCESS\n");
      else
        printf("FAILURE\n");
    } else if (strcmp(action, "login") == 0 && argc == 5) {
      int result = login_user(&userTable, argv[3], argv[4]);
      if (result)
        printf("SUCCESS\n");
      else
        printf("FAILURE\n");
    }
  }

  // ================= COMMENTS MODULE =================
  else if (strcmp(module, "comments") == 0) {
    if (argc < 3)
      return 1;
    char *action = argv[2];

    if (strcmp(action, "add") == 0 && argc >= 6) {
      // ./movie_system comments add <movie_id> <user> <text...>
      int id = atoi(argv[3]);
      char *user = argv[4];

      // Reconstruct text from remaining args
      char text[MAX_COMMENT] = "";
      for (int i = 5; i < argc; i++) {
        strcat(text, argv[i]);
        if (i < argc - 1)
          strcat(text, " ");
      }

      add_comment(&commentTable, id, user, text);
      printf("SUCCESS\n");
    } else if (strcmp(action, "get") == 0 && argc == 4) {
      int id = atoi(argv[3]);
      print_comments(&commentTable, id);
    }
  }

  // ================= CHAT MODULE =================
  else if (strcmp(module, "chat") == 0) {
    if (argc < 3)
      return 1;
    char *action = argv[2];

    if (strcmp(action, "add") == 0 && argc >= 5) {
      char *user = argv[3];
      char text[MAX_MSG] = "";
      for (int i = 4; i < argc; i++) {
        strcat(text, argv[i]);
        if (i < argc - 1)
          strcat(text, " ");
      }
      add_chat_message(&chatQueue, user, text);
      printf("SUCCESS\n");
    } else if (strcmp(action, "get") == 0) {
      print_chat_messages(&chatQueue);
    }
  }

  // ================= MYLIST MODULE =================
  else if (strcmp(module, "mylist") == 0) {
    if (argc < 3)
      return 1;
    char *action = argv[2];

    if (strcmp(action, "add") == 0 && argc == 5) {
      add_to_list(&listTable, argv[3], atoi(argv[4]));
      printf("SUCCESS\n");
    } else if (strcmp(action, "remove") == 0 && argc == 5) {
      remove_from_list(&listTable, argv[3], atoi(argv[4]));
      printf("SUCCESS\n");
    } else if (strcmp(action, "get") == 0 && argc == 4) {
      print_user_list(&listTable, argv[3]);
    }
  }

  // ================= FRIENDS MODULE =================
  else if (strcmp(module, "friends") == 0) {
    if (argc < 3)
      return 1;
    char *action = argv[2];

    if (strcmp(action, "send") == 0 && argc == 5) {
      int result = send_friend_request(&friendTable, argv[3], argv[4]);
      if (result)
        printf("SUCCESS\n");
      else
        printf("FAILURE\n");
    } else if (strcmp(action, "accept") == 0 && argc == 5) {
      int result = accept_friend_request(&friendTable, argv[3], argv[4]);
      if (result)
        printf("SUCCESS\n");
      else
        printf("FAILURE\n");
    } else if (strcmp(action, "reject") == 0 && argc == 5) {
      int result = reject_friend_request(&friendTable, argv[3], argv[4]);
      if (result)
        printf("SUCCESS\n");
      else
        printf("FAILURE\n");
    } else if (strcmp(action, "list") == 0 && argc == 4) {
      print_friends(&friendTable, argv[3]);
    } else if (strcmp(action, "requests") == 0 && argc == 4) {
      print_pending_requests(&friendTable, argv[3]);
    } else if (strcmp(action, "similar") == 0 && argc == 4) {
      print_similar_users(&friendTable, &listTable, argv[3]);
    }
  }

  save_all();
  return 0;
}
