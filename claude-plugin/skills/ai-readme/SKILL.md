---
name: ai-readme
description: Audit, compress, or restructure AI_README convention files. Use for /ai-readme, "audit conventions", "AI_README over budget", or deciding whether a convention is worth recording.
user-invocable: true
allowed-tools:
  - mcp__ai-readme-manager__get_context_for_file
  - mcp__ai-readme-manager__discover_ai_readmes
  - mcp__ai-readme-manager__validate_ai_readmes
  - mcp__ai-readme-manager__compress_ai_readme
  - mcp__ai-readme-manager__update_ai_readme
  - mcp__ai-readme-manager__init_ai_readme
---

# AI README Manager

Usage: `/ai-readme [audit|context <path>|init|fix]`

This skill does **not** reimplement the MCP tools. It supplies the two things the tools
cannot: the judgment call about what deserves recording, and the multi-step flows that
chain several tools together.

Never write to an AI_README with Write/Edit — a PreToolUse hook denies it. Route every
change through `update_ai_readme`.

---

## Judgment: is this worth recording?

Record only when **both** hold:

1. Used in 2+ files, and
2. Non-obvious — an AI reading the code alone would get it wrong.

| Record | Skip |
|---|---|
| `bcrypt` direct, NOT passlib | "We use async/await" |
| Tests via `tsx --test`, NOT vitest | Directory structure |
| ESM imports need `.js` extensions | Standard naming conventions |
| Shared temp dir breaks parallel tests | Framework defaults |

Keep the fact plus the *why*, but only when the why is what stops a future agent from
reverting it. Drop the how — where it lives, what toggles it, the step-by-step mechanism.
Those become a single `See <file>.` pointer.

One `- ` bullet is one fact. A run-on chaining facts with `;` or `then` is a wall; break
it into bullets rather than growing it.

---

## `audit`

1. `discover_ai_readmes(projectRoot)` — list every file.
2. `validate_ai_readmes(projectRoot)` — collect issues and token counts.
3. Report a table: path, token count, budget status, issues.
4. For each over-budget file, apply the decision tree below.
5. Never fix without showing the user the plan first.

## `fix` — over-budget decision tree

Check in this exact order; the dominant-section test wins over the section count.

1. **One section ≥40% of the file** → SPLIT that section into its own AI_README in the
   relevant subdirectory.
2. **Otherwise, ≥6 sections** → RESTRUCTURE: split the directory by feature. Needs
   explicit user confirmation, since it moves files.
3. **Otherwise** → REWRITE the file more densely.

Try `compress_ai_readme` first — it strips filler with deterministic regex only. On
already-tight content it cannot shrink further and will say so; that is the signal to
rewrite rather than compress again.

Over budget means over *target*, not over a hard cap. It is a nudge. Never drop a real
convention just to fit — if the file is genuinely over, cut redundant information rather
than squeezing the wording of facts worth keeping.

## `context <path>`

Call `get_context_for_file(projectRoot, path)` and follow what it returns. The
SessionStart hook already requires this before code tasks; this subcommand is for
inspecting a specific path on demand.

## `init`

Call `init_ai_readme(projectRoot)`, then review each generated file against the judgment
table above. Generated content skews toward the obvious — cut anything an AI could
re-derive from the code.
