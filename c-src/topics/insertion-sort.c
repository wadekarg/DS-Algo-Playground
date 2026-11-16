//@code
#include <stdio.h>

/* Sort array using insertion sort. */
void insertion_sort(int arr[], int n) {
    for (int i = 1; i < n; i++) {
        int key = arr[i];
        // Shift elements greater than key to the right
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        // Insert the key at its correct position
        arr[j + 1] = key;
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
    insertion_sort(numbers, n);
    print_array("Sorted:  ", numbers, n);
    return 0;
}
//@trace
void insertion_sort(int arr[], int n) {
    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}
//@trace-map 1:1 2:2 3:3 4:4 5:5 6:6 7:7 8:9 9:11
//@practice insertion_sort
//@spec {"fn": "insertion_sort", "params": [{"name": "arr", "type": "int[]"}], "ret": "int[]"}
//@starter
/* Return a new sorted array using insertion sort (malloc'd; set *returnSize). */
int* insertion_sort(int* arr, int arrSize, int* returnSize) {
    // Your code here
    *returnSize = 0;
    return NULL;
}
//@solution
int* insertion_sort(int* arr, int arrSize, int* returnSize) {
    int* res = malloc(arrSize * sizeof(int));
    for (int i = 0; i < arrSize; i++) {
        int key = arr[i], j = i - 1;
        while (j >= 0 && res[j] > key) {
            res[j + 1] = res[j];
            j--;
        }
        res[j + 1] = key;
    }
    *returnSize = arrSize;
    return res;
}
//@practice count_inversions
//@spec {"fn": "count_inversions", "params": [{"name": "arr", "type": "int[]"}], "ret": "int"}
//@starter
/* Count pairs (i, j) where i < j and arr[i] > arr[j]. */
int count_inversions(int* arr, int arrSize) {
    // Your code here
    return 0;
}
//@solution
// Each shift insertion sort makes fixes exactly one inversion.
int count_inversions(int* arr, int arrSize) {
    int count = 0;
    for (int i = 1; i < arrSize; i++) {
        int key = arr[i], j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
            count++;
        }
        arr[j + 1] = key;
    }
    return count;
}
