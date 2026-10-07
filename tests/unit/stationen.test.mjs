// stationen.test.mjs — Umbau Schritt 10: jede Station (hoch und quer) verhält und zeichnet sich Bild für Bild wie vor
// dem Umzug in stations/<id>.js (Referenz fixtures/stationen-ref.json, Stand a6e223c). Umgezogene Stationen liefern
// ihre Hit-Boxen aus dem Zustand (hit()) und müssen dieselben Rechtecke ergeben wie früher der Zeichenpfad.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './harness.mjs';
import { spieleStation } from './stationen-szenen.mjs';

const REF = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests', 'unit', 'fixtures', 'stationen-ref.json'), 'utf8'));
// Name der früheren Hit-Box-Variable → Schlüssel im Ergebnis von hit()
const HIT_NAME = { _albumBoxes: 'album', _pakHit: 'paket', _teigHit: 'teig', _stabHit: 'stab', _wolleHit: 'wolle', _ballHit: 'ballon',
  _stabHitZ: 'zauberstab', _mbHit: 'flaechen', _mbFrame: 'rahmen', _brause: 'brause' };
const r4 = (o) => JSON.parse(JSON.stringify(o, (k, v) => (typeof v === 'number' ? Math.round(v * 1e4) / 1e4 : v)));

for (const st of Object.keys(REF.stationen)) {
  test(`${st}: hoch und quer Bild für Bild wie vor dem Umzug`, () => {
    for (const lage of ['hoch', 'quer']) {
      const ref = REF.stationen[st][lage];
      let hitFrueh = null;
      const r = spieleStation(st, { port: lage === 'hoch', onFrame: (H, i) => { if (i === 3 && H.S.REG[st] && H.S.REG[st].hit) hitFrueh = H.S.REG[st].hit(); } });
      r.hitFrueh = hitFrueh;
      const i = r.hashes.findIndex((h, k) => h !== ref.hashes[k]);
      assert.equal(i, -1, `${lage}: erstes abweichendes Bild ${i}`);
      assert.equal(r.raster, ref.raster, `${lage}: Tipp-Raster (Hit-Geometrie) weicht ab`);
      const R = r.H.S.REG[st];
      if (R && R.hit) {                       // umgezogen: Hit-Boxen aus dem Zustand berechnet (nach Bild 3 und am Ende)
        for (const [h, refHits, wann] of [[r.hitFrueh, ref.hitsFrueh, 'Bild 3'], [R.hit(), ref.hits, 'Ende']]) {
          for (const [alt, neu] of Object.entries(HIT_NAME)) if (refHits[alt] !== undefined) assert.deepEqual(r4(h[neu]), refHits[alt], `${lage}, ${wann}: ${alt} ↔ hit().${neu}`);
        }
        for (const alt of Object.keys(HIT_NAME)) if (alt !== '_brause') assert.equal(r.H.S[alt], undefined, `${lage}: ${alt} wird noch beim Zeichnen gesetzt`);
      } else {
        assert.deepEqual(r.hits, ref.hits, `${lage}: Hit-Boxen`);
        assert.deepEqual(r.hitsFrueh, ref.hitsFrueh, `${lage}: Hit-Boxen nach Bild 3`);
      }
    }
  });
}
