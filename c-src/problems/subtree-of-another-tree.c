//@spec {"fn": "isSubtree", "params": [{"name": "root", "type": "tree"}, {"name": "subRoot", "type": "tree"}], "ret": "bool"}
//@approach Two-Recursion DFS
static bool isSame(struct TreeNode* a, struct TreeNode* b) {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return a->val == b->val && isSame(a->left, b->left) && isSame(a->right, b->right);
}
bool isSubtree(struct TreeNode* root, struct TreeNode* subRoot) {
    if (!subRoot) return true;
    if (!root) return false;
    return isSame(root, subRoot) || isSubtree(root->left, subRoot) || isSubtree(root->right, subRoot);
}
