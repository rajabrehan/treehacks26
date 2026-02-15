from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    cors_allow_origins: str = "http://localhost:3000"

    # Supabase
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""

    # Elasticsearch
    elastic_cloud_id: str = ""
    elastic_api_key: str = ""
    elastic_index_documents: str = "openlobby-documents"
    elastic_index_entities: str = "openlobby-entities"
    elastic_index_relationships: str = "openlobby-relationships"

    # Jina embeddings
    jina_api_key: str = ""
    jina_model: str = "jina-embeddings-v3"
    jina_dims: int = 1024

    # Perplexity Sonar
    perplexity_api_key: str = ""
    perplexity_model: str = "sonar-pro"

    # Bright Data (optional)
    brightdata_web_unlocker_url: str | None = None
    brightdata_web_unlocker_token: str | None = None

    # Modal (optional but recommended)
    modal_token_id: str | None = None
    modal_token_secret: str | None = None
    modal_app_name: str = "openlobby-llm"
    modal_cls_name: str = "LLMService"

    # Ingest auth
    ingest_secret: str = ""

    # News/cases generation
    news_topics: str = "AI regulation,Drug pricing,Climate policy,Crypto oversight,Defense procurement"
    news_limit_default: int = 60

    def news_topics_list(self) -> list[str]:
        return [t.strip() for t in self.news_topics.split(",") if t.strip()]


_settings: Settings | None = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
