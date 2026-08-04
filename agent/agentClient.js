/**
 * Agent Client Module
 * Manages health checks and chat query dispatching to the Python LLM Gateway (agent/client.py).
 */

/**
 * Check the status of the Yoda AI Gateway server
 */
export async function checkGatewayHealth(selectedModel = 'gpt-4o') {
  try {
    let res;
    try {
      res = await fetch('http://localhost:8000/api/health');
    } catch (e1) {
      res = await fetch('/api/health');
    }
    const data = await res.json();
    const isCustomModel = selectedModel.startsWith('custom');
    if (data.status === 'healthy') {
      return {
        healthy: true,
        isCustomModel: isCustomModel,
        hasApiKey: isCustomModel ? true : Boolean(data.has_api_key),
        gateway: data.gateway || 'Onto Agent Gateway',
        model: selectedModel,
        text: isCustomModel ? `Connected to Custom API Endpoint` : `Connected to ${data.gateway || 'Onto Agent Gateway'} (${selectedModel})`
      };
    }
    return { healthy: false, hasApiKey: false, isCustomModel, text: `Gateway reported unhealthy status` };
  } catch (err) {
    const isCustomModel = selectedModel.startsWith('custom');
    return {
      healthy: false,
      hasApiKey: isCustomModel ? true : false,
      isCustomModel,
      text: `Offline: python3 agent/client.py on port 8000 (${selectedModel})`
    };
  }
}

/**
 * Configure or update OpenAI API Key at runtime
 */
export async function saveApiKey(apiKey) {
  const payload = JSON.stringify({ api_key: apiKey });
  let response;
  try {
    try {
      response = await fetch('http://localhost:8000/api/set-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });
    } catch (err1) {
      response = await fetch('/api/set-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });
    }

    const resData = await response.json();
    if (response.ok && resData.status === 'success') {
      return { success: true, message: resData.message };
    }
    return { success: false, error: resData.error || 'Failed to update API key.' };
  } catch (err) {
    return { success: false, error: `Connection failed: ${err.message}` };
  }
}

/**
 * Send user query & active Turtle context to Onto AI Gateway
 */
export async function sendAgentQuery({ query, model = 'gpt-4o', turtleContent = '', triplesSummary = '', useHermesAgent = true, history = [] }) {
  const startTime = performance.now();
  const payload = JSON.stringify({
    query,
    model,
    turtle_content: turtleContent,
    triples_summary: triplesSummary,
    use_hermes: useHermesAgent,
    history: history
  });

  let response;
  try {
    try {
      response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });
    } catch (err1) {
      response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });
    }

    const clientLatency = Math.round(performance.now() - startTime);
    const resData = await response.json();

    if (response.ok && resData.reply) {
      const promptToks = resData.tokens?.prompt ?? Math.max(1, Math.floor((query.length + turtleContent.length) / 4));
      const compToks = resData.tokens?.completion ?? Math.max(1, Math.floor(resData.reply.length / 4));
      const totalToks = resData.tokens?.total ?? (promptToks + compToks);

      return {
        success: true,
        reply: resData.reply,
        gateway: resData.gateway || 'Yoda AI Gateway',
        model: resData.model || model,
        tokens: {
          prompt: promptToks,
          completion: compToks,
          total: totalToks
        },
        latency_ms: resData.latency_ms || clientLatency
      };
    } else {
      return {
        success: false,
        error: resData.error || 'Server returned an error.',
        latency_ms: clientLatency
      };
    }
  } catch (err) {
    const clientLatency = Math.round(performance.now() - startTime);
    return {
      success: false,
      error: `Gateway Connection Failed (${err.message}). Please verify python3 agent/client.py is running on port 8000.`,
      latency_ms: clientLatency
    };
  }
}
