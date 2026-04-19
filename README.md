# 🚀 api2bot-studio

Turn any OpenAPI spec into a production-ready AI agent in seconds. `api2bot-studio` parses your API documentation and spins up a Gemini-powered agent that can interact with your live endpoints via natural language.

---

## ✨ Features

- **Instant Agent Generation**: Upload a JSON/YAML OpenAPI spec or paste a URL to automatically configure an agent.
- **Google ADK Powered**: Uses the latest Google Agent Development Kit (ADK) for robust tool-calling and multi-turn conversation management.
- **Live Testing Ground**: A 3-panel IDE-like interface to test your agent, view available endpoints, and tweak system prompts.
- **Dynamic API Execution**: Automatically handles path parameter substitution, query parameters, and authentication (Bearer/API Key).
- **Full Transparency**: Every conversation and tool call is logged with latency, status codes, and raw API responses.
- **Modern UI**: A premium, responsive design built with React, Tailwind CSS, and Framer Motion.

---

## 🛠️ Technology Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Agent Orchestration**: [Google ADK](https://github.com/google/agent-development-kit)
- **Database**: SQLAlchemy (SQLite for dev, PostgreSQL ready)
- **LLM**: Google Gemini (via ADK)
- **Validation**: Pydantic v2

### Frontend
- **Library**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React
- **Data Fetching**: React Query

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Google Gemini API Key

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and configure your `.env` file:
   ```bash
   cp .env.example .env
   # Add your GEMINI_API_KEY to the .env file
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend will be available at `http://localhost:8000`. You can access the interactive Swagger docs at `http://localhost:8000/docs`.

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install # or bun install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

---

## 📂 Project Structure

```bash
api2bot-studio/
├── backend/
│   ├── routes/          # API endpoints (Agents, Chat, Logs)
│   ├── services/        # Logic (ADK Runner, Parser, Executor)
│   ├── models.py        # SQLAlchemy database models
│   ├── schemas.py       # Pydantic validation schemas
│   ├── main.py          # App entry point
│   └── database.py      # Connection and session management
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Main app views (Dashboard, Builder, etc.)
│   │   ├── index.css    # Premium design system
│   │   └── App.tsx      # Routing and providers
│   └── tailwind.config.ts
└── README.md
```

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
