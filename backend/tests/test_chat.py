import pytest
import json
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from main import app
from models.models import User, Agent
from utils.auth import get_current_user
from database.database import get_db

client = TestClient(app)

def get_mock_user():
    return User(id="user_chat_test", email="chat@beaver.ai", plan_type="pro")

@pytest.fixture
def mock_auth():
    app.dependency_overrides[get_current_user] = get_mock_user
    yield
    app.dependency_overrides.pop(get_current_user)

@patch("services.adk_runner.run_agent_stream")
def test_chat_stream_initiation(mock_run, mock_auth):
    """Test that a chat session can be initiated and calls the runner."""
    async def async_iter(items):
        for item in items:
            yield item
            
    mock_run.return_value = async_iter([json.dumps({"type": "token", "text": "Hello"}) + "\n"])
    
    chat_data = {
        "message": "Hello world"
    }
    
    # We use a mock for the database to ensure the agent exists
    mock_db_session = MagicMock()
    app.dependency_overrides[get_db] = lambda: mock_db_session
    
    try:
        mock_agent = MagicMock(spec=Agent)
        mock_agent.id = 1
        mock_agent.owner_id = "user_chat_test"
        
        # Mocking both query and get for compatibility
        mock_db_session.query.return_value.filter.return_value.first.return_value = mock_agent
        mock_db_session.get.return_value = mock_agent
        
        # Test the endpoint with streaming enabled
        response = client.post("/api/v1/chat/1?stream=true", json=chat_data)
        
        # Since it's a streaming response, we check for 200
        assert response.status_code == 200
        # Check if the runner was called
        assert mock_run.called
    finally:
        app.dependency_overrides.pop(get_db)

def test_chat_invalid_agent(mock_auth):
    """Test that chatting with a non-existent agent returns 404."""
    mock_db_session = MagicMock()
    app.dependency_overrides[get_db] = lambda: mock_db_session
    try:
        mock_db_session.get.return_value = None
        
        chat_data = {"message": "Hidden agent"}
        response = client.post("/api/v1/chat/999", json=chat_data)
        assert response.status_code == 404
    finally:
        app.dependency_overrides.pop(get_db)
