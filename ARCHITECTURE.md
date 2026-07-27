# OntoSphere AI - System Architecture

This document provides a detailed technical architecture overview of **OntoSphere AI**, an interactive, browser-based multi-file RDF Turtle (`.ttl`) graph visualizer, ontology explorer, and **Onto Agent** assistant powered by the official **Nous Research Hermes Agent** framework (`agent/client.py` and `agent/hermes_agent`).

---

## 🏗️ High-Level System Architecture

OntoSphere AI follows a modular, decoupled Single Page Application (SPA) architecture built with **Vite**, **Vanilla ES Modules**, an automated setup orchestrator (`setup.sh`), and a dedicated **Nous Hermes Agent Gateway (`agent/client.py`)**.

```mermaid
graph TD
    subgraph Setup ["Automated Setup Layer (setup.sh / npm run setup)"]
        NPMInst["npm install (Frontend Node.js Packages)"]
        GitClone["git clone NousResearch/hermes-agent -> agent/hermes_agent"]
        UvVenv["uv venv --python 3.12 .venv"]
        UvPip["uv pip install -e agent/hermes_agent flask flask-cors python-dotenv"]
    end

    subgraph UI ["User Interface Layer (index.html & style.css)"]
        Header["App Header & Sample Selector & API Key Modal"]
        DropZone["Drag & Drop Zone & File Upload"]
        LeftSidebar["Left Sidebar (Controls, Loaded Files, Dynamic Legend, Entity Inspector)"]
        RightSidebar["Right Sidebar (Onto Agent Chat Panel)"]
    end

    subgraph Controller ["Application Orchestrator"]
        MainJS["main.js (Event Listener & Coordinator)"]
        AgentClient["agent/agentClient.js (Agent Communication Module)"]
    end

    subgraph DataEngine ["Data Engine (src/turtleParser.js)"]
        TurtleMgr["TurtleManager"]
        N3Parser["N3.Parser (RDF Turtle Parser)"]
        QuadStore["N3.Store (Combined RDF Quads)"]
        UriCompacter["URI Compacter & Prefix Resolver"]
    end

    subgraph RenderEngine ["Render Engine (src/graphRenderer.js)"]
        GraphRndr["GraphRenderer"]
        VisNetwork["Vis-Network Canvas Engine"]
        Physics["ForceAtlas2 / Hierarchical Physics Engine"]
    end

    subgraph LLMGateway ["Hermes Agent Gateway (agent/client.py)"]
        FlaskServer["Flask Gateway Server (http://localhost:8000)"]
        OfficialAIAgent["Official Nous Research Hermes Agent Runner (AIAgent)"]
        HermesSubrepo["agent/hermes_agent/ (Official Hermes Agent v0.19.0)"]
        DotEnv["Root .env Credentials Loader (OPENAI_API_KEY / OPENROUTER_API_KEY)"]
        OpenAIAPI["OpenAI / OpenRouter API (gpt-4o & Nous Hermes 3)"]
    end

    %% Setup relationships
    NPMInst --> MainJS
    GitClone --> HermesSubrepo
    UvVenv --> FlaskServer
    UvPip --> OfficialAIAgent

    %% Flow connections
    Header -->|Select Sample Preset / Set Key| MainJS
    DropZone -->|Upload .ttl Files| MainJS
    LeftSidebar -->|Apply Search / Predicate / Layout Filters| MainJS

    MainJS -->|Pass Turtle Text| N3Parser
    N3Parser -->|Parsed Quads| QuadStore
    QuadStore -->|Merge Quads| TurtleMgr
    TurtleMgr -->|Extract Nodes & Edges| UriCompacter
    UriCompacter -->|Graph Dataset| MainJS

    MainJS -->|Render Graph Data| GraphRndr
    GraphRndr -->|Draw Nodes & Edges| VisNetwork
    VisNetwork -->|Run Stabilization| Physics

    VisNetwork -->|Node/Edge Click Event| MainJS
    MainJS -->|Query Quad Details| TurtleMgr
    TurtleMgr -->|Return Triples| LeftSidebar

    RightSidebar -->|Dispatch Query| AgentClient
    AgentClient -->|POST /api/chat| FlaskServer
    FlaskServer -->|Execute Chain of Thought| OfficialAIAgent
    OfficialAIAgent -->|Load Framework Engine| HermesSubrepo
    DotEnv -->|Load API Key| FlaskServer
    OfficialAIAgent -->|Query LLM| OpenAIAPI
    OpenAIAPI -->|Return Response + <thought>| AgentClient
    AgentClient -->|Render Markdown & <details> Thought Accordion| RightSidebar
```

---

## 🧩 Core Modules & Component Breakdown

### 1. Automated Setup Orchestrator (`setup.sh` / `npm run setup`)
A single-command deployment script ensuring any agentic IDE or fresh developer environment builds all dependencies automatically:
- Installs Node.js packages (`npm install`).
- Clones official **Nous Research Hermes Agent** (`git clone --depth 1 https://github.com/NousResearch/hermes-agent.git agent/hermes_agent`).
- Provisions Python 3.12 virtual environment using `uv` (`uv venv --python 3.12 .venv`).
- Installs `hermes-agent` v0.19.0 and gateway packages (`uv pip install -e agent/hermes_agent flask flask-cors python-dotenv`).

### 2. `agent/` Directory & Official Hermes Agent Integration
The dedicated module containing all AI Agent gateway and client logic:
- **`agent/client.py`**: Python Flask API server running on port `8000`. Imports official `AIAgent` runner from `agent/hermes_agent/run_agent.py`. Exposes `GET /api/health`, `POST /api/set-key`, and `POST /api/chat` (supporting `gpt-4o`, `gpt-4o-mini`, `nousresearch/hermes-3-llama-3.1-405b`, and `nousresearch/hermes-3-llama-3.1-70b`).
- **`agent/hermes_agent/`**: Cloned official Nous Research Hermes Agent framework (v0.19.0) with reasoning loops, tool calling, and self-improving skill architecture.
- **`agent/requirements.txt`**: Python requirement manifest.
- **`agent/agentClient.js`**: Frontend JavaScript module encapsulating gateway health checks (`checkGatewayHealth`), key updates (`saveApiKey`), and chat requests (`sendAgentQuery`).

### 3. `TurtleManager` (`src/turtleParser.js`)
The data engine responsible for ingestion, parsing, RDF storage, and querying.
- **N3 Library Integration**: Uses W3C-compliant `n3` parser to parse `.ttl` files asynchronously.
- **Multi-File State Store**: Maintains an internal registry of uploaded files (`Map<id, file>`) and an active set (`Set<id>`).
- **Store Merging (`rebuildCombinedStore`)**: Dynamically merges RDF quads from active files into a single unified `N3.Store`.

### 4. `GraphRenderer` (`src/graphRenderer.js`)
The visualization renderer wrapping `vis-network`.
- **Layout Solvers**: Supports Force-Directed network layout and Hierarchical Tree layouts (Top-Down and Left-Right).
- **Semantic Color Palette & HSL Engine**: Categorizes nodes based on RDF class types with deterministic color generation for custom classes.

### 5. Application Orchestrator (`src/main.js`)
The event mediator connecting user inputs, graph canvas events, left Entity Inspector updates, and right-side Onto Agent chat queries with expandable `🧠 Onto Agent Reasoning` accordions.
