//@spec {"fn": "maxAreaOfIsland", "params": [{"name": "grid", "type": "int[][]"}], "ret": "int"}
//@approach DFS Flood-Fill Returning Area
static int m_, n_;
static int dfs(int** grid, int r, int c) {
    if (r < 0 || r >= m_ || c < 0 || c >= n_ || grid[r][c] != 1) return 0;
    grid[r][c] = 0;                          // mark visited by sinking
    return 1 + dfs(grid, r + 1, c) + dfs(grid, r - 1, c) + dfs(grid, r, c + 1) + dfs(grid, r, c - 1);
}
int maxAreaOfIsland(int** grid, int gridSize, int* gridColSize) {
    if (gridSize == 0) return 0;
    m_ = gridSize; n_ = gridColSize[0];
    int max_area = 0;
    for (int r = 0; r < m_; r++)
        for (int c = 0; c < n_; c++)
            if (grid[r][c] == 1) {
                int area = dfs(grid, r, c);
                if (area > max_area) max_area = area;
            }
    return max_area;
}
