//@spec {"fn": "maxSlidingWindow", "params": [{"name": "nums", "type": "int[]"}, {"name": "k", "type": "int"}], "ret": "int[]"}
//@approach Monotonic Deque
int* maxSlidingWindow(int* nums, int numsSize, int k, int* returnSize) {
    int* dq = malloc(numsSize * sizeof(int));   // indices; their values are decreasing
    int head = 0, tail = 0, n = 0;
    int* result = malloc((numsSize - k + 1) * sizeof(int));
    for (int i = 0; i < numsSize; i++) {
        while (head < tail && dq[head] < i - k + 1) head++;        // expired from the window
        while (head < tail && nums[dq[tail - 1]] <= nums[i]) tail--; // smaller: never the max
        dq[tail++] = i;
        if (i >= k - 1) result[n++] = nums[dq[head]];
    }
    free(dq);
    *returnSize = n;
    return result;
}
