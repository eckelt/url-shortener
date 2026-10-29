# short-links Specification

## Purpose

Weiterleitung von Kurzlinks `ecke.lt/{CODE}` (alt `/~{code}`) auf die gespeicherte Ziel-URL durch den Cloudflare Worker `url-shortener`. Ist-Zustand zu Commit `65d71f9b03ba7500de9fc79595dcc7c61bb4fd70` (Landscape-Inventur 2026-09-27); Fundstellen `[datei:zeile]` beziehen sich auf diesen Commit.

## Requirements

### Requirement: Weiterleitung per Kurzcode
Das System SHALL eine GET-Anfrage auf `/~{code}` wie `/{code}` behandeln: `~` wird entfernt, der Rest zuerst exakt, dann großgeschrieben in `URLS` gesucht und bei Treffer mit 301 weitergeleitet, auch wenn der alte Code andere Zeichen als Buchstaben und Ziffern enthält. Die Form wird nicht mehr erzeugt, alte Links bleiben gültig.

#### Scenario: Bekannter Code
- **WHEN** ein Browser `GET https://ecke.lt/~au5H` aufruft und in `URLS` ein Eintrag `au5H` existiert
- **THEN** antwortet der Worker mit 301 und `Location` = gespeicherte URL

#### Scenario: Neuer Code mit Tilde
- **WHEN** `GET https://ecke.lt/~hallo` aufgerufen wird und `HALLO` existiert
- **THEN** antwortet der Worker mit 301 auf die URL von `HALLO`

#### Scenario: Alter Wunschcode mit Bindestrich
- **WHEN** `GET https://ecke.lt/~mein-vortrag` aufgerufen wird und `mein-vortrag` existiert
- **THEN** antwortet der Worker mit 301 auf dessen URL

#### Scenario: Unbekannter oder leerer Code
- **WHEN** der Code nach `/~` leer ist oder weder exakt noch großgeschrieben in `URLS` steht
- **THEN** antwortet der Worker mit 404 und dem Text `Not found`

### Requirement: Erreichbarkeit über Route und Custom Domain
Das System SHALL Kurzlinks über die Route `ecke.lt/*` der Zone `ecke.lt` (Standard „fail closed“) und zusätzlich über die Custom Domain `kurz.ecke.lt` annehmen; es gibt dafür nur den einen Worker `url-shortener`, andere Hosts der Zone sind nicht beteiligt. Die Zonenregel für die Wurzel `/` läuft vor der Route.

#### Scenario: Aufruf über ecke.lt
- **WHEN** eine Anfrage auf `https://ecke.lt/{CODE}`, `https://ecke.lt/~{code}` oder einen anderen Pfad außer `/` eingeht
- **THEN** leitet Cloudflare sie an den Worker `url-shortener` weiter

#### Scenario: Aufruf über andere Hosts der Zone
- **WHEN** eine Anfrage an einem anderen Host der Zone als `ecke.lt` oder `kurz.ecke.lt` eingeht (z.B. `www.ecke.lt`, `book.ecke.lt`)
- **THEN** ist der Worker `url-shortener` nicht beteiligt

#### Scenario: Andere Pfade auf ecke.lt
- **WHEN** eine Anfrage auf `https://ecke.lt/` eingeht
- **THEN** greift die vorhandene Single-Redirect-Regel „To Visitencard“ (Ausdruck: genau `https://ecke.lt/`, im Dashboard gepflegt, unverändert) vor der Worker-Route; Pfade mit Code erreichen den Worker

### Requirement: Sonstige Anfragen
Das System SHALL auf `kurz.ecke.lt` alle Anfragen, die weder `GET /`, ein gefundener Kurzlink, `GET /~…` noch `POST /save` sind, mit 404 `Not found` beantworten.

#### Scenario: Unbekannter Pfad auf kurz.ecke.lt
- **WHEN** `GET https://kurz.ecke.lt/ueber-mich` oder `GET https://kurz.ecke.lt/NIXDA` (ohne Eintrag) aufgerufen wird
- **THEN** antwortet der Worker mit 404

### Requirement: Kurzlinks direkt unter ecke.lt
Das System SHALL eine GET-Anfrage, deren Pfad aus genau einem Abschnitt `[A-Za-z0-9]{2,32}` besteht, als Kurzlink behandeln: Es sucht den Code zuerst in exakter Schreibweise (alte Codes wie `au5H`), dann großgeschrieben (neue Codes liegen großgeschrieben in `URLS`) und antwortet bei einem Treffer mit 301 auf die gespeicherte URL. `URLS` wird dafür nicht migriert. Das gilt auf `ecke.lt` und `kurz.ecke.lt`.

#### Scenario: QR-Schreibweise
- **WHEN** eine Kamera-App `HTTPS://ECKE.LT/HALLO` öffnet (der Browser fragt `https://ecke.lt/HALLO` an) und in `URLS` ein Eintrag `HALLO` existiert
- **THEN** antwortet der Worker mit 301 und `Location` = gespeicherte URL

#### Scenario: Im Chat klein geschrieben
- **WHEN** `https://ecke.lt/hallo` oder `https://ecke.lt/Hallo` aufgerufen wird und `HALLO` existiert
- **THEN** antwortet der Worker mit 301 auf die URL von `HALLO`

#### Scenario: Alter Code ohne Tilde
- **WHEN** `https://ecke.lt/au5H` aufgerufen wird und in `URLS` ein Eintrag `au5H` existiert
- **THEN** antwortet der Worker mit 301 auf dessen URL; `https://ecke.lt/AU5H` muss für alte gemischte Codes nicht auflösen

### Requirement: Weiterleitung auf nils.ecke.lt
Das System SHALL die Startseite `https://ecke.lt/` per Zonenregel „To Visitencard“ (Single Redirect, vor dem Worker) mit 301 auf `https://nils.ecke.lt` umleiten; erreicht `/` den Worker, antwortet er ebenso. Jede andere Anfrage auf `ecke.lt`, die kein gefundener Kurzlink und nicht `/~…` ist, mit 302 auf `https://nils.ecke.lt`. Wirft der Worker beim Bearbeiten eine Ausnahme, SHALL er ebenfalls mit 302 auf `https://nils.ecke.lt` antworten.

#### Scenario: Startseite
- **WHEN** `https://ecke.lt/` aufgerufen wird
- **THEN** antwortet Cloudflare per Zonenregel mit 301 und `Location: https://nils.ecke.lt`, ohne den Worker aufzurufen

#### Scenario: Startseite ohne Regel
- **WHEN** `/` auf `ecke.lt` den Worker erreicht (z.B. Regel fehlt)
- **THEN** antwortet der Worker mit 301 auf `https://nils.ecke.lt`

#### Scenario: Unbekannter Code
- **WHEN** `https://ecke.lt/NIXDA` aufgerufen wird und `NIXDA` weder exakt noch großgeschrieben in `URLS` steht
- **THEN** antwortet der Worker mit 302 auf `https://nils.ecke.lt`

#### Scenario: Pfad, der kein Code sein kann
- **WHEN** `https://ecke.lt/wp-login.php` oder `https://ecke.lt/seiten/impressum` aufgerufen wird
- **THEN** antwortet der Worker mit 302 auf `https://nils.ecke.lt`, ohne `URLS` zu lesen

#### Scenario: KV nicht erreichbar
- **WHEN** das Lesen aus `URLS` mit einer Ausnahme scheitert
- **THEN** antwortet der Worker mit 302 auf `https://nils.ecke.lt`
