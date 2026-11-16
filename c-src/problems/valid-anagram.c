//@spec {"fn": "isAnagram", "params": [{"name": "s", "type": "string"}, {"name": "t", "type": "string"}], "ret": "bool"}
//@approach Sort and Compare
static int cmp_char(const void* a, const void* b) {
    return *(const char*)a - *(const char*)b;
}
bool isAnagram(char* s, char* t) {
    size_t n = strlen(s);
    if (n != strlen(t)) return false;
    qsort(s, n, 1, cmp_char);
    qsort(t, n, 1, cmp_char);
    return strcmp(s, t) == 0;
}
//@approach Hash Map of Frequencies
// Characters are bytes, so a 256-entry table is the frequency map.
bool isAnagram(char* s, char* t) {
    if (strlen(s) != strlen(t)) return false;
    int freq_s[256] = {0}, freq_t[256] = {0};
    for (; *s; s++) freq_s[(unsigned char)*s]++;
    for (; *t; t++) freq_t[(unsigned char)*t]++;
    return memcmp(freq_s, freq_t, sizeof freq_s) == 0;
}
//@approach Array[26] (O(1) space)
bool isAnagram(char* s, char* t) {
    if (strlen(s) != strlen(t)) return false;
    int counts[26] = {0};
    for (; *s; s++) counts[*s - 'a']++;
    for (; *t; t++) counts[*t - 'a']--;
    for (int i = 0; i < 26; i++)
        if (counts[i] != 0) return false;
    return true;
}
