//@spec {"fn": "wallsAndGates", "params": [{"name": "rooms", "type": "int[][]"}], "ret": "void", "print": "rooms"}
//@starter
// Fill each empty room (INT_MAX) with the distance to its nearest gate (0);
// walls are -1. Modify rooms in place (the harness prints it afterwards).
// Hint: multi-source BFS from all gates at once.
void wallsAndGates(int** rooms, int roomsSize, int* roomsColSize) {
    // Your code here
}
//@approach Multi-Source BFS from All Gates
void wallsAndGates(int** rooms, int roomsSize, int* roomsColSize) {
    if (roomsSize == 0) return;
    int m = roomsSize, n = roomsColSize[0];
    int* queue = malloc(m * n * sizeof(int));
    int head = 0, tail = 0, dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    for (int r = 0; r < m; r++)
        for (int c = 0; c < n; c++)
            if (rooms[r][c] == 0) queue[tail++] = r * n + c;
    while (head < tail) {
        int r = queue[head] / n, c = queue[head++] % n;
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr >= 0 && nr < m && nc >= 0 && nc < n && rooms[nr][nc] == INT_MAX) {
                rooms[nr][nc] = rooms[r][c] + 1;
                queue[tail++] = nr * n + nc;
            }
        }
    }
    free(queue);
}
