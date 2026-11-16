//@spec {"fn": "orangesRotting", "params": [{"name": "grid", "type": "int[][]"}], "ret": "int"}
//@approach Multi-Source BFS
int orangesRotting(int** grid, int gridSize, int* gridColSize) {
    if (gridSize == 0) return 0;
    int m = gridSize, n = gridColSize[0], fresh = 0;
    int* queue = malloc(m * n * sizeof(int));     // cells as r * n + c
    int head = 0, tail = 0;
    for (int r = 0; r < m; r++)
        for (int c = 0; c < n; c++) {
            if (grid[r][c] == 2) queue[tail++] = r * n + c;   // every rotten orange is a source
            else if (grid[r][c] == 1) fresh++;
        }
    int minutes = 0, dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    while (head < tail && fresh > 0) {
        minutes++;
        int level_end = tail;                     // one minute = one BFS level
        while (head < level_end) {
            int r = queue[head] / n, c = queue[head++] % n;
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] == 1) {
                    grid[nr][nc] = 2;
                    fresh--;
                    queue[tail++] = nr * n + nc;
                }
            }
        }
    }
    free(queue);
    return fresh == 0 ? minutes : -1;
}
