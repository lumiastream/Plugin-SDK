# Lumia Plugin Examples: Audio, TTS And Song Requests

Use these examples for: Text-to-speech voice providers (`hasTtsVoices`), generating and playing audio, and song-request sources (`hasSongRequests`).

## Index

| Example | What it does | Shows | Field types |
| --- | --- | --- | --- |
| `elevenlabs_tts` (ElevenLabs TTS) | Generate ElevenLabs speech or music audio and play it through Lumia Stream. | TTS voices (`hasTtsVoices`), actions, settings tutorial, actions tutorial | checkbox, number, password, select, text, textarea, toggle |
| `song_request_source` (Demo Song Source) | Example song-request source plugin: resolves viewer requests to fake tracks and simulates playback so you can test the full song-request round trip. | song requests (`hasSongRequests`) |  |
| `tts_monster` (TTS Monster) | Generate TTS Monster speech audio and play it through Lumia Stream. | TTS voices (`hasTtsVoices`), actions, settings tutorial, actions tutorial | number, password, select, switch, textarea, toggle |

## Example: elevenlabs_tts

Source folder `examples/elevenlabs_tts`, category `audio`. Generate ElevenLabs speech or music audio and play it through Lumia Stream.

### elevenlabs_tts/manifest.json

```json
{
	"id": "elevenlabs_tts",
	"name": "ElevenLabs TTS",
	"version": "1.2.5",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://elevenlabs.io",
	"repository": "",
	"description": "Generate ElevenLabs speech or music audio and play it through Lumia Stream.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "audio",
	"keywords": "elevenlabs, tts, text-to-speech, voice, audio",
	"icon": "elevenlabs_icon.jpg",
	"config": {
		"hasTtsVoices": true,
		"ttsVoiceSource": {
			"label": "ElevenLabs"
		},
		"settings": [
			{
				"key": "apiKey",
				"label": "API Key (starts with sk_)",
				"type": "password",
				"placeholder": "sk_...",
				"helperText": "Paste the API Key, not the Key ID. The API Key starts with sk_, is 51 characters, and ElevenLabs only shows it in the \"API Key\" dialog when you create or rotate the key. The 64-character Key ID listed in the keys table is not a credential and will not work.",
				"required": true
			}
		],
		"settings_tutorial": "./settings_tutorial.md",
		"actions_tutorial": "./actions_tutorial.md",
		"actions": [
			{
				"type": "speak",
				"label": "Speak",
				"description": "Generate ElevenLabs TTS audio and play it in Lumia.",
				"fields": [
					{
						"key": "message",
						"label": "Message",
						"type": "text",
						"defaultValue": "Hello from Lumia!",
						"helperText": "Text to synthesize. Character limits vary per model; long messages will be truncated.",
						"allowVariables": true
					},
					{
						"key": "maxChars",
						"label": "Max Characters (optional)",
						"type": "number",
						"helperText": "Leave empty to use the model limit; if set, the smaller limit is used.",
						"min": 0,
						"max": 100000
					},
					{
						"key": "voiceId",
						"label": "Voice",
						"type": "select",
						"defaultValue": "JBFqnCBsd6RMkjVDRZzb",
						"helperText": "Choose a voice from your ElevenLabs account, or type a Voice ID.",
						"allowVariables": true,
						"options": [],
						"dynamicOptions": true,
						"allowTyping": true
					},
					{
						"key": "modelId",
						"label": "Model ID",
						"type": "select",
						"allowTyping": true,
						"defaultValue": "eleven_multilingual_v2",
						"helperText": "Choose a speech model, or type a model ID. Live models from your account need the optional Models key permission; without it this built-in list is used.",
						"options": [
							{
								"label": "Eleven v3",
								"value": "eleven_v3"
							},
								{
								"label": "Eleven v3 Conversational",
								"value": "eleven_v3_conversational"
							},
							{
								"label": "Eleven Multilingual v2",
								"value": "eleven_multilingual_v2"
							},
							{
								"label": "Eleven Flash v2.5",
								"value": "eleven_flash_v2_5"
							},
							{
								"label": "Eleven Flash v2",
								"value": "eleven_flash_v2"
							},
							{
								"label": "Eleven Turbo v2.5",
								"value": "eleven_turbo_v2_5"
							},
							{
								"label": "Eleven Turbo v2",
								"value": "eleven_turbo_v2"
							},
							{
								"label": "Eleven Multilingual v1",
								"value": "eleven_multilingual_v1"
							}
						],
						"dynamicOptions": true
					},
					{
						"key": "stability",
						"label": "Stability (0-1)",
						"type": "number",
						"defaultValue": 1,
						"helperText": "Higher is more consistent; lower is more expressive.",
						"min": 0,
						"max": 1
					},
					{
						"key": "similarityBoost",
						"label": "Similarity Boost (0-1)",
						"type": "number",
						"defaultValue": 1,
						"helperText": "Higher keeps closer to the original voice.",
						"min": 0,
						"max": 1
					},
					{
						"key": "style",
						"label": "Style (0-1)",
						"type": "number",
						"defaultValue": 0,
						"helperText": "Higher adds more stylistic variation.",
						"min": 0,
						"max": 1
					},
					{
						"key": "volume",
						"label": "Volume",
						"type": "number",
						"defaultValue": 100,
						"helperText": "Output volume in Lumia (0-100).",
						"min": 0,
						"max": 100
					}
				],
				"refreshOnChange": true
			},
			{
				"type": "stream_music",
				"label": "Stream Music",
				"description": "Generate ElevenLabs music and play it in Lumia.",
				"fields": [
					{
						"key": "prompt",
						"label": "Prompt",
						"type": "textarea",
						"defaultValue": "Warm lo-fi beats with soft piano and vinyl crackle.",
						"helperText": "Describe the music you want. Prompts can be long; use Max Characters to cap the length."
					},
					{
						"key": "maxPromptChars",
						"label": "Max Prompt Characters (optional)",
						"type": "number",
						"helperText": "Optional cap for prompt length.",
						"min": 0,
						"max": 100000
					},
					{
						"key": "compositionPlanJson",
						"label": "Composition Plan JSON (optional)",
						"type": "textarea",
						"placeholder": "{\"sections\":[{\"time\":0,\"notes\":\"intro\"}]}",
						"defaultValue": "",
						"helperText": "Advanced structure. Leave empty to use prompt only."
					},
					{
						"key": "musicLengthMs",
						"label": "Music Length (ms)",
						"type": "number",
						"defaultValue": 15000,
						"helperText": "Length of the generated clip in milliseconds.",
						"min": 1000,
						"max": 300000
					},
					{
						"key": "modelId",
						"label": "Model ID",
						"type": "select",
						"allowTyping": true,
						"defaultValue": "music_v1",
						"helperText": "Choose a music model or type a custom model ID.",
						"options": [
							{
								"label": "Music v1",
								"value": "music_v1"
							}
						]
					},
					{
						"key": "forceInstrumental",
						"label": "Force Instrumental",
						"type": "toggle",
						"defaultValue": true,
						"helperText": "If enabled, vocals are removed."
					},
					{
						"key": "volume",
						"label": "Volume",
						"type": "number",
						"defaultValue": 100,
						"helperText": "Output volume in Lumia (0-100).",
						"min": 0,
						"max": 100
					},
					{
						"key": "saveToDesktop",
						"label": "Save Music File to Desktop",
						"type": "checkbox",
						"defaultValue": false,
						"helperText": "Saves the generated audio to your Desktop."
					}
				]
			}
		]
	}
}
```

### elevenlabs_tts/main.js

```javascript
const { Plugin } = require("@lumiastream/plugin");
const fs = require("fs/promises");
const path = require("path");
const os = require("os");

const REQUEST_TIMEOUT_MS = 15000;
// showToast's `time` is milliseconds (the host passes it to react-toastify's autoClose),
// so small numbers make the toast flash and vanish before it can be read.
const TOAST_DURATION_MS = 8000;
const INFO_TOAST_DURATION_MS = 5000;
// The capability summary is several lines, so it needs longer on screen than a one-line error.
const SUMMARY_TOAST_DURATION_MS = 14000;
const API_KEY_LENGTH = 51;
const API_KEY_ID_LENGTH = 64;

const DEFAULTS = {
	modelId: "eleven_multilingual_v2",
	outputFormat: "mp3_44100_128",
	stability: 0.5,
	similarityBoost: 0.5,
	style: 0.0,
	speakerBoost: true,
	volume: 100,
};

const ELEVENLABS_LOGO_DATA_URI =
	"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcng9IjI0IiBmaWxsPSIjMDAwMDAwIi8+PHJlY3QgeD0iMzUiIHk9IjI3IiB3aWR0aD0iMTEiIGhlaWdodD0iNDYiIHJ4PSI1LjUiIGZpbGw9IiNmZmZmZmYiLz48cmVjdCB4PSI1NCIgeT0iMjciIHdpZHRoPSIxMSIgaGVpZ2h0PSI0NiIgcng9IjUuNSIgZmlsbD0iI2ZmZmZmZiIvPjwvc3ZnPgo=";

const MODEL_CHAR_LIMITS = {
	eleven_v3: 5000,
	eleven_v3_conversational: 5000,
	eleven_flash_v2_5: 40000,
	eleven_flash_v2: 30000,
	eleven_turbo_v2_5: 40000,
	eleven_turbo_v2: 30000,
	eleven_multilingual_v2: 10000,
	eleven_multilingual_v1: 10000,
	eleven_english_sts_v2: 10000,
	eleven_english_sts_v1: 10000,
};

// Listing models needs the optional `models_read` ("Models") key permission. Without it we still
// offer the known text-to-speech models, and the field accepts a typed model ID either way.
const FALLBACK_TTS_MODELS = [
	{ id: "eleven_v3", name: "Eleven v3" },
	{ id: "eleven_v3_conversational", name: "Eleven v3 Conversational" },
	{ id: "eleven_multilingual_v2", name: "Eleven Multilingual v2" },
	{ id: "eleven_flash_v2_5", name: "Eleven Flash v2.5" },
	{ id: "eleven_flash_v2", name: "Eleven Flash v2" },
	{ id: "eleven_turbo_v2_5", name: "Eleven Turbo v2.5" },
	{ id: "eleven_turbo_v2", name: "Eleven Turbo v2" },
	{ id: "eleven_multilingual_v1", name: "Eleven Multilingual v1" },
];

const describeApiKeyProblem = (apiKey) => {
	if (!apiKey) {
		return 'add your ElevenLabs API Key (it starts with "sk_") in the plugin settings';
	}
	// The ElevenLabs dashboard lists a 64-char Key ID beside each key; only the sk_ secret authenticates.
	if (apiKey.length === API_KEY_ID_LENGTH && !apiKey.startsWith("sk_")) {
		return `that is the Key ID from the ElevenLabs keys table (${API_KEY_ID_LENGTH} characters), not the API Key — the API Key starts with "sk_", is ${API_KEY_LENGTH} characters, and ElevenLabs only shows it in the "API Key" dialog when you create or rotate the key`;
	}
	return "";
};

const errorMessage = (error) =>
	error instanceof Error ? error.message : String(error);

// ElevenLabs answers a missing key scope with a 401 whose detail names the permission, e.g.
// "The API key you used is missing the permission music_generation to execute this operation."
const isPermissionError = (error) =>
	/missing the permission/i.test(errorMessage(error));

const markConnectionFailure = (error) => {
	error.connectionFailure = true;
	return error;
};

const extractErrorDetail = (errorText) => {
	try {
		const parsed = JSON.parse(errorText);
		return (
			parsed?.detail?.message ||
			(typeof parsed?.detail === "string" ? parsed.detail : "") ||
			parsed?.message ||
			""
		);
	} catch (_err) {
		return "";
	}
};

const toNumber = (value, fallback) => {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === "string" && value.trim().length) {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : fallback;
	}
	return fallback;
};

const toBoolean = (value, fallback) => {
	if (typeof value === "boolean") {
		return value;
	}
	if (typeof value === "string") {
		const normalized = value.trim().toLowerCase();
		if (["true", "yes", "1", "on"].includes(normalized)) {
			return true;
		}
		if (["false", "no", "0", "off"].includes(normalized)) {
			return false;
		}
	}
	return fallback;
};

const trimString = (value, fallback = "") => {
	if (typeof value !== "string") {
		return fallback;
	}
	const trimmed = value.trim();
	return trimmed.length ? trimmed : fallback;
};

const getCharLimitForModel = (modelId) => {
	if (typeof modelId !== "string") {
		return null;
	}
	const normalized = modelId.trim().toLowerCase();
	return MODEL_CHAR_LIMITS[normalized] ?? null;
};

const getOptionalLimit = (value) => {
	const limit = toNumber(value, 0);
	return Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : null;
};

const truncateText = (text, limit) => {
	if (!limit || typeof text !== "string") {
		return { text, truncated: false, limit: null };
	}
	if (text.length <= limit) {
		return { text, truncated: false, limit };
	}
	return { text: text.slice(0, limit), truncated: true, limit };
};

const parseJson = (value) => {
	if (typeof value !== "string" || !value.trim().length) {
		return null;
	}
	try {
		return JSON.parse(value);
	} catch (_err) {
		return null;
	}
};

const buildVoiceSettings = ({
	stability,
	similarityBoost,
	style,
	speakerBoost,
}) => {
	const settings = {};
	if (Number.isFinite(stability)) settings.stability = stability;
	if (Number.isFinite(similarityBoost))
		settings.similarity_boost = similarityBoost;
	if (Number.isFinite(style)) settings.style = style;
	if (typeof speakerBoost === "boolean")
		settings.use_speaker_boost = speakerBoost;
	return settings;
};

const getAudioMimeType = (outputFormat) => {
	if (typeof outputFormat !== "string") {
		return "audio/mpeg";
	}
	const normalized = outputFormat.toLowerCase();
	if (normalized.includes("wav")) {
		return "audio/wav";
	}
	return "audio/mpeg";
};

const getAudioExtension = (outputFormat) => {
	if (typeof outputFormat !== "string") {
		return "mp3";
	}
	const normalized = outputFormat.toLowerCase();
	if (normalized.includes("wav")) {
		return "wav";
	}
	return "mp3";
};

const getDesktopPath = () => {
	const homeDir = os.homedir?.();
	if (!homeDir) {
		return null;
	}
	return path.join(homeDir, "Desktop");
};

const buildMusicFilename = (outputFormat) => {
	const extension = getAudioExtension(outputFormat);
	const now = new Date();
	const stamp = [
		now.getFullYear(),
		String(now.getMonth() + 1).padStart(2, "0"),
		String(now.getDate()).padStart(2, "0"),
		"_",
		String(now.getHours()).padStart(2, "0"),
		String(now.getMinutes()).padStart(2, "0"),
		String(now.getSeconds()).padStart(2, "0"),
	].join("");
	return `elevenlabs_music_${stamp}.${extension}`;
};

class ElevenLabsTTSPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._connectionState = null;
		this._voiceCount = null;
		// true = granted, false = the key was explicitly rejected for it, null = not known yet.
		this._modelsPermission = null;
		// Music Generation cannot be probed: /v1/music/stream validates the body before auth, so an
		// empty-body request 422s for every key. We only learn the answer when a real run succeeds or 401s.
		this._musicPermission = null;
	}

	getSettingsSnapshot() {
		const raw = this.settings || {};
		return {
			apiKey: trimString(raw.apiKey),
		};
	}

	async onload() {
		// Report a state during onload or the host defaults the plugin badge to connected.
		await this._setConnection(false);
		void this._refreshConnection();
		void this.refreshActionOptions({ actionType: "speak" });
	}

	async onunload() {
		await this._setConnection(false);
	}

	async onsettingsupdate(settings = {}, previousSettings = {}) {
		const next = trimString(settings.apiKey, "");
		const prev = trimString(previousSettings.apiKey, "");
		if (next !== prev) {
			this._voiceCount = null;
			this._modelsPermission = null;
			this._musicPermission = null;
			const result = await this._refreshConnection({ apiKey: next });
			if (typeof this.lumia.refreshTtsVoices === "function") {
				await this.lumia.refreshTtsVoices();
			}
			// Awaited, not fire-and-forget: the summary reports what this pass learned about the key.
			await this.refreshActionOptions({ actionType: "speak" });
			if (result?.ok) {
				await this._toastCapabilities();
			}
		}
	}

	async validateAuth(data = {}) {
		const apiKey = trimString(data?.apiKey, this.getSettingsSnapshot().apiKey);
		return this._refreshConnection({ apiKey, silent: true });
	}

	async _setConnection(state) {
		if (this._connectionState === state) {
			return;
		}
		this._connectionState = state;
		if (typeof this.lumia?.updateConnection !== "function") {
			return;
		}
		try {
			await this.lumia.updateConnection(state);
		} catch (_err) {}
	}

	async _toast(message, type = "error", time = TOAST_DURATION_MS) {
		if (typeof this.lumia?.showToast !== "function") {
			return;
		}
		try {
			await this.lumia.showToast({ message, time, type });
		} catch (_err) {}
	}

	_capabilitySummary() {
		const voices = this._voiceCount;
		const headline =
			typeof voices === "number"
				? `ElevenLabs connected — ${voices} voice${voices === 1 ? "" : "s"} ready for Lumia's TTS and the Speak action.`
				: "ElevenLabs connected — your voices are ready for Lumia's TTS and the Speak action.";

		const notes = [];
		if (this._modelsPermission === false) {
			notes.push(
				'"Models" is off, so the Model dropdown uses the built-in list (typing a model ID still works).',
			);
		}
		if (this._musicPermission === false) {
			notes.push(
				'"Music Generation" is off, so the Stream Music action will fail until you enable it.',
			);
		} else if (this._musicPermission === null) {
			notes.push(
				'The Stream Music action also needs the optional "Music Generation" permission on this key.',
			);
		}

		return {
			message: notes.length ? `${headline}\n\n${notes.join("\n")}` : headline,
			type:
				this._modelsPermission === false || this._musicPermission === false
					? "warning"
					: "success",
		};
	}

	async _toastCapabilities() {
		const { message, type } = this._capabilitySummary();
		await this._toast(message, type, SUMMARY_TOAST_DURATION_MS);
	}

	async _reportFailure(error, { context = "Request", silent = false } = {}) {
		const message = errorMessage(error);
		await this.lumia.log(`[ElevenLabs] ${context} failed: ${message}`);
		if (error?.connectionFailure) {
			await this._setConnection(false);
		}
		if (!silent) {
			await this._toast(`ElevenLabs: ${message}`, "error");
		}
	}

	async _refreshConnection({ apiKey, silent = false } = {}) {
		const key =
			apiKey === undefined
				? this.getSettingsSnapshot().apiKey
				: trimString(apiKey, "");
		const problem = describeApiKeyProblem(key);
		if (problem) {
			await this._setConnection(false);
			await this.lumia.log(`[ElevenLabs] Not connected: ${problem}`);
			if (!silent && key) {
				await this._toast(`ElevenLabs: ${problem}`, "error");
			}
			return { ok: false, message: problem };
		}
		try {
			await this._apiFetch("https://api.elevenlabs.io/v2/voices?page_size=1", {
				headers: { "xi-api-key": key },
			});
			await this._setConnection(true);
			return { ok: true };
		} catch (error) {
			markConnectionFailure(error);
			await this._reportFailure(error, { context: "Connection", silent });
			return { ok: false, message: errorMessage(error) };
		}
	}

	async _apiFetch(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
		if (typeof fetch !== "function") {
			throw new Error("fetch is not available in this runtime");
		}
		const controller =
			typeof AbortController === "function" ? new AbortController() : null;
		const timer = controller
			? setTimeout(() => controller.abort(), timeoutMs)
			: null;
		let response;
		try {
			response = await fetch(
				url,
				controller ? { ...options, signal: controller.signal } : options,
			);
		} catch (error) {
			// fetch only rejects when the request never completed: offline, DNS/firewall block, or our abort.
			throw markConnectionFailure(
				new Error(
					error?.name === "AbortError"
						? `ElevenLabs did not respond within ${Math.round(timeoutMs / 1000)}s`
						: `could not reach ElevenLabs (${errorMessage(error)})`,
				),
			);
		} finally {
			if (timer) {
				clearTimeout(timer);
			}
		}
		if (!response.ok) {
			const detail = extractErrorDetail(await response.text().catch(() => ""));
			const failure = new Error(
				detail || `request failed (${response.status} ${response.statusText})`,
			);
			failure.status = response.status;
			if (response.status === 401 || response.status === 403) {
				markConnectionFailure(failure);
			}
			throw failure;
		}
		return response;
	}

	async _fetchRawVoices(apiKey) {
		const collected = [];
		let pageToken = "";
		// /v2/voices (not legacy /v1/voices): page 0 includes ElevenLabs' default voices, and it paginates past 500.
		for (let page = 0; page < 25; page++) {
			const query = `page_size=100${pageToken ? `&next_page_token=${encodeURIComponent(pageToken)}` : ""}`;
			// Throw (don't return []) on failure so Lumia keeps the previously-listed voices instead of clearing them.
			const response = await this._apiFetch(
				`https://api.elevenlabs.io/v2/voices?${query}`,
				{ headers: { "xi-api-key": apiKey } },
			);
			const data = await response.json();
			const voices = Array.isArray(data?.voices) ? data.voices : [];
			collected.push(...voices);
			if (!data?.has_more || !data?.next_page_token) {
				break;
			}
			pageToken = data.next_page_token;
		}
		return collected;
	}

	async _fetchModels(apiKey) {
		const response = await this._apiFetch(
			"https://api.elevenlabs.io/v1/models",
			{ headers: { "xi-api-key": apiKey } },
		);
		const data = await response.json();
		const models = Array.isArray(data) ? data : [];
		return models
			.filter((model) => model?.can_do_text_to_speech === true)
			.map((model) => ({ id: trimString(model?.model_id, ""), name: trimString(model?.name, model?.model_id) }))
			.filter((model) => model.id);
	}

	_buildOptions(items, selectedValue) {
		const options = [];
		const seen = new Set();
		for (const item of items) {
			const value = trimString(item?.value, "");
			if (!value || seen.has(value)) continue;
			seen.add(value);
			options.push({ label: trimString(item?.label, value), value });
		}
		const selected = trimString(selectedValue, "");
		if (selected && !seen.has(selected)) {
			options.unshift({ label: selected, value: selected });
		}
		return options;
	}

	async ttsVoices() {
		const apiKey = this.getSettingsSnapshot().apiKey;
		const problem = describeApiKeyProblem(apiKey);
		if (problem || typeof fetch !== "function") {
			await this._setConnection(false);
			if (problem) {
				await this.lumia.log(`[ElevenLabs] Skipping voice list: ${problem}`);
			}
			return [];
		}
		let raw;
		try {
			raw = await this._fetchRawVoices(apiKey);
		} catch (error) {
			await this._reportFailure(error, { context: "Voice list" });
			throw error;
		}
		await this._setConnection(true);
		const voices = [];
		for (const voice of raw) {
			const id = trimString(voice?.voice_id, "");
			if (!id) continue;
			voices.push({
				id,
				name: trimString(voice?.name, id),
				language: trimString(voice?.labels?.language, ""),
				previewUrl: trimString(voice?.preview_url, ""),
				// ElevenLabs exposes the voice image under `sharing` (only for shared voices); fall back to the ElevenLabs mark.
				imageUrl: trimString(voice?.sharing?.image_url ?? voice?.image_url, "") || ELEVENLABS_LOGO_DATA_URI,
			});
		}
		return voices;
	}

	async refreshActionOptions({ actionType, values } = {}) {
		if (actionType && actionType !== "speak") {
			return;
		}
		if (typeof this.lumia?.updateActionFieldOptions !== "function" || typeof fetch !== "function") {
			return;
		}
		const apiKey = this.getSettingsSnapshot().apiKey;
		const problem = describeApiKeyProblem(apiKey);
		if (problem) {
			await this._setConnection(false);
			await this.lumia.log(`[ElevenLabs] Skipping option refresh: ${problem}`);
			return;
		}

		try {
			const raw = await this._fetchRawVoices(apiKey);
			this._voiceCount = raw.length;
			const voiceItems = raw.map((voice) => ({ label: trimString(voice?.name, voice?.voice_id), value: trimString(voice?.voice_id, "") }));
			await this.lumia.updateActionFieldOptions({
				actionType: "speak",
				fieldKey: "voiceId",
				options: this._buildOptions(voiceItems, values?.voiceId),
			});
			await this._setConnection(true);
		} catch (error) {
			await this._reportFailure(error, {
				context: "Voice options",
				silent: true,
			});
		}

		try {
			let models = FALLBACK_TTS_MODELS;
			try {
				const fetched = await this._fetchModels(apiKey);
				this._modelsPermission = true;
				if (fetched.length) {
					models = fetched;
				}
			} catch (error) {
				if (isPermissionError(error)) {
					this._modelsPermission = false;
				}
				// "Models" is an optional key permission. Skip _reportFailure on purpose: its 401 would
				// otherwise flip the connection badge to disconnected even though speech still works.
				await this.lumia.log(
					`[ElevenLabs] Model list unavailable, using the built-in models: ${errorMessage(error)}`,
				);
			}
			const modelItems = models.map((model) => ({ label: model.name, value: model.id }));
			await this.lumia.updateActionFieldOptions({
				actionType: "speak",
				fieldKey: "modelId",
				options: this._buildOptions(modelItems, values?.modelId || DEFAULTS.modelId),
			});
		} catch (error) {
			await this.lumia.log(
				`[ElevenLabs] Model options failed: ${errorMessage(error)}`,
			);
		}
	}

	async synthesizeTts(request = {}) {
		const apiKey = this.getSettingsSnapshot().apiKey;
		const apiKeyProblem = describeApiKeyProblem(apiKey);
		if (apiKeyProblem) {
			throw markConnectionFailure(new Error(apiKeyProblem));
		}
		const voiceId = trimString(request.voiceId, "");
		if (!voiceId) {
			throw new Error("Missing ElevenLabs voice id");
		}
		const message = trimString(request.message, "");
		if (!message) {
			throw new Error("Missing message text");
		}
		if (typeof fetch !== "function") {
			throw new Error("fetch is not available in this runtime");
		}

		const modelId = DEFAULTS.modelId;
		const text = truncateText(message, getCharLimitForModel(modelId)).text;
		const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream`;
		let response;
		try {
			// _apiFetch surfaces ElevenLabs' human-readable reason (e.g. plan/permission errors) instead of a raw status code.
			response = await this._apiFetch(endpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"xi-api-key": apiKey,
				},
				body: JSON.stringify({
					text,
					model_id: modelId,
					voice_settings: buildVoiceSettings({
						stability: DEFAULTS.stability,
						similarityBoost: DEFAULTS.similarityBoost,
						style: DEFAULTS.style,
						speakerBoost: DEFAULTS.speakerBoost,
					}),
				}),
			});
		} catch (error) {
			await this._reportFailure(error, { context: "Speech" });
			throw error;
		}
		await this._setConnection(true);
		const audioBuffer = await response.arrayBuffer();
		return {
			audio: Buffer.from(audioBuffer).toString("base64"),
			mime: "audio/mpeg",
		};
	}

	async actions(config) {
		for (const action of config.actions) {
			try {
				const actionData = action.value;
				if (action.type === "speak") {
					await this.handleSpeak(actionData);
				} else if (action.type === "stream_music") {
					await this.handleStreamMusic(actionData);
				}
			} catch (error) {
				await this._reportFailure(error, { context: `Action ${action.type}` });
			}
		}
	}

	async handleSpeak(data = {}) {
		const settings = this.getSettingsSnapshot();
		let message = trimString(data.message || data.text, "");
		if (!message) {
			await this._toast(
				"ElevenLabs: the Speak action has no message text",
				"error",
			);
			return;
		}

		const apiKey = settings.apiKey;
		const apiKeyProblem = describeApiKeyProblem(apiKey);
		if (apiKeyProblem) {
			await this._setConnection(false);
			await this._toast(`ElevenLabs: ${apiKeyProblem}`, "error");
			return;
		}

		const voiceId = trimString(data.voiceId, "");
		if (!voiceId) {
			await this._toast("ElevenLabs: the Speak action has no voice selected", "error");
			return;
		}
		const modelId = trimString(data.modelId, DEFAULTS.modelId);
		const modelLimit = getCharLimitForModel(modelId);
		const userLimit = getOptionalLimit(data.maxChars);
		const effectiveLimit =
			modelLimit && userLimit
				? Math.min(modelLimit, userLimit)
				: (modelLimit ?? userLimit);
		const truncatedMessage = truncateText(message, effectiveLimit);
		message = truncatedMessage.text;
		if (truncatedMessage.truncated) {
			const limitLabel =
				modelLimit && userLimit
					? `${effectiveLimit} (min of model ${modelLimit} and user ${userLimit})`
					: `${effectiveLimit}`;
		}
		const outputFormat = DEFAULTS.outputFormat;
		const stability = Number.isFinite(toNumber(data.stability, NaN))
			? toNumber(data.stability, NaN)
			: DEFAULTS.stability;
		const similarityBoost = Number.isFinite(toNumber(data.similarityBoost, NaN))
			? toNumber(data.similarityBoost, NaN)
			: DEFAULTS.similarityBoost;
		const style = Number.isFinite(toNumber(data.style, NaN))
			? toNumber(data.style, NaN)
			: DEFAULTS.style;
		const speakerBoost = DEFAULTS.speakerBoost;
		const volume = Number.isFinite(toNumber(data.volume, NaN))
			? toNumber(data.volume, NaN)
			: DEFAULTS.volume;
		const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream`;
		const voiceSettings = buildVoiceSettings({
			stability,
			similarityBoost,
			style,
			speakerBoost,
		});

		if (typeof fetch !== "function") {
			throw new Error("fetch is not available in this runtime");
		}
		if (
			typeof Blob === "undefined" ||
			typeof URL === "undefined" ||
			typeof URL.createObjectURL !== "function"
		) {
			throw new Error("Blob/URL APIs are not available in this runtime");
		}

		const response = await this._apiFetch(endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"xi-api-key": apiKey,
			},
			body: JSON.stringify({
				text: message,
				model_id: modelId,
				voice_settings: voiceSettings,
			}),
		});
		await this._setConnection(true);

		const audioBuffer = await response.arrayBuffer();
		const audioBlob = new Blob([audioBuffer], {
			type: getAudioMimeType(outputFormat),
		});
		const audioUrl = URL.createObjectURL(audioBlob);

		await this.lumia.playAudio({
			path: audioUrl,
			volume,
			waitForAudioToStop: true,
		});
		URL.revokeObjectURL(audioUrl);
	}

	async handleStreamMusic(data = {}) {
		const settings = this.getSettingsSnapshot();
		const apiKey = settings.apiKey;
		const apiKeyProblem = describeApiKeyProblem(apiKey);
		if (apiKeyProblem) {
			await this._setConnection(false);
			await this._toast(`ElevenLabs: ${apiKeyProblem}`, "error");
			return;
		}

		let prompt = trimString(data.prompt || data.text, "");
		const compositionPlan = parseJson(
			data.compositionPlanJson || data.composition_plan || "",
		);
		if (!prompt && !compositionPlan) {
			await this._toast(
				"ElevenLabs: the Stream Music action needs a prompt or composition plan",
				"error",
			);
			return;
		}

		const modelId = trimString(data.modelId, "music_v1");
		const promptLimit = getOptionalLimit(data.maxPromptChars);
		if (promptLimit && prompt) {
			const truncatedPrompt = truncateText(prompt, promptLimit);
			prompt = truncatedPrompt.text;
			if (truncatedPrompt.truncated) {
			}
		}
		const outputFormat = DEFAULTS.outputFormat;
		const musicLengthMs = toNumber(
			data.musicLengthMs ?? data.music_length_ms,
			15000,
		);
		const forceInstrumental = toBoolean(
			data.forceInstrumental ?? data.force_instrumental,
			true,
		);
		const volume = Number.isFinite(toNumber(data.volume, NaN))
			? toNumber(data.volume, NaN)
			: DEFAULTS.volume;
		const saveToDesktop = toBoolean(data.saveToDesktop, false);
		// Always wait for playback to finish so we can safely revoke the blob URL.

		if (typeof fetch !== "function") {
			throw new Error("fetch is not available in this runtime");
		}
		if (
			typeof Blob === "undefined" ||
			typeof URL === "undefined" ||
			typeof URL.createObjectURL !== "function"
		) {
			throw new Error("Blob/URL APIs are not available in this runtime");
		}

		// "Music Generation" is an optional key permission, so a scoped-out key must not read as disconnected.
		const endpoint = `https://api.elevenlabs.io/v1/music/stream?output_format=${encodeURIComponent(outputFormat)}`;
		const body = {
			model_id: modelId,
			music_length_ms: musicLengthMs,
			force_instrumental: forceInstrumental,
			...(prompt ? { prompt } : {}),
			...(compositionPlan ? { composition_plan: compositionPlan } : {}),
		};

		const musicSeconds = Math.max(1, Math.round(musicLengthMs / 1000));
		await this._toast(
			`ElevenLabs: generating ${musicSeconds}s of music\u2026 this can take a moment.`,
			"info",
			INFO_TOAST_DURATION_MS,
		);

		let response;
		try {
			response = await this._apiFetch(endpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"xi-api-key": apiKey,
				},
				body: JSON.stringify(body),
			});
		} catch (error) {
			if (isPermissionError(error)) {
				this._musicPermission = false;
				throw new Error(
					`${errorMessage(error)} Turn on "Music Generation" for this API key in your ElevenLabs key settings.`,
				);
			}
			throw error;
		}
		this._musicPermission = true;
		await this._setConnection(true);

		const audioBuffer = await response.arrayBuffer();
		const audioBlob = new Blob([audioBuffer], {
			type: getAudioMimeType(outputFormat),
		});
		const audioUrl = URL.createObjectURL(audioBlob);

		await this.lumia.playAudio({
			path: audioUrl,
			volume,
			waitForAudioToStop: true,
		});
		URL.revokeObjectURL(audioUrl);

		if (saveToDesktop) {
			const desktopPath = getDesktopPath();
			if (!desktopPath) {
				await this._toast(
					"ElevenLabs: could not resolve your Desktop folder to save the music file",
					"error",
				);
				return;
			}
			const filename = buildMusicFilename(outputFormat);
			const filePath = path.join(desktopPath, filename);
			await fs.writeFile(filePath, Buffer.from(audioBuffer));
		}
	}
}

module.exports = ElevenLabsTTSPlugin;
```

### elevenlabs_tts/actions_tutorial.md

```markdown
---
### 📢 Speak Action
1) Enter the **Message** you want spoken.
2) Paste the **Voice ID** you copied from ElevenLabs (find it at https://elevenlabs.io/app/voice-lab).
3) Choose a **Model ID** (view model docs at https://elevenlabs.io/docs/overview/models#models-overview).
4) Adjust **Stability**, **Similarity Boost**, and **Style** if desired.
---
### 🎵 Stream Music Action
1) Enter a **Prompt** (or provide a Composition Plan JSON).
2) Choose the **Model ID** (see music model docs at https://elevenlabs.io/docs/overview/models#models-overview).
3) Set **Music Length** and **Volume**.

> ⚠️ This action needs the **Music Generation** permission on your ElevenLabs API key. If your key has **Restrict Key** turned on, enable **Music Generation** → **Access** at https://elevenlabs.io/app/settings/api-keys.
---
```

### elevenlabs_tts/settings_tutorial.md

```markdown
---
### 💳 Cloned Voices Need a Paid ElevenLabs Plan
ElevenLabs' **premade voices work on any plan**, including Free. Using your own **instantly-cloned voices requires a paid ElevenLabs plan (Starter or higher)** — otherwise synthesis fails with a "subscription required" error and Lumia falls back to the default voice.
---
### 🔐 Get Your ElevenLabs API Key
1) Open https://elevenlabs.io/app/settings/api-keys while logged in and click **Create API Key**.
2) ElevenLabs pops up an **API Key** dialog (titled with the name you gave the key) showing the secret. That value — it **starts with `sk_`** and is **51 characters** — is what Lumia needs.
3) Copy it (**Copy to Clipboard**) *before closing the dialog* and paste it into the **API Key** field here.

> ⚠️ **Paste the API Key, not the Key ID.** The **Key ID** shown in the keys table is a 64-character identifier, **not** a credential — ElevenLabs rejects it with *"API key ID used as API key"*. If it doesn't start with `sk_`, it's the wrong value.
>
> The API Key is only displayed once, in that creation dialog. If you closed it without copying, rotate the key to get a new one.
---
### 🔑 Give the Key the Right Permissions
If you turn on **Restrict Key**, you must grant these endpoints — otherwise Lumia can't load your voices (you'll get a `401` when it lists them):

- **Text to Speech** → **Access**
- **Voices** → **Read**

These two are optional — turn them on only if you want the feature:

- **Music Generation** → **Access** — required by the **Stream Music** action. Without it, Speak and Lumia's TTS voices work fine, but Stream Music fails with *"missing the permission music_generation"*.
- **Models** → **Access** — only lists the speech models live from your account. Without it the **Model ID** dropdown falls back to a built-in list of ElevenLabs models (and you can always type a model ID), so speech still works normally.

Leaving **Restrict Key** off also works — the key then has full access.

![ElevenLabs Edit API Key dialog: required Text to Speech Access and Voices Read; optional Music Generation Access for Stream Music and Models Access for the live model list](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA3MDAgNTI4IiBmb250LWZhbWlseT0iLWFwcGxlLXN5c3RlbSxTZWdvZSBVSSxSb2JvdG8sSGVsdmV0aWNhLEFyaWFsLHNhbnMtc2VyaWYiPgogIDxyZWN0IHg9IjEiIHk9IjEiIHdpZHRoPSI2OTgiIGhlaWdodD0iNTI2IiByeD0iMTgiIGZpbGw9IiNmZmZmZmYiIHN0cm9rZT0iI2U1ZTdlYiIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPHRleHQgeD0iMzQiIHk9IjUyIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iNzAwIiBmaWxsPSIjMTExODI3Ij5FZGl0IEFQSSBLZXk8L3RleHQ+CiAgPGxpbmUgeDE9IjM0IiB5MT0iNzQiIHgyPSI2NjYiIHkyPSI3NCIgc3Ryb2tlPSIjZWVmMGYzIiBzdHJva2Utd2lkdGg9IjIiLz4KCiAgPHRleHQgeD0iMzQiIHk9IjExOCIgZm9udC1zaXplPSIyMCIgZm9udC13ZWlnaHQ9IjYwMCIgZmlsbD0iIzExMTgyNyI+UmVzdHJpY3QgS2V5PC90ZXh0PgogIDxyZWN0IHg9IjU5NiIgeT0iMTAwIiB3aWR0aD0iNzAiIGhlaWdodD0iMzAiIHJ4PSIxNSIgZmlsbD0iIzExMTgyNyIvPgogIDxjaXJjbGUgY3g9IjY1MSIgY3k9IjExNSIgcj0iMTEiIGZpbGw9IiNmZmZmZmYiLz4KCiAgPHJlY3QgeD0iMjAiIHk9IjE1MiIgd2lkdGg9IjQiIGhlaWdodD0iMTQwIiByeD0iMiIgZmlsbD0iIzA1OTY2OSIvPgogIDx0ZXh0IHg9IjM0IiB5PSIxNzQiIGZvbnQtc2l6ZT0iMTUiIGZvbnQtd2VpZ2h0PSI3MDAiIGZpbGw9IiMwNTk2NjkiIGxldHRlci1zcGFjaW5nPSIwLjUiPlJFUVVJUkVEPC90ZXh0PgogIDx0ZXh0IHg9IjEyNiIgeT0iMTc0IiBmb250LXNpemU9IjE0IiBmaWxsPSIjOWNhM2FmIj5MdW1pYSBjYW4mIzgyMTc7dCBjb25uZWN0IHdpdGhvdXQgdGhlc2U8L3RleHQ+CgogIDx0ZXh0IHg9IjM0IiB5PSIyMjAiIGZvbnQtc2l6ZT0iMTkiIGZpbGw9IiMxMTE4MjciPlRleHQgdG8gU3BlZWNoPC90ZXh0PgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQ2OCwyMDApIj4KICAgIDxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxOTgiIGhlaWdodD0iNDAiIHJ4PSIxMCIgZmlsbD0iI2VlZjBmMyIvPgogICAgPHJlY3QgeD0iMTAwIiB5PSI0IiB3aWR0aD0iOTMiIGhlaWdodD0iMzIiIHJ4PSI4IiBmaWxsPSIjZmZmZmZmIiBzdHJva2U9IiNlNWU3ZWIiLz4KICAgIDx0ZXh0IHg9IjUwIiB5PSIyNSIgZm9udC1zaXplPSIxNSIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gQWNjZXNzPC90ZXh0PgogICAgPHRleHQgeD0iMTQ4IiB5PSIyNSIgZm9udC1zaXplPSIxNSIgZm9udC13ZWlnaHQ9IjcwMCIgZmlsbD0iIzExMTgyNyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QWNjZXNzPC90ZXh0PgogIDwvZz4KCiAgPHRleHQgeD0iMzQiIHk9IjI3MiIgZm9udC1zaXplPSIxOSIgZmlsbD0iIzExMTgyNyI+Vm9pY2VzPC90ZXh0PgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDM4OCwyNTIpIj4KICAgIDxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIyNzgiIGhlaWdodD0iNDAiIHJ4PSIxMCIgZmlsbD0iI2VlZjBmMyIvPgogICAgPHJlY3QgeD0iOTQiIHk9IjQiIHdpZHRoPSI4NyIgaGVpZ2h0PSIzMiIgcng9IjgiIGZpbGw9IiNmZmZmZmYiIHN0cm9rZT0iI2U1ZTdlYiIvPgogICAgPHRleHQgeD0iNDYiIHk9IjI1IiBmb250LXNpemU9IjE1IiBmaWxsPSIjNmI3MjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBBY2Nlc3M8L3RleHQ+CiAgICA8dGV4dCB4PSIxMzkiIHk9IjI1IiBmb250LXNpemU9IjE1IiBmb250LXdlaWdodD0iNzAwIiBmaWxsPSIjMTExODI3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5SZWFkPC90ZXh0PgogICAgPHRleHQgeD0iMjMyIiB5PSIyNSIgZm9udC1zaXplPSIxNSIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+V3JpdGU8L3RleHQ+CiAgPC9nPgoKICA8cmVjdCB4PSIyMCIgeT0iMzEyIiB3aWR0aD0iNCIgaGVpZ2h0PSIxNDAiIHJ4PSIyIiBmaWxsPSIjZDFkNWRiIi8+CiAgPHRleHQgeD0iMzQiIHk9IjMzNCIgZm9udC1zaXplPSIxNSIgZm9udC13ZWlnaHQ9IjcwMCIgZmlsbD0iIzljYTNhZiIgbGV0dGVyLXNwYWNpbmc9IjAuNSI+T1BUSU9OQUw8L3RleHQ+CiAgPHRleHQgeD0iMTI2IiB5PSIzMzQiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiPnR1cm4gb24gb25seSB0aGUgZmVhdHVyZXMgeW91IHdhbnQ8L3RleHQ+CgogIDx0ZXh0IHg9IjM0IiB5PSIzODAiIGZvbnQtc2l6ZT0iMTkiIGZpbGw9IiMzNzQxNTEiPk11c2ljIEdlbmVyYXRpb248L3RleHQ+CiAgPHRleHQgeD0iMjEyIiB5PSIzODAiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiPlN0cmVhbSBNdXNpYyBhY3Rpb248L3RleHQ+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNDY4LDM2MCkiPgogICAgPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjE5OCIgaGVpZ2h0PSI0MCIgcng9IjEwIiBmaWxsPSIjZWVmMGYzIi8+CiAgICA8cmVjdCB4PSIxMDAiIHk9IjQiIHdpZHRoPSI5MyIgaGVpZ2h0PSIzMiIgcng9IjgiIGZpbGw9IiNmZmZmZmYiIHN0cm9rZT0iI2QxZDVkYiIgc3Ryb2tlLWRhc2hhcnJheT0iNSAzIi8+CiAgICA8dGV4dCB4PSI1MCIgeT0iMjUiIGZvbnQtc2l6ZT0iMTUiIGZpbGw9IiM2YjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk5vIEFjY2VzczwvdGV4dD4KICAgIDx0ZXh0IHg9IjE0OCIgeT0iMjUiIGZvbnQtc2l6ZT0iMTUiIGZvbnQtd2VpZ2h0PSI2MDAiIGZpbGw9IiMzNzQxNTEiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkFjY2VzczwvdGV4dD4KICA8L2c+CgogIDx0ZXh0IHg9IjM0IiB5PSI0MzIiIGZvbnQtc2l6ZT0iMTkiIGZpbGw9IiMzNzQxNTEiPk1vZGVsczwvdGV4dD4KICA8dGV4dCB4PSIxMTgiIHk9IjQzMiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYTNhZiI+bGl2ZSBtb2RlbCBsaXN0ICYjODIxMjsgYSBidWlsdCYjODIwOTtpbiBsaXN0IGlzIHVzZWQgd2l0aG91dCBpdDwvdGV4dD4KICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSg0NjgsNDEyKSI+CiAgICA8cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTk4IiBoZWlnaHQ9IjQwIiByeD0iMTAiIGZpbGw9IiNlZWYwZjMiLz4KICAgIDxyZWN0IHg9IjEwMCIgeT0iNCIgd2lkdGg9IjkzIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iI2ZmZmZmZiIgc3Ryb2tlPSIjZDFkNWRiIiBzdHJva2UtZGFzaGFycmF5PSI1IDMiLz4KICAgIDx0ZXh0IHg9IjUwIiB5PSIyNSIgZm9udC1zaXplPSIxNSIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gQWNjZXNzPC90ZXh0PgogICAgPHRleHQgeD0iMTQ4IiB5PSIyNSIgZm9udC1zaXplPSIxNSIgZm9udC13ZWlnaHQ9IjYwMCIgZmlsbD0iIzM3NDE1MSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QWNjZXNzPC90ZXh0PgogIDwvZz4KCiAgPGxpbmUgeDE9IjM0IiB5MT0iNDY2IiB4Mj0iNjY2IiB5Mj0iNDY2IiBzdHJva2U9IiNlZWYwZjMiIHN0cm9rZS13aWR0aD0iMiIvPgogIDx0ZXh0IHg9IjM0IiB5PSI1MDAiIGZvbnQtc2l6ZT0iMTUiIGZpbGw9IiM2YjcyODAiPkxlYXZpbmcgPHRzcGFuIGZvbnQtd2VpZ2h0PSI3MDAiIGZpbGw9IiMxMTE4MjciPlJlc3RyaWN0IEtleTwvdHNwYW4+IG9mZiBncmFudHMgZXZlcnl0aGluZy48L3RleHQ+CiAgPHRleHQgeD0iMzgwIiB5PSI1MDAiIGZvbnQtc2l6ZT0iMTUiIGZpbGw9IiM5Y2EzYWYiPlNvdW5kIEVmZmVjdHMgaXMgPHRzcGFuIGZvbnQtd2VpZ2h0PSI3MDAiPm5vdDwvdHNwYW4+IHVzZWQgYnkgdGhpcyBwbHVnaW4uPC90ZXh0Pgo8L3N2Zz4K)
---
### 🎙️ Using ElevenLabs voices in Lumia's TTS
Once your API key is saved, your ElevenLabs voices show up in Lumia's native **Text to Speech** voice picker (alerts, chatbox/event-list read-aloud, the `!tts` command, and TTS actions) — no need to wire the Speak action manually. Pick one anywhere Lumia asks for a TTS voice.
---
### 🎛️ Voice Tuning (used in Actions)
- **Stability**: Higher values make speech more consistent/predictable; lower values sound more dynamic.
- **Similarity Boost**: Higher values keep output closer to the original voice; lower values allow more variation.
- **Style**: Adds expressiveness/character; higher values can sound more dramatic.
---
```

### elevenlabs_tts/package.json

```json
{
	"name": "lumia-elevenlabs-tts",
	"version": "1.0.0",
	"private": true,
	"description": "ElevenLabs TTS plugin for Lumia Stream.",
	"main": "main.js",
	"dependencies": {
		"@lumiastream/plugin": "^0.4.1"
	}
}
```

## Example: song_request_source

Source folder `examples/song_request_source`, category `audio`. Example song-request source plugin: resolves viewer requests to fake tracks and simulates playback so you can test the full song-request round trip.

### song_request_source/manifest.json

```json
{
	"id": "song_request_source",
	"name": "Demo Song Source",
	"version": "1.0.0",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://lumiastream.com",
	"repository": "",
	"description": "Example song-request source plugin: resolves viewer requests to fake tracks and simulates playback so you can test the full song-request round trip.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "audio",
	"keywords": "song request, music, example, demo",
	"config": {
		"hasSongRequests": true,
		"songRequest": {
			"label": "Demo Source",
			"supportsSearch": true,
			"supportsSkip": true,
			"supportsPause": true,
			"supportsVolume": true,
			"supportsQueue": false
		}
	}
}
```

### song_request_source/main.js

```javascript
const { Plugin } = require("@lumiastream/plugin");

const TRACK_SECONDS = 20;

class DemoSongSource extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this.current = null;
		this.timer = null;
		this.remainingMs = 0;
		this.startedAt = 0;
	}

	async onload() {
		await this.lumia.updateConnection(true);
		this.lumia.log("Demo song source ready");
	}

	async onunload() {
		this.clearTimer();
		this.current = null;
		await this.lumia.updateConnection(false);
	}

	async resolveSongRequest({ query, requesterUsername, requesterPlatform }) {
		const trimmed = String(query ?? "").trim();
		if (!trimmed || trimmed.toLowerCase().includes("unfindable")) {
			return null;
		}
		if (trimmed.toLowerCase().includes("unresolved")) {
			return { resolved: false, track: { artist: "Unknown Artist" } };
		}
		return {
			id: `demo-${Buffer.from(trimmed.toLowerCase()).toString("base64url")}`,
			title: trimmed.replace(/\b\w/g, (c) => c.toUpperCase()),
			artist: "Demo Artist",
			thumbnailUrl: "https://storage.lumiastream.com/logo/lumia-icon.png",
			url: `https://example.com/track/${encodeURIComponent(trimmed)}`,
			durationSeconds: TRACK_SECONDS,
			requesterUsername,
			requesterPlatform,
		};
	}

	async playSongRequest(track) {
		this.clearTimer();
		this.current = track;
		this.remainingMs = (track.durationSeconds ?? TRACK_SECONDS) * 1000;
		this.lumia.log(`Playing: ${track.title} (requested by ${track.requesterUsername ?? "unknown"})`);
		await this.lumia.songRequestNowPlaying(track);
		this.armEndTimer();
	}

	async skipSongRequest() {
		if (!this.current) return;
		this.lumia.log(`Skipping: ${this.current.title}`);
		await this.finishTrack();
	}

	async pauseSongRequest() {
		if (!this.current || !this.timer) return;
		this.remainingMs = Math.max(0, this.remainingMs - (Date.now() - this.startedAt));
		this.clearTimer();
		this.lumia.log(`Paused: ${this.current.title}`);
	}

	async resumeSongRequest() {
		if (!this.current || this.timer) return;
		this.lumia.log(`Resumed: ${this.current.title}`);
		this.armEndTimer();
	}

	async setSongRequestVolume(volume) {
		this.lumia.log(`Volume set to ${volume}%`);
	}

	async clearSongRequestQueue() {
		this.lumia.log("Queue cleared by Lumia");
	}

	armEndTimer() {
		this.startedAt = Date.now();
		this.timer = setTimeout(() => {
			void this.finishTrack();
		}, this.remainingMs);
	}

	async finishTrack() {
		const ended = this.current;
		this.clearTimer();
		this.current = null;
		if (ended) {
			await this.lumia.songRequestEnded(ended.id);
		}
	}

	clearTimer() {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
	}
}

module.exports = DemoSongSource;
```

## Example: tts_monster

Source folder `examples/tts_monster`, category `audio`. Generate TTS Monster speech audio and play it through Lumia Stream.

### tts_monster/manifest.json

```json
{
	"id": "tts_monster",
	"name": "TTS Monster",
	"version": "1.3.0",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://tts.monster",
	"description": "Generate TTS Monster speech audio and play it through Lumia Stream.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "audio",
	"keywords": "tts monster, tts.monster, tts, text-to-speech, voice, audio",
	"icon": "tts_monster.jpg",
	"config": {
		"settings_tutorial": "./settings_tutorial.md",
		"actions_tutorial": "./actions_tutorial.md",
		"settings": [
			{
				"key": "authMethod",
				"label": "Connection Method",
				"type": "select",
				"defaultValue": "overlayUrl",
				"options": [
					{
						"label": "Overlay URL",
						"value": "overlayUrl"
					},
					{
						"label": "Developer API Token",
						"value": "developerApi"
					}
				],
				"helperText": "Choose Developer API Token for the official console API, or Overlay URL if you only have your TTS Monster overlay link.",
				"refreshOnChange": true
			},
			{
				"key": "apiKey",
				"label": "API Token",
				"type": "password",
				"helperText": "Used when Connection Method is Developer API Token. Create or copy your API token from the TTS Monster developer dashboard.",
				"visibleIf": {
					"key": "authMethod",
					"equals": "developerApi"
				},
				"refreshOnChange": true
			},
			{
				"key": "overlayUrl",
				"label": "Overlay URL",
				"type": "password",
				"helperText": "Used when Connection Method is Overlay URL. Paste your full overlay URL, for example https://tts.monster/overlay/3hoZh83Uigewkx0Upw66imx2ASj1/059e9e17a7c64a42b38b6bbf7b40bee3",
				"visibleIf": {
					"key": "authMethod",
					"equals": "overlayUrl"
				},
				"refreshOnChange": true
			},
			{
				"key": "returnUsage",
				"label": "Log Character Usage",
				"type": "toggle",
				"defaultValue": true,
				"helperText": "For Developer API Token, requests `return_usage` on generate calls and logs current usage. For Overlay URL, shows start/result toasts."
			},
			{
				"key": "requestTimeoutMs",
				"label": "Request Timeout (ms)",
				"type": "number",
				"defaultValue": 0,
				"min": 0,
				"max": 300000,
				"helperText": "How long to wait for TTS Monster API responses. Set to 0 to disable the timeout."
			}
		],
		"actions": [
			{
				"type": "speak",
				"label": "Speak",
				"description": "Generate speech with TTS Monster and play it in Lumia.",
				"refreshOnChange": true,
				"fields": [
					{
						"key": "message",
						"label": "Message",
						"type": "textarea",
						"defaultValue": "Hello from Lumia!",
						"helperText": "Text to synthesize. TTS Monster currently uses only the first 500 characters.",
						"allowVariables": true
					},
					{
						"key": "voice",
						"label": "Voice",
						"type": "select",
						"options": [],
						"dynamicOptions": true,
						"allowTyping": true,
						"allowVariables": true,
						"required": true,
						"helperText": "Choose a cached voice, or type either a voice name or voice ID. Developer API voice IDs are available at https://console.tts.monster/voices; Overlay URL voices use the names from the overlay account."
					},
					{
						"key": "volume",
						"label": "Volume",
						"type": "number",
						"defaultValue": 100,
						"min": 0,
						"max": 100,
						"helperText": "Playback volume in Lumia (0-100)."
					},
					{
						"key": "waitForAudioToStop",
						"label": "Wait For Playback To Finish",
						"type": "switch",
						"defaultValue": true,
						"helperText": "If enabled, the action waits for the generated speech to finish before continuing."
					}
				]
			}
		],
		"hasTtsVoices": true,
		"ttsVoiceSource": {
			"label": "TTS Monster"
		}
	}
}
```

### tts_monster/main.js

```javascript
const { Plugin } = require("@lumiastream/plugin");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const API_BASE = "https://api.console.tts.monster";
const OVERLAY_VOICES_URL = "https://wutface.tts.monster/";
const OVERLAY_GENERATE_URL =
	"https://us-central1-tts-monster.cloudfunctions.net/generateTTS";
const TEMP_DIR_NAME = "lumia-tts-monster";

const AUTH_METHODS = {
	DEVELOPER_API: "developerApi",
	OVERLAY_URL: "overlayUrl",
};

const DEFAULTS = {
	authMethod: AUTH_METHODS.OVERLAY_URL,
	defaultVolume: 100,
	waitForAudioToStop: true,
	returnUsage: true,
	requestTimeoutMs: 0,
	voiceCacheTtlMs: 5 * 60 * 1000,
	maxMessageChars: 500,
	tempFileCleanupDelayMs: 10 * 60 * 1000,
};

const TTSMONSTER_LOGO_DATA_URI =
	"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcng9IjI0IiBmaWxsPSIjNmQyOGQ5Ii8+PGNpcmNsZSBjeD0iMzciIGN5PSI0MyIgcj0iOSIgZmlsbD0iI2ZmZmZmZiIvPjxjaXJjbGUgY3g9IjYzIiBjeT0iNDMiIHI9IjkiIGZpbGw9IiNmZmZmZmYiLz48Y2lyY2xlIGN4PSIzNyIgY3k9IjQ1IiByPSI0IiBmaWxsPSIjMWUxYjRiIi8+PGNpcmNsZSBjeD0iNjMiIGN5PSI0NSIgcj0iNCIgZmlsbD0iIzFlMWI0YiIvPjxwYXRoIGQ9Ik0zMiA2NCBxMTggMTYgMzYgMCIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjYiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPgo=";

const trimString = (value, fallback = "") => {
	if (typeof value !== "string") {
		return fallback;
	}
	const trimmed = value.trim();
	return trimmed.length ? trimmed : fallback;
};

const toNumber = (value, fallback) => {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === "string" && value.trim().length) {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) {
			return parsed;
		}
	}
	return fallback;
};

const toBoolean = (value, fallback) => {
	if (typeof value === "boolean") {
		return value;
	}
	if (typeof value === "string") {
		const normalized = value.trim().toLowerCase();
		if (["true", "1", "yes", "on"].includes(normalized)) {
			return true;
		}
		if (["false", "0", "no", "off"].includes(normalized)) {
			return false;
		}
	}
	return fallback;
};

const clamp = (value, min, max) => {
	if (!Number.isFinite(value)) {
		return min;
	}
	return Math.min(max, Math.max(min, value));
};

const truncateText = (text, limit) => {
	if (typeof text !== "string" || !limit || text.length <= limit) {
		return { text, truncated: false };
	}
	return {
		text: text.slice(0, limit),
		truncated: true,
	};
};

const normalizeVoiceSearchValue = (value) =>
	trimString(value, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ")
		.trim();

const normalizeApiToken = (value) =>
	trimString(value, "")
		.replace(/^Authorization:\s*/i, "")
		.replace(/^Bearer\s+/i, "")
		.replace(/^["']|["']$/g, "")
		.trim();

const parseOverlayUrl = (value) => {
	const raw = trimString(value, "");
	if (!raw) {
		return {
			ok: false,
			userId: "",
			apiKey: "",
			message: "Overlay URL is required.",
		};
	}

	let url;
	try {
		url = new URL(raw);
	} catch (_error) {
		try {
			url = new URL(`https://${raw}`);
		} catch (_fallbackError) {
			return {
				ok: false,
				userId: "",
				apiKey: "",
				message: "Overlay URL must be a valid TTS Monster overlay URL.",
			};
		}
	}

	const parts = url.pathname.split("/").filter(Boolean);
	const overlayIndex = parts.findIndex(
		(part) => part.toLowerCase() === "overlay",
	);
	const userId = trimString(
		overlayIndex >= 0
			? decodeURIComponent(parts[overlayIndex + 1] ?? "")
			: "",
	);
	const apiKey = trimString(
		overlayIndex >= 0
			? decodeURIComponent(parts[overlayIndex + 2] ?? "")
			: "",
	);
	if (!userId || !apiKey) {
		return {
			ok: false,
			userId: "",
			apiKey: "",
			message:
				"Overlay URL must look like https://tts.monster/overlay/{userId}/{token}.",
		};
	}

	return { ok: true, userId, apiKey, message: "" };
};

class TTSMonsterPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._voiceCache = { list: [], fetchedAt: 0, cacheKey: "" };
		this._voiceFetchPromise = null;
		this._lastVoiceFetchError = "";
		this._tempFileCleanupTimers = new Set();
	}

	async onload() {
		await this._validateConnection({ silent: true });
		void this._refreshVoiceCache({ silent: true });
		void this.refreshActionOptions({ actionType: "speak" });
	}

	async onsettingsupdate(settings, previous = {}) {
		const credentialsChanged =
			this._settingsAuthFingerprint(settings) !==
			this._settingsAuthFingerprint(previous);
		if (credentialsChanged) {
			await this._validateConnection({ silent: true, settings });
			void this._refreshVoiceCache({ force: true, silent: true, settings });
			if (typeof this.lumia.refreshTtsVoices === "function") {
				void this.lumia.refreshTtsVoices();
			}
		}
		void this.refreshActionOptions({ actionType: "speak", settings });
	}

	async validateAuth(data = {}) {
		return this._validateConnection({ silent: true, data });
	}

	async refreshActionOptions({ actionType, values, settings } = {}) {
		if (actionType && actionType !== "speak") {
			return;
		}
		if (typeof this.lumia?.updateActionFieldOptions !== "function") {
			return;
		}

		const previewSettings = this._mergeSettings(settings);
		const voices = await this._refreshVoiceCache({
			force: true,
			silent: true,
			settings: previewSettings,
		});
		const selectedValue = trimString(values?.voice, "");
		const options = this._buildVoiceOptions({
			voices,
			selectedValue,
			credentials: this._credentials(previewSettings),
		});

		await this.lumia.updateActionFieldOptions({
			actionType: "speak",
			fieldKey: "voice",
			options,
		});
	}

	async ttsVoices() {
		const settings = this._settingsSnapshot();
		const credentials = this._credentials(settings);
		if (!credentials.ok) {
			return [];
		}
		const voices = await this._refreshVoiceCache({ force: true, silent: true, settings });
		return (Array.isArray(voices) ? voices : [])
			.map((voice) => ({
				id: trimString(voice?.id, ""),
				name: trimString(voice?.name, voice?.id),
				language: trimString(voice?.language, ""),
				imageUrl: TTSMONSTER_LOGO_DATA_URI,
			}))
			.filter((voice) => voice.id);
	}

	async synthesizeTts(request = {}) {
		const settings = this._settingsSnapshot();
		const credentials = this._credentials(settings);
		if (!credentials.ok) {
			throw new Error(credentials.message);
		}
		const voiceId = trimString(request.voiceId, "");
		if (!voiceId) {
			throw new Error("Missing voice id");
		}
		let message = trimString(request.message, "");
		if (!message) {
			throw new Error("Missing message text");
		}
		message = truncateText(message, DEFAULTS.maxMessageChars).text;

		const response =
			credentials.authMethod === AUTH_METHODS.OVERLAY_URL
				? await this._generateOverlayTts({ credentials, voiceId, message, settings })
				: await this._generateDeveloperApiTts({ voiceId, message, returnUsage: false, settings });

		const audioUrl = trimString(response?.url ?? response?.link ?? response?.data?.link, "");
		if (!audioUrl) {
			throw new Error("TTS Monster did not return an audio URL.");
		}
		return { audioUrl };
	}

	async actions(config = {}) {
		const actions = Array.isArray(config.actions) ? config.actions : [];
		for (const action of actions) {
			try {
				if (action?.type === "speak") {
					await this._handleSpeak(action?.value ?? {});
				}
			} catch (error) {
				await this._log(
					`Action failed: ${error instanceof Error ? error.message : String(error)}`,
				);
			}
		}
	}

	async _handleSpeak(data = {}) {
		const settings = this._settingsSnapshot();
		const credentials = this._credentials(settings);
		if (!credentials.ok) {
			await this._log(credentials.message);
			return;
		}

		let message = trimString(data.message ?? data.text, "");
		if (!message) {
			await this._log("Missing message text.");
			return;
		}

		const voiceInput = trimString(data.voice, "");
		if (!voiceInput) {
			await this._log("Missing voice.");
			return;
		}
		if (voiceInput.startsWith("__")) {
			await this._log(
				"Voice is not loaded yet. Type a valid voice name or voice ID, or refresh the action.",
			);
			return;
		}
		let voiceId = "";
		try {
			voiceId = await this._resolveVoiceId(voiceInput, settings);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : String(error);
			await this._log(message);
			await this._showToast(`TTS Monster: ${message}`);
			return;
		}

		const truncated = truncateText(message, DEFAULTS.maxMessageChars);
		message = truncated.text;
		if (truncated.truncated) {
			await this._log(
				`Message exceeded ${DEFAULTS.maxMessageChars} characters and was truncated.`,
			);
		}

		const volume = clamp(
			toNumber(data.volume, DEFAULTS.defaultVolume),
			0,
			100,
		);
		const waitForAudioToStop = toBoolean(
			data.waitForAudioToStop,
			DEFAULTS.waitForAudioToStop,
		);
		const returnUsage = settings.returnUsage;
		if (returnUsage) {
			await this._showToast("TTS Monster: generating speech...");
		}

		const response =
			credentials.authMethod === AUTH_METHODS.OVERLAY_URL
				? await this._generateOverlayTts({
					credentials,
					voiceId,
					message,
					settings,
				})
				: await this._generateDeveloperApiTts({
					voiceId,
					message,
					returnUsage,
					settings,
				});

		const audioUrl = trimString(
			response?.url ?? response?.link ?? response?.data?.link,
			"",
		);
		if (!audioUrl) {
			throw new Error("TTS Monster did not return an audio URL.");
		}
		const playback = await this._preparePlaybackPath(audioUrl);
		try {
			await this.lumia.playAudio({
				path: playback.path,
				volume,
				waitForAudioToStop,
			});
		} finally {
			await this._cleanupPlaybackFile(playback, { waitForAudioToStop });
		}

		const usage = toNumber(
			response?.characterUsage ?? response?.character_usage,
			NaN,
		);
		if (returnUsage && Number.isFinite(usage)) {
			await this._log(`Character usage: ${Math.trunc(usage)}.`);
		}
		if (returnUsage) {
			const usageLabel = Number.isFinite(usage)
				? ` Quota used: ${Math.trunc(usage)} characters.`
				: "";
			await this._showToast(`TTS Monster: speech played.${usageLabel}`);
		}
	}

	async _generateDeveloperApiTts({ voiceId, message, returnUsage, settings }) {
		const response = await this._request("/generate", {
			method: "POST",
			body: {
				voice_id: voiceId,
				message,
				...(returnUsage ? { return_usage: true } : {}),
			},
			settings,
		});
		this._assertTtsMonsterStatus(response, "TTS Monster generation");
		return response;
	}

	async _generateOverlayTts({ credentials, voiceId, message, settings }) {
		const response = await this._overlayRequest({
			url: OVERLAY_GENERATE_URL,
			settings,
			body: {
				data: {
					userId: credentials.userId,
					key: credentials.apiKey,
					message: `${voiceId}: ${message}`,
					ai: true,
					details: {
						provider: "",
						test: false,
						event: "test",
						viewerId: null,
						raw: null,
					},
				},
			},
		});
		this._assertTtsMonsterStatus(response, "TTS Monster overlay generation");
		return response;
	}

	async _validateConnection({ silent = false, data = {}, settings } = {}) {
		const previewSettings = this._mergeSettings(settings, data);
		const credentials = this._credentials(previewSettings);
		if (!credentials.ok) {
			return { ok: false, message: credentials.message };
		}

		try {
			if (credentials.authMethod === AUTH_METHODS.OVERLAY_URL) {
				const payload = await this._fetchOverlayVoicePayload({
					credentials,
					settings: previewSettings,
				});
				const user = payload?.message;
				const voiceCount =
					(Array.isArray(user?.voices) ? user.voices.length : 0) +
					(Array.isArray(user?.customVoices) ? user.customVoices.length : 0);
				const username = trimString(user?.username, "");
				return {
					ok: true,
					message: username
						? `Validated overlay for ${username}. Loaded ${voiceCount} voices.`
						: `Validated overlay. Loaded ${voiceCount} voices.`,
				};
			}

			const user = await this._request("/user", {
				method: "POST",
				apiKey: credentials.apiKey,
				settings: previewSettings,
			});
			const usage = toNumber(user?.character_usage, NaN);
			const allowance = toNumber(user?.character_allowance, NaN);
			if (Number.isFinite(usage) && Number.isFinite(allowance)) {
				return {
					ok: true,
					message: `Validated. Usage ${Math.trunc(usage)}/${Math.trunc(allowance)} characters.`,
				};
			}
			return { ok: true };
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Validation failed.";
			if (!silent) {
				await this._log(`Validation failed: ${message}`);
			}
			return { ok: false, message };
		}
	}

	async _refreshVoiceCache({ force = false, silent = false, settings } = {}) {
		const requestSettings = settings ?? this.settings;
		const credentials = this._credentials(requestSettings);
		if (!credentials.ok) {
			this._voiceCache = { list: [], fetchedAt: 0, cacheKey: "" };
			this._lastVoiceFetchError = credentials.message;
			return [];
		}

		const now = Date.now();
		const isFresh =
			!force &&
			this._voiceCache.cacheKey === credentials.cacheKey &&
			now - this._voiceCache.fetchedAt < DEFAULTS.voiceCacheTtlMs;
		if (isFresh) {
			return this._voiceCache.list;
		}

		if (
			this._voiceFetchPromise &&
			this._voiceFetchPromise.cacheKey === credentials.cacheKey
		) {
			try {
				return await this._voiceFetchPromise.promise;
			} catch (_error) {
				return this._voiceCache.list;
			}
		}

		const promise = (async () => {
			const payload =
				credentials.authMethod === AUTH_METHODS.OVERLAY_URL
					? await this._fetchOverlayVoicePayload({
						credentials,
						settings: requestSettings,
					})
					: await this._request("/voices", {
						method: "POST",
						apiKey: credentials.apiKey,
						settings: requestSettings,
					});
			const list = this._normalizeVoices(payload);
			this._voiceCache = {
				list,
				fetchedAt: Date.now(),
				cacheKey: credentials.cacheKey,
			};
			this._lastVoiceFetchError = "";
			return list;
		})().finally(() => {
			if (this._voiceFetchPromise?.promise === promise) {
				this._voiceFetchPromise = null;
			}
		});
		this._voiceFetchPromise = {
			cacheKey: credentials.cacheKey,
			promise,
		};

		try {
			return await promise;
		} catch (error) {
			if (this._voiceCache.cacheKey !== credentials.cacheKey) {
				this._voiceCache = { list: [], fetchedAt: 0, cacheKey: "" };
			}
			this._lastVoiceFetchError =
				error instanceof Error ? error.message : String(error);
			if (!silent) {
				await this._log(
					`Failed to load voices: ${error instanceof Error ? error.message : String(error)}`,
				);
			}
			return this._voiceCache.list;
		}
	}

	async _fetchOverlayVoicePayload({ credentials, settings }) {
		const payload = await this._overlayRequest({
			url: OVERLAY_VOICES_URL,
			settings,
			body: {
				userId: credentials.userId,
				apiKey: credentials.apiKey,
				includeProviderToken: true,
			},
		});
		this._assertTtsMonsterStatus(payload, "TTS Monster overlay voice list");
		return payload;
	}

	_normalizeVoices(payload) {
		const root =
			payload?.message && typeof payload.message === "object"
				? payload.message
				: payload;
		const publicVoices = Array.isArray(root?.voices) ? root.voices : [];
		const customVoices = Array.isArray(root?.customVoices)
			? root.customVoices
			: [];

		const normalizeVoice = (voice, isCustom) => {
			if (typeof voice === "string") {
				const id = trimString(voice, "");
				return id
					? {
						id,
						name: id,
						sample: "",
						metadata: "",
						language: "",
						isCustom,
					}
					: null;
			}

			const fallbackId = trimString(
				voice?.id,
				trimString(voice?.value, trimString(voice?.name, "")),
			);
			const id = trimString(
				voice?.voice_id,
				fallbackId,
			);
			if (!id) {
				return null;
			}
			return {
				id,
				name: trimString(voice?.name, id),
				sample: trimString(voice?.sample, ""),
				metadata: trimString(voice?.metadata, ""),
				language: trimString(voice?.language, ""),
				isCustom,
			};
		};

		return [
			...customVoices.map((voice) => normalizeVoice(voice, true)),
			...publicVoices.map((voice) => normalizeVoice(voice, false)),
		]
			.filter(Boolean)
			.sort((left, right) => {
				if (left.isCustom !== right.isCustom) {
					return left.isCustom ? -1 : 1;
				}
				return left.name.localeCompare(right.name);
			});
	}

	_buildVoiceOptions({ voices, selectedValue, blankLabel, credentials }) {
		const options = [];
		const seen = new Set();

		const pushOption = (label, value) => {
			if (seen.has(value)) {
				return;
			}
			seen.add(value);
			options.push({ label, value });
		};

		if (typeof blankLabel === "string") {
			pushOption(blankLabel, "");
		}

		if (!credentials?.ok) {
			pushOption(
				credentials?.message ?? "Set credentials first",
				"__missing_auth__",
			);
			return options;
		}

		if (!Array.isArray(voices) || voices.length === 0) {
			const fallbackLabel = this._lastVoiceFetchError
				? `No voices loaded: ${this._lastVoiceFetchError}`
				: "No voices loaded yet. Type a voice name or voice ID manually.";
			pushOption(fallbackLabel, "__no_loaded_voices__");
			return options;
		}

		const selected = trimString(selectedValue, "");
		const hasSelectedVoice =
			selected &&
			voices.some(
				(voice) => voice.name === selected || voice.id === selected,
			);
		if (selected && !hasSelectedVoice) {
			pushOption(`Current value: ${selected}`, selected);
		}

		for (const voice of voices) {
			const suffixParts = [];
			if (voice.isCustom) {
				suffixParts.push("Custom");
			}
			if (voice.metadata) {
				suffixParts.push(voice.metadata);
			} else if (voice.language) {
				suffixParts.push(voice.language);
			}
			const suffix = suffixParts.length ? ` (${suffixParts.join(" | ")})` : "";
			pushOption(`${voice.name}${suffix}`, voice.name);
		}

		return options;
	}

	async _resolveVoiceId(input, settings) {
		const normalizedInput = trimString(input, "");
		if (!normalizedInput) {
			throw new Error("Voice is required.");
		}
		if (normalizedInput.startsWith("__")) {
			throw new Error("Voice is not loaded yet.");
		}

		const voices = await this._refreshVoiceCache({ silent: true, settings });
		const exactIdMatch = voices.find((voice) => voice.id === normalizedInput);
		if (exactIdMatch) {
			return exactIdMatch.id;
		}

		const foldedInput = normalizedInput.toLowerCase();
		const caseInsensitiveIdMatch = voices.find(
			(voice) => voice.id.toLowerCase() === foldedInput,
		);
		if (caseInsensitiveIdMatch) {
			return caseInsensitiveIdMatch.id;
		}

		const exactNameMatch = voices.find((voice) => voice.name === normalizedInput);
		if (exactNameMatch) {
			return exactNameMatch.id;
		}

		const caseInsensitiveNameMatches = voices.filter(
			(voice) => voice.name.toLowerCase() === foldedInput,
		);
		if (caseInsensitiveNameMatches.length === 1) {
			return caseInsensitiveNameMatches[0].id;
		}
		if (caseInsensitiveNameMatches.length > 1) {
			throw new Error(
				`Voice name "${normalizedInput}" matches multiple voices. Use the voice ID instead.`,
			);
		}

		const fuzzyMatch = this._findBestFuzzyVoiceMatch(voices, normalizedInput);
		if (fuzzyMatch?.voice?.id) {
			return fuzzyMatch.voice.id;
		}

		if (voices.length > 0) {
			throw new Error(`No voice can be found for "${normalizedInput}".`);
		}

		return normalizedInput;
	}

	_findBestFuzzyVoiceMatch(voices, input) {
		const normalizedInput = normalizeVoiceSearchValue(input);
		if (!normalizedInput) {
			return null;
		}

		const scored = voices
			.map((voice) => ({
				voice,
				score: this._scoreVoiceMatch(voice, normalizedInput),
			}))
			.filter((entry) => entry.score > 0)
			.sort((left, right) => right.score - left.score);

		if (!scored.length) {
			return null;
		}

		const best = scored[0];
		const next = scored[1];
		if (!best || best.score < 4) {
			return null;
		}
		if (next && next.score === best.score) {
			throw new Error(
				`Voice "${input}" matches multiple voices. Be more specific or use the voice ID instead.`,
			);
		}

		return best;
	}

	_scoreVoiceMatch(voice, normalizedInput) {
		const normalizedName = normalizeVoiceSearchValue(voice?.name);
		const normalizedId = normalizeVoiceSearchValue(voice?.id);
		const metadata = normalizeVoiceSearchValue(voice?.metadata);
		const parts = normalizedName ? normalizedName.split(" ") : [];

		if (!normalizedInput) {
			return 0;
		}
		if (normalizedName && normalizedName === normalizedInput) {
			return 100;
		}
		if (normalizedId && normalizedId === normalizedInput) {
			return 95;
		}
		if (normalizedName && normalizedName.startsWith(normalizedInput)) {
			return 80;
		}
		if (parts.some((part) => part.startsWith(normalizedInput))) {
			return 70;
		}
		if (normalizedName && normalizedName.includes(normalizedInput)) {
			return 60;
		}
		if (this._isSubsequenceMatch(normalizedName, normalizedInput)) {
			return 45;
		}
		if (metadata && metadata.includes(normalizedInput)) {
			return 20;
		}
		if (normalizedId && normalizedId.includes(normalizedInput)) {
			return 15;
		}

		return 0;
	}

	_isSubsequenceMatch(candidate, search) {
		if (!candidate || !search) {
			return false;
		}

		const compactCandidate = candidate.replace(/\s+/g, "");
		const compactSearch = search.replace(/\s+/g, "");
		if (!compactCandidate || !compactSearch) {
			return false;
		}

		let searchIndex = 0;
		for (const char of compactCandidate) {
			if (char === compactSearch[searchIndex]) {
				searchIndex += 1;
				if (searchIndex === compactSearch.length) {
					return true;
				}
			}
		}
		return false;
	}

	async _preparePlaybackPath(audioUrl) {
		if (typeof fetch !== "function") {
			return { path: audioUrl, tempFilePath: "" };
		}

		try {
			const response = await fetch(audioUrl);
			if (!response.ok) {
				return { path: audioUrl, tempFilePath: "" };
			}

			const audioBuffer = await response.arrayBuffer();
			const contentType = trimString(
				response.headers.get("content-type"),
				"audio/wav",
			);
			const tempFilePath = await this._writeTempAudioFile({
				audioBuffer,
				contentType,
				sourceUrl: audioUrl,
			});
			return { path: tempFilePath, tempFilePath };
		} catch (_error) {
			return { path: audioUrl, tempFilePath: "" };
		}
	}

	async _writeTempAudioFile({ audioBuffer, contentType, sourceUrl }) {
		const tempRoot = path.join(os.tmpdir(), TEMP_DIR_NAME);
		await fs.mkdir(tempRoot, { recursive: true });
		const extension = this._resolveAudioExtension({ contentType, sourceUrl });
		const filename = `tts-monster-${Date.now()}-${crypto.randomUUID()}.${extension}`;
		const filePath = path.join(tempRoot, filename);
		await fs.writeFile(filePath, Buffer.from(audioBuffer));
		return filePath;
	}

	_resolveAudioExtension({ contentType, sourceUrl }) {
		const normalizedType = trimString(contentType, "").toLowerCase();
		if (normalizedType.includes("mpeg") || normalizedType.includes("mp3")) {
			return "mp3";
		}
		if (normalizedType.includes("ogg")) {
			return "ogg";
		}
		if (normalizedType.includes("flac")) {
			return "flac";
		}
		if (normalizedType.includes("aac")) {
			return "aac";
		}
		if (normalizedType.includes("wav") || normalizedType.includes("wave")) {
			return "wav";
		}

		const pathname = trimString(sourceUrl, "").toLowerCase();
		if (pathname.endsWith(".mp3")) return "mp3";
		if (pathname.endsWith(".ogg")) return "ogg";
		if (pathname.endsWith(".flac")) return "flac";
		if (pathname.endsWith(".aac")) return "aac";
		if (pathname.endsWith(".wav")) return "wav";
		return "wav";
	}

	async _cleanupPlaybackFile(playback, { waitForAudioToStop } = {}) {
		const tempFilePath = trimString(playback?.tempFilePath, "");
		if (!tempFilePath) {
			return;
		}

		const removeFile = async () => {
			try {
				await fs.unlink(tempFilePath);
			} catch (_error) {
				// ignore cleanup failures
			}
		};

		if (waitForAudioToStop) {
			await removeFile();
			return;
		}

		const timer = setTimeout(async () => {
			this._tempFileCleanupTimers.delete(timer);
			await removeFile();
		}, DEFAULTS.tempFileCleanupDelayMs);
		this._tempFileCleanupTimers.add(timer);
	}

	async _request(
		path,
		{ method = "POST", body, settings, apiKey: explicitApiKey } = {},
	) {
		const apiKey =
			explicitApiKey === undefined
				? this._apiKey(settings ?? this.settings)
				: normalizeApiToken(explicitApiKey);
		if (!apiKey) {
			throw new Error("API key is required.");
		}
		if (typeof fetch !== "function") {
			throw new Error("fetch is not available in this runtime.");
		}

		const controller =
			typeof AbortController === "function" ? new AbortController() : null;
		const timeoutMs = this._requestTimeoutMs(settings ?? this.settings);
		const timeoutId =
			controller && timeoutMs > 0
				? setTimeout(() => controller.abort(), timeoutMs)
				: null;

		try {
			const response = await fetch(`${API_BASE}${path}`, {
				method,
				headers: {
					Authorization: apiKey,
					...(body ? { "Content-Type": "application/json" } : {}),
				},
				body: body ? JSON.stringify(body) : undefined,
				signal: controller?.signal,
			});

			const raw = await response.text();
			const payload = raw ? this._safeJsonParse(raw) : null;
			if (!response.ok) {
				const errorMessage =
					trimString(payload?.error, "") ||
					trimString(raw, "") ||
					response.statusText ||
					"Request failed.";
				throw new Error(`TTS Monster error ${response.status}: ${errorMessage}`);
			}
			return payload;
		} catch (error) {
			if (error?.name === "AbortError") {
				throw new Error("Request timed out.");
			}
			throw error;
		} finally {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		}
	}

	async _overlayRequest({ url, body, settings }) {
		if (typeof fetch !== "function") {
			throw new Error("fetch is not available in this runtime.");
		}

		const controller =
			typeof AbortController === "function" ? new AbortController() : null;
		const timeoutMs = this._requestTimeoutMs(settings ?? this.settings);
		const timeoutId =
			controller && timeoutMs > 0
				? setTimeout(() => controller.abort(), timeoutMs)
				: null;

		try {
			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body ?? {}),
				signal: controller?.signal,
			});

			const raw = await response.text();
			const payload = raw ? this._safeJsonParse(raw) : null;
			if (!response.ok) {
				const errorMessage =
					this._payloadMessage(payload) ||
					trimString(raw, "") ||
					response.statusText ||
					"Request failed.";
				throw new Error(`TTS Monster error ${response.status}: ${errorMessage}`);
			}
			return payload;
		} catch (error) {
			if (error?.name === "AbortError") {
				throw new Error("Request timed out.");
			}
			throw error;
		} finally {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		}
	}

	_assertTtsMonsterStatus(payload, context) {
		const status = payload?.status;
		if (status === undefined || status === null) {
			return;
		}
		if (String(status) === "200") {
			return;
		}
		throw new Error(
			`${context} failed with status ${status}: ${
				this._payloadMessage(payload) || "Request failed."
			}`,
		);
	}

	_payloadMessage(payload) {
		return (
			trimString(payload?.error, "") ||
			(typeof payload?.message === "string"
				? trimString(payload.message, "")
				: "") ||
			trimString(payload?.warning, "")
		);
	}

	_safeJsonParse(value) {
		try {
			return JSON.parse(value);
		} catch (_error) {
			return null;
		}
	}

	_mergeSettings(settings, values) {
		return {
			...(this.settings && typeof this.settings === "object" ? this.settings : {}),
			...(settings && typeof settings === "object" ? settings : {}),
			...(values && typeof values === "object" ? values : {}),
		};
	}

	_settingsSnapshot(settings = this.settings) {
		return {
			authMethod: this._authMethod(settings),
			apiKey: this._apiKey(settings),
			overlayUrl: this._overlayUrl(settings),
			returnUsage: toBoolean(settings?.returnUsage, DEFAULTS.returnUsage),
			requestTimeoutMs: this._requestTimeoutMs(settings),
		};
	}

	_credentials(settings = this.settings) {
		const authMethod = this._authMethod(settings);
		if (authMethod === AUTH_METHODS.OVERLAY_URL) {
			const overlay = parseOverlayUrl(this._overlayUrl(settings));
			if (!overlay.ok) {
				return {
					ok: false,
					authMethod,
					cacheKey: "",
					message: overlay.message,
				};
			}
			return {
				ok: true,
				authMethod,
				userId: overlay.userId,
				apiKey: overlay.apiKey,
				cacheKey: `${authMethod}:${overlay.userId}:${overlay.apiKey}`,
				message: "",
			};
		}

		const apiKey = this._apiKey(settings);
		if (!apiKey) {
			return {
				ok: false,
				authMethod,
				cacheKey: "",
				message: "API token is required.",
			};
		}
		return {
			ok: true,
			authMethod,
			apiKey,
			cacheKey: `${authMethod}:${apiKey}`,
			message: "",
		};
	}

	_authMethod(settings = this.settings) {
		const value = trimString(settings?.authMethod, "");
		if (!value && this._apiKey(settings) && !this._overlayUrl(settings)) {
			return AUTH_METHODS.DEVELOPER_API;
		}
		return value === AUTH_METHODS.OVERLAY_URL
			? AUTH_METHODS.OVERLAY_URL
			: value === AUTH_METHODS.DEVELOPER_API
				? AUTH_METHODS.DEVELOPER_API
				: DEFAULTS.authMethod;
	}

	_apiKey(settings = this.settings) {
		return normalizeApiToken(settings?.apiKey);
	}

	_overlayUrl(settings = this.settings) {
		return trimString(settings?.overlayUrl, "");
	}

	_settingsAuthFingerprint(settings = this.settings) {
		return [
			this._authMethod(settings),
			this._apiKey(settings),
			this._overlayUrl(settings),
		].join(":");
	}

	_requestTimeoutMs(settings = this.settings) {
		return clamp(
			toNumber(settings?.requestTimeoutMs, DEFAULTS.requestTimeoutMs),
			0,
			300000,
		);
	}

	async _log(message) {
		if (typeof this.lumia?.log === "function") {
			await this.lumia.log(`[TTSMonster] ${message}`);
		}
	}

	async _showToast(message, time = 4000) {
		if (typeof this.lumia?.showToast !== "function") {
			return;
		}
		try {
			await this.lumia.showToast({ message, time });
		} catch (_error) {
			// ignore toast errors
		}
	}

	async onunload() {
		for (const timer of this._tempFileCleanupTimers) {
			clearTimeout(timer);
		}
		this._tempFileCleanupTimers.clear();
	}
}

module.exports = TTSMonsterPlugin;
```

### tts_monster/actions_tutorial.md

```markdown
---
### Speak Action
1. Enter the **Message** you want spoken.
2. Pick a **Voice** from the loaded options, or type either a voice name or voice ID manually. Overlay URL voices use the names from the overlay account.
3. Set **Volume** if you want to change playback volume.
4. Enable **Log Character Usage** for Developer API usage counts, or status toasts when using Overlay URL.
---
```

### tts_monster/settings_tutorial.md

```markdown
---
### Connect TTS.Monster

#### Overlay URL
1. Set **Connection Method** to **Overlay URL**.
2. Open the [TTS.Monster dashboard](https://tts.monster/dashboard/app).
3. Copy your full **Overlay URL**.
4. Paste it into this plugin's **Overlay URL** setting.

![TTS.Monster overlay URL](./overlay_url_tutorial.png)

Example overlay URL:
`https://tts.monster/overlay/3hoZh83Uigewkx0Upw66imx2ASj1/059e9e17a7c64a42b38b6bbf7b40bee3`

#### Developer API Token
1. Set **Connection Method** to **Developer API Token**.
2. Open the [TTS.Monster Console](https://console.tts.monster/).
3. Log in and click through to create or copy your API token.
4. Paste that token into this plugin's **API Token** setting.

![TTS.Monster API token](./monster_tut1.png)
---
```

### tts_monster/package.json

```json
{
	"name": "lumia-tts-monster",
	"version": "1.0.0",
	"private": true,
	"description": "TTS Monster plugin for Lumia Stream.",
	"main": "main.js",
	"dependencies": {
		"@lumiastream/plugin": "^0.4.1"
	}
}
```
