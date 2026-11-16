//@spec {"fn": "numDistinct", "params": [{"name": "s", "type": "string"}, {"name": "t", "type": "string"}], "ret": "int"}
//@approach Bottom-Up 2D DP
int numDistinct(char* s, char* t) {
    int m = strlen(s), n = strlen(t);
    // unsigned long long: intermediate counts can exceed int before the answer does
    unsigned long long* dp = calloc((m + 1) * (n + 1), sizeof(unsigned long long));
    #define DP(i, j) dp[(i) * (n + 1) + (j)]
    // Base: empty t is formed from any prefix of s in exactly 1 way
    for (int i = 0; i <= m; i++) DP(i, 0) = 1;
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++) {
            DP(i, j) = DP(i - 1, j);                                // skip s[i-1]
            if (s[i - 1] == t[j - 1]) DP(i, j) += DP(i - 1, j - 1);  // or use it to match t[j-1]
        }
    int ans = (int)DP(m, n);
    #undef DP
    free(dp);
    return ans;
}
