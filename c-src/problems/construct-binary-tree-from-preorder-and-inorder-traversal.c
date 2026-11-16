//@spec {"fn": "buildTree", "params": [{"name": "preorder", "type": "int[]"}, {"name": "inorder", "type": "int[]"}], "ret": "tree"}
//@approach Recursive Divide with Hash Map
// Values are distinct; map value -> index in inorder with open addressing.
static int cap_, *keys_, *idx_; static bool* used_;
static int lookup(int v) {
    unsigned h = ((unsigned)v * 2654435761u) & (cap_ - 1);
    while (keys_[h] != v) h = (h + 1) & (cap_ - 1);
    return idx_[h];
}
static struct TreeNode* build(int* preorder, int* pre_idx, int lo, int hi) {
    if (lo > hi) return NULL;
    int root_val = preorder[(*pre_idx)++];
    struct TreeNode* node = calloc(1, sizeof(struct TreeNode));
    node->val = root_val;
    int mid = lookup(root_val);
    node->left = build(preorder, pre_idx, lo, mid - 1);
    node->right = build(preorder, pre_idx, mid + 1, hi);
    return node;
}
struct TreeNode* buildTree(int* preorder, int preorderSize, int* inorder, int inorderSize) {
    cap_ = 1;
    while (cap_ < 2 * inorderSize) cap_ <<= 1;
    keys_ = malloc(cap_ * sizeof(int));
    idx_ = malloc(cap_ * sizeof(int));
    used_ = calloc(cap_, sizeof(bool));
    for (int i = 0; i < inorderSize; i++) {
        unsigned h = ((unsigned)inorder[i] * 2654435761u) & (cap_ - 1);
        while (used_[h]) h = (h + 1) & (cap_ - 1);
        used_[h] = true; keys_[h] = inorder[i]; idx_[h] = i;
    }
    int pre_idx = 0;                       // preorder cursor
    struct TreeNode* root = build(preorder, &pre_idx, 0, inorderSize - 1);
    free(keys_); free(idx_); free(used_);
    return root;
}
