//@spec {"fn": "minStack", "params": [{"name": "ops", "type": "ops"}], "ret": "int[]"}
//@driver
// Replays the ops against your MinStack, collecting outputs of top/getMin.
void dsa_driver(DsaOp* ops, int opsSize) {
    MinStack* s = minStackCreate();
    dsa_lb();
    for (int i = 0; i < opsSize; i++) {
        const char* name = ops[i].name;
        if (!strcmp(name, "push")) minStackPush(s, (int)ops[i].a[0].i);
        else if (!strcmp(name, "pop")) minStackPop(s);
        else if (!strcmp(name, "top")) dsa_out_int(minStackTop(s));
        else if (!strcmp(name, "getMin")) dsa_out_int(minStackGetMin(s));
    }
    dsa_le();
    minStackFree(s);
}
//@starter
// Design a stack that supports push, pop, top and getMin in O(1).
// The tests replay operations like ["push", -2], ["getMin"], ["pop"], ...
typedef struct {
    // Your fields here (e.g. a main stack + a stack of running minimums)
    int dummy;
} MinStack;

MinStack* minStackCreate(void) {
    MinStack* obj = calloc(1, sizeof(MinStack));
    return obj;
}

void minStackPush(MinStack* obj, int val) {
}

void minStackPop(MinStack* obj) {
}

int minStackTop(MinStack* obj) {
    return 0;
}

int minStackGetMin(MinStack* obj) {
    return 0;
}

void minStackFree(MinStack* obj) {
    free(obj);
}
//@approach Two Stacks (main + min-aux)
typedef struct {
    int* stack;
    int* min_stack;   // aux: running min at each level
    int size, cap;
} MinStack;

MinStack* minStackCreate(void) {
    MinStack* obj = malloc(sizeof(MinStack));
    obj->cap = 16;
    obj->size = 0;
    obj->stack = malloc(obj->cap * sizeof(int));
    obj->min_stack = malloc(obj->cap * sizeof(int));
    return obj;
}

void minStackPush(MinStack* obj, int val) {
    if (obj->size == obj->cap) {
        obj->cap *= 2;
        obj->stack = realloc(obj->stack, obj->cap * sizeof(int));
        obj->min_stack = realloc(obj->min_stack, obj->cap * sizeof(int));
    }
    int cur_min = obj->size && obj->min_stack[obj->size - 1] < val ? obj->min_stack[obj->size - 1] : val;
    obj->stack[obj->size] = val;
    obj->min_stack[obj->size++] = cur_min;
}

void minStackPop(MinStack* obj) { obj->size--; }

int minStackTop(MinStack* obj) { return obj->stack[obj->size - 1]; }

int minStackGetMin(MinStack* obj) { return obj->min_stack[obj->size - 1]; }

void minStackFree(MinStack* obj) {
    free(obj->stack);
    free(obj->min_stack);
    free(obj);
}
