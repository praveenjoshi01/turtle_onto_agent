# OntoSphere AI - System Architecture

This document provides a detailed technical architecture overview of **OntoSphere AI**, an interactive, browser-based multi-file RDF Turtle (`.ttl`) graph visualizer, ontology explorer, and **Onto Agent** assistant powered by **Nous Hermes Agent** intelligence (`agent/client.py`).

---

## 🏗️ High-Level System Architecture

OntoSphere AI follows a modular, decoupled Single Page Application (SPA) architecture built with **Vite**, **Vanilla ES Modules**, and a dedicated **Nous Hermes Agent Gateway (`agent/client.py`)**.

```mermaid
graph TD
    subgraph UI ["User Interface Layer (index.html & style.css)"]
        Header["App Header & Sample Selector"]
        DropZone["Drag & Drop Zone & File Upload"]
        LeftSidebar["Left Sidebar (Controls, Loaded Files, Dynamic Legend, Entity Inspector)"]
        RightSidebar["Right Sidebar (Onto Agent Panel)"]
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
        FlaskServer["Flask Server (http://localhost:8000)"]
        HermesEngine["Nous Hermes Agent Reasoning Engine (<thought> loop)"]
        DotEnv["Root .env Credentials Loader (OPENAI_API_KEY / OPENROUTER_API_KEY)"]
        OpenAIAPI["OpenAI / OpenRouter API (gpt-4o & Nous Hermes 3)"]
    end

    %% Flow connections
    Header -->|Select Sample Preset| MainJS
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
    FlaskServer -->|Execute Chain of Thought| HermesEngine
    DotEnv -->|Load API Key| FlaskServer
    HermesEngine -->|Query LLM| OpenAIAPI
    OpenAIAPI -->|Return Response + <thought>| AgentClient
    AgentClient -->|Render Markdown & <details> Thought Accordion| RightSidebar
```

---

## 🧩 Core Modules & Component Breakdown

### 1. `agent/` Directory & Nous Hermes Agent Integration
The dedicated module containing all AI Agent gateway and client logic:
- **`agent/client.py`**: Python Flask API server running on port `8000`. Powered by **Nous Hermes Agent** prompt architecture, guiding multi-hop RDF triple reasoning inside `<thought>...</thought>` blocks. Exposes `GET /api/health`, `POST /api/set-key`, and `POST /api/chat` (supporting `gpt-4o`, `gpt-4o-mini`, `nousresearch/hermes-3-llama-3.1-405b`, and `nousresearch/hermes-3-llama-3.1-70b`).
- **`agent/requirements.txt`**: Python requirement manifest (`openai`, `python-dotenv`, `flask`, `flask-cors`).
- **`agent/agentClient.js`**: Frontend JavaScript module encapsulating gateway health checks (`checkGatewayHealth`), key updates (`saveApiKey`), and chat requests (`sendAgentQuery`).

### 2. `TurtleManager` (`src/turtleParser.js`)
The data engine responsible for ingestion, parsing, RDF storage, and querying.
- **N3 Library Integration**: Uses W3C-compliant `n3` parser to parse `.ttl` files asynchronously.
- **Multi-File State Store**: Maintains an internal registry of uploaded files (`Map<id, file>`) and an active set (`Set<id>`).
- **Store Merging (`rebuildCombinedStore`)**: Dynamically merges RDF quads from active files into a single unified `N3.Store`.

### 3. `GraphRenderer` (`src/graphRenderer.js`)
The visualization renderer wrapping `vis-network`.
- **Layout Solvers**: Supports Force-Directed network layout and Hierarchical Tree layouts (Top-Down and Left-Right).
- **Semantic Color Palette & HSL Engine**: Categorizes nodes based on RDF class types with deterministic color generation for custom classes.

### 4. Application Orchestrator (`src/main.js`)
The event mediator connecting user inputs, graph canvas events, left Entity Inspector updates, and right-side Onto Agent chat queries with expandable `🧠 Onto Agent Reasoning` accordions.
