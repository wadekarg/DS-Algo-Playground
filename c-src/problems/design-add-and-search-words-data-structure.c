//@spec {"fn": "wordDictionary", "params": [{"name": "ops", "type": "ops"}], "ret": "void"}
//@driver
void dsa_driver(DsaOp* ops, int opsSize) {
    WordDictionary* d = wordDictionaryCreate();
    dsa_lb();
    for (int i = 0; i < opsSize; i++) {
        char* arg = (char*)ops[i].a[0].s;
        if (!strcmp(ops[i].name, "addWord")) wordDictionaryAddWord(d, arg);
        else dsa_out_bool(wordDictionarySearch(d, arg));
    }
    dsa_le();
    wordDictionaryFree(d);
}
//@starter
// A trie whose search treats '.' as "any single letter".
typedef struct WordDictionary {
    struct WordDictionary* children[26];
    bool is_end;
} WordDictionary;

WordDictionary* wordDictionaryCreate(void) {
    return calloc(1, sizeof(WordDictionary));
}

void wordDictionaryAddWord(WordDictionary* obj, char* word) {
}

bool wordDictionarySearch(WordDictionary* obj, char* word) {
    // '.' matches any single letter: DFS branches when '.' is encountered.
    return false;
}

void wordDictionaryFree(WordDictionary* obj) {
    free(obj);
}
//@approach Trie with Recursive DFS Search
typedef struct WordDictionary {
    struct WordDictionary* children[26];
    bool is_end;
} WordDictionary;

WordDictionary* wordDictionaryCreate(void) {
    return calloc(1, sizeof(WordDictionary));
}

void wordDictionaryAddWord(WordDictionary* obj, char* word) {
    WordDictionary* node = obj;
    for (; *word; word++) {
        int c = *word - 'a';
        if (!node->children[c]) node->children[c] = wordDictionaryCreate();
        node = node->children[c];
    }
    node->is_end = true;
}

static bool dfs(WordDictionary* node, const char* w) {
    if (*w == '\0') return node->is_end;
    if (*w == '.') {                          // try every child
        for (int c = 0; c < 26; c++)
            if (node->children[c] && dfs(node->children[c], w + 1)) return true;
        return false;
    }
    WordDictionary* next = node->children[*w - 'a'];
    return next != NULL && dfs(next, w + 1);
}

bool wordDictionarySearch(WordDictionary* obj, char* word) {
    return dfs(obj, word);
}

void wordDictionaryFree(WordDictionary* obj) {
    if (!obj) return;
    for (int c = 0; c < 26; c++) wordDictionaryFree(obj->children[c]);
    free(obj);
}
