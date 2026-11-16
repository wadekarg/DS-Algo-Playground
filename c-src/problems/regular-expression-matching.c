//@spec {"fn": "isMatch", "params": [{"name": "s", "type": "string"}, {"name": "p", "type": "string"}], "ret": "bool"}
//@approach Bottom-Up 2D DP
bool isMatch(char* s, char* p) {
    int m = strlen(s), n = strlen(p);
    bool* dp = calloc((m + 1) * (n + 1), sizeof(bool));
    #define DP(i, j) dp[(i) * (n + 1) + (j)]
    DP(0, 0) = true;
    // Empty s vs p: only true if the pattern collapses (e.g. "a*b*c*")
    for (int j = 2; j <= n; j++)
        if (p[j - 1] == '*') DP(0, j) = DP(0, j - 2);
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++) {
            if (p[j - 1] == '*') {
                // Zero occurrences, OR one more (char matches and s[:i-1] already matched p[:j])
                DP(i, j) = j >= 2 && DP(i, j - 2);
                if (j >= 2 && (p[j - 2] == s[i - 1] || p[j - 2] == '.'))
                    DP(i, j) = DP(i, j) || DP(i - 1, j);
            } else if (p[j - 1] == s[i - 1] || p[j - 1] == '.') {
                DP(i, j) = DP(i - 1, j - 1);     // literal match (or '.' wildcard)
            }
        }
    bool ans = DP(m, n);
    #undef DP
    free(dp);
    return ans;
}
