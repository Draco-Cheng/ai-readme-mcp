/**
 * AI_README MCP Server
 * Entry point for the MCP server
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import {
  discoverAIReadmes,
  discoverSchema,
  type DiscoverInput,
} from "./tools/discover.js";
import {
  getContextForFile,
  getContextSchema,
  type GetContextInput,
} from "./tools/getContext.js";
import {
  updateAIReadme,
  updateSchema,
  type UpdateInput,
} from "./tools/update.js";
import {
  validateAIReadmes,
  validateSchema,
  type ValidateInput,
} from "./tools/validate.js";
import { initAIReadme, initSchema, type InitInput } from "./tools/init.js";

// Read version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf-8")
);

const server = new Server(
  {
    name: "ai-readme-mcp",
    version: packageJson.version,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool: list_tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "discover_ai_readmes",
        description:
          "Scan the project and discover all AI_README.md files. Returns an index of all README files with their paths, scopes, and coverage patterns.",
        inputSchema: zodToJsonSchema(discoverSchema),
      },
      {
        name: "get_context_for_file",
        description: [
          'ALWAYS CALL THIS FIRST - NO EXCEPTIONS.',
          'WHEN TO CALL (check these FIRST before responding):',
          '- User asks: optimize, improve, analyze, review, suggest, think, opinion.',
          '- User mentions: file name, component name, project, codebase, backend, frontend.',
          '- User asks: "what can", "what should", "how to", "can you", "help me".',
          '- Before: Write, Edit, TodoWrite, suggesting ANY code changes.',
          'IF ANY ABOVE = TRUE → CALL get_context_for_file IMMEDIATELY.',
          '',
          'MANDATORY RULE:',
          'EVERY response that involves code/suggestions MUST start with get_context_for_file.',
          '',
          'What this tool does:',
          'Gets AI_README context showing project conventions that MUST be followed.',
          'Why it matters:',
          '- Without: Wrong tech (suggest Tailwind when project uses CSS Modules).',
          '- With: Suggestions fit existing codebase perfectly.',
          'DETECT CONFLICTS:',
          'After reading context, if user wants X but AI_README says Y:',
          '- This is ARCHITECTURAL DECISION.',
          '- Workflow: get_context → update_ai_readme → get_context → Write/Edit.',
        ].join("\n"),
        inputSchema: zodToJsonSchema(getContextSchema),
      },
      {
        name: "update_ai_readme",
        description: [
          "CALL THIS when user changes TECHNOLOGY/CONVENTION.",
          "WHEN TO CALL (after get_context detects conflict):",
          '- User says: "don\'t use X", "don\'t want", "not X", "instead".',
          '- User says: "use Y", "prefer", "switch to", "change to".',
          "- User tech choice ≠ AI_README tech (CONFLICT).",
          "- Pattern change affects multiple files.",
          "IF ANY ABOVE = TRUE → CALL update_ai_readme BEFORE changing code.",
          "MANDATORY WORKFLOW:",
          "1. get_context (read current conventions).",
          "2. DETECT CONFLICT: User wants X but AI_README says Y.",
          "3. update_ai_readme (change Y → X) ← YOU ARE HERE.",
          "4. get_context (verify update).",
          "5. Write/Edit (follow new convention).",
          "Example:",
          '- User: "I don\'t want Tailwind" (after seeing AI_README says "Tailwind").',
          '→ CONFLICT! Call update_ai_readme to change "Tailwind" → "CSS Modules".',
          "Content Rules:",
          "- Extremely concise (< 400 tokens).",
          "- Only actionable conventions (tech, naming, patterns).",
          "- NO explanations or examples.",
        ].join("\n"),
        inputSchema: zodToJsonSchema(updateSchema),
      },
      {
        name: "validate_ai_readmes",
        description:
          "Validate all AI_README.md files in a project. Checks token count, structure, and content quality. Returns validation results with suggestions for improvement.",
        inputSchema: zodToJsonSchema(validateSchema),
      },
      {
        name: "init_ai_readme",
        description: [
          "Initialize and populate empty AI_README files within a project.",
          'When to use:',
          '- First-time setup when no AI_README exists.',
          '- get_context_for_file reports empty or missing AI_README files.',
          '- Newly created directories need conventions recorded.',
          '- Multiple directories require conventions in one pass.',
          'What it does:',
          '- Scans for missing or empty AI_README documents.',
          '- Creates a root-level AI_README if none is present.',
          '- Provides directory-specific prompts to gather conventions.',
          '- Guides you through documenting tech stack, patterns, and naming.',
          'Workflow:',
          '- Call init_ai_readme.',
          '- Follow the step-by-step instructions to inspect each directory.',
          '- Use update_ai_readme to record the conventions.',
          '- Re-run get_context_for_file to confirm coverage before coding.',
        ].join("\n"),
        inputSchema: zodToJsonSchema(initSchema),
      },
    ],
  };
});

// Register tool: call_tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "discover_ai_readmes") {
      const input = discoverSchema.parse(args) as DiscoverInput;
      const result = await discoverAIReadmes(input);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === "get_context_for_file") {
      const input = getContextSchema.parse(args) as GetContextInput;
      const result = await getContextForFile(input);
      return {
        content: [
          {
            type: "text",
            text: result.formattedPrompt,
          },
        ],
      };
    }

    if (name === "update_ai_readme") {
      const input = updateSchema.parse(args) as UpdateInput;
      const result = await updateAIReadme(input);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === "validate_ai_readmes") {
      const input = validateSchema.parse(args) as ValidateInput;
      const result = await validateAIReadmes(input);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === "init_ai_readme") {
      const input = initSchema.parse(args) as InitInput;
      const result = await initAIReadme(input);
      return {
        content: [
          {
            type: "text",
            text: result.instructions || JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("AI_README MCP Server started");
  console.error(
    "Available tools: discover_ai_readmes, get_context_for_file, update_ai_readme, validate_ai_readmes, init_ai_readme"
  );
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
