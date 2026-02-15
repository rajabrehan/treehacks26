from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from uuid import UUID

from fastapi import HTTPException
from jose import JWTError, jwt

from app.config import get_settings


@dataclass(frozen=True)
class UserContext:
    user_id: str
    claims: dict[str, Any]


def require_user(authorization_header: str | None) -> UserContext:
    """
    Verify a Supabase access token (HS256) using SUPABASE_JWT_SECRET.

    Expected header:
      Authorization: Bearer <access_token>
    """
    if not authorization_header or not authorization_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization: Bearer <token>")

    s = get_settings()
    if not s.supabase_jwt_secret:
        raise HTTPException(status_code=503, detail="Auth is not configured (SUPABASE_JWT_SECRET missing).")

    token = authorization_header.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")

    try:
        # Supabase JWTs include `aud` but we don't need to validate it server-side here.
        claims = jwt.decode(token, s.supabase_jwt_secret, algorithms=["HS256"], options={"verify_aud": False})
    except JWTError:
        raise HTTPException(status_code=403, detail="Invalid or expired token")

    sub = claims.get("sub")
    if not isinstance(sub, str) or not sub.strip():
        raise HTTPException(status_code=403, detail="Token missing subject (sub)")

    try:
        uid = str(UUID(sub))
    except Exception:
        raise HTTPException(status_code=403, detail="Invalid subject (sub) in token")

    return UserContext(user_id=uid, claims=claims)

