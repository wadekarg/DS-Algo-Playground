//@spec {"fn": "canFinish", "params": [{"name": "numCourses", "type": "int"}, {"name": "prerequisites", "type": "int[][]"}], "ret": "bool"}
//@approach DFS with 3-Color (WHITE/GRAY/BLACK)
enum { WHITE, GRAY, BLACK };
static int **graph_, *deg_, *state_;
static bool dfs(int u) {
    if (state_[u] == GRAY) return false;    // cycle detected
    if (state_[u] == BLACK) return true;    // already proven safe
    state_[u] = GRAY;
    for (int i = 0; i < deg_[u]; i++)
        if (!dfs(graph_[u][i])) return false;
    state_[u] = BLACK;
    return true;
}
bool canFinish(int numCourses, int** prerequisites, int prerequisitesSize, int* prerequisitesColSize) {
    int n = numCourses, m = prerequisitesSize;
    deg_ = calloc(n, sizeof(int));
    state_ = calloc(n, sizeof(int));
    graph_ = malloc(n * sizeof(int*));
    for (int i = 0; i < n; i++) graph_[i] = malloc((m + 1) * sizeof(int));
    for (int i = 0; i < m; i++) {
        int a = prerequisites[i][0], b = prerequisites[i][1];
        graph_[b][deg_[b]++] = a;           // edge: b must come before a
    }
    bool ok = true;
    for (int i = 0; i < n && ok; i++) ok = dfs(i);
    for (int i = 0; i < n; i++) free(graph_[i]);
    free(graph_); free(deg_); free(state_);
    return ok;
}
//@approach Kahn's Algorithm (BFS by in-degree)
bool canFinish(int numCourses, int** prerequisites, int prerequisitesSize, int* prerequisitesColSize) {
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
    int* queue = malloc(n * sizeof(int));
    int head = 0, tail = 0;
    for (int i = 0; i < n; i++) if (in_degree[i] == 0) queue[tail++] = i;
    int processed = 0;
    while (head < tail) {
        int u = queue[head++];
        processed++;
        for (int i = 0; i < out_deg[u]; i++)
            if (--in_degree[graph[u][i]] == 0) queue[tail++] = graph[u][i];
    }
    for (int i = 0; i < n; i++) free(graph[i]);
    free(graph); free(in_degree); free(out_deg); free(queue);
    return processed == n;
}
