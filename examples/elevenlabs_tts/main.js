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
