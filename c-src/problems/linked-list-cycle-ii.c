//@spec {"fn": "detectCycle", "params": [{"name": "values", "type": "int[]"}, {"name": "pos", "type": "int"}], "ret": "list", "structs": ["ListNode"]}
//@driver
void dsa_driver(int* values, int valuesSize, int pos) {
    struct ListNode* nodes = calloc(valuesSize + 1, sizeof(struct ListNode));
    for (int i = 0; i < valuesSize; i++) {
        nodes[i].val = values[i];
        nodes[i].next = i + 1 < valuesSize ? &nodes[i + 1] : NULL;
    }
    if (pos >= 0 && pos < valuesSize) nodes[valuesSize - 1].next = &nodes[pos];
    struct ListNode* entry = detectCycle(valuesSize ? &nodes[0] : NULL);
    if (entry) dsa_out_int(entry->val); else dsa_out_none();   // the entry node's value
}
//@starter
/**
 * Definition for singly-linked list (provided by the test harness):
 * struct ListNode {
 *     int val;
 *     struct ListNode *next;
 * };
 * Return the node where the cycle begins, or NULL if there is no cycle.
 * (The tests check that node's value.)
 */
struct ListNode* detectCycle(struct ListNode* head) {
    // Phase 1: find the meeting point with fast/slow.
    // Phase 2: reset one pointer to head, walk both one step; they meet at the entry.
    return NULL;
}
//@approach Two-Phase Floyd's
struct ListNode* detectCycle(struct ListNode* head) {
    // Phase 1: find meeting point
    struct ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) break;
    }
    if (!fast || !fast->next) return NULL;   // no cycle
    // Phase 2: walk from head and from meeting point in lockstep
    struct ListNode* ptr = head;
    while (ptr != slow) {
        ptr = ptr->next;
        slow = slow->next;
    }
    return ptr;
}
//@approach Hash Set (warm-up)
// Visited set of node addresses; the first repeat is the cycle entry.
struct ListNode* detectCycle(struct ListNode* head) {
    int cap = 1;
    int n = 0;
    for (struct ListNode* p = head; p && n < 100000; p = p->next) n++;  // bounded walk to size the table
    while (cap < 2 * (n + 1)) cap <<= 1;
    struct ListNode** seen = calloc(cap, sizeof(struct ListNode*));
    struct ListNode* entry = NULL;
    for (struct ListNode* node = head; node; node = node->next) {
        unsigned h = (unsigned)((uintptr_t)node >> 4) & (cap - 1);
        while (seen[h] && seen[h] != node) h = (h + 1) & (cap - 1);
        if (seen[h]) { entry = node; break; }
        seen[h] = node;
    }
    free(seen);
    return entry;
}
