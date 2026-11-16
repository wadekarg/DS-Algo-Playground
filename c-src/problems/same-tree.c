//@spec {"fn": "isSameTree", "params": [{"name": "p", "type": "tree"}, {"name": "q", "type": "tree"}], "ret": "bool"}
//@approach Recursive Comparison
bool isSameTree(struct TreeNode* p, struct TreeNode* q) {
    if (!p && !q) return true;
    if (!p || !q) return false;
    return p->val == q->val && isSameTree(p->left, q->left) && isSameTree(p->right, q->right);
}
//@approach Iterative BFS with Pairs
bool isSameTree(struct TreeNode* p, struct TreeNode* q) {
    int cap = 64, head = 0, tail = 0;
    struct TreeNode** queue = malloc(cap * sizeof(struct TreeNode*));   // pairs: [a, b]
    queue[tail++] = p; queue[tail++] = q;
    bool same = true;
    while (head < tail && same) {
        struct TreeNode *a = queue[head++], *b = queue[head++];
        if (!a && !b) continue;
        if (!a || !b || a->val != b->val) { same = false; break; }
        if (tail + 4 > cap) queue = realloc(queue, (cap *= 2) * sizeof(struct TreeNode*));
        queue[tail++] = a->left;  queue[tail++] = b->left;
        queue[tail++] = a->right; queue[tail++] = b->right;
    }
    free(queue);
    return same;
}
