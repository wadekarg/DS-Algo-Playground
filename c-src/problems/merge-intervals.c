//@spec {"fn": "merge", "params": [{"name": "intervals", "type": "int[][]"}], "ret": "int[][]"}
//@approach Sort + Sweep
static int by_start(const void* a, const void* b) {
    int x = (*(int* const*)a)[0], y = (*(int* const*)b)[0];
    return (x > y) - (x < y);
}
int** merge(int** intervals, int intervalsSize, int* intervalsColSize, int* returnSize, int** returnColumnSizes) {
    qsort(intervals, intervalsSize, sizeof(int*), by_start);   // sorts the row pointers
    int** result = malloc((intervalsSize + 1) * sizeof(int*));
    int k = 0;
    for (int i = 0; i < intervalsSize; i++) {
        int s = intervals[i][0], e = intervals[i][1];
        if (k > 0 && s <= result[k - 1][1]) {
            if (e > result[k - 1][1]) result[k - 1][1] = e;   // overlap: extend
        } else {
            result[k] = malloc(2 * sizeof(int));
            result[k][0] = s; result[k][1] = e;
            k++;
        }
    }
    *returnSize = k;
    *returnColumnSizes = malloc((k + 1) * sizeof(int));
    for (int j = 0; j < k; j++) (*returnColumnSizes)[j] = 2;
    return result;
}
