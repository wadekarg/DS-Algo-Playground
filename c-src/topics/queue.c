//@code
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

/* Circular-buffer queue: front and rear wrap around the array,
   so enqueue and dequeue are both O(1). */
typedef struct {
    int* data;
    int front;     // index of the front element
    int count;     // number of elements
    int capacity;
} Queue;

/* Initialize an empty queue. */
void queue_init(Queue* q, int capacity) {
    q->data = malloc(capacity * sizeof(int));
    q->front = 0;
    q->count = 0;
    q->capacity = capacity;
}

/* Check whether the queue is empty. O(1) */
bool is_empty(const Queue* q) { return q->count == 0; }

/* Add an element to the rear of the queue. O(1) */
void enqueue(Queue* q, int value) {
    if (q->count == q->capacity) {
        fprintf(stderr, "Queue is full\n");
        exit(1);
    }
    int rear = (q->front + q->count) % q->capacity;
    q->data[rear] = value;
    q->count++;
}

/* Remove and return the front element. O(1) */
int dequeue(Queue* q) {
    if (is_empty(q)) {
        fprintf(stderr, "Dequeue from an empty queue\n");
        exit(1);
    }
    int value = q->data[q->front];
    q->front = (q->front + 1) % q->capacity;
    q->count--;
    return value;
}

/* Return the front element without removing it. O(1) */
int peek(const Queue* q) {
    if (is_empty(q)) {
        fprintf(stderr, "Peek from an empty queue\n");
        exit(1);
    }
    return q->data[q->front];
}

/* Print the queue (front on the left). */
void print_queue(const Queue* q) {
    printf("Queue([");
    for (int i = 0; i < q->count; i++)
        printf(i ? ", %d" : "%d", q->data[(q->front + i) % q->capacity]);
    printf("])\n");
}

int main(void) {
    // Example usage
    Queue q;
    queue_init(&q, 8);
    int values[] = {15, 42, 8, 23, 7};
    for (int i = 0; i < 5; i++) enqueue(&q, values[i]);

    print_queue(&q);                                   // Queue([15, 42, 8, 23, 7])
    printf("%d\n", peek(&q));                          // 15
    printf("%d\n", dequeue(&q));                       // 15
    printf("%d\n", dequeue(&q));                       // 42
    print_queue(&q);                                   // Queue([8, 23, 7])
    printf("%s\n", is_empty(&q) ? "true" : "false");   // false
    printf("%d\n", q.count);                           // 3
    free(q.data);
    return 0;
}
//@expect-output
Queue([15, 42, 8, 23, 7])
15
15
42
Queue([8, 23, 7])
false
3
//@trace-wrap void trace(int val)
//@trace
int queue[100]; int front = 0, rear = 0;
// Enqueue
queue[rear++] = val;
// Dequeue
val = queue[front++];
// Peek
val = queue[front];
//@trace-map 1:1 2:1 3:2 4:3 5:4 6:5 7:6 8:7
//@trace-python
from collections import deque
queue = deque()
# Enqueue
queue.append(val)
# Dequeue
val = queue.popleft()
# Peek
val = queue[0]
//@practice first_unique
//@spec {"fn": "first_unique", "params": [{"name": "s", "type": "string"}], "ret": "string"}
//@starter
/* Return the first non-repeating character as a string, or "" if none.
 * Return a malloc'd (or string-literal) char*. */
char* first_unique(char* s) {
    // Your code here
    return "";
}
//@solution
char* first_unique(char* s) {
    int count[256] = {0};
    for (char* p = s; *p; p++) count[(unsigned char)*p]++;
    char* res = calloc(2, 1);
    for (char* p = s; *p; p++) {
        if (count[(unsigned char)*p] == 1) { res[0] = *p; break; }
    }
    return res;
}
//@practice sliding_max
//@spec {"fn": "sliding_max", "params": [{"name": "arr", "type": "int[]"}, {"name": "k", "type": "int"}], "ret": "int[]"}
//@starter
/* Return the maximum of each window of size k (malloc'd; set *returnSize).
 * Hint: keep a deque of indices whose values are decreasing. */
int* sliding_max(int* arr, int arrSize, int k, int* returnSize) {
    // Your code here
    *returnSize = 0;
    return NULL;
}
//@solution
int* sliding_max(int* arr, int arrSize, int k, int* returnSize) {
    int* dq = malloc(arrSize * sizeof(int));   // indices, values decreasing
    int head = 0, tail = 0;
    int* res = malloc((arrSize - k + 1) * sizeof(int));
    int n = 0;
    for (int i = 0; i < arrSize; i++) {
        if (head < tail && dq[head] <= i - k) head++;           // drop out-of-window
        while (head < tail && arr[dq[tail - 1]] <= arr[i]) tail--;
        dq[tail++] = i;
        if (i >= k - 1) res[n++] = arr[dq[head]];
    }
    free(dq);
    *returnSize = n;
    return res;
}
