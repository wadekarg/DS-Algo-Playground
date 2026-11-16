//@spec {"fn": "rob", "params": [{"name": "nums", "type": "int[]"}], "ret": "int"}
//@approach Two-Slice Reduction
static int linear_rob(int* arr, int n) {
    int prev2 = 0, prev1 = 0;
    for (int i = 0; i < n; i++) {
        int cur = prev1 > prev2 + arr[i] ? prev1 : prev2 + arr[i];
        prev2 = prev1;
        prev1 = cur;
    }
    return prev1;
}
int rob(int* nums, int numsSize) {
    if (numsSize == 1) return nums[0];
    // Either skip the first house or skip the last; take the max.
    int skip_first = linear_rob(nums + 1, numsSize - 1);
    int skip_last = linear_rob(nums, numsSize - 1);
    return skip_first > skip_last ? skip_first : skip_last;
}
