import * as N3 from 'n3';

const { Parser, Store, DataFactory } = N3;
const { namedNode, literal, defaultGraph, quad } = DataFactory;

/**
 * Turtle File Data Store Manager
 * Manages multiple loaded Turtle files, their namespaces, and combined RDF quads.
 */
export class TurtleManager {
  constructor() {
    this.files = new Map(); // id -> { name, content, quadCount, prefixes }
    this.combinedStore = new Store();
    this.prefixes = {
      rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      owl: 'http://www.w3.org/2002/07/owl#',
      xsd: 'http://www.w3.org/2001/XMLSchema#'
    };
    this.activeFileIds = new Set();
  }

  /**
   * Add or replace a Turtle file in the store
   * @param {string} id - Unique identifier (e.g. filename)
   * @param {string} name - Display name
   * @param {string} content - Raw Turtle string
   */
  async addFile(id, name, content) {
    return new Promise((resolve, reject) => {
      const parser = new Parser();
      const quads = [];
      let filePrefixes = {};

      parser.parse(content, (error, quad, prefixes) => {
        if (error) {
          reject(new Error(`Parsing error in ${name}: ${error.message}`));
          return;
        }

        if (prefixes) {
          Object.assign(filePrefixes, prefixes);
          Object.assign(this.prefixes, prefixes);
        }

        if (quad) {
          quads.push(quad);
        } else {
          // Parsing complete
          this.files.set(id, {
            id,
            name,
            content,
            quads,
            quadCount: quads.length,
            prefixes: filePrefixes
          });
          this.activeFileIds.add(id);
          this.rebuildCombinedStore();
          resolve(this.files.get(id));
        }
      });
    });
  }

  /**
   * Remove a file from the manager
   */
  removeFile(id) {
    this.files.delete(id);
    this.activeFileIds.delete(id);
    this.rebuildCombinedStore();
  }

  /**
   * Toggle active state of a file for graph inclusion
   */
  toggleFileActive(id, active) {
    if (active) {
      this.activeFileIds.add(id);
    } else {
      this.activeFileIds.delete(id);
    }
    this.rebuildCombinedStore();
  }

  /**
   * Clear all loaded files
   */
  clearAll() {
    this.files.clear();
    this.activeFileIds.clear();
    this.combinedStore = new Store();
  }

  /**
   * Rebuild the N3 Store combining all active files
   */
  rebuildCombinedStore() {
    this.combinedStore = new Store();
    for (const id of this.activeFileIds) {
      const file = this.files.get(id);
      if (file && file.quads) {
        this.combinedStore.addQuads(file.quads);
      }
    }
  }

  /**
   * Compact a full URI string using known prefixes
   * e.g., "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" -> "rdf:type"
   */
  compactUri(uri) {
    if (!uri) return '';
    for (const [prefix, ns] of Object.entries(this.prefixes)) {
      if (uri.startsWith(ns)) {
        const local = uri.slice(ns.length);
        return `${prefix}:${local}`;
      }
    }
    // Fallback: strip hash or slash for label if unknown namespace
    if (uri.includes('#')) return uri.split('#').pop();
    if (uri.includes('/') && !uri.endsWith('/')) return uri.split('/').pop();
    return uri;
  }

  /**
   * Extract human-readable label for a node
   */
  getNodeLabel(nodeTerm, store = this.combinedStore) {
    if (nodeTerm.termType === 'Literal') {
      const val = nodeTerm.value;
      return val.length > 30 ? val.substring(0, 27) + '...' : val;
    }
    if (nodeTerm.termType === 'BlankNode') {
      return `_:${nodeTerm.value}`;
    }

    // Try rdfs:label or org:label or name
    const rdfsLabel = 'http://www.w3.org/2000/01/rdf-schema#label';
    const labels = store.getQuads(nodeTerm, namedNode(rdfsLabel), null, null);
    if (labels.length > 0 && labels[0].object.value) {
      return labels[0].object.value;
    }

    return this.compactUri(nodeTerm.value);
  }

  /**
   * Convert current store into Vis-Network format (nodes & edges)
   */
  getGraphData(filters = {}) {
    const nodesMap = new Map();
    const edges = [];

    const quads = this.combinedStore.getQuads(null, null, null, null);

    quads.forEach((q, index) => {
      const subj = q.subject;
      const pred = q.predicate;
      const obj = q.object;

      const predCompact = this.compactUri(pred.value);

      // Apply predicate filter if provided
      if (filters.predicate && !predCompact.toLowerCase().includes(filters.predicate.toLowerCase())) {
        return;
      }

      // Ensure Subject Node
      if (!nodesMap.has(subj.value)) {
        nodesMap.set(subj.value, {
          id: subj.value,
          label: this.getNodeLabel(subj),
          title: subj.value,
          termType: subj.termType,
          shape: subj.termType === 'BlankNode' ? 'diamond' : 'dot',
          group: this.getNodeGroup(subj)
        });
      }

      // Ensure Object Node
      if (!nodesMap.has(obj.value)) {
        const isLiteral = obj.termType === 'Literal';
        nodesMap.set(obj.value, {
          id: obj.value,
          label: this.getNodeLabel(obj),
          title: isLiteral ? `Literal: "${obj.value}"` : obj.value,
          termType: obj.termType,
          shape: isLiteral ? 'box' : (obj.termType === 'BlankNode' ? 'diamond' : 'dot'),
          group: isLiteral ? 'literal' : this.getNodeGroup(obj)
        });
      }

      // Add Edge
      edges.push({
        id: `e_${index}_${subj.value}_${obj.value}`,
        from: subj.value,
        to: obj.value,
        label: predCompact,
        title: `${predCompact}\n(${pred.value})`,
        arrows: 'to',
        font: { align: 'middle', size: 10, fill: '#cbd5e1' },
        color: { color: '#64748b', highlight: '#38bdf8', hover: '#38bdf8' },
        predicateUri: pred.value,
        subjectUri: subj.value,
        objectUri: obj.value
      });
    });

    // Apply class/search filters
    let nodesArray = Array.from(nodesMap.values());
    if (filters.search) {
      const qLower = filters.search.toLowerCase();
      const matchingNodeIds = new Set(
        nodesArray
          .filter(n => n.label.toLowerCase().includes(qLower) || n.id.toLowerCase().includes(qLower))
          .map(n => n.id)
      );

      // Keep matching nodes and immediate neighbors
      const connectedNodeIds = new Set(matchingNodeIds);
      edges.forEach(e => {
        if (matchingNodeIds.has(e.from)) connectedNodeIds.add(e.to);
        if (matchingNodeIds.has(e.to)) connectedNodeIds.add(e.from);
      });

      nodesArray = nodesArray.filter(n => connectedNodeIds.has(n.id));
    }

    return {
      nodes: nodesArray,
      edges: edges,
      fileCount: this.activeFileIds.size,
      tripleCount: quads.length
    };
  }

  /**
   * Classify node into group for distinct visual styling
   */
  getNodeGroup(term) {
    if (term.termType === 'Literal') return 'literal';
    if (term.termType === 'BlankNode') return 'bnode';

    // Check type in store
    const rdfType = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
    const typeQuads = this.combinedStore.getQuads(term, namedNode(rdfType), null, null);
    if (typeQuads.length > 0) {
      const typeUri = typeQuads[0].object.value;
      const compactType = this.compactUri(typeUri);
      return compactType.split(':').pop().toLowerCase();
    }

    // Default by namespace
    const compact = this.compactUri(term.value);
    if (compact.includes(':')) {
      return compact.split(':')[0];
    }
    return 'default';
  }

  /**
   * Get all statements associated with a specific subject or object URI
   */
  getNodeDetails(uri) {
    if (!uri) return null;
    const term = uri.startsWith('_:') ? DataFactory.blankNode(uri.slice(2)) : DataFactory.namedNode(uri);
    
    // Also handle literal value search
    const subjectQuads = this.combinedStore.getQuads(term, null, null, null);
    const objectQuads = this.combinedStore.getQuads(null, null, term, null);

    const outgoing = subjectQuads.map(q => ({
      predicate: this.compactUri(q.predicate.value),
      predicateUri: q.predicate.value,
      object: this.getNodeLabel(q.object),
      objectUri: q.object.value,
      objectType: q.object.termType
    }));

    const incoming = objectQuads.map(q => ({
      subject: this.getNodeLabel(q.subject),
      subjectUri: q.subject.value,
      predicate: this.compactUri(q.predicate.value),
      predicateUri: q.predicate.value
    }));

    return {
      uri,
      compactUri: this.compactUri(uri),
      label: this.getNodeLabel(term),
      outgoing,
      incoming,
      totalStatements: outgoing.length + incoming.length
    };
  }
}
