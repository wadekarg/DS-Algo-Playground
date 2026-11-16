//@spec {"fn": "countComponents", "params": [{"name": "n", "type": "int"}, {"name": "edges", "type": "int[][]"}], "ret": "int"}
//@approach Union-Find (DSU)
static int find(int* parent, int x) {
    int root = x;
    while (parent[root] != root) root = parent[root];
    while (parent[x] != root) { int next = parent[x]; parent[x] = root; x = next; }
    return root;
}
int countComponents(int n, int** edges, int edgesSize, int* edgesColSize) {
    int* parent = malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) parent[i] = i;
    int count = n;                           // start with all isolated
    for (int i = 0; i < edgesSize; i++) {
        int ra = find(parent, edges[i][0]), rb = find(parent, edges[i][1]);
        if (ra != rb) {
            parent[ra] = rb;
            count--;
        }
    }
    free(parent);
    return count;
}
//@approach DFS (alternative)
static int **graph_, *deg_;
static bool* visited_;
static void dfs(int u) {
    visited_[u] = true;
    for (int i = 0; i < deg_[u]; i++)
        if (!visited_[graph_[u][i]]) dfs(graph_[u][i]);
}
int countComponents(int n, int** edges, int edgesSize, int* edgesColSize) {
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
    int count = 0;
    for (int i = 0; i < n; i++)
        if (!visited_[i]) { dfs(i); count++; }
    for (int u = 0; u < n; u++) free(graph_[u]);
    free(graph_); free(deg_); free(visited_);
    return count;
}
