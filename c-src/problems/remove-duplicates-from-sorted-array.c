//@spec {"fn": "removeDuplicates", "params": [{"name": "nums", "type": "int[]"}], "ret": "int"}
//@starter
// Modify nums so the first k slots hold the unique values in sorted order.
// Return k (the count of unique values).
int removeDuplicates(int* nums, int numsSize) {
    // Your code here
    return 0;
}
//@approach Two Pointers (Slow/Fast)
int removeDuplicates(int* nums, int numsSize) {
    if (numsSize == 0) return 0;
    int slow = 1;
    for (int fast = 1; fast < numsSize; fast++) {
        if (nums[fast] != nums[slow - 1]) {
            nums[slow] = nums[fast];
            slow++;
        }
    }
    return slow;
}
