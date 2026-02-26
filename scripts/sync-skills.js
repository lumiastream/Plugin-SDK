#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const childScripts = [
	"sync-codex-skill.js",
	"sync-claude-skill.js",
	"sync-copilot-instructions.js",
	"sync-gemini-md.js",
	"sync-cursor-rules.js",
];

function runChild(scriptFileName) {
	const scriptPath = path.resolve(__dirname, scriptFileName);
	const result = spawnSync(process.execPath, [scriptPath], {
		cwd: projectRoot,
		stdio: "inherit",
	});

	if (result.error) {
		throw result.error;
	}

	if (typeof result.status === "number" && result.status !== 0) {
		process.exit(result.status);
	}
}

function main() {
	for (const scriptFileName of childScripts) {
		runChild(scriptFileName);
	}
}

try {
	main();
} catch (error) {
	console.error(`Failed to sync skills: ${error.message || error}`);
	process.exit(1);
}
