//@code
#include <stdio.h>
#include <stdlib.h>

/* Max-heap stored in an array: children of i are 2i+1 and 2i+2. */
typedef struct {
    int* heap;
    int size;
    int capacity;
} MaxHeap;

int parent(int i) { return (i - 1) / 2; }
int left(int i)   { return 2 * i + 1; }
int right(int i)  { return 2 * i + 2; }

void swap(int* a, int* b) { int t = *a; *a = *b; *b = t; }

void heap_init(MaxHeap* h, int capacity) {
    h->heap = malloc(capacity * sizeof(int));
    h->size = 0;
    h->capacity = capacity;
}

/* Insert a value and bubble up to restore heap property. */
void insert(MaxHeap* h, int value) {
    if (h->size == h->capacity) {
        h->capacity *= 2;
        h->heap = realloc(h->heap, h->capacity * sizeof(int));
    }
    int idx = h->size++;
    h->heap[idx] = value;
    // Bubble up
    while (idx > 0 && h->heap[idx] > h->heap[parent(idx)]) {
        swap(&h->heap[idx], &h->heap[parent(idx)]);
        idx = parent(idx);
    }
}

/* Sink a node down to its correct position. */
void sink_down(MaxHeap* h, int idx) {
    int n = h->size;
    while (1) {
        int largest = idx;
        int l = left(idx), r = right(idx);
        if (l < n && h->heap[l] > h->heap[largest]) largest = l;
        if (r < n && h->heap[r] > h->heap[largest]) largest = r;
        if (largest == idx) break;
        swap(&h->heap[idx], &h->heap[largest]);
        idx = largest;
    }
}

/* Remove and return the maximum element (root). */
int extract_max(MaxHeap* h) {
    if (h->size == 0) {
        fprintf(stderr, "extract_max from empty heap\n");
        exit(1);
    }
    int max_val = h->heap[0];
    h->heap[0] = h->heap[--h->size];
    if (h->size > 0) sink_down(h, 0);
    return max_val;
}

/* Return the maximum element without removing it. */
int peek(const MaxHeap* h) {
    if (h->size == 0) {
        fprintf(stderr, "peek from empty heap\n");
        exit(1);
    }
    return h->heap[0];
}

int main(void) {
    // Example usage
    MaxHeap h;
    heap_init(&h, 4);
    int values[] = {40, 70, 30, 90, 50, 80, 60};
    for (int i = 0; i < 7; i++) insert(&h, values[i]);

    printf("Max: %d\n", peek(&h));              // Output: Max: 90
    printf("Extracted: %d\n", extract_max(&h)); // Output: Extracted: 90
    printf("New max: %d\n", peek(&h));          // Output: New max: 80
    free(h.heap);
    return 0;
}
//@trace
void insert(int heap[], int* n, int val) {
    heap[(*n)++] = val;
    int i = *n - 1;
    while (i > 0) {
        int p = (i - 1) / 2;
        if (heap[i] > heap[p]) {
            int t = heap[i]; heap[i] = heap[p]; heap[p] = t;
            i = p;
        } else break;
    }
}
int extract_max(int heap[], int* n) {
    int max_val = heap[0];
    heap[0] = heap[--(*n)];
    heapify_down(heap, *n, 0);
    return max_val;
}
void heapify_down(int heap[], int n, int i) {
    while (1) {
        int largest = i;
        int l = 2 * i + 1, r = 2 * i + 2;
        if (l < n && heap[l] > heap[largest]) largest = l;
        if (r < n && heap[r] > heap[largest]) largest = r;
        if (largest == i) break;
        int t = heap[i]; heap[i] = heap[largest]; heap[largest] = t;
        i = largest;
    }
}
void build_heap(int arr[], int n) {
    for (int i = n / 2 - 1; i >= 0; i--)
        heapify_down(arr, n, i);
}
//@trace-prelude
void heapify_down(int heap[], int n, int i);
//@trace-map 1:1 2:2 3:3 4:4 5:5 6:6 7:7 8:8 9:9 10:12 11:13 12:14 13:15 14:16 15:18 16:18 17:19 18:20 19:21 20:22 21:23 22:24 23:25 24:26 25:29 26:30 27:31
//@practice kth_largest
//@spec {"fn": "kth_largest", "params": [{"name": "nums", "type": "int[]"}, {"name": "k", "type": "int"}], "ret": "int"}
//@starter
/* Return the kth largest element in nums.
 * Hint: a min-heap of size k keeps the k largest seen so far. */
int kth_largest(int* nums, int numsSize, int k) {
    // Your code here
    return 0;
}
//@solution
static void sift_down(int* h, int n, int i) {
    while (1) {
        int s = i, l = 2 * i + 1, r = 2 * i + 2;
        if (l < n && h[l] < h[s]) s = l;
        if (r < n && h[r] < h[s]) s = r;
        if (s == i) return;
        int t = h[i]; h[i] = h[s]; h[s] = t;
        i = s;
    }
}
int kth_largest(int* nums, int numsSize, int k) {
    int* heap = malloc(k * sizeof(int));     // min-heap of the k largest
    for (int i = 0; i < k; i++) heap[i] = nums[i];
    for (int i = k / 2 - 1; i >= 0; i--) sift_down(heap, k, i);
    for (int i = k; i < numsSize; i++) {
        if (nums[i] > heap[0]) {
            heap[0] = nums[i];
            sift_down(heap, k, 0);
        }
    }
    int ans = heap[0];
    free(heap);
    return ans;
}
//@practice merge_k_sorted
//@spec {"fn": "merge_k_sorted", "params": [{"name": "lists", "type": "int[][]"}], "ret": "int[]"}
//@starter
/* Merge k sorted lists into one sorted array (malloc'd; set *returnSize).
 * listsColSize[i] is the length of lists[i]. */
int* merge_k_sorted(int** lists, int listsSize, int* listsColSize, int* returnSize) {
    // Your code here
    *returnSize = 0;
    return NULL;
}
//@solution
// Min-heap of (value, list index); pop the smallest, push that list's next.
typedef struct { int val, list; } Item;
static void push_item(Item* h, int* n, Item x) {
    int i = (*n)++;
    h[i] = x;
    while (i > 0 && h[(i - 1) / 2].val > h[i].val) {
        Item t = h[i]; h[i] = h[(i - 1) / 2]; h[(i - 1) / 2] = t;
        i = (i - 1) / 2;
    }
}
static Item pop_item(Item* h, int* n) {
    Item top = h[0];
    h[0] = h[--(*n)];
    int i = 0;
    while (1) {
        int s = i, l = 2 * i + 1, r = 2 * i + 2;
        if (l < *n && h[l].val < h[s].val) s = l;
        if (r < *n && h[r].val < h[s].val) s = r;
        if (s == i) break;
        Item t = h[i]; h[i] = h[s]; h[s] = t;
        i = s;
    }
    return top;
}
int* merge_k_sorted(int** lists, int listsSize, int* listsColSize, int* returnSize) {
    int total = 0;
    for (int i = 0; i < listsSize; i++) total += listsColSize[i];
    int* res = malloc(sizeof(int) * (size_t)(total + 1));
    int* pos = calloc((size_t)listsSize + 1, sizeof(int));
    Item* heap = malloc(sizeof(Item) * ((size_t)listsSize + 1));
    int n = 0, k = 0;
    for (int i = 0; i < listsSize; i++)
        if (listsColSize[i] > 0) push_item(heap, &n, (Item){lists[i][0], i});
    while (n > 0) {
        Item it = pop_item(heap, &n);
        res[k++] = it.val;
        if (++pos[it.list] < listsColSize[it.list])
            push_item(heap, &n, (Item){lists[it.list][pos[it.list]], it.list});
    }
    free(pos); free(heap);
    *returnSize = k;
    return res;
}
