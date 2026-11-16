//@spec {"fn": "threeSum", "params": [{"name": "nums", "type": "int[]"}], "ret": "int[][]"}
//@approach Brute Force
// Try every triple; keep each sorted triplet once, then sort the list.
static int cmp_triplet(const void* a, const void* b) {
    const int* x = *(int* const*)a;
    const int* y = *(int* const*)b;
    for (int i = 0; i < 3; i++) if (x[i] != y[i]) return x[i] < y[i] ? -1 : 1;
    return 0;
}
int** threeSum(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {
    int cap = 16, n = 0;
    int** res = malloc(cap * sizeof(int*));
    for (int i = 0; i < numsSize; i++)
        for (int j = i + 1; j < numsSize; j++)
            for (int k = j + 1; k < numsSize; k++) {
                if (nums[i] + nums[j] + nums[k] != 0) continue;
                int t[3] = {nums[i], nums[j], nums[k]};
                for (int a = 0; a < 2; a++)          // sort the 3 values
                    for (int b = 0; b < 2 - a; b++)
                        if (t[b] > t[b + 1]) { int x = t[b]; t[b] = t[b + 1]; t[b + 1] = x; }
                bool dup = false;
                for (int m = 0; m < n && !dup; m++)
                    dup = res[m][0] == t[0] && res[m][1] == t[1] && res[m][2] == t[2];
                if (dup) continue;
                if (n == cap) res = realloc(res, (cap *= 2) * sizeof(int*));
                res[n] = malloc(3 * sizeof(int));
                memcpy(res[n++], t, sizeof t);
            }
    qsort(res, n, sizeof(int*), cmp_triplet);
    *returnSize = n;
    *returnColumnSizes = malloc((n + 1) * sizeof(int));
    for (int i = 0; i < n; i++) (*returnColumnSizes)[i] = 3;
    return res;
}
//@approach Sort + Two Pointers
static int cmp_int(const void* a, const void* b) {
    int x = *(const int*)a, y = *(const int*)b;
    return (x > y) - (x < y);
}
int** threeSum(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {
    qsort(nums, numsSize, sizeof(int), cmp_int);
    int cap = 16, n = 0;
    int** res = malloc(cap * sizeof(int*));
    for (int i = 0; i < numsSize - 2; i++) {
        if (i > 0 && nums[i] == nums[i - 1]) continue;    // skip duplicate i
        int left = i + 1, right = numsSize - 1;
        while (left < right) {
            int s = nums[i] + nums[left] + nums[right];
            if (s == 0) {
                if (n == cap) res = realloc(res, (cap *= 2) * sizeof(int*));
                res[n] = malloc(3 * sizeof(int));
                res[n][0] = nums[i]; res[n][1] = nums[left]; res[n][2] = nums[right];
                n++;
                while (left < right && nums[left] == nums[left + 1]) left++;    // skip dup left
                while (left < right && nums[right] == nums[right - 1]) right--; // skip dup right
                left++;
                right--;
            } else if (s < 0) {
                left++;
            } else {
                right--;
            }
        }
    }
    *returnSize = n;
    *returnColumnSizes = malloc((n + 1) * sizeof(int));
    for (int i = 0; i < n; i++) (*returnColumnSizes)[i] = 3;
    return res;
}
