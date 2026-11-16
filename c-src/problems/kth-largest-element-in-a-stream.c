//@spec {"fn": "kthLargest", "params": [{"name": "k", "type": "int"}, {"name": "nums", "type": "int[]"}, {"name": "ops", "type": "int[]"}], "ret": "int[]"}
//@driver
// Create with (k, nums), then add() each value from ops, collecting the returns.
void dsa_driver(int k, int* nums, int numsSize, int* ops, int opsSize) {
    KthLargest* obj = kthLargestCreate(k, nums, numsSize);
    dsa_lb();
    for (int i = 0; i < opsSize; i++) dsa_out_int(kthLargestAdd(obj, ops[i]));
    dsa_le();
    kthLargestFree(obj);
}
//@starter
// Design a class that finds the kth largest element in a stream.
// Hint: keep a min-heap of size k; its root is the kth largest.
typedef struct {
    // Your fields here
    int k;
} KthLargest;

KthLargest* kthLargestCreate(int k, int* nums, int numsSize) {
    KthLargest* obj = calloc(1, sizeof(KthLargest));
    obj->k = k;
    return obj;
}

int kthLargestAdd(KthLargest* obj, int val) {
    // Add val; return the kth largest.
    return 0;
}

void kthLargestFree(KthLargest* obj) {
    free(obj);
}
//@approach Min-Heap of Size K
typedef struct {
    int k, size;
    int* heap;   // min-heap holding the k largest values seen
} KthLargest;

static void push(KthLargest* h, int v) {
    int i = h->size++;
    h->heap[i] = v;
    while (i > 0 && h->heap[(i - 1) / 2] > h->heap[i]) {
        int p = (i - 1) / 2, t = h->heap[i];
        h->heap[i] = h->heap[p]; h->heap[p] = t;
        i = p;
    }
}
static void pop(KthLargest* h) {
    h->heap[0] = h->heap[--h->size];
    for (int i = 0;;) {
        int s = i, l = 2 * i + 1, r = l + 1;
        if (l < h->size && h->heap[l] < h->heap[s]) s = l;
        if (r < h->size && h->heap[r] < h->heap[s]) s = r;
        if (s == i) break;
        int t = h->heap[i]; h->heap[i] = h->heap[s]; h->heap[s] = t;
        i = s;
    }
}

KthLargest* kthLargestCreate(int k, int* nums, int numsSize) {
    KthLargest* obj = malloc(sizeof(KthLargest));
    obj->k = k;
    obj->size = 0;
    obj->heap = malloc((k + 1) * sizeof(int));
    for (int i = 0; i < numsSize; i++) {
        push(obj, nums[i]);
        if (obj->size > k) pop(obj);   // trim down to size k
    }
    return obj;
}

int kthLargestAdd(KthLargest* obj, int val) {
    push(obj, val);
    if (obj->size > obj->k) pop(obj);
    return obj->heap[0];
}

void kthLargestFree(KthLargest* obj) {
    free(obj->heap);
    free(obj);
}
