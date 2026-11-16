//@spec {"fn": "pacificAtlantic", "params": [{"name": "heights", "type": "int[][]"}], "ret": "int[][]"}
//@approach Reverse DFS from Ocean Edges
static int m_, n_;
static void dfs(int** h, bool* visited, int r, int c) {
    visited[r * n_ + c] = true;
    int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    for (int d = 0; d < 4; d++) {
        int nr = r + dr[d], nc = c + dc[d];
        if (nr >= 0 && nr < m_ && nc >= 0 && nc < n_ && !visited[nr * n_ + nc] && h[nr][nc] >= h[r][c])
            dfs(h, visited, nr, nc);         // walk UPHILL from the ocean
    }
}
int** pacificAtlantic(int** heights, int heightsSize, int* heightsColSize, int* returnSize, int** returnColumnSizes) {
    m_ = heightsSize; n_ = heightsSize ? heightsColSize[0] : 0;
    bool* pacific = calloc(m_ * n_ + 1, sizeof(bool));
    bool* atlantic = calloc(m_ * n_ + 1, sizeof(bool));
    for (int c = 0; c < n_; c++) {
        if (!pacific[c]) dfs(heights, pacific, 0, c);                       // top row
        if (!atlantic[(m_ - 1) * n_ + c]) dfs(heights, atlantic, m_ - 1, c); // bottom row
    }
    for (int r = 0; r < m_; r++) {
        if (!pacific[r * n_]) dfs(heights, pacific, r, 0);                   // left column
        if (!atlantic[r * n_ + n_ - 1]) dfs(heights, atlantic, r, n_ - 1);   // right column
    }
    int** res = malloc((m_ * n_ + 1) * sizeof(int*));
    *returnColumnSizes = malloc((m_ * n_ + 1) * sizeof(int));
    int k = 0;
    for (int r = 0; r < m_; r++)
        for (int c = 0; c < n_; c++)
            if (pacific[r * n_ + c] && atlantic[r * n_ + c]) {
                res[k] = malloc(2 * sizeof(int));
                res[k][0] = r; res[k][1] = c;
                (*returnColumnSizes)[k++] = 2;
            }
    free(pacific); free(atlantic);
    *returnSize = k;
    return res;
}
