//@spec {"fn": "change", "params": [{"name": "amount", "type": "int"}, {"name": "coins", "type": "int[]"}], "ret": "int"}
//@approach 1D Unbounded Knapsack DP
int change(int amount, int* coins, int coinsSize) {
    unsigned long long* dp = calloc(amount + 1, sizeof(unsigned long long));
    dp[0] = 1;                               // one way to make 0: the empty combination
    for (int c = 0; c < coinsSize; c++)      // coins outer => combinations, not permutations
        for (int i = coins[c]; i <= amount; i++)
            dp[i] += dp[i - coins[c]];
    int ans = (int)dp[amount];
    free(dp);
    return ans;
}
