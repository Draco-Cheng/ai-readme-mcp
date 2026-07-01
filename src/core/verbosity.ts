/**
 * Prompt verbosity for the MCP tool descriptions and server instructions.
 *
 * These strings ship in ListTools — sent to the model EVERY turn — so their size
 * is fixed at server startup. Verbosity is a single config knob in
 * .aireadme.config.json, read once at startup from the server's cwd:
 *
 *   high (default) — the full "CALL EVERY TIME" prompting. Best for smaller /
 *     less compliant models that need pushing to call the tools.
 *   medium — trimmed descriptions + get_context appends only a one-line
 *     reminder. Best for capable models where the extra tokens are pure cost.
 *
 * Values are neutral levels (verbosity high vs medium), not a good/bad choice.
 *
 * Caveat: the server's cwd must be the project root, and changing the value
 * needs a server restart (ListTools already shipped). Fine for the common
 * "one project = one MCP server" setup. Default high → no change for existing
 * installs.
 */

export type Verbosity = 'high' | 'medium';

const isVerbosity = (v: unknown): v is Verbosity => v === 'high' || v === 'medium';

/**
 * Resolve verbosity from the `.aireadme.config.json` value (may be undefined).
 * Anything not 'high'/'medium' → default 'high'.
 */
export function resolveVerbosity(configValue?: string): Verbosity {
  const v = configValue?.toLowerCase();
  return isVerbosity(v) ? v : 'high';
}

// ---------------------------------------------------------------------------
// Server instructions
// ---------------------------------------------------------------------------

const SERVER_INSTRUCTIONS_HIGH = [
  'This server manages AI_README.md files that document project conventions for AI assistants.',
  '',
  'ALWAYS call get_context_for_file before any code-related task — editing, creating, reviewing, or suggesting changes to any file.',
  '',
  'If get_context_for_file reports empty or missing AI_README files, call init_ai_readme before proceeding.',
  '',
  'If the user\'s request or your plan conflicts with AI_README conventions (including during planning), STOP and call update_ai_readme to resolve the conflict before proceeding.',
  '',
  'When establishing new conventions or making architectural decisions, call update_ai_readme to record them.',
  '',
  'Convention used in 2+ files AND non-obvious (AI\'d get it wrong from code alone) → call update_ai_readme to record it. Bulleted keywords, not prose; 1 "- " bullet = 1 fact (+why only if it stops reversion); fragments. Record only the fact AI can\'t see in code — not where it lives, what toggles it, or how it works (those → "See <file>."). A run-on chaining facts with ";"/"then" is a wall — break it into bullets, don\'t grow it.',
  '',
  'NEVER edit AI_README.md files directly with Write/Edit/other file-editing tools — always use update_ai_readme. Direct edits bypass validation, conflict detection, and quality scoring.',
].join('\n');

const SERVER_INSTRUCTIONS_MEDIUM = [
  'Manages AI_README.md files (project conventions for AI).',
  'Call get_context_for_file before code tasks; if it reports empty/missing files, call init_ai_readme.',
  'Record new conventions or conflicts with update_ai_readme (never edit AI_README.md directly — that bypasses validation).',
].join('\n');

export function serverInstructions(v: Verbosity): string {
  return v === 'medium' ? SERVER_INSTRUCTIONS_MEDIUM : SERVER_INSTRUCTIONS_HIGH;
}

// ---------------------------------------------------------------------------
// get_context_for_file description
// ---------------------------------------------------------------------------

const GET_CONTEXT_HIGH = [
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
].join('\n');

const GET_CONTEXT_MEDIUM = [
  'Get the AI_README conventions that apply to a file/dir. Call before editing, creating, or reviewing code so suggestions match the project.',
  'Returns the relevant root + directory AI_README content. Empty/missing → call init_ai_readme.',
  'If the user wants something that conflicts with the returned conventions, record the decision with update_ai_readme before proceeding.',
].join('\n');

export function getContextDescription(v: Verbosity): string {
  return v === 'medium' ? GET_CONTEXT_MEDIUM : GET_CONTEXT_HIGH;
}

// ---------------------------------------------------------------------------
// update_ai_readme description
// ---------------------------------------------------------------------------

const UPDATE_HIGH = [
  'CALL THIS to record DECISIONS and CONVENTIONS.',
  '',
  'WHEN TO CALL:',
  '',
  'A. CONFLICT RESOLUTION — STOP IMMEDIATELY when any of these occur:',
  '- User says: "don\'t use X", "use Y instead", "prefer", "switch to".',
  '- During planning: user\'s request or your proposal differs from AI_README conventions.',
  '- During planning: user approves a plan that contradicts AI_README.',
  '- User overrides a convention mid-task (even casually, e.g. \'just use X here\').',
  '- DO NOT continue planning or coding. Call update_ai_readme first, then resume.',
  '',
  'B. ARCHITECTURAL DECISIONS (during planning/implementation):',
  '- You chose a design pattern (e.g., repository pattern, factory, singleton).',
  '- You decided on API structure (REST paths, error format, response shape).',
  '- You established naming conventions (files, functions, variables).',
  '- You created new abstractions (utilities, hooks, services, types).',
  '- You set up error handling strategy or validation approach.',
  '- You introduced a new dependency or integration pattern.',
  '',
  'C. IMPLEMENTATION PATTERNS (after writing code):',
  '- You created a reusable pattern others should follow.',
  '- You established a file/folder structure for a new feature.',
  '- You made decisions that affect future development.',
  '',
  'D. MISSING / UNDOCUMENTED (during get_context or code review):',
  '- AI_README is missing a convention that is ALREADY USED in 2+ existing files.',
  '- A pattern exists in code but not in AI_README — record it so future code follows it.',
  '- Do NOT record one-off choices or speculative future patterns.',
  '',
  'RULE: If a decision will affect MORE THAN ONE FILE or FUTURE CODE → RECORD IT.',
  '',
  'WORKFLOW:',
  '1. get_context (read current conventions).',
  '2. Make decision or detect conflict.',
  '3. update_ai_readme (record the decision).',
  '4. Continue with implementation.',
  '',
  'Content Rules:',
  '- Extremely concise (default < 400 tokens; project may set a higher tokenBudget).',
  '- Only actionable conventions (tech, naming, patterns, infrastructure patterns, testing patterns).',
  '- NO explanations or examples',
].join('\n');

const UPDATE_MEDIUM = [
  'Record a project convention or architectural decision in AI_README.md.',
  'Call when: the user overrides a convention, you make a decision affecting 2+ files or future code, or AI_README is missing a convention already used in 2+ files.',
  'Content: bulleted keywords, not prose; 1 "- " = 1 non-obvious fact AI\'d get wrong from code (+why only if it stops reversion). Target < tokenBudget (default 400). No examples.',
].join('\n');

export function updateDescription(v: Verbosity): string {
  return v === 'medium' ? UPDATE_MEDIUM : UPDATE_HIGH;
}
