//@spec {"fn": "findItinerary", "params": [{"name": "tickets", "type": "string[][]"}], "ret": "string[]"}
//@approach Hierholzer + Min-Heap
// Sorting each airport's destinations and consuming them in order is the
// same as popping a per-source min-heap (smallest destination first).
static int cmp_ticket(const void* a, const void* b) {
    char** x = *(char** const*)a;
    char** y = *(char** const*)b;
    int c = strcmp(x[0], y[0]);
    return c ? c : strcmp(x[1], y[1]);       // by source, then destination
}
static char*** t_; static int n_, *used_;
static char** route_; static int route_len_;
static void dfs(const char* u) {
    for (int i = 0; i < n_; i++) {           // smallest unused ticket out of u
        if (used_[i] || strcmp(t_[i][0], u) != 0) continue;
        used_[i] = 1;
        dfs(t_[i][1]);
    }
    route_[route_len_++] = (char*)u;         // post-order: append when stuck
}
char** findItinerary(char*** tickets, int ticketsSize, int* ticketsColSize, int* returnSize) {
    n_ = ticketsSize;
    t_ = malloc(n_ * sizeof(char**));
    memcpy(t_, tickets, n_ * sizeof(char**));
    qsort(t_, n_, sizeof(char**), cmp_ticket);
    used_ = calloc(n_ + 1, sizeof(int));
    route_ = malloc((n_ + 1) * sizeof(char*));
    route_len_ = 0;
    dfs("JFK");
    // route_ is built backwards
    char** result = malloc((route_len_ + 1) * sizeof(char*));
    for (int i = 0; i < route_len_; i++) result[i] = route_[route_len_ - 1 - i];
    free(t_); free(used_); free(route_);
    *returnSize = route_len_;
    return result;
}
