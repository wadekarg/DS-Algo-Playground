//@spec {"fn": "cloneGraph", "params": [{"name": "adjList", "type": "int[][]"}], "ret": "void"}
//@prelude
struct Node {
    int val;
    int numNeighbors;
    struct Node** neighbors;
};
//@driver
// Build the graph from adjList (node i+1's neighbours are adjList[i]), clone
// it, check the clone shares no nodes with the original, and print the
// clone's adjacency list sorted by node value.
void dsa_driver(int** adjList, int adjListSize, int* adjListColSize) {
    struct Node** nodes = calloc(adjListSize + 1, sizeof(struct Node*));
    for (int i = 0; i < adjListSize; i++) {
        nodes[i] = calloc(1, sizeof(struct Node));
        nodes[i]->val = i + 1;
    }
    for (int i = 0; i < adjListSize; i++) {
        nodes[i]->numNeighbors = adjListColSize[i];
        nodes[i]->neighbors = malloc((adjListColSize[i] + 1) * sizeof(struct Node*));
        for (int j = 0; j < adjListColSize[i]; j++) nodes[i]->neighbors[j] = nodes[adjList[i][j] - 1];
    }
    struct Node* copy = cloneGraph(adjListSize ? nodes[0] : NULL);
    if (!copy) { dsa_lb(); dsa_le(); return; }
    // BFS the clone; index by value
    struct Node* by_val[128] = {0};
    struct Node* queue[128]; int head = 0, tail = 0;
    queue[tail++] = copy; by_val[copy->val] = copy;
    while (head < tail) {
        struct Node* u = queue[head++];
        for (int i = 0; i < adjListSize; i++)
            if (u == nodes[i]) { dsa_w("<clone reuses an original node>"); return; }
        for (int j = 0; j < u->numNeighbors; j++) {
            struct Node* v = u->neighbors[j];
            if (v && v->val > 0 && v->val < 128 && !by_val[v->val]) { by_val[v->val] = v; queue[tail++] = v; }
        }
    }
    dsa_lb();
    for (int v = 1; v < 128; v++) {
        if (!by_val[v]) continue;
        dsa_lb();
        for (int j = 0; j < by_val[v]->numNeighbors; j++) dsa_out_int(by_val[v]->neighbors[j]->val);
        dsa_le();
    }
    dsa_le();
}
//@starter
/**
 * Definition for a Node (provided by the test harness):
 * struct Node {
 *     int val;
 *     int numNeighbors;
 *     struct Node** neighbors;
 * };
 * Return a deep copy of the graph reachable from s (NULL for an empty graph).
 */
struct Node* cloneGraph(struct Node* s) {
    // DFS/BFS with a map original -> copy. Register the copy BEFORE
    // visiting neighbours so cycles terminate.
    return NULL;
}
//@approach DFS with Visited Map
// Node values are 1..100 and unique, so an array indexed by val is the map.
static struct Node* seen_[101];
static struct Node* clone(struct Node* node) {
    if (seen_[node->val]) return seen_[node->val];
    struct Node* copy = malloc(sizeof(struct Node));
    copy->val = node->val;
    copy->numNeighbors = node->numNeighbors;
    copy->neighbors = malloc((node->numNeighbors + 1) * sizeof(struct Node*));
    seen_[node->val] = copy;                // register BEFORE recursing on neighbors
    for (int i = 0; i < node->numNeighbors; i++)
        copy->neighbors[i] = clone(node->neighbors[i]);
    return copy;
}
struct Node* cloneGraph(struct Node* s) {
    if (!s) return NULL;
    memset(seen_, 0, sizeof seen_);
    return clone(s);
}
