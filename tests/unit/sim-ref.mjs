// sim-ref.mjs — hält die Referenzwerte des ALTEN Codes fest (Simulation noch im Zeichenpfad, Stand 79d3ca7).
// Aufruf (einmalig, Ergebnis ist eingecheckt):  node tests/unit/sim-ref.mjs [--rev=79d3ca7]
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './harness.mjs';
import { SZENEN, spiele } from './sim-szenen.mjs';

const rev = (process.argv.find((a) => a.startsWith('--rev=')) || '--rev=79d3ca7').slice(6);
const salon = execSync('git show ' + rev + ':salon.js', { cwd: ROOT }).toString();
const out = { rev, hinweis: '60 Hz, alter Code: nur S.draw je Bild. Prüfsumme = sha1 des Zeichen-Protokolls (gerundet 1e-4).', szenen: {} };
for (const name of Object.keys(SZENEN)) {
  // alter Stand: nur fx/art/salon (Stations-Dateien gab es noch nicht)
  const r = spiele(name, { mode: 'alt', files: ['fx.js', 'art.js', 'salon.js'], sources: { 'salon.js': salon } });
  out.szenen[name] = { hashes: r.hashes, snaps: r.snaps };
  console.log(name, r.hashes.length, 'Bilder,', r.snaps.length, 'Stichproben');
}
const file = path.join(ROOT, 'tests', 'unit', 'fixtures', 'sim-ref-alt.json');
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, JSON.stringify(out) + '\n');
console.log('geschrieben:', path.relative(ROOT, file), fs.statSync(file).size, 'Bytes');
