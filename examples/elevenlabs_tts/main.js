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
				await this.lumia.addLog(`[ElevenLabs] Action failed: ${message}`);
			}
		}
	}

	async handleSpeak(data = {}) {
		const settings = this.getSettingsSnapshot();
		let message = trimString(data.message || data.text, "");
		if (!message) {
			await this.lumia.addLog("[ElevenLabs] Missing message text");
			return;
		}

		const apiKey = settings.apiKey;
		if (!apiKey) {
			await this.lumia.addLog("[ElevenLabs] Missing API key");
			return;
		}

		const voiceId = trimString(data.voiceId, "");
		if (!voiceId) {
			await this.lumia.addLog("[ElevenLabs] Missing Voice ID");
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
			await this.lumia.addLog("[ElevenLabs] Missing API key");
			return;
		}

		let prompt = trimString(data.prompt || data.text, "");
		const compositionPlan = parseJson(
			data.compositionPlanJson || data.composition_plan || "",
		);
		if (!prompt && !compositionPlan) {
			await this.lumia.addLog(
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
				await this.lumia.addLog("[ElevenLabs] Could not resolve Desktop path");
				return;
			}
			const filename = buildMusicFilename(outputFormat);
			const filePath = path.join(desktopPath, filename);
			await fs.writeFile(filePath, Buffer.from(audioBuffer));
		}
	}
}

module.exports = ElevenLabsTTSPlugin;
