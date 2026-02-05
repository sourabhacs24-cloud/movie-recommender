#include "data_structures.h"

void init_chat(ChatQueue *queue) {
    queue->front = 0;
    queue->rear = -1;
    queue->count = 0;
}

void add_chat_message(ChatQueue *queue, const char *username, const char *text) {
    // If full, remove oldest (circular overwrite)
    if (queue->count == CHAT_HISTORY_SIZE) {
        queue->front = (queue->front + 1) % CHAT_HISTORY_SIZE;
        queue->count--;
    }
    
    queue->rear = (queue->rear + 1) % CHAT_HISTORY_SIZE;
    strcpy(queue->messages[queue->rear].username, username);
    strcpy(queue->messages[queue->rear].text, text);
    queue->messages[queue->rear].timestamp = time(NULL);
    queue->count++;
}

void print_chat_messages(ChatQueue *queue) {
    printf("[");
    int count = queue->count;
    int index = queue->front;
    
    for (int i = 0; i < count; i++) {
        if (i > 0) printf(",");
        
        char timeStr[64];
        get_timestamp_str(queue->messages[index].timestamp, timeStr, sizeof(timeStr));
        
        printf("{\"username\":\"%s\",\"text\":\"%s\",\"time\":\"%s\"}",
               queue->messages[index].username,
               queue->messages[index].text,
               timeStr);
               
        index = (index + 1) % CHAT_HISTORY_SIZE;
    }
    printf("]\n");
}

void save_chat(ChatQueue *queue, const char *filename) {
    FILE *file = fopen(filename, "w");
    if (!file) return;
    
    int count = queue->count;
    int index = queue->front;
    for (int i = 0; i < count; i++) {
        fprintf(file, "%s|%ld|%s\n", 
                queue->messages[index].username,
                queue->messages[index].timestamp,
                queue->messages[index].text);
        index = (index + 1) % CHAT_HISTORY_SIZE;
    }
    fclose(file);
}

void load_chat(ChatQueue *queue, const char *filename) {
    FILE *file = fopen(filename, "r");
    if (!file) return;
    
    char line[512];
    init_chat(queue);
    
    while (fgets(line, sizeof(line), file)) {
        line[strcspn(line, "\n")] = 0;
        char *user = strtok(line, "|");
        char *ts = strtok(NULL, "|");
        char *text = strtok(NULL, "|");
        
        if (user && ts && text) {
            // We use generic add but force timestamp? 
            // Since circular queue fills from rear, loading sequentially from file (oldest to newest) works perfectly.
            add_chat_message(queue, user, text);
            // Overwrite timestamp
            queue->messages[queue->rear].timestamp = atol(ts);
        }
    }
    fclose(file);
}
