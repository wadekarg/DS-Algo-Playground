//@spec {"fn": "longestPalindrome", "params": [{"name": "s", "type": "string"}], "ret": "string"}
//@approach Expand Around Center
// Expand while s[l] == s[r]; report the palindrome as (start, length).
static void expand(const char* s, int n, int l, int r, int* start, int* len) {
    while (l >= 0 && r < n && s[l] == s[r]) { l--; r++; }
    *start = l + 1;
    *len = r - l - 1;
}
char* longestPalindrome(char* s) {
    int n = strlen(s), best_start = 0, best_len = 0, st, ln;
    for (int i = 0; i < n; i++) {
        expand(s, n, i, i, &st, &ln);        // odd-length center
        if (ln > best_len) { best_start = st; best_len = ln; }
        expand(s, n, i, i + 1, &st, &ln);    // even-length center
        if (ln > best_len) { best_start = st; best_len = ln; }
    }
    char* res = malloc(best_len + 1);
    memcpy(res, s + best_start, best_len);
    res[best_len] = '\0';
    return res;
}
