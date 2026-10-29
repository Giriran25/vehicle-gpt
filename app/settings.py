from functools import lru_cache

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./vehiclegpt.db"
    app_env: str = "development"
    vercel_env: str | None = Field(default=None, validation_alias="VERCEL_ENV")
    seed_demo_data: bool | None = None
    db_pool_size: int = Field(default=2, ge=1, le=50)
    db_max_overflow: int = Field(default=3, ge=0, le=100)
    db_pool_timeout: int = Field(default=30, ge=1, le=300)
    db_pool_recycle: int = Field(default=1800, ge=60, le=86400)

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        value = str(value).strip()
        if value.startswith(("postgres://", "postgresql://")):
            value = "postgresql+psycopg://" + value.split("://", 1)[1]
        if not value.startswith(("sqlite://", "postgresql+psycopg://")):
            raise ValueError("DATABASE_URL must use SQLite or PostgreSQL")
        return value

    @model_validator(mode="after")
    def validate_runtime_configuration(self) -> "Settings":
        production = self.app_env.lower() in {"production", "prod"} or self.vercel_env == "production"
        if production and not self.database_url.startswith("postgresql+psycopg://"):
            raise ValueError("DATABASE_URL must be a hosted PostgreSQL URL in production")
        if self.seed_demo_data is None:
            self.seed_demo_data = not production
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
