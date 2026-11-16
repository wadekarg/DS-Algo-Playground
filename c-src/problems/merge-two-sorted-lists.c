//@spec {"fn": "mergeTwoLists", "params": [{"name": "list1", "type": "list"}, {"name": "list2", "type": "list"}], "ret": "list"}
//@approach Dummy Head + Splice
struct ListNode* mergeTwoLists(struct ListNode* list1, struct ListNode* list2) {
    struct ListNode dummy = {0, NULL};
    struct ListNode* tail = &dummy;
    while (list1 && list2) {
        if (list1->val <= list2->val) { tail->next = list1; list1 = list1->next; }
        else { tail->next = list2; list2 = list2->next; }
        tail = tail->next;
    }
    tail->next = list1 ? list1 : list2;
    return dummy.next;
}
