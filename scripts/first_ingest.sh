#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <api_base_url> <ingest_secret>" >&2
  echo "Example: $0 http://localhost:8000 your_ingest_secret" >&2
  exit 1
fi

API="$1"
SECRET="$2"

echo "Triggering news ingestion..."
curl -sS -X POST "$API/api/ingest/news?limit=60" -H "Authorization: Bearer $SECRET" | cat
echo

echo "Warming landing endpoints..."
curl -sS "$API/api/news/top?limit=60" | jq -r 'length' 2>/dev/null || true
curl -sS "$API/api/cases?limit=10" | jq -r 'length' 2>/dev/null || true
echo "Done."

