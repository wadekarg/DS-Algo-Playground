//@code
#include <stdio.h>

#define N 3

// ── Rotate Matrix 90° Clockwise (in-place) ────────────────────
void rotate(int m[N][N]) {
    // Step 1: transpose
    for (int i = 0; i < N; i++)
        for (int j = i + 1; j < N; j++) {
            int t = m[i][j]; m[i][j] = m[j][i]; m[j][i] = t;
        }
    // Step 2: reverse each row
    for (int i = 0; i < N; i++)
        for (int l = 0, r = N - 1; l < r; l++, r--) {
            int t = m[i][l]; m[i][l] = m[i][r]; m[i][r] = t;
        }
}

// ── Spiral Matrix (elements in spiral order) ──────────────────
int spiral_order(int rows, int cols, int m[rows][cols], int res[]) {
    int n = 0, top = 0, bottom = rows - 1, left = 0, right = cols - 1;
    while (top <= bottom && left <= right) {
        for (int c = left; c <= right; c++) res[n++] = m[top][c];
        top++;
        for (int r = top; r <= bottom; r++) res[n++] = m[r][right];
        right--;
        if (top <= bottom) {
            for (int c = right; c >= left; c--) res[n++] = m[bottom][c];
            bottom--;
        }
        if (left <= right) {
            for (int r = bottom; r >= top; r--) res[n++] = m[r][left];
            left++;
        }
    }
    return n;
}

// ── Fast Exponentiation ───────────────────────────────────────
double my_pow(double x, long long n) {
    if (n == 0) return 1;
    if (n < 0) return 1 / my_pow(x, -n);
    if (n % 2 == 0) {
        double half = my_pow(x, n / 2);
        return half * half;
    }
    return x * my_pow(x, n - 1);
}

// ── GCD (Euclidean) ───────────────────────────────────────────
int gcd(int a, int b) {
    while (b) {
        int t = a % b;
        a = b;
        b = t;
    }
    return a;
}

int main(void) {
    int m[N][N] = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};
    rotate(m);
    printf("rotated:");
    for (int i = 0; i < N; i++) printf(" [%d %d %d]", m[i][0], m[i][1], m[i][2]);
    printf("\n");

    int s[3][4] = {{1, 2, 3, 4}, {5, 6, 7, 8}, {9, 10, 11, 12}}, res[12];
    int k = spiral_order(3, 4, s, res);
    printf("spiral:");
    for (int i = 0; i < k; i++) printf(" %d", res[i]);
    printf("\n");

    printf("2^10 = %g, 2^-2 = %g\n", my_pow(2, 10), my_pow(2, -2));
    printf("gcd(48, 18) = %d\n", gcd(48, 18));
    return 0;
}
//@expect-output
rotated: [7 4 1] [8 5 2] [9 6 3]
spiral: 1 2 3 4 8 12 11 10 9 5 6 7
2^10 = 1024, 2^-2 = 0.25
gcd(48, 18) = 6
//@trace
void rotate(int n, int matrix[n][n]) {
    for (int i = 0; i < n; i++)          // transpose
        for (int j = i + 1; j < n; j++) {
            int t = matrix[i][j];
            matrix[i][j] = matrix[j][i]; matrix[j][i] = t;
        }
    for (int i = 0; i < n; i++)          // reverse rows
        for (int l = 0, r = n - 1; l < r; l++, r--) {
            int t = matrix[i][l];
            matrix[i][l] = matrix[i][r]; matrix[i][r] = t;
        }
}
//@trace-python
def rotate(matrix):
    n = len(matrix)
    for i in range(n):            # transpose
        for j in range(i + 1, n):
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
    for row in matrix:            # reverse each row
        row.reverse()
//@trace-map 1:1 2:1 3:2 4:3 5:4-5 6:7 7:8-10
