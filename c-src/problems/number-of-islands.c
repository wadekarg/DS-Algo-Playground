//@spec {"fn": "numIslands", "params": [{"name": "grid", "type": "char[][]"}], "ret": "int"}
//@approach DFS Flood-Fill (mutate grid)
static int m_, n_;
static void dfs(char** grid, int r, int c) {
    if (r < 0 || r >= m_ || c < 0 || c >= n_ || grid[r][c] != '1') return;
    grid[r][c] = '0';                       // mark visited by sinking
    dfs(grid, r + 1, c);
    dfs(grid, r - 1, c);
    dfs(grid, r, c + 1);
    dfs(grid, r, c - 1);
}
int numIslands(char** grid, int gridSize, int* gridColSize) {
    if (gridSize == 0) return 0;
    m_ = gridSize; n_ = gridColSize[0];
    int count = 0;
    for (int r = 0; r < m_; r++)
        for (int c = 0; c < n_; c++)
            if (grid[r][c] == '1') {
                dfs(grid, r, c);
                count++;
            }
    return count;
}
//@approach BFS Flood-Fill (queue, no mutation)
int numIslands(char** grid, int gridSize, int* gridColSize) {
    if (gridSize == 0) return 0;
    int m = gridSize, n = gridColSize[0], count = 0;
    bool* visited = calloc(m * n, sizeof(bool));
    int* queue = malloc(m * n * sizeof(int));        // cells encoded as r * n + c
    int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    for (int r = 0; r < m; r++)
        for (int c = 0; c < n; c++) {
            if (grid[r][c] != '1' || visited[r * n + c]) continue;
            int head = 0, tail = 0;
            queue[tail++] = r * n + c;
            visited[r * n + c] = true;
            while (head < tail) {
                int cr = queue[head] / n, cc = queue[head++] % n;
                for (int d = 0; d < 4; d++) {
                    int nr = cr + dr[d], nc = cc + dc[d];
                    if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] == '1' && !visited[nr * n + nc]) {
                        visited[nr * n + nc] = true;
                        queue[tail++] = nr * n + nc;
                    }
                }
            }
            count++;
        }
    free(visited); free(queue);
    return count;
}
