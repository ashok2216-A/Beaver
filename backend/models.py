"""
models.py — SQLAlchemy ORM models.
"""
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, ForeignKey,
    DateTime, Enum as SAEnum, JSON, Boolean,
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

class User(Base):
    __tablename__ = "users"

    id         = Column(String(255), primary_key=True)  # Clerk ID
    email      = Column(String(255), nullable=True)
    
    # Monetization fields
    stripe_customer_id  = Column(String(255), nullable=True, index=True)
    subscription_id     = Column(String(255), nullable=True, index=True)
    plan_type           = Column(String(32), default="free", nullable=False) # free | pro
    subscription_status = Column(String(32), default="incomplete", nullable=False) # active | past_due | etc
    
    # User Preferences
    email_notifications = Column(Boolean, default=True, nullable=False)
    weekly_reports      = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    agents        = relationship("Agent", back_populates="owner", cascade="all, delete-orphan")
    api_keys      = relationship("ApiKey", back_populates="owner", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="owner", cascade="all, delete-orphan")


class ApiKey(Base):
    __tablename__ = "api_keys"

    id           = Column(Integer, primary_key=True)
    user_id      = Column(String(255), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    key_hash     = Column(String(255), nullable=False, unique=True)
    name         = Column(String(100), default="My API Key")
    created_at   = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_used_at = Column(DateTime(timezone=True), nullable=True)

    owner = relationship("User", back_populates="api_keys")


class Agent(Base):
    __tablename__ = "agents"

    id             = Column(Integer, primary_key=True, index=True)
    owner_id       = Column(String(255), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    name           = Column(String(120), nullable=False)
    description    = Column(Text, default="")
    base_url       = Column(String(512), default="")
    api_spec       = Column(Text, nullable=False)          # raw JSON/YAML string
    system_prompt  = Column(Text, default="")
    auth_type      = Column(String(32), default="bearer")  # bearer | apikey | none
    auth_header    = Column(String(100), nullable=True)    # optional custom header name (e.g. x-api-key)
    auth_secret    = Column(Text, default="")              # encrypted in prod
    model_id       = Column(String(64), default="mistral/mistral-small-latest")
    custom_headers = Column(JSON, default=dict)            # e.g. {"Notion-Version": "2022-06-28"}
    status         = Column(SAEnum(AgentStatus), default=AgentStatus.draft, nullable=False)
    created_at     = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    updated_at     = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                            onupdate=lambda: datetime.now(timezone.utc))

    owner     = relationship("User", back_populates="agents")
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
    is_locked   = Column(Boolean, default=False)

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
    input_tokens = Column(Integer, default=0)
    output_tokens= Column(Integer, default=0)
    created_at   = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    agent = relationship("Agent", back_populates="logs")


class Conversation(Base):
    __tablename__ = "conversations"

    id         = Column(String(255), primary_key=True)
    user_id    = Column(String(255), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title      = Column(String(255), default="New Chat")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    owner    = relationship("User", back_populates="conversations")
    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id              = Column(Integer, primary_key=True)
    conversation_id = Column(String(255), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role            = Column(String(32), nullable=False) # user | assistant
    content         = Column(Text, nullable=False)
    created_at      = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    conversation = relationship("Conversation", back_populates="messages")
