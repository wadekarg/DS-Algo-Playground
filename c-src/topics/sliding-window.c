//@code
#include <stdio.h>

/* Return the maximum sum of any contiguous subarray of size k. */
int max_sum_subarray(int arr[], int n, int k) {
    if (n < k) return -1;

    // Compute the sum of the first window
    int window_sum = 0;
    for (int i = 0; i < k; i++) window_sum += arr[i];
    int max_sum = window_sum;

    // Slide the window from left to right
    for (int i = k; i < n; i++) {
        window_sum += arr[i] - arr[i - k];   // Add incoming, remove outgoing
        if (window_sum > max_sum) max_sum = window_sum;
    }

    return max_sum;
}

int main(void) {
    // Example usage
    int nums[] = {2, 1, 5, 1, 3, 2};
    int n = sizeof(nums) / sizeof(nums[0]);
    int k = 3;
    int result = max_sum_subarray(nums, n, k);
    printf("Max sum of subarray of size %d: %d\n", k, result);  // Output: 9
    return 0;
}
//@trace
int max_sum_window(int arr[], int n, int k) {
    int window = 0;
    for (int i = 0; i < k; i++) window += arr[i];
    int best = window;
    for (int i = k; i < n; i++) {
        window += arr[i] - arr[i - k];
        if (window > best) best = window;
    }
    return best;
}
//@trace-map 1:1 2:2-3 3:4 4:5 5:6 6:7 7:9
