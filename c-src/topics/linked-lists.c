//@code
#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node* next;
} Node;

Node* new_node(int data) {
    Node* node = malloc(sizeof(Node));
    node->data = data;
    node->next = NULL;
    return node;
}

/* Insert a new node at the beginning. O(1) */
void insert_at_head(Node** head, int data) {
    Node* node = new_node(data);
    node->next = *head;
    *head = node;
}

/* Insert a new node at the given index. O(n). Returns 0 on success. */
int insert_at_index(Node** head, int data, int index) {
    if (index == 0) {
        insert_at_head(head, data);
        return 0;
    }
    Node* current = *head;
    for (int i = 0; i < index - 1; i++) {
        if (current == NULL) return -1;       // index out of bounds
        current = current->next;
    }
    if (current == NULL) return -1;
    Node* node = new_node(data);
    node->next = current->next;
    current->next = node;
    return 0;
}

/* Delete the node at the given index. O(n). Returns 0 on success. */
int delete_at_index(Node** head, int index) {
    if (*head == NULL) return -1;             // list is empty
    if (index == 0) {
        Node* old = *head;
        *head = old->next;
        free(old);
        return 0;
    }
    Node* current = *head;
    for (int i = 0; i < index - 1; i++) {
        if (current->next == NULL) return -1;
        current = current->next;
    }
    if (current->next == NULL) return -1;
    Node* doomed = current->next;
    current->next = doomed->next;
    free(doomed);
    return 0;
}

/* Search for a value. Returns index or -1. O(n) */
int search(Node* head, int value) {
    int index = 0;
    for (Node* current = head; current != NULL; current = current->next) {
        if (current->data == value) return index;
        index++;
    }
    return -1;
}

/* Print the list in a readable format. */
void print_list(Node* head) {
    for (Node* current = head; current != NULL; current = current->next)
        printf("%d -> ", current->data);
    printf("NULL\n");
}

int main(void) {
    // Example usage
    Node* head = NULL;
    int values[] = {17, 42, 8, 25, 10};
    for (int i = 0; i < 5; i++) insert_at_head(&head, values[i]);

    print_list(head);              // 10 -> 25 -> 8 -> 42 -> 17 -> NULL
    insert_at_index(&head, 99, 2);
    print_list(head);              // 10 -> 25 -> 99 -> 8 -> 42 -> 17 -> NULL
    delete_at_index(&head, 3);
    print_list(head);              // 10 -> 25 -> 99 -> 42 -> 17 -> NULL
    printf("%d\n", search(head, 42));   // 3
    printf("%d\n", search(head, 100));  // -1

    while (head) { Node* next = head->next; free(head); head = next; }
    return 0;
}
//@expect-output
10 -> 25 -> 8 -> 42 -> 17 -> NULL
10 -> 25 -> 99 -> 8 -> 42 -> 17 -> NULL
10 -> 25 -> 99 -> 42 -> 17 -> NULL
3
-1
//@trace
typedef struct Node {
    int val; struct Node* next;
} Node;

Node* insert_head(Node* head, int val) {
    Node* node = new_node(val);
    node->next = head;
    return node;              // new head
}
void insert_at(Node* head, int index, int val) {
    Node* cur = head;
    for (int k = 0; k < index - 1; k++)
        cur = cur->next;
    Node* node = new_node(val);
    node->next = cur->next; cur->next = node;
}
Node* delete_at(Node* head, int index) {
    if (index == 0)
        return head->next;
    Node* cur = head;
    for (int k = 0; k < index - 1; k++)
        cur = cur->next;
    cur->next = cur->next->next;
    return head;
}
int search(Node* head, int val) {
    int i = 0;
    for (Node* cur = head; cur; cur = cur->next, i++)
        if (cur->val == val) return i;
    return -1;
}
//@trace-prelude
typedef struct Node Node;
Node* new_node(int val);
//@trace-python
class Node:
    def __init__(self, val):
        self.val, self.next = val, None

def insert_head(head, val):
    node = Node(val)
    node.next = head
    return node              # new head

def insert_at(head, index, val):
    cur = head
    for _ in range(index - 1):
        cur = cur.next
    node = Node(val)
    node.next, cur.next = cur.next, node

def delete_at(head, index):
    if index == 0:
        return head.next
    cur = head
    for _ in range(index - 1):
        cur = cur.next
    cur.next = cur.next.next
    return head

def search(head, val):
    cur, i = head, 0
    while cur:
        if cur.val == val: return i
        cur, i = cur.next, i + 1
    return -1
//@trace-map 1:1-3 2:2 3:2 5:5 6:6 7:7 8:8 10:10 11:11 12:12 13:13 14:14 15:15 17:17 18:18 19:19 20:20 21:21 22:22 23:23 24:24 26:26 27:27 28:28 29:29 30:28 31:30
//@practice reverse_list
//@spec {"fn": "reverse_list", "params": [{"name": "head", "type": "list"}], "ret": "list"}
//@starter
/**
 * struct ListNode { int val; struct ListNode *next; };  (provided)
 * Reverse the linked list and return the new head.
 */
struct ListNode* reverse_list(struct ListNode* head) {
    // Your code here
    return head;
}
//@solution
struct ListNode* reverse_list(struct ListNode* head) {
    struct ListNode* prev = NULL;
    while (head) {
        struct ListNode* next = head->next;
        head->next = prev;
        prev = head;
        head = next;
    }
    return prev;
}
//@practice find_middle
//@spec {"fn": "find_middle", "params": [{"name": "head", "type": "list"}], "ret": "int"}
//@starter
/**
 * struct ListNode { int val; struct ListNode *next; };  (provided)
 * Return the middle node's value (right-middle for even length).
 */
int find_middle(struct ListNode* head) {
    // Your code here
    return 0;
}
//@solution
int find_middle(struct ListNode* head) {
    struct ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
    }
    return slow->val;
}
