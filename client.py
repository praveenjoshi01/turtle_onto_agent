import os
import sys
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from .env
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# Retrieve OpenAI API Key supporting both open_ai and OPENAI_API_KEY keys
api_key = os.getenv("OPENAI_API_KEY") or os.getenv("open_ai")

if not api_key:
    print("Warning: OpenAI API Key not found in .env file! Ensure 'open_ai' or 'OPENAI_API_KEY' is set.", file=sys.stderr)
else:
    print("✓ OpenAI API Gateway initialized successfully.")

# Initialize OpenAI Client
openai_client = OpenAI(api_key=api_key) if api_key else None

app = Flask(__name__)
CORS(app)

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "gateway": "Hermes AI Gateway",
        "has_api_key": bool(api_key),
        "model": "gpt-4o"
    })

@app.route("/api/chat", methods=["POST"])
def chat_gateway():
    if not openai_client:
        return jsonify({
            "error": "OpenAI API Key is missing. Please check your .env configuration."
        }), 500

    data = request.get_json() or {}
    user_query = data.get("query", "").strip()
    turtle_content = data.get("turtle_content", "").strip()
    triples_summary = data.get("triples_summary", "")

    if not user_query:
        return jsonify({"error": "No query provided."}), 400

    # Build prompt context for gpt-4o
    system_prompt = (
        "You are Hermes, an expert AI Ontology & Knowledge Graph Assistant. "
        "Your task is to analyze the provided RDF Turtle (.ttl) ontologies and graph data "
        "and answer the user's query accurately, clearly, and concisely. "
        "Highlight entities, relationships, classes, and properties. "
        "Format your answer cleanly in GitHub-flavored Markdown."
    )

    user_prompt = f"""User Question:
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
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.2,
            max_tokens=1000
        )

        reply_content = response.choices[0].message.content
        return jsonify({
            "status": "success",
            "reply": reply_content
        })

    except Exception as e:
        print(f"Error calling OpenAI API: {e}", file=sys.stderr)
        return jsonify({"error": f"LLM Gateway Error: {str(e)}"}), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"🚀 LLM Gateway Server running at http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
