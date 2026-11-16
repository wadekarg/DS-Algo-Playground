//@code
#include <stdio.h>
#include <stdlib.h>

/* All subsets of nums via backtracking. Results are stored in out[][];
   out_len[k] is the size of subset k. Returns the number of subsets. */
static int n_nums, *nums_, *current, cur_len;
static int** out; static int* out_len; static int out_count;

static void backtrack(int start) {
    // record a copy of the current subset
    out[out_count] = malloc((cur_len + 1) * sizeof(int));
    for (int i = 0; i < cur_len; i++) out[out_count][i] = current[i];
    out_len[out_count++] = cur_len;

    for (int i = start; i < n_nums; i++) {
        current[cur_len++] = nums_[i];   // choose
        backtrack(i + 1);                // explore
        cur_len--;                       // un-choose (backtrack)
    }
}

int subsets(int nums[], int n) {
    n_nums = n; nums_ = nums; cur_len = 0; out_count = 0;
    current = malloc((n + 1) * sizeof(int));
    out = malloc((1 << n) * sizeof(int*));
    out_len = malloc((1 << n) * sizeof(int));
    backtrack(0);
    free(current);
    return out_count;
}

int main(void) {
    int nums[] = {1, 2, 3};
    int count = subsets(nums, 3);
    printf("[");
    for (int k = 0; k < count; k++) {
        printf(k ? ", [" : "[");
        for (int i = 0; i < out_len[k]; i++) printf(i ? ", %d" : "%d", out[k][i]);
        printf("]");
    }
    printf("]\n");
    return 0;
}
//@expect-output
[[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]]
