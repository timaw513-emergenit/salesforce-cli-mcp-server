# Salesforce CLI MCP Server

A Model Context Protocol (MCP) server that integrates with the Salesforce CLI, allowing AI assistants to interact with Salesforce orgs through natural language commands. **Now with Web UI!**

## 🆕 New Features

- **🌐 Web UI**: Interactive web interface for easy Salesforce CLI operations
- **🔗 HTTP Server**: RESTful API endpoints alongside MCP protocol
- **📊 Real-time Status**: Live server health monitoring
- **🎯 Quick Actions**: One-click shortcuts for common operations
- **📋 Copy Results**: Easy result copying and formatting

## Features

- **Org Management**: List and manage authorized Salesforce orgs
- **Data Operations**: Execute SOQL queries and import data
- **Metadata Operations**: Deploy and retrieve metadata
- **Testing**: Run Apex tests
- **Package Management**: Create and manage Salesforce packages
- **Custom Commands**: Execute any Salesforce CLI command
- **Web Interface**: User-friendly web UI for all operations
- **HTTP API**: RESTful endpoints for programmatic access

## Prerequisites

Before using this MCP server, ensure you have:

1. **Salesforce CLI installed**: [Install Salesforce CLI](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_intro.htm)
2. **Node.js** (version 18 or higher)
3. **At least one authorized Salesforce org**

## Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/timaw513-emergenit/salesforce-cli-mcp-server.git
cd salesforce-cli-mcp-server
```

### 2. Install dependencies
```bash
npm install
```

### 3. Build the project
```bash
npm run build
```

### 4. Choose your mode

#### Option A: Web UI Mode (Recommended)
Start the server with web interface:
```bash
npm run web
```

Then open your browser to: **http://localhost:3000**

#### Option B: STDIO Mode (for MCP clients)
Configure your MCP client as shown below.

## 🌐 Web UI Usage

The web interface provides an intuitive way to interact with your Salesforce orgs:

### Features:
- **🚀 Interactive Forms**: Fill out forms for each Salesforce CLI command
- **📊 Quick Actions**: One-click shortcuts for common tasks
- **📋 Live Results**: Real-time command execution with formatted output
- **📱 Responsive Design**: Works on desktop, tablet, and mobile
- **🔄 Status Monitoring**: Real-time server health indicators

### Available Operations:
- **List Orgs**: View all authorized Salesforce orgs
- **Execute SOQL**: Run queries with syntax highlighting
- **Custom Commands**: Execute any Salesforce CLI command
- **Deploy/Retrieve**: Metadata operations with progress tracking
- **Run Tests**: Execute Apex tests with detailed results

### Quick Actions:
- **List Orgs**: Instantly view all authorized orgs
- **Query Accounts**: Pre-filled SOQL query for Account records
- **Org Info**: Display current org details

## API Endpoints

When running in HTTP mode, the server provides these endpoints:

### Core Endpoints:
- `GET /` - Web UI interface
- `GET /health` - Health check
- `GET /api/status` - Detailed server status
- `GET /api/tools` - Available tools list
- `POST /api/execute` - Execute Salesforce CLI commands
- `POST /mcp` - MCP protocol endpoint

### Example API Usage:

```bash
# Execute a SOQL query
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"command": "data query --json --query \"SELECT Id, Name FROM Account LIMIT 5\""}'

# List all orgs
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"command": "org list --json"}'

# Check server health
curl http://localhost:3000/health
```

## MCP Client Configuration

### For Claude Desktop

Add this configuration to your Claude Desktop MCP settings file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

#### STDIO Mode:
```json
{
  "mcpServers": {
    "salesforce-cli": {
      "command": "node",
      "args": ["/absolute/path/to/salesforce-cli-mcp-server/build/index.js"]
    }
  }
}
```

#### HTTP Mode:
```json
{
  "mcpServers": {
    "salesforce-cli-http": {
      "command": "curl",
      "args": ["-X", "POST", "http://localhost:3000/mcp"]
    }
  }
}
```

### For VS Code with MCP Extension

Create a `.vscode/mcp.json` file in your project root:

```json
{
  "servers": {
    "Salesforce CLI": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/salesforce-cli-mcp-server/build/index.js"]
    }
  }
}
```

## Available Commands

### NPM Scripts

```bash
# Development
npm run build          # Build TypeScript
npm run dev            # Watch mode for development
npm run clean          # Clean build directory

# Running
npm run start          # Start in STDIO mode
npm run http           # Start HTTP server (with Web UI)
npm run web            # Alias for http mode
npm run ui             # Alias for http mode

# Testing
npm run inspector      # Run MCP Inspector
npm run test           # Build and run inspector
```

## Available Tools

### 1. `sf_org_list`
List all authorized Salesforce orgs.

### 2. `sf_data_query`
Execute a SOQL query against a Salesforce org.

### 3. `sf_project_deploy`
Deploy metadata to a Salesforce org.

### 4. `sf_project_retrieve`
Retrieve metadata from a Salesforce org.

### 5. `sf_apex_test_run`
Run Apex tests in a Salesforce org.

### 6. `sf_data_import`
Import data from a CSV file into a Salesforce org.

### 7. `sf_package_create`
Create a new Salesforce package.

### 8. `sf_custom_command`
Execute any Salesforce CLI command.

## Usage Examples

### Via Web UI
1. Open http://localhost:3000
2. Select a tool from the sidebar
3. Fill out the form parameters
4. Click "Execute" and view results

### Via Natural Language (MCP clients)
Once configured, you can use natural language with your AI assistant:

#### Org Management
- "List all my Salesforce orgs"
- "Show me the connection status of all orgs"

#### Data Queries
- "Query all accounts in my org"
- "Get all contacts where the email contains 'example.com'"
- "Run this SOQL query: SELECT Id, Name FROM Account LIMIT 10"

#### Metadata Operations
- "Deploy all metadata to my sandbox"
- "Retrieve the Account object metadata"
- "Deploy only the AccountController class"

#### Testing
- "Run all Apex tests in my org"
- "Run tests for the AccountTest class"

#### Data Import
- "Import the accounts.csv file as Account records"

#### Custom Commands
- "Run the command: org display --target-org myorg"

## Development

### Testing
Use the MCP Inspector to test your server:

```bash
npm run inspector
```

### Development Mode
Run in development mode with auto-rebuild:

```bash
npm run dev
```

### Web UI Development
For web UI development, start the HTTP server and make changes to files in the `public/` directory:

```bash
npm run web
```

The server will serve static files from the `public/` directory automatically.

## Security Considerations

This MCP server executes Salesforce CLI commands directly on your system. Ensure that:

1. You trust the AI assistant you're using
2. You have proper backup procedures in place
3. You understand the implications of the commands being executed
4. You review any destructive operations before confirming
5. The HTTP server (if used) is only accessible from trusted networks

## Troubleshooting

### Common Issues

1. **"Command not found: sf"**
   - Ensure Salesforce CLI is installed and in your PATH

2. **"No orgs found"**
   - Make sure you have authorized at least one Salesforce org using `sf org login web`

3. **"Permission denied"**
   - Ensure the build files have execute permissions: `chmod +x build/*.js`

4. **"Module not found"**
   - Run `npm install` to install dependencies
   - Run `npm run build` to compile TypeScript

5. **"Port already in use"**
   - Change the port: `MCP_PORT=3001 npm run web`

6. **Web UI not loading**
   - Ensure you've run `npm run build` first
   - Check that `public/index.html` exists
   - Verify server is running: `curl http://localhost:3000/health`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

---

**🌟 Now with Web UI! Access your Salesforce CLI through a beautiful, intuitive web interface at http://localhost:3000**