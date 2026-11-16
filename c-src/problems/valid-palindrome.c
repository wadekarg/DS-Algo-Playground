//@spec {"fn": "isPalindrome", "params": [{"name": "s", "type": "string"}], "ret": "bool"}
//@approach Filter and Compare
bool isPalindrome(char* s) {
    int n = strlen(s), m = 0;
    char* cleaned = malloc(n + 1);
    for (int i = 0; i < n; i++)
        if (isalnum((unsigned char)s[i])) cleaned[m++] = tolower((unsigned char)s[i]);
    bool ok = true;
    for (int i = 0; i < m / 2 && ok; i++)
        ok = cleaned[i] == cleaned[m - 1 - i];   // compare with its reverse
    free(cleaned);
    return ok;
}
//@approach Two Pointers In-Place
bool isPalindrome(char* s) {
    int left = 0, right = (int)strlen(s) - 1;
    while (left < right) {
        while (left < right && !isalnum((unsigned char)s[left])) left++;
        while (left < right && !isalnum((unsigned char)s[right])) right--;
        if (tolower((unsigned char)s[left]) != tolower((unsigned char)s[right])) return false;
        left++;
        right--;
    }
    return true;
}
