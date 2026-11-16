//@spec {"fn": "findMin", "params": [{"name": "nums", "type": "int[]"}], "ret": "int"}
//@approach Linear Scan
int findMin(int* nums, int numsSize) {
    int best = nums[0];
    for (int i = 1; i < numsSize; i++)
        if (nums[i] < best) best = nums[i];
    return best;
}
//@approach Binary Search
int findMin(int* nums, int numsSize) {
    int left = 0, right = numsSize - 1;
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] > nums[right])
            left = mid + 1;   // minimum is in the right half (the dip happened after mid)
        else
            right = mid;      // right half is sorted; minimum is in [left, mid]
    }
    return nums[left];
}
