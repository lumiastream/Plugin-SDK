---
description: Build, debug, validate, and package Lumia Stream plugins. Use when requests involve `manifest.json`, plugin entry files (`main.js` / `main.ts`), capability contracts (AI/chatbot/mod commands/lights/plugs/themes), or `lumia-plugin` create/validate/build workflows.
---

# Lumia Plugin Development

## Overview

Develop Lumia plugins with fast feedback loops: scaffold from the best-fit example, implement hooks that match `manifest.json`, and run validation before packaging.

## Quick Start

1. Identify plugin root and confirm `manifest.json` exists.
2. Run `npx lumia-plugin validate <plugin-dir>` to surface baseline errors.
3. Check the capability contracts table below before editing hook code.
4. Run the audit script (see below) to check capability-to-hook alignment.
5. Build package with `npx lumia-plugin build <plugin-dir> [--out <name>.lumiaplugin]`.

## Workflow

### 1. Choose a starting pattern

- For a net-new plugin, scaffold with `npx lumia-plugin create <name>`.
- For feature-specific work, copy structure from the nearest SDK example (`examples/`), then adapt.
- Keep changes minimal and capability-focused; do not add unrelated settings/actions.

### 2. Implement by manifest contract

- Treat `manifest.json` as the source of truth for runtime behavior.
- Add or update hook methods in the entry file to satisfy declared capabilities.
- Validate settings/actions field objects for required keys before runtime testing.
- Use the capability contracts table below for required and recommended hook coverage.

### 3. Validate aggressively

- Run CLI validation first: `npx lumia-plugin validate <plugin-dir>`.
- Run capability audit using the script below.
- If a plugin uses TypeScript, run project type-check/build before packaging.
- Fix required issues before continuing; treat recommended issues as product-quality improvements.

### 4. Package and handoff

- Build distributable: `npx lumia-plugin build <plugin-dir>`.
- Confirm output `.lumiaplugin` file path and size.
- Summarize changes by file and list any remaining risks (for example, untested provider APIs).

## Guardrails

- Target Node.js runtime behavior only; avoid browser-only APIs (`window`, `document`, `localStorage`, `XMLHttpRequest`).
- Keep plugin IDs stable and semver versions valid.
- Avoid inventing undocumented manifest fields.
- Prefer deterministic checks (CLI validation + audit script) over assumption-based approvals.

---

## Manifest Capability Contracts

Treat this table as the minimum contract between `manifest.json` and runtime hooks.

| Manifest signal | Required hook(s) | Recommended hook(s) | Notes |
| --- | --- | --- | --- |
| `config.actions` has entries | `actions(config)` | `onsettingsupdate(settings, previousSettings)` | Action types and field keys in runtime should match manifest definitions. |
| `config.hasAI: true` | `aiPrompt(config)` | `aiModels(config?)` | `aiModels` improves model picker UX. |
| `config.hasChatbot: true` | `chatbot(config)` | None | Route native chatbot calls through this hook. |
| `config.modcommandOptions` has entries | `modCommand(type, value)` | None | Handle each declared moderation option defensively. |
| `config.lights` exists | `onLightChange(config)` | `searchLights(config)`, `addLight(config)` | Discovery/manual-add is optional, but usually expected for onboarding. |
| `config.themeConfig` exists | `onLightChange(config)` | `searchThemes(config)` | Theme runs provide selected value in `config.rawConfig.theme`. |
| `config.plugs` exists | `onPlugChange(config)` | `searchPlugs(config)`, `addPlug(config)` | Discovery/manual-add is optional, but usually expected for onboarding. |

### Runtime constraints

1. Target Node.js runtime only.
2. Avoid browser APIs (`window`, `document`, `localStorage`, `XMLHttpRequest`).
3. Ship or bundle third-party dependencies with the plugin package.

### Validation order

1. `npx lumia-plugin validate <plugin-dir>`
2. Capability audit script (below)
3. Project-specific tests/type-check (if available)

---

## Capability Audit Script

When the user asks to audit or validate a plugin, write the following script to a temp file and run it:

```js
#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const KNOWN_HOOKS = [
	"onload","onunload","onupdate","onsettingsupdate",
	"actions","aiPrompt","aiModels","chatbot","modCommand",
	"searchLights","addLight","searchThemes","onLightChange",
	"searchPlugs","addPlug","onPlugChange",
];

function hasMethod(source, name) {
	const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return [
		new RegExp(`\\b${escaped}\\s*\\(`),
		new RegExp(`\\b${escaped}\\s*:\\s*(async\\s+)?function\\b`),
		new RegExp(`\\b${escaped}\\s*=\\s*(async\\s*)?\\(`),
	].some((p) => p.test(source));
}

function run() {
	const pluginDir = path.resolve(process.argv[2] || process.cwd());
	const manifestPath = path.join(pluginDir, "manifest.json");
	if (!fs.existsSync(manifestPath)) { console.error(`ERROR: manifest.json not found in ${pluginDir}`); process.exit(2); }
	const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
	const mainFile = typeof manifest.main === "string" ? manifest.main : "main.js";
	const mainPath = path.resolve(pluginDir, mainFile);
	if (!fs.existsSync(mainPath)) { console.error(`ERROR: Entry file not found: ${mainFile}`); process.exit(2); }
	const source = fs.readFileSync(mainPath, "utf8");
	const implemented = new Set(KNOWN_HOOKS.filter((h) => hasMethod(source, h)));
	const config = manifest.config || {};
	const rules = [];
	if (Array.isArray(config.actions) && config.actions.length) rules.push({ reason: "config.actions has entries", required: ["actions"], recommended: ["onsettingsupdate"] });
	if (config.hasAI === true) rules.push({ reason: "config.hasAI is true", required: ["aiPrompt"], recommended: ["aiModels"] });
	if (config.hasChatbot === true) rules.push({ reason: "config.hasChatbot is true", required: ["chatbot"], recommended: [] });
	if (Array.isArray(config.modcommandOptions) && config.modcommandOptions.length) rules.push({ reason: "config.modcommandOptions has entries", required: ["modCommand"], recommended: [] });
	if (config.lights && typeof config.lights === "object") rules.push({ reason: "config.lights exists", required: ["onLightChange"], recommended: ["searchLights","addLight"] });
	if (config.themeConfig && typeof config.themeConfig === "object") rules.push({ reason: "config.themeConfig exists", required: ["onLightChange"], recommended: ["searchThemes"] });
	if (config.plugs && typeof config.plugs === "object") rules.push({ reason: "config.plugs exists", required: ["onPlugChange"], recommended: ["searchPlugs","addPlug"] });
	const missingRequired = [], missingRecommended = [];
	for (const rule of rules) {
		for (const h of rule.required) if (!implemented.has(h)) missingRequired.push(`${h} (required because ${rule.reason})`);
		for (const h of rule.recommended) if (!implemented.has(h)) missingRecommended.push(`${h} (recommended because ${rule.reason})`);
	}
	console.log(`Lumia plugin audit\n- Plugin: ${pluginDir}\n- Entry: ${mainFile}\n- Hooks found: ${implemented.size ? [...implemented].sort().join(", ") : "(none)"}`);
	if (!missingRequired.length) console.log("PASS: No missing required hooks");
	else { console.log("FAIL: Missing required hooks:"); missingRequired.forEach((i) => console.log(`  - ${i}`)); }
	if (missingRecommended.length) { console.log("WARN: Missing recommended hooks:"); missingRecommended.forEach((i) => console.log(`  - ${i}`)); }
	process.exit(missingRequired.length ? 1 : 0);
}
run();
```

Write this to `/tmp/lumia-plugin-audit.js`, then run: `node /tmp/lumia-plugin-audit.js <plugin-dir>`
