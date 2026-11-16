//@spec {"fn": "leastInterval", "params": [{"name": "tasks", "type": "char[]"}, {"name": "n", "type": "int"}], "ret": "int"}
//@approach Greedy Formula
int leastInterval(char* tasks, int tasksSize, int n) {
    int counts[26] = {0}, max_count = 0, tied = 0;
    for (int i = 0; i < tasksSize; i++) counts[tasks[i] - 'A']++;
    for (int c = 0; c < 26; c++) if (counts[c] > max_count) max_count = counts[c];
    // Number of tasks tied at the maximum frequency
    for (int c = 0; c < 26; c++) if (counts[c] == max_count) tied++;
    // The most frequent task creates (max_count - 1) blocks of size (n + 1);
    // the final block holds all tied-max tasks (no cooldown after the last one).
    int formula = (max_count - 1) * (n + 1) + tied;
    return formula > tasksSize ? formula : tasksSize;
}
//@approach Max-Heap Simulation
// With only 26 task types, "pop the max" is a scan over the ready counts.
int leastInterval(char* tasks, int tasksSize, int n) {
    int ready[26] = {0};                    // counts available to run now
    int cool_count[26], cool_until[26];     // FIFO of (count, time_available)
    int head = 0, tail = 0, waiting = 0, remaining_types = 0;
    for (int i = 0; i < tasksSize; i++) ready[tasks[i] - 'A']++;
    for (int c = 0; c < 26; c++) if (ready[c]) remaining_types++;
    int time = 0;
    while (remaining_types > 0 || waiting > 0) {
        time++;
        int best = -1;                      // "heap pop": the largest ready count
        for (int c = 0; c < 26; c++)
            if (ready[c] && (best < 0 || ready[c] > ready[best])) best = c;
        if (best >= 0) {
            int count = ready[best] - 1;    // ran one
            ready[best] = 0;
            remaining_types--;
            if (count > 0) {
                cool_count[tail % 26] = count;
                cool_until[tail % 26] = time + n;
                tail++;
                waiting++;
            }
        }
        if (waiting && cool_until[head % 26] == time) {   // cooled down: back in the heap
            int count = cool_count[head % 26];
            head++;
            waiting--;
            for (int c = 0; c < 26; c++)
                if (!ready[c]) { ready[c] = count; break; }   // any free slot works
            remaining_types++;
        }
    }
    return time;
}
