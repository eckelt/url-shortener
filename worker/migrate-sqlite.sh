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
sqlite3 "$DB" "SELECT id, code, url FROM urls;" | python3 -c "
import sys, json
rows = [line.rstrip('\n').split('|', 2) for line in sys.stdin if line.strip()]
data = [{'key': r[1], 'value': r[2]} for r in rows if len(r) == 3 and r[1] and r[2]]
print(json.dumps(data, indent=2))
print(f'# {len(data)} Einträge', file=sys.stderr)
" > kv-export.json

echo "Importiere in Cloudflare KV ..."
npx wrangler kv bulk put --namespace-id 1d926afa251848d593ddac2cd4b8665c kv-export.json

echo "Fertig! kv-export.json kann gelöscht werden."
