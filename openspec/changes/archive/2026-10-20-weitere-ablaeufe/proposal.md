# Abläufe „Kurzlink öffnen“ und „Kurzlink anlegen“

## Warum
Teil des Landscape-Changes `weitere-ablaeufe` (Übersicht dort): Die beiden Wege in url-shortener (öffnen und anlegen) sollen als Abläufe auf der Karte stehen (Wunsch des Inhabers, Chat 2026-10-19).

## Was
- `twin.json`: neuer Ablauf `kurzlink-oeffnen` in `flows[]`, 2 Schritte: Besucher öffnet `ecke.lt/~<code>` (`short-links@1`), Worker liest die Ziel-URL aus KV und leitet per 301 weiter (sonst 404).
- `twin.json`: neuer Ablauf `kurzlink-anlegen`, 3 Schritte: Inhaber öffnet das Formular (`web-ui@1`), Formular ruft `POST /save` mit Bearer-Token (`shorten-api@1`), Worker prüft Kollision und schreibt in KV (Wunsch des Inhabers 2026-10-19).
- Alle Schritte hängen an vorhandenen Kanten. Die Weiterleitung selbst ist keine Kante (das Ziel ist beliebig) und steht im Text.
- Kein Code, keine Spec-Deltas.

## Auswirkungen
- Nur Manifest. Achtung: Jeder Push auf master baut ein Docker-Image (`docker-publish.yml`, B12); der Worker-Deploy läuft nur bei `worker/**`.
- Fundstellen beziehen sich auf origin/master `7ac8e4a`.
