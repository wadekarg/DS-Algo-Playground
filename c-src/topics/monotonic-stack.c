//@code
#include <stdio.h>
#include <stdlib.h>

// ── Daily Temperatures (next warmer day) ──────────────────────
void daily_temperatures(int temps[], int n, int result[]) {
    int* stack = malloc(n * sizeof(int));   // indices, decreasing by temperature
    int top = 0;
    for (int i = 0; i < n; i++) {
        result[i] = 0;
        while (top > 0 && temps[stack[top - 1]] < temps[i]) {
            int j = stack[--top];
            result[j] = i - j;              // days until warmer temperature
        }
        stack[top++] = i;
    }
    free(stack);
}

// ── Online Stock Span ─────────────────────────────────────────
typedef struct {
    int price[64], span[64];   // monotonic decreasing by price
    int top;
} StockSpanner;

int next_span(StockSpanner* s, int price) {
    int span = 1;
    while (s->top > 0 && s->price[s->top - 1] <= price)
        span += s->span[--s->top];          // absorb smaller spans
    s->price[s->top] = price;
    s->span[s->top++] = span;
    return span;
}

// ── Largest Rectangle in Histogram ───────────────────────────
int largest_rectangle(int heights[], int n) {
    int* stack = malloc((n + 1) * sizeof(int));  // indices, increasing height
    int top = 0, max_area = 0;
    for (int i = 0; i <= n; i++) {
        int h = i == n ? 0 : heights[i];         // sentinel flushes the stack
        while (top > 0 && heights[stack[top - 1]] > h) {
            int j = stack[--top];
            int width = top == 0 ? i : i - stack[top - 1] - 1;
            if (heights[j] * width > max_area) max_area = heights[j] * width;
        }
        stack[top++] = i;
    }
    free(stack);
    return max_area;
}

int main(void) {
    int temps[] = {73, 74, 75, 71, 69, 72, 76, 73}, res[8];
    daily_temperatures(temps, 8, res);
    printf("daily temperatures:");
    for (int i = 0; i < 8; i++) printf(" %d", res[i]);
    printf("\n");

    StockSpanner s = { .top = 0 };
    int prices[] = {100, 80, 60, 70, 60, 75, 85};
    printf("stock spans:");
    for (int i = 0; i < 7; i++) printf(" %d", next_span(&s, prices[i]));
    printf("\n");

    int h[] = {2, 1, 5, 6, 2, 3};
    printf("largest rectangle: %d\n", largest_rectangle(h, 6));
    return 0;
}
//@expect-output
daily temperatures: 1 1 4 2 1 1 0 0
stock spans: 1 1 1 2 1 4 6
largest rectangle: 10
//@trace
void next_greater(int arr[], int n, int nge[]) {
    int* stack = malloc(n * sizeof(int)); int top = 0;
    for (int i = 0; i < n; i++) nge[i] = -1;
    for (int i = 0; i < n; i++) {
        while (top > 0 && arr[stack[top - 1]] < arr[i]) {
            int j = stack[--top];
            nge[j] = arr[i];
        }
        stack[top++] = i;
    }
    free(stack);
}
//@trace-python
def next_greater(arr):
    n, stack, nge = len(arr), [], [-1] * len(arr)
    for i in range(n):
        while stack and arr[stack[-1]] < arr[i]:
            j = stack.pop()
            nge[j] = arr[i]
        stack.append(i)
    return nge
//@trace-map 1:1 2:2-3 3:4 4:5 5:6 6:7 7:9 8:11
