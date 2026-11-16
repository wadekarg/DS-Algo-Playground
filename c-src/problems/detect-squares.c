//@spec {"fn": "detectSquares", "params": [{"name": "ops", "type": "ops"}], "ret": "void"}
//@driver
void dsa_driver(DsaOp* ops, int opsSize) {
    DetectSquares* d = detectSquaresCreate();
    dsa_lb();
    for (int i = 0; i < opsSize; i++) {
        int* point = ops[i].a[0].arr;
        if (!strcmp(ops[i].name, "add")) detectSquaresAdd(d, point, 2);
        else dsa_out_int(detectSquaresCount(d, point, 2));
    }
    dsa_le();
    detectSquaresFree(d);
}
//@starter
// Points have coordinates 0..1000. Count axis-aligned squares (positive
// area) that can be formed with the query point and three stored points.
typedef struct {
    // Your fields here
    int dummy;
} DetectSquares;

DetectSquares* detectSquaresCreate(void) {
    return calloc(1, sizeof(DetectSquares));
}

void detectSquaresAdd(DetectSquares* obj, int* point, int pointSize) {
}

int detectSquaresCount(DetectSquares* obj, int* point, int pointSize) {
    // For each stored point that forms a diagonal with the query, multiply
    // the counts of the two remaining corners.
    return 0;
}

void detectSquaresFree(DetectSquares* obj) {
    free(obj);
}
//@approach Hash Map + Diagonal Iteration
// Coordinates are 0..1000, so a 1001x1001 count grid is the hash map; a list
// of distinct points lets count() iterate the map's keys.
#define SIDE 1001
typedef struct {
    int* count;              // count[x * SIDE + y]
    int* px; int* py;        // distinct points seen
    int n, cap;
} DetectSquares;

DetectSquares* detectSquaresCreate(void) {
    DetectSquares* d = calloc(1, sizeof(DetectSquares));
    d->count = calloc(SIDE * SIDE, sizeof(int));
    return d;
}

void detectSquaresAdd(DetectSquares* obj, int* point, int pointSize) {
    int x = point[0], y = point[1];
    if (obj->count[x * SIDE + y]++ == 0) {
        if (obj->n == obj->cap) {
            obj->cap = obj->cap ? 2 * obj->cap : 16;
            obj->px = realloc(obj->px, obj->cap * sizeof(int));
            obj->py = realloc(obj->py, obj->cap * sizeof(int));
        }
        obj->px[obj->n] = x;
        obj->py[obj->n++] = y;
    }
}

int detectSquaresCount(DetectSquares* obj, int* point, int pointSize) {
    int qx = point[0], qy = point[1], total = 0;
    for (int i = 0; i < obj->n; i++) {
        int px = obj->px[i], py = obj->py[i];
        if (abs(px - qx) != abs(py - qy) || px == qx || py == qy) continue;  // not a diagonal
        total += obj->count[px * SIDE + py] * obj->count[px * SIDE + qy] * obj->count[qx * SIDE + py];
    }
    return total;
}

void detectSquaresFree(DetectSquares* obj) {
    free(obj->count); free(obj->px); free(obj->py);
    free(obj);
}
