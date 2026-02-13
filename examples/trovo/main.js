const { Plugin } = require("@lumiastream/plugin");
const WebSocket = require("ws");

const API_BASE_URL = "https://open-api.trovo.live/openplatform";
const TROVO_CHAT_WS_URL = "wss://open-chat.trovo.live/chat";
const TROVO_CLIENT_ID = "21aea953cc438beeccff31081abc47bc";

const RECONNECT_DELAY_SECONDS = 5;
const HEARTBEAT_SECONDS = 25;
const CONNECTION_TIMEOUT_SECONDS = 15;

const MAX_RECONNECT_DELAY_SECONDS = 120;
const MAX_LIST_ITEMS = 100;
const CATEGORY_SEARCH_LIMIT = 50;
const MAX_TRACKED_CHAT_MESSAGE_AUTHORS = 3000;
const STARTUP_SUPPRESS_SECONDS = 8;
const STARTUP_BACKFILL_TOLERANCE_SECONDS = 2;
const MAX_TRACKED_CHAT_IDS = 2000;
const HTTP_REQUEST_TIMEOUT_MS = 15000;
const TROVO_BADGE_TOKEN_URLS = {
	broadcaster:
		"https://static.trovo.live/imgupload/application/20200423_yp9vmkduxdBroadcaster.png?imageView2/2/format/webp&max_age=31536000",
	creator:
		"https://static.trovo.live/imgupload/application/20200423_yp9vmkduxdBroadcaster.png?imageView2/2/format/webp&max_age=31536000",
	owner:
		"https://static.trovo.live/imgupload/application/20200423_yp9vmkduxdBroadcaster.png?imageView2/2/format/webp&max_age=31536000",
	streamer:
		"https://static.trovo.live/imgupload/application/20200423_yp9vmkduxdBroadcaster.png?imageView2/2/format/webp&max_age=31536000",
};

const CHAT_TYPE_IDS = {
	NORMAL_CHAT: 0,
	SPELLS: 5,
	SUPER_CAP_CHAT: 6,
	COLORFUL_CHAT: 7,
	SPELL_CHAT: 8,
	BULLET_SCREEN_CHAT: 9,
	SUBSCRIBER: 5001,
	SYSTEM_MESSAGE: 5002,
	FOLLOWER: 5003,
	WELCOME_VIEWER: 5004,
	GIFT_SUB_BASIC: 5005,
	INDIVIDUAL_GIFT_SUB: 5006,
	ACTIVITY_EVENT: 5007,
	WELCOME_RAID_VIEWER: 5008,
	CUSTOM_SPELL: 5009,
	STREAM_ONLINE_OFFLINE: 5012,
	UNFOLLOWER: 5013,
};

const CHAT_MESSAGE_TYPES = new Set([
	CHAT_TYPE_IDS.NORMAL_CHAT,
	CHAT_TYPE_IDS.SUPER_CAP_CHAT,
	CHAT_TYPE_IDS.COLORFUL_CHAT,
	CHAT_TYPE_IDS.SPELL_CHAT,
	CHAT_TYPE_IDS.BULLET_SCREEN_CHAT,
]);

const ALERT_KEYS = {
	streamLive: "streamLive",
	streamOffline: "streamOffline",
	firstChatter: "firstChatter",
	entrance: "entrance",
	channelJoin: "channelJoin",
	follower: "follower",
	subscriber: "subscriber",
	subscriptionGift: "subscriptionGift",
	raid: "raid",
	spell: "spell",
};

const VALID_ALERT_KEYS = new Set(Object.values(ALERT_KEYS));

const VARIABLE_NAMES = {
	uptime: "uptime",
	live: "live",
	sessionChatCount: "session_chat_count",
	lastFollower: "last_follower",
	currentFirstChatter: "current_first_chatter",
	currentFirstChatterCount: "current_first_chatter_count",
	previousFirstChatter: "previous_first_chatter",
	previousFirstChatterCount: "previous_first_chatter_count",
	lastChatter: "last_chatter",
	lastRaider: "last_raider",
	lastRaidAmount: "last_raid_amount",
	sessionFollowerCount: "session_follower_count",
	sessionSubscribersCount: "session_subscribers_count",
	sessionRaiders: "session_raiders",
	lastSubscriber: "last_subscriber",
	sessionSubscribers: "session_subscribers",
	channelId: "channel_id",
	username: "username",
	displayName: "display_name",
	lastSpell: "last_spell",
	lastSpellAmount: "last_spell_amount",
	lastSpellValue: "last_spell_value",
	lastMessage: "last_message",
	lastMessageId: "last_message_id",
	lastEventAt: "last_event_at",
};

const VARIABLE_DEFAULTS = {
	[VARIABLE_NAMES.uptime]: "",
	[VARIABLE_NAMES.live]: false,
	[VARIABLE_NAMES.sessionChatCount]: 0,
	[VARIABLE_NAMES.lastFollower]: "",
	[VARIABLE_NAMES.currentFirstChatter]: "",
	[VARIABLE_NAMES.currentFirstChatterCount]: 0,
	[VARIABLE_NAMES.previousFirstChatter]: "",
	[VARIABLE_NAMES.previousFirstChatterCount]: 0,
	[VARIABLE_NAMES.lastChatter]: "",
	[VARIABLE_NAMES.lastRaider]: "",
	[VARIABLE_NAMES.lastRaidAmount]: 0,
	[VARIABLE_NAMES.sessionFollowerCount]: 0,
	[VARIABLE_NAMES.sessionSubscribersCount]: 0,
	[VARIABLE_NAMES.sessionRaiders]: "",
	[VARIABLE_NAMES.lastSubscriber]: "",
	[VARIABLE_NAMES.sessionSubscribers]: "",
	[VARIABLE_NAMES.channelId]: "",
	[VARIABLE_NAMES.username]: "",
	[VARIABLE_NAMES.displayName]: "",
	[VARIABLE_NAMES.lastSpell]: "",
	[VARIABLE_NAMES.lastSpellAmount]: 0,
	[VARIABLE_NAMES.lastSpellValue]: 0,
	[VARIABLE_NAMES.lastMessage]: "",
	[VARIABLE_NAMES.lastMessageId]: "",
	[VARIABLE_NAMES.lastEventAt]: "",
};

class TrovoPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._ws = null;
		this._connectPromise = null;
		this._tokenRefreshPromise = null;
		this._heartbeatTimer = null;
		this._reconnectTimer = null;
		this._manualStop = false;
		this._reconnectAttempts = 0;
		this._nonceCounter = 1;
		this._pendingRequests = new Map();
		this._lastConnectionState = null;
		this._variableCache = new Map();
		this._connectedAtMs = 0;
		this._startupSuppressUntilMs = 0;
		this._recentChatIds = new Set();
		this._recentChatIdOrder = [];
		this._chatMessageAuthors = new Map();
		this._chatMessageAuthorOrder = [];
		this._emoteLookup = new Map();
		this._authRefreshFailureHandled = false;
		this._state = this._createRuntimeState();
	}

	_createRuntimeState() {
		return {
			live: false,
			uptimeStartedAt: 0,
			channelId: "",
			userId: "",
			username: "",
			displayName: "",
			sessionChatCount: 0,
			sessionFollowerCount: 0,
			sessionSubscribersCount: 0,
			sessionRaiders: [],
			sessionSubscribers: [],
			currentFirstChatter: "",
			currentFirstChatterCount: 0,
			previousFirstChatter: "",
			previousFirstChatterCount: 0,
			sessionSeenUsers: new Set(),
			sessionJoinedUsers: new Set(),
		};
	}

	async onload() {
		await this._hydrateVariableDefaults();

		if (this._hasCredentials(this.settings)) {
			await this._connect();
		} else {
			await this._updateConnectionState(false);
		}
	}

	async onunload() {
		await this._stop({ manual: true, resetLiveState: true });
	}

	async onsettingsupdate(settings, previous = {}) {
		const hasNow = this._hasCredentials(settings);
		const hadBefore = this._hasCredentials(previous);

		if (!hasNow) {
			await this._stop({ manual: true, resetLiveState: true });
			return;
		}

		if (!hadBefore) {
			this._manualStop = false;
			await this._connect();
			return;
		}

		if (this._requiresReconnect(settings, previous)) {
			await this._reconnect();
		}
	}

	async validateAuth(data = {}) {
		const credentials = this._resolveCredentials(data);
		if (!this._hasCredentials(credentials)) {
			return {
				ok: false,
				message: "OAuth tokens are required. Authorize the plugin first.",
			};
		}

		try {
			const profile = await this._fetchProfile(credentials, { persist: false });
			await this._fetchChatToken(credentials, { persist: false });
			const username = this._string(
				profile?.username || profile?.displayName || profile?.channelId,
				"Trovo user",
			);
			return { ok: true, message: `Validated as ${username}.` };
		} catch (error) {
			return {
				ok: false,
				message: this._errorMessage(error),
			};
		}
	}

	async actions(config = {}) {
		const actions = Array.isArray(config.actions) ? config.actions : [];
		for (const action of actions) {
			if (!action || action.on === false) {
				continue;
			}

			switch (action.type) {
				case "send_chat":
					await this._runSendChatAction(action.value);
					break;
				case "update_live_title":
					await this._runUpdateLiveTitleAction(action.value);
					break;
				case "update_category":
					await this._runUpdateCategoryAction(action.value);
					break;
				case "host_channel":
					await this._runHostChannelAction(action.value);
					break;
				case "unhost_channel":
					await this._runUnhostChannelAction();
					break;
				case "set_title_command":
					await this._runSetTitleCommandAction(action.value);
					break;
				case "trigger_alert":
					await this._runTriggerAlertAction(action.value);
					break;
				default:
					break;
			}
		}
	}

	async chatbot(config = {}) {
		const message = this._string(config?.message, "").trim();
		if (!message) {
			return false;
		}

		const credentials = this._resolveCredentials(this.settings);
		await this._sendTrovoChatMessage(message, credentials);
		return true;
	}

	async modCommand(type, value = {}) {
		const commandType = this._string(type, "").trim().toLowerCase();
		const username = this._normalizeCommandUsername(value?.username);
		const credentials = this._resolveCredentials(this.settings);
		const rawMessage = this._string(value?.message, "").trim();
		const duration = this._parseInteger(value?.duration, 10);

		try {
			switch (commandType) {
				case "delete": {
					const messageId = rawMessage;
					if (!messageId) {
						await this._log("Delete message skipped: missing message ID", "warn");
						return false;
					}
					const uid = this._resolveDeleteMessageUid(messageId, username);
					if (!uid) {
						await this._log(
							`Delete message skipped: unable to resolve user ID for message "${messageId}"`,
							"warn",
						);
						return false;
					}
					await this._deleteChatMessage(messageId, uid, credentials);
					return true;
				}
				case "add-moderator":
					if (!username) {
						await this._log("Add moderator skipped: missing username", "warn");
						return false;
					}
					await this._performChatCommand(`mod ${username}`, credentials);
					return true;
				case "remove-moderator":
					if (!username) {
						await this._log(
							"Remove moderator skipped: missing username",
							"warn",
						);
						return false;
					}
					await this._performChatCommand(`unmod ${username}`, credentials);
					return true;
				case "ban":
					if (!username) {
						await this._log("Ban skipped: missing username", "warn");
						return false;
					}
					await this._performChatCommand(`ban ${username}`, credentials);
					return true;
				case "timeout": {
					if (!username) {
						await this._log("Timeout skipped: missing username", "warn");
						return false;
					}
					const timeoutDuration = Math.max(1, duration);
					await this._performChatCommand(
						`ban ${username} ${timeoutDuration}`,
						credentials,
					);
					return true;
				}
				case "unban":
					if (!username) {
						await this._log("Unban skipped: missing username", "warn");
						return false;
					}
					await this._performChatCommand(`unban ${username}`, credentials);
					return true;
				default:
					await this._log(`Unsupported mod command type "${commandType}"`, "warn");
					return false;
			}
		} catch (error) {
			await this._log(
				`Mod command "${commandType || "unknown"}" failed: ${this._errorMessage(
					error,
				)}`,
				"error",
			);
			throw error;
		}
	}

	async variableFunction({ key } = {}) {
		if (key !== VARIABLE_NAMES.uptime) {
			return "";
		}

		if (!this._state.live || !this._state.uptimeStartedAt) {
			return "Is not live";
		}

		return this._formatDuration(Date.now() - this._state.uptimeStartedAt);
	}

	async _runSendChatAction(raw = {}) {
		const message = this._string(raw?.message, "").trim();
		if (!message) {
			return;
		}

		try {
			await this.chatbot({ message });
		} catch (error) {
			await this._log(
				`[Trovo] Failed to send chatbot message: ${this._errorMessage(error)}`,
				"warn",
			);
		}
	}

	async _runTriggerAlertAction(raw = {}) {
		const requestedAlert = this._string(raw?.alertKey, ALERT_KEYS.follower);
		const alert = VALID_ALERT_KEYS.has(requestedAlert)
			? requestedAlert
			: ALERT_KEYS.follower;
		const username = this._string(
			raw?.username,
			this._state.username || "trovo",
		);
		const value = this._string(raw?.value, username || "1");

		await this._triggerAlert(alert, {
			dynamic: {
				name: username,
				value,
			},
			extraSettings: this._buildAlertExtraSettings({}, username, {
				name: username,
				value,
				test: true,
			}),
		});
	}

	async _runUpdateLiveTitleAction(raw = {}) {
		const liveTitle = this._string(raw?.liveTitle || raw?.title, "");
		if (!liveTitle.trim()) {
			return;
		}

		try {
			const credentials = this._resolveCredentials(this.settings);
			await this._updateChannelInfo(
				{
					live_title: liveTitle,
				},
				credentials,
			);
			await this._log(`[Trovo] Updated live title to "${liveTitle}"`);
		} catch (error) {
			await this._log(
				`[Trovo] Failed to update live title: ${this._errorMessage(error)}`,
				"warn",
			);
		}
	}

	async _runUpdateCategoryAction(raw = {}) {
		const query = this._string(
			raw?.category || raw?.categoryQuery || raw?.query,
			"",
		).trim();
		if (!query) {
			return;
		}

		try {
			const credentials = this._resolveCredentials(this.settings);
			const best = await this._findBestCategoryMatch(query);
			await this._updateChannelInfo(
				{
					category_id: this._string(best?.id, ""),
				},
				credentials,
			);
			await this._log(
				`[Trovo] Updated category to "${best?.name || "Unknown"}" (${best?.id || "?"}) from query "${query}"`,
			);
		} catch (error) {
			await this._log(
				`[Trovo] Failed to update category from "${query}": ${this._errorMessage(error)}`,
				"warn",
			);
		}
	}

	async _runHostChannelAction(raw = {}) {
		const username = this._normalizeCommandUsername(
			raw?.username || raw?.channel || raw?.target,
		);
		if (!username) {
			return;
		}

		try {
			const credentials = this._resolveCredentials(this.settings);
			await this._performChatCommand(`host ${username}`, credentials);
			await this._log(`[Trovo] Host command sent for "${username}"`);
		} catch (error) {
			await this._log(
				`[Trovo] Failed to host "${username}": ${this._errorMessage(error)}`,
				"warn",
			);
		}
	}

	async _runUnhostChannelAction() {
		try {
			const credentials = this._resolveCredentials(this.settings);
			await this._performChatCommand("unhost", credentials);
			await this._log("[Trovo] Unhost command sent");
		} catch (error) {
			await this._log(
				`[Trovo] Failed to unhost: ${this._errorMessage(error)}`,
				"warn",
			);
		}
	}

	async _runSetTitleCommandAction(raw = {}) {
		const title = this._string(raw?.title || raw?.liveTitle, "").trim();
		if (!title) {
			return;
		}

		try {
			const credentials = this._resolveCredentials(this.settings);
			await this._performChatCommand(`settitle ${title}`, credentials);
			await this._log(`[Trovo] Set title command sent: "${title}"`);
		} catch (error) {
			await this._log(
				`[Trovo] Failed to send set title command: ${this._errorMessage(
					error,
				)}`,
				"warn",
			);
		}
	}

	async _connect() {
		if (this._manualStop) {
			return;
		}

		if (this._connectPromise) {
			return this._connectPromise;
		}

		this._connectPromise = (async () => {
			const credentials = this._resolveCredentials(this.settings);
			if (!this._hasCredentials(credentials)) {
				await this._updateConnectionState(false);
				return;
			}

			this._manualStop = false;
			this._authRefreshFailureHandled = false;
			await this._closeSocket();
			this._stopHeartbeat();
			this._rejectPendingRequests(new Error("Trovo reconnecting"));

			try {
				const profile = await this._fetchProfile(credentials);
				await this._applyResolvedProfile(profile);
				await this._refreshEmoteLookup();

				const chatToken = await this._fetchChatToken(credentials);
				await this._openSocket(chatToken);
				this._reconnectAttempts = 0;
			} catch (error) {
				await this._updateConnectionState(false);
				await this._log(
					`[Trovo] Connection failed: ${this._errorMessage(error)}`,
					"warn",
				);
				this._scheduleReconnect();
			}
		})().finally(() => {
			this._connectPromise = null;
		});

		return this._connectPromise;
	}

	async _reconnect() {
		this._manualStop = true;
		await this._closeSocket();
		this._stopHeartbeat();
		this._rejectPendingRequests(new Error("Trovo reconnect requested"));
		this._manualStop = false;
		await this._connect();
	}

	async _stop({ manual = true, resetLiveState = false } = {}) {
		this._manualStop = manual;
		this._clearReconnectTimer();
		this._stopHeartbeat();
		this._rejectPendingRequests(new Error("Trovo stopped"));
		await this._closeSocket();
		await this._updateConnectionState(false);

		if (resetLiveState) {
			this._state.live = false;
			this._state.uptimeStartedAt = 0;
			await this._setVariable(VARIABLE_NAMES.live, false);
			await this._setVariable(VARIABLE_NAMES.uptime, "");
		}
	}

	async _openSocket(chatToken) {
		const ws = new WebSocket(TROVO_CHAT_WS_URL);
		this._ws = ws;

		const timeoutMs = this._connectionTimeoutMs();
		await new Promise((resolve, reject) => {
			let settled = false;
			let authenticated = false;

			const complete = (fn, value) => {
				if (settled) {
					return;
				}
				settled = true;
				clearTimeout(timeoutId);
				fn(value);
			};

			const timeoutId = setTimeout(() => {
				complete(reject, new Error("Trovo websocket connection timed out"));
				try {
					ws.terminate();
				} catch {
					try {
						ws.close();
					} catch {}
				}
			}, timeoutMs);

			ws.on("open", async () => {
				try {
					await this._sendSocket(
						{
							type: "AUTH",
							data: { token: chatToken },
						},
						{ awaitResponse: true, timeoutMs: 10000 },
					);

					this._markStartupBoundary();
					authenticated = true;
					await this._updateConnectionState(true);
					this._startHeartbeat();
					complete(resolve);
				} catch (error) {
					complete(reject, error);
					try {
						ws.close();
					} catch {}
				}
			});

			ws.on("message", (raw) => {
				void this._handleSocketMessage(raw);
			});

			ws.on("error", (error) => {
				if (!authenticated) {
					complete(reject, error);
				}
				void this._log(
					`[Trovo] Websocket error: ${this._errorMessage(error)}`,
					"warn",
				);
			});

			ws.on("close", (code, reasonBuffer) => {
				const reason = this._socketReason(reasonBuffer);
				void this._handleSocketClose(ws, code, reason);
				if (!authenticated) {
					complete(
						reject,
						new Error(`Trovo websocket closed before auth (${code})`),
					);
				}
			});
		});
	}

	async _handleSocketClose(socket, code, reason) {
		if (socket !== this._ws) {
			return;
		}

		this._ws = null;
		this._stopHeartbeat();
		this._rejectPendingRequests(
			new Error(
				`Trovo websocket closed (${code}${reason ? `: ${reason}` : ""})`,
			),
		);
		await this._updateConnectionState(false);

		if (this._manualStop) {
			return;
		}

		await this._log(
			`[Trovo] Socket closed (${code}${reason ? `: ${reason}` : ""}), scheduling reconnect`,
			"warn",
		);
		this._scheduleReconnect();
	}

	_scheduleReconnect() {
		if (this._manualStop || this._reconnectTimer) {
			return;
		}

		const attempt = this._reconnectAttempts;
		const baseDelay = this._reconnectDelaySeconds();
		const multiplier = Math.min(16, 2 ** attempt);
		const delaySeconds = Math.min(
			MAX_RECONNECT_DELAY_SECONDS,
			Math.max(1, baseDelay * multiplier),
		);
		this._reconnectAttempts += 1;

		this._reconnectTimer = setTimeout(() => {
			this._reconnectTimer = null;
			if (this._manualStop) {
				return;
			}
			void this._connect();
		}, delaySeconds * 1000);
	}

	_clearReconnectTimer() {
		if (!this._reconnectTimer) {
			return;
		}
		clearTimeout(this._reconnectTimer);
		this._reconnectTimer = null;
	}

	_startHeartbeat() {
		this._stopHeartbeat();
		const intervalMs = this._heartbeatMs();
		this._heartbeatTimer = setInterval(() => {
			void this._sendSocket({ type: "PING" }).catch(() => {});
		}, intervalMs);
		void this._sendSocket({ type: "PING" }).catch(() => {});
	}

	_stopHeartbeat() {
		if (!this._heartbeatTimer) {
			return;
		}
		clearInterval(this._heartbeatTimer);
		this._heartbeatTimer = null;
	}

	async _closeSocket() {
		const ws = this._ws;
		if (!ws) {
			return;
		}

		this._ws = null;

		try {
			if (
				ws.readyState === WebSocket.OPEN ||
				ws.readyState === WebSocket.CONNECTING
			) {
				ws.close(1000, "manual close");
			}
		} catch {}
	}

	async _handleSocketMessage(raw) {
		const messageText = this._socketMessageToString(raw);
		if (!messageText) {
			return;
		}

		let payload;
		try {
			payload = JSON.parse(messageText);
		} catch {
			return;
		}

		if (payload?.nonce) {
			const nonce = this._string(payload.nonce, "");
			if (nonce && this._pendingRequests.has(nonce)) {
				const pending = this._pendingRequests.get(nonce);
				this._pendingRequests.delete(nonce);
				clearTimeout(pending.timeout);
				if (this._isErrorResponse(payload)) {
					pending.reject(new Error(this._responseError(payload)));
				} else {
					pending.resolve(payload);
				}
				return;
			}
		}

		const type = this._string(payload?.type, "").toUpperCase();
		if (type === "PING") {
			void this._sendSocket({ type: "pong" }).catch(() => {});
			return;
		}

		if (type !== "CHAT") {
			return;
		}

		const chats = Array.isArray(payload?.data?.chats) ? payload.data.chats : [];
		for (const chat of chats) {
			if (this._isDuplicateChat(chat)) {
				continue;
			}
			await this._handleChatEvent(chat);
		}
	}

	async _handleChatEvent(chat) {
		const suppressEvent = this._shouldSuppressStartupEvent(chat);
		const typeId = this._number(chat?.type, -1);
		switch (typeId) {
			case CHAT_TYPE_IDS.STREAM_ONLINE_OFFLINE:
				await this._handleStreamOnlineOffline(chat, {
					suppressAlert: suppressEvent,
				});
				return;
			case CHAT_TYPE_IDS.FOLLOWER:
				if (suppressEvent) return;
				await this._handleFollower(chat);
				return;
			case CHAT_TYPE_IDS.SUBSCRIBER:
				if (suppressEvent) return;
				await this._handleSubscriber(chat);
				return;
			case CHAT_TYPE_IDS.GIFT_SUB_BASIC:
				if (suppressEvent) return;
				await this._handleGiftSubBasic(chat);
				return;
			case CHAT_TYPE_IDS.INDIVIDUAL_GIFT_SUB:
				if (suppressEvent) return;
				await this._handleIndividualGiftSub(chat);
				return;
			case CHAT_TYPE_IDS.WELCOME_VIEWER:
				if (suppressEvent) return;
				await this._handleChannelJoin(chat);
				return;
			case CHAT_TYPE_IDS.WELCOME_RAID_VIEWER:
				if (suppressEvent) return;
				await this._handleRaid(chat);
				return;
			case CHAT_TYPE_IDS.SPELLS:
			case CHAT_TYPE_IDS.CUSTOM_SPELL:
				if (suppressEvent) return;
				if (this._includeSpells()) {
					await this._handleSpell(chat);
				}
				return;
			default:
				break;
		}

		if (CHAT_MESSAGE_TYPES.has(typeId)) {
			if (suppressEvent) return;
			await this._handleChatMessage(chat);
		}
	}

	async _handleStreamOnlineOffline(chat, { suppressAlert = false } = {}) {
		const nextLive = this._resolveStreamLiveState(chat);
		const streamStatus = this._string(
			chat?.content_data?.status || chat?.content_data?.stream_status,
			"",
		).trim();
		if (nextLive === null) {
			return;
		}
		if (nextLive === this._state.live) {
			return;
		}

		if (nextLive) {
			await this._handleStreamStarted(chat, { suppressAlert });
			return;
		}

		await this._handleStreamEnded(chat, { suppressAlert });
	}

	_resolveStreamLiveState(chat) {
		const content = this._string(chat?.content, "").trim().toLowerCase();
		const contentState = this._resolveLiveStateToken(content);
		if (contentState !== null) {
			return contentState;
		}

		const contentData =
			chat && typeof chat.content_data === "object" && chat.content_data
				? chat.content_data
				: {};
		const liveKeys = [
			contentData.is_live,
			contentData.live,
			contentData.live_status,
			contentData.stream_live,
		];
		for (const value of liveKeys) {
			const parsed = this._resolveLiveStateValue(value);
			if (parsed !== null) {
				return parsed;
			}
		}

		const status = this._string(
			contentData.status || contentData.stream_status,
			"",
		)
			.trim()
			.toLowerCase();
		const statusState = this._resolveLiveStateToken(status);
		if (statusState !== null) {
			return statusState;
		}

		const topLevelState = this._resolveLiveStateValue(
			chat?.is_live ?? chat?.live,
		);
		if (topLevelState !== null) {
			return topLevelState;
		}

		return null;
	}

	_resolveLiveStateToken(raw = "") {
		const token = this._string(raw, "").trim().toLowerCase();
		if (!token) {
			return null;
		}

		if (
			token === "stream_on" ||
			token === "online" ||
			token === "live" ||
			token.includes("go_live") ||
			token.includes("stream_online") ||
			token.includes("live_start")
		) {
			return true;
		}

		if (
			token === "stream_off" ||
			token === "offline" ||
			token.includes("stream_off") ||
			token.includes("stream_offline") ||
			token.includes("stream_end") ||
			token.includes("live_end")
		) {
			return false;
		}

		return null;
	}

	_resolveLiveStateValue(value) {
		if (typeof value === "boolean") {
			return value;
		}
		if (typeof value === "number") {
			if (value === 1) return true;
			if (value === 0) return false;
			return null;
		}
		if (typeof value === "string") {
			const normalized = value.trim().toLowerCase();
			if (["1", "true", "yes", "on", "live", "online"].includes(normalized)) {
				return true;
			}
			if (
				["0", "false", "no", "off", "offline", "stream_off"].includes(
					normalized,
				)
			) {
				return false;
			}
			return this._resolveLiveStateToken(normalized);
		}
		return null;
	}

	async _handleStreamStarted(chat, { suppressAlert = false } = {}) {
		if (this._state.currentFirstChatter) {
			this._state.previousFirstChatter = this._state.currentFirstChatter;
			this._state.previousFirstChatterCount =
				this._state.currentFirstChatterCount;
		}

		this._state.currentFirstChatter = "";
		this._state.currentFirstChatterCount = 0;
		this._state.sessionSeenUsers.clear();
		this._state.sessionJoinedUsers.clear();
		this._state.sessionChatCount = 0;
		this._state.sessionFollowerCount = 0;
		this._state.sessionSubscribersCount = 0;
		this._state.sessionRaiders = [];
		this._state.sessionSubscribers = [];
		this._state.live = true;
		this._state.uptimeStartedAt = Date.now();

		await Promise.all([
			this._setVariable(VARIABLE_NAMES.live, true),
			this._setVariable(
				VARIABLE_NAMES.previousFirstChatter,
				this._state.previousFirstChatter,
			),
			this._setVariable(
				VARIABLE_NAMES.previousFirstChatterCount,
				this._state.previousFirstChatterCount,
			),
			this._setVariable(VARIABLE_NAMES.currentFirstChatter, ""),
			this._setVariable(VARIABLE_NAMES.currentFirstChatterCount, 0),
			this._setVariable(VARIABLE_NAMES.sessionChatCount, 0),
			this._setVariable(VARIABLE_NAMES.sessionFollowerCount, 0),
			this._setVariable(VARIABLE_NAMES.sessionSubscribersCount, 0),
			this._setVariable(VARIABLE_NAMES.sessionRaiders, ""),
			this._setVariable(VARIABLE_NAMES.sessionSubscribers, ""),
			this._setVariable(VARIABLE_NAMES.uptime, "0s"),
		]);

		if (suppressAlert) {
			return;
		}

		await this._markLastEvent();
		const streamLiveMessage = this._string(chat?.content, "") || undefined;
		await this._triggerAlert(ALERT_KEYS.streamLive, {
			dynamic: {
				name: this._state.username,
				value: true,
			},
			extraSettings: this._buildAlertExtraSettings(chat, this._state.username, {
				name: this._state.username,
				value: true,
				message: streamLiveMessage,
			}),
		});
	}

	async _handleStreamEnded(chat, { suppressAlert = false } = {}) {
		this._state.live = false;
		this._state.uptimeStartedAt = 0;
		this._state.sessionSeenUsers.clear();
		this._state.sessionJoinedUsers.clear();
		this._state.sessionChatCount = 0;
		this._state.sessionFollowerCount = 0;
		this._state.sessionSubscribersCount = 0;
		this._state.sessionRaiders = [];
		this._state.sessionSubscribers = [];

		await Promise.all([
			this._setVariable(VARIABLE_NAMES.live, false),
			this._setVariable(VARIABLE_NAMES.uptime, ""),
			this._setVariable(VARIABLE_NAMES.sessionChatCount, 0),
			this._setVariable(VARIABLE_NAMES.sessionFollowerCount, 0),
			this._setVariable(VARIABLE_NAMES.sessionSubscribersCount, 0),
			this._setVariable(VARIABLE_NAMES.sessionRaiders, ""),
			this._setVariable(VARIABLE_NAMES.sessionSubscribers, ""),
		]);

		if (suppressAlert) {
			return;
		}

		await this._markLastEvent();
		const streamOfflineMessage = this._string(chat?.content, "") || undefined;
		await this._triggerAlert(ALERT_KEYS.streamOffline, {
			dynamic: {
				name: this._state.username,
				value: false,
			},
			extraSettings: this._buildAlertExtraSettings(chat, this._state.username, {
				name: this._state.username,
				value: false,
				message: streamOfflineMessage,
			}),
		});
	}

	async _handleChatMessage(chat) {
		const username = this._string(
			chat?.user_name || chat?.nick_name,
			"",
		).trim();
		const message = this._string(chat?.content, "").trim();
		if (!username || !message) {
			return;
		}
		this._trackChatMessageAuthor(chat);

		this._state.sessionChatCount += 1;
		await Promise.all([
			this._setVariable(
				VARIABLE_NAMES.sessionChatCount,
				this._state.sessionChatCount,
			),
			this._setVariable(VARIABLE_NAMES.lastChatter, username),
			this._setVariable(VARIABLE_NAMES.lastMessage, message),
			this._setVariable(
				VARIABLE_NAMES.lastMessageId,
				this._string(chat?.message_id, ""),
			),
		]);

		await this._markLastEvent();
		await this._handleEntranceAndFirstChatter(chat, username);

		this._displayChatMessage(chat, username, message);

		if (this._state.live && this._state.uptimeStartedAt) {
			await this._setVariable(
				VARIABLE_NAMES.uptime,
				this._formatDuration(Date.now() - this._state.uptimeStartedAt),
			);
		}
	}

	_buildSessionUserKey(chat, fallbackUsername = "") {
		const userId = this._string(chat?.user_id, "").trim();
		if (userId) {
			return `id:${userId}`;
		}
		const username = this._string(
			chat?.user_name || chat?.nick_name,
			fallbackUsername,
		)
			.trim()
			.toLowerCase();
		return `name:${username}`;
	}

	async _handleEntranceAndFirstChatter(chat, username) {
		const key = this._buildSessionUserKey(chat, username);
		if (this._state.sessionSeenUsers.has(key)) {
			return;
		}
		this._state.sessionSeenUsers.add(key);
		const entranceMessage = this._string(chat?.content, "") || undefined;

		const entranceOnlyWhenLive = this._bool(
			this.settings?.entranceOnlyWhenLive,
			true,
		);
		const shouldTriggerEntrance =
			!entranceOnlyWhenLive || this._state.live === true;
		if (shouldTriggerEntrance) {
			await this._triggerAlert(ALERT_KEYS.entrance, {
				dynamic: {
					name: username,
					value: username,
				},
				extraSettings: this._buildAlertExtraSettings(chat, username, {
					name: username,
					value: username,
					message: entranceMessage,
				}),
			});
		}

		if (this._state.currentFirstChatter) {
			return;
		}

		const streak =
			this._state.previousFirstChatter &&
			this._state.previousFirstChatter.toLowerCase() === key
				? this._state.previousFirstChatterCount + 1
				: 1;

		this._state.currentFirstChatter = username;
		this._state.currentFirstChatterCount = streak;

		await Promise.all([
			this._setVariable(VARIABLE_NAMES.currentFirstChatter, username),
			this._setVariable(VARIABLE_NAMES.currentFirstChatterCount, streak),
		]);

		const firstChatterOnlyWhenLive = this._bool(
			this.settings?.firstChatterOnlyWhenLive,
			true,
		);
		const shouldTriggerFirstChatter =
			!firstChatterOnlyWhenLive || this._state.live === true;
		if (!shouldTriggerFirstChatter) {
			return;
		}

		await this._triggerAlert(ALERT_KEYS.firstChatter, {
			dynamic: {
				name: username,
				value: streak,
			},
			extraSettings: this._buildAlertExtraSettings(chat, username, {
				name: username,
				value: streak,
				first_chatter_count: streak,
				message: entranceMessage,
			}),
		});
	}

	async _handleFollower(chat) {
		const username = this._string(
			chat?.user_name || chat?.nick_name,
			"",
		).trim();
		if (!username) {
			return;
		}

		this._state.sessionFollowerCount += 1;
		await Promise.all([
			this._setVariable(VARIABLE_NAMES.lastFollower, username),
			this._setVariable(
				VARIABLE_NAMES.sessionFollowerCount,
				this._state.sessionFollowerCount,
			),
		]);
		await this._markLastEvent();
		const followerMessage = this._string(chat?.content, "") || undefined;

		await this._triggerAlert(ALERT_KEYS.follower, {
			dynamic: {
				name: username,
				value: username,
			},
			extraSettings: this._buildAlertExtraSettings(chat, username, {
				name: username,
				value: username,
				followers_session_total: this._state.sessionFollowerCount,
				message: followerMessage,
			}),
			showInEventList: true,
		});
	}

	async _handleSubscriber(chat) {
		const username = this._string(
			chat?.user_name || chat?.nick_name,
			"",
		).trim();
		if (!username) {
			return;
		}

		this._state.sessionSubscribersCount += 1;
		this._pushUnique(this._state.sessionSubscribers, username);

		await Promise.all([
			this._setVariable(VARIABLE_NAMES.lastSubscriber, username),
			this._setVariable(
				VARIABLE_NAMES.sessionSubscribersCount,
				this._state.sessionSubscribersCount,
			),
			this._setVariable(
				VARIABLE_NAMES.sessionSubscribers,
				this._state.sessionSubscribers.join(", "),
			),
		]);
		await this._markLastEvent();
		const subscriberMessage = this._string(chat?.content, "") || undefined;

		await this._triggerAlert(ALERT_KEYS.subscriber, {
			dynamic: {
				name: username,
				value: username,
			},
			extraSettings: this._buildAlertExtraSettings(chat, username, {
				name: username,
				value: username,
				subscribers_session_total: this._state.sessionSubscribersCount,
				message: subscriberMessage,
			}),
			showInEventList: true,
		});
	}

	async _handleGiftSubBasic(chat) {
		const gifter = this._string(chat?.user_name || chat?.nick_name, "").trim();
		if (!gifter) {
			return;
		}

		const giftAmount = Math.max(1, this._parseInteger(chat?.content, 1));
		const recipient = this._extractRecipient(chat?.content);
		await this._handleGiftSubCommon(chat, {
			gifter,
			recipient,
			giftAmount,
		});
	}

	async _handleIndividualGiftSub(chat) {
		const gifter = this._string(chat?.user_name || chat?.nick_name, "").trim();
		if (!gifter) {
			return;
		}

		const recipient = this._extractRecipient(chat?.content);
		await this._handleGiftSubCommon(chat, {
			gifter,
			recipient,
			giftAmount: 1,
		});
	}

	async _handleGiftSubCommon(chat, { gifter, recipient, giftAmount }) {
		const finalRecipient = recipient || gifter;
		this._state.sessionSubscribersCount += Math.max(1, giftAmount);
		this._pushUnique(this._state.sessionSubscribers, finalRecipient);

		await Promise.all([
			this._setVariable(VARIABLE_NAMES.lastSubscriber, finalRecipient),
			this._setVariable(
				VARIABLE_NAMES.sessionSubscribersCount,
				this._state.sessionSubscribersCount,
			),
			this._setVariable(
				VARIABLE_NAMES.sessionSubscribers,
				this._state.sessionSubscribers.join(", "),
			),
		]);
		await this._markLastEvent();
		const giftMessage = this._string(chat?.content, "") || undefined;

		await this._triggerAlert(ALERT_KEYS.subscriptionGift, {
			dynamic: {
				name: gifter,
				value: this._string(chat?.sub_tier, "1"),
			},
			extraSettings: this._buildAlertExtraSettings(chat, gifter, {
				name: gifter,
				value: this._string(chat?.sub_tier, "1"),
				giftAmount,
				totalGifts: giftAmount,
				isGift: true,
				subMonths: 1,
				username: gifter,
				gifter,
				recipient: finalRecipient,
				amount: giftAmount,
				subPlan: this._string(chat?.sub_tier, "1"),
				message: giftMessage,
			}),
			showInEventList: true,
		});
	}

	async _handleChannelJoin(chat) {
		const username = this._string(
			chat?.user_name || chat?.nick_name,
			"",
		).trim();
		if (!username) {
			return;
		}
		const key = this._buildSessionUserKey(chat, username);
		if (this._state.sessionJoinedUsers.has(key)) {
			return;
		}
		this._state.sessionJoinedUsers.add(key);

		await this._markLastEvent();
		const channelJoinMessage = this._string(chat?.content, "") || undefined;
		await this._triggerAlert(ALERT_KEYS.channelJoin, {
			dynamic: {
				name: username,
				value: username,
			},
			extraSettings: this._buildAlertExtraSettings(chat, username, {
				name: username,
				value: username,
				message: channelJoinMessage,
			}),
		});
	}

	async _handleRaid(chat) {
		const username = this._string(
			chat?.user_name || chat?.nick_name,
			"",
		).trim();
		if (!username) {
			return;
		}

		const viewers = this._extractRaidViewers(chat?.content);
		this._pushUnique(this._state.sessionRaiders, username);

		await Promise.all([
			this._setVariable(VARIABLE_NAMES.lastRaider, username),
			this._setVariable(VARIABLE_NAMES.lastRaidAmount, viewers),
			this._setVariable(
				VARIABLE_NAMES.sessionRaiders,
				this._state.sessionRaiders.join(", "),
			),
		]);
		await this._markLastEvent();
		const raidMessage = this._string(chat?.content, "") || undefined;

		await this._triggerAlert(ALERT_KEYS.raid, {
			dynamic: {
				name: username,
				value: viewers,
			},
			extraSettings: this._buildAlertExtraSettings(chat, username, {
				name: username,
				value: viewers,
				viewers,
				message: raidMessage,
			}),
			showInEventList: true,
		});
	}

	async _handleSpell(chat) {
		const username = this._string(
			chat?.user_name || chat?.nick_name,
			"",
		).trim();
		if (!username) {
			return;
		}

		const parsed = this._parseSpell(chat);
		if (!parsed.name) {
			return;
		}

		await Promise.all([
			this._setVariable(VARIABLE_NAMES.lastSpell, parsed.name),
			this._setVariable(VARIABLE_NAMES.lastSpellAmount, parsed.amount),
			this._setVariable(VARIABLE_NAMES.lastSpellValue, parsed.value),
		]);
		await this._markLastEvent();

		await this._triggerAlert(ALERT_KEYS.spell, {
			dynamic: {
				name: username,
				value: parsed.name,
			},
			extraSettings: this._buildAlertExtraSettings(chat, username, {
				name: username,
				value: parsed.name,
				spell: parsed.name,
				spell_quantity: parsed.amount,
				spell_value: parsed.value,
				spell_type: parsed.valueType,
				spell_combined_value: parsed.value * parsed.amount,
				message: undefined,
			}),
			showInEventList: true,
		});
	}

	_parseSpell(chat) {
		const contentData =
			chat && typeof chat.content_data === "object" && chat.content_data
				? chat.content_data
				: {};
		let content = {};
		if (typeof chat?.content === "string") {
			try {
				content = JSON.parse(chat.content);
			} catch {
				content = {};
			}
		}

		const name = this._string(
			contentData.gift_display_name || content.gift || content.name,
			"",
		).trim();
		const amount = Math.max(
			1,
			this._number(contentData.gift_num ?? content.num, 1),
		);
		const value = this._number(content.gift_value, 0);
		const valueType = this._string(content.value_type, "");

		return {
			name,
			amount,
			value,
			valueType,
		};
	}

	_displayChatMessage(chat, username, message) {
		const roles = this._stringList(chat?.roles);
		const medals = this._stringList(chat?.medals);
		const roleFlags = this._buildRoleFlags(roles, medals, username, chat);
		const badges = this._extractBadgeUrls(chat);
		const emotesRaw = this._buildChatEmotesRaw(chat, message);
		const messageId =
			this._string(chat?.message_id, "").trim() ||
			`trovo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
		const userId = this._extractUserId(chat);

		try {
			this.lumia.displayChat({
				username,
				displayname: this._string(chat?.nick_name, username),
				message,
				avatar: this._string(chat?.avatar, "") || undefined,
				color: "#3cdb7d",
				badges: badges.length ? badges : undefined,
				messageId,
				channel: this._state.channelId || undefined,
				userId: userId || undefined,
				userLevels: {
					isSelf: roleFlags.isSelf,
					mod: roleFlags.mod,
					vip: roleFlags.vip,
					tier3: roleFlags.tier3,
					tier2: roleFlags.tier2,
					subscriber: roleFlags.subscriber,
					follower: roleFlags.follower,
				},
				emotesRaw: emotesRaw || undefined,
			});
		} catch (error) {
			void this._log(
				`[Trovo] Failed to relay chat message: ${this._errorMessage(error)}`,
				"warn",
			);
		}
	}

	_buildRoleFlags(roles, medals, username, chat = {}) {
		const lowerRoles = roles.map((role) =>
			this._string(role, "").toLowerCase(),
		);
		const lowerMedals = medals.map((medal) =>
			this._string(medal, "").toLowerCase(),
		);
		const roleTokens = [...lowerRoles, ...lowerMedals];
		const selfUsername = this._state.username.toLowerCase();
		const tier = this._maxTierLevel(chat);
		const tier3 =
			tier >= 3 ||
			roleTokens.some(
				(token) =>
					token.includes("tier3") ||
					token.includes("tier_3") ||
					token.includes("sub_lv_3"),
			);
		const tier2 =
			tier >= 2 ||
			tier3 ||
			roleTokens.some(
				(token) =>
					token.includes("tier2") ||
					token.includes("tier_2") ||
					token.includes("sub_lv_2"),
			);
		const subscriber =
			tier >= 1 ||
			tier2 ||
			tier3 ||
			roleTokens.some(
				(token) =>
					token.includes("subscriber") ||
					token.includes("member") ||
					token.includes("founder"),
			);

		return {
			isSelf:
				roleTokens.includes("streamer") ||
				roleTokens.includes("broadcaster") ||
				(selfUsername && username.toLowerCase() === selfUsername),
			mod:
				roleTokens.includes("supermod") ||
				roleTokens.includes("moderator") ||
				roleTokens.includes("mod"),
			vip: roleTokens.some((token) => token.includes("vip")),
			tier3,
			tier2,
			subscriber,
			follower: roleTokens.some((token) => token.includes("follower")),
		};
	}

	_buildChatEmotesRaw(chat, message) {
		const text = this._string(message, "");
		if (!text) {
			return "";
		}

		const explicit = this._extractEmotesFromContentData(chat, text);
		const inferred =
			explicit.length > 0 ? [] : this._inferEmotesFromMessageText(text);
		const emotes = [...explicit, ...inferred];
		if (!emotes.length) {
			return "";
		}

		const unique = [];
		const seen = new Set();
		for (const emote of emotes) {
			const key = `${emote.url}|${emote.start}|${emote.end}`;
			if (seen.has(key)) {
				continue;
			}
			seen.add(key);
			unique.push(emote);
		}

		if (!unique.length) {
			return "";
		}

		try {
			return JSON.stringify(unique);
		} catch {
			return "";
		}
	}

	_extractEmotesFromContentData(chat, message) {
		const contentData =
			chat && typeof chat.content_data === "object" && chat.content_data
				? chat.content_data
				: {};
		const sources = [
			...this._asObjectArray(contentData?.normal_emote_enabled),
			...this._asObjectArray(contentData?.custom_emote_enabled),
			...this._asObjectArray(contentData?.chatroom),
		];
		if (!sources.length) {
			return [];
		}

		const results = [];
		for (const entry of sources) {
			const normalized = this._normalizeChatEmoteEntry(entry, message);
			if (normalized.length) {
				results.push(...normalized);
			}
		}
		return results;
	}

	_normalizeChatEmoteEntry(entry, message) {
		if (!entry || typeof entry !== "object") {
			return [];
		}

		const name = this._firstString(
			entry.name,
			entry.id,
			entry.emote_id,
			entry.emoteId,
			entry.emote_name,
			entry.emoteName,
			entry.keyword,
			entry.content,
			entry.text,
		);
		const directUrl = this._normalizeBadgeUrl(
			this._firstString(
				entry.url,
				entry.webp,
				entry.gifp,
				entry.image,
				entry.icon,
				entry.icon_url,
				entry.iconUrl,
			),
		);
		const fallbackUrl = name ? this._lookupEmoteUrl(name) : "";
		const url = directUrl || fallbackUrl;
		if (!url) {
			return [];
		}

		const locations = this._extractEmoteLocations(entry, message, name);
		if (!locations.length) {
			return [];
		}

		const id = name || this._string(entry.id, "") || url;
		return locations.map((location) => ({
			id,
			url,
			start: location.start,
			end: location.end,
		}));
	}

	_extractEmoteLocations(entry, message, name = "") {
		const rawStart = this._extractNumeric(
			entry.start,
			entry.start_index,
			entry.startIndex,
			entry.from,
			entry.begin,
			entry.offset,
			entry.location?.start,
			entry.location?.from,
		);
		const rawEnd = this._extractNumeric(
			entry.end,
			entry.end_index,
			entry.endIndex,
			entry.to,
			entry.finish,
			entry.location?.end,
			entry.location?.to,
		);
		const rawLength = this._extractNumeric(
			entry.length,
			entry.len,
			entry.count,
			entry.location?.length,
		);
		const explicit = this._normalizeExplicitLocation(
			message,
			rawStart,
			rawEnd,
			rawLength,
			name,
		);
		if (explicit) {
			return [explicit];
		}

		return this._findTokenLocationsFromMessage(message, name);
	}

	_normalizeExplicitLocation(message, rawStart, rawEnd, rawLength, name = "") {
		if (!Number.isFinite(rawStart)) {
			return null;
		}

		const messageLength = this._string(message, "").length;
		let startUnit = Math.max(0, Math.floor(rawStart));
		let endUnit = null;

		if (Number.isFinite(rawEnd)) {
			endUnit = Math.floor(rawEnd);
			if (endUnit < startUnit) {
				return null;
			}
			const token = this._string(name, "");
			if (token) {
				const inclusiveSlice = message.slice(startUnit, endUnit + 1);
				const exclusiveSlice = message.slice(startUnit, endUnit);
				if (inclusiveSlice === token) {
					// inclusive index, keep as-is.
				} else if (exclusiveSlice === token && endUnit > startUnit) {
					endUnit -= 1;
				}
			}
		} else if (Number.isFinite(rawLength) && rawLength > 0) {
			endUnit = startUnit + Math.floor(rawLength) - 1;
		} else if (name) {
			endUnit = startUnit + name.length - 1;
		}

		if (!Number.isFinite(endUnit) || endUnit < startUnit) {
			return null;
		}
		if (startUnit >= messageLength) {
			return null;
		}
		endUnit = Math.min(endUnit, messageLength - 1);

		const start = this._toCodePointIndex(message, startUnit);
		const end = this._toCodePointIndex(message, endUnit + 1) - 1;
		if (end < start) {
			return null;
		}
		return { start, end };
	}

	_findTokenLocationsFromMessage(message, token) {
		const text = this._string(message, "");
		const needle = this._string(token, "");
		if (!text || !needle) {
			return [];
		}

		const locations = [];
		let offset = 0;
		while (offset <= text.length) {
			const index = text.indexOf(needle, offset);
			if (index === -1) {
				break;
			}

			const start = this._toCodePointIndex(text, index);
			const end = this._toCodePointIndex(text, index + needle.length) - 1;
			if (end >= start) {
				locations.push({ start, end });
			}
			offset = index + needle.length;
		}

		return locations;
	}

	_inferEmotesFromMessageText(message) {
		const text = this._string(message, "");
		if (!text || !this._emoteLookup?.size) {
			return [];
		}

		const matches = [];
		const tokenPattern = /\S+/g;
		let tokenMatch;

		while ((tokenMatch = tokenPattern.exec(text))) {
			const token = this._string(tokenMatch[0], "");
			if (!token) {
				continue;
			}

			const variants = this._tokenVariants(token);
			let picked = null;
			for (const variant of variants) {
				const lookup = this._emoteLookup.get(variant.lookupKey);
				if (!lookup) {
					continue;
				}
				picked = {
					lookup,
					startOffset: variant.startOffset,
					endOffset: variant.endOffset,
				};
				break;
			}

			if (!picked) {
				continue;
			}

			const startUnit = tokenMatch.index + picked.startOffset;
			const endUnit = tokenMatch.index + token.length - picked.endOffset - 1;
			if (endUnit < startUnit) {
				continue;
			}

			const start = this._toCodePointIndex(text, startUnit);
			const end = this._toCodePointIndex(text, endUnit + 1) - 1;
			if (end < start) {
				continue;
			}

			matches.push({
				id: picked.lookup.name,
				url: picked.lookup.url,
				start,
				end,
			});
		}

		return matches;
	}

	_tokenVariants(token) {
		const raw = this._string(token, "");
		if (!raw) {
			return [];
		}

		const variants = [
			{
				value: raw,
				startOffset: 0,
				endOffset: 0,
			},
		];

		if (raw.startsWith(":") && raw.length > 1) {
			variants.push({
				value: raw.slice(1),
				startOffset: 1,
				endOffset: 0,
			});
		}

		const leadingMatch = raw.match(/^[:([{<"'`]+/);
		const trailingMatch = raw.match(/[)\]}>,"'.`?]+$/);
		const leading = leadingMatch ? leadingMatch[0].length : 0;
		const trailing = trailingMatch ? trailingMatch[0].length : 0;
		const trimmed = raw.slice(leading, raw.length - trailing);
		if (trimmed && trimmed !== raw) {
			variants.push({
				value: trimmed,
				startOffset: leading,
				endOffset: trailing,
			});
		}

		return variants.map((variant) => ({
			...variant,
			lookupKey: variant.value.toLowerCase(),
		}));
	}

	_lookupEmoteUrl(name) {
		const key = this._string(name, "").trim().toLowerCase();
		if (!key || !this._emoteLookup?.size) {
			return "";
		}
		const direct = this._emoteLookup.get(key);
		if (direct?.url) {
			return this._string(direct.url, "");
		}

		const withoutColon = key.startsWith(":") ? key.slice(1) : key;
		if (withoutColon && withoutColon !== key) {
			const alt = this._emoteLookup.get(withoutColon);
			if (alt?.url) {
				return this._string(alt.url, "");
			}
		}

		const withColon = key.startsWith(":") ? key : `:${key}`;
		if (withColon !== key) {
			const alt = this._emoteLookup.get(withColon);
			if (alt?.url) {
				return this._string(alt.url, "");
			}
		}

		return "";
	}

	_asObjectArray(value) {
		if (Array.isArray(value)) {
			return value.filter(
				(entry) => entry && typeof entry === "object" && !Array.isArray(entry),
			);
		}
		if (typeof value === "string") {
			const text = value.trim();
			if (!text) {
				return [];
			}
			try {
				const parsed = JSON.parse(text);
				if (Array.isArray(parsed)) {
					return parsed.filter(
						(entry) =>
							entry && typeof entry === "object" && !Array.isArray(entry),
					);
				}
				if (parsed && typeof parsed === "object") {
					return [parsed];
				}
			} catch {
				return [];
			}
		}
		return [];
	}

	_toCodePointIndex(text, codeUnitIndex) {
		const message = this._string(text, "");
		if (!message) {
			return 0;
		}
		const bounded = Math.max(
			0,
			Math.min(message.length, Math.floor(codeUnitIndex)),
		);
		return Array.from(message.slice(0, bounded)).length;
	}

	_extractNumeric(...values) {
		for (const value of values) {
			const parsed = this._number(value, Number.NaN);
			if (Number.isFinite(parsed)) {
				return parsed;
			}
		}
		return Number.NaN;
	}

	_maxTierLevel(chat = {}) {
		return Math.max(
			this._coerceTierLevel(chat?.sub_tier),
			this._coerceTierLevel(chat?.sub_lv),
			this._coerceTierLevel(chat?.tier),
			this._coerceTierLevel(chat?.content_data?.sub_tier),
			this._coerceTierLevel(chat?.content_data?.sub_lv),
		);
	}

	_coerceTierLevel(value) {
		if (typeof value === "number" && Number.isFinite(value)) {
			return Math.max(0, Math.floor(value));
		}

		const text = this._string(value, "").trim().toLowerCase();
		if (!text) {
			return 0;
		}

		const numeric = Number(text);
		if (Number.isFinite(numeric)) {
			return Math.max(0, Math.floor(numeric));
		}

		const match =
			text.match(/tier[^0-9]*([0-9]+)/) ||
			text.match(/sub[^0-9]*([0-9]+)/) ||
			text.match(/([0-9]+)/);
		if (!match?.[1]) {
			return 0;
		}

		const parsed = Number(match[1]);
		return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
	}

	_buildAlertUser(chat, fallbackUsername = "") {
		const username = this._string(
			chat?.user_name || chat?.nick_name,
			fallbackUsername || this._state.username,
		).trim();
		const displayname = this._string(chat?.nick_name, username);
		const avatar = this._string(chat?.avatar, "");
		const userId = this._string(chat?.user_id, "");
		const roles = this._stringList(chat?.roles);
		const medals = this._stringList(chat?.medals);
		const userLevels = this._buildRoleFlags(
			roles,
			medals,
			username,
			chat || {},
		);

		return {
			username,
			displayname,
			avatar: avatar || undefined,
			userId: userId || undefined,
			userLevels,
		};
	}

	_buildAlertExtraSettings(chat, fallbackUsername = "", overrides = {}) {
		const alertUser = this._buildAlertUser(chat, fallbackUsername);
		const roles = this._stringList(chat?.roles);
		const medals = this._stringList(chat?.medals);
		const uptime =
			this._state.live && this._state.uptimeStartedAt
				? this._formatDuration(Date.now() - this._state.uptimeStartedAt)
				: "";

		return {
			username: alertUser.username,
			displayname: alertUser.displayname,
			avatar: alertUser.avatar,
			userId: alertUser.userId,
			live: this._state.live,
			uptime,
			channel_id: this._state.channelId,
			display_name: this._state.displayName,
			session_chat_count: this._state.sessionChatCount,
			session_follower_count: this._state.sessionFollowerCount,
			session_subscribers_count: this._state.sessionSubscribersCount,
			session_raiders: this._state.sessionRaiders.join(", "),
			session_subscribers: this._state.sessionSubscribers.join(", "),
			sub_tier: this._string(chat?.sub_tier, ""),
			sub_level: this._string(chat?.sub_lv, ""),
			roles: roles.join(","),
			medals: medals.join(","),
			...overrides,
		};
	}

	async _triggerAlert(
		alert,
		{ dynamic = {}, extraSettings = {}, showInEventList } = {},
	) {
		try {
			const normalizedDynamic = this._normalizeAlertDynamic(dynamic);
			await this.lumia.triggerAlert({
				alert,
				dynamic: normalizedDynamic,
				extraSettings,
				showInEventList:
					typeof showInEventList === "boolean" ? showInEventList : false,
			});
		} catch (error) {
			await this._log(
				`[Trovo] Failed to trigger alert ${alert}: ${this._errorMessage(error)}`,
				"warn",
			);
		}
	}

	_normalizeAlertDynamic(dynamic = {}) {
		const name = this._string(dynamic?.name, "");
		let value = dynamic?.value;
		if (
			typeof value !== "string" &&
			typeof value !== "number" &&
			typeof value !== "boolean"
		) {
			value = this._string(value, "");
		}
		return { name, value };
	}

	async _markLastEvent() {
		await this._setVariable(
			VARIABLE_NAMES.lastEventAt,
			new Date().toISOString(),
		);
	}

	async _hydrateVariableDefaults() {
		const updates = Object.entries(VARIABLE_DEFAULTS).map(([name, value]) =>
			this._setVariable(name, value, { force: true }),
		);
		await Promise.all(updates);
	}

	async _applyResolvedProfile(profile = {}) {
		const channelId = this._string(profile?.channelId, this._state.channelId);
		const userId = this._string(profile?.userId, this._state.userId);
		const username = this._string(profile?.username, this._state.username);
		const displayName = this._string(
			profile?.displayName || username,
			this._state.displayName,
		);

		if (!channelId && !username) {
			return;
		}

		this._state.channelId = channelId;
		this._state.userId = userId;
		this._state.username = username;
		this._state.displayName = displayName;

		await Promise.all([
			this._setVariable(VARIABLE_NAMES.channelId, channelId),
			this._setVariable(VARIABLE_NAMES.username, username),
			this._setVariable(VARIABLE_NAMES.displayName, displayName),
		]);
	}

	_resolveCredentials(source = {}) {
		return {
			clientId: TROVO_CLIENT_ID,
			accessToken: this._normalizeToken(source?.accessToken),
			refreshToken: this._string(source?.refreshToken, "").trim(),
			tokenExpiresAt: this._number(source?.tokenExpiresAt, 0),
		};
	}

	_hasCredentials(source = {}) {
		const credentials = this._resolveCredentials(source);
		return Boolean(this._hasAuthTokens(credentials));
	}

	_hasAuthTokens(source = this.settings) {
		return Boolean(this._accessToken(source) || this._refreshToken(source));
	}

	_accessToken(source = this.settings) {
		return this._normalizeToken(source?.accessToken);
	}

	_refreshToken(source = this.settings) {
		return this._string(source?.refreshToken, "").trim();
	}

	_tokenExpiresAt(source = this.settings) {
		return this._number(source?.tokenExpiresAt, 0);
	}

	_canRefreshTokens(source = this.settings) {
		return Boolean(
			this._refreshToken(source) &&
			typeof this.lumia?.refreshOAuthToken === "function",
		);
	}

	_requiresReconnect(settings, previous) {
		const keys = ["accessToken", "refreshToken", "tokenExpiresAt"];

		for (const key of keys) {
			if ((settings?.[key] ?? "") !== (previous?.[key] ?? "")) {
				return true;
			}
		}

		return false;
	}

	_extractUserId(chat = {}) {
		const direct = this._firstString(
			chat?.uid,
			chat?.sender_id,
			chat?.senderId,
			chat?.user_id,
			chat?.userId,
		);
		const normalizedDirect = this._string(direct, "").trim();
		if (normalizedDirect) {
			return normalizedDirect;
		}

		const parsedFromMessageId = this._extractUidFromTrovoMessageId(
			chat?.message_id || chat?.messageId || chat?.id,
		);
		return parsedFromMessageId || "";
	}

	_trackChatMessageAuthor(chat = {}) {
		const messageId = this._string(
			chat?.message_id || chat?.messageId || chat?.id,
			"",
		).trim();
		if (!messageId) {
			return;
		}

		const uid = this._extractUserId(chat);
		if (!uid) {
			return;
		}

		this._chatMessageAuthors.set(messageId, uid);
		this._chatMessageAuthorOrder.push(messageId);

		if (this._chatMessageAuthorOrder.length > MAX_TRACKED_CHAT_MESSAGE_AUTHORS) {
			const oldest = this._chatMessageAuthorOrder.shift();
			if (oldest) {
				this._chatMessageAuthors.delete(oldest);
			}
		}
	}

	_resolveDeleteMessageUid(messageId, username = "") {
		const normalizedMessageId = this._string(messageId, "").trim();
		if (!normalizedMessageId) {
			return "";
		}

		const cached = this._string(this._chatMessageAuthors.get(normalizedMessageId), "").trim();
		if (cached) {
			return cached;
		}

		const parsed = this._extractUidFromTrovoMessageId(normalizedMessageId);
		if (parsed) {
			return parsed;
		}

		const normalizedUsername = this._normalizeCommandUsername(username);
		if (
			normalizedUsername &&
			this._state.username &&
			normalizedUsername.toLowerCase() === this._state.username.toLowerCase()
		) {
			return this._string(this._state.userId, "").trim();
		}

		return "";
	}

	_extractUidFromTrovoMessageId(messageId) {
		const raw = this._string(messageId, "").trim();
		if (!raw) {
			return "";
		}

		const parts = raw.split("_").filter(Boolean);
		for (let index = 1; index < parts.length; index += 1) {
			const part = this._string(parts[index], "").trim();
			if (/^\d+$/.test(part)) {
				return part;
			}
		}

		return "";
	}

	_normalizeCommandUsername(value) {
		return this._string(value, "").trim().replace(/^@+/, "");
	}

	async _sendTrovoChatMessage(message, credentials, options = {}) {
		const content = this._string(message, "").trim();
		if (!content) {
			return false;
		}

		const channelId = await this._resolveChannelId(credentials, options);
		const payload = {
			content,
		};
		if (channelId) {
			payload.channel_id = this._number(channelId, 0);
		}

		await this._trovoPost("chat/send", payload, credentials, options);
		return true;
	}

	async _performChatCommand(command, credentials, options = {}) {
		const normalizedCommand = this._string(command, "").trim();
		if (!normalizedCommand) {
			return false;
		}
		const apiCommand = normalizedCommand.replace(/^\/+/, "").trim();
		if (!apiCommand) {
			return false;
		}

		const channelId = await this._resolveChannelId(credentials, options);
		const parsedChannelId = this._number(channelId, 0);
		if (!parsedChannelId) {
			throw new Error("Perform chat command requires a valid channel_id");
		}

		const payload = {
			command: apiCommand,
			channel_id: parsedChannelId,
		};

		await this._trovoPost(
			"channels/command",
			payload,
			credentials,
			options,
		);
		return true;
	}

	async _deleteChatMessage(messageId, uid, credentials, options = {}) {
		const normalizedMessageId = this._string(messageId, "").trim();
		const normalizedUid = this._string(uid, "").trim();
		if (!normalizedMessageId || !normalizedUid) {
			return false;
		}

		const channelId = await this._resolveChannelId(credentials, options);
		const normalizedChannelId = this._string(channelId, "").trim();
		if (!normalizedChannelId || !/^\d+$/.test(normalizedUid)) {
			throw new Error("Delete message requires valid channel_id and uid");
		}

		const deletePath = `channels/${encodeURIComponent(
			normalizedChannelId,
		)}/messages/${encodeURIComponent(normalizedMessageId)}/users/${encodeURIComponent(
			normalizedUid,
		)}`;

		await this._trovoDelete(
			deletePath,
			undefined,
			credentials,
			options,
		);
		return true;
	}

	async _fetchProfile(credentials, options = {}) {
		const payload = await this._trovoGet("getuserinfo", credentials, options);
		const data =
			payload && typeof payload.data === "object" && payload.data
				? payload.data
				: payload;

		return {
			channelId: this._string(data?.channelId || data?.channel_id, ""),
			userId: this._string(data?.uid || data?.userId || data?.user_id, ""),
			username: this._string(
				data?.userName || data?.user_name || data?.username || data?.nickName,
				"",
			),
			displayName: this._string(data?.nickName || data?.nick_name, ""),
		};
	}

	async _fetchChatToken(credentials, options = {}) {
		const payload = await this._trovoGet("chat/token", credentials, options);
		const token = this._string(
			payload?.token || payload?.data?.token,
			"",
		).trim();
		if (!token) {
			throw new Error("Trovo chat/token did not return a token");
		}
		return token;
	}

	async _searchCategories(query, limit = CATEGORY_SEARCH_LIMIT) {
		const cleanedQuery = this._string(query, "").trim();
		if (!cleanedQuery) {
			return [];
		}

		const safeLimit = Math.max(1, Math.min(100, this._parseInteger(limit, 20)));
		const payload = await this._trovoPublicPost("searchcategory", {
			query: cleanedQuery,
			limit: safeLimit,
		});
		return Array.isArray(payload?.category_info) ? payload.category_info : [];
	}

	async _findBestCategoryMatch(query) {
		const cleanedQuery = this._string(query, "").trim();
		if (!cleanedQuery) {
			throw new Error("Category query is required");
		}

		const categories = await this._searchCategories(cleanedQuery);
		if (!categories.length) {
			throw new Error(`No Trovo categories found for "${cleanedQuery}"`);
		}

		let best = null;
		let bestScore = Number.NEGATIVE_INFINITY;
		for (const category of categories) {
			const score = this._scoreCategoryMatch(cleanedQuery, category);
			if (score > bestScore) {
				bestScore = score;
				best = category;
			}
		}

		if (!best || !this._string(best?.id, "").trim()) {
			throw new Error(`No Trovo category match found for "${cleanedQuery}"`);
		}

		return {
			id: this._string(best.id, "").trim(),
			name: this._string(best.name || best.short_name, "").trim(),
		};
	}

	_scoreCategoryMatch(query, category = {}) {
		const queryRaw = this._string(query, "").trim();
		const queryNormalized = this._normalizeMatchText(queryRaw);
		const categoryId = this._string(category?.id || category?.category_id, "").trim();
		const categoryName = this._string(category?.name, "").trim();
		const categoryShortName = this._string(
			category?.short_name || category?.shortName,
			"",
		).trim();

		if (!queryNormalized) {
			return Number.NEGATIVE_INFINITY;
		}
		if (categoryId && queryRaw === categoryId) {
			return 10000;
		}

		const labels = [categoryName, categoryShortName].filter(Boolean);
		if (!labels.length) {
			return Number.NEGATIVE_INFINITY;
		}

		let best = Number.NEGATIVE_INFINITY;
		for (const label of labels) {
			const normalizedLabel = this._normalizeMatchText(label);
			if (!normalizedLabel) {
				continue;
			}

			if (normalizedLabel === queryNormalized) {
				best = Math.max(best, 9000);
				continue;
			}
			if (normalizedLabel.startsWith(queryNormalized)) {
				best = Math.max(best, 8000);
				continue;
			}
			if (normalizedLabel.includes(queryNormalized)) {
				best = Math.max(best, 7000);
				continue;
			}

			const similarity = this._diceCoefficient(queryNormalized, normalizedLabel);
			best = Math.max(best, similarity * 1000);
		}

		return best;
	}

	_diceCoefficient(left, right) {
		const a = this._string(left, "");
		const b = this._string(right, "");
		if (!a || !b) {
			return 0;
		}
		if (a === b) {
			return 1;
		}
		if (a.length < 2 || b.length < 2) {
			return 0;
		}

		const makeBigrams = (text) => {
			const counts = new Map();
			for (let i = 0; i < text.length - 1; i += 1) {
				const key = text.slice(i, i + 2);
				counts.set(key, (counts.get(key) || 0) + 1);
			}
			return counts;
		};

		const leftBigrams = makeBigrams(a);
		const rightBigrams = makeBigrams(b);

		let overlap = 0;
		for (const [key, leftCount] of leftBigrams.entries()) {
			const rightCount = rightBigrams.get(key) || 0;
			overlap += Math.min(leftCount, rightCount);
		}

		const total = a.length - 1 + (b.length - 1);
		return total > 0 ? (2 * overlap) / total : 0;
	}

	_normalizeMatchText(value) {
		return this._string(value, "")
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, " ")
			.trim();
	}

	async _updateChannelInfo(updates = {}, credentials, options = {}) {
		const resolvedCredentials = this._resolveCredentials(credentials || this.settings);
		const channelId = await this._resolveChannelId(resolvedCredentials, options);
		const payload = {
			channel_id: this._number(channelId, 0),
		};

		const liveTitle = this._string(updates?.live_title, "");
		if (liveTitle.trim()) {
			payload.live_title = liveTitle;
		}

		const categoryId = this._string(
			updates?.category_id || updates?.category,
			"",
		).trim();
		if (categoryId) {
			const parsedCategoryId = this._parseInteger(categoryId, 0);
			const categoryValue = parsedCategoryId || categoryId;
			payload.category = categoryValue;
			payload.category_id = categoryValue;
		}

		if (!payload.live_title && !payload.category && !payload.category_id) {
			return false;
		}

		await this._trovoPost("channels/update", payload, resolvedCredentials, options);
		return true;
	}

	async _resolveChannelId(credentials, options = {}) {
		const existingChannelId = this._number(this._state.channelId, 0);
		if (existingChannelId) {
			return existingChannelId;
		}

		const profile = await this._fetchProfile(credentials, options);
		await this._applyResolvedProfile(profile);
		const resolvedChannelId = this._number(profile?.channelId, 0);
		if (!resolvedChannelId) {
			throw new Error("Unable to resolve Trovo channel id");
		}
		return resolvedChannelId;
	}

	async _refreshEmoteLookup() {
		const channelId = this._number(this._state.channelId, 0);
		if (!channelId) {
			return;
		}

		const url = `${API_BASE_URL}/getemotes`;
		try {
			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Client-ID": TROVO_CLIENT_ID,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					emote_type: 0,
					channel_id: [channelId],
				}),
			});

			const bodyText = await response.text();
			let payload = {};
			if (bodyText) {
				try {
					payload = JSON.parse(bodyText);
				} catch {
					payload = {};
				}
			}

			if (!response.ok || this._isErrorResponse(payload)) {
				throw new Error(
					this._responseError(payload) ||
						`HTTP ${response.status} ${response.statusText || ""}`.trim(),
				);
			}

			this._emoteLookup = this._buildEmoteLookup(payload);
		} catch (error) {
			await this._log(
				`[Trovo] Failed to refresh emote lookup: ${this._errorMessage(error)}`,
				"warn",
			);
		}
	}

	_buildEmoteLookup(payload = {}) {
		const channels =
			payload && typeof payload.channels === "object" && payload.channels
				? payload.channels
				: payload;
		const lookup = new Map();

		const addEmote = (emote = {}) => {
			const name = this._string(emote?.name, "").trim();
			if (!name) {
				return;
			}
			const url = this._normalizeBadgeUrl(
				this._firstString(emote?.webp, emote?.gifp, emote?.url),
			);
			if (!url) {
				return;
			}
			const key = name.toLowerCase();
			if (!lookup.has(key)) {
				lookup.set(key, { name, url });
			}
		};

		const customizedChannels = Array.isArray(
			channels?.customizedEmotes?.channel,
		)
			? channels.customizedEmotes.channel
			: [];
		for (const channel of customizedChannels) {
			const emotes = Array.isArray(channel?.emotes) ? channel.emotes : [];
			for (const emote of emotes) {
				addEmote(emote);
			}
		}

		const eventEmotes = Array.isArray(channels?.eventEmotes)
			? channels.eventEmotes
			: [];
		for (const emote of eventEmotes) {
			addEmote(emote);
		}

		const globalEmotes = Array.isArray(channels?.globalEmotes)
			? channels.globalEmotes
			: [];
		for (const emote of globalEmotes) {
			addEmote(emote);
		}

		return lookup;
	}

	async _trovoGet(path, credentials, options = {}) {
		const clientId = TROVO_CLIENT_ID;

		const accessToken = await this._ensureAccessToken(credentials, options);
		let response = await this._trovoRequest(path, clientId, accessToken);

		if (response.status === 401 && this._canRefreshTokens(credentials)) {
			const refreshedToken = await this._refreshAccessToken(
				credentials,
				options,
			);
			response = await this._trovoRequest(path, clientId, refreshedToken);
		}

		return this._readTrovoResponse(path, response);
	}

	async _trovoPost(path, payload = {}, credentials, options = {}) {
		const clientId = TROVO_CLIENT_ID;
		const accessToken = await this._ensureAccessToken(credentials, options);
		let response = await this._trovoRequest(path, clientId, accessToken, {
			method: "POST",
			body: payload,
		});

		if (response.status === 401 && this._canRefreshTokens(credentials)) {
			const refreshedToken = await this._refreshAccessToken(credentials, options);
			response = await this._trovoRequest(path, clientId, refreshedToken, {
				method: "POST",
				body: payload,
			});
		}

		return this._readTrovoResponse(path, response);
	}

	async _trovoDelete(path, payload = {}, credentials, options = {}) {
		const clientId = TROVO_CLIENT_ID;
		const accessToken = await this._ensureAccessToken(credentials, options);
		let response = await this._trovoRequest(path, clientId, accessToken, {
			method: "DELETE",
			body: payload,
		});

		if (response.status === 401 && this._canRefreshTokens(credentials)) {
			const refreshedToken = await this._refreshAccessToken(credentials, options);
			response = await this._trovoRequest(path, clientId, refreshedToken, {
				method: "DELETE",
				body: payload,
			});
		}

		return this._readTrovoResponse(path, response);
	}

	async _trovoPublicPost(path, payload = {}) {
		const response = await this._trovoRequest(path, TROVO_CLIENT_ID, "", {
			method: "POST",
			body: payload,
		});
		return this._readTrovoResponse(path, response);
	}

	async _readTrovoResponse(path, response) {
		const url = `${API_BASE_URL}/${path}`;
		const bodyText = await response.text();
		let body = {};
		if (bodyText) {
			try {
				body = JSON.parse(bodyText);
			} catch {
				body = { message: bodyText };
			}
		}

		if (!response.ok) {
			throw new Error(
				`HTTP ${response.status} on ${url}: ${this._responseError(body) || response.statusText || "Request failed"}`,
			);
		}

		if (this._isErrorResponse(body)) {
			throw new Error(this._responseError(body));
		}

		return body;
	}

	async _trovoRequest(path, clientId, accessToken, options = {}) {
		const url = `${API_BASE_URL}/${path}`;
		const method = this._string(options?.method, "GET").toUpperCase();
		const hasBody = options?.body !== undefined;
		const timeoutMs = Math.max(
			1000,
			this._number(options?.timeoutMs, HTTP_REQUEST_TIMEOUT_MS),
		);
		const headers = {
			Accept: "application/json",
			"Client-ID": clientId,
		};
		if (accessToken) {
			headers.Authorization = `OAuth ${accessToken}`;
		}
		if (hasBody || method !== "GET") {
			headers["Content-Type"] = "application/json";
		}

		const requestInit = {
			method,
			headers,
		};
		if (hasBody) {
			requestInit.body = JSON.stringify(options.body);
		}

		const controller =
			typeof AbortController !== "undefined"
				? new AbortController()
				: null;
		let timeoutHandle = null;
		if (controller) {
			timeoutHandle = setTimeout(() => {
				controller.abort();
			}, timeoutMs);
		}

		try {
			return await fetch(url, {
				...requestInit,
				...(controller ? { signal: controller.signal } : {}),
			});
		} catch (error) {
			if (controller?.signal?.aborted) {
				throw new Error(
					`Trovo request timed out after ${timeoutMs}ms (${method} ${path})`,
				);
			}
			throw error;
		} finally {
			if (timeoutHandle) {
				clearTimeout(timeoutHandle);
			}
		}
	}

	async _refreshAccessToken(
		credentials = this._resolveCredentials(this.settings),
		options = {},
	) {
		if (this._tokenRefreshPromise) {
			return this._tokenRefreshPromise;
		}

		const refreshToken = this._refreshToken(credentials);
		if (!refreshToken) {
			throw new Error("Missing Trovo refresh token.");
		}

		const persist = options.persist !== false;
		this._tokenRefreshPromise = (async () => {
			try {
				if (typeof this.lumia?.refreshOAuthToken !== "function") {
					throw new Error("Missing OAuth refresh support.");
				}

				const payload = await this.lumia.refreshOAuthToken({ refreshToken });
				const nextAccessToken = this._normalizeToken(payload?.accessToken);
				const nextRefreshToken =
					this._string(payload?.refreshToken, "").trim() || refreshToken;
				const expiresAt = this._number(payload?.expiresAt, 0);
				const tokenExpiresAt = expiresAt ? expiresAt * 1000 : 0;

				if (!nextAccessToken) {
					throw new Error(
						"OAuth refresh did not return a Trovo access token.",
					);
				}

				if (persist) {
					this.updateSettings({
						accessToken: nextAccessToken,
						refreshToken: nextRefreshToken,
						tokenExpiresAt,
					});
				}

				return nextAccessToken;
			} catch (error) {
				await this._handleOAuthRefreshFailure(error);
				throw error;
			}
		})();

		try {
			return await this._tokenRefreshPromise;
		} finally {
			this._tokenRefreshPromise = null;
		}
	}

	async _ensureAccessToken(
		credentials = this._resolveCredentials(this.settings),
		options = {},
	) {
		const accessToken = this._accessToken(credentials);
		const refreshToken = this._refreshToken(credentials);
		const tokenExpiresAt = this._tokenExpiresAt(credentials);

		if (!accessToken && !refreshToken) {
			throw new Error("Missing Trovo access credentials.");
		}

		if (accessToken) {
			if (
				tokenExpiresAt &&
				Date.now() > tokenExpiresAt - 60000 &&
				this._canRefreshTokens(credentials)
			) {
				return this._refreshAccessToken(credentials, options);
			}
			return accessToken;
		}

		if (!this._canRefreshTokens(credentials)) {
			throw new Error("Missing Trovo access token.");
		}

		return this._refreshAccessToken(credentials, options);
	}

	_sendSocket(payload, { awaitResponse = false, timeoutMs = 10000 } = {}) {
		const ws = this._ws;
		if (!ws || ws.readyState !== WebSocket.OPEN) {
			return Promise.reject(new Error("Trovo websocket is not open"));
		}

		const nonce = String(this._nonceCounter++);
		const packet = {
			...payload,
			nonce,
		};

		if (!awaitResponse) {
			ws.send(JSON.stringify(packet));
			return Promise.resolve(true);
		}

		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				this._pendingRequests.delete(nonce);
				reject(new Error("Trovo websocket request timed out"));
			}, timeoutMs);

			this._pendingRequests.set(nonce, {
				resolve,
				reject,
				timeout,
			});

			try {
				ws.send(JSON.stringify(packet));
			} catch (error) {
				clearTimeout(timeout);
				this._pendingRequests.delete(nonce);
				reject(error);
			}
		});
	}

	_rejectPendingRequests(error) {
		for (const pending of this._pendingRequests.values()) {
			clearTimeout(pending.timeout);
			pending.reject(error);
		}
		this._pendingRequests.clear();
	}

	async _setVariable(name, value, { force = false } = {}) {
		if (
			!force &&
			this._variableCache.has(name) &&
			this._variableCache.get(name) === value
		) {
			return;
		}
		this._variableCache.set(name, value);
		await this.lumia.setVariable(name, value);
	}

	async _updateConnectionState(nextState) {
		if (this._lastConnectionState === nextState) {
			return;
		}
		this._lastConnectionState = nextState;
		await this.lumia.updateConnection(nextState);
	}

	async _handleOAuthRefreshFailure(error) {
		if (this._authRefreshFailureHandled) {
			return;
		}
		this._authRefreshFailureHandled = true;

		const reason = this._errorMessage(error);
		const message = `[Trovo] OAuth refresh failed. Disconnected plugin. Re-authorize Trovo in Connections. (${reason})`;
		await this._log(message, "error");

		try {
			await this.lumia.showToast({
				message:
					'Trovo disconnected: OAuth token refresh failed. Re-authorize in Connections.',
				time: 10000,
			});
		} catch {}

		await this._stop({ manual: true, resetLiveState: false });
	}

	async _log(message, level = "info") {
		if (!message) {
			return;
		}
		try {
			await this.lumia.log({ message, level });
		} catch {}
	}

	_markStartupBoundary() {
		const now = Date.now();
		this._connectedAtMs = now;
		this._startupSuppressUntilMs = now + STARTUP_SUPPRESS_SECONDS * 1000;
		this._recentChatIds.clear();
		this._recentChatIdOrder = [];
		this._chatMessageAuthors.clear();
		this._chatMessageAuthorOrder = [];
		this._state.sessionJoinedUsers.clear();
	}

	_shouldSuppressStartupEvent(chat = {}) {
		const eventMs = this._extractChatEventTimestampMs(chat);
		if (eventMs > 0 && this._connectedAtMs > 0) {
			return (
				eventMs <
				this._connectedAtMs - STARTUP_BACKFILL_TOLERANCE_SECONDS * 1000
			);
		}

		return (
			Boolean(this._startupSuppressUntilMs) &&
			Date.now() < this._startupSuppressUntilMs
		);
	}

	_extractChatEventTimestampMs(chat = {}) {
		const contentData =
			chat && typeof chat.content_data === "object" && chat.content_data
				? chat.content_data
				: {};
		const candidates = [
			chat?.send_time,
			chat?.sendTime,
			chat?.timestamp,
			chat?.time,
			chat?.ts,
			chat?.create_time,
			chat?.created_at,
			chat?.createdAt,
			contentData?.send_time,
			contentData?.timestamp,
			contentData?.created_at,
		];

		for (const candidate of candidates) {
			const epochMs = this._toEpochMs(candidate);
			if (epochMs > 0) {
				return epochMs;
			}
		}

		return 0;
	}

	_toEpochMs(value) {
		if (typeof value === "number" && Number.isFinite(value)) {
			return value >= 1e11 ? Math.floor(value) : Math.floor(value * 1000);
		}

		if (typeof value === "string") {
			const trimmed = value.trim();
			if (!trimmed) {
				return 0;
			}

			const numeric = Number(trimmed);
			if (Number.isFinite(numeric)) {
				return this._toEpochMs(numeric);
			}

			const parsed = Date.parse(trimmed);
			return Number.isFinite(parsed) ? parsed : 0;
		}

		return 0;
	}

	_isDuplicateChat(chat = {}) {
		const messageId = this._string(
			chat?.message_id || chat?.messageId || chat?.id,
			"",
		).trim();
		if (!messageId) {
			return false;
		}
		if (this._recentChatIds.has(messageId)) {
			return true;
		}

		this._recentChatIds.add(messageId);
		this._recentChatIdOrder.push(messageId);

		if (this._recentChatIdOrder.length > MAX_TRACKED_CHAT_IDS) {
			const oldest = this._recentChatIdOrder.shift();
			if (oldest) {
				this._recentChatIds.delete(oldest);
			}
		}

		return false;
	}

	_includeSpells(settings = this.settings) {
		return this._bool(settings?.includeSpells, true);
	}

	_shouldTriggerEntrance(settings = this.settings) {
		const onlyWhenLive = this._bool(settings?.entranceOnlyWhenLive, true);
		return onlyWhenLive ? this._state.live === true : true;
	}

	_shouldTriggerFirstChatter(settings = this.settings) {
		const onlyWhenLive = this._bool(settings?.firstChatterOnlyWhenLive, true);
		return onlyWhenLive ? this._state.live === true : true;
	}

	_heartbeatMs() {
		return Math.min(90, Math.max(10, HEARTBEAT_SECONDS)) * 1000;
	}

	_connectionTimeoutMs() {
		return Math.min(60, Math.max(5, CONNECTION_TIMEOUT_SECONDS)) * 1000;
	}

	_reconnectDelaySeconds() {
		return Math.min(
			MAX_RECONNECT_DELAY_SECONDS,
			Math.max(1, RECONNECT_DELAY_SECONDS),
		);
	}

	_isErrorResponse(payload) {
		if (!payload || typeof payload !== "object") {
			return false;
		}

		if (
			payload.status &&
			this._string(payload.status, "").toLowerCase() === "error"
		) {
			return true;
		}

		if (typeof payload.ret === "number" && payload.ret !== 0) {
			return true;
		}

		if (payload.error) {
			return true;
		}

		return false;
	}

	_responseError(payload) {
		if (!payload) {
			return "Unknown Trovo error";
		}

		const message =
			this._string(payload?.retMsg, "") ||
			this._string(payload?.message, "") ||
			this._string(payload?.error, "");

		if (message) {
			return message;
		}

		if (typeof payload === "string") {
			return payload;
		}

		return "Unknown Trovo error";
	}

	_extractRecipient(value) {
		const content = this._string(value, "").trim();
		if (!content) {
			return "";
		}

		const commaIndex = content.indexOf(",");
		if (commaIndex >= 0) {
			return content.slice(commaIndex + 1).trim();
		}

		const toMatch = content.match(/\bto\s+@?([a-zA-Z0-9_]+)/i);
		return toMatch ? this._string(toMatch[1], "") : "";
	}

	_extractRaidViewers(value) {
		const content = this._string(value, "");
		if (!content) {
			return 0;
		}

		const matches = content.match(/\d+/g);
		if (!matches || !matches.length) {
			return 0;
		}

		return this._parseInteger(matches[matches.length - 1], 0);
	}

	_parseInteger(value, fallback = 0) {
		const parsed = parseInt(this._string(value, ""), 10);
		return Number.isFinite(parsed) ? parsed : fallback;
	}

	_pushUnique(list, value) {
		const entry = this._string(value, "").trim();
		if (!entry) {
			return;
		}

		if (!list.includes(entry)) {
			list.push(entry);
		}

		if (list.length > MAX_LIST_ITEMS) {
			list.splice(0, list.length - MAX_LIST_ITEMS);
		}
	}

	_normalizeToken(value) {
		const text = this._string(value, "").trim();
		if (!text) {
			return "";
		}

		return text
			.replace(/^OAuth\s+/i, "")
			.replace(/^Bearer\s+/i, "")
			.trim();
	}

	_formatDuration(milliseconds) {
		const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
		const days = Math.floor(totalSeconds / 86400);
		const hours = Math.floor((totalSeconds % 86400) / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;

		const parts = [];
		if (days) parts.push(`${days}d`);
		if (hours) parts.push(`${hours}h`);
		if (minutes) parts.push(`${minutes}m`);
		if (seconds || !parts.length) parts.push(`${seconds}s`);
		return parts.slice(0, 3).join(" ");
	}

	_socketMessageToString(raw) {
		if (typeof raw === "string") {
			return raw;
		}
		if (Buffer.isBuffer(raw)) {
			return raw.toString("utf8");
		}
		if (Array.isArray(raw)) {
			try {
				return Buffer.concat(raw).toString("utf8");
			} catch {
				return "";
			}
		}
		if (raw == null) {
			return "";
		}
		return String(raw);
	}

	_socketReason(reasonBuffer) {
		if (!reasonBuffer) {
			return "";
		}
		if (typeof reasonBuffer === "string") {
			return reasonBuffer;
		}
		if (Buffer.isBuffer(reasonBuffer)) {
			return reasonBuffer.toString("utf8");
		}
		return String(reasonBuffer);
	}

	_errorMessage(error) {
		if (error instanceof Error) {
			return error.message;
		}
		if (typeof error === "string") {
			return error;
		}
		if (error && typeof error === "object" && "message" in error) {
			return this._string(error.message, "Unknown error");
		}
		return "Unknown error";
	}

	_bool(value, fallback = false) {
		if (typeof value === "boolean") {
			return value;
		}
		if (typeof value === "number") {
			return value !== 0;
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
	}

	_number(value, fallback = 0) {
		if (typeof value === "number" && Number.isFinite(value)) {
			return value;
		}
		if (typeof value === "string") {
			const parsed = Number(value.trim());
			if (Number.isFinite(parsed)) {
				return parsed;
			}
		}
		return fallback;
	}

	_string(value, fallback = "") {
		if (typeof value === "string") {
			return value;
		}
		if (value === null || value === undefined) {
			return fallback;
		}
		return String(value);
	}

	_stringList(value) {
		if (!Array.isArray(value)) {
			return [];
		}
		return value.map((entry) => this._extractTokenLabel(entry)).filter(Boolean);
	}

	_extractTokenLabel(entry) {
		if (typeof entry === "string") {
			return entry.trim();
		}
		if (entry === null || entry === undefined || typeof entry !== "object") {
			return this._string(entry, "").trim();
		}

		const directLabel = this._firstString(
			entry.name,
			entry.label,
			entry.title,
			entry.type,
			entry.id,
			entry.role_name,
			entry.medal_name,
			entry.badge_name,
			entry.text,
			entry.desc,
		);
		if (directLabel) {
			return directLabel;
		}

		if (entry.icon && typeof entry.icon === "object") {
			const nestedLabel = this._firstString(
				entry.icon.name,
				entry.icon.label,
				entry.icon.title,
				entry.icon.id,
			);
			if (nestedLabel) {
				return nestedLabel;
			}
		}

		return "";
	}

	_extractBadgeUrls(chat = {}) {
		const urls = [];
		const sources = [
			...(Array.isArray(chat?.medals) ? chat.medals : []),
			...(Array.isArray(chat?.roles) ? chat.roles : []),
		];

		for (const entry of sources) {
			const url = this._extractBadgeUrl(entry);
			if (url) {
				urls.push(url);
			}
		}

		return [...new Set(urls)];
	}

	_extractBadgeUrl(entry) {
		if (!entry) {
			return "";
		}

		if (typeof entry === "string") {
			const normalized = this._normalizeBadgeUrl(entry);
			if (normalized) {
				return normalized;
			}
			return this._resolveBadgeTokenUrl(entry);
		}

		if (typeof entry !== "object") {
			return "";
		}

		const iconObject =
			entry.icon && typeof entry.icon === "object" ? entry.icon : {};
		const raw = this._firstString(
			entry.icon,
			entry.icon_url,
			entry.iconUrl,
			entry.badge,
			entry.badge_url,
			entry.badgeUrl,
			entry.image,
			entry.image_url,
			entry.imageUrl,
			entry.url,
			entry.src,
			iconObject.url,
			iconObject.src,
			iconObject.image,
			iconObject.image_url,
		);
		const rawToken = this._firstString(
			entry.name,
			entry.label,
			entry.title,
			entry.type,
			entry.id,
			entry.role_name,
			entry.medal_name,
			entry.badge_name,
			iconObject.name,
			iconObject.label,
			iconObject.title,
			iconObject.id,
		);
		const normalized = this._normalizeBadgeUrl(raw);
		if (normalized) {
			return normalized;
		}
		return this._resolveBadgeTokenUrl(rawToken);
	}

	_normalizeBadgeUrl(value) {
		const raw = this._string(value, "").trim();
		if (!raw) {
			return "";
		}
		if (/^https?:\/\//i.test(raw)) {
			return raw;
		}
		if (raw.startsWith("//")) {
			return `https:${raw}`;
		}
		if (raw.startsWith("/")) {
			return `https://trovo.live${raw}`;
		}
		return "";
	}

	_firstString(...values) {
		for (const value of values) {
			const text = this._string(value, "").trim();
			if (text) {
				return text;
			}
		}
		return "";
	}

	_resolveBadgeTokenUrl(value) {
		const token = this._string(value, "").trim().toLowerCase();
		if (!token) {
			return "";
		}
		return TROVO_BADGE_TOKEN_URLS[token] || "";
	}

}

module.exports = TrovoPlugin;
