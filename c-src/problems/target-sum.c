//@spec {"fn": "findTargetSumWays", "params": [{"name": "nums", "type": "int[]"}, {"name": "target", "type": "int"}], "ret": "int"}
//@approach Memoization on (index, sum)
// Running sums lie in [-total, total], so memo is a 2D array offset by total.
static int n_, total_, target_, *nums_, *memo_;   // memo_ == -1: not computed
static int go(int i, int s) {
    if (i == n_) return s == target_ ? 1 : 0;
    int* m = &memo_[i * (2 * total_ + 1) + s + total_];
    if (*m == -1) *m = go(i + 1, s + nums_[i]) + go(i + 1, s - nums_[i]);
    return *m;
}
int findTargetSumWays(int* nums, int numsSize, int target) {
    n_ = numsSize; nums_ = nums; target_ = target; total_ = 0;
    for (int i = 0; i < numsSize; i++) total_ += nums[i];
    int cells = numsSize * (2 * total_ + 1) + 1;
    memo_ = malloc(cells * sizeof(int));
    for (int i = 0; i < cells; i++) memo_[i] = -1;
    int ans = go(0, 0);
    free(memo_);
    return ans;
}
//@approach Subset-Sum Reduction
int findTargetSumWays(int* nums, int numsSize, int target) {
    int total = 0;
    for (int i = 0; i < numsSize; i++) total += nums[i];
    // Need (total + target) even and |target| <= total
    if ((total + target) % 2 != 0 || abs(target) > total) return 0;
    int P = (total + target) / 2;            // sum of the numbers that get '+'
    int* dp = calloc(P + 1, sizeof(int));
    dp[0] = 1;
    for (int i = 0; i < numsSize; i++)
        for (int j = P; j >= nums[i]; j--)
            dp[j] += dp[j - nums[i]];
    int ans = dp[P];
    free(dp);
    return ans;
}
