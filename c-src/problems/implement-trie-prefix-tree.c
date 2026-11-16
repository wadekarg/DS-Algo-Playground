//@spec {"fn": "trie", "params": [{"name": "ops", "type": "ops"}], "ret": "void"}
//@driver
void dsa_driver(DsaOp* ops, int opsSize) {
    Trie* t = trieCreate();
    dsa_lb();
    for (int i = 0; i < opsSize; i++) {
        const char* name = ops[i].name;
        char* arg = (char*)ops[i].a[0].s;
        if (!strcmp(name, "insert")) trieInsert(t, arg);
        else if (!strcmp(name, "search")) dsa_out_bool(trieSearch(t, arg));
        else if (!strcmp(name, "startsWith")) dsa_out_bool(trieStartsWith(t, arg));
    }
    dsa_le();
    trieFree(t);
}
//@starter
// Implement a trie over lowercase letters.
typedef struct Trie {
    struct Trie* children[26];
    bool is_end;
} Trie;

Trie* trieCreate(void) {
    return calloc(1, sizeof(Trie));
}

void trieInsert(Trie* obj, char* word) {
    // Walk the trie, creating nodes; mark the final node as the end of a word.
}

bool trieSearch(Trie* obj, char* word) {
    // Walk; return is_end of the final node.
    return false;
}

bool trieStartsWith(Trie* obj, char* prefix) {
    // Walk; return true if the traversal completes.
    return false;
}

void trieFree(Trie* obj) {
    free(obj);
}
//@approach Dict-Based Trie
// The "dict" of children is an array indexed by letter.
typedef struct Trie {
    struct Trie* children[26];
    bool is_end;
} Trie;

Trie* trieCreate(void) {
    return calloc(1, sizeof(Trie));
}

void trieInsert(Trie* obj, char* word) {
    Trie* node = obj;
    for (; *word; word++) {
        int c = *word - 'a';
        if (!node->children[c]) node->children[c] = trieCreate();
        node = node->children[c];
    }
    node->is_end = true;
}

static Trie* walk(Trie* node, const char* s) {
    for (; *s && node; s++) node = node->children[*s - 'a'];
    return node;
}

bool trieSearch(Trie* obj, char* word) {
    Trie* node = walk(obj, word);
    return node != NULL && node->is_end;
}

bool trieStartsWith(Trie* obj, char* prefix) {
    return walk(obj, prefix) != NULL;
}

void trieFree(Trie* obj) {
    if (!obj) return;
    for (int c = 0; c < 26; c++) trieFree(obj->children[c]);
    free(obj);
}
