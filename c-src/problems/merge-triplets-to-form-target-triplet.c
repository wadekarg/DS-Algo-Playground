//@spec {"fn": "mergeTriplets", "params": [{"name": "triplets", "type": "int[][]"}, {"name": "target", "type": "int[]"}], "ret": "bool"}
//@approach Filter + Position Tracking
bool mergeTriplets(int** triplets, int tripletsSize, int* tripletsColSize, int* target, int targetSize) {
    bool good[3] = {false, false, false};
    for (int i = 0; i < tripletsSize; i++) {
        int* t = triplets[i];
        if (t[0] > target[0] || t[1] > target[1] || t[2] > target[2]) continue;  // would overshoot
        for (int k = 0; k < 3; k++)
            if (t[k] == target[k]) good[k] = true;
    }
    return good[0] && good[1] && good[2];
}
