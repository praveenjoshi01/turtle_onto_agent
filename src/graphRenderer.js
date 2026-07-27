import { Network } from 'vis-network';

export class GraphRenderer {
  constructor(containerElement, callbacks = {}) {
    this.container = containerElement;
    this.callbacks = callbacks;
    this.network = null;
    this.nodesDataSet = null;
    this.edgesDataSet = null;

    // Preset palette for common RDF Node groups / classes
    this.groupColors = {
      company: { background: '#0284c7', border: '#38bdf8' },
      department: { background: '#0d9488', border: '#2dd4bf' },
      person: { background: '#7c3aed', border: '#a78bfa' },
      project: { background: '#ea580c', border: '#fb923c' },
      technology: { background: '#e11d48', border: '#fb7185' },
      database: { background: '#c026d3', border: '#e879f9' },
      framework: { background: '#2563eb', border: '#60a5fa' },
      literal: { background: '#334155', border: '#64748b' },
      bnode: { background: '#475569', border: '#94a3b8' },
      default: { background: '#3b82f6', border: '#93c5fd' }
    };
  }

  /**
   * Get color definition for any group name (preset or dynamically generated HSL)
   */
  getColorForGroup(groupName) {
    if (!groupName) return this.groupColors.default;
    const lower = String(groupName).toLowerCase().replace(/[^a-z0-9]/g, '');

    // Check if groupName matches any preset palette keys
    for (const [key, val] of Object.entries(this.groupColors)) {
      if (lower.includes(key)) {
        return val;
      }
    }

    // Deterministic HSL color calculation for arbitrary Turtle classes
    let hash = 0;
    for (let i = 0; i < lower.length; i++) {
      hash = lower.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return {
      background: `hsl(${hue}, 65%, 45%)`,
      border: `hsl(${hue}, 80%, 65%)`
    };
  }

  /**
   * Initialize or update network graph
   */
  render(graphData) {
    const visNodes = graphData.nodes.map(n => {
      const colors = this.getColorForGroup(n.group);
      return {
        id: n.id,
        label: n.label,
        title: n.title,
        groupKey: n.group,
        shape: n.shape || 'dot',
        size: n.shape === 'box' ? 16 : 22,
        color: {
          background: colors.background,
          border: colors.border,
          highlight: {
            background: '#38bdf8',
            border: '#f0f9ff'
          },
          hover: {
            background: '#0ea5e9',
            border: '#e0f2fe'
          }
        },
        font: {
          color: '#f8fafc',
          size: 13,
          face: 'Inter, system-ui, -apple-system, sans-serif'
        },
        margin: 10,
        borderWidth: 2,
        shadow: true
      };
    });

    const visEdges = graphData.edges.map(e => ({
      id: e.id,
      from: e.from,
      to: e.to,
      label: e.label,
      title: e.title,
      arrows: { to: { enabled: true, scaleFactor: 0.8 } },
      font: { color: '#94a3b8', size: 10, align: 'middle' },
      color: { color: '#475569', highlight: '#38bdf8', hover: '#38bdf8' },
      smooth: { type: 'curvedCW', roundness: 0.2 }
    }));

    const data = {
      nodes: visNodes,
      edges: visEdges
    };

    const options = {
      nodes: {
        borderWidthSelected: 4
      },
      edges: {
        width: 1.5,
        selectionWidth: 3
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
        hideEdgesOnDrag: false,
        navigationButtons: true,
        keyboard: true
      },
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -50,
          centralGravity: 0.01,
          springLength: 100,
          springConstant: 0.08,
          damping: 0.4
        },
        stabilization: {
          enabled: true,
          iterations: 150,
          updateInterval: 25
        }
      }
    };

    if (this.network) {
      this.network.setData(data);
    } else {
      this.network = new Network(this.container, data, options);

      // Node selection listener
      this.network.on('selectNode', params => {
        const selectedNodeId = params.nodes[0];
        if (this.callbacks.onNodeSelect) {
          this.callbacks.onNodeSelect(selectedNodeId);
        }
      });

      // Edge selection listener
      this.network.on('selectEdge', params => {
        if (params.nodes.length === 0 && params.edges.length > 0) {
          const selectedEdgeId = params.edges[0];
          const edgeObj = visEdges.find(e => e.id === selectedEdgeId);
          if (edgeObj && this.callbacks.onEdgeSelect) {
            this.callbacks.onEdgeSelect(edgeObj);
          }
        }
      });

      // Deselect listener
      this.network.on('deselectNode', () => {
        if (this.callbacks.onDeselect) {
          this.callbacks.onDeselect();
        }
      });
    }

    this.network.fit();
  }

  /**
   * Reset graph viewport position & zoom
   */
  fitViewport() {
    if (this.network) {
      this.network.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
    }
  }

  /**
   * Toggle physics simulation
   */
  togglePhysics(enabled) {
    if (this.network) {
      this.network.setOptions({ physics: { enabled } });
    }
  }

  /**
   * Focus camera on node by URI / ID
   */
  focusNode(nodeId) {
    if (this.network && nodeId) {
      this.network.focus(nodeId, {
        scale: 1.2,
        animation: { duration: 600, easingFunction: 'easeInOutQuad' }
      });
      this.network.selectNodes([nodeId]);
    }
  }

  /**
   * Highlight and zoom to all nodes belonging to a specific group/class key
   */
  highlightGroup(groupKey) {
    if (!this.network) return;

    if (!groupKey) {
      this.network.selectNodes([]);
      this.fitViewport();
      return;
    }

    const allNodes = this.network.body.data.nodes.get();
    const matchingNodeIds = allNodes
      .filter(n => n.groupKey === groupKey || n.group === groupKey)
      .map(n => n.id);

    if (matchingNodeIds.length > 0) {
      this.network.selectNodes(matchingNodeIds);
      this.network.fit({
        nodes: matchingNodeIds,
        animation: { duration: 600, easingFunction: 'easeInOutQuad' }
      });
    }
  }
}
