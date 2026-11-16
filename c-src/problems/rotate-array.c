//@spec {"fn": "rotate", "params": [{"name": "nums", "type": "int[]"}, {"name": "k", "type": "int"}], "ret": "void", "print": "nums"}
//@starter
// Rotate nums to the right by k steps, in place.
// (The test harness prints nums after your function returns.)
void rotate(int* nums, int numsSize, int k) {
    // Your code here
}
//@approach Extra Array
void rotate(int* nums, int numsSize, int k) {
    k %= numsSize;
    int* rotated = malloc(numsSize * sizeof(int));
    for (int i = 0; i < numsSize; i++) rotated[(i + k) % numsSize] = nums[i];
    for (int i = 0; i < numsSize; i++) nums[i] = rotated[i];
    free(rotated);
}
//@approach Three Reverses (in-place)
static void reverse(int* nums, int lo, int hi) {
    while (lo < hi) {
        int t = nums[lo]; nums[lo] = nums[hi]; nums[hi] = t;
        lo++; hi--;
    }
}
void rotate(int* nums, int numsSize, int k) {
    k %= numsSize;
    reverse(nums, 0, numsSize - 1);   // reverse whole array
    reverse(nums, 0, k - 1);          // reverse first k
    reverse(nums, k, numsSize - 1);   // reverse last n-k
}
//@approach Cyclic Replacement
void rotate(int* nums, int numsSize, int k) {
    int n = numsSize;
    k %= n;
    int count = 0;
    for (int start = 0; count < n; start++) {
        int current = start, prev = nums[start];
        do {
            int next = (current + k) % n;
            int t = nums[next]; nums[next] = prev; prev = t;
            current = next;
            count++;
        } while (current != start);
    }
}
