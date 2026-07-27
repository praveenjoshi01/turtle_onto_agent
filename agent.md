# Agent Developer Guidelines

This document provides instructions and developer workflows for AI agents working in the **InternalOnto** repository.

---

## 🚨 Critical Security Directive

- **OpenAI API Key**: Stored in root `.env` as `open_ai=sk-proj-...` or `OPENAI_API_KEY=sk-proj-...`.
- **NEVER Commit Credentials**: The `.env` file MUST remain in `.gitignore`. NEVER add, commit, log, or push the contents of `.env` or raw secret keys to Git.

---

## 📁 Repository Organization

```
InternalOnto/
├── agent/               # Dedicated AI Agent components directory
│   ├── client.py        # Python LLM API Gateway server (Yoda AI Gateway)
│   ├── requirements.txt # Python requirements manifest
│   └── agentClient.js   # Frontend agent communication module
├── index.html           # Main HTML dashboard (Left Inspector + Right Yoda AI)
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
