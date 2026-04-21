"""
schemas.py — Pydantic v2 request / response models.
Strict types keep the API contract clear and self-documenting.
"""
from __future__ import annotations
from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field, field_validator, model_validator


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

    model_config = {"from_attributes": True}


# ─── User & Auth ──────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: str
    email: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ApiKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class ApiKeyOut(BaseModel):
    id: int
    name: str
    key: Optional[str] = None  # Only populated once on creation
    created_at: datetime
    last_used_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Agent ────────────────────────────────────────────────────────────────────

class AgentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    description: str = ""
    base_url: str = ""
    api_spec: dict[str, Any]           # parsed OpenAPI JSON
    system_prompt: str = ""
    auth_type: str = "bearer"          # bearer | apikey | none
    auth_header: Optional[str] = None
    auth_secret: str = ""
    model_id: str = "gemini/gemini-2.0-flash-lite"

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    base_url: Optional[str] = None
    system_prompt: Optional[str] = None
    auth_type: Optional[str] = None
    auth_header: Optional[str] = None
    auth_secret: Optional[str] = None
    model_id: Optional[str] = None
    status: Optional[str] = None


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
    endpoint_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AgentDetail(AgentOut):
    endpoints: list[EndpointOut] = []


# ─── File / URL ingestion ─────────────────────────────────────────────────────

class IngestUrlRequest(BaseModel):
    url: str = Field(..., min_length=5)
    name: str = Field(..., min_length=1, max_length=120)
    description: str = ""
    base_url: str = ""


class IngestPreviewRequest(BaseModel):
    url: str = Field(..., min_length=5)


class IngestPreviewOut(BaseModel):
    name: str
    description: str
    base_url: str


# ─── Chat ─────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4096)


class ChatResponse(BaseModel):
    answer: str
    endpoint: Optional[dict[str, Any]] = None
    api_response: Optional[Any] = None
    latency_ms: int
    log_id: int


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


class StatsOut(BaseModel):
    agent_count: int
    message_count: int
    total_latency_ms: int
    avg_latency_ms: int
