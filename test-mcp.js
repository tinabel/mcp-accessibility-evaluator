#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Simple test tools
const tools = [
  {
    name: 'test_tool',
    description: 'A simple test tool to verify MCP connection',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'A test message',
        },
      },
      required: ['message'],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'test-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'test_tool') {
    return {
      content: [
        {
          type: 'text',
          text: `Test successful! You sent: ${args.message}`,
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Test MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
}); 