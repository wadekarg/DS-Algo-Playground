//@spec {"fn": "letterCombinations", "params": [{"name": "digits", "type": "string"}], "ret": "string[]"}
//@approach Backtracking on Digits
static const char* MAPPING[10] = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
static char** res_; static int count_;
static void back(const char* digits, int i, char* path) {
    if (digits[i] == '\0') {
        path[i] = '\0';
        res_[count_++] = strdup(path);
        return;
    }
    for (const char* ch = MAPPING[digits[i] - '0']; *ch; ch++) {
        path[i] = *ch;                        // choose, recurse (overwrite = un-choose)
        back(digits, i + 1, path);
    }
}
char** letterCombinations(char* digits, int* returnSize) {
    int n = strlen(digits), total = 1;
    *returnSize = 0;
    if (n == 0) return NULL;
    for (int i = 0; i < n; i++) total *= strlen(MAPPING[digits[i] - '0']);
    res_ = malloc(total * sizeof(char*));
    count_ = 0;
    char* path = malloc(n + 1);
    back(digits, 0, path);
    free(path);
    *returnSize = count_;
    return res_;
}
