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

test('Python-Werkzeuge (bump-version.py, pixel-diff.py): unittest grün', () => {
  // wirft bei Exit ≠ 0 (fehlgeschlagener Test)
  execFileSync('python3', ['-B', '-m', 'unittest', 'discover', '-s', path.join(ROOT, 'tests', 'unit'), '-p', 'test_*.py'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
});
