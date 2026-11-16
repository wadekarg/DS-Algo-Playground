//@code
#include <stdio.h>
#include <stdlib.h>

/* Naive recursive Fibonacci - O(2^n) time. */
long long fibonacci(int n) {
    if (n <= 0) return 0;
    if (n == 1) return 1;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

/* Recursive factorial - O(n) time. */
long long factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

/* Memoized Fibonacci - O(n) time, O(n) space. memo[i] == 0 means unknown. */
long long fibonacci_memo(int n, long long memo[]) {
    if (n <= 0) return 0;
    if (n == 1) return 1;
    if (memo[n] != 0) return memo[n];
    memo[n] = fibonacci_memo(n - 1, memo) + fibonacci_memo(n - 2, memo);
    return memo[n];
}

int main(void) {
    // Example usage
    printf("%lld\n", fibonacci(10));        // Output: 55
    printf("%lld\n", factorial(5));         // Output: 120
    long long memo[51] = {0};
    printf("%lld\n", fibonacci_memo(50, memo));  // Output: 12586269025 (instant with memoization)
    return 0;
}
//@trace
long long fib(int n) {
    if (n <= 1)
        return n;
    return fib(n - 1) + fib(n - 2);
}
//@trace-python
def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)
//@trace-map 1:1 2:2 3:3 4:4
//@practice power
//@spec {"fn": "power", "params": [{"name": "base", "type": "int"}, {"name": "exp", "type": "int"}], "ret": "long"}
//@starter
/* Return base^exp using recursion. */
long long power(int base, int exp) {
    // Your code here
    return 0;
}
//@solution
long long power(int base, int exp) {
    if (exp == 0) return 1;
    long long half = power(base, exp / 2);     // fast exponentiation: O(log exp)
    return exp % 2 ? half * half * base : half * half;
}
//@practice flatten
//@spec {"fn": "flatten", "params": [{"name": "lst", "type": "json"}], "ret": "int[]"}
//@starter
/* Flatten a nested list of integers.
 * C has no nested lists, so lst arrives as text, e.g. "[1,[2,[3,4],5]]".
 * Walk it recursively: a list is '[' item (',' item)* ']', and an item is
 * either a number or another list.
 * Return the integers in order (malloc'd; set *returnSize). */
int* flatten(char* lst, int* returnSize) {
    // Your code here
    *returnSize = 0;
    return NULL;
}
//@solution
// Recursive descent: parse_item consumes one number or one bracketed list.
static void parse_item(const char** p, int* out, int* n) {
    if (**p == '[') {
        (*p)++;                                     // '['
        while (**p != ']') {
            parse_item(p, out, n);                  // recurse into the element
            if (**p == ',') (*p)++;
        }
        (*p)++;                                     // ']'
    } else {
        char* end;
        out[(*n)++] = (int)strtol(*p, &end, 10);
        *p = end;
    }
}
int* flatten(char* lst, int* returnSize) {
    int* out = malloc(strlen(lst) * sizeof(int) + sizeof(int));
    int n = 0;
    const char* p = lst;
    parse_item(&p, out, &n);
    *returnSize = n;
    return out;
}
