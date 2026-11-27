#!/usr/bin/env node
// Propagate package.json's version to the other 5 places.
// Run after `npm version`, which only rewrites package.json.

'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const p = (rel) => path.join(root, rel);
const version = JSON.parse(fs.readFileSync(p('package.json'), 'utf8')).version;

// Rewrite via regex rather than JSON.parse/stringify: these files are hand-edited
// and round-tripping them would reformat unrelated lines into the diff.
function sub(rel, pattern, replacement) {
  const file = p(rel);
  const before = fs.readFileSync(file, 'utf8');
  const after = before.replace(pattern, replacement);
  if (before === after) {
    console.log('unchanged  ' + rel);
    return;
  }
  fs.writeFileSync(file, after);
  console.log('updated    ' + rel);
}

const V = '"version": "' + version + '"';

sub('clawhub/plugin/package.json', /"version":\s*"[^"]+"/, V);
sub('clawhub/plugin/openclaw.plugin.json', /"version":\s*"[^"]+"/, V);
sub('claude-plugin/.claude-plugin/plugin.json', /"version":\s*"[^"]+"/, V);
sub('clawhub/skills/SKILL.md', /^version:\s*\S+/m, 'version: ' + version);
sub('claude-plugin/.mcp.json', /ai-readme-mcp@[^"]+/, 'ai-readme-mcp@' + version);

console.log('\nSynced to ' + version);
