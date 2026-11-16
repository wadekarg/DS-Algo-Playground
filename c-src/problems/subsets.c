//@spec {"fn": "subsets", "params": [{"name": "nums", "type": "int[]"}], "ret": "int[][]", "normalize": "len_lex"}
//@starter
/**
 * Return all subsets (malloc'd): *returnSize = number of subsets,
 * (*returnColumnSizes)[i] = size of subset i. Any order is accepted.
 */
int** subsets(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {
    // Your code here
    *returnSize = 0;
    *returnColumnSizes = NULL;
    return NULL;
}
//@approach Iterative — Add to Existing
int** subsets(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {
    int total = 1 << numsSize;
    int** result = malloc(total * sizeof(int*));
    int* sizes = malloc(total * sizeof(int));
    int count = 1;
    result[0] = malloc(sizeof(int));     // start with the empty subset
    sizes[0] = 0;
    for (int k = 0; k < numsSize; k++) {
        int existing = count;
        for (int i = 0; i < existing; i++) {   // copy each subset + nums[k]
            int* s = malloc((sizes[i] + 1) * sizeof(int));
            memcpy(s, result[i], sizes[i] * sizeof(int));
            s[sizes[i]] = nums[k];
            result[count] = s;
            sizes[count++] = sizes[i] + 1;
        }
    }
    *returnSize = count;
    *returnColumnSizes = sizes;
    return result;
}
//@approach Backtracking
static int **res_, *sizes_, count_, *cur_, cur_len_;
static void backtrack(int* nums, int n, int start) {
    res_[count_] = malloc((cur_len_ + 1) * sizeof(int));   // COPY - critical
    memcpy(res_[count_], cur_, cur_len_ * sizeof(int));
    sizes_[count_++] = cur_len_;
    for (int i = start; i < n; i++) {
        cur_[cur_len_++] = nums[i];
        backtrack(nums, n, i + 1);
        cur_len_--;
    }
}
int** subsets(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {
    int total = 1 << numsSize;
    res_ = malloc(total * sizeof(int*));
    sizes_ = malloc(total * sizeof(int));
    cur_ = malloc((numsSize + 1) * sizeof(int));
    count_ = cur_len_ = 0;
    backtrack(nums, numsSize, 0);
    free(cur_);
    *returnSize = count_;
    *returnColumnSizes = sizes_;
    return res_;
}
//@approach Bit Manipulation
int** subsets(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {
    int n = numsSize, total = 1 << n;
    int** result = malloc(total * sizeof(int*));
    int* sizes = malloc(total * sizeof(int));
    for (int mask = 0; mask < total; mask++) {
        result[mask] = malloc((n + 1) * sizeof(int));
        sizes[mask] = 0;
        for (int i = 0; i < n; i++)
            if (mask & (1 << i)) result[mask][sizes[mask]++] = nums[i];
    }
    *returnSize = total;
    *returnColumnSizes = sizes;
    return result;
}
