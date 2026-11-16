//@spec {"fn": "groupAnagrams", "params": [{"name": "strs", "type": "string[]"}], "ret": "string[][]"}
//@starter
/**
 * Return the groups as an array of string arrays (all malloc'd):
 * *returnSize = number of groups, (*returnColumnSizes)[g] = size of group g.
 * Keep groups in order of first appearance and words in input order.
 */
char*** groupAnagrams(char** strs, int strsSize, int* returnSize, int** returnColumnSizes) {
    // Your code here
    *returnSize = 0;
    *returnColumnSizes = NULL;
    return NULL;
}
//@approach Brute Force Pairwise
static int cmp_char(const void* a, const void* b) { return *(const char*)a - *(const char*)b; }
static char* sorted_copy(const char* s) {
    char* c = strdup(s);
    qsort(c, strlen(c), 1, cmp_char);
    return c;
}
char*** groupAnagrams(char** strs, int strsSize, int* returnSize, int** returnColumnSizes) {
    bool* visited = calloc(strsSize + 1, sizeof(bool));
    char*** result = malloc((strsSize + 1) * sizeof(char**));
    *returnColumnSizes = malloc((strsSize + 1) * sizeof(int));
    int groups = 0;
    for (int i = 0; i < strsSize; i++) {
        if (visited[i]) continue;
        char* key = sorted_copy(strs[i]);
        char** group = malloc(strsSize * sizeof(char*));
        int size = 0;
        group[size++] = strs[i];
        visited[i] = true;
        for (int j = i + 1; j < strsSize; j++) {
            if (visited[j]) continue;
            char* other = sorted_copy(strs[j]);
            if (strcmp(key, other) == 0) { group[size++] = strs[j]; visited[j] = true; }
            free(other);
        }
        free(key);
        result[groups] = group;
        (*returnColumnSizes)[groups++] = size;
    }
    free(visited);
    *returnSize = groups;
    return result;
}
//@approach Hash Map with Sort-Key
// Map sorted-letters key -> group index (open addressing over string keys).
static int cmp_char(const void* a, const void* b) { return *(const char*)a - *(const char*)b; }
static unsigned hash_str(const char* s) {
    unsigned h = 2166136261u;                       // FNV-1a
    for (; *s; s++) h = (h ^ (unsigned char)*s) * 16777619u;
    return h;
}
char*** groupAnagrams(char** strs, int strsSize, int* returnSize, int** returnColumnSizes) {
    int cap = 1;
    while (cap < 2 * strsSize) cap <<= 1;
    char** keys = calloc(cap, sizeof(char*));      // NULL = empty slot
    int* group_of = malloc(cap * sizeof(int));
    char*** result = malloc((strsSize + 1) * sizeof(char**));
    int* sizes = calloc(strsSize + 1, sizeof(int));
    int groups = 0;
    for (int i = 0; i < strsSize; i++) {
        char* key = strdup(strs[i]);
        qsort(key, strlen(key), 1, cmp_char);
        unsigned h = hash_str(key) & (cap - 1);
        while (keys[h] && strcmp(keys[h], key) != 0) h = (h + 1) & (cap - 1);
        if (!keys[h]) {                             // new group
            keys[h] = key;
            group_of[h] = groups;
            result[groups++] = malloc(strsSize * sizeof(char*));
        } else {
            free(key);
        }
        int g = group_of[h];
        result[g][sizes[g]++] = strs[i];
    }
    for (int i = 0; i < cap; i++) free(keys[i]);
    free(keys); free(group_of);
    *returnSize = groups;
    *returnColumnSizes = sizes;
    return result;
}
//@approach Hash Map with Count-Key (O(m))
// Key = the 26 letter counts; compare count arrays instead of sorting.
typedef struct { int count[26]; int used; int group; } Slot;
static unsigned hash_counts(const int* c) {
    unsigned h = 2166136261u;
    for (int i = 0; i < 26; i++) h = (h ^ (unsigned)c[i]) * 16777619u;
    return h;
}
char*** groupAnagrams(char** strs, int strsSize, int* returnSize, int** returnColumnSizes) {
    int cap = 1;
    while (cap < 2 * strsSize) cap <<= 1;
    Slot* table = calloc(cap, sizeof(Slot));
    char*** result = malloc((strsSize + 1) * sizeof(char**));
    int* sizes = calloc(strsSize + 1, sizeof(int));
    int groups = 0;
    for (int i = 0; i < strsSize; i++) {
        int count[26] = {0};
        for (char* p = strs[i]; *p; p++) count[*p - 'a']++;
        unsigned h = hash_counts(count) & (cap - 1);
        while (table[h].used && memcmp(table[h].count, count, sizeof count) != 0) h = (h + 1) & (cap - 1);
        if (!table[h].used) {
            table[h].used = 1;
            memcpy(table[h].count, count, sizeof count);
            table[h].group = groups;
            result[groups++] = malloc(strsSize * sizeof(char*));
        }
        int g = table[h].group;
        result[g][sizes[g]++] = strs[i];
    }
    free(table);
    *returnSize = groups;
    *returnColumnSizes = sizes;
    return result;
}
