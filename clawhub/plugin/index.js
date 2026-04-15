#!/usr/bin/env node
import { spawn } from 'child_process';

const proc = spawn('npx', ['-y', 'ai-readme-mcp@latest'], { stdio: 'inherit' });
proc.on('exit', (code) => process.exit(code ?? 0));
