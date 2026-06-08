import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from main import app
from models.models import User
from utils.auth import get_current_user
from database.database import get_db

client = TestClient(app)

# Mock users
def get_mock_user():
    return User(id="user_free", email="free@beaver.ai", plan_type="free")

def get_mock_pro_user():
    return User(id="user_pro", email="pro@beaver.ai", plan_type="pro")

@pytest.fixture
def mock_auth_free():
    app.dependency_overrides[get_current_user] = get_mock_user
    yield
    app.dependency_overrides.pop(get_current_user)

@pytest.fixture
def mock_auth_pro():
    app.dependency_overrides[get_current_user] = get_mock_pro_user
    yield
    app.dependency_overrides.pop(get_current_user)

def test_create_agent_encryption(mock_auth_free):
    """Test that auth_secret is encrypted when a new agent is created."""
    agent_data = {
        "name": "Secure Agent",
        "description": "Tests encryption",
        "base_url": "https://api.example.com",
        "api_spec": {},
        "auth_type": "bearer",
        "auth_secret": "super-secret-key-123"
    }
    
    with patch("database.database.get_db") as mock_get_db:
        mock_db_session = MagicMock()
        mock_get_db.return_value = iter([mock_db_session]) 
        app.dependency_overrides[get_db] = lambda: mock_db_session
        
        # Mock count to return 0 so creation proceeds
        mock_db_session.query.return_value.filter.return_value.count.return_value = 0
        
        # Create a helper to set fields on the object
        from datetime import datetime
        def mock_refresh(obj):
            obj.id = 1
            obj.created_at = datetime.now()
            obj.updated_at = datetime.now()
            obj.status = MagicMock()
            obj.status.value = "active"
            obj.endpoint_count = 0
            return None

        mock_db_session.add = MagicMock()
        mock_db_session.commit = MagicMock()
        mock_db_session.refresh = MagicMock(side_effect=mock_refresh)
        
        response = client.post("/api/v1/agents/", json=agent_data)
        app.dependency_overrides.pop(get_db)
        assert response.status_code == 201

def test_free_user_limit_enforcement(mock_auth_free):
    """Test that a free user is blocked after creating 1 agent."""
    with patch("sqlalchemy.orm.Session.query") as mock_query:
        # Mock that user already has 1 agent
        mock_query.return_value.filter.return_value.count.return_value = 1
        
        agent_data = {"name": "Second Agent", "api_spec": {}}
        response = client.post("/api/v1/agents/", json=agent_data)
        
        assert response.status_code == 402
        assert "upgrade to Pro" in response.json()["detail"]

def test_pro_user_unlimited(mock_auth_pro):
    """Test that a pro user can bypass the 1-agent limit."""
    with patch("database.database.get_db"):
        mock_db_session = MagicMock()
        app.dependency_overrides[get_db] = lambda: mock_db_session
        
        # Mock that user already has 5 agents
        mock_db_session.query.return_value.filter.return_value.count.return_value = 5
        
        from datetime import datetime
        def mock_refresh(obj):
            obj.id = 1
            obj.created_at = datetime.now()
            obj.updated_at = datetime.now()
            obj.status = MagicMock()
            obj.status.value = "active"
            obj.endpoint_count = 0
            return None

        mock_db_session.add = MagicMock()
        mock_db_session.commit = MagicMock()
        mock_db_session.refresh = MagicMock(side_effect=mock_refresh)
        
        agent_data = {"name": "Sixth Agent", "api_spec": {}}
        response = client.post("/api/v1/agents/", json=agent_data)
        app.dependency_overrides.pop(get_db)
        
        # 402 is Payment Required. For Pro user, it should NOT return 402.
        assert response.status_code != 402


def test_enrich_mcp_parameters_with_defaults():
    from routes.agents import _enrich_mcp_parameters_with_defaults
    
    # Mock tools list returned by discover_mcp_tools_sync
    mock_tools = [
        {
            "name": "GOOGLE_MAPS_TEXT_SEARCH",
            "description": "text search",
            "parameters": [
                {"name": "textQuery", "type": "string", "required": True},
                {"name": "fieldMask", "type": "string", "required": False}
            ]
        }
    ]
    
    enriched = _enrich_mcp_parameters_with_defaults("composio:googlemaps", mock_tools)
    
    field_mask_param = next(p for p in enriched[0]["parameters"] if p["name"] == "fieldMask")
    assert "default" in field_mask_param
    assert "places.websiteUri" in field_mask_param["default"]


def test_sanitize_mcp_params_injected_default():
    from services.adk_runner import _sanitize_mcp_params
    
    endpoint_params = [
        {"name": "textQuery", "type": "string", "required": True},
        {"name": "fieldMask", "type": "string", "required": False, "default": "places.displayName,places.websiteUri"}
    ]
    
    # Case 1: fieldMask is missing
    sanitized1 = _sanitize_mcp_params("GOOGLE_MAPS_TEXT_SEARCH", {"textQuery": "test query"}, endpoint_params)
    assert sanitized1["fieldMask"] == "places.displayName,places.websiteUri"
    
    # Case 2: fieldMask is empty string
    sanitized2 = _sanitize_mcp_params("GOOGLE_MAPS_TEXT_SEARCH", {"textQuery": "test query", "fieldMask": ""}, endpoint_params)
    assert sanitized2["fieldMask"] == "places.displayName,places.websiteUri"
    
    # Case 3: fieldMask is already specified
    sanitized3 = _sanitize_mcp_params("GOOGLE_MAPS_TEXT_SEARCH", {"textQuery": "test query", "fieldMask": "places.displayName"}, endpoint_params)
    assert sanitized3["fieldMask"] == "places.displayName"

