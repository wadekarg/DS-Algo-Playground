//@spec {"fn": "diameterOfBinaryTree", "params": [{"name": "root", "type": "tree"}], "ret": "int"}
//@approach DFS with Side-Effect Max
static int depth(struct TreeNode* node, int* diameter) {
    if (!node) return 0;
    int left = depth(node->left, diameter);
    int right = depth(node->right, diameter);
    // Diameter through this node = left depth + right depth (in edges)
    if (left + right > *diameter) *diameter = left + right;
    return 1 + (left > right ? left : right);
}
int diameterOfBinaryTree(struct TreeNode* root) {
    int diameter = 0;
    depth(root, &diameter);
    return diameter;
}
