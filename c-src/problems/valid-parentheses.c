//@spec {"fn": "isValid", "params": [{"name": "s", "type": "string"}], "ret": "bool"}
//@approach Stack with Dict Mapping
bool isValid(char* s) {
    char pairs[128] = {0};                // closing -> opening
    pairs[')'] = '('; pairs[']'] = '['; pairs['}'] = '{';
    int n = strlen(s), top = 0;
    char* stack = malloc(n + 1);
    bool ok = true;
    for (int i = 0; i < n && ok; i++) {
        char ch = s[i];
        if (ch == '(' || ch == '[' || ch == '{') stack[top++] = ch;
        else if (top == 0 || stack[--top] != pairs[(unsigned char)ch]) ok = false;
    }
    free(stack);
    return ok && top == 0;
}
