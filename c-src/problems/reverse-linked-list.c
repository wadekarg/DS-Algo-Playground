//@spec {"fn": "reverseList", "params": [{"name": "head", "type": "list"}], "ret": "list"}
//@approach Iterative 3-Pointer
struct ListNode* reverseList(struct ListNode* head) {
    struct ListNode *prev = NULL, *curr = head;
    while (curr) {
        struct ListNode* nxt = curr->next;
        curr->next = prev;
        prev = curr;
        curr = nxt;
    }
    return prev;
}
