//@spec {"fn": "timeMap", "params": [{"name": "ops", "type": "ops"}], "ret": "void"}
//@driver
void dsa_driver(DsaOp* ops, int opsSize) {
    TimeMap* tm = timeMapCreate();
    dsa_lb();
    for (int i = 0; i < opsSize; i++) {
        DsaArg* a = ops[i].a;
        if (!strcmp(ops[i].name, "set")) timeMapSet(tm, (char*)a[0].s, (char*)a[1].s, (int)a[2].i);
        else dsa_out_str(timeMapGet(tm, (char*)a[0].s, (int)a[1].i));
    }
    dsa_le();
    timeMapFree(tm);
}
//@starter
// For each key, keep its (timestamp, value) pairs in insertion order:
// timestamps arrive increasing, so get() can binary search them.
typedef struct {
    // Your fields here
    int dummy;
} TimeMap;

TimeMap* timeMapCreate(void) {
    return calloc(1, sizeof(TimeMap));
}

void timeMapSet(TimeMap* obj, char* key, char* value, int timestamp) {
}

char* timeMapGet(TimeMap* obj, char* key, int timestamp) {
    // Binary search for the largest timestamp <= the given one; "" if none.
    return "";
}

void timeMapFree(TimeMap* obj) {
    free(obj);
}
//@approach Per-Key List + Bisect
typedef struct {
    char* key;
    int* ts;          // timestamps, increasing
    char** vals;
    int n, cap;
} Entry;

typedef struct {
    Entry* table;     // open addressing on key strings
    int cap, used;
} TimeMap;

static unsigned hash_str(const char* s) {
    unsigned h = 2166136261u;
    for (; *s; s++) h = (h ^ (unsigned char)*s) * 16777619u;
    return h;
}
static Entry* lookup(TimeMap* m, const char* key) {
    unsigned h = hash_str(key) & (m->cap - 1);
    while (m->table[h].key && strcmp(m->table[h].key, key) != 0) h = (h + 1) & (m->cap - 1);
    return &m->table[h];
}

TimeMap* timeMapCreate(void) {
    TimeMap* m = calloc(1, sizeof(TimeMap));
    m->cap = 64;
    m->table = calloc(m->cap, sizeof(Entry));
    return m;
}

void timeMapSet(TimeMap* obj, char* key, char* value, int timestamp) {
    if (2 * (obj->used + 1) > obj->cap) {            // grow + rehash
        Entry* old = obj->table;
        int old_cap = obj->cap;
        obj->cap *= 2;
        obj->table = calloc(obj->cap, sizeof(Entry));
        for (int i = 0; i < old_cap; i++)
            if (old[i].key) *lookup(obj, old[i].key) = old[i];
        free(old);
    }
    Entry* e = lookup(obj, key);
    if (!e->key) { e->key = strdup(key); obj->used++; }
    if (e->n == e->cap) {
        e->cap = e->cap ? 2 * e->cap : 4;
        e->ts = realloc(e->ts, e->cap * sizeof(int));
        e->vals = realloc(e->vals, e->cap * sizeof(char*));
    }
    e->ts[e->n] = timestamp;
    e->vals[e->n++] = strdup(value);
}

char* timeMapGet(TimeMap* obj, char* key, int timestamp) {
    Entry* e = lookup(obj, key);
    if (!e->key) return "";
    int lo = 0, hi = e->n;                   // bisect_right: first ts > timestamp
    while (lo < hi) {
        int mid = (lo + hi) / 2;
        if (e->ts[mid] <= timestamp) lo = mid + 1; else hi = mid;
    }
    return lo == 0 ? "" : e->vals[lo - 1];
}

void timeMapFree(TimeMap* obj) {
    for (int i = 0; i < obj->cap; i++) {
        Entry* e = &obj->table[i];
        if (!e->key) continue;
        for (int j = 0; j < e->n; j++) free(e->vals[j]);
        free(e->key); free(e->ts); free(e->vals);
    }
    free(obj->table);
    free(obj);
}
