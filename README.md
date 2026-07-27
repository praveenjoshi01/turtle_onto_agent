# OntoSphere AI - RDF Visualizer & Onto Agent

**OntoSphere AI** is an interactive web-based visualization tool and AI assistant for single and multi-file RDF Turtle (`.ttl`) ontologies and knowledge graphs. It features a 2D/tree graph renderer, a left-side Entity Inspector, and a right-side **Onto Agent** powered by **Nous Hermes Agent** intelligence (`agent/client.py`).

---

## ✨ Key Features

- **Onto Agent (Powered by Nous Hermes Agent Intelligence)**: Multi-hop RDF triple reasoning with step-by-step `<thought>` reasoning blocks rendered inside expandable `🧠 Onto Agent Reasoning` accordions.
- **Multi-Model Selector**: Switch between `GPT-4o`, `GPT-4o-mini`, `Nous Hermes 3 (405B)`, and `Nous Hermes 3 (70B)`.
- **Dynamic API Key Connection**: Configure OpenAI / OpenRouter keys directly via the top header button (`🔑 Connect OpenAI API`) and glassmorphic modal dialog at runtime.
- **Single & Multi-File Support**: Upload individual `.ttl` files or batch upload multiple files simultaneously.
- **Left-Side Entity Inspector**: Inspect subject/predicate/object triples on the left sidebar, positioned as the bottom-most widget and expanding naturally downwards.
- **Optimized Right-Side Chat UI**: Scroll area starts directly beneath the model selector header; max 2 recommended question chips sit on top of the bottom chat box with automatic question rotation.
- **Rich Markdown Formatting**: Chat responses render full GitHub-flavored Markdown including headings, code blocks, lists, blockquotes, and tables.
- **Premium Glassmorphic Scrollbars**: Ultra-thin 6px cyan-blue gradient scrollbars across all scrollable panes.
- **Graph Layout Modes**: Switch between Force-Directed Network, Tree (Top-Down), and Tree (Left-Right) views.
- **Interactive Legend Filtering**: Click legend badges to highlight and zoom to all instances of an RDF class on the canvas.

---

## 🏗️ Architecture & Documentation

For detailed technical architecture, data processing flow, and component design, see [ARCHITECTURE.md](file:///Users/praveenjoshi/Code/Code2026/InternalOnto/ARCHITECTURE.md).

Developer and AI agent guidelines can be found in [agent.md](file:///Users/praveenjoshi/Code/Code2026/InternalOnto/agent.md).

---

## 🌐 API Gateway Endpoints (`agent/client.py`)

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/health` | `GET` | Returns gateway status, active model, and API key configuration state. |
| `/api/set-key` | `POST` | Configures OpenAI / OpenRouter API Key dynamically at runtime and persists to `.env`. |
| `/api/chat` | `POST` | Dispatches user queries + active Turtle context to the LLM via Nous Hermes reasoning loop. |

---

## 🚀 Quick Start & One-Command Setup

### ⚡ One-Step Automated Setup (All Dependencies + Hermes Agent)

Run this single command to automatically install Node.js dependencies, clone the official **Nous Research Hermes Agent** codebase, create the Python 3.12 `.venv` environment via `uv`, and install all agent packages:

```bash
npm run setup
# OR: bash setup.sh
```

---

### Manual Step-by-Step Setup

#### 1. Configure Credentials (.env)
Ensure your `.env` file exists in the repository root containing your API key:
```env
OPENAI_API_KEY=sk-proj-...
```
> Note: `.env` is listed in `.gitignore` to keep your credentials secure. You can also configure keys dynamically using the top header button (`🔑 Connect OpenAI API`) in the web UI.

#### 2. Launch Python LLM Gateway Server (`agent/client.py`)
```bash
uv run python agent/client.py
```
The gateway server will run at `http://localhost:8000`.

#### 3. Launch Frontend Web App
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
│   ├── client.py        # Python LLM API Gateway server (Onto Agent Gateway)
│   ├── requirements.txt # Python requirements manifest
│   └── agentClient.js   # Frontend agent communication module
├── index.html           # Main HTML layout (Left Inspector + Right Onto Agent)
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

MIT License. Created for ontology visualization and AI graph exploration.
