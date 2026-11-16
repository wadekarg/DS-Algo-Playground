//@spec {"fn": "middleNode", "params": [{"name": "head", "type": "list"}], "ret": "list"}
//@driver
void dsa_driver(struct ListNode* head) {
    struct ListNode* mid = middleNode(head);
    if (mid) dsa_out_int(mid->val); else dsa_out_none();   // tests check the node's value
}
//@starter
/**
 * Definition for singly-linked list (provided by the test harness):
 * struct ListNode {
 *     int val;
 *     struct ListNode *next;
 * };
 * Return the middle node (the SECOND middle when the length is even).
 */
struct ListNode* middleNode(struct ListNode* head) {
    // Your code: fast/slow. When fast reaches the end, slow is the middle.
    return head;
}
//@approach Fast and Slow Pointers (one pass)
struct ListNode* middleNode(struct ListNode* head) {
    struct ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
    }
    return slow;
}
//@approach Two Pass (count then walk)
struct ListNode* middleNode(struct ListNode* head) {
    int n = 0;
    for (struct ListNode* node = head; node; node = node->next) n++;
    struct ListNode* node = head;
    for (int i = 0; i < n / 2; i++) node = node->next;  // second middle for even length
    return node;
}
