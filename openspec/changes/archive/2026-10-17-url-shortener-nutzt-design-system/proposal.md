# URL-Shortener nutzt Design System

## Warum
Damit alle Tools konsistent aussehen (Nils, Werkbank-Skizze 2026-10-17: url-shortener → ecke-design-system „Nutzt“). nils.ecke.lt, booking und blog binden `ecke-design-system:styles@1` schon ein; der url-shortener ist das letzte Tool mit eigener Optik.

Heute lädt das Formular auf kurz.ecke.lt `bonsai.css@latest` von unpkg (ungepinnt) und setzt die Schrift „Alegreya Sans“, die nirgends geladen wird (`worker/src/index.ts:41-60`).

## Was
`worker/src/index.ts` (Konstante `HTML`) bindet `https://ecke-design-system.pages.dev/v1/styles.css` statt bonsai.css ein. Die bonsai-Klassen und -Variablen (`figure.accent`, `button.red`, `--w`, `--mb`) entfallen; der Knopf nutzt die Button-Komponente des Design-Systems, Abstände und Farben kommen aus den Tokens. Weiterleitung und `/save` ändern sich nicht.

## Alternativen
Das Design-System hat einen Button, aber kein Eingabefeld (`v1/components/atoms/`: button, eyebrow, heading, tag):
- **a: Felder lokal stylen**: Der Worker stylt Label und Eingabefelder selbst mit den Tokens. Klein und nur in diesem Repo.
- **b: Atom `input` im Design-System**: Neues Atom `v1/components/atoms/input.css` mit Story; der url-shortener nutzt es. Zwei Repos, aber das nächste Formular (z.B. booking) bekommt es geschenkt.

Wahl: **a** (Freigabe in der Werkbank 2026-10-17 ohne ausdrückliche Wahl; angezeigt war a). `twin.json` im Change ist das Soll von a. b bleibt als möglicher eigener Change im Design-System.

## Auswirkungen
- Specs: `link-creation` (Formular-Optik aus dem Design-System); bei b zusätzlich `components` im Design-System.
- Laufzeitabhängigkeit: kurz.ecke.lt lädt CSS von ecke-design-system.pages.dev statt unpkg (CORS offen, ein Jahr immutable).
- Drift: Die Abhängigkeit zu unpkg entfällt.
