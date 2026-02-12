const { Plugin } = require("@lumiastream/plugin");

const DEFAULTS = {
	baseUrl: "https://ntfy.sh",
	reconnectInterval: 5,
	maxReconnectInterval: 300,
	minPriority: 1,
	logThrottleMs: 5 * 60 * 1000,
	maxVariableLength: 2000,
};

const ALERT_KEYS = {
	notification: "notification",
};

const VARIABLE_NAMES = {
	title: "title",
	message: "message",
	topic: "topic",
	priority: "priority",
	tags: "tags",
	id: "id",
	time: "time",
	click: "click",
	icon: "icon",
	attachmentUrl: "attachment_url",
	event: "event",
};

class NtfyPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this.ws = null;
		this.isConnecting = false;
		this.isManuallyDisconnected = false;
		this.reconnectTimeoutId = null;
		this._lastConnectionState = null;
		this._logTimestamps = new Map();
		this._currentReconnectInterval = DEFAULTS.reconnectInterval;
		this._cachedTagFilter = [];
		this._cachedRegex = null;
		this._cachedRegexSource = "";
	}

	async onload() {
		this._refreshFilters();

		if (this._autoConnect()) {
			await this.connect({ showToast: false });
		} else {
			await this._updateConnectionState(false);
		}
	}

	async onunload() {
		await this.disconnect(false);
	}

	async onsettingsupdate(settings, previous = {}) {
		const connectionChanged =
			this._baseUrl(settings) !== this._baseUrl(previous) ||
			this._topicsKey(settings) !== this._topicsKey(previous) ||
			this._authKey(settings) !== this._authKey(previous);

		const autoConnectChanged =
			Boolean(settings?.autoConnect) !== Boolean(previous?.autoConnect);

		const reconnectChanged =
			this._reconnectInterval(settings) !== this._reconnectInterval(previous);

		const filterChanged =
			this._tagFilter(settings) !== this._tagFilter(previous) ||
			this._messageRegex(settings) !== this._messageRegex(previous) ||
			this._minPriority(settings) !== this._minPriority(previous);

		if (filterChanged) {
			this._refreshFilters(settings);
		}

		if (reconnectChanged) {
			this._currentReconnectInterval = this._reconnectInterval(settings);
		}

		if (connectionChanged || autoConnectChanged) {
			if (this._autoConnect(settings)) {
				this.isManuallyDisconnected = false;
				await this._reconnect({ showToast: false });
			} else {
				await this.disconnect(false);
			}
		}
	}

	async actions(config) {
		for (const action of config.actions) {
			try {
				switch (action.type) {
					case "manual_connect":
						await this.connect({ showToast: true });
						break;
					case "manual_disconnect":
						await this.disconnect(true);
						break;
					case "test_alert":
						await this._handleTestAlert();
						break;
				}
			} catch (error) {
				const message = this._errorMessage(error);
				await this._log(
					`Action ${action.type ?? "unknown"} failed: ${message}`,
					"error",
				);
			}
		}
	}

	async validateAuth(data = {}) {
		const baseUrl = this._baseUrl(data) || this._baseUrl();
		const topics = this._topics(data);
		const authType = this._authType(data);

		if (!baseUrl) {
			return { ok: false, message: "Missing ntfy server base URL." };
		}
		if (!topics.length) {
			return { ok: false, message: "Missing ntfy topic(s)." };
		}
		if (authType === "token" && !this._accessToken(data)) {
			return { ok: false, message: "Missing ntfy access token." };
		}
		if (authType === "basic" && !this._username(data)) {
			return { ok: false, message: "Missing ntfy username." };
		}
		if (authType === "basic" && !this._password(data)) {
			return { ok: false, message: "Missing ntfy password." };
		}

		return { ok: true };
	}

	_tag() {
		return `[${this.manifest?.id ?? "ntfy"}]`;
	}

	async _log(message, severity = "info") {
		if (severity !== "warn" && severity !== "error") {
			return;
		}

		const prefix = this._tag();
		const decorated =
			severity === "warn"
				? `${prefix} WARNING: ${message}`
				: `${prefix} ERROR: ${message}`;

		await this.lumia.log(decorated);
	}

	async _logThrottled(
		key,
		message,
		severity = "warn",
		intervalMs = DEFAULTS.logThrottleMs,
	) {
		const now = Date.now();
		const last = this._logTimestamps.get(key) ?? 0;
		if (now - last < intervalMs) {
			return;
		}
		this._logTimestamps.set(key, now);
		await this._log(message, severity);
	}

	_refreshFilters(settings = this.settings) {
		this._cachedTagFilter = this._parseTagFilter(settings);
		const regexValue = this._messageRegex(settings);
		if (!regexValue) {
			this._cachedRegex = null;
			this._cachedRegexSource = "";
			return;
		}

		try {
			const parsed = this._parseRegex(regexValue);
			this._cachedRegex = new RegExp(parsed.pattern, parsed.flags);
			this._cachedRegexSource = regexValue;
		} catch (error) {
			this._cachedRegex = null;
			this._cachedRegexSource = "";
			void this._log(
				`Invalid message regex ignored: ${this._errorMessage(error)}`,
				"warn",
			);
		}
	}

	async connect(options = {}) {
		const { showToast = true } = options;

		if (this.isConnecting) {
			return;
		}

		if (typeof WebSocket !== "function") {
			await this._log(
				"WebSocket is not available in this environment.",
				"error",
			);
			await this._updateConnectionState(false);
			return;
		}

		if (!this._hasRequiredSettings()) {
			await this._updateConnectionState(false);
			await this._log("Missing ntfy server URL or topics.", "warn");
			if (showToast && typeof this.lumia.showToast === "function") {
				await this.lumia.showToast({
					message: "ntfy settings missing: server URL or topics",
				});
			}
			return;
		}

		if (this.ws && this.ws.readyState === 1) {
			return;
		}

		try {
			this.isConnecting = true;
			this.isManuallyDisconnected = false;

			const wsUrl = this._buildWsUrl();
			this.ws = new WebSocket(wsUrl);

			this.ws.onopen = () => {
				void this._handleOpen(showToast);
			};
			this.ws.onmessage = (event) => {
				void this._handleMessage(event);
			};
			this.ws.onerror = (error) => {
				void this._handleError(error);
			};
			this.ws.onclose = () => {
				void this._handleClose();
			};
		} catch (error) {
			this.isConnecting = false;
			const message = this._errorMessage(error);
			await this._log(`Connection error: ${message}`, "error");
			if (showToast && typeof this.lumia.showToast === "function") {
				await this.lumia.showToast({
					message: `Failed to connect: ${message}`,
				});
			}
		}
	}

	async disconnect(showToast = true) {
		this.isManuallyDisconnected = true;

		if (this.reconnectTimeoutId) {
			clearTimeout(this.reconnectTimeoutId);
			this.reconnectTimeoutId = null;
		}

		if (this.ws) {
			this.ws.onclose = null;
			this.ws.close();
			this.ws = null;
		}

		this.isConnecting = false;
		this._currentReconnectInterval = this._reconnectInterval();

		if (showToast && typeof this.lumia.showToast === "function") {
			await this.lumia.showToast({ message: "Disconnected from ntfy" });
		}

		await this._updateConnectionState(false);
	}

	async _reconnect(options = {}) {
		await this.disconnect(false);
		if (this._autoConnect()) {
			await this.connect(options);
		}
	}

	async _handleOpen(showToast = true) {
		this.isConnecting = false;
		this._currentReconnectInterval = this._reconnectInterval();

		if (showToast && typeof this.lumia.showToast === "function") {
			await this.lumia.showToast({ message: "Connected to ntfy" });
		}

		await this._updateConnectionState(true);
	}

	async _handleMessage(event) {
		const raw = this._normalizeMessageData(event?.data);
		if (!raw) {
			return;
		}

		let payload;
		try {
			payload = JSON.parse(raw);
		} catch (error) {
			await this._logThrottled(
				"json-parse",
				`Failed to parse ntfy payload: ${this._errorMessage(error)}`,
				"warn",
			);
			return;
		}

		const eventType = String(payload?.event || "").toLowerCase();

		if (eventType !== "message") {
			return;
		}

		if (!this._passesFilters(payload)) {
			return;
		}

		await this._handleNotification(payload);
	}

	async _handleError(error) {
		const message = this._errorMessage(error);
		await this._logThrottled(
			"socket-error",
			`WebSocket error: ${message}`,
			"warn",
		);
	}

	async _handleClose() {
		await this._updateConnectionState(false);

		if (!this.isManuallyDisconnected) {
			await this._scheduleReconnect();
		}
	}

	async _scheduleReconnect() {
		if (this.reconnectTimeoutId) {
			return;
		}

		const interval = this._currentReconnectInterval;
		const next = Math.min(Math.max(interval, 1), DEFAULTS.maxReconnectInterval);

		this.reconnectTimeoutId = setTimeout(() => {
			this.reconnectTimeoutId = null;
			this._currentReconnectInterval = Math.min(
				this._currentReconnectInterval * 2,
				DEFAULTS.maxReconnectInterval,
			);
			void this.connect({ showToast: false });
		}, next * 1000);
	}

	async _handleNotification(payload = {}) {
		const alertVariables = this._buildAlertVariables(payload);

		if (this._enableAlerts()) {
			await this._triggerNotificationAlert(alertVariables, "alert");
		}
	}

	async _handleTestAlert() {
		const testPayload = {
			event: "message",
			id: "test-notification",
			topic: this._topics()[0] || "",
			time: Math.floor(Date.now() / 1000),
			priority: 3,
			title: "Test Notification",
			message: "This is a test from the ntfy plugin.",
			tags: ["test", "lumia"],
			click: "https://ntfy.sh",
		};
		const alertVariables = this._buildAlertVariables(testPayload);
		await this._triggerNotificationAlert(alertVariables, "test alert");
	}

	_buildAlertPayload(alertVariables = {}) {
		return {
			dynamic: {
				...alertVariables,
				value: alertVariables[VARIABLE_NAMES.priority],
			},
			extraSettings: {
				...alertVariables,
			},
		};
	}

	_buildAlertVariables(payload = {}) {
		const tags = this._normalizeTags(payload?.tags);
		const formattedTime = this._formatTime(payload?.time);
		const attachmentUrl =
			payload?.attachment?.url ||
			payload?.attachment?.link ||
			payload?.attachment?.href;

		return {
			[VARIABLE_NAMES.title]: this._truncateValue(payload?.title),
			[VARIABLE_NAMES.message]: this._truncateValue(payload?.message),
			[VARIABLE_NAMES.topic]: this._truncateValue(payload?.topic),
			[VARIABLE_NAMES.priority]: this._coerceNumber(payload?.priority, ""),
			[VARIABLE_NAMES.tags]: this._truncateValue(tags),
			[VARIABLE_NAMES.id]: this._truncateValue(payload?.id),
			[VARIABLE_NAMES.time]: this._truncateValue(formattedTime || payload?.time),
			[VARIABLE_NAMES.click]: this._truncateValue(payload?.click),
			[VARIABLE_NAMES.icon]: this._truncateValue(payload?.icon),
			[VARIABLE_NAMES.attachmentUrl]: this._truncateValue(attachmentUrl),
			[VARIABLE_NAMES.event]: this._truncateValue(payload?.event),
		};
	}

	async _triggerNotificationAlert(alertVariables = {}, label = "alert") {
		try {
			await this.lumia.triggerAlert({
				alert: ALERT_KEYS.notification,
				...this._buildAlertPayload(alertVariables),
			});
		} catch (error) {
			await this._log(
				`Failed to trigger ${label}: ${this._errorMessage(error)}`,
				"warn",
			);
		}
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
				await this._log(
					`Failed to update connection state: ${this._errorMessage(error)}`,
					"warn",
				);
			}
		}
	}

	_buildWsUrl() {
		const baseUrl = this._baseUrl();
		const topics = this._topics();

		if (!baseUrl) {
			throw new Error("Missing ntfy base URL");
		}
		if (!topics.length) {
			throw new Error("Missing ntfy topics");
		}

		const url = new URL(baseUrl);
		url.protocol = url.protocol === "http:" ? "ws:" : "wss:";
		const basePath = url.pathname.replace(/\/+$/, "");
		const topicPath = topics
			.map((topic) => encodeURIComponent(topic))
			.join(",");
		url.pathname = `${basePath}/${topicPath}/ws`;

		const auth = this._buildAuthQuery();
		if (auth) {
			url.searchParams.set("auth", auth);
		}

		return url.toString();
	}

	_buildAuthQuery(settings = this.settings) {
		const authType = this._authType(settings);
		if (authType === "token") {
			const token = this._accessToken(settings);
			if (!token) {
				return "";
			}
			const headerValue = `Bearer ${token}`;
			return Buffer.from(headerValue).toString("base64");
		}

		if (authType === "basic") {
			const username = this._username(settings);
			const password = this._password(settings);
			if (!username || !password) {
				return "";
			}
			const credential = Buffer.from(`${username}:${password}`).toString(
				"base64",
			);
			const headerValue = `Basic ${credential}`;
			return Buffer.from(headerValue).toString("base64");
		}

		return "";
	}

	_hasRequiredSettings(settings = this.settings) {
		return Boolean(this._baseUrl(settings) && this._topics(settings).length);
	}

	_baseUrl(settings = this.settings) {
		const raw = this._trim(settings?.baseUrl);
		return raw || DEFAULTS.baseUrl;
	}

	_topics(settings = this.settings) {
		const raw = this._trim(settings?.topics);
		if (!raw) {
			return [];
		}
		return raw
			.split(",")
			.map((value) => value.trim())
			.filter(Boolean);
	}

	_topicsKey(settings = this.settings) {
		return this._topics(settings).join(",");
	}

	_authKey(settings = this.settings) {
		return [
			this._authType(settings),
			this._accessToken(settings),
			this._username(settings),
			this._password(settings),
		].join("|");
	}

	_authType(settings = this.settings) {
		const raw = this._trim(settings?.authType);
		if (raw === "token" || raw === "basic") {
			return raw;
		}
		return "none";
	}

	_accessToken(settings = this.settings) {
		return this._trim(settings?.accessToken);
	}

	_username(settings = this.settings) {
		return this._trim(settings?.username);
	}

	_password(settings = this.settings) {
		return this._trim(settings?.password);
	}

	_autoConnect(settings = this.settings) {
		return settings?.autoConnect !== false;
	}

	_reconnectInterval(settings = this.settings) {
		const raw = Number(settings?.reconnectInterval);
		const value = Number.isFinite(raw) ? raw : DEFAULTS.reconnectInterval;
		return Math.min(Math.max(value, 1), DEFAULTS.maxReconnectInterval);
	}

	_minPriority(settings = this.settings) {
		const raw = Number(settings?.minPriority);
		const value = Number.isFinite(raw) ? raw : DEFAULTS.minPriority;
		return Math.min(Math.max(value, 1), 5);
	}

	_tagFilter(settings = this.settings) {
		return this._trim(settings?.tagFilter);
	}

	_messageRegex(settings = this.settings) {
		return this._trim(settings?.messageRegex);
	}

	_enableAlerts(settings = this.settings) {
		return settings?.enableAlerts !== false;
	}

	_parseTagFilter(settings = this.settings) {
		const raw = this._tagFilter(settings);
		if (!raw) {
			return [];
		}
		return raw
			.split(",")
			.map((value) => value.trim().toLowerCase())
			.filter(Boolean);
	}

	_parseRegex(raw) {
		const trimmed = raw.trim();
		const match = trimmed.match(/^\/(.+)\/([gimsuy]*)$/);
		if (match) {
			return { pattern: match[1], flags: match[2] || "i" };
		}
		return { pattern: trimmed, flags: "i" };
	}

	_passesFilters(payload = {}) {
		const minPriority = this._minPriority();
		const priority = this._coerceNumber(payload?.priority, 0);
		if (minPriority > 1 && priority < minPriority) {
			return false;
		}

		if (this._cachedTagFilter.length) {
			const tags = Array.isArray(payload?.tags) ? payload.tags : [];
			const lower = tags.map((tag) => String(tag).toLowerCase());
			const missing = this._cachedTagFilter.some(
				(required) => !lower.includes(required),
			);
			if (missing) {
				return false;
			}
		}

		if (this._cachedRegex && this._cachedRegexSource) {
			const title = payload?.title ? String(payload.title) : "";
			const message = payload?.message ? String(payload.message) : "";
			const haystack = `${title} ${message}`.trim();
			if (this._cachedRegex.global) {
				this._cachedRegex.lastIndex = 0;
			}
			if (haystack && !this._cachedRegex.test(haystack)) {
				return false;
			}
		}

		return true;
	}

	_normalizeMessageData(data) {
		if (!data) {
			return "";
		}
		if (typeof data === "string") {
			return data.trim();
		}
		if (Buffer.isBuffer(data)) {
			return data.toString("utf8").trim();
		}
		if (ArrayBuffer.isView(data)) {
			return Buffer.from(data.buffer, data.byteOffset, data.byteLength)
				.toString("utf8")
				.trim();
		}
		return String(data).trim();
	}

	_normalizeTags(value) {
		if (Array.isArray(value)) {
			return value
				.map((tag) => String(tag).trim())
				.filter(Boolean)
				.join(",");
		}
		if (typeof value === "string") {
			return value
				.split(",")
				.map((tag) => tag.trim())
				.filter(Boolean)
				.join(",");
		}
		return "";
	}

	_formatTime(value) {
		if (!value) {
			return "";
		}
		const seconds = Number(value);
		if (Number.isFinite(seconds)) {
			return new Date(seconds * 1000).toISOString();
		}
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
	}

	_truncateValue(value, limit = DEFAULTS.maxVariableLength) {
		if (value === undefined || value === null) {
			return "";
		}
		const trimmed = String(value).replace(/\s+/g, " ").trim();
		return trimmed.length > limit ? `${trimmed.slice(0, limit)}...` : trimmed;
	}

	_trim(value) {
		if (typeof value !== "string") {
			return "";
		}
		return value.trim();
	}

	_coerceNumber(value, fallback = 0) {
		const num = Number(value);
		return Number.isFinite(num) ? num : fallback;
	}

	_errorMessage(error) {
		if (!error) {
			return "Unknown error";
		}
		if (typeof error === "string") {
			return error;
		}
		return error?.message || String(error);
	}
}

module.exports = NtfyPlugin;
