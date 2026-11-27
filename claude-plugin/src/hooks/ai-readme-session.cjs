#!/usr/bin/env node
// SessionStart hook — inject the AI_README operating rules as standing context.
//
// A plugin cannot ship a CLAUDE.md (plugin-root CLAUDE.md is never loaded as project
// context). SessionStart stdout is injected instead, which is what makes these rules
// always-on without the user pasting anything into their own CLAUDE.md.

'use strict';

const fs = require('fs');
const path = require('path');

const RULES = [
  'AI_README CONVENTIONS ACTIVE (ai-readme plugin).',
  '',
  'Before any code-related task, call get_context_for_file(projectRoot, path) first.',
  'If it reports empty or missing AI_README files, call init_ai_readme(projectRoot).',
  'If the request or your plan conflicts with a recorded convention — including during',
  'planning — stop and call update_ai_readme to resolve it before proceeding.',
  'When establishing a new convention or architectural decision, call update_ai_readme.',
  'Convention used in 2+ files AND non-obvious (AI would get it wrong from code alone)',
  '→ call update_ai_readme to record it.',
  '',
  'Writing style: bulleted keywords, not prose. 1 "- " bullet = 1 fact (+why only if it',
  'stops reversion). Fragments. Record only the fact AI cannot see in code — not where it',
  'lives, what toggles it, or how it works (those → "See <file>."). A run-on chaining facts',
  'with ";"/"then" is a wall — break it into bullets, do not grow it.',
  '',
  'Never edit AI_README.md with Write/Edit. A PreToolUse hook denies those calls. Use',
  'update_ai_readme, which applies validation, conflict detection and quality scoring.',
];

let output = RULES.join('\n');

// Discovery nudge, shown at most once per project. A repo with no AI_README needs one
// prompt to get started; repeating it every session would be pure noise (and pure tokens).
try {
  const cwd = process.cwd();
  const marker = path.join(cwd, '.claude', '.ai-readme-nudge-shown');

  if (!fs.existsSync(marker) && !fs.existsSync(path.join(cwd, 'AI_README.md'))) {
    try {
      fs.mkdirSync(path.dirname(marker), { recursive: true });
      fs.writeFileSync(marker, '1');
    } catch (e) {
      // Read-only checkout: still worth nudging, just not worth remembering.
    }
    output += '\n\nNo AI_README.md at project root. Offer once to run ' +
      'init_ai_readme(projectRoot) so conventions persist across sessions.';
  }
} catch (e) {
  // Never block session start over a nudge.
}

process.stdout.write(output);
