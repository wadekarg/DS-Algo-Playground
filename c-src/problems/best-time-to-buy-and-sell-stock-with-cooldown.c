//@spec {"fn": "maxProfit", "params": [{"name": "prices", "type": "int[]"}], "ret": "int"}
//@approach State Machine DP, O(1) Space
int maxProfit(int* prices, int pricesSize) {
    if (pricesSize <= 1) return 0;
    int hold = -prices[0];   // best profit while holding a share
    int sold = 0;            // best profit having just sold today (cooldown tomorrow)
    int rest = 0;            // best profit while idle (no cooldown active)
    for (int i = 1; i < pricesSize; i++) {
        int p = prices[i];
        int new_hold = hold > rest - p ? hold : rest - p;   // keep holding OR buy today
        int new_sold = hold + p;                            // sell today
        int new_rest = rest > sold ? rest : sold;           // stay idle OR finish cooldown
        hold = new_hold; sold = new_sold; rest = new_rest;
    }
    return sold > rest ? sold : rest;
}
