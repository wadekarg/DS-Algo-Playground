//@spec {"fn": "isBalanced", "params": [{"name": "root", "type": "tree"}], "ret": "bool"}
//@approach Bottom-Up DFS with Sentinel
// Height of the subtree, or -1 if it is unbalanced anywhere.
static int check(struct TreeNode* node) {
    if (!node) return 0;
    int left = check(node->left);
    if (left == -1) return -1;
    int right = check(node->right);
    if (right == -1) return -1;
    if (abs(left - right) > 1) return -1;
    return 1 + (left > right ? left : right);
}
bool isBalanced(struct TreeNode* root) {
    return check(root) != -1;
}
//@approach Top-Down (Don't ship this)
static int height(struct TreeNode* node) {
    if (!node) return 0;
    int l = height(node->left), r = height(node->right);
    return 1 + (l > r ? l : r);
}
bool isBalanced(struct TreeNode* root) {
    if (!root) return true;
    if (abs(height(root->left) - height(root->right)) > 1) return false;
    return isBalanced(root->left) && isBalanced(root->right);
}
