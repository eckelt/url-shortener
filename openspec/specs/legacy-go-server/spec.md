# legacy-go-server Specification

## Purpose

Der aus `jhaals/url-shortener` geerbte und 2020–2022 erweiterte Go-Server mit SQLite, ausgeliefert als Docker-Image. Die Requirements beschreiben, was der Code tut; ob er irgendwo läuft, ist **unbekannt** und nicht Teil dieser Aussagen [landscape:inventory/overlay.yaml:194-195; README.md:143-146]. Ist-Zustand zu Commit `65d71f9b03ba7500de9fc79595dcc7c61bb4fd70` (Landscape-Inventur 2026-09-27); Fundstellen `[datei:zeile]` beziehen sich auf diesen Commit.

## Requirements

### Requirement: Start und Konfiguration
Das System SHALL beim Start die Umgebungsvariablen `BASE_URL` und `DB_PATH` verlangen, die SQLite-Datei `<DB_PATH>/db.sqlite` mit Tabelle `urls(id, code, url)` anlegen und auf Port 1337 lauschen [url-shortener.go:96-107; url-shortener.go:137-138; database.go:59-70].

#### Scenario: Fehlende Variable
- **WHEN** `BASE_URL` oder `DB_PATH` fehlt
- **THEN** beendet sich der Prozess mit einer Fehlermeldung [url-shortener.go:98-103]

#### Scenario: Docker-Image
- **WHEN** das Image aus dem `Dockerfile` gestartet wird
- **THEN** läuft das statisch gelinkte Binary `url-shortener-app` in einem `scratch`-Image mit CA-Zertifikaten und `sca1b.crt`, Port 1337 [Dockerfile:4-31]

### Requirement: Kürzen und Weiterleiten
Das System SHALL auf `POST /save` `{url, code?}` annehmen, die URL mit `govalidator.IsURL` prüfen, bei Codes unter zwei Zeichen die ersten 4 Hex-Zeichen des SHA-256 der URL verwenden, in SQLite speichern und `{url, code, error}` mit `url` = `BASE_URL` + Code zurückgeben; auf `GET /{code}` SHALL es mit 308 auf die gespeicherte URL weiterleiten [url-shortener.go:34-38; url-shortener.go:52-94; url-shortener.go:118-135].

#### Scenario: Unbekannter Code
- **WHEN** `GET /{code}` für einen nicht gespeicherten Code aufgerufen wird
- **THEN** antwortet der Server mit 404 `{"error": "No such URL"}` [url-shortener.go:54-58]

#### Scenario: Kein Token-Schutz
- **WHEN** ein beliebiger Client `POST /save` aufruft
- **THEN** speichert der Server ohne Authentifizierung [url-shortener.go:119-122; url-shortener.go:63-94]

### Requirement: Statische Oberfläche
Das System SHALL die Dateien aus `public/` unter `/` und `/static/` ausliefern; `public/index.html` sendet Kürz-Anfragen fest an `https://kurz.ecke.lt/save` [url-shortener.go:123; url-shortener.go:136; public/index.html:31-42].

#### Scenario: Oberfläche aufrufen
- **WHEN** ein Browser `/` des Go-Servers öffnet
- **THEN** erhält er `public/index.html`, das `bonsai.css` von unpkg.com und ein Hintergrundbild von `https://kurz.ecke.lt/Pattern` lädt [public/index.html:7; public/index.html:14]

### Requirement: IFTTT-Benachrichtigung
Das System SHALL, wenn `TRIGGER` und `TOKEN` gesetzt sind, beim Start und bei jedem Aufruf eines Codes, der mit einem Großbuchstaben beginnt, einen IFTTT-Webhook `https://maker.ifttt.com/trigger/<TRIGGER>/with/key/<TOKEN>` aufrufen [url-shortener.go:40-50; url-shortener.go:109-132].

#### Scenario: Aufruf mit Großbuchstaben-Code
- **WHEN** `TRIGGER` und `TOKEN` gesetzt sind und `GET /Abcd` aufgerufen wird
- **THEN** sendet der Server `{"value1": "Abcd"}` an den Webhook und leitet danach weiter [url-shortener.go:42-45; url-shortener.go:124-134]

#### Scenario: Keine IFTTT-Variablen
- **WHEN** `TRIGGER` oder `TOKEN` fehlt
- **THEN** protokolliert der Server nur einen Hinweis und sendet nichts [url-shortener.go:111-112; url-shortener.go:128-129]
