#!/usr/bin/env node

// This is the CLI entry point for the global installation
// It uses tsx to run the TypeScript/TSX files

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the CLI file
const cliPath = join(__dirname, '..', 'src', 'cli.ts');

// Check if tsx is available
try {
  // Try to run the CLI with tsx
  const child = spawn('npx', ['tsx', cliPath], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  child.on('error', (error) => {
    console.error('Error running higharch:', error.message);
    console.error('Make sure tsx is installed: npm install -g tsx');
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
} catch (error) {
  console.error('Failed to start higharch:', error.message);
  console.error('Make sure tsx is installed: npm install -g tsx');
  process.exit(1);
} 