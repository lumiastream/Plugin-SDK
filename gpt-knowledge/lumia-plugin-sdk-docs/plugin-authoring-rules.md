# Lumia Plugin Authoring Rules

The full rule set for building Lumia Stream plugins, followed by an index of every example plugin and the knowledge file that contains it.

## Runtime

- Plugins run in an isolated Node.js process with no DOM. Never use `window`, `document`, `localStorage`, or `XMLHttpRequest`. Load packages with `require()`, not dynamic `import()`, and ship or bundle every third-party dependency.
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

## Plugin + Overlay

- Plugins handle data collection, API calls, and business logic; Custom Overlays handle on-screen rendering and animation. When a request is visual (HUD, ticker, animated card, on-stream widget, chatbox visuals), offer to build both sides.
- The bridge is `this.lumia.setVariable(...)` for state and `this.lumia.triggerAlert(...)` with `extraSettings` for events. Always give an explicit contract table: variable keys the plugin writes and the overlay reads, alert keys, the `extraSettings` keys the overlay reads, `dynamic` only if variations need it, and a `codeId` if using `overlaycontent`.
- Overlay code uses `Overlay.on('alert' | 'chat' | 'hfx' | 'virtuallight' | 'overlaycontent', handler)`, branches on `data.alert`, and reads `data.extraSettings` (and `data.dynamic`). Use literal keys in `Overlay.getVariable('key')` / `Overlay.setVariable('key', value)`.
- `overlaycontent` is a targeted push via `this.lumia.overlaySendCustomContent({ layer, codeId, content })`; the overlay must match `codeId` (letters, numbers, hyphens, underscores, max 25 chars).
- The Overlay Config tab has its own field types (`input`, `dropdown`, `multiselect`, `colorpicker`, `fontpicker`, ...). Never mix them with plugin field enums.
- For full overlay code, write a starter snippet or hand off with a ready-to-paste prompt to the Lumia Custom Overlays Assistant (https://chatgpt.com/g/g-6760d2a59b048191b17812250884971b-lumia-custom-overlays-assistant). Docs: https://dev.lumiastream.com/docs/custom-overlays/custom-overlays-documentation

## Example Index

Each example's full source (manifest, entry file, tutorials, translations) lives in the listed knowledge file.

- `examples__starters.md`: Start here: the `npx lumia-plugin create` template, a TypeScript build setup, and a reference plugin covering every settings field type, OAuth, and a custom auth display.
- `examples__audio-tts-song-requests.md`: Text-to-speech voice providers (`hasTtsVoices`), generating and playing audio, and song-request sources (`hasSongRequests`).
- `examples__ai-and-chat-tools.md`: AI providers (`hasAI`, `aiPrompt`, `aiModels`), template variable functions, and processing chat messages.
- `examples__streaming-platforms.md`: Streaming and social platform integrations: live status, chat display, native chatbot (`hasChatbot`), moderation commands (`modcommandOptions`), OAuth, and posting.
- `examples__games.md`: Polling third-party game APIs into variables and alerts, with request timeouts, backoff, and change detection.
- `examples__devices-feeds-monitors.md`: LAN devices, notification and RSS feeds, system stats, and scheduled alerts; persisted state and long-running subscriptions.

| Example | Knowledge file | What it does | Shows |
| --- | --- | --- | --- |
| `base_plugin` | `examples__starters.md` | Starter template that demonstrates settings, actions, variables, and alerts with a minimal code path. | actions, alerts, variables, translations, settings tutorial, actions tutorial |
| `settings_showcase` | `examples__starters.md` | Example plugin demonstrating every available settings field type with logging on save. | OAuth, custom auth display, actions, variables, translations, settings tutorial |
| `typescript_plugin` | `examples__starters.md` | Example TypeScript plugin that shows typed settings, actions, variables, and alerts. | TypeScript, actions, alerts, variables, translations |
| `elevenlabs_tts` | `examples__audio-tts-song-requests.md` | Generate ElevenLabs speech or music audio and play it through Lumia Stream. | TTS voices (`hasTtsVoices`), actions, settings tutorial, actions tutorial |
| `song_request_source` | `examples__audio-tts-song-requests.md` | Example song-request source plugin: resolves viewer requests to fake tracks and simulates playback so you can test the full song-request round trip. | song requests (`hasSongRequests`) |
| `tts_monster` | `examples__audio-tts-song-requests.md` | Generate TTS Monster speech audio and play it through Lumia Stream. | TTS voices (`hasTtsVoices`), actions, settings tutorial, actions tutorial |
| `chat_summarizer` | `examples__ai-and-chat-tools.md` | Summarizes chat on an interval and highlights users by category. | actions, variables, settings tutorial |
| `ollama` | `examples__ai-and-chat-tools.md` | Send prompts to a local Ollama server and use responses in Lumia templates via {{ollama_prompt}} and related helpers. | AI provider (`hasAI`), variable functions, translations, settings tutorial |
| `openclaw` | `examples__ai-and-chat-tools.md` | Send prompts to an OpenClaw Gateway and use responses in Lumia templates via {{openclaw_prompt}} and related helpers. | AI provider (`hasAI`), variable functions, translations, settings tutorial |
| `rumble` | `examples__streaming-platforms.md` | Track Rumble livestream state and engagement with alerts, variables, and chat display. | alerts, variables, translations, settings tutorial, actions tutorial |
| `trovo` | `examples__streaming-platforms.md` | Trovo Live integration with chat, alerts, chatbot, moderation, variables, and stream actions. | native chatbot (`hasChatbot`), moderation commands, variable functions, OAuth, actions, alerts, variables, translations, settings tutorial, actions tutorial |
| `x` | `examples__streaming-platforms.md` | Create and delete X posts with your own developer tokens, sync account variables, and trigger polling-based alerts for mentions and follower growth. | actions, alerts, variables, settings tutorial, actions tutorial |
| `eveonline` | `examples__games.md` | Pull EVE Online character status, wallet, location, and activity from ESI into Lumia. | OAuth, alerts, variables, translations, settings tutorial, actions tutorial |
| `minecraft_server` | `examples__games.md` | Monitor Minecraft Java servers for status and player changes with alerts and variables. | alerts, variables, translations, settings tutorial, actions tutorial |
| `retro_achievements` | `examples__games.md` | Track RetroAchievements profile stats, recently played games, and unlocked achievements in Lumia. | actions, alerts, variables, translations, settings tutorial, actions tutorial |
| `steam` | `examples__games.md` | Track Steam profile status, current/recent games, and achievements in Lumia with optional alerts and actions. | actions, alerts, variables, translations, settings tutorial, actions tutorial |
| `divoom_pixoo` | `examples__devices-feeds-monitors.md` | Send text, GIFs, drawings, and device controls to Divoom Pixoo LED displays over Wi-Fi. | actions, settings tutorial, actions tutorial |
| `mawakit` | `examples__devices-feeds-monitors.md` | Prayer time alerts, Hijri date variables, and Ramadan reminders based on your location. | variable functions, alerts, variables, translations, settings tutorial |
| `ntfy` | `examples__devices-feeds-monitors.md` | Subscribe to ntfy topics and trigger Lumia alerts/variables for incoming notifications. | alerts, translations, settings tutorial, actions tutorial |
| `rss_feed_monitor` | `examples__devices-feeds-monitors.md` | Monitor multiple RSS or Atom feeds, persist unseen items, and trigger Lumia alerts for each new entry even after Lumia has been offline. | alerts, settings tutorial, actions tutorial |
| `system_monitor` | `examples__devices-feeds-monitors.md` | Monitor CPU, RAM, and GPU usage with variables and alerts. | alerts, variables, translations |
