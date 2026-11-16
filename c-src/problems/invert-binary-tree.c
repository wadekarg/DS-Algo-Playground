//@spec {"fn": "invertTree", "params": [{"name": "root", "type": "tree"}], "ret": "tree"}
//@approach Recursive (DFS)
struct TreeNode* invertTree(struct TreeNode* root) {
    if (!root) return NULL;
    struct TreeNode* left = invertTree(root->left);
    root->left = invertTree(root->right);
    root->right = left;
    return root;
}
//@approach Iterative BFS (queue)
struct TreeNode* invertTree(struct TreeNode* root) {
    if (!root) return NULL;
    int cap = 64, head = 0, tail = 0;
    struct TreeNode** queue = malloc(cap * sizeof(struct TreeNode*));
    queue[tail++] = root;
    while (head < tail) {
        struct TreeNode* node = queue[head++];
        struct TreeNode* t = node->left;
        node->left = node->right;
        node->right = t;
        if (tail + 2 > cap) queue = realloc(queue, (cap *= 2) * sizeof(struct TreeNode*));
        if (node->left) queue[tail++] = node->left;
        if (node->right) queue[tail++] = node->right;
    }
    free(queue);
    return root;
}
