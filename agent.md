# OntoSphere AI - Developer & Agent Guidelines

This document provides developer guidelines and operational instructions for AI agents working in the **OntoSphere AI** repository.

---

## 🚨 Critical Security Directive

- **OpenAI / OpenRouter API Key**: Stored in root `.env` as `OPENAI_API_KEY=sk-proj-...` or `open_ai=sk-proj-...`.
- **NEVER Commit Credentials**: The `.env` file MUST remain in `.gitignore`. NEVER add, commit, log, or push secret keys to Git.
- **Dynamic API Key Gateway**: Keys can also be configured at runtime via the web UI top header button (`🔑 Connect OpenAI API`) which calls `POST /api/set-key`.

---

## 🤖 Onto Agent Architecture & Capabilities

The AI Agent assistant (**Onto Agent**) is powered by **Nous Hermes Agent** prompt intelligence:
- **Reasoning Loop**: Uses `<thought>...</thought>` blocks for multi-hop RDF triple reasoning and entity traversal before returning synthesized answers.
- **Supported Models**: `GPT-4o`, `GPT-4o-mini`, `Nous Hermes 3 (405B)`, and `Nous Hermes 3 (70B)`.
- **UI Thought Accordion**: Frontend parses `<thought>` tags into collapsible `🧠 Onto Agent Reasoning` accordions.
- **Rich Markdown Formatting**: Chat responses render full GitHub-flavored Markdown.

---

## 📁 Repository Organization

```
InternalOnto/
├── agent/               # Dedicated AI Agent components directory
│   ├── client.py        # Python LLM API Gateway server (Onto Agent Gateway)
│   ├── requirements.txt # Python requirements manifest
│   └── agentClient.js   # Frontend agent communication module
├── index.html           # Main HTML dashboard (Left Inspector + Right Onto Agent)
├── vite.config.js       # Vite dev server & proxy setup (/api -> http://localhost:8000)
├── src/
│   ├── main.js          # Main application orchestrator
│   ├── style.css        # Visual design system
│   ├── turtleParser.js  # N3 RDF parser and store manager
│   └── graphRenderer.js # Vis-network 2D & Tree graph renderer
├── samples/             # Sample RDF Turtle ontologies
├── ARCHITECTURE.md      # System architecture & Mermaid diagrams
└── README.md            # Main README
```

---

## 🌐 API Gateway Endpoints (`agent/client.py`)

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/health` | `GET` | Health check endpoint returning gateway status and `has_api_key` state. |
| `/api/set-key` | `POST` | Configures OpenAI / OpenRouter API Key dynamically at runtime and persists to `.env`. |
| `/api/chat` | `POST` | Dispatches user queries + active Turtle context to the LLM via Nous Hermes reasoning loop. |

---

## 🛠️ Execution & Verification Commands

### 1. Python Gateway Server
```bash
pip3 install -r agent/requirements.txt
python3 agent/client.py
```
- Server endpoint: `http://localhost:8000`
- Health check: `curl -s http://localhost:8000/api/health`

### 2. Frontend Development Server
```bash
npm run dev
```
- Web App URL: `http://localhost:5173`

### 3. Production Build
```bash
npm run build
```
- Verifies zero JS/CSS compilation errors.
