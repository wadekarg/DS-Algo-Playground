//@spec {"fn": "hasCycle", "params": [{"name": "values", "type": "int[]"}, {"name": "pos", "type": "int"}], "ret": "bool", "structs": ["ListNode"]}
//@driver
// Build the list from values; if pos >= 0 the tail links back to nodes[pos].
void dsa_driver(int* values, int valuesSize, int pos) {
    struct ListNode* nodes = calloc(valuesSize + 1, sizeof(struct ListNode));
    for (int i = 0; i < valuesSize; i++) {
        nodes[i].val = values[i];
        nodes[i].next = i + 1 < valuesSize ? &nodes[i + 1] : NULL;
    }
    if (pos >= 0 && pos < valuesSize) nodes[valuesSize - 1].next = &nodes[pos];
    dsa_out_bool(hasCycle(valuesSize ? &nodes[0] : NULL));
}
//@starter
/**
 * Definition for singly-linked list (provided by the test harness):
 * struct ListNode {
 *     int val;
 *     struct ListNode *next;
 * };
 * The harness builds the list from the test's values, linking the tail back
 * to index pos when pos >= 0.
 */
bool hasCycle(struct ListNode* head) {
    // Your code: use Floyd's tortoise-and-hare. Return true if they meet.
    return false;
}
//@approach Hash Set (warm-up)
// A set of visited node addresses (open addressing on pointer values).
bool hasCycle(struct ListNode* head) {
    int cap = 1024, size = 0;
    struct ListNode** seen = calloc(cap, sizeof(struct ListNode*));
    bool found = false;
    for (; head && !found; head = head->next) {
        if (2 * (size + 1) > cap) {                  // grow + rehash
            struct ListNode** old = seen;
            int old_cap = cap;
            cap *= 2;
            seen = calloc(cap, sizeof(struct ListNode*));
            for (int i = 0; i < old_cap; i++) {
                if (!old[i]) continue;
                unsigned h = (unsigned)((uintptr_t)old[i] >> 4) & (cap - 1);
                while (seen[h]) h = (h + 1) & (cap - 1);
                seen[h] = old[i];
            }
            free(old);
        }
        unsigned h = (unsigned)((uintptr_t)head >> 4) & (cap - 1);
        while (seen[h] && seen[h] != head) h = (h + 1) & (cap - 1);
        if (seen[h]) found = true;                   // visited before: cycle
        else { seen[h] = head; size++; }
    }
    free(seen);
    return found;
}
//@approach Floyd's Tortoise and Hare
bool hasCycle(struct ListNode* head) {
    struct ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) return true;
    }
    return false;
}
