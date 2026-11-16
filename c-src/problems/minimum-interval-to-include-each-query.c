//@spec {"fn": "minInterval", "params": [{"name": "intervals", "type": "int[][]"}, {"name": "queries", "type": "int[]"}], "ret": "int[]"}
//@approach Offline Sort + Min-Heap
typedef struct { int len, end; } Item;
static int by_start(const void* a, const void* b) {
    int x = (*(int* const*)a)[0], y = (*(int* const*)b)[0];
    return (x > y) - (x < y);
}
static int* qv_;
static int by_query(const void* a, const void* b) {
    int x = qv_[*(const int*)a], y = qv_[*(const int*)b];
    return (x > y) - (x < y);
}
static bool less(Item a, Item b) { return a.len != b.len ? a.len < b.len : a.end < b.end; }
static void push(Item* h, int* n, Item v) {
    int i = (*n)++;
    h[i] = v;
    while (i > 0 && less(h[i], h[(i - 1) / 2])) { Item t = h[i]; h[i] = h[(i - 1) / 2]; h[(i - 1) / 2] = t; i = (i - 1) / 2; }
}
static void pop(Item* h, int* n) {
    h[0] = h[--(*n)];
    for (int i = 0;;) {
        int s = i, l = 2 * i + 1, r = l + 1;
        if (l < *n && less(h[l], h[s])) s = l;
        if (r < *n && less(h[r], h[s])) s = r;
        if (s == i) break;
        Item t = h[i]; h[i] = h[s]; h[s] = t;
        i = s;
    }
}
int* minInterval(int** intervals, int intervalsSize, int* intervalsColSize, int* queries, int queriesSize, int* returnSize) {
    qsort(intervals, intervalsSize, sizeof(int*), by_start);
    int* order = malloc(queriesSize * sizeof(int));      // query indices sorted by value
    for (int i = 0; i < queriesSize; i++) order[i] = i;
    qv_ = queries;
    qsort(order, queriesSize, sizeof(int), by_query);
    int* result = malloc(queriesSize * sizeof(int));
    Item* heap = malloc((intervalsSize + 1) * sizeof(Item));   // (length, end)
    int n = 0, j = 0;
    for (int k = 0; k < queriesSize; k++) {
        int q = queries[order[k]];
        while (j < intervalsSize && intervals[j][0] <= q) {     // intervals that started
            push(heap, &n, (Item){intervals[j][1] - intervals[j][0] + 1, intervals[j][1]});
            j++;
        }
        while (n && heap[0].end < q) pop(heap, &n);            // drop ones that ended
        result[order[k]] = n ? heap[0].len : -1;
    }
    free(order); free(heap);
    *returnSize = queriesSize;
    return result;
}
