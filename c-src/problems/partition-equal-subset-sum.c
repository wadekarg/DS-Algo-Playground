//@spec {"fn": "canPartition", "params": [{"name": "nums", "type": "int[]"}], "ret": "bool"}
//@approach 1D Knapsack DP
bool canPartition(int* nums, int numsSize) {
    int total = 0;
    for (int i = 0; i < numsSize; i++) total += nums[i];
    if (total % 2 != 0) return false;
    int target = total / 2;
    bool* dp = calloc(target + 1, sizeof(bool));
    dp[0] = true;
    for (int i = 0; i < numsSize; i++)
        // Iterate right-to-left so each num is used at most once
        for (int j = target; j >= nums[i]; j--)
            dp[j] = dp[j] || dp[j - nums[i]];
    bool ans = dp[target];
    free(dp);
    return ans;
}
