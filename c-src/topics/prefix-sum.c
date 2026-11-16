//@code
#include <stdio.h>
#include <stdlib.h>

/* prefix[i] = sum of nums[0..i-1]; prefix has n + 1 entries. */
int* build_prefix(int nums[], int n) {
    int* prefix = malloc((n + 1) * sizeof(int));
    prefix[0] = 0;
    for (int i = 0; i < n; i++)
        prefix[i + 1] = prefix[i] + nums[i];
    return prefix;
}

int range_sum(int prefix[], int l, int r) {
    return prefix[r + 1] - prefix[l];
}

int main(void) {
    // Example
    int nums[] = {3, 1, 4, 1, 5, 9, 2, 6};
    int* prefix = build_prefix(nums, 8);     // O(n) preprocessing
    printf("%d\n", range_sum(prefix, 2, 5)); // 4+1+5+9 = 19, in O(1)
    free(prefix);
    return 0;
}
