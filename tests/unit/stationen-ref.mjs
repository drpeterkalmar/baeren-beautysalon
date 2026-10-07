// stationen-ref.mjs — Referenz für Umbau-Schritt 10: alle 24 Stationen, hoch und quer, Stand vor dem Umzug.
// Aufruf (einmalig, Ergebnis ist eingecheckt):  node tests/unit/stationen-ref.mjs [--rev=a6e223c]
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './harness.mjs';
import { spieleStation } from './stationen-szenen.mjs';

const rev = (process.argv.find((a) => a.startsWith('--rev=')) || '--rev=a6e223c').slice(6);
const salon = execSync('git show ' + rev + ':salon.js', { cwd: ROOT }).toString();
const files = ['fx.js', 'art.js', 'salon.js'];         // Stand vor dem Umzug: keine Stations-Dateien
const ids = JSON.parse(execSync(`node -e "${"import('./tests/unit/harness.mjs').then(m=>{const H=m.load({files:['fx.js','art.js','salon.js']});console.log(JSON.stringify(H.S.STATIONS.map(s=>s.id)))})"}"`, { cwd: ROOT }).toString());
const out = { rev, hinweis: 'Prüfsumme je Bild: Zeichen-Protokoll + Knöpfe + Tipps + Zustand (stationen-szenen.mjs); hits = alte Hit-Box-Variablen nach dem letzten Bild', stationen: {} };
for (const st of ids) {
  out.stationen[st] = {};
  for (const port of [true, false]) {
    const r = spieleStation(st, { port, files, sources: { 'salon.js': salon } });
    out.stationen[st][port ? 'hoch' : 'quer'] = { hashes: r.hashes, hits: r.hits, raster: r.raster };
  }
}
const file = path.join(ROOT, 'tests', 'unit', 'fixtures', 'stationen-ref.json');
fs.writeFileSync(file, JSON.stringify(out) + '\n');
console.log(ids.length, 'Stationen → ', path.relative(ROOT, file), fs.statSync(file).size, 'Bytes');
