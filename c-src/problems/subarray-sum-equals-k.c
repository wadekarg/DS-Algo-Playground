//@spec {"fn": "subarraySum", "params": [{"name": "nums", "type": "int[]"}, {"name": "k", "type": "int"}], "ret": "int"}
//@approach Brute Force
int subarraySum(int* nums, int numsSize, int k) {
    int count = 0;
    for (int i = 0; i < numsSize; i++) {
        int s = 0;
        for (int j = i; j < numsSize; j++) {
            s += nums[j];
            if (s == k) count++;
        }
    }
    return count;
}
//@approach Prefix Sum + Hash Map
// Open-addressing map: prefix sum -> how many times it has occurred.
typedef struct { long long* key; int* cnt; int cap; } Map;   // cnt == 0: empty slot
static int* map_slot(Map* m, long long x) {
    unsigned h = (unsigned)(x * 2654435761u) & (m->cap - 1);
    while (m->cnt[h] && m->key[h] != x) h = (h + 1) & (m->cap - 1);
    m->key[h] = x;                       // harmless if the slot stays empty
    return &m->cnt[h];
}
int subarraySum(int* nums, int numsSize, int k) {
    Map m = { NULL, NULL, 1 };
    while (m.cap < 2 * (numsSize + 1)) m.cap <<= 1;
    m.key = calloc(m.cap, sizeof(long long));
    m.cnt = calloc(m.cap, sizeof(int));
    (*map_slot(&m, 0))++;                // the empty prefix
    long long prefix = 0;
    int count = 0;
    for (int i = 0; i < numsSize; i++) {
        prefix += nums[i];
        count += *map_slot(&m, prefix - k);   // subarrays ending here that sum to k
        (*map_slot(&m, prefix))++;
    }
    free(m.key); free(m.cnt);
    return count;
}
