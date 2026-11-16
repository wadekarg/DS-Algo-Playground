//@spec {"fn": "partitionLabels", "params": [{"name": "s", "type": "string"}], "ret": "int[]"}
//@approach Last-Occurrence + Greedy
int* partitionLabels(char* s, int* returnSize) {
    int n = strlen(s), last[26] = {0};
    for (int i = 0; i < n; i++) last[s[i] - 'a'] = i;
    int* result = malloc((n + 1) * sizeof(int));
    int k = 0, start = 0, end = 0;
    for (int i = 0; i < n; i++) {
        if (last[s[i] - 'a'] > end) end = last[s[i] - 'a'];
        if (i == end) {                       // every letter so far ends inside [start, end]
            result[k++] = end - start + 1;
            start = i + 1;
        }
    }
    *returnSize = k;
    return result;
}
