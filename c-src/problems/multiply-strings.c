//@spec {"fn": "multiply", "params": [{"name": "num1", "type": "string"}, {"name": "num2", "type": "string"}], "ret": "string"}
//@approach Schoolbook Multiplication
char* multiply(char* num1, char* num2) {
    int m = strlen(num1), n = strlen(num2);
    if (strcmp(num1, "0") == 0 || strcmp(num2, "0") == 0) return strdup("0");
    int* result = calloc(m + n, sizeof(int));
    for (int i = m - 1; i >= 0; i--)
        for (int j = n - 1; j >= 0; j--) {
            int mul = (num1[i] - '0') * (num2[j] - '0') + result[i + j + 1];
            result[i + j + 1] = mul % 10;    // digit pair lands at i+j+1, carry at i+j
            result[i + j] += mul / 10;
        }
    char* s = malloc(m + n + 1);
    int k = 0, i = 0;
    while (i < m + n - 1 && result[i] == 0) i++;   // strip leading zeros
    for (; i < m + n; i++) s[k++] = '0' + result[i];
    s[k] = '\0';
    free(result);
    return s;
}
