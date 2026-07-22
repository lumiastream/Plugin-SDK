const { Plugin } = require("@lumiastream/plugin");
const fs = require("fs/promises");
const path = require("path");
const os = require("os");

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
	eleven_flash_v2_5: 40000,
	eleven_flash_v2: 30000,
	eleven_turbo_v2_5: 40000,
	eleven_turbo_v2: 30000,
	eleven_multilingual_v2: 10000,
	eleven_multilingual_v1: 10000,
	eleven_english_sts_v2: 10000,
	eleven_english_sts_v1: 10000,
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
	getSettingsSnapshot() {
		const raw = this.settings || {};
		return {
			apiKey: trimString(raw.apiKey),
		};
	}

	async onload() {
		void this.refreshActionOptions({ actionType: "speak" });
	}

	async onsettingsupdate(settings = {}, previousSettings = {}) {
		const next = trimString(settings.apiKey, "");
		const prev = trimString(previousSettings.apiKey, "");
		if (next !== prev) {
			if (typeof this.lumia.refreshTtsVoices === "function") {
				await this.lumia.refreshTtsVoices();
			}
			void this.refreshActionOptions({ actionType: "speak" });
		}
	}

	async _fetchRawVoices(apiKey) {
		const collected = [];
		let pageToken = "";
		// /v2/voices (not legacy /v1/voices): page 0 includes ElevenLabs' default voices, and it paginates past 500.
		for (let page = 0; page < 25; page++) {
			const query = `page_size=100${pageToken ? `&next_page_token=${encodeURIComponent(pageToken)}` : ""}`;
			// Throw (don't return []) on failure so Lumia keeps the previously-listed voices instead of clearing them.
			const response = await fetch(`https://api.elevenlabs.io/v2/voices?${query}`, {
				headers: { "xi-api-key": apiKey },
			});
			if (!response.ok) {
				const detail = await response.text().catch(() => "");
				throw new Error(
					`ElevenLabs voice list failed: ${response.status}${detail ? ` — ${detail}` : ""}`,
				);
			}
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
		const response = await fetch("https://api.elevenlabs.io/v1/models", {
			headers: { "xi-api-key": apiKey },
		});
		if (!response.ok) {
			const detail = await response.text().catch(() => "");
			throw new Error(
				`ElevenLabs model list failed: ${response.status}${detail ? ` — ${detail}` : ""}`,
			);
		}
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
		if (!apiKey || typeof fetch !== "function") {
			return [];
		}
		const raw = await this._fetchRawVoices(apiKey);
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
		if (!apiKey) {
			return;
		}

		try {
			const raw = await this._fetchRawVoices(apiKey);
			const voiceItems = raw.map((voice) => ({ label: trimString(voice?.name, voice?.voice_id), value: trimString(voice?.voice_id, "") }));
			await this.lumia.updateActionFieldOptions({
				actionType: "speak",
				fieldKey: "voiceId",
				options: this._buildOptions(voiceItems, values?.voiceId),
			});
		} catch (error) {
			await this.lumia.log(`[ElevenLabs] Voice options failed: ${error instanceof Error ? error.message : String(error)}`);
		}

		try {
			const models = await this._fetchModels(apiKey);
			const modelItems = models.map((model) => ({ label: model.name, value: model.id }));
			await this.lumia.updateActionFieldOptions({
				actionType: "speak",
				fieldKey: "modelId",
				options: this._buildOptions(modelItems, values?.modelId || DEFAULTS.modelId),
			});
		} catch (error) {
			await this.lumia.log(`[ElevenLabs] Model options failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	async synthesizeTts(request = {}) {
		const apiKey = this.getSettingsSnapshot().apiKey;
		if (!apiKey) {
			throw new Error("Missing ElevenLabs API key");
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
		const response = await fetch(endpoint, {
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
		if (!response.ok) {
			const errorText = await response.text().catch(() => "");
			// Surface ElevenLabs' human-readable reason (e.g. plan/permission errors) instead of a raw status code.
			let detail = "";
			try {
				const parsed = JSON.parse(errorText);
				detail =
					parsed?.detail?.message ||
					(typeof parsed?.detail === "string" ? parsed.detail : "") ||
					parsed?.message ||
					"";
			} catch (_err) {}
			throw new Error(detail || `request failed (${response.status} ${response.statusText})`);
		}
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
				const message = error instanceof Error ? error.message : String(error);
				await this.lumia.log(`[ElevenLabs] Action failed: ${message}`);
			}
		}
	}

	async handleSpeak(data = {}) {
		const settings = this.getSettingsSnapshot();
		let message = trimString(data.message || data.text, "");
		if (!message) {
			await this.lumia.log("[ElevenLabs] Missing message text");
			return;
		}

		const apiKey = settings.apiKey;
		if (!apiKey) {
			await this.lumia.log("[ElevenLabs] Missing API key");
			return;
		}

		const voiceId = trimString(data.voiceId, "");
		if (!voiceId) {
			await this.lumia.log("[ElevenLabs] Missing Voice ID");
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

		const response = await fetch(endpoint, {
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

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`ElevenLabs error ${response.status}: ${errorText || response.statusText}`,
			);
		}

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
		if (!apiKey) {
			await this.lumia.log("[ElevenLabs] Missing API key");
			return;
		}

		let prompt = trimString(data.prompt || data.text, "");
		const compositionPlan = parseJson(
			data.compositionPlanJson || data.composition_plan || "",
		);
		if (!prompt && !compositionPlan) {
			await this.lumia.log(
				"[ElevenLabs] Provide a prompt or composition plan",
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

		const endpoint = `https://api.elevenlabs.io/v1/music/stream?output_format=${encodeURIComponent(outputFormat)}`;
		const body = {
			model_id: modelId,
			music_length_ms: musicLengthMs,
			force_instrumental: forceInstrumental,
			...(prompt ? { prompt } : {}),
			...(compositionPlan ? { composition_plan: compositionPlan } : {}),
		};

		const response = await fetch(endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"xi-api-key": apiKey,
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`ElevenLabs music error ${response.status}: ${errorText || response.statusText}`,
			);
		}

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
				await this.lumia.log("[ElevenLabs] Could not resolve Desktop path");
				return;
			}
			const filename = buildMusicFilename(outputFormat);
			const filePath = path.join(desktopPath, filename);
			await fs.writeFile(filePath, Buffer.from(audioBuffer));
		}
	}
}

module.exports = ElevenLabsTTSPlugin;
