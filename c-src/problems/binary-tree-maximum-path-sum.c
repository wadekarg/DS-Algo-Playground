//@spec {"fn": "maxPathSum", "params": [{"name": "root", "type": "tree"}], "ret": "int"}
//@approach Dual-Return DFS (arm + global max)
// Returns the best single-arm path going down from node; updates *best with
// the best path that bends through node (left arm + node + right arm).
static int arm(struct TreeNode* node, int* best) {
    if (!node) return 0;
    int left = arm(node->left, best);
    int right = arm(node->right, best);
    if (left < 0) left = 0;                // clip negative arms
    if (right < 0) right = 0;
    int through = node->val + left + right;
    if (through > *best) *best = through;
    return node->val + (left > right ? left : right);
}
int maxPathSum(struct TreeNode* root) {
    int best = INT_MIN;
    arm(root, &best);
    return best;
}
