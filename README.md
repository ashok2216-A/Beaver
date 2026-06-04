# 🚀 Beaver.ai

Turn any OpenAPI spec into a production-ready AI agent in seconds. `Beaver` parses your API documentation and spins up a Gemini-powered agent that can interact with your live endpoints via natural language.

---

## ✨ Features

- **3D Command Bar Experience**: A tactile, non-transparent interaction layer with multi-layered shadows for a premium physical feel.
- **Dynamic Selection Palette**: Color-synchronized selection system where interaction glows match each agent's unique 3D badge.
- **Instant Recognition**: Client-side tier caching and shimmer skeletons ensure zero-flicker performance during page transitions.
- **Space-Efficient Density**: Optimized UI containers and support grids for maximum screen real estate utilization without sacrificing aesthetics.
- **Instant Agent Generation**: Upload a JSON/YAML OpenAPI spec or paste a URL to automatically configure an agent.
- **Enterprise-Grade Billing**: Support for both **Stripe** (International) and **Razorpay** (Domestic) with environment-driven provider switching.
- **Security Hardened**: Built-in rate limiting (slowapi), IDOR protection, and a comprehensive security audit suite.

---

## 🛠️ Technology Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Agent Orchestration**: [Google ADK](https://github.com/google/agent-development-kit)
- **Database**: SQLAlchemy + Alembic (PostgreSQL/Neon)
- **Monetization**: Stripe & Razorpay SDKs
- **Security**: slowapi, bandit, ruff

### Frontend
- **Library**: React 19 (Next.js 16)
- **Build Tool**: Next.js (App Router)
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **State Management**: React Hook Form + Zod

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+
- Google Gemini API Key

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and configure your `.env` file (see `.env.example`).
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run Database Migrations:
   ```bash
   python -m alembic upgrade head
   ```
5. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## 🛡️ Security & Testing

### Automated Penetration Test
To run the automated security scan against your local instance:
```bash
cd backend
python tests/penetration_test.py
```
### CI/CD Pipeline
Every push to `main` triggers a GitHub Action that performs:
- 🔍 Change Detection
- 🐍 Backend Linting (Ruff) & Security Scanning (Bandit)
- 🧪 Pytest Suite (Billing, Agents, Security)
- ⚛️ Frontend Build Verification

---

## 📂 Project Structure

```bash
beaver/
├── .github/workflows/   # CI/CD Pipelines
├── backend/
│   ├── alembic/         # Database migrations
│   ├── routes/          # API endpoints (Billing, Agents, Chat)
│   ├── utils/           # Hardening (Logging, Security, Auth)
│   └── tests/           # Security & Unit tests
├── frontend/
│   ├── components/      # UI components (shadcn/ui)
│   └── app/             # Next.js App Router (Dashboard, Auth, Landing)
└── render.yaml          # Render Blueprints for Automated Deployment
```

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
