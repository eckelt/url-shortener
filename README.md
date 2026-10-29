# url-shortener

Cloudflare Worker-basierter URL-Shortener. Kurz-URLs haben das Format `https://ecke.lt/C2D4`, Groß/Klein egal; für QR-Codes ganz groß (`HTTPS://ECKE.LT/C2D4`, kleinerer Code im Alphanumerik-Modus).

- **Kurz-URLs:** `https://ecke.lt/{CODE}` (via Cloudflare Route `ecke.lt/*`); alte Links `https://ecke.lt/~{code}` gehen weiter
- **Startseite:** `https://ecke.lt/` leitet die Zonenregel „To Visitencard“ auf `https://nils.ecke.lt` um (vor dem Worker); andere Pfade ohne Code → 302 dorthin
- **Web-UI & API:** `https://kurz.ecke.lt` (via Cloudflare Custom Domain)
- **Storage:** Cloudflare KV (kein Server, keine Datenbank)
- **Deploy:** automatisch via GitHub Actions bei Push auf `master`

---

## Einmaliges Setup (neuer Account / neue Domain)

### 1. Wrangler einloggen

```bash
cd worker
npm install
npx wrangler login
```

### 2. KV Namespace erstellen

```bash
npx wrangler kv namespace create URLS
npx wrangler kv namespace create URLS --preview
```

Die zurückgegebenen IDs in `worker/wrangler.toml` eintragen:

```toml
[[kv_namespaces]]
binding = "URLS"
id = "HIER_PRODUKTIONS_ID"
preview_id = "HIER_PREVIEW_ID"
```

### 3. Auth-Token setzen

```bash
echo "mein-geheimes-token" | npx wrangler secret put AUTH_TOKEN
```

Oder im Cloudflare Dashboard: **Workers & Pages → url-shortener → Settings → Variables and Secrets → Add → Secret**

### 4. Deployen

```bash
npx wrangler deploy
```

Wrangler setzt dabei automatisch:
- Route `ecke.lt/*` (Kurz-URLs, Standard „fail closed“)
- Custom Domain `kurz.ecke.lt` (Web-UI & API)

Kein manuelles Klicken im Dashboard nötig — alles steht in `wrangler.toml`.

### 5. GitHub Actions (für Auto-Deploy)

Im GitHub Repo unter **Settings → Secrets and variables → Actions**:

| Secret | Wo finden |
|--------|-----------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens → Create Token → "Edit Cloudflare Workers" |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → rechte Seitenleiste |

Ab dann deployed jeder Push auf `master` automatisch.

---

## Migration von SQLite (alter Go-Shortener)

```bash
cd worker
./migrate-sqlite.sh /pfad/zur/db.sqlite
```

Importiert alle Einträge aus der alten Datenbank in KV. Bei doppelten Codes wird der älteste Eintrag behalten.

---

## iOS Shortcut

URL direkt aus dem Teilen-Menü kürzen:

1. Neue Kurzbefehl-Aktion: **„URL abrufen"**
2. Einstellungen:
   - URL: `https://kurz.ecke.lt/save`
   - Methode: `POST`
   - Header: `Authorization` → `Bearer mein-geheimes-token`
   - Header: `Content-Type` → `application/json`
   - Body: `{"url": "SHORTCUT_EINGABE"}`
3. Als Eingabe: **Shortcut-Eingabe** (URL aus Teilen-Menü)
4. Ergebnis-Aktion: JSON parsen → `url` ausgeben oder in Zwischenablage kopieren

---

## API

### URL kürzen

```bash
curl -X POST https://kurz.ecke.lt/save \
  -H "Authorization: Bearer mein-token" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/sehr/langer/pfad"}'
```

Antwort:
```json
{"url": "https://ecke.lt/C2D4", "qrUrl": "HTTPS://ECKE.LT/C2D4", "code": "C2D4", "error": ""}
```

Optionaler eigener Code:
```bash
curl -X POST https://kurz.ecke.lt/save \
  -H "Authorization: Bearer mein-token" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "code": "Hallo"}'
```

Wunschcodes: `[A-Za-z0-9]{2,32}` mit mindestens einem Buchstaben, gespeichert großgeschrieben (`HALLO`), Antwort in eingegebener Schreibweise (`https://ecke.lt/Hallo`). Belegt → 409 `Code belegt`, ungültig oder reserviert (`save`) → 400 `Ungültiger Code`.

### URL aufrufen

`GET https://ecke.lt/c2d4` (oder `C2D4`, `~C2D4`) → 301 Redirect zur Originalurl. Nachgeschlagen wird erst exakt (alte Codes wie `au5H`), dann großgeschrieben.

Neue Seiten auf `ecke.lt` nutzen nie einen Pfad aus genau einem Abschnitt nur aus Buchstaben und Ziffern (siehe `docs/adr/2026-10-29-kurzlinks-fuer-qr-codes.md`).

---

## Lokale Entwicklung

```bash
cd worker
npx wrangler dev
npm test        # Tests (node --test, KV gemockt)
```

Für lokale Secrets eine `.dev.vars` Datei anlegen (wird nicht committet):

```
AUTH_TOKEN=mein-lokales-token
```

---

## Warum Cloudflare Workers?

Der alte Go+SQLite+Docker-Ansatz brauchte einen dauerlaufenden Server (~4€/Monat).
Workers laufen serverless am Cloudflare Edge — für persönlichen Gebrauch dauerhaft kostenlos (100.000 Requests/Tag, 1.000 KV-Writes/Tag).
