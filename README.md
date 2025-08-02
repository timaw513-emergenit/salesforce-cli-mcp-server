# Salesforce CLI MCP Server

A Model Context Protocol (MCP) server that integrates with the Salesforce CLI, allowing AI assistants to interact with Salesforce orgs through natural language commands.

## Features

- **Org Management**: List and manage authorized Salesforce orgs
- **Data Operations**: Execute SOQL queries and import data
- **Metadata Operations**: Deploy and retrieve metadata
- **Testing**: Run Apex tests
- **Package Management**: Create and manage Salesforce packages
- **Custom Commands**: Execute any Salesforce CLI command

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

### 4. Configure your MCP client

#### For Claude Desktop

Add this configuration to your Claude Desktop MCP settings file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

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

#### For VS Code with MCP Extension

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

### 5. Test the setup

1. Restart your MCP client
2. Look for Salesforce CLI tools
3. Try: "List all my Salesforce orgs"

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

Once configured, you can use natural language with your AI assistant:

### Org Management
- "List all my Salesforce orgs"
- "Show me the connection status of all orgs"

### Data Queries
- "Query all accounts in my org"
- "Get all contacts where the email contains 'example.com'"
- "Run this SOQL query: SELECT Id, Name FROM Account LIMIT 10"

### Metadata Operations
- "Deploy all metadata to my sandbox"
- "Retrieve the Account object metadata"
- "Deploy only the AccountController class"

### Testing
- "Run all Apex tests in my org"
- "Run tests for the AccountTest class"

### Data Import
- "Import the accounts.csv file as Account records"

### Custom Commands
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

## Security Considerations

This MCP server executes Salesforce CLI commands directly on your system. Ensure that:

1. You trust the AI assistant you're using
2. You have proper backup procedures in place
3. You understand the implications of the commands being executed
4. You review any destructive operations before confirming

## Troubleshooting

### Common Issues

1. **"Command not found: sf"**
   - Ensure Salesforce CLI is installed and in your PATH

2. **"No orgs found"**
   - Make sure you have authorized at least one Salesforce org using `sf org login web`

3. **"Permission denied"**
   - Ensure the build/index.js file has execute permissions: `chmod +x build/index.js`

4. **"Module not found"**
   - Run `npm install` to install dependencies
   - Run `npm run build` to compile TypeScript

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.