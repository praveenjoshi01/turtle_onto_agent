# Agent & Developer Guidelines - InternalOnto

This document defines coding standards, architecture principles, and guidelines for AI agents and developers working on `InternalOnto`.

## 🏗️ Architecture Summary

- **System Architecture**: Detailed architecture notes and Mermaid system diagrams can be found in [ARCHITECTURE.md](file:///Users/praveenjoshi/Code/Code2026/InternalOnto/ARCHITECTURE.md).
- **Frontend**: Vite + Vanilla HTML5/CSS3/JavaScript (ES modules).
- **Python Gateway (`client.py`)**: Flask API gateway server running on port `8000`, using `gpt-4o` via OpenAI API.
- **RDF Parser**: `n3` library for parsing standard W3C Turtle (`.ttl`) format.
- **Graph Visualization**: `vis-network` interactive force-directed & tree layout renderer.

## 🛠️ Code Conventions

1. **Vanilla JS Modular Architecture**: Keep code decoupled into logical modules (`turtleParser.js`, `graphRenderer.js`, `main.js`).
2. **Python Gateway (`client.py`)**: All LLM interactions pass through `client.py` on port `8000`. Credentials (`open_ai` or `OPENAI_API_KEY`) must strictly remain in `.env` (never committed to git).
3. **Architecture Diagrams**: Always maintain Mermaid diagrams (` ```mermaid `) in [ARCHITECTURE.md](file:///Users/praveenjoshi/Code/Code2026/InternalOnto/ARCHITECTURE.md) instead of plain ASCII text diagrams.
4. **Design System**: Use modern CSS with dark theme, glassmorphism containers, left-side entity inspector, and right-side Hermes AI chat panel.

## 🧪 Testing & Verification

- Run `npm run build` to verify clean frontend compilation before committing code.
- Run `python3 client.py` to verify API gateway server execution.
