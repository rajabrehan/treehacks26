from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.models import Entity
from app.services.supabase_client import supabase_admin

router = APIRouter()


def _sb():
    try:
        return supabase_admin()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("", response_model=list[Entity])
@router.get("/", response_model=list[Entity])
async def list_entities(
    q: str | None = Query(default=None, min_length=1),
    type: str | None = Query(default=None),
    limit: int = Query(20, ge=1, le=50),
):
    sb = _sb()
    qry = sb.table("entities").select(
        "id,type,name,description,party,state,industry,total_lobbying,total_donations,metadata,last_updated"
    )
    if type:
        qry = qry.eq("type", type)
    if q:
        like = f"%{q.strip()}%"
        qry = qry.or_(f"name.ilike.{like},description.ilike.{like}")
    resp = qry.order("last_updated", desc=True).limit(limit).execute()
    rows = resp.data or []
    return [Entity(**r) for r in rows]


@router.get("/{entity_id}", response_model=Entity)
async def get_entity(entity_id: str):
    sb = _sb()
    resp = (
        sb.table("entities")
        .select("id,type,name,description,party,state,industry,total_lobbying,total_donations,metadata,last_updated")
        .eq("id", entity_id)
        .limit(1)
        .execute()
    )
    row = (resp.data or [None])[0]
    if not row:
        raise HTTPException(status_code=404, detail="Entity not found")
    return Entity(**row)

