from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, Query

from app.config import get_settings
from app.services.ingest_news import sync_news

router = APIRouter()


def _check_ingest(auth: str | None):
    s = get_settings()
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization: Bearer <token>")
    token = auth.removeprefix("Bearer ").strip()
    if token != s.ingest_secret:
        raise HTTPException(status_code=403, detail="Invalid token")


@router.post("/news")
async def ingest_news(
    authorization: str | None = Header(default=None),
    limit: int = Query(60, ge=1, le=200),
):
    _check_ingest(authorization)
    try:
        items = await sync_news(limit=limit)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    return {"inserted": len(items)}
