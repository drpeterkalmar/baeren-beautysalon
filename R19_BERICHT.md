# R19 — Bericht: Aquarium sichtbar + Jonglierbälle tiefer/größer

Live: https://drpeterkalmar.github.io/baeren-beautysalon/ (Cache-Version `v=19`)

## Wünsche der Kinder
1. „Aquariumsachen passieren genau hinter dem Bären.“ → **erledigt**
2. „Jonglierbälle müssen etwas tiefer starten und etwas größer sein.“ → **erledigt**

## Was sich geändert hat
**Aquarium**
- Der Bär sitzt jetzt **neben** dem Becken (Querformat) bzw. **unter** dem Becken (Hochformat) und schaut hinein.
  Das Becken nimmt den freien Bildbereich ein, die Kamera ist je Ausrichtung passend eingestellt.
- Die Fische schwimmen nur im freien Teil des Beckens (im Querformat nie hinter den Bären) und sind etwas größer (×1,35).
- Die Futter-Dose hängt über dem freien Wasser und kippt beim Füttern. Die Körner (etwas größer) fallen genau dort hinein.
- Der Bär schaut dem Futter bzw. den Fischen nach und freut sich, wenn ein Fisch schnappt.
- Schiff und Schatzkiste stehen links im Sand, gut sichtbar.

**Zirkus**
- Die Bälle starten und landen jetzt **in den echten Pfoten** des Bären: Die Pfoten-Position kommt aus der Arm-Pose (art.js),
  nicht mehr aus einer festen Höhe. Der Bär streckt dafür die Arme leicht zur Seite. Die alten halbdurchsichtigen „Pfoten-Kreise“ sind weg.
- Tiefster Punkt der Bahn = Pfote, Scheitel ≈ Kopfhöhe (links→rechts bis zum Scheitel des Kopfs, rechts→links auf Augenhöhe).
- Ball-Radius 17 → **23** (+35 %, Konstante `BALL_R`); Glanzlicht und Umriss wachsen mit.
- Bei 2 und 3 Bällen berühren sich die Bälle nie (Bahnen kreuzen sich nur in den Pfoten).

Sonst ist nichts umgebaut: r18-Renderer, andere Stationen, Musik und Speicherstand bleiben unverändert.
Technisch: `Art.drawBear` kann den Bären optional platzieren (`cx/cy/s`) und liefert die Pfoten-Position (`baer._paws`).

## Zahlen vorher → nachher
| Messung | Hochformat | Querformat |
|---|---|---|
| Aquarium: Anteil vom Bären verdeckt (Fische, Futter, Blasen, Deko; 10 s Füttern) | **93,3 % → 0,0 %** | **87,7 % → 0,0 %** |
| davon Fische | 81,7 % → 0,0 % | 69,4 % → 0,0 % |
| davon Futter | 99,5 % → 0,0 % | 98,2 % → 0,0 % |
| davon Deko (Schiff/Schatzkiste) | 100 % → 0,0 % | 100 % → 0,0 % |
| Zirkus: Start/Landung der Bälle | fest y=360, Pfoten lagen bei y≈474 | an den Pfoten (y≈424) |
| Zirkus: Bilder mit sich berührenden Bällen (3 Bälle) | – → 0 % (Mindestabstand 55 bei Ball-Ø 46) | 0 % |
| Bildrate Aquarium (ungebremst, relativ) | 536 → 537 | 545 → 542 |
| Bildrate Zirkus (ungebremst, relativ) | 541 → 547 | 554 → 540 |

Schwankung der Bildraten-Messung ±3 %: keine Verschlechterung. Hinweis: Headless-Chrome läuft auf dem Mac mini zurzeit nur mit
~11 Bildern/s, auch bei einer leeren Seite (Umgebung, nicht das Spiel). Deshalb wurde mit `--novsync` (ungebremst) verglichen.

## Tests
- `node tools/visual-check.mjs … --only=stations` hoch + quer: **0 Fehler**, 0 zu kleine Knöpfe.
- Kompletter Durchlauf (alle 24 Stationen per Tippen + Finale) hoch + quer: **0 Fehler**.
  Das Skript meldet „Pusten-Knopf nicht gefunden“. Das liegt am Timing im Prüfskript und kommt auf dem alten Stand genauso vor.
- Neuer Prüfmodus `--only=r19`: Verdeckungsmessung Aquarium, Ballbahnen Zirkus, Serienbilder.
- Alle Screenshots habe ich selbst angesehen: Fische, Futter, Schiff und Schatzkiste sind frei sichtbar, die Bälle liegen in den Pfoten, nichts ist abgeschnitten.

## Screenshots (lokal, nicht im Git)
`~/dev/baeren-beautysalon/shots/r19/`
- `vorher-hoch/`, `vorher-quer/`: alter Stand
- `r19-hoch/`, `r19-quer/`: `aq-01…04` (Schiff, Füttern, Schatzkiste), `zi-1ball-1…6`, `zi-2ball-…`, `zi-3ball-…` (Serien à 160 ms),
  `burst-1ball.png`, `burst-2ball.png` und `burst-3ball.png` als Übersicht
- `stationen-hoch/`, `stationen-quer/`, `flow/`, `flow--land/`: alle Stationen

## Handy-Hinweis
Auf dem Handy die Seite **einmal neu laden** (bei Android-Chrome notfalls Tab schließen und neu öffnen). Dann lädt Version `v=19`.
