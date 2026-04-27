# Security Audit & Penetration Testing Plan

This document outlines the strategy for testing the security resilience of the Beaver AI Studio.

## 1. Authentication & Authorization
- **Auth Bypass**: Attempt to access `/api/v1/agents` and `/api/v1/chat` without a Bearer token.
- **Token Integrity**: Tamper with the JWT token and verify if the backend rejects it.
- **IDOR (Insecure Direct Object Reference)**:
  - Attempt to view/edit an Agent ID that belongs to another user.
  - Attempt to read chat logs from a Session ID that doesn't belong to the authenticated user.

## 2. API Security
- **Injection Attacks**:
  - Test the `Agent Name`, `Description`, and `System Prompt` for SQL injection patterns.
  - Test for Command Injection in the ADK runner (ensure arbitrary code cannot be executed).
- **Rate Limiting**:
  - Flood the chat endpoint to verify if `slowapi` triggers a `429 Too Many Requests`.
- **Sensitive Data Exposure**:
  - Verify that the `auth_secret` (API keys) of agents are NEVER returned in raw text in `GET` requests.
  - Check if the `/billing/config` endpoint leaks any internal secrets.

## 3. ADK Sandbox Testing
- **Resource Exhaustion**: Send a prompt that forces the agent into an infinite loop or massive tool calls.
- **Network Isolation**: Attempt to make the agent call internal network IPs (SSRF).

## 4. Automation
I have created a `penetration_test.py` script in the `backend/tests/` directory to automate these checks.

### Running the Security Scan:
```bash
cd backend
python tests/penetration_test.py
```
