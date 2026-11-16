//@spec {"fn": "lruCache", "params": [{"name": "capacity", "type": "int"}, {"name": "ops", "type": "ops"}], "ret": "void"}
//@driver
void dsa_driver(int capacity, DsaOp* ops, int opsSize) {
    LRUCache* cache = lRUCacheCreate(capacity);
    dsa_lb();
    for (int i = 0; i < opsSize; i++) {
        if (!strcmp(ops[i].name, "put")) lRUCachePut(cache, (int)ops[i].a[0].i, (int)ops[i].a[1].i);
        else dsa_out_int(lRUCacheGet(cache, (int)ops[i].a[0].i));
    }
    dsa_le();
    lRUCacheFree(cache);
}
//@starter
// Use a hash map (key -> node) + a doubly linked list
// (head = most recently used, tail = least recently used).
typedef struct {
    // Your fields here
    int capacity;
} LRUCache;

LRUCache* lRUCacheCreate(int capacity) {
    LRUCache* obj = calloc(1, sizeof(LRUCache));
    obj->capacity = capacity;
    return obj;
}

int lRUCacheGet(LRUCache* obj, int key) {
    // If it exists, move it to the head and return its value. Else -1.
    return -1;
}

void lRUCachePut(LRUCache* obj, int key, int value) {
    // If it exists, update + move to head. Else insert; evict the tail if over capacity.
}

void lRUCacheFree(LRUCache* obj) {
    free(obj);
}
//@approach Hash Map + Doubly Linked List
typedef struct Node {
    int key, val;
    struct Node *prev, *next;      // doubly linked list (recency order)
    struct Node* chain;            // next node in the same hash bucket
} Node;

typedef struct {
    int cap, size, nbuckets;
    Node** buckets;                // hash map: key -> node (separate chaining)
    Node head, tail;               // sentinels: head.next = most recent
} LRUCache;

static Node** bucket(LRUCache* c, int key) {
    return &c->buckets[(unsigned)key % c->nbuckets];
}
static Node* find(LRUCache* c, int key) {
    for (Node* n = *bucket(c, key); n; n = n->chain)
        if (n->key == key) return n;
    return NULL;
}
static void unlink_node(Node* n) { n->prev->next = n->next; n->next->prev = n->prev; }
static void add_to_head(LRUCache* c, Node* n) {
    n->next = c->head.next; n->prev = &c->head;
    c->head.next->prev = n; c->head.next = n;
}

LRUCache* lRUCacheCreate(int capacity) {
    LRUCache* c = calloc(1, sizeof(LRUCache));
    c->cap = capacity;
    c->nbuckets = 2 * capacity + 1;
    c->buckets = calloc(c->nbuckets, sizeof(Node*));
    c->head.next = &c->tail;
    c->tail.prev = &c->head;
    return c;
}

int lRUCacheGet(LRUCache* obj, int key) {
    Node* n = find(obj, key);
    if (!n) return -1;
    unlink_node(n);
    add_to_head(obj, n);
    return n->val;
}

void lRUCachePut(LRUCache* obj, int key, int value) {
    Node* n = find(obj, key);
    if (n) {
        n->val = value;
        unlink_node(n);
        add_to_head(obj, n);
        return;
    }
    n = calloc(1, sizeof(Node));
    n->key = key; n->val = value;
    Node** b = bucket(obj, key);
    n->chain = *b; *b = n;
    add_to_head(obj, n);
    if (++obj->size > obj->cap) {           // evict the least recently used
        Node* lru = obj->tail.prev;
        unlink_node(lru);
        Node** p = bucket(obj, lru->key);
        while (*p != lru) p = &(*p)->chain;
        *p = lru->chain;
        free(lru);
        obj->size--;
    }
}

void lRUCacheFree(LRUCache* obj) {
    for (Node* n = obj->head.next; n != &obj->tail;) { Node* next = n->next; free(n); n = next; }
    free(obj->buckets);
    free(obj);
}
