/**
 * data_structures.h - Common definitions for Movie System Extensions
 */

#ifndef DATA_STRUCTURES_H
#define DATA_STRUCTURES_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

// Constants
#define MAX_USERNAME 50
#define MAX_PASSWORD 50
#define MAX_COMMENT 256
#define MAX_MSG 256
#define MAX_USERS 100
#define TABLE_SIZE 127

// ================= AUTH STRUCTURES =================
typedef struct User {
    char username[MAX_USERNAME];
    char password[MAX_PASSWORD];
    struct User *next; // For hash collisions
} User;

typedef struct {
    User *buckets[TABLE_SIZE];
} UserTable;

// ================= COMMENT STRUCTURES =================
typedef struct Comment {
    char username[MAX_USERNAME];
    char text[MAX_COMMENT];
    long timestamp;
    struct Comment *next;
} Comment;

typedef struct MovieComments {
    int movie_id;
    Comment *head;
    struct MovieComments *next; // For hash collisions (keyed by movie_id)
} MovieComments;

typedef struct {
    MovieComments *buckets[TABLE_SIZE];
} CommentTable;

// ================= CHAT STRUCTURES =================
typedef struct ChatMessage {
    char username[MAX_USERNAME];
    char text[MAX_MSG];
    long timestamp;
} ChatMessage;

#define CHAT_HISTORY_SIZE 50
typedef struct {
    ChatMessage messages[CHAT_HISTORY_SIZE];
    int front;
    int rear;
    int count;
} ChatQueue;

// ================= MY LIST STRUCTURES =================
typedef struct MovieNode {
    int movie_id;
    struct MovieNode *next;
} MovieNode;

typedef struct UserList {
    char username[MAX_USERNAME];
    MovieNode *head;
    struct UserList *next; // For hash collisions
} UserList;

typedef struct {
    UserList *buckets[TABLE_SIZE];
} ListTable;

// ================= FUNCTION PROTOTYPES =================

// Utility
unsigned int hash(const char *str);
unsigned int hashInt(int key);
void get_timestamp_str(long timestamp, char *buffer, size_t size);

// Auth
void init_auth(UserTable *table);
int register_user(UserTable *table, const char *username, const char *password);
int login_user(UserTable *table, const char *username, const char *password);
void save_users(UserTable *table, const char *filename);
void load_users(UserTable *table, const char *filename);

// Comments
void init_comments(CommentTable *table);
void add_comment(CommentTable *table, int movie_id, const char *username, const char *text);
void print_comments(CommentTable *table, int movie_id);
void save_comments(CommentTable *table, const char *filename);
void load_comments(CommentTable *table, const char *filename);

// Chat
void init_chat(ChatQueue *queue);
void add_chat_message(ChatQueue *queue, const char *username, const char *text);
void print_chat_messages(ChatQueue *queue); // Returns JSON array format
void save_chat(ChatQueue *queue, const char *filename);
void load_chat(ChatQueue *queue, const char *filename);

// My List
void init_mylist(ListTable *table);
void add_to_list(ListTable *table, const char *username, int movie_id);
void remove_from_list(ListTable *table, const char *username, int movie_id);
void print_user_list(ListTable *table, const char *username);
void save_lists(ListTable *table, const char *filename);
void load_lists(ListTable *table, const char *filename);

// ================= FRIENDS STRUCTURES =================
typedef struct FriendRequest {
    char from_user[MAX_USERNAME];
    char to_user[MAX_USERNAME];
    long timestamp;
    struct FriendRequest *next;
} FriendRequest;

typedef struct Friendship {
    char user1[MAX_USERNAME];
    char user2[MAX_USERNAME];
    long timestamp;
    struct Friendship *next;
} Friendship;

typedef struct {
    FriendRequest *pending_requests;
    Friendship *friendships;
} FriendTable;

// Friends
void init_friends(FriendTable *table);
int send_friend_request(FriendTable *table, const char *from_user, const char *to_user);
int accept_friend_request(FriendTable *table, const char *from_user, const char *to_user);
int reject_friend_request(FriendTable *table, const char *from_user, const char *to_user);
void print_friends(FriendTable *table, const char *username);
void print_pending_requests(FriendTable *table, const char *username);
void print_similar_users(FriendTable *table, ListTable *listTable, const char *username);
void save_friends(FriendTable *table, const char *filename);
void load_friends(FriendTable *table, const char *filename);

#endif
