#!/usr/bin/env node
// Version lives in 6 places. package.json is the source of truth.
//
// The npx pin in claude-plugin/.mcp.json is the dangerous one: the other five
// only mislabel, but a stale pin makes every plugin user run an old server.

'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const json = (p) => JSON.parse(read(p));

const expected = json('package.json').version;

const checks = [
  ['clawhub/plugin/package.json', () => json('clawhub/plugin/package.json').version],
  ['clawhub/plugin/openclaw.plugin.json', () => json('clawhub/plugin/openclaw.plugin.json').version],
  ['claude-plugin/.claude-plugin/plugin.json', () => json('claude-plugin/.claude-plugin/plugin.json').version],
  ['clawhub/skills/SKILL.md', () => {
    const m = read('clawhub/skills/SKILL.md').match(/^version:\s*(\S+)/m);
    return m && m[1];
  }],
  ['claude-plugin/.mcp.json (npx pin)', () => {
    const args = json('claude-plugin/.mcp.json').mcpServers['ai-readme-manager'].args;
    const spec = args.find((a) => a.startsWith('ai-readme-mcp@'));
    return spec && spec.split('@').pop();
  }],
];

let failed = 0;
console.log('package.json version: ' + expected + '\n');

for (const [label, get] of checks) {
  let actual;
  try {
    actual = get();
  } catch (e) {
    actual = null;
  }
  const ok = actual === expected;
  if (!ok) failed++;
  console.log((ok ? 'ok  ' : 'DRIFT') + '  ' + label.padEnd(42) + (actual || '(not found)'));
}

if (failed) {
  console.error('\n' + failed + ' file(s) out of sync. Run: npm run version:sync');
  process.exit(1);
}
console.log('\nAll 6 in sync.');
