//@spec {"fn": "ladderLength", "params": [{"name": "beginWord", "type": "string"}, {"name": "endWord", "type": "string"}, {"name": "wordList", "type": "string[]"}], "ret": "int"}
//@approach BFS with Pattern Index
// Pattern index: "h*t" -> list of word indices sharing that pattern.
typedef struct { char* key; int* words; int n, cap; } Bucket;
static Bucket* table_; static int tcap_;
static unsigned hash_str(const char* s) {
    unsigned h = 2166136261u;
    for (; *s; s++) h = (h ^ (unsigned char)*s) * 16777619u;
    return h;
}
static Bucket* bucket(const char* pat, bool create) {
    unsigned h = hash_str(pat) & (tcap_ - 1);
    while (table_[h].key && strcmp(table_[h].key, pat) != 0) h = (h + 1) & (tcap_ - 1);
    if (!table_[h].key) {
        if (!create) return NULL;
        table_[h].key = strdup(pat);
    }
    return &table_[h];
}
int ladderLength(char* beginWord, char* endWord, char** wordList, int wordListSize) {
    int N = wordListSize, L = strlen(beginWord), end = -1;
    for (int i = 0; i < N; i++) if (strcmp(wordList[i], endWord) == 0) end = i;
    if (end < 0) return 0;
    if (strcmp(beginWord, endWord) == 0) return 1;
    tcap_ = 1;
    while (tcap_ < 2 * N * L + 2) tcap_ <<= 1;
    table_ = calloc(tcap_, sizeof(Bucket));
    char* pat = malloc(L + 1);
    for (int w = 0; w < N; w++)
        for (int i = 0; i < L; i++) {
            strcpy(pat, wordList[w]);
            pat[i] = '*';
            Bucket* b = bucket(pat, true);
            if (b->n == b->cap) b->words = realloc(b->words, (b->cap = b->cap ? 2 * b->cap : 4) * sizeof(int));
            b->words[b->n++] = w;
        }
    // BFS over word indices; -1 stands for beginWord (it may not be in the list)
    bool* visited = calloc(N, sizeof(bool));
    int* queue = malloc((N + 1) * sizeof(int));
    int* dist = malloc((N + 1) * sizeof(int));
    int head = 0, tail = 0, answer = 0;
    queue[tail] = -1; dist[tail++] = 1;
    while (head < tail && !answer) {
        int w = queue[head], d = dist[head++];
        const char* word = w < 0 ? beginWord : wordList[w];
        for (int i = 0; i < L && !answer; i++) {
            strcpy(pat, word);
            pat[i] = '*';
            Bucket* b = bucket(pat, false);
            if (!b) continue;
            for (int j = 0; j < b->n; j++) {
                int nb = b->words[j];
                if (visited[nb]) continue;
                visited[nb] = true;
                if (nb == end) { answer = d + 1; break; }
                queue[tail] = nb; dist[tail++] = d + 1;
            }
            b->n = 0;                        // clear the pattern: never expand it again
        }
    }
    for (int i = 0; i < tcap_; i++) { free(table_[i].key); free(table_[i].words); }
    free(table_); free(pat); free(visited); free(queue); free(dist);
    return answer;
}
