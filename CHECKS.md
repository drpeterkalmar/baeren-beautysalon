# CHECKS — Akzeptanzkriterien R18 (Renderer-Neubau)

Geschrieben VOR dem Code. Der Vision-Loop prüft gegen diese Liste, nicht gegen Geschmack.
Prüfwerkzeug: `node tools/visual-check.mjs <label> [--fps] [--land] [--throttle=4] [--swraster] [--only=flow|finale|stations|models]`
(r19: `--only=r19` = Aquarium-Verdeckung + Jonglage-Bahnen, `--novsync` = ungebremster rAF für relative FPS-Vergleiche; Ausgabe `shots/r19/<label>/`.
Standard GPU-Raster wie Android-Chrome; `--swraster` = Headless-Software-Raster als Worst Case. Playwright aus `~/.cache/r18-pw`.)
(Android-Viewport 412×915 @ DPR 2, Touch; `--land` = 915×412). Ergebnis: `shots/r18/<label>/` + `report.json`.

## C0 — Unit-Tests ohne Browser (Umbau 20.4, vor jedem Commit)
- [x] C0.1 `node --test tests/unit` grün (99 Tests, Harness `tests/unit/harness.mjs`, keine npm-Pakete, ~4 s). Enthält u. a.:
      24-Stationen-Smoke, Speichern/Laden, Album-Schnappschüsse (P1-1), „Weiter mit meinem Bären“ (P1-2), Farb-Cache (P2-4),
      Kamera nach Resize (P2-1, mit game.js), Version (P2-9), Simulation 60 vs. 120 Hz + Referenz alter Code (P2-3),
      Qualitäts-Automatik 30/60/90/120 Hz (P2-2), Canvas-Speicherbudget (P2-6), Stations-Registry + jede Station
      hoch/quer Bild für Bild gegen den Stand vor dem Umzug (P2-7/P2-8), Stations-Logik in der echten game.js-Schleife
      (`spiel.test.mjs`), Zeiger-Eingaben (Ziehen/Rubbeln, `eingabe.test.mjs`) und Accessoire-Sprites ohne `shadowBlur`
      im laufenden Bild (P2-5, `accsprites.test.mjs`).
- [x] C0.2 Python-Werkzeuge: `python3 -m unittest discover -s tests/unit -p "test_*.py"` (bump-version, pixel-diff).

## C1 — Fehlerfreiheit (automatisch, hart)
- [x] C1.1 `report.json.errors` ist leer: 0 `pageerror`, 0 `console.error` über den kompletten Flow
      (Menü → Wahl → alle 24 Stationen → Finale inkl. Feier-Loop) in Hoch- UND Querformat.
- [x] C1.2 `window.__errors` (game.js onerror) ist am Ende leer.
- [x] C1.3 Jede Station einmal per UI-Tab betreten (nicht nur per State-Setzen) und ihren Haupt-Button getippt.

## C2 — Bär: Silhouette & Material (Screenshots aller Stationen, visuell)
- [x] C2.1 Keine Stachel-/Zacken-Silhouette: Außenkontur jedes Körperteils ist eine glatte Kurve
      (Ellipsen/Bezier-Blobs); keine Einzelstrich-Fellhaare, keine Schraffur, keine gestrichelten Konturen.
- [x] C2.2 Volumen: jedes Körperteil hat sichtbar Licht oben-links → Schatten unten-rechts (Radial-Verlauf),
      plus Kontakt-/Überlappungsschatten (Kopf auf Körper, Arme auf Körper, Bär auf Boden).
- [x] C2.3 Fell wirkt weich: gebackene Noise-/Flausch-Textur ist erkennbar, aber subtil (kein Rauschen, das wie Dreck wirkt).
- [x] C2.4 Kein Stilbruch Gesicht↔Körper: Gesicht (Schnauze, Augen, Nase) nutzt dieselbe Licht-/Schattenlogik
      (Glanzpunkte, weiche Verläufe), keine flachen MS-Paint-Kreise neben plastischem Körper.
- [x] C2.5 Bär bleibt lebendig: Atmen, Blinzeln, Blick folgt dem Finger, Reaktionen (pop/shake/happy/snip/kiss/blink/land) sichtbar.

## C3 — Offscreen-Architektur (Code-Review, hart)
- [x] C3.1 Fell-Textur wird pro Farbe EINMAL in einen Offscreen-Canvas gebacken (Cache-Treffer im Frame-Loop, kein Neu-Backen).
- [x] C3.2 Körperteile (Kopf, Körper, Arme, Beine, Ohren, Schnauze, Muster) sind pro Modell+Auflösung gebackene Sprites;
      pro Frame nur `drawImage` + leichte Live-Details (Augen, Mund, Effekte). Seit 20.4 auch Hut, Schleife, Kette, Lack und
      Eis-Waffel als gebackene Sprites (vorher Live-Pfade mit Weichzeichner, Gutachten P2-5); live bleibt nur das Foto-Badge.
- [x] C3.3 Keine Schleifen, die pro Frame > 50 Einzelstriche fürs Fell zeichnen.
- [x] C3.4 100 % prozedural: keine Bilder/CDNs/Fonts von außen (einzige Datei-Referenz bleibt `audio/salon.m4a` aus music.js).

## C4 — Performance (gemessen, `--fps`)
- [x] C4.1 Station (waschen, Bär + Partikel): Ø ≥ 58 FPS, p95 Frame-Zeit ≤ 20 ms (Headless, ungedrosselt).
- [x] C4.2 Wahl-Raster (37 Thumbnails): Ø ≥ 58 FPS nach dem ersten Aufbau.
- [x] C4.3 Finale (Konfetti, Wisch, Zoom): Ø ≥ 55 FPS, p95 ≤ 25 ms.
- [~] C4.4 Mit `--throttle=4` (Mittelklasse-Simulation) bleibt die Qualitätsstufe ≥ 0 ohne Fehler und Ø ≥ 30 FPS.

## C5 — 37 Modelle (`--only=models`)
- [x] C5.1 Alle 37 `Art.MODELS` rendern ohne Exception (Bär groß + Thumbnail) — Kontaktbogen-Screenshot.
- [x] C5.2 Namen/Farben/Muster-Flags identisch zu den R17-Daten (`fell`, `schnauze`, `ohren`, `arme`, `kontur`, `muster`, `hell`).
- [x] C5.3 Unterscheidbar: jedes Muster-Flag erzeugt ein eigenes sichtbares Merkmal (kein Modell ist nur ein Farbwechsel
      eines anderen mit gleichem Merkmal, außer den musterlosen Grundbären Braun/Honig/Rosé/Teddy/Eisbär — die unterscheiden sich durch Farbe).
- [x] C5.4 Kein `undefined`/`NaN` in Farben (Art.shade/warmLight robust gegen fehlende Felder).

## C6 — Android-First UI (Code-Review + Screenshot)
- [x] C6.1 Alle Touch-Zonen ≥ 48×48 CSS-px (automatisch geprüft über `BSSalon.buttons[].r`).
- [x] C6.2 Layout nutzt `dvh` (index.html) + Safe-Areas; DPR-Cap 2 (`Fx.Q.dpr()` ≤ 2).
- [x] C6.3 Audio erst nach Geste (WebAudio-Context wird im ersten `pointerdown` entsperrt).
- [x] C6.4 Kein Back-Gesture-Abfangen (kein `popstate`/`history.pushState`, kein `beforeunload`).
- [x] C6.5 Hoch- und Querformat: Bär vollständig sichtbar, keine Buttons über dem Bärengesicht.

## C7 — Stationen (Screenshots `--only=stations` + Flow)
- [x] C7.1 Jede der 24 Stationen zeigt ihren Zustand sichtbar (Schaum, Föhn-Fluff, Frisur, Lack auf Krallen, Gurken,
      Make-up, Accessoires, Eis, …) — die Bär-Zustandsfelder aus salon.js werden alle gerendert.
- [x] C7.2 Finale: Vorher-Bild ist sichtbar „zerzaust/stumpf“, Wisch enthüllt den Nachher-Bären, Titel + 3 Sterne + Polaroid + CTAs erscheinen.

## Ergebnis R18 (gemessen)
| Lauf | wahl | waschen | finale | Fehler | Buttons <48px |
|---|---|---|---|---|---|
| Hochformat `final-port --fps` | 60.2 FPS / p95 18.6 ms | 60.0 / 18.5 | 60.2 / 18.5 | 0 | 0 |
| Querformat `final-land --fps --land` | 60.1 / 18.6 | 60.1 / 18.6 | 60.2 / 18.3 | 0 | 0 |
| `--throttle=4` (GPU-Raster) | 60.1 / 18.5, Stufe 2 | 60.1 / 18.5, Stufe 2 | 60.1 / 18.2, Stufe 2 | 0 | 0 |
| `--throttle=4 --swraster` (Worst Case) | 36.4, Stufe 0 | 32.4, Stufe 0 | **26.3**, Stufe 0 | 0 | 0 |
| `final-models --only=models` | 37/37 gerendert, 0 Ausfälle, Daten identisch zu runde17-demo:art.js | | | 0 | |

- Flow: Menü → „Los geht's“ → Kachel → alle 24 Stationen per ➜-Tap + Haupt-Button je Station → „Fertig!“ → Finale → „Nochmal“; 0 pageerror/console.error, `window.__errors` leer.
- C4.4 [~]: mit GPU-Raster erfüllt (60 FPS). Nur die Kombination 4×-Drossel + Software-Raster verfehlt im Finale die 30 FPS (26). Die Render-Arbeit
  des Bären ist dabei < 3 ms/Frame; limitiert die Füllrate der Vollbild-Pässe in game.js (Spot-Verlauf, Grading, Crossfade) — game.js ist laut Brief tabu.
- C4 Hinweis: ohne GPU fiel die Qualitätsstufe früher durch Headless-Software-Raster (nicht durch Render-Arbeit); mit GPU bleibt Stufe 2 durchgehend.
- Keine Änderungen an salon.js / game.js / index.html / music.js (`git diff 5284c92` leer). Interface-Anpassung nur in ui.js: `S.buildUI` wird umhüllt,
  um `UI.dirty` zu setzen (Layout/Kamera reagieren sofort auf Zustandswechsel).

## R19 — Aquarium sichtbar, Jonglierbälle an den Pfoten (gemessen 29.09.2026)
- [x] R19.1 Aquarium: Anteil der Fisch-/Futter-/Blasen-/Deko-Fläche, den der Bär verdeckt (Bär-Maske gegen Objekte, 10 s Füttern, Futter alle ~1,4 s,
      Deko Schiff → Schatzkiste): **vorher 93,3 % hoch / 87,7 % quer → nachher 0,0 % hoch / 0,0 % quer** (Ziel < 10 %). Außerhalb des Bildausschnitts: 0 %.
- [x] R19.2 Jonglage: Bälle starten/landen an `baer._paws` (Pfotenballen aus der echten Arm-Pose), tiefster Punkt = Pfote (y≈424),
      Scheitel y≈120 (Kopf oben 102, Kopfmitte 231). Ball-Radius 23 (war 17). 3 Bälle: 0 % Frames mit Berührung, Mindestabstand 55 (Ø 46).
- [x] R19.3 C1 `--only=stations` hoch + quer: 0 Fehler, 0 Buttons < 48 px. Flow hoch + quer: 0 Fehler
      (Hinweis „Pusten nicht gefunden“ = Skript-Timing, identisch auf dem alten Stand).
- [x] R19.4 FPS (`--only=r19 --fps --novsync`, ungebremster Durchsatz, Rauschen ±3 %): Aquarium 536/528 → 517/537 (hoch), 545 → 542 (quer);
      Zirkus 541/531 → 535/547 (hoch), 554 → 540 (quer). Keine Verschlechterung. (Mit V-Sync taktet Headless auf diesem Mac zurzeit nur ~11 Hz,
      auch bei einer leeren Seite — deshalb der ungebremste Vergleich.)

## R20 — Deko-Runde: mehr Details, ressourcenschonend (gemessen 05.10.2026)
Messung: Handy-Viewport 412×915 @ DPR 2, CPU 4× gedrosselt (CDP), je Szene 10,5 s (Menü, Waschen, Aquarium, Finale),
Stufe fest (Auto-Drossel aus) bzw. Auto. Alt = Export von 283f890, abwechselnd mit neu gemessen. Details: DEKO_BERICHT.md.
- [x] R20.1 p95 Bildzeit höchstens +10 % (Stufe 2, Software-Raster = Worst Case): **−8 … −21 %** (alle 4 Szenen schneller).
- [x] R20.2 Stufe 0 / Auto-Drossel gleich oder besser: Stufe 0 **−10 … −16 %**, Auto **−7 … −18 %** (End-Stufe 0 wie vorher).
- [x] R20.3 GPU-Raster (realistisch): p95 unverändert (V-Sync), JS-Arbeit p95 gleich (z. B. Finale 4,3 → 4,3 ms).
- [x] R20.4 Ruckler beim Stationswechsel (längstes Bild): Software Stufe 0 59 → 54 ms, Stufe 2 107 → 97 ms, GPU 27,5 → 28 ms.
- [x] R20.5 Ladegröße gzip 289 → 309 KB (+19 KB, Budget +1 MB), keine neuen Requests, keine Fremd-Assets.
- [x] R20.6 `?deko=0` = altes Aussehen (Pixel-Abweichung so klein wie zwischen zwei Läufen des alten Stands).
- [x] R20.7 C1/R19 weiter grün: Flow hoch + quer 0 Fehler, 0 Knöpfe < 48 px; Aquarium-Verdeckung 0 % hoch + quer.

## R21 — Technik „Kino-Look 2D und Fell mit Struktur“ (Kriterien vor der Abnahme; Vorbau ohne Browser, Stand 09.10.2026)
Ohne Browser erledigt (`node --test tests/unit`, 128 Tests):
- [x] R21.0 Partikel-Pool ohne Allokation (Bild für Bild gleich dem alten Pool unterhalb der Grenze), Schnappschuss ½, Raum ≤ 2,5 MP.
- [x] R21.1 Endbild-Maße je Stufe (Szene DPR 1,6/1,3, Stufe 0 ruht), Rückfall bei `?post=0`/kein WebGL2/Kontextverlust in der
      echten game.js-Schleife (nachgebautes WebGL2), Bloom nur wenn die Glow-Ebene benutzt ist.
- [x] R21.2 Farbstimmungen verschieben keine UI-Farbe aus ui.js um mehr als 6 % je Kanal (CPU-Abbild des Shaders).
- [x] R21.3 Canvas-Speicher einer Sitzung (3 Bären, Stationen, Finale): 2D-Canvas 7,65 statt 11,35 MP, mit Grafikspeicher
      10,5 statt 11,35 MP (Harness-Zählung, hochkant DPR 2).
- [x] R21.4 Relief-Kacheln kachelbar, Mittel 128, Licht von der richtigen Seite; `?fell=0` backt nichts.
Im Browser offen (Heavy-Job):
- [x] R21.5 Shader übersetzen in Chromium (Metal) und WebKit; `BSGame.post().an === true`, 0 Fehler, hoch + quer
      (`tests/technik-abnahme.mjs`, Ergebnis `tests/perf/r21/abnahme_*.json`; Tippen geht durch das Endbild hindurch).
- [x] R21.6 Kontextverlust im echten Browser (`WEBGL_lose_context`) → 2D (DPR 2), Spiel läuft weiter, Tippen geht; `?post=0` =
      Auflösung wie 20.4, kein Endbild-Canvas; Stufe 0 ruht, zurück auf Stufe 2 läuft es wieder (Chromium + WebKit).
- [ ] R21.7 p95 Hauptthread je Stufe (Software-Raster, CPU ×4, hoch + quer, Menü/Waschen voll/Aquarium/Finale) ≤ vorher · 1,05 + 0,5 ms.
- [ ] R21.8 A/B-Collagen je Station hoch/quer; Lupe auf Text/Knöpfe (Schärfe bei DPR 1,6 + CAS wie DPR 2); Glühen dezent.
- [ ] R21.9 Fell/Stoff-Struktur sichtbar, aber nicht fleckig (Collage `?fell=0` gegen an); Backzeit Stationswechsel ≤ +30 ms.
- [x] R21.10 Ladegröße ≤ vorher + 100 KB: gzip 322,7 → 337,6 KiB (+15 KB), roh +35 KB, 35 → 37 Dateien.

## U — Umbau 20.4 nach Gutachten (gemessen 07.10.2026, Details: UMBAU_BERICHT.md)
Vorher = Export von 79d3ca7, abwechselnd mit nachher gemessen (Mac während der Messung durch macOS-Update belastet).
- [x] U.1 `node --test tests/unit` 99/99 grün; P1-1 (Album-Schnappschüsse) und P1-2 („Weiter“ sofort) auch per Touch im
      Browser belegt (`tests/touch-check.mjs`: 22 Schritte gleich wie vorher, außer genau diesen beiden Fixes).
- [x] U.2 Pixel-Vergleich aller 24 Stationen hoch + quer (`tests/umbau-shots.mjs`, feste Uhr/Zufall, Bär voll gestylt):
      ≤ 0,11 % je Bild; Ausnahme Aquarium hoch 1,8 % / quer 0,7 % (andere Zufallsbahn der Fische). Collagen in `tests/shots/umbau/`.
- [x] U.3 Flow hoch + quer 0 Fehler, 0 Knöpfe < 48 px; R19 Verdeckung 0 %, Bälle Mindestabstand 55; Sprite-Sätze im Flow
      gleich oft gebacken wie vorher (23 hoch / 13 quer) trotz LRU 5.
- [x] U.4 Leistung Stufe 2 / Auto (Software-Raster, 4×): p50 je Szene gleich oder besser, p95 im Median der Paare ≤ +5 %
      (Einzelläufe ±30 % Rauschen); Auto endet wie vorher auf Stufe 0.
- [x] U.5 Voll gestylter Bär (Hut+Kette+Schleife+6 Lack), Waschen, GPU: JS-Arbeit p50 2,1 → 0,75 ms, p95 4,3 → 3,6 ms.
- [x] U.6 Ruckler nach Größenwechsel (`hitch-check --resize --novsync --swraster --tier=0`): Mittel/Spitze 232 / 1.097 ms → 48 / 51 ms.
- [x] U.7 Live-Check `--expect=20.4` hoch + quer: 0 Fehler.

