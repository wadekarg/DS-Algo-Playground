//@spec {"fn": "search", "params": [{"name": "nums", "type": "int[]"}, {"name": "target", "type": "int"}], "ret": "int"}
//@approach Linear Scan
int search(int* nums, int numsSize, int target) {
    for (int i = 0; i < numsSize; i++)
        if (nums[i] == target) return i;
    return -1;
}
//@approach Modified Binary Search
int search(int* nums, int numsSize, int target) {
    int left = 0, right = numsSize - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;
        // Determine which half is sorted
        if (nums[left] <= nums[mid]) {
            // Left half is sorted
            if (nums[left] <= target && target < nums[mid]) right = mid - 1;
            else left = mid + 1;
        } else {
            // Right half is sorted
            if (nums[mid] < target && target <= nums[right]) left = mid + 1;
            else right = mid - 1;
        }
    }
    return -1;
}
//@approach Find Pivot Then Binary Search (Two-Pass)
int search(int* nums, int numsSize, int target) {
    int n = numsSize;
    // First pass: find pivot (index of smallest element)
    int left = 0, right = n - 1;
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] > nums[right]) left = mid + 1;
        else right = mid;
    }
    int pivot = left;
    // Second pass: standard binary search in the correct half
    if (target >= nums[pivot] && target <= nums[n - 1]) { left = pivot; right = n - 1; }
    else { left = 0; right = pivot - 1; }
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;
        else if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}
