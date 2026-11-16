//@spec {"fn": "twoSum", "params": [{"name": "nums", "type": "int[]"}, {"name": "target", "type": "int"}], "ret": "int[]"}
//@approach Brute Force
int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    for (int i = 0; i < numsSize; i++) {
        for (int j = i + 1; j < numsSize; j++) {
            if (nums[i] + nums[j] == target) {
                int* res = malloc(2 * sizeof(int));
                res[0] = i;
                res[1] = j;
                *returnSize = 2;
                return res;
            }
        }
    }
    *returnSize = 0;
    return NULL;
}
//@approach Hash Map
// C has no built-in hash map, so we use a small open-addressing table:
// keys[] holds values seen so far, idx[] the index where each was seen.
int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    int cap = 1;
    while (cap < 2 * numsSize) cap <<= 1;          // power of two, load <= 50%
    long long* keys = malloc(cap * sizeof(long long));
    int* idx = malloc(cap * sizeof(int));
    bool* used = calloc(cap, sizeof(bool));
    int* res = malloc(2 * sizeof(int));
    *returnSize = 0;

    for (int i = 0; i < numsSize; i++) {
        long long complement = (long long)target - nums[i];
        // look up complement
        unsigned h = (unsigned)(complement * 2654435761u) & (cap - 1);
        while (used[h] && keys[h] != complement) h = (h + 1) & (cap - 1);
        if (used[h]) {
            res[0] = idx[h];
            res[1] = i;
            *returnSize = 2;
            break;
        }
        // insert nums[i] -> i
        h = (unsigned)((long long)nums[i] * 2654435761u) & (cap - 1);
        while (used[h] && keys[h] != nums[i]) h = (h + 1) & (cap - 1);
        used[h] = true;
        keys[h] = nums[i];
        idx[h] = i;
    }
    free(keys); free(idx); free(used);
    return res;
}
