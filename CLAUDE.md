# Claude Code Instructions

## MCP: ai-readme-manager
Before any code-related task, ALWAYS call `mcp__ai-readme-manager__get_context_for_file(projectRoot, path)` first.
If `get_context_for_file` reports empty or missing AI_README files, call `mcp__ai-readme-manager__init_ai_readme(projectRoot)` to initialize them.
If the user's request or your plan conflicts with AI_README conventions (including during planning), STOP and call `mcp__ai-readme-manager__update_ai_readme` to resolve the conflict before proceeding.
When establishing new conventions or making architectural decisions, call `mcp__ai-readme-manager__update_ai_readme` to record them.
If AI_README is missing a convention used in 2+ files AND it is non-obvious (AI would get it wrong by reading the code alone), call `mcp__ai-readme-manager__update_ai_readme` to record it as one line. Record nothing AI can re-derive from the code — directory structure, standard naming, framework defaults, generic test commands, exhaustive endpoint/field/file lists, per-file descriptions.
NEVER edit AI_README.md files directly with Write/Edit/other file-editing tools — always use `mcp__ai-readme-manager__update_ai_readme`. Direct edits bypass validation, conflict detection, and quality scoring.