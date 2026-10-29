# Kurzlinks liegen unter ecke.lt/CODE ohne ~, Groß/Klein egal; Worker url-shortener für alle Pfade, Startseite per Regel

Status: angenommen
Datum: 2026-10-29
Change: kurzlinks-fuer-qr-codes

## Kontext
Kurzlinks sollen im Chat verschickt und in QR-Codes gedruckt werden. QR-Codes werden kleiner oder robuster, wenn der ganze Inhalt im Alphanumerik-Modus steht (`0–9 A–Z`, Leerzeichen, `$ % * + - . / :`). Die heutige Form `https://ecke.lt/~{code}` erzwingt den Byte-Modus: `~` liegt außerhalb des Satzes, und Codes sind groß/klein-sensitiv (gemischt geschrieben, z. B. `au5H`). Gedruckte Codes lassen sich nicht zurückrufen, die Form ist also teuer zu ändern.

Heute leitet die Zonenregel „To Visitencard“ (Single Redirect) genau `https://ecke.lt/` auf `https://nils.ecke.lt` um, der Worker hat die Route `ecke.lt/~*`, alle übrigen Pfade liefern 526 (Fastmail-IPs). Seiten liegen nur auf Subdomains. Single Redirects laufen vor Worker-Routen; die Regel trifft nur `/`.

Vorgaben des Inhabers (2026-10-29): kein eigener Host („kürzer, kurz. kommt weg“), Kurzlinks auch klein schreibbar („nicht nur uppercase“), `~` fällt weg, alte Links sollen über Herausfiltern von `~` weiter gehen, kein zusätzlicher Worker.

Nachgerechnet (Fehlerkorrektur M): heute passen in Version 2 (25×25) höchstens 9 Zeichen Code, Version 1 nie; direkt unter `/` und ganz groß 4 Zeichen in V1 und 22 in V2. Pfade behalten ihre Schreibweise (RFC 3986, 6.2.2.1), nur Schema und Host werden klein.

## Entscheidung
Kurzlinks haben die Form `https://ecke.lt/CODE`, Groß/Klein ist egal. Für QR-Codes wird die Adresse ganz großgeschrieben ausgegeben (`HTTPS://ECKE.LT/HALLO`), für Chat und Mail in der eingegebenen Schreibweise.

- **Routing:** Der bestehende Worker `url-shortener` bekommt die Route `ecke.lt/*` statt `ecke.lt/~*`. Ein Pfad aus genau einem Abschnitt `[A-Za-z0-9]{2,32}`, auch mit vorangestelltem `~`, wird als Code nachgeschlagen: Treffer → 301 auf das Ziel. Ein anderer Pfad hinter `~` wird ebenfalls nachgeschlagen (alte Wunschcodes), Fehlschlag → 404.
- **Weiterleitung:** Die Wurzel `/` leitet weiter die Zonenregel „To Visitencard“ (Single Redirect, läuft vor Worker-Routen, trifft nur `https://ecke.lt/`) per 301 auf `https://nils.ecke.lt`, ohne Worker. Erreicht `/` doch den Worker, antwortet er ebenso. Jeder andere Pfad ohne Code und jede Ausnahme im Worker → 302 `https://nils.ecke.lt`.
- **Ausfall:** Die Route bleibt beim Standard „fail closed“; die Startseite hängt dank der Regel nicht am Worker.
- **Schlüssel:** Neue Codes liegen großgeschrieben in `URLS`, alte bleiben, wie sie sind (keine Migration, Vorgabe des Inhabers: in `URLS` liegen nur die alten `~`-Codes). Nachgeschlagen wird bei `/code` und `/~code` erst exakt, dann großgeschrieben. Alte gemischte Codes (`au5H`) lösen exakt auf, aber nicht in reiner Großschreibung.
- **Codes:** Neue Codes nur `0-9A-Z` mit mindestens einem Buchstaben; Belegung wird groß/klein-unabhängig geprüft.
- **Kollisionsschutz:** Seiten auf `ecke.lt` nutzen nie einen Pfad aus genau einem Abschnitt nur aus Buchstaben und Ziffern, sondern mehrere Abschnitte, Bindestrich oder Punkt. Ausnahmen kommen auf die Liste reservierter Wörter im Worker, die die API als Code ablehnt. Eine Seite auf dem Apex ist ein eigener Change am Worker.

## Betrachtete Optionen
- **Ein Worker auf `ecke.lt/*`, Startseite per Zonenregel** (gewählt, Hinweis des Inhabers): Die Regel läuft vor dem Worker und trifft nur `/`. So kostet die Startseite keine Worker-Anfrage und bleibt auch über dem Limit erreichbar; alle Pfade gehören dem einen Worker. Unbekannte Pfade landen auf nils.ecke.lt statt bei 526. Wider: Zwei Stellen beschreiben den Apex. Das mildert der Deploy-Schritt, der die Regel als Code prüft und herstellt, und der Worker beantwortet `/` zur Sicherheit gleich. Gewählt, weil die Startseite so unabhängig vom Worker und dessen Kontingent ist.
- **Startseite im Worker, Zonenregel entfernt:** verworfen. Eine Stelle weniger, aber `/` zählte gegen das Worker-Kontingent (Free-Plan 100.000 pro Tag, kontoweit) und zeigte über dem Limit die Fehlerseite 1027.
- **Unbekannte Pfade an den Ursprung durchreichen:** verworfen. Der Ursprung liefert nur 526; es gibt dort nichts, was Durchreichen schützen würde.
- **„Fail open“:** verworfen. Über dem Limit ginge alles an den Ursprung, also nur 526; dafür bräuchte es eine zusätzliche Routen-Einstellung und Token-Rechte. Die Startseite schützt bereits die Regel.
- **Zweiter Worker nur für den Apex:** verworfen nach Vorgabe des Inhabers; doppelter Deploy und doppelter Zugriff auf `URLS`.
- **Erkennung an der Großschreibung** (nur `^/[A-Z0-9]+$` ist ein Code): verworfen. Kurzlinks sollen auch im Chat klein geschrieben funktionieren.
- **Großgeschrieben, dann exakt nachschlagen, mit KV-Migration im Deploy** (Altcodes bekämen einen großgeschriebenen Schlüssel): verworfen nach Vorgabe des Inhabers. Sie hätte auch alte Codes in QR-Schreibweise auflösbar gemacht, aber KV-Schreibrechte und einen Migrationsschritt im Deploy verlangt; alte Codes werden nicht neu gedruckt. Exakt-dann-groß braucht beides nicht.
- **Zonenregel im Deploy prüfen und herstellen:** verworfen; bräuchte zusätzliche Token-Rechte (Single Redirect). Die Regel bleibt im Dashboard, wie sie ist; erreicht `/` den Worker doch, antwortet er gleich.
- **Präfix aus einem Zeichen des Alphanumerik-Satzes** (`/-HALLO`): verworfen. Ein Zeichen länger, fremd, und Textprogramme machen aus `-` manchmal Gedankenstriche. Für die anderen Zeichen gilt: `%` kollidiert mit Prozent-Kodierung, `*` mit Markdown, `+` wird als Leerzeichen gelesen, `.` und `:` stören die Normalisierung.
- **`~` behalten:** verworfen. Erzwingt den Byte-Modus; der Inhaber will `~` loswerden.
- **Eigener Host `kurz.ecke.lt`** (in V2 nur 17 Zeichen Code, V1 nie) und **eigene Kurz-Domain** (Geld und Betrieb): verworfen.

## Folgen
- API: `url` und `code` ohne `~`, neu `qrUrl`; 409 bei belegtem, 400 bei ungültigem oder reserviertem Wunschcode.
- Oberfläche: zweite Ergebniszeile „Für QR-Codes“ mit Kopier-Knopf.
- Deploy-Workflow: nur die neue Route `ecke.lt/*` (und Tests vor dem Deploy); keine neuen Token-Rechte, KV und Zonenregel bleiben unverändert.
- Ein alter Code, der großgeschrieben einem neuen gleicht (`abcd` und `ABCD`), gewinnt bei `ecke.lt/abcd`; die API lehnt einen solchen Wunschcode mit 409 ab, wenn er in der eingegebenen Schreibweise belegt ist.
- Betroffen: `worker` (Weiterleitung, Code-Vergabe, Oberfläche, Route) und `deploy-worker` (Route).
