//@spec {"fn": "setZeroes", "params": [{"name": "matrix", "type": "int[][]"}], "ret": "void", "print": "matrix"}
//@starter
// If a cell is 0, set its whole row and column to 0. Modify matrix in place
// (the harness prints it afterwards). Aim for O(1) extra space.
// Hint: use the first row + first column as flags.
void setZeroes(int** matrix, int matrixSize, int* matrixColSize) {
    // Your code here
}
//@approach First Row/Column as Markers
void setZeroes(int** matrix, int matrixSize, int* matrixColSize) {
    int m = matrixSize, n = matrixColSize[0];
    bool first_row_zero = false, first_col_zero = false;
    for (int j = 0; j < n; j++) if (matrix[0][j] == 0) first_row_zero = true;
    for (int i = 0; i < m; i++) if (matrix[i][0] == 0) first_col_zero = true;
    // Mark via first row/col
    for (int i = 1; i < m; i++)
        for (int j = 1; j < n; j++)
            if (matrix[i][j] == 0) matrix[i][0] = matrix[0][j] = 0;
    // Zero cells based on markers
    for (int i = 1; i < m; i++)
        for (int j = 1; j < n; j++)
            if (matrix[i][0] == 0 || matrix[0][j] == 0) matrix[i][j] = 0;
    if (first_row_zero) for (int j = 0; j < n; j++) matrix[0][j] = 0;
    if (first_col_zero) for (int i = 0; i < m; i++) matrix[i][0] = 0;
}
