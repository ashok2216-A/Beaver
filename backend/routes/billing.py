from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
import stripe
import os
import logging

from database import get_db
from models import User
from utils.auth import get_current_user

log = logging.getLogger(__name__)
router = APIRouter(prefix="/billing", tags=["Billing"])

@router.post("/create-checkout-session")
async def create_checkout_session(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a Stripe Checkout Session for the Pro plan."""
    from config import get_settings
    settings = get_settings()
    stripe.api_key = settings.stripe_secret_key
    
    if not stripe.api_key:
        log.error("STRIPE_SECRET_KEY is not set in environment variables")
        raise HTTPException(status_code=500, detail="Stripe is not configured.")
    
    if not settings.stripe_pro_plan_id:
        log.error("STRIPE_PRO_PLAN_ID is not set in environment variables")
        raise HTTPException(status_code=500, detail="Pro Plan ID is missing.")

    # Ensure user has a stripe customer ID
    if not user.stripe_customer_id:
        try:
            log.info(f"Creating new Stripe customer for user {user.id}")
            customer = stripe.Customer.create(email=user.email, metadata={"user_id": user.id})
            user.stripe_customer_id = customer.id
            db.commit()
        except Exception as e:
            log.error(f"Failed to create Stripe customer: {e}")
            raise HTTPException(status_code=500, detail="Failed to initialize billing.")

    try:
        from config import get_settings
        settings = get_settings()
        stripe.api_key = settings.stripe_secret_key
        stripe.api_version = "2024-04-10" # Ensure we use a version that supports automatic methods for subscriptions
        
        log.info(f"Initiating checkout for user {user.id} on plan {settings.stripe_pro_plan_id}")
        
        try:
            session = stripe.checkout.Session.create(
                customer=user.stripe_customer_id,
                automatic_payment_methods={'enabled': True},
                line_items=[{
                    'price': settings.stripe_pro_plan_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=f"{settings.frontend_url}/dashboard?checkout=success",
                cancel_url=f"{settings.frontend_url}/dashboard/billing?checkout=cancel",
                metadata={"user_id": user.id}
            )
            return {"url": session.url}
        except Exception as e:
            log.warning(f"Automatic payment methods failed, falling back to card: {e}")
            # Absolute fallback to card
            session = stripe.checkout.Session.create(
                customer=user.stripe_customer_id,
                payment_method_types=['card'],
                line_items=[{
                    'price': settings.stripe_pro_plan_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=f"{settings.frontend_url}/dashboard?checkout=success",
                cancel_url=f"{settings.frontend_url}/dashboard/billing?checkout=cancel",
                metadata={"user_id": user.id}
            )
            return {"url": session.url}
    except Exception as e:
        log.error(f"Stripe Checkout Session Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/create-portal-session")
async def create_portal_session(user: User = Depends(get_current_user)):
    """Create a Stripe Customer Portal session for subscription management."""
    from config import get_settings
    settings = get_settings()
    stripe.api_key = settings.stripe_secret_key

    if not user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No billing history found.")
        
    try:
        session = stripe.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=f"{settings.frontend_url}/dashboard/billing",
        )
        return {"url": session.url}
    except Exception as e:
        log.error(f"Stripe Portal Session Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    SEC-MON: Secure Webhook Handler.
    Verifies signature and updates user plan status.
    """
    from config import get_settings
    settings = get_settings()
    webhook_secret = settings.stripe_webhook_secret

    if not webhook_secret:
        log.error("STRIPE_WEBHOOK_SECRET not set!")
        raise HTTPException(status_code=500, detail="Webhook secret not configured.")

    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the event
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
                log.info(f"User {user_id} upgraded to PRO")

    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        user = db.query(User).filter(User.subscription_id == subscription.id).first()
        if user:
            user.plan_type = "free"
            user.subscription_status = "canceled"
            db.commit()
            log.info(f"User {user.id} subscription canceled")

    elif event['type'] == 'customer.subscription.updated':
        subscription = event['data']['object']
        user = db.query(User).filter(User.subscription_id == subscription.id).first()
        if user:
            user.subscription_status = subscription.status
            if subscription.status == 'active':
                user.plan_type = "pro"
            else:
                user.plan_type = "free" # Or handle other states specifically
            db.commit()

    return {"status": "success"}
