//@spec {"fn": "kClosest", "params": [{"name": "points", "type": "int[][]"}, {"name": "k", "type": "int"}], "ret": "int[][]"}
//@starter
/**
 * Return the k closest points to the origin (malloc'd; set *returnSize and
 * *returnColumnSizes, each 2). For the tests, order them by distance
 * (closest first), ties in input order.
 */
int** kClosest(int** points, int pointsSize, int* pointsColSize, int k, int* returnSize, int** returnColumnSizes) {
    // Hint: max-heap of size k (or sort everything by distance).
    *returnSize = 0;
    *returnColumnSizes = NULL;
    return NULL;
}
//@approach Sort by Distance (deterministic order)
typedef struct { long long d2; int idx; } Item;
static int cmp_item(const void* a, const void* b) {
    const Item *x = a, *y = b;
    if (x->d2 != y->d2) return x->d2 < y->d2 ? -1 : 1;
    return x->idx - y->idx;                  // stable: ties keep input order
}
int** kClosest(int** points, int pointsSize, int* pointsColSize, int k, int* returnSize, int** returnColumnSizes) {
    Item* items = malloc(pointsSize * sizeof(Item));
    for (int i = 0; i < pointsSize; i++) {
        long long x = points[i][0], y = points[i][1];
        items[i] = (Item){x * x + y * y, i};
    }
    qsort(items, pointsSize, sizeof(Item), cmp_item);
    int** res = malloc(k * sizeof(int*));
    *returnColumnSizes = malloc(k * sizeof(int));
    for (int i = 0; i < k; i++) {
        res[i] = malloc(2 * sizeof(int));
        res[i][0] = points[items[i].idx][0];
        res[i][1] = points[items[i].idx][1];
        (*returnColumnSizes)[i] = 2;
    }
    free(items);
    *returnSize = k;
    return res;
}
//@approach Max-Heap of Size K (optimal when k << n)
typedef struct { long long d2; int idx; } Item;
static bool farther(Item a, Item b) {        // heap order: farthest (then latest) on top
    return a.d2 != b.d2 ? a.d2 > b.d2 : a.idx > b.idx;
}
static void sift_down(Item* h, int n, int i) {
    for (;;) {
        int b = i, l = 2 * i + 1, r = l + 1;
        if (l < n && farther(h[l], h[b])) b = l;
        if (r < n && farther(h[r], h[b])) b = r;
        if (b == i) return;
        Item t = h[i]; h[i] = h[b]; h[b] = t;
        i = b;
    }
}
static void sift_up(Item* h, int i) {
    while (i > 0 && farther(h[i], h[(i - 1) / 2])) {
        Item t = h[i]; h[i] = h[(i - 1) / 2]; h[(i - 1) / 2] = t;
        i = (i - 1) / 2;
    }
}
int** kClosest(int** points, int pointsSize, int* pointsColSize, int k, int* returnSize, int** returnColumnSizes) {
    Item* heap = malloc((k + 1) * sizeof(Item));
    int n = 0;
    for (int i = 0; i < pointsSize; i++) {
        long long x = points[i][0], y = points[i][1];
        heap[n] = (Item){x * x + y * y, i};
        sift_up(heap, n++);
        if (n > k) {                          // evict the farthest
            heap[0] = heap[--n];
            sift_down(heap, n, 0);
        }
    }
    // Pop farthest-first into the back => output sorted closest-first
    int** res = malloc(k * sizeof(int*));
    *returnColumnSizes = malloc(k * sizeof(int));
    for (int i = n - 1; i >= 0; i--) {
        int idx = heap[0].idx;
        heap[0] = heap[--n];
        sift_down(heap, n, 0);
        res[i] = malloc(2 * sizeof(int));
        res[i][0] = points[idx][0];
        res[i][1] = points[idx][1];
        (*returnColumnSizes)[i] = 2;
    }
    free(heap);
    *returnSize = k;
    return res;
}
