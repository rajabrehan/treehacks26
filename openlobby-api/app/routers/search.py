from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.config import get_settings
from app.models import SearchHit
from app.services.elasticsearch_client import es, ensure_indices
from app.services.jina_embeddings import embed_text
from app.services.supabase_client import supabase_admin

router = APIRouter()


def _sb_or_none():
    try:
        return supabase_admin()
    except RuntimeError:
        return None


@router.get("", response_model=list[SearchHit])
@router.get("/", response_model=list[SearchHit])
async def search(
    q: str = Query(..., min_length=1),
    entity_type: str | None = Query(default=None),
    limit: int = Query(20, ge=1, le=50),
):
    s = get_settings()
    q = q.strip()
    if not q:
        raise HTTPException(status_code=400, detail="q is required")

    # Preferred: Elasticsearch hybrid (derived).
    if s.elastic_cloud_id and s.elastic_api_key:
        await ensure_indices()

        knn = None
        if s.jina_api_key:
            try:
                qvec = await embed_text(q, task="retrieval.query")
                knn = {
                    "field": "embedding",
                    "query_vector": qvec,
                    "k": limit,
                    "num_candidates": max(50, limit * 5),
                }
            except Exception:
                knn = None

        client = es()
        body: dict = {
            "index": s.elastic_index_documents,
            "size": limit,
            "query": {"multi_match": {"query": q, "fields": ["title^3", "excerpt^2", "content"]}},
        }
        if knn is not None:
            body["knn"] = knn

        resp = await client.search(**body)

        hits: list[SearchHit] = []
        for h in resp.get("hits", {}).get("hits", []):
            src = h.get("_source") or {}
            hits.append(
                SearchHit(
                    id=src.get("id") or h.get("_id"),
                    type="document",
                    title=src.get("title") or "",
                    snippet=(src.get("excerpt") or "")[:320],
                    url=src.get("url"),
                    score=h.get("_score"),
                    image_url=src.get("image_url"),
                    metadata={"source": src.get("source"), "published_at": src.get("published_at")},
                )
            )
        # Also include canonical entity hits from Supabase when available (keyword).
        sb = _sb_or_none()
        if sb is None:
            return hits

        like = f"%{q}%"
        ent_q = sb.table("entities").select("id,type,name,description,metadata,last_updated")
        if entity_type:
            ent_q = ent_q.eq("type", entity_type)
        ent_rows = ent_q.or_(f"name.ilike.{like},description.ilike.{like}").limit(min(12, limit)).execute().data or []
        ent_hits: list[SearchHit] = []
        for r in ent_rows:
            ent_hits.append(
                SearchHit(
                    id=r.get("id") or "",
                    type="entity",
                    title=r.get("name") or "",
                    snippet=(r.get("description") or "")[:320],
                    url=None,
                    metadata={"entity_type": r.get("type"), "last_updated": r.get("last_updated")},
                )
            )
        # Entities first, then documents.
        return [*ent_hits, *hits][:limit]

    # Fallback: Supabase keyword search (canonical). No seeded data.
    sb = _sb_or_none()
    if sb is None:
        return []

    like = f"%{q}%"
    out: list[SearchHit] = []

    ent_q = sb.table("entities").select("id,type,name,description,metadata,last_updated")
    if entity_type:
        ent_q = ent_q.eq("type", entity_type)
    ent_rows = ent_q.or_(f"name.ilike.{like},description.ilike.{like}").limit(min(25, limit)).execute().data or []
    for r in ent_rows:
        out.append(
            SearchHit(
                id=r.get("id") or "",
                type="entity",
                title=r.get("name") or "",
                snippet=(r.get("description") or "")[:320],
                url=None,
                metadata={"entity_type": r.get("type"), "last_updated": r.get("last_updated")},
            )
        )

    rem = max(0, limit - len(out))
    if rem:
        doc_rows = (
            sb.table("documents")
            .select("id,title,url,excerpt,image_url,published_at,metadata,source")
            .or_(f"title.ilike.{like},excerpt.ilike.{like},url.ilike.{like}")
            .order("published_at", desc=True)
            .limit(rem)
            .execute()
            .data
            or []
        )
        for r in doc_rows:
            out.append(
                SearchHit(
                    id=r.get("id") or "",
                    type="document",
                    title=r.get("title") or "",
                    snippet=(r.get("excerpt") or "")[:320],
                    url=r.get("url"),
                    image_url=r.get("image_url"),
                    metadata={"source": (r.get("metadata") or {}).get("from") or r.get("source"), "published_at": r.get("published_at")},
                )
            )

    return out[:limit]
