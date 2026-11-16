//@code
#include <stdio.h>
#include <stdbool.h>

struct ListNode {
    int val;
    struct ListNode* next;
};

bool has_cycle(struct ListNode* head) {
    struct ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) return true;
    }
    return false;
}

int main(void) {
    // 3 -> 2 -> 0 -> -4, then -4 points back to 2
    struct ListNode d = {-4, NULL}, c = {0, &d}, b = {2, &c}, a = {3, &b};
    printf("without cycle: %s\n", has_cycle(&a) ? "true" : "false");
    d.next = &b;
    printf("with cycle:    %s\n", has_cycle(&a) ? "true" : "false");
    return 0;
}
//@expect-output
without cycle: false
with cycle:    true
