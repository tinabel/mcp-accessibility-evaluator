# MCP Accessibility Evaluator - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Build the MCP Server

```bash
cd mcp-accessibility-evaluator
npm install
npm run build
```

### Step 2: Configure Your AI Assistant

#### For Claude Desktop (macOS)

1. Run the setup script:

   ```bash
   ./setup-mcp.sh
   ```

2. Copy the generated configuration to Claude:

   ```bash
   cat mcp-config.json
   # Copy the JSON content
   ```

3. Open Claude's configuration:

   ```bash
   open ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

4. Add the MCP server configuration and save

5. Restart Claude Desktop

#### For VS Code with GitHub Copilot and Cursor

1. Install the MCP extension from VS Code marketplace

2. Add to your VS Code settings:
   ```json
   {
    "mcp.servers": {
       "accessibility-evaluator": {
         "command": "node",
         "args": ["/absolute/path/to/mcp-accessibility-evaluator/dist/index.js"]
       }
     }
   }
   ```

### Step 3: Test It Works

Ask your AI assistant:

```
Use evaluate_accessibility to check this HTML:
<html>
  <body>
    <img src="logo.png">
    <button><i class="icon-close"></i></button>
  </body>
</html>
```

You should see accessibility issues reported!

## 📋 Common Commands

### Basic Evaluation

```
Evaluate accessibility of <html>...</html>
```

### WCAG Compliance Check

```
Check WCAG AA compliance for https://example.com
```

### ARIA Validation

```
Validate ARIA usage in this code: <div role="button">...</div>
```

### Fetch Documentation

```
Fetch the latest accessibility documentation from W3C
```

## 🔧 Troubleshooting

### MCP Not Connecting?

1. **Check the path**: Ensure the path in your config points to the built `dist/index.js`
2. **Rebuild if needed**: Run `npm run build` again
3. **Check logs**: Look for error messages in your AI assistant's logs

### No Results?

1. **Test with simple HTML**: Start with basic HTML like `<img src="test.jpg">`
2. **Check tool names**: Use exact tool names (e.g., `evaluate_accessibility`)
3. **Verify HTML format**: Ensure proper HTML syntax

### Type Errors?

Run `npm install` to ensure all dependencies are installed.

## 🎯 Next Steps

1. **Explore all tools**: Try each of the 4 available tools
2. **Test your code**: Evaluate your actual project files
3. **Customize rules**: Add custom accessibility checks
4. **Run tests**: Execute `npm test` to see the test suite

## 📚 Learn More

- [Full Documentation](./README.md)
- [Testing Guide](./TESTING.md)
- [Example Test Page](./examples/test-page.html)
- [Setup Guide](../COPILOT_SETUP.md)
