import pytest
from pydantic import ValidationError

from app.settings import Settings


def test_postgresql_urls_use_psycopg_driver_and_preserve_query_options():
    settings = Settings(
        database_url="postgres://user:password@db.example/vehicle?sslmode=require",
        app_env="production",
        seed_demo_data=False,
    )

    assert settings.database_url == (
        "postgresql+psycopg://user:password@db.example/vehicle?sslmode=require"
    )


def test_production_rejects_sqlite():
    with pytest.raises(ValidationError, match="hosted PostgreSQL"):
        Settings(database_url="sqlite:///./test.db", app_env="production")


def test_local_settings_enable_demo_seed_by_default():
    settings = Settings(database_url="sqlite:///./test.db", app_env="development")

    assert settings.seed_demo_data is True
