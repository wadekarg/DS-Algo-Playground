//@spec {"fn": "minCostConnectPoints", "params": [{"name": "points", "type": "int[][]"}], "ret": "int"}
//@approach Prim's MST
// Dense graph (every pair is an edge), so Prim's with an O(n) scan for the
// cheapest unvisited point does the heap's job in O(n^2) total.
int minCostConnectPoints(int** points, int pointsSize, int* pointsColSize) {
    int n = pointsSize, total = 0;
    bool* visited = calloc(n, sizeof(bool));
    int* best = malloc(n * sizeof(int));     // cheapest edge from the tree to each point
    for (int i = 0; i < n; i++) best[i] = INT_MAX;
    best[0] = 0;
    for (int step = 0; step < n; step++) {
        int u = -1;
        for (int v = 0; v < n; v++)
            if (!visited[v] && (u < 0 || best[v] < best[u])) u = v;
        visited[u] = true;
        total += best[u];
        for (int v = 0; v < n; v++) {
            if (visited[v]) continue;
            int d = abs(points[u][0] - points[v][0]) + abs(points[u][1] - points[v][1]);
            if (d < best[v]) best[v] = d;
        }
    }
    free(visited); free(best);
    return total;
}
