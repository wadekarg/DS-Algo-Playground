//@spec {"fn": "rightSideView", "params": [{"name": "root", "type": "tree"}], "ret": "int[]"}
//@approach BFS, Rightmost per Level
int* rightSideView(struct TreeNode* root, int* returnSize) {
    int cap = 2048, head = 0, tail = 0, n = 0;
    struct TreeNode** queue = malloc(cap * sizeof(struct TreeNode*));
    int* result = malloc(cap * sizeof(int));
    if (root) queue[tail++] = root;
    while (head < tail) {
        int size = tail - head;
        for (int i = 0; i < size; i++) {
            struct TreeNode* node = queue[head++];
            if (i == size - 1) result[n++] = node->val;   // last node of the level
            if (node->left) queue[tail++] = node->left;
            if (node->right) queue[tail++] = node->right;
        }
    }
    free(queue);
    *returnSize = n;
    return result;
}
//@approach DFS Right-First with Depth
static void dfs(struct TreeNode* node, int depth, int* result, int* n) {
    if (!node) return;
    if (depth == *n) result[(*n)++] = node->val;   // first time we hit this depth
    dfs(node->right, depth + 1, result, n);
    dfs(node->left, depth + 1, result, n);
}
int* rightSideView(struct TreeNode* root, int* returnSize) {
    int* result = malloc(2048 * sizeof(int));
    *returnSize = 0;
    dfs(root, 0, result, returnSize);
    return result;
}
