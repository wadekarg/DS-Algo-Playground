//@spec {"fn": "kthSmallest", "params": [{"name": "root", "type": "tree"}, {"name": "k", "type": "int"}], "ret": "int"}
//@approach Iterative In-Order with Early Exit
int kthSmallest(struct TreeNode* root, int k) {
    struct TreeNode* stack[2048];          // tree height bound for these inputs
    int top = 0;
    struct TreeNode* node = root;
    while (top > 0 || node) {
        while (node) {                     // go as far left as possible
            stack[top++] = node;
            node = node->left;
        }
        node = stack[--top];
        if (--k == 0) return node->val;
        node = node->right;
    }
    return -1;  // unreachable per spec
}
//@approach Recursive In-Order
static void inorder(struct TreeNode* node, int k, int* vals, int* n) {
    if (!node || *n >= k) return;
    inorder(node->left, k, vals, n);
    if (*n < k) vals[(*n)++] = node->val;
    inorder(node->right, k, vals, n);
}
int kthSmallest(struct TreeNode* root, int k) {
    int* sorted_vals = malloc(k * sizeof(int));
    int n = 0;
    inorder(root, k, sorted_vals, &n);
    int ans = sorted_vals[k - 1];
    free(sorted_vals);
    return ans;
}
