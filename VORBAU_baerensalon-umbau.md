# Vorbau (Leicht-Spur) für den Queue-Job `baerensalon-umbau`

Stand: 07.10.2026, Branch `vorbau/baerensalon-umbau` (von `origin/main` = 79d3ca7, main unberührt).
Gebaut **ohne Browser**: Lesen, Code, Node-/Python-Unit-Tests. Alles, was einen Browser braucht, steht je Schritt
unter „Browser-Abnahme (Heavy-Job)“. Version **nicht** gehoben (steht weiter auf 20.3).

**Kurz:** Schritte 0, 1, 2, 3, 4, 5, 6, 7, 9 sind im Code fertig und per Unit-Test belegt. Von Schritt 10 sind die
Registry, `S.setState` und **17 von 24 Stationen** umgezogen, jede hoch und quer Bild für Bild gegen den Stand vor dem
Umzug geprüft. Schritt 8 (Accessoire-Sprites) ist nicht angefangen (braucht Pixel-Vergleich im Browser), Schritt 11
nicht freigegeben. **Neue URL-Regler gibt es keine**: der Auftrag nennt keine; `?deko=0` ist unangetastet. Alles
Neue ist ab sofort aktiv (Default an).

## Prüfen

```sh
node --test tests/unit                                       # 88 Tests, ~3 s, ohne Browser
python3 -m unittest discover -s tests/unit -p "test_*.py"    # läuft auch im Node-Test mit
```

Der Harness (`tests/unit/harness.mjs`) lädt die Module per `node:vm` in der Reihenfolge aus `index.html`
(Proxy-Canvas mit echter Transformationsmatrix, steuerbare Uhr, fester Zufall, festes Datum). `H.frame()` treibt
sogar die echte game.js-Schleife (rAF). `drawLog()` protokolliert jeden Canvas-Aufruf; damit wird „zeichnet gleich“
ohne Browser belegbar. Das ersetzt keinen Pixel-Vergleich (Farbverläufe, Schatten, Text werden nicht gerastert).

Referenzen des alten Stands (eingecheckt, reproduzierbar per Skript):
- `tests/unit/fixtures/sim-ref-alt.json` aus 79d3ca7 (`node tests/unit/sim-ref.mjs`): Simulation von Aquarium,
  Zauber, Karussell, Tanz und Geburtstag Bild für Bild.
- `tests/unit/fixtures/stationen-ref.json` aus a6e223c (`node tests/unit/stationen-ref.mjs`): alle 24 Stationen hoch
  und quer, je 24 Bilder (Zeichen-Protokoll, Knöpfe, Tipps, Zustand) plus Tipp-Raster und alte Hit-Boxen.
  a6e223c = Stand nach Schritt 0–7 + Registry, aber vor dem ersten Stations-Umzug.

## Schritt für Schritt

### Schritt 0 – Node-Test-Gerüst (P2-10) — fertig
- Dateien: `tests/unit/harness.mjs`, `index.js` (Einstieg für `node --test tests/unit`: Node 24 lädt einen Ordner wie
  ein Modul), `salon.test.mjs`, `fx.test.mjs`; README-Abschnitt „Prüfen“; `PW_DIR`-Fallback in `tests/live-check.mjs`
  und `tests/hitch-check.mjs`.
- Geprüft: Smoke 24 Stationen (nur Kern-Module und kompletter Satz mit game.js), bs_baer-Roundtrip, kaputter Speicher,
  Aufräumen beim Stationswechsel, aquaLayout hoch/quer, Finale feuert jedes Ereignis genau einmal, Farb-Mathe gegen
  Unsinn, Partikel-Pool ≤ MAXP.
- Laufzeit: Auftrag nennt < 2 s; die ganze Suite braucht ~2,5–3 s (der Speicher-Ablauftest allein ~2 s, zwei volle
  Abläufe durch game.js). Wenn das stört: in `speicher.test.mjs` den Ablauf kürzen.
- Browser: nichts.

### Schritt 1 – Album-Fotos echte Schnappschüsse (P1-1) — fertig
- salon.js `kopie()`; „Klick!“ und Album-Kachel laden kopieren lack/acc/sticker/makeup tief; `bs_album` wird nach dem
  Laden mit `Array.isArray` geprüft. (Seit dem Stations-Umzug liegt beides in `stations/foto.js`.)
- Geprüft: `album.test.mjs` (B1a–c, B5 als Tests; schlagen auf dem alten Stand fehl).
- Browser: `node tools/visual-check.mjs s1 --only=stations` (0 Fehler).

### Schritt 2 – „Weiter mit meinem Bären“ in derselben Sitzung (P1-2) — fertig
- salon.js `S.save()` setzt danach `S.saved.fell/fellIdx` (auch wenn localStorage gesperrt ist).
- Geprüft: `weiter.test.mjs` (Menü-Knöpfe sofort, Weg 🏠 → Weiter mit gestyltem Bären, privater Modus).
- Browser: Flow `visual-check s2` hoch + `--land` (0 Fehler, 0 Knöpfe < 48 px).

### Schritt 3 – Farb-Cache begrenzt (P2-4) — fertig
- fx.js: Cache leert sich bei 1.000 Einträgen (`Fx.parseCacheSize()` für Tests). Zauber: `g.globalAlpha` + feste
  Farbe statt neuer `rgba(…)`-Strings pro Bild.
- Geprüft: `farbcache.test.mjs`; einmalig alt (origin/main) gegen neu über 315 Zauber-Bilder: Zeichen-Protokoll
  identisch inkl. wirksamem Alpha.
- Browser: keine eigene Prüfung nötig (Screenshots Zauber laufen in Schritt 6/10 mit).

### Schritt 4 – Kamera nach Größen-/Stufenwechsel (P2-1) — Code fertig, Messung offen
- game.js `resize()` setzt zusätzlich `camKey=''`.
- Geprüft: `kamera.test.mjs` mit echter game.js-Schleife: nach Resize-Ereignis und nach Stufenwechsel fährt die
  Kamera beim nächsten Stationswechsel (vorher Sprung, Test schlägt auf dem alten Stand fehl); Drehung war schon ok.
- `tests/hitch-check.mjs` hat den neuen Schalter `--resize` (300 ms vor jedem Wechsel ein resize-Ereignis; gemessen
  wird ab dem Wechsel).
- **Browser-Abnahme:** Vorher-Zahl auf main mit dem neuen Werkzeug, z. B.
  `git worktree add /tmp/bs-main origin/main && node tests/hitch-check.mjs --src=/tmp/bs-main --resize`, nachher
  `node tests/hitch-check.mjs --resize`; jeweils auch ohne `--resize` (und `--swraster`). Erwartung: mit `--resize`
  nachher in der Größenordnung der normalen Wechsel. Hinweis: hitch-check macht beim Start selbst ein Resize und lässt
  deshalb den ersten Wechsel weg (`slice(1)`); mit dem Fix fährt auch dieser erste Wechsel jetzt weich.

### Schritt 5 – Version an einer Stelle (P2-9) — fertig
- fx.js: `BS_VERSION` aus `document.currentScript.src` (`?v=`), Rückfall Konstante. `tools/bump-version.py X.Y
  [--check]` setzt alle `?v=` in index.html (inkl. der neuen `stations/*.js`) und den Rückfall in fx.js.
  `music.js` (`audio/salon.m4a?v=17`) bleibt eigene Datei-Version.
- Geprüft: `version.test.mjs` (currentScript-Stub, alle Skript-Tags gleich), `test_bump_version.py`.
- **Heavy-Job am Ende:** `python3 tools/bump-version.py 20.4`, danach Live-Check `--expect=20.4` hoch + quer.

### Schritt 6 – Simulation in S.update(dt) (P2-3) — fertig
- salon.js `S.update(dt)`, von game.js `update()` direkt vor `BSDeko.update` aufgerufen. Aquarium (Futter, Fische,
  Blasen, Dose), Zauber (Spruch-Uhr), Karussell (Winkel, Noten), Tanz-Noten, Kuchen-Rauch; je ein Commit.
- **Abweichung vom Auftragstext (bewusst):** statt `0.016 → dt` gilt `0.016 → 0.016·fr` mit `fr = dt·60`. Grund:
  `0.016` ist nicht 1/60; mit `dt` wären Fische/Zauber bei 60 Hz 4 % schneller als heute. So ist 60 Hz **exakt**
  wie vorher (Zeichen-Protokoll Bild für Bild gleich der Referenz 79d3ca7), 30/90/120 Hz pro Sekunde gleich schnell.
- Zeichenlisten (`aq._futterBild`, `_blasenBild`, `karo._notenBild`, `tanz._notenBild`, `kuchen._rauchBild`):
  Dinge, die im selben Schritt gefressen werden/oben ankommen, sind wie früher im letzten Bild noch zu sehen.
- Zufalls-Wahrscheinlichkeiten pro Bild × fr (Karussell-Noten, Aquarium-Blasen) → gleich viele pro Sekunde.
- Geprüft: `sim.test.mjs`: Referenz 60 Hz exakt; 60 vs. 120 Hz: Fische ±1 % der Beckenbreite nach 1 s (Euler-Schritte,
  Abweichung halbiert sich mit halber Schrittweite), Körner/Dose zeitgleich, Zauber-Dauer, Karussell-Winkel/Noten,
  Tanz-Noten (± ein 60-Hz-Bild Weg, weil neue Noten auf Bildgrenzen entstehen), Rauch-Lebensdauer; game.js ruft
  `S.update` je Bild.
- **Browser-Abnahme:** `tools/visual-check.mjs --only=r19` (Aquarium-Verdeckung 0 %, Bälle berühren sich nie),
  Screenshots Aquarium/Karussell/Zauber. Am Gerät: 120-Hz-Handy neben 60-Hz-Handy (Gutachten offener Punkt 3).

### Schritt 7 – Qualitäts-Automatik (P2-2) — Code fertig, Browser-Messung offen
- fx.js `Fx.Q.step(sample, perf)` + `Fx.Q.newPerf()`; game.js `tiers()` ruft sie nur noch auf. `G.perf` bleibt,
  `perf.warm = -1e9` der Mess-Werkzeuge friert weiter ein.
- Logik: Warmlauf 2,5 s. Gilt als **30-Hz-Display**, wenn kleinster Abstand > 22 ms, ≥ 60 % der Abstände im Band
  27–40 ms und JS-Arbeit im Mittel < 8 ms (mind. 10 Bilder) → base 33,3 ms: herabstufen nur bei Abstand > 41 ms oder
  JS-Arbeit > 25 ms; hochstufen bei < 35 ms und Arbeit < 6 ms. Sonst base 16,7 ms und **exakt die alten Schwellen**
  (20,5 / 17,4 / 6 ms). Läuft ein 30-Hz-Gerät ≥ 20 Bilder deutlich schneller (Stromsparmodus aus) → wieder base 16,7.
- Geprüft: `stufen.test.mjs` mit wörtlicher Kopie der alten Logik als Vergleich: (a) 60 Hz bleibt 2, (b) 30 Hz bleibt
  2 (alt: 0), (c) 60 Hz + 25 ms fällt, (d) 90/120 Hz bleibt 2, (e) 30 Hz + 28 ms fällt, 25 Lastfolgen bei 60/90/120 Hz
  Wechsel für Wechsel wie die alte Logik, Software-Raster-Muster (40–100 ms) fällt auf 0, game.js-Schleife 30 Hz.
- **Risiko:** ein 60-Hz-Gerät, das schon während des Warmlaufs gleichmäßig auf 33 ms festhängt (Grafik-Engpass, wenig
  JS-Arbeit), wird als 30-Hz-Display eingestuft und nur noch bei > 41 ms herabgestuft. Das ist der vom Auftrag
  gewollte Kompromiss.
- **Browser-Abnahme:** `tests/deko-check.mjs perf … --tier=auto --swraster --throttle=4` → End-Stufe 0 wie im
  DEKO_BERICHT. Falls nicht: Einstufung strenger machen (z. B. ≥ 80 % im Band 30–36,5 ms). Am Gerät: iPhone im
  Stromsparmodus, nach 10 s `BSGame.tier()` → Erwartung jetzt 2 (Gutachten offener Punkt 2).

### Schritt 8 – Accessoires/Lack als Sprites (P2-5) — nicht angefangen
- Grund: ändert die Zeichenbefehle grundsätzlich (Pfade → `drawImage`), „gleiches Bild“ ist nur per Pixel-Vergleich im
  Browser belegbar. Vorbereitet: `tests/pixel-diff.py VORHER NACHHER [--max=1.0] [--diff=DIR] [--json=…]` (Anteil
  abweichender Pixel je PNG, Unit-Test `test_pixel_diff.py`).

### Schritt 9 – Canvas-Speicherbudget (P2-6) — Code fertig, Browser offen
- art.js: Sprite-Satz-LRU 10 → 5 (`SETS_MAX`, `Art.setCount()`); Thumbnails nur für die zwei zuletzt benutzten Größen
  (Wahl-Raster + Album-Wandbild 160 px; ein reines „nur aktuelle Größe“ hätte beim Wechsel Waschen ↔ Wahl dauernd neu
  gebacken), `Art.thumbCount()`. game.js: Ersatz-Raum nach ~3 s Kamera-Ruhe freigeben, Schnappschuss nach der
  Überblendung freigeben; `BSGame.canvasMem()` liefert Canvas-Pixel (für Werkzeuge/Safari-Check).
- Geprüft: `speicher.test.mjs` (nie > 5 Sätze; Ablauf über game.js: große Sätze k ≥ 1 gleich oft wie mit LRU 10;
  Foto-Station mit 4 Album-Bären backt nicht pro Bild; Ersatz/Snapshot freigegeben, nächster Wechsel geht).
- **Befund:** im simulierten Ablauf backt LRU 5 insgesamt 33–34 statt 31 Sätze. Die zusätzlichen sind Mini-Sätze
  (k = 0,18) der Album-Vorschau in der Foto-Station (wenige KB, < 1 ms). Mit `SETS_MAX=6` wäre es gleichauf. Der
  Auftrag verlangt „bakes nicht höher als vorher“ → **im Browser-Report prüfen**; falls höher: `SETS_MAX=6` (eine Zeile)
  oder so lassen und im Bericht begründen.
- **Browser-Abnahme:** `visual-check` Flow hoch + quer 0 Fehler, `bakes`-Zähler vorher/nachher; iPhone-Speicher im
  Safari-Web-Inspector (offener Punkt für Peter).

### Schritt 10 – salon.js entflechten (P2-7/P2-8) — teilweise
**Fertig:**
- Registry `S.registerStation({id, build, back, draw, update, tap, hit, onEnter, onLeave})`, Helfer `S.H`, Dispatch in
  `S.buildUI`/`S.draw`/`drawDeko` (`back`)/`S.update`/`S.tapBear`.
- `S.setState(id)`; alle 12 direkten `S.state='…'; S.buildUI()` laufen darüber. Aufräumen (Waschen, Föhnen) als
  `onLeave`, erkannt in `buildUI` → wirkt auch bei direkter Zuweisung durch deko-check/hitch-check/live-check.
- **17 Stationen in `stations/<id>.js`**: foehnen, spa, disco, foto, tanz, schneiden, parfum, schmuecken, finish,
  makeup, pfoten, zauber, karussell, geburtstag, zirkus, eis, massage. Hit-Boxen aus `hit()`: foto (`album`, ersetzt
  `S._albumBoxes`), zauber (`zauberstab`, ersetzt `S._stabHitZ`); die übrigen treffen geometrisch aus dem Zustand.
- Geprüft je Station: `stationen.test.mjs` (hoch + quer Bild für Bild + Tipp-Raster gegen a6e223c; `hit()` gleich den
  alten Hit-Box-Werten; alte `S._…`-Variable wird nicht mehr gesetzt), `registry.test.mjs`.

**Offen (bewusst nicht gemacht):**
- 7 komplexe Stationen: waschen (`S._brause` liest game.js `showerFx`), keks (`S._teigHit` liest game.js beim
  Ausrollen), zuckerwatte (`_stabHit`, `_wolleHit`, Drag in game.js), ballon (`_ballHit`, `bl.schweb` entsteht im
  Zeichenpfad), geschenke (`_pakHit` liest `tools/visual-check.mjs` Z. 118), malbuch (`_mbHit`, `_mbFrame`,
  `_mbHitLocal`), aquarium. Die Referenz `stationen-ref.json` deckt sie schon ab; Umzug geht mit demselben Muster,
  braucht aber Anpassungen in game.js bzw. visual-check und eine Browser-Abnahme der Eingaben (Ziehen/Rubbeln).
- Stationslogik aus game.js `update()` (Waschen/Dusche, Föhnen-Flausch, Spa-Entspannung, Eis-Abschmelzen,
  Zuckerwatte, Massage, Keks, Ballon, Zauber-Pfote) ist noch nicht in die Stationen gewandert. Grund: game.js ruft sie
  heute **vor** `Art.updateBear`, `S.update` läuft danach; ein Umzug verschiebt z. B. die Spa-Entspannung um ein Bild
  und ändert die Reihenfolge der Zufallsaufrufe → nicht mehr Bild für Bild belegbar, nur per Screenshot.
  Der Pirouetten-Abbau (`S.tanz.spin`) läuft auch außerhalb der Station und bleibt deshalb in game.js.
- game.js `prevState` und deko.js `prevSt` sind nicht durch `S.setState` ersetzt (nur der salon.js-Zähler). Grund:
  beide reagieren absichtlich im **nächsten Bild** (Schnappschuss des letzten Bildes für die Überblendung,
  Bildschirm-Partikel löschen, Funkel-Schwung); als Haken im Tipp ausgelöst würden z. B. Partikel, die derselbe Tipp
  danach erzeugt, nicht mehr gelöscht. Die Werkzeuge setzen `S.state` außerdem direkt.
- `S.zirkus._pos/_r` entstehen weiter beim Zeichnen (Ballpositionen dieses Bildes, `visual-check --only=r19` misst daran).

**Browser-Abnahme (Heavy-Job):** Screenshots der 17 umgezogenen Stationen hoch + quer vorher (main) / nachher
(Branch), `python3 tests/pixel-diff.py … --max=1.0`; Flow `visual-check` hoch + quer (0 Fehler, 0 Knöpfe < 48 px);
Album-Kachel laden, Zauberstab antippen, Pfoten lackieren, Kerzen, Massage-Streicheln per Touch.

### Schritt 11 – `?deko=0` entfernen — nicht freigegeben, nicht angefasst

## Was der Heavy-Job konkret tun muss
1. Vorher-Messungen auf **main** (79d3ca7): hitch-check (mit dem neuen Werkzeug vom Branch, `--src`), deko-check perf
   Stufe 2 + Auto (Software-Raster, 4×), visual-check Flow hoch/quer (bakes), Screenshots aller 24 Stationen.
2. Branch übernehmen (`git merge --ff-only vorbau/baerensalon-umbau` auf main ist möglich, main ist unverändert), dann
   dieselben Messungen nachher; Browser-Abnahmen oben je Schritt.
3. Optional: Schritt 8 und die 7 offenen Stationen.
4. `python3 tools/bump-version.py 20.4`, Push, `node tests/live-check.mjs --expect=20.4` hoch + quer.
5. UMBAU_BERICHT.md (Endfassung), CHECKS.md/ARCHITECTURE.md sind schon um den Umbau ergänzt (bitte gegenlesen).

## Annahmen und Risiken
- `node --test tests/unit` setzt Node ≥ 22 voraus (Ordner-Einstieg über `tests/unit/index.js`; getestet mit 24.14).
- Die Zeichen-Protokolle prüfen Aufrufe und Parameter, keine Pixel. Unterschiede, die nur im Rastern entstehen
  (z. B. Reihenfolge innerhalb eines Bildes ist gleich, aber Canvas-Zustand wie `lineCap` wird nicht mitgeschrieben),
  fängt erst der Pixel-Vergleich.
- Kleiner Verhaltensunterschied durch `hit()`: Album-Kachel und Zauberstab sind jetzt auch antippbar, bevor die Station
  einmal gezeichnet wurde (früher: erst ab dem ersten Bild); der Zauberstab-Treffer nutzt die Uhr im Moment des Tipps
  statt des letzten Bildes (Versatz < 0,1 Einheiten).
- Schritt 6: Rundungsfrei gleich nur bei exakt 60 Hz; bei 59,9 Hz o. ä. minimal anders – gewollt (bildraten-unabhängig).
- Nicht im Auftrag, beim Lesen gefunden (P3-4-Rest): `bs_baer` mit einem Nicht-Objekt (`'42'`, `'"x"'`) lässt salon.js
  beim Laden werfen (strict mode, `S.saved.fell = …` auf einer Zahl). Nicht behoben (P3, Verhalten unverändert gelassen).
