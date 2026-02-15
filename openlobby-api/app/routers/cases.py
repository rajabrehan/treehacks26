from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.models import CaseFile
from app.services.cases_service import ensure_default_cases, generate_and_store_case, get_case, list_cases

router = APIRouter()


@router.get("", response_model=list[CaseFile])
@router.get("/", response_model=list[CaseFile])
async def cases(limit: int = Query(10, ge=1, le=50)):
    try:
        out = await list_cases(limit=limit)
        if out:
            # Return metadata only (steps omitted by service).
            return out
        return await ensure_default_cases()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/{case_id}", response_model=CaseFile)
async def case_detail(case_id: str):
    try:
        c = await get_case(case_id)
        if c:
            return c
        # No seed: generate live from Sonar.
        topic = case_id.replace("-", " ").strip()
        gen = await generate_and_store_case(topic)
        if gen:
            return gen
        raise HTTPException(status_code=404, detail="Case not found and could not be generated.")
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
