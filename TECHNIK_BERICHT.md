# Bären-Beautysalon – Technik-Nacht „Kino-Look 2D und Fell mit Struktur“ (r21, 09.10.2026)

Stand: Version **21.1** (Cache-Buster `?v=21.1`), live auf https://drpeterkalmar.github.io/baeren-beautysalon/
Grundlage: Grafik-Audit „6. Bären-Beautysalon“, Maßnahmen #6 (Kino-Look 2D) und #7 (Fell/Stoff mit Normalen-Licht).

## In einfachen Worten (was die Kinder sehen werden)

- **Der Salon leuchtet ein bisschen.** Die Lämpchen der Lichterkette, Glitzer, Funkelsterne, Zaubersterne und
  Seifenblasen haben jetzt einen weichen Lichtschein um sich, wie im Kino. Am stärksten im Finale, beim Zaubern und in
  der Disco. Es ist bewusst zart: nichts blendet, kein Knopf und kein Text wird überstrahlt.
- **Jede Station hat ihre eigene Stimmung.** Der Salon ist etwas wärmer, das Aquarium etwas kühler und kräftiger blau,
  beim Zaubern wird das Licht leicht lila, die Disco rosa-bunter, der Geburtstag goldener. Beim Wechsel der Station
  gleitet die Stimmung in etwa einer Sekunde hinüber.
- **Bärenfell sieht nach Fell aus.** Statt einer glatten Fläche mit Tupfern hat das Fell feine Haare, die das Licht von
  oben links einfangen. Am Braunbären sieht man das deutlich, beim weißen Bären ganz leicht. Auch Handtücher, Sessel,
  Vorhänge und der Teppich haben jetzt eine feine Stoff-Struktur, beleuchtet von der Fensterseite.
- **Und trotzdem muss das Handy weniger rechnen.** Das Spielbild wird ein Stück kleiner gemalt und dann von der
  Grafikkarte wieder groß und scharf gemacht (wie ein guter Fernseher). Auf der besten Stufe spart das hochkant knapp
  ein Fünftel bis ein Drittel Arbeit je Bild, und das Spiel braucht etwa ein Fünftel weniger Grafikspeicher. Das ist
  besonders fürs iPhone wichtig.
- **Was gleich bleibt:** alle 24 Stationen, Knöpfe, Tipp-Flächen, Spielstände, Album, Musik. Wer das alte Aussehen
  sehen will: `?post=0&fell=0` an die Adresse hängen. Das Bild ist dann pixelgleich mit Version 20.4.

## Was neu ist (technisch)

| Etappe | Was | Datei(en) | Regler |
|---|---|---|---|
| E0 | Audit #2 Partikel-Pool ohne Allokation, #5 Schnappschuss ½ + Raum-Cache ≤ 2,5 MP (nachgeholt im Vorbau; #1, #3, #4 waren aus dem Umbau drin) | `fx.js`, `game.js` | – |
| E0 | Messwerkzeug: Hauptthread bis nach dem Malen, Software- und GPU-Profil, Tabelle mit Gate, Speicher einer Sitzung, Browser-Abnahme | `tests/deko-check.mjs`, `tests/perf-tabelle.py`, `tests/speicher-check.mjs`, `tests/technik-abnahme.mjs`, `tests/hitch-check.mjs` | – |
| E1 | WebGL2-Endbild: Hochskalieren + Nachschärfen (CAS), Schein aus der Glow-Ebene (halbe Auflösung, Weichzeichnen in ¼), Farbstimmung je Station, Dither | `post.js`, `fx.js` (`Fx.GL`, `Fx.P.GLOWT`), `deko.js`, `stations/zauber.js` | `?post=0`, `?pvign=1`, `?pszene=` |
| E2 | Gebackene Normalen-Beleuchtung: Fell (alle Bären-Teile), Handtücher, Sessel, Vorhänge, Teppich | `relief.js`, `art.js`, `deko.js` | `?fell=0`, `BSRelief.MIN_STUFE` |

Auflösung je Qualitätsstufe mit Endbild: Stufe 2 Szene DPR 1,6 → Endbild 2; Stufe 1 Szene 1,3 → Endbild 1,6; Stufe 0
(Sparstufe) ohne Endbild, exakt der Weg von 20.4 (DPR 1,25). Raum-Cache und Bären-Sprites hängen an der Szenen-DPR und
werden dadurch kleiner gebacken – daher die Speicher-Ersparnis.

Rückfall ohne Regler: kein WebGL2, Shader-/Pufferfehler oder Kontextverlust → reines 2D in der alten Auflösung, das Spiel
läuft weiter (im Browser geprüft).

## Messung vorher/nachher

Werkzeug `tests/deko-check.mjs perf … --voll`, ein Chromium, Handy 412×915 bzw. 915×412 bei DPR 2, **CPU ×4**,
Szenen Menü, Waschen (voll gestylter Bär: Hut, Kette, Schleife, 6 Lackkrallen, Schaum rubbeln + Dusche), Aquarium
(füttern), Finale (Enthüllung + Konfetti), je 10,5 s. Messgröße wie im Koboldkeller: **Hauptthread-Zeit je Bild vom
rAF bis nach dem Malen**, p95, Median über die Wiederholungen. „Vorher“ = Export von `2a503d4` (20.4), gemessen **vor
dem Merge** (2 Läufe) und am Schluss noch einmal **im Wechsel** mit „nachher“ (1–2 weitere Läufe), „nachher“ = 21.1
mit Endbild und Fell-Struktur (2 Läufe). Rohdaten: `tests/perf/r21/r21-vorher-*.json`, `r21-nachher-*.json`, Tabellen
`tests/perf/r21/tabelle_*.md`.

**Profil Mittelklasse (Haupt-Gate): Software-Raster** (das 2D-Canvas wird ohne Grafikkarte gemalt = Stellvertreter für
die Füllrate eines Handys, WebGL läuft auf der GPU). p95 in ms, vorher → nachher; in Klammern das längste Bild.

| Stufe | Format | Menü | Waschen | Aquarium | Finale |
|---|---|---|---|---|---|
| 2 | hoch | 49,1 → **40,0** (−19 %) [89 → 43] | 68,6 → **56,4** (−18 %) [127 → 94] | 66,6 → **55,2** (−17 %) [127 → 94] | 95,5 → **68,1** (−29 %) [250 → 197] |
| 2 | quer | 29,2 → **26,4** (−10 %) [37 → 30] | 38,9 → **39,0** (±0 %) [60 → 50] | 38,4 → **38,8** (+1 %) [60 → 50] | 56,5 → **44,5** (−21 %) [115 → 98] |
| 1 | hoch | 41,2 → **28,5** (−31 %) [68 → 41] | 50,8 → **38,1** (−25 %) [68 → 50] | 49,1 → **37,0** (−25 %) [68 → 50] | 59,8 → **44,4** (−26 %) [114 → 88] |
| 1 | quer | 20,6 → **19,1** (−7 %) [29 → 25] | 32,5 → **27,9** (−14 %) [53 → 37] | 31,9 → **27,8** (−13 %) [53 → 37] | 36,5 → **32,0** (−12 %) [82 → 70] |
| 0 | hoch | 21,8 → **20,5** (−6 %) [32 → 23] | 30,8 → **29,1** (−6 %) [45 → 42] | 29,6 → **28,4** (−4 %) [45 → 42] | 31,4 → **29,9** (−5 %) [73 → 70] |
| 0 | quer | 13,3 → **13,1** (−2 %) [20 → 16] | 20,7 → **19,8** (−4 %) [31 → 37] | 20,5 → **19,5** (−5 %) [31 → 37] | 21,5 → **20,4** (−5 %) [46 → 44] |

**Gate (p95 nachher ≤ vorher · 1,05 + 0,5 ms je Stufe, Format, Szene): bestanden.** Stufe 0 hat kein Endbild; der
kleine Gewinn dort kommt vom Partikel-Pool ohne Allokation (Finale) und aus Rauschen. Querformat gewinnt weniger, weil
dort der Raum (gebacken) einen größeren Teil des Bildes ausmacht als der live gemalte Bär.

Ehrlich dazu: Der erste Schlusslauf „Stufe 2 hoch“ zeigte bei gleichem Median (≈ 48 ms) p95-Spitzen um 130 ms. Isoliert
nachgemessen (Fell an/aus abwechselnd) waren sie weg; der Lauf wurde im Wechsel mit einem weiteren Vorher-Lauf
wiederholt (Werte oben). Ursache war Last auf dem Mac während dieses Laufs, nicht der Code.

**Profil GPU-Raster** (Canvas auf der Grafikkarte des Mac, CPU ×4, Bildrate ungebremst; `tabelle_gpu.md`):
Stufe 0 unverändert (2,9–3,4 → 3,1–3,4 ms), **Stufe 1 und 2 rund +1 ms** (z. B. Menü 3,3 → 4,5 ms, Finale 3,6 → 4,6 ms).
Nachgeprüft mit `tests/perf/r21/gpu_probe.mjs`: Das Endbild selbst kostet im JavaScript **0,1 ms** im Median (p95
0,2–0,7 ms); ohne Glow-Ebene oder ohne Bloom bleibt das +1 ms gleich. Es ist die Übergabe des 2D-Bildes an WebGL und das
Warten auf die Grafikkarte, wenn der Test 600–1.000 Bilder/s erzwingt. Gemessen an 16,7 ms je Bild bei 60 Hz sind
4,5 ms unkritisch; dafür malt die Grafikkarte im 2D-Teil 36 % weniger Pixel, und genau das zeigt das Software-Profil.
Das Gate des Auftrags (Profil Mittelklasse) ist das Software-Profil; das GPU-Profil ist hier zur Information. Wird ein
Handy doch zu langsam, schaltet die Automatik auf Stufe 0 – dort ruht das Endbild.

**Backzeit der Fell-/Stoff-Struktur** (`tests/hitch-check.mjs --swraster --novsync`, längstes Bild nach dem Wechsel,
`tests/perf/r21/hitch_e2.json`): Stationswechsel unverändert im Rauschen (±6 ms). Neuer Bär (neuer Sprite-Satz) auf
Stufe 2 im Mittel **+13 ms** (+6 … +20 ms), auf Stufe 0 ebenfalls +13 ms (+8 … +18 ms). Die Kacheln selbst kosten einmalig
12–14 ms (Chromium) bzw. 65 ms (WebKit, beim Laden). Grenze laut Auftrag +30 ms → kein Stufen-Schalter nötig,
`MIN_STUFE` bleibt 0. Pro Bild kostet die Struktur nichts (Gate oben ist mit Fell gemessen).

**Canvas-Speicher** einer ganzen Sitzung (`tests/speicher-check.mjs`: Menü → Wahl → 3 Bären mit Foto → alle 24
Stationen → Finale → Menü; alle lebenden Canvases nach Speicherbereinigung, alter und neuer Stand gleich gezählt, beim
Endbild plus WebGL-Texturen und -Puffer; `tests/perf/r21/speicher_*.json`):

| Fall | 20.4 | 21.1 | MB (× 4) |
|---|---|---|---|
| hoch, Stufe 2 | 26,7 MP | **21,5 MP** (−19 %) | 107 → 86 MB |
| quer, Stufe 2 | 21,0 MP | **17,7 MP** (−16 %) | 84 → 71 MB |
| hoch, Stufe 1 | 18,3 MP | **14,1 MP** (−23 %) | 73 → 56 MB |

Budget aus dem Umbau: unter 150 MB (iPhone). Eingehalten mit viel Abstand. Nicht enthalten (in keinem der Werte):
interne Kopien des Browsers (Compositor, Doppelpuffer). Die Spalte „Bild-Leinwände“ in `tabelle_sw.md` ist dagegen
größer (Stufe 2: 3,98 → 5,62 MP), weil dort die WebGL-Puffer dazukommen, die kleineren Sprites aber nicht gezählt
werden (der alte Stand meldete keine Sprites). Maßgeblich ist die Sitzungs-Zählung.

**Ladegröße** (`tests/ladegroesse.py`): gzip 322,7 → 337,6 KiB (**+15 KB**, Budget +100 KB), roh +35 KB, 2 Dateien mehr.

## Abnahme im Browser

| Prüfung | Chromium (Metal) | WebKit |
|---|---|---|
| P1 Endbild an (WebGL2 übersetzt, Szene 659×1464 → Endbild 824×1830, 2D unsichtbar) | ✔ hoch + quer | ✔ |
| P2 echtes Tippen geht durch das Endbild (Weiter-Knopf → nächste Station) | ✔ | ✔ |
| P3 Kontextverlust mitten im Spiel → 2D in alter Auflösung, Tippen geht, 0 Fehler | ✔ | ✔ |
| P4 `?post=0` → kein Endbild, Auflösung wie 20.4 | ✔ | ✔ |
| P5 Stufe 0 → Endbild ruht; zurück auf Stufe 2 → läuft wieder | ✔ | ✔ |
| P6 Glühen im Finale (Glow-Ebene gefüllt und weichgezeichnet) | ✔ | ✔ |
| F1/F2 Fell-Kacheln gebacken; `?fell=0` → keine | ✔ | ✔ |
| `?post=0&fell=0` gegen 20.4, 24 Stationen hoch (feste Uhr, fester Zufall) | ≤ 0,001 % Pixel | – |
| Live-Check nach jedem Push (`tests/live-check.mjs`, jetzt mit Endbild-Zustand) | ✔ 21.0 hoch, 21.1 hoch + quer | – |
| Unit-Tests `node --test tests/unit` / Python | 129/129, 10/10 | – |

Ergebnisdateien: `tests/perf/r21/abnahme_{chromium,webkit}_{hoch,quer}.json`.

**Collagen** (selbst angesehen, `tests/shots/technik/`): `final_hoch_1/2.jpg`, `final_quer.jpg` (links 20.4, rechts 21.1),
`e1_*` (Endbild allein), `e1_lupe_hoch.jpg` (2× Lupe Titel, Tab-Leiste, Knöpfe, Zauberstab), `e1_gluehen_*`,
`e2_lupe_*` (Fell an/aus). Ehrliche Bewertung: Der Unterschied ist **sichtbar, aber zurückhaltend** – wie gewünscht
„dezent“. Am deutlichsten: weiche Lichthöfe der Lichterkette, die Zauber- und Disco-Stimmung, das kräftigere
Aquarium und die Fell-Haare am Braunbären. Beim weißen Bären und bei den Stoffen ist die Struktur nur aus der Nähe zu
sehen. Text und Knöpfe sind in der Lupe gleich scharf wie bei DPR 2 (eher minimal schärfer durch das Nachschärfen).
Die Farbstimmung verschiebt die Knopf- und Textfelder nur ganz leicht (Unit-Test: ≤ 6 % je Farbkanal; im Bild bei Zauber
ein Hauch rosa im Hinweisfeld). Nichts wird verdeckt oder überstrahlt.

## Entscheidungen und Abweichungen vom Auftrag

1. **Vignette bleibt im Raum-Cache** (Auftrag: „dezente Vignette“ im Endbild). Knöpfe, Titel und Hinweise liegen im
   selben Canvas wie das Spielbild; eine Shader-Vignette würde sie am Rand mit abdunkeln. Die warme Vignette steckt seit
   r20 im Raum-Cache (vor der UI) und kostet nichts. `?pvign=1` schaltet die Shader-Vignette zum Vergleich ein. Gleiche
   Entscheidung wie im Koboldkeller.
2. **Glühen stärker als im Vorbau.** Die Startwerte waren auf dem hellen Salon kaum zu sehen. Partikel-Tupfer und
   Bloom je Stimmung sind etwa 1,5-mal so stark (Kosten unverändert, nur die Helligkeit des Scheins).
3. **Bärenfell wird vom Keylicht oben links beleuchtet, nicht vom Fenster** (Auftrag: „Licht aus dem Fenster“). Der
   Bär ist seit r18 von oben links schattiert; Fensterlicht (von rechts) hätte ihn von zwei Seiten beleuchtet. Raum-Stoffe
   (Handtücher, Sessel, Vorhänge, Teppich) bekommen das Fensterlicht. Übernommen aus dem Vorbau, am Bild bestätigt.
4. **Kein Worker für die Struktur.** Die Backzeit liegt mit +13 ms unter der Grenze von +30 ms.
5. **Messprofil.** Das Vorbau-Messwerkzeug startete das Software-Profil mit `--disable-gpu`. Damit gibt es kein WebGL,
   das Endbild wäre still in den Rückfall gegangen und „nachher“ hätte den alten 2D-Weg gemessen. Korrigiert wie im
   Koboldkeller: nur das 2D-Canvas ohne GPU, WebGL auf Metal (`deko-check`, `hitch-check`).
6. **GPU-Profil +1 ms** auf Stufe 1/2 (siehe Messung). Nicht zurückgedreht, weil das Gate (Mittelklasse-Profil) mit
   deutlichem Gewinn besteht, die Ursache Warten auf die GPU bei erzwungener Bildrate ist und die Automatik bei echten
   Engpässen auf Stufe 0 (ohne Endbild) schaltet. Für Peter als offener Punkt unten.
7. **Version:** 21.0 schon mit dem ersten Push (die mit dem Merge kommenden `post.js`/`relief.js` und das geänderte
   `fx.js`/`game.js` dürfen nicht mit 20.4-Dateien aus dem Cache gemischt werden), 21.1 mit dem abgestimmten Glühen.
   Danach haben sich nur noch Tests und Doku geändert.

## Vorbau (Leicht-Spur) und was die Abnahme daran geändert hat

Die Leicht-Spur (`baerensalon-r21-vorbau`) hat E0–E2 ohne Browser vorgebaut (Branch `vorbau/baerensalon-r21-technik`,
6 Commits, 129 Unit-Tests, Rauchtest aller Stationen mit nachgebautem WebGL2). Übernommen per
`git merge --no-ff` (`e96d604`), **ohne Konflikte**. Die Vorher-Messung lief vorher auf dem alten Stand (Export von
`2a503d4`, gemessen mit dem Vorbau-Werkzeug aus einem eigenen Arbeitsbaum, also vor dem Merge in main).

| Fund im Browser | Änderung |
|---|---|
| Software-Profil mit `--disable-gpu` hätte das Endbild abgeschaltet | Profil wie Koboldkeller (nur 2D ohne GPU) |
| Glühen auf dem hellen Salon kaum sichtbar | `Fx.P.GLOWT` und `PO.GRADE.*.bloom` ≈ 1,5× |
| Speicher-Spalte verglich alt ohne Sprites mit neu mit Sprites | Spalte ohne Sprites; ganze Sitzung neu mit `speicher-check.mjs` |
| Shader, Kontextverlust, Stufe 0, Tippen, Schärfe, Stufe-1-Risiko | alles bestanden, keine Änderung nötig (Stufe 1 spart am meisten: −25…−31 % hoch) |
| Fell/Stoff-Stärken, Backzeit | am Bild in Ordnung, +13 ms → keine Änderung |

Bestätigt aus der Vorbau-Durchsicht: Audit #1 (Accessoires als Sprites), #3 (Simulation mit dt) und #4 (Stufen nach
Arbeitszeit) waren aus dem Umbau drin; #2 (Partikel-Pool ohne Allokation) und der Rest von #5 (Schnappschuss ½,
Raum-Cache ≤ 2,5 MP) fehlten und wurden im Vorbau nachgeholt (`0173fd8`). Ein einmal unklarer Unit-Testlauf aus dem
Vorbau trat hier nicht auf (alle Läufe 129/129). Die Übergabe `VORBAU_baerensalon-r21-technik.md` ist hier
eingearbeitet und aus dem Repo entfernt, der Branch gelöscht.

## Offen / für Peter

- **Echtes Handy:** Alle Zahlen stammen aus Chromium/WebKit auf dem Mac mini mit CPU ×4. Was das Endbild auf der GPU
  eines Mittelklasse-Androids oder iPhones kostet, ist geschätzt (1–2 ms), nicht gemessen. Bitte einmal auf dem
  Kinder-Handy spielen; in der Konsole (Remote-Debugging) zeigt `BSGame.post()`, ob das Endbild läuft, und
  `BSGame.tier()` die Stufe. Wenn es ruckelt: mit `?post=0` vergleichen.
- **iPhone-Speicher:** einmal über den Safari-Web-Inspector eine Sitzung mit 3–4 Bären ansehen (Ziel < 150 MB).
  Erwartung jetzt etwa 70–90 MB Canvas.
- **Geschmack:** Wenn das Glühen oder die Stimmungen zu zart oder zu stark sind: Werte in `post.js` (`PO.GRADE`) und
  `fx.js` (`Fx.P.GLOWT`) – ein Zahlenwechsel, keine Logik.
