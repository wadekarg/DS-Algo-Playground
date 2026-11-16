//@spec {"fn": "evalRPN", "params": [{"name": "tokens", "type": "string[]"}], "ret": "int"}
//@approach Stack Evaluator
int evalRPN(char** tokens, int tokensSize) {
    long long* stack = malloc(tokensSize * sizeof(long long));
    int top = 0;
    for (int i = 0; i < tokensSize; i++) {
        char* t = tokens[i];
        if (t[1] == '\0' && strchr("+-*/", t[0])) {   // operator (not "-3")
            long long b = stack[--top], a = stack[--top];
            switch (t[0]) {
                case '+': stack[top++] = a + b; break;
                case '-': stack[top++] = a - b; break;
                case '*': stack[top++] = a * b; break;
                default:  stack[top++] = a / b; break;  // C already truncates toward zero
            }
        } else {
            stack[top++] = atoll(t);
        }
    }
    int result = (int)stack[0];
    free(stack);
    return result;
}
