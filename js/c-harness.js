/* c-harness.js — turns a C solution + a problem's JSON test cases into one
   self-contained C program, and parses that program's output back into
   per-test results. Shared by the browser (practice.js, via DSA.cHarness) and
   the offline verifier (tools/build_c.py → node), so both run exactly the
   same harness.

   Test cases are the same ones the Python runner uses: `args` is a JSON array
   and `expected` is the Python repr() of the answer. The harness prints every
   C result in Python repr format ([1, 2], True, 'abc', 2.5, None, ...), so the
   existing expected strings are reused as-is.

   A problem's C spec (problems.json → prob.c, or a topic practice block's
   data-c attribute) looks like:
     {
       "fn": "twoSum",                         // function the user writes
       "params": [{"name": "nums", "type": "int[]"},
                  {"name": "target", "type": "int"}],
       "ret": "int[]",                         // or "void" + "print": "<param>"
       "prelude": "C code placed before the user's code (struct defs)",
       "normalize": "len_lex" | "lex" | "inner_lex" ...  // optional: compare an
                    int[][] result order-insensitively (rows sorted first)
       "driver": "C code defining void dsa_driver(<params>) that calls the
                  user's code and prints the result with dsa_out_* helpers"
     }

   Parameter types follow LeetCode's C conventions:
     int, long, uint32, double, bool, string        → scalar / char*
     int[]      → int* x, int xSize
     char[]     → char* x, int xSize                  (list of 1-char strings)
     int[][]    → int** x, int xSize, int* xColSize
     char[][]   → char** x, int xSize, int* xColSize   (grid of 1-char strings)
     string[]   → char** x, int xSize
     string[][] → char*** x, int xSize, int* xColSize
     tree       → struct TreeNode*   (level-order JSON, null = missing child)
     list       → struct ListNode*
     list[]     → struct ListNode** x, int xSize
     ops        → DsaOp* x, int xSize                 (design-problem op lists)
     json       → char* x   (the argument's JSON text, for irregular data)
   Array-returning functions take the usual int* returnSize (and
   int** returnColumnSizes for 2-D results). */
(function (root) {
  'use strict';

  var MARK = '@@DSA@@';
  var USER_FILE = 'solution.c';
  var NULL_INT = 'DSA_NULL'; // JSON null inside int arrays → INT_MIN sentinel

  // ---------------------------------------------------------------- types
  var SCALAR_C = {
    'int': 'int', 'long': 'long long', 'uint32': 'uint32_t',
    'double': 'double', 'bool': 'bool', 'string': 'char*'
  };

  function paramDecl(p) {
    var n = p.name, t = p.type;
    if (SCALAR_C[t]) return SCALAR_C[t] + ' ' + n;
    switch (t) {
      case 'int[]':      return 'int* ' + n + ', int ' + n + 'Size';
      case 'char[]':     return 'char* ' + n + ', int ' + n + 'Size';
      case 'int[][]':    return 'int** ' + n + ', int ' + n + 'Size, int* ' + n + 'ColSize';
      case 'char[][]':   return 'char** ' + n + ', int ' + n + 'Size, int* ' + n + 'ColSize';
      case 'string[]':   return 'char** ' + n + ', int ' + n + 'Size';
      case 'string[][]': return 'char*** ' + n + ', int ' + n + 'Size, int* ' + n + 'ColSize';
      case 'tree':       return 'struct TreeNode* ' + n;
      case 'list':       return 'struct ListNode* ' + n;
      case 'list[]':     return 'struct ListNode** ' + n + ', int ' + n + 'Size';
      case 'ops':        return 'DsaOp* ' + n + ', int ' + n + 'Size';
      case 'json':       return 'char* ' + n;
    }
    throw new Error('c-harness: unknown param type "' + t + '"');
  }

  var RET_C = {
    'void': 'void', 'int': 'int', 'long': 'long long', 'uint32': 'uint32_t',
    'double': 'double', 'bool': 'bool', 'string': 'char*',
    'int[]': 'int*', 'double[]': 'double*', 'string[]': 'char**',
    'int[][]': 'int**', 'string[][]': 'char***',
    'tree': 'struct TreeNode*', 'list': 'struct ListNode*'
  };

  function retExtras(ret) {
    if (ret === 'int[]' || ret === 'double[]' || ret === 'string[]') return ['int* returnSize'];
    if (ret === 'int[][]' || ret === 'string[][]') return ['int* returnSize', 'int** returnColumnSizes'];
    return [];
  }

  /** The C prototype the user must implement, e.g.
   *  "int* twoSum(int* nums, int numsSize, int target, int* returnSize)". */
  function signature(spec) {
    var parts = spec.params.map(paramDecl).concat(retExtras(spec.ret));
    var rt = RET_C[spec.ret];
    if (!rt) throw new Error('c-harness: unknown return type "' + spec.ret + '"');
    return rt + ' ' + spec.fn + '(' + (parts.length ? parts.join(', ') : 'void') + ')';
  }

  function usesType(spec, re) {
    var all = spec.params.map(function (p) { return p.type; }).concat([spec.ret || '']);
    return all.some(function (t) { return re.test(t); }) || re.test((spec.structs || []).join(' '));
  }

  // ------------------------------------------------------- C literal emit
  function cString(s) {
    var out = '"';
    s = String(s);
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i), code = s.charCodeAt(i);
      if (ch === '\\') out += '\\\\';
      else if (ch === '"') out += '\\"';
      else if (ch === '\n') out += '\\n';
      else if (ch === '\t') out += '\\t';
      else if (ch === '\r') out += '\\r';
      else if (code < 32 || code === 127) out += '\\' + ('00' + code.toString(8)).slice(-3);
      else if (code > 127) {
        // UTF-8 encode as octal escapes
        var bytes = unescape(encodeURIComponent(ch));
        for (var b = 0; b < bytes.length; b++) out += '\\' + ('00' + bytes.charCodeAt(b).toString(8)).slice(-3);
      } else out += ch;
    }
    return out + '"';
  }

  function cInt(v) {
    if (v === null || v === undefined) return NULL_INT;
    if (typeof v === 'boolean') return v ? '1' : '0';
    var n = Number(v);
    if (!isFinite(n)) throw new Error('c-harness: not a number: ' + v);
    if (n > 2147483647 || n < -2147483648) return String(n) + 'LL';
    return String(n);
  }

  function cDouble(v) {
    var s = String(Number(v));
    if (!/[.eE]/.test(s)) s += '.0';
    return s;
  }

  function intList(arr) {
    return arr.length ? arr.map(cInt).join(', ') : '0';
  }

  // Emit declarations for one argument; returns {decl: [...lines], call: 'expr, expr'}
  function emitArg(p, v, id) {
    var t = p.type, L = [], call;
    var bad = function () { throw new Error('c-harness: arg ' + p.name + ' expects ' + t + ', got ' + JSON.stringify(v)); };
    switch (t) {
      case 'int': case 'long': case 'uint32':
        L.push(SCALAR_C[t] + ' ' + id + ' = ' + cInt(v) + (t === 'uint32' ? 'u' : '') + ';');
        call = id; break;
      case 'double':
        L.push('double ' + id + ' = ' + cDouble(v) + ';'); call = id; break;
      case 'bool':
        L.push('bool ' + id + ' = ' + (v ? 'true' : 'false') + ';'); call = id; break;
      case 'json': // any JSON value, passed as its text, e.g. "[1,[2,3]]"
        L.push('static char ' + id + '[] = ' + cString(JSON.stringify(v)) + ';'); call = id; break;
      case 'string':
        if (typeof v !== 'string') bad();
        L.push('static char ' + id + '[] = ' + cString(v) + ';'); call = id; break;
      case 'int[]':
        if (!Array.isArray(v)) bad();
        L.push('static int ' + id + '[] = {' + intList(v) + '};');
        call = id + ', ' + v.length; break;
      case 'char[]': // list of 1-char strings → char array (NUL-terminated too)
        if (!Array.isArray(v)) bad();
        L.push('static char ' + id + '[] = ' + cString(v.map(function (c) {
          if (typeof c !== 'string' || c.length !== 1) bad();
          return c;
        }).join('')) + ';');
        call = id + ', ' + v.length; break;
      case 'int[][]': case 'char[][]': case 'string[][]': {
        if (!Array.isArray(v)) bad();
        var elem = t === 'int[][]' ? 'int' : t === 'char[][]' ? 'char' : 'char*';
        var rows = [];
        v.forEach(function (row, r) {
          if (!Array.isArray(row)) bad();
          var rid = id + '_r' + r;
          if (t === 'int[][]') {
            L.push('static int ' + rid + '[] = {' + intList(row) + '};');
          } else if (t === 'char[][]') {
            // one char per cell, plus a trailing NUL so rows also work as strings
            L.push('static char ' + rid + '[] = {' + row.map(function (c) {
              if (typeof c !== 'string' || c.length !== 1) bad();
              return "'" + (c === "'" ? "\\'" : c === '\\' ? '\\\\' : c) + "'";
            }).concat(['0']).join(', ') + '};');
          } else {
            row.forEach(function (s, c) {
              L.push('static char ' + rid + '_' + c + '[] = ' + cString(s) + ';');
            });
            L.push('static char* ' + rid + '[] = {' + (row.length ? row.map(function (s, c) { return rid + '_' + c; }).join(', ') : '0') + '};');
          }
          rows.push(rid);
        });
        L.push('static ' + elem + '* ' + id + '[] = {' + (rows.length ? rows.join(', ') : '0') + '};');
        L.push('static int ' + id + '_cols[] = {' + intList(v.map(function (r) { return r.length; })) + '};');
        call = id + ', ' + v.length + ', ' + id + '_cols'; break;
      }
      case 'string[]':
        if (!Array.isArray(v)) bad();
        v.forEach(function (s, i) { L.push('static char ' + id + '_' + i + '[] = ' + cString(s) + ';'); });
        L.push('static char* ' + id + '[] = {' + (v.length ? v.map(function (s, i) { return id + '_' + i; }).join(', ') : '0') + '};');
        call = id + ', ' + v.length; break;
      case 'tree':
        if (!Array.isArray(v)) bad();
        L.push('static int ' + id + '_v[] = {' + intList(v) + '};');
        L.push('struct TreeNode* ' + id + ' = dsa_build_tree(' + id + '_v, ' + v.length + ');');
        call = id; break;
      case 'list':
        if (!Array.isArray(v)) bad();
        L.push('static int ' + id + '_v[] = {' + intList(v) + '};');
        L.push('struct ListNode* ' + id + ' = dsa_build_list(' + id + '_v, ' + v.length + ');');
        call = id; break;
      case 'list[]':
        if (!Array.isArray(v)) bad();
        v.forEach(function (row, i) {
          L.push('static int ' + id + '_v' + i + '[] = {' + intList(row) + '};');
        });
        L.push('static struct ListNode* ' + id + '[' + Math.max(1, v.length) + '];');
        v.forEach(function (row, i) {
          L.push(id + '[' + i + '] = dsa_build_list(' + id + '_v' + i + ', ' + row.length + ');');
        });
        call = id + ', ' + v.length; break;
      case 'ops':
        if (!Array.isArray(v)) bad();
        L.push('static DsaOp ' + id + '[' + Math.max(1, v.length) + '];');
        v.forEach(function (op, i) {
          if (!Array.isArray(op) || typeof op[0] !== 'string') bad();
          var o = id + '[' + i + ']';
          L.push(o + '.name = ' + cString(op[0]) + '; ' + o + '.argc = ' + (op.length - 1) + ';');
          op.slice(1).forEach(function (a, j) {
            var aa = o + '.a[' + j + ']';
            if (typeof a === 'string') L.push(aa + '.isStr = 1; ' + aa + '.s = ' + cString(a) + ';');
            else if (Array.isArray(a)) {
              L.push(aa + '.n = ' + a.length + ';');
              a.forEach(function (x, k) { L.push(aa + '.arr[' + k + '] = ' + cInt(x) + ';'); });
            } else L.push(aa + '.i = ' + cInt(a) + ';');
          });
        });
        call = id + ', ' + v.length; break;
      default:
        throw new Error('c-harness: unknown param type "' + t + '"');
    }
    return { decl: L, call: call };
  }

  // Emit code that prints the value `expr` (of type t) in Python repr form.
  function emitPrint(t, expr, sizeExpr, colsExpr) {
    switch (t) {
      case 'int': case 'long': return 'dsa_out_int((long long)(' + expr + '));';
      case 'uint32': return 'dsa_out_int((long long)(uint32_t)(' + expr + '));';
      case 'double': return 'dsa_out_double(' + expr + ');';
      case 'bool': return 'dsa_out_bool(' + expr + ');';
      case 'string': return 'dsa_out_str(' + expr + ');';
      case 'int[]': return 'dsa_out_int_arr(' + expr + ', ' + sizeExpr + ');';
      case 'double[]': return 'dsa_out_double_arr(' + expr + ', ' + sizeExpr + ');';
      case 'string[]': return 'dsa_out_str_arr(' + expr + ', ' + sizeExpr + ');';
      case 'int[][]': return 'dsa_out_int_2d(' + expr + ', ' + sizeExpr + ', ' + colsExpr + ');';
      case 'char[][]': return 'dsa_out_char_2d(' + expr + ', ' + sizeExpr + ', ' + colsExpr + ');';
      case 'string[][]': return 'dsa_out_str_2d(' + expr + ', ' + sizeExpr + ', ' + colsExpr + ');';
      case 'tree': return 'dsa_out_tree(' + expr + ');';
      case 'list': return 'dsa_out_list(' + expr + ');';
    }
    throw new Error('c-harness: cannot print type "' + t + '"');
  }

  // ------------------------------------------------------------ runtime
  var HEAD = [
    '#define _GNU_SOURCE',
    '#include <stdio.h>',
    '#include <stdlib.h>',
    '#include <string.h>',
    '#include <stdbool.h>',
    '#include <stdint.h>',
    '#include <limits.h>',
    '#include <math.h>',
    '#include <ctype.h>',
    '#include <setjmp.h>',
    '#include <signal.h>',
    '#include <unistd.h>',
    '#define DSA_NULL INT_MIN'
  ].join('\n');

  var TREE_DEF = 'struct TreeNode { int val; struct TreeNode *left; struct TreeNode *right; };';
  var LIST_DEF = 'struct ListNode { int val; struct ListNode *next; };';
  var OPS_DEF = [
    'typedef struct { int isStr; long long i; const char* s; int n; int arr[8]; } DsaArg;',
    'typedef struct { const char* name; int argc; DsaArg a[6]; } DsaOp;'
  ].join('\n');

  // Output buffer + repr printers. Results are buffered (not printf'd) so the
  // user's own printf output stays separate from the value being checked.
  var RUNTIME = String.raw`
static char* dsa_ob; static size_t dsa_ol, dsa_oc;
static int dsa_first[256]; static int dsa_depth;
static void dsa_w(const char* s) {
  size_t n = strlen(s);
  if (dsa_ol + n + 1 > dsa_oc) {
    dsa_oc = (dsa_ol + n + 1) * 2 + 256;
    dsa_ob = (char*)realloc(dsa_ob, dsa_oc);
  }
  memcpy(dsa_ob + dsa_ol, s, n + 1); dsa_ol += n;
}
static void dsa_item(void) {
  if (dsa_depth > 0) { if (!dsa_first[dsa_depth]) dsa_w(", "); dsa_first[dsa_depth] = 0; }
}
/* Build nested lists in drivers: dsa_lb(); ...items...; dsa_le(); */
static void dsa_lb(void) { dsa_item(); dsa_w("["); if (dsa_depth < 255) dsa_depth++; dsa_first[dsa_depth] = 1; }
static void dsa_le(void) { if (dsa_depth > 0) dsa_depth--; dsa_w("]"); }
static void dsa_out_none(void) { dsa_item(); dsa_w("None"); }
static void dsa_out_int(long long v) { char b[32]; dsa_item(); snprintf(b, sizeof b, "%lld", v); dsa_w(b); }
static void dsa_out_bool(bool v) { dsa_item(); dsa_w(v ? "True" : "False"); }
static void dsa_out_double(double v) {
  char b[64], d[40]; int e = 0, p, nd = 0;
  dsa_item();
  if (isnan(v)) { dsa_w("nan"); return; }
  if (isinf(v)) { dsa_w(v < 0 ? "-inf" : "inf"); return; }
  if (v == 0) { dsa_w(signbit(v) ? "-0.0" : "0.0"); return; }
  /* shortest round-trip digits, then lay them out like Python's repr() */
  for (p = 1; p <= 17; p++) { snprintf(b, sizeof b, "%.*e", p - 1, v); if (strtod(b, NULL) == v) break; }
  { char* s = b; char* ep;
    if (*s == '-') s++;
    for (; *s && *s != 'e'; s++) if (isdigit((unsigned char)*s)) d[nd++] = *s;
    d[nd] = 0; ep = strchr(b, 'e'); e = ep ? atoi(ep + 1) : 0; }
  while (nd > 1 && d[nd - 1] == '0') d[--nd] = 0;
  { char o[96]; int k = 0, i;
    if (v < 0) o[k++] = '-';
    if (e >= -4 && e < 16) {
      if (e < 0) { o[k++] = '0'; o[k++] = '.'; for (i = 0; i < -e - 1; i++) o[k++] = '0'; for (i = 0; i < nd; i++) o[k++] = d[i]; }
      else {
        for (i = 0; i <= e; i++) o[k++] = i < nd ? d[i] : '0';
        o[k++] = '.';
        if (nd > e + 1) for (i = e + 1; i < nd; i++) o[k++] = d[i]; else o[k++] = '0';
      }
      o[k] = 0;
    } else {
      o[k++] = d[0];
      if (nd > 1) { o[k++] = '.'; for (i = 1; i < nd; i++) o[k++] = d[i]; }
      k += snprintf(o + k, sizeof o - k, "e%c%02d", e < 0 ? '-' : '+', e < 0 ? -e : e);
    }
    dsa_w(o); }
}
static void dsa_out_str(const char* s) {
  char q = '\'', b[8]; const unsigned char* p;
  dsa_item();
  if (!s) { dsa_w("None"); return; }
  if (strchr(s, '\'') && !strchr(s, '"')) q = '"';
  b[0] = q; b[1] = 0; dsa_w(b);
  for (p = (const unsigned char*)s; *p; p++) {
    if (*p == '\\') dsa_w("\\\\");
    else if (*p == (unsigned char)q) { b[0] = '\\'; b[1] = q; b[2] = 0; dsa_w(b); }
    else if (*p == '\n') dsa_w("\\n");
    else if (*p == '\t') dsa_w("\\t");
    else if (*p == '\r') dsa_w("\\r");
    else if (*p < 32 || *p == 127) { snprintf(b, sizeof b, "\\x%02x", *p); dsa_w(b); }
    else { b[0] = (char)*p; b[1] = 0; dsa_w(b); }
  }
  b[0] = q; b[1] = 0; dsa_w(b);
}
static void dsa_out_char(char c) { char s[2] = { c, 0 }; dsa_out_str(s); }
static void dsa_out_int_arr(const int* a, int n) { int i; dsa_lb(); for (i = 0; a && i < n; i++) dsa_out_int(a[i]); dsa_le(); }
static void dsa_out_double_arr(const double* a, int n) { int i; dsa_lb(); for (i = 0; a && i < n; i++) dsa_out_double(a[i]); dsa_le(); }
static void dsa_out_str_arr(char** a, int n) { int i; dsa_lb(); for (i = 0; a && i < n; i++) dsa_out_str(a[i]); dsa_le(); }
static void dsa_out_int_2d(int** a, int n, const int* cols) { int i; dsa_lb(); for (i = 0; a && i < n; i++) dsa_out_int_arr(a[i], cols ? cols[i] : 0); dsa_le(); }
static void dsa_out_char_2d(char** a, int n, const int* cols) {
  int i, j; dsa_lb();
  for (i = 0; a && i < n; i++) { dsa_lb(); for (j = 0; j < (cols ? cols[i] : 0); j++) dsa_out_char(a[i][j]); dsa_le(); }
  dsa_le();
}
static void dsa_out_str_2d(char*** a, int n, const int* cols) { int i; dsa_lb(); for (i = 0; a && i < n; i++) dsa_out_str_arr(a[i], cols ? cols[i] : 0); dsa_le(); }
/* Order-insensitive checks (spec.normalize): sort the rows of an int[][]
   result before printing. by_len: shorter rows first, then lexicographic. */
typedef struct { int* r; int n; } DsaRow;
static int dsa_by_len;
static int dsa_row_cmp(const void* a, const void* b) {
  const DsaRow *x = (const DsaRow*)a, *y = (const DsaRow*)b; int i;
  if (dsa_by_len && x->n != y->n) return x->n - y->n;
  for (i = 0; i < x->n && i < y->n; i++) if (x->r[i] != y->r[i]) return x->r[i] < y->r[i] ? -1 : 1;
  return x->n - y->n;
}
static int dsa_int_cmp(const void* a, const void* b) { int x = *(const int*)a, y = *(const int*)b; return (x > y) - (x < y); }
static void dsa_norm_int_2d(int** a, int n, int* cols, int inner, int by_len) {
  DsaRow* rows; int i;
  if (!a || n <= 0) return;
  rows = (DsaRow*)malloc(sizeof *rows * n);
  for (i = 0; i < n; i++) {
    rows[i].r = a[i]; rows[i].n = cols ? cols[i] : 0;
    if (inner && rows[i].r) qsort(rows[i].r, rows[i].n, sizeof(int), dsa_int_cmp);
  }
  dsa_by_len = by_len;
  qsort(rows, n, sizeof *rows, dsa_row_cmp);
  for (i = 0; i < n; i++) { a[i] = rows[i].r; if (cols) cols[i] = rows[i].n; }
  free(rows);
}
`;

  var TREE_RT = String.raw`
static struct TreeNode* dsa_new_tree(int v) {
  struct TreeNode* t = (struct TreeNode*)calloc(1, sizeof *t); t->val = v; return t;
}
/* level-order array (DSA_NULL = missing child) → tree */
static struct TreeNode* dsa_build_tree(const int* v, int n) {
  struct TreeNode **q, *root; int head = 0, tail = 0, i = 1;
  if (n == 0 || v[0] == DSA_NULL) return NULL;
  q = (struct TreeNode**)malloc(sizeof *q * (n + 1));
  root = dsa_new_tree(v[0]); q[tail++] = root;
  while (head < tail && i < n) {
    struct TreeNode* t = q[head++];
    if (i < n && v[i] != DSA_NULL) { t->left = dsa_new_tree(v[i]); q[tail++] = t->left; } i++;
    if (i < n && v[i] != DSA_NULL) { t->right = dsa_new_tree(v[i]); q[tail++] = t->right; } i++;
  }
  free(q); return root;
}
/* tree → level-order list with None for gaps, trailing Nones trimmed */
static void dsa_out_tree(struct TreeNode* root) {
  struct TreeNode** q; int head = 0, tail = 0, cap = 64, last = 0, i;
  if (!root) { dsa_lb(); dsa_le(); return; }
  q = (struct TreeNode**)malloc(sizeof *q * cap);
  q[tail++] = root;
  while (head < tail) {
    struct TreeNode* t = q[head++];
    if (t) {
      last = head;
      if (tail + 2 > cap) { cap *= 2; q = (struct TreeNode**)realloc(q, sizeof *q * cap); }
      q[tail++] = t->left; q[tail++] = t->right;
      if (tail > 200000) break; /* cycle guard */
    }
  }
  dsa_lb();
  for (i = 0; i < last; i++) { if (q[i]) dsa_out_int(q[i]->val); else dsa_out_none(); }
  dsa_le(); free(q);
}
`;

  var LIST_RT = String.raw`
static struct ListNode* dsa_build_list(const int* v, int n) {
  struct ListNode head = { 0, NULL }, *cur = &head; int i;
  for (i = 0; i < n; i++) {
    cur->next = (struct ListNode*)calloc(1, sizeof(struct ListNode));
    cur = cur->next; cur->val = v[i];
  }
  return head.next;
}
static void dsa_out_list(struct ListNode* h) {
  int guard = 0; dsa_lb();
  for (; h && guard < 100000; h = h->next, guard++) dsa_out_int(h->val);
  dsa_le();
}
`;

  // Test loop: each test runs under sigsetjmp so a crash or a per-test
  // timeout reports an error for that test and the rest keep running.
  var MAIN_RT = String.raw`
static sigjmp_buf dsa_jmp; static volatile sig_atomic_t dsa_sig;
static void dsa_on_signal(int s) { dsa_sig = s; siglongjmp(dsa_jmp, 1); }
static const char* dsa_sig_name(int s) {
  switch (s) {
    case SIGSEGV: return "Segmentation fault (invalid memory access - check NULL pointers and array bounds, or recursion that never ends)";
    case SIGBUS:  return "Bus error (invalid memory access)";
    case SIGFPE:  return "Floating point exception (integer division by zero?)";
    case SIGABRT: return "Aborted (assert failed, or heap corruption detected by free())";
    case SIGALRM: return "Time limit exceeded (took over 2s - infinite loop?)";
    case SIGILL:  return "Illegal instruction (undefined behavior the compiler trapped, e.g. division by zero)";
    case SIGTRAP: return "Trap (undefined behavior the compiler trapped)";
    default:      return "Program crashed";
  }
}
static void dsa_report_ok(int i) {
  fflush(stdout);
  printf("\n${MARK}|%d|OK|%s\n", i, dsa_ob ? dsa_ob : "");
  fflush(stdout);
}
static void dsa_report_err(int i, const char* msg) {
  fflush(stdout);
  printf("\n${MARK}|%d|ERR|%s\n", i, msg);
  fflush(stdout);
}
int main(void) {
  static char altstack[1 << 16];
  stack_t ss; struct sigaction sa; int i;
  int sigs[] = { SIGSEGV, SIGBUS, SIGFPE, SIGABRT, SIGALRM, SIGILL, SIGTRAP };
  ss.ss_sp = altstack; ss.ss_size = sizeof altstack; ss.ss_flags = 0;
  sigaltstack(&ss, NULL);
  memset(&sa, 0, sizeof sa);
  sa.sa_handler = dsa_on_signal; sa.sa_flags = SA_ONSTACK | SA_NODEFER;
  sigemptyset(&sa.sa_mask);
  for (i = 0; i < (int)(sizeof sigs / sizeof sigs[0]); i++) sigaction(sigs[i], &sa, NULL);
  setvbuf(stdout, NULL, _IOFBF, 1 << 16);
  for (i = 0; i < DSA_NTESTS; i++) {
    dsa_ol = 0; if (dsa_ob) dsa_ob[0] = 0; dsa_depth = 0;
    if (sigsetjmp(dsa_jmp, 1) == 0) {
      alarm(2);
      dsa_tests[i]();
      alarm(0);
      dsa_report_ok(i);
    } else {
      alarm(0);
      dsa_report_err(i, dsa_sig_name(dsa_sig));
    }
  }
  return 0;
}
`;

  function countLines(s) { return s.split('\n').length; }

  /**
   * Build a complete C program.
   * @returns {{source: string, userStartLine: number}}
   */
  function buildProgram(spec, userCode, tests) {
    var needTree = usesType(spec, /tree|TreeNode/);
    var needList = usesType(spec, /list|ListNode/);
    var needOps = usesType(spec, /ops/);
    var pre = [HEAD];
    if (needTree) pre.push(TREE_DEF);
    if (needList) pre.push(LIST_DEF);
    if (needOps) pre.push(OPS_DEF);
    if (spec.prelude) pre.push(spec.prelude);
    var head = pre.join('\n') + '\n';

    var body = [];
    body.push('#line 1 "harness.c"');
    body.push(RUNTIME);
    if (needTree) body.push(TREE_RT);
    if (needList) body.push(LIST_RT);

    var isDriver = !!spec.driver;
    if (isDriver) {
      body.push(spec.driver);
    } else {
      // prototype so a typo'd function name gives a clear error
      body.push(signature(spec) + ';');
    }

    var fnNames = [];
    tests.forEach(function (t, ti) {
      var args = t.args || [];
      var L = [];
      var calls = [];
      var ids = [];
      spec.params.forEach(function (p, pi) {
        var id = 'dsa_a' + pi;
        var e = emitArg(p, args[pi], id);
        L = L.concat(e.decl);
        calls.push(e.call);
        ids.push(id);
      });
      if (args.length !== spec.params.length) {
        throw new Error('c-harness: test ' + ti + ' has ' + args.length + ' args, spec has ' + spec.params.length);
      }
      if (isDriver) {
        L.push('dsa_driver(' + calls.join(', ') + ');');
      } else {
        var ret = spec.ret;
        var extra = '';
        if (/\[\]$/.test(ret) && !/\[\]\[\]$/.test(ret)) { L.push('int dsa_rs = 0;'); extra = ', &dsa_rs'; }
        if (/\[\]\[\]$/.test(ret)) { L.push('int dsa_rs = 0; int* dsa_rcs = NULL;'); extra = ', &dsa_rs, &dsa_rcs'; }
        var callArgs = calls.join(', ');
        if (extra) callArgs = callArgs ? callArgs + extra : extra.slice(2);
        var callExpr = spec.fn + '(' + callArgs + ')';
        if (ret === 'void') {
          L.push(callExpr + ';');
          if (spec.print) {
            var pi = -1;
            spec.params.forEach(function (p, i) { if (p.name === spec.print) pi = i; });
            if (pi < 0) throw new Error('c-harness: print param not found: ' + spec.print);
            var pt = spec.params[pi].type, pid = ids[pi], n = (args[pi] || []).length;
            L.push(emitPrint(pt, pid, String(n), pid + '_cols'));
          }
        } else {
          L.push(RET_C[ret] + ' dsa_r = ' + callExpr + ';');
          if (spec.normalize) {
            // "len_lex" | "lex", optionally prefixed "inner_" to sort each row too
            if (ret !== 'int[][]') throw new Error('c-harness: normalize only supports int[][] results');
            var mode = String(spec.normalize);
            var inner = /^inner_/.test(mode) ? 1 : 0;
            var byLen = /len_lex$/.test(mode) ? 1 : 0;
            L.push('dsa_norm_int_2d(dsa_r, dsa_rs, dsa_rcs, ' + inner + ', ' + byLen + ');');
          }
          L.push(emitPrint(ret, 'dsa_r', 'dsa_rs', 'dsa_rcs'));
        }
      }
      var name = 'dsa_test_' + ti;
      fnNames.push(name);
      body.push('static void ' + name + '(void) {\n  ' + L.join('\n  ') + '\n}');
    });
    body.push('#define DSA_NTESTS ' + tests.length);
    body.push('static void (*dsa_tests[' + Math.max(1, tests.length) + '])(void) = {' + (fnNames.join(', ') || '0') + '};');
    body.push(MAIN_RT);

    var userPart = '#line 1 "' + USER_FILE + '"\n' + userCode + '\n';
    var source = head + userPart + body.join('\n') + '\n';
    return { source: source, userStartLine: countLines(head) + 1 };
  }

  /** Split the program's stdout into per-test results. */
  function parseOutput(stdout, nTests) {
    var lines = String(stdout || '').split('\n');
    var results = [];
    var buf = [];
    var re = new RegExp('^' + MARK + '\\|(\\d+)\\|(OK|ERR)\\|(.*)$');
    for (var i = 0; i < lines.length; i++) {
      var m = lines[i].match(re);
      if (m) {
        // the harness prints "\n" before each marker; drop that one blank line
        if (buf.length && buf[buf.length - 1] === '') buf.pop();
        var out = buf.join('\n');
        buf = [];
        var idx = +m[1];
        if (m[2] === 'OK') results[idx] = { ok: true, result: m[3], stdout: out };
        else results[idx] = { ok: false, error: m[3], stdout: out };
      } else {
        buf.push(lines[i]);
      }
    }
    var trailing = buf.join('\n').replace(/^\n+|\n+$/g, '');
    for (var k = 0; k < nTests; k++) {
      if (!results[k]) results[k] = { ok: false, error: 'Program stopped before this test ran (crash or time limit)', stdout: k === results.length ? trailing : '' };
    }
    return results;
  }

  /** Strip ANSI colors and noise from GCC diagnostics; keep user-file errors readable. */
  function formatCompileErrors(stderr) {
    var s = String(stderr || '').replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');
    s = s.replace(/^.*?(\/app\/|<source>:)/gm, function (m) { return m.indexOf('/app/') >= 0 ? '' : '<source>:'; });
    s = s.replace(/^Compiler returned: \d+\s*$/gm, '');
    s = s.replace(/^collect2: error: ld returned 1 exit status\s*$/gm, '');
    s = s.replace(/^\/usr\/bin\/ld: [^\n]*?(\S+\.o|\/tmp\/\S+): in function `main':\s*$/gm, '');
    s = s.replace(/^.*?\/ld: /gm, 'linker: ');
    return s.replace(/\n{3,}/g, '\n\n').trim();
  }

  var api = {
    signature: signature,
    paramDecl: paramDecl,
    buildProgram: buildProgram,
    parseOutput: parseOutput,
    formatCompileErrors: formatCompileErrors,
    MARK: MARK
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.DSA = root.DSA || {}; root.DSA.cHarness = api; }
})(typeof window !== 'undefined' ? window : this);
