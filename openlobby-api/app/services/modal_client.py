from __future__ import annotations

from typing import Any

import modal

from app.config import get_settings


def _ensure_modal_auth():
    s = get_settings()
    if not (s.modal_token_id and s.modal_token_secret):
        raise RuntimeError("Modal is not configured (MODAL_TOKEN_ID/MODAL_TOKEN_SECRET missing).")
    # Modal uses env vars for auth; set them for this process.
    import os

    os.environ["MODAL_TOKEN_ID"] = s.modal_token_id
    os.environ["MODAL_TOKEN_SECRET"] = s.modal_token_secret


def _service():
    s = get_settings()
    _ensure_modal_auth()
    return modal.Cls.lookup(s.modal_app_name, s.modal_cls_name)


async def modal_answer_question(question: str, context: str) -> str:
    service = _service()()
    # modal python client is sync for remote calls; run in thread.
    import anyio

    def _call():
        return service.answer_question.remote(question, context)

    return await anyio.to_thread.run_sync(_call)


async def modal_extract_entities(raw_text: str) -> dict[str, Any]:
    service = _service()()
    import anyio

    def _call():
        return service.extract_entities.remote(raw_text)

    return await anyio.to_thread.run_sync(_call)

