// Einstieg für `node --test tests/unit`: Node 24 behandelt einen Ordner wie ein Modul (index.js).
// Lädt alle *.test.mjs dieses Ordners; einzelne Dateien gehen auch direkt: node --test tests/unit/fx.test.mjs
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
for (const f of fs.readdirSync(__dirname).filter((n) => n.endsWith('.test.mjs')).sort()) {
  import(pathToFileURL(path.join(__dirname, f)).href);
}
