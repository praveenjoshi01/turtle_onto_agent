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
    # Dynamically imported from agent/hermes_agent/run_agent.py
    from run_agent import AIAgent  # type: ignore
    hermes_agent_available = True
    print("✓ Official Nous Research Hermes Agent (AIAgent) initialized successfully.")
except Exception as exc:
    hermes_agent_available = False
    print(f"Notice: hermes_agent runner import fallback: {exc}", file=sys.stderr)

# Try loading custom client handler blueprint (client_custom.py or client_custom_placeholder.py)
try:
    from client_custom import is_custom_handler_active, handle_custom_api_request  # type: ignore
    custom_handler_available = True
    print("✓ Custom Client Agent Handler (client_custom.py) loaded.")
except ImportError:
    try:
        from client_custom_placeholder import is_custom_handler_active, handle_custom_api_request  # type: ignore
        custom_handler_available = True
        print("✓ Custom Client Agent Blueprint (client_custom_placeholder.py) loaded.")
    except ImportError:
        custom_handler_available = False

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
    use_hermes = data.get("use_hermes", True)
    history = data.get("history", [])

    if not user_query:
        return jsonify({"error": "No query provided."}), 400

    # Intercept query if Custom Endpoint Blueprint is active (e.g. custom-api model selected or CUSTOM_API_ENDPOINT set)
    if custom_handler_available and is_custom_handler_active(data):
        custom_res = handle_custom_api_request(data)
        if custom_res.get("status") == "success":
            return jsonify(custom_res)
        elif "error" in custom_res:
            return jsonify(custom_res), 500

    try:
        provider = "openrouter" if ("nousresearch" in requested_model or openrouter_api_key or api_key.startswith("sk-or-")) else "openai-api"

        if use_hermes and hermes_agent_available:
            system_prompt = (
                "You are Onto Agent powered by Nous Research Hermes Agent framework. "
                "Your task is to analyze RDF Turtle (.ttl) ontologies, perform step-by-step entity and relationship traversal, "
                "and synthesize insightful answers.\n\n"
                "Instructions:\n"
                "1. First, outline your step-by-step reasoning inside <thought>...</thought> tags. Analyze subjects, predicates, objects, and ontology rules.\n"
                "2. Follow with your comprehensive, structured answer formatted in GitHub-flavored Markdown.\n"
                "3. Highlight key classes, properties, and entity relationships clearly with tables and code blocks where helpful."
            )

            history_str = ""
            if history:
                formatted_hist = []
                for m in history[-6:]:
                    r = "User" if m.get("role") == "user" else "Assistant"
                    c = m.get("content", "")
                    # Strip reasoning blocks from history if present
                    c_clean = re.sub(r"<details[\s\S]*?<\/details>", "", c).strip()
                    c_clean = re.sub(r"<thought>[\s\S]*?<\/thought>", "", c_clean).strip()
                    if c_clean:
                        formatted_hist.append(f"{r}: {c_clean}")
                if formatted_hist:
                    history_str = "Prior Conversation History:\n" + "\n".join(formatted_hist) + "\n\n"

            user_prompt = f"""{history_str}Current User Query:
{user_query}

Active Turtle RDF Context:
```turtle
{turtle_content[:8000] if turtle_content else 'No active Turtle content provided.'}
```

Graph Summary Stats:
{triples_summary if triples_summary else 'N/A'}
"""

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

            gateway_label = "Onto Agent Gateway (Nous Hermes Framework)"

        else:
            # Fallback Native OpenAI Chat Mode
            import re
            from openai import OpenAI
            base_url = "https://openrouter.ai/api/v1" if provider == "openrouter" else None
            client = OpenAI(api_key=api_key, base_url=base_url)

            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are Onto Assistant, a direct and intelligent Knowledge Graph assistant. "
                        "Answer user questions clearly and concisely based on the provided Turtle (.ttl) ontology context. "
                        "Use formatted GitHub-flavored Markdown without <thought> tags."
                    )
                }
            ]

            # Add past conversation history
            for m in history[-10:]:
                r = m.get("role", "user")
                c = m.get("content", "")
                # Clean thought accordions if switching from Hermes mode
                c_clean = re.sub(r"<details[\s\S]*?<\/details>", "", c).strip()
                c_clean = re.sub(r"<thought>[\s\S]*?<\/thought>", "", c_clean).strip()
                if r in ["user", "assistant"] and c_clean:
                    messages.append({"role": r, "content": c_clean})

            # Add current user query + active context
            context_snippet = f"\n\nActive Turtle Context:\n```turtle\n{turtle_content[:6000]}\n```\nSummary: {triples_summary}" if turtle_content else ""
            messages.append({
                "role": "user",
                "content": f"{user_query}{context_snippet}"
            })

            response = client.chat.completions.create(
                model=requested_model,
                messages=messages,
                temperature=0.3,
                max_tokens=1000
            )
            reply_text = response.choices[0].message.content
            gateway_label = "Native OpenAI Chat Mode"

        return jsonify({
            "status": "success",
            "gateway": gateway_label,
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
