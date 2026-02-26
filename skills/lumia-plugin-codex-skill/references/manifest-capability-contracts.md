# Manifest Capability Contracts

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
