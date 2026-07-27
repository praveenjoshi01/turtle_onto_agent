# InternalOnto - System Architecture

This document provides a detailed technical architecture overview of **InternalOnto**, an interactive, browser-based multi-file RDF Turtle (`.ttl`) graph visualizer, ontology explorer, and **Hermes AI Agent** assistant powered by `client.py` (`gpt-4o`).

---

## 🏗️ High-Level System Architecture

InternalOnto follows a modular, decoupled Single Page Application (SPA) architecture built with **Vite**, **Vanilla ES Modules**, and a **Python Gateway (`client.py`)**.

```mermaid
graph TD
    subgraph UI ["User Interface Layer (index.html & style.css)"]
        Header["App Header & Sample Selector"]
        DropZone["Drag & Drop Zone & File Upload"]
        LeftSidebar["Left Sidebar (Controls, Loaded Files, Entity Inspector, Legend)"]
        RightSidebar["Right Sidebar (Hermes AI Agent Panel)"]
    end

    subgraph Controller ["Application Orchestrator"]
        MainJS["main.js (Event Listener & Coordinator)"]
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

    subgraph LLMGateway ["Python Gateway (client.py)"]
        FlaskServer["Flask Server (http://localhost:8000)"]
        DotEnv[".env Credentials Loader (OPENAI_API_KEY / open_ai)"]
        OpenAIAPI["OpenAI API (gpt-4o)"]
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

    RightSidebar -->|POST /api/chat (Query + RDF Context)| FlaskServer
    DotEnv -->|Load API Key| FlaskServer
    FlaskServer -->|Query LLM| OpenAIAPI
    OpenAIAPI -->|Return Response| RightSidebar
```

---

## 🧩 Core Modules & Component Breakdown

### 1. `client.py` (Python LLM Gateway Server)
The Python backend server acting as an API gateway to OpenAI `gpt-4o`.
- **Credential Safety**: Securely loads `OPENAI_API_KEY` or `open_ai` from `.env`. `.env` is listed in `.gitignore` to prevent credential exposure.
- **REST Endpoints**:
  - `GET /api/health`: Health status endpoint.
  - `POST /api/chat`: Receives `{ query, turtle_content, triples_summary }`, builds context, queries `gpt-4o`, and returns Markdown responses.

### 2. `TurtleManager` (`src/turtleParser.js`)
The data engine responsible for ingestion, parsing, RDF storage, and querying.
- **N3 Library Integration**: Uses W3C-compliant `n3` parser to parse `.ttl` files asynchronously.
- **Multi-File State Store**: Maintains an internal registry of uploaded files (`Map<id, file>`) and an active set (`Set<id>`).
- **Store Merging (`rebuildCombinedStore`)**: Dynamically merges RDF quads from active files into a single unified `N3.Store`.
- **URI Compacter (`compactUri`)**: Automatically resolves full IRIs into compact prefix format using extracted `@prefix` declarations.

### 3. `GraphRenderer` (`src/graphRenderer.js`)
The visualization renderer wrapping `vis-network`.
- **Layout Solvers**: Supports Force-Directed network layout and Hierarchical Tree layouts (Top-Down and Left-Right).
- **Semantic Color Palette & HSL Engine**: Categorizes nodes based on RDF class types with deterministic color generation for custom classes.
- **Interactivity**: Supports node selection events, camera focusing, edge relationship highlighting, and interactive legend filtering.

### 4. Application Orchestrator (`src/main.js`)
The event mediator connecting user inputs, graph canvas events, left Entity Inspector updates, and right-side Hermes AI Agent chat queries.

### 5. UI Layout & Design System (`index.html` & `src/style.css`)
- **Left Sidebar**: Houses File Management, Left Entity Inspector, Graph Filters & Layout Switcher, and Dynamic Ontology Legend.
- **Center Canvas**: Full 2D interactive canvas with zoom controls and stats toolbar.
- **Right Sidebar**: **Hermes AI Agent Panel** featuring quick prompt chips, chat history stream, and input box.

---

## 🔄 Data Processing Flow

1. **Ingestion**: User drops one or more `.ttl` files onto the drop zone.
2. **Parsing**: `TurtleManager.addFile()` parses raw Turtle text into quads and extracts `@prefix` statements.
3. **Canvas Rendering**: `GraphRenderer.render()` populates the network graph.
4. **Entity Inspection**: Clicking any node or edge updates the **Left Entity Inspector** panel with incoming and outgoing RDF statements.
5. **AI Chat Interaction**: User types a question in the **Right Hermes AI Panel**. `main.js` sends a POST request with the user query and active Turtle RDF text to `client.py` on port `8000`. `client.py` queries `gpt-4o` and streams the answer back to the chat drawer.
