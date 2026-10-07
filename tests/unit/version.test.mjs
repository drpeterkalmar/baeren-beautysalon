// version.test.mjs — P2-9: BS_VERSION kommt aus der ?v=-Query des fx.js-Skript-Tags (eine Quelle).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './harness.mjs';

test('BS_VERSION aus document.currentScript.src (fx.js?v=20.4 → "20.4")', () => {
  assert.equal(load({ files: ['fx.js'], scriptQuery: '?v=20.4' }).ctx.BS_VERSION, '20.4');
  assert.equal(load({ files: ['fx.js'], scriptQuery: '?x=1&v=21.0-beta#a' }).ctx.BS_VERSION, '21.0-beta');
});

test('ohne Query: Rückfall auf die Konstante in fx.js (= Version in index.html)', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const v = /fx\.js\?v=([^"&]+)/.exec(html)[1];
  assert.equal(load({ files: ['fx.js'], scriptQuery: '' }).ctx.BS_VERSION, v);
  // alle Skript-Tags tragen dieselbe Version
  const all = [...html.matchAll(/\.js\?v=([^"&]+)"/g)].map((m) => m[1]);
  assert.equal(all.length, 9);
  assert.deepEqual([...new Set(all)], [v]);
});

test('bump-version.py: Python-Unit-Tests grün', () => {
  const out = execFileSync('python3', ['-m', 'unittest', '-q', 'test_bump_version'], { cwd: path.join(ROOT, 'tests', 'unit'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  assert.ok(out !== undefined);
});
