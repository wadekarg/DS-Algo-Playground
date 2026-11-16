//@spec {"fn": "rotate", "params": [{"name": "matrix", "type": "int[][]"}], "ret": "void", "print": "matrix"}
//@starter
// Rotate the n x n matrix 90 degrees clockwise, in place
// (the harness prints matrix afterwards).
// Hint: transpose, then reverse each row.
void rotate(int** matrix, int matrixSize, int* matrixColSize) {
    // Your code here
}
//@approach Transpose + Reverse
void rotate(int** matrix, int matrixSize, int* matrixColSize) {
    int n = matrixSize;
    // Transpose
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++) {
            int t = matrix[i][j]; matrix[i][j] = matrix[j][i]; matrix[j][i] = t;
        }
    // Reverse each row
    for (int i = 0; i < n; i++)
        for (int l = 0, r = n - 1; l < r; l++, r--) {
            int t = matrix[i][l]; matrix[i][l] = matrix[i][r]; matrix[i][r] = t;
        }
}
