# ADRs nachtragen

## Warum
Architekturentscheidungen stehen bisher als Prosa in archivierten Changes. Seit `entscheidungen-im-modell` liegen sie als ADR-Dateien im Repo des Systems und hängen per `adrs[]` an den Knoten. Gesamtliste mit allen Repos und den nicht aufgenommenen Kandidaten: ecke-lt-landscape `openspec/changes/adrs-nachtragen/proposal.md`.

## Was
| id | Titel | Knoten | Quelle |
|---|---|---|---|
| `2026-09-01-alle-apps-nutzen-design-system` | Alle ecke.lt-Apps nutzen das Design-System zur Laufzeit (übergreifend, je Repo eine Datei mit gleicher id) | `worker` | Anmerkung des Inhabers 2026-10-19; Design-System README, Commit `a4bb5f0` |

Auf Anmerkung des Inhabers (2026-10-19) ersetzt die übergreifende Entscheidung die Einzel-ADR `2026-10-17-url-shortener-nutzt-design-system`; die Varianten a/b (Eingabefeld lokal oder als Atom im Design-System) stehen dort als Repo-Abschnitt in den Folgen.

## Auswirkungen
- `docs/adr/2026-09-01-alle-apps-nutzen-design-system.md`, `twin.json` (`adrs[]` an `worker`). Kein Code, keine Spec.
