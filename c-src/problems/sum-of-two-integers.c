//@spec {"fn": "getSum", "params": [{"name": "a", "type": "int"}, {"name": "b", "type": "int"}], "ret": "int"}
//@approach Bit Adder with 32-bit Mask
// In C, unsigned 32-bit arithmetic is the mask: it wraps mod 2^32 for us.
int getSum(int a, int b) {
    uint32_t x = (uint32_t)a, y = (uint32_t)b;
    while (y != 0) {
        uint32_t carry = (x & y) << 1;       // AND << 1 = carry
        x = x ^ y;                           // XOR = sum without carry
        y = carry;
    }
    return (int)x;                           // reinterpret as signed
}
