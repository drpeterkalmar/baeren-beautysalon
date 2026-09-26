# ARCHITECTURE — R18 Renderer

Ladereihenfolge (index.html): `fx.js → art.js → room.js → salon.js → ui.js → sfx.js → music.js → game.js`.
salon.js / game.js / music.js / index.html sind unverändert; die neuen Module bedienen deren Verträge.

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
   LRU-Cache (max. 10 Sätze) mit Hysterese: ein vorhandener Satz wird bis ~20 % Hochskalierung wiederverwendet (Finale-Zoom backt nicht neu).
   Frisuren (lockig/kurz/zottig/igel/afro + „wirr“ fürs Vorher-Bild) werden pro Stil+Farbe+Auflösung gebacken; Accessoires sind wenige Live-Pfade.
3. **Frame**: nur `drawImage` der Sprites mit Pose-Transformationen (Atmen, Arme, Kopfneigung, Squash&Stretch),
   Kontakt-Schatten zwischen Teilen als gecachte Glow-Sprites, Gesicht live (Augen/Blinzeln/Blick/Mund — wenige Pfade).
4. **Thumbnails / Vorher-Bild**: kompletter Bär einmal in einen Canvas komponiert und gecacht.

Anatomie in Einheiten `s = min(W,H)/420` um `(cx,cy) = (W/2, H*0.58)` — passend zu den Hit-Zonen in salon.js
(Kopf `cy-82s`, Augen `(±30s, cy-105s)`, Krallen `(±55s±16s, cy+175s)`, Körper `cy+70s`).

## UI (ui.js)
Buttons kommen als Daten aus salon.js; ui.js ordnet sie pro Orientierung neu an und setzt `b.r` (Bildschirm-Rechteck, ≥48 px):
Kopfzeile (🏠 / Titel / ➜ / 🔊), Werkzeug-Tablett (Fließlayout, scrollbar), Stations-Leiste (horizontal scrollbar), Hinweis.
Button-/Panel-/Karten-Optik wird als Sprite gecacht (Schatten-Blur nur beim Backen). Wahl-Raster: Thumbnails lazy, max. 1 Bake pro Frame.

## Prüfung
`tools/visual-check.mjs` (siehe CHECKS.md) — Screenshots nach `shots/r18/<label>/` (gitignored).
