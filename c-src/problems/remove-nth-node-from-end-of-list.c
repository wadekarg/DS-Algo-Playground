//@spec {"fn": "removeNthFromEnd", "params": [{"name": "head", "type": "list"}, {"name": "n", "type": "int"}], "ret": "list"}
//@approach Two Pointers with Dummy
struct ListNode* removeNthFromEnd(struct ListNode* head, int n) {
    struct ListNode dummy = {0, head};
    struct ListNode *fast = &dummy, *slow = &dummy;
    for (int i = 0; i <= n; i++) fast = fast->next;   // open a gap of n nodes
    while (fast) {
        fast = fast->next;
        slow = slow->next;
    }
    struct ListNode* doomed = slow->next;   // slow is just before the target
    slow->next = doomed->next;
    free(doomed);
    return dummy.next;
}
