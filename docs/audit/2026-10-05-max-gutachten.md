# Code-Gutachten Bären-Beautysalon – 05.10.2026

Stand: Commit `e0b640f` (Version 20.3, live auf GitHub Pages). Gutachter: Claude Fable 5.1 (max), Leicht-Spur:
nur Lesen, Denken, kurze Node-Tests – **kein Browser**. Alles, was einen Browser oder ein echtes Handy braucht,
steht unter „Offene Punkte“. Es wurde nichts am Code geändert.

## Kurzurteil

1. Der Code ist für ein Hobby-Spiel ohne Build-Schritt in gutem Zustand: neun Module mit klaren Verträgen, der
   Bären-Renderer backt sauber offscreen, Leistung und Optik sind gemessen und dokumentiert (CHECKS.md, DEKO_BERICHT.md).
2. Größtes Risiko sind **zwei Datenverlust-Fehler beim Speichern**: Album-Fotos teilen sich Objekte mit dem Bären und
   verändern sich nachträglich (werden so auch korrumpiert gespeichert), und nach einem Tipp auf 🏠 fehlt in derselben
   Sitzung „Weiter mit meinem Bären“ – der gestylte Bär geht über „Los geht’s“ verloren. Beides im Node-Test belegt, beides klein zu beheben.
3. Zweitgrößtes Risiko ist die **Handy-Leistung**: Fische, Karussell, Zauber laufen an die Bildrate gekoppelt (90/120-Hz-Handys
   doppelt so schnell), die Qualitäts-Automatik stuft 30-Hz-Geräte (iPhone im Stromsparmodus) dauerhaft auf die niedrigste
   Stufe, Hut/Kette/Lack werden jedes Bild mit Weichzeichner-Schatten gemalt, und der Canvas-Speicher hat kein Budget (iPhone).
4. **Wartbarkeit:** salon.js (2.174 Zeilen) bündelt 24 Stationen in drei Riesenfunktionen, Hit-Boxen entstehen als Nebenwirkung
   des Zeichnens, es gibt drei getrennte „vorheriger Zustand“-Zähler und keinerlei Unit-Tests – jede Prüfung braucht Playwright mit GPU.
5. Empfehlung: zuerst Test-Gerüst + die zwei P1-Fixes (zusammen < 1 Tag), dann Leistung (dt-Simulation, Stufen-Logik,
   Accessoire-Sprites, Speicherbudget), zuletzt salon.js Station für Station entflechten. Befunde: **2 × P1, 11 × P2, 13 × P3.**

## Steckbrief

| Datei | Zeilen | gzip | Aufgabe |
|---|---|---|---|
| salon.js | 2.174 | 31,6 KB | Zustandsmaschine, 24 Stationen (bauen, zeichnen, tippen), Speichern, Finale-Zeitplan |
| art.js | 1.005 | 22,3 KB | 37 Modelle, Bären-Renderer (gebackene Sprites), Pose, Frisuren, Thumbnails, Vorher-Bild |
| deko.js | 783 | 17,2 KB | r20-Deko: Raum in Portionen, Wanne/Ente, Aquarium, Finale-Glitzer, Übergänge |
| ui.js | 442 | 8,2 KB | Bildschirm-Layout (Kopfzeile, Tablett, Tabs, Wahl-Raster, Finale-Overlay), Eingabe-Zonen |
| game.js | 414 | 8,3 KB | Schleife, Kamera, Raum-Cache, Qualitätsstufen, Zeiger-Eingabe, Stations-Updates |
| fx.js | 351 | 5,9 KB | Farben, Easing, Sprite-Cache, Grading, Partikel-Pool, Schalter `DEKO`/`RM` |
| room.js | 139 | 3,3 KB | alter Raum (nur noch `?deko=0`) + Staubkörner |
| sfx.js / music.js | 86 / 45 | 2,6 KB | WebAudio-Effekte, `<audio>`-Musik (iOS-sicher) |
| index.html | 30 | – | Canvas, `dvh`, Safe-Areas, Skripte mit `?v=20.3` |
| audio/salon.m4a | – | 220 KB | einzige Datei-Ressource |

Summe JS: 5.439 Zeilen, ~100 KB gzip. Tests: nur Browser-Werkzeuge (`tools/visual-check.mjs`, `tests/deko-check.mjs`,
`tests/hitch-check.mjs`, `tests/live-check.mjs`; Playwright unter `~/.cache/r18-pw`), zwei Python-Auswerter. Kein Service Worker,
kein Build, kein npm. GitHub Pages liefert alles mit `cache-control: max-age=600` (geprüft per HEAD-Request).

## Vorgehen und Belege

Alle neun Module, index.html, die Doku und die Prüfwerkzeuge wurden vollständig gelesen. Zum Belegen lief ein kleiner
Node-Harness (ohne Browser): `fx.js`, `art.js`, `salon.js` per `node:vm` in eine Sandbox mit Stubs für `window`, `localStorage`
(In-Memory), `performance`, `location`, `document.createElement('canvas')` (Proxy-Context, jede Methode leer). Ausgaben:

```
B1a album[0].lack vorher/nachher: {"L0":"#e91e63"} -> {"L0":"#e91e63","R2":"#ffffff"} | identisch? true
B1b nach Laden: S.baer.acc === album[0].acc ? true
B1c gespeichertes album[0].acc: {"hut":1,"schleife":null,"brille":null,"kette":null} (Snapshot 1 hatte hut:null)
B2a Menü-Knöpfe in derselben Sitzung: [ '▶️ Los geht’s!' ] | bs_baer gespeichert? true
B2b Menü-Knöpfe nach Neuladen: [ '🧸 Weiter mit meinem Bären', '🌟 Neuen Bären wählen' ]
B2c Lack nach erneuter Wahl: {} | localStorage lack: {}
B3 parse-Cache: vorher 0 -> nach einem Sternenschweif-Zauber (100 Bilder x 14 Sticker): 100
B4 buildUI+tapBear in 24 Stationen, Fehler: keine
B5 Klick! wirft bei bs_album="{}": S.album.push is not a function
B6 verschiedene Menü-Bären bei 12x buildUI (z.B. 12x Mute tippen): 12
```

Dazu `node --check` auf allen Modulen (fehlerfrei), Greps für feste Schrittweiten, `shadowBlur`, Versionsstrings, toten Code.

## Befunde P1 – drohender Bug / Datenverlust

### P1-1 Album-Fotos sind keine Schnappschüsse, sondern Verweise (Belege B1a–c)
- **Wo:** salon.js:481–485 (`S.album.push({… lack:S.baer.lack, acc:S.baer.acc, sticker:S.baer.sticker, makeup:S.baer.makeup …})`),
  salon.js:1221–1226 (Album-Kachel laden: dieselben Objekte zurück in den Bären).
- **Beleg:** Nach „Klick!“ lackiert das Kind eine weitere Kralle → der Album-Eintrag im Speicher ändert sich mit (B1a). Lädt es eine
  Album-Kachel und setzt einen Hut, mutiert der Album-Eintrag; das nächste „Klick!“ schreibt `bs_album` komplett neu → der alte
  Schnappschuss ist **dauerhaft** mit Hut gespeichert (B1c). Innerhalb einer Sitzung zeigt die Album-Vorschau nie den Zustand zum Fotozeitpunkt.
- **Vorschlag:** beim Ablegen und beim Laden tiefe Kopien (`JSON.parse(JSON.stringify(x))`, alles ist JSON). Dazu `Array.isArray(S.album)` nach dem Laden (siehe P3-4).
- **Aufwand:** S. **Risiko:** keines (reine Kopie, Format unverändert).

### P1-2 Nach dem Speichern fehlt „Weiter mit meinem Bären“ bis zum Neuladen – gestylter Bär geht verloren (Belege B2a–c)
- **Wo:** salon.js:84–90 (`S.save()` schreibt nur localStorage), salon.js:126 (`if(S.saved && S.saved.fell)` – `S.saved` wird nur
  beim Laden der Seite gesetzt, Z. 74), salon.js:1157–1161 (`chooseBear` → `neuerBaer` + `S.save()` überschreibt den alten Stand).
- **Beleg:** Bär wählen, lackieren, `S.save()` → Menü zeigt nur „Los geht’s“ (B2a), nach Neuladen beide Knöpfe (B2b). Der 🏠-Knopf
  liegt in jeder Station oben links. Weg eines Kindes: 🏠 → „Los geht’s“ → Wahl → derselbe Bär → alles weg, localStorage überschrieben (B2c).
- **Vorschlag:** `S.save()` aktualisiert `S.saved` (mindestens `fell`/`fellIdx`). Keine weitere Logik anfassen.
- **Aufwand:** S. **Risiko:** keines.

## Befunde P2 – Wartbarkeit, Leistung, Stabilität

### P2-1 Kamera springt nach Größen-/Stufenwechsel, Raum backt synchron
- **Wo:** game.js:19–28 `resize()` setzt `firstCam=true`, `tw=null`, `room.key=''`, aber nicht `camKey`; game.js:49–53 wertet `firstCam`
  erst beim nächsten Schlüsselwechsel aus. `resize()` wird auch von der Qualitäts-Automatik aufgerufen (game.js:382, 384) und bei
  Drehung/iOS-Leistenwechsel (`visualViewport`).
- **Folge:** der nächste Stationswechsel nach einem Resize/Stufenwechsel schnappt statt zu fahren, und weil kein Tween läuft, bäckt
  `stepRoom` (game.js:120) den Raum synchron – genau der Ruckler, den r20 mit dem portionsweisen Backen beseitigt hat.
- **Vorschlag:** in `resize()` zusätzlich `camKey=''`. **Aufwand:** S. **Risiko:** gering (ein Schnapp auf das aktuelle Ziel, unsichtbar).

### P2-2 Qualitäts-Automatik bestraft 30-Hz-Geräte dauerhaft (iPhone Stromsparmodus, Akkusparer)
- **Wo:** game.js:375–385 `tiers()`: Herabstufen hängt nur am Bildabstand (`ema>20.5`), die gemessene JS-Arbeit `perf.work` wird nur
  fürs Hochstufen benutzt; Hochstufen verlangt `ema<17.4`.
- **Folge:** Läuft `requestAnimationFrame` mit 30 Hz (iOS Safari im Stromsparmodus, Android-Akkusparer, manche WebViews), ist jeder
  Abstand 33 ms → nach ~5 s (2,5 s Warmlauf + 2 × 1,3 s) Stufe 0 (DPR 1,25, keine Deko-Bewegung, 45 % Partikel) – obwohl das Gerät nur 3 ms pro Bild arbeitet.
  Zurück geht es nie, weil 33 ms nie < 17,4 ms sind.
- **Vorschlag:** Logik als reine Funktion (`Fx.Q.step`) mit Unit-Tests; Herabstufen nur bei dauerhaft hoher JS-Arbeit oder wenn der
  Abstand deutlich über der gemessenen Grundperiode (kleinster Abstand der Warmlaufphase) liegt. **Aufwand:** S–M.
  **Risiko:** mittel (Schwellen so wählen, dass die DEKO_BERICHT-Messung „Auto → Stufe 0“ im 4×-gedrosselten Software-Raster bestehen bleibt).

### P2-3 Simulation im Zeichenpfad mit fester Schrittweite – Geschwindigkeit hängt an der Bildrate
- **Wo (salon.js):** Aquarium 2077, 2093, 2102–2107, 2118, 2126 (`*0.016`); Zauber 1803 (`fx.t+=0.016`, Spruch-Dauer 1,6 s);
  Karussell 1809 (`k.ang+=k.w*0.02`), 1862; Tanz-Noten 920–921 (`n.t++`, `n.y-=1.9`); Kuchen-Rauch 976 (`rp.t++`).
  Alles in `draw*`-Funktionen, die aus `S.draw` (Render) laufen – game.js hat dafür eigentlich `update(dt)` mit gedeckeltem `dt`.
- **Folge:** auf 90/120-Hz-Displays (viele Android-Handys, iPhone Pro) schwimmen Fische 1,5–2× so schnell, der Zauber dauert 0,8 s statt 1,6 s,
  das Karussell dreht doppelt; bei 30 Hz halb so schnell. Außerdem mutiert der Zeichenpfad Zustand (auch salon.js:607–610, 1481–1484 `S.baer.jubel`).
- **Vorschlag:** `S.update(dt)` aus game.js aufrufen, `0.016 → dt`, `t++ → t+=dt*60` usw. (bei 60 Hz identisch); Unit-Test 60 vs. 120 Schritte
  pro Sekunde → gleiche Positionen. **Aufwand:** M. **Risiko:** mittel (Referenzwerte des alten Codes vorher festhalten).

### P2-4 Farb-Cache wächst unbegrenzt (Beleg B3)
- **Wo:** fx.js:35–49 `parse()` cacht jeden Farbstring für immer. salon.js:1788, 1794, 1800 bauen pro Bild neue Strings
  (`'rgba(255,210,77,'+(1-q)+')'`), `Art.drawSticker` (art.js:903–910) parst sie.
- **Beleg:** ein Zauber = +100 Einträge (B3); jeder Zauber-Tipp wächst weiter, Sitzung über Stunden → mehrere MB. Langsam, aber sicher.
- **Vorschlag:** Cache deckeln (bei 1.000 Einträgen leeren) und im Zauber `globalAlpha` statt Alpha im String. **Aufwand:** S. **Risiko:** keines.

### P2-5 Weichzeichner-Schatten in Live-Pfaden (Hut, Schleife, Kette, Lack, Eis)
- **Wo:** art.js:191–195 `obj()` setzt `shadowBlur`; pro Bild aufgerufen aus `drawHut` 719–720, `drawSchleife` 727, `drawKette` 745,
  `drawNails` 894 (je lackierter Kralle, bis 6), `drawEis` 950/954/956, Foto-Badge 999. Widerspricht CHECKS.md C3.2 / ARCHITECTURE
  („pro Frame nur drawImage + leichte Live-Details“).
- **Folge:** jeder `shadowBlur`-Fill kostet auf Handy-Rasterern eine Zwischenebene plus Weichzeichnung; ein voll gestylter Bär
  (Hut + Kette + 6 Krallen) = ~10 Blur-Fills pro Bild, grob 3–8 ms auf Mittelklasse bei DPR 2 – genug, um die Automatik herunterzustufen.
- **Vorschlag:** wie Frisuren (art.js:561–572) pro (Art, Farbe, Auflösung) einmal backen, LRU klein. **Aufwand:** M.
  **Risiko:** gering–mittel (Optik per Pixel-Vergleich absichern).

### P2-6 Canvas-Speicher ohne Budget (iPhone-Risiko)
- **Wo:** art.js:459–467 LRU mit 10 Sprite-Sätzen, art.js:123 Auflösung bis k = 3,4; art.js:913–921 Thumbnail-Cache unbegrenzt über
  alle Größen; game.js:87 Raum bis 4 Mio. Pixel, game.js:112/132 zweiter Raum-Canvas bleibt als `spareCv`; game.js:393 Snapshot in voller Größe.
- **Rechnung (k = 3,4, Gerätepixel):** Körper 925×844 ≈ 3,1 MB, Kopf 2,3 MB, Hut-Ebene 1088×1190 ≈ 5,2 MB, Rücken-Ebene bis 5,6 MB,
  Rest 1,8 MB → **bis 18 MB je Satz**, 10 Sätze theoretisch 180 MB; Frisur bis 10,7 MB je Satz × 6; Raum 2 × 16 MB; Snapshot 6 MB;
  Thumbnails 7 MB je Rastergröße. Realistisch in einer Sitzung mit drei probierten Bären: 130–200 MB. Ältere iPhones brechen
  bei ~224 MB Canvas-Speicher (leere Canvases oder Tab-Neustart, ohne Fehlermeldung).
- **Vorschlag:** LRU 5, `spareCv` nach Ruhe freigeben, Thumbnails nur für die aktuelle Größe, Snapshot nach der Überblendung freigeben.
  **Aufwand:** S–M. **Risiko:** gering. **Offen:** Messung am echten iPhone (Web Inspector).

### P2-7 salon.js-Monolith: Stationslogik an vier Orten, Hit-Boxen als Zeichen-Nebenwirkung
- **Wo:** `S.tapBear` 218 Zeilen (salon.js:1167–1382), `S.draw` 108 Zeilen (538–635), `S.buildUI` + 24 `build*` (105–534), 20 `draw*`;
  Stations-Updates liegen zusätzlich in game.js:223–291 (Waschen, Föhnen, Spa, Eis, Zuckerwatte, Massage, Keks, Ballon, Zauber, Aquarium).
  Hit-Boxen werden beim Zeichnen gesetzt: `S._pakHit` 1489/1493 (doppelt), `_teigHit` 1539/1544, `_stabHit` 1679, `_wolleHit` 1648
  (nur einmal, nie aktualisiert), `_ballHit` 1728/1744, `_stabHitZ` 1778, `_albumBoxes` 1087, `_mbHit`/`_mbFrame` 1896, `_mbHitLocal` 1940, `_brause` 807.
- **Folge:** Tippen hängt davon ab, dass die Station schon einmal gezeichnet wurde; eine Station ändern heißt vier Stellen in zwei Dateien
  anfassen; 67 `S.buildUI()`- und 20 `S.save()`-Aufrufe sind über die Datei verstreut.
- **Vorschlag:** Stations-Registry `{id, icon, name, build, draw, update, tap, hit}` in `stations/<id>.js` (ohne Build: zusätzliche
  `<script>`-Tags), Hit-Boxen aus dem Zustand berechnen, Station für Station migrieren (je ein Commit, Screenshot-Vergleich). **Aufwand:** L. **Risiko:** mittel, durch Schrittweite beherrschbar.

### P2-8 Drei getrennte „vorheriger Zustand“-Zähler
- **Wo:** game.js:391–398 (`prevState`, Snapshot + Partikel löschen), salon.js:122–124 (`S._prev`, Schaum/Föhn aufräumen),
  deko.js:750–753 (`prevSt`, Funkel-Schwung + Hüpfer), ui.js:61 (`laidState`, Scroll zurücksetzen). Zustandswechsel sind direkte
  Zuweisungen `S.state='…'` (11 Zeilen in salon.js).
- **Folge:** Aufräumen und Effekte laufen in unterschiedlichen Bildern und Reihenfolgen; neue Übergangslogik muss an vier Stellen gepflegt werden.
- **Vorschlag:** ein `S.setState(id)` mit `onLeave/onEnter`-Haken (Teil von P2-7). **Aufwand:** S–M. **Risiko:** gering.

### P2-9 Versionsnummer an zehn Stellen
- **Wo:** index.html:20–28 (9 × `?v=20.3`), fx.js:8 (`BS_VERSION='20.3'`), dazu music.js:11 `?v=17`. Pages cacht 600 s.
- **Folge:** ein vergessenes Vorkommen = alte Datei neben neuer (schon jetzt zeigt das Menü die Version aus fx.js, nicht die aus index.html).
- **Vorschlag:** `BS_VERSION` aus `document.currentScript.src` ableiten, kleines `tools/bump-version.py`. **Aufwand:** S. **Risiko:** keines.

### P2-10 Keine Unit-Tests, alle Prüfungen brauchen Browser + GPU
- **Wo:** `tests/`, `tools/`; `tests/live-check.mjs:9` und `tests/hitch-check.mjs:8` verdrahten `~/.cache/r18-pw` fest (die anderen kennen `PW_DIR`).
- **Folge:** Speichern/Laden, Album, Stationsbau, Finale-Zeitplan, Partikel-Grenzen, Farb-Mathe sind ungetestet – genau dort sitzen P1-1/P1-2.
  Der Harness aus „Vorgehen und Belege“ zeigt, dass salon.js ohne Browser in < 1 s prüfbar ist.
- **Vorschlag:** `tests/unit/` mit `node:test` (Smoke über 24 Stationen, Roundtrip, Album-Kopien, Zustandswechsel-Aufräumen, Stufen-Logik, dt-Simulation). **Aufwand:** S–M. **Risiko:** keines.

### P2-11 A/B-Pfad `?deko=0` hält den alten Renderer in fünf Dateien am Leben
- **Wo:** room.js:48–122 (alter Raum) ↔ deko.js:523–539 (Override); salon.js:811–822 (alte Wanne), 2054–2067 (altes Becken);
  game.js:361 (Grading pro Bild), 403 (alter Raum-Pfad); art.js:661–667 (alte Hüpf-Kurve); fx.js:236–250 (`Fx.grading`).
- **Folge:** doppelte Pflege, jeder Fix muss zweimal gedacht werden; der alte Pfad wird nicht mehr gemessen.
- **Vorschlag:** nach Peters Freigabe (A/B-Vergleich beendet?) entfernen, `Fx.DEKO` als Konstante belassen bis alle Abfragen weg sind.
  **Aufwand:** M. **Risiko:** gering – aber Verhaltensänderung für die `?deko=0`-URL, deshalb nur nach Freigabe.

## Befunde P3 – Kosmetik, kleine Unschärfen

- **P3-1 Keks-Freude wird überschrieben.** game.js:277 setzt `b.jubel` beim Biss, game.js:281 überschreibt es sofort mit `b._j` (immer 0;
  `_j` wird nirgends > 0, auch salon.js:607 nur auf 0). Der Bär freut sich beim Kekse-Naschen nicht. Fix: `b.jubel=0` vor die Keks-Zeile, `_j` entfernen. S.
- **P3-2 Toter / doppelter Code.** salon.js:1146 `drawStickers` leer, 10 Aufrufe; 1607 `roundRect` ungenutzt; 1612 `S.hitButton` ungenutzt
  (ui.js hat eigenes); 346–347 doppelte `S.hinweis`-Zuweisung; 1489 + 1493 `_pakHit` doppelt; 1679 `wr*2*0`; 1660 `(wt.kau>0?1:1)`;
  70 `S.rainbow`, 200 `S._duschT`, game.js:279 `b.bow` gesetzt, nie gelesen; game.js:68 `G.virtToScreen`, 70 `UI.worldRect`, 86 `Room.ver`
  nie gesetzt; art.js:61–62 `WAFFELN`/`FOTO_RAHMEN`, salon.js:402 `KEKS_FOERMCHEN`, 1888 `MB_PARTS` ungenutzt; ui.js:392 `(L.port?0:0)`;
  music.js:21 `ended` feuert bei `loop=true` nie. S, beim Anfassen der jeweiligen Datei mitnehmen.
- **P3-3 Mute-Tipp im Menü würfelt den Menü-Bären neu** (Beleg B6): music.js:37 ruft `S.buildUI()`, salon.js:112–120 erzeugt den Menü-Bären
  dort zufällig; Pose (Blinzeln, Blick) wird mit verworfen. Fix: Menü-Bär nur erzeugen, wenn keiner da ist. S.
- **P3-4 Speicherformat ungeprüft.** salon.js:74–75: `bs_album='{}'` → „Klick!“ wirft (B5); `S.saved` kann beliebige Felder in den Bären
  kopieren (`Object.assign`, Z. 79); kein Versionsfeld in `bs_baer`/`bs_album` für spätere Migrationen. Fix: `Array.isArray`, Feld-Whitelist, `v:1`. S.
- **P3-5 Audio-Kleinigkeiten (iOS).** sfx.js:16–18 `resume()` nur bei `'suspended'` (iOS kennt `'interrupted'` nach Anruf/Hintergrund);
  sfx.js:77–80 Musik-Ducking setzt `el.volume` – auf iOS wirkungslos (nur lesbar); sfx.js:60–69 die zwei Rausch-Schleifen laufen nach dem
  ersten Start für immer, auch stumm. S.
- **P3-6 UI-Cache-Flut.** ui.js:181 leert bei > 260 Einträgen den ganzen Cache → im nächsten Bild werden alle sichtbaren Knöpfe/Karten
  mit `shadowBlur` neu gebacken (ein Ruckler); ui.js:279–283 misst den Stationstitel jedes Bild (`measureText`, `filter`, `some`) vor dem Cache-Treffer. S.
- **P3-7 Text und Emoji pro Bild.** salon.js:924 (`drawNoten`, Schriftgröße pro Note anders), 1131 (Duft-Emoji), 1866 (Karussell-Noten),
  2131 (Futter-Dose): `fillText` mit wechselnden Fonts in jedem Bild – Emoji auf Android teuer (Farbfont-Bitmaps). Noten/Etiketten als Sprites backen. S.
- **P3-8 Finale: Vollbild-Verlauf pro Bild.** game.js:345–350 erzeugt den Spot-Verlauf jedes Bild neu; die Finale-Szene ist laut Messung die
  langsamste (p95 142 ms Software-Raster). Verlauf einmal pro Größe backen, Dimmung über `globalAlpha`. S.
- **P3-9 Doku-Drift.** ARCHITECTURE.md:3 nennt die Ladereihenfolge ohne deko.js (Z. 36 korrigiert es); CHECKS.md C3.2 behauptet „nur drawImage“
  (siehe P2-5); README nennt die Prüfwerkzeuge nicht. S.
- **P3-10 Eingabe-Sperre ohne Rettung.** game.js:164–216: geht ein `pointerup` verloren (Capture fehlgeschlagen), bleiben `down`/`activeId`
  und `S.foehn` hängen und andere Finger werden ignoriert (Z. 169). Reset bei `blur`/`visibilitychange`. S.
- **P3-11 Namensdurcheinander.** room.js:123 `Art_dot`; `ell`/`ell2`/`circle2`/`roundRect`/`Fx.rr` je Datei anders; `now()` dreimal definiert,
  `performance.now()/1000` 24 × direkt. Kosmetik, beim Entflechten vereinheitlichen.
- **P3-12 Raum-Rand bei langen Kamerafahrten.** game.js:84: der gecachte Raum hat 14 % Rand; bei großen Fahrten (Aquarium hochkant, Fokus
  120…780 statt 205…695) kann mittendrin Hintergrundfarbe am Rand aufblitzen (die 0,38-s-Überblendung deckt es teils). Nur im Browser prüfbar. S.
- **P3-13 Zahlenwerk statt Daten.** salon.js:2019–2020 `aquaLayout`, art.js:69 Anatomie, game.js:35–39 `FOCUS`, salon.js:1151 `clawPos`:
  dieselbe Bären-Geometrie (`cy-82s`, `±55s`, `175s`) steht in drei Dateien als Zahlen. Eine Geometrie-Tabelle in art.js exportieren. S.

## Umbauplan – kleine, einzeln prüfbare Schritte

| Nr. | Schritt | Befund | Prüfung | Aufwand |
|---|---|---|---|---|
| 0 | Node-Test-Gerüst (`tests/unit`, Harness wie oben), README-Abschnitt „Prüfen“ | P2-10 | `node --test tests/unit` grün | S–M |
| 1 | Album: tiefe Kopien beim Ablegen und Laden, `Array.isArray` | P1-1, P3-4 | Unit (B1/B5 als Tests), `visual-check --only=stations` | S |
| 2 | `S.save()` aktualisiert `S.saved` | P1-2 | Unit (B2 als Test), Flow hoch + quer | S |
| 3 | Farb-Cache deckeln, Zauber über `globalAlpha` | P2-4 | Unit (Cache-Größe) | S |
| 4 | `resize()` setzt `camKey=''` | P2-1 | `hitch-check` mit Resize vor Wechsel | S |
| 5 | Versionsnummer aus einer Quelle + bump-Werkzeug | P2-9 | Unit (`currentScript`) | S |
| 6 | `S.update(dt)`: Aquarium, Zauber, Karussell, Noten, Rauch je ein Commit | P2-3 | Unit 60 vs. 120 Schritte, `--only=r19` | M |
| 7 | Stufen-Logik als reine Funktion mit JS-Arbeit | P2-2 | Unit-Sequenzen 30/60/120 Hz, `deko-check perf --tier=auto` | S–M |
| 8 | Hut/Schleife/Kette/Lack/Eis als gebackene Sprites | P2-5 | Pixel-Vergleich Stationen, `deko-check perf` Waschen | M |
| 9 | Speicherbudget: LRU 5, `spareCv`/Snapshot freigeben, Thumbnails je Größe | P2-6 | Unit LRU, Flow `bakes`-Zähler, iPhone-Messung (offen) | S–M |
| 10 | Stations-Registry + `setState`, dann 24 Stationen einzeln | P2-7, P2-8 | Unit-Smoke + Screenshot je Station, Flow alle 4 Stationen | L |
| 11 | `?deko=0` entfernen – **nur nach Freigabe** | P2-11 | Flow, Perf-Vergleich | M |
| 12 | Toter Code, Keks-Freude, Menü-Bär, Audio-Kleinigkeiten | P3-1…P3-5 | Unit + Flow | S |

Schritte 0–5 sind je unter einer Stunde und sofort auslieferbar; 6–9 sind unabhängig voneinander; 10 ist der große Block und sollte erst
mit grünem Test-Gerüst begonnen werden. Der fertige Auftrag für den Umbau-Job (nur P1 + P2) liegt unter
`~/.hermes/claude-jobs/briefs/baeren-beautysalon-umbau-2026-10-05.md`.

## Offene Punkte (brauchen Browser oder Gerät, in dieser Spur nicht erlaubt)

1. **iPhone-Canvas-Speicher** (P2-6): Safari Web Inspector → Zeitachsen/Speicher, Sitzung mit 3–4 Bären, Album, Finale; Ziel < 150 MB.
2. **30-Hz-Verhalten** (P2-2): iPhone im Stromsparmodus starten, nach 10 s `BSGame.tier()` abfragen – Erwartung heute: 0.
3. **90/120 Hz** (P2-3): Aquarium/Karussell auf einem 120-Hz-Android neben einem 60-Hz-Gerät vergleichen – Erwartung heute: doppelt so schnell.
4. **Raum-Rand bei Kamerafahrt** (P3-12): Serienbilder beim Wechsel Waschen → Aquarium hochkant.
5. **Weichzeichner-Kosten** (P2-5): `deko-check perf` Szene Waschen mit voll gestyltem Bären (Hut + Kette + 6 Lackkrallen) vorher/nachher.

## Was gut ist (und bleiben soll)

- Klare Modulverträge (`BSFx`, `BSArt`, `BSRoom`, `BSDeko`, `BSSalon`, `BSUI`, `BSSfx`, `BSGame`), alles prozedural, keine Fremd-Assets.
- Renderer-Architektur: Sprites pro Modell × Auflösung mit Hysterese, Frisuren-LRU, Raum in Portionen während der Kamerafahrt, Grading eingebacken.
- Android-First konsequent: Touch-Zonen ≥ 48 px automatisch geprüft, `dvh` + Safe-Areas, DPR-Cap, Audio erst nach Geste, kein Back-Gesture-Fang,
  „Bewegung reduzieren“ beachtet, A/B-Schalter für die Deko-Runde.
- Messkultur: CHECKS.md vor dem Code geschrieben, Vorher/Nachher-Tabellen mit gedrosselter CPU und Software-Raster als Worst Case, Live-Check nach jedem Push.
- Robustheit im Kleinen: `try/catch` um localStorage und Audio, `onerror`-Anzeige, `roundRect`-Fallback, Farb-Parser tolerant gegen Unsinn (Smoke B4: 24 Stationen ohne Fehler).
