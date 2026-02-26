#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const KNOWN_HOOKS = [
	"onload",
	"onunload",
	"onupdate",
	"onsettingsupdate",
	"actions",
	"aiPrompt",
	"aiModels",
	"chatbot",
	"modCommand",
	"searchLights",
	"addLight",
	"searchThemes",
	"onLightChange",
	"searchPlugs",
	"addPlug",
	"onPlugChange",
];

function hasMethod(source, name) {
	const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const patterns = [
		new RegExp(`\\b${escaped}\\s*\\(`), // class method or direct function declaration
		new RegExp(`\\b${escaped}\\s*:\\s*(async\\s+)?function\\b`), // object property function
		new RegExp(`\\b${escaped}\\s*=\\s*(async\\s*)?\\(`), // assigned arrow/function
	];

	return patterns.some((pattern) => pattern.test(source));
}

function parseJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function resolveMainPath(pluginDir, manifest) {
	const mainFile = typeof manifest.main === "string" ? manifest.main : "main.js";
	return {
		mainFile,
		mainPath: path.resolve(pluginDir, mainFile),
	};
}

function buildRules(manifest) {
	const config = manifest.config || {};
	const rules = [];

	if (Array.isArray(config.actions) && config.actions.length > 0) {
		rules.push({
			reason: "config.actions has entries",
			required: ["actions"],
			recommended: ["onsettingsupdate"],
		});
	}

	if (config.hasAI === true) {
		rules.push({
			reason: "config.hasAI is true",
			required: ["aiPrompt"],
			recommended: ["aiModels"],
		});
	}

	if (config.hasChatbot === true) {
		rules.push({
			reason: "config.hasChatbot is true",
			required: ["chatbot"],
			recommended: [],
		});
	}

	if (Array.isArray(config.modcommandOptions) && config.modcommandOptions.length > 0) {
		rules.push({
			reason: "config.modcommandOptions has entries",
			required: ["modCommand"],
			recommended: [],
		});
	}

	if (config.lights && typeof config.lights === "object") {
		rules.push({
			reason: "config.lights exists",
			required: ["onLightChange"],
			recommended: ["searchLights", "addLight"],
			recommendedAny: [["searchLights", "addLight"]],
		});
	}

	if (config.themeConfig && typeof config.themeConfig === "object") {
		rules.push({
			reason: "config.themeConfig exists",
			required: ["onLightChange"],
			recommended: ["searchThemes"],
		});
	}

	if (config.plugs && typeof config.plugs === "object") {
		rules.push({
			reason: "config.plugs exists",
			required: ["onPlugChange"],
			recommended: ["searchPlugs", "addPlug"],
			recommendedAny: [["searchPlugs", "addPlug"]],
		});
	}

	return rules;
}

function run() {
	const pluginDir = path.resolve(process.argv[2] || process.cwd());
	const manifestPath = path.join(pluginDir, "manifest.json");

	if (!fs.existsSync(manifestPath)) {
		console.error(`ERROR: manifest.json not found in ${pluginDir}`);
		process.exit(2);
	}

	let manifest;
	try {
		manifest = parseJson(manifestPath);
	} catch (error) {
		console.error(`ERROR: Failed to parse manifest.json (${error.message})`);
		process.exit(2);
	}

	const { mainFile, mainPath } = resolveMainPath(pluginDir, manifest);
	if (!fs.existsSync(mainPath)) {
		console.error(`ERROR: Entry file not found: ${mainFile}`);
		process.exit(2);
	}

	const source = fs.readFileSync(mainPath, "utf8");
	const implemented = new Set(
		KNOWN_HOOKS.filter((hook) => hasMethod(source, hook))
	);
	const rules = buildRules(manifest);
	const missingRequired = [];
	const missingRecommended = [];

	for (const rule of rules) {
		for (const hook of rule.required) {
			if (!implemented.has(hook)) {
				missingRequired.push(`${hook} (required because ${rule.reason})`);
			}
		}

		for (const hook of rule.recommended || []) {
			if (!implemented.has(hook)) {
				missingRecommended.push(
					`${hook} (recommended because ${rule.reason})`
				);
			}
		}

		for (const group of rule.recommendedAny || []) {
			const hasAny = group.some((hook) => implemented.has(hook));
			if (!hasAny) {
				missingRecommended.push(
					`${group.join(" or ")} (recommend at least one because ${rule.reason})`
				);
			}
		}
	}

	const uniqueRequired = Array.from(new Set(missingRequired));
	const uniqueRecommended = Array.from(new Set(missingRecommended));

	console.log("Lumia plugin audit");
	console.log(`- Plugin: ${pluginDir}`);
	console.log(`- Manifest: ${manifest.id || "(missing id)"}@${manifest.version || "(missing version)"}`);
	console.log(`- Entry: ${mainFile}`);
	console.log(
		`- Hooks found: ${
			implemented.size
				? Array.from(implemented).sort().join(", ")
				: "(none)"
		}`
	);

	if (!rules.length) {
		console.log("- Capability rules: none triggered");
	}

	if (uniqueRequired.length === 0) {
		console.log("PASS: No missing required hooks");
	} else {
		console.log("FAIL: Missing required hooks:");
		for (const item of uniqueRequired) {
			console.log(`  - ${item}`);
		}
	}

	if (uniqueRecommended.length > 0) {
		console.log("WARN: Missing recommended hooks:");
		for (const item of uniqueRecommended) {
			console.log(`  - ${item}`);
		}
	}

	process.exit(uniqueRequired.length > 0 ? 1 : 0);
}

run();
