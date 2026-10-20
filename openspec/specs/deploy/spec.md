# deploy Specification

## Purpose

Automatisierung im Repo: Deploy des Cloudflare Workers. Ist-Zustand zu Commit `e0f3491e9382018786f7a25fb2ca9dac8b1aef90` (Landscape-Inventur 2026-09-27, Fundstellen geprüft 2026-10-20); Fundstellen `[datei:zeile]` beziehen sich auf diesen Commit.

**Hinweis (kein Requirement):** Der geerbte Workflow `.github/workflows/docker-publish.yml` läuft weiterhin bei jedem Push auf `master` und bei Tags `v*` (Go-Tests, `docker build`, Push nach `docker.pkg.github.com/<repository>/server`) [.github/workflows/docker-publish.yml:3-17; .github/workflows/docker-publish.yml:22-78]. Er gehört zum Go/Docker-Teil, der Altlast im Repo und nicht in Betrieb ist [Nutzer-Auskunft 2026-09-27]; Entfernung: Landscape-Backlog B12 [landscape:backlog.md:20].

## Requirements

### Requirement: Worker-Deploy bei Änderungen unter worker/
Das System SHALL bei einem Push auf `main` oder `master`, der Dateien unter `worker/**` ändert, per GitHub Actions die Abhängigkeiten installieren, einen Typcheck ausführen und mit `wrangler deploy` nach Cloudflare Workers deployen [.github/workflows/deploy.yml:3-31; worker/package.json:5-9].

#### Scenario: Push mit Worker-Änderung
- **WHEN** ein Push auf `master` `worker/src/index.ts` ändert
- **THEN** führt der Workflow `npm ci`, `npm run typecheck` und `npm run deploy` im Ordner `worker` aus und authentifiziert sich mit den GitHub-Secrets `CLOUDFLARE_API_TOKEN` und `CLOUDFLARE_ACCOUNT_ID` [.github/workflows/deploy.yml:21-34]

#### Scenario: Push ohne Worker-Änderung
- **WHEN** ein Push nur Dateien außerhalb von `worker/**` ändert (z.B. `openspec/**`, `twin.json`)
- **THEN** startet kein Worker-Deploy [.github/workflows/deploy.yml:3-7]

### Requirement: Infrastruktur aus wrangler.toml
Das System SHALL beim Deploy Worker-Name, Variable `BASE_URL`, KV-Binding `URLS`, die Route `ecke.lt/~*`, die Custom Domain `kurz.ecke.lt` und die Static Assets aus `worker/assets` (`[assets]`) aus `worker/wrangler.toml` setzen; das Secret `AUTH_TOKEN` wird außerhalb des Repos gesetzt [worker/wrangler.toml:1-29; README.md:38-56].

#### Scenario: Live-Konfiguration
- **WHEN** die Cloudflare-Konfiguration des Workers `url-shortener` abgefragt wird
- **THEN** zeigt sie die Route `ecke.lt/~*`, die Custom Domain `kurz.ecke.lt`, das Secret `AUTH_TOKEN` und die Bindings `BASE_URL` und `URLS` [landscape:inventory/raw/cloudflare.yaml:66-76]

#### Scenario: Keine Cloudflare-Git-Integration
- **WHEN** geprüft wird, ob Cloudflare selbst aus Git baut (Workers Builds)
- **THEN** ist für `url-shortener` kein Trigger eingerichtet [landscape:inventory/raw/cloudflare.yaml:70; landscape:inventory/raw/cloudflare.yaml:157]

