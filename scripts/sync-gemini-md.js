#!/usr/bin/env node

const fsp = require("node:fs/promises");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const outputPath = path.resolve(projectRoot, "GEMINI.md");
const workflowReferencePath = path.resolve(
	projectRoot,
	"skills",
	"lumia-plugin-codex-skill",
	"references",
	"workflow.md",
);
const contractsReferencePath = path.resolve(
	projectRoot,
	"skills",
	"lumia-plugin-codex-skill",
	"references",
	"manifest-capability-contracts.md",
);

function stripHeading(content) {
	return String(content || "").replace(/^\s*#\s+[^\n]+\n+/, "").trim();
}

async function readJson(filePath) {
	return JSON.parse(await fsp.readFile(filePath, "utf8"));
}

function buildContent({ version, generatedAt, workflowReference, contractsReference }) {
	const lines = [
		"# GEMINI.md",
		"",
		"<!-- GENERATED: scripts/sync-gemini-md.js -->",
		`- sdk_version: ${version}`,
		`- generated_at_utc: ${generatedAt}`,
		"",
		"Use this file as project guidance for Gemini CLI sessions working on Lumia Stream plugins.",
		"",
		"## Workflow",
		"",
		stripHeading(workflowReference),
		"",
		"## Manifest Capability Contracts",
		"",
		stripHeading(contractsReference),
		"",
		"## Validation Commands",
		"",
		"```bash",
		"npx lumia-plugin validate <plugin-dir>",
		"node skills/lumia-plugin-codex-skill/scripts/plugin-audit.js <plugin-dir> # optional when skill files are present",
		"npx lumia-plugin build <plugin-dir>",
		"```",
		"",
	];

	return lines.join("\n");
}

async function main() {
	const packageJson = await readJson(path.resolve(projectRoot, "package.json"));
	const version = packageJson.version;
	const generatedAt = new Date().toISOString();

	if (typeof version !== "string" || !version.trim()) {
		throw new Error("package.json version is missing or invalid.");
	}

	const workflowReference = await fsp.readFile(workflowReferencePath, "utf8");
	const contractsReference = await fsp.readFile(contractsReferencePath, "utf8");
	const content = buildContent({
		version,
		generatedAt,
		workflowReference,
		contractsReference,
	});

	await fsp.writeFile(outputPath, content, "utf8");

	console.log(`Synced Gemini instructions to ${path.relative(projectRoot, outputPath)} for v${version}`);
}

main().catch((error) => {
	console.error(error.message || error);
	process.exit(1);
});
