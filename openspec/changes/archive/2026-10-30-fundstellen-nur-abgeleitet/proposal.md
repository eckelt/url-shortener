# Fundstellen nur im Aggregat, nicht in der Spec

## Warum
Specs enthalten nur Was und Warum. Fundstellen wie `[datei:zeile]` sind Wie, wandern bei jedem Umbau und werden nicht mehr gepflegt; die Verbindung Szenario → Code leitet das Aggregat aus den Tests mit Szenario-Kennung ab. Change über alle Repos, Proposal und Entscheidung im Repo `ecke-lt-landscape` (`openspec/changes/fundstellen-nur-abgeleitet/`).

## Was
- Je betroffenem Requirement ein `MODIFIED`-Block ohne Fundstellen, sonst zeichengleich, Titel und Kennungen unverändert: `deploy`, `link-creation`. Quellenangaben (`[Nutzer-Auskunft …]`, `[git log: …]`, `[http:…]`) bleiben.
- Nach dem Archiv streicht das Gewerk im Purpose den Halbsatz „Fundstellen `[datei:zeile]` beziehen sich auf diesen Commit“.
- Vor dem Archiv wird das Delta aus dem dann aktuellen Stand neu erzeugt, damit kein anderer Change zurückgedreht wird.

## Auswirkungen
Nur Spec-Text; kein Code, kein Manifest, kein Deploy-relevanter Pfad.
