const { Plugin } = require("@lumiastream/plugin");

const DEFAULTS = {
	authMode: "bot",
	pollInterval: 2,
	longPollTimeout: 20,
	codeWaitSeconds: 180,
	uptimeIntervalSeconds: 60,
	maxLogIntervalMs: 5 * 60 * 1000,
};

const ALERT_KEYS = {
	message: "message",
	entrance: "entrance",
	firstChatter: "firstChatter",
};

const VARIABLE_NAMES = {
	uptime: "uptime",
	chatTitle: "chat_title",
	chatId: "chat_id",
	chatType: "chat_type",
	sessionChatCount: "session_chat_count",
	currentFirstChatter: "current_first_chatter",
	currentFirstChatterCount: "current_first_chatter_count",
	previousFirstChatter: "previous_first_chatter",
	previousFirstChatterCount: "previous_first_chatter_count",
	lastChatter: "last_chatter",
	lastUserId: "last_user_id",
	lastMessage: "last_message",
	lastMessageId: "last_message_id",
	lastMessageAt: "last_message_at",
	memberCount: "member_count",
};

class TelegramPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._botPolling = false;
		this._botOffset = 0;
		this._botLoopPromise = null;
		this._botAbortController = null;
		this._userClient = null;
		this._userConnected = false;
		this._isConnecting = false;
		this._lastConnectionState = null;
		this._uptimeTimer = null;
		this._sessionStartedAt = null;
		this._logTimestamps = new Map();
		this._cachedRegex = null;
		this._cachedRegexSource = "";
		this._allowedChats = new Set();
		this._telegramLibPromise = null;
		this._authBlocked = false;
		this._lastLoginCodeUsed = "";
		this._chatOptions = new Map();
		this._lastChatOptionsUpdate = 0;
		this._state = {
			sessionChatCount: 0,
			currentFirstChatter: "",
			currentFirstChatterCount: 0,
			previousFirstChatter: "",
			previousFirstChatterCount: 0,
			sessionSeenUsers: new Set(),
		};
	}

	async onload() {
		this._refreshFilters();
		await this._restorePreviousFirstChatter();

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
		const modeChanged = this._authMode(settings) !== this._authMode(previous);
		const botChanged =
			this._botToken(settings) !== this._botToken(previous) ||
			this._botDefaultChat(settings) !== this._botDefaultChat(previous);
		const userChanged =
			this._userApiId(settings) !== this._userApiId(previous) ||
			this._userApiHash(settings) !== this._userApiHash(previous) ||
			this._userSessionString(settings) !== this._userSessionString(previous) ||
			this._userPhone(settings) !== this._userPhone(previous) ||
			this._userPassword(settings) !== this._userPassword(previous);
		const pollingChanged =
			this._botPollInterval(settings) !== this._botPollInterval(previous) ||
			this._botLongPollTimeout(settings) !==
				this._botLongPollTimeout(previous);
		const filterChanged =
			this._filterRegex(settings) !== this._filterRegex(previous) ||
			this._allowedChatRaw(settings) !== this._allowedChatRaw(previous);
		const codeChanged =
			this._string(settings?.userLoginCode, "") !==
			this._string(previous?.userLoginCode, "");

		if (filterChanged) {
			this._refreshFilters(settings);
		}

		if (codeChanged && this._authBlocked) {
			this._authBlocked = false;
		}

		if (modeChanged || botChanged || userChanged || pollingChanged) {
			await this.disconnect(false);
			if (this._autoConnect(settings)) {
				await this.connect({ showToast: false, resetSession: true });
			}
		} else if (codeChanged && this._autoConnect(settings)) {
			// Allow retry when a fresh login code is supplied.
			await this.connect({ showToast: false });
		}
	}

	async actions(config) {
		for (const action of config.actions || []) {
			try {
				switch (action.type) {
					case "send_message":
						await this._runSendMessageAction(action.value);
						break;
					case "reset_session":
						await this._resetSession();
						break;
					case "refresh_member_count":
						await this._refreshMemberCount(action.value);
						break;
					case "connect":
						await this.connect({ showToast: true, resetSession: true });
						break;
					case "disconnect":
						await this.disconnect(true);
						break;
					default:
						break;
				}
			} catch (error) {
				await this._log(
					`Action ${action.type || "unknown"} failed: ${this._errorMessage(error)}`,
					"warn",
				);
			}
		}
	}

	async refreshActionOptions(config = {}) {
		const actionType = this._string(config?.actionType, "");
		if (actionType !== "send_message") {
			return;
		}

		await this._hydrateChatOptions();
		await this._refreshActionChatOptions();
	}

	async validateAuth(data = {}) {
		const mode = this._authMode(data);
		if (mode === "bot") {
			const token = this._botToken(data);
			if (!token) {
				return { ok: false, message: "Missing bot token." };
			}
			try {
				const response = await fetch(
					`https://api.telegram.org/bot${token}/getMe`,
				);
				const payload = await response.json();
				if (!payload?.ok) {
					return {
						ok: false,
						message: payload?.description || "Bot token validation failed.",
					};
				}
			} catch (error) {
				return {
					ok: false,
					message: `Bot validation failed: ${this._errorMessage(error)}`,
				};
			}
			return { ok: true };
		}

		const apiId = this._userApiId(data);
		const apiHash = this._userApiHash(data);
		if (!apiId) {
			return { ok: false, message: "Missing API ID." };
		}
		if (!apiHash) {
			return { ok: false, message: "Missing API hash." };
		}
		const session = this._userSessionString(data);
		const phone = this._userPhone(data);
		if (!session && !phone) {
			return {
				ok: false,
				message: "Provide a session string or phone number for login.",
			};
		}
		return { ok: true };
	}

	async variableFunction({ key } = {}) {
		if (key !== VARIABLE_NAMES.uptime) {
			return "";
		}

		if (!this._sessionStartedAt) {
			return "Not connected";
		}

		return this._formatDuration(Date.now() - this._sessionStartedAt);
	}

	async chatbot(config = {}) {
		const message = this._string(config?.message, "").trim();
		if (!message) {
			return false;
		}

		await this._sendMessage({ message });
		return true;
	}

	async connect({ showToast = true, resetSession = false } = {}) {
		if (this._isConnecting) {
			return;
		}

		this._isConnecting = true;
		try {
			if (resetSession) {
				await this._resetSession();
			}

			if (this._authBlocked && this._authMode() === "user") {
				await this._log(
					"Waiting for a new Telegram login code. Update the Login Code field to retry.",
					"warn",
				);
				await this._updateConnectionState(false);
				return;
			}

			if (this._authMode() === "user") {
				await this._connectUser();
			} else {
				await this._startBotPolling();
			}
			if (showToast && typeof this.lumia.showToast === "function") {
				await this.lumia.showToast({ message: "Telegram connected" });
			}
		} catch (error) {
			await this._updateConnectionState(false);
			await this._log(
				`Failed to connect to Telegram: ${this._errorMessage(error)}`,
				"warn",
			);
			if (showToast && typeof this.lumia.showToast === "function") {
				await this.lumia.showToast({
					message: `Telegram connect failed: ${this._errorMessage(error)}`,
				});
			}
		} finally {
			this._isConnecting = false;
		}
	}

	async disconnect(showToast = true) {
		await this._stopBotPolling();
		await this._disconnectUser();
		this._stopUptimeTimer();
		this._sessionStartedAt = null;
		await this._setVariable(VARIABLE_NAMES.uptime, "");
		await this._updateConnectionState(false);
		if (showToast && typeof this.lumia.showToast === "function") {
			await this.lumia.showToast({ message: "Telegram disconnected" });
		}
	}

	async _startBotPolling() {
		const token = this._botToken();
		if (!token) {
			throw new Error("Missing bot token");
		}

		if (this._botLoopPromise) {
			return;
		}

		this._botPolling = true;
		this._sessionStartedAt = this._sessionStartedAt || Date.now();
		this._startUptimeTimer();
		await this._updateConnectionState(true);

		this._botLoopPromise = this._botPollLoop(token).finally(() => {
			this._botLoopPromise = null;
		});
	}

	async _stopBotPolling() {
		this._botPolling = false;
		if (this._botAbortController) {
			this._botAbortController.abort();
			this._botAbortController = null;
		}
		if (this._botLoopPromise) {
			try {
				await this._botLoopPromise;
			} catch (error) {
				// ignore
			}
			this._botLoopPromise = null;
		}
	}

	async _botPollLoop(token) {
		while (this._botPolling) {
			try {
				await this._pollBotOnce(token);
			} catch (error) {
				await this._log(
					`Bot polling error: ${this._errorMessage(error)}`,
					"warn",
				);
				await this._sleep(this._botPollInterval() * 1000);
			}
		}
	}

	async _pollBotOnce(token) {
		const timeoutSeconds = this._botLongPollTimeout();
		const url = `https://api.telegram.org/bot${token}/getUpdates`;
		const payload = {
			offset: this._botOffset,
			timeout: timeoutSeconds,
			allowed_updates: [
				"message",
				"edited_message",
				"channel_post",
				"edited_channel_post",
			],
		};

		this._botAbortController = new AbortController();
		const response = await fetch(url, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(payload),
			signal: this._botAbortController.signal,
		});

		if (!response.ok) {
			if (response.status === 401 || response.status === 403) {
				this._botPolling = false;
				await this._updateConnectionState(false);
				throw new Error("Bot token rejected by Telegram");
			}
			await this._sleep(this._botPollInterval() * 1000);
			return;
		}

		const data = await response.json();
		if (!data?.ok) {
			if (data?.error_code === 409) {
				await this._logThrottled(
					"bot-409",
					"Telegram Bot API conflict: another getUpdates or webhook is active.",
					"warn",
				);
			}
			await this._sleep(this._botPollInterval() * 1000);
			return;
		}

		for (const update of data.result || []) {
			if (typeof update?.update_id === "number") {
				this._botOffset = update.update_id + 1;
			}
			await this._handleBotUpdate(update);
		}

		await this._sleep(this._botPollInterval() * 1000);
	}

	async _handleBotUpdate(update) {
		const message =
			update?.message ||
			update?.edited_message ||
			update?.channel_post ||
			update?.edited_channel_post;
		if (!message) {
			return;
		}

		const payload = this._normalizeBotMessage(message);
		if (!payload) {
			return;
		}

		const added = this._recordChatOption(payload);
		if (added) {
			void this._refreshActionChatOptions();
		}

		if (!this._passesFilters(payload)) {
			return;
		}

		await this._handleIncomingMessage(payload);
	}

	_normalizeBotMessage(message) {
		const text = this._string(message?.text || message?.caption, "").trim();
		if (!text && this._ignoreServiceMessages()) {
			return null;
		}

		const chat = message?.chat || {};
		const sender = message?.from || message?.sender_chat || {};
		const chatId = this._string(chat?.id, "");
		const chatType = this._string(chat?.type, "");
		const chatTitle =
			this._string(chat?.title, "") ||
			this._string(chat?.username, "") ||
			this._string(chat?.first_name, "");
		const username = this._string(sender?.username, "");
		const displayName =
			this._string(
				[ sender?.first_name, sender?.last_name ].filter(Boolean).join(" "),
				"",
			) || username;
		const userId = this._string(sender?.id, "");
		const messageId = this._string(message?.message_id, "");
		const timestamp = message?.date
			? new Date(message.date * 1000).toISOString()
			: new Date().toISOString();

		return {
			text,
			chatId,
			chatTitle,
			chatType,
			username,
			displayName,
			userId,
			messageId,
			timestamp,
			isBot: Boolean(sender?.is_bot),
		};
	}

	async _connectUser() {
		const { TelegramClient, StringSession, NewMessage } =
			await this._loadTelegramLib();

		const apiId = this._userApiId();
		const apiHash = this._userApiHash();
		if (!apiId || !apiHash) {
			throw new Error("Missing API ID or API hash for user mode.");
		}

		const session = this._userSessionString();
		const stringSession = new StringSession(session || "");
		const client = new TelegramClient(stringSession, Number(apiId), apiHash, {
			connectionRetries: 3,
		});

		this._userClient = client;
		this._userConnected = false;
		this._sessionStartedAt = this._sessionStartedAt || Date.now();
		this._startUptimeTimer();

		if (session) {
			await client.connect();
		} else {
			try {
				await client.start({
					phoneNumber: async () => this._requireUserPhone(),
					phoneCode: async () => this._waitForUserCode(),
					password: async () => this._waitForUserPassword(),
					onError: (err) => {
						void this._log(
							`User login error: ${this._errorMessage(err)}`,
							"warn",
						);
					},
				});
			} catch (error) {
				const message = this._errorMessage(error);
				this._authBlocked = true;
				await this._updateConnectionState(false);
				await this._log(
					`User login failed: ${message}. Enter a new Login Code to retry.`,
					"warn",
				);
				throw error;
			}
			const savedSession = client.session.save();
			if (savedSession) {
				this.updateSettings({
					userSessionString: savedSession,
					userLoginCode: "",
				});
			}
		}

		client.addEventHandler((event) => {
			void this._handleUserEvent(event);
		}, new NewMessage({}));

		this._userConnected = true;
		await this._updateConnectionState(true);

		await this._hydrateChatOptions();
		await this._refreshActionChatOptions();
	}

	async _loadTelegramLib() {
		if (!this._telegramLibPromise) {
			this._telegramLibPromise = Promise.resolve().then(() => {
				try {
					const { TelegramClient } = require("telegram");
					const { StringSession } = require("telegram/sessions");
					const { NewMessage } = require("telegram/events");
					if (!TelegramClient || !StringSession || !NewMessage) {
						throw new Error("Telegram MTProto exports missing");
					}
					return { TelegramClient, StringSession, NewMessage };
				} catch (error) {
					const message =
						error instanceof Error ? error.message : String(error);
					throw new Error(
						`Telegram user mode requires the telegram package. Install dependencies for the plugin so the runtime can resolve \"telegram\". (${message})`,
					);
				}
			});
		}
		return this._telegramLibPromise;
	}

	async _disconnectUser() {
		if (!this._userClient) {
			return;
		}

		try {
			await this._userClient.disconnect();
		} catch (error) {
			// ignore
		}

		this._userClient = null;
		this._userConnected = false;
	}

	async _handleUserEvent(event) {
		if (!event?.message) {
			return;
		}

		const payload = await this._normalizeUserMessage(event);
		if (!payload) {
			return;
		}

		const added = this._recordChatOption(payload);
		if (added) {
			void this._refreshActionChatOptions();
		}

		if (!this._passesFilters(payload)) {
			return;
		}

		await this._handleIncomingMessage(payload);
	}

	async _normalizeUserMessage(event) {
		const message = event?.message;
		if (!message) {
			return null;
		}

		const text = this._string(message?.message, "").trim();
		if (!text && this._ignoreServiceMessages()) {
			return null;
		}

		const chatId = this._string(event?.chatId ?? message?.chatId, "");
		const chat = event?.chat;
		const chatTitle =
			this._string(chat?.title, "") ||
			this._string(chat?.username, "") ||
			this._string(chat?.firstName, "") ||
			this._string(chat?.lastName, "");
		const chatType = event?.isPrivate
			? "private"
			: event?.isChannel
				? "channel"
				: event?.isGroup
					? "group"
					: "unknown";

		let sender = message?.sender;
		if (!sender && typeof message?.getSender === "function") {
			try {
				sender = await message.getSender();
			} catch (error) {
				sender = null;
			}
		}

		const username = this._string(sender?.username, "");
		const displayName =
			this._string(
				[ sender?.firstName, sender?.lastName ].filter(Boolean).join(" "),
				"",
			) || username;
		const userId = this._string(message?.senderId ?? sender?.id, "");
		const messageId = this._string(message?.id, "");
		const timestamp = message?.date instanceof Date
			? message.date.toISOString()
			: new Date().toISOString();

		return {
			text,
			chatId,
			chatTitle,
			chatType,
			username,
			displayName,
			userId,
			messageId,
			timestamp,
			isBot: false,
		};
	}

	async _handleIncomingMessage(payload) {
		const message = payload?.text || "";
		if (!message) {
			return;
		}

		this._state.sessionChatCount += 1;

		await Promise.all([
			this._setVariable(VARIABLE_NAMES.sessionChatCount, this._state.sessionChatCount),
			this._setVariable(VARIABLE_NAMES.lastChatter, payload.username || payload.displayName || ""),
			this._setVariable(VARIABLE_NAMES.lastUserId, payload.userId || ""),
			this._setVariable(VARIABLE_NAMES.lastMessage, message),
			this._setVariable(VARIABLE_NAMES.lastMessageId, payload.messageId || ""),
			this._setVariable(VARIABLE_NAMES.lastMessageAt, payload.timestamp || ""),
			this._setVariable(VARIABLE_NAMES.chatTitle, payload.chatTitle || ""),
			this._setVariable(VARIABLE_NAMES.chatId, payload.chatId || ""),
			this._setVariable(VARIABLE_NAMES.chatType, payload.chatType || ""),
		]);

		await this._setVariable(
			VARIABLE_NAMES.uptime,
			this._formatDuration(Date.now() - (this._sessionStartedAt || Date.now())),
		);

		await this._handleEntranceAndFirstChatter(payload);
		await this._triggerMessageAlert(payload);
		this._displayChat(payload);
	}

	async _handleEntranceAndFirstChatter(payload) {
		const userKey = this._buildSessionUserKey(payload);
		if (!userKey) {
			return;
		}

		if (!this._state.sessionSeenUsers.has(userKey)) {
			this._state.sessionSeenUsers.add(userKey);
			await this._triggerEntranceAlert(payload);
		}

		if (this._state.currentFirstChatter) {
			return;
		}

		const previousKey = this._buildSessionUserKey({
			username: this._state.previousFirstChatter,
		});
		const streak =
			previousKey && previousKey === userKey
				? this._state.previousFirstChatterCount + 1
				: 1;

		this._state.currentFirstChatter = payload.username || payload.displayName || "";
		this._state.currentFirstChatterCount = streak;

		await Promise.all([
			this._setVariable(VARIABLE_NAMES.currentFirstChatter, this._state.currentFirstChatter),
			this._setVariable(VARIABLE_NAMES.currentFirstChatterCount, streak),
		]);

		await this._triggerFirstChatterAlert(payload, streak);
	}

	_buildSessionUserKey(payload) {
		if (payload?.userId) {
			return `id:${String(payload.userId).toLowerCase()}`;
		}
		const name = this._string(payload?.username || payload?.displayName, "").trim();
		if (!name) {
			return "";
		}
		return `name:${name.toLowerCase()}`;
	}

	async _triggerMessageAlert(payload) {
		try {
			await this.lumia.triggerAlert({
				alert: ALERT_KEYS.message,
				extraSettings: this._buildAlertExtra(payload),
				dynamic: {
					name: payload.username || payload.displayName || "message",
					value: payload.text || "",
				},
			});
		} catch (error) {
			await this._log(
				`Failed to trigger message alert: ${this._errorMessage(error)}`,
				"warn",
			);
		}
	}

	async _triggerEntranceAlert(payload) {
		try {
			await this.lumia.triggerAlert({
				alert: ALERT_KEYS.entrance,
				extraSettings: this._buildAlertExtra(payload),
				dynamic: {
					name: payload.username || payload.displayName || "entrance",
					value: payload.username || payload.displayName || "",
				},
			});
		} catch (error) {
			await this._log(
				`Failed to trigger entrance alert: ${this._errorMessage(error)}`,
				"warn",
			);
		}
	}

	async _triggerFirstChatterAlert(payload, streak) {
		try {
			await this.lumia.triggerAlert({
				alert: ALERT_KEYS.firstChatter,
				extraSettings: this._buildAlertExtra(payload, {
					first_chatter_count: streak,
				}),
				dynamic: {
					name: payload.username || payload.displayName || "first",
					value: streak,
				},
			});
		} catch (error) {
			await this._log(
				`Failed to trigger first chatter alert: ${this._errorMessage(error)}`,
				"warn",
			);
		}
	}

	_buildAlertExtra(payload, overrides = {}) {
		return {
			chat_title: payload.chatTitle || "",
			chat_id: payload.chatId || "",
			chat_type: payload.chatType || "",
			last_chatter: payload.username || payload.displayName || "",
			last_user_id: payload.userId || "",
			last_message: payload.text || "",
			last_message_id: payload.messageId || "",
			last_message_at: payload.timestamp || "",
			session_chat_count: this._state.sessionChatCount,
			...overrides,
		};
	}

	_displayChat(payload) {
		try {
			this.lumia.displayChat({
				username: payload.username || payload.displayName || "telegram",
				displayname: payload.displayName || payload.username || "telegram",
				message: payload.text || "",
				messageId: payload.messageId || undefined,
				channel: payload.chatTitle || undefined,
				userId: payload.userId || undefined,
				userLevels: {},
			});
		} catch (error) {
			// ignore display failures
		}
	}

	_recordChatOption(payload) {
		const chatId = this._string(payload?.chatId, "").trim();
		const chatTitle = this._string(payload?.chatTitle, "").trim();
		const username = this._string(payload?.username, "").trim();
		const chatType = this._string(payload?.chatType, "").trim();
		if (!chatId && !chatTitle && !username) {
			return false;
		}

		const value = username ? `@${username}` : chatId || chatTitle;
		if (!value) {
			return false;
		}

		const labelParts = [];
		if (chatTitle) {
			labelParts.push(chatTitle);
		} else if (username) {
			labelParts.push(`@${username}`);
		}
		if (username && chatTitle && !labelParts.includes(`@${username}`)) {
			labelParts.push(`@${username}`);
		}
		if (chatType) {
			labelParts.push(chatType);
		}
		if (chatId) {
			labelParts.push(chatId);
		}
		const label = labelParts.join(" • ") || value;

		const existing = this._chatOptions.get(value);
		if (existing && existing.label === label) {
			return false;
		}

		this._chatOptions.set(value, { label, value });
		return true;
	}

	async _hydrateChatOptions() {
		if (this._authMode() !== "user" || !this._userClient) {
			return;
		}

		if (typeof this._userClient.getDialogs !== "function") {
			return;
		}

		try {
			const dialogs = await this._userClient.getDialogs({});
			if (!Array.isArray(dialogs)) {
				return;
			}
			for (const dialog of dialogs) {
				const entity = dialog?.entity ?? dialog;
				const id = this._string(entity?.id ?? dialog?.id ?? "", "").trim();
				const title = this._string(
					entity?.title ??
						entity?.username ??
						entity?.firstName ??
						entity?.lastName ??
						"",
					"",
				).trim();
				const username = this._string(entity?.username ?? "", "").trim();
				const chatType = entity?.className
					? String(entity.className).replace(/^.*\\./, "")
					: "";
				const payload = {
					chatId: id,
					chatTitle: title,
					username,
					chatType,
				};
				this._recordChatOption(payload);
			}
		} catch (error) {
			await this._log(
				`Failed to load chat list: ${this._errorMessage(error)}`,
				"warn",
			);
		}
	}

	async _refreshActionChatOptions() {
		const now = Date.now();
		if (now - this._lastChatOptionsUpdate < 3000) {
			return;
		}
		this._lastChatOptionsUpdate = now;

		const options = Array.from(this._chatOptions.values())
			.sort((a, b) => a.label.localeCompare(b.label))
			.slice(0, 200);

		if (!options.length) {
			return;
		}

		try {
			await this.lumia.updateActionFieldOptions({
				actionType: "send_message",
				fieldKey: "chatId",
				options,
			});
		} catch (error) {
			await this._log(
				`Failed to update chat options: ${this._errorMessage(error)}`,
				"warn",
			);
		}
	}

	async _runSendMessageAction(raw = {}) {
		await this._sendMessage({
			chatId: this._string(raw?.chatId, ""),
			message: this._string(raw?.message, ""),
			parseMode: this._string(raw?.parseMode, "none"),
			disableNotification: Boolean(raw?.disableNotification),
			replyToMessageId: this._string(raw?.replyToMessageId, ""),
		});
	}

	async _sendMessage({ chatId, message, parseMode, disableNotification, replyToMessageId } = {}) {
		const text = this._string(message, "").trim();
		if (!text) {
			return;
		}

		if (this._authMode() === "user") {
			await this._sendUserMessage({ chatId, message: text });
			return;
		}

		await this._sendBotMessage({ chatId, message: text, parseMode, disableNotification, replyToMessageId });
	}

	async _sendBotMessage({ chatId, message, parseMode, disableNotification, replyToMessageId }) {
		const token = this._botToken();
		if (!token) {
			throw new Error("Missing bot token");
		}

		const targetChat = this._string(chatId, "") || this._botDefaultChat();
		if (!targetChat) {
			throw new Error("Missing chat ID");
		}

		const url = `https://api.telegram.org/bot${token}/sendMessage`;
		const payload = {
			chat_id: targetChat,
			text: message,
			disable_notification: Boolean(disableNotification),
		};
		if (parseMode && parseMode !== "none") {
			payload.parse_mode = parseMode;
		}
		if (replyToMessageId) {
			payload.reply_to_message_id = replyToMessageId;
		}

		const response = await fetch(url, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(payload),
		});
		const data = await response.json();
		if (!data?.ok) {
			throw new Error(data?.description || "Telegram sendMessage failed");
		}
	}

	async _sendUserMessage({ chatId, message }) {
		if (!this._userClient) {
			throw new Error("User mode is not connected");
		}

		const targetChat = this._string(chatId, "") || this._userDefaultChat();
		if (!targetChat) {
			throw new Error("Missing chat ID");
		}

		await this._userClient.sendMessage(targetChat, { message });
	}

	async _refreshMemberCount(raw = {}) {
		const chatId = this._string(raw?.chatId, "") || this._defaultChatId();
		if (!chatId) {
			return;
		}

		if (this._authMode() === "bot") {
			const count = await this._botGetMemberCount(chatId);
			if (typeof count === "number") {
				await this._setVariable(VARIABLE_NAMES.memberCount, count);
			}
			return;
		}

		// User mode: skip unless a connected client can fetch participants.
		try {
			if (!this._userClient) {
				return;
			}
			const participants = await this._userClient.getParticipants(chatId, { limit: 0 });
			if (participants?.count != null) {
				await this._setVariable(VARIABLE_NAMES.memberCount, participants.count);
			}
		} catch (error) {
			await this._log(
				`Failed to refresh member count: ${this._errorMessage(error)}`,
				"warn",
			);
		}
	}

	async _botGetMemberCount(chatId) {
		const token = this._botToken();
		if (!token) {
			return null;
		}
		try {
			const url = `https://api.telegram.org/bot${token}/getChatMemberCount`;
			const response = await fetch(url, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ chat_id: chatId }),
			});
			const data = await response.json();
			if (!data?.ok) {
				return null;
			}
			return Number(data?.result ?? 0);
		} catch (error) {
			await this._log(
				`Failed to fetch member count: ${this._errorMessage(error)}`,
				"warn",
			);
			return null;
		}
	}

	async _resetSession() {
		if (this._state.currentFirstChatter) {
			this._state.previousFirstChatter = this._state.currentFirstChatter;
			this._state.previousFirstChatterCount =
				this._state.currentFirstChatterCount || 1;
		}

		this._state.sessionChatCount = 0;
		this._state.currentFirstChatter = "";
		this._state.currentFirstChatterCount = 0;
		this._state.sessionSeenUsers = new Set();
		this._sessionStartedAt = Date.now();

		await Promise.all([
			this._setVariable(VARIABLE_NAMES.sessionChatCount, 0),
			this._setVariable(VARIABLE_NAMES.currentFirstChatter, ""),
			this._setVariable(VARIABLE_NAMES.currentFirstChatterCount, 0),
			this._setVariable(
				VARIABLE_NAMES.previousFirstChatter,
				this._state.previousFirstChatter,
			),
			this._setVariable(
				VARIABLE_NAMES.previousFirstChatterCount,
				this._state.previousFirstChatterCount,
			),
			this._setVariable(
				VARIABLE_NAMES.uptime,
				this._formatDuration(Date.now() - this._sessionStartedAt),
			),
		]);
	}

	async _restorePreviousFirstChatter() {
		try {
			const previous = await this.lumia.getVariable(
				VARIABLE_NAMES.previousFirstChatter,
			);
			const previousCount = await this.lumia.getVariable(
				VARIABLE_NAMES.previousFirstChatterCount,
			);
			this._state.previousFirstChatter = this._string(previous, "");
			this._state.previousFirstChatterCount =
				this._number(previousCount, 0) || 0;
		} catch (error) {
			// ignore
		}
	}

	_refreshFilters(settings = this.settings) {
		this._allowedChats = new Set(this._parseAllowList(this._allowedChatRaw(settings)));

		const regexValue = this._filterRegex(settings);
		if (!regexValue) {
			this._cachedRegex = null;
			this._cachedRegexSource = "";
			return;
		}

		try {
			this._cachedRegex = new RegExp(regexValue, "i");
			this._cachedRegexSource = regexValue;
		} catch (error) {
			this._cachedRegex = null;
			this._cachedRegexSource = "";
			void this._log(
				`Invalid regex ignored: ${this._errorMessage(error)}`,
				"warn",
			);
		}
	}

	_passesFilters(payload) {
		if (payload?.isBot && this._ignoreBots()) {
			return false;
		}

		const chatType = this._string(payload?.chatType, "");
		if (this._authMode() === "bot") {
			if (chatType === "private" && !this._botIncludePrivate()) {
				return false;
			}
			if (
				(chatType === "group" || chatType === "supergroup") &&
				!this._botIncludeGroups()
			) {
				return false;
			}
			if (chatType === "channel" && !this._botIncludeChannels()) {
				return false;
			}
		}

		if (this._allowedChats.size > 0) {
			const id = this._string(payload?.chatId, "");
			const title = this._string(payload?.chatTitle, "");
			if (!this._allowedChats.has(id) && !this._allowedChats.has(title)) {
				return false;
			}
		}

		if (this._cachedRegex) {
			const text = this._string(payload?.text, "");
			if (!this._cachedRegex.test(text)) {
				return false;
			}
		}

		return true;
	}

	_startUptimeTimer() {
		this._stopUptimeTimer();
		this._uptimeTimer = setInterval(() => {
			if (!this._sessionStartedAt) {
				return;
			}
			void this._setVariable(
				VARIABLE_NAMES.uptime,
				this._formatDuration(Date.now() - this._sessionStartedAt),
			);
		}, DEFAULTS.uptimeIntervalSeconds * 1000);
	}

	_stopUptimeTimer() {
		if (this._uptimeTimer) {
			clearInterval(this._uptimeTimer);
			this._uptimeTimer = null;
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

	async _setVariable(name, value) {
		try {
			await this.lumia.setVariable(name, value);
		} catch (error) {
			// ignore set failures
		}
	}

	_defaultChatId() {
		return this._authMode() === "user"
			? this._userDefaultChat()
			: this._botDefaultChat();
	}

	_autoConnect(settings = this.settings) {
		return Boolean(settings?.autoConnect ?? true);
	}

	_authMode(settings = this.settings) {
		const mode = this._string(settings?.authMode, DEFAULTS.authMode);
		return mode === "user" ? "user" : "bot";
	}

	_botToken(settings = this.settings) {
		return this._string(settings?.botToken, "").trim();
	}

	_botDefaultChat(settings = this.settings) {
		return this._string(settings?.botDefaultChatId, "").trim();
	}

	_botPollInterval(settings = this.settings) {
		const interval = this._number(settings?.botPollInterval, DEFAULTS.pollInterval);
		return Math.min(60, Math.max(1, interval));
	}

	_botLongPollTimeout(settings = this.settings) {
		const timeout = this._number(settings?.botLongPollTimeout, DEFAULTS.longPollTimeout);
		return Math.min(50, Math.max(1, timeout));
	}

	_botIncludePrivate(settings = this.settings) {
		return this._bool(settings?.botIncludePrivate, true);
	}

	_botIncludeGroups(settings = this.settings) {
		return this._bool(settings?.botIncludeGroups, true);
	}

	_botIncludeChannels(settings = this.settings) {
		return this._bool(settings?.botIncludeChannels, false);
	}

	_ignoreBots(settings = this.settings) {
		return this._bool(settings?.botIgnoreBots, true);
	}

	_ignoreServiceMessages(settings = this.settings) {
		return this._bool(settings?.ignoreServiceMessages, true);
	}

	_allowedChatRaw(settings = this.settings) {
		return this._string(settings?.botAllowedChats, "").trim();
	}

	_filterRegex(settings = this.settings) {
		return this._string(settings?.filterRegex, "").trim();
	}

	_userApiId(settings = this.settings) {
		return this._number(settings?.userApiId, 0);
	}

	_userApiHash(settings = this.settings) {
		return this._string(settings?.userApiHash, "").trim();
	}

	_userSessionString(settings = this.settings) {
		return this._string(settings?.userSessionString, "").trim();
	}

	_userPhone(settings = this.settings) {
		return this._string(settings?.userPhoneNumber, "").trim();
	}

	_userPassword(settings = this.settings) {
		return this._string(settings?.userPassword, "");
	}

	_userDefaultChat(settings = this.settings) {
		return this._string(settings?.userDefaultChatId, "").trim();
	}

	_requireUserPhone() {
		const phone = this._userPhone();
		if (!phone) {
			throw new Error("Missing phone number for user login.");
		}
		return phone;
	}

	async _waitForUserCode() {
		const start = Date.now();
		while (Date.now() - start < DEFAULTS.codeWaitSeconds * 1000) {
			const code = this._string(this.settings?.userLoginCode, "").trim();
			if (code && code !== this._lastLoginCodeUsed) {
				this._lastLoginCodeUsed = code;
				// Clear to force the next retry to require a fresh code.
				this.updateSettings({ userLoginCode: "" });
				return code;
			}
			await this._sleep(1000);
		}
		throw new Error("Login code not provided.");
	}

	async _waitForUserPassword() {
		const password = this._userPassword();
		if (password) {
			return password;
		}
		throw new Error("Two-factor password required.");
	}

	_parseAllowList(raw) {
		if (!raw) {
			return [];
		}
		return raw
			.split(/\n|,/g)
			.map((entry) => entry.trim())
			.filter(Boolean);
	}

	_formatDuration(ms) {
		const seconds = Math.max(0, Math.floor(ms / 1000));
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		}
		if (minutes > 0) {
			return `${minutes}m ${secs}s`;
		}
		return `${secs}s`;
	}

	_string(value, fallback = "") {
		if (typeof value === "string") {
			return value;
		}
		if (value == null) {
			return fallback;
		}
		return String(value);
	}

	_number(value, fallback = 0) {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : fallback;
	}

	_bool(value, fallback = false) {
		if (typeof value === "boolean") {
			return value;
		}
		if (value === "true") {
			return true;
		}
		if (value === "false") {
			return false;
		}
		return fallback;
	}

	_sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	_errorMessage(error) {
		return error instanceof Error ? error.message : String(error);
	}

	async _log(message, severity = "info") {
		if (severity !== "warn" && severity !== "error") {
			return;
		}
		try {
			await this.lumia.log(message, severity);
		} catch (error) {
			// ignore logging errors
		}
	}

	async _logThrottled(key, message, severity = "warn") {
		const now = Date.now();
		const last = this._logTimestamps.get(key) ?? 0;
		if (now - last < DEFAULTS.maxLogIntervalMs) {
			return;
		}
		this._logTimestamps.set(key, now);
		await this._log(message, severity);
	}
}

module.exports = TelegramPlugin;
