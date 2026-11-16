//@spec {"fn": "minCostClimbingStairs", "params": [{"name": "cost", "type": "int[]"}], "ret": "int"}
//@approach Iterative DP, O(1) Space
int minCostClimbingStairs(int* cost, int costSize) {
    int a = cost[0], b = cost[1];            // min cost to stand on steps i-2, i-1
    for (int i = 2; i < costSize; i++) {
        int c = cost[i] + (a < b ? a : b);
        a = b;
        b = c;
    }
    return a < b ? a : b;
}
