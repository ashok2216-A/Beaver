from utils.security import encrypt_secret, decrypt_secret
import pytest
from unittest.mock import MagicMock, patch
from services.adk_runner import _build_agent
from models.models import ToolSource

def test_encryption_decryption():
    """Test that secrets are correctly encrypted and decrypted with AES-256."""
    original_secret = "sk-test-123456789"
    encrypted = encrypt_secret(original_secret)
    
    assert encrypted != original_secret
    assert len(encrypted) > len(original_secret)
    
    decrypted = decrypt_secret(encrypted)
    assert decrypted == original_secret

def test_decryption_fallback():
    """Test that decryption returns the original text if it's not encrypted (fallback)."""
    plain_text = "not_encrypted_yet"
    decrypted = decrypt_secret(plain_text)
    assert decrypted == plain_text

def test_empty_handling():
    """Test that empty strings are handled gracefully."""
    assert encrypt_secret("") == ""
    assert decrypt_secret("") == ""
    assert decrypt_secret(None) == ""

@pytest.mark.asyncio
@patch("database.database.SessionLocal")
async def test_shared_mcp_tool_authorization(mock_session_local):
    """Test that dynamic authorization allows shared MCP tools across agents."""
    # Create mock endpoints returned by the database query
    mock_db_mcp_endpoint = MagicMock()
    mock_db_mcp_endpoint.agent_id = 416
    mock_db_mcp_endpoint.path = "/mcp/tools/YOUTUBE_SEARCH_YOU_TUBE"
    mock_db_mcp_endpoint.method = "POST"
    mock_db_mcp_endpoint.is_locked = False
    mock_db_mcp_endpoint.requires_approval = False
    mock_db_mcp_endpoint.summary = "Search YouTube"
    mock_db_mcp_endpoint.description = "Searches for YouTube videos"
    mock_db_mcp_endpoint.parameters = []
    mock_db_mcp_endpoint.request_body = {}
    mock_db_mcp_endpoint.source_type = ToolSource.mcp_sse
    mock_db_mcp_endpoint.mcp_server_url = "http://localhost:8000"

    # Set up mock session
    mock_db = MagicMock()
    mock_session_local.return_value.__enter__.return_value = mock_db
    mock_db.query.return_value.filter.return_value.all.return_value = [mock_db_mcp_endpoint]

    # Build the agent for Agent 417
    agent = _build_agent(
        agent_name="agent_417",
        model="test-model",
        system_prompt="",
        endpoints=[], # empty endpoints to trigger dynamic authorization
        base_url="https://api.example.com",
        auth_type="bearer",
        auth_secret="token",
        auth_header=None,
        tool_log=[],
        user_input="test message",
        audio_artifacts=[],
        user_id="user_123",
        agent_id=417
    )

    # Get call_api_endpoint tool
    call_api_endpoint = [t for t in agent.tools if getattr(t, "__name__", None) == "call_api_endpoint"][0]

    # Mock execute_mcp_tool to avoid making actual HTTP/SSE calls
    with patch("services.mcp_service.execute_mcp_tool") as mock_execute:
        mock_execute.return_value = ({"result": "success"}, 200, 100)

        # Call the tool requesting YouTube search (Agent 417 calls 416's MCP tool)
        result_str = await call_api_endpoint(
            path="/mcp/tools/YOUTUBE_SEARCH_YOU_TUBE",
            method="POST",
            params='{"q": "AI Coding Assistants"}'
        )

        import json
        result = json.loads(result_str)
        assert result["status_code"] == 200
        import json
        assert json.loads(result["data"]) == {"result": "success"}
        assert mock_execute.called

def test_get_provider_name_from_urls():
    """Test that get_provider_name_from_urls correctly resolves provider names from URLs."""
    from utils.security import get_provider_name_from_urls
    
    # Test matching by path segment / alias
    assert get_provider_name_from_urls("http://localhost:8000/api/v1/custom_tools/duffel", None) == "duffel"
    assert get_provider_name_from_urls(None, "custom_tools:duffel_flights") == "duffel"
    assert get_provider_name_from_urls("http://localhost:8000/api/v1/custom_tools/duffelflights", None) == "duffel"
    assert get_provider_name_from_urls("http://example.com/other", None) is None

@pytest.mark.asyncio
async def test_executor_insecure_transport_bypass():
    """Test that call_api bypasses insecure_transport check for localhost and 127.0.0.1."""
    from services.executor import call_api
    import os
    
    # Mock httpx AsyncClient request to avoid making real calls
    with patch("httpx.AsyncClient.request") as mock_request:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"status": "ok"}
        mock_request.return_value = mock_resp
        
        # Calling localhost:8000 with http:// and auth_secret should NOT trigger insecure_transport
        res, status, _ = await call_api(
            base_url="http://localhost:8000",
            path="/api/v1/test",
            method="POST",
            endpoint_params=[],
            extracted_params={},
            auth_type="bearer",
            auth_secret="test_secret"
        )
        assert status == 200
        assert res == {"status": "ok"}
        
        # Calling a remote domain with http:// and auth_secret SHOULD trigger insecure_transport
        with patch.dict(os.environ, {"APP_ENV": "production"}):
            res2, status2, _ = await call_api(
                base_url="http://remote-api.com",
                path="/api/v1/test",
                method="POST",
                endpoint_params=[],
                extracted_params={},
                auth_type="bearer",
                auth_secret="test_secret"
            )
            assert status2 == 403
            assert res2["error"] == "insecure_transport"

