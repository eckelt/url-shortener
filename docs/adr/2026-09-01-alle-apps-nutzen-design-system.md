# Alle ecke.lt-Apps beziehen Tokens, Schriften und Komponenten zur Laufzeit aus dem gemeinsamen Design-System

Status: angenommen
Datum: 2026-09-01

## Kontext
Mehrere Web-Oberflächen gehören zu ecke.lt: nils.ecke.lt, book.ecke.lt mit feedback.ecke.lt, kurz.ecke.lt und der Blog. Ohne gemeinsame Quelle bringt jede App eigene Tokens, Schriften oder ein fremdes Framework mit; so hielt der Blog bis 2026-10-17 eine Kopie der Tokens und ein eigenes Mermaid-Theme, und kurz.ecke.lt lud `bonsai.css@latest` ungepinnt von unpkg. Das Design-System entstand am 2026-09-01 als gemeinsame Grundlage mit versioniertem Pfad `/v1/`. Der Inhaber hat die Regel am 2026-10-19 bestätigt: Alle Apps in ecke.lt nutzen das Design-System.

## Entscheidung
Jede Web-Oberfläche von ecke.lt bindet Tokens, Schriften und Komponenten zur Laufzeit von `https://ecke-design-system.pages.dev/v1/` ein (`ecke-design-system:styles@1`, bei Bedarf `components@1` und `mermaid@1`) und hält keine eigenen Kopien davon. Eigenes CSS einer App beschränkt sich auf ihr Layout und auf Elemente, die das Design-System noch nicht hat, und baut auf den Tokens auf. Brechende Änderungen erscheinen unter einem neuen Versionspfad, nicht in `/v1/`.

## Betrachtete Optionen
- **Je App eigenes CSS:** verworfen. Volle Freiheit und keine Abhängigkeit, aber die Optik läuft auseinander, und jede Verbesserung entsteht mehrfach (Blog bis 2026-10-17).
- **Fremdes Framework vom CDN, z.B. bonsai.css von unpkg:** verworfen. Schnell zur Hand, aber keine eigene Optik und eine fremde Laufzeitabhängigkeit, ungepinnt sogar ohne stabile Version (url-shortener bis 2026-10-17).
- **Gemeinsames Design-System zur Laufzeit von ecke-design-system.pages.dev/v1/** (gewählt): eine Quelle für alle Apps; Korrekturen erreichen alle ohne deren Deploy, und es passt zu statischen Seiten und Workern ohne Bundler. Wider: Laufzeitabhängigkeit zu Cloudflare Pages, und jede Änderung unter `/v1/` wirkt sofort überall. Gewählt, weil Konsistenz mit wenig Aufwand je App das Ziel ist.
- **Gemeinsames Design-System als gebündeltes Paket (npm, GitHub Packages)** (rekonstruiert): verworfen. Jede App fixiert ihre Version und ist zur Laufzeit unabhängig, braucht aber einen Build-Schritt mit Bundler und je App ein Update samt Deploy, bis eine Korrektur ankommt; nicht jede App hat einen Bundler.

## Folgen
- Ein Fehler unter `/v1/` trifft alle Apps; in `/v1/` kommen nur abwärtskompatible Änderungen.
- Fehlt ein Element, stylt die App es mit den Tokens, oder es kommt als eigener Change ins Design-System.
- Deskleaf-Seiten nutzen das Design-System ebenfalls, werden in der Landscape aber nicht erfasst.
- Die Einzelentscheidungen der Changes `url-shortener-nutzt-design-system` und `blog-nutzt-das-gleiche-design-system-wie-die-ander` (2026-10-17) setzen diese Regel um; ihre Varianten sind Details der Umsetzung und stehen unten beim jeweiligen Repo.
- Hier betroffen: `worker` (`styles@1`, Button des Design-Systems). Label und Eingabefelder stylt der Worker selbst mit den Tokens (Change `url-shortener-nutzt-design-system`, Variante a); ein Atom `input` im Design-System (Variante b) bleibt ein möglicher eigener Change.
- Nachgetragen im Change `adrs-nachtragen` auf Anmerkung des Inhabers (2026-10-19). Quelle: ecke-design-system `README.md` und erster Commit `a4bb5f0` (2026-09-01), Archive `2026-10-17-url-shortener-nutzt-design-system` (url-shortener) und `2026-10-17-blog-nutzt-das-gleiche-design-system-wie-die-ander` (blog).
