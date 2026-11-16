//@spec {"fn": "uniquePaths", "params": [{"name": "m", "type": "int"}, {"name": "n", "type": "int"}], "ret": "int"}
//@approach 1D Rolling DP
int uniquePaths(int m, int n) {
    int* row = malloc(n * sizeof(int));
    for (int j = 0; j < n; j++) row[j] = 1;
    for (int i = 1; i < m; i++)
        for (int j = 1; j < n; j++)
            row[j] += row[j - 1];            // from above (old row[j]) + from the left
    int ans = row[n - 1];
    free(row);
    return ans;
}
//@approach Combinatorics
// C(m+n-2, m-1), multiplied out so every intermediate value stays an integer.
int uniquePaths(int m, int n) {
    long long result = 1;
    int k = m - 1, total = m + n - 2;
    for (int i = 1; i <= k; i++)
        result = result * (total - k + i) / i;
    return (int)result;
}
