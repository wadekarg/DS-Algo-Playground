//@spec {"fn": "minWindow", "params": [{"name": "s", "type": "string"}, {"name": "t", "type": "string"}], "ret": "string"}
//@starter
// Return the smallest substring of s containing every character of t
// (with multiplicity), as a malloc'd string, or "" if there is none.
char* minWindow(char* s, char* t) {
    // Your code here
    return "";
}
//@approach Brute Force
char* minWindow(char* s, char* t) {
    int n = strlen(s), m = strlen(t);
    int need[256] = {0};
    for (int i = 0; i < m; i++) need[(unsigned char)t[i]]++;
    int best_start = 0, best_len = -1;
    if (m > 0 && m <= n) {
        for (int i = 0; i < n; i++) {
            int window[256] = {0};
            for (int j = i; j < n; j++) {
                window[(unsigned char)s[j]]++;
                bool ok = true;
                for (int c = 0; c < 256 && ok; c++) ok = window[c] >= need[c];
                if (ok) {
                    if (best_len < 0 || j - i + 1 < best_len) { best_start = i; best_len = j - i + 1; }
                    break;  // any longer window from i won't be smaller
                }
            }
        }
    }
    if (best_len < 0) best_len = 0;
    char* res = malloc(best_len + 1);
    memcpy(res, s + best_start, best_len);
    res[best_len] = '\0';
    return res;
}
//@approach Sliding Window with Matched Counter
char* minWindow(char* s, char* t) {
    int n = strlen(s), m = strlen(t);
    int need[256] = {0}, window[256] = {0};
    int required = 0;                       // number of unique chars in t
    for (int i = 0; i < m; i++)
        if (need[(unsigned char)t[i]]++ == 0) required++;
    int matched = 0, left = 0, best_start = 0, best_len = -1;
    if (m > 0 && m <= n) {
        for (int right = 0; right < n; right++) {
            unsigned char c = s[right];
            if (++window[c] == need[c]) matched++;
            // Shrink from left while window is valid
            while (matched == required) {
                if (best_len < 0 || right - left + 1 < best_len) {
                    best_start = left;
                    best_len = right - left + 1;
                }
                unsigned char lc = s[left++];
                if (window[lc]-- == need[lc]) matched--;
            }
        }
    }
    if (best_len < 0) best_len = 0;
    char* res = malloc(best_len + 1);
    memcpy(res, s + best_start, best_len);
    res[best_len] = '\0';
    return res;
}
