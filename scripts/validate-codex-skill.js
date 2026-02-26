#!/usr/bin/env node

const fsp = require("node:fs/promises");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const skillRoot = path.resolve(
	projectRoot,
	"skills",
	"lumia-plugin-codex-skill",
);
const requiredFiles = [
	"SKILL.md",
	"agents/openai.yaml",
	"scripts/plugin-audit.js",
	"references/workflow.md",
	"references/manifest-capability-contracts.md",
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
			`Missing required codex skill files:\n${missing
				.map((entry) => `- ${entry}`)
				.join("\n")}`
		);
	}
}

function extractVersionFromIndex(indexContent) {
	const match = indexContent.match(/^- sdk_version:\s*(.+)\s*$/m);
	return match ? match[1].trim() : null;
}

function validateAuditScriptSyntax() {
	const auditPath = path.resolve(skillRoot, "scripts", "plugin-audit.js");
	const result = spawnSync(process.execPath, ["--check", auditPath], {
		stdio: "pipe",
		encoding: "utf8",
	});

	if (result.status !== 0) {
		throw new Error(
			[
				"`scripts/plugin-audit.js` failed syntax check.",
				result.stderr?.trim(),
				result.stdout?.trim(),
			]
				.filter(Boolean)
				.join("\n")
		);
	}
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
				"Codex skill snapshot version is out of date.",
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
	validateAuditScriptSyntax();
	await validateSnapshotVersion();

	console.log("Codex skill validation passed");
	console.log(`- Skill path: ${path.relative(projectRoot, skillRoot)}`);
}

main().catch((error) => {
	console.error(error.message || error);
	process.exit(1);
});
