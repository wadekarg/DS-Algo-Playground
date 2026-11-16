//@spec {"fn": "combine", "params": [{"name": "n", "type": "int"}, {"name": "k", "type": "int"}], "ret": "int[][]"}
//@approach Backtracking with Start Index
static int **res_, count_, cap_, *cur_, cur_len_;
static void save(int k) {
    if (count_ == cap_) res_ = realloc(res_, (cap_ *= 2) * sizeof(int*));
    res_[count_] = malloc(k * sizeof(int));
    memcpy(res_[count_++], cur_, k * sizeof(int));
}
static void backtrack(int n, int k, int start) {
    if (cur_len_ == k) { save(k); return; }
    for (int i = start; i <= n; i++) {
        cur_[cur_len_++] = i;
        backtrack(n, k, i + 1);
        cur_len_--;
    }
}
int** combine(int n, int k, int* returnSize, int** returnColumnSizes) {
    cap_ = 16; count_ = cur_len_ = 0;
    res_ = malloc(cap_ * sizeof(int*));
    cur_ = malloc((k + 1) * sizeof(int));
    backtrack(n, k, 1);
    free(cur_);
    *returnSize = count_;
    *returnColumnSizes = malloc((count_ + 1) * sizeof(int));
    for (int i = 0; i < count_; i++) (*returnColumnSizes)[i] = k;
    return res_;
}
//@approach Backtracking with Pruning
static int **res_, count_, cap_, *cur_, cur_len_;
static void save(int k) {
    if (count_ == cap_) res_ = realloc(res_, (cap_ *= 2) * sizeof(int*));
    res_[count_] = malloc(k * sizeof(int));
    memcpy(res_[count_++], cur_, k * sizeof(int));
}
static void backtrack(int n, int k, int start) {
    if (cur_len_ == k) { save(k); return; }
    // Pruning: stop once too few numbers remain to fill the slots
    int needed = k - cur_len_;
    for (int i = start; i <= n - needed + 1; i++) {
        cur_[cur_len_++] = i;
        backtrack(n, k, i + 1);
        cur_len_--;
    }
}
int** combine(int n, int k, int* returnSize, int** returnColumnSizes) {
    cap_ = 16; count_ = cur_len_ = 0;
    res_ = malloc(cap_ * sizeof(int*));
    cur_ = malloc((k + 1) * sizeof(int));
    backtrack(n, k, 1);
    free(cur_);
    *returnSize = count_;
    *returnColumnSizes = malloc((count_ + 1) * sizeof(int));
    for (int i = 0; i < count_; i++) (*returnColumnSizes)[i] = k;
    return res_;
}
