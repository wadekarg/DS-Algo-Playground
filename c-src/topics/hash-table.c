//@code
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

/* Hash table with separate chaining: each bucket is a linked list. */
typedef struct Entry {
    int key;
    struct Entry* next;
} Entry;

typedef struct {
    int size;
    Entry** buckets;
} HashTable;

HashTable* ht_create(int size) {
    HashTable* ht = malloc(sizeof(HashTable));
    ht->size = size;
    ht->buckets = calloc(size, sizeof(Entry*));
    return ht;
}

/* Compute bucket index from key. */
int ht_hash(const HashTable* ht, int key) {
    return ((key % ht->size) + ht->size) % ht->size;  // safe for negatives
}

/* Insert a key into the hash table. O(1) avg */
void ht_insert(HashTable* ht, int key) {
    int index = ht_hash(ht, key);
    Entry** slot = &ht->buckets[index];
    // Avoid duplicates; walk to the end of the chain
    while (*slot) {
        if ((*slot)->key == key) return;  // Already exists
        slot = &(*slot)->next;
    }
    Entry* e = malloc(sizeof(Entry));
    e->key = key;
    e->next = NULL;
    *slot = e;  // append, so chains keep insertion order
}

/* Search for a key. Returns true/false. O(1) avg */
bool ht_search(const HashTable* ht, int key) {
    for (Entry* e = ht->buckets[ht_hash(ht, key)]; e; e = e->next)
        if (e->key == key) return true;
    return false;
}

/* Delete a key from the hash table. O(1) avg */
bool ht_delete(HashTable* ht, int key) {
    Entry** slot = &ht->buckets[ht_hash(ht, key)];
    while (*slot) {
        if ((*slot)->key == key) {
            Entry* doomed = *slot;
            *slot = doomed->next;
            free(doomed);
            return true;
        }
        slot = &(*slot)->next;
    }
    return false;
}

/* Print the hash table. */
void ht_display(const HashTable* ht) {
    for (int i = 0; i < ht->size; i++) {
        printf("Bucket %d: ", i);
        Entry* e = ht->buckets[i];
        if (!e) printf("empty");
        for (; e; e = e->next) printf(e->next ? "%d -> " : "%d", e->key);
        printf("\n");
    }
}

int main(void) {
    // Example usage
    HashTable* ht = ht_create(8);
    int values[] = {15, 42, 8, 23, 7, 31, 50, 19};
    for (int i = 0; i < 8; i++) ht_insert(ht, values[i]);

    ht_display(ht);
    printf("%s\n", ht_search(ht, 23) ? "true" : "false");   // true
    printf("%s\n", ht_search(ht, 99) ? "true" : "false");   // false
    ht_delete(ht, 42);
    ht_display(ht);
    return 0;
}
//@output-map True=true,False=false
//@trace
#define SIZE 8
Entry* buckets[SIZE];             // each bucket is a chain

void insert(int key) {
    int idx = key % SIZE;             // hash function
    Entry** slot = &buckets[idx];
    while (*slot && (*slot)->key != key) slot = &(*slot)->next;
    if (!*slot) *slot = new_entry(key);   // chain on collision
}

bool search(int key) {
    int idx = key % SIZE;
    for (Entry* e = buckets[idx]; e; e = e->next)   // walk the chain
        if (e->key == key)
            return true;
    return false;
}

bool delete(int key) {
    int idx = key % SIZE;
    Entry** slot = &buckets[idx];
    while (*slot && (*slot)->key != key) slot = &(*slot)->next;
    if (!*slot) return false;
    Entry* gone = *slot; *slot = gone->next; free(gone);
    return true;
}
//@trace-prelude
typedef struct Entry { int key; struct Entry* next; } Entry;
Entry* new_entry(int key);
//@trace-python
size = 8
buckets = [[] for _ in range(size)]

def insert(key):
    idx = key % size              # hash function
    bucket = buckets[idx]
    if key not in bucket:         # chain on collision
        bucket.append(key)

def search(key):
    idx = key % size
    for item in buckets[idx]:     # walk the chain
        if item == key:
            return True
    return False

def delete(key):
    idx = key % size
    bucket = buckets[idx]
    if key in bucket:
        bucket.remove(key)
        return True
    return False
//@trace-map 1:1 2:2 4:4 5:5 6:6 7:7 8:8 10:11 11:12 12:13 13:14 14:15 15:16 17:19 18:20 19:21 20:22-23 21:24 22:25 23:23
