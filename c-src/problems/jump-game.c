//@spec {"fn": "canJump", "params": [{"name": "nums", "type": "int[]"}], "ret": "bool"}
//@approach Greedy Max-Reach
bool canJump(int* nums, int numsSize) {
    int max_reach = 0;
    for (int i = 0; i < numsSize; i++) {
        if (i > max_reach) return false;      // stuck before index i
        if (i + nums[i] > max_reach) max_reach = i + nums[i];
        if (max_reach >= numsSize - 1) return true;
    }
    return true;
}
