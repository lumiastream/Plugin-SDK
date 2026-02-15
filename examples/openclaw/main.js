const { Plugin } = require("@lumiastream/plugin");

const DEFAULTS = {
	baseUrl: "http://127.0.0.1:18789",
	requestTimeoutMs: 60000,
	apiEndpointMode: "auto",
	maxHistoryMessages: 12,
	rememberMessages: true,
	sendAgentHeader: true,
	modelCacheTtlMs: 5 * 60 * 1000,
};

class OpenClawPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._messagesByThread = {};
		this._messagesByUser = {};
		this._lastConnectionState = null;
		this._modelCache = { list: [], fetchedAt: 0, baseUrl: "" };
		this._lastErrorToast = { message: "", at: 0 };
	}

	async onload() {
		await this._updateConnectionState(false);
		void this._refreshModelCache();
		void this.refreshSettingsOptions({ fieldKey: "defaultAgentId" });
	}

	async onsettingsupdate(settings, previous = {}) {
		const baseChanged = this._baseUrl(settings) !== this._baseUrl(previous);
		const tokenChanged = this._authToken(settings) !== this._authToken(previous);
		const agentChanged =
			this._defaultAgentId(settings) !== this._defaultAgentId(previous);
		const knownAgentsChanged =
			this._trim(settings?.knownAgentIds) !==
			this._trim(previous?.knownAgentIds);
		const sendAgentHeaderChanged =
			this._sendAgentHeader(settings) !== this._sendAgentHeader(previous);
		const endpointModeChanged =
			this._apiEndpointMode(settings) !== this._apiEndpointMode(previous);
		if (
			baseChanged ||
			tokenChanged ||
			agentChanged ||
			knownAgentsChanged ||
			sendAgentHeaderChanged ||
			endpointModeChanged
		) {
			await this._validateConnection({ silent: true });
			void this._refreshModelCache({ force: true, silent: true });
			void this.refreshSettingsOptions({ fieldKey: "defaultAgentId" });
		}
	}

	async validateAuth() {
		return this._validateConnection({ silent: true });
	}

	async aiPrompt(config = {}) {
		const message = this._trim(
			config?.message ?? config?.prompt ?? config?.text ?? "",
		);
		if (!message) {
			return "";
		}

		return await this._handleChat({ ...config, message });
	}

	async aiModels({ refresh = false, settings } = {}) {
		const fetchedAgents = await this._refreshModelCache({
			force: Boolean(refresh),
			silent: true,
			settings,
		});
		const defaultAgent = this._normalizeAgentId(
			this._defaultAgentId(settings || this.settings),
			"",
		);
		const agents = Array.from(new Set([defaultAgent, ...fetchedAgents].filter(Boolean)));
		const routes = agents.map((agentId) =>
			this._toAgentRoute(agentId, defaultAgent || "main"),
		);
		return routes.map((route) => ({ value: route, name: route }));
	}

	async refreshSettingsOptions({ fieldKey, values, settings } = {}) {
		if (
			fieldKey &&
			fieldKey !== "defaultAgentId" &&
			fieldKey !== "knownAgentIds" &&
			fieldKey !== "baseUrl" &&
			fieldKey !== "authToken"
		) {
			return;
		}

		if (typeof this.lumia?.updateSettingsFieldOptions !== "function") {
			return;
		}

		const previewSettings = {
			...(this.settings && typeof this.settings === "object" ? this.settings : {}),
			...(settings && typeof settings === "object" ? settings : {}),
			...(values && typeof values === "object" ? values : {}),
		};
		const agentIds = await this._refreshModelCache({
			force: true,
			settings: previewSettings,
		});
		const fallbackAgent = this._normalizeAgentId(
			values?.defaultAgentId ??
				settings?.defaultAgentId ??
				this._defaultAgentId(previewSettings),
			"",
		);
		const uniqueAgents = Array.from(
			new Set([fallbackAgent, ...agentIds].filter(Boolean)),
		);
		const options = [
			{
				label: this._autoAgentOptionLabel(previewSettings),
				value: "",
			},
			...uniqueAgents.map((value) => ({
				label: this._agentLabel(value),
				value: String(value),
			})),
		];

		await this.lumia.updateSettingsFieldOptions({
			fieldKey: "defaultAgentId",
			options,
		});
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

		if (key === "openclaw_prompt_clear") {
			this._clearHistory(input, allVariables);
			return "";
		}

		if (
			key !== "openclaw_prompt" &&
			key !== "openclaw_prompt_nostore" &&
			key !== "openclaw_json" &&
			key !== "openclaw_one_line"
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
			model: parsed.agent,
			agentId: parsed.agent,
			username: allVariables?.username,
		};

		if (key === "openclaw_prompt_nostore") {
			return await this._handleChat(data, {
				useHistory: false,
				storeHistory: false,
			});
		}

		if (key === "openclaw_one_line") {
			return await this._handleChat(data, {
				responseTransform: (text) => this._toOneLine(text),
			});
		}

		if (key === "openclaw_json") {
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

		const resolvedRoute = await this._resolveModel(data);
		if (!resolvedRoute) {
			return "";
		}
		const resolvedAgent = this._agentId({
			...data,
			model: resolvedRoute,
		});
		const requestData = {
			...data,
			model: resolvedRoute,
		};
		if (resolvedAgent) {
			requestData.agentId = resolvedAgent;
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

		const sessionUser = this._sessionUserId({ thread, username });

		let response;
		try {
			response = await this._requestInference({
				data: requestData,
				model: resolvedRoute,
				messages,
				temperature,
				topP,
				maxTokens,
				format,
				sessionUser,
			});
			await this._updateConnectionState(true);
		} catch (error) {
			const userMessage = this._userErrorMessage(error, "OpenClaw");
			const rawMessage = this._errorMessage(error);
			await this._updateConnectionState(false);
			await this._reportApiError({
				userMessage,
				rawMessage,
				error,
			});
			if (format === "json") {
				return this._jsonErrorResponse(userMessage);
			}
			return "";
		}

		let responseText = this._extractResponseText(response);
		if (!responseText) {
			await this._logInfo("Chat request returned an empty response body.");
		}

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
			await this._logInfo("Auth validation failed: missing Base URL.");
			return { ok: false, message: "Missing Base URL." };
		}

		try {
			const route = await this._resolveModel({});
			const agent = this._agentId({ model: route });
			await this._requestInference({
				data: agent ? { model: route, agentId: agent } : { model: route },
				model: route,
				messages: [{ role: "user", content: "ping" }],
				maxTokens: 1,
				sessionUser: "validation:openclaw",
			});
			await this._updateConnectionState(true);
			return { ok: true };
		} catch (chatError) {
			const message = this._errorMessage(chatError);
			await this._updateConnectionState(false);
			if (silent) {
				return { ok: false, message };
			}
			await this._logError("Connection validation failed", chatError);
			return { ok: false, message };
		}
	}

	_baseUrl(settings = this.settings) {
		return this._trim(settings?.baseUrl) || DEFAULTS.baseUrl;
	}

	_authToken(settings = this.settings) {
		return this._trim(settings?.authToken);
	}

	_defaultAgentId(settings = this.settings) {
		return this._trim(settings?.defaultAgentId);
	}

	_knownAgentIds(settings = this.settings) {
		const raw = this._trim(settings?.knownAgentIds);
		const defaultAgent = this._normalizeAgentId(
			this._defaultAgentId(settings),
			"",
		);
		const parsed = raw
			.split(/[,\n\r\t ]+/)
			.map((value) => this._normalizeAgentId(value, ""))
			.filter(Boolean);
		return Array.from(new Set([defaultAgent, ...parsed].filter(Boolean)));
	}

	_normalizeAgentId(value, fallback = "") {
		const raw = this._trim(value);
		const fallbackValue = this._trim(fallback);
		if (!raw) return fallbackValue;
		const lower = raw.toLowerCase();
		if (lower.startsWith("openclaw:")) {
			return this._trim(raw.slice("openclaw:".length)) || fallbackValue;
		}
		if (lower.startsWith("agent:")) {
			return this._trim(raw.slice("agent:".length)) || fallbackValue;
		}
		return raw;
	}

	_toAgentRoute(agentId, fallbackAgent = "main") {
		const normalized = this._normalizeAgentId(agentId, fallbackAgent);
		return normalized ? `openclaw:${normalized}` : "";
	}

	_sendAgentHeader(settings = this.settings) {
		const value = settings?.sendAgentHeader;
		if (typeof value === "boolean") return value;
		return DEFAULTS.sendAgentHeader;
	}

	_apiEndpointMode(settings = this.settings) {
		const value = this._trim(settings?.apiEndpointMode).toLowerCase();
		if (value === "chat" || value === "responses") {
			return value;
		}
		return DEFAULTS.apiEndpointMode;
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

	_requestTimeoutMs(settings = this.settings) {
		const raw = Number(settings?.requestTimeoutMs);
		const value = Number.isFinite(raw) ? raw : DEFAULTS.requestTimeoutMs;
		if (value <= 0) return 0;
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
		const defaultAgent = this._normalizeAgentId(this._defaultAgentId(), "");
		const explicitRoute = this._trim(data?.model);
		if (explicitRoute) {
			const route = this._toAgentRoute(explicitRoute, defaultAgent || "main");
			return route;
		}

		const explicitAgent = this._normalizeAgentId(data?.agentId, "");
		if (explicitAgent) {
			const route = this._toAgentRoute(explicitAgent, defaultAgent || "main");
			return route;
		}

		const byAgent = this._buildModelFromAgent({ agentId: defaultAgent });
		if (byAgent) {
			return byAgent;
		}

		const agentIds = await this._refreshModelCache({ silent: true });
		const resolvedAgent = agentIds[0] || defaultAgent || "main";
		const resolved = this._toAgentRoute(resolvedAgent, "main");
		return resolved;
	}

	_buildModelFromAgent(data = {}, settings = this.settings) {
		const agent = this._agentId(data, settings);
		if (!agent) return "";
		return this._toAgentRoute(agent, this._defaultAgentId(settings) || "main");
	}

	_fallbackAgents(settings = this.settings) {
		return this._knownAgentIds(settings);
	}

	_systemMessage(data = {}) {
		return this._trim(data?.systemMessage) || this._defaultSystemMessage();
	}

	_agentId(data = {}, settings = this.settings) {
		const configuredDefault = this._normalizeAgentId(
			this._defaultAgentId(settings),
			"",
		);
		const directAgent = this._normalizeAgentId(data?.agentId, "");
		if (directAgent) return directAgent;
		const fromModel = this._normalizeAgentId(data?.model, "");
		if (fromModel) return fromModel;
		return configuredDefault;
	}

	_requestHeaders(data = {}, settings = this.settings) {
		const headers = {};
		const token = this._authToken(settings);
		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}
		if (this._sendAgentHeader(settings)) {
			const agent = this._agentId(data, settings);
			if (agent) {
				headers["x-openclaw-agent-id"] = agent;
			}
		}
		return headers;
	}

	_autoAgentOptionLabel(settings = this.settings) {
		const agent = this._normalizeAgentId(this._defaultAgentId(settings), "");
		if (agent) {
			return `Auto (${agent} or first available)`;
		}
		return "Auto";
	}

	_agentLabel(value) {
		const agent = this._normalizeAgentId(value, "");
		if (!agent) return "";
		return `Agent: ${agent}`;
	}

	_sessionUserId({ thread, username } = {}) {
		if (thread) {
			return `thread:${thread}`;
		}
		if (username) {
			return `user:${username}`;
		}
		return "";
	}

	_inferenceEndpointCandidates(settings = this.settings) {
		const mode = this._apiEndpointMode(settings);
		if (mode === "chat") {
			return ["/v1/chat/completions"];
		}
		if (mode === "responses") {
			return ["/v1/responses"];
		}
		return ["/v1/chat/completions"];
	}

	_buildChatCompletionsBody({
		model,
		messages,
		temperature,
		topP,
		maxTokens,
		format,
		sessionUser,
	}) {
		const body = {
			model,
			messages,
			stream: false,
		};
		if (temperature !== null) body.temperature = temperature;
		if (topP !== null) body.top_p = topP;
		if (maxTokens !== null) body.max_tokens = Math.trunc(maxTokens);
		if (format === "json") {
			body.response_format = { type: "json_object" };
		}
		if (sessionUser) {
			body.user = sessionUser;
		}
		return body;
	}

	_buildResponsesInput(messages = []) {
		const normalized = Array.isArray(messages) ? messages : [];
		return normalized
			.filter((msg) => this._trim(msg?.content))
			.map((msg) => ({
				role: msg?.role || "user",
				content: [
					{
						type: "input_text",
						text: String(msg?.content ?? ""),
					},
				],
			}));
	}

	_buildResponsesBody({
		model,
		messages,
		temperature,
		topP,
		maxTokens,
		sessionUser,
	}) {
		const systemMessage = this._trim(
			Array.isArray(messages)
				? messages.find((msg) => msg?.role === "system")?.content
				: "",
		);
		const nonSystemMessages = Array.isArray(messages)
			? messages.filter((msg) => msg?.role !== "system")
			: [];
		const input = this._buildResponsesInput(nonSystemMessages);
		const body = {
			model,
			input: input.length
				? input
				: [{ role: "user", content: [{ type: "input_text", text: "" }] }],
			stream: false,
		};
		if (systemMessage) {
			body.instructions = systemMessage;
		}
		if (temperature !== null) body.temperature = temperature;
		if (topP !== null) body.top_p = topP;
		if (maxTokens !== null) body.max_output_tokens = Math.trunc(maxTokens);
		if (sessionUser) {
			body.user = sessionUser;
		}
		return body;
	}

	async _requestInference({
		data = {},
		model,
		messages,
		temperature = null,
		topP = null,
		maxTokens = null,
		format,
		sessionUser,
	} = {}) {
		const endpoints = this._inferenceEndpointCandidates();
		const path = endpoints[0];
		const headers = this._requestHeaders(data);
		headers["Content-Type"] = "application/json";
		const body =
			path === "/v1/responses"
				? this._buildResponsesBody({
						model,
						messages,
						temperature,
						topP,
						maxTokens,
						sessionUser,
				  })
				: this._buildChatCompletionsBody({
						model,
						messages,
						temperature,
						topP,
						maxTokens,
						format,
						sessionUser,
				  });

		if (path === "/v1/responses" && format === "json") {
			await this._logInfo(
				"JSON mode requested while using /v1/responses. Strict JSON enforcement may depend on gateway version.",
			);
		}
		const response = await this._fetchJson(this._url(path), {
			method: "POST",
			headers,
			body: JSON.stringify(body),
		});
		return response;
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
		let agent;

		const lastPipeIndex = raw.lastIndexOf(separator);
		if (lastPipeIndex !== -1) {
			const beforeLast = raw.substring(0, lastPipeIndex);
			const secondLast = beforeLast.lastIndexOf(separator);
			if (secondLast !== -1) {
				message = beforeLast.substring(0, secondLast).trim();
				thread = beforeLast.substring(secondLast + 1).trim();
				agent = raw.substring(lastPipeIndex + 1).trim();
			} else {
				message = beforeLast.trim();
				thread = raw.substring(lastPipeIndex + 1).trim();
			}
		}

		return {
			message: message?.trim() ?? "",
			thread: thread?.trim(),
			agent: agent?.trim(),
		};
	}

	_toOneLine(text) {
		if (!text) return "";
		return String(text).replace(/\s+/g, " ").trim();
	}

	_toJsonString(text) {
		const parsed = this._parseJsonCandidate(text);
		if (parsed !== null) {
			return JSON.stringify(parsed);
		}
		const trimmed = this._trim(text);
		if (!trimmed) {
			return "{}";
		}
		return JSON.stringify({
			error: "Invalid JSON response from OpenClaw.",
			raw: this._truncateForLog(trimmed, 300),
		});
	}

	_jsonErrorResponse(message) {
		return JSON.stringify({
			error: this._trim(message) || "OpenClaw request failed.",
		});
	}

	_parseJsonCandidate(sourceText) {
		const source = this._trim(sourceText);
		if (!source) return null;

		const candidates = [source];
		const fenced = source.match(/```(?:json)?\s*([\s\S]*?)```/i);
		if (fenced?.[1]) {
			candidates.unshift(fenced[1].trim());
		}

		const firstBrace = source.indexOf("{");
		const lastBrace = source.lastIndexOf("}");
		if (firstBrace !== -1 && lastBrace > firstBrace) {
			candidates.push(source.slice(firstBrace, lastBrace + 1));
		}

		const firstBracket = source.indexOf("[");
		const lastBracket = source.lastIndexOf("]");
		if (firstBracket !== -1 && lastBracket > firstBracket) {
			candidates.push(source.slice(firstBracket, lastBracket + 1));
		}

		for (const candidate of candidates) {
			try {
				return JSON.parse(candidate);
			} catch (error) {
			}
		}

		return null;
	}

	_extractResponseText(response = {}) {
		const direct = this._trim(response?.choices?.[0]?.message?.content);
		if (direct) {
			return direct;
		}

		const messageContent = response?.choices?.[0]?.message?.content;
		if (Array.isArray(messageContent)) {
			const parts = messageContent
				.map((item) =>
					this._trim(item?.text || item?.content || item?.value || ""),
				)
				.filter(Boolean);
			if (parts.length) {
				return parts.join("\n");
			}
		}

		const outputText = this._trim(response?.output_text);
		if (outputText) {
			return outputText;
		}

		if (Array.isArray(response?.output)) {
			const chunks = [];
			for (const outputItem of response.output) {
				const directText = this._trim(outputItem?.text);
				if (directText) {
					chunks.push(directText);
				}
				if (Array.isArray(outputItem?.content)) {
					for (const contentPart of outputItem.content) {
						const contentText = this._trim(
							contentPart?.text ||
								contentPart?.output_text ||
								contentPart?.content ||
								contentPart?.value ||
								"",
						);
						if (contentText) {
							chunks.push(contentText);
						}
					}
				}
			}
			if (chunks.length) {
				return chunks.join("\n");
			}
		}

		return this._trim(response?.response) || "";
	}

	_applyMaxOutput(text) {
		const maxChars = this._maxOutputChars();
		if (!maxChars || !text) return text ?? "";
		const value = String(text);
		if (value.length <= maxChars) return value;
		return value.slice(0, maxChars);
	}

	async _refreshModelCache({
		force = false,
		settings = this.settings,
	} = {}) {
		const now = Date.now();
		const baseUrl = this._baseUrl(settings);
		if (
			!force &&
			this._modelCache.list.length > 0 &&
			this._modelCache.baseUrl === baseUrl &&
			now - this._modelCache.fetchedAt < DEFAULTS.modelCacheTtlMs
		) {
			return this._modelCache.list;
		}

		const agents = this._knownAgentIds(settings);
		this._modelCache = { list: agents, fetchedAt: now, baseUrl };
		return agents;
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

	_userErrorMessage(error, provider = "AI") {
		const { status, responseText, message } = this._errorContext(error);
		const apiMessage = this._errorBodyMessage(responseText);
		const retryHint = this._retryHint(responseText);

		if (status === 401 || status === 403) {
			return `${provider} API authentication failed. Check your API key and permissions.`;
		}
		if (status === 429) {
			return `${provider} API rate limit or quota exceeded. Check your plan/billing and try again.${retryHint}`;
		}
		if (status !== null && status >= 500) {
			return `${provider} API is temporarily unavailable. Please try again in a moment.`;
		}
		if (apiMessage) {
			return `${provider} API error: ${apiMessage}`;
		}
		return `${provider} request failed. ${this._truncateForLog(message, 180) || "Please check plugin settings and try again."}`;
	}

	_errorContext(error) {
		const message = this._errorMessage(error);
		const parsedStatus = Number(error?.status);
		let status = Number.isFinite(parsedStatus) ? parsedStatus : null;
		let responseText =
			typeof error?.responseText === "string" ? error.responseText.trim() : "";

		const match = message.match(/^Request failed \(([^)]+)\):\s*([\s\S]*)$/);
		if (match) {
			if (status === null && /^\d+$/.test(match[1])) {
				status = Number(match[1]);
			}
			if (!responseText) {
				responseText = match[2].trim();
			}
		}

		return { status, responseText, message };
	}

	_errorBodyMessage(responseText) {
		const text = this._trim(responseText);
		if (!text) return "";
		const parsed = this._safeParseJson(text);
		if (parsed) {
			const fromNested =
				this._trim(parsed?.error?.message) ||
				this._trim(parsed?.error) ||
				this._trim(parsed?.message) ||
				this._trim(parsed?.details);
			if (fromNested) return this._truncateForLog(fromNested, 220);
		}
		return this._truncateForLog(text, 220);
	}

	_retryHint(responseText) {
		const parsed = this._safeParseJson(responseText);
		const retryAfter =
			this._trim(parsed?.retry_after) ||
			this._trim(parsed?.retryAfter) ||
			this._trim(parsed?.error?.retry_after) ||
			this._trim(parsed?.error?.retryAfter);
		if (retryAfter) {
			return ` Retry in about ${retryAfter}.`;
		}

		const text = this._trim(responseText);
		const retryMatch = text.match(/retry (?:after|in)\s+([0-9]+(?:\.[0-9]+)?s?)/i);
		if (retryMatch?.[1]) {
			return ` Retry in about ${retryMatch[1]}.`;
		}
		return "";
	}

	_safeParseJson(text) {
		const value = this._trim(text);
		if (!value) return null;
		try {
			return JSON.parse(value);
		} catch (error) {
			return null;
		}
	}

	_truncateForLog(text, max = 300) {
		const value = String(text ?? "").replace(/\s+/g, " ").trim();
		if (value.length <= max) return value;
		return `${value.slice(0, max)}...`;
	}

	_formatErrorDetails(error) {
		if (!error) return "";
		const details = [];
		if (error?.status) details.push(`status=${error.status}`);
		if (error?.method) details.push(`method=${error.method}`);
		if (error?.url) details.push(`url=${error.url}`);
		if (error?.message) details.push(`error=${this._truncateForLog(error.message)}`);
		if (error?.responseText) {
			details.push(`body=${this._truncateForLog(error.responseText)}`);
		}
		return details.join(" | ");
	}

	async _log(message) {
		if (typeof this.lumia?.log !== "function") {
			return;
		}
		try {
			await this.lumia.log(`[OpenClaw] ${message}`);
		} catch (error) {
		}
	}

	async _logInfo(message) {
		await this._log(message);
	}

	async _logError(message, error) {
		const suffix = this._formatErrorDetails(error);
		const full = suffix ? `${message} | ${suffix}` : message;
		await this._log(full);
	}

	async _reportApiError({ userMessage, rawMessage, error } = {}) {
		await this._logError("Chat request failed", error);

		const compactUser = this._truncateForLog(userMessage, 220);
		const compactRaw = this._truncateForLog(rawMessage, 260);

		if (typeof this.lumia?.log === "function") {
			try {
				const message = compactRaw
					? `[OpenClaw] ${compactUser} | ${compactRaw}`
					: `[OpenClaw] ${compactUser}`;
				await this.lumia.log({ message, level: "error" });
			} catch (logError) {
				try {
					await this.lumia.log(`[OpenClaw] ${compactUser}`);
				} catch (innerError) {
				}
			}
		}

		if (typeof this.lumia?.showToast === "function") {
			const now = Date.now();
			const sameMessage =
				this._lastErrorToast.message === compactUser &&
				now - this._lastErrorToast.at < 5000;
			if (!sameMessage) {
				this._lastErrorToast = { message: compactUser, at: now };
				try {
					await this.lumia.showToast({
						message: compactUser,
						time: 4500,
					});
				} catch (toastError) {
				}
			}
		}
	}

	_url(path, settings = this.settings) {
		const base = new URL(this._baseUrl(settings));
		const basePath = base.pathname.replace(/\/+$/, "");
		base.pathname = `${basePath}${path}`;
		return base.toString();
	}

	async _fetchJson(url, options = {}, settings = this.settings) {
		const timeoutMs = this._requestTimeoutMs(settings);
		const method = this._trim(options?.method || "GET") || "GET";
		let response;
		try {
			response =
				timeoutMs === 0
					? await fetch(url, options)
					: await Promise.race([
							fetch(url, options),
							new Promise((_, reject) => {
								setTimeout(
									() => reject(new Error("Request timed out")),
									timeoutMs,
								);
							}),
						]);
		} catch (error) {
			error.url = url;
			error.method = method;
			throw error;
		}

		if (!response || !response.ok) {
			const text = response ? await response.text() : "";
			const error = new Error(
				`Request failed (${response?.status ?? "unknown"}): ${text || response?.statusText || "No response"}`,
			);
			error.status = response?.status;
			error.url = url;
			error.method = method;
			error.responseText = text;
			throw error;
		}

		const bodyText = await response.text();
		if (!bodyText) {
			return {};
		}

		try {
			return JSON.parse(bodyText);
		} catch (error) {
			await this._logInfo(
				`Non-JSON response from ${method} ${url}: ${this._truncateForLog(bodyText, 200)}`,
			);
			return { text: bodyText };
		}
	}

	async _updateConnectionState(state) {
		if (this._lastConnectionState === state) {
			return;
		}

		this._lastConnectionState = state;
		await this._logInfo(`Connection state changed: ${state ? "connected" : "disconnected"}`);

		if (typeof this.lumia.updateConnection === "function") {
			try {
				await this.lumia.updateConnection(state);
			} catch (error) {
				await this._logError("Failed to update Lumia connection state", error);
			}
		}
	}
}

module.exports = OpenClawPlugin;
