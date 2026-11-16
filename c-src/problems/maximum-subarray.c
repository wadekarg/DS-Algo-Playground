//@spec {"fn": "maxSubArray", "params": [{"name": "nums", "type": "int[]"}], "ret": "int"}
//@approach Brute Force
int maxSubArray(int* nums, int numsSize) {
    int best = nums[0];
    for (int i = 0; i < numsSize; i++) {
        int s = 0;
        for (int j = i; j < numsSize; j++) {
            s += nums[j];
            if (s > best) best = s;
        }
    }
    return best;
}
//@approach Kadane's Algorithm
int maxSubArray(int* nums, int numsSize) {
    int best = nums[0], cur = nums[0];
    for (int i = 1; i < numsSize; i++) {
        cur = nums[i] > cur + nums[i] ? nums[i] : cur + nums[i];  // extend or restart
        if (cur > best) best = cur;
    }
    return best;
}
