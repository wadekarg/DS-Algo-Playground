//@spec {"fn": "containsDuplicate", "params": [{"name": "nums", "type": "int[]"}], "ret": "bool"}
//@approach Brute Force
bool containsDuplicate(int* nums, int numsSize) {
    for (int i = 0; i < numsSize; i++)
        for (int j = i + 1; j < numsSize; j++)
            if (nums[i] == nums[j]) return true;
    return false;
}
//@approach Hash Set
// Open-addressing hash set (C has no built-in set).
bool containsDuplicate(int* nums, int numsSize) {
    int cap = 1;
    while (cap < 2 * numsSize) cap <<= 1;
    int* keys = malloc(cap * sizeof(int));
    bool* used = calloc(cap, sizeof(bool));
    bool dup = false;
    for (int i = 0; i < numsSize && !dup; i++) {
        unsigned h = ((unsigned)nums[i] * 2654435761u) & (cap - 1);
        while (used[h] && keys[h] != nums[i]) h = (h + 1) & (cap - 1);
        if (used[h]) dup = true;              // already seen
        else { used[h] = true; keys[h] = nums[i]; }
    }
    free(keys); free(used);
    return dup;
}
//@approach Sort + Adjacent Scan (O(1) space)
static int cmp_int(const void* a, const void* b) {
    int x = *(const int*)a, y = *(const int*)b;
    return (x > y) - (x < y);
}
bool containsDuplicate(int* nums, int numsSize) {
    qsort(nums, numsSize, sizeof(int), cmp_int);
    for (int i = 1; i < numsSize; i++)
        if (nums[i] == nums[i - 1]) return true;
    return false;
}
