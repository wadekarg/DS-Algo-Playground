#!/usr/bin/env node
/* Bridge so tools/build_c.py uses the exact same harness as the browser.
     node tools/c_harness_cli.js build < jobs.json   → [{source} | {error}]
     node tools/c_harness_cli.js parse < outs.json   → [[result...]...]
     node tools/c_harness_cli.js sig   < specs.json  → ["prototype", ...]
   jobs.json: [{spec, code, tests}], outs.json: [{stdout, n}] */
'use strict';
const path = require('path');
const h = require(path.join(__dirname, '..', 'js', 'c-harness.js'));

let input = '';
process.stdin.on('data', c => { input += c; });
process.stdin.on('end', () => {
  const mode = process.argv[2];
  const items = JSON.parse(input || '[]');
  let out;
  if (mode === 'build') {
    out = items.map(j => {
      try { return { source: h.buildProgram(j.spec, j.code, j.tests).source }; }
      catch (e) { return { error: String(e.message || e) }; }
    });
  } else if (mode === 'parse') {
    out = items.map(o => h.parseOutput(o.stdout, o.n));
  } else if (mode === 'sig') {
    out = items.map(s => { try { return h.signature(s); } catch (e) { return 'ERROR: ' + e.message; } });
  } else {
    console.error('usage: c_harness_cli.js build|parse|sig');
    process.exit(2);
  }
  process.stdout.write(JSON.stringify(out));
});
