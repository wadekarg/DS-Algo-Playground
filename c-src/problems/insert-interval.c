//@spec {"fn": "insert", "params": [{"name": "intervals", "type": "int[][]"}, {"name": "newInterval", "type": "int[]"}], "ret": "int[][]"}
//@approach Three-Phase Pass
static int* pair(int a, int b) { int* p = malloc(2 * sizeof(int)); p[0] = a; p[1] = b; return p; }
int** insert(int** intervals, int intervalsSize, int* intervalsColSize, int* newInterval, int newIntervalSize,
             int* returnSize, int** returnColumnSizes) {
    int n = intervalsSize, i = 0, k = 0;
    int** result = malloc((n + 1) * sizeof(int*));
    int lo = newInterval[0], hi = newInterval[1];
    // Phase 1: intervals entirely before newInterval
    while (i < n && intervals[i][1] < lo) { result[k++] = pair(intervals[i][0], intervals[i][1]); i++; }
    // Phase 2: merge overlapping
    while (i < n && intervals[i][0] <= hi) {
        if (intervals[i][0] < lo) lo = intervals[i][0];
        if (intervals[i][1] > hi) hi = intervals[i][1];
        i++;
    }
    result[k++] = pair(lo, hi);
    // Phase 3: intervals entirely after
    while (i < n) { result[k++] = pair(intervals[i][0], intervals[i][1]); i++; }
    *returnSize = k;
    *returnColumnSizes = malloc(k * sizeof(int));
    for (int j = 0; j < k; j++) (*returnColumnSizes)[j] = 2;
    return result;
}
