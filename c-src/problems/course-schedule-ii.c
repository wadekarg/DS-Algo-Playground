//@spec {"fn": "findOrder", "params": [{"name": "numCourses", "type": "int"}, {"name": "prerequisites", "type": "int[][]"}], "ret": "int[]"}
//@approach Kahn's Algorithm (BFS topological sort)
int* findOrder(int numCourses, int** prerequisites, int prerequisitesSize, int* prerequisitesColSize, int* returnSize) {
    int n = numCourses, m = prerequisitesSize;
    int* in_degree = calloc(n, sizeof(int));
    int* out_deg = calloc(n, sizeof(int));
    int** graph = malloc(n * sizeof(int*));
    for (int i = 0; i < n; i++) graph[i] = malloc((m + 1) * sizeof(int));
    for (int i = 0; i < m; i++) {
        int a = prerequisites[i][0], b = prerequisites[i][1];
        graph[b][out_deg[b]++] = a;
        in_degree[a]++;
    }
    int* order = malloc(n * sizeof(int));   // doubles as the BFS queue
    int head = 0, tail = 0;
    for (int i = 0; i < n; i++) if (in_degree[i] == 0) order[tail++] = i;
    while (head < tail) {
        int u = order[head++];
        for (int i = 0; i < out_deg[u]; i++)
            if (--in_degree[graph[u][i]] == 0) order[tail++] = graph[u][i];
    }
    for (int i = 0; i < n; i++) free(graph[i]);
    free(graph); free(in_degree); free(out_deg);
    *returnSize = tail == n ? n : 0;         // a cycle leaves some courses unprocessed
    return order;
}
