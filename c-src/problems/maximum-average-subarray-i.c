//@spec {"fn": "findMaxAverage", "params": [{"name": "nums", "type": "int[]"}, {"name": "k", "type": "int"}], "ret": "double"}
//@approach Sliding Window
double findMaxAverage(int* nums, int numsSize, int k) {
    long long window_sum = 0;
    for (int i = 0; i < k; i++) window_sum += nums[i];
    long long max_sum = window_sum;
    for (int i = k; i < numsSize; i++) {
        window_sum += nums[i] - nums[i - k];
        if (window_sum > max_sum) max_sum = window_sum;
    }
    return (double)max_sum / k;
}
//@approach Brute Force (Don't ship this)
double findMaxAverage(int* nums, int numsSize, int k) {
    long long max_sum = 0;
    for (int j = 0; j < k; j++) max_sum += nums[j];
    for (int i = 1; i + k <= numsSize; i++) {
        long long s = 0;
        for (int j = i; j < i + k; j++) s += nums[j];   // re-sum every window
        if (s > max_sum) max_sum = s;
    }
    return (double)max_sum / k;
}
