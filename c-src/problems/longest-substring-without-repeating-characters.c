//@spec {"fn": "lengthOfLongestSubstring", "params": [{"name": "s", "type": "string"}], "ret": "int"}
//@approach Brute Force
int lengthOfLongestSubstring(char* s) {
    int n = strlen(s), best = 0;
    for (int i = 0; i < n; i++) {
        bool seen[256] = {false};
        for (int j = i; j < n; j++) {
            unsigned char c = s[j];
            if (seen[c]) break;            // s[i..j] would repeat a character
            seen[c] = true;
            if (j - i + 1 > best) best = j - i + 1;
        }
    }
    return best;
}
//@approach Sliding Window with Set
int lengthOfLongestSubstring(char* s) {
    bool seen[256] = {false};             // the window's characters
    int left = 0, best = 0;
    for (int right = 0; s[right]; right++) {
        while (seen[(unsigned char)s[right]]) {
            seen[(unsigned char)s[left]] = false;
            left++;
        }
        seen[(unsigned char)s[right]] = true;
        if (right - left + 1 > best) best = right - left + 1;
    }
    return best;
}
//@approach Sliding Window with Map (Optimization)
int lengthOfLongestSubstring(char* s) {
    int last_idx[256];                    // last index of each character, -1 = unseen
    for (int i = 0; i < 256; i++) last_idx[i] = -1;
    int left = 0, best = 0;
    for (int right = 0; s[right]; right++) {
        unsigned char c = s[right];
        if (last_idx[c] >= left) left = last_idx[c] + 1;   // jump past the repeat
        last_idx[c] = right;
        if (right - left + 1 > best) best = right - left + 1;
    }
    return best;
}
