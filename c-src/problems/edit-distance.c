//@spec {"fn": "minDistance", "params": [{"name": "word1", "type": "string"}, {"name": "word2", "type": "string"}], "ret": "int"}
//@approach Bottom-Up 2D DP
static int min3(int a, int b, int c) { return a < b ? (a < c ? a : c) : (b < c ? b : c); }
int minDistance(char* word1, char* word2) {
    int m = strlen(word1), n = strlen(word2);
    int* dp = calloc((m + 1) * (n + 1), sizeof(int));   // dp[i][j] at dp[i * (n + 1) + j]
    #define DP(i, j) dp[(i) * (n + 1) + (j)]
    // Base: empty -> word2[:j] needs j inserts; word1[:i] -> empty needs i deletes
    for (int i = 0; i <= m; i++) DP(i, 0) = i;
    for (int j = 0; j <= n; j++) DP(0, j) = j;
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++) {
            if (word1[i - 1] == word2[j - 1]) DP(i, j) = DP(i - 1, j - 1);   // no op needed
            else DP(i, j) = 1 + min3(DP(i - 1, j - 1),   // replace
                                     DP(i - 1, j),       // delete from word1
                                     DP(i, j - 1));      // insert into word1
        }
    int ans = DP(m, n);
    #undef DP
    free(dp);
    return ans;
}
