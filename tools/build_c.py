#!/usr/bin/env python3
"""Merge the C sources in c-src/ into the site, and verify every snippet.

The site itself has no build step; this is a maintainer tool. c-src/ is the
source of truth for all C content:

  c-src/problems/<problem-id>.c   → data/problems.json  (prob["c"], approach["code_c"])
  c-src/topics/<topic>.c          → topics/<topic>.html (C code tab, C trace, practice data-c)

Each file is split into sections by lines starting with "//@":

  problems:  //@spec {json}       harness spec (see js/c-harness.js)
             //@prelude           C before the user's code (struct defs) [optional]
             //@driver            C after it: void dsa_driver(...)        [optional]
             //@starter           starter code (auto-generated if absent)
             //@approach <name>   one per Python approach, same order
  topics:    //@code              full program for the Code Implementation tab
             //@expect-output     C output when it intentionally differs from Python [optional]
             //@output-map A=a,.. word replacements applied to Python's output first
             //@trace-wrap <sig>  wrap a statement-level trace in a function to compile-check it
             //@trace-prelude     declarations the trace needs to compile [optional]
             //@trace             C listing for the visualizer's code panel
             //@trace-python      replaces the Python listing (keep it in step with
                                  the visualizer's codeLine numbers) [optional]
             //@trace-map 1:1 3:4-5 ...  Python line -> C line(s), so the line the
                                  visualizer highlights in Python is also lit in C
             //@practice <fn>     followed by //@spec, //@starter, //@solution
                                  for the topic practice block with data-fn=<fn>

Verification (needs gcc + node):
  * every approach / practice solution passes all of its test cases through the
    same harness the browser uses (js/c-harness.js)
  * every starter compiles
  * every topic program compiles cleanly and prints exactly what the Python
    version prints
  * every trace listing compiles

Usage:  python3 tools/build_c.py            # verify + write
        python3 tools/build_c.py --check    # verify only
        python3 tools/build_c.py --only two-sum,arrays
"""
import argparse
import concurrent.futures as cf
import html
import json
import os
import re
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSRC = os.path.join(ROOT, 'c-src')
CLI = os.path.join(ROOT, 'tools', 'c_harness_cli.js')
PROBLEMS_JSON = os.path.join(ROOT, 'data', 'problems.json')
GCC = ['gcc', '-std=gnu11', '-O2']
WARN = ['-Wall', '-Wextra', '-Wno-unused-parameter', '-Wno-unused-function', '-Wno-sign-compare']

failures = []


def fail(where, msg):
    failures.append((where, msg))
    print(f'  FAIL {where}: {msg.strip()[:2000]}', file=sys.stderr)


# ---------------------------------------------------------------- parsing
def split_sections(text):
    """[(tag, arg, body)] for each //@tag arg section."""
    out = []
    cur = None
    for line in text.split('\n'):
        m = re.match(r'^//@(\w[\w-]*)\s*(.*)$', line)
        if m:
            if cur:
                out.append(cur)
            cur = [m.group(1), m.group(2).strip(), []]
        elif cur is not None:
            cur[2].append(line)
    if cur:
        out.append(cur)
    return [(t, a, '\n'.join(b).strip('\n')) for t, a, b in out]


def node(mode, items):
    r = subprocess.run(['node', CLI, mode], input=json.dumps(items), capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(r.stderr)
    return json.loads(r.stdout)


# ---------------------------------------------------------------- starters
PLACEHOLDER = {
    'void': None, 'int': 'return 0;', 'long': 'return 0;', 'uint32': 'return 0;',
    'double': 'return 0.0;', 'bool': 'return false;', 'string': 'return NULL;',
    'tree': 'return NULL;', 'list': 'return NULL;',
}
STRUCT_DOC = {
    'tree': [' * Definition for a binary tree node (provided by the test harness):',
             ' * struct TreeNode {', ' *     int val;', ' *     struct TreeNode *left;',
             ' *     struct TreeNode *right;', ' * };'],
    'list': [' * Definition for singly-linked list (provided by the test harness):',
             ' * struct ListNode {', ' *     int val;', ' *     struct ListNode *next;', ' * };'],
}


def hint_comments(py_starter, fn_py):
    """Pull '# ...' hint lines out of the Python starter's target function."""
    hints = []
    in_fn = False
    for line in py_starter.split('\n'):
        if re.match(r'^def\s+' + re.escape(fn_py) + r'\b', line):
            in_fn = True
            continue
        if in_fn:
            if line and not line[0].isspace():
                break
            s = line.strip()
            if s.startswith('#'):
                h = s.lstrip('#').strip()
                if h and not re.search(r'test runner|JSON args|Pretend the|serialize back|build a tree|we build', h, re.I):
                    hints.append(h)
    return hints


def auto_starter(spec, sig, hints):
    doc = []
    types = [p['type'] for p in spec['params']] + [spec.get('ret', '')]
    if any(t == 'tree' for t in types):
        doc += STRUCT_DOC['tree']
    if any(t in ('list', 'list[]') for t in types):
        doc += (([' *'] if doc else []) + STRUCT_DOC['list'])
    ret = spec.get('ret', 'void')
    if ret.endswith('[]'):
        if doc:
            doc.append(' *')
        doc.append(' * Return a malloc\'d array and set *returnSize'
                   + (' and *returnColumnSizes (the length of each row).' if ret.endswith('[][]') else '.'))
    body = []
    for h in hints or ['Your code here']:
        body.append('    // ' + h)
    if ret.endswith('[][]'):
        body += ['    *returnSize = 0;', '    *returnColumnSizes = NULL;', '    return NULL;']
    elif ret.endswith('[]'):
        body += ['    *returnSize = 0;', '    return NULL;']
    elif PLACEHOLDER.get(ret):
        body.append('    ' + PLACEHOLDER[ret])
    out = ('/**\n' + '\n'.join(doc) + '\n */\n') if doc else ''
    return out + sig + ' {\n' + '\n'.join(body) + '\n}\n'


# ------------------------------------------------------------ compile/run
def compile_run(source, name, workdir, run=True, warn=False, timeout=60):
    cpath = os.path.join(workdir, name + '.c')
    exe = os.path.join(workdir, name)
    with open(cpath, 'w') as f:
        f.write(source)
    cmd = GCC + (WARN if warn else ['-w']) + (['-o', exe, cpath, '-lm'] if run else ['-c', '-o', exe + '.o', cpath])
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        return {'compile_error': r.stderr}
    res = {'warnings': r.stderr}
    if run:
        try:
            p = subprocess.run([exe], capture_output=True, text=True, timeout=timeout)
            res.update(stdout=p.stdout, stderr=p.stderr, code=p.returncode)
        except subprocess.TimeoutExpired:
            res.update(timeout=True)
    return res


def user_warnings(stderr):
    """Only warnings that point into the user's file."""
    return '\n'.join(l for l in stderr.split('\n') if 'solution.c' in l and 'warning' in l)


def verify_solutions(jobs, workdir):
    """jobs: [(where, spec, code, tests, run)] → checks all; returns nothing."""
    built = node('build', [{'spec': s, 'code': c, 'tests': t} for _, s, c, t, _ in jobs])
    results = [None] * len(jobs)

    def work(i):
        where, spec, code, tests, run = jobs[i]
        b = built[i]
        if 'error' in b:
            return i, {'harness_error': b['error']}
        safe = re.sub(r'[^A-Za-z0-9_]', '_', where)
        return i, compile_run(b['source'], safe, workdir, run=run, warn=True)

    with cf.ThreadPoolExecutor(max_workers=os.cpu_count() or 4) as ex:
        for i, r in ex.map(work, range(len(jobs))):
            results[i] = r

    to_parse = [(i, r) for i, r in enumerate(results) if r.get('stdout') is not None]
    parsed = node('parse', [{'stdout': r['stdout'], 'n': len(jobs[i][3])} for i, r in to_parse])
    parsed_by = {i: p for (i, _), p in zip(to_parse, parsed)}

    for i, (where, spec, code, tests, run) in enumerate(jobs):
        r = results[i]
        if 'harness_error' in r:
            fail(where, 'harness: ' + r['harness_error']); continue
        if 'compile_error' in r:
            fail(where, 'compile:\n' + r['compile_error']); continue
        w = user_warnings(r.get('warnings', ''))
        if w and run:
            fail(where, 'warnings:\n' + w)
        if not run:
            continue
        if r.get('timeout'):
            fail(where, 'whole program timed out'); continue
        got = parsed_by.get(i)
        bad = []
        for k, t in enumerate(tests):
            g = got[k]
            if not g.get('ok') or g.get('result') != t['expected']:
                bad.append(f"test {k} ({t.get('label', '')}): args={json.dumps(t['args'])[:150]} "
                           f"expected={t['expected']!r} got={g.get('result', g.get('error'))!r}")
            elif g.get('stdout'):
                bad.append(f'test {k}: unexpected stdout {g["stdout"][:100]!r}')
        if bad:
            fail(where, '\n    '.join(bad))


# ---------------------------------------------------------------- problems
def build_problems(only, write, workdir):
    with open(PROBLEMS_JSON) as f:
        problems = json.load(f)
    by_id = {p['id']: p for p in problems}
    files = sorted(f[:-2] for f in os.listdir(os.path.join(CSRC, 'problems')) if f.endswith('.c'))
    missing = [p['id'] for p in problems if p['id'] not in files]
    jobs = []
    for pid in files:
        if only and pid not in only:
            continue
        prob = by_id.get(pid)
        if not prob:
            fail(pid, 'no such problem in problems.json'); continue
        text = open(os.path.join(CSRC, 'problems', pid + '.c')).read()
        secs = split_sections(text)
        spec = None
        extra = {}
        approaches = []
        starter = None
        for tag, arg, body in secs:
            if tag == 'spec':
                try:
                    spec = json.loads(arg + '\n' + body)
                except ValueError as e:
                    fail(pid, f'bad spec json: {e}')
            elif tag in ('prelude', 'driver'):
                extra[tag] = body
            elif tag == 'starter':
                starter = body + '\n'
            elif tag == 'approach':
                approaches.append((arg, body + '\n'))
            else:
                fail(pid, 'unknown section //@' + tag)
        if spec is None:
            fail(pid, 'missing //@spec'); continue
        spec.update(extra)
        if starter is None:
            sig = node('sig', [spec])[0]
            py_fn = prob['function_name']
            starter = auto_starter(spec, sig, hint_comments(prob.get('starter_code', ''), py_fn))
        py_apps = prob.get('approaches', [])
        if len(approaches) != len(py_apps):
            fail(pid, f'{len(approaches)} C approaches but {len(py_apps)} Python approaches')
        for k, (name, code) in enumerate(approaches):
            if k < len(py_apps) and name and name != py_apps[k]['name']:
                fail(pid, f'approach {k} name {name!r} != Python {py_apps[k]["name"]!r}')
        tests = prob['test_cases']
        for k, (name, code) in enumerate(approaches):
            jobs.append((f'{pid}#approach{k}', spec, code, tests, True))
        jobs.append((f'{pid}#starter', spec, starter, tests, False))
        cspec = dict(spec)
        cspec['starter'] = starter
        prob['c'] = cspec
        for k, (name, code) in enumerate(approaches):
            if k < len(py_apps):
                py_apps[k]['code_c'] = code
    print(f'problems: verifying {len(jobs)} programs')
    verify_solutions(jobs, workdir)
    if missing and not only:
        print(f'problems without C yet ({len(missing)}): {", ".join(missing[:20])}{" ..." if len(missing) > 20 else ""}')
    if write:
        with open(PROBLEMS_JSON, 'w') as f:
            f.write(json.dumps(problems, indent=2, ensure_ascii=True))


# ------------------------------------------------------------------ topics
def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def attr_json(obj):
    return json.dumps(obj, ensure_ascii=False).replace('&', '&amp;').replace("'", '&#39;')


HEADERS = '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <stdbool.h>\n#include <limits.h>\n'


def build_topic(name, write, workdir):
    path = os.path.join(ROOT, 'topics', name + '.html')
    if not os.path.exists(path):
        fail(name, 'no topics/' + name + '.html'); return []
    page = open(path).read()
    secs = split_sections(open(os.path.join(CSRC, 'topics', name + '.c')).read())
    code = trace = trace_prelude = trace_wrap = expect = trace_py = None
    trace_map = None
    out_map = []
    practices = []  # [fn, spec, starter, solution]
    for tag, arg, body in secs:
        if tag == 'code':
            code = body + '\n'
        elif tag == 'trace':
            trace = body
        elif tag == 'trace-prelude':
            trace_prelude = body
        elif tag == 'trace-python':
            trace_py = body
        elif tag == 'trace-map':
            trace_map = (arg + ' ' + body).split()
        elif tag == 'trace-wrap':
            trace_wrap = arg
        elif tag == 'output-map':
            out_map = [kv.split('=', 1) for kv in arg.split(',') if '=' in kv]
        elif tag == 'expect-output':
            expect = body + '\n'
        elif tag == 'practice':
            practices.append([arg, None, None, None])
        elif tag in ('spec', 'starter', 'solution') and practices:
            cur = practices[-1]
            if tag == 'spec':
                try:
                    cur[1] = json.loads(body if not arg else arg + '\n' + body)
                except ValueError as e:
                    fail(name, f'bad practice spec: {e}')
            elif tag == 'starter':
                cur[2] = body + '\n'
            else:
                cur[3] = body + '\n'
        else:
            fail(name, 'unexpected section //@' + tag)

    # 1) code block: C program must print exactly what the Python one prints
    if code is not None:
        m = re.search(r'(<div class="code-block__panel[^"]*" data-lang="python">\s*<pre class="code-block__pre">)(.*?)(</pre>\s*</div>)', page, re.S)
        if not m:
            fail(name, 'python code panel not found')
        else:
            py_src = html.unescape(m.group(2))
            with tempfile.NamedTemporaryFile('w', suffix='.py', delete=False, dir=workdir) as tf:
                tf.write(py_src)
            pr = subprocess.run([sys.executable, tf.name], capture_output=True, text=True, timeout=60)
            cr = compile_run(code, 'topic_' + name.replace('-', '_'), workdir, warn=True)
            if 'compile_error' in cr:
                fail(name + '#code', cr['compile_error'])
            else:
                if cr.get('warnings', '').strip():
                    fail(name + '#code', 'warnings:\n' + cr['warnings'])
                want = expect if expect is not None else pr.stdout
                for a, b in out_map:
                    want = re.sub(r'\b' + re.escape(a) + r'\b', b, want)
                if pr.returncode != 0:
                    fail(name + '#code', 'python version failed: ' + pr.stderr)
                elif cr.get('stdout') != want:
                    import difflib
                    diff = '\n'.join(difflib.unified_diff(want.split('\n'), (cr.get('stdout') or '').split('\n'), 'expected', 'c', lineterm='', n=1))
                    fail(name + '#code', 'output differs from Python:\n' + diff[:3000])
                if cr.get('code'):
                    fail(name + '#code', f'exit code {cr.get("code")}')
            panel = ('<!-- c-code:begin -->\n            <div class="code-block__panel" data-lang="c">\n'
                     '              <pre class="code-block__pre">' + esc(code.rstrip('\n')) + '</pre>\n'
                     '            </div>\n            <!-- c-code:end -->')
            page = re.sub(r'\s*<!-- c-code:begin -->.*?<!-- c-code:end -->', '', page, flags=re.S)
            m = re.search(r'(<div class="code-block__panel[^"]*" data-lang="python">\s*<pre class="code-block__pre">.*?</pre>\s*</div>)', page, re.S)
            page = page[:m.end()] + '\n            ' + panel + page[m.end():]

    # 2) trace listing
    if trace is not None:
        body = trace if not trace_wrap else trace_wrap + ' {\n' + trace + '\n}'
        src = HEADERS + (trace_prelude + '\n' if trace_prelude else '') + body + '\n'
        cr = compile_run(src, 'trace_' + name.replace('-', '_'), workdir, run=False, warn=True)
        if 'compile_error' in cr:
            fail(name + '#trace', cr['compile_error'])
        page = re.sub(r'\s*<!-- c-trace:begin -->.*?<!-- c-trace:end -->', '', page, flags=re.S)
        m = re.search(r'<pre class="code-trace__code"( data-lang="python")?>(.*?)</pre>', page, re.S)
        if not m:
            fail(name, 'code-trace panel not found')
        else:
            py_text = trace_py if trace_py is not None else html.unescape(m.group(2))
            py = '<pre class="code-trace__code" data-lang="python">' + esc(py_text) + '</pre>'
            map_attr = ''
            if trace_map:
                n_py, n_c = len(py_text.split('\n')), len(trace.split('\n'))
                pairs = []
                for item in trace_map:
                    mm = re.match(r'^(\d+):(\d+)(?:-(\d+))?$', item)
                    if not mm:
                        fail(name + '#trace-map', 'bad entry ' + item); continue
                    a, b, c = int(mm.group(1)), int(mm.group(2)), int(mm.group(3) or mm.group(2))
                    if not (1 <= a <= n_py) or not (1 <= b <= c <= n_c):
                        fail(name + '#trace-map', f'{item} out of range (python {n_py} lines, C {n_c} lines)')
                    pairs.append(item)
                map_attr = ' data-line-map="' + ','.join(pairs) + '"'
            c_pre = ('\n            <!-- c-trace:begin --><pre class="code-trace__code" data-lang="c"' + map_attr + ' hidden>'
                     + esc(trace) + '</pre><!-- c-trace:end -->')
            page = page[:m.start()] + py + c_pre + page[m.end():]

    # 3) practice blocks
    jobs = []
    for fn, spec, starter, solution in practices:
        bm = None
        for b in re.finditer(r"""<div class="practice-block"((?:\s+[\w-]+=(?:'[^']*'|"[^"]*"))*)\s*>""", page, re.S):
            if re.search(r'data-fn="' + re.escape(fn) + r'"', b.group(1)):
                bm = b
                break
        if not bm or spec is None or starter is None or solution is None:
            fail(f'{name}#{fn}', 'practice block / spec / starter / solution missing'); continue
        tm = re.search(r"data-tests='(.*?)'", bm.group(1), re.S)
        tests = json.loads(html.unescape(tm.group(1)))
        jobs.append((f'{name}#{fn}', spec, solution, tests, True))
        jobs.append((f'{name}#{fn}#starter', spec, starter, tests, False))
        data = dict(spec)
        data['starter'] = starter
        attrs = re.sub(r"\s*data-c='.*?'", '', bm.group(1), flags=re.S)
        attrs = attrs.rstrip() + "\n            data-c='" + attr_json(data) + "'"
        page = page[:bm.start()] + '<div class="practice-block"' + attrs + '>' + page[bm.end():]

    if write:
        with open(path, 'w') as f:
            f.write(page)
    return jobs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true', help='verify only, do not write')
    ap.add_argument('--only', default='', help='comma-separated problem ids / topic names')
    args = ap.parse_args()
    only = set(x for x in args.only.split(',') if x)
    write = not args.check
    with tempfile.TemporaryDirectory() as wd:
        tdir = os.path.join(CSRC, 'topics')
        topic_jobs = []
        for f in sorted(os.listdir(tdir)) if os.path.isdir(tdir) else []:
            if f.endswith('.c') and (not only or f[:-2] in only):
                topic_jobs += build_topic(f[:-2], write, wd)
        if topic_jobs:
            print(f'topics: verifying {len(topic_jobs)} practice programs')
            verify_solutions(topic_jobs, wd)
        if os.path.isdir(os.path.join(CSRC, 'problems')):
            build_problems(only, write, wd)
    if failures:
        print(f'\n{len(failures)} failure(s)', file=sys.stderr)
        sys.exit(1)
    print('all C checks passed' + ('' if write else ' (check only, nothing written)'))


if __name__ == '__main__':
    main()
