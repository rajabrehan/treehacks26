from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.models import Entity, GraphResponse, Relationship
from app.services.supabase_client import supabase_admin

router = APIRouter()

_REL_TYPES = {"donation", "lobbying", "vote", "employment"}


def _sb():
    try:
        return supabase_admin()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


def _parse_types(types: str) -> list[str]:
    out: list[str] = []
    for t in (types or "").split(","):
        tt = t.strip()
        if not tt:
            continue
        if tt not in _REL_TYPES:
            raise HTTPException(status_code=400, detail=f"Invalid relationship type: {tt}")
        out.append(tt)
    return out or sorted(_REL_TYPES)


def _dedup_edges(rows: list[dict]) -> list[dict]:
    seen: set[str] = set()
    out: list[dict] = []
    for r in rows:
        rid = str(r.get("id") or "")
        if not rid or rid in seen:
            continue
        seen.add(rid)
        out.append(r)
    return out


def _fetch_edges(sb, node_ids: list[str], rel_types: list[str], limit: int) -> list[dict]:
    if not node_ids or limit <= 0:
        return []

    fields = "id,type,source_id,target_id,amount,date,cycle,description,metadata,last_updated"

    q1 = sb.table("relationships").select(fields).in_("source_id", node_ids).in_("type", rel_types).limit(limit)
    q2 = sb.table("relationships").select(fields).in_("target_id", node_ids).in_("type", rel_types).limit(limit)
    r1 = q1.execute().data or []
    r2 = q2.execute().data or []
    return _dedup_edges([*r1, *r2])[:limit]


@router.get("", response_model=GraphResponse)
@router.get("/", response_model=GraphResponse)
async def graph(
    seed_id: str = Query(..., min_length=1),
    depth: int = Query(1, ge=1, le=2),
    limit: int = Query(200, ge=1, le=500),
    types: str = Query("donation,lobbying,vote,employment"),
):
    sb = _sb()
    rel_types = _parse_types(types)

    # Ensure the seed exists.
    seed = (
        sb.table("entities")
        .select("id,type,name,description,party,state,industry,total_lobbying,total_donations,metadata,last_updated")
        .eq("id", seed_id)
        .limit(1)
        .execute()
        .data
        or []
    )
    if not seed:
        raise HTTPException(status_code=404, detail="Seed entity not found")

    remaining = limit
    edges_rows: list[dict] = []
    frontier: set[str] = {seed_id}
    nodeset: set[str] = {seed_id}

    for _ in range(depth):
        if remaining <= 0 or not frontier:
            break
        batch = _fetch_edges(sb, list(frontier), rel_types, remaining)
        edges_rows.extend(batch)
        remaining = limit - len(edges_rows)

        nxt: set[str] = set()
        for e in batch:
            sid = e.get("source_id")
            tid = e.get("target_id")
            if isinstance(sid, str) and sid not in nodeset:
                nxt.add(sid)
            if isinstance(tid, str) and tid not in nodeset:
                nxt.add(tid)
        nodeset.update(nxt)
        frontier = nxt

    # Fetch node records.
    ent_rows = (
        sb.table("entities")
        .select("id,type,name,description,party,state,industry,total_lobbying,total_donations,metadata,last_updated")
        .in_("id", list(nodeset))
        .execute()
        .data
        or []
    )
    nodes = [Entity(**r) for r in ent_rows]
    edges = [Relationship(**r) for r in _dedup_edges(edges_rows)]

    return GraphResponse(seed_id=seed_id, nodes=nodes, edges=edges)

