/**
 * friends.c - Friends management with similar interests matching
 */

#include "data_structures.h"

// Helper to get genres from a user's movie list
#define MAX_GENRES 20
#define GENRE_LEN 32

// Initialize friends table
void init_friends(FriendTable *table) {
  table->pending_requests = NULL;
  table->friendships = NULL;
}

// Check if already friends
int are_friends(FriendTable *table, const char *user1, const char *user2) {
  Friendship *f = table->friendships;
  while (f) {
    if ((strcmp(f->user1, user1) == 0 && strcmp(f->user2, user2) == 0) ||
        (strcmp(f->user1, user2) == 0 && strcmp(f->user2, user1) == 0)) {
      return 1;
    }
    f = f->next;
  }
  return 0;
}

// Check if request already exists
int request_exists(FriendTable *table, const char *from, const char *to) {
  FriendRequest *r = table->pending_requests;
  while (r) {
    if (strcmp(r->from_user, from) == 0 && strcmp(r->to_user, to) == 0) {
      return 1;
    }
    r = r->next;
  }
  return 0;
}

// Send friend request
int send_friend_request(FriendTable *table, const char *from_user,
                        const char *to_user) {
  // Check if already friends
  if (are_friends(table, from_user, to_user))
    return 0;

  // Check if request already exists
  if (request_exists(table, from_user, to_user))
    return 0;
  if (request_exists(table, to_user, from_user))
    return 0; // Reverse also counts

  FriendRequest *req = malloc(sizeof(FriendRequest));
  strncpy(req->from_user, from_user, MAX_USERNAME - 1);
  strncpy(req->to_user, to_user, MAX_USERNAME - 1);
  req->timestamp = time(NULL);
  req->next = table->pending_requests;
  table->pending_requests = req;

  return 1;
}

// Accept friend request
int accept_friend_request(FriendTable *table, const char *from_user,
                          const char *to_user) {
  FriendRequest *prev = NULL;
  FriendRequest *curr = table->pending_requests;

  while (curr) {
    if (strcmp(curr->from_user, from_user) == 0 &&
        strcmp(curr->to_user, to_user) == 0) {
      // Remove request
      if (prev)
        prev->next = curr->next;
      else
        table->pending_requests = curr->next;
      free(curr);

      // Add friendship
      Friendship *f = malloc(sizeof(Friendship));
      strncpy(f->user1, from_user, MAX_USERNAME - 1);
      strncpy(f->user2, to_user, MAX_USERNAME - 1);
      f->timestamp = time(NULL);
      f->next = table->friendships;
      table->friendships = f;

      return 1;
    }
    prev = curr;
    curr = curr->next;
  }
  return 0;
}

// Reject friend request
int reject_friend_request(FriendTable *table, const char *from_user,
                          const char *to_user) {
  FriendRequest *prev = NULL;
  FriendRequest *curr = table->pending_requests;

  while (curr) {
    if (strcmp(curr->from_user, from_user) == 0 &&
        strcmp(curr->to_user, to_user) == 0) {
      if (prev)
        prev->next = curr->next;
      else
        table->pending_requests = curr->next;
      free(curr);
      return 1;
    }
    prev = curr;
    curr = curr->next;
  }
  return 0;
}

// Print friends list as JSON
void print_friends(FriendTable *table, const char *username) {
  printf("[");
  int first = 1;
  Friendship *f = table->friendships;
  while (f) {
    const char *friend_name = NULL;
    if (strcmp(f->user1, username) == 0) {
      friend_name = f->user2;
    } else if (strcmp(f->user2, username) == 0) {
      friend_name = f->user1;
    }

    if (friend_name) {
      if (!first)
        printf(",");
      printf("{\"username\":\"%s\"}", friend_name);
      first = 0;
    }
    f = f->next;
  }
  printf("]");
}

// Print pending requests for user (requests TO this user)
void print_pending_requests(FriendTable *table, const char *username) {
  printf("[");
  int first = 1;
  FriendRequest *r = table->pending_requests;
  while (r) {
    if (strcmp(r->to_user, username) == 0) {
      if (!first)
        printf(",");
      printf("{\"from_user\":\"%s\"}", r->from_user);
      first = 0;
    }
    r = r->next;
  }
  printf("]");
}

// Get user's genres from their list
int get_user_genres(ListTable *listTable, const char *username,
                    char genres[][GENRE_LEN], int max_genres) {
  unsigned int idx = hash(username) % TABLE_SIZE;
  UserList *ul = listTable->buckets[idx];

  while (ul) {
    if (strcmp(ul->username, username) == 0) {
      // For simplicity, we'll categorize by movie_id ranges
      // In real app, you'd look up the movie's genre
      // Here we use a simplified approach: movie IDs map to genres
      int count = 0;
      MovieNode *mn = ul->head;
      while (mn && count < max_genres) {
        // Simplified genre mapping based on movie ID
        int id = mn->movie_id;
        const char *genre;
        if (id <= 50)
          genre = "Drama";
        else if (id <= 100)
          genre = "Action";
        else if (id <= 150)
          genre = "Sci-Fi";
        else if (id <= 200)
          genre = "Comedy";
        else if (id <= 250)
          genre = "Thriller";
        else if (id <= 300)
          genre = "Horror";
        else if (id <= 350)
          genre = "Romance";
        else
          genre = "Animation";

        // Check if genre already in list
        int found = 0;
        for (int i = 0; i < count; i++) {
          if (strcmp(genres[i], genre) == 0) {
            found = 1;
            break;
          }
        }
        if (!found) {
          strncpy(genres[count], genre, GENRE_LEN - 1);
          count++;
        }
        mn = mn->next;
      }
      return count;
    }
    ul = ul->next;
  }
  return 0;
}

// Count shared genres between two users
int count_shared_genres(char g1[][GENRE_LEN], int c1, char g2[][GENRE_LEN],
                        int c2) {
  int shared = 0;
  for (int i = 0; i < c1; i++) {
    for (int j = 0; j < c2; j++) {
      if (strcmp(g1[i], g2[j]) == 0) {
        shared++;
        break;
      }
    }
  }
  return shared;
}

// Print similar users (users with overlapping genres in their lists)
void print_similar_users(FriendTable *table, ListTable *listTable,
                         const char *username) {
  char my_genres[MAX_GENRES][GENRE_LEN] = {0};
  int my_count = get_user_genres(listTable, username, my_genres, MAX_GENRES);

  printf("[");
  int first = 1;

  // Iterate all users in list table
  for (int i = 0; i < TABLE_SIZE; i++) {
    UserList *ul = listTable->buckets[i];
    while (ul) {
      if (strcmp(ul->username, username) != 0 &&
          !are_friends(table, username, ul->username)) {
        char their_genres[MAX_GENRES][GENRE_LEN] = {0};
        int their_count =
            get_user_genres(listTable, ul->username, their_genres, MAX_GENRES);

        int shared =
            count_shared_genres(my_genres, my_count, their_genres, their_count);

        if (shared > 0) {
          if (!first)
            printf(",");
          int score = (shared * 100) / (my_count > 0 ? my_count : 1);
          if (score > 100)
            score = 100;
          printf(
              "{\"username\":\"%s\",\"match_score\":%d,\"shared_genres\":%d}",
              ul->username, score, shared);
          first = 0;
        }
      }
      ul = ul->next;
    }
  }
  printf("]");
}

// Save friends to file
void save_friends(FriendTable *table, const char *filename) {
  FILE *f = fopen(filename, "w");
  if (!f)
    return;

  // Save friendships
  fprintf(f, "FRIENDSHIPS\n");
  Friendship *fs = table->friendships;
  while (fs) {
    fprintf(f, "%s|%s|%ld\n", fs->user1, fs->user2, fs->timestamp);
    fs = fs->next;
  }

  // Save pending requests
  fprintf(f, "REQUESTS\n");
  FriendRequest *r = table->pending_requests;
  while (r) {
    fprintf(f, "%s|%s|%ld\n", r->from_user, r->to_user, r->timestamp);
    r = r->next;
  }

  fclose(f);
}

// Load friends from file
void load_friends(FriendTable *table, const char *filename) {
  FILE *f = fopen(filename, "r");
  if (!f)
    return;

  char line[256];
  int in_friendships = 0;
  int in_requests = 0;

  while (fgets(line, sizeof(line), f)) {
    line[strcspn(line, "\r\n")] = 0;

    if (strcmp(line, "FRIENDSHIPS") == 0) {
      in_friendships = 1;
      in_requests = 0;
      continue;
    }
    if (strcmp(line, "REQUESTS") == 0) {
      in_friendships = 0;
      in_requests = 1;
      continue;
    }

    if (strlen(line) == 0)
      continue;

    char user1[MAX_USERNAME], user2[MAX_USERNAME];
    long ts;

    if (sscanf(line, "%[^|]|%[^|]|%ld", user1, user2, &ts) == 3) {
      if (in_friendships) {
        Friendship *fs = malloc(sizeof(Friendship));
        strncpy(fs->user1, user1, MAX_USERNAME - 1);
        strncpy(fs->user2, user2, MAX_USERNAME - 1);
        fs->timestamp = ts;
        fs->next = table->friendships;
        table->friendships = fs;
      } else if (in_requests) {
        FriendRequest *r = malloc(sizeof(FriendRequest));
        strncpy(r->from_user, user1, MAX_USERNAME - 1);
        strncpy(r->to_user, user2, MAX_USERNAME - 1);
        r->timestamp = ts;
        r->next = table->pending_requests;
        table->pending_requests = r;
      }
    }
  }

  fclose(f);
}
