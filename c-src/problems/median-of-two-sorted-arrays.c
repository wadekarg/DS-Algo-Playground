//@spec {"fn": "findMedianSortedArrays", "params": [{"name": "nums1", "type": "int[]"}, {"name": "nums2", "type": "int[]"}], "ret": "double"}
//@approach Binary Search Partition
double findMedianSortedArrays(int* nums1, int nums1Size, int* nums2, int nums2Size) {
    if (nums1Size > nums2Size)               // binary search the shorter array
        return findMedianSortedArrays(nums2, nums2Size, nums1, nums1Size);
    int m = nums1Size, n = nums2Size;
    int lo = 0, hi = m, half = (m + n + 1) / 2;
    while (lo <= hi) {
        int i = (lo + hi) / 2, j = half - i;
        long long l1 = i > 0 ? nums1[i - 1] : LLONG_MIN;
        long long r1 = i < m ? nums1[i] : LLONG_MAX;
        long long l2 = j > 0 ? nums2[j - 1] : LLONG_MIN;
        long long r2 = j < n ? nums2[j] : LLONG_MAX;
        if (l1 <= r2 && l2 <= r1) {          // correct partition
            long long left_max = l1 > l2 ? l1 : l2;
            if ((m + n) % 2) return (double)left_max;
            long long right_min = r1 < r2 ? r1 : r2;
            return (left_max + right_min) / 2.0;
        } else if (l1 > r2) {
            hi = i - 1;
        } else {
            lo = i + 1;
        }
    }
    return 0.0;
}
