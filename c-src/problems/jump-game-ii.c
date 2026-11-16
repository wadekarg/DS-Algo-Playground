//@spec {"fn": "jump", "params": [{"name": "nums", "type": "int[]"}], "ret": "int"}
//@approach Greedy BFS-by-Levels
int jump(int* nums, int numsSize) {
    int jumps = 0, current_end = 0, farthest = 0;
    for (int i = 0; i < numsSize - 1; i++) {
        if (i + nums[i] > farthest) farthest = i + nums[i];
        if (i == current_end) {               // end of this jump's range: take another
            jumps++;
            current_end = farthest;
        }
    }
    return jumps;
}
