#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);
const app = express();
const port = process.env.MCP_PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve the web UI at the root
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

/**
 * Executes a Salesforce CLI command and returns the result
 */
async function executeSfCommand(command: string): Promise<{ stdout: string; stderr: string }> {
  try {
    console.log(`[${new Date().toISOString()}] Executing: sf ${command}`);
    const result = await execAsync(`sf ${command}`, { 
      timeout: 300000, // 5 minute timeout
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });
    return result;
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Command failed: ${error.message}`);
    throw new Error(`Salesforce CLI command failed: ${error.message}`);
  }
}

// API endpoint to execute SF CLI commands
app.post('/api/execute', async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }
    
    console.log(`[API] Executing command: ${command}`);
    
    const result = await executeSfCommand(command);
    
    // Try to parse JSON output first, fall back to plain text
    let content: any;
    try {
      content = JSON.parse(result.stdout);
    } catch {
      content = result.stdout || result.stderr;
    }
    
    return res.json({
      success: true,
      data: content,
      command: command
    });
    
  } catch (error: any) {
    console.error('[API] Command execution failed:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
      command: req.body.command
    });
  }
});

// API endpoint to get available tools
app.get('/api/tools', (_req, res) => {
  res.json({
    tools: [
      {
        name: "sf_org_list",
        description: "List all authorized Salesforce orgs",
        parameters: ["all", "clean", "skipConnectionStatus"]
      },
      {
        name: "sf_data_query",
        description: "Execute a SOQL query against a Salesforce org",
        parameters: ["query", "targetOrg", "useToolingApi", "bulk"]
      },
      {
        name: "sf_project_deploy",
        description: "Deploy metadata to a Salesforce org",
        parameters: ["sourcePath", "metadata", "targetOrg", "checkOnly", "testLevel", "wait"]
      },
      {
        name: "sf_project_retrieve",
        description: "Retrieve metadata from a Salesforce org",
        parameters: ["targetOrg", "metadata", "sourcePath", "packageNames", "wait"]
      },
      {
        name: "sf_apex_test_run",
        description: "Run Apex tests in a Salesforce org",
        parameters: ["targetOrg", "testLevel", "classNames", "suiteNames", "outputDir", "wait"]
      },
      {
        name: "sf_data_import",
        description: "Import data from a CSV file into a Salesforce org",
        parameters: ["file", "sobject", "targetOrg", "wait"]
      },
      {
        name: "sf_package_create",
        description: "Create a new Salesforce package",
        parameters: ["name", "packageType", "path", "targetDevHub", "description"]
      },
      {
        name: "sf_custom_command",
        description: "Execute a custom Salesforce CLI command",
        parameters: ["command"]
      }
    ]
  });
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'salesforce-cli-mcp-server',
    mode: 'http-with-ui'
  });
});

// API status endpoint
app.get('/api/status', (_req, res) => {
  res.json({
    service: 'Salesforce CLI MCP Server',
    version: '1.0.0',
    mode: 'http-with-ui',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV,
    features: ['web-ui', 'rest-api', 'mcp-protocol'],
    endpoints: {
      webUI: '/',
      health: '/health',
      status: '/api/status',
      tools: '/api/tools',
      execute: '/api/execute',
      mcp: '/mcp'
    }
  });
});

/**
 * MCP Server Setup (for protocol compatibility)
 */
const mcpServer = new Server(
  {
    name: "salesforce-cli-mcp-server-http",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Import the same schemas from the main server
const OrgListArgsSchema = z.object({
  all: z.boolean().optional().describe("Show all orgs, including expired and deleted ones"),
  clean: z.boolean().optional().describe("Remove all local org authorization files for non-active orgs"),
  skipConnectionStatus: z.boolean().optional().describe("Skip retrieving the connection status of each org")
});

const QueryArgsSchema = z.object({
  query: z.string().describe("SOQL query to execute"),
  targetOrg: z.string().optional().describe("Username or alias of the target org"),
  useToolingApi: z.boolean().optional().describe("Use Tooling API instead of standard API"),
  bulk: z.boolean().optional().describe("Use Bulk API 2.0 for large queries")
});

/**
 * Builds command flags from arguments
 */
function buildFlags(args: Record<string, any>): string {
  const flags: string[] = [];
  
  for (const [key, value] of Object.entries(args)) {
    if (value === undefined || value === null) continue;
    
    const flagName = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    
    if (typeof value === 'boolean') {
      if (value) flags.push(`--${flagName}`);
    } else if (Array.isArray(value)) {
      flags.push(`--${flagName}`, value.join(','));
    } else {
      flags.push(`--${flagName}`, String(value));
    }
  }
  
  return flags.join(' ');
}

// List available tools (for MCP protocol)
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "sf_org_list",
        description: "List all authorized Salesforce orgs",
        inputSchema: {
          type: "object",
          properties: {
            all: { type: "boolean", description: "Show all orgs, including expired and deleted ones" },
            clean: { type: "boolean", description: "Remove all local org authorization files for non-active orgs" },
            skipConnectionStatus: { type: "boolean", description: "Skip retrieving the connection status of each org" }
          }
        }
      },
      {
        name: "sf_data_query",
        description: "Execute a SOQL query against a Salesforce org",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "SOQL query to execute" },
            targetOrg: { type: "string", description: "Username or alias of the target org" },
            useToolingApi: { type: "boolean", description: "Use Tooling API instead of standard API" },
            bulk: { type: "boolean", description: "Use Bulk API 2.0 for large queries" }
          },
          required: ["query"]
        }
      },
      {
        name: "sf_custom_command",
        description: "Execute a custom Salesforce CLI command",
        inputSchema: {
          type: "object",
          properties: {
            command: { type: "string", description: "Full Salesforce CLI command to execute (without 'sf' prefix)" }
          },
          required: ["command"]
        }
      }
    ],
  };
});

// Handle tool calls (for MCP protocol)
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let command: string;
    let result: { stdout: string; stderr: string };

    switch (name) {
      case "sf_org_list": {
        const validatedArgs = OrgListArgsSchema.parse(args || {});
        const flags = buildFlags(validatedArgs);
        command = `org list --json ${flags}`.trim();
        result = await executeSfCommand(command);
        break;
      }

      case "sf_data_query": {
        const validatedArgs = QueryArgsSchema.parse(args);
        const flags = buildFlags(validatedArgs);
        command = `data query --json ${flags}`.trim();
        result = await executeSfCommand(command);
        break;
      }

      case "sf_custom_command": {
        const customArgs = z.object({ command: z.string() }).parse(args);
        command = customArgs.command;
        result = await executeSfCommand(command);
        break;
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    // Try to parse JSON output first, fall back to plain text
    let content: any;
    try {
      content = JSON.parse(result.stdout);
    } catch {
      content = result.stdout || result.stderr;
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(content, null, 2),
        },
      ],
    };

  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start HTTP server
async function main() {
  try {
    // Start the HTTP server
    app.listen(port, () => {
      console.log(`🚀 Salesforce CLI MCP Server (HTTP + Web UI) running on port ${port}`);
      console.log(`🌐 Web UI: http://localhost:${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(`📈 Status: http://localhost:${port}/api/status`);
      console.log(`🛠️ Tools API: http://localhost:${port}/api/tools`);
      console.log(`⚡ Execute API: http://localhost:${port}/api/execute`);
    });

  } catch (error) {
    console.error("Failed to start HTTP server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});