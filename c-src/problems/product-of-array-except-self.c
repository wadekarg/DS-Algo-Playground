//@spec {"fn": "productExceptSelf", "params": [{"name": "nums", "type": "int[]"}], "ret": "int[]"}
//@approach Brute Force
int* productExceptSelf(int* nums, int numsSize, int* returnSize) {
    int* result = malloc(numsSize * sizeof(int));
    for (int i = 0; i < numsSize; i++) {
        result[i] = 1;
        for (int j = 0; j < numsSize; j++)
            if (i != j) result[i] *= nums[j];
    }
    *returnSize = numsSize;
    return result;
}
//@approach Prefix and Suffix Arrays
int* productExceptSelf(int* nums, int numsSize, int* returnSize) {
    int* prefix = malloc(numsSize * sizeof(int));
    int* suffix = malloc(numsSize * sizeof(int));
    int* result = malloc(numsSize * sizeof(int));
    prefix[0] = 1;
    for (int i = 1; i < numsSize; i++) prefix[i] = prefix[i - 1] * nums[i - 1];
    suffix[numsSize - 1] = 1;
    for (int i = numsSize - 2; i >= 0; i--) suffix[i] = suffix[i + 1] * nums[i + 1];
    for (int i = 0; i < numsSize; i++) result[i] = prefix[i] * suffix[i];
    free(prefix); free(suffix);
    *returnSize = numsSize;
    return result;
}
//@approach O(1) Extra Space (reuse output)
int* productExceptSelf(int* nums, int numsSize, int* returnSize) {
    int* result = malloc(numsSize * sizeof(int));
    // First pass: result[i] = prefix product (everything before i)
    result[0] = 1;
    for (int i = 1; i < numsSize; i++) result[i] = result[i - 1] * nums[i - 1];
    // Second pass: walk right-to-left, multiply by running suffix product
    int suffix = 1;
    for (int i = numsSize - 1; i >= 0; i--) {
        result[i] *= suffix;
        suffix *= nums[i];
    }
    *returnSize = numsSize;
    return result;
}
