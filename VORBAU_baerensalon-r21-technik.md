# Übergabe Vorbau (Leicht-Spur) → Heavy-Job `baerensalon-r21-technik`

Stand 09.10.2026, Branch `vorbau/baerensalon-r21-technik` (gepusht), Basis `origin/main` = `2a503d4` (20.4).
Ohne Browser, Server oder Bundler gebaut. Alles Neue hängt an URL-Reglern; Prüfung bisher nur mit Unit-Tests:
`node --test tests/unit` **129/129 grün** (vorher 99), `python3 -m unittest discover -s tests/unit -p "test_*.py"` **10/10**.
Main ist unberührt.

## Reihenfolge für den Heavy-Job
1. **Vorher-Messung mit dem NEUEN Messwerkzeug gegen den ALTEN Spielstand.** Die Werkzeug-Erweiterungen liegen auf dem
   Branch. Deshalb nicht auf main messen, sondern so:
   ```sh
   git fetch && git switch -c r21 origin/main && git merge --no-ff origin/vorbau/baerensalon-r21-technik   # Werkzeug + Code
   mkdir -p ../bs_vorher && git archive 2a503d4 | tar -x -C ../bs_vorher                          # Spielstand 20.4
   for f in hoch quer; do for t in 2 1 0; do L=$([ $f = quer ] && echo --land); \
     node tests/deko-check.mjs perf r21-vorher-$f-t$t-r1 --src=../bs_vorher --swraster --tier=$t --voll $L; done; done
   ```
   „nachher“ genauso ohne `--src` (Prefix `r21-nachher`), dann `python3 tests/perf-tabelle.py r21` (Gate-Tabelle, Exit-Code 1
   bei Riss). Vorher und nachher möglichst abwechselnd und mit Wiederholungen (`-r2`) messen; der Umbau-Bericht hat ±30 %
   Rauschen zwischen Läufen gesehen. Profil: `--swraster` (CPU ×4 ist Standard) = Füllrate wie Koboldkeller; zusätzlich
   einmal ohne `--swraster` (GPU) für die echte Bildrate.
2. Merge-Konflikte sind nicht zu erwarten: Der Vorbau hat nur auf `2a503d4` aufgesetzt.
3. Etappen im Browser abnehmen (Liste unten), dann Version heben (`python3 tools/bump-version.py 21.0`; die neuen
   `post.js`/`relief.js` stehen noch mit `?v=20.4` in index.html), pushen, live prüfen, `TECHNIK_BERICHT.md`.

## Commits auf dem Branch
| Commit | Inhalt |
|---|---|
| `0173fd8` | E0: Partikel-Pool ohne Allokation, Schnappschuss ½, Raum-Cache ≤ 2,5 MP (Audit #2/#5 nachgeholt) |
| `806ae9e` | E0: Messwerkzeug (Hauptthread bis nach dem Malen, `--post/--fell`, Speicher inkl. Sprites, `perf-tabelle.py r21`, `--mute-audio` überall) |
| `f253053` | E1: Kino-Look `post.js` + Glow-Ebene `Fx.GL` + Anbindung game.js |
| `fd2aa07` | E2: Fell/Stoff-Struktur `relief.js` + Einbindung art.js/deko.js |
| `1c29df6` | Doku README/ARCHITECTURE/CHECKS (R21-Kriterien, offene Haken für den Browser) |
| `9fde449` | Rauchtest alle Stationen hoch/quer mit Endbild + Struktur |

---

## E0 – Prüfung „Umbau wirklich drin?“ + Nachholen
**Ergebnis der Durchsicht** (Grafik-Audit „6. Bären-Beautysalon“, Maßnahmen #1–#5):
- #1 Accessoires als Sprites: drin (`art.js` `accSprite`, Test `accsprites.test.mjs`).
- #3 Simulation mit dt: drin (`S.update(dt)`/`S.updateFrueh(dt)`, `sim.test.mjs`).
- #4 Stufen-Logik nach Arbeitszeit/30 Hz: drin (`Fx.Q.step`, `stufen.test.mjs`).
- **#2 Partikel-Pool ohne Allokation: fehlte** (`splice(0,1)` + neues Objekt je Partikel). **Nachgeholt** in `fx.js`:
  verglühte Partikel gehen in einen Vorrat, bei vollem Pool wird reihum überschrieben; `clear()` arbeitet in place.
  Zufallsfolge und Felder unverändert.
- **#5 Speicher, Rest: fehlte teilweise.** LRU 5 und Freigaben waren drin. Nachgeholt: Überblend-Schnappschuss in halber
  Auflösung (`game.js`), Raum-Cache höchstens 2,5 MP (vorher 4 MP auf Stufe 2; greift nur auf Tablets, Handy hochkant
  DPR 2 ≈ 2,47 MP).

**Geprüft:** `fx.test.mjs` (Pool Bild für Bild gleich dem alten Pool unterhalb der Grenze, keine neuen Objekte im
Dauerbetrieb, Stufenwechsel bei vollem Pool), `speicher.test.mjs` (Schnappschuss ≤ ¼, Raum ≤ 2,5 MP auf 412×915,
915×412, 1024×1366).

**Messwerkzeug** (nicht ausgeführt):
- `tests/deko-check.mjs perf`: neue Größe `haupt*`, also die Hauptthread-Zeit vom rAF bis nach dem Malen (MessageChannel,
  wie Koboldkeller `perf_gate`; im Software-Raster malt Chrome erst nach dem JS). Neu sind außerdem `--post=`, `--fell=`,
  `mem` (= `BSGame.canvasMem()`) und `post` (Endbild-Zustand) je Szene. Szenen wie gefordert: Menü, Waschen (`--voll` =
  Hut + Kette + Schleife + 6 Lackkrallen), Aquarium, Finale/Konfetti.
- `tests/perf-tabelle.py r21`: p95 vorher → nachher je Stufe × Format, längstes Bild, Speicher in MP, Gate
  `≤ vorher·1,05 + 0,5 ms` (Python-Test `test_perf_tabelle.py`).
- `BSGame.canvasMem()` hat neu `sprites` (alle Sprite-Caches; vorher wurden nur Sätze gezählt), `post` (Glow-Leinwand,
  2D) und `postGpu` (WebGL-Puffer und Texturen).
- `tests/hitch-check.mjs`: gibt die Backzeit der Relief-Kacheln und den Endbild-Zustand mit aus. Vergleich mit
  `--query=fell=0` bzw. `--query=post=0`.
- `--mute-audio` in **allen** Browser-Skripten nachgetragen (deko/hitch/live/touch/umbau-shots/visual-check).

**Im Browser abnehmen:** Pool: Finale/Konfetti p95 und längstes Bild nachher ≤ vorher, Flow ohne Fehler. Schnappschuss:
Stationswechsel ansehen; die Überblendung darf nicht sichtbar unschärfer sein (0,38 s, wird ohnehin vergrößert).

---

## E1 – Kino-Look 2D (`post.js`, Audit #6) — Standard AN, `?post=0` = aus
**Fertig:**
- `post.js` (`window.BSPost`, klassisches Skript nach `fx.js`), Vorlage Koboldkeller. WebGL2-Canvas über dem 2D-Canvas.
  Der 2D-Canvas bekommt weiter alle Berührungen (`opacity:0`), das Endbild hat `pointer-events:none`.
- **Auflösung je Stufe** (`PO.STUFEN`, absolute DPR): Stufe 2 Szene **1,6** → Endbild 2; Stufe 1 Szene **1,3** → Endbild 1,6;
  Stufe 0 **ruht** (exakt der Weg vor r21, DPR 1,25). Die Szene hat damit 64 % der Pixel. Weil Raum-Cache und Bären-Sprites
  an `view.dpr` hängen, werden sie mit kleiner gebacken.
- **Glow-Ebene** `Fx.GL` (fx.js, halbe Szenen-Auflösung): Funken, Funkeln, Sterne, Seifenblasen (`Fx.P.GLOWT`),
  Lichterkette und Finale-Funkeln (`deko.js`, Schalter `GLOW_DEKO`) sowie der Zauberstern mit Sternenschweif malen
  zusätzlich einen weichen Licht-Tupfer. Das Endbild zeichnet die Ebene in ¼-Auflösung zweimal weich und legt sie per
  **Screen** darüber (nicht additiv: der Salon ist hell, additiv brennt aus). **Ist die Ebene leer, entfallen Hochladen und
  Weichzeichnen.**
- **Farbstimmung je Station** (`PO.GRADE`, `PO.stimmung(state)`): Salon warm, Menü/Wahl, Aquarium kühl, Spa/Massage
  ruhig, Disco/Tanz, Zauber, Geburtstag, Finale. Wechsel weich in ≈ 1 s.
- **Hochskalieren + CAS-Nachschärfen** (`PO.SCHAERFE` hoch 0,5 / nativ 0,15), Dither.
- **Vignette im Shader: Standard AUS**, `?pvign=1` = an. Abweichung vom Auftrag, Begründung: Knöpfe, Titel und Hinweise
  liegen hier im selben Canvas (anders als die DOM-HUD im Koboldkeller). Eine Shader-Vignette würde sie am Rand mit
  abdunkeln. Die dezente warme Vignette steckt seit r20 schon im Raum-Cache (vor der UI) und kostet nichts pro Bild.
  Der Heavy-Job entscheidet am Bild.
- **Rückfall:** `?post=0`, kein WebGL2, Shader-/Puffer-Fehler, Kontextverlust → `PO.aus()` → `resize()` mit den alten
  Maßen (2D sichtbar, DPR wie 20.4).
- **Regler:** `?post=0`, `?pvign=1`, `?pszene=1.25,1.3,1.6` (Szenen-DPR der Stufen 0/1/2). Konsole: `BSGame.post()`,
  `BSGame.canvasMem()`.

**Geprüft (Unit, `post.test.mjs`, 18 Tests):** Maße je Stufe und Gerät (DPR 1/1,5/2/3), `?pszene`, Speicherrechnung,
UI-Farben aus ui.js verschieben sich in **keiner** Stimmung um mehr als 6 % je Kanal (CPU-Abbild des Shaders
`PO.gradeFarbe`, größte Abweichung 5,5 %), Überblenden, Blur-Kern, Shader statisch (GLSL ES 3.00, Uniform-Listen
deckungsgleich, Reihenfolge der Farbkorrektur wie im CPU-Abbild), **echte game.js-Schleife mit nachgebautem WebGL2**:
Szene 659×1464, Glow 330×732, ein Endbild je Bild, ohne Glitzer kein Glow-Upload, mit Funken 3 Durchgänge, Stufe 0 ruht
und kommt wieder, Kontextverlust → 824×1830 + Spiel läuft weiter, `?post=0`/kein WebGL2 → kein GL-Aufruf. Rauchtest: alle
24 Stationen + Finale, hoch und quer, mit Stufenwechsel, 0 Fehler.

**Speicher (Harness-Zählung, hochkant DPR 2, Sitzung mit 3 Bären mit Frisur, Stationen, Finale):**
2D-Canvas **7,65 MP mit Endbild gegen 11,35 MP ohne** (Sprites 4,86 statt 7,37; Raum 1,58 statt 2,47). Dazu kommen
**2,84 MP Grafikspeicher**: Endbild-Puffer 824×1830, Szenen-Textur, Glow-Textur, Bloom-Puffer. Gesamt 10,5 statt 11,35 MP.
In einer Sitzung mit nur einem Bären ist das Endbild beim Gesamtspeicher etwa gleichauf (8,2 gegen 7,9 MP); der 2D-Teil,
den iOS begrenzt, ist immer deutlich kleiner.

**Heavy-Job muss im Browser abnehmen:**
1. Shader übersetzen in Chromium (Metal) **und** WebKit: `BSGame.post().an === true`, `fehler === null`.
2. Kontextverlust: `document.getElementById('post').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()`
   mitten im Spiel → 2D sichtbar, Eingaben gehen, keine Fehler.
3. Gate p95 (Tabelle oben) je Stufe hoch/quer. **Größtes Risiko: Stufe 1.** Dort rechnet die Szene mit 1,3 statt 1,6, das
   Endbild aber in 1,6. Ob das spart, hängt vom Hochladen ab (Software-Raster: Rücklesen ≈ 1 MP je Bild). Falls Stufe 1
   reißt: `PO.STUFEN[1].ruht = true` oder Szene kleiner.
4. **Schärfe von Text und Knöpfen** (UI liegt im Canvas!): Lupe 2× auf Titel, Tab-Leiste und Werkzeug-Tablett, `?post=0`
   gegen an. Ist es zu weich: `?pszene=1.25,1.3,1.8` testen bzw. `SCHAERFE.hoch` 0,5 → 0,65.
5. A/B-Collage je Station hoch/quer (`?post=0` gegen Standard), dabei auf Glühen (Konfetti, Zauber, Seifenblasen,
   Lichterkette), warme Stimmung und Aquarium-Kühle achten. Die Farbverschiebung der UI muss unsichtbar bleiben.
6. `GLOW_DEKO`: Die Lichterkette glüht auf Stufe ≥ 1 ständig, damit läuft der Bloom in fast jedem Salon-Bild. Wenn das
   im Gate teuer ist: `GLOW_DEKO=false` (dann glühen nur Partikel, Finale-Funkeln und Zauber nicht mehr).
7. Glow-Kosten der Partikel im Finale (bis 760 Partikel, je Funke ein zusätzlicher Tupfer in ¼ Fläche): Finale-p95
   vergleichen, notfalls `Fx.P.GLOWT.spark` streichen.
8. Ladegröße mit `tests/ladegroesse.py` (Schätzung Vorbau: **+15 KB gzip**, +35 KB roh).

**Annahmen/Startwerte (nur am Bild abstimmbar, TODO im Code):** `PO.STUFEN`, `PO.SCHAERFE`, alle Werte in `PO.GRADE`
(bloom 0,28–0,6, Farbtöne), `Fx.P.GLOWT` (Radius/Stärke je Sorte), Tupfer-Stärken in deko.js/zauber.js.
GPU-Kosten des Endbilds auf Mali/Adreno sind hier nicht messbar (Koboldkeller schätzt 1–2 ms bei 1,5 MP).

---

## E2 – Fell und Stoff mit Struktur (`relief.js`, Audit #7) — Standard AN, `?fell=0` = aus
**Fertig:**
- `relief.js` (`window.BSRelief`, nach `post.js`, vor `art.js`): kachelbare Höhenfelder 128² (**Fell**-Fasern nach unten +
  Büschel, **Frottee**-Schlingen, **Samt**, **Webstoff**) → Normalen (zentrale Differenzen) → Lambert gegen eine
  Lichtrichtung → graue Kachel um 128. Sie wird wie die vorhandene Flausch-Kachel per `soft-light` eingerechnet.
  **Kosten nur beim Backen**, pro Bild nichts. Kacheln werden je Ziel und 16 Richtungsstufen gecacht (≈ 64 KB je Stück).
- **Einbindung:** Bärenfell → `art.js fur()`, also alle Teil-Sprites (Kopf, Körper, Ohren, Arme, Füße, Schnauze
  schwächer). Handtuchrollen auf den Regalen, Sessel-Polster (Rücken, Armlehnen, Sitz) und Teppich im Raum-Cache
  (`deko.js`); Vorhänge im Vorhang-Sprite (einmal gebacken).
- **Licht:** Raum-Stoffe aus Richtung Fenster (`RF.fenster(x,y)`): Regale links bekommen Licht von rechts, der Sessel
  rechts davon von links, die Vorhänge je von der Fensterseite. **Abweichung beim Bärenfell:** Es wird nicht vom Fenster
  beleuchtet, sondern vom Keylicht oben links, mit dem art.js die Form des Bären schattiert. Sonst käme das Licht am
  selben Bären von zwei Seiten. Der Bär steht links vom Fenster, Fensterlicht hieße „von rechts“. Wer es trotzdem will:
  in `art.js fur()` `RF.KEY` → `RF.fenster(450,380)`.
- **Regler:** `?fell=0` (nichts wird gebacken, Bild wie vorher), `BSRelief.MIN_STUFE` (Startwert 0 = alle Stufen),
  Stärken/Maßstäbe/Tiefen in `BSRelief.ZIELE`. Die Kachel-Streuung × Stärke ist auf ≈ 7–15 Graustufen abgestimmt
  (Fell 9,5, Frottee 15,9, Polster 6,3, Vorhang 10,1, Teppich 10,4).

**Geprüft (Unit, `relief.test.mjs`, 8 Tests):** Höhenfelder deterministisch, 0…1, je Art verschieden, **kachelbar** (Naht
nicht stärker als innen); flache Fläche = 128, Mittel jeder Kachel 128 ± 1,5 (also keine Verfärbung), Streuung 5–40;
Licht kommt von der richtigen Seite (auch y nach unten); Richtungen Fenster/Keylicht; 16er-Rundung; Kacheln aller Ziele
< 0,4 s (gemessen ≈ 30 ms in Node); `?fell=0` und `MIN_STUFE` erzeugen keinen einzigen Zeichenaufruf; Einbindung in der
echten Schleife: Fell-Kachel im Keylicht, Vorhang- und Teppich-Kachel im Raum.

**Heavy-Job muss im Browser abnehmen:**
1. Collage `?fell=0` gegen Standard: Waschen (Bär groß), Föhnen, Spa, Totale mit Regal/Sessel/Vorhang, hoch/quer.
   Kriterium (CHECKS C2.3): Struktur erkennbar, aber nicht wie Dreck oder Rauschen. Zu stark → `ZIELE.<ziel>.amt` senken.
   Zu fein bei kleinem Bären → `skala` hoch. Moiré bei kleinen Sprites (k < 1) ansehen.
2. **Backzeit** messen: `node tests/hitch-check.mjs --swraster --novsync --query=fell=0` gegen ohne Query (längstes Bild
   je Stationswechsel, dazu `relief.zeitMs`). Ebenso den ersten Bären-Satz (Wahl → Waschen). Liegt der Aufschlag über
   +30 ms: `RF.MIN_STUFE = 1`. Achtung: Bären-Sätze behalten den Stand der Stufe, auf der sie gebacken wurden.
3. Pixel-Vergleich der Stationen mit `?fell=0` gegen 20.4 (`tests/umbau-shots.mjs` + `pixel-diff.py`): Erwartung ≈ 0
   außer Aquarium-Zufall. So ist belegt, dass der Regler wirklich alles abschaltet.

**Nicht gemacht (bewusst):** Frisuren, Hut und Teppich-Flor-Tupfer bekommen keine Normalen-Struktur. Die Kacheln werden
nicht im Worker gebacken: Pro Kachel kostet das ≈ 5–10 ms und die Kacheln werden gecacht, ein Worker brächte erst bei
gemessenem Bedarf etwas. Brauchen der Bäcker selbst (Teil-Sprites) oder die Raum-Portionen zu lange, ist das eine Frage
von `MIN_STUFE`, nicht von relief.js.

---

## E3 – nicht angefangen (Heavy-Job)
Messung nachher, Tabelle vorher/nachher je Stufe, Canvas-Speicher, Collagen nach `tests/shots/technik/`,
`TECHNIK_BERICHT.md`, Version r21 (`tools/bump-version.py`), Push, Live-Check. Grund: Das alles braucht Browser oder
Live-Seite und ist in der Leicht-Spur verboten. `CHECKS.md` enthält die Kriterien R21.5–R21.10 als offene Haken.

## Risiken und Auffälligkeiten
- **Ein unklarer Testlauf:** Der allererste `node --test tests/unit` auf dem unveränderten Stand meldete einmal „test
  failed“ ohne Einzelbefund. Danach war die Suite in allen weiteren Läufen grün. Vermutlich Last durch den parallelen Queue-Job; falls
  es wieder auftritt, die Einzeldateien laufen lassen.
- Die Shader sind nur statisch geprüft; erst der Browser zeigt Übersetzungsfehler. Dann greift der Rückfall automatisch
  (`BSGame.post().fehler`).
- Die Speicherzahlen stammen aus der Harness-Zählung (Pixel der Canvases und WebGL-Puffer). Puffer, die der Browser
  intern zusätzlich anlegt (Compositor, doppelte Puffer), sind nicht enthalten.
- Szenen-DPR < Endbild-DPR macht feine Linien (Lichterkette, Text) minimal weicher; CAS gleicht das aus. Wie gut, zeigt
  nur die Lupe.
