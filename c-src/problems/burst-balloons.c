//@spec {"fn": "maxCoins", "params": [{"name": "nums", "type": "int[]"}], "ret": "int"}
//@approach Interval DP, Last-to-Burst
int maxCoins(int* nums, int numsSize) {
    // Pad with 1s on both ends to simplify boundary multiplication
    int n = numsSize + 2;
    int* a = malloc(n * sizeof(int));
    a[0] = a[n - 1] = 1;
    for (int i = 0; i < numsSize; i++) a[i + 1] = nums[i];
    // dp[i][j] = max coins from bursting the balloons in the OPEN interval (i, j)
    int* dp = calloc(n * n, sizeof(int));
    for (int length = 2; length < n; length++)
        for (int i = 0; i + length < n; i++) {
            int j = i + length;
            for (int k = i + 1; k < j; k++) {   // k is the LAST balloon burst in (i, j)
                int coins = dp[i * n + k] + dp[k * n + j] + a[i] * a[k] * a[j];
                if (coins > dp[i * n + j]) dp[i * n + j] = coins;
            }
        }
    int ans = dp[0 * n + n - 1];
    free(a); free(dp);
    return ans;
}
