//@spec {"fn": "minEatingSpeed", "params": [{"name": "piles", "type": "int[]"}, {"name": "h", "type": "int"}], "ret": "int"}
//@approach Linear Scan (Brute Force)
int minEatingSpeed(int* piles, int pilesSize, int h) {
    int max_pile = 0;
    for (int i = 0; i < pilesSize; i++) if (piles[i] > max_pile) max_pile = piles[i];
    for (int k = 1; k <= max_pile; k++) {
        long long hours = 0;
        for (int i = 0; i < pilesSize; i++) hours += (piles[i] + k - 1) / k;   // ceil
        if (hours <= h) return k;
    }
    return max_pile;
}
//@approach Binary Search on Answer
static bool feasible(int* piles, int n, int h, int k) {
    long long hours = 0;
    for (int i = 0; i < n; i++) hours += (piles[i] + (long long)k - 1) / k;
    return hours <= h;
}
int minEatingSpeed(int* piles, int pilesSize, int h) {
    int lo = 1, hi = 0;
    for (int i = 0; i < pilesSize; i++) if (piles[i] > hi) hi = piles[i];
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (feasible(piles, pilesSize, h, mid)) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}
