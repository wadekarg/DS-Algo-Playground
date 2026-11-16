//@code
#include <stdio.h>
#include <stdlib.h>

typedef struct BSTNode {
    int val;
    struct BSTNode* left;
    struct BSTNode* right;
} BSTNode;

BSTNode* new_node(int val) {
    BSTNode* node = malloc(sizeof(BSTNode));
    node->val = val;
    node->left = node->right = NULL;
    return node;
}

/* Insert a value into the BST and return the root. */
BSTNode* insert(BSTNode* root, int val) {
    if (root == NULL) return new_node(val);
    if (val < root->val)
        root->left = insert(root->left, val);
    else if (val > root->val)
        root->right = insert(root->right, val);
    return root;
}

/* Return the node containing val, or NULL if not found. */
BSTNode* search(BSTNode* root, int val) {
    if (root == NULL || root->val == val) return root;
    if (val < root->val) return search(root->left, val);
    return search(root->right, val);
}

/* Print values in sorted (inorder) order. */
void inorder(BSTNode* root, int* first) {
    if (root == NULL) return;
    inorder(root->left, first);
    printf(*first ? "%d" : ", %d", root->val);
    *first = 0;
    inorder(root->right, first);
}

int main(void) {
    // Example usage
    BSTNode* root = NULL;
    int values[] = {50, 30, 70, 20, 40, 60, 80};
    for (int i = 0; i < 7; i++) root = insert(root, values[i]);

    int first = 1;
    printf("[");
    inorder(root, &first);
    printf("]\n");                                  // [20, 30, 40, 50, 60, 70, 80]

    BSTNode* hit = search(root, 40);
    printf("found node with val %d\n", hit->val);   // found node with val 40
    printf("%s\n", search(root, 99) ? "found" : "NULL");   // NULL
    return 0;
}
//@expect-output
[20, 30, 40, 50, 60, 70, 80]
found node with val 40
NULL
//@trace-prelude
typedef struct Node { int val; struct Node *left, *right; } Node;
Node* new_node(int val);
void visit(int val);
//@trace
Node* insert(Node* node, int val) {
    if (!node) return new_node(val);
    if (val < node->val)
        node->left = insert(node->left, val);
    else if (val > node->val)
        node->right = insert(node->right, val);
    return node;
}
Node* search(Node* node, int val) {
    if (node == NULL || node->val == val)
        return node;
    if (val < node->val)
        return search(node->left, val);
    return search(node->right, val);
}
Node* delete(Node* node, int val) {
    if (val < node->val)
        node->left = delete(node->left, val);
    else if (val > node->val)
        node->right = delete(node->right, val);
    else {
        if (!node->left) return node->right;
        if (!node->right) return node->left;
        Node* succ = node->right;        // inorder successor
        while (succ->left) succ = succ->left;
        node->val = succ->val;
        node->right = delete(node->right, succ->val);
    }
    return node;
}
void inorder(Node* node) {
    if (node) {
        inorder(node->left);
        visit(node->val);
        inorder(node->right);
    }
}
void preorder(Node* node) {
    if (node) {
        visit(node->val);
        preorder(node->left);
        preorder(node->right);
    }
}
//@trace-map 1:1 2:2 3:3 4:4 5:5 6:6 7:7 8:9 9:10 10:11 11:12 12:13 13:14 14:16 15:17 16:18 17:19 18:20 19:21 20:22 21:23 22:24 23:25 24:26 25:27 26:29 27:31 28:32 29:33 30:34 31:35 32:38 33:39 34:40 35:41 36:42
//@trace-python
def insert(node, val):
    if not node: return Node(val)
    if val < node.val:
        node.left = insert(node.left, val)
    elif val > node.val:
        node.right = insert(node.right, val)
    return node
def search(node, val):
    if node is None or node.val == val:
        return node
    if val < node.val:
        return search(node.left, val)
    return search(node.right, val)
def delete(node, val):
    if val < node.val:
        node.left = delete(node.left, val)
    elif val > node.val:
        node.right = delete(node.right, val)
    else:
        if not node.left: return node.right
        if not node.right: return node.left
        succ = node.right            # inorder successor
        while succ.left: succ = succ.left
        node.val = succ.val
        node.right = delete(node.right, succ.val)
    return node
def inorder(node):
    if node:
        inorder(node.left)
        visit(node.val)
        inorder(node.right)
def preorder(node):
    if node:
        visit(node.val)
        preorder(node.left)
        preorder(node.right)
//@practice is_bst_valid
//@spec {"fn": "is_bst_valid", "params": [{"name": "arr", "type": "int[]"}], "ret": "bool"}
//@starter
/* Return true if arr is strictly increasing (a valid BST inorder sequence). */
bool is_bst_valid(int* arr, int arrSize) {
    // Your code here
    return false;
}
//@solution
bool is_bst_valid(int* arr, int arrSize) {
    for (int i = 1; i < arrSize; i++)
        if (arr[i - 1] >= arr[i]) return false;
    return true;
}
//@practice kth_smallest
//@spec {"fn": "kth_smallest", "params": [{"name": "arr", "type": "int[]"}, {"name": "k", "type": "int"}], "ret": "int"}
//@starter
/* Return the kth smallest element (1-indexed) from a sorted inorder list. */
int kth_smallest(int* arr, int arrSize, int k) {
    // Your code here
    return 0;
}
//@solution
int kth_smallest(int* arr, int arrSize, int k) {
    return arr[k - 1];
}
