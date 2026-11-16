//@spec {"fn": "hammingWeight", "params": [{"name": "n", "type": "uint32"}], "ret": "int"}
//@approach Brian Kernighan's Trick
int hammingWeight(uint32_t n) {
    int count = 0;
    while (n) {
        n &= n - 1;                          // clear the lowest set bit
        count++;
    }
    return count;
}
