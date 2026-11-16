//@spec {"fn": "searchMatrix", "params": [{"name": "matrix", "type": "int[][]"}, {"name": "target", "type": "int"}], "ret": "bool"}
//@approach Single Binary Search (flat)
bool searchMatrix(int** matrix, int matrixSize, int* matrixColSize, int target) {
    int m = matrixSize, n = matrixColSize[0];
    int lo = 0, hi = m * n - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        int v = matrix[mid / n][mid % n];    // flat index -> (row, col)
        if (v == target) return true;
        if (v < target) lo = mid + 1; else hi = mid - 1;
    }
    return false;
}
