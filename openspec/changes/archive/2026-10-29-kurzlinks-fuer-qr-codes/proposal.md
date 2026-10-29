# Kurzlinks ohne ~: ecke.lt/CODE, Groß/Klein egal, mit QR-Schreibweise

## Warum
Der Inhaber will Kurzlinks im Chat verschicken und in QR-Codes drucken. QR-Codes kennen einen Alphanumerik-Modus (Zeichensatz `0–9 A–Z`, Leerzeichen, `$ % * + - . / :`), der 5,5 statt 8 Bit je Zeichen braucht. Kleinbuchstaben und `~` erzwingen den Byte-Modus. Heutige Links wie `https://ecke.lt/~c2WD` sind deshalb nie alphanumerisch, auch nicht großgeschrieben: `~` gehört nicht zum Satz, und Codes sind groß/klein-sensitiv. Gedruckte Codes lassen sich nicht zurückrufen; die Form der Adresse muss also einmal stimmen.

## Was der Alphanumerik-Modus bringt (nachgerechnet)
Gerechnet mit `segno` 1.6.6 (ein Modus je Code, wie die meisten Generatoren), Fehlerkorrektur M. „V1 21×21“ = Version 1 mit 21 Modulen je Seite (ohne Ruhezone).

| Form | Code `C2WD` | Code `HALLO` | Code `VORTRAG2026` | max. Code-Länge V1 / V2 (M) | V2 bei Korrektur Q |
|---|---|---|---|---|---|
| heute `https://ecke.lt/~hallo` (Byte) | V2 25×25 | V2 25×25 | V3 29×29 | – / 9 | 3 |
| `HTTPS://ECKE.LT/~HALLO` (Byte wegen `~`) | V2 | V2 | V3 | – / 9 | 3 |
| (a) `HTTPS://KURZ.ECKE.LT/HALLO` | V2 | V2 | V2 | – / 17 | 8 |
| (b) `HTTPS://ECKE.LT/-HALLO` | V2 | V2 | V2 | 3 / 21 | 12 |
| (c) `HTTPS://ECKE.LT/HALLO` (gewählt) | **V1 21×21** | V2 | V2 | 4 / 22 | 13 |

Bei kurzen Codes ist der Gewinn klein: Nur (c) bringt 4-stellige Codes auf V1 (jedes Modul bei gleicher Druckgröße 19 % größer). Deutlich wird er bei Wunschcodes mit 10–22 Zeichen (V3 → V2) und bei höherer Fehlerkorrektur (Q, z. B. für ein Logo).

## Was (vom Inhaber freigegeben 2026-10-29)
- **Form** `https://ecke.lt/CODE`, Groß/Klein egal: `ecke.lt/hallo`, `ecke.lt/HALLO` und `ecke.lt/Hallo` führen zum selben Ziel. Für Chat und Mail gibt die API den Code in der eingegebenen Schreibweise aus (`https://ecke.lt/Hallo`), für QR-Codes zusätzlich alles groß (`qrUrl` = `HTTPS://ECKE.LT/HALLO`). Pfade behalten ihre Schreibweise (RFC 3986, 6.2.2.1; geprüft mit dem URL-Parser in Node: `HTTPS://ECKE.LT/HALLO` → `https://ecke.lt/HALLO`), die Großschrift ist also nur für die Größe des QR-Codes nötig, nicht für das Auflösen.
- **Routing, ein Worker:** Es bleibt beim einen Worker `url-shortener` (Vorgabe des Inhabers: kein zusätzlicher Worker). Er bekommt statt `ecke.lt/~*` die Route `ecke.lt/*`; enger geht es nicht, weil Routen nur `*` kennen und Codes beliebige einzelne Abschnitte sind. Ein Pfad aus genau einem Abschnitt `[A-Za-z0-9]{2,32}` (auch mit vorangestelltem `~`) wird als Code nachgeschlagen; gibt es ihn, 301 auf das Ziel.
- **Startseite per Regel, Pfade im Worker** (Hinweis des Inhabers): Die Zonenregel „To Visitencard“ (Single Redirect, Phase `http_request_dynamic_redirect`) leitet heute schon genau `https://ecke.lt/` per 301 auf `https://nils.ecke.lt` um (Inventur `inventory/overlay.yaml`). Single Redirects laufen vor Worker-Routen (Cloudflare-Doku „Rules execution order“); die Regel trifft nur die Wurzel, verschluckt also keine Codes und bleibt, wie sie ist. `/` kostet so keine Worker-Anfrage und funktioniert auch über dem Tageslimit. Der Worker bekommt alle Pfade: Erreicht ihn `/` doch (Regel fehlt), antwortet er ebenfalls mit 301 auf `https://nils.ecke.lt`; jeder andere Pfad ohne Code → 302 `https://nils.ecke.lt` statt heute 526 (302, damit ein später angelegter Code nicht von einer zwischengespeicherten Weiterleitung verdeckt wird).
- **Ausfallverhalten neu bewertet:** Über dem Tageslimit (Free-Plan: 100.000 Worker-Anfragen pro Tag, kontoweit) hieße „fail open“ Durchreichen an den Ursprung, der nur 526 liefert; „fail closed“ zeigt die Seite 1027. Für Codes ist beides ein Ausfall, die Startseite trägt ohnehin die Regel. Daher bleibt der Standard „fail closed“ ohne zusätzliche Einstellung. Wirft der Worker eine Ausnahme (z. B. KV nicht erreichbar), antwortet er mit 302 auf `https://nils.ecke.lt`.
- **`~` fällt weg:** Neue Links nur noch `ecke.lt/CODE`. Alte Links `ecke.lt/~code` funktionieren weiter: `~` wird herausgefiltert und der Rest wie ein Code nachgeschlagen, auch alte Wunschcodes mit anderen Zeichen; unbekannt → 404 wie bisher.
- **Schlüssel ohne Migration** (Vorgabe des Inhabers 2026-10-29: „An KV sollte nichts geändert werden müssen, da darin nur die Codes liegen, die vorher hinter der ~ waren.“): Neue Codes werden großgeschrieben gespeichert, alte bleiben in ihrer Schreibweise. Nachgeschlagen wird bei `ecke.lt/code` und `ecke.lt/~code` zuerst exakt (alte Codes wie `au5H`), dann großgeschrieben (neue Codes, also `hallo`, `Hallo`, `HALLO`). Alte gemischte Codes müssen in reiner Großschreibung nicht auflösen. `URLS` wird nicht verändert.
- **Code-Vergabe:** neue Codes nur `0-9A-Z` mit mindestens einem Buchstaben (reine Ziffern bleiben für Seiten wie `/2026` frei). Wunschcodes `[A-Za-z0-9]{2,32}`, Belegung groß/klein-unabhängig geprüft (409), reservierte Wörter abgelehnt (400). Zufallscodes werden vor dem Speichern erneut auf Belegung geprüft.
- **Kollisionsschutz für künftige Seiten** (ADR): Der Apex gehört dem Worker; heute gibt es dort keine Seiten. Soll eine Seite dazukommen, ist das ein eigener Change am Worker (Durchreichen bestimmter Pfade), und die Seite nutzt nie einen Pfad aus genau einem Abschnitt nur aus Buchstaben und Ziffern, sondern mehrere Abschnitte, Bindestrich oder Punkt (`/seiten/impressum`, `/ueber-mich`, `/.well-known/…`). Muss doch einmal so ein Pfad sein, kommt er auf die Liste reservierter Wörter im Worker; die API lehnt ihn dann als Code ab.
- **Oberfläche:** Das Ergebnis zeigt zwei Zeilen mit je einem Kopier-Knopf: „Zum Teilen“ (`https://ecke.lt/Hallo`) und „Für QR-Codes“ (`HTTPS://ECKE.LT/HALLO`). Mock: `mocks/ergebnis-qr-390.html` mit `ergebnis-qr-390-hell.png` und `ergebnis-qr-390-dunkel.png` (390 px).

## Auswirkungen
- API `shorten-api@1`: `url` ohne `~`, `code` ohne `~` in der eingegebenen Schreibweise, neu `qrUrl`; neu 409 „Code belegt“ und 400 „Ungültiger Code“ für Wunschcodes. Bekannter Client ist nur die eigene Oberfläche.
- Jede Anfrage auf dem Apex läuft durch den Worker, auch `/`; codeförmige Pfade kosten eine KV-Abfrage (Free-Plan 100.000 Lesungen pro Tag). Bots auf `/wp-login.php` u. ä. bekommen statt 526 eine 302 auf nils.ecke.lt.
- Deploy: nur Route `ecke.lt/*` und Tests vor dem Deploy. Kein Schritt schreibt KV oder ändert die Zonenregel „To Visitencard“ (sie bleibt im Dashboard, wie sie ist); `CLOUDFLARE_API_TOKEN` braucht keine neuen Rechte (Workers Scripts Edit, Workers Routes Edit genügen).

## Alternativen
Siehe ADR `docs/adr/2026-10-29-kurzlinks-fuer-qr-codes.md`: Erkennung an der Großschreibung (verworfen: Kurzlinks sollen auch im Chat klein funktionieren), Präfix `/-`, Durchreichen an den Ursprung statt Weiterleitung, Startseite im Worker statt per Regel, groß-dann-exakt mit KV-Migration, zweiter Worker, eigener Host `kurz.ecke.lt`, eigene Kurz-Domain.

## Jetzt darüber nachdenken?
Ja, aber nur über die Form der Adresse, nicht über künftige Seiten. Was gedruckt ist, bleibt. Jetzt billig: die Regel „ein Abschnitt aus Buchstaben und Ziffern ist ein Code, Seiten nutzen so etwas nie“ und die Liste reservierter Wörter. Später teuer: dieselbe Regel nachträglich, wenn schon Codes gedruckt sind, die mit einer gewünschten Seite kollidieren.
