from __future__ import annotations

import json
from typing import Any

import httpx

from app.config import get_settings


PERPLEXITY_CHAT_URL = "https://api.perplexity.ai/chat/completions"


async def sonar_search(query: str, *, max_results: int = 10) -> list[dict[str, Any]]:
    """
    Use Perplexity Sonar to find recent, relevant links for a query.

    Returns a list of objects: {title, url, snippet, source?, published_at?}
    """
    s = get_settings()
    if not s.perplexity_api_key:
        raise RuntimeError("Perplexity is not configured (PERPLEXITY_API_KEY).")

    # Force structured JSON output so we can persist results without "seeding".
    prompt = f"""
You are a web research assistant.

Return ONLY valid JSON (no markdown) with the shape:
{{
  "results": [
    {{
      "title": "string",
      "url": "string",
      "source": "string",
      "published_at": "ISO-8601 string or null",
      "snippet": "string"
    }}
  ]
}}

Query: {query}
Constraints:
- Prefer very recent sources when possible
- Avoid duplicated URLs
- Provide at most {max_results} items
"""

    headers = {"Authorization": f"Bearer {s.perplexity_api_key}", "Content-Type": "application/json"}
    body: dict[str, Any] = {
        "model": s.perplexity_model,
        "messages": [
            {"role": "system", "content": "You return strictly valid JSON."},
            {"role": "user", "content": prompt.strip()},
        ],
        "temperature": 0.2,
    }

    async with httpx.AsyncClient(timeout=45) as client:
        resp = await client.post(PERPLEXITY_CHAT_URL, headers=headers, json=body)
        resp.raise_for_status()
        out = resp.json()
        content = out["choices"][0]["message"]["content"]

    try:
        parsed = json.loads(content)
        results = parsed.get("results", [])
        if isinstance(results, list):
            return results[:max_results]
    except Exception:
        pass

    # If the model fails to comply, fail closed (no mocked data).
    return []


async def sonar_generate_case(topic: str) -> dict[str, Any] | None:
    """
    Generate a case file (scrollytelling steps) from live web context.
    Returned object is persisted into Supabase.
    """
    s = get_settings()
    if not s.perplexity_api_key:
        raise RuntimeError("Perplexity is not configured (PERPLEXITY_API_KEY).")

    prompt = f"""
Return ONLY valid JSON (no markdown) describing a case file for a scrollytelling landing page.

Schema:
{{
  "id": "kebab-case slug",
  "title": "string",
  "dek": "string",
  "tags": ["string"],
  "entities_featured": ["string"],
  "steps": [
    {{
      "id": "kebab-case step id",
      "kicker": "string",
      "headline": "string",
      "body": "string (2-4 sentences)",
      "key_finding": {{"label":"string","value":"string","note":"string"}},
      "queries": ["string"],  // web queries to locate supporting documents
      "viz": {{"kind":"stat|timeline|sankey|graph", "...": "other keys"}}
    }}
  ]
}}

Topic: {topic}
Constraints:
- 6 steps, each materially different
- Nonpartisan, factual tone
- Include 'queries' per step so we can dynamically attach real documents
"""

    headers = {"Authorization": f"Bearer {s.perplexity_api_key}", "Content-Type": "application/json"}
    body: dict[str, Any] = {
        "model": s.perplexity_model,
        "messages": [
            {"role": "system", "content": "You return strictly valid JSON."},
            {"role": "user", "content": prompt.strip()},
        ],
        "temperature": 0.4,
    }

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(PERPLEXITY_CHAT_URL, headers=headers, json=body)
        resp.raise_for_status()
        out = resp.json()
        content = out["choices"][0]["message"]["content"]

    try:
        return json.loads(content)
    except Exception:
        return None
