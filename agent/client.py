import os
import sys
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Add hermes_agent repository to Python sys.path
hermes_path = Path(__file__).parent / "hermes_agent"
if hermes_path.exists():
    sys.path.insert(0, str(hermes_path.resolve()))

# Load environment variables from root .env
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Retrieve API Keys
openai_api_key = os.getenv("OPENAI_API_KEY") or os.getenv("open_ai")
openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
api_key = openrouter_api_key or openai_api_key

if api_key:
    os.environ["OPENAI_API_KEY"] = api_key
    if openrouter_api_key:
        os.environ["OPENROUTER_API_KEY"] = openrouter_api_key

try:
    from run_agent import AIAgent
    hermes_agent_available = True
    print("✓ Official Nous Research Hermes Agent (AIAgent) initialized successfully.")
except Exception as exc:
    hermes_agent_available = False
    print(f"Notice: hermes_agent runner import fallback: {exc}", file=sys.stderr)

if not api_key:
    print(f"Warning: API Key not found in {env_path}! Ensure 'OPENAI_API_KEY', 'open_ai', or 'OPENROUTER_API_KEY' is set.", file=sys.stderr)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "gateway": "Onto Agent Gateway (Nous Hermes Framework)",
        "has_api_key": bool(api_key),
        "model": "gpt-4o",
        "hermes_framework": hermes_agent_available
    })

@app.route("/api/set-key", methods=["POST"])
def set_api_key():
    global api_key
    data = request.get_json() or {}
    new_key = data.get("api_key", "").strip()

    if not new_key:
        return jsonify({"error": "No API Key provided."}), 400

    api_key = new_key
    os.environ["OPENAI_API_KEY"] = new_key
    if new_key.startswith("sk-or-"):
        os.environ["OPENROUTER_API_KEY"] = new_key

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
        "message": "API Key configured successfully for Nous Hermes Agent framework!"
    })

@app.route("/api/chat", methods=["POST"])
def chat_gateway():
    if not api_key:
        return jsonify({
            "error": "API Key is missing. Please check your .env configuration or set it in the header menu."
        }), 500

    data = request.get_json() or {}
    user_query = data.get("query", "").strip()
    turtle_content = data.get("turtle_content", "").strip()
    triples_summary = data.get("triples_summary", "")
    requested_model = data.get("model", "gpt-4o").strip()

    if not user_query:
        return jsonify({"error": "No query provided."}), 400

    system_prompt = (
        "You are Onto Agent powered by Nous Research Hermes Agent framework. "
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
        provider = "openrouter" if ("nousresearch" in requested_model or openrouter_api_key or api_key.startswith("sk-or-")) else "openai-api"

        if hermes_agent_available:
            # Instantiate official Nous Research Hermes Agent AIAgent runner
            agent_runner = AIAgent(
                model=requested_model,
                api_key=api_key,
                provider=provider,
                ephemeral_system_prompt=system_prompt,
                quiet_mode=True,
                skip_memory=True
            )
            res = agent_runner.run_conversation(user_prompt)

            reply_text = ""
            if isinstance(res, dict):
                reasoning = res.get("last_reasoning") or ""
                final_res = res.get("final_response") or res.get("response") or ""

                if reasoning and "<thought>" not in final_res:
                    reply_text = f"<thought>\n{reasoning}\n</thought>\n\n{final_res}"
                else:
                    reply_text = final_res
            else:
                reply_text = str(res)
        else:
            from openai import OpenAI
            base_url = "https://openrouter.ai/api/v1" if provider == "openrouter" else None
            client = OpenAI(api_key=api_key, base_url=base_url)
            response = client.chat.completions.create(
                model=requested_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.2,
                max_tokens=1200
            )
            reply_text = response.choices[0].message.content

        return jsonify({
            "status": "success",
            "gateway": "Onto Agent Gateway (Nous Hermes Framework)",
            "model": requested_model,
            "reply": reply_text
        })

    except Exception as e:
        print(f"Error calling Hermes Agent framework: {e}", file=sys.stderr)
        return jsonify({"error": f"Hermes Agent Error: {str(e)}"}), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"🚀 Onto Agent Gateway (Nous Hermes Framework) Server running at http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
