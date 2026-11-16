//@spec {"fn": "checkValidString", "params": [{"name": "s", "type": "string"}], "ret": "bool"}
//@approach Min/Max Open Counters
bool checkValidString(char* s) {
    int min_open = 0, max_open = 0;
    for (; *s; s++) {
        if (*s == '(') { min_open++; max_open++; }
        else if (*s == ')') { min_open--; max_open--; }
        else { min_open--; max_open++; }      // '*': could be ')' or '('
        if (max_open < 0) return false;
        if (min_open < 0) min_open = 0;       // clamp impossible interpretations
    }
    return min_open == 0;
}
