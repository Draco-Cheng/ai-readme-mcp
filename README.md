# AI_README MCP Server

> Project memory for AI assistants — the conventions, traps, and hard-won lessons your code cannot tell them

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)

## 📑 Quick Navigation


- [AI_README vs. CLAUDE.md](#-ai_readme-vs-claudemd)
- [Installation & Setup](#-installation--setup)
  - [For Claude Code](#for-claude-code-vscode-extension)
  - [For Cursor](#for-cursor)
  - [For GitHub Copilot](#for-github-copilot-vscode-1102)
  - [For Claude Desktop](#for-claude-desktop-application)
  - [For OpenClaw](#for-openclaw)
  - [Alternative Installation Methods](#alternative-installation-methods)
- [Quick Start](#-quick-start)
- [Manual Creation & Editing](#️-manual-creation--editing)
- [Configuration (`.aireadme.config.json`)](#️-configuration-aireadmeconfigjson)
- [Validate & Compress AI_README Files](#️-validate--compress-ai_readme-files)
- [Multi-Level AI_README](#multi-level-ai_readme-not-just-for-monorepos)
- [Available MCP Tools](#️-available-mcp-tools)


---

## 📋 Overview

**AI_README MCP Server** is a Model Context Protocol (MCP) server that gives AI assistants a persistent, per-directory memory of your project — not just its coding conventions, but the silent-failure traps and post-mortem lessons that are invisible in the source. It discovers, routes, and manages `AI_README.md` files so that knowledge earned once is not lost, and the same bug is not reintroduced six months later.

**Works with:** GitHub Copilot (VSCode 1.102+), Claude Code, Cursor, OpenClaw, and other MCP-compatible AI tools.

---

## 🎯 The Problem

**Your AI assistant starts every session with no memory of the last one.**

It re-reads the code, re-derives what it can, and re-makes the same wrong call — because the reasoning that would have stopped it was never written anywhere it can see. You correct it. The session ends. The correction is gone.

Every project accumulates knowledge that **is not visible in the code**:

- 💣 **Hard-won lessons** - The code shows which library you use. It does not show the three you tried first, or why they failed.
- 🕳️ **Silent-failure traps** - Some mistakes throw no error. They just quietly stop working, and nobody notices for a week.
- ⚰️ **Deliberate oddities** - That duplicated-looking field, that extra `await`, that retry that seems unnecessary. Each one is load-bearing, and none of them look it.
- 🔁 **Mistakes that repeat** - The AI "cleans up" the workaround, reintroducing the exact bug it was working around.
- 🧠 **Knowledge that lives in one person's head** - and leaves with them.

An AI reading your code sees **what it does today**. It cannot see what you already tried, what broke, or why the obvious approach was rejected. So it confidently suggests the thing you learned not to do.

## 💡 The Solution

**AI_README.md** - a per-directory memory file that captures what the code cannot say.

It holds two kinds of knowledge:

- **Conventions** - the standards new code should follow
- **Scar tissue** - the traps, invariants, and post-mortem lessons that stop the same bug being reintroduced

### What actually gets recorded

You have probably had a version of this conversation with an AI assistant:

> **You:** This retry loop looks redundant, clean it up.
> **AI:** Done, simplified.
> *(three days later, the flaky upload bug is back)*

The loop was not redundant — it was working around a provider that returns `200` before the file is durable. That knowledge existed in a Slack thread and one engineer's memory. The AI could not see it, so it removed it. Next month, a different AI session will remove it again.

Everyday examples of what belongs in an AI_README:

| The situation | The line that prevents it |
|---|---|
| AI "simplifies" a workaround back into the bug it was avoiding | `Retry loop is required — provider returns 200 before the file is durable` |
| AI picks the library you already migrated off | `Use date-fns, NOT moment — moment mutates in place and caused the timezone bug` |
| AI adds a field the API silently ignores | `PATCH ignores unknown fields, returns 200 — always verify with a follow-up GET` |
| AI "fixes" an odd-looking sort | `NULLs sort last via a boolean key, never NULLS LAST — unsupported on SQLite` |
| AI removes a "pointless" `await` | `Must await — the handler commits, and the caller reads in the same transaction` |
| New AI session re-asks a question you answered last week | `Staging DB resets nightly at 03:00 UTC — do not debug data loss before checking the clock` |

The pattern is always the same: **something looks wrong but is deliberate**, and the reason lives outside the code. Written down once, it stops being rediscovered the hard way.

### Real entries from a production codebase

From a monorepo with 20 AI_README files across 5 directory levels. Each is terse by design — these are written for an AI to load, not for a human to browse:

**A mistake you cannot take back**

```
- Manifest `name` CANNOT be localized - browser fetches it once at install
  with no `Accept-Language`, and the installed home-screen name is frozen
```
> Ship it wrong and every existing install keeps the wrong name. No deploy fixes it.

**A change that succeeds and loses your data**

```
- `Order.items` needs a NEW list assigned - an in-place mutation is invisible
  to the ORM and silently dropped at flush
```
> The natural way to write it — appending to the list — throws no error and saves nothing.

**A one-line migration that logs everyone out**

```
- Column stays nullable, never backfilled - stamping the current time at
  deploy invalidates every existing session
```
> Looks like harmless data hygiene. Is actually a site-wide forced logout.

**A detail that changes what an AI does with the result**

```
- `search_products` returns the SKU list, not a count - given a bare count
  the model invents plausible SKUs that do not exist
```
> Found the way these things usually are: in production, in an incident review.

None of these are style rules, and none are discoverable by reading the code — the code shows the fix, never the failure that motivated it. Each line is a debugging session someone already paid for, written down so nobody pays twice.

### How It Works

1. **Create** `AI_README.md` files in your project (root or specific directories)
2. **Record** both conventions and hard-won lessons - especially anything that fails silently
3. **Commit to git** - the knowledge outlives the person who earned it
4. **AI pulls the relevant ones** before planning or editing - including during planning, before a file is opened
5. **AI writes back** - when you debug something together, the lesson gets recorded on the spot, through a validated channel

### What This MCP Server Does

This MCP (Model Context Protocol) server automates the entire workflow:

- 🔍 **Auto-discovers** all AI_README.md files in your project
- 🎯 **Routes context** - AI gets the relevant parent chain for the code it's editing
- 🚀 **Guided initialization** - `init_ai_readme` scans for empty files and guides AI through population
- ✏️ **Captures lessons in-flow** - the moment a trap is found, `update_ai_readme` records it
- ✅ **Reviews every write** - validation, conflict detection, and quality scoring on each update
- 🗜️ **Keeps it dense** - token budget enforcement with compression and splitting

**Result:** the same bug does not get reintroduced six months later by an AI that never saw the post-mortem.

---

## 🆚 AI_README vs. CLAUDE.md

> **"Can't I just write a CLAUDE.md?"** — For conventions, often yes. The difference is not the format; it is **where the knowledge comes from and how it gets written down**.

A CLAUDE.md is written by a human, deliberately, usually up front. That works well for rules you already know: which tools to call, how to run the tests, what the workflow is.

But the most valuable knowledge in a mature codebase is not knowable up front. Nobody sits down on day one and writes *"kube-proxy rewrites the source address before Traefik fills XFF, so `externalTrafficPolicy` must be `Local`"*. That is learned at 2am, and the person who learned it is the AI's pair — mid-session, hands dirty.

AI_README is built for that moment: the AI records the lesson as it is earned, through a channel that reviews the write.

| | CLAUDE.md | AI_README |
|---|---|---|
| **Typical content** | Instructions you know in advance | Lessons learned by breaking things |
| **Authored by** | Humans, deliberately, up front | AI, in-flow, at the moment of discovery |
| **Write path** | Free-form text editing | `update_ai_readme` only |
| **Review on write** | None | Validation + conflict detection + quality score |
| **Token budget** | Unmanaged — grows until it crowds out code | `tokenBudget`, with compress / split / rewrite |
| **Nesting** | Yes | Yes |
| **Subdirectory rules** | Not in context until you work in that directory | Retrieved on demand, for any path |

### Why a reviewed write path matters

A convention file that anyone can free-text edit degrades. Because updates go through `update_ai_readme`, every write is checked:

1. **Conflict detection** — if your request contradicts a recorded lesson, the AI **stops and asks** rather than quietly rewriting the rule. This is the one that matters most: it is what stops an AI from "fixing" a workaround back into the bug it was avoiding.
2. **Quality scoring** — each update returns a score and token count, so the file does not rot.
3. **Budget enforcement** — going over `tokenBudget` triggers compression or a split. Knowledge accumulates for years; without a budget it eventually crowds out the code you are trying to fit in context.

### Why on-demand retrieval matters

Both file types nest. The difference is *when* a subdirectory's rules reach the AI.

A quick experiment — a root `CLAUDE.md` plus `apps/frontend/CLAUDE.md` holding one rule, "use CSS Modules only":

**At session start, before opening anything:** the AI listed only the root file's contents. The frontend rule was not in context.

**Asked to plan a refactor of a file in that directory, without reading files first:** it could not name a styling approach — picking one "would be an invention", in its own words — and it listed *"whether `apps/frontend/` has its own CLAUDE.md"* among the things it would need to check. It inferred the file might exist but could not see inside it.

That is the gap. During planning, a rule one directory away is not yet shaping the plan. `get_context_for_file` takes a path and returns the full parent chain — sorted by distance, without opening a single source file — so a conflict surfaces while changing course is still cheap.

### Why this compounds

A convention file saves you from repeating yourself. A memory of what went wrong saves you from **repeating the outage**.

The difference shows up over time. Conventions are roughly fixed — you write them once and they stay true. Lessons accumulate for as long as the project lives, and each one is a bug that cannot come back the same way twice. A codebase with two years of recorded traps behaves differently under AI hands than one without: the assistant stops proposing the approach that was already tried and abandoned.

This matters more as AI takes on a larger share of the work. When most changes are drafted by an assistant, project stability depends less on any single model's reasoning and more on **whether the hard-won knowledge is reachable at the moment it is needed** — including by an AI that has never seen this codebase before, that will not remember today's session tomorrow, and that has no access to the Slack thread where the decision was made.

Conventions make AI output *consistent*. Recorded lessons make it *not regress*. The second one is what keeps a codebase stable as the number of hands on it — human and otherwise — goes up.

### Use both

They are not alternatives, and this project ships both. The rule that makes this server work — *"call `get_context_for_file` before any code-related task"* — lives in CLAUDE.md, because it is a behavioral instruction that must apply before any MCP tool runs. **CLAUDE.md drives the workflow; AI_README holds what the project taught you.**

---

## ✨ Features

- 🔍 **Automatic Discovery** - Scan and index all AI_README.md files in your project
- 🎯 **Smart Context Routing** - Find relevant README content based on file paths
- 🤝 **Team Consistency** - Every team member's AI assistant reads the same conventions from git, ensuring uniform code quality
- 🚀 **Guided Initialization** - `init_ai_readme` tool scans for empty files and guides AI through population
- 💣 **Captures Hard-Won Lessons** - records the trap the moment you hit it, so the fix is never quietly undone
- 🛑 **Conflict Detection** - if a request contradicts a recorded lesson, the AI stops and asks instead of overwriting it
- 🔄 **Update & Sync** - AI can both read and update AI_README files
- ✅ **Validation & Quality** - Ensure README consistency with token limits and structure checks
- 🗜️ **Auto-Compression** - `compress_ai_readme` removes filler language and verbose phrases automatically, reducing token footprint without losing information
- 🏗️ **Monorepo Support** - Place AI_README.md files at different folder levels; the tool automatically finds and uses the most relevant one
- 📦 **Easy Integration** - Works seamlessly with Cursor, Claude Code, and other MCP clients

---

## 🚀 Installation & Setup

### For Claude Code (VSCode Extension)

> **💡 Model Recommendation:** For the best experience, use larger models (Sonnet or Opus) which have stronger instruction-following capabilities and more reliably trigger MCP tools. Smaller models like Haiku may not consistently call the tools when appropriate.

**Step 1: Add MCP Server**

In your project directory, run:

```bash
claude mcp add --scope project ai-readme-manager npx -- ai-readme-mcp@latest
```

This creates a `.mcp.json` file that uses `npx` to run the package - no installation or path configuration needed!

**Step 2: Enable Project MCP Servers**

Create or edit `.claude/settings.local.json` in your project:

```json
{
  "enableAllProjectMcpServers": true
}
```

**Step 3: Auto-approve MCP Tools (Optional but Recommended)**

To avoid "Yes/No" prompts every time and enable "Yes, Do not ask again" option, add the tools to your allow list.

In `.claude/settings.local.json`, add:

```json
{
  "permissions": {
    "allow": [
      "mcp__ai-readme-manager__discover_ai_readmes",
      "mcp__ai-readme-manager__get_context_for_file",
      "mcp__ai-readme-manager__update_ai_readme",
      "mcp__ai-readme-manager__validate_ai_readmes",
      "mcp__ai-readme-manager__init_ai_readme",
      "mcp__ai-readme-manager__compress_ai_readme"
    ]
  },
  "enableAllProjectMcpServers": true
}
```

> **Note:** Without this configuration, you'll be prompted for approval every time Claude uses these tools, and the "Do not ask again" option won't appear.

**Step 4: Verify Installation**

```bash
claude mcp get ai-readme-manager
```

You should see `Status: ✓ Connected`

**Step 5: Add `CLAUDE.md` Instructions**

Add the following to your project's `CLAUDE.md` to ensure Claude consistently calls the MCP tools before every code task:

```markdown
## MCP: ai-readme-manager
Before any code-related task, ALWAYS call `mcp__ai-readme-manager__get_context_for_file(projectRoot, path)` first.
If `get_context_for_file` reports empty or missing AI_README files, call `mcp__ai-readme-manager__init_ai_readme(projectRoot)` to initialize them.
If the user's request or your plan conflicts with AI_README conventions (including during planning), STOP and call `mcp__ai-readme-manager__update_ai_readme` to resolve the conflict before proceeding.
When establishing new conventions or making architectural decisions, call `mcp__ai-readme-manager__update_ai_readme` to record them.
Convention used in 2+ files AND non-obvious (AI'd get it wrong from code alone) → call `mcp__ai-readme-manager__update_ai_readme` to record it. Bulleted keywords, not prose; 1 "- " bullet = 1 fact (+why only if it stops reversion); fragments. Record only the fact AI can't see in code — not where it lives, what toggles it, or how it works (those → "See <file>."). A run-on chaining facts with ";"/"then" is a wall — break it into bullets, don't grow it.
NEVER edit AI_README.md files directly with Write/Edit/other file-editing tools — always use `mcp__ai-readme-manager__update_ai_readme`. Direct edits bypass validation, conflict detection, and quality scoring.
```

> **Why this matters:** Without `CLAUDE.md`, Claude may skip calling the MCP tools, causing it to generate code that ignores your project's conventions. This step is essential for reliable tool triggering.

### For Cursor

Add to Cursor's MCP configuration file:
- **Windows:** `%APPDATA%\Cursor\User\mcp.json`
- **macOS/Linux:** `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "ai-readme-manager": {
      "command": "npx",
      "args": ["ai-readme-mcp@latest"]
    }
  }
}
```

After configuring, restart Cursor completely.

**Add `AGENTS.md` Instructions**

Add the following to your project's `AGENTS.md` to ensure Cursor consistently uses the MCP tools before every code task:

```markdown
## MCP: ai-readme-manager
Before any code-related task, ALWAYS call `get_context_for_file(projectRoot, path)` first.
If `get_context_for_file` reports empty or missing AI_README files, call `init_ai_readme(projectRoot)` to initialize them.
If the user's request or your plan conflicts with AI_README conventions (including during planning), STOP and call `update_ai_readme` to resolve the conflict before proceeding.
When establishing new conventions or making architectural decisions, call `update_ai_readme` to record them.
Convention used in 2+ files AND non-obvious (AI'd get it wrong from code alone) → call `update_ai_readme` to record it. Bulleted keywords, not prose; 1 "- " bullet = 1 fact (+why only if it stops reversion); fragments. Record only the fact AI can't see in code — not where it lives, what toggles it, or how it works (those → "See <file>."). A run-on chaining facts with ";"/"then" is a wall — break it into bullets, don't grow it.
NEVER edit AI_README.md files directly with Write/Edit/other file-editing tools — always use `update_ai_readme`. Direct edits bypass validation, conflict detection, and quality scoring.
```

### For GitHub Copilot (VSCode 1.102+)

**Requirements:**
- VSCode 1.102 or later
- GitHub Copilot & Copilot Chat extensions installed

**Option 1: Using VSCode Settings UI**

1. Open VSCode Settings (Ctrl+,)
2. Search for "MCP"
3. Click "Edit in settings.json"
4. Add the MCP server configuration

**Option 2: Manual Configuration**

Add to your VSCode `settings.json`:

```json
{
  "github.copilot.chat.mcp.servers": {
    "ai-readme-manager": {
      "command": "npx",
      "args": ["ai-readme-mcp@latest"]
    }
  }
}
```

After configuring, restart VSCode and you'll see the MCP tools available in GitHub Copilot Chat!

**Add `.github/copilot-instructions.md` Instructions**

Create `.github/copilot-instructions.md` in your project to ensure Copilot consistently uses the MCP tools before every code task:

```markdown
## MCP: ai-readme-manager
Before any code-related task, ALWAYS call `get_context_for_file(projectRoot, path)` first.
If `get_context_for_file` reports empty or missing AI_README files, call `init_ai_readme(projectRoot)` to initialize them.
If the user's request or your plan conflicts with AI_README conventions (including during planning), STOP and call `update_ai_readme` to resolve the conflict before proceeding.
When establishing new conventions or making architectural decisions, call `update_ai_readme` to record them.
Convention used in 2+ files AND non-obvious (AI'd get it wrong from code alone) → call `update_ai_readme` to record it. Bulleted keywords, not prose; 1 "- " bullet = 1 fact (+why only if it stops reversion); fragments. Record only the fact AI can't see in code — not where it lives, what toggles it, or how it works (those → "See <file>."). A run-on chaining facts with ";"/"then" is a wall — break it into bullets, don't grow it.
NEVER edit AI_README.md files directly with Write/Edit/other file-editing tools — always use `update_ai_readme`. Direct edits bypass validation, conflict detection, and quality scoring.
```

### For Claude Desktop Application

Add to `claude_desktop_config.json`:
- **Windows:** `%APPDATA%\claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/config.json`
- **Linux:** `~/.config/claude/config.json`

```json
{
  "mcpServers": {
    "ai-readme-manager": {
      "command": "npx",
      "args": ["ai-readme-mcp@latest"]
    }
  }
}
```

**Add `CLAUDE.md` Instructions**

Add the following to your project's `CLAUDE.md` to ensure Claude Desktop consistently uses the MCP tools before every code task:

```markdown
## MCP: ai-readme-manager
Before any code-related task, ALWAYS call `get_context_for_file(projectRoot, path)` first.
If `get_context_for_file` reports empty or missing AI_README files, call `init_ai_readme(projectRoot)` to initialize them.
If the user's request or your plan conflicts with AI_README conventions (including during planning), STOP and call `update_ai_readme` to resolve the conflict before proceeding.
When establishing new conventions or making architectural decisions, call `update_ai_readme` to record them.
Convention used in 2+ files AND non-obvious (AI'd get it wrong from code alone) → call `update_ai_readme` to record it. Bulleted keywords, not prose; 1 "- " bullet = 1 fact (+why only if it stops reversion); fragments. Record only the fact AI can't see in code — not where it lives, what toggles it, or how it works (those → "See <file>."). A run-on chaining facts with ";"/"then" is a wall — break it into bullets, don't grow it.
NEVER edit AI_README.md files directly with Write/Edit/other file-editing tools — always use `update_ai_readme`. Direct edits bypass validation, conflict detection, and quality scoring.
```

### For OpenClaw

> **Perfect for vibe coding / iterative AI development** — OpenClaw users often run AI agents in tight loops to build or refactor code. Without persistent context, each iteration risks breaking conventions set in previous rounds. `ai-readme-mcp` gives your agent a stable memory of project rules across every loop.

**Option 1: CLI (Recommended)**

```bash
openclaw mcp set ai-readme-manager '{"command":"npx","args":["ai-readme-mcp@latest"]}'
```

**Option 2: Edit config file directly**

Add to `~/.openclaw/openclaw.json`:

```json
{
  "mcp": {
    "servers": {
      "ai-readme-manager": {
        "command": "npx",
        "args": ["ai-readme-mcp@latest"]
      }
    }
  }
}
```

After configuring, restart OpenClaw to load the new MCP server. Verify with:

```bash
openclaw mcp list
```

**Add skill instructions**

To ensure OpenClaw's agent consistently reads project conventions before each code change, add the following to your skill or system prompt:

```markdown
## MCP: ai-readme-manager
Before any code-related task, ALWAYS call `get_context_for_file(projectRoot, path)` first.
If `get_context_for_file` reports empty or missing AI_README files, call `init_ai_readme(projectRoot)` to initialize them.
If the user's request or your plan conflicts with AI_README conventions (including during planning), STOP and call `update_ai_readme` to resolve the conflict before proceeding.
When establishing new conventions or making architectural decisions, call `update_ai_readme` to record them.
Convention used in 2+ files AND non-obvious (AI'd get it wrong from code alone) → call `update_ai_readme` to record it. Bulleted keywords, not prose; 1 "- " bullet = 1 fact (+why only if it stops reversion); fragments. Record only the fact AI can't see in code — not where it lives, what toggles it, or how it works (those → "See <file>."). A run-on chaining facts with ";"/"then" is a wall — break it into bullets, don't grow it.
NEVER edit AI_README.md files directly with Write/Edit/other file-editing tools — always use `update_ai_readme`. Direct edits bypass validation, conflict detection, and quality scoring.
```

> **Why this matters for iterative agents:** In agentic loops, each iteration is a fresh context. Without `AI_README.md`, the agent has no memory of decisions made in previous rounds — leading to style drift, conflicting patterns, and regressions. `ai-readme-mcp` acts as the persistent memory layer that keeps every loop grounded in the same conventions.

### Alternative Installation Methods

The above methods use `npx` (recommended). If you prefer other approaches, you can use these configurations in your MCP config file:
- **Claude Code:** `.mcp.json` (project root)
- **Cursor:** `%APPDATA%\Cursor\User\mcp.json` (Windows) or `~/.cursor/mcp.json` (macOS/Linux)
- **Claude Desktop:** `claude_desktop_config.json` (see paths above)

**Option 1: Using npx (Recommended)**

No installation needed! Just configure and use via npx:

```json
{
  "mcpServers": {
    "ai-readme-manager": {
      "command": "npx",
      "args": ["ai-readme-mcp@latest"]
    }
  }
}
```

> The `-y` flag automatically accepts the npx prompt. The `@latest` ensures you always get the newest version.

**Option 2: Global Installation**

Install once globally, use everywhere:

```bash
npm install -g ai-readme-mcp@latest
```

Then configure:

```json
{
  "mcpServers": {
    "ai-readme-manager": {
      "command": "ai-readme-mcp"
    }
  }
}
```

> **Pros:** Faster startup (no npx download). **Cons:** Need to manually update when new versions release.

> **Don't forget:** After configuring the MCP server, add the instructions file for your AI tool — see the setup section for your specific client above (`CLAUDE.md`, `AGENTS.md`, or `.github/copilot-instructions.md`).

---

## 🚀 Quick Start

Use the `init_ai_readme` tool to automatically scan and populate empty AI_README files:

**Step 1:** Create empty AI_README.md files where needed

```bash
# Example: Create empty AI_READMEs in different directories
touch AI_README.md
touch apps/backend/AI_README.md
touch apps/frontend/AI_README.md
```

**Step 2:** Trigger the initialization

In your AI assistant (Claude Code, Cursor, etc.), simply say:

> "Please use the init_ai_readme MCP tool for this project"

**What happens:**
- 🔍 Scans your project for empty AI_README files
- 📝 Creates root-level AI_README if none exist
- 📋 Provides detailed step-by-step instructions for each file
- 🤖 AI assistant will then:
  - Explore relevant directories
  - Analyze your codebase (tech stack, patterns, conventions)
  - Populate each AI_README with relevant documentation

**When to use `init_ai_readme`:**
- First time setting up AI_README in your project
- After creating new empty AI_README.md files in subdirectories
- When `get_context_for_file` detects empty AI_README files
- To batch-process multiple empty AI_README files

---

## ✏️ Manual Creation & Editing

You can always create and edit AI_README.md files yourself - **no tools required**. There's no required format; AI treats it as plain text, so even a single line works!

This is your project's documentation. Feel free to edit it anytime - whether you're setting up for the first time, adding new conventions, or correcting something the AI wrote.

**Simple examples that work perfectly:**

```markdown
Never use emoji in code or comments.
```

```markdown
Use Tailwind CSS, not inline styles.
Always use TypeScript strict mode.
```

```markdown
This is a Next.js 14 app with App Router.
Use server components by default.
Database: Prisma + PostgreSQL.
```

**Key point:** Write whatever helps AI understand your preferences. A few clear sentences are often better than lengthy documentation.

**Best Practices:**
- Keep it concise (< 400 tokens is ideal)
- Focus on conventions, not documentation
- Update as your project evolves - add new rules whenever you notice AI doing something wrong
- Review AI-made updates with `git diff AI_README.md` and edit freely
- Use AI to help maintain it, but you're always the final editor

---

## ⚙️ Configuration (`.aireadme.config.json`)

Most projects need no config — the defaults target tight, AI-optimized files (< 400 tokens). But large monorepos often have directories whose conventions genuinely don't compress that far. Drop a `.aireadme.config.json` at your project root to raise the budget:

```json
{
  "tokenBudget": 800
}
```

**`tokenBudget` is the single knob.** Set it and *everything* scales with it — the quality-score thresholds, the "drifting / needs-rewrite" nudges, and the numbers printed in the over-budget prompts. You don't set five numbers; you set one.

> **It's a target, not a hard cap.** A file is never rejected or truncated for going over `tokenBudget` — crossing it earns a light "tighten this up" nudge, and validation only flags an *error* at double the budget. So a 420-token file under an 800 budget is perfectly fine.

| Tier | Formula | @ 400 (default) | @ 800 |
|---|---|---|---|
| Excellent | ½ × tokenBudget | 200 | 400 |
| Good (the target) | 1 × tokenBudget | 400 | 800 |
| Warning | 1.5 × tokenBudget | 600 | 1200 |
| Error | 2 × tokenBudget | 800 | 1600 |

Omitting the file is identical to `{ "tokenBudget": 400 }` — existing projects see no change. Advanced overrides (`tokenLimits`, `rules`, `sectionSplitThreshold`) are still accepted and win over the derived values when set explicitly.

> Tip: prefer raising `tokenBudget` only when content is genuinely irreducible. If a single section dominates an over-budget file, the tool will suggest *splitting* it into a child-directory `AI_README.md` instead — that keeps each file tight without inflating the budget.

### Excluding directories

By default the scanner skips `node_modules`, `.git`, `dist`, `build`, `.next`, and `coverage`. To always ignore extra directories (e.g. generated code, a `legacy/` tree, or a `docs/` folder you don't want the agent to consult conventions for), add `excludePatterns`:

```json
{
  "excludePatterns": ["**/legacy/**", "**/docs/**"]
}
```

`excludePatterns` is a single "I don't care about this path" knob, applied two ways:

1. The scanner skips these directories (no AI_README inside them gets indexed).
2. `get_context_for_file` short-circuits when the file you're editing matches — no AI_README context (not even root) is injected. The tool returns a one-line note instead. This avoids forcing a heavy root AI_README on agents editing `docs/` or other non-code paths.

Built-in ignores (`node_modules` etc.) stay excluded on top of yours — you can't accidentally start scanning them. (Passing `excludePatterns` directly to a tool call still overrides the config for that one call.)

### Validation rules (optional)

Two rules are worth overriding for some teams:

```json
{
  "rules": {
    "allowCodeBlocks": true,
    "requireSections": ["## Conventions", "## Cross-directory dependencies"]
  }
}
```

- **`allowCodeBlocks`** (default `false`) — code fences are flagged by default because they burn tokens. Set `true` if a snippet genuinely belongs in your AI_README.
- **`requireSections`** (default none) — warn when a listed section heading is missing, e.g. to enforce a house template across every AI_README.

### Guidance level

The tool descriptions and the guidance appended to `get_context_for_file` are sent to the model **every turn**. If this server dominates your context budget, switch to `medium` — it trims the descriptions ~80% and drops the AI_README-writing guide from every read (that guidance still lives on `update_ai_readme`, where it's actually needed):

```json
{
  "guidanceLevel": "medium"
}
```

- **`high`** (default) — the full "call this every time" prompting. Best for smaller / less compliant models that need a push to call the tools.
- **`medium`** — much smaller footprint. Best for capable models (Opus/Sonnet) where the extra tokens are pure cost.

> **Read once at startup** from the `.aireadme.config.json` at the server's working directory, so a change needs a server restart to take effect. (Tool descriptions ship before any tool call, so this is the one setting read from cwd rather than a per-call `projectRoot`.) It only controls the server's prompt overhead — not what your AI_README files say or how validation behaves.

---

## 🗜️ Validate & Compress AI_README Files

Keep your AI_README files concise and token-efficient with a single prompt to your AI assistant:

> Validate and compress all AI_README files using `validate_ai_readmes` and `compress_ai_readme`.

The AI will automatically run the full cycle: `validate_ai_readmes` → `compress_ai_readme` (dry-run preview) → apply → re-validate.

---

## Multi-Level AI_README (Not Just for Monorepos!)

**The power of this tool is multi-level documentation** - not just for monorepos, but for **any project** that wants to organize conventions by module or feature.

**Why multi-level?**
- 🎯 **Avoid bloated root README** - Keep each README focused and concise
- 📍 **Precise context** - AI gets only the relevant conventions for the code it's working on
- 🔧 **Flexible organization** - Organize by feature, module, or any structure that makes sense

Simply place `AI_README.md` files at different folder levels:

```
my-monorepo/
├── AI_README.md                    # Root-level conventions (applies to all)
├── apps/
│   ├── frontend/
│   │   ├── AI_README.md           # Frontend-specific conventions
│   │   └── src/components/Button.tsx
│   └── backend/
│       ├── AI_README.md           # Backend-specific conventions
│       └── src/api/users.ts
└── packages/
    └── shared/
        ├── AI_README.md           # Shared library conventions
        └── src/utils.ts
```

**Smart Empty README Handling:**
- 📝 Create empty `AI_README.md` files in subdirectories where you need specific conventions
- 🚀 Run `init_ai_readme` tool (just tell your AI: "Please initialize AI_README files")
- 🤖 AI automatically analyzes each directory and populates conventions
- 🔗 For subdirectories with parent READMEs, generates differential content (only module-specific conventions)
- 📋 For root directories, generates full project analysis

When AI works on a file, it automatically gets:
- The **most relevant** AI_README (closest parent directory)
- Plus the **root-level** AI_README (for project-wide standards)

For example, when editing `apps/frontend/src/components/Button.tsx`:
- ✅ Gets `apps/frontend/AI_README.md` (React component standards)
- ✅ Gets root `AI_README.md` (project-wide Git, testing conventions)

### Test the Integration

Restart your IDE, then ask your AI assistant:

> "I'm about to create a new component. What conventions should I follow?"

The AI will automatically retrieve your AI_README context!

For detailed setup instructions, see [Quick Start Guide](./docs/QUICK_START.md).

---

## 🏗️ Project Structure

```
ai-readme-mcp/
├── src/
│   ├── index.ts           # MCP Server entry point
│   ├── tools/             # MCP Tools implementation
│   ├── core/              # Core logic (scanner, router, updater)
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── tests/
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── fixtures/          # Test fixtures
└── docs/                  # Documentation
```

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm/pnpm/yarn
- TypeScript 5+

### Setup

```bash
# Clone the repository
git clone https://github.com/Draco-Cheng/ai-readme-mcp.git
cd ai-readme-mcp

# Install dependencies
npm install

# Run type checking
npm run typecheck

# Run tests
npm test

# Build the project
npm run build

# Development mode with watch
npm run dev
```

### Local Development Configuration

If you're developing or modifying the source code, configure your MCP client to use your local build:

**For Claude Code - Add with CLI:**

```bash
# Linux/macOS:
claude mcp add --transport stdio ai-readme-manager --scope project -- node ~/ai-readme-mcp/dist/index.js

# Windows:
claude mcp add --transport stdio ai-readme-manager --scope project -- node C:\Users\YourName\ai-readme-mcp\dist\index.js
```

**For Claude Code - Manual `.mcp.json`:**

```json
{
  "mcpServers": {
    "ai-readme-manager": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/ai-readme-mcp/dist/index.js"]
    }
  }
}
```

**For Cursor or Claude Desktop:**

```json
{
  "mcpServers": {
    "ai-readme-manager": {
      "command": "node",
      "args": ["/absolute/path/to/ai-readme-mcp/dist/index.js"]
    }
  }
}
```

**Path examples:**
- **Windows:** `"C:\\Users\\YourName\\ai-readme-mcp\\dist\\index.js"` (use `\\` for escaping)
- **macOS/Linux:** `"/home/username/ai-readme-mcp/dist/index.js"`

---

## 📚 Documentation

- **[Quick Start Guide](./docs/QUICK_START.md)** - Get started in 10 minutes
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute
- [Project Specification](./docs/SPEC.md) - Complete technical specification

---

## 🛠️ Available MCP Tools

### `discover_ai_readmes`

Scans your project and discovers all AI_README.md files.

```typescript
// Parameters
{
  projectRoot: string;           // Required: Project root directory
  excludePatterns?: string[];    // Optional: Glob patterns to exclude
}

// Returns
{
  projectRoot: string;
  totalFound: number;
  readmeFiles: Array<{
    path: string;
    scope: string;
    level: number;
    patterns: string[];
  }>;
  lastUpdated: string;
}
```

### `get_context_for_file`

Gets relevant AI_README context for a specific file path.

```typescript
// Parameters
{
  projectRoot: string;           // Required: Project root directory
  filePath: string;              // Required: File path relative to root
  includeRoot?: boolean;         // Optional: Include root README (default: true)
  excludePatterns?: string[];    // Optional: Glob patterns to exclude
}

// Returns
{
  filePath: string;
  totalContexts: number;
  contexts: Array<{
    path: string;
    relevance: 'root' | 'direct' | 'parent';
    distance: number;
    content: string;
  }>;
  formattedPrompt: string;       // Ready-to-use formatted context
}
```

### `update_ai_readme`

Update an AI_README.md file with specified operations.

```typescript
// Parameters
{
  readmePath: string;            // Required: Path to AI_README.md file
  projectRoot: string;           // Required: Project root (config is read from here)
  operations: Array<{            // Required: Update operations to perform
    type: 'append' | 'prepend' | 'replace' | 'insert-after' | 'insert-before';
    content: string;             // Content to add or replace
    section?: string;            // Section heading (for insert operations)
    searchText?: string;         // Text to search for (for replace)
  }>;
}

// Returns
{
  success: boolean;
  readmePath: string;
  changes: Array<{
    operation: string;
    section?: string;
    linesAdded: number;
    linesRemoved: number;
  }>;
  summary: string;               // Includes reminder to use git diff
  error?: string;                // Error message if failed
}
```

**Note:** Changes are written directly to the file. Use Git for version control:
- Review changes: `git diff AI_README.md`
- Undo changes: `git checkout AI_README.md`
- Commit changes: `git add AI_README.md && git commit -m "Update AI_README"`

**Example Usage:**

```typescript
// Append new section
{
  readmePath: "apps/frontend/AI_README.md",
  operations: [{
    type: "append",
    content: "## Performance\n- Use React.memo for expensive components"
  }]
}

// Insert after specific section
{
  readmePath: "AI_README.md",
  operations: [{
    type: "insert-after",
    section: "## Coding Conventions",
    content: "### Code Style\n- Use TypeScript strict mode\n- Prefer const over let"
  }]
}

// Replace specific text
{
  readmePath: "AI_README.md",
  operations: [{
    type: "replace",
    searchText: "Run tests with npm test",
    content: "Run tests with: `npm test` or `npm run test:watch`"
  }]
}
```

### `init_ai_readme`

Initialize and populate empty AI_README files in your project.

```typescript
// Parameters
{
  projectRoot: string;             // Required: Project root directory
  excludePatterns?: string[];      // Optional: Glob patterns to exclude
  targetPath?: string;             // Optional: Specific directory to initialize
}

// Returns
{
  success: boolean;
  message: string;
  readmesToInitialize: string[];   // Paths to empty AI_README files
  instructions: string;            // Detailed step-by-step guide for populating
}
```

**Features:**
- 🔍 Scans project for empty or missing AI_README files
- 📝 Creates root-level AI_README if none exist
- 📋 Generates detailed step-by-step instructions for each file
- 🎯 Can target specific directories with `targetPath` parameter
- 🤖 Guides AI through analysis: tech stack, patterns, conventions

**Example Usage:**

```typescript
// Initialize all empty AI_READMEs in project
{
  projectRoot: "/path/to/project"
}

// Initialize only in specific directory
{
  projectRoot: "/path/to/project",
  targetPath: "apps/backend"
}
```

**Typical Workflow:**
1. AI assistant runs `init_ai_readme`
2. Receives detailed instructions for each empty file
3. Follows instructions:
   - Uses `Glob` to scan directory
   - Reads 2-5 key source files
   - Analyzes tech stack, patterns, conventions
4. Uses `update_ai_readme` to populate each file
5. Verifies with `get_context_for_file` or `validate_ai_readmes`

### `validate_ai_readmes`

Validate all AI_README.md files in your project for quality and token efficiency.

```typescript
// Parameters
{
  projectRoot: string;             // Required: Project root directory
  excludePatterns?: string[];      // Optional: Glob patterns to exclude
  config?: {                       // Optional: Custom validation config
    tokenBudget?: number;          // Single knob; derives the tiers below (default: 400)
    rules?: {
      requireH1?: boolean;
      requireSections?: string[];
      allowCodeBlocks?: boolean;
      maxLineLength?: number;
    };
    tokenLimits?: {
      excellent?: number;          // Default: 200
      good?: number;              // Default: 400
      warning?: number;           // Default: 600
      error?: number;             // Default: 800
    };
  };
}

// Returns
{
  valid: boolean;
  totalFiles: number;
  results: Array<{
    path: string;
    valid: boolean;
    tokens: number;
    rating: 'excellent' | 'good' | 'needs-improvement' | 'too-long';
    issues: string[];
    suggestions: string[];
  }>;
  summary: string;
}
```

**Validation Features**:
- Token counting for AI consumption optimization
- Structure validation (H1 heading, sections)
- Line length checks (default: 100 chars)
- Code block detection (disabled by default for strict mode)
- Quality ratings based on token count

**Default Token Limits (Strict Mode)**:
- 🌟 Excellent: < 200 tokens
- ✅ Good: < 400 tokens
- ⚠️ Needs improvement: < 600 tokens
- ❌ Too long: > 800 tokens

### `compress_ai_readme`

Compress an AI_README.md file using deterministic filler-language removal. No LLM call — pure regex transforms.

```typescript
// Parameters
{
  readmePath: string;    // Required: Absolute path to AI_README.md file
  projectRoot: string;   // Required: Project root (config is read from here)
  dryRun?: boolean;      // Optional: Preview changes without writing (default: false)
}

// Returns
{
  success: boolean;
  readmePath: string;
  summary: string;                  // Human-readable summary with token diff
  tokensBefore: number;
  tokensAfter: number;
  reductionPercent: number;
  changes: Array<{
    line: number;
    original: string;
    compressed: string;
    patterns: string[];             // Filler patterns that were removed
  }>;
  written: boolean;                 // false if dryRun or no changes found
}
```

**What it removes (prose only — code blocks are never touched):**
- Filler words: `just`, `really`, `basically`, `actually`, `simply`, `essentially`
- Verbose phrases: `in order to` → `to`, `utilize` → `use`, `make sure to` → `ensure`
- Hedging: `you should`, `remember to`, `it might be worth`, `please note that`
- Fluff connectives: `furthermore`, `additionally`, `in addition`, `moreover`

**Output may contain sentence fragments — this is intentional.** Token-efficient format is valid for AI_README files.

**Typical Workflow:**
1. Run `validate_ai_readmes` — note any `filler-language` warnings
2. Run `compress_ai_readme` with `dryRun: true` to preview
3. Run again without `dryRun` to apply
4. Re-run `validate_ai_readmes` to confirm improvement

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Resources

- [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Claude Code MCP Documentation](https://docs.claude.com/en/docs/claude-code/mcp)

## 📧 Contact

- GitHub Issues: https://github.com/Draco-Cheng/ai-readme-mcp/issues
- Project Link: https://github.com/Draco-Cheng/ai-readme-mcp
