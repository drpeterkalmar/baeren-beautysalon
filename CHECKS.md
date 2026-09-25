# CHECKS — Akzeptanzkriterien R18 (Renderer-Neubau)

Geschrieben VOR dem Code. Der Vision-Loop prüft gegen diese Liste, nicht gegen Geschmack.
Prüfwerkzeug: `node tools/visual-check.mjs <label> [--fps] [--land] [--only=flow|finale|stations|models]`
(Android-Viewport 412×915 @ DPR 2, Touch; `--land` = 915×412). Ergebnis: `shots/r18/<label>/` + `report.json`.

## C1 — Fehlerfreiheit (automatisch, hart)
- [ ] C1.1 `report.json.errors` ist leer: 0 `pageerror`, 0 `console.error` über den kompletten Flow
      (Menü → Wahl → alle 24 Stationen → Finale inkl. Feier-Loop) in Hoch- UND Querformat.
- [ ] C1.2 `window.__errors` (game.js onerror) ist am Ende leer.
- [ ] C1.3 Jede Station einmal per UI-Tab betreten (nicht nur per State-Setzen) und ihren Haupt-Button getippt.

## C2 — Bär: Silhouette & Material (Screenshots aller Stationen, visuell)
- [ ] C2.1 Keine Stachel-/Zacken-Silhouette: Außenkontur jedes Körperteils ist eine glatte Kurve
      (Ellipsen/Bezier-Blobs); keine Einzelstrich-Fellhaare, keine Schraffur, keine gestrichelten Konturen.
- [ ] C2.2 Volumen: jedes Körperteil hat sichtbar Licht oben-links → Schatten unten-rechts (Radial-Verlauf),
      plus Kontakt-/Überlappungsschatten (Kopf auf Körper, Arme auf Körper, Bär auf Boden).
- [ ] C2.3 Fell wirkt weich: gebackene Noise-/Flausch-Textur ist erkennbar, aber subtil (kein Rauschen, das wie Dreck wirkt).
- [ ] C2.4 Kein Stilbruch Gesicht↔Körper: Gesicht (Schnauze, Augen, Nase) nutzt dieselbe Licht-/Schattenlogik
      (Glanzpunkte, weiche Verläufe), keine flachen MS-Paint-Kreise neben plastischem Körper.
- [ ] C2.5 Bär bleibt lebendig: Atmen, Blinzeln, Blick folgt dem Finger, Reaktionen (pop/shake/happy/snip/kiss/blink/land) sichtbar.

## C3 — Offscreen-Architektur (Code-Review, hart)
- [ ] C3.1 Fell-Textur wird pro Farbe EINMAL in einen Offscreen-Canvas gebacken (Cache-Treffer im Frame-Loop, kein Neu-Backen).
- [ ] C3.2 Körperteile (Kopf, Körper, Arme, Beine, Ohren, Schnauze, Muster) sind pro Modell+Auflösung gebackene Sprites;
      pro Frame nur `drawImage` + leichte Live-Details (Augen, Mund, Effekte).
- [ ] C3.3 Keine Schleifen, die pro Frame > 50 Einzelstriche fürs Fell zeichnen.
- [ ] C3.4 100 % prozedural: keine Bilder/CDNs/Fonts von außen (einzige Datei-Referenz bleibt `audio/salon.m4a` aus music.js).

## C4 — Performance (gemessen, `--fps`)
- [ ] C4.1 Station (waschen, Bär + Partikel): Ø ≥ 58 FPS, p95 Frame-Zeit ≤ 20 ms (Headless, ungedrosselt).
- [ ] C4.2 Wahl-Raster (37 Thumbnails): Ø ≥ 58 FPS nach dem ersten Aufbau.
- [ ] C4.3 Finale (Konfetti, Wisch, Zoom): Ø ≥ 55 FPS, p95 ≤ 25 ms.
- [ ] C4.4 Mit `--throttle=4` (Mittelklasse-Simulation) bleibt die Qualitätsstufe ≥ 0 ohne Fehler und Ø ≥ 30 FPS.

## C5 — 37 Modelle (`--only=models`)
- [ ] C5.1 Alle 37 `Art.MODELS` rendern ohne Exception (Bär groß + Thumbnail) — Kontaktbogen-Screenshot.
- [ ] C5.2 Namen/Farben/Muster-Flags identisch zu den R17-Daten (`fell`, `schnauze`, `ohren`, `arme`, `kontur`, `muster`, `hell`).
- [ ] C5.3 Unterscheidbar: jedes Muster-Flag erzeugt ein eigenes sichtbares Merkmal (kein Modell ist nur ein Farbwechsel
      eines anderen mit gleichem Merkmal, außer den musterlosen Grundbären Braun/Honig/Rosé/Teddy/Eisbär — die unterscheiden sich durch Farbe).
- [ ] C5.4 Kein `undefined`/`NaN` in Farben (Art.shade/warmLight robust gegen fehlende Felder).

## C6 — Android-First UI (Code-Review + Screenshot)
- [ ] C6.1 Alle Touch-Zonen ≥ 48×48 CSS-px (automatisch geprüft über `BSSalon.buttons[].r`).
- [ ] C6.2 Layout nutzt `dvh` (index.html) + Safe-Areas; DPR-Cap 2 (`Fx.Q.dpr()` ≤ 2).
- [ ] C6.3 Audio erst nach Geste (WebAudio-Context wird im ersten `pointerdown` entsperrt).
- [ ] C6.4 Kein Back-Gesture-Abfangen (kein `popstate`/`history.pushState`, kein `beforeunload`).
- [ ] C6.5 Hoch- und Querformat: Bär vollständig sichtbar, keine Buttons über dem Bärengesicht.

## C7 — Stationen (Screenshots `--only=stations` + Flow)
- [ ] C7.1 Jede der 24 Stationen zeigt ihren Zustand sichtbar (Schaum, Föhn-Fluff, Frisur, Lack auf Krallen, Gurken,
      Make-up, Accessoires, Eis, …) — die Bär-Zustandsfelder aus salon.js werden alle gerendert.
- [ ] C7.2 Finale: Vorher-Bild ist sichtbar „zerzaust/stumpf“, Wisch enthüllt den Nachher-Bären, Titel + 3 Sterne + Polaroid + CTAs erscheinen.
