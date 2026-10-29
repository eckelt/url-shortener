## MODIFIED Requirements

### Requirement: Web-Oberfläche
Das System SHALL auf `GET /` eine HTML-Seite mit den Feldern URL, Code und Token ausliefern, die per `fetch('/save')` kürzt und das Ergebnis mit Kopier-Knopf anzeigt [worker/src/index.ts:41-164]. Die Seite bindet `https://design.ecke.lt/v1/styles.css` (`ecke-design-system:styles@1`) ein und lädt kein Stylesheet von Dritten; Knöpfe nutzen die Button-Komponente des Design-Systems, Labels und Eingabefelder stylt die Seite selbst ausschließlich mit Tokens (`var(--…)`) des Design-Systems [worker/src/index.ts:46-115].

#### Scenario: Aufruf der Oberfläche
- **WHEN** ein Browser `https://kurz.ecke.lt/` öffnet
- **THEN** liefert der Worker die Seite mit `Content-Type: text/html;charset=UTF-8` [worker/src/index.ts:172-176; worker/wrangler.toml:23-25]

#### Scenario: Kürzen über die Oberfläche
- **WHEN** der Nutzer URL und Token einträgt und „Kürzen“ klickt
- **THEN** sendet die Seite `POST /save` mit `Authorization: Bearer <Token>` und zeigt `url` oder `error` der Antwort an [worker/src/index.ts:138-157]

#### Scenario: Optik aus dem Design-System
- **WHEN** die Seite geladen wird
- **THEN** stammen Schrift, Farben und Abstände aus `ecke-design-system:styles@1`, es gibt keinen Verweis auf unpkg.com, und die Seite folgt hellem und dunklem Farbschema des Design-Systems [worker/src/index.ts:46]

#### Scenario: Hintergrund
- **WHEN** die Seite im hellen bzw. dunklen Farbschema geladen wird
- **THEN** liegt hinter dem Formular eine nahtlos gekachelte Blumentapete (`/bg-light.webp` bzw. `/bg-dark.webp`, Static Assets des Workers aus `worker/assets/`), und das Formular steht auf einer Karte in `--bg`, damit es lesbar bleibt [worker/wrangler.toml; worker/assets/]
