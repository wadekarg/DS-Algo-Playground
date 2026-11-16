//@spec {"fn": "largestRectangleArea", "params": [{"name": "heights", "type": "int[]"}], "ret": "int"}
//@approach Monotonic Increasing Stack
int largestRectangleArea(int* heights, int heightsSize) {
    int n = heightsSize, top = 0, max_area = 0;
    int* stack = malloc((n + 1) * sizeof(int));   // indices, strictly increasing heights
    for (int i = 0; i < n; i++) {
        while (top > 0 && heights[stack[top - 1]] > heights[i]) {
            int h = heights[stack[--top]];
            // Width is i - (new stack top) - 1, or i if the stack is now empty
            int width = top == 0 ? i : i - stack[top - 1] - 1;
            if (h * width > max_area) max_area = h * width;
        }
        stack[top++] = i;
    }
    // Drain remaining bars with a virtual right boundary at n
    while (top > 0) {
        int h = heights[stack[--top]];
        int width = top == 0 ? n : n - stack[top - 1] - 1;
        if (h * width > max_area) max_area = h * width;
    }
    free(stack);
    return max_area;
}
//@approach Brute Force (Don't ship this)
int largestRectangleArea(int* heights, int heightsSize) {
    int max_area = 0;
    for (int i = 0; i < heightsSize; i++) {
        int min_h = heights[i];
        for (int j = i; j < heightsSize; j++) {
            if (heights[j] < min_h) min_h = heights[j];
            if (min_h * (j - i + 1) > max_area) max_area = min_h * (j - i + 1);
        }
    }
    return max_area;
}
