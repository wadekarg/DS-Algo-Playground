//@spec {"fn": "maxDepth", "params": [{"name": "root", "type": "tree"}], "ret": "int"}
//@approach Recursive (DFS)
int maxDepth(struct TreeNode* root) {
    if (!root) return 0;
    int l = maxDepth(root->left), r = maxDepth(root->right);
    return 1 + (l > r ? l : r);
}
//@approach Iterative BFS (level counting)
int maxDepth(struct TreeNode* root) {
    if (!root) return 0;
    int cap = 64, head = 0, tail = 0, levels = 0;
    struct TreeNode** queue = malloc(cap * sizeof(struct TreeNode*));
    queue[tail++] = root;
    while (head < tail) {
        levels++;
        int level_end = tail;                 // everything queued so far is this level
        while (head < level_end) {
            struct TreeNode* node = queue[head++];
            if (tail + 2 > cap) queue = realloc(queue, (cap *= 2) * sizeof(struct TreeNode*));
            if (node->left) queue[tail++] = node->left;
            if (node->right) queue[tail++] = node->right;
        }
    }
    free(queue);
    return levels;
}
