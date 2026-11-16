//@code
#include <stdio.h>
#include <stdlib.h>

// --- Memoization (Top-Down) ---
/* memo[i] == -1 means "not computed yet". */
long long fib_memo_helper(int n, long long memo[]) {
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n];

    memo[n] = fib_memo_helper(n - 1, memo) + fib_memo_helper(n - 2, memo);
    return memo[n];
}

long long fib_memo(int n) {
    long long* memo = malloc((n + 1) * sizeof(long long));
    for (int i = 0; i <= n; i++) memo[i] = -1;
    long long result = fib_memo_helper(n, memo);
    free(memo);
    return result;
}

// --- Tabulation (Bottom-Up) ---
long long fib_tab(int n) {
    if (n <= 1) return n;

    long long* dp = calloc(n + 1, sizeof(long long));
    dp[0] = 0;
    dp[1] = 1;

    for (int i = 2; i <= n; i++)
        dp[i] = dp[i - 1] + dp[i - 2];

    long long result = dp[n];
    free(dp);
    return result;
}

int main(void) {
    // Example usage
    printf("%lld\n", fib_memo(10));  // Output: 55
    printf("%lld\n", fib_tab(10));   // Output: 55
    return 0;
}
//@trace
long long fib(int n) {
    long long* dp = calloc(n + 2, sizeof(long long));
    dp[0] = 0;
    dp[1] = 1;
    for (int i = 2; i <= n; i++)
        dp[i] = dp[i-1] + dp[i-2];
    long long ans = dp[n];
    free(dp);
    return ans;
}
//@trace-map 1:1 2:2 3:3 4:4 5:5 6:6 7:7-9
//@practice fib
//@spec {"fn": "fib", "params": [{"name": "n", "type": "int"}], "ret": "long"}
//@starter
/* Return the nth Fibonacci number (0-indexed: fib(0)=0, fib(1)=1). */
long long fib(int n) {
    // Your code here
    return 0;
}
//@solution
long long fib(int n) {
    long long a = 0, b = 1;            // dp[i-2], dp[i-1] - O(1) space
    for (int i = 0; i < n; i++) {
        long long c = a + b;
        a = b;
        b = c;
    }
    return a;
}
//@practice climb_stairs
//@spec {"fn": "climb_stairs", "params": [{"name": "n", "type": "int"}], "ret": "int"}
//@starter
/* Return the number of distinct ways to climb n stairs (1 or 2 steps at a time). */
int climb_stairs(int n) {
    // Your code here
    return 0;
}
//@solution
int climb_stairs(int n) {
    int one = 1, two = 1;              // ways(i-1), ways(i-2)
    for (int i = 2; i <= n; i++) {
        int cur = one + two;
        two = one;
        one = cur;
    }
    return one;
}
