//@spec {"fn": "findRedundantConnection", "params": [{"name": "edges", "type": "int[][]"}], "ret": "int[]"}
//@approach Union-Find (DSU) with Path Compression
static int find(int* parent, int x) {
    int root = x;
    while (parent[root] != root) root = parent[root];
    while (parent[x] != root) {              // path compression
        int next = parent[x];
        parent[x] = root;
        x = next;
    }
    return root;
}
int* findRedundantConnection(int** edges, int edgesSize, int* edgesColSize, int* returnSize) {
    int n = edgesSize;
    int* parent = malloc((n + 1) * sizeof(int));   // 1-indexed nodes
    for (int i = 0; i <= n; i++) parent[i] = i;
    int* res = malloc(2 * sizeof(int));
    *returnSize = 0;
    for (int i = 0; i < n; i++) {
        int a = edges[i][0], b = edges[i][1];
        int ra = find(parent, a), rb = find(parent, b);
        if (ra == rb) {                      // this edge creates a cycle
            res[0] = a; res[1] = b;
            *returnSize = 2;
            break;
        }
        parent[ra] = rb;
    }
    free(parent);
    return res;
}
