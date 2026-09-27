# deploy Specification

## Purpose

Automatisierung im Repo: Deploy des Cloudflare Workers und der geerbte Docker-Publish-Workflow für den Go-Server. Ist-Zustand zu Commit `65d71f9b03ba7500de9fc79595dcc7c61bb4fd70` (Landscape-Inventur 2026-09-27); Fundstellen `[datei:zeile]` beziehen sich auf diesen Commit.

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
Das System SHALL beim Deploy Worker-Name, Variable `BASE_URL`, KV-Binding `URLS`, die Route `*ecke.lt/~*` und die Custom Domain `kurz.ecke.lt` aus `worker/wrangler.toml` setzen; das Secret `AUTH_TOKEN` wird außerhalb des Repos gesetzt [worker/wrangler.toml:1-24; README.md:38-56].

#### Scenario: Live-Konfiguration
- **WHEN** die Cloudflare-Konfiguration des Workers `url-shortener` abgefragt wird
- **THEN** zeigt sie die Route `*ecke.lt/~*`, die Custom Domain `kurz.ecke.lt`, das Secret `AUTH_TOKEN` und die Bindings `BASE_URL` und `URLS` [landscape:inventory/raw/cloudflare.yaml:66-76]

#### Scenario: Keine Cloudflare-Git-Integration
- **WHEN** geprüft wird, ob Cloudflare selbst aus Git baut (Workers Builds)
- **THEN** ist für `url-shortener` kein Trigger eingerichtet [landscape:inventory/raw/cloudflare.yaml:70; landscape:inventory/raw/cloudflare.yaml:157]

### Requirement: Docker-Publish bei jedem Push auf master
Das System SHALL bei jedem Push auf `master` und bei Tags `v*` die Go-Tests ausführen und danach ein Docker-Image `server` bauen und nach `docker.pkg.github.com/<repository>/server` pushen; bei Pull Requests laufen nur die Tests [.github/workflows/docker-publish.yml:3-17; .github/workflows/docker-publish.yml:22-78].

#### Scenario: Push auf master (beliebige Datei)
- **WHEN** ein beliebiger Commit auf `master` gepusht wird, auch einer, der nur `openspec/**` ändert
- **THEN** laufen `go get -v` und `go test ./...` mit Go 1.15 und anschließend `docker build` und `docker push` mit dem Tag `latest` [.github/workflows/docker-publish.yml:3-7; .github/workflows/docker-publish.yml:22-38; .github/workflows/docker-publish.yml:52-78]

#### Scenario: Tag v1.2.3
- **WHEN** ein Tag `v1.2.3` gepusht wird
- **THEN** wird das Image mit dem Tag `1.2.3` gepusht [.github/workflows/docker-publish.yml:9-11; .github/workflows/docker-publish.yml:65-78]

#### Scenario: Pull Request
- **WHEN** ein Pull Request geöffnet oder aktualisiert wird
- **THEN** laufen nur die Go-Tests, es wird kein Image gepusht [.github/workflows/docker-publish.yml:13-14; .github/workflows/docker-publish.yml:44-47]
