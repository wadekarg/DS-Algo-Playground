//@code
#include <stdio.h>
#include <stdbool.h>

/* Optimized bubble sort with early exit. */
void bubble_sort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        bool swapped = false;
        // Last i elements are already in place
        for (int j = 0; j < n - 1 - i; j++) {
            if (arr[j] > arr[j + 1]) {
                int tmp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = tmp;
                swapped = true;
            }
        }
        // If no swaps occurred, array is sorted
        if (!swapped) break;
    }
}

void print_array(const char* label, int arr[], int n) {
    printf("%s [", label);
    for (int i = 0; i < n; i++) printf(i ? ", %d" : "%d", arr[i]);
    printf("]\n");
}

int main(void) {
    // Example usage
    int numbers[] = {64, 34, 25, 12, 22, 11, 90, 45};
    int n = sizeof(numbers) / sizeof(numbers[0]);
    print_array("Unsorted:", numbers, n);
    bubble_sort(numbers, n);
    print_array("Sorted:  ", numbers, n);
    return 0;
}
//@trace
void bubble_sort(int arr[], int n) {
    for (int i = 0; i < n; i++) {
        bool swapped = false;
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int t = arr[j]; arr[j] = arr[j + 1]; arr[j + 1] = t;
                swapped = true;
            }
        }
        if (!swapped) break;
    }
}
//@trace-map 1:1 2:1 3:2 4:3 5:4 6:5 7:6 8:7 9:10 10:10 11:12
//@practice count_swaps
//@spec {"fn": "count_swaps", "params": [{"name": "arr", "type": "int[]"}], "ret": "int"}
//@starter
/* Return the number of swaps bubble sort makes on arr. */
int count_swaps(int* arr, int arrSize) {
    // Your code here
    return 0;
}
//@solution
int count_swaps(int* arr, int arrSize) {
    int swaps = 0;
    for (int i = 0; i < arrSize - 1; i++)
        for (int j = 0; j < arrSize - 1 - i; j++)
            if (arr[j] > arr[j + 1]) {
                int t = arr[j]; arr[j] = arr[j + 1]; arr[j + 1] = t;
                swaps++;
            }
    return swaps;
}
//@practice is_sorted_after_k_passes
//@spec {"fn": "is_sorted_after_k_passes", "params": [{"name": "arr", "type": "int[]"}, {"name": "k", "type": "int"}], "ret": "bool"}
//@starter
/* Simulate k passes of bubble sort; return true if the array is sorted. */
bool is_sorted_after_k_passes(int* arr, int arrSize, int k) {
    // Your code here
    return false;
}
//@solution
bool is_sorted_after_k_passes(int* arr, int arrSize, int k) {
    for (int p = 0; p < k && p < arrSize - 1; p++)
        for (int j = 0; j < arrSize - 1 - p; j++)
            if (arr[j] > arr[j + 1]) {
                int t = arr[j]; arr[j] = arr[j + 1]; arr[j + 1] = t;
            }
    for (int i = 1; i < arrSize; i++)
        if (arr[i - 1] > arr[i]) return false;
    return true;
}
