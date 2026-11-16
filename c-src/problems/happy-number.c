//@spec {"fn": "isHappy", "params": [{"name": "n", "type": "int"}], "ret": "bool"}
//@approach Hash Set
static int sq(int x) {
    int total = 0;
    while (x) {
        total += (x % 10) * (x % 10);
        x /= 10;
    }
    return total;
}
// After one step every value is < 1000 (a 10-digit int maps to at most 810),
// so a bool array covers the "seen" set.
bool isHappy(int n) {
    bool seen[1000] = {false};
    n = sq(n);
    while (n != 1 && !seen[n]) {
        seen[n] = true;
        n = sq(n);
    }
    return n == 1;
}
//@approach Floyd's on the Sequence
static int sq(int x) {
    int total = 0;
    while (x) {
        total += (x % 10) * (x % 10);
        x /= 10;
    }
    return total;
}
bool isHappy(int n) {
    int slow = n, fast = sq(n);
    while (fast != 1 && slow != fast) {
        slow = sq(slow);
        fast = sq(sq(fast));
    }
    return fast == 1;
}
