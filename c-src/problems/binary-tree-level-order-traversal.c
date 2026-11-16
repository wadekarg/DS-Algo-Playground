//@spec {"fn": "levelOrder", "params": [{"name": "root", "type": "tree"}], "ret": "int[][]"}
//@approach BFS with Queue (snapshot size)
int** levelOrder(struct TreeNode* root, int* returnSize, int** returnColumnSizes) {
    int cap = 2048, head = 0, tail = 0, levels = 0;
    struct TreeNode** queue = malloc(cap * sizeof(struct TreeNode*));
    int** result = malloc(cap * sizeof(int*));
    *returnColumnSizes = malloc(cap * sizeof(int));
    if (root) queue[tail++] = root;
    while (head < tail) {
        int size = tail - head;               // snapshot size = exactly this level's count
        int* level = malloc(size * sizeof(int));
        for (int i = 0; i < size; i++) {
            struct TreeNode* node = queue[head++];
            level[i] = node->val;
            if (node->left) queue[tail++] = node->left;
            if (node->right) queue[tail++] = node->right;
        }
        result[levels] = level;
        (*returnColumnSizes)[levels++] = size;
    }
    free(queue);
    *returnSize = levels;
    return result;
}
//@approach DFS with Level Counter
static int **res_, *sizes_, *caps_, depth_count_;
static void dfs(struct TreeNode* node, int depth) {
    if (!node) return;
    if (depth == depth_count_) {              // first node at this depth: new level
        caps_[depth] = 4;
        res_[depth] = malloc(caps_[depth] * sizeof(int));
        sizes_[depth] = 0;
        depth_count_++;
    }
    if (sizes_[depth] == caps_[depth]) res_[depth] = realloc(res_[depth], (caps_[depth] *= 2) * sizeof(int));
    res_[depth][sizes_[depth]++] = node->val;
    dfs(node->left, depth + 1);
    dfs(node->right, depth + 1);
}
int** levelOrder(struct TreeNode* root, int* returnSize, int** returnColumnSizes) {
    int max_depth = 2048;
    res_ = malloc(max_depth * sizeof(int*));
    sizes_ = malloc(max_depth * sizeof(int));
    caps_ = malloc(max_depth * sizeof(int));
    depth_count_ = 0;
    dfs(root, 0);
    free(caps_);
    *returnSize = depth_count_;
    *returnColumnSizes = sizes_;
    return res_;
}
