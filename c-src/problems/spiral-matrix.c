//@spec {"fn": "spiralOrder", "params": [{"name": "matrix", "type": "int[][]"}], "ret": "int[]"}
//@approach Four Boundaries
int* spiralOrder(int** matrix, int matrixSize, int* matrixColSize, int* returnSize) {
    *returnSize = 0;
    if (matrixSize == 0) return NULL;
    int top = 0, bottom = matrixSize - 1, left = 0, right = matrixColSize[0] - 1;
    int* result = malloc(matrixSize * matrixColSize[0] * sizeof(int));
    int k = 0;
    while (top <= bottom && left <= right) {
        for (int c = left; c <= right; c++) result[k++] = matrix[top][c];
        top++;
        for (int r = top; r <= bottom; r++) result[k++] = matrix[r][right];
        right--;
        if (top <= bottom) {
            for (int c = right; c >= left; c--) result[k++] = matrix[bottom][c];
            bottom--;
        }
        if (left <= right) {
            for (int r = bottom; r >= top; r--) result[k++] = matrix[r][left];
            left++;
        }
    }
    *returnSize = k;
    return result;
}
