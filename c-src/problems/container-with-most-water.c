//@spec {"fn": "maxArea", "params": [{"name": "height", "type": "int[]"}], "ret": "int"}
//@approach Brute Force
int maxArea(int* height, int heightSize) {
    int best = 0;
    for (int i = 0; i < heightSize; i++)
        for (int j = i + 1; j < heightSize; j++) {
            int h = height[i] < height[j] ? height[i] : height[j];
            if (h * (j - i) > best) best = h * (j - i);
        }
    return best;
}
//@approach Two Pointers
int maxArea(int* height, int heightSize) {
    int left = 0, right = heightSize - 1, best = 0;
    while (left < right) {
        int h = height[left] < height[right] ? height[left] : height[right];
        if (h * (right - left) > best) best = h * (right - left);
        if (height[left] < height[right]) left++;   // move the shorter wall
        else right--;
    }
    return best;
}
