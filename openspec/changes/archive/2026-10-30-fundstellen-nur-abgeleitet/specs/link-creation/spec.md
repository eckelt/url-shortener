## MODIFIED Requirements

### Requirement: Token-Schutz
Das System SHALL `POST /save` nur mit dem Header `Authorization: Bearer <AUTH_TOKEN>` annehmen, sofern das Secret `AUTH_TOKEN` gesetzt ist; live ist es gesetzt.

#### Scenario: Falsches oder fehlendes Token
- **WHEN** `AUTH_TOKEN` gesetzt ist und der Header fehlt oder abweicht
- **THEN** antwortet der Worker mit 401 `{"error": "Unauthorized"}`

#### Scenario: Kein Secret gesetzt
- **WHEN** `AUTH_TOKEN` nicht gesetzt ist
- **THEN** nimmt der Worker jede Anfrage ohne Prüfung an
