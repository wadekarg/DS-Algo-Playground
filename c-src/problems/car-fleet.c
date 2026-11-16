//@spec {"fn": "carFleet", "params": [{"name": "target", "type": "int"}, {"name": "position", "type": "int[]"}, {"name": "speed", "type": "int[]"}], "ret": "int"}
//@approach Sort by Position + Stack of Arrival Times
typedef struct { int pos, spd; } Car;
static int by_pos_desc(const void* a, const void* b) {
    return ((const Car*)b)->pos - ((const Car*)a)->pos;
}
int carFleet(int target, int* position, int positionSize, int* speed, int speedSize) {
    int n = positionSize;
    // Pair up cars and sort by position descending (closest to target first)
    Car* cars = malloc(n * sizeof(Car));
    for (int i = 0; i < n; i++) cars[i] = (Car){position[i], speed[i]};
    qsort(cars, n, sizeof(Car), by_pos_desc);
    double* stack = malloc(n * sizeof(double));   // arrival times of fleet leaders
    int top = 0;
    for (int i = 0; i < n; i++) {
        double t = (double)(target - cars[i].pos) / cars[i].spd;
        // Arrives later than the fleet ahead => it can't catch up => new fleet
        if (top == 0 || t > stack[top - 1]) stack[top++] = t;
    }
    free(cars); free(stack);
    return top;
}
//@approach Running Max (no stack needed)
typedef struct { int pos, spd; } Car;
static int by_pos_desc(const void* a, const void* b) {
    return ((const Car*)b)->pos - ((const Car*)a)->pos;
}
int carFleet(int target, int* position, int positionSize, int* speed, int speedSize) {
    int n = positionSize;
    Car* cars = malloc(n * sizeof(Car));
    for (int i = 0; i < n; i++) cars[i] = (Car){position[i], speed[i]};
    qsort(cars, n, sizeof(Car), by_pos_desc);
    int fleets = 0;
    double slowest = 0;   // arrival time of the current fleet leader
    for (int i = 0; i < n; i++) {
        double t = (double)(target - cars[i].pos) / cars[i].spd;
        if (t > slowest) {
            slowest = t;
            fleets++;
        }
    }
    free(cars);
    return fleets;
}
