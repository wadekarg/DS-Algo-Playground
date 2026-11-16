//@spec {"fn": "characterReplacement", "params": [{"name": "s", "type": "string"}, {"name": "k", "type": "int"}], "ret": "int"}
//@approach Sliding Window with Max-Freq
int characterReplacement(char* s, int k) {
    int counts[256] = {0}, max_freq = 0, left = 0, ans = 0;
    for (int right = 0; s[right]; right++) {
        int c = ++counts[(unsigned char)s[right]];
        if (c > max_freq) max_freq = c;
        // window is valid while the characters we'd have to replace fit in k
        while ((right - left + 1) - max_freq > k) {
            counts[(unsigned char)s[left]]--;
            left++;
        }
        if (right - left + 1 > ans) ans = right - left + 1;
    }
    return ans;
}
