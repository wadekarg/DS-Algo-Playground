//@spec {"fn": "findWords", "params": [{"name": "board", "type": "char[][]"}, {"name": "words", "type": "string[]"}], "ret": "string[]"}
//@starter
/**
 * Return every word from words that can be traced on the board (malloc'd;
 * set *returnSize). Sort the result alphabetically for the tests.
 */
char** findWords(char** board, int boardSize, int* boardColSize, char** words, int wordsSize, int* returnSize) {
    // Build a Trie of words. DFS from each cell, walking trie + board together.
    // Collect the word at each terminal trie node you reach.
    *returnSize = 0;
    return NULL;
}
//@approach Trie + DFS
typedef struct Node {
    struct Node* next[26];
    char* word;                               // set at the terminal node
} Node;
static int m_, n_, found_n_;
static char** found_;
static void dfs(char** board, int r, int c, Node* node) {
    char ch = board[r][c];
    if (ch == '#' || !node->next[ch - 'a']) return;
    Node* nxt = node->next[ch - 'a'];
    if (nxt->word) {
        found_[found_n_++] = nxt->word;
        nxt->word = NULL;                     // report each word once
    }
    board[r][c] = '#';
    int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    for (int d = 0; d < 4; d++) {
        int nr = r + dr[d], nc = c + dc[d];
        if (nr >= 0 && nr < m_ && nc >= 0 && nc < n_) dfs(board, nr, nc, nxt);
    }
    board[r][c] = ch;
}
static int cmp_str(const void* a, const void* b) {
    return strcmp(*(char* const*)a, *(char* const*)b);
}
char** findWords(char** board, int boardSize, int* boardColSize, char** words, int wordsSize, int* returnSize) {
    Node* root = calloc(1, sizeof(Node));
    for (int w = 0; w < wordsSize; w++) {
        Node* node = root;
        for (char* p = words[w]; *p; p++) {
            if (!node->next[*p - 'a']) node->next[*p - 'a'] = calloc(1, sizeof(Node));
            node = node->next[*p - 'a'];
        }
        node->word = words[w];
    }
    m_ = boardSize; n_ = boardColSize[0];
    found_ = malloc((wordsSize + 1) * sizeof(char*));
    found_n_ = 0;
    for (int r = 0; r < m_; r++)
        for (int c = 0; c < n_; c++)
            dfs(board, r, c, root);
    qsort(found_, found_n_, sizeof(char*), cmp_str);   // deterministic order
    *returnSize = found_n_;
    return found_;
}
