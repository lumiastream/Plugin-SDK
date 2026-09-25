# GitHub Copilot Instructions

<!-- GENERATED: scripts/sync-copilot-instructions.js -->
- sdk_version: 0.10.1
- generated_at_utc: 2026-09-25T15:11:26.713Z

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

## Runtime Constraints

- Plugins run in an isolated Node.js process with no DOM. Never use `window`, `document`, `localStorage`, or `XMLHttpRequest`. Load packages with `require()`, not dynamic `import()`, and ship or bundle every third-party dependency.
- Put a timeout on every `fetch` in a polling path (`AbortController` or `Promise.race`). Keep one in-flight refresh lock, clear it in `finally`, and recover a stale lock.
- Retries use capped exponential backoff. When retries run out, call `this.lumia.updateConnection(false)` and stay offline until the next load or a settings update.
- Log errors and explicit user actions only. No custom log wrappers.
- Keep code simple. No test-only actions ("test connection", "refetch") and no testing toggles in settings.
- OAuth 2.0 needs Lumia to enable the server flow: tell the developer to contact Lumia Stream on Discord or email dev@lumiastream.com.
- Action parameters arrive on `action.value` inside `actions(config)`.
- Keep plugin `id` stable (letters, numbers, underscores) and `version` valid semver. Do not invent undocumented manifest fields.

## Validation Order

1. `npx lumia-plugin validate <plugin-dir>`
2. `node skills/lumia-plugin-codex-skill/scripts/plugin-audit.js <plugin-dir>`
3. Project-specific tests/type-check (if available)

## Validation Commands

```bash
npx lumia-plugin validate <plugin-dir>
node skills/lumia-plugin-codex-skill/scripts/plugin-audit.js <plugin-dir> # optional when skill files are present
npx lumia-plugin build <plugin-dir>
```
