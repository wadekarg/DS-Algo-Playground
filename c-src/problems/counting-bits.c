//@spec {"fn": "countBits", "params": [{"name": "n", "type": "int"}], "ret": "int[]"}
//@approach DP on Right Shift
int* countBits(int n, int* returnSize) {
    int* dp = calloc(n + 1, sizeof(int));
    for (int i = 1; i <= n; i++) dp[i] = dp[i >> 1] + (i & 1);
    *returnSize = n + 1;
    return dp;
}
