//@spec {"fn": "permute", "params": [{"name": "nums", "type": "int[]"}], "ret": "int[][]"}
//@approach Backtracking with Used Array
static int **res_, count_, *cur_, cur_len_;
static bool* used_;
static void backtrack(int* nums, int n) {
    if (cur_len_ == n) {
        res_[count_] = malloc(n * sizeof(int));
        memcpy(res_[count_++], cur_, n * sizeof(int));
        return;
    }
    for (int i = 0; i < n; i++) {
        if (used_[i]) continue;
        used_[i] = true;
        cur_[cur_len_++] = nums[i];
        backtrack(nums, n);
        cur_len_--;
        used_[i] = false;
    }
}
int** permute(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {
    int total = 1;
    for (int i = 2; i <= numsSize; i++) total *= i;
    res_ = malloc(total * sizeof(int*));
    cur_ = malloc((numsSize + 1) * sizeof(int));
    used_ = calloc(numsSize + 1, sizeof(bool));
    count_ = cur_len_ = 0;
    backtrack(nums, numsSize);
    free(cur_); free(used_);
    *returnSize = count_;
    *returnColumnSizes = malloc(total * sizeof(int));
    for (int i = 0; i < count_; i++) (*returnColumnSizes)[i] = numsSize;
    return res_;
}
//@approach Backtracking with In-Place Swap
static int **res_, count_;
static void swap(int* a, int* b) { int t = *a; *a = *b; *b = t; }
static void backtrack(int* nums, int n, int start) {
    if (start == n) {
        res_[count_] = malloc(n * sizeof(int));
        memcpy(res_[count_++], nums, n * sizeof(int));
        return;
    }
    for (int i = start; i < n; i++) {
        swap(&nums[start], &nums[i]);
        backtrack(nums, n, start + 1);
        swap(&nums[start], &nums[i]);   // swap back
    }
}
int** permute(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {
    int total = 1;
    for (int i = 2; i <= numsSize; i++) total *= i;
    res_ = malloc(total * sizeof(int*));
    count_ = 0;
    backtrack(nums, numsSize, 0);
    *returnSize = count_;
    *returnColumnSizes = malloc(total * sizeof(int));
    for (int i = 0; i < count_; i++) (*returnColumnSizes)[i] = numsSize;
    return res_;
}
