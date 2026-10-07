// spiel.test.mjs — Stations-Logik pro Bild (Waschen, Föhnen, Spa, Eis, Zuckerwatte, Massage) liefert über die echte
// game.js-Schleife Bild für Bild denselben Zustand wie vor dem Umzug in die Stationen (fixtures/spiel-ref.json).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './harness.mjs';
import { spieleSchleife } from './spiel-szenen.mjs';

const REF = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests', 'unit', 'fixtures', 'spiel-ref.json'), 'utf8'));
for (const st of Object.keys(REF.stationen)) {
  test(`${st}: 300 Bilder in der game.js-Schleife wie vor dem Umzug (${REF.rev})`, () => {
    const r = spieleSchleife(st), ref = REF.stationen[st];
    const i = r.hashes.findIndex((h, k) => h !== ref[k]);
    assert.equal(i, -1, `erstes abweichendes Bild ${i}`);
    assert.deepEqual([...r.H.ctx.__errors], []);
  });
}
