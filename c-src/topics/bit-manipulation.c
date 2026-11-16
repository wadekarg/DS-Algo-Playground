//@code
#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>

// ── XOR trick: find the one unique number ─────────────────────
int single_number(int nums[], int n) {
    int result = 0;
    for (int i = 0; i < n; i++)
        result ^= nums[i];   // duplicates cancel: a^a=0
    return result;
}

// ── Count set bits (Kernighan's method) ───────────────────────
int count_bits(uint32_t n) {
    int count = 0;
    while (n) {
        n &= n - 1;          // clear lowest set bit
        count++;
    }
    return count;
}

// ── Check power of two ────────────────────────────────────────
bool is_power_of_two(int n) {
    return n > 0 && (n & (n - 1)) == 0;
}

// ── Reverse 32 bits ───────────────────────────────────────────
uint32_t reverse_bits(uint32_t n) {
    uint32_t result = 0;
    for (int i = 0; i < 32; i++) {
        result = (result << 1) | (n & 1);
        n >>= 1;
    }
    return result;
}

// ── Enumerate all subsets of an array ─────────────────────────
void all_subsets(int nums[], int n) {
    for (int mask = 0; mask < (1 << n); mask++) {
        printf("{");
        for (int i = 0, first = 1; i < n; i++)
            if (mask & (1 << i)) { printf(first ? "%d" : ", %d", nums[i]); first = 0; }
        printf("}%s", mask + 1 < (1 << n) ? " " : "\n");
    }
}

int main(void) {
    int nums[] = {4, 1, 2, 1, 2};
    printf("single_number: %d\n", single_number(nums, 5));
    printf("count_bits(11): %d\n", count_bits(11));
    printf("is_power_of_two(16): %s\n", is_power_of_two(16) ? "true" : "false");
    printf("reverse_bits(43261596): %u\n", reverse_bits(43261596u));
    int small[] = {1, 2, 3};
    all_subsets(small, 3);
    return 0;
}
//@expect-output
single_number: 4
count_bits(11): 3
is_power_of_two(16): true
reverse_bits(43261596): 964176192
{} {1} {2} {1, 2} {3} {1, 3} {2, 3} {1, 2, 3}
//@trace
int single_number(int nums[], int n) {
    int result = 0;
    for (int i = 0; i < n; i++)
        result ^= nums[i];   // XOR each element
    return result;
}
//@trace-python
def single_number(nums):
    result = 0
    for n in nums:
        result ^= n          # XOR each element
    return result
//@trace-map 1:1 2:2 3:3 4:4 5:5
