//@spec {"fn": "exist", "params": [{"name": "board", "type": "char[][]"}, {"name": "word", "type": "string"}], "ret": "bool"}
//@approach Backtracking with Extra Visited Set
static int m_, n_;
static bool dfs(char** board, bool* visited, const char* word, int i, int j, int k) {
    if (word[k] == '\0') return true;
    if (i < 0 || i >= m_ || j < 0 || j >= n_ || visited[i * n_ + j] || board[i][j] != word[k])
        return false;
    visited[i * n_ + j] = true;
    bool found = dfs(board, visited, word, i + 1, j, k + 1) || dfs(board, visited, word, i - 1, j, k + 1) ||
                 dfs(board, visited, word, i, j + 1, k + 1) || dfs(board, visited, word, i, j - 1, k + 1);
    visited[i * n_ + j] = false;
    return found;
}
bool exist(char** board, int boardSize, int* boardColSize, char* word) {
    m_ = boardSize; n_ = boardColSize[0];
    bool* visited = calloc(m_ * n_, sizeof(bool));
    bool found = false;
    for (int i = 0; i < m_ && !found; i++)
        for (int j = 0; j < n_ && !found; j++)
            found = dfs(board, visited, word, i, j, 0);
    free(visited);
    return found;
}
//@approach Backtracking with In-Place Marking
static int m_, n_;
static bool dfs(char** board, const char* word, int i, int j, int k) {
    if (word[k] == '\0') return true;
    if (i < 0 || i >= m_ || j < 0 || j >= n_ || board[i][j] != word[k]) return false;
    char temp = board[i][j];
    board[i][j] = '#';                    // mark as visited
    bool found = dfs(board, word, i + 1, j, k + 1) || dfs(board, word, i - 1, j, k + 1) ||
                 dfs(board, word, i, j + 1, k + 1) || dfs(board, word, i, j - 1, k + 1);
    board[i][j] = temp;                   // restore
    return found;
}
bool exist(char** board, int boardSize, int* boardColSize, char* word) {
    m_ = boardSize; n_ = boardColSize[0];
    for (int i = 0; i < m_; i++)
        for (int j = 0; j < n_; j++)
            if (dfs(board, word, i, j, 0)) return true;
    return false;
}
