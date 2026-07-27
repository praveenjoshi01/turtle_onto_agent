#!/usr/bin/env bash
set -e

echo "🚀 Setting up OntoSphere AI environment & dependencies..."

# 1. Install Node.js Dependencies
echo "📦 Installing npm dependencies..."
npm install

# 2. Clone official Nous Research Hermes Agent if not present
if [ ! -d "agent/hermes_agent" ]; then
    echo "📥 Cloning official Nous Research Hermes Agent repository..."
    git clone --depth 1 https://github.com/NousResearch/hermes-agent.git agent/hermes_agent
else
    echo "✓ Official Nous Research Hermes Agent repository already present in agent/hermes_agent"
fi

# 3. Create Python 3.12 virtual environment using uv if not created
if [ ! -d ".venv" ]; then
    echo "🐍 Setting up Python 3.12 environment using uv..."
    uv venv --python 3.12 .venv
else
    echo "✓ Python virtual environment already present in .venv"
fi

# 4. Install hermes-agent & gateway dependencies with uv
echo "⚡ Installing hermes-agent v0.19.0 & gateway packages into .venv..."
uv pip install -e agent/hermes_agent flask flask-cors python-dotenv

echo "✅ Environment setup complete! You can now launch the app:"
echo "   - Python Gateway: uv run python agent/client.py"
echo "   - Web UI: npm run dev"
