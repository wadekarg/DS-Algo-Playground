//@spec {"fn": "plusOne", "params": [{"name": "digits", "type": "int[]"}], "ret": "int[]"}
//@approach Carry from Right
int* plusOne(int* digits, int digitsSize, int* returnSize) {
    for (int i = digitsSize - 1; i >= 0; i--) {
        if (digits[i] < 9) {
            digits[i]++;
            int* res = malloc(digitsSize * sizeof(int));
            memcpy(res, digits, digitsSize * sizeof(int));
            *returnSize = digitsSize;
            return res;
        }
        digits[i] = 0;                       // 9 + 1 = 10: write 0, carry on
    }
    // All nines: the answer is 1 followed by zeros
    int* res = calloc(digitsSize + 1, sizeof(int));
    res[0] = 1;
    *returnSize = digitsSize + 1;
    return res;
}
