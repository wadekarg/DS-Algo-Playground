//@spec {"fn": "search", "params": [{"name": "nums", "type": "int[]"}, {"name": "target", "type": "int"}], "ret": "int"}
//@approach Linear Scan (Wrong Tool)
int search(int* nums, int numsSize, int target) {
    for (int i = 0; i < numsSize; i++)
        if (nums[i] == target) return i;
    return -1;
}
//@approach Iterative Binary Search
int search(int* nums, int numsSize, int target) {
    int left = 0, right = numsSize - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;   // overflow-safe
        if (nums[mid] == target) return mid;
        else if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}
//@approach Recursive Binary Search
static int helper(int* nums, int left, int right, int target) {
    if (left > right) return -1;
    int mid = left + (right - left) / 2;
    if (nums[mid] == target) return mid;
    if (nums[mid] < target) return helper(nums, mid + 1, right, target);
    return helper(nums, left, mid - 1, target);
}
int search(int* nums, int numsSize, int target) {
    return helper(nums, 0, numsSize - 1, target);
}
