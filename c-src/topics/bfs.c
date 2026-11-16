//@code
#include <stdio.h>
#include <stdbool.h>

#define MAX_NODES 16

/* Perform BFS from start node. Writes visit order into order[], returns its length. */
int bfs(int graph[][MAX_NODES], int deg[], int n, int start, int order[]) {
    bool visited[MAX_NODES] = {false};
    int queue[MAX_NODES];
    int head = 0, tail = 0, count = 0;

    queue[tail++] = start;
    visited[start] = true;

    while (head < tail) {
        int node = queue[head++];          // Dequeue from front
        order[count++] = node;

        for (int i = 0; i < deg[node]; i++) {
            int neighbor = graph[node][i];
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                queue[tail++] = neighbor;  // Enqueue at back
            }
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
    int count = bfs(graph, deg, 7, 0, order);

    printf("[");
    for (int i = 0; i < count; i++) printf(i ? ", %d" : "%d", order[i]);
    printf("]\n");  // Output: [0, 1, 2, 3, 4, 5, 6]
    return 0;
}
//@trace
void bfs(int** graph, int* deg, int n, int start) {
    bool* visited = calloc(n, sizeof(bool));
    int* queue = malloc(n * sizeof(int));
    int head = 0, tail = 0;
    queue[tail++] = start;
    visited[start] = true;
    while (head < tail) {
        int node = queue[head++];
        for (int i = 0; i < deg[node]; i++) {
            int neighbor = graph[node][i];
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                queue[tail++] = neighbor;
            }
        }
    }
    free(visited); free(queue);
}
//@trace-map 1:1 2:2 3:3-5 4:6 5:7 6:8 7:9-10 8:11 9:12 10:13
//@practice level_order
//@spec {"fn": "level_order", "params": [{"name": "adj", "type": "int[][]"}, {"name": "start", "type": "int"}, {"name": "n", "type": "int"}], "ret": "int[]"}
//@starter
/* Return the BFS traversal order from start (malloc'd; set *returnSize).
 * adj[u] lists u's neighbors; adjColSize[u] is how many there are. */
int* level_order(int** adj, int adjSize, int* adjColSize, int start, int n, int* returnSize) {
    // Your code here
    *returnSize = 0;
    return NULL;
}
//@solution
int* level_order(int** adj, int adjSize, int* adjColSize, int start, int n, int* returnSize) {
    bool* seen = calloc(n, sizeof(bool));
    int* order = malloc(n * sizeof(int));
    int head = 0, tail = 0;
    order[tail++] = start;          // the queue doubles as the visit order
    seen[start] = true;
    while (head < tail) {
        int u = order[head++];
        for (int i = 0; i < adjColSize[u]; i++) {
            int v = adj[u][i];
            if (!seen[v]) { seen[v] = true; order[tail++] = v; }
        }
    }
    free(seen);
    *returnSize = tail;
    return order;
}
//@practice shortest_path
//@spec {"fn": "shortest_path", "params": [{"name": "adj", "type": "int[][]"}, {"name": "start", "type": "int"}, {"name": "end", "type": "int"}], "ret": "int"}
//@starter
/* Return the BFS shortest path length (edges) from start to end, or -1. */
int shortest_path(int** adj, int adjSize, int* adjColSize, int start, int end) {
    // Your code here
    return -1;
}
//@solution
int shortest_path(int** adj, int adjSize, int* adjColSize, int start, int end) {
    int* dist = malloc(adjSize * sizeof(int));
    int* queue = malloc(adjSize * sizeof(int));
    for (int i = 0; i < adjSize; i++) dist[i] = -1;
    int head = 0, tail = 0;
    dist[start] = 0;
    queue[tail++] = start;
    while (head < tail) {
        int u = queue[head++];
        if (u == end) break;
        for (int i = 0; i < adjColSize[u]; i++) {
            int v = adj[u][i];
            if (dist[v] == -1) { dist[v] = dist[u] + 1; queue[tail++] = v; }
        }
    }
    int ans = dist[end];
    free(dist); free(queue);
    return ans;
}
