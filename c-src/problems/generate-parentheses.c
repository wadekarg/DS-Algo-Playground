//@spec {"fn": "generateParenthesis", "params": [{"name": "n", "type": "int"}], "ret": "string[]"}
//@approach Backtracking with Open/Close Counters
static char** res_; static int count_, cap_;
static void backtrack(char* cur, int len, int n, int open_count, int close_count) {
    if (len == 2 * n) {
        if (count_ == cap_) res_ = realloc(res_, (cap_ *= 2) * sizeof(char*));
        cur[len] = '\0';
        res_[count_++] = strdup(cur);
        return;
    }
    if (open_count < n) {
        cur[len] = '(';
        backtrack(cur, len + 1, n, open_count + 1, close_count);
    }
    if (close_count < open_count) {
        cur[len] = ')';
        backtrack(cur, len + 1, n, open_count, close_count + 1);
    }
}
char** generateParenthesis(int n, int* returnSize) {
    cap_ = 16; count_ = 0;
    res_ = malloc(cap_ * sizeof(char*));
    char* cur = malloc(2 * n + 1);
    backtrack(cur, 0, n, 0, 0);
    free(cur);
    *returnSize = count_;
    return res_;
}
