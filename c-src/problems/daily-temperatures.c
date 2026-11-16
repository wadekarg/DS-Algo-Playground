//@spec {"fn": "dailyTemperatures", "params": [{"name": "temperatures", "type": "int[]"}], "ret": "int[]"}
//@approach Monotonic Decreasing Stack
int* dailyTemperatures(int* temperatures, int temperaturesSize, int* returnSize) {
    int n = temperaturesSize;
    int* answer = calloc(n, sizeof(int));
    int* stack = malloc(n * sizeof(int));   // indices of days waiting for a warmer day
    int top = 0;
    for (int i = 0; i < n; i++) {
        while (top > 0 && temperatures[i] > temperatures[stack[top - 1]]) {
            int j = stack[--top];
            answer[j] = i - j;
        }
        stack[top++] = i;
    }
    free(stack);
    *returnSize = n;
    return answer;
}
//@approach Brute Force (Don't ship this)
int* dailyTemperatures(int* temperatures, int temperaturesSize, int* returnSize) {
    int n = temperaturesSize;
    int* answer = calloc(n, sizeof(int));
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++)
            if (temperatures[j] > temperatures[i]) {
                answer[i] = j - i;
                break;
            }
    *returnSize = n;
    return answer;
}
