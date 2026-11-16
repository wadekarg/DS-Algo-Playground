//@spec {"fn": "missingNumber", "params": [{"name": "nums", "type": "int[]"}], "ret": "int"}
//@approach Sum Formula
int missingNumber(int* nums, int numsSize) {
    long long n = numsSize, sum = 0;
    for (int i = 0; i < numsSize; i++) sum += nums[i];
    return (int)(n * (n + 1) / 2 - sum);
}
//@approach XOR
int missingNumber(int* nums, int numsSize) {
    int result = numsSize;
    for (int i = 0; i < numsSize; i++) result ^= i ^ nums[i];
    return result;
}
