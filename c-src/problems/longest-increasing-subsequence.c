//@spec {"fn": "lengthOfLIS", "params": [{"name": "nums", "type": "int[]"}], "ret": "int"}
//@approach DP O(n²)
int lengthOfLIS(int* nums, int numsSize) {
    if (numsSize == 0) return 0;
    int* dp = malloc(numsSize * sizeof(int));   // dp[i] = LIS length ending at index i
    int best = 1;
    for (int i = 0; i < numsSize; i++) {
        dp[i] = 1;
        for (int j = 0; j < i; j++)
            if (nums[j] < nums[i] && dp[j] + 1 > dp[i]) dp[i] = dp[j] + 1;
        if (dp[i] > best) best = dp[i];
    }
    free(dp);
    return best;
}
//@approach Patience Sort with Binary Search, O(n log n)
int lengthOfLIS(int* nums, int numsSize) {
    int* tails = malloc((numsSize + 1) * sizeof(int));  // tails[k] = smallest tail of an LIS of length k+1
    int len = 0;
    for (int i = 0; i < numsSize; i++) {
        int lo = 0, hi = len;                // bisect_left: first tail >= nums[i]
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (tails[mid] < nums[i]) lo = mid + 1; else hi = mid;
        }
        tails[lo] = nums[i];                 // extend (lo == len) or replace
        if (lo == len) len++;
    }
    free(tails);
    return len;
}
