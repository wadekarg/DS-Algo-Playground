//@spec {"fn": "firstMissingPositive", "params": [{"name": "nums", "type": "int[]"}], "ret": "int"}
//@approach Hash Set (O(n) space)
// Only 1..n can be the answer's predecessors, so a bool array works as the set.
int firstMissingPositive(int* nums, int numsSize) {
    bool* seen = calloc(numsSize + 2, sizeof(bool));
    for (int i = 0; i < numsSize; i++)
        if (nums[i] >= 1 && nums[i] <= numsSize) seen[nums[i]] = true;
    int i = 1;
    while (i <= numsSize && seen[i]) i++;
    free(seen);
    return i;
}
//@approach Cyclic Sort (O(1) space)
int firstMissingPositive(int* nums, int numsSize) {
    int n = numsSize, i = 0;
    while (i < n) {
        int target = nums[i] - 1;   // where nums[i] should live
        if (nums[i] >= 1 && nums[i] <= n && nums[target] != nums[i]) {
            int t = nums[i]; nums[i] = nums[target]; nums[target] = t;
        } else {
            i++;
        }
    }
    for (i = 0; i < n; i++)
        if (nums[i] != i + 1) return i + 1;
    return n + 1;
}
//@approach Sign Marking (O(1) space, alt)
int firstMissingPositive(int* nums, int numsSize) {
    int n = numsSize;
    // Pass 1: replace non-positives with n+1 (sentinel)
    for (int i = 0; i < n; i++)
        if (nums[i] <= 0) nums[i] = n + 1;
    // Pass 2: for each in-range value, negate the slot at index (value-1)
    for (int i = 0; i < n; i++) {
        int val = abs(nums[i]);
        if (val <= n) nums[val - 1] = -abs(nums[val - 1]);
    }
    // Pass 3: first positive slot is the answer
    for (int i = 0; i < n; i++)
        if (nums[i] > 0) return i + 1;
    return n + 1;
}
