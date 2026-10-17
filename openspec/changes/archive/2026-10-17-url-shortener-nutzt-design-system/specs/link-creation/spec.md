## MODIFIED Requirements

### Requirement: Web-Oberfläche
Das System SHALL auf `GET /` eine HTML-Seite mit den Feldern URL, Code und Token ausliefern, die per `fetch('/save')` kürzt und das Ergebnis mit Kopier-Knopf anzeigt. Die Seite bindet `https://ecke-design-system.pages.dev/v1/styles.css` (`ecke-design-system:styles@1`) ein und lädt kein Stylesheet von Dritten; Knöpfe nutzen die Button-Komponente des Design-Systems, Labels und Eingabefelder stylt die Seite selbst ausschließlich mit Tokens (`var(--…)`) des Design-Systems.

#### Scenario: Aufruf der Oberfläche
- **WHEN** ein Browser `https://kurz.ecke.lt/` öffnet
- **THEN** liefert der Worker die Seite mit `Content-Type: text/html;charset=UTF-8`

#### Scenario: Kürzen über die Oberfläche
- **WHEN** der Nutzer URL und Token einträgt und „Kürzen“ klickt
- **THEN** sendet die Seite `POST /save` mit `Authorization: Bearer <Token>` und zeigt `url` oder `error` der Antwort an

#### Scenario: Optik aus dem Design-System
- **WHEN** die Seite geladen wird
- **THEN** stammen Schrift, Farben und Abstände aus `ecke-design-system:styles@1`, es gibt keinen Verweis auf unpkg.com, und die Seite folgt hellem und dunklem Farbschema des Design-Systems
