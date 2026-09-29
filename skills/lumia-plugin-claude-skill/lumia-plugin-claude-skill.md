---
description: Build, debug, validate, and package Lumia Stream plugins. Use when requests involve `manifest.json`, plugin entry files (`main.js` / `main.ts`), capability contracts (AI/chatbot/mod commands/TTS voices/song requests/lights/plugs/themes), or `lumia-plugin` create/validate/build workflows.
---

# Lumia Plugin Development

<!-- GENERATED from skills/shared/plugin-authoring.md by scripts/build-instructions.js. Edit the source, then run `npm run package-docs`. -->

Develop Lumia plugins with fast feedback loops: scaffold from the best-fit example, implement hooks that match `manifest.json`, and validate before packaging. Full SDK docs: https://github.com/lumiastream/Plugin-SDK/tree/main/docs

## Workflow

1. Confirm the plugin root has `manifest.json`; the entry file is `manifest.main` or `main.js`. For a new plugin run `npx lumia-plugin create <name>`; for a feature, copy structure from the closest SDK example, then adapt.
2. Treat `manifest.json` as the source of truth. Read it first, then make every declared capability match its hooks (see Capability Contracts). Keep changes capability-focused; do not add unrelated settings or actions.
3. Validate in this order, fixing required issues before moving on:
   1. `npx lumia-plugin validate <plugin-dir>`
   2. The capability audit script at the end of this file (`node /tmp/lumia-plugin-audit.js <plugin-dir>`)
   3. Project type-check/tests when the plugin uses TypeScript or has them.
4. Package with `npx lumia-plugin build <plugin-dir> [--out <name>.lumiaplugin]` and confirm the output path and size.
5. Hand off with the files changed, the validation result, the package path, and remaining risks (untested provider APIs, auth, device reachability).

## Runtime

- Plugins run in an isolated Node.js runtime with no DOM. Never use `window`, `document`, `localStorage`, or `XMLHttpRequest`. Load packages with `require()`, not dynamic `import()`, and ship or bundle every third-party dependency.
- Put a timeout on every `fetch` in a polling path (`AbortController` or `Promise.race`). Keep one in-flight refresh lock, clear it in `finally`, and recover a stale lock.
- Retries use capped exponential backoff. When retries run out, call `this.lumia.updateConnection(false)` and stay offline until the next load or a settings update.
- Log errors and explicit user actions only. No custom log wrappers.
- Keep code simple. No test-only actions ("test connection", "refetch") and no testing toggles in settings.
- OAuth 2.0 needs Lumia to enable the server flow: tell the developer to contact Lumia Stream on Discord or email dev@lumiastream.com.
- Action parameters arrive on `action.value` inside `actions(config)`.
- Keep plugin `id` stable (letters, numbers, underscores) and `version` valid semver. Do not invent undocumented manifest fields.

## Manifest Fields

Every field `type` is a strict Lumia enum, not a JSON Schema type. Never output `"type": "string"`; use `text` (single line) or `textarea` (multi-line).

- Action fields (`config.actions[].fields[]`): `text`, `email`, `url`, `textarea`, `datetime`, `number`, `slider`, `select`, `checkbox`, `toggle`, `color`, `file`, `media`.
- Settings (`config.settings[]`): all of the above plus settings-only `password`, `named_map`, `json`, `roi`.
- Booleans use `toggle`. Multi-value selection uses `select` with `multiple: true`, whose value is always an array.
- Field objects use `key` (not `id`), `label` (not `name`), `defaultValue` (not `default`), `helperText` (not `description`). Options are `{ "label": "...", "value": "..." }`.
- `name` is valid only on top-level plugin metadata and `config.variables[]` entries. `description` is valid only on top-level metadata, action objects (`config.actions[]`), and `config.variableFunctions[]`. Neither belongs on a field.
- `defaultValue` matches the type: `number`/`slider` → number, `checkbox`/`toggle` → boolean, `json` → object or array, `roi` → `{ x, y, width, height, unit: "ratio" | "pixels" }`, `select` → scalar, or array with `multiple: true`.
- Template variables work only in action fields with `allowVariables: true`, never in settings.
- Before finalizing a manifest, re-check every field: valid type for its context, canonical keys, `defaultValue` shape. If the right type is unclear, ask instead of guessing.
- `dynamicOptions: true` does nothing until the plugin calls `this.lumia.updateActionFieldOptions(...)` or `this.lumia.updateSettingsFieldOptions(...)`.
- Fields hidden by `visibleIf` or `hidden: true` still arrive in the payload. Branch on the controlling field instead.
- Min/max: action fields use top-level `min`/`max`; settings use `validation.min`/`validation.max`.

## Variables And Alerts

- Do not prefix `config.variables` names with the app or plugin name; Lumia namespaces them. The exception: keys in action `acceptedVariables` and in `newlyPassedVariables` returned from `actions()` must be `<pluginId>_key`, or Lumia ignores them.
- Keep global variables few and durable. Per-action results go in `acceptedVariables`/`newlyPassedVariables`; per-event data goes in alert `extraSettings`.
- `triggerAlert`: `extraSettings` carries any key/value payload for templates, overlays, and runtime consumers. `dynamic` is only for `variationConditions` matching; if the alert has no variations, omit `dynamic`.
- Lumia merges `dynamic` into `extraSettings` (dynamic wins on conflicts), auto-prefixes alert keys as `<pluginId>-<alert>`, and strips `pluginId`, `platform`, `site`, `origin`, and `dynamic.name`.
- Set `showInEventList: true` only for platform or event-source plugins whose events belong in the Event List.

## Tutorials

Always ship a clear `settings_tutorial`, plus an `actions_tutorial` whenever the plugin has actions. Tutorials open in a rich reader (pop-out window, table of contents, code cards with copy and download), so write complete step-by-step guides, not summaries.

- Prefer a relative file (`"settings_tutorial": "./settings_tutorial.md"`) shipped in the package over long inline strings.
- Use `##`/`###` step headings; they become the table of contents.
- Tag code fences with a language (`ini`, `cpp`, `bash`, `javascript`, `typescript`, `json`, `yaml`, `xml`, `css`, `python`).
- Add `title="relative/path.ext"` (double quotes required) to fences that are real files. Each gets a Download button and the reader zips them all with their folder paths, so include complete, buildable files when the plugin pairs with firmware, scripts, or configs.
- Never put a `---` line anywhere, even inside a code fence; it splits tutorial sections.

## Capability Contracts

Every capability declared in `manifest.json` needs its runtime hooks. Treat this table as the minimum contract.

| Manifest signal | Required hook(s) | Recommended hook(s) | Notes |
| --- | --- | --- | --- |
| `config.actions` has entries | `actions(config)` | `onsettingsupdate(settings, previousSettings)` | Action types and field keys in runtime should match manifest definitions. |
| `config.hasAI: true` | `aiPrompt(config)` | `aiModels(config?)` | `aiModels` improves model picker UX. |
| `config.hasChatbot: true` | `chatbot(config)` | None | Lumia does not fall back to `actions()` for chatbot routing. |
| `config.modcommandOptions` has entries | `modCommand(type, value)` | None | Handle each declared moderation option defensively. |
| `config.variableFunctions` has entries | `variableFunction(config)` | None | Runs during template resolution: keep it fast, return a string or `{ value, variables }`. |
| `config.hasTtsVoices: true` | `ttsVoices(config?)`, `synthesizeTts({ voiceId, message, volume? })` | None | Throw on transient failures so Lumia keeps the last voice list; call `this.lumia.refreshTtsVoices()` after the API key changes. |
| `config.hasSongRequests: true` | None (intake-only sources need no hooks) | `resolveSongRequest(request)` when `songRequest.supportsSearch`; `playSongRequest(track)`, or `enqueueSongRequest(track)` + `removeSongRequest(track)` when `supportsQueue`; `skipSongRequest()`, `pauseSongRequest()`/`resumeSongRequest()`, `setSongRequestVolume(volume)` for each `supports*` flag | Report playback via `this.lumia.songRequestNowPlaying` / `songRequestEnded` / `updateSongRequestQueue`. Without `resolveSongRequest`, Lumia resolves metadata itself and matches reports by title. |
| `config.hasHeartrate: true` | None | None | Feed readings with `this.lumia.updateHeartRate(bpm)`. |
| `config.lights` exists | `onLightChange(config)` | `searchLights(config)`, `addLight(config)` | Discovery/manual-add is optional, but usually expected for onboarding. |
| `config.themeConfig` exists | `onLightChange(config)` | `searchThemes(config)` | Theme runs provide selected value in `config.rawConfig.theme`. |
| `config.plugs` exists | `onPlugChange(config)` | `searchPlugs(config)`, `addPlug(config)` | Discovery/manual-add is optional, but usually expected for onboarding. |
| `config.keylights` exists | `onKeylightChange(config)` | `searchKeylights(config)`, `addKeylight(config)` | Key lights (white, brightness + temperature) are treated like Elgato Key Lights; `state` carries `{ on?, brightness?, temperature? }`. |

## Isolation

- By default each plugin runs in its own worker thread inside a shared host process; plugins with native `.node` addons or Bluetooth (`acquireSharedNoble`) get a dedicated process automatically. Set manifest `"isolation": "process"` when native code can't be auto-detected (loaded from outside the plugin folder or downloaded at runtime) or the plugin relies on process-wide state (`process.chdir()`, signal handlers). Never set `"isolation": "shared"` unless every native addon is worker-safe (N-API / context-aware).

## Plugin + Overlay

- Plugins handle data collection, API calls, and business logic; Custom Overlays handle on-screen rendering and animation. When a request is visual (HUD, ticker, animated card, on-stream widget, chatbox visuals), offer to build both sides.
- The bridge is `this.lumia.setVariable(...)` for state and `this.lumia.triggerAlert(...)` with `extraSettings` for events. Always give an explicit contract table: variable keys the plugin writes and the overlay reads, alert keys, the `extraSettings` keys the overlay reads, `dynamic` only if variations need it, and a `codeId` if using `overlaycontent`.
- Overlay code uses `Overlay.on('alert' | 'chat' | 'hfx' | 'virtuallight' | 'overlaycontent', handler)`, branches on `data.alert`, and reads `data.extraSettings` (and `data.dynamic`). Use literal keys in `Overlay.getVariable('key')` / `Overlay.setVariable('key', value)`.
- `overlaycontent` is a targeted push via `this.lumia.overlaySendCustomContent({ layer, codeId, content })`; the overlay must match `codeId` (letters, numbers, hyphens, underscores, max 25 chars).
- The Overlay Config tab has its own field types (`input`, `dropdown`, `multiselect`, `colorpicker`, `fontpicker`, ...). Never mix them with plugin field enums.
- For full overlay code, write a starter snippet or hand off with a ready-to-paste prompt to the Lumia Custom Overlays Assistant (https://chatgpt.com/g/g-6760d2a59b048191b17812250884971b-lumia-custom-overlays-assistant). Docs: https://dev.lumiastream.com/docs/custom-overlays/custom-overlays-documentation

## Capability Audit Script

When the user asks to audit or validate a plugin, write this script to `/tmp/lumia-plugin-audit.js` and run `node /tmp/lumia-plugin-audit.js <plugin-dir>`.

```js
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
	"searchKeylights",
	"addKeylight",
	"onKeylightChange",
	"variableFunction",
	"ttsVoices",
	"synthesizeTts",
	"resolveSongRequest",
	"playSongRequest",
	"enqueueSongRequest",
	"removeSongRequest",
	"skipSongRequest",
	"pauseSongRequest",
	"resumeSongRequest",
	"setSongRequestVolume",
	"clearSongRequestQueue",
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

	if (Array.isArray(config.variableFunctions) && config.variableFunctions.length > 0) {
		rules.push({
			reason: "config.variableFunctions has entries",
			required: ["variableFunction"],
			recommended: [],
		});
	}

	if (config.hasTtsVoices === true) {
		rules.push({
			reason: "config.hasTtsVoices is true",
			required: ["ttsVoices", "synthesizeTts"],
			recommended: [],
		});
	}

	if (config.hasSongRequests === true) {
		const songRequest = config.songRequest || {};
		const recommended = [];
		if (songRequest.supportsSearch === true) recommended.push("resolveSongRequest");
		if (songRequest.supportsQueue === true) recommended.push("enqueueSongRequest", "removeSongRequest");
		else recommended.push("playSongRequest");
		if (songRequest.supportsSkip === true) recommended.push("skipSongRequest");
		if (songRequest.supportsPause === true) recommended.push("pauseSongRequest", "resumeSongRequest");
		if (songRequest.supportsVolume === true) recommended.push("setSongRequestVolume");
		rules.push({
			reason: "config.hasSongRequests is true",
			required: [],
			recommended,
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

	if (config.keylights && typeof config.keylights === "object") {
		rules.push({
			reason: "config.keylights exists",
			required: ["onKeylightChange"],
			recommended: ["searchKeylights", "addKeylight"],
			recommendedAny: [["searchKeylights", "addKeylight"]],
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
```
