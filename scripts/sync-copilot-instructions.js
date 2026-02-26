#!/usr/bin/env node

const fsp = require("node:fs/promises");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const outputPath = path.resolve(projectRoot, ".github", "copilot-instructions.md");
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
		"# GitHub Copilot Instructions",
		"",
		"<!-- GENERATED: scripts/sync-copilot-instructions.js -->",
		`- sdk_version: ${version}`,
		`- generated_at_utc: ${generatedAt}`,
		"",
		"Use these instructions when developing Lumia Stream plugins in this repository or compatible plugin projects.",
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

	await fsp.mkdir(path.dirname(outputPath), { recursive: true });
	await fsp.writeFile(outputPath, content, "utf8");

	console.log(
		`Synced Copilot instructions to ${path.relative(projectRoot, outputPath)} for v${version}`
	);
}

main().catch((error) => {
	console.error(error.message || error);
	process.exit(1);
});
