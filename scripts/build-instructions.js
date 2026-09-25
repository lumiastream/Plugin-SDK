const fsp = require("node:fs/promises");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const sourcePath = "skills/shared/plugin-authoring.md";
const gptInstructionsPath = "gpt-knowledge/gpt-instructions";
const codexSkillPath = "skills/lumia-plugin-codex-skill/SKILL.md";
const codexContractsPath =
	"skills/lumia-plugin-codex-skill/references/manifest-capability-contracts.md";
const codexAuditScriptPath =
	"skills/lumia-plugin-codex-skill/scripts/plugin-audit.js";
const claudeSkillPath =
	"skills/lumia-plugin-claude-skill/lumia-plugin-claude-skill.md";

const GPT_INSTRUCTIONS_MAX_CHARS = 7500;
const VALID_TARGETS = new Set(["gpt", "core", "skill"]);
const skillDescription = (where = "") =>
	`Build, debug, validate, and package Lumia Stream plugins${where}. ` +
	"Use when requests involve `manifest.json`, plugin entry files (`main.js` / `main.ts`), capability contracts (AI/chatbot/mod commands/TTS voices/song requests/lights/plugs/themes), or `lumia-plugin` create/validate/build workflows.";
const generatedNotice = `<!-- GENERATED from ${sourcePath} by scripts/build-instructions.js. Edit the source, then run \`npm run package-docs\`. -->`;
const overview =
	"Develop Lumia plugins with fast feedback loops: scaffold from the best-fit example, implement hooks that match `manifest.json`, and validate before packaging.";

function codeFence(content, language = "") {
	const longestRun = Math.max(
		0,
		...(content.match(/`+/g) || []).map((run) => run.length),
	);
	const fence = "`".repeat(Math.max(3, longestRun + 1));
	return `${fence}${language}\n${content.replace(/\n+$/, "")}\n${fence}`;
}

function tidy(markdown) {
	return `${markdown
		.replace(/[ \t]+$/gm, "")
		.replace(/\n{3,}/g, "\n\n")
		.trim()}\n`;
}

function parseSections(source) {
	const chunks = source.split(/^## /m).slice(1);
	return chunks.map((chunk) => {
		const [titleLine, ...rest] = chunk.split("\n");
		const title = titleLine.trim();
		const firstContentIndex = rest.findIndex((line) => line.trim() !== "");
		const marker = rest[firstContentIndex] || "";
		const match = marker.match(/^<!--\s*targets:\s*([a-z\s,]+?)\s*-->$/);
		if (!match) {
			throw new Error(
				`Section "${title}" in ${sourcePath} must start with <!-- targets: ... -->`,
			);
		}
		const targets = new Set(match[1].split(/[\s,]+/).filter(Boolean));
		for (const target of targets) {
			if (!VALID_TARGETS.has(target)) {
				throw new Error(`Section "${title}" has unknown target "${target}"`);
			}
		}
		const body = rest.slice(firstContentIndex + 1).join("\n");
		return { title, targets, body };
	});
}

function renderBody(body, { includeDetail }) {
	const lines = [];
	let inDetail = false;
	for (const line of body.split("\n")) {
		const trimmed = line.trim();
		if (trimmed === "<!-- detail -->") {
			inDetail = true;
			continue;
		}
		if (trimmed === "<!-- /detail -->") {
			inDetail = false;
			continue;
		}
		if (inDetail && !includeDetail) {
			continue;
		}
		lines.push(line);
	}
	if (inDetail) {
		throw new Error(`Unclosed <!-- detail --> block in ${sourcePath}`);
	}
	return lines.join("\n").trim();
}

function renderSections(sections, { targets, includeDetail, vars = {} }) {
	const rendered = sections
		.filter((section) => targets.some((target) => section.targets.has(target)))
		.map(
			(section) =>
				`## ${section.title}\n\n${renderBody(section.body, { includeDetail })}`,
		)
		.join("\n\n");
	return rendered.replace(/\{\{(\w+)\}\}/g, (placeholder, name) => {
		if (!(name in vars)) {
			throw new Error(`No value for ${placeholder} in ${targets.join("/")} output`);
		}
		return vars[name];
	});
}

function findSection(sections, title) {
	const section = sections.find((entry) => entry.title === title);
	if (!section) {
		throw new Error(`Section "${title}" is missing from ${sourcePath}`);
	}
	return section;
}

async function loadSections() {
	const source = await fsp.readFile(path.resolve(projectRoot, sourcePath), "utf8");
	return parseSections(source);
}

function buildGptInstructions(sections) {
	const content = tidy(
		`# Lumia Plugin Builder\n\n${renderSections(sections, {
			targets: ["gpt"],
			includeDetail: false,
		})}`,
	);
	const size = Buffer.byteLength(content, "utf8");
	if (size > GPT_INSTRUCTIONS_MAX_CHARS) {
		throw new Error(
			`${gptInstructionsPath} is ${size} bytes (max ${GPT_INSTRUCTIONS_MAX_CHARS}). Move detail out of the gpt sections of ${sourcePath}.`,
		);
	}
	return content;
}

function buildCodexSkill(sections) {
	const body = renderSections(sections, {
		targets: ["skill", "core"],
		includeDetail: true,
		vars: {
			auditCommand:
				"`node scripts/plugin-audit.js <plugin-dir>` (capability-to-hook audit)",
		},
	});
	return tidy(`---
name: lumia-plugin-codex-skill
description: ${skillDescription(" in Codex Desktop")}
---

# Lumia Plugin Development For Codex

${generatedNotice}

${overview} Check field types against [references/sdk-docs/docs__field-types-reference.md](./references/sdk-docs/docs__field-types-reference.md) before editing \`config.settings\` or \`config.actions[].fields\`.

${body}

## Resources

- [scripts/plugin-audit.js](./scripts/plugin-audit.js): checks \`manifest.json\` capability flags against the hooks implemented in the plugin entry file.
- [references/workflow.md](./references/workflow.md): command-level workflow for scaffold, edit, validate, and build.
- [references/manifest-capability-contracts.md](./references/manifest-capability-contracts.md): the capability contract table on its own.
- [references/sdk-docs/INDEX.md](./references/sdk-docs/INDEX.md): SDK documentation snapshot (getting started, manifest guide, API reference, field types, overlay interop).
`);
}

function buildClaudeSkill(sections, auditScript) {
	const body = renderSections(sections, {
		targets: ["skill", "core"],
		includeDetail: true,
		vars: {
			auditCommand:
				"The capability audit script at the end of this file (`node /tmp/lumia-plugin-audit.js <plugin-dir>`)",
		},
	});
	return tidy(`---
description: ${skillDescription()}
---

# Lumia Plugin Development

${generatedNotice}

${overview} Full SDK docs: https://github.com/lumiastream/Plugin-SDK/tree/main/docs

${body}

## Capability Audit Script

When the user asks to audit or validate a plugin, write this script to \`/tmp/lumia-plugin-audit.js\` and run \`node /tmp/lumia-plugin-audit.js <plugin-dir>\`.

${codeFence(auditScript, "js")}
`);
}

function buildContractsReference(sections) {
	const render = (title) =>
		renderBody(findSection(sections, title).body, { includeDetail: true });
	return tidy(`# Manifest Capability Contracts

${render("Capability Contracts")}

## Runtime Constraints

${render("Runtime")}

## Validation Order

1. \`npx lumia-plugin validate <plugin-dir>\`
2. \`node skills/lumia-plugin-codex-skill/scripts/plugin-audit.js <plugin-dir>\`
3. Project-specific tests/type-check (if available)
`);
}

function buildRulesKnowledge(sections, exampleIndexMarkdown) {
	return tidy(`# Lumia Plugin Authoring Rules

The full rule set for building Lumia Stream plugins, followed by an index of every example plugin and the knowledge file that contains it.

${renderSections(sections, { targets: ["core"], includeDetail: true })}

${exampleIndexMarkdown}
`);
}

async function writeInstructionOutputs() {
	const sections = await loadSections();
	const auditScript = await fsp.readFile(
		path.resolve(projectRoot, codexAuditScriptPath),
		"utf8",
	);
	const outputs = [
		[gptInstructionsPath, buildGptInstructions(sections)],
		[codexSkillPath, buildCodexSkill(sections)],
		[codexContractsPath, buildContractsReference(sections)],
		[claudeSkillPath, buildClaudeSkill(sections, auditScript)],
	];
	for (const [relativePath, content] of outputs) {
		const absolutePath = path.resolve(projectRoot, relativePath);
		await fsp.mkdir(path.dirname(absolutePath), { recursive: true });
		await fsp.writeFile(absolutePath, content, "utf8");
		console.log(`Wrote ${relativePath} (${Buffer.byteLength(content, "utf8")} bytes)`);
	}
	return { sections, outputs };
}

module.exports = {
	buildRulesKnowledge,
	codeFence,
	loadSections,
	writeInstructionOutputs,
};
