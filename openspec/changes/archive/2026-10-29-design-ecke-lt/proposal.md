# Design-System unter design.ecke.lt einbinden

## Warum
Teil des Landscape-Changes `design-ecke-lt` (Wunsch des Inhabers, Chat 2026-10-19): Das Design-System bekommt die eigene Adresse `design.ecke.lt` (Entscheidung `2026-10-19-design-ecke-lt`). url-shortener bindet es heute von `https://ecke-design-system.pages.dev/v1/` ein und stellt auf die neue Adresse um.

## Was
Jede Fundstelle der alten Adresse wird durch `design.ecke.lt` ersetzt (nur Host, Pfad `/v1/...` unverändert). CSP-Header, `_headers` oder Font-Preloads mit der Adresse gibt es in url-shortener nicht.

| Datei | Zeilen | Art |
|---|---|---|
| `docs/adr/2026-09-01-alle-apps-nutzen-design-system.md` | 10, 15 | ADR 2026-09-01: Text bleibt, Folge-Zeile ergänzen |
| `openspec/specs/link-creation/spec.md` | 51 | Dokumentation/Spec |
| `worker/src/index.ts` | 46 | Code |

- Archivierte Changes und der Text der ADR `2026-09-01-alle-apps-nutzen-design-system` bleiben als Zeitdokument stehen; die ADR bekommt nur unter „Folgen“ eine Zeile mit Verweis auf `2026-10-19-design-ecke-lt`.
- Soll-`twin.json`: Fundstellen-Summaries mit der neuen Adresse (wo dort eine Adresse steht) und die neue Entscheidung `docs/adr/2026-10-19-design-ecke-lt.md` in `adrs[]` des Knotens, der das Design-System nutzt.
- Neue ADR `docs/adr/2026-10-19-design-ecke-lt.md` (Status `vorgeschlagen`, gleiche id wie in den anderen Repos).

## Auswirkungen
- **Reihenfolge:** Erst wenn `https://design.ecke.lt/v1/styles.css` live antwortet (Deploy von ecke-design-system grün, dessen Live-Prüfung auf der neuen Adresse), wird umgestellt. Davor bleibt die alte Adresse maßgeblich; danach bleibt sie als Übergang erreichbar, ein Zwischenzustand bricht also nichts.
- Deploy: der Worker deployt bei Änderung an `worker/**` per Workflow; ein Push auf `master` baut zusätzlich das veraltete Docker-Image (B12). Die Spec-Dateien lösen den Worker-Deploy nicht aus.
- Nutzer sehen keinen Unterschied: gleiche Dateien, gleiche Header (CORS offen, 5 min Cache); der Browser lädt von einem neuen Host, der erste Aufruf braucht eine neue TLS-Verbindung.
- Spec-Änderungen: die genannten Dateien unter `openspec/specs/` und `openspec/project.md` ziehen mit (Deltas schreibt das Gewerk bei `approve`).

## Berührung mit offenen Changes
`weitere-ablaeufe` (untracked, Ablauf-Soll in `twin.json`): Dessen Dateien bleiben unberührt. Berührung nur über `twin.json` (beide Changes ändern das Root-Manifest beim Archivieren) und `openspec/specs/`.

## Alternativen
Siehe `docs/adr/2026-10-19-design-ecke-lt.md` (Optionen: pages.dev behalten, Custom Domain auf Pages, Worker, Unterpfad unter ecke.lt). Gewählt ist die Custom Domain auf Pages.
