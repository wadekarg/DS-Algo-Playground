//@spec {"fn": "swimInWater", "params": [{"name": "grid", "type": "int[][]"}], "ret": "int"}
//@approach Min-Heap Dijkstra on Max-Path
typedef struct { int t, r, c; } Item;
static void push(Item* h, int* n, Item x) {
    int i = (*n)++;
    h[i] = x;
    while (i > 0 && h[(i - 1) / 2].t > h[i].t) { Item s = h[i]; h[i] = h[(i - 1) / 2]; h[(i - 1) / 2] = s; i = (i - 1) / 2; }
}
static Item pop(Item* h, int* n) {
    Item top = h[0];
    h[0] = h[--(*n)];
    for (int i = 0;;) {
        int s = i, l = 2 * i + 1, r = l + 1;
        if (l < *n && h[l].t < h[s].t) s = l;
        if (r < *n && h[r].t < h[s].t) s = r;
        if (s == i) break;
        Item x = h[i]; h[i] = h[s]; h[s] = x;
        i = s;
    }
    return top;
}
int swimInWater(int** grid, int gridSize, int* gridColSize) {
    int n = gridSize;
    bool* visited = calloc(n * n, sizeof(bool));
    Item* heap = malloc((4 * n * n + 1) * sizeof(Item));
    int size = 0, dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1}, ans = -1;
    push(heap, &size, (Item){grid[0][0], 0, 0});
    while (size > 0) {
        Item it = pop(heap, &size);          // cell reachable with the lowest max elevation
        if (visited[it.r * n + it.c]) continue;
        visited[it.r * n + it.c] = true;
        if (it.r == n - 1 && it.c == n - 1) { ans = it.t; break; }
        for (int d = 0; d < 4; d++) {
            int nr = it.r + dr[d], nc = it.c + dc[d];
            if (nr >= 0 && nr < n && nc >= 0 && nc < n && !visited[nr * n + nc]) {
                int t = grid[nr][nc] > it.t ? grid[nr][nc] : it.t;
                push(heap, &size, (Item){t, nr, nc});
            }
        }
    }
    free(visited); free(heap);
    return ans;
}
