//@spec {"fn": "canCompleteCircuit", "params": [{"name": "gas", "type": "int[]"}, {"name": "cost", "type": "int[]"}], "ret": "int"}
//@approach Greedy with Restart
int canCompleteCircuit(int* gas, int gasSize, int* cost, int costSize) {
    long long total = 0, tank = 0;
    int start = 0;
    for (int i = 0; i < gasSize; i++) {
        total += gas[i] - cost[i];
        tank += gas[i] - cost[i];
        if (tank < 0) {                       // can't reach i+1 from start: restart after i
            start = i + 1;
            tank = 0;
        }
    }
    return total < 0 ? -1 : start;
}
