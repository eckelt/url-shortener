## MODIFIED Requirements

### Requirement: Infrastruktur aus wrangler.toml
Das System SHALL beim Deploy Worker-Name, Variable `BASE_URL`, KV-Binding `URLS`, die Route `ecke.lt/*`, die Custom Domain `kurz.ecke.lt` und die Static Assets aus `worker/assets` (`[assets]`) aus `worker/wrangler.toml` setzen; das Secret `AUTH_TOKEN` wird außerhalb des Repos gesetzt.

#### Scenario: Live-Konfiguration
- **WHEN** die Cloudflare-Konfiguration des Workers `url-shortener` abgefragt wird
- **THEN** zeigt sie die Route `ecke.lt/*` (nicht mehr `ecke.lt/~*`), die Custom Domain `kurz.ecke.lt`, das Secret `AUTH_TOKEN` und die Bindings `BASE_URL` und `URLS`

#### Scenario: Keine Cloudflare-Git-Integration
- **WHEN** geprüft wird, ob Cloudflare selbst aus Git baut (Workers Builds)
- **THEN** ist für `url-shortener` kein Trigger eingerichtet
