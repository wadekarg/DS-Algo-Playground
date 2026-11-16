//@code
#include <stdio.h>
#include <stdlib.h>

typedef struct { int start, end; } Interval;

static int by_start(const void* a, const void* b) {
    return ((const Interval*)a)->start - ((const Interval*)b)->start;
}

// ── Merge Overlapping Intervals ───────────────────────────────
// Writes merged intervals to out[]; returns how many.
int merge(Interval iv[], int n, Interval out[]) {
    if (n == 0) return 0;
    qsort(iv, n, sizeof(Interval), by_start);
    int m = 0;
    out[m++] = iv[0];
    for (int i = 1; i < n; i++) {
        if (iv[i].start <= out[m - 1].end) {          // overlaps
            if (iv[i].end > out[m - 1].end) out[m - 1].end = iv[i].end;
        } else {
            out[m++] = iv[i];
        }
    }
    return m;
}

// ── Insert Interval (intervals sorted, non-overlapping) ────────
int insert(Interval iv[], int n, Interval nw, Interval out[]) {
    int m = 0, i = 0;
    while (i < n && iv[i].end < nw.start) out[m++] = iv[i++];   // fully before
    while (i < n && iv[i].start <= nw.end) {                     // overlapping: merge
        if (iv[i].start < nw.start) nw.start = iv[i].start;
        if (iv[i].end > nw.end) nw.end = iv[i].end;
        i++;
    }
    out[m++] = nw;
    while (i < n) out[m++] = iv[i++];                            // fully after
    return m;
}

// ── Meeting Rooms II (min rooms needed) — sweep line ──────────
static int cmp_int(const void* a, const void* b) {
    return *(const int*)a - *(const int*)b;
}
int min_meeting_rooms(Interval iv[], int n) {
    int* starts = malloc(n * sizeof(int));
    int* ends = malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) { starts[i] = iv[i].start; ends[i] = iv[i].end; }
    qsort(starts, n, sizeof(int), cmp_int);
    qsort(ends, n, sizeof(int), cmp_int);
    int rooms = 0, best = 0, e = 0;
    for (int s = 0; s < n; s++) {
        if (starts[s] >= ends[e]) e++;   // a meeting ended: reuse its room
        else rooms++;                    // need a new room
        if (rooms > best) best = rooms;
    }
    free(starts); free(ends);
    return best;
}

static void print_all(const char* label, Interval* iv, int n) {
    printf("%s", label);
    for (int i = 0; i < n; i++) printf(" [%d,%d]", iv[i].start, iv[i].end);
    printf("\n");
}

int main(void) {
    Interval a[] = {{1, 3}, {2, 6}, {8, 10}, {15, 18}}, out[8];
    print_all("merge:", out, merge(a, 4, out));
    Interval b[] = {{1, 3}, {6, 9}};
    print_all("insert [2,5]:", out, insert(b, 2, (Interval){2, 5}, out));
    Interval c[] = {{0, 30}, {5, 10}, {15, 20}};
    printf("meeting rooms: %d\n", min_meeting_rooms(c, 3));
    return 0;
}
//@expect-output
merge: [1,6] [8,10] [15,18]
insert [2,5]: [1,5] [6,9]
meeting rooms: 2
//@trace-prelude
typedef struct { int start, end; } Interval;
int by_start(const void* a, const void* b);
//@trace
int merge(Interval iv[], int n, Interval merged[]) {
    qsort(iv, n, sizeof(Interval), by_start);
    int m = 0;
    merged[m++] = iv[0];
    for (int i = 1; i < n; i++) {
        Interval* last = &merged[m - 1];
        if (iv[i].start <= last->end) {         // overlap
            if (iv[i].end > last->end) last->end = iv[i].end;
        } else {
            merged[m++] = iv[i];
        }
    }
    return m;
}
//@trace-python
def merge(intervals):
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for curr in intervals[1:]:
        last = merged[-1]
        if curr[0] <= last[1]:           # overlap
            last[1] = max(last[1], curr[1])
        else:
            merged.append(curr)
    return merged
//@trace-map 1:1 2:2 3:3-4 4:5 5:6 6:7 7:8 8:9 9:10 10:13
