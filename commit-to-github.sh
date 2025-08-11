#!/bin/bash

echo "🚀 Preparing to commit Web UI enhancements to GitHub"
echo "==================================================="

cd /Users/timothywilliams/salesforce-cli-mcp-server

# Build the project first
echo "🔨 Building project..."
npm run build

# Check if build was successful
if [ ! -f "build/index.js" ] || [ ! -f "build/http-server.js" ]; then
    echo "❌ Build failed - please fix TypeScript errors first"
    exit 1
fi

echo "✅ Build successful!"

# Show current git status
echo ""
echo "📋 Current git status:"
git status

echo ""
echo "📁 New files that will be added:"
echo "  public/index.html (Web UI)"
echo "  src/http-server.ts (HTTP Server)"
echo "  README.md (Updated documentation)"
echo "  package.json (Updated dependencies)"
echo "  DEMO.md (Feature comparison)"
echo "  SUCCESS.md (Achievement summary)"
echo "  *.sh scripts (Setup automation)"

echo ""
echo "🎯 Commit message will be:"
echo "✨ Add Web UI and HTTP server mode"
echo ""
echo "Features:"
echo "- Beautiful responsive web interface"
echo "- HTTP server with REST API endpoints" 
echo "- Real-time status monitoring"
echo "- Quick action shortcuts"
echo "- Mobile-responsive design"
echo "- Professional documentation"
echo "- Multiple deployment modes"
echo ""

read -p "Proceed with commit? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "📦 Adding files to git..."
    
    # Add all the new files
    git add public/
    git add src/http-server.ts
    git add README.md
    git add package.json
    git add DEMO.md
    git add SUCCESS.md
    git add *.sh
    
    # Commit with a detailed message
    git commit -m "✨ Add Web UI and HTTP server mode

🌟 Major Features Added:
- Beautiful responsive web interface at http://localhost:3000
- HTTP server mode with Express.js and REST API endpoints
- Real-time server health monitoring with status badges
- Quick action shortcuts for common Salesforce operations
- Mobile-responsive design that works on all devices
- One-click result copying and formatted JSON output

🔧 Technical Enhancements:
- TypeScript HTTP server with proper error handling
- CORS support for development and API access
- Health check endpoints (/health, /api/status)
- RESTful API at /api/execute for programmatic access
- Static file serving for the web interface
- Production-ready Express.js architecture

📚 Documentation & Setup:
- Comprehensive README with Web UI instructions
- DEMO.md with feature comparisons vs basic MCP tutorial
- SUCCESS.md highlighting achievements and next steps
- Automated setup scripts for easy installation
- Professional documentation with examples and API reference

🚀 Deployment Options:
- npm run web - HTTP server with Web UI (NEW!)
- npm run start - Original STDIO MCP mode
- npm run dev - Development mode with watch
- Multiple deployment modes for different use cases

This transforms the basic MCP tutorial into a professional-grade
application with enterprise features, beautiful UI, and production-ready
architecture that goes far beyond the original video example."

    echo ""
    echo "✅ Committed successfully!"
    echo ""
    echo "🌐 Next steps:"
    echo "1. Push to GitHub: git push origin main"
    echo "2. Test the Web UI: npm run web"
    echo "3. Share your accomplishment!"
    echo ""
    echo "📈 GitHub repository will now show:"
    echo "   - Professional README with screenshots"
    echo "   - Complete Web UI implementation"  
    echo "   - Production-ready HTTP server"
    echo "   - Comprehensive documentation"
    echo ""
    echo "🎉 Ready to push to GitHub!"
    
else
    echo "❌ Commit cancelled"
fi