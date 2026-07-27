# InternalOnto - RDF & Turtle File Visualizer

**InternalOnto** is a web-based visualization tool for single and multi-file RDF Turtle (`.ttl`) ontologies and knowledge graphs. It allows users to upload, merge, query, inspect, and interactively explore complex RDF datasets.

---

## ✨ Features

- **Single & Multi-File Support**: Upload individual `.ttl` files or batch upload multiple files simultaneously.
- **Graph View Modes**: Switch between single file focus views or a merged view combining triples across all loaded Turtle files.
- **Interactive Graph Renderer**: Powered by high-performance physics simulation (`vis-network`), supporting node dragging, zooming, selection, and layout stabilization.
- **Node & Edge Inspection**: Click on any node or connection to inspect subject/predicate/object triples, literal datatypes, namespaces, and source files.
- **RDF Search & Filter**: Filter nodes and relationships by predicate, RDF class/type, namespace prefix, or text search.
- **Namespace Auto-Prefixing**: Automatically compacts long URIs using `@prefix` declarations for clean graph labels.
- **Sample Ontologies Built-In**: Preloaded with sample organization and technology stack ontologies for instant demonstration.

---

## 🏗️ Architecture & Documentation

For detailed technical architecture, data processing flow, and component design, see [ARCHITECTURE.md](file:///Users/praveenjoshi/Code/Code2026/InternalOnto/ARCHITECTURE.md).

Developer and AI agent guidelines can be found in [agent.md](file:///Users/praveenjoshi/Code/Code2026/InternalOnto/agent.md).

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Launch development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

---

## 📁 Repository Structure

```
InternalOnto/
├── index.html           # Main HTML dashboard layout
├── src/
│   ├── main.js          # App orchestrator & event handling
│   ├── style.css        # Visual design system & modern dark UI
│   ├── turtleParser.js  # RDF/Turtle parsing engine (N3.js wrapper)
│   └── graphRenderer.js # Interactive 2D graph renderer (Vis-network)
├── samples/             # Sample Turtle (.ttl) files for testing
│   ├── sample_org.ttl   # Organization hierarchy ontology
│   └── sample_tech.ttl  # Tech stack connection ontology
├── README.md            # Main project documentation
├── ARCHITECTURE.md      # Detailed system architecture & data flow
├── agent.md             # Developer & AI agent guidelines
└── package.json         # Node manifest and dependencies
```

---

## 🐢 Turtle File Examples

### Loading Files
- **Drag & Drop**: Drag `.ttl` files directly onto the drop zone in the visualizer interface.
- **File Picker**: Click "Upload .ttl Files" to select one or more `.ttl` files from your computer.
- **Sample Loader**: Use the header dropdown to load pre-built sample ontologies.

---

## 📜 License

MIT License. Created for internal ontology visualization and graph exploration.
