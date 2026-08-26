/* pyodide-worker.js — runs user Python off the main thread so a runaway or
   infinite-loop program can be killed with worker.terminate() instead of
   freezing the browser tab. Driven by DSA.cdnLoader.runPython (cdn-loader.js).

   Messages in:
     { id, mode: 'warmup' }                        → pre-load Pyodide
     { id, mode: 'free',  code }                    → run code, capture stdout
     { id, mode: 'tests', code, fnName, tests }     → run code, call fnName per test
   Messages out (echo id):
     warmup → { id, ready: true }
     free   → { id, mode: 'free', stdout, error }
     tests  → { id, mode: 'tests', payload: { results:[...] } | { codeError } }
     any    → { id, error } on runtime/load failure

   User code is compiled with the filename "<your code>" so tracebacks report
   line numbers relative to the editor, and cdn-loader's formatPyError() can
   keep just those frames. */

importScripts('https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js');

var pyReady = null;
function getPy() {
  if (!pyReady) {
    pyReady = loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/' });
  }
  return pyReady;
}

var FREE_HARNESS = [
  'import sys, traceback',
  'from io import StringIO',
  '_out = StringIO()',
  '_old = (sys.stdout, sys.stderr)',
  'sys.stdout = sys.stderr = _out',
  '_err = None',
  'try:',
  '    exec(compile(_user_code, "<your code>", "exec"), {})',
  'except SystemExit:',
  '    pass',
  'except BaseException:',
  '    _err = traceback.format_exc()',
  'finally:',
  '    sys.stdout, sys.stderr = _old',
  '_result = [_out.getvalue(), _err]'
].join('\n');

var TESTS_HARNESS = [
  'import sys, json, traceback',
  'from io import StringIO',
  '_tests = json.loads(_tests_json)',
  '_results = []',
  '_ns = {}',
  '_code_err = None',
  'try:',
  '    exec(compile(_user_code, "<your code>", "exec"), _ns)',
  'except BaseException:',
  '    _code_err = traceback.format_exc()',
  'if _code_err is not None:',
  '    _payload = json.dumps({"codeError": _code_err})',
  'elif _fn_name not in _ns or not callable(_ns[_fn_name]):',
  '    _payload = json.dumps({"codeError": "NameError: your code must define a function named \'%s\'." % _fn_name})',
  'else:',
  '    _fn = _ns[_fn_name]',
  '    for _t in _tests:',
  '        _o = StringIO(); _old = (sys.stdout, sys.stderr); sys.stdout = sys.stderr = _o',
  '        try:',
  '            _val = _fn(*_t["args"])',
  '            _results.append({"ok": True, "result": repr(_val), "stdout": _o.getvalue()})',
  '        except BaseException:',
  '            _results.append({"ok": False, "error": traceback.format_exc(), "stdout": _o.getvalue()})',
  '        finally:',
  '            sys.stdout, sys.stderr = _old',
  '    _payload = json.dumps({"results": _results})'
].join('\n');

self.onmessage = function(e) {
  var msg = e.data || {};
  var id = msg.id;
  getPy().then(function(py) {
    if (msg.mode === 'tests') {
      py.globals.set('_user_code', msg.code || '');
      py.globals.set('_fn_name', msg.fnName || 'solution');
      py.globals.set('_tests_json', JSON.stringify(msg.tests || []));
      py.runPython(TESTS_HARNESS);
      var payload = py.globals.get('_payload');
      self.postMessage({ id: id, mode: 'tests', payload: JSON.parse(payload) });
    } else if (msg.mode === 'free') {
      py.globals.set('_user_code', msg.code || '');
      py.runPython(FREE_HARNESS);
      var proxy = py.globals.get('_result');
      var res = proxy.toJs();
      proxy.destroy(); // release the PyProxy; worker is long-lived
      self.postMessage({ id: id, mode: 'free', stdout: res[0], error: res[1] });
    } else {
      // warmup (or unknown) — Pyodide is now loaded
      self.postMessage({ id: id, ready: true });
    }
  }).catch(function(err) {
    self.postMessage({ id: id, error: String((err && err.message) || err) });
  });
};
