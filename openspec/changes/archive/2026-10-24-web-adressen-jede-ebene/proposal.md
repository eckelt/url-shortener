# Web-Adressen auf jeder Ebene: url-shortener

## Warum
Teil des Changes `web-adressen-jede-ebene` im Repo ecke-lt-landscape (Regel, Schema, ADR, Tabelle über alle Repos): Eine Web-Adresse (`url`) trägt, wer die Einstiegsseite selbst ausliefert, und zwar auf jeder Ebene (System, Container, Komponente); Backends tragen keine, es gibt keine Vererbung.

## Was
- System `url-shortener`: `url` https://kurz.ecke.lt/ (neu)
- Container `worker`: `url` https://kurz.ecke.lt/ (neu); er liefert das Formular zum Anlegen von Kurzlinks aus (Schnittstelle `web-ui`)

## Auswirkungen
Nur `twin.json` (Soll), kein Code. Gültig gegen das Schema erst nach dem Landscape-Teil des Changes.
