//@spec {"fn": "networkDelayTime", "params": [{"name": "times", "type": "int[][]"}, {"name": "n", "type": "int"}, {"name": "k", "type": "int"}], "ret": "int"}
//@approach Dijkstra with Min-Heap
typedef struct { int d, u; } Item;
static void push(Item* h, int* n, Item x) {
    int i = (*n)++;
    h[i] = x;
    while (i > 0 && h[(i - 1) / 2].d > h[i].d) {
        Item t = h[i]; h[i] = h[(i - 1) / 2]; h[(i - 1) / 2] = t;
        i = (i - 1) / 2;
    }
}
static Item pop(Item* h, int* n) {
    Item top = h[0];
    h[0] = h[--(*n)];
    for (int i = 0;;) {
        int s = i, l = 2 * i + 1, r = l + 1;
        if (l < *n && h[l].d < h[s].d) s = l;
        if (r < *n && h[r].d < h[s].d) s = r;
        if (s == i) break;
        Item t = h[i]; h[i] = h[s]; h[s] = t;
        i = s;
    }
    return top;
}
int networkDelayTime(int** times, int timesSize, int* timesColSize, int n, int k) {
    // dist[u] = -1 until u is settled
    int* dist = malloc((n + 1) * sizeof(int));
    for (int i = 0; i <= n; i++) dist[i] = -1;
    Item* heap = malloc((timesSize + 2) * sizeof(Item));
    int size = 0, settled = 0, longest = 0;
    push(heap, &size, (Item){0, k});
    while (size > 0) {
        Item it = pop(heap, &size);
        if (dist[it.u] != -1) continue;      // already settled
        dist[it.u] = it.d;
        settled++;
        if (it.d > longest) longest = it.d;
        for (int i = 0; i < timesSize; i++)  // edges out of it.u (edge list scan)
            if (times[i][0] == it.u && dist[times[i][1]] == -1)
                push(heap, &size, (Item){it.d + times[i][2], times[i][1]});
    }
    free(dist); free(heap);
    return settled == n ? longest : -1;
}
