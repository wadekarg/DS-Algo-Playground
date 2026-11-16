//@spec {"fn": "isInterleave", "params": [{"name": "s1", "type": "string"}, {"name": "s2", "type": "string"}, {"name": "s3", "type": "string"}], "ret": "bool"}
//@approach Bottom-Up 2D DP
bool isInterleave(char* s1, char* s2, char* s3) {
    int m = strlen(s1), n = strlen(s2);
    if (m + n != (int)strlen(s3)) return false;
    bool* dp = calloc((m + 1) * (n + 1), sizeof(bool));   // dp[i][j] at dp[i * (n + 1) + j]
    dp[0] = true;
    for (int i = 0; i <= m; i++)
        for (int j = 0; j <= n; j++) {
            int k = i + j - 1;                   // index into s3 if we consumed something
            if (i > 0 && dp[(i - 1) * (n + 1) + j] && s1[i - 1] == s3[k]) dp[i * (n + 1) + j] = true;
            if (j > 0 && dp[i * (n + 1) + j - 1] && s2[j - 1] == s3[k]) dp[i * (n + 1) + j] = true;
        }
    bool ans = dp[m * (n + 1) + n];
    free(dp);
    return ans;
}
