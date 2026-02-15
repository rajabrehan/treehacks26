from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.config import get_settings
from app.models import NewsItem
from app.services.ingest_news import read_cached_news, sync_news

router = APIRouter()


@router.get("/top", response_model=list[NewsItem])
async def top_news(
    limit: int = Query(60, ge=1, le=200),
    refresh: int = Query(0, description="Set to 1 to force a live refresh via Sonar."),
):
    limit = min(limit, 200)

    if refresh == 1:
        try:
            return await sync_news(limit=limit)
        except RuntimeError as e:
            raise HTTPException(status_code=503, detail=str(e))
        except Exception:
            # If upstream fails, fall back to cache.
            try:
                return await read_cached_news(limit=limit)
            except Exception:
                return []

    try:
        cached = await read_cached_news(limit=limit)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception:
        cached = []
    if len(cached) >= min(limit, 12):
        return cached

    # If cache is empty/low, attempt live fetch. If that fails upstream, return whatever cache exists.
    try:
        return await sync_news(limit=limit)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception:
        return cached
