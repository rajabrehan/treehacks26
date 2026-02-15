from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models import AskRequest, AskResponse
from app.routers.search import search as search_endpoint
from app.services.modal_client import modal_answer_question

router = APIRouter()


@router.post("", response_model=AskResponse)
@router.post("/", response_model=AskResponse)
async def ask(req: AskRequest):
    q = req.question.strip()
    if not q:
        raise HTTPException(status_code=400, detail="question is required")

    # Retrieve context from Elasticsearch (documents index).
    sources = await search_endpoint(q=q, limit=req.limit)  # type: ignore[arg-type]
    context = "\n\n".join(
        [
            f"<document>\n<title>{s.title}</title>\n<url>{s.url or ''}</url>\n<snippet>{s.snippet}</snippet>\n</document>"
            for s in sources
        ]
    )

    try:
        answer = await modal_answer_question(q, context)
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Modal is not available or failed: {e}",
        )

    return AskResponse(answer=answer, sources=sources)
