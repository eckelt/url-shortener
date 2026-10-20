# Drift sperrt: Pflicht-Check in der CI (url-shortener)

Teil des Changes `drift-sperrt` (Proposal, Tasks und gemeinsame Specs in `ecke-lt-landscape/openspec/changes/drift-sperrt/`). Basis: `origin` von url-shortener (Soll je Variante über `scripts/soll-basis`).

## Warum
Modell (`twin.json`) und Specs sollen nicht still gegen den Code driften; heute zeigt der Twin Drift nur an.

## Was
- Neuer Workflow `.github/workflows/twin-check.yml` (Kopie der Vorlage aus ecke-lt-landscape): bei Push und PR `scripts/twin-check url-shortener=. --basis <before>`, Secret `TWIN_READ_TOKEN`, Notausgang Trailer `Drift-Ok: <Grund>`.
- Varianten a (Sperrklinke, Empfehlung), b (nur melden), c (Stufen je Bereich), siehe `variants/`. In a und c hängt `deploy.yml` per `needs` am Check.

## Auswirkungen
- `twin.json`: Container `ci-twin-check` (nutzt `ecke-lt-landscape:twin-check@1`), ADR `docs/adr/2026-10-20-drift-sperrt.md`.
- Dateien: `.github/workflows/twin-check.yml`, in a/c `.github/workflows/deploy.yml`, Spec `deploy`.
- Der Inhaber setzt `gh secret set TWIN_READ_TOKEN -R eckelt/url-shortener`.
