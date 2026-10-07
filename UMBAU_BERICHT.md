# Umbau-Bericht (Version 20.4): Bären-Beautysalon nach dem Gutachten vom 05.10.2026

**Kurz gesagt:** Das Spiel sieht genauso aus und spielt sich genauso wie vorher. Unter der Haube sind zwei
Speicher-Fehler behoben, Hut, Kette und Lack kosten fast keine Rechenzeit mehr, Fische, Karussell und Zauber laufen
auf jedem Handy gleich schnell, sparsame 30-Hz-Handys bekommen nicht mehr automatisch die schlechteste Grafik, und der
große Stations-Code ist in 24 kleine Dateien aufgeteilt. Dazu gibt es jetzt 99 Prüfungen, die ohne Browser in
4 Sekunden laufen.

- **Spielen:** https://drpeterkalmar.github.io/baeren-beautysalon/ (im Menü unten links steht `v20.4`)
- Am Handy einmal neu laden, bei Android-Chrome notfalls den Tab schließen und neu öffnen.
- Grundlage: `docs/audit/2026-10-05-max-gutachten.md` (nur P1 + P2, keine neuen Funktionen).

## Die zwei Speicher-Fehler, einfach erklärt
1. **Album-Fotos haben sich nachträglich verändert (P1-1).** Ein Foto im Album war kein echtes Foto, sondern eher
   ein Fenster auf den Bären. Wenn das Kind nach dem „Klick!“ noch eine Kralle lackiert oder einen Hut aufgesetzt hat,
   hatte der Bär auf dem *alten* Foto plötzlich auch den neuen Lack oder Hut, und so wurde es auch gespeichert.
   **Jetzt** ist jedes Foto ein echter Schnappschuss: Was danach passiert, ändert das Foto nicht mehr. Auch wenn man
   ein Album-Foto antippt und den Bären daraus weiter schmückt, bleibt das Foto, wie es war.
2. **„Weiter mit meinem Bären“ fehlte (P1-2).** Wer mitten im Spiel auf 🏠 getippt hat, sah im Menü nur „Los geht’s“.
   Wählte das Kind dann wieder einen Bären, war der schön gestylte Bär weg. **Jetzt** steht „Weiter mit meinem Bären“
   sofort im Menü, nicht erst nach dem Neuladen der Seite.

Beides ist im Browser per echtem Tippen nachgeprüft (Touch-Abnahme unten) und als Unit-Test festgehalten.

## Was sonst behoben ist
| Gutachten | Was war | Was jetzt |
|---|---|---|
| P2-1 | Nach dem Drehen des Handys oder einem Qualitätswechsel sprang die Kamera beim nächsten Stationswechsel und der Raum wurde auf einen Schlag neu gemalt (Ruckler) | Kamera fährt weich, Raum wird wie sonst in Portionen gemalt |
| P2-2 | Handys im Stromsparmodus (30 Bilder/s) landeten nach 5 s dauerhaft auf der niedrigsten Grafikstufe, obwohl sie kaum rechnen | Die Automatik erkennt ein sauberes 30-Hz-Display und bewertet die echte Rechenarbeit; bei 60 Hz unverändert |
| P2-3 | Fische, Karussell, Zauber, Tanz-Noten und Kuchen-Rauch liefen auf 120-Hz-Handys doppelt so schnell, auf 30-Hz-Handys halb so schnell | Überall gleich schnell; bei 60 Hz Bild für Bild genau wie vorher |
| P2-4 | Der Farb-Speicher wuchs mit jedem Zauber, bei langen Sitzungen mehrere MB | Gedeckelt (1.000 Einträge), der Zauber erzeugt keine neuen Farben mehr |
| P2-5 | Hut, Schleife, Kette, Lack und Eis-Waffel wurden jedes Bild mit Weichzeichner neu gemalt | Einmal vorbereitet, danach nur noch eingefügt (gleiches Bild) |
| P2-6 | Kein Budget für den Grafik-Speicher (Risiko: leere Bilder auf älteren iPhones) | Höchstens 5 statt 10 Bären-Sätze, Ersatz-Raum und Überblend-Bild werden freigegeben |
| P2-7/8 | salon.js mit 2.174 Zeilen, Tipp-Flächen entstanden nur beim Malen | 24 Stations-Dateien (`stations/<id>.js`), salon.js 464 Zeilen, Tipp-Flächen aus dem Zustand berechnet |
| P2-9 | Versionsnummer an 10 Stellen | Eine Quelle, heben mit `python3 tools/bump-version.py X.Y` |
| P2-10 | Keine Tests ohne Browser | `node --test tests/unit`: 99 Tests, ca. 4 s |

## Messwerte vorher/nachher
Aufbau wie im DEKO_BERICHT: Handy-Größe 412×915 bei doppelter Pixeldichte, Prozessor 4× gedrosselt, je Szene 10,5 s.
„Vorher“ = Export von `79d3ca7` (Stand vor dem Umbau), immer abwechselnd mit „nachher“ gemessen.
**Hinweis zur Genauigkeit:** Während der Messungen hat der Mac im Hintergrund das macOS-Update entpackt (Last 5–6).
Einzelwerte schwanken deshalb um ±30 %. Aussagekräftig sind der Median der Bildzeit (p50) und die Mittel über die
abwechselnd gemessenen Paare.

**Höchste Stufe (2), ohne Grafikchip (Software-Raster), 5 Paare** – Median über die Paare:

| Szene | p50 vorher → nachher | p95 vorher → nachher | p95-Differenzen der Paare |
|---|---|---|---|
| Menü | 44,0 → 43,6 ms | 64,7 → 59,4 ms | −8, −9, +3, +17, +32 % |
| Waschen | 68,7 → 63,0 ms | 97,1 → 98,4 ms | +12, −21, −14, +22, +29 % |
| Aquarium | 40,2 → 35,7 ms | 50,6 → 43,4 ms | +5, −13, −28, +32, +25 % |
| Finale | 85,4 → 83,7 ms | 166,6 → 156,5 ms | +3, −20, +11, −1, +13 % |

**Auto-Stufe (Software-Raster), 3 Paare:** End-Stufe vorher wie nachher **0** (wie im DEKO_BERICHT gefordert).
p50 Menü 23,5 → 23,9, Waschen 33,2 → 31,8, Aquarium 20,9 → 20,3, Finale 30,7 → 30,0 ms; p95-Differenzen der Paare
Menü +0/+17/+1 %, Waschen +3/+30/−30 %, Aquarium +5/−5/−4 %, Finale +9/+4/+2 %.

Bewertung: Die Bildzeit im Median ist überall gleich oder besser. Die p95-Werte springen von Lauf zu Lauf stärker,
als der Umbau sie verändern könnte (dasselbe Programm zweimal hintereinander: ±30 %); im Median der Paare liegt keine
Szene über +5 %. Gegen die Zahlen im DEKO_BERICHT (ruhiger Mac) ist kein Vergleich sinnvoll, weil der Mac heute
insgesamt 10–25 % langsamer war – auch der unveränderte alte Stand.

**Voll gestylter Bär (Hut, Schleife, Kette, 6 Lackkrallen), Waschen, 2 Paare** (Schritt 8):
- Mit Grafikchip: Rechenzeit je Bild p50 **2,1 → 0,75 ms**, p95 **4,3 → 3,6 ms**; 36 % mehr Bilder in derselben Zeit.
- Ohne Grafikchip: p50 80 → 75 ms, p95 108 → 91 ms.
- Kompletter Durchlauf, Finale (ungebremst, mit Hut und Kette): 473 → 992 Bilder/s hoch, 503 → 954 quer.

**Ruckler beim Stationswechsel** (längstes Bild nach dem Wechsel, Mittel / Spitze über 7 Wechsel, Stufe 2 mit
Grafikchip bzw. Stufe 0 ohne):

| Fall | vorher | nachher |
|---|---|---|
| Grafikchip | 19,2 / 34,9 ms | 19,4 / 26,4 ms |
| Grafikchip, kurz vorher Drehung/Größenwechsel | 17,1 / 29,1 ms | 17,1 / 24,0 ms |
| ohne Grafikchip | 46,2 / 50,7 ms | 46,9 / 51,7 ms |
| ohne Grafikchip, kurz vorher Drehung/Größenwechsel | **232,5 / 1.097 ms** | **47,5 / 50,6 ms** |

Die letzte Zeile ist der Fehler P2-1: Vorher hing das Bild nach einer Drehung beim nächsten Wechsel bis zu 1,1 s.

**Speicher:** Im kompletten Durchlauf werden gleich viele Bären-Sätze vorbereitet wie vorher (hoch 23, quer 13),
obwohl nur noch 5 statt 10 im Speicher bleiben.

**Ladegröße** (gzip): 301 → 323 KB (+22 KB), Dateien 11 → 35. Die 24 Stations-Dateien sind einzeln klein; GitHub
Pages liefert sie parallel. Keine Fremd-Assets, keine anderen Server.

## Prüfungen (alle grün)
- `node --test tests/unit`: **99 Tests**, 0 Fehler, ca. 4 s, ohne Browser. Darunter die beiden Speicher-Fehler, die
  Simulation 60 gegen 120 Hz, die Grafik-Automatik bei 30/60/90/120 Hz und jede Station hoch/quer Bild für Bild gegen
  den Stand vor dem Aufteilen.
- **Bildvergleich aller 24 Stationen** (hoch und quer, Bär voll gestylt, Uhr und Zufall fest – zwei Läufe desselben
  Stands sind pixelgleich): Abweichung je Bild höchstens 0,11 % (Aquarium quer 0,69 %). Einzige Ausnahme: Aquarium hoch
  1,8 %, weil die Fische eine andere Zufalls-Bahn schwimmen (die Bewegung wird jetzt an anderer Stelle im Bild-Takt
  berechnet; Aussehen und Tempo sind gleich). Übersicht: `tests/shots/umbau/vergleich_stationen_hoch.jpg` und
  `…_quer.jpg` (links vorher, rechts nachher).
- **Touch-Abnahme im Browser** (`tests/touch-check.mjs`, echtes Tippen und Ziehen, 22 Schritte): Bär wählen, Schaum
  rubbeln, Dusche, Krallen lackieren, Massage, Zuckerwatte spinnen und Stab ziehen, Ballon pusten und platzen lassen,
  Zauberstab, Paket, Teig ausrollen und ausstechen, Kerzen, Malbuch-Flächen und Rahmen, zwei Fotos, Album-Foto laden,
  🏠 → Menü. Ergebnis gleich wie vorher – außer genau den zwei behobenen Fehlern (Album-Foto bleibt ohne Hut,
  Menü zeigt „Weiter mit meinem Bären“) und beim Zauber ein Bild Versatz in der Spruch-Uhr (0,72 → 0,70 s).
- Kompletter Durchlauf hoch und quer (Menü → alle 24 Stationen per Tippen → Finale → Nochmal): **0 Fehler, 0 Knöpfe
  unter 48 px**, nach dem Merge und am Ende.
- Aquarium/Jonglage (R19): Verdeckung **0 %** hoch und quer, Bälle berühren sich nie (Mindestabstand 55).
- Live-Check gegen GitHub Pages (`--expect=20.4`), hoch und quer: HTTP 200, Version 20.4, 0 Fehler.

## Wie gearbeitet wurde (Vorbau + Abnahme)
Der Umbau lief in zwei Spuren. Die **Leicht-Spur** (ohne Browser, Branch `vorbau/baerensalon-umbau`) hat die Schritte
0–7, 9 und 10 programmiert und jeden mit Unit-Tests gegen den alten Stand belegt. Diese **Abnahme-Spur** hat zuerst
alles auf dem alten Stand gemessen, dann den Vorbau übernommen (`git merge --no-ff`, keine Konflikte), jede Etappe im
Browser abgenommen, Schritt 8 gebaut und alles veröffentlicht. Durchgefallen ist im Browser nichts; nachgebessert
wurden nur die Mess-Werkzeuge (siehe unten).

Bewusste Abweichungen vom Auftragstext (alle ohne Verhaltensänderung):
- **Schritt 6:** Statt `0.016 → dt` gilt `0.016 → 0.016·dt·60`. Grund: 0,016 ist nicht genau 1/60; mit `dt` wären
  Fische und Zauber bei 60 Hz 4 % schneller als heute. So ist 60 Hz Bild für Bild gleich, andere Bildraten gleich schnell.
- **Schritt 9:** Thumbnails bleiben für die zwei zuletzt benutzten Größen (Wahl-Raster + Album-Wandbild), nicht nur
  für eine – sonst würde beim Wechsel Waschen ↔ Wahl ständig neu gemalt.
- **Schritt 10:** Zweiter Haken `S.updateFrueh(dt)` neben `S.update(dt)` für Stations-Logik, die noch im selben Bild
  auf die Pose wirkt (Waschen, Föhnen, Spa, Eis, Zuckerwatte, Massage); sonst käme z. B. die Spa-Entspannung ein Bild später.
- **Versionsnummer:** einmal auf 20.4 gehoben, aber schon mit dem ersten Push des Umbaus (nicht erst ganz am Ende).
  Grund: Mit diesem Push gingen die neuen Stations-Dateien live; mit alter Nummer hätte ein Handy bis zu 10 Minuten
  alte und neue Dateien gemischt (salon.js aus dem Cache + neue Stations-Dateien = Fehler). Danach wurde nur noch
  art.js geändert, das mit beiden Ständen zusammenpasst.

## Was nicht gemacht wurde, und warum
- **Schritt 10, Rest:** Die „vorheriger Zustand“-Zähler in game.js (`prevState`) und deko.js (`prevSt`) sind nicht
  durch `S.setState` ersetzt, nur der in salon.js. Beide reagieren absichtlich erst im **nächsten Bild**
  (Schnappschuss des letzten Bildes für die Überblendung, Bildschirm-Partikel löschen, Funkel-Schwung). Als Haken im
  Tipp würden z. B. Partikel, die derselbe Tipp danach erzeugt, mit gelöscht – eine Verhaltensänderung. Laut Auftrag
  deshalb nur hier beschrieben.
- **Schritt 10, Rest:** In game.js `update()` bleibt Logik, die auch außerhalb ihrer Station weiterläuft
  (Geschenk-Schütteln, Keks backen/naschen, Ballon, Zauber-Pfote, Pirouetten-Abbau, Abklingen der Entspannung, Blitz,
  Hinweis-Toast). In einer Station würde sie beim Verlassen einfrieren.
- **Schritt 11** (`?deko=0` entfernen): nicht freigegeben, nicht angefasst. Der A/B-Link funktioniert weiter.
- P3-Befunde (z. B. Keks-Freude, Menü-Bär würfelt bei Ton-Knopf neu, `bs_baer` mit Unsinn-Inhalt lässt das Laden
  werfen) gehören nicht zu diesem Auftrag und sind unverändert.

## Kleine Unterschiede, die man theoretisch merken könnte
- Album-Kacheln, Zauberstab, Paket, Malbuch-Flächen, Watte-Stab/-Wolle, Teig und Ballon sind jetzt schon antippbar,
  bevor die Station das erste Mal gemalt wurde (vorher erst ab dem ersten Bild, also nach 1/60 s).
- Der schwebende Ballon und die Pirouette bekommen ihren Zufallswinkel jetzt im Takt statt beim Malen.
- Auf genau 60 Hz ist alles Bild für Bild gleich; bei 59,9 Hz minimal anders (gewollt: bildraten-unabhängig).

## Offene Punkte für Peter (brauchen ein echtes Gerät)
1. **iPhone-Grafikspeicher:** einmal am iPhone über den Safari-Web-Inspector die Canvas-Speichernutzung ansehen
   (Sitzung mit 3–4 Bären, Album, Finale). Ziel unter 150 MB. `BSGame.canvasMem()` in der Konsole zeigt die Pixel.
2. **30-Hz-Test:** iPhone im Stromsparmodus, Spiel öffnen, nach 10 s in der Konsole `BSGame.tier()` – Erwartung jetzt
   **2** (vorher 0). Ohne Konsole: Im Stromsparmodus sollten Lichterkette und Vorhänge weiter funkeln/schwingen.
3. **120-Hz-Handy neben 60-Hz-Handy:** Aquarium und Karussell sollten jetzt gleich schnell laufen.
4. **Schritt 11:** Soll der A/B-Link `?deko=0` (alte Optik) weg? Dann fällt alter Code in fünf Dateien weg.

## Neue und geänderte Prüf-Werkzeuge
- `tests/umbau-shots.mjs` – alle 24 Stationen hoch/quer mit fester Uhr (genau 60 Hz) und festem Zufall.
- `tests/pixel-diff.py` – Anteil abweichender Pixel je Bild (Vorbau).
- `tests/touch-check.mjs` + `tests/touch-diff.py` – echtes Tippen/Ziehen, Zustand vorher/nachher vergleichen.
- `tests/hitch-check.mjs --resize --novsync` – Ruckler nach Größenwechsel; ungebremst, weil der Headless-Browser auf
  diesem Mac mit Bildsynchronisation nur ~12 Bilder/s liefert und alle Werte auf 83 ms rastet.
- `tests/deko-check.mjs --voll` – Bär zusätzlich mit Hut und Kette.
- `tests/collage.py --nach=…` – Beschriftung der rechten Spalte.
- `tools/bump-version.py` – Version heben (Vorbau).

## Commits
Vorbau (Branch, 49 Commits, je Schritt bzw. je Station einer) per Merge `891a980`, danach: `2d27691` Prüf-Werkzeuge,
`d54b80f` Version 20.4, `67ec6c6` Schritt 8 (Accessoire-Sprites), dann Doku. Der Vorbau-Branch ist gelöscht, die
Übergabe-Datei `VORBAU_baerensalon-umbau.md` ist in diesen Bericht eingearbeitet.
