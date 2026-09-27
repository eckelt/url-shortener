# link-creation Specification

## Purpose

Anlegen von Kurzlinks über die API `POST /save` und die Web-Oberfläche unter `https://kurz.ecke.lt/`. Ist-Zustand zu Commit `65d71f9b03ba7500de9fc79595dcc7c61bb4fd70` (Landscape-Inventur 2026-09-27); Fundstellen `[datei:zeile]` beziehen sich auf diesen Commit.

## Requirements

### Requirement: Kürz-API
Das System SHALL auf `POST /save` einen JSON-Body `{url, code?}` annehmen, den Eintrag `code → url` im KV-Namespace `URLS` speichern und JSON `{url, code, error}` zurückgeben, wobei `url` = `BASE_URL` + `/~` + Code ist [worker/src/index.ts:136-170; worker/wrangler.toml:5-6].

#### Scenario: Erfolgreiches Kürzen
- **WHEN** ein berechtigter Client `{"url": "https://example.com/lang"}` an `https://kurz.ecke.lt/save` sendet
- **THEN** antwortet der Worker mit 200 und z.B. `{"url": "https://ecke.lt/~c2WD", "code": "~c2WD", "error": ""}` [worker/src/index.ts:166-169; README.md:100-112]

#### Scenario: Ungültiger Body
- **WHEN** der Body kein gültiges JSON ist
- **THEN** antwortet der Worker mit 400 `{"error": "Invalid JSON"}` [worker/src/index.ts:145-150]

#### Scenario: Ungültige URL
- **WHEN** `url` fehlt oder kein `http:`/`https:`-URL ist
- **THEN** antwortet der Worker mit 400 `{"error": "Not a valid URL"}` [worker/src/index.ts:25-32; worker/src/index.ts:152-154]

#### Scenario: Basis-URL ohne Variable
- **WHEN** `BASE_URL` nicht gesetzt ist
- **THEN** bildet der Worker die Kurz-URL aus dem Host der Anfrage [worker/src/index.ts:168]

### Requirement: Token-Schutz
Das System SHALL `POST /save` nur mit dem Header `Authorization: Bearer <AUTH_TOKEN>` annehmen, sofern das Secret `AUTH_TOKEN` gesetzt ist; live ist es gesetzt [worker/src/index.ts:138-143; landscape:inventory/raw/cloudflare.yaml:71-72].

#### Scenario: Falsches oder fehlendes Token
- **WHEN** `AUTH_TOKEN` gesetzt ist und der Header fehlt oder abweicht
- **THEN** antwortet der Worker mit 401 `{"error": "Unauthorized"}` [worker/src/index.ts:139-142]

#### Scenario: Kein Secret gesetzt
- **WHEN** `AUTH_TOKEN` nicht gesetzt ist
- **THEN** nimmt der Worker jede Anfrage ohne Prüfung an [worker/src/index.ts:138]

### Requirement: Code-Vergabe
Das System SHALL einen Wunschcode ab zwei Zeichen übernehmen und sonst die ersten 4 Hex-Zeichen des SHA-256 der URL verwenden; ist der Code schon mit einer anderen URL belegt, SHALL es stattdessen einen zufälligen 4-stelligen Code aus `a-zA-Z0-9` verwenden [worker/src/index.ts:7-23; worker/src/index.ts:156-164].

#### Scenario: Gleiche URL erneut
- **WHEN** eine bereits gespeicherte URL ohne Wunschcode erneut gekürzt wird
- **THEN** ergibt sich derselbe Hash-Code und der Eintrag wird mit demselben Wert überschrieben [worker/src/index.ts:156-166]

#### Scenario: Kollision
- **WHEN** der Hash- oder Wunschcode schon auf eine andere URL zeigt
- **THEN** speichert der Worker unter einem Zufallscode, ohne diesen erneut auf Belegung zu prüfen, und meldet keinen Fehler [worker/src/index.ts:160-169]

### Requirement: Web-Oberfläche
Das System SHALL auf `GET /` eine HTML-Seite mit den Feldern URL, Code und Token ausliefern, die per `fetch('/save')` kürzt und das Ergebnis mit Kopier-Knopf anzeigt; das Stylesheet `bonsai.css` wird von unpkg.com geladen [worker/src/index.ts:41-125].

#### Scenario: Aufruf der Oberfläche
- **WHEN** ein Browser `https://kurz.ecke.lt/` öffnet
- **THEN** liefert der Worker die Seite mit `Content-Type: text/html;charset=UTF-8` [worker/src/index.ts:121-125; worker/wrangler.toml:22-24]

#### Scenario: Kürzen über die Oberfläche
- **WHEN** der Nutzer URL und Token einträgt und „Kürzen“ klickt
- **THEN** sendet die Seite `POST /save` mit `Authorization: Bearer <Token>` und zeigt `url` oder `error` der Antwort an [worker/src/index.ts:87-106]
