import hashlib
import hmac
import json
import logging

import razorpay
import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from config import get_settings
from database import get_db
from models import User
from utils.auth import get_current_user
from utils.limiter import limiter

log = logging.getLogger(__name__)
router = APIRouter(prefix="/billing", tags=["Billing"])

@router.get("/config")
@limiter.limit("10/minute")
async def get_billing_config(request: Request):
    """Return the active payment provider config."""
    settings = get_settings()
    return {
        "payment_provider": settings.payment_provider,
        "razorpay_key_id": settings.razorpay_key_id, # Public key is safe to expose
    }

# ─── Razorpay Endpoints ──────────────────────────────────────────

@router.post("/create-subscription")
async def create_subscription(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a Razorpay Subscription for the Pro plan."""
    settings = get_settings()
    
    # Robust configuration check
    if settings.payment_provider == "stripe":
        raise HTTPException(status_code=400, detail="Razorpay is disabled in this environment.")
        
    missing_keys = []
    if not settings.razorpay_key_id:
        missing_keys.append("RAZORPAY_KEY_ID")
    if not settings.razorpay_key_secret:
        missing_keys.append("RAZORPAY_KEY_SECRET")
    if not settings.razorpay_plan_id:
        missing_keys.append("RAZORPAY_PLAN_ID")
    
    if missing_keys:
        msg = f"Razorpay is not fully configured. Missing: {', '.join(missing_keys)}"
        log.error(msg)
        raise HTTPException(status_code=400, detail=msg)

    try:
        client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))
        subscription = client.subscription.create({
            "plan_id": settings.razorpay_plan_id,
            "customer_notify": 1,
            "total_count": 120,
            "notes": {"user_id": user.id}
        })
        return {
            "provider": "razorpay",
            "subscription_id": subscription["id"],
            "razorpay_key_id": settings.razorpay_key_id,
            "user_email": user.email
        }
    except Exception as e:
        log.error(f"Razorpay API Error: {e}")
        raise HTTPException(status_code=400, detail=f"Razorpay Error: {str(e)}")

@router.post("/razorpay-webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(None),
    db: Session = Depends(get_db)
):
    settings = get_settings()
    payload = await request.body()
    try:
        webhook_secret = settings.razorpay_webhook_secret or ""
        expected_signature = hmac.new(
            webhook_secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(expected_signature, x_razorpay_signature):
            raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception:
        raise HTTPException(status_code=400, detail="Verification failed")

    data = json.loads(payload)
    event = data.get("event")
    if event in ["subscription.activated", "subscription.charged"]:
        sub_obj = data["payload"]["subscription"]["entity"]
        user_id = sub_obj.get("notes", {}).get("user_id")
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.subscription_id = sub_obj["id"]
                user.plan_type = "pro"
                user.subscription_status = "active"
                db.commit()
    return {"status": "success"}

# ─── Stripe Endpoints ─────────────────────────────────────────────

@router.post("/create-checkout-session")
async def create_checkout_session(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a Stripe Checkout Session for the Pro plan."""
    settings = get_settings()
    
    if settings.payment_provider == "razorpay":
        raise HTTPException(status_code=400, detail="Stripe is disabled in this environment.")

    # Stripe-specific configuration check
    if not settings.stripe_secret_key or not settings.stripe_pro_plan_id:
        log.error("Stripe is not fully configured!")
        raise HTTPException(status_code=400, detail="Stripe configuration is missing (Secret Key or Plan ID).")

    stripe.api_key = settings.stripe_secret_key
    stripe.api_version = "2024-04-10"
    
    try:
        # Most compatible version for all Stripe accounts
        session = stripe.checkout.Session.create(
            customer=user.stripe_customer_id,
            line_items=[{'price': settings.stripe_pro_plan_id, 'quantity': 1}],
            mode='subscription',
            success_url=f"{settings.frontend_url}/dashboard?checkout=success",
            cancel_url=f"{settings.frontend_url}/dashboard/billing?checkout=cancel",
            metadata={"user_id": user.id}
        )
        return {"provider": "stripe", "url": session.url}
    except Exception as e:
        log.warning(f"Default Stripe checkout failed, trying card-only fallback: {e}")
        try:
            session = stripe.checkout.Session.create(
                customer=user.stripe_customer_id,
                payment_method_types=['card'],
                line_items=[{'price': settings.stripe_pro_plan_id, 'quantity': 1}],
                mode='subscription',
                success_url=f"{settings.frontend_url}/dashboard?checkout=success",
                cancel_url=f"{settings.frontend_url}/dashboard/billing?checkout=cancel",
                metadata={"user_id": user.id}
            )
            return {"provider": "stripe", "url": session.url}
        except Exception as fallback_e:
            log.error(f"Stripe Fallback Error: {fallback_e}")
            raise HTTPException(status_code=400, detail=str(fallback_e))

@router.post("/stripe-webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None),
    db: Session = Depends(get_db)
):
    settings = get_settings()
    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.stripe_webhook_secret
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook")

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session.get("metadata", {}).get("user_id")
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.subscription_id = session.get("subscription")
                user.plan_type = "pro"
                user.subscription_status = "active"
                db.commit()
    return {"status": "success"}
