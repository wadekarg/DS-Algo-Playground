//@spec {"fn": "numDecodings", "params": [{"name": "s", "type": "string"}], "ret": "int"}
//@approach Bottom-Up DP
int numDecodings(char* s) {
    int n = strlen(s);
    if (n == 0 || s[0] == '0') return 0;
    int* dp = calloc(n + 1, sizeof(int));
    dp[0] = 1;
    dp[1] = 1;
    for (int i = 2; i <= n; i++) {
        // Single-digit decode: s[i-1] must be '1'-'9'
        if (s[i - 1] != '0') dp[i] += dp[i - 1];
        // Two-digit decode: s[i-2..i-1] must be "10" to "26"
        int two = (s[i - 2] - '0') * 10 + (s[i - 1] - '0');
        if (two >= 10 && two <= 26) dp[i] += dp[i - 2];
    }
    int ans = dp[n];
    free(dp);
    return ans;
}
