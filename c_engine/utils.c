#include "data_structures.h"

// DJB2 Hash Function
unsigned int hash(const char *str) {
    unsigned long hash = 5381;
    int c;
    while ((c = *str++))
        hash = ((hash << 5) + hash) + c; /* hash * 33 + c */
    return hash % TABLE_SIZE;
}

// Simple integer hash
unsigned int hashInt(int key) {
    return key % TABLE_SIZE;
}

void get_timestamp_str(long timestamp, char *buffer, size_t size) {
    struct tm *tm_info;
    time_t timer = (time_t)timestamp;
    tm_info = localtime(&timer);
    strftime(buffer, size, "%Y-%m-%d %H:%M:%S", tm_info);
}
