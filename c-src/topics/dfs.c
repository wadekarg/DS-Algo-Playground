//@code
#include <stdio.h>
#include <stdbool.h>

#define MAX_NODES 16

/* Perform DFS recursively from the given node (prints nodes as visited). */
void dfs_recursive(int graph[][MAX_NODES], int deg[], int node, bool visited[]) {
    visited[node] = true;
    printf("%d ", node);

    for (int i = 0; i < deg[node]; i++) {
        int neighbor = graph[node][i];
        if (!visited[neighbor])
            dfs_recursive(graph, deg, neighbor, visited);
    }
}

/* Perform DFS iteratively using an explicit stack. Returns visit count. */
int dfs_iterative(int graph[][MAX_NODES], int deg[], int start, int order[]) {
    bool visited[MAX_NODES] = {false};
    int stack[MAX_NODES * MAX_NODES];
    int top = 0, count = 0;
    stack[top++] = start;

    while (top > 0) {
        int node = stack[--top];          // Pop from top
        if (visited[node]) continue;
        visited[node] = true;
        order[count++] = node;

        // Push neighbors in reverse order so first neighbor is on top
        for (int i = deg[node] - 1; i >= 0; i--) {
            int neighbor = graph[node][i];
            if (!visited[neighbor]) stack[top++] = neighbor;
        }
    }
    return count;
}

int main(void) {
    // Example usage: adjacency list
    int graph[][MAX_NODES] = {
        {1, 2},      // 0
        {0, 3, 4},   // 1
        {0, 5, 6},   // 2
        {1},         // 3
        {1},         // 4
        {2},         // 5
        {2}          // 6
    };
    int deg[] = {2, 3, 3, 1, 1, 1, 1};
    int order[MAX_NODES];
    int count = dfs_iterative(graph, deg, 0, order);

    printf("[");
    for (int i = 0; i < count; i++) printf(i ? ", %d" : "%d", order[i]);
    printf("]\n");  // Output: [0, 1, 3, 4, 2, 5, 6]
    return 0;
}
//@trace
void dfs(int** graph, int* deg, int n, int start) {
    bool* visited = calloc(n, sizeof(bool));
    int* stack = malloc(n * n * sizeof(int));
    int top = 0;
    stack[top++] = start;
    while (top > 0) {
        int node = stack[--top];
        if (!visited[node]) {
            visited[node] = true;
            for (int i = 0; i < deg[node]; i++)
                if (!visited[graph[node][i]])
                    stack[top++] = graph[node][i];
        }
    }
    free(visited); free(stack);
}
//@trace-python
def dfs(graph, start):
    visited = set()
    stack = [start]
    while stack:
        node = stack.pop()
        if node not in visited:
            visited.add(node)
            for neighbor in graph[node]:
                if neighbor not in visited:
                    stack.append(neighbor)
//@trace-map 1:1 2:2 3:3-5 4:6 5:7 6:8 7:9 8:10 9:11 10:12
//@practice dfs_order
//@spec {"fn": "dfs_order", "params": [{"name": "adj", "type": "int[][]"}, {"name": "start", "type": "int"}], "ret": "int[]"}
//@starter
/* Return the DFS (preorder) traversal order from start, visiting neighbors
 * in list order (malloc'd; set *returnSize). */
int* dfs_order(int** adj, int adjSize, int* adjColSize, int start, int* returnSize) {
    // Your code here
    *returnSize = 0;
    return NULL;
}
//@solution
static void visit(int** adj, int* deg, int u, bool* seen, int* order, int* n) {
    seen[u] = true;
    order[(*n)++] = u;
    for (int i = 0; i < deg[u]; i++)
        if (!seen[adj[u][i]]) visit(adj, deg, adj[u][i], seen, order, n);
}
int* dfs_order(int** adj, int adjSize, int* adjColSize, int start, int* returnSize) {
    bool* seen = calloc(adjSize, sizeof(bool));
    int* order = malloc(adjSize * sizeof(int));
    int n = 0;
    visit(adj, adjColSize, start, seen, order, &n);
    free(seen);
    *returnSize = n;
    return order;
}
//@practice has_cycle
//@spec {"fn": "has_cycle", "params": [{"name": "adj", "type": "int[][]"}, {"name": "n", "type": "int"}], "ret": "bool"}
//@starter
/* Return true if the directed graph has a cycle.
 * Hint: DFS with 3 colors - white (unvisited), gray (on stack), black (done). */
bool has_cycle(int** adj, int adjSize, int* adjColSize, int n) {
    // Your code here
    return false;
}
//@solution
static bool dfs_cycle(int** adj, int* deg, int u, int* color) {
    color[u] = 1;                                   // gray: on the current path
    for (int i = 0; i < deg[u]; i++) {
        int v = adj[u][i];
        if (color[v] == 1) return true;            // back edge
        if (color[v] == 0 && dfs_cycle(adj, deg, v, color)) return true;
    }
    color[u] = 2;                                   // black: fully explored
    return false;
}
bool has_cycle(int** adj, int adjSize, int* adjColSize, int n) {
    int* color = calloc(n, sizeof(int));
    bool found = false;
    for (int u = 0; u < n && !found; u++)
        if (color[u] == 0) found = dfs_cycle(adj, adjColSize, u, color);
    free(color);
    return found;
}
