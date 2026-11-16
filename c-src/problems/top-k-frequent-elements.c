//@spec {"fn": "topKFrequent", "params": [{"name": "nums", "type": "int[]"}, {"name": "k", "type": "int"}], "ret": "int[]"}
//@starter
/**
 * Return the k most frequent elements (malloc'd; set *returnSize).
 * For the tests, order them by frequency (highest first), breaking ties
 * by first appearance in nums.
 */
int* topKFrequent(int* nums, int numsSize, int k, int* returnSize) {
    // Your code here
    *returnSize = 0;
    return NULL;
}
//@approach Count and Sort All
// Count with a hash map that remembers first-appearance order.
typedef struct { int num, freq, first; } Entry;
static int cmp_entry(const void* a, const void* b) {
    const Entry *x = a, *y = b;
    if (x->freq != y->freq) return y->freq - x->freq;   // higher frequency first
    return x->first - y->first;                          // then first appearance
}
static Entry* count_all(int* nums, int n, int* distinct) {
    int cap = 1;
    while (cap < 2 * n) cap <<= 1;
    int* slot_entry = malloc(cap * sizeof(int));
    for (int i = 0; i < cap; i++) slot_entry[i] = -1;
    Entry* e = malloc((n + 1) * sizeof(Entry));
    int d = 0;
    for (int i = 0; i < n; i++) {
        unsigned h = ((unsigned)nums[i] * 2654435761u) & (cap - 1);
        while (slot_entry[h] != -1 && e[slot_entry[h]].num != nums[i]) h = (h + 1) & (cap - 1);
        if (slot_entry[h] == -1) { slot_entry[h] = d; e[d++] = (Entry){nums[i], 0, i}; }
        e[slot_entry[h]].freq++;
    }
    free(slot_entry);
    *distinct = d;
    return e;
}
int* topKFrequent(int* nums, int numsSize, int k, int* returnSize) {
    int d;
    Entry* e = count_all(nums, numsSize, &d);
    qsort(e, d, sizeof(Entry), cmp_entry);
    int* res = malloc(k * sizeof(int));
    for (int i = 0; i < k; i++) res[i] = e[i].num;
    free(e);
    *returnSize = k;
    return res;
}
//@approach Min-Heap of Size K
// Heap ordered by (freq, -first): the root is the weakest of the top k.
typedef struct { int num, freq, first; } Entry;
static bool weaker(Entry a, Entry b) {
    return a.freq != b.freq ? a.freq < b.freq : a.first > b.first;
}
static void sift_down(Entry* h, int n, int i) {
    for (;;) {
        int s = i, l = 2 * i + 1, r = l + 1;
        if (l < n && weaker(h[l], h[s])) s = l;
        if (r < n && weaker(h[r], h[s])) s = r;
        if (s == i) return;
        Entry t = h[i]; h[i] = h[s]; h[s] = t;
        i = s;
    }
}
static void sift_up(Entry* h, int i) {
    while (i > 0 && weaker(h[i], h[(i - 1) / 2])) {
        Entry t = h[i]; h[i] = h[(i - 1) / 2]; h[(i - 1) / 2] = t;
        i = (i - 1) / 2;
    }
}
int* topKFrequent(int* nums, int numsSize, int k, int* returnSize) {
    // count (first-appearance order) with an open-addressing map
    int cap = 1;
    while (cap < 2 * numsSize) cap <<= 1;
    int* slot = malloc(cap * sizeof(int));
    for (int i = 0; i < cap; i++) slot[i] = -1;
    Entry* e = malloc(numsSize * sizeof(Entry));
    int d = 0;
    for (int i = 0; i < numsSize; i++) {
        unsigned h = ((unsigned)nums[i] * 2654435761u) & (cap - 1);
        while (slot[h] != -1 && e[slot[h]].num != nums[i]) h = (h + 1) & (cap - 1);
        if (slot[h] == -1) { slot[h] = d; e[d++] = (Entry){nums[i], 0, i}; }
        e[slot[h]].freq++;
    }
    Entry* heap = malloc(k * sizeof(Entry));
    int size = 0;
    for (int i = 0; i < d; i++) {
        if (size < k) { heap[size] = e[i]; sift_up(heap, size++); }
        else if (weaker(heap[0], e[i])) { heap[0] = e[i]; sift_down(heap, size, 0); }
    }
    // pop weakest-first, fill the answer from the back => strongest first
    int* res = malloc(k * sizeof(int));
    for (int i = size - 1; i >= 0; i--) {
        res[i] = heap[0].num;
        heap[0] = heap[--size];
        sift_down(heap, size, 0);
    }
    free(slot); free(e); free(heap);
    *returnSize = k;
    return res;
}
//@approach Bucket Sort (O(n))
int* topKFrequent(int* nums, int numsSize, int k, int* returnSize) {
    int n = numsSize;
    // count frequencies, remembering each distinct value in first-appearance order
    int cap = 1;
    while (cap < 2 * n) cap <<= 1;
    int* key = malloc(cap * sizeof(int));
    int* freq = calloc(cap, sizeof(int));          // 0 = empty slot
    int* order = malloc(n * sizeof(int));          // slots in first-appearance order
    int d = 0;
    for (int i = 0; i < n; i++) {
        unsigned h = ((unsigned)nums[i] * 2654435761u) & (cap - 1);
        while (freq[h] && key[h] != nums[i]) h = (h + 1) & (cap - 1);
        if (!freq[h]) { key[h] = nums[i]; order[d++] = h; }
        freq[h]++;
    }
    // buckets[f] = values with frequency f (as a linked list through next[])
    int* head = malloc((n + 1) * sizeof(int));
    int* next = malloc(d * sizeof(int));
    for (int f = 0; f <= n; f++) head[f] = -1;
    for (int i = d - 1; i >= 0; i--) {            // reverse so lists keep appearance order
        int f = freq[order[i]];
        next[i] = head[f];
        head[f] = i;
    }
    // walk buckets high-to-low, collect top k
    int* res = malloc(k * sizeof(int));
    int m = 0;
    for (int f = n; f > 0 && m < k; f--)
        for (int i = head[f]; i != -1 && m < k; i = next[i])
            res[m++] = key[order[i]];
    free(key); free(freq); free(order); free(head); free(next);
    *returnSize = m;
    return res;
}
