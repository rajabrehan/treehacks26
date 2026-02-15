from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel, Field

from app.services.auth import require_user
from app.services.supabase_client import supabase_admin

router = APIRouter()


def _sb():
    try:
        return supabase_admin()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


class ProfileUpsert(BaseModel):
    full_name: str | None = None
    avatar_url: str | None = None


class SavedQueryCreate(BaseModel):
    query: str = Field(min_length=1, max_length=500)


class BookmarkUpsert(BaseModel):
    entity_id: str = Field(min_length=1, max_length=200)
    note: str | None = Field(default=None, max_length=1000)


@router.get("/profile")
async def get_profile(authorization: str | None = Header(default=None)):
    ctx = require_user(authorization)
    sb = _sb()
    resp = (
        sb.table("profiles")
        .select("user_id,full_name,avatar_url,created_at")
        .eq("user_id", ctx.user_id)
        .limit(1)
        .execute()
    )
    row = (resp.data or [None])[0]
    if not row:
        return {"user_id": ctx.user_id, "full_name": None, "avatar_url": None}
    return row


@router.post("/profile")
async def upsert_profile(body: ProfileUpsert, authorization: str | None = Header(default=None)):
    ctx = require_user(authorization)
    sb = _sb()
    row = {"user_id": ctx.user_id, "full_name": body.full_name, "avatar_url": body.avatar_url}
    sb.table("profiles").upsert(row).execute()
    return {"ok": True}


@router.get("/saved-queries")
async def list_saved_queries(
    authorization: str | None = Header(default=None),
    limit: int = Query(50, ge=1, le=50),
):
    ctx = require_user(authorization)
    sb = _sb()
    resp = (
        sb.table("saved_queries")
        .select("id,query,created_at")
        .eq("user_id", ctx.user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return resp.data or []


@router.post("/saved-queries")
async def create_saved_query(body: SavedQueryCreate, authorization: str | None = Header(default=None)):
    ctx = require_user(authorization)
    sb = _sb()
    sb.table("saved_queries").insert({"user_id": ctx.user_id, "query": body.query}).execute()
    return {"ok": True}


@router.get("/bookmarks")
async def list_bookmarks(
    authorization: str | None = Header(default=None),
    limit: int = Query(50, ge=1, le=50),
):
    ctx = require_user(authorization)
    sb = _sb()
    resp = (
        sb.table("bookmarks")
        .select("id,entity_id,note,created_at")
        .eq("user_id", ctx.user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return resp.data or []


@router.post("/bookmarks")
async def upsert_bookmark(body: BookmarkUpsert, authorization: str | None = Header(default=None)):
    ctx = require_user(authorization)
    sb = _sb()
    row = {"user_id": ctx.user_id, "entity_id": body.entity_id, "note": body.note}
    sb.table("bookmarks").upsert(row, on_conflict="user_id,entity_id").execute()
    return {"ok": True}


@router.delete("/bookmarks/{entity_id}")
async def delete_bookmark(entity_id: str, authorization: str | None = Header(default=None)):
    ctx = require_user(authorization)
    sb = _sb()
    sb.table("bookmarks").delete().eq("user_id", ctx.user_id).eq("entity_id", entity_id).execute()
    return {"ok": True}

