//@code
#include <stdio.h>

/* Selection sort: find minimum and swap into position. */
void selection_sort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        // Find the index of the minimum element in arr[i..n-1]
        int min_idx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[min_idx]) min_idx = j;
        }
        // Swap the found minimum with the first unsorted element
        if (min_idx != i) {
            int tmp = arr[i];
            arr[i] = arr[min_idx];
            arr[min_idx] = tmp;
        }
    }
}

void print_array(const char* label, int arr[], int n) {
    printf("%s [", label);
    for (int i = 0; i < n; i++) printf(i ? ", %d" : "%d", arr[i]);
    printf("]\n");
}

int main(void) {
    // Example usage
    int numbers[] = {64, 25, 12, 22, 11, 90, 34, 45};
    int n = sizeof(numbers) / sizeof(numbers[0]);
    print_array("Unsorted:", numbers, n);
    selection_sort(numbers, n);
    print_array("Sorted:  ", numbers, n);
    return 0;
}
//@trace
void selection_sort(int arr[], int n) {
    for (int i = 0; i < n; i++) {
        int min_idx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[min_idx])
                min_idx = j;
        }
        int t = arr[i]; arr[i] = arr[min_idx]; arr[min_idx] = t;
    }
}
//@trace-map 1:1 2:1 3:2 4:3 5:4 6:5 7:6 8:8 9:10
//@practice min_swaps_to_sort
//@spec {"fn": "min_swaps_to_sort", "params": [{"name": "arr", "type": "int[]"}], "ret": "int"}
//@starter
/* Return the minimum number of swaps to sort arr (selection sort logic). */
int min_swaps_to_sort(int* arr, int arrSize) {
    // Your code here
    return 0;
}
//@solution
int min_swaps_to_sort(int* arr, int arrSize) {
    int swaps = 0;
    for (int i = 0; i < arrSize - 1; i++) {
        int m = i;
        for (int j = i + 1; j < arrSize; j++)
            if (arr[j] < arr[m]) m = j;
        if (m != i) {
            int t = arr[i]; arr[i] = arr[m]; arr[m] = t;
            swaps++;
        }
    }
    return swaps;
}
//@practice sort_by_frequency
//@spec {"fn": "sort_by_frequency", "params": [{"name": "arr", "type": "int[]"}], "ret": "int[]"}
//@starter
/* Sort by frequency descending; tie-break by value ascending.
 * Return a malloc'd array and set *returnSize. */
int* sort_by_frequency(int* arr, int arrSize, int* returnSize) {
    // Your code here
    *returnSize = 0;
    return NULL;
}
//@solution
int* sort_by_frequency(int* arr, int arrSize, int* returnSize) {
    int* freq = malloc(arrSize * sizeof(int));
    int* res = malloc(arrSize * sizeof(int));
    for (int i = 0; i < arrSize; i++) {
        res[i] = arr[i];
        freq[i] = 0;
        for (int j = 0; j < arrSize; j++) if (arr[j] == arr[i]) freq[i]++;
    }
    // selection sort on (frequency desc, value asc)
    for (int i = 0; i < arrSize - 1; i++) {
        int b = i;
        for (int j = i + 1; j < arrSize; j++)
            if (freq[j] > freq[b] || (freq[j] == freq[b] && res[j] < res[b])) b = j;
        int t = res[i]; res[i] = res[b]; res[b] = t;
        t = freq[i]; freq[i] = freq[b]; freq[b] = t;
    }
    free(freq);
    *returnSize = arrSize;
    return res;
}
