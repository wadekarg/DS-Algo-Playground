//@spec {"fn": "maxProfit", "params": [{"name": "prices", "type": "int[]"}], "ret": "int"}
//@approach Brute Force
int maxProfit(int* prices, int pricesSize) {
    int best = 0;
    for (int i = 0; i < pricesSize; i++)
        for (int j = i + 1; j < pricesSize; j++)
            if (prices[j] - prices[i] > best) best = prices[j] - prices[i];
    return best;
}
//@approach Single-Pass Min + Max Profit
int maxProfit(int* prices, int pricesSize) {
    int min_price = prices[0], best = 0;
    for (int i = 1; i < pricesSize; i++) {
        if (prices[i] - min_price > best) best = prices[i] - min_price;
        if (prices[i] < min_price) min_price = prices[i];
    }
    return best;
}
