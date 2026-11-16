//@spec {"fn": "rob", "params": [{"name": "nums", "type": "int[]"}], "ret": "int"}
//@approach Iterative DP, O(1) Space
int rob(int* nums, int numsSize) {
    if (numsSize == 0) return 0;
    if (numsSize == 1) return nums[0];
    int prev2 = 0;                           // max rob through index -1 (none)
    int prev1 = nums[0];
    for (int i = 1; i < numsSize; i++) {
        int cur = prev1 > prev2 + nums[i] ? prev1 : prev2 + nums[i];
        prev2 = prev1;
        prev1 = cur;
    }
    return prev1;
}
