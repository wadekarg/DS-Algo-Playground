//@spec {"fn": "minMeetingRooms", "params": [{"name": "intervals", "type": "int[][]"}], "ret": "int"}
//@approach Min-Heap of End Times
static int by_start(const void* a, const void* b) {
    int x = (*(int* const*)a)[0], y = (*(int* const*)b)[0];
    return (x > y) - (x < y);
}
static void push(int* h, int* n, int v) {
    int i = (*n)++;
    h[i] = v;
    while (i > 0 && h[(i - 1) / 2] > h[i]) { int p = (i - 1) / 2, t = h[i]; h[i] = h[p]; h[p] = t; i = p; }
}
static void pop(int* h, int* n) {
    h[0] = h[--(*n)];
    for (int i = 0;;) {
        int s = i, l = 2 * i + 1, r = l + 1;
        if (l < *n && h[l] < h[s]) s = l;
        if (r < *n && h[r] < h[s]) s = r;
        if (s == i) break;
        int t = h[i]; h[i] = h[s]; h[s] = t;
        i = s;
    }
}
int minMeetingRooms(int** intervals, int intervalsSize, int* intervalsColSize) {
    qsort(intervals, intervalsSize, sizeof(int*), by_start);
    int* heap = malloc((intervalsSize + 1) * sizeof(int));   // end times of rooms in use
    int n = 0;
    for (int i = 0; i < intervalsSize; i++) {
        if (n && heap[0] <= intervals[i][0]) pop(heap, &n);   // earliest room is free: reuse
        push(heap, &n, intervals[i][1]);
    }
    free(heap);
    return n;
}
