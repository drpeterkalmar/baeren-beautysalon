# Vorlagen r22 – Kurzfassung (nur Mechanik, eigene Worte, eigene Werte)

Runde r22 übernimmt **Spielideen** (keine Texte, keine Bilder, keine Klänge, kein Code, keine Namen) aus gemütlichen
Lebens-Simulationen und Kinder-Spielzeug-Apps. Spielmechanik ist nicht geschützt; alle Zahlen unten sind eigene
Startwerte, bewusst abweichend und kindgerecht (nur Zuwachs, kein Verfall, keine Zeitnot, keine Texte nötig).

| Vorlage | Art des Spiels | übernommene Idee |
|---|---|---|
| A | Lebens-Simulation mit Dorf-Bewohnern | Freundschaft in kleinen Schritten, Deckel, spürbare Schwellen (Geschenk, „bester Freund“), Besucher kommen vorbei, Briefe |
| B | Bauernhof-Lebens-Simulation | Herz-Anzeige (Punkte je Herz), Vorlieben (geliebt ≈ doppelt), Geburtstag als besonderer Tag |
| C | Spielzeug-Apps für Kinder | „Spielen statt Gewinnen“: keine Punkte zum Verlieren, kein Zeitlimit, kein „falsch“ |
| D | Haustier-Simulation | jede Berührung bekommt sofort eine Antwort; mehrfach antippen = Kichern |
| E | Koch-Minispiele | kurze Häppchen, Misslungenes wird „gerettet“ statt bestraft (drei Sterne bleiben immer) |
| F | Restaurant-Spiel mit Gästen | Gast mit Wunsch-Blase – hier **ohne** Geduld-Anzeige und ohne Ablauf |
| G | Party-Brettspiel | kleine Bonus-Auszeichnung am Schluss, die jede:r bekommen kann |

## Übertragung (Arbeitsliste r22)

| Mechanik | Startwert | Regler |
|---|---|---|
| Kundenbesuch (Türglocke, Bär läuft herein, Wunsch-Blase mit Symbolen) | 2 Wünsche, ab 3 Herzen 3; Einlauf 1,2 s, Tipp überspringt | `?kunden=0/1`, `?wunsch=2` |
| Wunsch erfüllt | Häkchen, Freu-Hüpfer, Herz-Puff, Glockenspiel | – |
| Freundschaft je Bärenmodell | 5 Herzen à 20 Punkte, Deckel 100; Besuch +2, Wunsch +3, Foto +2, Finale +2 | `?herz=20`, `?freund=0/1` |
| Vorlieben (Lieblings-Station, -Duft, -Farbe) | Lieblings-Wunsch ×2 + großer Jubel; „mag nicht“ gibt es nicht | `?vorliebe=2` |
| Schwellen | Herz 1 winkt · Herz 3 bringt ein Geschenk · Herz 5 „beste Freunde“ und kommt angerannt | – |
| Geburtstag | fester Tag je Bär (aus dem Namen), an dem Tag ×3, Geburtstags-Station als erster Wunsch | `?geburtstag=3` |
| Sammelalbum | je Bär 5 Felder (eins je Herz) = 185, Fotos 4 → 12 | `?album=12` |
| Bild-Postkarte | nach dem Besuch beim nächsten Start, ab Herz 3 mit Geschenk | `?karte=0/1` |
| Kitzeln | 3 Tipper auf den Bären in ≤ 1,2 s → Kichern + Hüpfer, 2 s Pause | `?kitzel=0/1` |
| Haptik | 35 ms TA-DA, 30-60-30 ms neues Herz, 40 ms Geschenk; Abstand ≥ 1,5 s, ≤ 4 je Besuch | `?haptik=0` |
| Pokal | 1 von 6 Mini-Pokalen nach dem Finale (meistgenutzte Station) | `?pokal=0/1` |
| Tageszeit + Gast des Tages | Licht passend zur Uhr (Tag/Abend/Nacht), täglich ein besonderer Gast mit Extra-Stempel | `?zeit=passend/tag/abend/nacht`, `?tag=JJJJMMTT` |

**Bewusst weggelassen:** Verfall der Freundschaft, Abzüge bei Ablehnen/Fehlern, „mag ich nicht“-Reaktionen,
Geduld-Anzeige/Zeitdruck. Wartebank (Wirkung 2, keine Etappe) bleibt für später.

Alle Werte stehen in **einer** Parametergruppe (`BSKunden.P` in `kunden.js`); jeder Regler auf `0` (bzw. `?zeit=tag`)
ergibt das Verhalten vor r22.
