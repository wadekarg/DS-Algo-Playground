//@spec {"fn": "reverseBits", "params": [{"name": "n", "type": "uint32"}], "ret": "uint32"}
//@approach Bit-by-Bit Shift
uint32_t reverseBits(uint32_t n) {
    uint32_t result = 0;
    for (int i = 0; i < 32; i++) {
        result = (result << 1) | (n & 1);    // push n's lowest bit onto result
        n >>= 1;
    }
    return result;
}
