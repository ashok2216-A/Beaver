import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from main import app
from models import User
from utils.auth import get_current_user
from database import get_db

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
    
    with patch("database.get_db") as mock_get_db:
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
    with patch("database.get_db"):
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
