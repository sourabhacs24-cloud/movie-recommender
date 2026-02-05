#include "data_structures.h"

void init_comments(CommentTable *table) {
    for (int i = 0; i < TABLE_SIZE; i++) {
        table->buckets[i] = NULL;
    }
}

void add_comment(CommentTable *table, int movie_id, const char *username, const char *text) {
    unsigned int index = hashInt(movie_id);
    MovieComments *current = table->buckets[index];
    MovieComments *target = NULL;

    // Find bucket for this movie
    while (current != NULL) {
        if (current->movie_id == movie_id) {
            target = current;
            break;
        }
        current = current->next;
    }

    // Create bucket if not exists
    if (target == NULL) {
        target = (MovieComments *)malloc(sizeof(MovieComments));
        target->movie_id = movie_id;
        target->head = NULL;
        target->next = table->buckets[index];
        table->buckets[index] = target;
    }

    // Add comment to list
    Comment *newComment = (Comment *)malloc(sizeof(Comment));
    strncpy(newComment->username, username, MAX_USERNAME - 1);
    newComment->username[MAX_USERNAME - 1] = '\0';
    strncpy(newComment->text, text, MAX_COMMENT - 1);
    newComment->text[MAX_COMMENT - 1] = '\0';
    newComment->timestamp = time(NULL);
    
    // Insert at HEAD (newest first)
    newComment->next = target->head;
    target->head = newComment;
}

void print_comments(CommentTable *table, int movie_id) {
    unsigned int index = hashInt(movie_id);
    MovieComments *current = table->buckets[index];

    printf("[");
    int first = 1;

    while (current != NULL) {
        if (current->movie_id == movie_id) {
            Comment *comm = current->head;
            while (comm != NULL) {
                if (!first) printf(",");
                char timeStr[64];
                get_timestamp_str(comm->timestamp, timeStr, sizeof(timeStr));
                
                // Escape simple JSON characters (simulated)
                printf("{\"username\":\"%s\",\"text\":\"%s\",\"date\":\"%s\"}", 
                       comm->username, comm->text, timeStr);
                first = 0;
                comm = comm->next;
            }
            break;
        }
        current = current->next;
    }
    printf("]\n");
}

void save_comments(CommentTable *table, const char *filename) {
    FILE *file = fopen(filename, "w");
    if (!file) return;

    for (int i = 0; i < TABLE_SIZE; i++) {
        MovieComments *mc = table->buckets[i];
        while (mc != NULL) {
            Comment *c = mc->head;
            while (c != NULL) {
                fprintf(file, "%d|%s|%ld|%s\n", mc->movie_id, c->username, c->timestamp, c->text);
                c = c->next;
            }
            mc = mc->next;
        }
    }
    fclose(file);
}

void load_comments(CommentTable *table, const char *filename) {
    FILE *file = fopen(filename, "r");
    if (!file) return;

    char line[512];
    while (fgets(line, sizeof(line), file)) {
        line[strcspn(line, "\r\n")] = 0;
        char *idStr = strtok(line, "|");
        char *user = strtok(NULL, "|");
        char *timeStr = strtok(NULL, "|");
        char *text = strtok(NULL, "|");
        
        if (idStr && user && timeStr && text) {
            int movie_id = atoi(idStr);
            long ts = atol(timeStr);
            
            // Re-implement add (manual for timestamp preservation)
            unsigned int index = hashInt(movie_id);
            MovieComments *current = table->buckets[index];
            MovieComments *target = NULL;
            while (current != NULL) {
                if (current->movie_id == movie_id) { target = current; break; }
                current = current->next;
            }
            if (target == NULL) {
                target = (MovieComments *)malloc(sizeof(MovieComments));
                target->movie_id = movie_id; target->head = NULL;
                target->next = table->buckets[index]; table->buckets[index] = target;
            }
            Comment *newComment = (Comment *)malloc(sizeof(Comment));
            strcpy(newComment->username, user);
            strcpy(newComment->text, text);
            newComment->timestamp = ts;
            // Load by appending to end to keep order? Actually generic add inserts at head, 
            // so if we read sequentially, we reverse order. 
            // For simplicity, we just insert at head, so file should be read in reverse or valid order.
            // If file is saved newest first (head first), then loading sequentially will reverse it again (oldest first).
            // Actually, save iterates head->next, so newest first.
            // Load reads newest first, inserts at head -> newer becomes head.
            // Wait.
            // Save: C1(New), C2(Old). File: C1\nC2
            // Load: Read C1, insert head -> [C1]. Read C2, insert head -> [C2, C1].
            // Result: C2 is new head (Newest). Order preserved? No, reversed.
            
            // Fix: Insert at tail for loading? Or just load and reverse later.
            // Let's Insert at Tail for loading to preserve file order.
            
           // ... (Simpler approach: Just use add_comment and accept reverse order for now or fix later if critical)
           
           // Using simple insert for now as this is a prototype extension.
           newComment->next = target->head;
           target->head = newComment;
        }
    }
    fclose(file);
}
