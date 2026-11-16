//@spec {"fn": "validTree", "params": [{"name": "n", "type": "int"}, {"name": "edges", "type": "int[][]"}], "ret": "bool"}
//@approach Edge-Count + DFS for Connectivity
static int **graph_, *deg_, visited_count_;
static bool* visited_;
static void dfs(int u) {
    if (visited_[u]) return;
    visited_[u] = true;
    visited_count_++;
    for (int i = 0; i < deg_[u]; i++) dfs(graph_[u][i]);
}
bool validTree(int n, int** edges, int edgesSize, int* edgesColSize) {
    if (edgesSize != n - 1) return false;
    deg_ = calloc(n, sizeof(int));
    for (int i = 0; i < edgesSize; i++) { deg_[edges[i][0]]++; deg_[edges[i][1]]++; }
    graph_ = malloc(n * sizeof(int*));
    for (int u = 0; u < n; u++) { graph_[u] = malloc((deg_[u] + 1) * sizeof(int)); deg_[u] = 0; }
    for (int i = 0; i < edgesSize; i++) {
        int a = edges[i][0], b = edges[i][1];
        graph_[a][deg_[a]++] = b;
        graph_[b][deg_[b]++] = a;
    }
    visited_ = calloc(n, sizeof(bool));
    visited_count_ = 0;
    dfs(0);
    bool ok = visited_count_ == n;
    for (int u = 0; u < n; u++) free(graph_[u]);
    free(graph_); free(deg_); free(visited_);
    return ok;
}
//@approach Union-Find with Cycle Detection
static int find(int* parent, int x) {
    int root = x;
    while (parent[root] != root) root = parent[root];
    while (parent[x] != root) { int next = parent[x]; parent[x] = root; x = next; }
    return root;
}
bool validTree(int n, int** edges, int edgesSize, int* edgesColSize) {
    if (edgesSize != n - 1) return false;
    int* parent = malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) parent[i] = i;
    bool ok = true;
    for (int i = 0; i < edgesSize && ok; i++) {
        int ra = find(parent, edges[i][0]), rb = find(parent, edges[i][1]);
        if (ra == rb) ok = false;            // cycle
        else parent[ra] = rb;
    }
    free(parent);
    return ok;
}
