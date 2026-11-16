//@spec {"fn": "reverseKGroup", "params": [{"name": "head", "type": "list"}, {"name": "k", "type": "int"}], "ret": "list"}
//@approach Group Reverse Iterative
struct ListNode* reverseKGroup(struct ListNode* head, int k) {
    struct ListNode dummy = {0, head};
    struct ListNode* group_prev = &dummy;
    for (;;) {
        struct ListNode* kth = group_prev;
        for (int i = 0; i < k && kth; i++) kth = kth->next;
        if (!kth) break;                      // fewer than k nodes left: done
        struct ListNode* group_next = kth->next;
        // Reverse [group_prev->next .. kth] inclusive
        struct ListNode *prev = group_next, *curr = group_prev->next;
        while (curr != group_next) {
            struct ListNode* nxt = curr->next;
            curr->next = prev;
            prev = curr;
            curr = nxt;
        }
        struct ListNode* new_group_prev = group_prev->next;   // old first node, now the group's tail
        group_prev->next = kth;
        group_prev = new_group_prev;
    }
    return dummy.next;
}
