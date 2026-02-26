# Getting Started with Lumia Stream Plugin SDK

This guide walks you through creating your first Lumia Stream plugin from scratch using the SDK.

## Prerequisites

- Node.js 18 or newer
- Basic understanding of JavaScript
- The Lumia Stream desktop app for local testing

## SDK CLI Helpers

The repository ships simple helpers so you can bootstrap and package plugins without writing scripts yourself:

- `npx lumia-plugin create my_plugin` scaffolds the showcase template without cloning this repo (requires npm 7+).
- `npx lumia-plugin build ./path/to/plugin` runs the same build pipeline globally (optional `--out`).
- `npx lumia-plugin validate ./path/to/plugin` validates manifests without cloning the repo.

## AI Assistant Support (Optional)

Use the built-in assistant resources if you develop plugins in Codex Desktop, Claude, GitHub Copilot, Gemini CLI, or Cursor.

### Codex Desktop Skill

Location:

- `skills/lumia-plugin-codex-skill`

Install/download into Codex:

```bash
python3 "$CODEX_HOME/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo lumiastream/Plugin-SDK \
  --path skills/lumia-plugin-codex-skill
```

No-curl option (browser only):

1. Download [Plugin-SDK zip](https://github.com/lumiastream/Plugin-SDK/archive/refs/heads/main.zip).
2. Extract and copy `skills/lumia-plugin-codex-skill` into `$CODEX_HOME/skills/lumia-plugin-codex-skill`.
3. Restart Codex Desktop.

Restart Codex Desktop after installation.

Use in prompts:

- `$lumia-plugin-codex-skill`
- Example: `Use $lumia-plugin-codex-skill to validate my plugin manifest and hooks before packaging`

### Claude Skill

Location:

- `skills/lumia-plugin-claude-skill/lumia-plugin-claude-skill.md`

Install/download into another plugin project:

```bash
curl -L https://raw.githubusercontent.com/lumiastream/Plugin-SDK/main/skills/lumia-plugin-claude-skill/lumia-plugin-claude-skill.md \
  -o /path/to/your-plugin/CLAUDE.md
```

No-curl option (browser only):

1. Open [Claude skill file](https://raw.githubusercontent.com/lumiastream/Plugin-SDK/main/skills/lumia-plugin-claude-skill/lumia-plugin-claude-skill.md).
2. Save it as `CLAUDE.md` in your plugin root.

Use in Claude:

- Open your plugin project in Claude.
- Ask Claude to follow `CLAUDE.md` while building or validating the plugin.

### GitHub Copilot

Location:

- `.github/copilot-instructions.md`

Install/download into another plugin project:

```bash
mkdir -p /path/to/your-plugin/.github
curl -L https://raw.githubusercontent.com/lumiastream/Plugin-SDK/main/.github/copilot-instructions.md \
  -o /path/to/your-plugin/.github/copilot-instructions.md
```

No-curl option (browser only):

1. Open [Copilot instructions](https://raw.githubusercontent.com/lumiastream/Plugin-SDK/main/.github/copilot-instructions.md).
2. Save it as `.github/copilot-instructions.md` in your plugin project.

Use in Copilot:

- Open your plugin project in VS Code/GitHub with Copilot enabled.
- Copilot uses repo instructions automatically.

### Gemini CLI

Location:

- `GEMINI.md`

Install/download into another plugin project:

```bash
curl -L https://raw.githubusercontent.com/lumiastream/Plugin-SDK/main/GEMINI.md \
  -o /path/to/your-plugin/GEMINI.md
```

No-curl option (browser only):

1. Open [Gemini instructions](https://raw.githubusercontent.com/lumiastream/Plugin-SDK/main/GEMINI.md).
2. Save it as `GEMINI.md` in your plugin root.

Use in Gemini CLI:

- Run Gemini CLI from your plugin project root.
- Ask Gemini to follow `GEMINI.md` while building or validating the plugin.

### Cursor Rules

Location:

- `.cursor/rules/lumia-plugin-workflow.mdc`
- `.cursor/rules/lumia-plugin-manifest-contracts.mdc`

Install/download into another plugin project:

```bash
mkdir -p /path/to/your-plugin/.cursor/rules
cp .cursor/rules/lumia-plugin-*.mdc /path/to/your-plugin/.cursor/rules/
mkdir -p /path/to/your-plugin/scripts
cp skills/lumia-plugin-codex-skill/scripts/plugin-audit.js /path/to/your-plugin/scripts/plugin-audit.js
```

No-curl option (browser only):

1. Open [Cursor workflow rule](https://raw.githubusercontent.com/lumiastream/Plugin-SDK/main/.cursor/rules/lumia-plugin-workflow.mdc) and save as `.cursor/rules/lumia-plugin-workflow.mdc`.
2. Open [Cursor manifest rule](https://raw.githubusercontent.com/lumiastream/Plugin-SDK/main/.cursor/rules/lumia-plugin-manifest-contracts.mdc) and save as `.cursor/rules/lumia-plugin-manifest-contracts.mdc`.
3. Open [Audit script](https://raw.githubusercontent.com/lumiastream/Plugin-SDK/main/skills/lumia-plugin-codex-skill/scripts/plugin-audit.js) and save as `scripts/plugin-audit.js`.

Use in Cursor:

- Open your plugin project in Cursor.
- Rules load automatically when editing matching files.
- Run `node scripts/plugin-audit.js <plugin-dir>` only if you copied the audit script.

### Updating Later (No Full Redownload)

Use the updater script from this repo to pull only changed assistant files:

```bash
npm run update:assistant-files -- --target /path/to/your-plugin
```

Choose specific tools:

```bash
npm run update:assistant-files -- --target /path/to/your-plugin --tools claude,copilot,gemini,cursor
```

Update Codex Desktop skill files directly:

```bash
npm run update:assistant-files -- --tools codex --codex-home "$CODEX_HOME"
```

## 1. Project Setup

```bash
mkdir my_first_plugin
cd my_first_plugin
npm init -y
npm install @lumiastream/plugin
```

## 2. Create the Manifest

Create `manifest.json` with your plugin metadata and configuration options:

```json
{
	"id": "my_first_plugin",
	"name": "My First Plugin",
	"version": "1.0.0",
	"author": "Your Name",
	"email": "your.email@example.com",
	"description": "My first Lumia Stream plugin",
	"lumiaVersion": "^9.0.0",
	"category": "utilities",
	"config": {
		"settings": [
			{
				"key": "message",
				"label": "Custom Message",
				"type": "text",
				"defaultValue": "Hello from my plugin!",
				"helperText": "Used as the default message for the sample alert"
			}
		],
		"actions": [
			{
				"type": "trigger_alert",
				"label": "Trigger Alert",
				"description": "Trigger the sample alert",
				"fields": [
					{
						"key": "username",
						"label": "Username",
						"type": "text",
						"defaultValue": "Viewer"
					},
					{
						"key": "message",
						"label": "Message",
						"type": "text",
						"defaultValue": "Hello from my plugin!"
					}
				]
			}
		]
	}
}
```

Avoid test-only actions or settings. Focus on real user workflows.

## 3. Create the Main Plugin File

Create `src/main.js`:

```js
import { Plugin } from "@lumiastream/plugin";

export default class MyFirstPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this.interval = undefined;
	}

	async onload() {
		this.interval = setInterval(() => {
			const timestamp = new Date().toISOString();
			void this.lumia.setVariable("last_update", timestamp);
		}, 10000);
	}

	async onunload() {
		if (this.interval) {
			clearInterval(this.interval);
		}
	}

	async actions(config) {
		for (const action of config.actions) {
			if (action.type === "trigger_alert") {
				const params = action.value;
				const username =
					typeof params.username === "string" ? params.username : "Viewer";
				const message =
					typeof params.message === "string"
						? params.message
						: typeof this.settings.message === "string"
							? this.settings.message
							: "Hello!";

				await this.lumia.triggerAlert({
					alert: "custom-hello",
					extraSettings: { username, message },
				});
			}
		}
	}

	async onsettingsupdate(settings) {}
}
```

### Module Loading Note

Plugins run in an isolated **Node.js** process (not a browser). Use `require()` for external dependencies in runtime code (for example, `const api = require("some-lib")`). Avoid dynamic `import()` because the plugin runtime does not resolve browser-style module specifiers.

### What Works (Node)

- Node core modules (`fs`, `path`, `crypto`, etc.)
- Most npm packages that target Node
- Global `fetch` (Node 18+), including `AbortController`

### What Does Not Work (Browser APIs)

The runtime does **not** provide a DOM or browser globals. Avoid packages that require:

- `window`, `document`, `navigator`, `localStorage`, `sessionStorage`
- DOM APIs (`HTMLElement`, `CanvasRenderingContext2D`, etc.)
- Browser-only networking like `XMLHttpRequest`
- WebRTC, MediaDevices, or other browser-only APIs

If a package is browser-first, you should use a Node alternative.

### Dependency Packaging

Bundle or ship your dependencies with the plugin. Do **not** assume Lumia Stream provides third-party packages unless explicitly documented.

## 4. Validate and Test

```bash
npx lumia-plugin validate .
```

## Lights And Plugs Plugin Hooks (Optional)

If your plugin is a lights integration, implement these runtime hooks as needed:

- `searchLights()` to discover devices for auth UI selection
- `addLight(data)` for manual add flows
- `onLightChange(config)` to apply color/brightness/power updates
- `searchThemes()` to expose Studio theme options (scenes/effects/presets)
- `searchPlugs()` to discover plugs/accessories for auth UI selection
- `addPlug(data)` for manual plug add flows
- `onPlugChange(config)` to apply plug on/off updates

When Studio themes trigger your plugin, the selected theme value is available in `config.rawConfig.theme` inside `onLightChange`.

## Working with the Lumia API

### Variables

Do not prefix variable names with your plugin name. Lumia already namespaces them.

```js
// Set a variable
await this.lumia.setVariable("my_variable", "some value");
// Read a variable
const value = await this.lumia.getVariable("my_variable");
// Update a counter variable
const current = Number((await this.lumia.getVariable("counter")) ?? 0);
await this.lumia.setVariable("counter", current + 1);
```

### Shared Runtime Resources

When multiple plugins need the same heavy runtime (for example OpenCV), use shared resources so Lumia initializes it once in the plugin host process:

```js
const cv = await this.lumia.acquireShared("opencv.runtime", () => {
    return require("@lumiastream/opencv-runtime");
}, {
    dispose: (runtime) => runtime?.shutdown?.(),
});
// ...use cv...
await this.lumia.releaseShared("opencv.runtime");
```

Notes:

- The first plugin to acquire a key should provide a factory callback.
- Later plugins can call `acquireShared("opencv.runtime")` without a factory.
- Lumia automatically releases leftover references when a plugin unloads.

For Bluetooth plugins using `@abandonware/noble`, use the shared noble helper:

```js
const ble = await this.lumia.acquireSharedNoble();
await ble.waitForPoweredOn(15000);
const unsubscribe = ble.onDiscover((peripheral) => {
    // handle BLE peripheral discovery
});
await ble.startScanning({
    serviceUuids: ["180d"], // optional
    allowDuplicates: false,
});
// ... later
await ble.stopScanning();
unsubscribe();
await this.lumia.releaseSharedNoble();
```

`acquireSharedNoble()` defaults to key `bluetooth.runtime.noble.manager.v1`.

### HTTP Requests and Timeouts

Node 18+ ships with the global `fetch` API and `AbortController`. You can still use a timeout wrapper if preferred:

```js
const timeoutMs = 60000;
const timeoutPromise = new Promise((_, reject) => {
	setTimeout(() => reject(new Error("Request timed out")), timeoutMs);
});

const response = await Promise.race([fetch(url, options), timeoutPromise]);
if (!response || !response.ok) {
	const text = response ? await response.text() : "";
	throw new Error(
		`Request failed (${response?.status ?? "unknown"}): ${text || response?.statusText || "No response"}`,
	);
}
const data = await response.json();
```

Keep timeouts reasonable and avoid aggressive retries.

### Alerts

```js
await this.lumia.triggerAlert({
    alert: "follow",
    extraSettings: {
        username: "NewFollower",
        message: "Thanks for following!",
    },
});
await this.lumia.triggerAlert({
    alert: "my-custom-alert",
    dynamic: { value: "Viewer123" },
    extraSettings: { username: "Viewer123" },
});
```

`dynamic` is variation-only:

- Use `value` (string | number | boolean) for standard comparisons.
- For specialized comparisons, pass direct dynamic fields such as `giftAmount`, `subMonths`, `currency`, and `isGift`.
- Plugin-triggered alerts do not accept `dynamic.name`; it is stripped by the plugin runtime.
- Variation matching reads `dynamic`; `extraSettings` does not satisfy variation conditions.

Use `extraSettings` for everything else. `extraSettings` can contain any keys and is passed through as alert variables.

If the alert does not use `variationConditions`, omit `dynamic` and send only `extraSettings`.

If you want a plugin alert to appear in the Event List, opt in explicitly:

```js
await this.lumia.triggerAlert({
    alert: "my-custom-alert",
    showInEventList: true,
    extraSettings: {
        username: "Viewer123",
    },
});
```

Guideline: leave `showInEventList` off for most plugins. Turn it on mainly for platform/event-source plugins where stream events are expected in Event List.

### Chat Messages

```js
this.lumia.displayChat({
    username: "Viewer123",
    displayname: "Viewer123",
    message: "Hello from the plugin!",
    avatar: "https://example.com/avatar.png",
    userLevels: {
        mod: true,
        follower: true,
    },
    emotesRaw: JSON.stringify([
        { id: "wave", url: "https://example.com/emotes/wave.webp", start: 6, end: 9 },
    ]),
    skipCommandProcessing: false,
});
```

`displayChat` posts a message to Lumia Stream chatboxes and overlay chat widgets.

For emotes, use `emotesRaw` with the common plugin JSON format:

- `[{ id?: string, url?: string, urls?: string[], start: number, end: number }]`
- or `{ emotes: [...] }`

`start`/`end` are inclusive character offsets in `message`.
Use top-level `skipCommandProcessing` to show a message in chat without triggering commands.

If your plugin should appear as an AI provider in Lumia (similar to ChatGPT/DeepSeek), declare AI support in `manifest.json`:

```json
{
	"config": {
		"hasAI": true
	}
}
```

Implement runtime handlers:

```js
async aiPrompt(config) {
	// config.message, config.model, config.thread, config.username, ...
	return "AI response text";
}

async aiModels() {
	// Return strings or { value, name } objects
	return [{ value: "gpt-oss:20b", name: "gpt-oss:20b" }];
}
```

If your plugin should appear as a selectable chatbot platform in Lumia commands, declare chatbot support in `manifest.json`:

```json
{
	"config": {
		"hasChatbot": true
	}
}
```

You can also implement a native runtime handler:

```js
async chatbot(config) {
	// config.message, config.userToChatAs, config.color, etc.
	return true;
}
```

For Dashboard/API moderation actions, declare supported commands and implement a handler:

```json
{
	"config": {
		"modcommandOptions": ["delete", "ban", "timeout"]
	}
}
```

```js
async modCommand(type, value) {
	// type: "delete" | "ban" | ...
	// value: { username, message, reason, duration, ... }
	return true;
}
```

### File Operations

```js
const content = await this.lumia.readFile("data.txt");
if (typeof content === "string") {
    await this.lumia.writeFile({
        path: "output.txt",
        message: content.toUpperCase(),
    });
}
```

### Networking

Node.js 18+ ships with the global `fetch` API. Use it directly from your plugin when you need to talk to external services:

```js
const response = await fetch("https://api.example.com/data");
const data = await response.json();
await this.lumia.setVariable("api_data", JSON.stringify(data));
```

### OAuth 2.0

If your plugin needs OAuth 2.0, contact Lumia Stream on Discord or email dev@lumiastream.com so the server OAuth flow can be enabled for your plugin.

## When To Use A Custom Overlay

If your feature needs on-screen visuals (animated cards, HUD widgets, chat visualizers, stream panels), pair the plugin with a Custom Overlay:

- Keep API calls, normalization, and business logic in the plugin.
- Keep visual rendering and animation in the overlay.

Recommended plugin->overlay bridge:

1. Write global variables from the plugin with `this.lumia.setVariable("key", value)`.
2. Trigger alerts from the plugin with `this.lumia.triggerAlert(...)`.
3. In the overlay, read variables with `Overlay.getVariable("key")` and alert payloads in `Overlay.on("alert", (data) => data.extraSettings)`.

Use `extraSettings` for overlay payload values. Use `dynamic` only when you need alert variation matching.

Overlay docs: https://dev.lumiastream.com/docs/custom-overlays/custom-overlays-documentation  
Overlay assistant: https://chatgpt.com/g/g-6760d2a59b048191b17812250884971b-lumia-custom-overlays-assistant

## Common Patterns

### Polling External APIs

```js
export default class ApiPollingPlugin extends Plugin {
    pollInterval;
    offline = false;
    async onload() {
        const interval = Number(this.settings.pollInterval ?? 30000);
        this.pollInterval = setInterval(() => void this.pollApi(), interval);
    }
    async onunload() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
    }
    async pollApi() {
        if (this.offline)
            return;
        try {
            const data = await fetchWithBackoff("https://api.example.com/status");
            await this.lumia.setVariable("api_status", data.status);
            await this.lumia.setVariable("api_data", JSON.stringify(data));
        }
        catch (error) {
            this.offline = true;
            await this.lumia.log(`API polling failed: ${String(error)}`);
        }
    }
}
async function fetchWithBackoff(url) {
    const maxAttempts = 3;
    let delayMs = 1000;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        }
        catch (error) {
            if (attempt === maxAttempts) {
                throw error;
            }
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            delayMs *= 2;
        }
    }
}
```

If repeated failures occur, keep the plugin offline until the next load or a settings update to avoid rapid reconnect loops.

### Event-Based Plugins

```js
import { Plugin } from "@lumiastream/plugin";
export default class EventPlugin extends Plugin {
    async onload() {
        this.setupEventListeners();
    }
    setupEventListeners() {
        // Example: Listen for chat events, webhooks, etc.
    }
    async actions(config) {
        for (const action of config.actions) {
            switch (action.type) {
                case "manual_trigger":
                    await this.handleManualTrigger(action.value);
                    break;
                case "reset_counters":
                    await this.resetCounters();
                    break;
            }
        }
    }
    async handleManualTrigger(data) {
        const username = typeof data.username === "string" ? data.username : "Unknown";
        await this.lumia.triggerAlert({
            alert: "manual-event",
            extraSettings: { username },
        });
    }
    async resetCounters() {
        await this.lumia.setVariable("counter", 0);
    }
}
```

## Next Steps

- Review the [API Reference](./api-reference.md) for the full SDK surface area
- Explore the [examples](../examples/) for implementation ideas (e.g., `weather`, and the more advanced `rumble` sample)
- Dive into the [manifest guide](./manifest-guide.md) for advanced configuration options
- Join the [Lumia Stream community](https://lumiastream.com/discord) for support and feedback
