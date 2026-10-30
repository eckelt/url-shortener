## MODIFIED Requirements

### Requirement: Worker-Deploy bei Änderungen unter worker/
Das System SHALL bei einem Push auf `main` oder `master`, der Dateien unter `worker/**` ändert, per GitHub Actions die Abhängigkeiten installieren, einen Typcheck und die Tests ausführen und erst danach mit `wrangler deploy` nach Cloudflare Workers deployen.

#### Scenario: Push mit Worker-Änderung
- **WHEN** ein Push auf `master` `worker/src/index.ts` ändert
- **THEN** führt der Workflow `npm ci`, `npm run typecheck`, `npm test` und `npm run deploy` im Ordner `worker` aus und authentifiziert sich mit den GitHub-Secrets `CLOUDFLARE_API_TOKEN` und `CLOUDFLARE_ACCOUNT_ID`

#### Scenario: Push ohne Worker-Änderung
- **WHEN** ein Push nur Dateien außerhalb von `worker/**` ändert (z.B. `openspec/**`, `twin.json`)
- **THEN** startet kein Worker-Deploy
