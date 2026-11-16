//@spec {"fn": "findKthLargest", "params": [{"name": "nums", "type": "int[]"}, {"name": "k", "type": "int"}], "ret": "int"}
//@approach Min-Heap of Size K
static void sift_down(int* h, int n, int i) {
    for (;;) {
        int s = i, l = 2 * i + 1, r = l + 1;
        if (l < n && h[l] < h[s]) s = l;
        if (r < n && h[r] < h[s]) s = r;
        if (s == i) return;
        int t = h[i]; h[i] = h[s]; h[s] = t;
        i = s;
    }
}
int findKthLargest(int* nums, int numsSize, int k) {
    int* heap = malloc(k * sizeof(int));   // min-heap of the top k
    int n = 0;
    for (int i = 0; i < numsSize; i++) {
        if (n < k) {
            int j = n++;
            heap[j] = nums[i];
            while (j > 0 && heap[(j - 1) / 2] > heap[j]) {
                int p = (j - 1) / 2, t = heap[j];
                heap[j] = heap[p]; heap[p] = t;
                j = p;
            }
        } else if (nums[i] > heap[0]) {
            heap[0] = nums[i];             // replace the smallest of the top k
            sift_down(heap, n, 0);
        }
    }
    int ans = heap[0];
    free(heap);
    return ans;
}
//@approach Sort (simple baseline)
static int cmp_int(const void* a, const void* b) {
    int x = *(const int*)a, y = *(const int*)b;
    return (x > y) - (x < y);
}
int findKthLargest(int* nums, int numsSize, int k) {
    qsort(nums, numsSize, sizeof(int), cmp_int);
    return nums[numsSize - k];
}
//@approach Quickselect (O(n) average)
static void swap(int* a, int* b) { int t = *a; *a = *b; *b = t; }
int findKthLargest(int* nums, int numsSize, int k) {
    // The kth largest is the (n - k)th smallest (0-indexed)
    int target = numsSize - k, lo = 0, hi = numsSize - 1;
    for (;;) {
        int pivot = nums[lo + rand() % (hi - lo + 1)];
        // 3-way partition: [lo, left) < pivot, [left, mid) == pivot, (right, hi] > pivot
        int left = lo, mid = lo, right = hi;
        while (mid <= right) {
            if (nums[mid] < pivot) swap(&nums[left++], &nums[mid++]);
            else if (nums[mid] > pivot) swap(&nums[mid], &nums[right--]);
            else mid++;
        }
        if (target < left) hi = left - 1;
        else if (target > right) lo = right + 1;
        else return nums[target];
    }
}
