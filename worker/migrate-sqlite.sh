#!/bin/bash
# Migriert URLs aus SQLite in Cloudflare KV
# Verwendung: ./migrate-sqlite.sh /pfad/zur/db.sqlite

set -e

DB="${1:-db.sqlite}"

if [ ! -f "$DB" ]; then
  echo "Fehler: Datenbankdatei '$DB' nicht gefunden."
  echo "Verwendung: $0 /pfad/zur/db.sqlite"
  exit 1
fi

echo "Lese URLs aus $DB ..."

# SQLite → JSON für wrangler kv bulk put
sqlite3 "$DB" "SELECT id, code, url FROM urls ORDER BY id ASC;" | python3 -c "
import sys, json
seen = {}
for line in sys.stdin:
    parts = line.rstrip('\n').split('|', 2)
    if len(parts) == 3 and parts[1] and parts[2] and parts[1] not in seen:
        seen[parts[1]] = parts[2]
data = [{'key': k, 'value': v} for k, v in seen.items()]
print(json.dumps(data, indent=2))
print(f'# {len(data)} Einträge', file=sys.stderr)
" > kv-export.json

echo "Importiere in Cloudflare KV ..."
npx wrangler kv bulk put --namespace-id 1d926afa251848d593ddac2cd4b8665c kv-export.json

echo "Fertig! kv-export.json kann gelöscht werden."
