//@spec {"fn": "goodNodes", "params": [{"name": "root", "type": "tree"}], "ret": "int"}
//@approach DFS with Path-Max
static int dfs(struct TreeNode* node, int path_max) {
    if (!node) return 0;
    int count = node->val >= path_max ? 1 : 0;
    int new_max = node->val > path_max ? node->val : path_max;
    return count + dfs(node->left, new_max) + dfs(node->right, new_max);
}
int goodNodes(struct TreeNode* root) {
    return dfs(root, INT_MIN);
}
