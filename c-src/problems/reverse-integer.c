//@spec {"fn": "reverse", "params": [{"name": "x", "type": "int"}], "ret": "int"}
//@approach Digit Shuffle with Overflow Check
int reverse(int x) {
    int result = 0;
    while (x != 0) {
        int digit = x % 10;                  // C keeps the sign: -123 % 10 == -3
        x /= 10;
        // Would result * 10 + digit leave the 32-bit range?
        if (result > INT_MAX / 10 || (result == INT_MAX / 10 && digit > 7)) return 0;
        if (result < INT_MIN / 10 || (result == INT_MIN / 10 && digit < -8)) return 0;
        result = result * 10 + digit;
    }
    return result;
}
