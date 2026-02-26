# Lumia Stream Plugin SDK

Official JavaScript SDK for developing plugins for [Lumia Stream](https://lumiastream.com).

![Lumia Stream Plugin](docs/lumiaplugin-banner.png)

## Installation

```bash
npm install @lumiastream/plugin
```

## Usage

```js
import { Plugin } from "@lumiastream/plugin";

export default class MyPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
	}

	async onload() {
		// Plugin loaded
	}

	async onunload() {
		// Plugin unloaded
	}
}
```

JavaScript (`.js`) is the default runtime path for plugins.

## Plugin Manifest

Every plugin requires a `manifest.json` file that describes your plugin, its metadata, and configuration:

```json
{
	"id": "my_awesome_plugin",
	"name": "My Awesome Plugin",
	"version": "1.0.0",
	"author": "Your Name",
	"description": "A brief description of what your plugin does",
	"lumiaVersion": "^9.0.0",
	"category": "utilities",
	"config": {
		"hasAI": true,
		"hasChatbot": true,
		"modcommandOptions": ["delete", "ban", "timeout"],
		"settings": [
			{
				"key": "apiKey",
				"label": "API Key",
				"type": "text",
				"required": true
			}
		]
	}
}
```

## Lifecycle Hooks

- `onload()` – invoked when the plugin is enabled inside Lumia Stream.
- `onunload()` – called when your plugin is disabled or unloaded.
- `onupdate(oldVersion, newVersion)` – triggered after version upgrades.
- `onsettingsupdate(settings, previousSettings)` – called whenever settings change.
- `actions(config)` – handle custom actions invoked from Lumia automations.  
  **Note:** action parameters are provided via `action.value`. Use `const params = action.value;`.
- `aiPrompt(config)` – optional AI prompt handler used when `config.hasAI` is enabled in your manifest.
- `aiModels(config?)` – optional AI model provider used by Lumia model pickers when `config.hasAI` is enabled.
- `chatbot(config)` – optional native chatbot handler used when `config.hasChatbot` is enabled in your manifest.
- `modCommand(type, value)` – optional moderation handler used when `config.modcommandOptions` is declared in your manifest.
- `searchLights(config)` – optional hook for lights plugins to return discoverable devices in the auth UI.
- `addLight(config)` – optional hook for manual light add flows; return the updated light list.
- `searchPlugs(config)` – optional hook for plug/accessory plugins to return discoverable plugs in the auth UI.
- `addPlug(config)` – optional hook for manual plug add flows; return the updated plug list.
- `searchThemes(config)` – optional hook for lights plugins to return Studio theme options (array or `{ scenes|effects|presets }` object).
- `onLightChange(config)` – optional runtime hook for light updates and Studio theme executions (`config.rawConfig.theme` when invoked from themes).
- `onPlugChange(config)` – optional runtime hook for plug state updates (`config` includes `brand`, `devices`, `state`, `rawConfig`).

## Lights, Plugs, And Studio Themes

If your plugin is a lights integration:

- implement `searchLights` and/or `addLight` for light selection in auth
- implement `onLightChange` to apply runtime light changes
- implement `searchThemes` to surface mode/scene options in Studio themes
- set `config.themeConfig` in `manifest.json` to control which Studio bucket (`scenes`, `effects`, or `presets`) Lumia should use

If your plugin is a plug/accessory integration:

- implement `searchPlugs` and/or `addPlug` for plug selection in auth
- implement `onPlugChange` to apply runtime on/off updates
- add a `config.plugs` block in `manifest.json` to render plug discovery/manual-add UI

## Lumia API Highlights

Interact with Lumia Stream using the strongly typed `ILumiaAPI` helper on the plugin context:

```js
await this.lumia.triggerAlert({
    alert: "follow",
    extraSettings: { username: "StreamerFan" },
    showInEventList: false,
});
await this.lumia.playAudio({ path: "alert.mp3", volume: 0.7 });
this.lumia.setVariable("follower_count", 1337);
this.lumia.displayChat({
    username: "Viewer123",
    message: "Hello from the plugin!",
});
```

`showInEventList` should stay `false` for most plugins. Enable it only when users expect those plugin-triggered events in Event List (typically streaming platform/event-source plugins).

See the [API reference](./docs/api-reference.md) for the full surface area.

### Shared Runtime Resources

Plugins can share heavy resources (for example OpenCV/ONNX runtimes) across the plugin host process:

```js
const sharedCv = await this.lumia.acquireShared("opencv.runtime", () => {
    return require("@lumiastream/opencv-runtime");
}, {
    dispose: (runtime) => runtime?.shutdown?.(),
});
// ...use sharedCv...
await this.lumia.releaseShared("opencv.runtime");
```

Notes:
- The first plugin call for a key should provide `factory`.
- Later plugins can call `acquireShared(key)` to reuse the same instance.
- If a plugin unloads without releasing, Lumia auto-releases its remaining references.

For Bluetooth plugins using `@abandonware/noble`, use the shared noble helper instead of loading noble separately in each plugin:

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

Notes:
- `acquireSharedNoble()` defaults to key `bluetooth.runtime.noble.manager.v1`.
- Scan/listener controls are plugin-scoped, so plugins can share one adapter runtime without fighting over scan state.

## Runtime Environment

Plugins execute in an isolated **Node.js** process (no browser DOM). Use Node-compatible packages and avoid browser-only APIs like `window`, `document`, `localStorage`, or `XMLHttpRequest`. Bundle or ship your dependencies with the plugin; do not assume Lumia provides third-party packages unless documented.

## Scripts

- `npm run build` – compile the SDK to the `dist` folder.
- `npm run lint` – type-check the source without emitting output.
- `npm run package-docs` – rebuild the GPT knowledge pack in `gpt-knowledge/lumia-plugin-sdk-docs`.
- `npm run sync:developer-docs` – sync core SDK docs and generated example pages into `../Developer-Docs/docs/plugin-sdk` (no manual copy/paste).
- `npm run sync:skills` – refresh Codex skill docs snapshot, Claude skill docs snapshot, and Cursor rules together.
- `npm run validate:skills` – validate Codex skill + Claude skill + Copilot instructions + Gemini instructions + Cursor rule version alignment.
- `npm run update:assistant-files -- --target <plugin-path>` – pull latest assistant files (Claude/Copilot/Gemini/Cursor, optional Codex) from `main`.

## CLI Helpers

The CLI is distributed separately via `lumia-plugin`. Use it with `npx` (requires npm 7+).

- `npx lumia-plugin create my_plugin` scaffold a feature-rich sample plugin showing logging, variables, and alerts
- `npx lumia-plugin validate ./path/to/plugin` check `manifest.json`, entry files, and config for common mistakes
- `npx lumia-plugin build ./path/to/plugin --out ./plugin.lumiaplugin` bundle the directory into a distributable archive

## AI Editor Support (Codex + Claude + Copilot + Gemini CLI + Cursor)

This repository ships cross-tool guidance for all three tools using this repo as source:

- [https://github.com/lumiastream/Plugin-SDK](https://github.com/lumiastream/Plugin-SDK)

### Codex Desktop

Location:

- `skills/lumia-plugin-codex-skill`

What it does:

- Guides Lumia plugin workflow (scaffold, implement, validate, package)
- Maps `manifest.json` capabilities to required/recommended runtime hooks
- Includes `plugin-audit.js` to detect manifest-to-hook mismatches

Install/download into Codex Desktop:

```bash
python3 "$CODEX_HOME/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo lumiastream/Plugin-SDK \
  --path skills/lumia-plugin-codex-skill
```

Browser-only install (no curl):

1. Download the repo zip: [Download Plugin-SDK zip](https://github.com/lumiastream/Plugin-SDK/archive/refs/heads/main.zip)
2. Extract it and copy `skills/lumia-plugin-codex-skill` to `$CODEX_HOME/skills/lumia-plugin-codex-skill`
3. Restart Codex Desktop

Use:

- Mention `$lumia-plugin-codex-skill` in your prompt
- Example: `Use $lumia-plugin-codex-skill to scaffold and validate a lights plugin with theme support`

Restart Codex Desktop after installation.

### Claude

Location:

- `skills/lumia-plugin-claude-skill/lumia-plugin-claude-skill.md`

What it does:

- Provides Lumia plugin workflow and capability contract guidance for Claude sessions
- Includes audit/validation guidance and references synced from SDK docs

Install/download into another project:

```bash
curl -L https://raw.githubusercontent.com/lumiastream/Plugin-SDK/main/skills/lumia-plugin-claude-skill/lumia-plugin-claude-skill.md \
  -o /path/to/your-plugin/CLAUDE.md
```

Browser-only install (no curl):

1. Open [Claude skill file](https://raw.githubusercontent.com/lumiastream/Plugin-SDK/main/skills/lumia-plugin-claude-skill/lumia-plugin-claude-skill.md)
2. Save it as `CLAUDE.md` in your plugin project root

Optional references bundle:

```bash
git clone https://github.com/lumiastream/Plugin-SDK.git /tmp/lumia-plugin-sdk
mkdir -p /path/to/your-plugin/.claude/lumia-plugin-references
cp -R /tmp/lumia-plugin-sdk/skills/lumia-plugin-claude-skill/references/* /path/to/your-plugin/.claude/lumia-plugin-references/
```

Use:

- Open your plugin project in Claude
- Ask Claude to follow `CLAUDE.md` while implementing or validating the plugin

### GitHub Copilot

Location:

- `.github/copilot-instructions.md`

What it does:

- Adds repository-wide Lumia plugin implementation and validation guidance for Copilot
- Includes workflow steps and manifest capability contract checks

Install/download into another project:

```bash
mkdir -p /path/to/your-plugin/.github
curl -L https://raw.githubusercontent.com/lumiastream/Plugin-SDK/main/.github/copilot-instructions.md \
  -o /path/to/your-plugin/.github/copilot-instructions.md
```

Browser-only install (no curl):

1. Open [Copilot instructions file](https://raw.githubusercontent.com/lumiastream/Plugin-SDK/main/.github/copilot-instructions.md)
2. Save it as `.github/copilot-instructions.md` in your plugin project

Use:

- Open your plugin project in VS Code or GitHub with Copilot enabled
- Copilot Chat uses repository instructions automatically

### Gemini CLI

Location:

- `GEMINI.md`

What it does:

- Provides project guidance for Gemini CLI sessions targeting Lumia plugin development
- Includes workflow, capability contracts, and validation commands

Install/download into another project:

```bash
curl -L https://raw.githubusercontent.com/lumiastream/Plugin-SDK/main/GEMINI.md \
  -o /path/to/your-plugin/GEMINI.md
```

Browser-only install (no curl):

1. Open [Gemini instructions file](https://raw.githubusercontent.com/lumiastream/Plugin-SDK/main/GEMINI.md)
2. Save it as `GEMINI.md` in your plugin project root

Use:

- Run Gemini CLI from your plugin project root
- Ask Gemini to follow `GEMINI.md` while implementing or validating plugin changes

### Cursor

Location:

- `.cursor/rules/lumia-plugin-workflow.mdc`
- `.cursor/rules/lumia-plugin-manifest-contracts.mdc`

What it does:

- Enforces Lumia plugin workflow steps while editing plugin files
- Applies capability contract checks when `manifest.json` and runtime hooks change

Install/download into another project:

```bash
mkdir -p /path/to/your-plugin/.cursor/rules
cp .cursor/rules/lumia-plugin-*.mdc /path/to/your-plugin/.cursor/rules/
mkdir -p /path/to/your-plugin/scripts
cp skills/lumia-plugin-codex-skill/scripts/plugin-audit.js /path/to/your-plugin/scripts/plugin-audit.js
```

Browser-only install (no curl):

1. Open [Cursor workflow rule](https://raw.githubusercontent.com/lumiastream/Plugin-SDK/main/.cursor/rules/lumia-plugin-workflow.mdc) and save as `.cursor/rules/lumia-plugin-workflow.mdc`
2. Open [Cursor manifest rule](https://raw.githubusercontent.com/lumiastream/Plugin-SDK/main/.cursor/rules/lumia-plugin-manifest-contracts.mdc) and save as `.cursor/rules/lumia-plugin-manifest-contracts.mdc`
3. Open [Audit script](https://raw.githubusercontent.com/lumiastream/Plugin-SDK/main/skills/lumia-plugin-codex-skill/scripts/plugin-audit.js) and save as `scripts/plugin-audit.js`

Use:

- Open the plugin project in Cursor
- Cursor applies matching rules automatically based on file globs
- Run `node scripts/plugin-audit.js <plugin-dir>` only if you copied the audit script

### Easy Updates (No Full Redownload)

Instead of re-downloading everything, users can pull only the latest assistant files from `main` with one command:

```bash
npm run update:assistant-files -- --target /path/to/your-plugin
```

Optional tool selection:

```bash
npm run update:assistant-files -- --target /path/to/your-plugin --tools claude,copilot,gemini,cursor
```

Optional Codex skill update (for Codex Desktop install path):

```bash
npm run update:assistant-files -- --tools codex --codex-home "$CODEX_HOME"
```

### Automatic Sync on Publish

- `npm run sync:skills`
- `npm run validate:skills`
- `prepublishOnly` runs both before publish (covers Codex + Claude + Copilot + Gemini CLI + Cursor)

## Documentation

- [Getting Started](./docs/getting-started.md)
- [API Reference](./docs/api-reference.md)
- [Manifest Guide](./docs/manifest-guide.md)
- [Field Types Reference](./docs/field-types-reference.md)

## Examples

- `examples/base_plugin` – Showcase JavaScript template used by `npx lumia-plugin create`.
- `examples/divoom_pixoo` – Device plugin that sends text, GIFs, drawings, and controls to Divoom Pixoo displays.
- `examples/elevenlabs_tts` – Audio plugin that generates ElevenLabs speech/music and plays it through Lumia.
- `examples/eveonline` – EVE Online integration that syncs character status, wallet, location, and activity from ESI.
- `examples/minecraft_server` – Game plugin that monitors Minecraft Java server status/player changes.
- `examples/ntfy` – App plugin that subscribes to ntfy topics and triggers Lumia alerts/variables.
- `examples/ollama` – App plugin that queries a local Ollama server and exposes prompt helpers for templates.
- `examples/openrgb` – Lights plugin that controls OpenRGB devices and profile actions from Lumia.
- `examples/rumble` – Platforms plugin that tracks Rumble livestream state, engagement, and chat metadata.
- `examples/sound_trigger_alert` – Sound Trigger Alert example that matches a user-uploaded reference sound against live capture and triggers Lumia alerts.
- `examples/settings_field_showcase` – Reference plugin demonstrating all supported settings field types.
- `examples/steam` – Steam integration that tracks profile status, games, and achievements with optional alerts/actions.

## License

The SDK is released under the MIT License. See [LICENSE](./LICENSE) for details.
