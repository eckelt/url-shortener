// Tests des Workers url-shortener (node --test, KV gemockt).
// Kennungen spec:<capability>/<requirement>/<szenario> nach CONVENTIONS.md der Landscape.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import worker from '../src/index.ts';

const HOME = 'https://nils.ecke.lt/';

function kv(entries = {}, { failGet = false } = {}) {
  const store = new Map(Object.entries(entries));
  const reads = [];
  const writes = [];
  return {
    store, reads, writes,
    async get(key) {
      reads.push(key);
      if (failGet) throw new Error('KV nicht erreichbar');
      return store.has(key) ? store.get(key) : null;
    },
    async put(key, value) {
      writes.push([key, value]);
      store.set(key, value);
    },
  };
}

function env(entries, opts) {
  return { URLS: kv(entries, opts), BASE_URL: 'https://ecke.lt' };
}

const get = (e, url) => worker.fetch(new Request(url), e);

function save(e, body, { host = 'kurz.ecke.lt', token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return worker.fetch(new Request(`https://${host}/save`, {
    method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body),
  }), e);
}

async function hashCode(url) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(url));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 4).toUpperCase();
}

function assertRedirect(res, status, location) {
  assert.equal(res.status, status);
  assert.equal(res.headers.get('Location'), location);
}

const NEW_CODE = /^(?=.*[A-Z])[0-9A-Z]{4,}$/;

// ---------- short-links ----------

// spec:short-links/kurzlinks-direkt-unter-ecke-lt/qr-schreibweise
test('QR-Schreibweise löst auf', async () => {
  const e = env({ HALLO: 'https://example.com/hallo' });
  const url = new URL('HTTPS://ECKE.LT/HALLO');
  assert.equal(url.href, 'https://ecke.lt/HALLO');
  assertRedirect(await get(e, url.href), 301, 'https://example.com/hallo');
});

// spec:short-links/kurzlinks-direkt-unter-ecke-lt/im-chat-klein-geschrieben
test('Klein und gemischt geschrieben löst auf', async () => {
  const e = env({ HALLO: 'https://example.com/hallo' });
  assertRedirect(await get(e, 'https://ecke.lt/hallo'), 301, 'https://example.com/hallo');
  assertRedirect(await get(e, 'https://ecke.lt/Hallo'), 301, 'https://example.com/hallo');
  assertRedirect(await get(e, 'https://kurz.ecke.lt/hallo'), 301, 'https://example.com/hallo');
});

// spec:short-links/kurzlinks-direkt-unter-ecke-lt/alter-code-ohne-tilde
test('Alter gemischter Code ohne Tilde, ohne Migration', async () => {
  const e = env({ au5H: 'https://example.com/alt' });
  assertRedirect(await get(e, 'https://ecke.lt/au5H'), 301, 'https://example.com/alt');
  assert.deepEqual(e.URLS.writes, []);
});

// spec:short-links/weiterleitung-auf-nils-ecke-lt/startseite-ohne-regel
test('Startseite im Worker → 301 nils.ecke.lt', async () => {
  assertRedirect(await get(env({}), 'https://ecke.lt/'), 301, HOME);
});

// spec:short-links/weiterleitung-auf-nils-ecke-lt/unbekannter-code
test('Unbekannter Code auf ecke.lt → 302 nils.ecke.lt', async () => {
  const e = env({});
  assertRedirect(await get(e, 'https://ecke.lt/NIXDA'), 302, HOME);
  assert.deepEqual(e.URLS.reads, ['NIXDA']);
});

// spec:short-links/weiterleitung-auf-nils-ecke-lt/pfad-der-kein-code-sein-kann
test('Pfad, der kein Code sein kann → 302 ohne KV', async () => {
  const e = env({});
  assertRedirect(await get(e, 'https://ecke.lt/wp-login.php'), 302, HOME);
  assertRedirect(await get(e, 'https://ecke.lt/seiten/impressum'), 302, HOME);
  assert.deepEqual(e.URLS.reads, []);
});

// spec:short-links/weiterleitung-auf-nils-ecke-lt/kv-nicht-erreichbar
test('KV-Ausnahme → 302 nils.ecke.lt', async () => {
  const e = env({}, { failGet: true });
  assertRedirect(await get(e, 'https://ecke.lt/HALLO'), 302, HOME);
  assertRedirect(await get(e, 'https://ecke.lt/~au5H'), 302, HOME);
});

// spec:short-links/weiterleitung-per-kurzcode/bekannter-code
test('Alter Link /~au5H', async () => {
  const e = env({ au5H: 'https://example.com/alt' });
  assertRedirect(await get(e, 'https://ecke.lt/~au5H'), 301, 'https://example.com/alt');
});

test('HEAD löst wie GET auf (Link-Vorschau)', async () => {
  const e = env({ au5H: 'https://example.com/alt' });
  assertRedirect(await worker.fetch(new Request('https://ecke.lt/~au5H', { method: 'HEAD' }), e), 301, 'https://example.com/alt');
});

// spec:short-links/weiterleitung-per-kurzcode/neuer-code-mit-tilde
test('Neuer Code mit Tilde', async () => {
  const e = env({ HALLO: 'https://example.com/hallo' });
  assertRedirect(await get(e, 'https://ecke.lt/~hallo'), 301, 'https://example.com/hallo');
});

// spec:short-links/weiterleitung-per-kurzcode/alter-wunschcode-mit-bindestrich
test('Alter Wunschcode mit Bindestrich', async () => {
  const e = env({ 'mein-vortrag': 'https://example.com/vortrag' });
  assertRedirect(await get(e, 'https://ecke.lt/~mein-vortrag'), 301, 'https://example.com/vortrag');
});

// spec:short-links/weiterleitung-per-kurzcode/unbekannter-oder-leerer-code
test('Unbekannter oder leerer Code nach /~ → 404', async () => {
  for (const url of ['https://ecke.lt/~', 'https://ecke.lt/~nixda', 'https://kurz.ecke.lt/~nixda']) {
    const res = await get(env({}), url);
    assert.equal(res.status, 404, url);
    assert.equal(await res.text(), 'Not found');
  }
});

const toml = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');
const routes = [...toml.matchAll(/\[\[routes\]\]\s*\npattern = "([^"]+)"\s*\n(\w+) = ([^\n]+)/g)]
  .map(m => ({ pattern: m[1], [m[2]]: m[3] }));

// spec:short-links/erreichbarkeit-ueber-route-und-custom-domain/aufruf-ueber-ecke-lt
test('Route ecke.lt/* in Zone ecke.lt, Custom Domain kurz.ecke.lt', () => {
  assert.deepEqual(routes, [
    { pattern: 'ecke.lt/*', zone_name: '"ecke.lt"' },
    { pattern: 'kurz.ecke.lt', custom_domain: 'true' },
  ]);
});

// spec:short-links/erreichbarkeit-ueber-route-und-custom-domain/aufruf-ueber-andere-hosts-der-zone
test('Keine Route für andere Hosts der Zone', () => {
  for (const r of routes) assert.ok(['ecke.lt/*', 'kurz.ecke.lt'].includes(r.pattern), r.pattern);
  assert.ok(!toml.includes('*.ecke.lt'));
});

// spec:short-links/sonstige-anfragen/unbekannter-pfad-auf-kurz-ecke-lt
test('Unbekannter Pfad auf kurz.ecke.lt → 404', async () => {
  for (const url of ['https://kurz.ecke.lt/ueber-mich', 'https://kurz.ecke.lt/NIXDA']) {
    const res = await get(env({}), url);
    assert.equal(res.status, 404, url);
  }
});

// ---------- link-creation ----------

// spec:link-creation/kuerz-api/erfolgreiches-kuerzen
test('Kürzen ohne Wunschcode', async () => {
  const e = { ...env({}), AUTH_TOKEN: 'geheim' };
  const res = await save(e, { url: 'https://example.com/lang' }, { token: 'geheim' });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.match(data.code, NEW_CODE);
  assert.equal(data.url, `https://ecke.lt/${data.code}`);
  assert.equal(data.qrUrl, `HTTPS://ECKE.LT/${data.code}`);
  assert.equal(data.error, '');
  assert.equal(e.URLS.store.get(data.code), 'https://example.com/lang');
  assert.equal((await save(e, { url: 'https://example.com/lang' })).status, 401);
});

// spec:link-creation/kuerz-api/wunschcode-in-eigener-schreibweise
test('Wunschcode Hallo', async () => {
  const e = env({});
  const data = await (await save(e, { url: 'https://example.com', code: 'Hallo' })).json();
  assert.deepEqual(data, { url: 'https://ecke.lt/Hallo', qrUrl: 'HTTPS://ECKE.LT/HALLO', code: 'Hallo', error: '' });
  assert.deepEqual(e.URLS.writes, [['HALLO', 'https://example.com']]);
});

// spec:link-creation/kuerz-api/ungueltiger-body
test('Ungültiges JSON', async () => {
  const res = await save(env({}), '{kaputt');
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { error: 'Invalid JSON' });
});

// spec:link-creation/kuerz-api/ungueltige-url
test('Ungültige URL', async () => {
  for (const body of [{}, { url: 'ftp://example.com' }, { url: 'kein link' }]) {
    const res = await save(env({}), body);
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { error: 'Not a valid URL' });
  }
});

// spec:link-creation/kuerz-api/basis-url-ohne-variable
test('Ohne BASE_URL zählt der Host der Anfrage', async () => {
  const e = { URLS: kv() };
  const data = await (await save(e, { url: 'https://example.com', code: 'Hallo' }, { host: 'kurz.ecke.lt' })).json();
  assert.equal(data.url, 'https://kurz.ecke.lt/Hallo');
});

// spec:link-creation/code-vergabe/gleiche-url-erneut
test('Gleiche URL ergibt denselben Hash-Code', async () => {
  let url = 'https://example.com/a';
  for (let i = 0; /^[0-9]+$/.test(await hashCode(url)); i++) url = `https://example.com/a${i}`;
  const e = env({});
  const a = await (await save(e, { url })).json();
  const b = await (await save(e, { url })).json();
  assert.equal(a.code, await hashCode(url));
  assert.equal(b.code, a.code);
  assert.deepEqual(e.URLS.writes, [[a.code, url], [a.code, url]]);
});

// spec:link-creation/code-vergabe/wunschcode-belegt
test('Belegter Wunschcode → 409', async () => {
  for (const [entries, code] of [[{ HALLO: 'https://anders.example' }, 'hallo'], [{ au5H: 'https://alt.example' }, 'au5H']]) {
    const e = env(entries);
    const res = await save(e, { url: 'https://example.com', code });
    assert.equal(res.status, 409);
    assert.deepEqual(await res.json(), { error: 'Code belegt' });
    assert.deepEqual(e.URLS.writes, []);
  }
});

// spec:link-creation/code-vergabe/wunschcode-ungueltig-oder-reserviert
test('Ungültiger oder reservierter Wunschcode → 400', async () => {
  for (const code of ['a', 'x'.repeat(33), 'mein-vortrag', 'hä', '2026', 'save', 'SAVE']) {
    const e = env({});
    const res = await save(e, { url: 'https://example.com', code });
    assert.equal(res.status, 400, code);
    assert.deepEqual(await res.json(), { error: 'Ungültiger Code' });
    assert.deepEqual(e.URLS.writes, []);
  }
});

// spec:link-creation/code-vergabe/hash-code-nur-aus-ziffern
test('Hash-Code nur aus Ziffern → Zufallscode mit Buchstabe', async () => {
  let url;
  for (let i = 0; ; i++) {
    url = `https://example.com/${i}`;
    if (/^[0-9]+$/.test(await hashCode(url))) break;
  }
  const e = env({});
  const data = await (await save(e, { url })).json();
  assert.match(data.code, NEW_CODE);
  assert.notEqual(data.code, await hashCode(url));
  assert.equal(e.URLS.store.get(data.code), url);
});

// spec:link-creation/code-vergabe/kollision
test('Hash-Kollision → freier Zufallscode, kein Fehler', async () => {
  let url = 'https://example.com/b';
  for (let i = 0; /^[0-9]+$/.test(await hashCode(url)); i++) url = `https://example.com/b${i}`;
  const hash = await hashCode(url);
  const e = env({ [hash]: 'https://anders.example' });
  const res = await save(e, { url });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.error, '');
  assert.match(data.code, NEW_CODE);
  assert.notEqual(data.code, hash);
  assert.equal(e.URLS.store.get(hash), 'https://anders.example');
  assert.equal(e.URLS.store.get(data.code), url);
});

async function page() {
  const res = await get(env({}), 'https://kurz.ecke.lt/');
  return { res, html: await res.text() };
}

/** Führt das Skript der Seite mit einem minimalen DOM, fetch und Zwischenablage aus. */
async function runPage(html, values, response) {
  const els = {};
  const el = id => (els[id] ??= { id, value: values[id] ?? '', textContent: '', style: {} });
  const calls = [];
  const clipboard = [];
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const fetchStub = async (url, init) => { calls.push([url, init]); return { json: async () => response }; };
  const scope = new Function('document', 'fetch', 'navigator', 'console',
    `${script}; return { save, copy };`)(
    { getElementById: el }, fetchStub, { clipboard: { writeText: t => clipboard.push(t) } }, console);
  scope.save();
  await new Promise(r => setTimeout(r, 0));
  return { els: el, calls, clipboard, scope };
}

// spec:link-creation/web-oberflaeche/aufruf-der-oberflaeche
test('GET / auf kurz.ecke.lt liefert HTML', async () => {
  const { res, html } = await page();
  assert.equal(res.headers.get('Content-Type'), 'text/html;charset=UTF-8');
  assert.match(html, /id="txtUrl"/);
  assert.match(html, /id="txtCode"/);
  assert.match(html, /id="txtToken"/);
});

// spec:link-creation/web-oberflaeche/kuerzen-ueber-die-oberflaeche
test('Kürzen über die Oberfläche', async () => {
  const { html } = await page();
  const ok = { url: 'https://ecke.lt/Hallo', qrUrl: 'HTTPS://ECKE.LT/HALLO', code: 'Hallo', error: '' };
  const { els, calls } = await runPage(html, { txtUrl: 'https://example.com', txtCode: 'Hallo', txtToken: 't0k' }, ok);
  assert.equal(calls[0][0], '/save');
  assert.equal(calls[0][1].method, 'POST');
  assert.equal(calls[0][1].headers.Authorization, 'Bearer t0k');
  assert.deepEqual(JSON.parse(calls[0][1].body), { url: 'https://example.com', code: 'Hallo' });
  assert.equal(els('result').textContent, 'https://ecke.lt/Hallo');
  assert.equal(els('resultQr').textContent, 'HTTPS://ECKE.LT/HALLO');
  assert.match(html, /Zum Teilen/);
  assert.match(html, /Für QR-Codes/);

  const bad = await runPage(html, { txtUrl: 'x' }, { error: 'Not a valid URL' });
  assert.equal(bad.els('error').textContent, 'Not a valid URL');
  assert.equal(bad.els('rowQr').style.display, 'none');
});

// spec:link-creation/web-oberflaeche/qr-schreibweise-kopieren
test('Kopieren in beiden Zeilen', async () => {
  const { html } = await page();
  const ok = { url: 'https://ecke.lt/Hallo', qrUrl: 'HTTPS://ECKE.LT/HALLO', code: 'Hallo', error: '' };
  const { scope, clipboard } = await runPage(html, { txtUrl: 'https://example.com' }, ok);
  const qrButton = html.match(/<button[^>]*onclick="(copy\('resultQr'\))"[^>]*>Kopieren<\/button>/);
  const shareButton = html.match(/<button[^>]*onclick="(copy\('result'\))"[^>]*>Kopieren<\/button>/);
  assert.ok(qrButton && shareButton);
  scope.copy('resultQr');
  scope.copy('result');
  assert.deepEqual(clipboard, ['HTTPS://ECKE.LT/HALLO', 'https://ecke.lt/Hallo']);
});

// spec:link-creation/web-oberflaeche/optik-aus-dem-design-system
test('Optik aus dem Design-System', async () => {
  const { html } = await page();
  assert.match(html, /<link rel="stylesheet" href="https:\/\/design\.ecke\.lt\/v1\/styles\.css">/);
  assert.ok(!html.includes('unpkg.com'));
  assert.match(html, /class="ecke-button"/);
  assert.match(html, /prefers-color-scheme: dark/);
  const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
  assert.ok(!/#[0-9a-fA-F]{3,6}\b|rgb\(/.test(css), 'eigene Farben nur über Tokens');
});

// spec:link-creation/web-oberflaeche/hintergrund
test('Hintergrund hell/dunkel aus Static Assets', async () => {
  const { html } = await page();
  assert.match(html, /url\("\/bg-light\.webp"\)/);
  assert.match(html, /url\("\/bg-dark\.webp"\)/);
  assert.match(html, /\.content \{\s*background: var\(--bg\)/);
  assert.match(toml, /\[assets\]\s*\ndirectory = "\.\/assets"/);
});
