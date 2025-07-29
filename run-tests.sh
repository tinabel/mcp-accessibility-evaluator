#!/bin/bash

# MCP Accessibility Evaluator Test Runner

echo "🧪 MCP Accessibility Evaluator - Running Tests"
echo "============================================="

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run type checking
echo ""
echo "📝 Running TypeScript type checking..."
npx tsc --noEmit || echo "⚠️  Type checking found issues"

# Run tests
echo ""
echo "🏃 Running Jest tests..."
npm test

# Run coverage if requested
if [ "$1" == "--coverage" ]; then
    echo ""
    echo "📊 Generating coverage report..."
    npm run test:coverage
    echo ""
    echo "Coverage report generated in ./coverage/"
fi

echo ""
echo "✅ Test run complete!" 