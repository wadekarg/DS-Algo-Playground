//@spec {"fn": "wordBreak", "params": [{"name": "s", "type": "string"}, {"name": "wordDict", "type": "string[]"}], "ret": "bool"}
//@approach Bottom-Up DP
// "s[j:i] in words": compare against each dictionary word of the right length.
bool wordBreak(char* s, char** wordDict, int wordDictSize) {
    int n = strlen(s);
    int* lens = malloc((wordDictSize + 1) * sizeof(int));
    for (int w = 0; w < wordDictSize; w++) lens[w] = strlen(wordDict[w]);
    bool* dp = calloc(n + 1, sizeof(bool));
    dp[0] = true;
    for (int i = 1; i <= n; i++)
        for (int w = 0; w < wordDictSize && !dp[i]; w++) {
            int j = i - lens[w];             // candidate split point
            if (j >= 0 && dp[j] && strncmp(s + j, wordDict[w], lens[w]) == 0) dp[i] = true;
        }
    bool ans = dp[n];
    free(lens); free(dp);
    return ans;
}
