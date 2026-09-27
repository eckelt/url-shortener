# url-shortener – Projektkontext

- **Produkt:** url-shortener [landscape:inventory/raw/url-shortener.yaml:1]
- **Repo:** git@github.com:eckelt/url-shortener.git, Branch `master`; GitHub-Fork von `jhaals/url-shortener` [landscape:inventory/raw/url-shortener.yaml:2-4; landscape:inventory/raw/url-shortener.yaml:7-8]
- **Stand der Aussagen:** Commit `65d71f9b03ba7500de9fc79595dcc7c61bb4fd70` [landscape:inventory/raw/url-shortener.yaml:3], aufgenommen am 2026-09-27
- **managed:** `oneshot` (einmalige Ist-Aufnahme von Hand, kein automatischer Abgleich)
- **Architektur-Manifest:** `twin.json` (Schema: ecke-lt-landscape `schema/twin.schema.json`, v3)

Alle Fundstellen `[datei:zeile]` beziehen sich auf den genannten Commit und sind relativ zum Repo-Root. `[landscape:…]` verweist auf das Repo ecke-lt-landscape. Konventionen: `landscape:CONVENTIONS.md`.
Zusätzlich verwendet dieser Text `[git log: …]` für Aussagen über die Commit-Historie dieses Repos (prüfbar mit `git log --follow --format='%h %an %cs %s' -- <datei>`).

**Achtung beim Committen:** Jeder Push auf `master` startet `.github/workflows/docker-publish.yml` (Go-Test, Docker-Build und Push eines Images), auch wenn nur `openspec/**` oder `twin.json` geändert werden [.github/workflows/docker-publish.yml:3-7; .github/workflows/docker-publish.yml:42-47; landscape:landscape.yaml:30-34]. Der Worker-Deploy startet dagegen nur bei Änderungen unter `worker/**` [.github/workflows/deploy.yml:3-7].

## Capabilities

| Capability | Spec | Status |
|---|---|---|
| short-links | `openspec/specs/short-links/spec.md` | live (Cloudflare Worker) |
| link-creation | `openspec/specs/link-creation/spec.md` | live (Cloudflare Worker) |
| deploy | `openspec/specs/deploy/spec.md` | Workflows im Repo |

Der geerbte Go/Docker-Teil (`url-shortener.go`, `database.go`, `public/`, `Dockerfile`, `docker-compose.yml`, `.github/workflows/docker-publish.yml`) ist Altlast im Repo, nicht in Betrieb [Nutzer-Auskunft 2026-09-27]. Entfernung: Landscape-Backlog B12 [landscape:backlog.md:20]. `docker-publish.yml` läuft trotzdem bei jedem Push auf `master` weiter, solange B12 nicht umgesetzt ist [.github/workflows/docker-publish.yml:3-7].

## Zweck

url-shortener macht aus langen Web-Adressen kurze Links der Form `https://ecke.lt/~au5H`, die beim Aufruf auf die ursprüngliche Adresse weiterleiten [README.md:1-5; worker/src/index.ts:127-134].
Neue Kurzlinks legt man über eine kleine Web-Oberfläche oder eine API unter `https://kurz.ecke.lt` an, geschützt durch ein geheimes Token [README.md:6; README.md:98-120; worker/src/index.ts:136-143].
Das Ganze läuft heute als Cloudflare Worker mit Cloudflare KV als Speicher; der ältere Go-Server mit SQLite und Docker aus dem ursprünglichen Fork ist Altlast im Repo, nicht in Betrieb [Nutzer-Auskunft 2026-09-27], Entfernung: Landscape-Backlog B12 [README.md:7; README.md:143-146; landscape:backlog.md:20].

## Herkunft: eigen vs. geerbt

Das Repo ist ein GitHub-Fork von `jhaals/url-shortener` [landscape:inventory/raw/url-shortener.yaml:7-8]. Die Historie hat drei Abschnitte [git log: 527c795..d8b4a79; 7129411..66a2fb8; cce04eb..65d71f9]:

| Abschnitt | Commits | Autoren | Beleg |
|---|---|---|---|
| Upstream (jhaals) | `527c795` „initial“ (2015-09-07) bis `d8b4a79` (2020-01-26, Merge PR #6) | Johan Haals, Pascal Corpet, dunderrrrrr | [git log: 527c795..d8b4a79] |
| Eigene Go-Weiterentwicklung | `7129411` (2020-07-31) bis `66a2fb8` (2022-05-12) | Nils Eckelt | [git log: 7129411..66a2fb8] |
| Cloudflare Worker | `cce04eb` (2026-06-06, via PR #1 / `04c4638`) bis `65d71f9` (2026-06-06) | Claude, Nils Eckelt | [git log: cce04eb..65d71f9; landscape:inventory/raw/url-shortener.yaml:14-17] |

- Gemeinsamer Stand mit `jhaals/url-shortener` (merge-base) ist `d8b4a79`; upstream hat danach genau einen weiteren Commit (`f2b9249`, 2021-03-17), der hier nicht enthalten ist [git log: HEAD..upstream/master].
- Zum Stand `d8b4a79` gab es nur: `.gitignore`, `Dockerfile`, `README.md`, `database.go`, `docker-compose.yml`, `main.go`, `public/index.html` [git log: git ls-tree d8b4a79].

Dateien nach Herkunft (erster Commit / Autoren laut `git log --follow`):

| Datei | Herkunft | Beleg |
|---|---|---|
| `url-shortener.go` (umbenannt aus `main.go` in `afe5e57`) | geerbt, stark überarbeitet (11 Commits Haals, 2 Corpet, 23 Nils Eckelt) | [git log: 527c795; afe5e57] |
| `database.go` | geerbt, überarbeitet (3 Haals, 4 Nils Eckelt) | [git log: d8098c5] |
| `public/index.html` | geerbt, überarbeitet (6 Haals, 2 Nils Eckelt) | [git log: f986767] |
| `Dockerfile` | geerbt, überarbeitet (1 Haals, 1 Corpet, 17 Nils Eckelt) | [git log: 69b9717] |
| `docker-compose.yml` | geerbt (nur dunderrrrrr, unverändert) | [git log: 14e1732] |
| `.gitignore`, `README.md` | geerbt; README 2026-06-06 vollständig auf den Worker umgeschrieben | [git log: d8098c5; 2673509; 65d71f9] |
| `.github/workflows/docker-publish.yml`, `go.mod`, `go.sum`, `url-shortener_test.go`, `*.crt` | eigen (Nils Eckelt, 2020–2022) | [git log: fd60325; afe5e57; 2812796; cbabb9a; 87cccac; a33664e] |
| `worker/**`, `.github/workflows/deploy.yml` | eigen (Claude/Nils Eckelt, 2026-06-06) | [git log: cce04eb; 9e3b98d; cefd55b; eaa3a4e] |

## Schnittstellen

### Angeboten

| Schnittstelle | Inhalt | contractRef | Beleg |
|---|---|---|---|
| Kurzlinks | `GET https://ecke.lt/~{code}` (und jeder andere Host der Route `*ecke.lt/~*`, auch `https://kurz.ecke.lt/~{code}`) → 301 auf die Ziel-URL | `url-shortener:short-links@1` | [worker/wrangler.toml:18-24; worker/src/index.ts:127-134; landscape:inventory/overlay.yaml:49-51] |
| Kürz-API | `POST https://kurz.ecke.lt/save`, JSON `{url, code?}`, Header `Authorization: Bearer <AUTH_TOKEN>` → JSON `{url, code, error}` | `url-shortener:shorten-api@1` | [worker/src/index.ts:136-170; README.md:98-120] |
| Web-Oberfläche | `GET https://kurz.ecke.lt/` (HTML-Formular URL/Code/Token) | `url-shortener:web-ui@1` | [worker/src/index.ts:41-125; worker/wrangler.toml:22-24] |

Bekannte Nutzer: ein iOS-Kurzbefehl ruft die Kürz-API auf (Anleitung in der README) [README.md:82-94]. Andere ecke.lt-Produkte, die diese Schnittstellen nutzen, sind in der Landscape nicht verzeichnet [landscape:inventory/raw/url-shortener.yaml:136-142].

### Genutzt

| Schnittstelle | Anbieter | contractRef | Beleg |
|---|---|---|---|
| Worker-Laufzeit, Route `*ecke.lt/~*` in Zone `ecke.lt`, Custom Domain `kurz.ecke.lt` | Cloudflare Workers | `cloudflare-workers:runtime@1` | [worker/wrangler.toml:1-3; worker/wrangler.toml:18-24; landscape:inventory/raw/cloudflare.yaml:66-69] |
| KV-Namespace, Binding `URLS` (Schlüssel = Code, Wert = Ziel-URL) | Cloudflare Workers KV | `cloudflare-kv:kv@1` | [worker/wrangler.toml:12-13; worker/src/index.ts:2; worker/src/index.ts:131; worker/src/index.ts:166; landscape:inventory/raw/cloudflare.yaml:73-75] |
| Deploy per `wrangler deploy` (Secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) | Cloudflare Workers | `cloudflare-workers:deploy-api@1` | [.github/workflows/deploy.yml:29-34; worker/package.json:7] |
| Stylesheet `https://unpkg.com/bonsai.css@latest/dist/bonsai.min.css` (im Browser geladen) | unpkg | `unpkg:cdn@1` | [worker/src/index.ts:46; public/index.html:7] |
| GitHub Actions (Worker-Deploy; `docker-publish.yml` läuft ebenfalls, siehe Hinweis oben) | GitHub Actions | `github-actions:workflows@1` | [.github/workflows/deploy.yml:10-13] |

## Datenflüsse

1. **Kurzlink aufrufen:** Browser → `https://ecke.lt/~{code}` → Cloudflare-Route `*ecke.lt/~*` → Worker `url-shortener` liest `URLS[code]` aus KV → 301 auf die Ziel-URL, sonst 404 `Not found` [worker/wrangler.toml:18-20; worker/src/index.ts:127-134; landscape:inventory/raw/cloudflare.yaml:67].
2. **Kurzlink anlegen:** Web-Oberfläche oder iOS-Kurzbefehl → `POST https://kurz.ecke.lt/save` mit Bearer-Token → Worker prüft `AUTH_TOKEN`, bildet oder übernimmt den Code, schreibt `URLS[code] = url` in KV → Antwort mit `BASE_URL` + `/~` + Code [worker/src/index.ts:136-170; worker/wrangler.toml:5-6; README.md:82-94].
3. **Oberfläche laden:** Browser → `GET https://kurz.ecke.lt/` → Worker liefert eingebettetes HTML; das Stylesheet kommt von unpkg.com [worker/src/index.ts:121-125; worker/src/index.ts:46].
4. **Worker-Deploy:** Push auf `main`/`master` mit Änderungen unter `worker/**` → GitHub Actions: `npm ci`, `npm run typecheck`, `npm run deploy` (= `wrangler deploy`) mit `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` → Cloudflare setzt Script, Route und Custom Domain [.github/workflows/deploy.yml:3-34; worker/package.json:5-9; README.md:52-56]. Workers Builds (Git-Integration bei Cloudflare) ist nicht eingerichtet [landscape:inventory/raw/cloudflare.yaml:70; landscape:inventory/raw/cloudflare.yaml:157].
5. **Einmalige Migration:** `worker/migrate-sqlite.sh` liest `code`/`url` aus einer SQLite-Datei des Go-Servers und schreibt sie per `wrangler kv bulk put` in den KV-Namespace; bei doppelten Codes gewinnt der älteste Eintrag [worker/migrate-sqlite.sh:17-31; README.md:71-78].

## Live-Stand vs. Erbe

| Teil | Nachweis live | Beleg |
|---|---|---|
| Worker `url-shortener`, Route `*ecke.lt/~*` | ja (Cloudflare-Livedaten) | [landscape:inventory/raw/cloudflare.yaml:66-67; landscape:inventory/overlay.yaml:49-51] |
| Custom Domain `kurz.ecke.lt` → Worker | ja | [landscape:inventory/raw/cloudflare.yaml:68; landscape:inventory/raw/cloudflare.yaml:103; landscape:inventory/overlay.yaml:67-79] |
| Secret `AUTH_TOKEN`, Bindings `BASE_URL`, `URLS` (KV) | ja (nur Namen) | [landscape:inventory/raw/cloudflare.yaml:71-75] |
| `workers.dev`-Subdomain des Workers | aktiviert | [landscape:inventory/raw/cloudflare.yaml:69] |
| Ob der live laufende Worker-Code genau diesem Commit entspricht | unbekannt | siehe Offene Fragen |
| Go-Server (`url-shortener.go`, `database.go`, `public/`, Docker) | nicht in Betrieb (Altlast, B12) | [Nutzer-Auskunft 2026-09-27; landscape:backlog.md:20] |

## Abhängigkeiten

### Intern

Keine. url-shortener nutzt keine anderen ecke.lt-Produkte und keine internen Libraries [landscape:inventory/raw/url-shortener.yaml:98-142]. Die Domain `ecke.lt` teilt es sich mit anderen Produkten: Die Route `*ecke.lt/~*` greift auf allen proxied Hosts der Zone ohne spezifischere Route (C6) [landscape:inventory/overlay.yaml:155-164].

### Extern

| Anbieter / Leistung | Rolle | Beleg |
|---|---|---|
| Cloudflare Workers | Laufzeit, Route, Custom Domain, Deploy-Ziel | [worker/wrangler.toml:1-3; worker/wrangler.toml:18-24; landscape:inventory/raw/cloudflare.yaml:66-70] |
| Cloudflare Workers KV | Speicher der Kurzlinks (Binding `URLS`) | [worker/wrangler.toml:12-13; landscape:inventory/raw/cloudflare.yaml:75] |
| unpkg | CDN für `bonsai.css` (unversioniert `@latest`) | [worker/src/index.ts:46] |
| GitHub Actions | CI für den Worker-Deploy (`docker-publish.yml` läuft ebenfalls weiter, siehe Hinweis oben) | [.github/workflows/deploy.yml:10-13] |

Build-Werkzeuge (nur Entwicklung): `wrangler`, `typescript`, `@cloudflare/workers-types` im Worker [worker/package.json:10-14].

## Bekannte Lücken

- **Route zu weit (C6 → B4):** `*ecke.lt/~*` trifft nicht nur `ecke.lt`, sondern jeden proxied Host der Zone ohne eigene Route, z.B. `www.ecke.lt` und `book.ecke.lt` [worker/wrangler.toml:18-20; landscape:inventory/overlay.yaml:155-164]. Nicht beabsichtigt; der Wunsch steht im Backlog B4 [landscape:backlog.md:11].
- **Übrige Pfade auf ecke.lt liefern 526 (C7 → B8):** Nur `/~*` geht an den Worker, nur exakt `https://ecke.lt/` wird auf nils.ecke.lt umgeleitet; andere Pfade und `www.ecke.lt` enden mit 526 [landscape:inventory/overlay.yaml:80-95; landscape:inventory/overlay.yaml:165-171]. Backlog B8 [landscape:backlog.md:15].
- **Zufallscode ohne Kollisionsprüfung:** Kollidiert der Hash- oder Wunschcode mit einer anderen URL, wird ein Zufallscode erzeugt und ohne weitere Prüfung geschrieben; ein vorhandener Eintrag mit diesem Code würde überschrieben [worker/src/index.ts:160-166].
- **Wunschcode wird still ersetzt:** Ist der gewünschte Code schon mit einer anderen URL belegt, antwortet die API ohne Fehler mit einem anderen, zufälligen Code [worker/src/index.ts:156-169].
- **Auth nur, wenn `AUTH_TOKEN` gesetzt ist:** Ohne Secret nimmt `/save` jede Anfrage an; live ist das Secret gesetzt [worker/src/index.ts:138-143; landscape:inventory/raw/cloudflare.yaml:71-72].
- **README ungenau zum Deploy:** Laut README deployt jeder Push auf `master`; der Workflow startet aber nur bei Änderungen unter `worker/**` [README.md:8; README.md:67; .github/workflows/deploy.yml:3-7].
- **Ressourcen-IDs im Klartext:** Die KV-Namespace-IDs stehen in `worker/wrangler.toml` und `worker/migrate-sqlite.sh` (Werte hier bewusst nicht übernommen) [worker/wrangler.toml:14-15; worker/migrate-sqlite.sh:31].

## Offene Fragen

- Wie wurde der live laufende Worker deployt? Laut GitHub-Actions-Historie (abgefragt 2026-09-27 per `gh run list`) sind alle drei Läufe von „Deploy to Cloudflare Workers“ am 2026-06-06 im Schritt „Deploy“ fehlgeschlagen, während „Docker“ erfolgreich war. Workers Builds ist nicht eingerichtet; vermutlich wurde manuell mit `wrangler deploy` deployt. Ob der Live-Code diesem Commit entspricht, ist unbekannt.
- Wurde die Migration aus SQLite durchgeführt, und existiert die alte SQLite-Datenbank noch?
- Ist die aktivierte `workers.dev`-Subdomain des Workers gewollt?
- Wer nutzt die Kürz-API außer dem iOS-Kurzbefehl (z.B. andere Skripte)?
