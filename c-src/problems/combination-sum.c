//@spec {"fn": "combinationSum", "params": [{"name": "candidates", "type": "int[]"}, {"name": "target", "type": "int"}], "ret": "int[][]"}
//@approach Backtracking with Start Index
static int **res_, *sizes_, count_, cap_, *path_, path_len_;
static void back(int* c, int n, int start, int rem) {
    if (rem == 0) {
        if (count_ == cap_) {
            cap_ *= 2;
            res_ = realloc(res_, cap_ * sizeof(int*));
            sizes_ = realloc(sizes_, cap_ * sizeof(int));
        }
        res_[count_] = malloc((path_len_ + 1) * sizeof(int));
        memcpy(res_[count_], path_, path_len_ * sizeof(int));
        sizes_[count_++] = path_len_;
        return;
    }
    if (rem < 0) return;
    for (int i = start; i < n; i++) {
        path_[path_len_++] = c[i];
        back(c, n, i, rem - c[i]);           // i, not i+1: the same number may be reused
        path_len_--;
    }
}
int** combinationSum(int* candidates, int candidatesSize, int target, int* returnSize, int** returnColumnSizes) {
    cap_ = 16; count_ = path_len_ = 0;
    res_ = malloc(cap_ * sizeof(int*));
    sizes_ = malloc(cap_ * sizeof(int));
    path_ = malloc((target + 1) * sizeof(int));   // candidates >= 1, so depth <= target
    back(candidates, candidatesSize, 0, target);
    free(path_);
    *returnSize = count_;
    *returnColumnSizes = sizes_;
    return res_;
}
