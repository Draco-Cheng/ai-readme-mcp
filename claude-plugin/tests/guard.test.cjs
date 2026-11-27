#!/usr/bin/env node
// Behavior tests for the PreToolUse guard.
//
// Windows paths must be written with String.raw: a plain 'D:\p\AI_README.md'
// literal silently drops the backslashes, which produced a passing-looking test
// against a path the guard never actually receives.

'use strict';

const { execFileSync } = require('child_process');
const path = require('path');
const R = String.raw;

const HOOK = path.join(__dirname, '..', 'src', 'hooks', 'ai-readme-guard.cjs');

function run(input) {
  return execFileSync('node', [HOOK], { input }).toString();
}

function verdict(tool, filePath) {
  const key = tool === 'NotebookEdit' ? 'notebook_path' : 'file_path';
  const out = run(JSON.stringify({ tool_name: tool, tool_input: { [key]: filePath } }));
  return out.includes('"deny"') ? 'DENY' : 'ALLOW';
}

const cases = [
  ['win backslash', 'Edit', R`D:\proj\AI_README.md`, 'DENY'],
  ['win nested', 'Write', R`D:\a\src\AI_README.md`, 'DENY'],
  ['win lowercase', 'Edit', R`D:\p\ai_readme.md`, 'DENY'],
  ['posix', 'Edit', '/home/p/AI_README.md', 'DENY'],
  ['bare name', 'Write', 'AI_README.md', 'DENY'],
  ['notebook_path', 'NotebookEdit', 'nb/AI_README.md', 'DENY'],
  ['win normal ts', 'Edit', R`D:\proj\src\index.ts`, 'ALLOW'],
  ['decoy prefix', 'Edit', R`D:\docs\MY_AI_README.md`, 'ALLOW'],
  ['plain README', 'Edit', 'README.md', 'ALLOW'],
  ['suffix decoy', 'Edit', 'AI_README.md.bak', 'ALLOW'],
];

let failed = 0;

for (const [label, tool, filePath, want] of cases) {
  const got = verdict(tool, filePath);
  const ok = got === want;
  if (!ok) failed++;
  console.log((ok ? 'ok  ' : 'FAIL') + '  ' + label.padEnd(16) + got);
}

// Malformed input must fall through to allow. A guard that throws blocks nothing
// but still floods the session with hook errors.
for (const [label, input] of [
  ['malformed', 'not json'],
  ['empty', ''],
  ['no tool_input', '{"tool_name":"Edit"}'],
]) {
  let ok;
  try {
    ok = !run(input).includes('"deny"');
  } catch (e) {
    ok = false;
  }
  if (!ok) failed++;
  console.log((ok ? 'ok  ' : 'FAIL') + '  ' + label.padEnd(16) + 'ALLOW (no crash)');
}

console.log('\n' + (cases.length + 3 - failed) + '/' + (cases.length + 3) + ' passed');
if (failed) process.exit(1);
