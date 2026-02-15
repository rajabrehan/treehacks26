from __future__ import annotations

from datetime import date as dt_date, datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


EntityType = Literal["politician", "company", "pac", "lobbyist", "bill", "document"]
RelationshipType = Literal["donation", "lobbying", "vote", "employment"]


class NewsItem(BaseModel):
    id: str
    title: str
    url: str
    source: str
    published_at: datetime | None = None
    excerpt: str = ""
    image_url: str | None = None
    entities_mentioned: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)


class CaseStep(BaseModel):
    id: str
    kicker: str
    headline: str
    body: str
    key_finding: dict[str, str]
    related_document_ids: list[str] = Field(default_factory=list)
    related_urls: list[str] = Field(default_factory=list)
    collage_image_urls: list[str] = Field(default_factory=list)
    viz: dict[str, Any] = Field(default_factory=dict)


class CaseFile(BaseModel):
    id: str
    title: str
    dek: str = ""
    hero_image_url: str | None = None
    tags: list[str] = Field(default_factory=list)
    steps: list[CaseStep] = Field(default_factory=list)
    entities_featured: list[str] = Field(default_factory=list)


class Entity(BaseModel):
    id: str
    type: EntityType
    name: str
    description: str | None = None
    party: str | None = None
    state: str | None = None
    industry: str | None = None
    total_lobbying: float | None = None
    total_donations: float | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    last_updated: datetime | None = None


class Relationship(BaseModel):
    id: str
    type: RelationshipType
    source_id: str
    target_id: str
    amount: float | None = None
    date: dt_date | None = None
    cycle: str | None = None
    description: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    last_updated: datetime | None = None


class GraphResponse(BaseModel):
    seed_id: str
    nodes: list[Entity] = Field(default_factory=list)
    edges: list[Relationship] = Field(default_factory=list)


class SearchHit(BaseModel):
    id: str
    type: Literal["document", "entity", "relationship"]
    title: str
    snippet: str = ""
    url: str | None = None
    score: float | None = None
    image_url: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class AskRequest(BaseModel):
    question: str
    limit: int = 8


class AskResponse(BaseModel):
    answer: str
    sources: list[SearchHit]
