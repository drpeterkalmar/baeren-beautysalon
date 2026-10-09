# ARCHITECTURE — R18 Renderer

Ladereihenfolge (index.html, Stand r21): `fx.js → post.js → relief.js → art.js → room.js → deko.js → salon.js → stations/*.js → ui.js → sfx.js → music.js → game.js`.
(R18: salon.js / game.js / music.js / index.html blieben damals unverändert; die neuen Module bedienten deren Verträge.)

| Datei | Global | Aufgabe |
|---|---|---|
| fx.js | `BSFx` | Farb-Mathe (warmLight/warmShadow), Easing, `ball`/`glow`/`contactShadow`, Sprite-Cache `Fx.S`, Grading-Layer, Qualitätsstufen `Fx.Q`, Partikel `Fx.P` (Pool, world/screen-Layer) |
| art.js | `BSArt` | Modelldaten (37), Paletten, **Bär-Renderer**, Pose/Lebendigkeit (`updateBear`, `react`, `poke`), Sticker, Eis, Foto-Rahmen, Vorher-Bild, Thumbnails |
| room.js | `BSRoom` | Salon-Raum (statisch, von game.js in Offscreen gecacht) + `ambient` (Staubkörner, Lichtflirren) |
| ui.js | `BSUI` | Screen-Space-Layout (Topbar, Werkzeug-Tray, Stations-Tabs, Hinweis), Welt-Viewport `UI.L.vp`, Wahl-Raster, Finale-Overlay |
| sfx.js | `BSSfx` | Prozedurale WebAudio-SFX, Unlock bei erster Geste, Mute-Sync |

## Bär: Offscreen-Strategie
1. **Fell-Textur** (`furTile()`): EINE neutrale 192²-Kachel (weiche helle/dunkle Tupfer, in Fellrichtung gestreckt, keine Striche),
   einmal gebacken und per `soft-light` in jedes Teil eingerechnet — wirkt auf jeder Fellfarbe, ohne sie zu verschmutzen (strenger als „pro Farbe“).
2. **Teil-Sprites** (`parts(model, k)`): pro Modell × Auflösung `k` (Gerätepixel/Welteinheit, auf 0.25 quantisiert)
   werden Kopf, Körper, Arm, Fuß, Ohr, Schnauze als eigene Canvases gebacken:
   Grundform (glatter Blob) → Fellmuster (overlay) → Modell-Muster (clip) → Form-Schatten (Radialverlauf, Licht oben-links)
   → Kanten-Okklusion (inner shadow) → Rim-/Bounce-Light → weiche Kontur (Schatten-Blur statt Linie).
   Muster (`Art.MUSTER[key]`: head/body/ear/arm/foot/snout geclippt, `top` = Hüte/Hörner, `back` = Flügel/Umhang) werden mitgebacken.
   LRU-Cache (max. 5 Sätze seit 20.4, vorher 10) mit Hysterese: ein vorhandener Satz wird bis ~20 % Hochskalierung wiederverwendet (Finale-Zoom backt nicht neu).
   Frisuren (lockig/kurz/zottig/igel/afro + „wirr“ fürs Vorher-Bild) werden pro Stil+Farbe+Auflösung gebacken. Seit 20.4 auch Hut, Schleife, Kette, Lack und
   Eis-Waffel (`accSprite`, Art + Farbe + k, LRU 16); Neigung und Pop-Animation wirken live auf das fertige Sprite.
3. **Frame**: nur `drawImage` der Sprites mit Pose-Transformationen (Atmen, Arme, Kopfneigung, Squash&Stretch),
   Kontakt-Schatten zwischen Teilen als gecachte Glow-Sprites, Gesicht live (Augen/Blinzeln/Blick/Mund — wenige Pfade).
4. **Thumbnails / Vorher-Bild**: kompletter Bär einmal in einen Canvas komponiert und gecacht.

Anatomie in Einheiten `s = min(W,H)/420` um `(cx,cy) = (W/2, H*0.58)` — passend zu den Hit-Zonen in salon.js
(Kopf `cy-82s`, Augen `(±30s, cy-105s)`, Krallen `(±55s±16s, cy+175s)`, Körper `cy+70s`).

**r19:** `Art.drawBear(g,b,{…, cx, cy, s})` darf den Bären frei platzieren (Aquarium: neben/unter dem Becken); `_geo`, Antippen und Blick folgen.
Beim Zeichnen schreibt der Bär `b._paws = [[xL,yL],[xR,yR]]` (Pfotenballen in Welt-Koordinaten, inkl. Arm-Pose/Squash) — die Jonglage wirft von dort.
Aquarium-Layout je Orientierung: `aquaLayout()` in salon.js, Kamera über `S.aquaFocus()` (game.js `S.focusRect`).

## r20: Deko-Runde (deko.js)
Ladereihenfolge: `fx.js → art.js → room.js → deko.js → salon.js → …`. `Fx.DEKO` (fx.js) ist an, außer bei `?deko=0` —
dann bleibt deko.js still und alle alten Pfade laufen unverändert (A/B). `Fx.RM` = Betriebssystem „Bewegung reduzieren“.
- **Raum** (`Room.draw` / `Room.steps`): Tapete mit Motiven, Vertäfelung, Holzdielen, Hollywood-Spiegel, Lichterkette,
  Regale, Bilder, Sessel, Pflanzen, Fensterbank mit Fischglas — alles in den Raum-Cache gebacken. Weiche Lichter liegen
  in einer winzigen Lichtkarte (0,1 px/Einheit, einmal gemalt), Schatten ohne `shadowBlur`. Stufe 0 backt schlanker.
- **Grading** (Vignette + Lichtschleier) wird in den Raum gebacken (`Fx.gradingPaint`), nicht mehr jedes Bild als Vollbild-Ebene.
- **Backen in Portionen** (game.js `stepRoom`): während der Kamerafahrt wird der neue Raum schrittweise in einen zweiten
  Canvas gebacken (je Bild ~2,5 ms + 1-px-Kopie zum Rastern) und am Ende getauscht → kein großer Ruckler.
- **Pro Bild** (`Room.ambient`, nur Stufe ≥ 1 und ohne „Bewegung reduzieren“): Vorhänge (Sprite + Scherung), Wolken im
  Fenster, Fisch im Glas, Funkeln der Lämpchen. Station: `BSDeko.tubFront/duck` (Wanne + Badeente), `aquaBack`
  (gebackenes Becken + Pflanzen/Blasen live), `finaleBack/Front` (Funkel-Bahn), `update` (Seifenblasen, Übergangs-Funkeln,
  Freu-Hüpfer beim Stationswechsel, Glitzer im Finale). Freu-Hüpfer selbst: `reactCurves('happy')` in art.js.
- Prüf-/Messwerkzeuge: `tests/deko-check.mjs` (Screenshots, Leistung), `tests/hitch-check.mjs` (Ruckler beim Wechsel),
  `tests/live-check.mjs`, `tests/ladegroesse.py`, `tests/collage.py`, `tests/perf-tabelle.py`.

## UI (ui.js)
Buttons kommen als Daten aus salon.js; ui.js ordnet sie pro Orientierung neu an und setzt `b.r` (Bildschirm-Rechteck, ≥48 px):
Kopfzeile (🏠 / Titel / ➜ / 🔊), Werkzeug-Tablett (Fließlayout, scrollbar), Stations-Leiste (horizontal scrollbar), Hinweis.
Button-/Panel-/Karten-Optik wird als Sprite gecacht (Schatten-Blur nur beim Backen). Wahl-Raster: Thumbnails lazy, max. 1 Bake pro Frame.

## Umbau 20.4 (Gutachten 2026-10-05, P1 + P2)
- **Stations-Registry** (salon.js): `S.registerStation({id, build, back, draw, frueh, update, tap, hit, onEnter, onLeave})`.
  Alle 24 Stationen liegen in `stations/<id>.js` (je ein `<script>` nach salon.js) und benutzen die Helfer `S.H`
  (`btn`, `stationTabs`, `sfx`, `react`, `emit`, `headPos`, `accPop`, `circle2`, `ell2`, `kopie`, `neuerBaer`, `clawPos`,
  `NICONS`, `baer(g)` = Bär am Standardplatz). `S.buildUI` / `S.draw` (+ `drawDeko` → `back`) / `S.updateFrueh` /
  `S.update` / `S.tapBear` rufen nur noch die Registry. salon.js (464 Zeilen) behält Zustand, Speichern, Knöpfe,
  Menü/Wahl, Finale, Duftwolken und die Registry. Hit-Boxen kommen aus `hit()` (aus dem Zustand berechnet), nicht als
  Nebenwirkung des Zeichnens: foto `album`, zauber `zauberstab`, geschenke `paket`, malbuch `flaechen`/`rahmen`,
  zuckerwatte `stab`/`wolle`, ballon `ballon`, keks `teig` (liest auch game.js beim Ausrollen), waschen `brause`
  (Duschstrahl in game.js). Diagnose-Werte fürs r19-Werkzeug entstehen weiter beim Zeichnen: `zirkus._pos/_r`,
  `aqua._futterR/_dekoBox`.
- **Zustandswechsel**: `S.setState(id)` = `S.state` + `S.buildUI()`. `buildUI` erkennt den Wechsel (`S._prev`) und ruft
  `onLeave` der alten / `onEnter` der neuen Station — greift auch, wenn Prüfwerkzeuge `S.state` direkt setzen.
  game.js `prevState` (Überblendung, Bildschirm-Partikel) und deko.js `prevSt` (Funkel-Schwung, Hüpfer) zählen weiter
  selbst, weil sie bewusst im nächsten Bild reagieren.
- **Simulation pro Bild**: `S.update(dt)` (von game.js `update()` direkt vor `BSDeko.update`, dt ≤ 0,05 s). Alte
  Schritte pro Bild × `fr = dt·60` → bei 60 Hz exakt wie vorher, bei 30/90/120 Hz gleich schnell. Zeichenlisten
  (`_futterBild`, `_blasenBild`, `_notenBild`, `_rauchBild`) halten Dinge, die im selben Schritt verschwinden, wie früher
  noch ein Bild sichtbar. Stations-Logik, die die Pose im selben Bild beeinflusst (Waschen/Dusche, Föhnen, Spa, Eis,
  Zuckerwatte, Massage), steckt in `frueh(dt)`; game.js ruft `S.updateFrueh(dt)` am Anfang von `update()` (vor
  `Art.updateBear`). In game.js bleiben nur Dinge, die auch außerhalb ihrer Station weiterlaufen (Geschenk-Schütteln,
  Keks backen/naschen, Ballon, Zauber-Pfote, Pirouetten-Abbau, Abklingen der Entspannung, Blitz, Toast).
- **Qualitäts-Automatik**: reine Funktion `Fx.Q.step(sample, perf)` (fx.js); erkennt saubere 30-Hz-Displays in der
  Warmlaufphase (base 33,3 ms), sonst exakt die alten Schwellen.
- **Speicherbudget**: Sprite-Satz-LRU 5 (`SETS_MAX`), Thumbnails für zwei Größen, Ersatz-Raum nach 3 s Ruhe und
  Snapshot nach der Überblendung freigegeben; `BSGame.canvasMem()` liefert die Canvas-Pixel.
- **Version**: `BS_VERSION` aus der `?v=`-Query von fx.js; heben mit `python3 tools/bump-version.py X.Y`.

## r21 Technik: Kino-Look 2D + Fell/Stoff mit Struktur (Vorbau, Abnahme im Browser durch den Heavy-Job)
- **Endbild** (`post.js`, `BSPost`): game.js `resize()` fragt `PO.masse(W,H,dpr,tier)`; läuft das Endbild, rendert die
  2D-Szene mit DPR 1,6 (Stufe 2) / 1,3 (Stufe 1) — `view.dpr` sinkt, damit auch Raum-Cache und Bären-Sprites —, und
  `PO.bild()` lädt das fertige Bild nach jedem `render()` als Textur, zeichnet die Glow-Ebene weich (¼) und gibt aus:
  Schein (Screen), Farbstimmung je Station (`PO.GRADE`/`PO.stimmung`), Nachschärfen (CAS), Dither. Der 2D-Canvas bleibt
  für Eingaben zuständig (opacity 0), das WebGL-Canvas liegt darüber (`pointer-events:none`). Stufe 0: Endbild ruht.
  Rückfall (`?post=0`, kein WebGL2, Fehler, Kontextverlust) → `PO.aus()` → `resize()` mit den alten Maßen.
- **Glow-Ebene** (`Fx.GL` in fx.js, halbe Szenen-Auflösung): `Fx.GL.anfang()` leert sie zu Bildbeginn (nur wenn benutzt),
  `Fx.GL.glow(g,…)` / `Fx.GL.ctx(g)` malen mit der Abbildung des Szenen-Canvas hinein. Benutzer: `Fx.P.draw` (Sorten in
  `Fx.P.GLOWT`), deko.js Lichterkette + Finale-Funkeln (`GLOW_DEKO`), Zauberstern. Ohne Endbild sind alle Aufrufe leer.
- **Relief** (`relief.js`, `BSRelief`): kachelbare Höhenfelder → Normalen → Lambert → graue Kachel (Mittel 128), per
  `soft-light` beim Backen eingerechnet: art.js `fur()` (alle Bären-Teile, Keylicht oben links), deko.js Handtuchrollen,
  Sessel, Vorhang-Sprite, Teppich (Licht aus dem Fenster, `RF.fenster(x,y)`). `?fell=0` = aus, `RF.MIN_STUFE`.
- **Partikel-Pool** ohne Allokation (Vorrat + reihum überschreiben), Überblend-Schnappschuss in halber Auflösung,
  Raum-Cache ≤ 2,5 MP. `BSGame.canvasMem()` zählt jetzt auch `sprites` (alle Sprite-Caches), `post` (Glow-Leinwand)
  und `postGpu` (WebGL-Puffer/Texturen).

## Prüfung
`node --test tests/unit` (ohne Browser, ~3 s): Harness `tests/unit/harness.mjs` lädt die Module per `node:vm`
(Proxy-Canvas mit Transformationsmatrix, steuerbare Uhr, fester Zufall). Referenzen des alten Stands:
`fixtures/sim-ref-alt.json` (Simulation, 79d3ca7) und `fixtures/stationen-ref.json` (alle 24 Stationen hoch/quer, a6e223c).
`tools/visual-check.mjs` (siehe CHECKS.md) — Screenshots nach `shots/r19/<label>/` (gitignored).
Umbau-Abnahme im Browser: `tests/umbau-shots.mjs` (Stationen mit fester Uhr) + `tests/pixel-diff.py`, `tests/touch-check.mjs`
+ `tests/touch-diff.py` (Tippen/Ziehen vorher/nachher), `tests/hitch-check.mjs --resize --novsync`, `tests/deko-check.mjs --voll`.
