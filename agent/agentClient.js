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
    if (data.status === 'healthy') {
      return {
        healthy: true,
        hasApiKey: Boolean(data.has_api_key),
        gateway: data.gateway || 'Onto Agent Gateway',
        model: selectedModel,
        text: `Connected to ${data.gateway || 'Onto Agent Gateway'} (${selectedModel})`
      };
    }
    return { healthy: false, hasApiKey: false, text: `Gateway reported unhealthy status` };
  } catch (err) {
    return {
      healthy: false,
      hasApiKey: false,
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
 * Send user query & active Turtle context to Yoda AI Gateway
 */
export async function sendAgentQuery({ query, model = 'gpt-4o', turtleContent = '', triplesSummary = '' }) {
  const payload = JSON.stringify({
    query,
    model,
    turtle_content: turtleContent,
    triples_summary: triplesSummary
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

    const resData = await response.json();

    if (response.ok && resData.reply) {
      return {
        success: true,
        reply: resData.reply,
        gateway: resData.gateway || 'Yoda AI Gateway',
        model: resData.model || model
      };
    } else {
      return {
        success: false,
        error: resData.error || 'Server returned an error.'
      };
    }
  } catch (err) {
    return {
      success: false,
      error: `Gateway Connection Failed (${err.message}). Please verify python3 agent/client.py is running on port 8000.`
    };
  }
}
