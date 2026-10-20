# twin-check kommt als dünne Workflow-Kopie in jedes Repo; die Logik bleibt zentral in ecke-lt-landscape

Status: vorgeschlagen
Datum: 2026-10-20
Change: drift-sperrt

## Kontext
Struktur-Drift (Schema, contractRef-Auflösung, Fundstellen) soll in der CI jedes Produkt-Repos geprüft werden, nicht erst im Twin-Bau alle drei Stunden. Die Prüflogik (`build-twin`, Schemas, Landscape) liegt im privaten Repo `eckelt/ecke-lt-landscape`; blog, booking und url-shortener sind öffentlich, ecke-design-system und nils.ecke.lt privat. Das Konto ist ein Nutzerkonto (keine Organisation, keine Konto-Secrets). Deploys laufen per CI, der Inhaber setzt nur Secret-Werte. Offen ist zudem, wie streng der Check sperrt (Varianten a–c); diese Wahl trägt nach der Variantenwahl einen eigenen Abschnitt.

## Entscheidung
Jedes Repo bekommt `.github/workflows/twin-check.yml` als Kopie einer Vorlage aus `templates/twin-check.yml`, die `eckelt/ecke-lt-landscape` mit `TWIN_READ_TOKEN` auscheckt und `scripts/twin-check` aufruft; `twin-check` warnt, wenn die Kopie von der Vorlage abweicht.

## Betrachtete Optionen
- **Dünne Kopie + zentrales Skript per Checkout (gewählt).** Für: funktioniert für öffentliche und private Repos gleich; die Logik ändert sich zentral ohne Kopien anzufassen; lokal identisch aufrufbar. Wider: Secret `TWIN_READ_TOKEN` in fünf weiteren Repos (auch öffentlichen; Fork-PRs sehen es nicht); Kopien können veralten (abgefangen durch die Warnung „Vorlage veraltet“). Grund der Wahl: einzige Option ohne neues Repo oder Sichtbarkeitsänderung, die alle Repos erreicht.
- **Wiederverwendbarer Workflow (`workflow_call`) aus ecke-lt-landscape.** Für: eine Datei, Aufruf mit `uses: eckelt/ecke-lt-landscape/.github/workflows/twin-check.yml@main`. Wider: aus einem privaten Repo nur für private Repos desselben Kontos teilbar (Einstellung „Access“), also nicht für blog, booking, url-shortener; der aufgerufene Workflow bräuchte trotzdem ein Token zum Lesen der Landscape. Verworfen.
- **Composite Action in einem neuen öffentlichen Repo (z.B. `eckelt/twin-check`).** Für: sauber versionierbar (`@v1`), für alle Repos aufrufbar. Wider: Werkzeug-Code der Landscape würde öffentlich bzw. dupliziert; neues Repo mit eigenem Release-Fluss; die Landscape-Daten (Manifeste der anderen Repos) brauchen ohnehin ein Token. Zurückgestellt: sinnvoll, wenn das Werkzeug generisch veröffentlicht wird (Ausblick).
- **Prüfung in der Landscape-CI, Status zurück ans Produkt-Repo (`repository_dispatch` + Commit-Status).** Für: kein Secret in Produkt-Repos. Wider: zwei Workflows, Rückkanal mit Schreibrecht auf Commit-Status aller Repos, Verzögerung, Deploy kann nicht einfach `needs` darauf. Verworfen.
- **Volle Kopie der Prüflogik in jedes Repo.** Für: keine Abhängigkeit. Wider: sechs Kopien von `build-twin`, Schema und Landscape; Drift der Prüfer selbst. Verworfen.

## Sperrregel (offen bis zur Variantenwahl)
- a) Sperrklinke: nur neue Struktur-Drift gegenüber der Basis sperrt; Bestand meldet; Knoten ohne Spec sperren nie. Für: Bestand und Experimente möglich, Drift kann nur sinken. Wider: Altlasten werden nicht erzwungen abgebaut, doppelte Laufzeit.
- b) Nur melden. Für: kein Deploy-Risiko. Wider: keine Garantie.
- c) Stufen `aus`/`melden`/`sperren` je Bereich (Workflow-Eingabe), `spike/**` meldet. Für: feinste Steuerung. Wider: Pflege der Stufen, Bestand in `sperren`-Bereichen blockiert.
In allen Varianten: Notausgang `Drift-Ok: <Grund>`, quittierte Drift bleibt im Twin sichtbar.

## Folgen
- Neues Secret je Produkt-Repo (`gh secret set TWIN_READ_TOKEN -R eckelt/<repo>`), Ablauf wie bisher gemeinsam.
- Änderungen an `twin-check` wirken sofort in allen Repos; ein Fehler darin kann alle Deploys aufhalten → Notausgang und Tests in `scripts/test_twin_check.py`.
- Neue Kanten `ci-twin-check` → `twin-check` in jedem Repo machen die Abhängigkeit im Modell sichtbar.
