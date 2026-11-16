//@code
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Merge two sorted halves arr[lo..mid) and arr[mid..hi) using tmp. */
void merge(int arr[], int lo, int mid, int hi, int tmp[]) {
    int i = lo, j = mid, k = lo;

    while (i < mid && j < hi) {
        if (arr[i] <= arr[j])
            tmp[k++] = arr[i++];
        else
            tmp[k++] = arr[j++];
    }

    // Append remaining elements
    while (i < mid) tmp[k++] = arr[i++];
    while (j < hi) tmp[k++] = arr[j++];
    memcpy(arr + lo, tmp + lo, (hi - lo) * sizeof(int));
}

/* Top-down merge sort of arr[lo..hi). */
void merge_sort_range(int arr[], int lo, int hi, int tmp[]) {
    if (hi - lo <= 1) return;

    int mid = lo + (hi - lo) / 2;
    merge_sort_range(arr, lo, mid, tmp);
    merge_sort_range(arr, mid, hi, tmp);

    merge(arr, lo, mid, hi, tmp);
}

void merge_sort(int arr[], int n) {
    int* tmp = malloc(n * sizeof(int));  // one scratch buffer, O(n) space
    merge_sort_range(arr, 0, n, tmp);
    free(tmp);
}

void print_array(const char* label, int arr[], int n) {
    printf("%s [", label);
    for (int i = 0; i < n; i++) printf(i ? ", %d" : "%d", arr[i]);
    printf("]\n");
}

int main(void) {
    // Example usage
    int numbers[] = {38, 27, 43, 3, 9, 82, 10};
    int n = sizeof(numbers) / sizeof(numbers[0]);
    print_array("Unsorted:", numbers, n);
    merge_sort(numbers, n);
    print_array("Sorted:  ", numbers, n);
    return 0;
}
//@trace
void merge_sort(int arr[], int lo, int hi, int tmp[]) {
    if (hi - lo <= 1)
        return;
    int mid = lo + (hi - lo) / 2;
    merge_sort(arr, lo, mid, tmp);
    merge_sort(arr, mid, hi, tmp);
    merge(arr, lo, mid, hi, tmp);
}

void merge(int arr[], int lo, int mid, int hi, int tmp[]) {
    int i = lo, j = mid, k = lo;
    while (i < mid && j < hi) {
        if (arr[i] <= arr[j])
            tmp[k++] = arr[i++];
        else
            tmp[k++] = arr[j++];
    }
    while (i < mid) tmp[k++] = arr[i++];   // copy what's left over
    while (j < hi) tmp[k++] = arr[j++];
    for (k = lo; k < hi; k++) arr[k] = tmp[k];
}
//@trace-prelude
void merge(int arr[], int lo, int mid, int hi, int tmp[]);
//@trace-python
def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i]); i += 1
        else:
            result.append(right[j]); j += 1
    result.extend(left[i:])    # copy what's left over
    result.extend(right[j:])
    return result
//@trace-map 1:1 2:2 3:3 4:4 5:5 6:6 7:7 9:10 10:11 11:12 12:13 13:14 14:15 15:16 16:18 17:19 18:20
//@practice merge_sorted
//@spec {"fn": "merge_sorted", "params": [{"name": "a", "type": "int[]"}, {"name": "b", "type": "int[]"}], "ret": "int[]"}
//@starter
/* Merge two sorted arrays into one sorted array (malloc'd; set *returnSize). */
int* merge_sorted(int* a, int aSize, int* b, int bSize, int* returnSize) {
    // Your code here
    *returnSize = 0;
    return NULL;
}
//@solution
int* merge_sorted(int* a, int aSize, int* b, int bSize, int* returnSize) {
    int* res = malloc((aSize + bSize) * sizeof(int));
    int i = 0, j = 0, k = 0;
    while (i < aSize && j < bSize) res[k++] = a[i] <= b[j] ? a[i++] : b[j++];
    while (i < aSize) res[k++] = a[i++];
    while (j < bSize) res[k++] = b[j++];
    *returnSize = k;
    return res;
}
//@practice merge_sort
//@spec {"fn": "merge_sort", "params": [{"name": "arr", "type": "int[]"}], "ret": "int[]"}
//@starter
/* Return a sorted array using merge sort (malloc'd; set *returnSize). */
int* merge_sort(int* arr, int arrSize, int* returnSize) {
    // Your code here
    *returnSize = 0;
    return NULL;
}
//@solution
static void sort_range(int* a, int lo, int hi, int* tmp) {
    if (hi - lo <= 1) return;
    int mid = lo + (hi - lo) / 2;
    sort_range(a, lo, mid, tmp);
    sort_range(a, mid, hi, tmp);
    int i = lo, j = mid, k = lo;
    while (i < mid && j < hi) tmp[k++] = a[i] <= a[j] ? a[i++] : a[j++];
    while (i < mid) tmp[k++] = a[i++];
    while (j < hi) tmp[k++] = a[j++];
    for (k = lo; k < hi; k++) a[k] = tmp[k];
}
int* merge_sort(int* arr, int arrSize, int* returnSize) {
    int* res = malloc(arrSize * sizeof(int));
    int* tmp = malloc(arrSize * sizeof(int));
    for (int i = 0; i < arrSize; i++) res[i] = arr[i];
    sort_range(res, 0, arrSize, tmp);
    free(tmp);
    *returnSize = arrSize;
    return res;
}
