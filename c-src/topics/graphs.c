//@code
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

// Graph as an adjacency list: adj[u] holds deg[u] neighbours.

// ── BFS template ──────────────────────────────────────────────
int bfs(int** adj, int* deg, int n, int start, bool visited[]) {
    int* queue = malloc(n * sizeof(int));
    int head = 0, tail = 0;
    visited[start] = true;
    queue[tail++] = start;
    while (head < tail) {
        int node = queue[head++];
        for (int i = 0; i < deg[node]; i++) {
            int neighbour = adj[node][i];
            if (!visited[neighbour]) {
                visited[neighbour] = true;
                queue[tail++] = neighbour;
            }
        }
    }
    free(queue);
    return tail;  // number of nodes reached
}

// ── DFS template (iterative) ──────────────────────────────────
int dfs(int** adj, int* deg, int n, int start, bool visited[]) {
    int* stack = malloc(n * sizeof(int));
    int top = 0, reached = 1;
    visited[start] = true;
    stack[top++] = start;
    while (top > 0) {
        int node = stack[--top];
        for (int i = 0; i < deg[node]; i++) {
            int neighbour = adj[node][i];
            if (!visited[neighbour]) {
                visited[neighbour] = true;
                stack[top++] = neighbour;
                reached++;
            }
        }
    }
    free(stack);
    return reached;
}

// ── Grid BFS (number of islands pattern) ─────────────────────
#define ROWS 4
#define COLS 5
void grid_bfs(char grid[ROWS][COLS + 1], int r, int c, bool visited[ROWS][COLS]) {
    int qr[ROWS * COLS], qc[ROWS * COLS], head = 0, tail = 0;
    int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    visited[r][c] = true;
    qr[tail] = r; qc[tail++] = c;
    while (head < tail) {
        int row = qr[head], col = qc[head++];
        for (int d = 0; d < 4; d++) {
            int nr = row + dr[d], nc = col + dc[d];
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS &&
                !visited[nr][nc] && grid[nr][nc] == '1') {
                visited[nr][nc] = true;
                qr[tail] = nr; qc[tail++] = nc;
            }
        }
    }
}

int main(void) {
    // 0-1, 0-2, 1-3 and a separate edge 4-5
    int a0[] = {1, 2}, a1[] = {0, 3}, a2[] = {0}, a3[] = {1}, a4[] = {5}, a5[] = {4};
    int* adj[] = {a0, a1, a2, a3, a4, a5};
    int deg[] = {2, 2, 1, 1, 1, 1};
    bool seen[6] = {false};
    printf("BFS from 0 reaches %d nodes\n", bfs(adj, deg, 6, 0, seen));
    bool seen2[6] = {false};
    printf("DFS from 4 reaches %d nodes\n", dfs(adj, deg, 6, 4, seen2));

    char grid[ROWS][COLS + 1] = {"11000", "11000", "00100", "00011"};
    bool visited[ROWS][COLS] = {{false}};
    int islands = 0;
    for (int r = 0; r < ROWS; r++)
        for (int c = 0; c < COLS; c++)
            if (grid[r][c] == '1' && !visited[r][c]) {
                grid_bfs(grid, r, c, visited);
                islands++;
            }
    printf("Islands: %d\n", islands);
    return 0;
}
//@expect-output
BFS from 0 reaches 4 nodes
DFS from 4 reaches 2 nodes
Islands: 3
//@trace
int dfs(int** graph, int* deg, int n, int start, bool* visited) {
    int* stack = malloc(n * n * sizeof(int)); int top = 0, count = 0;
    stack[top++] = start;
    while (top > 0) {
        int node = stack[--top];
        if (visited[node]) continue;
        visited[node] = true; count++;
        for (int i = 0; i < deg[node]; i++)
            if (!visited[graph[node][i]])
                stack[top++] = graph[node][i];
    }
    free(stack); return count;
}
//@trace-python
def dfs(graph, start):
    visited, stack = set(), [start]
    while stack:
        node = stack.pop()
        if node in visited: continue
        visited.add(node)
        for nb in graph[node]:
            if nb not in visited:
                stack.append(nb)
    return visited
//@trace-map 1:1 2:2-3 3:4 4:5 5:6 6:7 7:8 8:9 9:10 10:12
