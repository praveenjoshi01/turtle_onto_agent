# Agent & Developer Guidelines - InternalOnto

This document defines coding standards, architecture principles, and guidelines for AI agents and developers working on `InternalOnto`.

## 🏗️ Architecture Summary

- **System Architecture**: Detailed architecture notes can be found in [ARCHITECTURE.md](file:///Users/praveenjoshi/Code/Code2026/InternalOnto/ARCHITECTURE.md).
- **Frontend**: Vite + Vanilla HTML5/CSS3/JavaScript (ES modules).
- **RDF Parser**: `n3` library for parsing standard W3C Turtle (`.ttl`) format, handling prefixes, blank nodes, and triples.
- **Graph Visualization**: `vis-network` interactive force-directed graph renderer.

## 🛠️ Code Conventions

1. **Vanilla JS Modular Architecture**: Keep code decoupled into logical modules (`turtleParser.js`, `graphRenderer.js`, `main.js`).
2. **Design System**: Use modern CSS with dark theme, custom color accents, glassmorphism containers, smooth hover states, and responsive flex/grid layouts.
3. **RDF Turtle Compliance**: Handle standard Turtle features including `@prefix`, `PREFIX`, `a` shorthand for `rdf:type`, blank nodes (`_:b0`), literals with language tags or datatypes, and URI compacting.
4. **Performance**: Large graphs (>500 nodes) should use physics stabilization and node clustering/filtering options to maintain 60 FPS graph interaction.

## 🧪 Testing & Verification

- Run `npm run build` to verify clean compilation before committing code changes.
