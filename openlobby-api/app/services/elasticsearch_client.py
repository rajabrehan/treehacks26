from __future__ import annotations

import os

from elasticsearch import AsyncElasticsearch

from app.config import get_settings


_es: AsyncElasticsearch | None = None


def es() -> AsyncElasticsearch:
    global _es
    if _es is None:
        s = get_settings()
        if not (s.elastic_cloud_id and s.elastic_api_key):
            raise RuntimeError("Elasticsearch is not configured (ELASTIC_CLOUD_ID/ELASTIC_API_KEY).")
        _es = AsyncElasticsearch(cloud_id=s.elastic_cloud_id, api_key=s.elastic_api_key)
    return _es


async def ensure_indices():
    """Create minimal indices if they don't exist. Safe to call on startup/ingest."""
    s = get_settings()
    client = es()

    if not await client.indices.exists(index=s.elastic_index_documents):
        await client.indices.create(
            index=s.elastic_index_documents,
            mappings={
                "properties": {
                    "id": {"type": "keyword"},
                    "type": {"type": "keyword"},
                    "title": {"type": "text"},
                    "url": {"type": "keyword"},
                    "source": {"type": "keyword"},
                    "published_at": {"type": "date"},
                    "excerpt": {"type": "text"},
                    "content": {"type": "text"},
                    "image_url": {"type": "keyword"},
                    "tags": {"type": "keyword"},
                    "entities_mentioned": {"type": "keyword"},
                    "embedding": {
                        "type": "dense_vector",
                        "dims": s.jina_dims,
                        "index": True,
                        "similarity": "cosine",
                    },
                    "last_updated": {"type": "date"},
                }
            },
        )
