import os
import sys
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from root .env
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Retrieve API Keys
openai_api_key = os.getenv("OPENAI_API_KEY") or os.getenv("open_ai")
openrouter_api_key = os.getenv("OPENROUTER_API_KEY")

api_key = openrouter_api_key or openai_api_key

if not api_key:
    print(f"Warning: API Key not found in {env_path}! Ensure 'OPENAI_API_KEY', 'open_ai', or 'OPENROUTER_API_KEY' is set.", file=sys.stderr)
else:
    print("✓ Hermes AI Gateway initialized successfully.")

# Initialize Client (Support OpenRouter or OpenAI)
base_url = "https://openrouter.ai/api/v1" if openrouter_api_key else None
openai_client = OpenAI(api_key=api_key, base_url=base_url) if api_key else None

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "gateway": "Onto Agent Gateway",
        "has_api_key": bool(api_key),
        "model": "gpt-4o"
    })

@app.route("/api/set-key", methods=["POST"])
def set_api_key():
    global api_key, openai_client
    data = request.get_json() or {}
    new_key = data.get("api_key", "").strip()

    if not new_key:
        return jsonify({"error": "No API Key provided."}), 400

    api_key = new_key
    base_url = "https://openrouter.ai/api/v1" if os.getenv("OPENROUTER_API_KEY") else None
    openai_client = OpenAI(api_key=api_key, base_url=base_url)

    # Persist to .env if present or create
    try:
        if env_path.exists():
            content = env_path.read_text()
            if "OPENAI_API_KEY=" in content:
                lines = [f"OPENAI_API_KEY={new_key}" if l.startswith("OPENAI_API_KEY=") else l for l in content.splitlines()]
                env_path.write_text("\n".join(lines))
            elif "open_ai=" in content:
                lines = [f"open_ai={new_key}" if l.startswith("open_ai=") else l for l in content.splitlines()]
                env_path.write_text("\n".join(lines))
            else:
                env_path.write_text(content.strip() + f"\nOPENAI_API_KEY={new_key}\n")
        else:
            env_path.write_text(f"OPENAI_API_KEY={new_key}\n")
    except Exception as e:
        print(f"Notice: Could not persist key to .env file: {e}", file=sys.stderr)

    return jsonify({
        "status": "success",
        "has_api_key": True,
        "message": "OpenAI API Key configured successfully!"
    })

@app.route("/api/chat", methods=["POST"])
def chat_gateway():
    if not openai_client:
        return jsonify({
            "error": "API Key is missing. Please check your .env configuration."
        }), 500

    data = request.get_json() or {}
    user_query = data.get("query", "").strip()
    turtle_content = data.get("turtle_content", "").strip()
    triples_summary = data.get("triples_summary", "")
    requested_model = data.get("model", "gpt-4o").strip()

    if not user_query:
        return jsonify({"error": "No query provided."}), 400

    # Advanced Hermes Agent System Prompt with <thought> reasoning loop
    system_prompt = (
        "You are Hermes Agent, an advanced AI Knowledge Graph Reasoning Agent inspired by Nous Hermes. "
        "Your task is to analyze RDF Turtle (.ttl) ontologies, perform step-by-step entity and relationship traversal, "
        "and synthesize insightful answers.\n\n"
        "Instructions:\n"
        "1. First, outline your step-by-step reasoning inside <thought>...</thought> tags. Analyze subjects, predicates, objects, and ontology rules.\n"
        "2. Follow with your comprehensive, structured answer formatted in GitHub-flavored Markdown.\n"
        "3. Highlight key classes, properties, and entity relationships clearly with tables and code blocks where helpful."
    )

    user_prompt = f"""User Query:
{user_query}

Active Turtle RDF Context:
```turtle
{turtle_content[:8000] if turtle_content else 'No active Turtle content provided.'}
```

Graph Summary Stats:
{triples_summary if triples_summary else 'N/A'}
"""

    try:
        response = openai_client.chat.completions.create(
            model=requested_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.2,
            max_tokens=1200
        )

        reply_content = response.choices[0].message.content
        return jsonify({
            "status": "success",
            "gateway": "Onto Agent Gateway",
            "model": requested_model,
            "reply": reply_content
        })

    except Exception as e:
        print(f"Error calling LLM API: {e}", file=sys.stderr)
        return jsonify({"error": f"Hermes Gateway Error: {str(e)}"}), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"🚀 Hermes AI Gateway Server running at http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
