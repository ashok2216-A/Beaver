import logging
import sys
from config.config import get_settings

log = logging.getLogger(__name__)

def validate_environment():
    """
    Verify that all required environment variables are present on startup.
    Fails fast if critical production configuration is missing.
    """
    settings = get_settings()
    is_prod = settings.app_env.lower() == "production"
    
    # 1. Critical Base Config
    required_keys = {
        "SECRET_KEY": settings.secret_key,
        "DATABASE_URL": settings.database_url,
        "CLERK_SECRET_KEY": settings.clerk_secret_key,
    }

    # 2. Provider-Specific Config
    if settings.payment_provider in ["stripe", "both"]:
        required_keys["STRIPE_SECRET_KEY"] = settings.stripe_secret_key
        required_keys["STRIPE_PRO_PLAN_ID"] = settings.stripe_pro_plan_id
        
    if settings.payment_provider in ["razorpay", "both"]:
        required_keys["RAZORPAY_KEY_ID"] = settings.razorpay_key_id
        required_keys["RAZORPAY_KEY_SECRET"] = settings.razorpay_key_secret
        required_keys["RAZORPAY_PLAN_ID"] = settings.razorpay_plan_id

    missing = [k for k, v in required_keys.items() if not v or v == ""]

    if missing:
        log.critical("❌ MISSING CRITICAL CONFIGURATION: %s", ", ".join(missing))
        if is_prod:
            log.critical("FATAL: Application cannot start in production without these keys.")
            sys.exit(1)
        else:
            log.warning("WARNING: Running with missing keys in development. Some features may fail.")

    log.info("✅ Environment validation successful.")
