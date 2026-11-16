//@spec {"fn": "findDuplicate", "params": [{"name": "nums", "type": "int[]"}], "ret": "int"}
//@approach Floyd's on Implicit Graph
int findDuplicate(int* nums, int numsSize) {
    // Treat i -> nums[i] as a linked list; the duplicate is the cycle entrance.
    int slow = nums[0], fast = nums[0];
    do {                                     // Phase 1: find a meeting point
        slow = nums[slow];
        fast = nums[nums[fast]];
    } while (slow != fast);
    int slow2 = nums[0];                     // Phase 2: walk to the entrance
    while (slow2 != slow) {
        slow = nums[slow];
        slow2 = nums[slow2];
    }
    return slow;
}
