"""
schemas.py — Pydantic v2 request / response models.
Strict types keep the API contract clear and self-documenting.
"""
from __future__ import annotations
from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field, field_validator


# ─── Shared / tiny types ──────────────────────────────────────────────────────

class EndpointOut(BaseModel):
    id: int
    path: str
    method: str
    summary: str
    description: str
    parameters: list[dict[str, Any]]
    request_body: dict[str, Any]
    is_locked: bool = False
    requires_approval: bool = False
    source_type: str = "rest"
    mcp_server_url: Optional[str] = None

    model_config = {"from_attributes": True}

class EndpointCreate(BaseModel):
    path: str = Field(..., min_length=1)
    method: str = Field(..., min_length=2)
    summary: Optional[str] = ""
    description: Optional[str] = ""
    parameters: Optional[list[dict[str, Any]]] = []
    request_body: Optional[dict[str, Any]] = {}
    requires_approval: bool = False
    source_type: Optional[str] = "rest"
    mcp_server_url: Optional[str] = None


class EndpointUpdate(BaseModel):
    path: Optional[str] = None
    method: Optional[str] = None
    summary: Optional[str] = None
    description: Optional[str] = None
    parameters: Optional[list[dict[str, Any]]] = None
    request_body: Optional[dict[str, Any]] = None
    requires_approval: Optional[bool] = None
    source_type: Optional[str] = None
    mcp_server_url: Optional[str] = None


class PaginatedEndpoints(BaseModel):
    total: int
    page: int
    per_page: int
    items: list[EndpointOut]


# ─── User & Auth ──────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: str
    email: Optional[str] = None
    plan_type: str = "free"
    subscription_status: str = "incomplete"
    email_notifications: bool = True
    weekly_reports: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}
    

class UserUpdate(BaseModel):
    email_notifications: Optional[bool] = None
    weekly_reports: Optional[bool] = None


class ApiKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class ApiKeyOut(BaseModel):
    id: int
    name: str
    key: Optional[str] = None  # Only populated once on creation
    created_at: datetime
    last_used_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class UserIntegrationOut(BaseModel):
    id: int
    provider: str
    account_id: Optional[str] = None
    scopes: list[str] = []
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OAuthConnectUrlOut(BaseModel):
    auth_url: str


class OAuthCallbackRequest(BaseModel):
    code: str
    state: str


# ─── Agent ────────────────────────────────────────────────────────────────────

class AgentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    description: str = Field("", max_length=500)
    base_url: str = ""
    api_spec: Optional[Any] = None
    system_prompt: str = Field("", max_length=2000)
    auth_type: str = "bearer"          # bearer | apikey | none
    auth_header: Optional[str] = None
    auth_secret: str = ""
    model_id: Optional[str] = "gemini/gemini-3.1-flash-lite"
    custom_headers: dict[str, str] = Field(default_factory=dict)
    source_type: Optional[str] = "rest"
    mcp_server_url: Optional[str] = None

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = Field(None, max_length=500)
    base_url: Optional[str] = None
    system_prompt: Optional[str] = Field(None, max_length=2000)
    auth_type: Optional[str] = None
    auth_header: Optional[str] = None
    auth_secret: Optional[str] = None
    model_id: Optional[str] = None
    status: Optional[str] = None
    custom_headers: Optional[dict[str, str]] = None
    source_type: Optional[str] = None
    mcp_server_url: Optional[str] = None


class AgentOut(BaseModel):
    id: int
    owner_id: Optional[str] = None
    name: str
    description: str
    base_url: str
    status: str
    model_id: str
    system_prompt: str
    auth_type: str
    auth_header: Optional[str] = None
    is_authorized: bool = False
    endpoint_count: int = 0
    custom_headers: dict[str, str] = Field(default_factory=dict)
    source_type: str = "rest"
    mcp_server_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
        # SEC-1: Explicitly block secret fields from ever being serialized
        "json_schema_extra": {"description": "Public agent representation. auth_secret is never exposed."},
    }


class AgentDetail(AgentOut):
    endpoints: list[EndpointOut] = []


# ─── Chat ─────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=131072)


class ChatMessageOut(BaseModel):
    id: int
    conversation_id: str
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: datetime
    messages: list[ChatMessageOut] = []

    model_config = {"from_attributes": True}


class ConversationListOut(BaseModel):
    id: str
    title: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatResponse(BaseModel):
    answer: str
    chunks: Optional[list[dict[str, Any]]] = None
    endpoint: Optional[dict[str, Any]] = None
    api_response: Optional[Any] = None
    status_code: int = 0
    latency_ms: int = 0
    log_id: int = 0
    conversation_id: Optional[str] = None


# ─── Logs ─────────────────────────────────────────────────────────────────────

class LogOut(BaseModel):
    id: int
    agent_id: int
    user_input: str
    matched_path: Optional[str] = ""
    method: Optional[str] = ""
    status_code: int = 0
    latency_ms: int = 0
    api_response: Optional[str] = ""
    llm_thought: Optional[str] = ""
    error: Optional[str] = ""
    input_tokens: int = 0
    output_tokens: int = 0
    agent_name: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedLogs(BaseModel):
    total: int
    page: int
    per_page: int
    items: list[LogOut]


# ─── Generic ──────────────────────────────────────────────────────────────────

class MessageOut(BaseModel):
    message: str


class BulkDeleteRequest(BaseModel):
    ids: list[int]


class StatsOut(BaseModel):
    agent_count: int
    message_count: int
    total_latency_ms: int
    avg_latency_ms: int
    agent_trend: str = "+0"
    message_trend: str = "+0%"
    latency_trend: str = "-0ms"


class HealthStatsOut(BaseModel):
    api_availability: str
    llm_success: str
    latency_ms: str
    upgrade_percentage: int
    plan_type: str = "free"


class DailyVelocity(BaseModel):
    date: str
    requests: int


class VelocityOut(BaseModel):
    items: list[DailyVelocity]


