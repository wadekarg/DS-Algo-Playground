//@spec {"fn": "trap", "params": [{"name": "height", "type": "int[]"}], "ret": "int"}
//@approach Brute Force
int trap(int* height, int heightSize) {
    int total = 0;
    for (int i = 0; i < heightSize; i++) {
        int left_max = 0, right_max = 0;
        for (int j = 0; j <= i; j++) if (height[j] > left_max) left_max = height[j];
        for (int j = i; j < heightSize; j++) if (height[j] > right_max) right_max = height[j];
        int level = left_max < right_max ? left_max : right_max;
        total += level - height[i];   // level >= height[i] always
    }
    return total;
}
//@approach Prefix and Suffix Max Arrays
int trap(int* height, int heightSize) {
    int n = heightSize;
    if (n == 0) return 0;
    int* left_max = malloc(n * sizeof(int));
    int* right_max = malloc(n * sizeof(int));
    left_max[0] = height[0];
    for (int i = 1; i < n; i++)
        left_max[i] = left_max[i - 1] > height[i] ? left_max[i - 1] : height[i];
    right_max[n - 1] = height[n - 1];
    for (int i = n - 2; i >= 0; i--)
        right_max[i] = right_max[i + 1] > height[i] ? right_max[i + 1] : height[i];
    int total = 0;
    for (int i = 0; i < n; i++) {
        int level = left_max[i] < right_max[i] ? left_max[i] : right_max[i];
        total += level - height[i];
    }
    free(left_max); free(right_max);
    return total;
}
//@approach Two Pointers (O(1) space)
int trap(int* height, int heightSize) {
    int left = 0, right = heightSize - 1;
    int left_max = 0, right_max = 0, total = 0;
    while (left < right) {
        if (height[left] < height[right]) {
            // Left side is the bottleneck for this step
            if (height[left] >= left_max) left_max = height[left];
            else total += left_max - height[left];
            left++;
        } else {
            // Right side is the bottleneck
            if (height[right] >= right_max) right_max = height[right];
            else total += right_max - height[right];
            right--;
        }
    }
    return total;
}
