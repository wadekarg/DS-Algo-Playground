//@code
#include <stdio.h>
#include <stdlib.h>
#include <limits.h>

// ── Dijkstra (single-source shortest path, non-negative weights) ──
// Graph as an edge list per node: adj[u][i] = {neighbour, cost}.
typedef struct { int v, w; } Edge;
typedef struct { int cost, node; } Item;   // heap entry

static void heap_push(Item* h, int* n, Item x) {
    int i = (*n)++;
    h[i] = x;
    while (i > 0 && h[(i - 1) / 2].cost > h[i].cost) {
        Item t = h[i]; h[i] = h[(i - 1) / 2]; h[(i - 1) / 2] = t;
        i = (i - 1) / 2;
    }
}

static Item heap_pop(Item* h, int* n) {
    Item top = h[0];
    h[0] = h[--(*n)];
    for (int i = 0;;) {
        int s = i, l = 2 * i + 1, r = l + 1;
        if (l < *n && h[l].cost < h[s].cost) s = l;
        if (r < *n && h[r].cost < h[s].cost) s = r;
        if (s == i) break;
        Item t = h[i]; h[i] = h[s]; h[s] = t;
        i = s;
    }
    return top;
}

void dijkstra(Edge** adj, int* deg, int n, int src, int dist[]) {
    int edges = 0;
    for (int u = 0; u < n; u++) edges += deg[u];
    Item* heap = malloc((edges + 1) * sizeof(Item));
    int size = 0;
    for (int i = 0; i < n; i++) dist[i] = INT_MAX;
    dist[src] = 0;
    heap_push(heap, &size, (Item){0, src});
    while (size > 0) {
        Item it = heap_pop(heap, &size);
        int u = it.node;
        if (it.cost > dist[u]) continue;   // already found a shorter path
        for (int i = 0; i < deg[u]; i++) {
            int v = adj[u][i].v, w = adj[u][i].w;
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                heap_push(heap, &size, (Item){dist[v], v});
            }
        }
    }
    free(heap);
}

// ── Kahn's Topological Sort (BFS + in-degree) ──────────────────
// prereqs[i] = {a, b} means b -> a. Returns the order length (< n = cycle).
int topo_sort(int n, int prereqs[][2], int m, int order[]) {
    int* indeg = calloc(n, sizeof(int));
    int* cnt = calloc(n, sizeof(int));
    for (int i = 0; i < m; i++) { indeg[prereqs[i][0]]++; cnt[prereqs[i][1]]++; }
    int** graph = malloc(n * sizeof(int*));
    for (int u = 0; u < n; u++) { graph[u] = malloc((cnt[u] + 1) * sizeof(int)); cnt[u] = 0; }
    for (int i = 0; i < m; i++) {
        int a = prereqs[i][0], b = prereqs[i][1];
        graph[b][cnt[b]++] = a;
    }
    int head = 0, tail = 0;                 // order[] doubles as the queue
    for (int i = 0; i < n; i++) if (indeg[i] == 0) order[tail++] = i;
    while (head < tail) {
        int node = order[head++];
        for (int i = 0; i < cnt[node]; i++) {
            int nb = graph[node][i];
            if (--indeg[nb] == 0) order[tail++] = nb;
        }
    }
    for (int u = 0; u < n; u++) free(graph[u]);
    free(graph); free(indeg); free(cnt);
    return tail;  // tail < n means a cycle was detected
}

int main(void) {
    // 0 -> 1 (4), 0 -> 2 (1), 2 -> 1 (2), 1 -> 3 (1)
    Edge e0[] = {{1, 4}, {2, 1}}, e1[] = {{3, 1}}, e2[] = {{1, 2}};
    Edge* adj[] = {e0, e1, e2, NULL};
    int deg[] = {2, 1, 1, 0};
    int dist[4];
    dijkstra(adj, deg, 4, 0, dist);
    printf("Dijkstra from 0:");
    for (int i = 0; i < 4; i++) printf(" %d", dist[i]);
    printf("\n");

    int prereqs[][2] = {{1, 0}, {2, 0}, {3, 1}, {3, 2}};
    int order[4];
    int len = topo_sort(4, prereqs, 4, order);
    printf("Topological order:");
    for (int i = 0; i < len; i++) printf(" %d", order[i]);
    printf("\n");
    return 0;
}
//@expect-output
Dijkstra from 0: 0 3 1 4
Topological order: 0 1 2 3
//@trace-prelude
typedef struct { int v, w; } Edge;
typedef struct { int d, u; } Item;
void heappush(Item* heap, int* size, Item x);
Item heappop(Item* heap, int* size);
//@trace
void dijkstra(Edge** graph, int* deg, int n, int src, int* dist, Item* heap) {
    for (int i = 0; i < n; i++) dist[i] = INT_MAX;
    dist[src] = 0; int size = 0;
    heappush(heap, &size, (Item){0, src});  // (dist, node)
    while (size > 0) {
        Item top = heappop(heap, &size); int d = top.d, u = top.u;
        for (int i = 0; i < deg[u]; i++) {
            int v = graph[u][i].v, w = graph[u][i].w;
            if (d + w < dist[v]) {
                dist[v] = d + w;
                heappush(heap, &size, (Item){dist[v], v});
            }
        }
    }
}
//@trace-python
def dijkstra(graph, src):
    dist = {n: inf for n in graph}
    dist[src] = 0
    heap = [(0, src)]          # (dist, node)
    while heap:
        d, u = heappop(heap)
        for v, w in graph[u]:
            if d + w < dist[v]:
                dist[v] = d + w
                heappush(heap, (dist[v], v))
    return dist
//@trace-map 1:1 2:2 3:3 4:4 5:5 6:6 7:7-8 8:9 9:10 10:11 11:15
