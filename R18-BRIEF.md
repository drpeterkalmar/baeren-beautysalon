# R18: Renderer-Neubau — Brief für Opus (Chef-Session)

## Mission
Du baust den Renderer des Bären-Beautysalons VON 0. Nicht verbessern — neu bauen. Der alte Look (gescribbelte Fell-Striche, Stachel-Kanten, MS-Paint-Niveau) ist verworfen. Zielqualität: moderne Kawaii-Casual-Games (Toca Boca / Dr. Panda Niveau): weiches, plastisches Fell, weiche Schatten, warme Lichtführung.

## Ausgangslage (Branch `neubau`)
Vorhanden und UNVERÄNDERT zu lassen:
- `salon.js` — Spiel-Flow: Stationen (Waschen→Föhnen→Schneiden→Massage→Spa→Schmücken), 37 Bären-Modelle (Art.MODELS-Daten: Namen, Farben, Muster-Flags), UI-Buttons, Save-Logik
- `game.js` — Loop, Kamera, Raum-Cache, Licht/Grading, DPR-Handling
- `index.html`, `music.js`, `README.md`

Nicht vorhanden (löschen/neu bauen): art.js, ui.js, fx.js, room.js, sfx.js — du schreibst sie neu. Die Schnittstellen, die salon.js/game.js erwarten (`window.BSArt`, `window.BSUI`, `window.BSFx`, `window.BSRoom`, `window.BSSfx`, `Art.react`, `Fx.P.emit`), MUSST du mit denselben Signaturen bedienen — lies sie aus salon.js/game.js heraus.

## Rollen & Delegation (empirisch fundiert)
- **Du arbeitest SOLO, solange es sich lohnt.** Multi-Agent-Orchestrierung verliert bei zusammenhängendem Coding gegen konzentrierte Solo-Arbeit (Benchmark-Evidenz: Opus solo 97/100 schlug jede erzwungene Opus+Executor-Kombi in Qualität UND Zeit). Delegiere NICHT pro forma.
- **Delegiere freiwillig nur bei unabhängigen Teilaufgaben**, die parallelisierbar sind ohne gegenseitige Abhängigkeit (z.B. 6 Stations-Views nach fixer Spec nebeneinander, 37 Modell-Renderfunktionen nach gemeinsamem Interface). Nutze dafür Subagents mit `model: sonnet` (Definition via `.claude/agents/*.md` oder `--agents`).
- **Niemals delegieren:** Renderer-Kern, Schnittstellen-Design, Akzeptanz-Bewertung — das bleibt in deiner Hand.
- **Quota-Bewusstsein:** Das 5h-Fenster ist der Engpass. Halte Kontext kompakt, vermeide Wiederholungs-Lesevorgänge, committe früh und oft (jede stabile Iteration = eigener Commit). Wenn das Fenster endet: sauber committen, stehen lassen.
## Architektur-Pflichten (unverändert)
1. **Offscreen-Rendering Pflicht:** Fell-Textur/-Noise wird EINMAL in Offscreen-Canvases gebacken (pro Modell), nicht pro Frame gestrichelt. Layer-Compositing statt Einzelstriche.
2. **Weiche Formen:** radialGradient-Stapel für Volumen, Silhouetten ohne harte Zacken. Keine Schraffur-Optik.
3. **Android-First:** Touch-Zonen ≥48px, dvh statt vh, DPR-Cap 2, Audio-Geste-Entsperren, 60 FPS auf Mittelklasse-Snapdragon, kein Back-Gesture-Abfangen. Alles 100 % prozedural, keine externen Assets (Pflicht bleibt).
4. **37 Modelle identitätsbewahrt:** Farben/Muster aus salon.js Art.MODELS übernehmen — nur Rendering-Qualität ändert sich.

## Akzeptanzkriterien (CHECKS — schreib sie in CHECKS.md)
- 0 JS-Fehler über den kompletten Playwright-Flow (tools/visual-check.mjs als Vorbild, neu schreiben wo nötig)
- Screenshots aller Stationen: keine Stachel-/Zacken-Silhouetten am Bär, Fell wirkt weich/plastisch, kein Stilbruch zwischen Gesicht und Körper
- 60 FPS im Loop (gemessen, --fps Flag)
- 37 Modelle renderbar, unterscheidbar, keine undefined-Abstürze
- Du schreibst die Kriterien konkret und messbar in CHECKS.md BEVOR du codest — Vision-Loop prüft danach gegen diese Datei, nicht gegen Geschmack.

## Ablauf
1. Lies salon.js/game.js komplett (Schnittstellen-Verträge).
2. Schreibe CHECKS.md + ARCHITECTURE.md (kurz: Datei-Layout, Offscreen-Strategie).
3. Baue den Renderer-Kern selbst (art.js + ui.js). Bei stabilen Meilensteinen sofort committen.
4. Vision-Loop: Screenshots aller Stationen + Modelle, gegen CHECKS.md.
5. Optional bei unabhängigen Teilaufgaben: Sonnet-Subagents parallel (siehe Rollen).
6. Am Fenster-Ende: sauber committen (`git add -A && git commit -m "r18: renderer neubau"`). NICHT pushen.

## Verboten
- Alte art.js-Struktur rüberkopieren ("verbessern" ist explizit nicht die Aufgabe)
- Externe Assets, CDNs, Bild-Downloads
- Änderungen an salon.js/game.js außer Interface-Fixes (dokumentieren wenn doch)