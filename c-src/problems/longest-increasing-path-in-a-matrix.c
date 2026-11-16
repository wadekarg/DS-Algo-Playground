//@spec {"fn": "longestIncreasingPath", "params": [{"name": "matrix", "type": "int[][]"}], "ret": "int"}
//@approach DFS with Memoization
static int m_, n_, **mat_, *memo_;           // memo_ == 0: not computed yet
static int dfs(int r, int c) {
    int* m = &memo_[r * n_ + c];
    if (*m) return *m;
    int best = 1, dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    for (int d = 0; d < 4; d++) {
        int nr = r + dr[d], nc = c + dc[d];
        if (nr >= 0 && nr < m_ && nc >= 0 && nc < n_ && mat_[nr][nc] > mat_[r][c]) {
            int len = 1 + dfs(nr, nc);
            if (len > best) best = len;
        }
    }
    return *m = best;
}
int longestIncreasingPath(int** matrix, int matrixSize, int* matrixColSize) {
    if (matrixSize == 0) return 0;
    m_ = matrixSize; n_ = matrixColSize[0]; mat_ = matrix;
    memo_ = calloc(m_ * n_, sizeof(int));
    int best = 0;
    for (int r = 0; r < m_; r++)
        for (int c = 0; c < n_; c++) {
            int len = dfs(r, c);
            if (len > best) best = len;
        }
    free(memo_);
    return best;
}
