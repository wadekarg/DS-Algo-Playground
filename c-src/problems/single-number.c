//@spec {"fn": "singleNumber", "params": [{"name": "nums", "type": "int[]"}], "ret": "int"}
//@approach XOR Accumulation
int singleNumber(int* nums, int numsSize) {
    int result = 0;
    for (int i = 0; i < numsSize; i++) result ^= nums[i];   // pairs cancel: a ^ a = 0
    return result;
}
