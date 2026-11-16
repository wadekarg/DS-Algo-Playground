//@code
#include <stdio.h>

/* Return the index of target in sorted arr, or -1 if not found. */
int binary_search(int arr[], int n, int target) {
    int low = 0;
    int high = n - 1;

    while (low <= high) {
        int mid = low + (high - low) / 2;   // avoids int overflow of (low + high)

        if (arr[mid] == target)
            return mid;          // Target found
        else if (arr[mid] < target)
            low = mid + 1;       // Search right half
        else
            high = mid - 1;      // Search left half
    }

    return -1;                   // Target not in array
}

int main(void) {
    // Example usage
    int nums[] = {2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91};
    int n = sizeof(nums) / sizeof(nums[0]);
    int result = binary_search(nums, n, 23);
    printf("Found at index: %d\n", result);  // Output: Found at index: 5
    return 0;
}
//@trace
int binary_search(int arr[], int n, int target) {
    int lo = 0, hi = n - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (arr[mid] == target)
            return mid;
        else if (arr[mid] < target)
            lo = mid + 1;
        else
            hi = mid - 1;
    }
    return -1;
}
//@trace-map 1:1 2:2 3:3 4:4 5:5 6:6 7:7 8:8 9:9 10:10 11:12
//@practice binary_search
//@spec {"fn": "binary_search", "params": [{"name": "arr", "type": "int[]"}, {"name": "target", "type": "int"}], "ret": "int"}
//@starter
/* Return index of target in sorted arr, or -1 if not found. */
int binary_search(int* arr, int arrSize, int target) {
    // Your code here
    return -1;
}
//@solution
int binary_search(int* arr, int arrSize, int target) {
    int lo = 0, hi = arrSize - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) lo = mid + 1; else hi = mid - 1;
    }
    return -1;
}
//@practice search_insert
//@spec {"fn": "search_insert", "params": [{"name": "arr", "type": "int[]"}, {"name": "target", "type": "int"}], "ret": "int"}
//@starter
/* Return index of target, or the position where it would be inserted. */
int search_insert(int* arr, int arrSize, int target) {
    // Your code here
    return 0;
}
//@solution
int search_insert(int* arr, int arrSize, int target) {
    int lo = 0, hi = arrSize;          // answer lies in [lo, hi]
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (arr[mid] < target) lo = mid + 1; else hi = mid;
    }
    return lo;
}
