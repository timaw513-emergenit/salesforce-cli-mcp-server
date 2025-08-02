#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Define argument schemas for various Salesforce CLI commands
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

const DeployArgsSchema = z.object({
  sourcePath: z.string().optional().describe("Path to source files to deploy"),
  metadata: z.array(z.string()).optional().describe("Comma-separated list of metadata components to deploy"),
  targetOrg: z.string().optional().describe("Username or alias of the target org"),
  checkOnly: z.boolean().optional().describe("Validate deploy but don't save to the org"),
  testLevel: z.enum(["NoTestRun", "RunSpecifiedTests", "RunLocalTests", "RunAllTestsInOrg"]).optional(),
  wait: z.number().optional().describe("Wait time for deployment to complete (in minutes)")
});

const RetrieveArgsSchema = z.object({
  targetOrg: z.string().optional().describe("Username or alias of the target org"),
  metadata: z.array(z.string()).optional().describe("Comma-separated list of metadata components to retrieve"),
  sourcePath: z.string().optional().describe("Path to save retrieved source files"),
  packageNames: z.array(z.string()).optional().describe("Package names to retrieve"),
  wait: z.number().optional().describe("Wait time for retrieve to complete (in minutes)")
});

const ApexTestArgsSchema = z.object({
  targetOrg: z.string().optional().describe("Username or alias of the target org"),
  testLevel: z.enum(["RunLocalTests", "RunAllTestsInOrg", "RunSpecifiedTests"]).optional(),
  classNames: z.array(z.string()).optional().describe("Apex test class names to run"),
  suiteNames: z.array(z.string()).optional().describe("Apex test suite names to run"),
  outputDir: z.string().optional().describe("Directory to store test results"),
  wait: z.number().optional().describe("Wait time for tests to complete (in minutes)")
});

const DataImportArgsSchema = z.object({
  file: z.string().describe("Path to CSV file to import"),
  sobject: z.string().describe("sObject type for the data"),
  targetOrg: z.string().optional().describe("Username or alias of the target org"),
  wait: z.number().optional().describe("Wait time for import to complete (in minutes)")
});

const PackageCreateArgsSchema = z.object({
  name: z.string().describe("Package name"),
  packageType: z.enum(["Managed", "Unlocked"]).describe("Package type"),
  path: z.string().describe("Path to package directory"),
  targetDevHub: z.string().optional().describe("Username or alias of the Dev Hub org"),
  description: z.string().optional().describe("Package description")
});

/**
 * Executes a Salesforce CLI command and returns the result
 */
async function executeSfCommand(command: string): Promise<{ stdout: string; stderr: string }> {
  try {
    console.error(`Executing: ${command}`);
    const result = await execAsync(command, { 
      timeout: 300000, // 5 minute timeout
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });
    return result;
  } catch (error: any) {
    console.error(`Command failed: ${error.message}`);
    throw new Error(`Salesforce CLI command failed: ${error.message}`);
  }
}

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

/**
 * Main server setup
 */
const server = new Server(
  {
    name: "salesforce-cli-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
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
        name: "sf_project_deploy",
        description: "Deploy metadata to a Salesforce org",
        inputSchema: {
          type: "object",
          properties: {
            sourcePath: { type: "string", description: "Path to source files to deploy" },
            metadata: { type: "array", items: { type: "string" }, description: "Metadata components to deploy" },
            targetOrg: { type: "string", description: "Username or alias of the target org" },
            checkOnly: { type: "boolean", description: "Validate deploy but don't save to the org" },
            testLevel: { type: "string", enum: ["NoTestRun", "RunSpecifiedTests", "RunLocalTests", "RunAllTestsInOrg"] },
            wait: { type: "number", description: "Wait time for deployment to complete (in minutes)" }
          }
        }
      },
      {
        name: "sf_project_retrieve",
        description: "Retrieve metadata from a Salesforce org",
        inputSchema: {
          type: "object",
          properties: {
            targetOrg: { type: "string", description: "Username or alias of the target org" },
            metadata: { type: "array", items: { type: "string" }, description: "Metadata components to retrieve" },
            sourcePath: { type: "string", description: "Path to save retrieved source files" },
            packageNames: { type: "array", items: { type: "string" }, description: "Package names to retrieve" },
            wait: { type: "number", description: "Wait time for retrieve to complete (in minutes)" }
          }
        }
      },
      {
        name: "sf_apex_test_run",
        description: "Run Apex tests in a Salesforce org",
        inputSchema: {
          type: "object",
          properties: {
            targetOrg: { type: "string", description: "Username or alias of the target org" },
            testLevel: { type: "string", enum: ["RunLocalTests", "RunAllTestsInOrg", "RunSpecifiedTests"] },
            classNames: { type: "array", items: { type: "string" }, description: "Apex test class names to run" },
            suiteNames: { type: "array", items: { type: "string" }, description: "Apex test suite names to run" },
            outputDir: { type: "string", description: "Directory to store test results" },
            wait: { type: "number", description: "Wait time for tests to complete (in minutes)" }
          }
        }
      },
      {
        name: "sf_data_import",
        description: "Import data from a CSV file into a Salesforce org",
        inputSchema: {
          type: "object",
          properties: {
            file: { type: "string", description: "Path to CSV file to import" },
            sobject: { type: "string", description: "sObject type for the data" },
            targetOrg: { type: "string", description: "Username or alias of the target org" },
            wait: { type: "number", description: "Wait time for import to complete (in minutes)" }
          },
          required: ["file", "sobject"]
        }
      },
      {
        name: "sf_package_create",
        description: "Create a new Salesforce package",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Package name" },
            packageType: { type: "string", enum: ["Managed", "Unlocked"], description: "Package type" },
            path: { type: "string", description: "Path to package directory" },
            targetDevHub: { type: "string", description: "Username or alias of the Dev Hub org" },
            description: { type: "string", description: "Package description" }
          },
          required: ["name", "packageType", "path"]
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

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let command: string;
    let result: { stdout: string; stderr: string };

    switch (name) {
      case "sf_org_list": {
        const validatedArgs = OrgListArgsSchema.parse(args || {});
        const flags = buildFlags(validatedArgs);
        command = `sf org list --json ${flags}`.trim();
        result = await executeSfCommand(command);
        break;
      }

      case "sf_data_query": {
        const validatedArgs = QueryArgsSchema.parse(args);
        const flags = buildFlags(validatedArgs);
        command = `sf data query --json ${flags}`.trim();
        result = await executeSfCommand(command);
        break;
      }

      case "sf_project_deploy": {
        const validatedArgs = DeployArgsSchema.parse(args || {});
        const flags = buildFlags(validatedArgs);
        command = `sf project deploy start --json ${flags}`.trim();
        result = await executeSfCommand(command);
        break;
      }

      case "sf_project_retrieve": {
        const validatedArgs = RetrieveArgsSchema.parse(args || {});
        const flags = buildFlags(validatedArgs);
        command = `sf project retrieve start --json ${flags}`.trim();
        result = await executeSfCommand(command);
        break;
      }

      case "sf_apex_test_run": {
        const validatedArgs = ApexTestArgsSchema.parse(args || {});
        const flags = buildFlags(validatedArgs);
        command = `sf apex test run --json ${flags}`.trim();
        result = await executeSfCommand(command);
        break;
      }

      case "sf_data_import": {
        const validatedArgs = DataImportArgsSchema.parse(args);
        const flags = buildFlags(validatedArgs);
        command = `sf data import tree --json ${flags}`.trim();
        result = await executeSfCommand(command);
        break;
      }

      case "sf_package_create": {
        const validatedArgs = PackageCreateArgsSchema.parse(args);
        const flags = buildFlags(validatedArgs);
        command = `sf package create --json ${flags}`.trim();
        result = await executeSfCommand(command);
        break;
      }

      case "sf_custom_command": {
        const customArgs = z.object({ command: z.string() }).parse(args);
        command = `sf ${customArgs.command}`;
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

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Salesforce CLI MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});