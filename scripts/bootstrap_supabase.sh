#!/usr/bin/env bash
set -euo pipefail

if ! command -v supabase >/dev/null 2>&1; then
  echo "supabase CLI not found. Install: https://supabase.com/docs/guides/cli" >&2
  exit 1
fi

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <project-ref>" >&2
  echo "Example: $0 abcdefghijklmnopqrst" >&2
  exit 1
fi

PROJECT_REF="$1"

cd "$(dirname "$0")/.."

supabase link --project-ref "$PROJECT_REF"
supabase db push

echo "Supabase migrations applied."

