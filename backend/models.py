"""
models.py — SQLAlchemy ORM models.
"""
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, ForeignKey,
    DateTime, Enum as SAEnum, JSON,
)
from sqlalchemy.orm import relationship
import enum
from database import Base


# ─── Enums ────────────────────────────────────────────────────────────────────

class AgentStatus(str, enum.Enum):
    draft = "draft"
    live = "live"
    paused = "paused"


class HttpMethod(str, enum.Enum):
    get = "GET"
    post = "POST"
    put = "PUT"
    patch = "PATCH"
    delete = "DELETE"


# ─── Models ───────────────────────────────────────────────────────────────────

class Agent(Base):
    __tablename__ = "agents"

    id             = Column(Integer, primary_key=True, index=True)
    name           = Column(String(120), nullable=False)
    description    = Column(Text, default="")
    base_url       = Column(String(512), default="")
    api_spec       = Column(Text, nullable=False)          # raw JSON/YAML string
    system_prompt  = Column(Text, default="")
    auth_type      = Column(String(32), default="bearer")  # bearer | apikey | none
    auth_secret    = Column(Text, default="")              # encrypted in prod
    model_id       = Column(String(64), default="gemini-1.5-flash")
    status         = Column(SAEnum(AgentStatus), default=AgentStatus.draft, nullable=False)
    created_at     = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at     = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                            onupdate=lambda: datetime.now(timezone.utc))

    endpoints = relationship("Endpoint", back_populates="agent",
                             cascade="all, delete-orphan")
    logs      = relationship("Log",      back_populates="agent",
                             cascade="all, delete-orphan")


class Endpoint(Base):
    __tablename__ = "endpoints"

    id          = Column(Integer, primary_key=True)
    agent_id    = Column(Integer, ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    path        = Column(String(512), nullable=False)
    method      = Column(SAEnum(HttpMethod), nullable=False)
    summary     = Column(Text, default="")
    description = Column(Text, default="")
    parameters  = Column(JSON, default=list)   # list[{name, in, required, schema}]
    request_body= Column(JSON, default=dict)   # simplified body schema

    agent = relationship("Agent", back_populates="endpoints")


class Log(Base):
    __tablename__ = "logs"

    id           = Column(Integer, primary_key=True)
    agent_id     = Column(Integer, ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    user_input   = Column(Text, nullable=False)
    matched_path = Column(String(512), default="")
    method       = Column(String(10), default="")
    status_code  = Column(Integer, default=0)
    latency_ms   = Column(Integer, default=0)
    api_response = Column(Text, default="")
    llm_thought  = Column(Text, default="")
    error        = Column(Text, default="")
    created_at   = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    agent = relationship("Agent", back_populates="logs")
