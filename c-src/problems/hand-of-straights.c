//@spec {"fn": "isNStraightHand", "params": [{"name": "hand", "type": "int[]"}, {"name": "groupSize", "type": "int"}], "ret": "bool"}
//@approach Counter + Greedy Sorted
// Sort, then count runs of equal cards: vals[k] appears cnt[k] times.
static int cmp_int(const void* a, const void* b) {
    int x = *(const int*)a, y = *(const int*)b;
    return (x > y) - (x < y);
}
bool isNStraightHand(int* hand, int handSize, int groupSize) {
    if (handSize % groupSize != 0) return false;
    qsort(hand, handSize, sizeof(int), cmp_int);
    int* vals = malloc(handSize * sizeof(int));
    int* cnt = malloc(handSize * sizeof(int));
    int d = 0;
    for (int i = 0; i < handSize; i++) {
        if (d && vals[d - 1] == hand[i]) cnt[d - 1]++;
        else { vals[d] = hand[i]; cnt[d++] = 1; }
    }
    bool ok = true;
    for (int i = 0; i < d && ok; i++) {
        int c = cnt[i];
        if (c == 0) continue;
        // smallest remaining card must start c groups: vals[i], vals[i]+1, ...
        for (int k = 0; k < groupSize && ok; k++) {
            if (i + k >= d || vals[i + k] != vals[i] + k || cnt[i + k] < c) ok = false;
            else cnt[i + k] -= c;
        }
    }
    free(vals); free(cnt);
    return ok;
}
