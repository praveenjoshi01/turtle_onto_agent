# InternalOnto - System Architecture

This document provides a detailed technical architecture overview of **InternalOnto**, an interactive, browser-based multi-file RDF Turtle (`.ttl`) graph visualizer and ontology explorer.

---

## 🏗️ High-Level System Architecture

InternalOnto follows a modular, decoupled Single Page Application (SPA) architecture built with **Vite** and **Vanilla ES Modules**.

```
 +-----------------------------------------------------------------------+
 |                            User Interface                             |
 |  (Header Preset Selector | Drag & Drop Zone | Sidebar Filters | Inspector) |
 +-----------------------------------+-----------------------------------+
                                     |
                                     v
 +-----------------------------------+-----------------------------------+
 |                          main.js (Orchestrator)                        |
 +------------------+----------------------------------+------------------+
                    |                                  |
                    v                                  v
 +------------------+------------------+   +-----------+------------------+
 |  turtleParser.js (TurtleManager)    |   | graphRenderer.js             |
 |  - N3 Parser & RDF Quad Store       |   | - Vis-Network Canvas Engine  |
 |  - Multi-file Store Merging         |   | - Force-Atlas2 Physics       |
 |  - URI Compacting & Prefix Maps     |   | - Node/Edge Selection        |
 +-------------------------------------+   +------------------------------+
```

---

## 🧩 Core Modules & Component Breakdown

### 1. `TurtleManager` (`src/turtleParser.js`)
The data engine responsible for ingestion, parsing, RDF storage, and querying.
- **N3 Library Integration**: Uses W3C-compliant `n3` parser to parse `.ttl` files asynchronously.
- **Multi-File State Store**: Maintains an internal registry of uploaded files (`Map<id, file>`) and an active set (`Set<id>`).
- **Store Merging (`rebuildCombinedStore`)**: Dynamically merges RDF quads from active files into a single unified `N3.Store`.
- **URI Compacter (`compactUri`)**: Automatically resolves full IRIs (e.g. `http://www.w3.org/1999/02/22-rdf-syntax-ns#type`) into compact prefix format (e.g. `rdf:type`) using extracted `@prefix` declarations.
- **Graph Extractor (`getGraphData`)**: Converts RDF quads into Vis-Network compatible nodes and directed edges while applying search and predicate filter pipelines.
- **Node Inspector Query (`getNodeDetails`)**: Queries incoming and outgoing statements for any selected subject or object.

### 2. `GraphRenderer` (`src/graphRenderer.js`)
The visualization renderer wrapping `vis-network`.
- **Force-Directed Layout**: Uses `ForceAtlas2Based` physics solver for organic node distribution and stabilization.
- **Semantic Color Palette**: Categorizes nodes based on RDF class types (`org:Company`, `org:Person`, `tech:Database`, `literal`, `bnode`, etc.) with tailored visual cues.
- **Interactivity**: Supports drag, smooth pinch zoom, hover tooltips, node selection events, edge relationship highlighting, and camera view fitting.

### 3. Application Orchestrator (`src/main.js`)
The event mediator connecting user inputs to model and view updates.
- **File Ingestion**: Handles native `<input type="file">` selections and drag-and-drop file uploads.
- **Sample Loader**: Fetches static Turtle samples (`/samples/sample_org.ttl`, `/samples/sample_tech.ttl`) via Fetch API.
- **Filter Pipeline**: Reacts to entity search inputs and predicate query strings in real time.
- **Inspector Drawer**: Renders outgoing/incoming triple detail cards when nodes or edges are selected.

### 4. UI & Styling System (`index.html` & `src/style.css`)
- **Dark Mode Aesthetic**: Custom HSL dark background palette (`#0b0f19`).
- **Glassmorphism Panels**: Translucent containers with `backdrop-filter: blur(12px)`.
- **Responsive Viewport**: Split-pane layout with fixed sidebar controls, full-screen canvas viewport, and sliding detail inspector.

---

## 🔄 Data Processing Flow

1. **Ingestion**: User drops one or more `.ttl` files onto the drop zone.
2. **Parsing**: `TurtleManager.addFile()` parses the raw Turtle text into quads and extracts `@prefix` statements using N3.
3. **Store Synchronization**: `rebuildCombinedStore()` adds quads from active files into `combinedStore`.
4. **Filtering**: `getGraphData({ search, predicate })` filters quads based on user inputs.
5. **Vis-Network Mapping**: Triples are mapped to unique node objects and directed edges with compact predicate labels.
6. **Rendering & Physics**: `GraphRenderer.render()` populates the network graph and runs physics stabilization.
7. **Inspection**: Clicking a node triggers `getNodeDetails(uri)` which displays all incoming and outgoing triples in the inspector drawer.

---

## 🧪 Scalability & Performance Principles

- **Quad Indexing**: `N3.Store` provides O(1) triple pattern lookups (`getQuads(subj, pred, obj)`).
- **Physics Stabilization**: Graph physics auto-stabilizes within 150 iterations to prevent continuous GPU/CPU load.
- **Large Graph Handling**: Nodes can be filtered by predicate or searched to isolate subgraphs in large ontologies (>1,000 nodes).
