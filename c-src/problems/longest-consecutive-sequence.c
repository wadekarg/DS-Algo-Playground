//@spec {"fn": "longestConsecutive", "params": [{"name": "nums", "type": "int[]"}], "ret": "int"}
//@approach Sort and Scan
static int cmp_int(const void* a, const void* b) {
    int x = *(const int*)a, y = *(const int*)b;
    return (x > y) - (x < y);
}
int longestConsecutive(int* nums, int numsSize) {
    if (numsSize == 0) return 0;
    qsort(nums, numsSize, sizeof(int), cmp_int);
    int best = 1, cur = 1;
    for (int i = 1; i < numsSize; i++) {
        if (nums[i] == nums[i - 1]) continue;          // duplicates don't break a run
        if (nums[i] == nums[i - 1] + 1) {
            cur++;
            if (cur > best) best = cur;
        } else {
            cur = 1;
        }
    }
    return best;
}
//@approach Hash Set with Start-Detection
// Open-addressing hash set of the values.
static int cap_, *keys_; static bool* used_;
static unsigned slot(int x) {
    unsigned h = ((unsigned)x * 2654435761u) & (cap_ - 1);
    while (used_[h] && keys_[h] != x) h = (h + 1) & (cap_ - 1);
    return h;
}
static bool contains(long long x) {
    if (x < INT_MIN || x > INT_MAX) return false;
    return used_[slot((int)x)];
}
int longestConsecutive(int* nums, int numsSize) {
    cap_ = 1;
    while (cap_ < 2 * numsSize) cap_ <<= 1;
    keys_ = malloc(cap_ * sizeof(int));
    used_ = calloc(cap_, sizeof(bool));
    for (int i = 0; i < numsSize; i++) {
        unsigned h = slot(nums[i]);
        used_[h] = true; keys_[h] = nums[i];
    }
    int best = 0;
    for (int i = 0; i < numsSize; i++) {
        long long num = nums[i];
        if (contains(num - 1)) continue;   // only start counting from sequence starts
        int length = 1;
        while (contains(num + length)) length++;
        if (length > best) best = length;
    }
    free(keys_); free(used_);
    return best;
}
