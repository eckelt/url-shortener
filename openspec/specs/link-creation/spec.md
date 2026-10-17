# link-creation Specification

## Purpose

Anlegen von Kurzlinks über die API `POST /save` und die Web-Oberfläche unter `https://kurz.ecke.lt/`. Ist-Zustand zu Commit `65d71f9b03ba7500de9fc79595dcc7c61bb4fd70` (Landscape-Inventur 2026-09-27); Fundstellen `[datei:zeile]` beziehen sich auf diesen Commit.

## Requirements

### Requirement: Kürz-API
Das System SHALL auf `POST /save` einen JSON-Body `{url, code?}` annehmen, den Eintrag `code → url` im KV-Namespace `URLS` speichern und JSON `{url, code, error}` zurückgeben, wobei `url` = `BASE_URL` + `/~` + Code ist [worker/src/index.ts:169-203; worker/wrangler.toml:5-6].

#### Scenario: Erfolgreiches Kürzen
- **WHEN** ein berechtigter Client `{"url": "https://example.com/lang"}` an `https://kurz.ecke.lt/save` sendet
- **THEN** antwortet der Worker mit 200 und z.B. `{"url": "https://ecke.lt/~c2WD", "code": "~c2WD", "error": ""}` [worker/src/index.ts:199-202; README.md:100-112]

#### Scenario: Ungültiger Body
- **WHEN** der Body kein gültiges JSON ist
- **THEN** antwortet der Worker mit 400 `{"error": "Invalid JSON"}` [worker/src/index.ts:178-183]

#### Scenario: Ungültige URL
- **WHEN** `url` fehlt oder kein `http:`/`https:`-URL ist
- **THEN** antwortet der Worker mit 400 `{"error": "Not a valid URL"}` [worker/src/index.ts:25-32; worker/src/index.ts:185-187]

#### Scenario: Basis-URL ohne Variable
- **WHEN** `BASE_URL` nicht gesetzt ist
- **THEN** bildet der Worker die Kurz-URL aus dem Host der Anfrage [worker/src/index.ts:201]

### Requirement: Token-Schutz
Das System SHALL `POST /save` nur mit dem Header `Authorization: Bearer <AUTH_TOKEN>` annehmen, sofern das Secret `AUTH_TOKEN` gesetzt ist; live ist es gesetzt [worker/src/index.ts:171-176; landscape:inventory/raw/cloudflare.yaml:71-72].

#### Scenario: Falsches oder fehlendes Token
- **WHEN** `AUTH_TOKEN` gesetzt ist und der Header fehlt oder abweicht
- **THEN** antwortet der Worker mit 401 `{"error": "Unauthorized"}` [worker/src/index.ts:172-175]

#### Scenario: Kein Secret gesetzt
- **WHEN** `AUTH_TOKEN` nicht gesetzt ist
- **THEN** nimmt der Worker jede Anfrage ohne Prüfung an [worker/src/index.ts:171]

### Requirement: Code-Vergabe
Das System SHALL einen Wunschcode ab zwei Zeichen übernehmen und sonst die ersten 4 Hex-Zeichen des SHA-256 der URL verwenden; ist der Code schon mit einer anderen URL belegt, SHALL es stattdessen einen zufälligen 4-stelligen Code aus `a-zA-Z0-9` verwenden [worker/src/index.ts:7-23; worker/src/index.ts:189-197].

#### Scenario: Gleiche URL erneut
- **WHEN** eine bereits gespeicherte URL ohne Wunschcode erneut gekürzt wird
- **THEN** ergibt sich derselbe Hash-Code und der Eintrag wird mit demselben Wert überschrieben [worker/src/index.ts:189-199]

#### Scenario: Kollision
- **WHEN** der Hash- oder Wunschcode schon auf eine andere URL zeigt
- **THEN** speichert der Worker unter einem Zufallscode, ohne diesen erneut auf Belegung zu prüfen, und meldet keinen Fehler [worker/src/index.ts:193-202]

### Requirement: Web-Oberfläche
Das System SHALL auf `GET /` eine HTML-Seite mit den Feldern URL, Code und Token ausliefern, die per `fetch('/save')` kürzt und das Ergebnis mit Kopier-Knopf anzeigt [worker/src/index.ts:41-146]. Die Seite bindet `https://ecke-design-system.pages.dev/v1/styles.css` (`ecke-design-system:styles@1`) ein und lädt kein Stylesheet von Dritten; Knöpfe nutzen die Button-Komponente des Design-Systems, Labels und Eingabefelder stylt die Seite selbst ausschließlich mit Tokens (`var(--…)`) des Design-Systems [worker/src/index.ts:46-91].

#### Scenario: Aufruf der Oberfläche
- **WHEN** ein Browser `https://kurz.ecke.lt/` öffnet
- **THEN** liefert der Worker die Seite mit `Content-Type: text/html;charset=UTF-8` [worker/src/index.ts:153-158; worker/wrangler.toml:22-24]

#### Scenario: Kürzen über die Oberfläche
- **WHEN** der Nutzer URL und Token einträgt und „Kürzen“ klickt
- **THEN** sendet die Seite `POST /save` mit `Authorization: Bearer <Token>` und zeigt `url` oder `error` der Antwort an [worker/src/index.ts:120-139]

#### Scenario: Optik aus dem Design-System
- **WHEN** die Seite geladen wird
- **THEN** stammen Schrift, Farben und Abstände aus `ecke-design-system:styles@1`, es gibt keinen Verweis auf unpkg.com, und die Seite folgt hellem und dunklem Farbschema des Design-Systems [worker/src/index.ts:46]
