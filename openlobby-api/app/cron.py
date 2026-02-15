from __future__ import annotations

import asyncio
import sys

from app.config import get_settings
from app.services.cases_service import ensure_default_cases
from app.services.ingest_news import sync_news


async def main() -> int:
    s = get_settings()

    missing = []
    if not s.supabase_url or not s.supabase_service_role_key:
        missing.append("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY")
    if not s.perplexity_api_key:
        missing.append("PERPLEXITY_API_KEY")
    if not s.jina_api_key:
        missing.append("JINA_API_KEY")
    if not s.elastic_cloud_id or not s.elastic_api_key:
        missing.append("ELASTIC_CLOUD_ID/ELASTIC_API_KEY")

    if missing:
        print("OpenLobby cron: missing required env vars:", ", ".join(missing), file=sys.stderr)
        return 1

    limit = int(s.news_limit_default or 60)
    await sync_news(limit=limit)
    await ensure_default_cases()
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))

