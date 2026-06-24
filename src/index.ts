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
import {
  compressAIReadme,
  compressSchema,
  type CompressInput,
} from "./tools/compress.js";

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
    instructions: [
      "This server manages AI_README.md files that document project conventions for AI assistants.",
      "",
      "ALWAYS call get_context_for_file before any code-related task — editing, creating, reviewing, or suggesting changes to any file.",
      "",
      "If get_context_for_file reports empty or missing AI_README files, call init_ai_readme before proceeding.",
      "",
      "If the user's request or your plan conflicts with AI_README conventions (including during planning), STOP and call update_ai_readme to resolve the conflict before proceeding.",
      "",
      "When establishing new conventions or making architectural decisions, call update_ai_readme to record them.",
      "",
      "If AI_README is missing a convention used in 2+ files AND it is non-obvious (AI would get it wrong by reading the code alone), call update_ai_readme to record it — one short line, even after a big change, never a paragraph; fragments over sentences. Skip anything AI can re-derive from the code: directory structure, standard naming, framework defaults, generic test commands, exhaustive lists, per-file descriptions.",
      "",
      "NEVER edit AI_README.md files directly with Write/Edit/other file-editing tools — always use update_ai_readme. Direct edits bypass validation, conflict detection, and quality scoring.",
    ].join("\n"),
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
          '- User mentions: file name, component name, project, codebase, backend, frontend, infra, devops, CI/CD, docker, config.',
          '- User asks: "what can", "what should", "how to", "can you", "help me".',
          '- User wants to: create, build, add, implement, setup, configure, deploy, migrate, optimize, refactor, improve, analyze, review, suggest, think, opinion.',
          '- User selects an option that leads to code changes (e.g., choosing from a list of approaches).',
          '- User says: "next step", "next phase", "next section", "continue", "proceed", "go ahead", "start", "do it", "yes" (confirming action).',
          '- Before: Write, Edit, TodoWrite, Bash (for build/deploy), suggesting ANY code changes.',
          '- When executing a plan, todo, or multi-phase task: call BEFORE each file modification.',
          '- After user approves a plan or todo, call this BEFORE the each Write/Edit.',
          'IF ANY ABOVE = TRUE → CALL get_context_for_file IMMEDIATELY.',
          '',
          'MANDATORY: Call this tool BEFORE every code-related response.',
          '',
          'CALL EVERY TIME - EVERY response that involves code/suggestions MUST start with get_context_for_file.',
          'CALL EVERY TIME - even if you called it earlier in this conversation.',
          'CALL EVERY TIME - even if working on the same file.',
          'CALL EVERY TIME - even within the same section/phase - multiple calls are expected and correct.',
          'CALL EVERY TIME - context may have changed or sub-directories may have additional conventions.',
          'CALL EVERY TIME - when user confirms or selects an option that will result in code changes.',
          '',
          'What this tool does:',
          'Gets AI_README context showing project conventions that MUST be followed.',
          'Why it matters:',
          '- Without: Wrong tech (suggest Tailwind when project uses CSS Modules).',
          '- With: Suggestions fit existing codebase perfectly.',
          '- During plan/todo/phase execution: Context may differ per directory; call before EACH file change.',
          'DETECT CONFLICTS:',
          'After reading context, if user wants X but AI_README says Y:',
          '- This is ARCHITECTURAL DECISION.',
          '- Workflow: get_context → update_ai_readme → get_context → Write/Edit.',
          '',
          'RECORD DECISIONS:',
          'When you make architectural decisions during planning or implementation:',
          '- Design patterns, API structure, naming conventions, new abstractions.',
          '- Call update_ai_readme to record decisions that affect multiple files.',
          '- Future code (yours or others) will follow these recorded conventions.',
        ].join("\n"),
        inputSchema: zodToJsonSchema(getContextSchema),
      },
      {
        name: "update_ai_readme",
        description: [
          "CALL THIS to record DECISIONS and CONVENTIONS.",
          "",
          "WHEN TO CALL:",
          "",
          "A. CONFLICT RESOLUTION — STOP IMMEDIATELY when any of these occur:",
          '- User says: "don\'t use X", "use Y instead", "prefer", "switch to".',
          "- During planning: user's request or your proposal differs from AI_README conventions.",
          "- During planning: user approves a plan that contradicts AI_README.",
          "- User overrides a convention mid-task (even casually, e.g. 'just use X here').",
          "- DO NOT continue planning or coding. Call update_ai_readme first, then resume.",
          "",
          "B. ARCHITECTURAL DECISIONS (during planning/implementation):",
          "- You chose a design pattern (e.g., repository pattern, factory, singleton).",
          "- You decided on API structure (REST paths, error format, response shape).",
          "- You established naming conventions (files, functions, variables).",
          "- You created new abstractions (utilities, hooks, services, types).",
          "- You set up error handling strategy or validation approach.",
          "- You introduced a new dependency or integration pattern.",
          "",
          "C. IMPLEMENTATION PATTERNS (after writing code):",
          "- You created a reusable pattern others should follow.",
          "- You established a file/folder structure for a new feature.",
          "- You made decisions that affect future development.",
          "",
          "D. MISSING / UNDOCUMENTED (during get_context or code review):",
          "- AI_README is missing a convention that is ALREADY USED in 2+ existing files.",
          "- A pattern exists in code but not in AI_README — record it so future code follows it.",
          "- Do NOT record one-off choices or speculative future patterns.",
          "",
          "RULE: If a decision will affect MORE THAN ONE FILE or FUTURE CODE → RECORD IT.",
          "",
          "WORKFLOW:",
          "1. get_context (read current conventions).",
          "2. Make decision or detect conflict.",
          "3. update_ai_readme (record the decision).",
          "4. Continue with implementation.",
          "",
          "Content Rules:",
          "- Extremely concise (< 400 tokens).",
          "- Only actionable conventions (tech, naming, patterns, infrastructure patterns, testing patterns).",
          "- NO explanations or examples",
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
