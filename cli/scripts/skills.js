#!/usr/bin/env node
const https = require("https");
const path = require("path");
const fs = require("fs");
const os = require("os");

const RAW_BASE = "https://raw.githubusercontent.com/lumiastream/Plugin-SDK/main";

const PROJECT_TOOL_FILES = {
	claude: [
		{
			remote:
				"skills/lumia-plugin-claude-skill/lumia-plugin-claude-skill.md",
			local: "CLAUDE.md",
		},
	],
	copilot: [
		{
			remote: ".github/copilot-instructions.md",
			local: ".github/copilot-instructions.md",
		},
	],
	gemini: [
		{
			remote: "GEMINI.md",
			local: "GEMINI.md",
		},
	],
	cursor: [
		{
			remote: ".cursor/rules/lumia-plugin-workflow.mdc",
			local: ".cursor/rules/lumia-plugin-workflow.mdc",
		},
		{
			remote: ".cursor/rules/lumia-plugin-manifest-contracts.mdc",
			local: ".cursor/rules/lumia-plugin-manifest-contracts.mdc",
		},
		{
			remote: "skills/lumia-plugin-codex-skill/scripts/plugin-audit.js",
			local: "scripts/plugin-audit.js",
		},
	],
};

const CODEX_TOOL_FILES = [
	{
		remote: "skills/lumia-plugin-codex-skill/SKILL.md",
		local: "skills/lumia-plugin-codex-skill/SKILL.md",
	},
	{
		remote: "skills/lumia-plugin-codex-skill/agents/openai.yaml",
		local: "skills/lumia-plugin-codex-skill/agents/openai.yaml",
	},
	{
		remote: "skills/lumia-plugin-codex-skill/scripts/plugin-audit.js",
		local: "skills/lumia-plugin-codex-skill/scripts/plugin-audit.js",
	},
	{
		remote: "skills/lumia-plugin-codex-skill/references/workflow.md",
		local: "skills/lumia-plugin-codex-skill/references/workflow.md",
	},
	{
		remote:
			"skills/lumia-plugin-codex-skill/references/manifest-capability-contracts.md",
		local:
			"skills/lumia-plugin-codex-skill/references/manifest-capability-contracts.md",
	},
	{
		remote: "skills/lumia-plugin-codex-skill/references/sdk-docs/INDEX.md",
		local: "skills/lumia-plugin-codex-skill/references/sdk-docs/INDEX.md",
	},
	{
		remote: "skills/lumia-plugin-codex-skill/references/sdk-docs/README.md",
		local: "skills/lumia-plugin-codex-skill/references/sdk-docs/README.md",
	},
	{
		remote:
			"skills/lumia-plugin-codex-skill/references/sdk-docs/docs__getting-started.md",
		local:
			"skills/lumia-plugin-codex-skill/references/sdk-docs/docs__getting-started.md",
	},
	{
		remote:
			"skills/lumia-plugin-codex-skill/references/sdk-docs/docs__manifest-guide.md",
		local:
			"skills/lumia-plugin-codex-skill/references/sdk-docs/docs__manifest-guide.md",
	},
	{
		remote:
			"skills/lumia-plugin-codex-skill/references/sdk-docs/docs__api-reference.md",
		local:
			"skills/lumia-plugin-codex-skill/references/sdk-docs/docs__api-reference.md",
	},
	{
		remote:
			"skills/lumia-plugin-codex-skill/references/sdk-docs/docs__field-types-reference.md",
		local:
			"skills/lumia-plugin-codex-skill/references/sdk-docs/docs__field-types-reference.md",
	},
	{
		remote:
			"skills/lumia-plugin-codex-skill/references/sdk-docs/docs__custom-overlays-interop.md",
		local:
			"skills/lumia-plugin-codex-skill/references/sdk-docs/docs__custom-overlays-interop.md",
	},
];

function printHelp() {
	console.log(`Install/update Lumia skills from GitHub.

Usage:
  npx lumia-plugin skills [options]
  npx lumia-plugin skills install [options]
  npx lumia-plugin skills list
  npx lumia-plugin skills <tool> [options]

Options:
  --target <path>      Project path to update (default: current directory)
  --tools <list>       Comma-separated: claude,copilot,gemini,cursor,codex
                       (default: claude,copilot,gemini,cursor,codex)
  --codex-home <path>  Codex home path used when tools include codex
                       (default: $CODEX_HOME or ~/.codex)
  --dry-run            Print planned updates without writing files
  --help, -h           Show this help

Examples:
  npx lumia-plugin skills
  npx lumia-plugin skills claude
  npx lumia-plugin skills copilot
  npx lumia-plugin skills gemini
  npx lumia-plugin skills cursor
  npx lumia-plugin skills codex
  npx lumia-plugin skills codex --codex-home "$CODEX_HOME"
  npx lumia-plugin skills --target ./my_plugin
  npx lumia-plugin skills --tools claude,copilot,gemini,cursor
  npx lumia-plugin skills --tools codex --codex-home "$CODEX_HOME"
`);
}

function printList() {
	console.log(`Available skill bundles:

- claude
  - CLAUDE.md

- copilot
  - .github/copilot-instructions.md

- gemini
  - GEMINI.md

- cursor
  - .cursor/rules/lumia-plugin-workflow.mdc
  - .cursor/rules/lumia-plugin-manifest-contracts.mdc
  - scripts/plugin-audit.js

- codex (installed into $CODEX_HOME or ~/.codex)
  - skills/lumia-plugin-codex-skill/*

Tip: run "npx lumia-plugin skills --dry-run" to preview all file changes.
`);
}

function parseArgs(argv) {
	const args = argv.slice(2);
	const defaultCodexHome = process.env.CODEX_HOME
		? path.resolve(process.env.CODEX_HOME)
		: path.join(os.homedir(), ".codex");
	const parsed = {
		action: "install",
		target: process.cwd(),
		tools: ["claude", "copilot", "gemini", "cursor", "codex"],
		codexHome: defaultCodexHome,
		dryRun: false,
	};

	if (args[0] === "list") {
		parsed.action = "list";
		args.shift();
	} else if (args[0] === "install") {
		args.shift();
	}

	const validTools = new Set(["claude", "copilot", "gemini", "cursor", "codex"]);
	const positionalTools = [];
	while (args.length && !args[0].startsWith("-") && validTools.has(args[0])) {
		positionalTools.push(args.shift());
	}
	if (positionalTools.length > 0) {
		parsed.tools = positionalTools;
	}

	for (let i = 0; i < args.length; i += 1) {
		const arg = args[i];
		if (arg === "--help" || arg === "-h") {
			parsed.action = "help";
			continue;
		}
		if (arg === "--dry-run") {
			parsed.dryRun = true;
			continue;
		}
		if (arg === "--target") {
			if (!args[i + 1]) {
				throw new Error("Expected a path after --target");
			}
			parsed.target = path.resolve(args[i + 1]);
			i += 1;
			continue;
		}
		if (arg === "--codex-home") {
			if (!args[i + 1]) {
				throw new Error("Expected a path after --codex-home");
			}
			parsed.codexHome = path.resolve(args[i + 1]);
			i += 1;
			continue;
		}
		if (arg === "--tools") {
			if (!args[i + 1]) {
				throw new Error("Expected a list after --tools");
			}
			parsed.tools = args[i + 1]
				.split(",")
				.map((item) => item.trim().toLowerCase())
				.filter(Boolean);
			i += 1;
			continue;
		}
		throw new Error(`Unknown argument: ${arg}`);
	}

	return parsed;
}

function fetchText(url, redirectCount = 0) {
	return new Promise((resolve, reject) => {
		const request = https.get(url, (response) => {
			const status = response.statusCode || 0;
			if ([301, 302, 307, 308].includes(status)) {
				if (redirectCount >= 5) {
					reject(new Error(`Too many redirects for ${url}`));
					return;
				}
				const location = response.headers.location;
				if (!location) {
					reject(new Error(`Redirect missing location for ${url}`));
					return;
				}
				response.resume();
				const nextUrl = new URL(location, url).toString();
				resolve(fetchText(nextUrl, redirectCount + 1));
				return;
			}

			if (status !== 200) {
				let errorBody = "";
				response.setEncoding("utf8");
				response.on("data", (chunk) => {
					errorBody += chunk;
				});
				response.on("end", () => {
					reject(
						new Error(
							`Request failed (${status}) for ${url}${
								errorBody ? `: ${errorBody.slice(0, 200)}` : ""
							}`
						)
					);
				});
				return;
			}

			let body = "";
			response.setEncoding("utf8");
			response.on("data", (chunk) => {
				body += chunk;
			});
			response.on("end", () => resolve(body));
		});

		request.on("error", reject);
	});
}

function validateTools(tools) {
	const valid = new Set(["claude", "copilot", "gemini", "cursor", "codex"]);
	for (const tool of tools) {
		if (!valid.has(tool)) {
			throw new Error(
				`Invalid tool "${tool}". Valid values: claude,copilot,gemini,cursor,codex`
			);
		}
	}
}

function buildPlan({ target, tools, codexHome }) {
	const plan = [];
	for (const tool of tools) {
		if (tool === "codex") {
			for (const file of CODEX_TOOL_FILES) {
				plan.push({
					tool,
					url: `${RAW_BASE}/${file.remote}`,
					destination: path.resolve(codexHome, file.local),
				});
			}
			continue;
		}

		for (const file of PROJECT_TOOL_FILES[tool] || []) {
			plan.push({
				tool,
				url: `${RAW_BASE}/${file.remote}`,
				destination: path.resolve(target, file.local),
			});
		}
	}
	return plan;
}

async function writePlan(plan, dryRun) {
	for (const item of plan) {
		console.log(`[${item.tool}] ${item.url} -> ${item.destination}`);
		if (dryRun) {
			continue;
		}
		const text = await fetchText(item.url);
		await fs.promises.mkdir(path.dirname(item.destination), { recursive: true });
		await fs.promises.writeFile(item.destination, text, "utf8");
	}
}

async function main() {
	const options = parseArgs(process.argv);

	if (options.action === "help") {
		printHelp();
		return;
	}
	if (options.action === "list") {
		printList();
		return;
	}

	validateTools(options.tools);
	const plan = buildPlan(options);
	if (!plan.length) {
		throw new Error("No files selected to update.");
	}

	await writePlan(plan, options.dryRun);

	if (options.dryRun) {
		console.log(`Dry run complete. ${plan.length} files planned.`);
		return;
	}
	console.log(`Updated ${plan.length} skills.`);
}

main().catch((error) => {
	console.error(`✖ Skills command failed: ${error.message || error}`);
	process.exit(1);
});
