# link-creation Specification

## Purpose

Anlegen von Kurzlinks über die API `POST /save` und die Web-Oberfläche unter `https://kurz.ecke.lt/`. Ist-Zustand zu Commit `65d71f9b03ba7500de9fc79595dcc7c61bb4fd70` (Landscape-Inventur 2026-09-27); Fundstellen `[datei:zeile]` beziehen sich auf diesen Commit.

## Requirements

### Requirement: Kürz-API
Das System SHALL auf `POST /save` einen JSON-Body `{url, code?}` annehmen, den Eintrag `CODE → url` (Schlüssel großgeschrieben) im KV-Namespace `URLS` speichern und JSON `{url, qrUrl, code, error}` zurückgeben: `code` ohne `~` in der eingegebenen Schreibweise (vergebene Codes groß), `url` = `BASE_URL` + `/` + `code`, `qrUrl` = `url` ganz großgeschrieben.

#### Scenario: Erfolgreiches Kürzen
- **WHEN** ein berechtigter Client `{"url": "https://example.com/lang"}` an `https://kurz.ecke.lt/save` sendet
- **THEN** antwortet der Worker mit 200 und z.B. `{"url": "https://ecke.lt/C2D4", "qrUrl": "HTTPS://ECKE.LT/C2D4", "code": "C2D4", "error": ""}`

#### Scenario: Wunschcode in eigener Schreibweise
- **WHEN** ein berechtigter Client `{"url": "https://example.com", "code": "Hallo"}` sendet und `HALLO` frei ist
- **THEN** speichert der Worker unter `HALLO` und antwortet mit `url` = `https://ecke.lt/Hallo`, `qrUrl` = `HTTPS://ECKE.LT/HALLO`, `code` = `Hallo`

#### Scenario: Ungültiger Body
- **WHEN** der Body kein gültiges JSON ist
- **THEN** antwortet der Worker mit 400 `{"error": "Invalid JSON"}`

#### Scenario: Ungültige URL
- **WHEN** `url` fehlt oder kein `http:`/`https:`-URL ist
- **THEN** antwortet der Worker mit 400 `{"error": "Not a valid URL"}`

#### Scenario: Basis-URL ohne Variable
- **WHEN** `BASE_URL` nicht gesetzt ist
- **THEN** bildet der Worker die Kurz-URL aus dem Host der Anfrage

### Requirement: Token-Schutz
Das System SHALL `POST /save` nur mit dem Header `Authorization: Bearer <AUTH_TOKEN>` annehmen, sofern das Secret `AUTH_TOKEN` gesetzt ist; live ist es gesetzt [worker/src/index.ts:221-226; landscape:inventory/raw/cloudflare.yaml:71-72].

#### Scenario: Falsches oder fehlendes Token
- **WHEN** `AUTH_TOKEN` gesetzt ist und der Header fehlt oder abweicht
- **THEN** antwortet der Worker mit 401 `{"error": "Unauthorized"}` [worker/src/index.ts:222-225]

#### Scenario: Kein Secret gesetzt
- **WHEN** `AUTH_TOKEN` nicht gesetzt ist
- **THEN** nimmt der Worker jede Anfrage ohne Prüfung an [worker/src/index.ts:221]

### Requirement: Code-Vergabe
Das System SHALL nur Codes aus `0-9A-Z` mit mindestens einem Buchstaben vergeben. Ein Wunschcode muss `[A-Za-z0-9]{2,32}` mit einem Buchstaben sein und darf großgeschrieben nicht auf der Liste reservierter Wörter stehen (mindestens `SAVE`). Ohne Wunschcode gilt der Hash-Code (erste 4 Hex-Zeichen des SHA-256, groß); ist er belegt oder nur Ziffern, ein erneut geprüfter Zufallscode.

#### Scenario: Gleiche URL erneut
- **WHEN** eine bereits gespeicherte URL ohne Wunschcode erneut gekürzt wird
- **THEN** ergibt sich derselbe Hash-Code und der Eintrag wird mit demselben Wert überschrieben

#### Scenario: Wunschcode belegt
- **WHEN** der Wunschcode in eingegebener oder großgeschriebener Schreibweise schon auf eine andere URL zeigt
- **THEN** antwortet der Worker mit 409 `{"error": "Code belegt"}` und speichert nichts

#### Scenario: Wunschcode ungültig oder reserviert
- **WHEN** der Wunschcode Zeichen außerhalb von `0-9A-Za-z` enthält, kürzer als 2 oder länger als 32 Zeichen ist, nur aus Ziffern besteht (z.B. `2026`) oder großgeschrieben reserviert ist (z.B. `save`)
- **THEN** antwortet der Worker mit 400 `{"error": "Ungültiger Code"}` und speichert nichts

#### Scenario: Hash-Code nur aus Ziffern
- **WHEN** die ersten 4 Hex-Zeichen des Hashes nur Ziffern sind (z.B. `4711`)
- **THEN** speichert der Worker unter einem freien Zufallscode aus `0-9A-Z` mit mindestens einem Buchstaben

#### Scenario: Kollision
- **WHEN** der Hash-Code schon auf eine andere URL zeigt
- **THEN** speichert der Worker unter einem freien Zufallscode aus `0-9A-Z` und meldet keinen Fehler; ein belegter Wunschcode ergibt dagegen 409 (siehe oben)

### Requirement: Web-Oberfläche
Das System SHALL auf `GET /` eine HTML-Seite mit den Feldern URL, Code und Token ausliefern, die per `fetch('/save')` kürzt und das Ergebnis in zwei Zeilen mit je einem Kopier-Knopf zeigt: „Zum Teilen“ (`url`) und „Für QR-Codes“ (`qrUrl`). Die Seite nutzt `https://design.ecke.lt/v1/styles.css` (`ecke-design-system:styles@1`), kein Stylesheet von Dritten, und stylt eigene Elemente nur mit Tokens (`var(--…)`).

#### Scenario: Aufruf der Oberfläche
- **WHEN** ein Browser `https://kurz.ecke.lt/` öffnet
- **THEN** liefert der Worker die Seite mit `Content-Type: text/html;charset=UTF-8`

#### Scenario: Kürzen über die Oberfläche
- **WHEN** der Nutzer URL und Token einträgt und „Kürzen“ klickt
- **THEN** sendet die Seite `POST /save` mit `Authorization: Bearer <Token>` und zeigt `url` und `qrUrl` oder `error` der Antwort an

#### Scenario: QR-Schreibweise kopieren
- **WHEN** der Nutzer in der Zeile „Für QR-Codes“ auf „Kopieren“ klickt
- **THEN** liegt `qrUrl` (z.B. `HTTPS://ECKE.LT/HALLO`) in der Zwischenablage; „Kopieren“ in „Zum Teilen“ kopiert `url` (Mock `mocks/ergebnis-qr-390.html`)

#### Scenario: Optik aus dem Design-System
- **WHEN** die Seite geladen wird
- **THEN** stammen Schrift, Farben und Abstände aus `ecke-design-system:styles@1`, Knöpfe nutzen dessen Button-Komponente, es gibt keinen Verweis auf unpkg.com, und die Seite folgt hellem und dunklem Farbschema

#### Scenario: Hintergrund
- **WHEN** die Seite im hellen bzw. dunklen Farbschema geladen wird
- **THEN** liegt hinter dem Formular eine nahtlos gekachelte Blumentapete (`/bg-light.webp` bzw. `/bg-dark.webp`, Static Assets des Workers aus `worker/assets/`), und das Formular steht auf einer Karte in `--bg`, damit es lesbar bleibt
