# short-links Specification

## Purpose

Weiterleitung von Kurzlinks `/~{code}` auf die gespeicherte Ziel-URL durch den Cloudflare Worker `url-shortener`. Ist-Zustand zu Commit `65d71f9b03ba7500de9fc79595dcc7c61bb4fd70` (Landscape-Inventur 2026-09-27); Fundstellen `[datei:zeile]` beziehen sich auf diesen Commit.

## Requirements

### Requirement: Weiterleitung per Kurzcode
Das System SHALL eine GET-Anfrage auf einen Pfad, der mit `/~` beginnt, mit einer permanenten Weiterleitung (HTTP 301) auf die im KV-Namespace `URLS` unter dem Code gespeicherte URL beantworten [worker/src/index.ts:127-134; worker/wrangler.toml:12-13].

#### Scenario: Bekannter Code
- **WHEN** ein Browser `GET https://ecke.lt/~au5H` aufruft und in `URLS` ein Eintrag `au5H` existiert
- **THEN** antwortet der Worker mit 301 und `Location` = gespeicherte URL [worker/src/index.ts:129-133]

#### Scenario: Unbekannter oder leerer Code
- **WHEN** der Code nach `/~` leer ist oder in `URLS` fehlt
- **THEN** antwortet der Worker mit 404 und dem Text `Not found` [worker/src/index.ts:130-132]

### Requirement: Erreichbarkeit über Route und Custom Domain
Das System SHALL Kurzlinks über die Route `ecke.lt/~*` der Zone `ecke.lt` und zusätzlich über die Custom Domain `kurz.ecke.lt` annehmen [worker/wrangler.toml:18-24; landscape:inventory/raw/cloudflare.yaml:66-68].

#### Scenario: Aufruf über ecke.lt
- **WHEN** eine Anfrage auf `https://ecke.lt/~{code}` eingeht
- **THEN** leitet Cloudflare sie an den Worker `url-shortener` weiter [worker/wrangler.toml:18-20; landscape:inventory/overlay.yaml:49-51]

#### Scenario: Aufruf über andere Hosts der Zone
- **WHEN** eine Anfrage auf `/~{code}` an einem anderen Host der Zone als `ecke.lt` oder `kurz.ecke.lt` eingeht (z.B. `www.ecke.lt`, `book.ecke.lt`)
- **THEN** ist der Worker `url-shortener` nicht beteiligt; die Route gilt nur für den Apex `ecke.lt` [worker/wrangler.toml:18-20]

#### Scenario: Andere Pfade auf ecke.lt
- **WHEN** eine Anfrage auf `https://ecke.lt/` oder einen Pfad ohne `/~` eingeht
- **THEN** ist der Worker nicht beteiligt; `/` wird per Zonen-Regel auf nils.ecke.lt umgeleitet, andere Pfade liefern 526 [landscape:inventory/overlay.yaml:80-95]

### Requirement: Sonstige Anfragen
Das System SHALL alle Anfragen, die weder `GET /`, `GET /~…` noch `POST /save` sind, mit 404 `Not found` beantworten [worker/src/index.ts:121-172].

#### Scenario: Unbekannter Pfad auf kurz.ecke.lt
- **WHEN** `GET https://kurz.ecke.lt/Pattern` aufgerufen wird
- **THEN** antwortet der Worker mit 404 [worker/src/index.ts:172]
