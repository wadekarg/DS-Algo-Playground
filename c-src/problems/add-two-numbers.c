//@spec {"fn": "addTwoNumbers", "params": [{"name": "l1", "type": "list"}, {"name": "l2", "type": "list"}], "ret": "list"}
//@approach Walk + Carry
struct ListNode* addTwoNumbers(struct ListNode* l1, struct ListNode* l2) {
    struct ListNode dummy = {0, NULL};
    struct ListNode* tail = &dummy;
    int carry = 0;
    while (l1 || l2 || carry) {
        int s = (l1 ? l1->val : 0) + (l2 ? l2->val : 0) + carry;
        carry = s / 10;
        tail->next = calloc(1, sizeof(struct ListNode));
        tail = tail->next;
        tail->val = s % 10;
        if (l1) l1 = l1->next;
        if (l2) l2 = l2->next;
    }
    return dummy.next;
}
