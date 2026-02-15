from __future__ import annotations

import hashlib
from datetime import datetime
from typing import Any

from app.config import get_settings
from app.models import NewsItem
from app.services.content_fetch import extract_og_image, fetch_html, fetch_readable_text
from app.services.elasticsearch_client import ensure_indices, es
from app.services.jina_embeddings import embed_text
from app.services.perplexity_sonar import sonar_search
from app.services.supabase_client import supabase_admin


def _doc_id(url: str) -> str:
    return hashlib.sha256(url.encode("utf-8")).hexdigest()[:24]


async def sync_news(*, limit: int) -> list[NewsItem]:
    """
    Pull fresh headlines via Sonar, fetch readable content, store in Supabase, index into Elasticsearch.
    No seeded/mocked data; if sources fail, returns whatever is already stored.
    """
    s = get_settings()
    sb = supabase_admin()

    # 1) Collect URLs from Sonar across configured topics.
    topics = s.news_topics_list()
    per_topic = max(4, min(12, (limit + len(topics) - 1) // max(1, len(topics))))

    raw_hits: list[dict[str, Any]] = []
    for t in topics:
        q = f"{t} lobbying campaign finance latest"
        raw_hits.extend(await sonar_search(q, max_results=per_topic))

    # Dedup by URL
    seen = set()
    hits: list[dict[str, Any]] = []
    for h in raw_hits:
        url = (h.get("url") or "").strip()
        if not url or url in seen:
            continue
        seen.add(url)
        hits.append(h)
        if len(hits) >= limit:
            break

    # 2) For each URL: fetch OG image + readable text.
    docs_rows: list[dict[str, Any]] = []
    for h in hits:
        url = (h.get("url") or "").strip()
        title = (h.get("title") or "").strip() or url
        source = (h.get("source") or "").strip() or "web"
        snippet = (h.get("snippet") or "").strip()
        published_at = h.get("published_at")
        published_dt: datetime | None = None
        if isinstance(published_at, str) and published_at:
            try:
                published_dt = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
            except Exception:
                published_dt = None

        try:
            html = await fetch_html(url)
            image_url = extract_og_image(html)
        except Exception:
            html = ""
            image_url = None

        try:
            content = await fetch_readable_text(url)
        except Exception:
            content = ""

        doc_id = _doc_id(url)
        docs_rows.append(
            {
                "id": doc_id,
                "source": "news",
                "url": url,
                "title": title,
                "published_at": published_dt.isoformat() if published_dt else None,
                "excerpt": snippet[:600],
                "image_url": image_url,
                "entities_mentioned": [],
                "metadata": {"from": source, "topic_tags": topics},
            }
        )

    # 3) Upsert into Supabase (canonical).
    if docs_rows:
        sb.table("documents").upsert(docs_rows).execute()

    # 4) Index into Elasticsearch (derived) if configured. If Jina is not configured,
    # index without vectors so BM25-only search still works.
    if s.elastic_cloud_id and s.elastic_api_key and docs_rows:
        await ensure_indices()
        client = es()
        for row in docs_rows:
            emb = None
            if s.jina_api_key:
                content_for_embed = f'{row.get("title","")}\n\n{row.get("excerpt","")}\n\n{row.get("url","")}'
                try:
                    emb = await embed_text(content_for_embed, task="retrieval.passage")
                except Exception:
                    emb = None
            body = {
                "id": row["id"],
                "type": "document",
                "title": row["title"],
                "url": row["url"],
                "source": row.get("metadata", {}).get("from", "web"),
                "published_at": row.get("published_at"),
                "excerpt": row.get("excerpt") or "",
                "content": "",  # keep ES slim for hackathon; canonical text can live in Supabase metadata later
                "image_url": row.get("image_url"),
                "tags": row.get("metadata", {}).get("topic_tags", []),
                "entities_mentioned": [],
                "last_updated": datetime.utcnow().isoformat(),
            }
            if emb is not None:
                body["embedding"] = emb
            await client.index(index=s.elastic_index_documents, id=row["id"], document=body)

    # 5) Return latest from Supabase
    resp = (
        sb.table("documents")
        .select("id, title, url, source, published_at, excerpt, image_url, entities_mentioned, metadata")
        .eq("source", "news")
        .order("published_at", desc=True)
        .limit(limit)
        .execute()
    )
    out: list[NewsItem] = []
    for r in (resp.data or []):
        out.append(
            NewsItem(
                id=r["id"],
                title=r.get("title") or "",
                url=r.get("url") or "",
                source=(r.get("metadata") or {}).get("from") or "web",
                published_at=r.get("published_at"),
                excerpt=r.get("excerpt") or "",
                image_url=r.get("image_url"),
                entities_mentioned=r.get("entities_mentioned") or [],
                tags=(r.get("metadata") or {}).get("topic_tags") or [],
            )
        )
    return out


async def read_cached_news(*, limit: int) -> list[NewsItem]:
    sb = supabase_admin()
    resp = (
        sb.table("documents")
        .select("id, title, url, source, published_at, excerpt, image_url, entities_mentioned, metadata")
        .eq("source", "news")
        .order("published_at", desc=True)
        .limit(limit)
        .execute()
    )
    out: list[NewsItem] = []
    for r in (resp.data or []):
        out.append(
            NewsItem(
                id=r["id"],
                title=r.get("title") or "",
                url=r.get("url") or "",
                source=(r.get("metadata") or {}).get("from") or "web",
                published_at=r.get("published_at"),
                excerpt=r.get("excerpt") or "",
                image_url=r.get("image_url"),
                entities_mentioned=r.get("entities_mentioned") or [],
                tags=(r.get("metadata") or {}).get("topic_tags") or [],
            )
        )
    return out
