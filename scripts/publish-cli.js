#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const cliDir = path.join(repoRoot, 'cli');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const forwardedArgs = process.argv.slice(2);
const npmArgs = ['publish', ...forwardedArgs];

const result = spawnSync(npmCommand, npmArgs, {
	cwd: cliDir,
	stdio: 'inherit'
});

if (result.error) {
	console.error('Failed to execute npm publish in cli directory:', result.error);
	process.exit(result.status ?? 1);
}

process.exit(result.status ?? 0);
