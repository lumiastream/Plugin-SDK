#!/usr/bin/env node

const fsp = require("node:fs/promises");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const cursorRulesDir = path.resolve(projectRoot, ".cursor", "rules");
const requiredRules = [
	"lumia-plugin-workflow.mdc",
	"lumia-plugin-manifest-contracts.mdc",
];

async function readJson(filePath) {
	return JSON.parse(await fsp.readFile(filePath, "utf8"));
}

function extractVersion(content) {
	const match = content.match(/^> sdk_version:\s*(.+)\s*$/m);
	return match ? match[1].trim() : null;
}

function hasFrontmatter(content) {
	return /^---\n[\s\S]*?\n---\n/m.test(content);
}

function hasGeneratedMarker(content) {
	return content.includes("<!-- GENERATED: scripts/sync-cursor-rules.js -->");
}

async function main() {
	const packageJson = await readJson(path.resolve(projectRoot, "package.json"));
	const expectedVersion = packageJson.version;

	if (!fs.existsSync(cursorRulesDir)) {
		throw new Error(
			`Cursor rules folder not found: ${path.relative(projectRoot, cursorRulesDir)}`
		);
	}

	for (const ruleFile of requiredRules) {
		const rulePath = path.resolve(cursorRulesDir, ruleFile);
		if (!fs.existsSync(rulePath)) {
			throw new Error(`Missing Cursor rule: ${ruleFile}`);
		}

		const content = await fsp.readFile(rulePath, "utf8");
		if (!hasFrontmatter(content)) {
			throw new Error(`Missing MDC frontmatter in ${ruleFile}`);
		}
		if (!hasGeneratedMarker(content)) {
			throw new Error(`Missing generated marker in ${ruleFile}`);
		}

		const version = extractVersion(content);
		if (!version) {
			throw new Error(`Missing sdk_version metadata in ${ruleFile}`);
		}
		if (version !== expectedVersion) {
			throw new Error(
				[
						`Cursor rule snapshot is out of date in ${ruleFile}.`,
						`- package.json version: ${expectedVersion}`,
						`- rule version: ${version}`,
						"Run `npm run sync:skills` and commit updated rule files.",
					].join("\n")
				);
			}
	}

	console.log("Cursor rules validation passed");
	console.log(`- Rules path: ${path.relative(projectRoot, cursorRulesDir)}`);
}

main().catch((error) => {
	console.error(error.message || error);
	process.exit(1);
});
