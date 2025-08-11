#!/bin/bash

echo "⚡ Quick Setup Script for Salesforce CLI MCP Server"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building TypeScript project..."
npm run build

# Check if build was successful
if [ -f "build/index.js" ] && [ -f "build/http-server.js" ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🚀 Available commands:"
    echo "  npm run web     - Start Web UI (http://localhost:3000)"
    echo "  npm run start   - Start STDIO MCP mode"
    echo "  npm run dev     - Development mode with watch"
    echo ""
    echo "🌐 Ready to use! Try: npm run web"
else
    echo "❌ Build failed. Please check for TypeScript errors."
    exit 1
fi