import { TurtleManager } from './turtleParser.js';
import { GraphRenderer } from './graphRenderer.js';
import { checkGatewayHealth as checkHealth, sendAgentQuery, saveApiKey } from '../agent/agentClient.js';
import { marked } from 'marked';

marked.setOptions({
  gfm: true,
  breaks: true
});

document.addEventListener('DOMContentLoaded', () => {
  const turtleManager = new TurtleManager();
  const graphContainer = document.getElementById('graph-canvas');

  // Inspector element references
  const inspectorPanel = document.getElementById('inspector-panel');
  const inspectorContent = document.getElementById('inspector-content');

  // Initialize Graph Renderer
  const graphRenderer = new GraphRenderer(graphContainer, {
    onNodeSelect: (nodeId) => {
      openInspectorForNode(nodeId);
    },
    onEdgeSelect: (edgeObj) => {
      openInspectorForEdge(edgeObj);
    },
    onDeselect: () => {
      // Optional: keep inspector active or clear
    }
  });

  // UI Element References
  const fileInput = document.getElementById('file-input');
  const uploadBtnTrigger = document.getElementById('btn-upload-trigger');
  const dropZone = document.getElementById('drop-zone');
  const fileListContainer = document.getElementById('file-list');
  const fileCountBadge = document.getElementById('file-count');
  const sampleSelect = document.getElementById('sample-select');
  const clearAllBtn = document.getElementById('btn-clear-all');
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('btn-clear-search');
  const predicateFilterInput = document.getElementById('predicate-filter');
  const layoutSelect = document.getElementById('layout-select');
  const physicsToggle = document.getElementById('physics-toggle');
  const fitBtn = document.getElementById('btn-fit');
  const closeInspectorBtn = document.getElementById('btn-close-inspector');
  const statNodes = document.getElementById('stat-nodes');
  const statTriples = document.getElementById('stat-triples');

  // API Key Modal Elements
  const keyConfigBtn = document.getElementById('btn-key-config');
  const keyStatusText = document.getElementById('key-status-text');
  const apiKeyModal = document.getElementById('api-key-modal');
  const apiKeyInput = document.getElementById('api-key-input');
  const saveKeyBtn = document.getElementById('btn-save-key-modal');
  const cancelKeyBtn = document.getElementById('btn-cancel-key-modal');
  const closeKeyModalBtn = document.getElementById('btn-close-key-modal');
  const keyModalMsg = document.getElementById('key-modal-msg');

  // AI Agent Elements
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const sendChatBtn = document.getElementById('btn-send-chat');
  const promptChipsContainer = document.getElementById('prompt-chips');
  const modelSelect = document.getElementById('model-select');
  const agentStatusIndicator = document.getElementById('agent-status-indicator');

  let currentHasApiKey = false;

  // Recommended Questions Pool (Max 2 displayed above chat input at bottom)
  const recommendationPool = [
    { label: "Summarize Ontology", prompt: "Summarize the structure of this ontology." },
    { label: "Who manages departments?", prompt: "Who manages each department?" },
    { label: "Projects & Tech Stack", prompt: "What projects are active and what technology stack do they use?" },
    { label: "Classes & Predicates", prompt: "List all RDF classes and relationship predicates in this graph." }
  ];
  let currentRecIndex = 0;

  function renderRecommendedChips() {
    if (!promptChipsContainer) return;
    promptChipsContainer.innerHTML = '';

    const recs = [
      recommendationPool[currentRecIndex],
      recommendationPool[(currentRecIndex + 1) % recommendationPool.length]
    ];

    recs.forEach(rec => {
      const btn = document.createElement('button');
      btn.className = 'chip';
      btn.textContent = rec.label;
      btn.title = rec.prompt;
      btn.addEventListener('click', () => {
        chatInput.value = rec.prompt;
        handleUserChatMessage();
      });
      promptChipsContainer.appendChild(btn);
    });
  }

  function rotateRecommendedChips() {
    currentRecIndex = (currentRecIndex + 2) % recommendationPool.length;
    renderRecommendedChips();
  }

  renderRecommendedChips();

  // Check Gateway Health & Model Status
  async function updateGatewayStatus() {
    const selectedModel = modelSelect ? modelSelect.value : 'gpt-4o';
    const status = await checkHealth(selectedModel);
    currentHasApiKey = status.hasApiKey;

    if (agentStatusIndicator) {
      agentStatusIndicator.textContent = status.text;
      agentStatusIndicator.style.color = status.healthy ? 'var(--primary-light)' : 'var(--danger)';
    }

    if (keyConfigBtn && keyStatusText) {
      if (status.hasApiKey) {
        keyConfigBtn.classList.remove('missing');
        keyStatusText.textContent = 'API Key Configured';
      } else {
        keyConfigBtn.classList.add('missing');
        keyStatusText.textContent = '🔑 Connect OpenAI API';
      }
    }
  }

  updateGatewayStatus();

  if (modelSelect) {
    modelSelect.addEventListener('change', () => {
      updateGatewayStatus();
    });
  }

  if (keyConfigBtn) {
    keyConfigBtn.addEventListener('click', () => {
      openKeyModal();
    });
  }

  function openKeyModal() {
    if (apiKeyModal) {
      apiKeyInput.value = '';
      keyModalMsg.style.display = 'none';
      apiKeyModal.showModal();
    }
  }

  function closeKeyModal() {
    if (apiKeyModal) {
      apiKeyModal.close();
    }
  }

  if (cancelKeyBtn) cancelKeyBtn.addEventListener('click', closeKeyModal);
  if (closeKeyModalBtn) closeKeyModalBtn.addEventListener('click', closeKeyModal);

  if (saveKeyBtn) {
    saveKeyBtn.addEventListener('click', async () => {
      const keyVal = apiKeyInput.value.trim();
      if (!keyVal) {
        keyModalMsg.style.display = 'block';
        keyModalMsg.style.color = 'var(--danger)';
        keyModalMsg.textContent = 'Please enter a valid API Key.';
        return;
      }

      saveKeyBtn.textContent = 'Saving...';
      const result = await saveApiKey(keyVal);
      saveKeyBtn.textContent = 'Save API Key';

      if (result.success) {
        keyModalMsg.style.display = 'block';
        keyModalMsg.style.color = 'var(--primary-light)';
        keyModalMsg.textContent = result.message;
        setTimeout(() => {
          closeKeyModal();
          updateGatewayStatus();
        }, 800);
      } else {
        keyModalMsg.style.display = 'block';
        keyModalMsg.style.color = 'var(--danger)';
        keyModalMsg.textContent = result.error;
      }
    });
  }

  // Event Listeners
  uploadBtnTrigger.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);

  // Drag & Drop
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      processFileList(e.dataTransfer.files);
    }
  });

  // Controls
  sampleSelect.addEventListener('change', handleSampleSelect);
  clearAllBtn.addEventListener('click', () => {
    turtleManager.clearAll();
    sampleSelect.value = '';
    updateUI();
  });

  searchInput.addEventListener('input', () => {
    clearSearchBtn.style.display = searchInput.value ? 'block' : 'none';
    refreshGraph();
  });
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    refreshGraph();
  });

  predicateFilterInput.addEventListener('input', () => refreshGraph());

  if (layoutSelect) {
    layoutSelect.addEventListener('change', (e) => {
      graphRenderer.setLayoutMode(e.target.value);
    });
  }

  physicsToggle.addEventListener('change', (e) => {
    graphRenderer.togglePhysics(e.target.checked);
  });

  fitBtn.addEventListener('click', () => graphRenderer.fitViewport());
  
  if (closeInspectorBtn) {
    closeInspectorBtn.addEventListener('click', () => {
      resetInspector();
    });
  }

  // AI Agent Event Handlers
  sendChatBtn.addEventListener('click', handleUserChatMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserChatMessage();
    }
  });

  /**
   * Handle File Selection via File Picker
   */
  async function handleFileSelect(e) {
    if (e.target.files.length > 0) {
      await processFileList(e.target.files);
      fileInput.value = '';
    }
  }

  /**
   * Process a list of File objects
   */
  async function processFileList(files) {
    for (const file of Array.from(files)) {
      try {
        const text = await file.text();
        const id = file.name;
        await turtleManager.addFile(id, file.name, text);
      } catch (err) {
        alert(`Failed to parse ${file.name}: ${err.message}`);
      }
    }
    updateUI();
  }

  /**
   * Handle Loading Sample Ontologies
   */
  async function handleSampleSelect(e) {
    const val = e.target.value;
    if (!val) return;

    turtleManager.clearAll();

    try {
      if (val === 'single_org' || val === 'multi_both') {
        const resp1 = await fetch('/samples/sample_org.ttl');
        const text1 = await resp1.text();
        await turtleManager.addFile('sample_org.ttl', 'sample_org.ttl', text1);
      }

      if (val === 'single_tech' || val === 'multi_both') {
        const resp2 = await fetch('/samples/sample_tech.ttl');
        const text2 = await resp2.text();
        await turtleManager.addFile('sample_tech.ttl', 'sample_tech.ttl', text2);
      }
    } catch (err) {
      console.error('Error fetching sample Turtle files:', err);
    }

    updateUI();
  }

  /**
   * Re-render File List, Stats, and Graph
   */
  function updateUI() {
    renderFileList();
    refreshGraph();
  }

  /**
   * Render Sidebar File List with checkboxes and delete buttons
   */
  function renderFileList() {
    fileCountBadge.textContent = turtleManager.files.size;
    fileListContainer.innerHTML = '';

    if (turtleManager.files.size === 0) {
      fileListContainer.innerHTML = `<div class="empty-state">No Turtle files loaded yet. Upload files or select a sample preset.</div>`;
      return;
    }

    turtleManager.files.forEach((file, id) => {
      const item = document.createElement('div');
      item.className = 'file-item';

      const isActive = turtleManager.activeFileIds.has(id);

      item.innerHTML = `
        <div class="file-item-left">
          <input type="checkbox" ${isActive ? 'checked' : ''} data-file-id="${id}" />
          <span class="file-name" title="${file.name}">${file.name}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span class="file-quads">${file.quadCount} triples</span>
          <button class="text-btn danger btn-delete-file" data-file-id="${id}">×</button>
        </div>
      `;

      // Checkbox event
      const cb = item.querySelector('input[type="checkbox"]');
      cb.addEventListener('change', (evt) => {
        turtleManager.toggleFileActive(id, evt.target.checked);
        refreshGraph();
      });

      // Delete event
      const delBtn = item.querySelector('.btn-delete-file');
      delBtn.addEventListener('click', () => {
        turtleManager.removeFile(id);
        updateUI();
      });

      fileListContainer.appendChild(item);
    });
  }

  const legendItemsContainer = document.getElementById('legend-items');
  let activeLegendFilter = null;

  /**
   * Fetch current graph data & update Vis-Network graph and dynamic ontology legend
   */
  function refreshGraph() {
    const filters = {
      search: searchInput.value,
      predicate: predicateFilterInput.value
    };

    const graphData = turtleManager.getGraphData(filters);
    graphRenderer.render(graphData);

    statNodes.textContent = `${graphData.nodes.length} Nodes`;
    statTriples.textContent = `${graphData.tripleCount} Triples`;

    renderLegend(graphData.nodes);

    if (activeLegendFilter) {
      graphRenderer.highlightGroup(activeLegendFilter);
    }
  }

  /**
   * Render dynamic Ontology Legend with shape indicators and interactive canvas filtering
   */
  function renderLegend(nodes) {
    if (!legendItemsContainer) return;
    const legendItems = turtleManager.getLegendItems(nodes);

    if (legendItems.length === 0) {
      legendItemsContainer.innerHTML = `<div class="empty-state">No RDF classes loaded</div>`;
      activeLegendFilter = null;
      return;
    }

    legendItemsContainer.innerHTML = '';

    legendItems.forEach(item => {
      const colorDef = graphRenderer.getColorForGroup(item.groupKey);
      const isActive = activeLegendFilter === item.groupKey;

      const itemEl = document.createElement('div');
      itemEl.className = `legend-item ${isActive ? 'active' : ''}`;
      itemEl.title = `Click to filter/highlight ${escapeHtml(item.label)} (${item.count} instances)`;
      
      itemEl.innerHTML = `
        <i class="shape-icon shape-${item.shape || 'dot'}" style="background: ${colorDef.background}; border: 1px solid ${colorDef.border}"></i>
        <span class="legend-label">${escapeHtml(item.label)}</span>
        <span class="legend-count">${item.count}</span>
      `;

      itemEl.addEventListener('click', () => {
        if (activeLegendFilter === item.groupKey) {
          activeLegendFilter = null;
          graphRenderer.highlightGroup(null);
        } else {
          activeLegendFilter = item.groupKey;
          graphRenderer.highlightGroup(item.groupKey);
        }
        renderLegend(nodes);
      });

      legendItemsContainer.appendChild(itemEl);
    });
  }

  /**
   * Reset Left Entity Inspector
   */
  function resetInspector() {
    inspectorContent.innerHTML = `
      <div class="empty-inspector">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        <p>Click any node or edge on the canvas to inspect RDF statements on the left.</p>
      </div>
    `;
  }

  /**
   * Update Left Inspector Panel for selected Node
   */
  function openInspectorForNode(nodeId) {
    const details = turtleManager.getNodeDetails(nodeId);
    if (!details) return;

    let outgoingHtml = details.outgoing.map(st => `
      <div class="statement-item">
        <div class="statement-pred">${st.predicate}</div>
        <div class="statement-val">➔ ${escapeHtml(st.object)}</div>
      </div>
    `).join('');

    let incomingHtml = details.incoming.map(st => `
      <div class="statement-item">
        <div class="statement-pred">${st.predicate}</div>
        <div class="statement-val">⬅ from ${escapeHtml(st.subject)}</div>
      </div>
    `).join('');

    inspectorContent.innerHTML = `
      <div class="inspector-card">
        <div class="inspector-title-badge">
          <div class="compact-name">${escapeHtml(details.label)}</div>
          <div class="full-uri">${escapeHtml(details.uri)}</div>
        </div>

        <div class="statement-section">
          <h4>Outgoing (${details.outgoing.length})</h4>
          <div class="statement-list">
            ${outgoingHtml || '<div class="empty-state">No outgoing edges</div>'}
          </div>
        </div>

        <div class="statement-section">
          <h4>Incoming (${details.incoming.length})</h4>
          <div class="statement-list">
            ${incomingHtml || '<div class="empty-state">No incoming edges</div>'}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Update Left Inspector Panel for selected Edge
   */
  function openInspectorForEdge(edgeObj) {
    const subjComp = turtleManager.compactUri(edgeObj.subjectUri);
    const objComp = turtleManager.compactUri(edgeObj.objectUri);

    inspectorContent.innerHTML = `
      <div class="inspector-card">
        <div class="inspector-title-badge">
          <div class="compact-name">${escapeHtml(edgeObj.label)}</div>
          <div class="full-uri">${escapeHtml(edgeObj.predicateUri)}</div>
        </div>

        <div class="statement-section">
          <h4>Statement Details</h4>
          <div class="statement-list">
            <div class="statement-item">
              <div class="statement-pred">Subject</div>
              <div class="statement-val">${escapeHtml(subjComp)}</div>
            </div>
            <div class="statement-item">
              <div class="statement-pred">Predicate</div>
              <div class="statement-val">${escapeHtml(edgeObj.label)}</div>
            </div>
            <div class="statement-item">
              <div class="statement-pred">Object</div>
              <div class="statement-val">${escapeHtml(objComp)}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Handle Yoda AI Chat Submission
   */
  async function handleUserChatMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    if (!currentHasApiKey) {
      openKeyModal();
      keyModalMsg.style.display = 'block';
      keyModalMsg.style.color = 'var(--danger)';
      keyModalMsg.textContent = 'Please enter your OpenAI API key to start chatting.';
      return;
    }

    // Append user message to UI & rotate recommended chips
    appendChatMessage('user', text);
    chatInput.value = '';
    rotateRecommendedChips();

    // Extract active Turtle content & triples summary
    let combinedTurtleText = '';
    turtleManager.activeFileIds.forEach(id => {
      const file = turtleManager.files.get(id);
      if (file) {
        combinedTurtleText += `# --- File: ${file.name} ---\n` + file.content + '\n\n';
      }
    });

    const graphData = turtleManager.getGraphData();
    const triplesSummary = `Active Files: ${turtleManager.activeFileIds.size}, Nodes: ${graphData.nodes.length}, Triples: ${graphData.tripleCount}`;
    const selectedModel = modelSelect ? modelSelect.value : 'gpt-4o';

    // Create temporary Assistant response element
    const assistantMsgEl = appendChatMessage('assistant', 'Consulting the Force...');
    const msgTextEl = assistantMsgEl.querySelector('.msg-text');

    const result = await sendAgentQuery({
      query: text,
      model: selectedModel,
      turtleContent: combinedTurtleText,
      triplesSummary: triplesSummary
    });

    if (result.success) {
      msgTextEl.innerHTML = formatAgentResponse(result.reply);
      if (agentStatusIndicator) {
        agentStatusIndicator.textContent = `Connected to ${result.gateway} (${result.model})`;
        agentStatusIndicator.style.color = 'var(--primary-light)';
      }
    } else {
      msgTextEl.innerHTML = formatAgentResponse(`⚠️ **${result.error}**`);
    }

    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  /**
   * Format Onto Agent response with <thought> blocks and Markdown
   */
  function formatAgentResponse(text) {
    if (!text) return '';
    let processed = text.replace(/<thought>([\s\S]*?)<\/thought>/gi, (match, thoughtBody) => {
      return `<details class="agent-thought-block" open><summary>🧠 Onto Agent Reasoning</summary><div class="thought-content">${escapeHtml(thoughtBody.trim())}</div></details>`;
    });
    return marked.parse(processed);
  }

  /**
   * Append Chat Message to UI container
   */
  function appendChatMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${role}`;

    const author = role === 'user' ? 'You' : (role === 'system' ? 'Onto Agent' : 'Onto Agent');
    const content = (role === 'assistant' || role === 'system') ? formatAgentResponse(text) : escapeHtml(text);

    msgDiv.innerHTML = `
      <div class="msg-author">${escapeHtml(author)}</div>
      <div class="msg-text markdown-body">${content}</div>
    `;

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msgDiv;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Load initial preset sample on startup
  sampleSelect.value = 'multi_both';
  handleSampleSelect({ target: { value: 'multi_both' } });
});

