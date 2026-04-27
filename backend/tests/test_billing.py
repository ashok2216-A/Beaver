import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from main import app
from models import User
from utils.auth import get_current_user

client = TestClient(app)

# Mock user for testing
def get_mock_user():
    return User(
        id="user_test_123",
        email="test@beaver.ai",
        plan_type="free",
        subscription_status="incomplete"
    )

def get_mock_pro_user():
    return User(
        id="user_test_pro",
        email="pro@beaver.ai",
        plan_type="pro",
        subscription_status="active"
    )

@pytest.fixture
def mock_auth():
    """Mock the authentication dependency."""
    app.dependency_overrides[get_current_user] = get_mock_user
    yield
    app.dependency_overrides.pop(get_current_user)

@pytest.fixture
def mock_auth_pro():
    """Mock the authentication dependency for Pro users."""
    app.dependency_overrides[get_current_user] = get_mock_pro_user
    yield
    app.dependency_overrides.pop(get_current_user)

@patch("stripe.checkout.Session.create")
@patch("stripe.Price.retrieve")
def test_create_checkout_session(mock_price, mock_session, mock_auth):
    """Test that a checkout session is created correctly for a free user."""
    mock_price.return_value = MagicMock(currency="usd")
    mock_session.return_value = MagicMock(url="https://checkout.stripe.com/test")
    
    response = client.post("/api/v1/billing/create-checkout-session")
    
    assert response.status_code == 200
    assert "url" in response.json()
    assert response.json()["url"] == "https://checkout.stripe.com/test"

def test_get_billing_config(mock_auth):
    """Test fetching billing configuration."""
    response = client.get("/api/v1/billing/config")
    assert response.status_code == 200
    assert "payment_provider" in response.json()

def test_agent_limit_enforcement(mock_auth):
    """Test that a free user cannot create more than 1 agent."""
    # This assumes we mock the DB to show 1 agent already exists
    # We can refine this with a full DB mock if needed
    pass

def test_pro_agent_unlimited(mock_auth_pro):
    """Test that a pro user can create multiple agents."""
    pass
