const { Plugin } = require("@lumiastream/plugin");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const API_BASE = "https://api.console.tts.monster";
const TEMP_DIR_NAME = "lumia-tts-monster";

const DEFAULTS = {
	defaultVolume: 100,
	waitForAudioToStop: true,
	returnUsage: false,
	requestTimeoutMs: 20000,
	voiceCacheTtlMs: 5 * 60 * 1000,
	maxMessageChars: 500,
	tempFileCleanupDelayMs: 10 * 60 * 1000,
};

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

class TTSMonsterPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._voiceCache = { list: [], fetchedAt: 0, apiKey: "" };
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
		const apiKeyChanged = this._apiKey(settings) !== this._apiKey(previous);
		if (apiKeyChanged) {
			await this._validateConnection({ silent: true, settings });
			void this._refreshVoiceCache({ force: true, silent: true, settings });
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
			apiKey: this._apiKey(previewSettings),
		});

		await this.lumia.updateActionFieldOptions({
			actionType: "speak",
			fieldKey: "voice",
			options,
		});
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
		if (!settings.apiKey) {
			await this._log("Missing API key.");
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
			await this._log("Voice is not loaded yet. Type a valid voice name or voice ID, or refresh the action.");
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

		const response = await this._request("/generate", {
			method: "POST",
			body: {
				voice_id: voiceId,
				message,
				...(returnUsage ? { return_usage: true } : {}),
			},
			settings,
		});

		const audioUrl = trimString(response?.url, "");
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

	async _validateConnection({ silent = false, data = {}, settings } = {}) {
		const apiKey = trimString(
			data?.apiKey,
			this._apiKey(settings ?? this.settings),
		);
		if (!apiKey) {
			return { ok: false, message: "API key is required." };
		}

		try {
			const user = await this._request("/user", {
				method: "POST",
				apiKey,
				settings,
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
		const apiKey = this._apiKey(settings ?? this.settings);
		if (!apiKey) {
			this._voiceCache = { list: [], fetchedAt: 0, apiKey: "" };
			this._lastVoiceFetchError = "Enter your API token in plugin settings first.";
			return [];
		}

		const now = Date.now();
		const isFresh =
			!force &&
			this._voiceCache.apiKey === apiKey &&
			now - this._voiceCache.fetchedAt < DEFAULTS.voiceCacheTtlMs;
		if (isFresh) {
			return this._voiceCache.list;
		}

		if (this._voiceFetchPromise) {
			try {
				return await this._voiceFetchPromise;
			} catch (_error) {
				return this._voiceCache.list;
			}
		}

		this._voiceFetchPromise = (async () => {
			const payload = await this._request("/voices", {
				method: "POST",
				apiKey,
				settings,
			});
			const list = this._normalizeVoices(payload);
			this._voiceCache = {
				list,
				fetchedAt: Date.now(),
				apiKey,
			};
			this._lastVoiceFetchError = "";
			return list;
		})().finally(() => {
			this._voiceFetchPromise = null;
		});

		try {
			return await this._voiceFetchPromise;
		} catch (error) {
			if (this._voiceCache.apiKey !== apiKey) {
				this._voiceCache = { list: [], fetchedAt: 0, apiKey: "" };
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

	_normalizeVoices(payload) {
		const publicVoices = Array.isArray(payload?.voices) ? payload.voices : [];
		const customVoices = Array.isArray(payload?.customVoices)
			? payload.customVoices
			: [];

		const normalizeVoice = (voice, isCustom) => {
			const id = trimString(voice?.voice_id, "");
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

		return [...customVoices.map((voice) => normalizeVoice(voice, true)), ...publicVoices.map((voice) => normalizeVoice(voice, false))]
			.filter(Boolean)
			.sort((left, right) => {
				if (left.isCustom !== right.isCustom) {
					return left.isCustom ? -1 : 1;
				}
				return left.name.localeCompare(right.name);
			});
	}

	_buildVoiceOptions({ voices, selectedValue, blankLabel, apiKey }) {
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

		if (!trimString(apiKey, "")) {
			pushOption("Set API token first", "__missing_api_token__");
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
		const apiKey = trimString(
			explicitApiKey,
			this._apiKey(settings ?? this.settings),
		);
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
			apiKey: this._apiKey(settings),
			returnUsage: toBoolean(settings?.returnUsage, DEFAULTS.returnUsage),
			requestTimeoutMs: this._requestTimeoutMs(settings),
		};
	}

	_apiKey(settings = this.settings) {
		return trimString(settings?.apiKey, "");
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
