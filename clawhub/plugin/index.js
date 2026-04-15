#!/usr/bin/env node
import { spawn } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { name, version } = require('./package.json');

const proc = spawn('npx', ['-y', `${name}@${version}`], { stdio: 'inherit' });
proc.on('exit', (code) => process.exit(code ?? 0));
