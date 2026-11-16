//@code
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

/* Array-backed stack that grows as needed. */
typedef struct {
    int* items;
    int size;
    int capacity;
} Stack;

/* Initialize an empty stack. */
void stack_init(Stack* s) {
    s->capacity = 4;
    s->size = 0;
    s->items = malloc(s->capacity * sizeof(int));
}

/* Push a value onto the top of the stack. O(1) amortized */
void push(Stack* s, int value) {
    if (s->size == s->capacity) {
        s->capacity *= 2;
        s->items = realloc(s->items, s->capacity * sizeof(int));
    }
    s->items[s->size++] = value;
}

/* Check if the stack is empty. O(1) */
bool is_empty(const Stack* s) { return s->size == 0; }

/* Remove and return the top element. O(1) */
int pop(Stack* s) {
    if (is_empty(s)) {
        fprintf(stderr, "Stack underflow: cannot pop from empty stack\n");
        exit(1);
    }
    return s->items[--s->size];
}

/* Return the top element without removing it. O(1) */
int peek(const Stack* s) {
    if (is_empty(s)) {
        fprintf(stderr, "Stack underflow: cannot peek empty stack\n");
        exit(1);
    }
    return s->items[s->size - 1];
}

/* Print the stack (top is rightmost). */
void print_stack(const Stack* s) {
    printf("Stack: [");
    for (int i = 0; i < s->size; i++) printf(i ? ", %d" : "%d", s->items[i]);
    printf("]\n");
}

int main(void) {
    // Example usage
    Stack s;
    stack_init(&s);
    push(&s, 10);
    push(&s, 25);
    push(&s, 8);
    push(&s, 42);
    print_stack(&s);                                   // Stack: [10, 25, 8, 42]
    printf("%d\n", peek(&s));                          // 42
    printf("%d\n", pop(&s));                           // 42
    printf("%d\n", pop(&s));                           // 8
    print_stack(&s);                                   // Stack: [10, 25]
    printf("%s\n", is_empty(&s) ? "true" : "false");   // false
    printf("%d\n", s.size);                            // 2
    free(s.items);
    return 0;
}
//@expect-output
Stack: [10, 25, 8, 42]
42
42
8
Stack: [10, 25]
false
2
//@trace-wrap void trace(int val)
//@trace
int stack[100]; int top = 0;
// Push: add on top
stack[top++] = val;
// Pop: remove from the top
val = stack[--top];
// Peek: read the top
val = stack[top - 1];
// Is empty?
bool empty = top == 0;
//@trace-python
stack = []
# Push: add on top
stack.append(val)
# Pop: remove from the top
val = stack.pop()
# Peek: read the top
val = stack[-1]
# Is empty?
empty = len(stack) == 0
//@trace-map 1:1 2:2 3:3 4:4 5:5 6:6 7:7 8:8 9:9
//@practice is_valid
//@spec {"fn": "is_valid", "params": [{"name": "s", "type": "string"}], "ret": "bool"}
//@starter
/* Return true if parentheses/brackets/braces are balanced. */
bool is_valid(char* s) {
    // Your code here
    return false;
}
//@solution
bool is_valid(char* s) {
    int n = strlen(s), top = 0;
    char* stack = malloc(n + 1);
    for (int i = 0; i < n; i++) {
        char c = s[i];
        if (c == '(' || c == '[' || c == '{') {
            stack[top++] = c;
        } else {
            char want = c == ')' ? '(' : c == ']' ? '[' : '{';
            if (top == 0 || stack[top - 1] != want) { free(stack); return false; }
            top--;
        }
    }
    free(stack);
    return top == 0;
}
//@practice eval_postfix
//@spec {"fn": "eval_postfix", "params": [{"name": "tokens", "type": "string[]"}], "ret": "int"}
//@starter
/* Evaluate a Reverse Polish Notation expression and return the integer result.
 * Division truncates toward zero. */
int eval_postfix(char** tokens, int tokensSize) {
    // Your code here
    return 0;
}
//@solution
int eval_postfix(char** tokens, int tokensSize) {
    int* stack = malloc(tokensSize * sizeof(int));
    int top = 0;
    for (int i = 0; i < tokensSize; i++) {
        char* t = tokens[i];
        if (strlen(t) == 1 && strchr("+-*/", t[0])) {
            int b = stack[--top], a = stack[--top];
            switch (t[0]) {
                case '+': stack[top++] = a + b; break;
                case '-': stack[top++] = a - b; break;
                case '*': stack[top++] = a * b; break;
                default:  stack[top++] = a / b; break;  // C truncates toward zero
            }
        } else {
            stack[top++] = atoi(t);
        }
    }
    int result = stack[0];
    free(stack);
    return result;
}
