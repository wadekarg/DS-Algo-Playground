//@spec {"fn": "myPow", "params": [{"name": "x", "type": "double"}, {"name": "n", "type": "int"}], "ret": "double"}
//@approach Iterative Binary Exponentiation
double myPow(double x, int n) {
    long long e = n;                         // long long: -INT_MIN overflows int
    if (e < 0) {
        x = 1 / x;
        e = -e;
    }
    double result = 1.0;
    while (e > 0) {
        if (e & 1) result *= x;
        x *= x;
        e >>= 1;
    }
    return result;
}
