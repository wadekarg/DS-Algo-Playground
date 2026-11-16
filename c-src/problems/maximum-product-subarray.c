//@spec {"fn": "maxProduct", "params": [{"name": "nums", "type": "int[]"}], "ret": "int"}
//@approach Kadane's with Min and Max Tracking
int maxProduct(int* nums, int numsSize) {
    long long result = nums[0], max_so_far = nums[0], min_so_far = nums[0];
    for (int i = 1; i < numsSize; i++) {
        long long x = nums[i];
        // Candidates must be computed before overwriting either tracker
        long long a = x, b = max_so_far * x, c = min_so_far * x;
        max_so_far = a > b ? (a > c ? a : c) : (b > c ? b : c);
        min_so_far = a < b ? (a < c ? a : c) : (b < c ? b : c);
        if (max_so_far > result) result = max_so_far;
    }
    return (int)result;
}
