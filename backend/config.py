"""
config.py — Central, typed settings loaded from .env via pydantic-settings.
All modules import from here; never hard-code secrets elsewhere.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Database ───────────────────────────────────────────────────
    database_url: str = "sqlite:///./agents.db"

    # ── LLM ───────────────────────────────────────────────────────
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"

    # ── Auth ──────────────────────────────────────────────────────
    secret_key: str = "change_me_in_production"
    access_token_expire_minutes: int = 60

    # ── CORS ──────────────────────────────────────────────────────
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"

    # ── Misc ──────────────────────────────────────────────────────
    app_env: str = "development"
    log_level: str = "INFO"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
