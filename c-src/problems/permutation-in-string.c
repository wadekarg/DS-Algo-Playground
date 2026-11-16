//@spec {"fn": "checkInclusion", "params": [{"name": "s1", "type": "string"}, {"name": "s2", "type": "string"}], "ret": "bool"}
//@approach Sort Each Window (Brute Force)
static int cmp_char(const void* a, const void* b) { return *(const char*)a - *(const char*)b; }
bool checkInclusion(char* s1, char* s2) {
    int m = strlen(s1), n = strlen(s2);
    if (m > n) return false;
    char* target = strdup(s1);
    qsort(target, m, 1, cmp_char);
    char* win = malloc(m + 1);
    bool found = false;
    for (int i = 0; i + m <= n && !found; i++) {
        memcpy(win, s2 + i, m);
        win[m] = '\0';
        qsort(win, m, 1, cmp_char);
        found = strcmp(win, target) == 0;
    }
    free(target); free(win);
    return found;
}
//@approach Sliding Window with Frequency Compare
bool checkInclusion(char* s1, char* s2) {
    int m = strlen(s1), n = strlen(s2);
    if (m > n) return false;
    int s1_count[26] = {0}, window[26] = {0};
    for (int i = 0; i < m; i++) {
        s1_count[s1[i] - 'a']++;
        window[s2[i] - 'a']++;
    }
    if (memcmp(window, s1_count, sizeof window) == 0) return true;
    for (int i = m; i < n; i++) {
        window[s2[i] - 'a']++;           // add right
        window[s2[i - m] - 'a']--;       // drop left
        if (memcmp(window, s1_count, sizeof window) == 0) return true;
    }
    return false;
}
//@approach Sliding Window with Matches Counter
bool checkInclusion(char* s1, char* s2) {
    int m = strlen(s1), n = strlen(s2);
    if (m > n) return false;
    int s1_count[26] = {0}, window[26] = {0};
    for (int i = 0; i < m; i++) {
        s1_count[s1[i] - 'a']++;
        window[s2[i] - 'a']++;
    }
    int matches = 0;                     // letters whose counts agree
    for (int i = 0; i < 26; i++) matches += window[i] == s1_count[i];
    for (int i = m; i < n; i++) {
        if (matches == 26) return true;
        // Add s2[i]
        int idx = s2[i] - 'a';
        window[idx]++;
        if (window[idx] == s1_count[idx]) matches++;
        else if (window[idx] == s1_count[idx] + 1) matches--;
        // Drop s2[i - m]
        idx = s2[i - m] - 'a';
        window[idx]--;
        if (window[idx] == s1_count[idx]) matches++;
        else if (window[idx] == s1_count[idx] - 1) matches--;
    }
    return matches == 26;
}
