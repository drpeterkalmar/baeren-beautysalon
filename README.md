# Bären-Beautysalon

Ein kleines, interaktives HTML5-Kinderspiel: Bären besuchen den Beautysalon — waschen, frisieren, pflegen, schmücken. Gebaut von Kindern, für Kinder.

**Spielen:** https://drpeterkalmar.github.io/baeren-beautysalon/

Vanilla JavaScript + Canvas, kein Build-Step, keine externen Assets (prozedural gezeichnet), lizenzfrei (MIT).

## Technik

Einfach `index.html` öffnen oder statisch hosten (GitHub Pages).

## Version heben = ein Befehl

```sh
python3 tools/bump-version.py 20.4          # setzt alle ?v= in index.html (+ Rückfallwert in fx.js)
python3 tools/bump-version.py 20.4 --check  # prüft nur, ob überall 20.4 steht
```

Das Spiel liest seine Version (`BS_VERSION`, unten links im Menü) aus der `?v=`-Query von `fx.js` — es gibt nur noch
eine Quelle, die gleichzeitig das Cache-Busting für GitHub Pages ist.

## Prüfen

**Ohne Browser (Sekunden, vor jedem Commit):**

```sh
node --test tests/unit
python3 -m unittest discover -s tests/unit -p "test_*.py"   # bump-Werkzeug (läuft auch im Node-Test mit)
```

Lädt die Spiel-Module per `node:vm` in eine Sandbox (`tests/unit/harness.mjs`, keine npm-Pakete) und prüft u. a.
alle 24 Stationen (bauen, zeichnen, antippen), Speichern/Laden, Aufräumen beim Stationswechsel, Aquarium-Layout,
Finale-Zeitplan, Farb-Mathe und Partikel-Grenzen.

**Im Browser (Playwright, headless):** Playwright wird in `$PW_DIR`, `~/.cache/r18-pw/node_modules` oder global gesucht
(`PW_DIR=/pfad/zu/node_modules node …`). Nie zwei Browser gleichzeitig starten.

| Werkzeug | Zweck |
|---|---|
| `node tools/visual-check.mjs <label> [--land] [--only=flow\|stations\|r19\|…]` | Screenshots + `report.json` gegen CHECKS.md (0 Fehler, Knöpfe ≥ 48 px) |
| `node tests/deko-check.mjs perf <label> [--tier=2\|1\|0\|auto] [--swraster] [--throttle=4]` | Bildzeiten je Szene |
| `node tests/hitch-check.mjs [--swraster] [--throttle=4]` | Ruckler beim Stationswechsel |
| `node tests/live-check.mjs --expect=<version> [--land]` | Live-Seite auf GitHub Pages prüfen |

## Musik

Hintergrundmusik: "Birdfish Happy Loop" (CC0, https://creativecommons.org/publicdomain/zero/1.0/) via creazilla.com.
