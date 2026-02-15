from __future__ import annotations

from supabase import Client, create_client

from app.config import get_settings


_client: Client | None = None


def supabase_admin() -> Client:
    global _client
    if _client is None:
        s = get_settings()
        if not (s.supabase_url and s.supabase_service_role_key):
            raise RuntimeError("Supabase is not configured (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY).")
        _client = create_client(s.supabase_url, s.supabase_service_role_key)
    return _client
