#!/usr/bin/env node

const fsp = require("node:fs/promises");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const instructionsPath = path.resolve(
	projectRoot,
	".github",
	"copilot-instructions.md",
);

async function readJson(filePath) {
	return JSON.parse(await fsp.readFile(filePath, "utf8"));
}

function extractVersion(content) {
	const match = content.match(/^- sdk_version:\s*(.+)\s*$/m);
	return match ? match[1].trim() : null;
}

async function main() {
	const packageJson = await readJson(path.resolve(projectRoot, "package.json"));
	const expectedVersion = packageJson.version;

	if (!fs.existsSync(instructionsPath)) {
		throw new Error(
			`Copilot instructions missing: ${path.relative(projectRoot, instructionsPath)}`
		);
	}

	const content = await fsp.readFile(instructionsPath, "utf8");
	if (!content.includes("<!-- GENERATED: scripts/sync-copilot-instructions.js -->")) {
		throw new Error("Copilot instructions missing generated marker.");
	}

	const version = extractVersion(content);
	if (!version) {
		throw new Error("Copilot instructions missing sdk_version metadata.");
	}
	if (version !== expectedVersion) {
		throw new Error(
			[
				"Copilot instructions are out of date.",
				`- package.json version: ${expectedVersion}`,
				`- instructions version: ${version}`,
				"Run `npm run sync:skills` and commit updated files.",
			].join("\n")
		);
	}

	console.log("Copilot instructions validation passed");
	console.log(`- File: ${path.relative(projectRoot, instructionsPath)}`);
}

main().catch((error) => {
	console.error(error.message || error);
	process.exit(1);
});
