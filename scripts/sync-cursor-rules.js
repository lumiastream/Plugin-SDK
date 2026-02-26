#!/usr/bin/env node

const fsp = require("node:fs/promises");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const cursorRulesDir = path.resolve(projectRoot, ".cursor", "rules");
const skillRoot = path.resolve(
	projectRoot,
	"skills",
	"lumia-plugin-codex-skill",
);
const workflowReferencePath = path.resolve(
	skillRoot,
	"references",
	"workflow.md",
);
const contractsReferencePath = path.resolve(
	skillRoot,
	"references",
	"manifest-capability-contracts.md",
);

function stripHeading(content) {
	return String(content || "").replace(/^\s*#\s+[^\n]+\n+/, "").trim();
}

function yamlQuote(value) {
	return JSON.stringify(String(value ?? ""));
}

function createMdc({ description, globs, body }) {
	const frontmatterLines = [
		"---",
		`description: ${yamlQuote(description)}`,
		"globs:",
		...globs.map((glob) => `  - ${yamlQuote(glob)}`),
		"alwaysApply: false",
		"---",
		"",
	];

	return `${frontmatterLines.join("\n")}${body.trim()}\n`;
}

async function readJson(filePath) {
	return JSON.parse(await fsp.readFile(filePath, "utf8"));
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

	await fsp.mkdir(cursorRulesDir, { recursive: true });

	const workflowBody = [
		"<!-- GENERATED: scripts/sync-cursor-rules.js -->",
		`> sdk_version: ${version}`,
		`> generated_at_utc: ${generatedAt}`,
		"",
		"# Lumia Plugin Workflow",
		"",
		"Use this rule when editing Lumia Stream plugins in this repository or similar plugin projects.",
		"",
		"Audit script note:",
		"- `npx lumia-plugin validate` is always available.",
		"- `node skills/lumia-plugin-codex-skill/scripts/plugin-audit.js <plugin-dir>` is optional and only works when the Codex skill files are present in the workspace.",
		"",
		stripHeading(workflowReference),
	].join("\n");

	const contractsBody = [
		"<!-- GENERATED: scripts/sync-cursor-rules.js -->",
		`> sdk_version: ${version}`,
		`> generated_at_utc: ${generatedAt}`,
		"",
		"# Manifest Capability Contracts",
		"",
		"Use this rule when changing `manifest.json`, `main.js`, `main.ts`, or hook methods.",
		"",
		"Audit script note:",
		"- Capability checks can be done with the optional Codex skill audit script when available.",
		"",
		stripHeading(contractsReference),
	].join("\n");

	const workflowRule = createMdc({
		description:
			"Lumia plugin workflow for scaffold, implementation, validation, and packaging.",
		globs: [
			"**/manifest.json",
			"**/main.js",
			"**/main.ts",
			"**/src/main.ts",
		],
		body: workflowBody,
	});

	const contractsRule = createMdc({
		description:
			"Manifest capability to runtime hook contract checks for Lumia plugins.",
		globs: [
			"**/manifest.json",
			"**/main.js",
			"**/main.ts",
			"**/src/main.ts",
		],
		body: contractsBody,
	});

	const workflowRulePath = path.resolve(
		cursorRulesDir,
		"lumia-plugin-workflow.mdc",
	);
	const contractsRulePath = path.resolve(
		cursorRulesDir,
		"lumia-plugin-manifest-contracts.mdc",
	);

	await fsp.writeFile(workflowRulePath, workflowRule, "utf8");
	await fsp.writeFile(contractsRulePath, contractsRule, "utf8");

	console.log(
		`Synced Cursor rules to ${path.relative(projectRoot, cursorRulesDir)} for v${version}`
	);
}

main().catch((error) => {
	console.error(error.message || error);
	process.exit(1);
});
