//@spec {"fn": "lowestCommonAncestor", "params": [{"name": "root", "type": "tree"}, {"name": "p", "type": "int"}, {"name": "q", "type": "int"}], "ret": "tree"}
//@driver
// Tests give p and q as values; find those nodes, then print the LCA's value.
static struct TreeNode* dsa_find(struct TreeNode* t, int v) {
    while (t && t->val != v) t = v < t->val ? t->left : t->right;
    return t;
}
void dsa_driver(struct TreeNode* root, int p, int q) {
    struct TreeNode* lca = lowestCommonAncestor(root, dsa_find(root, p), dsa_find(root, q));
    if (lca) dsa_out_int(lca->val); else dsa_out_none();
}
//@starter
/**
 * Definition for a binary tree node (provided by the test harness):
 * struct TreeNode {
 *     int val;
 *     struct TreeNode *left;
 *     struct TreeNode *right;
 * };
 * root is a BST; p and q are nodes in it. Return their lowest common ancestor.
 */
struct TreeNode* lowestCommonAncestor(struct TreeNode* root, struct TreeNode* p, struct TreeNode* q) {
    // Navigate the BST: if p and q are both smaller, go left; both larger, go right.
    // Otherwise this node is the LCA.
    return NULL;
}
//@approach Iterative BST Navigation
struct TreeNode* lowestCommonAncestor(struct TreeNode* root, struct TreeNode* p, struct TreeNode* q) {
    struct TreeNode* node = root;
    while (node) {
        if (p->val < node->val && q->val < node->val) node = node->left;
        else if (p->val > node->val && q->val > node->val) node = node->right;
        else return node;   // values straddle the current node (or one equals it)
    }
    return NULL;
}
//@approach Recursive
struct TreeNode* lowestCommonAncestor(struct TreeNode* root, struct TreeNode* p, struct TreeNode* q) {
    if (p->val < root->val && q->val < root->val) return lowestCommonAncestor(root->left, p, q);
    if (p->val > root->val && q->val > root->val) return lowestCommonAncestor(root->right, p, q);
    return root;
}
