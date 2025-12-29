"""Application configuration settings."""
from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    app_name: str = "NDI Compliance System"
    app_version: str = "1.0.0"
    debug: bool = False
    app_env: str = "development"

    # Server
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    allowed_origins: str = "http://localhost:3000"

    # Database
    database_url: str = "postgresql://ndi_user:ndi_password@localhost:5432/ndi_db"
    database_pool_size: int = 20
    database_max_overflow: int = 10

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Qdrant
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: Optional[str] = None
    qdrant_collection_name: str = "ndi_embeddings"

    # AI Providers
    google_api_key: Optional[str] = None
    azure_openai_api_key: Optional[str] = None
    azure_openai_endpoint: Optional[str] = None
    azure_openai_deployment_name: Optional[str] = None
    openai_api_key: Optional[str] = None

    # Embedding model
    embedding_model: str = "text-embedding-ada-002"
    embedding_dimension: int = 1536

    # Authentication
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Storage
    s3_bucket: Optional[str] = None
    s3_access_key: Optional[str] = None
    s3_secret_key: Optional[str] = None
    s3_endpoint: Optional[str] = None
    upload_dir: str = "uploads"
    max_upload_size: int = 50 * 1024 * 1024  # 50MB

    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def allowed_origins_list(self) -> list[str]:
        """Return list of allowed origins."""
        return [origin.strip() for origin in self.allowed_origins.split(",")]


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
