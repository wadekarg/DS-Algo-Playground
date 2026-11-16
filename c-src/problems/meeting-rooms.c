//@spec {"fn": "canAttendMeetings", "params": [{"name": "intervals", "type": "int[][]"}], "ret": "bool"}
//@approach Sort + Adjacent Check
static int by_start(const void* a, const void* b) {
    int x = (*(int* const*)a)[0], y = (*(int* const*)b)[0];
    return (x > y) - (x < y);
}
bool canAttendMeetings(int** intervals, int intervalsSize, int* intervalsColSize) {
    qsort(intervals, intervalsSize, sizeof(int*), by_start);
    for (int i = 1; i < intervalsSize; i++)
        if (intervals[i][0] < intervals[i - 1][1]) return false;
    return true;
}
