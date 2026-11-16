//@code
// --- Array Operations in C ---
#include <stdio.h>

#define CAPACITY 16

void print_array(const char* label, int arr[], int n) {
    printf("%s [", label);
    for (int i = 0; i < n; i++) printf(i ? ", %d" : "%d", arr[i]);
    printf("]\n");
}

// Insert at a specific index - O(n)
// Shift elements right to open a gap, then write the value.
int insert_at(int arr[], int n, int index, int value) {
    if (n >= CAPACITY || index < 0 || index > n) return n;  // no room / bad index
    for (int i = n; i > index; i--) arr[i] = arr[i - 1];
    arr[index] = value;
    return n + 1;  // new length
}

// Delete at a specific index - O(n)
// Shift elements left over the removed slot.
int delete_at(int arr[], int n, int index) {
    if (index < 0 || index >= n) return n;
    for (int i = index; i < n - 1; i++) arr[i] = arr[i + 1];
    return n - 1;
}

// Linear search - O(n)
// Return the index of target, or -1 if not found.
int linear_search(int arr[], int n, int target) {
    for (int i = 0; i < n; i++) {
        if (arr[i] == target) return i;
    }
    return -1;
}

int main(void) {
    // Create an array (fixed capacity, track the length ourselves)
    int arr[CAPACITY] = {5, 12, 8, 3, 19, 7};
    int n = 6;
    print_array("Original:", arr, n);

    // Access by index - O(1)
    printf("Element at index 2: %d\n", arr[2]);  // 8

    n = insert_at(arr, n, 2, 99);
    print_array("After insert 99 at index 2:", arr, n);

    n = delete_at(arr, n, 2);
    print_array("After delete at index 2:", arr, n);

    int idx = linear_search(arr, n, 19);
    printf("Search for 19: found at index %d\n", idx);
    return 0;
}
//@trace-wrap bool trace(int i, int val, int target)
//@trace
int arr[8] = {10, 20, 30, 40, 50}; int n = 5;
// Access: O(1)
printf("%d\n", arr[2]);
// Insert at index i (shift right)
for (int k = n; k > i; k--) arr[k] = arr[k - 1];
arr[i] = val; n++;
// Delete at index i (shift left)
for (int k = i; k < n - 1; k++) arr[k] = arr[k + 1];
n--;
// Search (linear)
for (int k = 0; k < n; k++)
    if (arr[k] == target)
        return true;
return false;
//@trace-map 1:1 2:2 3:3 4:4 5:5-6 6:7 7:8-9 8:10 9:11 10:12 11:13 12:14
//@practice find_max
//@spec {"fn": "find_max", "params": [{"name": "arr", "type": "int[]"}], "ret": "int"}
//@starter
/* Return the maximum value in arr. */
int find_max(int* arr, int arrSize) {
    // Your code here
    return 0;
}
//@solution
int find_max(int* arr, int arrSize) {
    int best = arr[0];
    for (int i = 1; i < arrSize; i++)
        if (arr[i] > best) best = arr[i];
    return best;
}
//@practice rotate_right
//@spec {"fn": "rotate_right", "params": [{"name": "arr", "type": "int[]"}, {"name": "k", "type": "int"}], "ret": "int[]"}
//@starter
/* Rotate arr right by k positions and return the result.
 * Return a malloc'd array and set *returnSize to its length. */
int* rotate_right(int* arr, int arrSize, int k, int* returnSize) {
    // Your code here
    *returnSize = 0;
    return NULL;
}
//@solution
int* rotate_right(int* arr, int arrSize, int k, int* returnSize) {
    int* res = malloc(arrSize * sizeof(int));
    for (int i = 0; i < arrSize; i++)
        res[(i + k) % arrSize] = arr[i];
    *returnSize = arrSize;
    return res;
}
