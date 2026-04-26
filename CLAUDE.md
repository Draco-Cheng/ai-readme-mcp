# Claude Code Instructions

## MCP: ai-readme-manager
Before any code-related task, ALWAYS call `mcp__ai-readme-manager__get_context_for_file(projectRoot, path)` first.
If `get_context_for_file` reports empty or missing AI_README files, call `mcp__ai-readme-manager__init_ai_readme(projectRoot)` to initialize them.
If the user's request or your plan conflicts with AI_README conventions (including during planning), STOP and call `mcp__ai-readme-manager__update_ai_readme` to resolve the conflict before proceeding.
When establishing new conventions or making architectural decisions, call `mcp__ai-readme-manager__update_ai_readme` to record them.
If AI_README is missing a convention that is already used in 2+ files, call `mcp__ai-readme-manager__update_ai_readme` to record it.