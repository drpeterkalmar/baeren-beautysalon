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
1. **Fell-Textur** (`furTile(col)`): pro Fellfarbe EINMAL ein 256² Kachel-Canvas aus weichen, geblurrten Flausch-Flecken
   (helle/dunkle Tupfer mit Radialverlauf, keine Striche). Wird als `createPattern` genutzt.
2. **Teil-Sprites** (`parts(model, k)`): pro Modell × Auflösung `k` (Gerätepixel/Welteinheit, auf 0.25 quantisiert)
   werden Kopf, Körper, Arm, Fuß, Ohr, Schnauze als eigene Canvases gebacken:
   Grundform (glatter Blob) → Fellmuster (overlay) → Modell-Muster (clip) → Form-Schatten (Radialverlauf, Licht oben-links)
   → Kanten-Okklusion (inner shadow) → Rim-/Bounce-Light → weiche Kontur (Schatten-Blur statt Linie).
   LRU-Cache (max. 6 Sätze). Frisuren/Accessoires werden ebenso pro Stil+Farbe gebacken.
3. **Frame**: nur `drawImage` der Sprites mit Pose-Transformationen (Atmen, Arme, Kopfneigung, Squash&Stretch),
   Kontakt-Schatten zwischen Teilen als gecachte Glow-Sprites, Gesicht live (Augen/Blinzeln/Blick/Mund — wenige Pfade).
4. **Thumbnails / Vorher-Bild**: kompletter Bär einmal in einen Canvas komponiert und gecacht.

Anatomie in Einheiten `s = min(W,H)/420` um `(cx,cy) = (W/2, H*0.58)` — passend zu den Hit-Zonen in salon.js
(Kopf `cy-82s`, Augen `(±30s, cy-105s)`, Krallen `(±55s±16s, cy+175s)`, Körper `cy+70s`).
