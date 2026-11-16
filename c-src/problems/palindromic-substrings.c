//@spec {"fn": "countSubstrings", "params": [{"name": "s", "type": "string"}], "ret": "int"}
//@approach Expand Around Center
static int expand(const char* s, int n, int l, int r) {
    int count = 0;
    while (l >= 0 && r < n && s[l] == s[r]) {
        count++;                             // every successful expansion is one palindrome
        l--;
        r++;
    }
    return count;
}
int countSubstrings(char* s) {
    int n = strlen(s), count = 0;
    for (int i = 0; i < n; i++) {
        count += expand(s, n, i, i);         // odd-length
        count += expand(s, n, i, i + 1);     // even-length
    }
    return count;
}
