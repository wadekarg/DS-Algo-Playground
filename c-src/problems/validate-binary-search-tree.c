//@spec {"fn": "isValidBST", "params": [{"name": "root", "type": "tree"}], "ret": "bool"}
//@approach DFS with Bounds
// long long bounds so INT_MIN / INT_MAX node values still work.
static bool valid(struct TreeNode* node, long long lo, long long hi) {
    if (!node) return true;
    if (!(lo < node->val && node->val < hi)) return false;
    return valid(node->left, lo, node->val) && valid(node->right, node->val, hi);
}
bool isValidBST(struct TreeNode* root) {
    return valid(root, LLONG_MIN, LLONG_MAX);
}
//@approach In-Order Traversal Check
static bool inorder(struct TreeNode* node, long long* prev) {
    if (!node) return true;
    if (!inorder(node->left, prev)) return false;
    if (node->val <= *prev) return false;      // in-order must be strictly increasing
    *prev = node->val;
    return inorder(node->right, prev);
}
bool isValidBST(struct TreeNode* root) {
    long long prev = LLONG_MIN;
    return inorder(root, &prev);
}
