//@spec {"fn": "mergeKLists", "params": [{"name": "lists", "type": "list[]"}], "ret": "list"}
//@approach Min-Heap Multi-Way Merge
// Min-heap of list heads keyed by value (ties by list index, like (val, i, node)).
typedef struct { struct ListNode* node; int idx; } Item;
static bool less(Item a, Item b) { return a.node->val != b.node->val ? a.node->val < b.node->val : a.idx < b.idx; }
static void push(Item* h, int* n, Item x) {
    int i = (*n)++;
    h[i] = x;
    while (i > 0 && less(h[i], h[(i - 1) / 2])) { Item t = h[i]; h[i] = h[(i - 1) / 2]; h[(i - 1) / 2] = t; i = (i - 1) / 2; }
}
static Item pop(Item* h, int* n) {
    Item top = h[0];
    h[0] = h[--(*n)];
    for (int i = 0;;) {
        int s = i, l = 2 * i + 1, r = l + 1;
        if (l < *n && less(h[l], h[s])) s = l;
        if (r < *n && less(h[r], h[s])) s = r;
        if (s == i) break;
        Item t = h[i]; h[i] = h[s]; h[s] = t;
        i = s;
    }
    return top;
}
struct ListNode* mergeKLists(struct ListNode** lists, int listsSize) {
    Item* heap = malloc((listsSize + 1) * sizeof(Item));
    int n = 0;
    for (int i = 0; i < listsSize; i++)
        if (lists[i]) push(heap, &n, (Item){lists[i], i});
    struct ListNode dummy = {0, NULL};
    struct ListNode* tail = &dummy;
    while (n > 0) {
        Item it = pop(heap, &n);
        tail->next = it.node;
        tail = tail->next;
        if (it.node->next) push(heap, &n, (Item){it.node->next, it.idx});
    }
    free(heap);
    return dummy.next;
}
