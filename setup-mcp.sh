#!/bin/bash

# MCP Accessibility Evaluator Setup Script

echo "🚀 MCP Accessibility Evaluator Setup"
echo "===================================="

# Get the absolute path of the MCP server
MCP_PATH="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "📍 MCP Server Location: $MCP_PATH"

# Check if already built
if [ ! -d "$MCP_PATH/dist" ]; then
    echo ""
    echo "📦 Building MCP server..."
    npm install
    npm run build
else
    echo "✅ MCP server already built"
fi

# Detect OS
case "$(uname -s)" in
    Darwin*)
        OS="macOS"
        CLAUDE_CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
        ;;
    Linux*)
        OS="Linux"
        CLAUDE_CONFIG_PATH="$HOME/.config/Claude/claude_desktop_config.json"
        ;;
    MINGW*|CYGWIN*|MSYS*)
        OS="Windows"
        CLAUDE_CONFIG_PATH="$APPDATA/Claude/claude_desktop_config.json"
        ;;
    *)
        OS="Unknown"
        ;;
esac

echo ""
echo "🖥️  Detected OS: $OS"

# Create example configuration
cat > "$MCP_PATH/mcp-config.json" << EOF
{
  "mcpServers": {
    "accessibility-evaluator": {
      "command": "node",
      "args": ["$MCP_PATH/dist/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
EOF

echo ""
echo "📄 Created example configuration at: $MCP_PATH/mcp-config.json"

# Instructions for different AI assistants
echo ""
echo "📋 Setup Instructions"
echo "===================="

echo ""
echo "For Claude Desktop:"
echo "1. Open (or create) your configuration file:"
echo "   $CLAUDE_CONFIG_PATH"
echo ""
echo "2. Add the accessibility-evaluator configuration:"
echo "   You can copy from: $MCP_PATH/mcp-config.json"
echo ""
echo "3. Restart Claude Desktop"

echo ""
echo "For VS Code with GitHub Copilot:"
echo "1. Install the MCP extension for VS Code"
echo "2. Add to your VS Code settings.json:"
cat << EOF
{
  "mcp.servers": {
    "accessibility-evaluator": {
      "command": "node",
      "args": ["$MCP_PATH/dist/index.js"]
    }
  }
}
EOF

echo ""
echo "✨ Available MCP Tools:"
echo "- evaluate_accessibility: Evaluate HTML for accessibility issues"
echo "- check_wcag_compliance: Check WCAG 2.1 compliance level"
echo "- validate_aria: Validate ARIA usage"
echo "- fetch_accessibility_docs: Fetch W3C/MDN documentation"

echo ""
echo "🧪 Test the setup:"
echo "1. Start your AI assistant"
echo "2. Ask: 'Use evaluate_accessibility to check <html><img src=\"test.jpg\"></html>'"
echo "3. You should see accessibility issues reported"

echo ""
echo "✅ Setup complete! The MCP server is ready to use." 