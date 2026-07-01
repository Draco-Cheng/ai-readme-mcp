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
import { readFileSync, existsSync } from "fs";
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
import {
  compressAIReadme,
  compressSchema,
  type CompressInput,
} from "./tools/compress.js";
import {
  resolveVerbosity,
  serverInstructions,
  getContextDescription,
  updateDescription,
} from "./core/verbosity.js";

// Prompt verbosity is fixed at server startup: read `verbosity` from
// .aireadme.config.json at the server's cwd. Tool descriptions ship in
// ListTools before any tool call, so this is the one moment we can read it —
// hence cwd (not a per-call projectRoot). Sync read: startup only, once.
function readVerbosityFromCwd(): string | undefined {
  try {
    const cfgPath = join(process.cwd(), ".aireadme.config.json");
    if (!existsSync(cfgPath)) return undefined;
    const cfg = JSON.parse(readFileSync(cfgPath, "utf-8"));
    return (cfg.validation ?? cfg)?.verbosity;
  } catch {
    return undefined;
  }
}
const verbosity = resolveVerbosity(readVerbosityFromCwd());

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
    instructions: serverInstructions(verbosity),
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
        description: getContextDescription(verbosity),
        inputSchema: zodToJsonSchema(getContextSchema),
      },
      {
        name: "update_ai_readme",
        description: updateDescription(verbosity),
        inputSchema: zodToJsonSchema(updateSchema),
      },
      {
        name: "validate_ai_readmes",
        description:
          "Validate all AI_README.md files in a project. Checks token count, structure, and content quality. Returns validation results with suggestions for improvement.",
        inputSchema: zodToJsonSchema(validateSchema),
      },
      {
        name: "compress_ai_readme",
        description: [
          "Compress an AI_README.md file using deterministic filler-language removal (no LLM call).",
          "",
          "WHEN TO CALL:",
          "- validate_ai_readmes reports 'filler-language' warnings.",
          "- validate_ai_readmes reports token count is too high.",
          "- After init_ai_readme, to tighten up generated content.",
          "- Any time you want to reduce AI_README token footprint without losing information.",
          "",
          "WHAT IT DOES (pure text transforms, deterministic):",
          "- Removes filler: just, really, basically, actually, simply, essentially",
          "- Shortens verbose phrases: 'in order to' → 'to', 'utilize' → 'use', 'make sure to' → 'ensure'",
          "- Removes hedging: 'you should', 'remember to', 'it might be worth', 'please note that'",
          "- Removes fluff connectives: furthermore, additionally, in addition, moreover",
          "- NEVER modifies: code blocks (``` fenced), inline code (`...`), headings, file paths, URLs, commands",
          "- Output may contain sentence fragments — this is intentional. Fragments are valid token-efficient format.",
          "",
          "USE dryRun:true FIRST to preview changes before writing.",
        ].join("\n"),
        inputSchema: zodToJsonSchema(compressSchema),
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
          '- Run validate_ai_readmes to check for problems.',
          '- Fix any warnings (remove redundant content, add Cross-directory dependencies section).',
          '- Re-run get_context_for_file to confirm coverage before coding.',
        ].join("\n"),
        inputSchema: zodToJsonSchema(initSchema),
      },
    ],
  };
});

// Register tool: call_tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: rawArgs } = request.params;

  // Apply fallbacks for commonly missing required params
  const args = {
    ...rawArgs,
    projectRoot: (rawArgs as Record<string, unknown>)?.projectRoot ?? process.cwd(),
    ...(name === 'get_context_for_file' && !(rawArgs as Record<string, unknown>)?.path
      ? { path: '.' }
      : {}),
  };

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

    if (name === "compress_ai_readme") {
      const input = compressSchema.parse(args) as CompressInput;
      const result = await compressAIReadme(input);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
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
    "Available tools: discover_ai_readmes, get_context_for_file, update_ai_readme, validate_ai_readmes, init_ai_readme, compress_ai_readme"
  );
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
