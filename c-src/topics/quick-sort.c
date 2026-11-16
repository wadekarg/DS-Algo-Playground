//@code
#include <stdio.h>

void swap(int* a, int* b) { int t = *a; *a = *b; *b = t; }

/* Lomuto partition: pivot is the last element. */
int partition(int arr[], int low, int high) {
    int pivot = arr[high];
    int i = low;  // partition boundary

    for (int j = low; j < high; j++) {
        if (arr[j] <= pivot) {
            swap(&arr[i], &arr[j]);
            i++;
        }
    }

    // Place pivot in its correct position
    swap(&arr[i], &arr[high]);
    return i;
}

/* In-place quick sort using Lomuto partition scheme. */
void quick_sort(int arr[], int low, int high) {
    if (low < high) {
        int pivot_index = partition(arr, low, high);
        quick_sort(arr, low, pivot_index - 1);
        quick_sort(arr, pivot_index + 1, high);
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
    quick_sort(numbers, 0, n - 1);
    print_array("Sorted:  ", numbers, n);
    return 0;
}
//@trace
void quick_sort(int arr[], int low, int high) {
    if (low >= high)
        return;
    int pivot = arr[high];
    int i = low;
    for (int j = low; j < high; j++) {
        if (arr[j] <= pivot) {
            int t = arr[i]; arr[i] = arr[j]; arr[j] = t;
            i++;
        }
    }
    int t = arr[i]; arr[i] = arr[high]; arr[high] = t;
    quick_sort(arr, low, i - 1);
    quick_sort(arr, i + 1, high);
}
//@trace-python
def quick_sort(arr, low, high):
    if low >= high:
        return
    pivot = arr[high]
    i = low
    for j in range(low, high):
        if arr[j] <= pivot:
            arr[i], arr[j] = arr[j], arr[i]
            i += 1
    arr[i], arr[high] = arr[high], arr[i]
    quick_sort(arr, low, i - 1)
    quick_sort(arr, i + 1, high)
//@trace-map 1:1 2:2 3:3 4:4 5:5 6:6 7:7 8:8 9:9 10:12 11:13 12:14
//@practice kth_element
//@spec {"fn": "kth_element", "params": [{"name": "arr", "type": "int[]"}, {"name": "k", "type": "int"}], "ret": "int"}
//@starter
/* Return the kth smallest element (1-indexed).
 * Hint: quickselect - partition, then recurse into one side only. */
int kth_element(int* arr, int arrSize, int k) {
    // Your code here
    return 0;
}
//@solution
int kth_element(int* arr, int arrSize, int k) {
    int lo = 0, hi = arrSize - 1, target = k - 1;
    while (lo < hi) {
        int pivot = arr[hi], i = lo;               // Lomuto partition
        for (int j = lo; j < hi; j++)
            if (arr[j] <= pivot) { int t = arr[i]; arr[i] = arr[j]; arr[j] = t; i++; }
        int t = arr[i]; arr[i] = arr[hi]; arr[hi] = t;
        if (i == target) return arr[i];
        if (i < target) lo = i + 1; else hi = i - 1;
    }
    return arr[lo];
}
//@practice dutch_flag
//@spec {"fn": "dutch_flag", "params": [{"name": "arr", "type": "int[]"}], "ret": "int[]"}
//@starter
/* Sort an array of 0s, 1s, and 2s in one pass.
 * Return the sorted array (you may sort arr in place and return it). */
int* dutch_flag(int* arr, int arrSize, int* returnSize) {
    // Your code here
    *returnSize = arrSize;
    return arr;
}
//@solution
int* dutch_flag(int* arr, int arrSize, int* returnSize) {
    int lo = 0, mid = 0, hi = arrSize - 1;
    while (mid <= hi) {
        if (arr[mid] == 0) { int t = arr[lo]; arr[lo++] = arr[mid]; arr[mid++] = t; }
        else if (arr[mid] == 1) mid++;
        else { int t = arr[hi]; arr[hi--] = arr[mid]; arr[mid] = t; }
    }
    *returnSize = arrSize;
    return arr;
}
