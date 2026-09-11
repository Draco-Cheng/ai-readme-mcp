# AI_README — claude-plugin

Claude Code plugin: bundles the MCP server + hooks + skill. Separate from `clawhub/` (OpenClaw).

## Traps
- Hook scripts MUST be `.cjs` — root package.json is `"type": "module"`, so `.js` hooks die with `require is not defined`. `node --check` does NOT catch this (ignores module type).
- Guard hook is `type: "command"`, NOT `type: "mcp_tool"` — mcp_tool hooks degrade to a silent non-blocking error when the server is down, disabling the gate exactly when MCP tools are unreachable.
- Path match compares basename after splitting on both separators. A literal backslash in a regex char class needs 4 backslashes in a string literal and silently decays to `[\/]` (forward slash only) → stops guarding Windows paths.
- SessionStart stdout = plugin's CLAUDE.md substitute. Plugin-root CLAUDE.md is never loaded as project context.
- Hooks live inline in plugin.json `hooks` key, not a separate hooks.json.

## Conventions
- Every hook failure path falls through to allow — a hook that throws blocks nothing but still adds noise.
- Nudges write a marker file, shown once per project. Never nag every session.
- Skill delegates to MCP tools only; no reimplemented file logic, no Write/Edit in `allowed-tools`.
