from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import ask, cases, entities, graph, ingest, news, search, user


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(title="OpenLobby API", version="0.1.0")

    allow_origins = [o.strip() for o in settings.cors_allow_origins.split(",") if o.strip()]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(news.router, prefix="/api/news", tags=["news"])
    app.include_router(cases.router, prefix="/api/cases", tags=["cases"])
    app.include_router(search.router, prefix="/api/search", tags=["search"])
    app.include_router(ask.router, prefix="/api/ask", tags=["ask"])
    app.include_router(ingest.router, prefix="/api/ingest", tags=["ingest"])
    app.include_router(entities.router, prefix="/api/entities", tags=["entities"])
    app.include_router(graph.router, prefix="/api/graph", tags=["graph"])
    app.include_router(user.router, prefix="/api/user", tags=["user"])

    @app.get("/healthz")
    async def healthz():
        return {"ok": True}

    return app


app = create_app()
