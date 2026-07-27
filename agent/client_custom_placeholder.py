"""
Custom Client Agent Blueprint Placeholder (agent/client_custom_placeholder.py)

Use this file as a blueprint to connect your Onto Agent / Hermes Agent chat flow to:
1. Internal microservices or custom REST APIs.
2. Local open-source LLM servers (e.g. Ollama, vLLM, LM Studio, LocalAI).
3. Custom tools, RAG vector stores, or enterprise Knowledge Base search engines.

How to Use:
- Select "Custom API Endpoint (Blueprint)" in the model dropdown in the UI.
- Or set environment variable `CUSTOM_API_ENDPOINT=https://api.your-domain.com/v1/chat` in .env.
- Copy/rename this blueprint to `agent/client_custom.py` for custom edits.
"""

import os
import sys
import requests

def is_custom_handler_active(payload: dict) -> bool:
    """
    Determines whether a request should be intercepted and routed to a custom API.
    Triggers if the selected model starts with 'custom' or if CUSTOM_API_ENDPOINT is set.
    """
    model = payload.get("model", "").strip().lower()
    custom_env_set = bool(os.getenv("CUSTOM_API_ENDPOINT"))
    return model.startswith("custom") or custom_env_set

def handle_custom_api_request(payload: dict) -> dict:
    """
    Blueprint handler for custom API / endpoint execution.
    
    Args:
        payload (dict):
            - query (str): User chat question
            - turtle_content (str): Active RDF Turtle text
            - triples_summary (str): Graph summary statistics
            - model (str): Selected LLM model name
            - history (list): In-memory conversation history turns
            - use_hermes (bool): Hermes Engine toggle state
            
    Returns:
        dict: JSON response containing:
            - status (str): "success"
            - reply (str): Answer text (can include <thought>...</thought> blocks)
            - gateway (str): Custom Gateway label for UI display
            - model (str): Model name
    """
    user_query = payload.get("query", "").strip()
    turtle_content = payload.get("turtle_content", "")
    triples_summary = payload.get("triples_summary", "")
    model = payload.get("model", "custom-api")
    history = payload.get("history", [])
    use_hermes = payload.get("use_hermes", True)

    custom_endpoint = os.getenv("CUSTOM_API_ENDPOINT", "https://api.example.com/v1/agent/chat")
    custom_api_key = os.getenv("CUSTOM_API_KEY", os.getenv("OPENAI_API_KEY", ""))

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {custom_api_key}"
    }

    # Custom payload schema to dispatch to your external API or microservice
    request_body = {
        "prompt": user_query,
        "turtle_context": turtle_content[:6000],
        "graph_stats": triples_summary,
        "model": model,
        "history": history,
        "use_hermes_reasoning": use_hermes
    }

    try:
        # =========================================================================
        # REAL HTTP DISPATCH TEMPLATE (Uncomment when connecting to your live API):
        # =========================================================================
        # response = requests.post(custom_endpoint, json=request_body, headers=headers, timeout=30)
        # response.raise_for_status()
        # res_data = response.json()
        # reply_text = res_data.get("reply") or res_data.get("response") or res_data.get("choices", [{}])[0].get("message", {}).get("content")
        # =========================================================================

        # Blueprint Demonstration Response:
        thought_block = (
            "<thought>\n"
            f"[Custom Blueprint Hook Active]\n"
            f"- Intercepted user query: '{user_query}'\n"
            f"- Target custom endpoint: {custom_endpoint}\n"
            f"- Active triples in context: {triples_summary}\n"
            "</thought>\n\n"
        ) if use_hermes else ""

        reply_text = (
            f"{thought_block}"
            f"🔌 **Custom Endpoint Blueprint Activated**\n\n"
            f"Successfully intercepted query *\"{user_query}\"* using model **{model}**.\n\n"
            f"To connect to your live API, edit `handle_custom_api_request()` in `agent/client_custom_placeholder.py`!"
        )

        # Demonstration custom model name provided by external endpoint
        endpoint_returned_model = os.getenv("CUSTOM_MODEL_NAME", "llama-3.3-70b-custom")

        return {
            "status": "success",
            "gateway": "Custom API Endpoint Blueprint",
            "model": endpoint_returned_model,
            "reply": reply_text
        }

    except Exception as err:
        print(f"Custom API Error: {err}", file=sys.stderr)
        return {
            "status": "error",
            "error": f"Custom Endpoint Gateway Error: {str(err)}"
        }
