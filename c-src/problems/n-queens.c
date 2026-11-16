//@spec {"fn": "solveNQueens", "params": [{"name": "n", "type": "int"}], "ret": "string[][]"}
//@starter
/**
 * Return every valid board (malloc'd): each board is n strings of length n
 * using 'Q' and '.'; *returnSize = number of boards and
 * (*returnColumnSizes)[i] = n for each board.
 */
char*** solveNQueens(int n, int* returnSize, int** returnColumnSizes) {
    // Your code here
    *returnSize = 0;
    *returnColumnSizes = NULL;
    return NULL;
}
//@approach Backtracking with Conflict Sets
// "Sets" of used columns / diagonals, as bitmasks (n <= 9 here).
static char*** res_; static int count_, cap_, *queens_;
static void build(int n) {
    if (count_ == cap_) res_ = realloc(res_, (cap_ *= 2) * sizeof(char**));
    char** board = malloc(n * sizeof(char*));
    for (int r = 0; r < n; r++) {
        board[r] = malloc(n + 1);
        memset(board[r], '.', n);
        board[r][queens_[r]] = 'Q';
        board[r][n] = '\0';
    }
    res_[count_++] = board;
}
static void backtrack(int n, int row, unsigned cols, unsigned neg_diag, unsigned pos_diag) {
    if (row == n) { build(n); return; }
    for (int col = 0; col < n; col++) {
        unsigned c = 1u << col, d1 = 1u << (row - col + n - 1), d2 = 1u << (row + col);
        if ((cols & c) || (neg_diag & d1) || (pos_diag & d2)) continue;
        queens_[row] = col;
        backtrack(n, row + 1, cols | c, neg_diag | d1, pos_diag | d2);   // add, recurse; "remove" = unchanged masks
    }
}
char*** solveNQueens(int n, int* returnSize, int** returnColumnSizes) {
    cap_ = 8; count_ = 0;
    res_ = malloc(cap_ * sizeof(char**));
    queens_ = malloc(n * sizeof(int));
    backtrack(n, 0, 0, 0, 0);
    free(queens_);
    *returnSize = count_;
    *returnColumnSizes = malloc((count_ + 1) * sizeof(int));
    for (int i = 0; i < count_; i++) (*returnColumnSizes)[i] = n;
    return res_;
}
//@approach Backtracking with Boolean Arrays (no sets)
static char*** res_; static int count_, cap_, *queens_;
static bool *cols_, *neg_, *pos_;
static void backtrack(int n, int row) {
    if (row == n) {
        if (count_ == cap_) res_ = realloc(res_, (cap_ *= 2) * sizeof(char**));
        char** board = malloc(n * sizeof(char*));
        for (int r = 0; r < n; r++) {
            board[r] = malloc(n + 1);
            for (int c = 0; c < n; c++) board[r][c] = c == queens_[r] ? 'Q' : '.';
            board[r][n] = '\0';
        }
        res_[count_++] = board;
        return;
    }
    for (int col = 0; col < n; col++) {
        int d1 = row - col + n - 1, d2 = row + col;
        if (cols_[col] || neg_[d1] || pos_[d2]) continue;
        queens_[row] = col;
        cols_[col] = neg_[d1] = pos_[d2] = true;
        backtrack(n, row + 1);
        cols_[col] = neg_[d1] = pos_[d2] = false;
    }
}
char*** solveNQueens(int n, int* returnSize, int** returnColumnSizes) {
    cap_ = 8; count_ = 0;
    res_ = malloc(cap_ * sizeof(char**));
    queens_ = malloc(n * sizeof(int));
    cols_ = calloc(n, sizeof(bool));
    neg_ = calloc(2 * n, sizeof(bool));   // index row - col + (n - 1)
    pos_ = calloc(2 * n, sizeof(bool));   // index row + col
    backtrack(n, 0);
    free(queens_); free(cols_); free(neg_); free(pos_);
    *returnSize = count_;
    *returnColumnSizes = malloc((count_ + 1) * sizeof(int));
    for (int i = 0; i < count_; i++) (*returnColumnSizes)[i] = n;
    return res_;
}
