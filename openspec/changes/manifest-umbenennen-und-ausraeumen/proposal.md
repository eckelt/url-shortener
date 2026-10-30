# Manifest heißt architecture.json und enthält nur Architektur

Teil des Landscape-Changes `manifest-umbenennen-und-ausraeumen` (Proposal, Fragen und ADR dort). Das Manifest heißt künftig `architecture.json` und trägt nur Architektur; Betrieb und Fundstellen liest die Landscape aus den Werkzeugen bzw. aus den Tests.

## Warum
Das `twin.json` mischt Architektur, Betrieb (`deployment`, Pipelines, `deploys-to`) und Fundstellen (`evidence`). Entscheidung: ADR `2026-10-29-wahrheiten-mit-eigenem-scope` im Landscape-Repo.

## Was
- `twin.json` → `architecture.json` (`schemaVersion: 5`), ausgeräumt: `evidence`, `deployment`, `asOf`, `managed`, Container `deploy-worker` (Pipeline), Schnittstelle `worker#workers-runtime` (`deploys-to`).
- Neu: `worker` nennt `runtime: "workers/url-shortener"`.
- Die Spec `deploy` nennt `twin.json` nur als Beispiel einer Datei außerhalb von `worker/**`; die Aussage bleibt wahr, die Spec bleibt unverändert.
- `.gitattributes`: `architecture.json merge=manifest-json` (die alte Zeile bleibt in der Übergangszeit).
- Das Soll auf diesem Branch ist noch das ausgeräumte `twin.json` (v4), damit die laufende Werkbank das Delta zeigt. Umbenennen, `schemaVersion: 5` und `runtime` setzt das Gewerk mit `scripts/manifest-umstellen` des Landscape-Repos um, erst nachdem dessen Werkzeug-Schritt live ist.

## Auswirkungen
- Kein Code, kein Deploy-Pfad betroffen (`architecture.json` liegt außerhalb der Deploy-Pfadfilter).
- Umsetzung: Schritt 2 im Proposal des Landscape-Repos, ein Commit in diesem Repo.
