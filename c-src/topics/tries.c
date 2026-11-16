//@code
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

#define ALPHABET 26   // lowercase 'a'..'z'

typedef struct TrieNode {
    struct TrieNode* children[ALPHABET];  // children[c - 'a'] -> TrieNode
    bool is_end;
} TrieNode;

TrieNode* new_node(void) {
    return calloc(1, sizeof(TrieNode));   // all children NULL, is_end false
}

void insert(TrieNode* root, const char* word) {
    TrieNode* node = root;
    for (const char* p = word; *p; p++) {
        int c = *p - 'a';
        if (!node->children[c])
            node->children[c] = new_node();
        node = node->children[c];
    }
    node->is_end = true;
}

/* Walk the trie along s; NULL if the path breaks. */
TrieNode* walk(TrieNode* root, const char* s) {
    TrieNode* node = root;
    for (const char* p = s; *p; p++) {
        node = node->children[*p - 'a'];
        if (!node) return NULL;
    }
    return node;
}

bool search(TrieNode* root, const char* word) {
    TrieNode* node = walk(root, word);
    return node != NULL && node->is_end;
}

bool starts_with(TrieNode* root, const char* prefix) {
    return walk(root, prefix) != NULL;  // prefix exists; don't check is_end
}

int main(void) {
    // Usage
    TrieNode* trie = new_node();
    insert(trie, "apple");
    insert(trie, "app");
    printf("%s\n", search(trie, "app") ? "true" : "false");         // true
    printf("%s\n", search(trie, "appl") ? "true" : "false");        // false
    printf("%s\n", starts_with(trie, "appl") ? "true" : "false");   // true
    return 0;
}
//@output-map True=true,False=false
//@trace-prelude
typedef struct TrieNode { struct TrieNode* children[26]; bool is_end; } TrieNode;
TrieNode* new_node(void);
//@trace
void insert(TrieNode* root, const char* word) {
    TrieNode* node = root;
    for (const char* p = word; *p; p++) {
        if (!node->children[*p - 'a'])
            node->children[*p - 'a'] = new_node();
        node = node->children[*p - 'a'];
    }
    node->is_end = true;
}
//@trace-python
def insert(self, word):
    node = self.root
    for ch in word:
        if ch not in node.children:
            node.children[ch] = TrieNode()
        node = node.children[ch]
    node.is_end = True
//@trace-map 1:1 2:2 3:3 4:4 5:5 6:6 7:8
