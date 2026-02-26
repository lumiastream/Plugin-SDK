# GitHub Copilot Instructions

<!-- GENERATED: scripts/sync-copilot-instructions.js -->
- sdk_version: 0.5.1
- generated_at_utc: 2026-02-26T19:15:33.267Z

Use these instructions when developing Lumia Stream plugins in this repository or compatible plugin projects.

## Workflow

## Scope

Use this workflow when building or modifying plugins that target the Lumia Stream plugin runtime.

## 1. Prepare

1. Confirm plugin root contains `manifest.json`.
2. Confirm plugin entry path:
- Use `manifest.main` when present.
- Otherwise use `main.js`.
3. If creating from scratch, scaffold with:

```bash
npx lumia-plugin create <plugin_name>
```

## 2. Implement

1. Read `manifest.json` first.
2. Ensure every declared capability has matching runtime hooks.
3. Keep hook signatures stable and use defensive parsing for action/settings values.

## 3. Validate

Run both checks:

```bash
npx lumia-plugin validate <plugin-dir>
node skills/lumia-plugin-codex-skill/scripts/plugin-audit.js <plugin-dir>
```

Validation goals:
- No manifest schema/basic errors
- No missing required hooks for declared capabilities
- No obvious mismatch between manifest and runtime code

## 4. Package

```bash
npx lumia-plugin build <plugin-dir> --out <plugin-name>.lumiaplugin
```

Before handoff, report:
1. Main files changed
2. Validation result
3. Package output path
4. Remaining integration risks (API auth, device reachability, etc.)

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

## Runtime constraints

1. Target Node.js runtime only.
2. Avoid browser APIs (`window`, `document`, `localStorage`, `XMLHttpRequest`).
3. Ship or bundle third-party dependencies with the plugin package.

## Validation order

1. `npx lumia-plugin validate <plugin-dir>`
2. `node skills/lumia-plugin-codex-skill/scripts/plugin-audit.js <plugin-dir>`
3. Project-specific tests/type-check (if available)

## Validation Commands

```bash
npx lumia-plugin validate <plugin-dir>
node skills/lumia-plugin-codex-skill/scripts/plugin-audit.js <plugin-dir> # optional when skill files are present
npx lumia-plugin build <plugin-dir>
```
