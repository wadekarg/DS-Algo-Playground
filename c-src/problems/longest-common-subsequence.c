//@spec {"fn": "longestCommonSubsequence", "params": [{"name": "text1", "type": "string"}, {"name": "text2", "type": "string"}], "ret": "int"}
//@approach Bottom-Up 2D DP
int longestCommonSubsequence(char* text1, char* text2) {
    int m = strlen(text1), n = strlen(text2);
    int* dp = calloc((m + 1) * (n + 1), sizeof(int));   // dp[i][j] at dp[i * (n + 1) + j]
    #define DP(i, j) dp[(i) * (n + 1) + (j)]
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++) {
            if (text1[i - 1] == text2[j - 1]) DP(i, j) = DP(i - 1, j - 1) + 1;
            else DP(i, j) = DP(i - 1, j) > DP(i, j - 1) ? DP(i - 1, j) : DP(i, j - 1);
        }
    int ans = DP(m, n);
    #undef DP
    free(dp);
    return ans;
}
