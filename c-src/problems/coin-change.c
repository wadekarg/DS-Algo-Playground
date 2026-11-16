//@spec {"fn": "coinChange", "params": [{"name": "coins", "type": "int[]"}, {"name": "amount", "type": "int"}], "ret": "int"}
//@approach Bottom-Up DP
int coinChange(int* coins, int coinsSize, int amount) {
    // Sentinel: amount + 1 is larger than any possible answer
    int* dp = malloc((amount + 1) * sizeof(int));
    dp[0] = 0;
    for (int i = 1; i <= amount; i++) {
        dp[i] = amount + 1;
        for (int j = 0; j < coinsSize; j++)
            if (coins[j] <= i && 1 + dp[i - coins[j]] < dp[i]) dp[i] = 1 + dp[i - coins[j]];
    }
    int ans = dp[amount] <= amount ? dp[amount] : -1;
    free(dp);
    return ans;
}
//@approach BFS (alternative framing)
int coinChange(int* coins, int coinsSize, int amount) {
    if (amount == 0) return 0;
    bool* visited = calloc(amount + 1, sizeof(bool));
    int* queue = malloc((amount + 1) * sizeof(int));     // sums; BFS level = coins used
    int head = 0, tail = 0, count = 0, ans = -1;
    queue[tail++] = 0;
    visited[0] = true;
    while (head < tail && ans < 0) {
        count++;
        int level_end = tail;
        while (head < level_end && ans < 0) {
            int s = queue[head++];
            for (int j = 0; j < coinsSize; j++) {
                long long ns = (long long)s + coins[j];
                if (ns == amount) { ans = count; break; }
                if (ns < amount && !visited[ns]) {
                    visited[ns] = true;
                    queue[tail++] = (int)ns;
                }
            }
        }
    }
    free(visited); free(queue);
    return ans;
}
