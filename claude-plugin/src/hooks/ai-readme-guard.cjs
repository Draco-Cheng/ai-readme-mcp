#!/usr/bin/env node
// PreToolUse guard — deny direct edits to AI_README.md files.
//
// Deliberately type:"command", NOT type:"mcp_tool". An mcp_tool hook degrades to a
// silent non-blocking error when the server is not connected, which would turn this
// gate off exactly when the MCP tools are unavailable — the worst possible failure
// mode for a rule whose whole job is to force traffic through those tools.

'use strict';

// Match the basename, so the guard covers AI_README.md at any depth on either
// platform. Splitting on both separators beats a regex character class here: a
// literal backslash inside a class needs four backslashes in a string literal,
// which is exactly the kind of escaping that silently decays into "[\/]" — a
// class holding only a forward slash, which stops guarding Windows paths.
const TARGET = /^AI_README\.md$/i;

function basename(p) {
  const parts = p.split(/[/\\]/);
  return parts[parts.length - 1];
}

// A hook that throws blocks nothing but still surfaces noise, so every failure path
// below falls through to a clean allow.
function allow() {
  process.stdout.write('');
  process.exit(0);
}

function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }));
  process.exit(0);
}

let raw = '';
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (e) {
    return allow();
  }

  const input = payload && payload.tool_input;
  if (!input) return allow();

  // Write/Edit use file_path; NotebookEdit uses notebook_path.
  const target = input.file_path || input.notebook_path;
  if (typeof target !== 'string' || !TARGET.test(basename(target))) return allow();

  deny(
    'AI_README.md is managed by the ai-readme-manager MCP server. Direct ' +
    (payload.tool_name || 'file') + ' edits bypass validation, conflict detection, ' +
    'token-budget checks and quality scoring.\n\n' +
    'Use update_ai_readme instead:\n' +
    '  update_ai_readme(projectRoot, path, operations)\n\n' +
    'Operations: append | prepend | replace | insert_after_section | ' +
    'insert_before_section | replace_all.\n' +
    'To reduce an over-budget file, call compress_ai_readme first.'
  );
});
