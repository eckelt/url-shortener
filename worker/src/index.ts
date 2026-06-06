export interface Env {
  URLS: KVNamespace;
  BASE_URL?: string;
  AUTH_TOKEN?: string;
}

const CODE_LENGTH = 4;
const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

async function sha256Short(url: string, length: number): Promise<string> {
  const data = new TextEncoder().encode(url);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return hashHex.slice(0, length);
}

function randomCode(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => CHARS[b % CHARS.length]).join('');
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

const HTML = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://unpkg.com/bonsai.css@latest/dist/bonsai.min.css" rel="stylesheet">
    <title>URL-Shortener</title>
    <style>
        body {
            font-family: "Alegreya Sans", sans-serif;
            height: 100vh;
        }
        .content {
            margin: 20vh auto;
            width: 400px;
        }
        @media only screen and (max-width: 600px) {
            .content { width: 85vw; }
        }
    </style>
</head>
<body>
    <div class="content">
        <figure class="accent" style="--mb:1.5rem; --w:100%">
            <figcaption>
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
                <button class="red" style="--w:100%" aria-label="Kürzen" onclick="save()">Kürzen</button>
            </figcaption>
        </figure>
        <figure id="resultContainer" class="accent" style="--mb:1.5rem; --w:100%; display:none;">
            <figcaption>
                <span id="result"></span>
                <button class="red" style="--w:100%; --mt:0.5rem" aria-label="Kopieren" onclick="copy()">In die Zwischenablage</button>
            </figcaption>
        </figure>
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
                document.getElementById('resultContainer').style.display = 'block';
                document.getElementById('result').textContent = data.error || data.url;
            })
            .catch(err => console.error(err));
        }

        function copy() {
            navigator.clipboard.writeText(document.getElementById('result').textContent);
        }
    </script>
</body>
</html>`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    if (pathname === '/' && method === 'GET') {
      return new Response(HTML, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
      });
    }

    // Redirect: /~au5H → original URL
    if (pathname.startsWith('/~') && method === 'GET') {
      const code = pathname.slice(2);
      if (!code) return new Response('Not found', { status: 404 });
      const target = await env.URLS.get(code);
      if (!target) return new Response('Not found', { status: 404 });
      return Response.redirect(target, 301);
    }

    // Create short URL
    if (pathname === '/save' && method === 'POST') {
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

      let code = body.code && body.code.length >= 2
        ? body.code
        : await sha256Short(body.url, CODE_LENGTH);

      // Collision: same code, different URL → random code
      const existing = await env.URLS.get(code);
      if (existing && existing !== body.url) {
        code = randomCode(CODE_LENGTH);
      }

      await env.URLS.put(code, body.url);

      const base = env.BASE_URL ?? `https://${url.hostname}`;
      return jsonResponse({ url: `${base}/~${code}`, code: `~${code}`, error: '' });
    }

    return new Response('Not found', { status: 404 });
  },
};
