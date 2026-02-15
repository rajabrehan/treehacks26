from __future__ import annotations

import re
from typing import Any

import httpx
from bs4 import BeautifulSoup

from app.config import get_settings


_OG_IMAGE_RE = re.compile(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', re.I)


async def fetch_html(url: str) -> str:
    """
    Fetch raw HTML. Prefer direct fetch; fall back to Bright Data Web Unlocker if configured.
    """
    headers = {
        "user-agent": "OpenLobbyBot/0.1 (hackathon; contact: devnull)",
        "accept": "text/html,application/xhtml+xml",
    }

    async with httpx.AsyncClient(timeout=25, follow_redirects=True) as client:
        try:
            r = await client.get(url, headers=headers)
            r.raise_for_status()
            return r.text
        except Exception:
            pass

    s = get_settings()
    if not (s.brightdata_web_unlocker_url and s.brightdata_web_unlocker_token):
        raise RuntimeError("Direct fetch failed and Bright Data is not configured.")

    # Bright Data Web Unlocker: POST to /request with token auth. (See Bright Data docs for plan specifics.)
    unlock_headers = {"Authorization": f"Bearer {s.brightdata_web_unlocker_token}", "Content-Type": "application/json"}
    payload: dict[str, Any] = {"url": url, "zone": "web_unlocker"}

    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(s.brightdata_web_unlocker_url, headers=unlock_headers, json=payload)
        r.raise_for_status()
        data = r.json()
        # Different Bright Data products return different shapes; accept common keys.
        if isinstance(data, dict):
            if "body" in data and isinstance(data["body"], str):
                return data["body"]
            if "content" in data and isinstance(data["content"], str):
                return data["content"]
        raise RuntimeError("Bright Data response did not contain HTML.")


def extract_og_image(html: str) -> str | None:
    m = _OG_IMAGE_RE.search(html)
    if m:
        return m.group(1).strip()
    soup = BeautifulSoup(html, "lxml")
    tag = soup.find("meta", attrs={"property": "og:image"})
    if tag and tag.get("content"):
        return str(tag.get("content")).strip()
    return None


async def fetch_readable_text(url: str) -> str:
    """
    Try Jina Reader first (cheap + often works), fall back to raw HTML text extraction.
    """
    reader_url = f"https://r.jina.ai/{url}"
    async with httpx.AsyncClient(timeout=35, follow_redirects=True) as client:
        try:
            r = await client.get(reader_url, headers={"accept": "text/plain"})
            r.raise_for_status()
            txt = r.text.strip()
            if len(txt) > 400:
                return txt
        except Exception:
            pass

    html = await fetch_html(url)
    soup = BeautifulSoup(html, "lxml")
    for el in soup(["script", "style", "noscript"]):
        el.decompose()
    txt = soup.get_text("\n", strip=True)
    return txt[:20000]

