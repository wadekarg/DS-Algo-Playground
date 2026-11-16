//@spec {"fn": "copyRandomList", "params": [{"name": "nodes", "type": "int[][]"}], "ret": "void"}
//@prelude
struct Node {
    int val;
    struct Node* next;
    struct Node* random;
};
//@driver
// nodes[i] = [val, random_index or null]. Build the list, deep-copy it, then
// print the copy as [[val, random_index], ...]; also check no node is shared.
void dsa_driver(int** nodes, int nodesSize, int* nodesColSize) {
    struct Node* orig = calloc(nodesSize + 1, sizeof(struct Node));
    for (int i = 0; i < nodesSize; i++) {
        orig[i].val = nodes[i][0];
        orig[i].next = i + 1 < nodesSize ? &orig[i + 1] : NULL;
        orig[i].random = nodes[i][1] == DSA_NULL ? NULL : &orig[nodes[i][1]];
    }
    struct Node* copy = copyRandomList(nodesSize ? &orig[0] : NULL);
    struct Node* seen[1024]; int n = 0;
    for (struct Node* p = copy; p && n < 1024; p = p->next) {
        if (p >= orig && p < orig + nodesSize) { dsa_w("<copy reuses an original node>"); return; }
        seen[n++] = p;
    }
    dsa_lb();
    for (int i = 0; i < n; i++) {
        dsa_lb();
        dsa_out_int(seen[i]->val);
        int r = -1;
        for (int j = 0; j < n && seen[i]->random; j++) if (seen[j] == seen[i]->random) r = j;
        if (r >= 0) dsa_out_int(r); else dsa_out_none();
        dsa_le();
    }
    dsa_le();
}
//@starter
/**
 * Definition for a Node (provided by the test harness):
 * struct Node {
 *     int val;
 *     struct Node *next;
 *     struct Node *random;
 * };
 * Return a deep copy of the list (all new nodes).
 */
struct Node* copyRandomList(struct Node* head) {
    // Map old node -> new node. First pass: create the copies.
    // Second pass: wire next and random through the map.
    return NULL;
}
//@approach Two-Pass with Hash Map
// Hash map from original node address -> its copy (open addressing).
static struct Node **keys_, **vals_;
static int cap_;
static unsigned slot(struct Node* p) {
    unsigned h = (unsigned)((uintptr_t)p >> 4) & (cap_ - 1);
    while (keys_[h] && keys_[h] != p) h = (h + 1) & (cap_ - 1);
    return h;
}
static struct Node* copy_of(struct Node* p) { return p ? vals_[slot(p)] : NULL; }

struct Node* copyRandomList(struct Node* head) {
    int n = 0;
    for (struct Node* p = head; p; p = p->next) n++;
    if (n == 0) return NULL;
    cap_ = 1;
    while (cap_ < 2 * n) cap_ <<= 1;
    keys_ = calloc(cap_, sizeof(struct Node*));
    vals_ = malloc(cap_ * sizeof(struct Node*));
    // Pass 1: create clones, store in map
    for (struct Node* p = head; p; p = p->next) {
        unsigned h = slot(p);
        keys_[h] = p;
        vals_[h] = calloc(1, sizeof(struct Node));
        vals_[h]->val = p->val;
    }
    // Pass 2: wire next and random
    for (struct Node* p = head; p; p = p->next) {
        struct Node* c = copy_of(p);
        c->next = copy_of(p->next);
        c->random = copy_of(p->random);
    }
    struct Node* copy_head = copy_of(head);
    free(keys_); free(vals_);
    return copy_head;
}
