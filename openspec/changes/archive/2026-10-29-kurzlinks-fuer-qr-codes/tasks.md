> Freigegeben vom Inhaber 2026-10-29 („Umsetzen“). Ein Worker (`url-shortener`), kein zweiter.

## 1. Worker
- [x] 1.1 Routing in `worker/src/index.ts`: Pfad `^/[A-Za-z0-9]{2,32}$` und `/~…` (`~` entfernt) → erst exakt, dann `toUpperCase()` in `URLS`, Treffer 301; `/~…` sonst 404; auf `ecke.lt`: `/` (nur ohne Regel) → 301, alles andere → 302 `https://nils.ecke.lt`; Ausnahme → 302 `https://nils.ecke.lt`; auf `kurz.ecke.lt` unverändert (`/`, `POST /save`, sonst 404)
- [x] 1.2 Code-Vergabe: Schlüssel groß, neue Codes `0-9A-Z` mit Buchstabe, Hash-Code nur aus Ziffern ersetzen, Zufallscode erneut prüfen; Wunschcode prüfen (400 ungültig/reserviert, Liste mindestens `SAVE`; 409 belegt); Antwort `{url, qrUrl, code, error}` mit `code` in eingegebener Schreibweise
- [x] 1.3 Oberfläche nach Mock `mocks/ergebnis-qr-390.html`: zwei Ergebniszeilen „Zum Teilen“ und „Für QR-Codes“ mit je „Kopieren“
- [x] 1.4 `worker/wrangler.toml`: Route `ecke.lt/*` statt `ecke.lt/~*` (fail closed bleibt Standard)
- [x] 1.5 Tests je Szenario der Deltas `short-links`, `link-creation` (KV gemockt, auch Ausnahme beim Lesen); `npm run typecheck`

## 2. Deploy-Workflow
> Vorgabe des Inhabers 2026-10-29: „An KV sollte nichts geändert werden müssen, da darin nur die Codes liegen, die vorher hinter der ~ waren.“ Keine KV-Migration, kein Schritt, der KV schreibt oder die Zonenregel ändert; keine neuen Token-Rechte. Die Regel „To Visitencard“ bleibt, wie sie ist.
- [x] 2.1 Tests (`npm test`) im Deploy-Workflow vor `npm run deploy`

## 3. Abschluss
- [x] 3.1 Specs archivieren, ADR auf `angenommen`, Soll-`twin.json` ins Root; `validate-schemas` grün
- [ ] 3.2 Nach Deploy live: `https://ecke.lt/<CODE>` in groß, klein, gemischt → 301; `https://ecke.lt/~au5H` → 301 wie bisher; `https://ecke.lt/` → 301 nils.ecke.lt ohne Worker-Aufruf (Worker-Log leer); `https://ecke.lt/gibtsnicht` → 302 nils.ecke.lt; `https://ecke.lt/au5H` (alter Code ohne `~`) → 301
- [ ] 3.3 Gerätetest: QR-Code mit `HTTPS://ECKE.LT/<CODE>` mit iPhone-Kamera und Google Lens scannen
