const { Plugin } = require("@lumiastream/plugin");

const DEFAULTS = {
	baseUrl: "http://localhost:11434",
	requestTimeoutMs: 60000,
	maxHistoryMessages: 12,
	rememberMessages: true,
	modelCacheTtlMs: 5 * 60 * 1000,
};

class OllamaPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._messagesByThread = {};
		this._messagesByUser = {};
		this._lastConnectionState = null;
		this._modelCache = { list: [], fetchedAt: 0 };
		this._modelFetchPromise = null;
	}

	async onload() {
		await this._updateConnectionState(false);
		void this._refreshModelCache();
	}

	async onsettingsupdate(settings, previous = {}) {
		const baseChanged = this._baseUrl(settings) !== this._baseUrl(previous);
		const modelChanged =
			this._defaultModel(settings) !== this._defaultModel(previous);
		if (baseChanged || modelChanged) {
			await this._validateConnection({ silent: true });
			void this._refreshModelCache({ force: true, silent: true });
		}
	}

	async validateAuth() {
		return this._validateConnection({ silent: true });
	}

	async variableFunction({ key, value, raw, allVariables } = {}) {
		if (!key) return "";

		const input =
			typeof value === "string"
				? value
				: typeof raw === "string"
					? raw
					: "";
		if (!input.trim()) {
			return "";
		}

		if (key === "ollama_prompt_clear") {
			this._clearHistory(input, allVariables);
			return "";
		}

		if (
			key !== "ollama_prompt" &&
			key !== "ollama_prompt_nostore" &&
			key !== "ollama_json" &&
			key !== "ollama_one_line"
		) {
			return "";
		}

		const parsed = this._parsePromptInput(input);
		if (!parsed?.message) {
			return "";
		}

		const data = {
			message: parsed.message,
			thread: parsed.thread,
			model: parsed.model,
			username: allVariables?.username,
		};

		if (key === "ollama_prompt_nostore") {
			return await this._handleChat(data, {
				useHistory: false,
				storeHistory: false,
			});
		}

		if (key === "ollama_one_line") {
			return await this._handleChat(data, {
				responseTransform: (text) => this._toOneLine(text),
			});
		}

		if (key === "ollama_json") {
			return await this._handleChat(data, {
				format: "json",
				responseTransform: (text) => this._toJsonString(text),
			});
		}

		return await this._handleChat(data);
	}

	async _handleChat(
		data = {},
		{ format, responseTransform, useHistory = true, storeHistory = true } = {},
	) {
		const message = this._trim(
			data?.message ?? data?.prompt ?? data?.text ?? "",
		);
		if (!message) {
			return "";
		}

		const baseUrl = this._baseUrl();
		if (!baseUrl) {
			return "";
		}

		const model = await this._resolveModel(data);
		if (!model) {
			return "";
		}

		const systemMessage = this._systemMessage(data);
		const temperature = this._number(
			data?.temperature,
			this._defaultTemperature(),
		);
		const topP = this._number(data?.top_p, this._defaultTopP());
		const maxTokens = this._number(
			data?.max_tokens,
			this._defaultMaxTokens(),
		);
		const keepAlive = this._keepAlive(data);

		const thread = this._trim(data?.thread);
		const username = this._trim(data?.username);
		const rememberMessages = this._rememberMessages(data);

		const historyKey =
			useHistory && rememberMessages
				? this._historyKey({
						thread,
						username,
						rememberMessages,
				  })
				: null;
		const history = historyKey ? this._getHistory(historyKey) : [];

		let messages = this._cloneMessages(history);
		if (systemMessage) {
			if (messages.length && messages[0]?.role === "system") {
				messages[0] = { role: "system", content: systemMessage };
			} else {
				messages.unshift({ role: "system", content: systemMessage });
			}
		}
		messages.push({ role: "user", content: message });

		const body = {
			model,
			messages,
			stream: false,
		};

		const options = {};
		if (temperature !== null) options.temperature = temperature;
		if (topP !== null) options.top_p = topP;
		if (maxTokens !== null) options.num_predict = Math.trunc(maxTokens);
		if (Object.keys(options).length) body.options = options;
		if (keepAlive) body.keep_alive = keepAlive;
		if (format) body.format = format;

		let response;
		try {
			response = await this._fetchJson(this._url("/api/chat"), {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			await this._updateConnectionState(true);
		} catch (error) {
			const messageText = this._errorMessage(error);
			await this._updateConnectionState(false);
			return "";
		}

		let responseText =
			this._trim(response?.message?.content) ||
			this._trim(response?.response) ||
			"";

		if (typeof responseTransform === "function") {
			responseText = responseTransform(responseText);
		}
		responseText = this._applyMaxOutput(responseText);

		if (historyKey && storeHistory) {
			const nextHistory = this._trimHistory(
				this._appendHistory(messages, responseText),
				this._maxHistoryMessages(),
			);
			this._setHistory(historyKey, nextHistory);
		}

		return responseText;
	}

	async _validateConnection({ silent } = {}) {
		const baseUrl = this._baseUrl();
		if (!baseUrl) {
			return { ok: false, message: "Missing Base URL." };
		}

		try {
			await this._fetchJson(this._url("/api/tags"), { method: "GET" });
			await this._updateConnectionState(true);
			return { ok: true };
		} catch (error) {
			const message = this._errorMessage(error);
			await this._updateConnectionState(false);
			if (!silent) {
			}
			return { ok: false, message };
		}
	}

	_baseUrl(settings = this.settings) {
		return this._trim(settings?.baseUrl) || DEFAULTS.baseUrl;
	}

	_defaultModel(settings = this.settings) {
		return this._trim(settings?.defaultModel);
	}

	_defaultSystemMessage(settings = this.settings) {
		return this._trim(settings?.defaultSystemMessage);
	}

	_defaultTemperature(settings = this.settings) {
		return this._number(settings?.defaultTemperature, null);
	}

	_defaultTopP(settings = this.settings) {
		return this._number(settings?.defaultTopP, null);
	}

	_defaultMaxTokens(settings = this.settings) {
		return this._number(settings?.defaultMaxTokens, null);
	}

	_keepAlive(settings = this.settings) {
		return this._trim(settings?.keepAlive);
	}

	_requestTimeoutMs(settings = this.settings) {
		const raw = Number(settings?.requestTimeoutMs);
		const value = Number.isFinite(raw) ? raw : DEFAULTS.requestTimeoutMs;
		return Math.min(Math.max(value, 1000), 300000);
	}

	_maxOutputChars(settings = this.settings) {
		const raw = Number(settings?.maxOutputChars);
		if (!Number.isFinite(raw)) return 0;
		return Math.min(Math.max(raw, 0), 100000);
	}

	_rememberMessages(data = {}) {
		if (typeof data?.keepTrackOfMessages === "boolean") {
			return data.keepTrackOfMessages;
		}
		const value = this.settings?.rememberMessages;
		if (typeof value === "boolean") return value;
		return DEFAULTS.rememberMessages;
	}

	_maxHistoryMessages(settings = this.settings) {
		const raw = Number(settings?.maxHistoryMessages);
		if (!Number.isFinite(raw)) return DEFAULTS.maxHistoryMessages;
		return Math.min(Math.max(raw, 0), 100);
	}

	async _resolveModel(data = {}) {
		const explicit = this._trim(data?.model);
		if (explicit) return explicit;
		const configured = this._defaultModel();
		if (configured) return configured;

		const models = await this._refreshModelCache({ silent: true });
		const resolved = models[0] ?? "";
		if (resolved) {
			this.updateSettings({ defaultModel: resolved });
		}
		return resolved;
	}

	_systemMessage(data = {}) {
		return this._trim(data?.systemMessage) || this._defaultSystemMessage();
	}

	_clearHistory(input, allVariables) {
		const raw = this._trim(input);
		if (raw) {
			if (raw.startsWith("user:")) {
				const key = raw.slice(5).trim();
				if (key) {
					delete this._messagesByUser[key];
				}
				return;
			}
			delete this._messagesByThread[raw];
			return;
		}

		const username = this._trim(allVariables?.username);
		if (username) {
			delete this._messagesByUser[username];
		}
	}

	_parsePromptInput(raw) {
		const separator = "|";
		let message = raw;
		let thread;
		let model;

		const lastPipeIndex = raw.lastIndexOf(separator);
		if (lastPipeIndex !== -1) {
			const beforeLast = raw.substring(0, lastPipeIndex);
			const secondLast = beforeLast.lastIndexOf(separator);
			if (secondLast !== -1) {
				message = beforeLast.substring(0, secondLast).trim();
				thread = beforeLast.substring(secondLast + 1).trim();
				model = raw.substring(lastPipeIndex + 1).trim();
			} else {
				message = beforeLast.trim();
				thread = raw.substring(lastPipeIndex + 1).trim();
			}
		}

		return {
			message: message?.trim() ?? "",
			thread: thread?.trim(),
			model: model?.trim(),
		};
	}

	_toOneLine(text) {
		if (!text) return "";
		return String(text).replace(/\s+/g, " ").trim();
	}

	_toJsonString(text) {
		if (!text) return "";
		const trimmed = String(text).trim();
		try {
			const parsed = JSON.parse(trimmed);
			return JSON.stringify(parsed);
		} catch (error) {
			return trimmed;
		}
	}

	_applyMaxOutput(text) {
		const maxChars = this._maxOutputChars();
		if (!maxChars || !text) return text ?? "";
		const value = String(text);
		if (value.length <= maxChars) return value;
		return value.slice(0, maxChars);
	}

	async _refreshModelCache({ force = false, silent = false } = {}) {
		const now = Date.now();
		if (
			!force &&
			this._modelCache.list.length > 0 &&
			now - this._modelCache.fetchedAt < DEFAULTS.modelCacheTtlMs
		) {
			return this._modelCache.list;
		}

		if (this._modelFetchPromise) {
			try {
				return await this._modelFetchPromise;
			} catch (error) {
				return this._modelCache.list;
			}
		}

		this._modelFetchPromise = (async () => {
			const response = await this._fetchJson(this._url("/api/tags"), {
				method: "GET",
			});
			const models = Array.isArray(response?.models)
				? response.models
						.map((model) => this._trim(model?.name))
						.filter(Boolean)
				: [];
			this._modelCache = { list: models, fetchedAt: now };
			if (!this._defaultModel() && models.length > 0) {
				this.updateSettings({ defaultModel: models[0] });
			}
			return models;
		})().finally(() => {
			this._modelFetchPromise = null;
		});

		try {
			return await this._modelFetchPromise;
		} catch (error) {
			if (!silent) {
				await this._updateConnectionState(false);
			}
			return this._modelCache.list;
		}
	}

	_historyKey({ thread, username, rememberMessages }) {
		if (thread) return { type: "thread", key: thread };
		if (rememberMessages && username) return { type: "user", key: username };
		return null;
	}

	_getHistory(key) {
		if (key.type === "thread") {
			return this._messagesByThread[key.key] ?? [];
		}
		return this._messagesByUser[key.key] ?? [];
	}

	_setHistory(key, messages) {
		if (key.type === "thread") {
			this._messagesByThread[key.key] = messages;
			return;
		}
		this._messagesByUser[key.key] = messages;
	}

	_cloneMessages(messages) {
		return Array.isArray(messages)
			? messages.map((msg) => ({
					role: msg?.role,
					content: msg?.content,
			  }))
			: [];
	}

	_appendHistory(messages, responseText) {
		const next = this._cloneMessages(messages);
		if (responseText) {
			next.push({ role: "assistant", content: responseText });
		}
		return next;
	}

	_trimHistory(messages, maxMessages) {
		if (!Array.isArray(messages)) return [];
		if (maxMessages <= 0) {
			return messages[0]?.role === "system" ? [messages[0]] : [];
		}

		const hasSystem = messages[0]?.role === "system";
		const system = hasSystem ? messages[0] : null;
		const rest = hasSystem ? messages.slice(1) : messages;
		const trimmed = rest.slice(-maxMessages);
		return system ? [system, ...trimmed] : trimmed;
	}

	_trim(value) {
		return typeof value === "string" ? value.trim() : "";
	}

	_number(value, fallback) {
		if (value === undefined || value === null || value === "") return fallback;
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : fallback;
	}

	_errorMessage(error) {
		if (error instanceof Error) return error.message;
		return String(error ?? "Unknown error");
	}

	_url(path) {
		const base = new URL(this._baseUrl());
		const basePath = base.pathname.replace(/\/+$/, "");
		base.pathname = `${basePath}${path}`;
		return base.toString();
	}

	async _fetchJson(url, options = {}) {
		const timeoutMs = this._requestTimeoutMs();
		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(() => reject(new Error("Request timed out")), timeoutMs);
		});

		const response = await Promise.race([fetch(url, options), timeoutPromise]);

		if (!response || !response.ok) {
			const text = response ? await response.text() : "";
			throw new Error(
				`Request failed (${response?.status ?? "unknown"}): ${text || response?.statusText || "No response"}`,
			);
		}

		return await response.json();
	}

	async _updateConnectionState(state) {
		if (this._lastConnectionState === state) {
			return;
		}

		this._lastConnectionState = state;

		if (typeof this.lumia.updateConnection === "function") {
			try {
				await this.lumia.updateConnection(state);
			} catch (error) {
				const message = this._errorMessage(error);
				await this.lumia.addLog(
					`[Ollama] Failed to update connection: ${message}`,
				);
			}
		}
	}
}

module.exports = OllamaPlugin;
