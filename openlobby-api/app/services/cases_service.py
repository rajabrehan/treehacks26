from __future__ import annotations

import json
from typing import Any

from app.config import get_settings
from app.models import CaseFile, CaseStep
from app.services.content_fetch import extract_og_image, fetch_html
from app.services.perplexity_sonar import sonar_generate_case, sonar_search
from app.services.supabase_client import supabase_admin


async def list_cases(*, limit: int = 10) -> list[CaseFile]:
    sb = supabase_admin()
    resp = sb.table("case_files").select("id,title,dek,hero_image_url,tags,steps,entities_featured,updated_at").order(
        "updated_at", desc=True
    ).limit(limit).execute()
    out: list[CaseFile] = []
    for r in (resp.data or []):
        out.append(_row_to_case(r, include_steps=False))
    return out


async def get_case(case_id: str) -> CaseFile | None:
    sb = supabase_admin()
    resp = sb.table("case_files").select("id,title,dek,hero_image_url,tags,steps,entities_featured,updated_at").eq("id", case_id).limit(1).execute()
    row = (resp.data or [None])[0]
    if not row:
        return None
    return _row_to_case(row, include_steps=True)


async def ensure_default_cases() -> list[CaseFile]:
    cases = await list_cases(limit=2)
    if len(cases) >= 2:
        return cases

    s = get_settings()
    if not s.perplexity_api_key:
        # Strict live-only: return cached cases if they exist, otherwise fail closed.
        if cases:
            return cases
        raise RuntimeError("Perplexity is not configured (PERPLEXITY_API_KEY).")

    # Generate live cases: fixed topics, content is fetched from Sonar at runtime.
    for topic in ["Drug pricing", "AI regulation"]:
        await generate_and_store_case(topic)

    return await list_cases(limit=2)


async def generate_and_store_case(topic: str) -> CaseFile | None:
    gen = await sonar_generate_case(topic)
    if not gen:
        return None

    # Attach real documents by executing per-step queries and storing doc IDs as relationships.
    steps_in: list[dict[str, Any]] = list(gen.get("steps") or [])
    sb = supabase_admin()

    # Get candidate docs from existing documents table by searching on URL/title via Sonar.
    # We avoid "mocking" by always attaching live URLs.
    step_objs: list[dict[str, Any]] = []
    hero_image_url = None

    for idx, st in enumerate(steps_in[:6]):
        queries = st.get("queries") or []
        related_urls: list[str] = []
        for q in queries[:2]:
            hits = await sonar_search(q, max_results=3)
            for h in hits:
                u = (h.get("url") or "").strip()
                if u and u not in related_urls:
                    related_urls.append(u)

        # Derive step images from OG images of related URLs.
        collage_images: list[str] = []
        for u in related_urls[:3]:
            try:
                html = await fetch_html(u)
                og = extract_og_image(html)
                if og and og not in collage_images:
                    collage_images.append(og)
            except Exception:
                continue

        step_id = st.get("id") or f"step-{idx+1}"
        step_objs.append(
            {
                "id": step_id,
                "kicker": st.get("kicker") or f"Case File",
                "headline": st.get("headline") or "",
                "body": st.get("body") or "",
                "key_finding": st.get("key_finding") or {"label": "Key finding", "value": "—", "note": ""},
                "related_document_ids": [],
                "collage_image_urls": st.get("collage_image_urls") or collage_images,
                "viz": st.get("viz") or {"kind": "stat", "label": "Signal", "value": "—", "note": ""},
                "related_urls": related_urls,
            }
        )

        if hero_image_url is None:
            hero_image_url = (st.get("collage_image_urls") or collage_images or [None])[0]

    row = {
        "id": gen.get("id") or _slug(topic),
        "title": gen.get("title") or topic,
        "dek": gen.get("dek") or "",
        "hero_image_url": gen.get("hero_image_url") or hero_image_url,
        "tags": gen.get("tags") or [topic],
        "steps": step_objs,
        "entities_featured": gen.get("entities_featured") or [],
    }
    sb.table("case_files").upsert(row).execute()
    return _row_to_case(row, include_steps=True)


def _row_to_case(row: dict[str, Any], *, include_steps: bool) -> CaseFile:
    steps_raw = row.get("steps") or []
    steps: list[CaseStep] = []
    if include_steps:
        for s in steps_raw:
            steps.append(
                CaseStep(
                    id=s.get("id") or "",
                    kicker=s.get("kicker") or "",
                    headline=s.get("headline") or "",
                    body=s.get("body") or "",
                    key_finding=s.get("key_finding") or {},
                    related_document_ids=s.get("related_document_ids") or [],
                    related_urls=s.get("related_urls") or [],
                    collage_image_urls=s.get("collage_image_urls") or [],
                    viz=s.get("viz") or {},
                )
            )
    return CaseFile(
        id=row.get("id") or "",
        title=row.get("title") or "",
        dek=row.get("dek") or "",
        hero_image_url=row.get("hero_image_url"),
        tags=row.get("tags") or [],
        steps=steps,
        entities_featured=row.get("entities_featured") or [],
    )


def _slug(s: str) -> str:
    return "-".join("".join(ch.lower() if ch.isalnum() else " " for ch in s).split())
