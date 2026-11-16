//@spec {"fn": "serialize", "params": [{"name": "root", "type": "tree"}], "ret": "tree"}
//@driver
// Round trip: deserialize(serialize(root)) must rebuild the same tree.
void dsa_driver(struct TreeNode* root) {
    char* data = serialize(root);
    struct TreeNode* rebuilt = deserialize(data);
    dsa_out_tree(rebuilt);
}
//@starter
/**
 * Definition for a binary tree node (provided by the test harness):
 * struct TreeNode {
 *     int val;
 *     struct TreeNode *left;
 *     struct TreeNode *right;
 * };
 */

/** Encodes a tree to a single (malloc'd) string. Use a sentinel like '#' for NULL. */
char* serialize(struct TreeNode* root) {
    return NULL;
}

/** Decodes your encoded data back to a tree. */
struct TreeNode* deserialize(char* data) {
    return NULL;
}
//@approach Preorder DFS with Null Sentinel
static void ser(struct TreeNode* node, char** buf, int* len, int* cap) {
    if (*len + 16 > *cap) *buf = realloc(*buf, *cap *= 2);
    if (!node) {
        *len += sprintf(*buf + *len, "#,");
        return;
    }
    *len += sprintf(*buf + *len, "%d,", node->val);
    ser(node->left, buf, len, cap);
    ser(node->right, buf, len, cap);
}
char* serialize(struct TreeNode* root) {
    int cap = 64, len = 0;
    char* buf = malloc(cap);
    ser(root, &buf, &len, &cap);
    buf[len ? len - 1 : 0] = '\0';         // drop the trailing comma
    return buf;
}
static struct TreeNode* des(char** p) {
    if (**p == '#') {
        *p += (*p)[1] == ',' ? 2 : 1;
        return NULL;
    }
    struct TreeNode* node = calloc(1, sizeof(struct TreeNode));
    node->val = (int)strtol(*p, p, 10);
    if (**p == ',') (*p)++;
    node->left = des(p);
    node->right = des(p);
    return node;
}
struct TreeNode* deserialize(char* data) {
    char* p = data;
    return des(&p);
}
