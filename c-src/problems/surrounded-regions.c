//@spec {"fn": "solve", "params": [{"name": "board", "type": "char[][]"}], "ret": "void", "print": "board"}
//@starter
// Capture surrounded 'O's by flipping them to 'X'. Modify board in place
// (the harness prints it afterwards).
// Trick: flood-fill from BORDER 'O's to mark survivors, then flip the rest.
void solve(char** board, int boardSize, int* boardColSize) {
    // Your code here
}
//@approach Border DFS + Mark + Flip
static int m_, n_;
static void dfs(char** board, int r, int c) {
    if (r < 0 || r >= m_ || c < 0 || c >= n_ || board[r][c] != 'O') return;
    board[r][c] = '#';                       // temporary safe marker
    dfs(board, r + 1, c);
    dfs(board, r - 1, c);
    dfs(board, r, c + 1);
    dfs(board, r, c - 1);
}
void solve(char** board, int boardSize, int* boardColSize) {
    if (boardSize == 0) return;
    m_ = boardSize; n_ = boardColSize[0];
    // Mark all border-connected O's as safe (#)
    for (int r = 0; r < m_; r++) { dfs(board, r, 0); dfs(board, r, n_ - 1); }
    for (int c = 0; c < n_; c++) { dfs(board, 0, c); dfs(board, m_ - 1, c); }
    // Pass 2: O (surrounded) -> X; # (safe) -> O
    for (int r = 0; r < m_; r++)
        for (int c = 0; c < n_; c++) {
            if (board[r][c] == 'O') board[r][c] = 'X';
            else if (board[r][c] == '#') board[r][c] = 'O';
        }
}
