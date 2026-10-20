# Das Design-System liegt unter design.ecke.lt, ausgeliefert von Cloudflare Pages

Status: vorgeschlagen
Datum: 2026-10-19
Change: design-ecke-lt

## Kontext
Das Design-System (`/`, `/v1/`, `/storybook/`) ist nur unter der Pages-Adresse `ecke-design-system.pages.dev` erreichbar. Diese Adresse steht in jeder App (Stylesheet, Mermaid-Skript, Schriften über die Token-Dateien), in Specs, ADRs, README und Manifesten. Sie trägt den Namen des Hosters und des Pages-Projekts; wechselt eines von beiden, müssen alle Apps neu ausgeliefert werden. Der Inhaber wünscht eine eigene Adresse (Chat 2026-10-19), eingerichtet als Code und ohne Handarbeit.

## Entscheidung
Das Design-System bekommt die Adresse `design.ecke.lt` als Custom Domain auf dem bestehenden Pages-Projekt `ecke-design-system`; der Deploy-Workflow richtet Domain und DNS-Eintrag idempotent über die Cloudflare-API ein. Alle Apps binden künftig `https://design.ecke.lt/v1/` ein, Storybook liegt unter `https://design.ecke.lt/storybook/`. Die Adresse `ecke-design-system.pages.dev` bleibt als Übergang erreichbar (Pages schaltet sie nicht ab); ihr Abschalten wäre ein eigener Change. Versionspfad und Inhalte ändern sich nicht.

Das ergänzt `2026-09-01-alle-apps-nutzen-design-system`, ersetzt sie nicht: Die Regel „alle Apps beziehen das Design-System zur Laufzeit“ bleibt, nur die Adresse in ihrer Entscheidung wandert. Die ältere Entscheidung bleibt unverändert angenommen und nennt unter „Folgen“ die neue Adresse.

## Betrachtete Optionen
- **pages.dev-Adresse behalten:** verworfen. Nichts zu tun, aber die Adresse bleibt an Hoster und Projektnamen gebunden, passt nicht zu den übrigen ecke.lt-Adressen (`book.`, `kurz.`, `blog.`), und jeder spätere Wechsel des Hostings träfe alle Apps gleichzeitig.
- **Custom Domain auf dem Pages-Projekt** (gewählt): Auslieferung, Header (`_headers`) und Deploy bleiben, nur Domain und DNS-Eintrag kommen dazu; Zertifikat stellt Pages aus. Ein späterer Hosterwechsel ginge über DNS, ohne die Apps anzufassen. Wider: der Workflow braucht Rechte für Pages-Domains und DNS der Zone ecke.lt, und die Aktivierung dauert beim ersten Mal einige Minuten. Gewählt, weil es den kleinsten Eingriff bei eigener, stabiler Adresse bedeutet und book.ecke.lt bereits so läuft.
- **Auslieferung über einen Worker mit eigener Route oder Custom Domain:** verworfen. Header, Weiterleitung der alten Adresse und Pfadlogik lägen im Code, passend zu blog und url-shortener. Dafür müsste das Design-System von Pages auf Workers (Static Assets) umziehen: neuer Deploy-Weg, `wrangler`-Konfiguration, geänderter Storybook-Build. Das ist Aufwand ohne Nutzen für die Apps.
- **Unterpfad unter ecke.lt (z.B. `ecke.lt/design/`):** verworfen. Der Apex leitet per Zonenregel auf `nils.ecke.lt` um; ein Unterpfad bräuchte eine Ausnahme dort plus einen Worker, der auf das Pages-Projekt durchreicht, und Storybook müsste mit Basispfad gebaut werden. Eine eigene Subdomain ist einfacher und entspricht den anderen Apps.

## Folgen
- Neues Secret `CLOUDFLARE_DNS_TOKEN` (Zone: DNS: Edit, Zone: Zone: Read, nur für ecke.lt) im Repo ecke-design-system, falls `CLOUDFLARE_API_TOKEN` (Pages: Edit) diese Rechte nicht hat; den Wert setzt der Inhaber.
- Reihenfolge: Erst deployt ecke-design-system, und `design.ecke.lt` muss live antworten; danach stellen die Apps um. Bis dahin wirkt die alte Adresse unverändert.
- Die Adresse steht in Code, Specs, README, Manifesten und `project.md`; Archive und ältere ADRs bleiben als Zeitdokument unverändert.
- Hier betroffen: `worker` (Stylesheet-Link im Formular, Deploy des Workers bei Änderung an `worker/**`).
