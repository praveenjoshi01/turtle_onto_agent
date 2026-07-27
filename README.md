# InternalOnto - RDF Visualizer & Yoda AI Agent

**InternalOnto** is an interactive web-based visualization tool and AI assistant for single and multi-file RDF Turtle (`.ttl`) ontologies and knowledge graphs. It features a 2D/tree graph renderer, a left-side Entity Inspector, and a right-side **Yoda AI Assistant** powered by a dedicated Python LLM Gateway (`agent/client.py`) using `gpt-4o`.

---

## ✨ Features

- **Single & Multi-File Support**: Upload individual `.ttl` files or batch upload multiple files simultaneously.
- **Yoda AI Assistant (Right Side Panel)**: Ask questions about your ontology (e.g. "Who manages Engineering?", "What technologies does Project Apollo use?"). Powered by `agent/client.py` gateway and `gpt-4o`.
- **Left-Side Entity Inspector**: Click on any node or connection to inspect subject/predicate/object triples on the left sidebar.
- **Graph Layout Modes**: Switch between Force-Directed Network, Tree (Top-Down), and Tree (Left-Right) views.
- **Interactive Legend Filtering**: Click legend badges to highlight and zoom to all instances of an RDF class on the canvas.

---

## 🏗️ Architecture & Documentation

For detailed technical architecture, data processing flow, and component design, see [ARCHITECTURE.md](file:///Users/praveenjoshi/Code/Code2026/InternalOnto/ARCHITECTURE.md).

Developer and AI agent guidelines can be found in [agent.md](file:///Users/praveenjoshi/Code/Code2026/InternalOnto/agent.md).

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher recommended)
- Python 3.9+

### 1. Configure Credentials (.env)

Ensure your `.env` file exists in the repository root containing your OpenAI API key:
```env
open_ai=sk-proj-...
```
> Note: `.env` is listed in `.gitignore` to keep your credentials secure.

### 2. Launch Python LLM Gateway Server (`agent/client.py`)

Install dependencies and start the gateway:
```bash
pip3 install -r agent/requirements.txt
python3 agent/client.py
```
The gateway server will run at `http://localhost:8000`.

### 3. Launch Frontend Web App

In a separate terminal tab:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📁 Repository Structure

```
InternalOnto/
├── agent/               # Dedicated AI Agent components directory
│   ├── client.py        # Python LLM API Gateway server (Yoda AI Gateway)
│   ├── requirements.txt # Python requirements manifest
│   └── agentClient.js   # Frontend agent communication module
├── index.html           # Main HTML layout (Left Inspector + Right Yoda AI)
├── vite.config.js       # Vite dev server + API proxy configuration
├── src/
│   ├── main.js          # App orchestrator
│   ├── style.css        # Visual design system & modern dark UI
│   ├── turtleParser.js  # RDF/Turtle parsing engine (N3.js wrapper)
│   └── graphRenderer.js # Interactive 2D/Tree graph renderer (Vis-network)
├── samples/             # Sample Turtle (.ttl) files for testing
│   ├── sample_org.ttl   # Organization hierarchy ontology
│   └── sample_tech.ttl  # Tech stack connection ontology
├── README.md            # Main project documentation
├── ARCHITECTURE.md      # System architecture & Mermaid data flow
├── agent.md             # Developer & AI agent guidelines
└── .gitignore           # Git ignore file (safeguarding .env)
```

---

## 📜 License

MIT License. Created for internal ontology visualization and AI graph exploration.
