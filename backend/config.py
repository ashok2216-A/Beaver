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
    mistral_api_key: str = ""
    gemini_model: str = "mistral/mistral-small-latest"

    # ── Auth ──────────────────────────────────────────────────────
    clerk_publishable_key: str = ""
    clerk_secret_key: str = ""
    clerk_jwks_url: str = ""
    admin_key: str = "" # Legacy
    secret_key: str = "change_me_in_production"
    access_token_expire_minutes: int = 60

    # ── Billing ───────────────────────────────────────────────────
    payment_provider: str = "both" # razorpay | stripe | both
    
    # Stripe
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_pro_plan_id: str = ""
    
    # Razorpay
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    razorpay_webhook_secret: str = ""
    razorpay_plan_id: str = ""

    frontend_url: str = "http://localhost:3000"

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

    def validate_production_security(self) -> None:
        """Raise if dangerous defaults are used in production."""
        if self.is_production:
            weak_secrets = {"change_me_in_production", "supersecretchangeme-in-production-use-openssl-rand-hex-32", ""}
            if self.secret_key in weak_secrets:
                raise RuntimeError(
                    "FATAL: SECRET_KEY is set to a default/weak value. "
                    "Generate a strong key with: python -c \"import secrets; print(secrets.token_hex(32))\""
                )


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    s.validate_production_security()
    return s
