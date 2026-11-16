//@spec {"fn": "partition", "params": [{"name": "s", "type": "string"}], "ret": "string[][]"}
//@approach Backtracking on Splits
static char*** res_; static int *sizes_, count_, cap_;
static char** path_; static int path_len_;
static bool is_pal(const char* s, int lo, int hi) {
    while (lo < hi) if (s[lo++] != s[hi--]) return false;
    return true;
}
static void back(const char* s, int n, int start) {
    if (start == n) {
        if (count_ == cap_) {
            cap_ *= 2;
            res_ = realloc(res_, cap_ * sizeof(char**));
            sizes_ = realloc(sizes_, cap_ * sizeof(int));
        }
        res_[count_] = malloc((path_len_ + 1) * sizeof(char*));
        for (int i = 0; i < path_len_; i++) res_[count_][i] = strdup(path_[i]);
        sizes_[count_++] = path_len_;
        return;
    }
    for (int end = start; end < n; end++) {
        if (!is_pal(s, start, end)) continue;
        char* sub = strndup(s + start, end - start + 1);
        path_[path_len_++] = sub;
        back(s, n, end + 1);
        free(path_[--path_len_]);
    }
}
char*** partition(char* s, int* returnSize, int** returnColumnSizes) {
    int n = strlen(s);
    cap_ = 16; count_ = path_len_ = 0;
    res_ = malloc(cap_ * sizeof(char**));
    sizes_ = malloc(cap_ * sizeof(int));
    path_ = malloc((n + 1) * sizeof(char*));
    back(s, n, 0);
    free(path_);
    *returnSize = count_;
    *returnColumnSizes = sizes_;
    return res_;
}
