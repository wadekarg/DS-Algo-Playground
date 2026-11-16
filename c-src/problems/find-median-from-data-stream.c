//@spec {"fn": "medianFinder", "params": [{"name": "ops", "type": "ops"}], "ret": "double[]"}
//@driver
void dsa_driver(DsaOp* ops, int opsSize) {
    MedianFinder* mf = medianFinderCreate();
    dsa_lb();
    for (int i = 0; i < opsSize; i++) {
        if (!strcmp(ops[i].name, "addNum")) medianFinderAddNum(mf, (int)ops[i].a[0].i);
        else if (!strcmp(ops[i].name, "findMedian")) dsa_out_double(medianFinderFindMedian(mf));
    }
    dsa_le();
    medianFinderFree(mf);
}
//@starter
// Use two heaps: a max-heap for the lower half and a min-heap for the upper half.
typedef struct {
    // Your fields here
    int size;
} MedianFinder;

MedianFinder* medianFinderCreate(void) {
    return calloc(1, sizeof(MedianFinder));
}

void medianFinderAddNum(MedianFinder* obj, int num) {
    // Balance the two heaps so their sizes differ by at most 1.
}

double medianFinderFindMedian(MedianFinder* obj) {
    // Median is one root (odd total) or the average of both roots (even).
    return 0.0;
}

void medianFinderFree(MedianFinder* obj) {
    free(obj);
}
//@approach Two Heaps (Max + Min)
// One heap type with a sign: lower stores negated values so both are min-heaps.
typedef struct { int* a; int size, cap; } Heap;
typedef struct {
    Heap lower;   // max-heap (negated) for the lower half
    Heap upper;   // min-heap for the upper half
} MedianFinder;

static void heap_push(Heap* h, int v) {
    if (h->size == h->cap) h->a = realloc(h->a, (h->cap = h->cap ? 2 * h->cap : 16) * sizeof(int));
    int i = h->size++;
    h->a[i] = v;
    while (i > 0 && h->a[(i - 1) / 2] > h->a[i]) {
        int p = (i - 1) / 2, t = h->a[i];
        h->a[i] = h->a[p]; h->a[p] = t;
        i = p;
    }
}
static int heap_pop(Heap* h) {
    int top = h->a[0];
    h->a[0] = h->a[--h->size];
    for (int i = 0;;) {
        int s = i, l = 2 * i + 1, r = l + 1;
        if (l < h->size && h->a[l] < h->a[s]) s = l;
        if (r < h->size && h->a[r] < h->a[s]) s = r;
        if (s == i) break;
        int t = h->a[i]; h->a[i] = h->a[s]; h->a[s] = t;
        i = s;
    }
    return top;
}

MedianFinder* medianFinderCreate(void) {
    return calloc(1, sizeof(MedianFinder));
}

void medianFinderAddNum(MedianFinder* obj, int num) {
    // Push into lower or upper based on value
    if (obj->lower.size == 0 || num <= -obj->lower.a[0]) heap_push(&obj->lower, -num);
    else heap_push(&obj->upper, num);
    // Rebalance: sizes must differ by at most 1
    if (obj->lower.size > obj->upper.size + 1) heap_push(&obj->upper, -heap_pop(&obj->lower));
    else if (obj->upper.size > obj->lower.size) heap_push(&obj->lower, -heap_pop(&obj->upper));
}

double medianFinderFindMedian(MedianFinder* obj) {
    if (obj->lower.size > obj->upper.size) return -obj->lower.a[0];
    return (-(double)obj->lower.a[0] + obj->upper.a[0]) / 2.0;
}

void medianFinderFree(MedianFinder* obj) {
    free(obj->lower.a);
    free(obj->upper.a);
    free(obj);
}
