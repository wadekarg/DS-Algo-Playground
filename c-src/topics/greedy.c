//@code
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <limits.h>

// ── Jump Game (greedy: track max reachable index) ─────────────
bool can_jump(int nums[], int n) {
    int max_reach = 0;
    for (int i = 0; i < n; i++) {
        if (i > max_reach) return false;      // can't reach index i
        if (i + nums[i] > max_reach) max_reach = i + nums[i];
    }
    return true;
}

typedef struct { int start, end; } Interval;

static int by_start(const void* a, const void* b) {
    return ((const Interval*)a)->start - ((const Interval*)b)->start;
}
static int by_end(const void* a, const void* b) {
    return ((const Interval*)a)->end - ((const Interval*)b)->end;
}

// ── Merge Intervals (sort + greedy merge) ─────────────────────
// Merges in place; returns the new count.
int merge(Interval iv[], int n) {
    if (n == 0) return 0;
    qsort(iv, n, sizeof(Interval), by_start);
    int m = 0;
    for (int i = 1; i < n; i++) {
        if (iv[i].start <= iv[m].end) {
            if (iv[i].end > iv[m].end) iv[m].end = iv[i].end;  // overlap -> extend
        } else {
            iv[++m] = iv[i];                                   // no overlap -> new
        }
    }
    return m + 1;
}

// ── Interval Scheduling (greedy: pick earliest end time) ──────
int max_non_overlapping(Interval iv[], int n) {
    qsort(iv, n, sizeof(Interval), by_end);   // sort by END time
    int count = 0, last_end = INT_MIN;
    for (int i = 0; i < n; i++) {
        if (iv[i].start >= last_end) {
            count++;
            last_end = iv[i].end;
        }
    }
    return count;
}

int main(void) {
    int a[] = {2, 3, 1, 1, 4}, b[] = {3, 2, 1, 0, 4};
    printf("can_jump [2,3,1,1,4]: %s\n", can_jump(a, 5) ? "true" : "false");
    printf("can_jump [3,2,1,0,4]: %s\n", can_jump(b, 5) ? "true" : "false");

    Interval iv[] = {{1, 3}, {8, 10}, {2, 6}, {15, 18}};
    int m = merge(iv, 4);
    printf("merged:");
    for (int i = 0; i < m; i++) printf(" [%d,%d]", iv[i].start, iv[i].end);
    printf("\n");

    Interval jobs[] = {{1, 2}, {2, 3}, {3, 4}, {1, 3}};
    printf("max non-overlapping: %d\n", max_non_overlapping(jobs, 4));
    return 0;
}
//@expect-output
can_jump [2,3,1,1,4]: true
can_jump [3,2,1,0,4]: false
merged: [1,6] [8,10] [15,18]
max non-overlapping: 3
//@trace
bool can_jump(int nums[], int n) {
    int max_reach = 0;
    for (int i = 0; i < n; i++) {
        if (i > max_reach)     // stuck
            return false;
        if (i + nums[i] > max_reach) max_reach = i + nums[i];
    }
    return true;
}
//@trace-python
def can_jump(nums):
    max_reach = 0
    for i, n in enumerate(nums):
        if i > max_reach:      # stuck
            return False
        max_reach = max(max_reach, i + n)
    return True
//@trace-map 1:1 2:2 3:3 4:4 5:5 6:6 7:8
