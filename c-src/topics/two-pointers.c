//@code
#include <stdio.h>

/* Find a pair in a sorted array that sums to target.
 *
 * arr:    a sorted array of integers (length n)
 * target: the desired pair sum
 * Writes the indices to *i and *j and returns 1 if found,
 * or sets both to -1 and returns 0 if no pair exists.
 */
int two_pointer_pair_sum(int arr[], int n, int target, int* i, int* j) {
    int left = 0;
    int right = n - 1;

    while (left < right) {
        int current_sum = arr[left] + arr[right];

        if (current_sum == target) {
            *i = left;
            *j = right;
            return 1;
        } else if (current_sum < target) {
            left++;            // Need a larger sum
        } else {
            right--;           // Need a smaller sum
        }
    }

    *i = *j = -1;              // No pair found
    return 0;
}

/* Remove duplicates from a sorted array in-place.
 * Returns the length of the array after removing duplicates.
 */
int remove_duplicates(int arr[], int n) {
    if (n == 0) return 0;

    int slow = 0;
    for (int fast = 1; fast < n; fast++) {
        if (arr[fast] != arr[slow]) {
            slow++;
            arr[slow] = arr[fast];
        }
    }

    return slow + 1;
}

int main(void) {
    // Example usage
    int arr[] = {1, 3, 5, 7, 8, 9, 11, 15};
    int n = sizeof(arr) / sizeof(arr[0]);
    int target = 16, i, j;
    two_pointer_pair_sum(arr, n, target, &i, &j);
    printf("Pair found at indices (%d, %d): %d + %d = %d\n",
           i, j, arr[i], arr[j], target);
    // Output: Pair found at indices (0, 7): 1 + 15 = 16
    return 0;
}
//@trace
bool two_sum_sorted(int arr[], int n, int target, int* i, int* j) {
    int left = 0, right = n - 1;
    while (left < right) {
        int s = arr[left] + arr[right];
        if (s == target) {
            *i = left; *j = right; return true;
        } else if (s < target) {
            left++;
        } else {
            right--;
        }
    }
    return false;
}
//@trace-map 1:1 2:2 3:3 4:4 5:5 6:6 7:7 8:8 9:9 10:10 11:13
