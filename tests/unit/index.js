// Einstieg für `node --test tests/unit`: Node 24 behandelt einen Ordner wie ein Modul (index.js).
// Lädt alle *.test.mjs dieses Ordners; einzelne Dateien gehen auch direkt: node --test tests/unit/fx.test.mjs
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
(async () => {
  for (const f of fs.readdirSync(__dirname).filter((n) => n.endsWith('.test.mjs')).sort()) {
    try { await import(pathToFileURL(path.join(__dirname, f)).href); }
    catch (e) { console.error('Testdatei lässt sich nicht laden: ' + f + '\n', e); process.exitCode = 1; }
  }
})();
