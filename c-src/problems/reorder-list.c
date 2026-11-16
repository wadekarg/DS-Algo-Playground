//@spec {"fn": "reorderList", "params": [{"name": "head", "type": "list"}], "ret": "void", "print": "head"}
//@starter
/**
 * Definition for singly-linked list (provided by the test harness):
 * struct ListNode {
 *     int val;
 *     struct ListNode *next;
 * };
 * Reorder L0 -> L1 -> ... -> Ln into L0 -> Ln -> L1 -> Ln-1 -> ... in place
 * (the harness prints the list from head afterwards).
 */
void reorderList(struct ListNode* head) {
    // 1) Find the middle (slow/fast). 2) Reverse the second half. 3) Interleave.
}
//@approach Find Middle + Reverse + Weave
void reorderList(struct ListNode* head) {
    if (!head || !head->next) return;
    // 1) Find middle
    struct ListNode *slow = head, *fast = head;
    while (fast->next && fast->next->next) {
        slow = slow->next;
        fast = fast->next->next;
    }
    // 2) Reverse second half
    struct ListNode *prev = NULL, *curr = slow->next;
    slow->next = NULL;
    while (curr) {
        struct ListNode* nxt = curr->next;
        curr->next = prev;
        prev = curr;
        curr = nxt;
    }
    // 3) Weave
    struct ListNode *first = head, *second = prev;
    while (second) {
        struct ListNode *t1 = first->next, *t2 = second->next;
        first->next = second;
        second->next = t1;
        first = t1;
        second = t2;
    }
}
