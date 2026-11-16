//@spec {"fn": "eraseOverlapIntervals", "params": [{"name": "intervals", "type": "int[][]"}], "ret": "int"}
//@approach Sort by End + Greedy
static int by_end(const void* a, const void* b) {
    int x = (*(int* const*)a)[1], y = (*(int* const*)b)[1];
    return (x > y) - (x < y);
}
int eraseOverlapIntervals(int** intervals, int intervalsSize, int* intervalsColSize) {
    qsort(intervals, intervalsSize, sizeof(int*), by_end);
    long long prev_end = LLONG_MIN;
    int removed = 0;
    for (int i = 0; i < intervalsSize; i++) {
        if (intervals[i][0] >= prev_end) prev_end = intervals[i][1];   // keep
        else removed++;                                                // remove this one
    }
    return removed;
}
