from __future__ import annotations

from typing import Any

import httpx

from app.config import get_settings


async def embed_text(text: str, task: str = "retrieval.passage") -> list[float]:
    s = get_settings()
    if not text.strip():
        return [0.0] * s.jina_dims
    if not s.jina_api_key:
        raise RuntimeError("Jina is not configured (JINA_API_KEY).")

    payload: dict[str, Any] = {
        "model": s.jina_model,
        "task": task,
        "input": [text],
        "dimensions": s.jina_dims,
    }
    headers = {"Authorization": f"Bearer {s.jina_api_key}", "Content-Type": "application/json"}

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post("https://api.jina.ai/v1/embeddings", json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        return data["data"][0]["embedding"]
