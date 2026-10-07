// spiel-ref.mjs — Referenz der Stations-Logik in der game.js-Schleife (vor dem Umzug in die Stationen).
// Aufruf (einmalig, Ergebnis eingecheckt): node tests/unit/spiel-ref.mjs   (Arbeitsstand = Commit 104268f)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './harness.mjs';
import { SPIEL, spieleSchleife } from './spiel-szenen.mjs';
const out = { rev: '104268f', hinweis: 'game.js-Schleife, Zustand je Bild (spiel-szenen.mjs)', stationen: {} };
for (const st of Object.keys(SPIEL)) { const r = spieleSchleife(st); out.stationen[st] = r.hashes; console.log(st, new Set(r.hashes).size, '/', r.hashes.length); }
fs.writeFileSync(path.join(ROOT, 'tests', 'unit', 'fixtures', 'spiel-ref.json'), JSON.stringify(out) + '\n');
