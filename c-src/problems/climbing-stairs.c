//@spec {"fn": "climbStairs", "params": [{"name": "n", "type": "int"}], "ret": "int"}
//@approach Iterative DP, O(1) Space
int climbStairs(int n) {
    if (n <= 2) return n;
    int prev2 = 1, prev1 = 2;
    for (int i = 3; i <= n; i++) {
        int cur = prev1 + prev2;
        prev2 = prev1;
        prev1 = cur;
    }
    return prev1;
}
//@approach Recursive with Memoization
static int ways(int i, int* memo) {
    if (i <= 2) return i;
    if (memo[i]) return memo[i];
    return memo[i] = ways(i - 1, memo) + ways(i - 2, memo);
}
int climbStairs(int n) {
    int* memo = calloc(n + 1, sizeof(int));  // 0 = not computed
    int ans = ways(n, memo);
    free(memo);
    return ans;
}
