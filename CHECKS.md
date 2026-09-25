# CHECKS — Akzeptanzkriterien R18 (Renderer-Neubau)

Geschrieben VOR dem Code. Der Vision-Loop prüft gegen diese Liste, nicht gegen Geschmack.
Prüfwerkzeug: `node tools/visual-check.mjs <label> [--fps] [--land] [--throttle=4] [--swraster] [--only=flow|finale|stations|models]`
(Standard GPU-Raster wie Android-Chrome; `--swraster` = Headless-Software-Raster als Worst Case. Playwright aus `~/.cache/r18-pw`.)
(Android-Viewport 412×915 @ DPR 2, Touch; `--land` = 915×412). Ergebnis: `shots/r18/<label>/` + `report.json`.

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
      pro Frame nur `drawImage` + leichte Live-Details (Augen, Mund, Effekte).
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
