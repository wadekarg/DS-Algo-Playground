//@spec {"fn": "lastStoneWeight", "params": [{"name": "stones", "type": "int[]"}], "ret": "int"}
//@approach Max-Heap Simulation
static void sift_down(int* h, int n, int i) {
    for (;;) {
        int b = i, l = 2 * i + 1, r = l + 1;
        if (l < n && h[l] > h[b]) b = l;
        if (r < n && h[r] > h[b]) b = r;
        if (b == i) return;
        int t = h[i]; h[i] = h[b]; h[b] = t;
        i = b;
    }
}
static int pop_max(int* h, int* n) {
    int top = h[0];
    h[0] = h[--(*n)];
    sift_down(h, *n, 0);
    return top;
}
static void push(int* h, int* n, int v) {
    int i = (*n)++;
    h[i] = v;
    while (i > 0 && h[(i - 1) / 2] < h[i]) {
        int p = (i - 1) / 2, t = h[i];
        h[i] = h[p]; h[p] = t;
        i = p;
    }
}
int lastStoneWeight(int* stones, int stonesSize) {
    int n = stonesSize;                     // heapify the input in place (max-heap)
    for (int i = n / 2 - 1; i >= 0; i--) sift_down(stones, n, i);
    while (n >= 2) {
        int y = pop_max(stones, &n);        // heaviest
        int x = pop_max(stones, &n);        // second heaviest
        if (y != x) push(stones, &n, y - x);
    }
    return n ? stones[0] : 0;
}
