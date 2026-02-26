#!/usr/bin/env node

const fsp = require("node:fs/promises");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const skillRoot = path.resolve(
	projectRoot,
	"skills",
	"lumia-plugin-claude-skill",
);
const requiredFiles = [
	"lumia-plugin-claude-skill.md",
	"references/sdk-docs/INDEX.md",
];

async function readJson(filePath) {
	const raw = await fsp.readFile(filePath, "utf8");
	return JSON.parse(raw);
}

async function ensureRequiredFiles() {
	const missing = [];

	for (const relPath of requiredFiles) {
		const absPath = path.resolve(skillRoot, relPath);
		if (!fs.existsSync(absPath)) {
			missing.push(relPath);
		}
	}

	if (missing.length > 0) {
		throw new Error(
			`Missing required claude skill files:\n${missing
				.map((entry) => `- ${entry}`)
				.join("\n")}`
		);
	}
}

function extractVersionFromIndex(indexContent) {
	const match = indexContent.match(/^- sdk_version:\s*(.+)\s*$/m);
	return match ? match[1].trim() : null;
}

async function validateSnapshotVersion() {
	const packageJson = await readJson(path.resolve(projectRoot, "package.json"));
	const expectedVersion = packageJson.version;
	const indexPath = path.resolve(skillRoot, "references", "sdk-docs", "INDEX.md");
	const indexContent = await fsp.readFile(indexPath, "utf8");
	const snapshotVersion = extractVersionFromIndex(indexContent);

	if (!snapshotVersion) {
		throw new Error(
			"`references/sdk-docs/INDEX.md` is missing `- sdk_version: <version>` metadata."
		);
	}

	if (snapshotVersion !== expectedVersion) {
		throw new Error(
			[
				"Claude skill snapshot version is out of date.",
				`- package.json version: ${expectedVersion}`,
				`- snapshot version: ${snapshotVersion}`,
				"Run `npm run sync:skills` and commit the updated files.",
			].join("\n")
		);
	}
}

async function main() {
	const skillStats = await fsp.stat(skillRoot).catch(() => null);
	if (!skillStats || !skillStats.isDirectory()) {
		throw new Error(`Skill root does not exist: ${skillRoot}`);
	}

	await ensureRequiredFiles();
	await validateSnapshotVersion();

	console.log("Claude skill validation passed");
	console.log(`- Skill path: ${path.relative(projectRoot, skillRoot)}`);
}

main().catch((error) => {
	console.error(error.message || error);
	process.exit(1);
});
