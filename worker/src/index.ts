export interface Env {
  URLS: KVNamespace;
  BASE_URL?: string;
  AUTH_TOKEN?: string;
}

const CODE_LENGTH = 4;
// Neue Codes: nur QR-Alphanumerik (0-9A-Z), mindestens ein Buchstabe.
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
// Pfade, die wie Codes aussehen, aber keine sein dürfen (ADR 2026-10-29-kurzlinks-fuer-qr-codes).
export const RESERVED = new Set(['SAVE']);
const HOME = 'https://nils.ecke.lt';
const APEX = 'ecke.lt';

const CODE_PATH = /^\/([A-Za-z0-9]{2,32})$/;
const WISH_CODE = /^[A-Za-z0-9]{2,32}$/;
const HAS_LETTER = /[A-Za-z]/;

async function sha256Short(url: string, length: number): Promise<string> {
  const data = new TextEncoder().encode(url);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return hashHex.slice(0, length).toUpperCase();
}

function randomCode(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  const chars = Array.from(array).map(b => CHARS[b % CHARS.length]);
  if (!chars.some(c => LETTERS.includes(c))) {
    chars[array[0] % length] = LETTERS[array[0] % LETTERS.length];
  }
  return chars.join('');
}

async function freeRandomCode(env: Env): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = randomCode(CODE_LENGTH + Math.floor(attempt / 5));
    if ((await env.URLS.get(code)) === null) return code;
  }
  throw new Error('Kein freier Code gefunden');
}

export function isValidWishCode(code: string): boolean {
  return WISH_CODE.test(code) && HAS_LETTER.test(code) && !RESERVED.has(code.toUpperCase());
}

function isValidURL(str: string): boolean {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function redirectHome(status: 301 | 302): Response {
  return Response.redirect(HOME, status);
}

/** Erst die erste, dann die zweite Schreibweise in URLS nachschlagen. */
async function lookup(env: Env, first: string, second: string): Promise<string | null> {
  const hit = await env.URLS.get(first);
  if (hit !== null || first === second) return hit;
  return env.URLS.get(second);
}

const HTML = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://design.ecke.lt/v1/styles.css">
    <title>URL-Shortener</title>
    <style>
        body {
            background: var(--bg) url("/bg-light.webp") repeat;
            background-size: 500px;
            min-height: 100vh;
        }
        @media (prefers-color-scheme: dark) {
            body {
                background-image: url("/bg-dark.webp");
                background-size: 627px;
            }
        }
        .content {
            background: var(--bg);
            border: var(--border-hairline);
            border-radius: var(--radius-lg);
            box-sizing: border-box;
            margin: var(--space-8) auto;
            max-width: 28rem;
            padding: var(--space-6);
        }
        @media (max-width: 30rem) {
            .content { margin: var(--space-4); }
        }
        .field, .result {
            display: flex;
            flex-direction: column;
            gap: var(--space-4);
        }
        label {
            color: var(--muted);
            display: flex;
            flex-direction: column;
            font-size: var(--text-sm);
            gap: var(--space-1);
        }
        input {
            background: var(--surface);
            border: var(--border-hairline);
            border-radius: var(--radius-lg);
            box-sizing: border-box;
            color: var(--text);
            font: inherit;
            padding: var(--space-2) var(--space-3);
            width: 100%;
        }
        input:focus {
            border-color: var(--accent);
            box-shadow: var(--ring-focus);
            outline: none;
        }
        .ecke-button {
            cursor: pointer;
            font: inherit;
            font-weight: var(--weight-medium);
            width: 100%;
        }
        .result {
            background: var(--surface);
            border: var(--border-hairline);
            border-radius: var(--radius-md);
            margin-top: var(--space-5);
            padding: var(--space-4);
        }
        .row { display: flex; flex-direction: column; gap: var(--space-2); }
        .row + .row { border-top: var(--border-hairline); padding-top: var(--space-4); }
        .row-label { color: var(--muted); font-size: var(--text-sm); }
        .row-value { overflow-wrap: anywhere; font-family: var(--font-mono, monospace); }
        .result .ecke-button { width: auto; align-self: flex-start; }
    </style>
</head>
<body>
    <div class="content">
        <div class="field">
            <label>URL
                <input id="txtUrl" name="url" type="text"
                    placeholder="https://example.com/very/long?stuff=that&nobody=wants&to=read">
            </label>
            <label>Code
                <input id="txtCode" name="code" type="text" placeholder="(optional)">
            </label>
            <label>Token
                <input id="txtToken" name="token" type="password" placeholder="Auth-Token">
            </label>
            <button class="ecke-button" aria-label="Kürzen" onclick="save()">Kürzen</button>
        </div>
        <div id="resultContainer" class="result" style="display:none;">
            <span id="error" class="row-value" style="display:none;"></span>
            <div class="row" id="rowShare">
                <span class="row-label">Zum Teilen</span>
                <span class="row-value" id="result"></span>
                <button class="ecke-button" aria-label="Kurzlink kopieren" onclick="copy('result')">Kopieren</button>
            </div>
            <div class="row" id="rowQr">
                <span class="row-label">Für QR-Codes (alles groß, kleinerer Code)</span>
                <span class="row-value" id="resultQr"></span>
                <button class="ecke-button" aria-label="QR-Schreibweise kopieren" onclick="copy('resultQr')">Kopieren</button>
            </div>
        </div>
    </div>
    <script>
        function save() {
            const token = document.getElementById('txtToken').value;
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = 'Bearer ' + token;

            fetch('/save', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    url: document.getElementById('txtUrl').value,
                    code: document.getElementById('txtCode').value
                })
            })
            .then(r => r.json())
            .then(data => {
                const ok = !data.error;
                document.getElementById('resultContainer').style.display = 'flex';
                document.getElementById('error').style.display = ok ? 'none' : 'block';
                document.getElementById('error').textContent = data.error || '';
                document.getElementById('rowShare').style.display = ok ? 'flex' : 'none';
                document.getElementById('rowQr').style.display = ok ? 'flex' : 'none';
                document.getElementById('result').textContent = ok ? data.url : '';
                document.getElementById('resultQr').textContent = ok ? data.qrUrl : '';
            })
            .catch(err => console.error(err));
        }

        function copy(id) {
            navigator.clipboard.writeText(document.getElementById(id).textContent);
        }
    </script>
</body>
</html>`;

async function save(request: Request, env: Env, url: URL): Promise<Response> {
  if (env.AUTH_TOKEN) {
    const auth = request.headers.get('Authorization');
    if (auth !== `Bearer ${env.AUTH_TOKEN}`) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
  }

  let body: { url?: string; code?: string };
  try {
    body = await request.json() as { url?: string; code?: string };
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  if (!body.url || !isValidURL(body.url)) {
    return jsonResponse({ error: 'Not a valid URL' }, 400);
  }

  let code: string;
  let key: string;
  if (body.code) {
    // Wunschcode: Schreibweise bleibt in der Antwort, Schlüssel ist großgeschrieben.
    if (typeof body.code !== 'string' || !isValidWishCode(body.code)) {
      return jsonResponse({ error: 'Ungültiger Code' }, 400);
    }
    code = body.code;
    key = code.toUpperCase();
    // Belegt, wenn der Code in eingegebener oder großer Schreibweise auf ein anderes Ziel zeigt
    // (alte Codes liegen in ihrer Schreibweise, neue groß).
    for (const k of new Set([code, key])) {
      const existing = await env.URLS.get(k);
      if (existing !== null && existing !== body.url) {
        return jsonResponse({ error: 'Code belegt' }, 409);
      }
    }
  } else {
    key = await sha256Short(body.url, CODE_LENGTH);
    const digitsOnly = /^[0-9]+$/.test(key);
    const existing = digitsOnly ? null : await env.URLS.get(key);
    if (digitsOnly || (existing !== null && existing !== body.url)) {
      key = await freeRandomCode(env);
    }
    code = key;
  }

  await env.URLS.put(key, body.url);

  const base = env.BASE_URL ?? `https://${url.hostname}`;
  const shortUrl = `${base}/${code}`;
  return jsonResponse({ url: shortUrl, qrUrl: shortUrl.toUpperCase(), code, error: '' });
}

async function handle(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method;
  const apexHost = env.BASE_URL ? new URL(env.BASE_URL).hostname : APEX;
  const onApex = url.hostname === apexHost;

  // HEAD wie GET: Link-Vorschauen in Chats fragen oft nur mit HEAD.
  if (method === 'GET' || method === 'HEAD') {
    // Kurzlink /CODE oder alte Form /~code (~ wird entfernt): erst exakt (alte Codes wie au5H),
    // dann großgeschrieben (neue Codes liegen groß in URLS), also Groß/Klein egal.
    const tilde = pathname.startsWith('/~');
    const code = tilde ? pathname.slice(2) : CODE_PATH.exec(pathname)?.[1];
    if (code) {
      const target = await lookup(env, code, code.toUpperCase());
      if (target !== null) return Response.redirect(target, 301);
    }
    if (tilde) return new Response('Not found', { status: 404 });
  }

  if (onApex) {
    // Normalerweise beantwortet die Zonenregel „To Visitencard“ / schon vor dem Worker (im Dashboard, unverändert).
    if (pathname === '/') return redirectHome(301);
    return redirectHome(302);
  }

  if (pathname === '/' && method === 'GET') {
    return new Response(HTML, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
    });
  }

  if (pathname === '/save' && method === 'POST') {
    return save(request, env, url);
  }

  return new Response('Not found', { status: 404 });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await handle(request, env);
    } catch {
      return redirectHome(302);
    }
  },
};
