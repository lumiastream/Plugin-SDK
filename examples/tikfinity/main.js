const { Plugin } = require("@lumiastream/plugin");

// Alert identifiers aligned with Lumia's built-in conventions
const ALERT_TYPES = {
	STREAM_START: "streamStarted",
	STREAM_END: "streamEnded",
	CHAT: "chat",
	GIFT: "gift",
	FOLLOW: "follow",
	SHARE: "share",
	LIKE: "like",
	SUBSCRIBE: "subscribe",
};

// Tikfinity WebSocket event types (based on TikTok LIVE events)
const EVENT_TYPES = {
	CONNECTED: "connected",
	DISCONNECTED: "disconnected",
	STREAM_END: "streamEnd",
	ROOM_USER: "roomUser",
	MEMBER: "member",
	CHAT: "chat",
	GIFT: "gift",
	FOLLOW: "follow",
	SHARE: "share",
	LIKE: "like",
	SUBSCRIBE: "subscribe",
	ERROR: "error",
};

// Default reconnect settings
const DEFAULT_RECONNECT_INTERVAL = 30;
const MIN_RECONNECT_INTERVAL = 10;
const MAX_RECONNECT_INTERVAL = 300;

// Helper functions for data normalization
function coerceString(value, fallback = "") {
	if (typeof value === "string") {
		return value;
	}
	if (value === null || value === undefined) {
		return fallback;
	}
	return String(value);
}

function coerceNumber(value, fallback = 0) {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === "string" && value.trim().length) {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : fallback;
	}
	if (typeof value === "boolean") {
		return value ? 1 : 0;
	}
	return fallback;
}

function coerceBoolean(value, fallback = false) {
	if (typeof value === "boolean") {
		return value;
	}
	if (typeof value === "number") {
		return value !== 0;
	}
	if (typeof value === "string") {
		const normalized = value.trim().toLowerCase();
		if (normalized === "true" || normalized === "yes" || normalized === "1") {
			return true;
		}
		if (normalized === "false" || normalized === "no" || normalized === "0") {
			return false;
		}
		const parsed = Number(value);
		if (Number.isFinite(parsed)) {
			return parsed !== 0;
		}
	}
	return fallback;
}

function normalizeAvatar(value) {
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed.length ? trimmed : "";
	}

	if (value && typeof value === "object") {
		return (
			coerceString(value.url, "") ||
			coerceString(value.avatar, "") ||
			coerceString(value.profilePictureUrl, "") ||
			coerceString(value.image, "")
		);
	}

	return "";
}

class TikfinityPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);

		this.ws = null;
		this.reconnectTimeoutId = null;
		this.isConnecting = false;
		this.isManuallyDisconnected = false;

		this.sessionData = this.createEmptySession();
		this.seenFollowers = new Set();
		this.giftStreaks = new Map();
		this.GIFT_FINALIZE_TIMEOUT = 5000; // 5 seconds
	}

	createEmptySession() {
		return {
			live: false,
			viewers: 0,
			totalViewers: 0,
			title: "",
			likes: 0,
			diamonds: 0,
			followers: 0,
			shares: 0,
			lastChatter: "",
			lastGifter: "",
			lastFollower: "",
		};
	}

	get currentSettings() {
		return this.settings || {};
	}

	get username() {
		return this.extractUsername(this.currentSettings.username);
	}

	get apiKey() {
		return this.extractApiKey(this.currentSettings.apiKey);
	}

	extractUsername(value) {
		if (typeof value !== "string") {
			return undefined;
		}
		const trimmed = value.trim().replace(/^@/, "");
		return trimmed.length ? trimmed : undefined;
	}

	extractApiKey(value) {
		if (typeof value !== "string") {
			return undefined;
		}
		const trimmed = value.trim();
		return trimmed.length ? trimmed : undefined;
	}

	async onload() {
		await this.lumia.addLog("[Tikfinity] Plugin loading...");

		if (this.username) {
			await this.connect({ showToast: false });
		}

		await this.lumia.addLog("[Tikfinity] Plugin loaded");
	}

	async onunload() {
		await this.lumia.addLog("[Tikfinity] Plugin unloading...");
		this.isManuallyDisconnected = true;
		await this.disconnect(false);
		await this.lumia.addLog("[Tikfinity] Plugin unloaded");
	}

	async onsettingsupdate(settings, previousSettings) {
		const next = settings || {};
		const previous = previousSettings || {};

		const nextUsername = this.extractUsername(next.username);
		const prevUsername = this.extractUsername(previous.username);

		const nextApiKey = this.extractApiKey(next.apiKey);
		const prevApiKey = this.extractApiKey(previous.apiKey);

		const usernameChanged = nextUsername !== prevUsername;
		const apiKeyChanged = nextApiKey !== prevApiKey;

		if (!nextUsername) {
			await this.disconnect(false);
			return;
		}

		if (!this.ws || this.ws.readyState !== 1) {
			await this.connect({ showToast: false });
			return;
		}

		if (usernameChanged || apiKeyChanged) {
			await this.disconnect(false);
			await this.connect({ showToast: false });
		}
	}

	async actions(config = {}) {
		const actionList = Array.isArray(config.actions) ? config.actions : [];

		if (!actionList.length) {
			return;
		}

		for (const action of actionList) {
			try {
				switch (action.type) {
					case "manual_connect": {
						await this.connect({ showToast: true });
						await this.lumia.addLog("[Tikfinity] Manual connect triggered");
						break;
					}

					case "manual_disconnect": {
						this.isManuallyDisconnected = true;
						await this.disconnect(true);
						await this.lumia.addLog("[Tikfinity] Manual disconnect triggered");
						break;
					}

					case "test_alert": {
						await this.lumia.triggerAlert({
							alert: ALERT_TYPES.STREAM_START,
							extraSettings: {
								...this.buildAlertVariables(),
								title: this.sessionData.title || "Test Stream",
								viewers: this.sessionData.viewers,
							},
						});
						await this.lumia.addLog("[Tikfinity] Test alert triggered");
						break;
					}

					default: {
						await this.lumia.addLog(
							`[Tikfinity] Unknown action type: ${action.type}`,
						);
					}
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				await this.lumia.addLog(`[Tikfinity] Action failed: ${message}`);
			}
		}
	}

	async validateAuth(data = {}) {
		try {
			const username = this.extractUsername(data.username);
			if (!username) {
				return false;
			}
			// For now, we just validate that the username exists
			// In the future, we could ping Tikfinity API to verify
			return true;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			await this.lumia.addLog(`[Tikfinity] Auth validation failed: ${message}`);
			return false;
		}
	}

	buildWebSocketUrl() {
		const username = this.username;
		if (!username) {
			throw new Error("Username is required to connect");
		}

		// Tikfinity WebSocket endpoint format based on the documentation
		// Using instance "1" as default, can be configurable if needed
		const instance = "1";
		const baseUrl = `wss://tikfinity-cws-${instance}.zerody.one`;

		// Add API key if provided
		const apiKey = this.apiKey;
		if (apiKey) {
			return `${baseUrl}/?uniqueId=${encodeURIComponent(username)}&apiKey=${encodeURIComponent(apiKey)}`;
		}

		return `${baseUrl}/?uniqueId=${encodeURIComponent(username)}`;
	}

	async connect(options = {}) {
		const { showToast = true } = options;

		if (this.isConnecting) {
			await this.lumia.addLog("[Tikfinity] Connection already in progress");
			return;
		}

		if (!this.username) {
			await this.lumia.addLog("[Tikfinity] Missing username, cannot connect");
			if (showToast) {
				await this.lumia.showToast({
					message: "TikTok username required to connect",
				});
			}
			return;
		}

		if (this.ws && this.ws.readyState === 1) {
			await this.lumia.addLog("[Tikfinity] Already connected");
			return;
		}

		try {
			this.isConnecting = true;
			this.isManuallyDisconnected = false;

			const wsUrl = this.buildWebSocketUrl();
			await this.lumia.addLog(`[Tikfinity] Connecting to ${wsUrl}`);

			this.ws = new WebSocket(wsUrl);

			this.ws.onopen = () => {
				void this.handleOpen(showToast);
			};

			this.ws.onmessage = (event) => {
				void this.handleMessage(event);
			};

			this.ws.onerror = (error) => {
				void this.handleError(error);
			};

			this.ws.onclose = () => {
				void this.handleClose();
			};
		} catch (error) {
			this.isConnecting = false;
			const message = error instanceof Error ? error.message : String(error);
			await this.lumia.addLog(`[Tikfinity] Connection error: ${message}`);
			if (showToast) {
				await this.lumia.showToast({
					message: `Failed to connect: ${message}`,
				});
			}
		}
	}

	async disconnect(showToast = true) {
		if (this.reconnectTimeoutId) {
			clearTimeout(this.reconnectTimeoutId);
			this.reconnectTimeoutId = null;
		}

		if (this.ws) {
			this.ws.onclose = null; // Prevent reconnection
			this.ws.close();
			this.ws = null;
		}

		// Clear all gift streak timers
		for (const streak of this.giftStreaks.values()) {
			clearTimeout(streak.timer);
		}
		this.giftStreaks.clear();

		this.isConnecting = false;

		if (showToast) {
			await this.lumia.showToast({ message: "Disconnected from Tikfinity" });
		}

		await this.lumia.updateConnection(false);
		await this.updateVariable("tikfinity_connected", false);
	}

	async handleOpen(showToast = true) {
		this.isConnecting = false;
		await this.lumia.addLog("[Tikfinity] WebSocket connected");

		if (showToast) {
			await this.lumia.showToast({
				message: `Connected to Tikfinity for @${this.username}`,
			});
		}

		await this.lumia.updateConnection(true);
		await this.updateVariable("tikfinity_connected", true);
	}

	async handleMessage(event) {
		try {
			const data = JSON.parse(event.data);
			await this.processEvent(data);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			await this.lumia.addLog(`[Tikfinity] Error processing message: ${message}`);
		}
	}

	async handleError(error) {
		const message = error instanceof Error ? error.message : String(error);
		await this.lumia.addLog(`[Tikfinity] WebSocket error: ${message}`);
	}

	async handleClose() {
		await this.lumia.addLog("[Tikfinity] WebSocket disconnected");
		await this.lumia.updateConnection(false);
		await this.updateVariable("tikfinity_connected", false);

		// Only attempt reconnection if not manually disconnected
		if (!this.isManuallyDisconnected) {
			await this.scheduleReconnect();
		}
	}

	async scheduleReconnect() {
		if (this.reconnectTimeoutId) {
			return;
		}

		const interval = this.normalizeReconnectInterval(
			this.currentSettings.reconnectInterval,
		);

		await this.lumia.addLog(
			`[Tikfinity] Scheduling reconnect in ${interval} seconds`,
		);

		this.reconnectTimeoutId = setTimeout(() => {
			this.reconnectTimeoutId = null;
			void this.connect({ showToast: false });
		}, interval * 1000);
	}

	normalizeReconnectInterval(value) {
		if (typeof value === "number" && Number.isFinite(value)) {
			return this.clampInterval(value);
		}

		const parsed = Number(value);
		if (Number.isFinite(parsed)) {
			return this.clampInterval(parsed);
		}

		return DEFAULT_RECONNECT_INTERVAL;
	}

	clampInterval(value) {
		const rounded = Math.round(value);
		return Math.min(
			Math.max(rounded, MIN_RECONNECT_INTERVAL),
			MAX_RECONNECT_INTERVAL,
		);
	}

	async processEvent(data) {
		const eventType = data.event || data.type;

		if (!eventType) {
			return;
		}

		switch (eventType) {
			case EVENT_TYPES.CONNECTED:
				await this.handleConnectedEvent(data);
				break;

			case EVENT_TYPES.STREAM_END:
				await this.handleStreamEndEvent(data);
				break;

			case EVENT_TYPES.ROOM_USER:
				await this.handleRoomUserEvent(data);
				break;

			case EVENT_TYPES.MEMBER:
				await this.handleMemberEvent(data);
				break;

			case EVENT_TYPES.CHAT:
				await this.handleChatEvent(data);
				break;

			case EVENT_TYPES.GIFT:
				await this.handleGiftEvent(data);
				break;

			case EVENT_TYPES.FOLLOW:
				await this.handleFollowEvent(data);
				break;

			case EVENT_TYPES.SHARE:
				await this.handleShareEvent(data);
				break;

			case EVENT_TYPES.LIKE:
				await this.handleLikeEvent(data);
				break;

			case EVENT_TYPES.SUBSCRIBE:
				await this.handleSubscribeEvent(data);
				break;

			case EVENT_TYPES.ERROR:
				await this.handleErrorEvent(data);
				break;

			default:
				await this.lumia.addLog(
					`[Tikfinity] Unknown event type: ${eventType}`,
				);
		}
	}

	async handleConnectedEvent(data) {
		// Stream has started
		if (!this.sessionData.live) {
			this.sessionData.live = true;
			this.sessionData.title = coerceString(data.title || data.roomTitle, "");

			await this.updateVariable("tikfinity_live", true);
			await this.updateVariable("tikfinity_title", this.sessionData.title);

			await this.lumia.triggerAlert({
				alert: ALERT_TYPES.STREAM_START,
				dynamic: {
					name: this.sessionData.title,
				},
				extraSettings: {
					...this.buildAlertVariables(),
					title: this.sessionData.title,
				},
			});
		}
	}

	async handleStreamEndEvent(data) {
		if (this.sessionData.live) {
			this.sessionData.live = false;

			await this.updateVariable("tikfinity_live", false);

			await this.lumia.triggerAlert({
				alert: ALERT_TYPES.STREAM_END,
				extraSettings: {
					...this.buildAlertVariables(),
					viewers: this.sessionData.viewers,
					likes: this.sessionData.likes,
					diamonds: this.sessionData.diamonds,
					followers: this.sessionData.followers,
					shares: this.sessionData.shares,
				},
			});

			// Reset session data
			this.sessionData = this.createEmptySession();
			this.seenFollowers.clear();
		}
	}

	async handleRoomUserEvent(data) {
		const viewers = coerceNumber(data.viewerCount || data.viewers, 0);
		this.sessionData.viewers = viewers;
		await this.updateVariable("tikfinity_viewers", viewers);
	}

	async handleMemberEvent(data) {
		const totalViewers = this.sessionData.totalViewers + 1;
		this.sessionData.totalViewers = totalViewers;
		await this.updateVariable("tikfinity_total_viewers", totalViewers);
	}

	async handleChatEvent(data) {
		const username = coerceString(data.uniqueId || data.username, "");
		const message = coerceString(data.comment || data.message, "");
		const displayname = coerceString(data.nickname || data.displayName || username, "");
		const avatar = normalizeAvatar(
			data.profilePictureUrl || data.avatar || data.profilePicture,
		);

		if (!username || !message) {
			return;
		}

		this.sessionData.lastChatter = username;
		await this.updateVariable("tikfinity_last_chatter", username);

		// Display chat in Lumia
		await this.lumia.displayChat({
			platform: "tikfinity",
			username,
			displayname,
			message,
			avatar: avatar || undefined,
			messageId: `tikfinity-${Date.now()}-${username}`,
		});

		// Optionally trigger chat alert
		// await this.lumia.triggerAlert({
		// 	alert: ALERT_TYPES.CHAT,
		// 	extraSettings: {
		// 		...this.buildAlertVariables(),
		// 		username,
		// 		displayname,
		// 		message,
		// 		avatar,
		// 	},
		// });
	}

	finalizeGiftStreak = (giftKey) => {
		const streak = this.giftStreaks.get(giftKey);
		if (!streak) return;

		const { data } = streak;
		const username = coerceString(data.uniqueId || data.username, "");
		const giftName = coerceString(data.giftName, "Gift");
		const diamondCount = coerceNumber(data.diamondCount || data.diamonds, 1);
		const finalRepeatCount = streak.lastCount || coerceNumber(data.repeatCount, 1);
		const totalDiamonds = diamondCount * finalRepeatCount;

		this.sessionData.diamonds += totalDiamonds;
		this.sessionData.lastGifter = username;

		void this.updateVariable("tikfinity_diamonds", this.sessionData.diamonds);
		void this.updateVariable("tikfinity_last_gifter", username);

		void this.lumia.triggerAlert({
			alert: ALERT_TYPES.GIFT,
			dynamic: {
				value: totalDiamonds,
				name: giftName,
			},
			extraSettings: {
				...this.buildAlertVariables(),
				username,
				giftName,
				giftAmount: finalRepeatCount,
				diamonds: totalDiamonds,
				diamondCount,
			},
		});

		clearTimeout(streak.timer);
		this.giftStreaks.delete(giftKey);
	};

	async handleGiftEvent(data) {
		const username = coerceString(data.uniqueId || data.username, "");
		const giftId = coerceString(data.giftId, "");
		const giftName = coerceString(data.giftName, "Gift");
		const diamondCount = coerceNumber(data.diamondCount || data.diamonds, 1);
		const repeatCount = coerceNumber(data.repeatCount, 1);
		const repeatEnd = coerceBoolean(data.repeatEnd, false);
		const giftType = coerceNumber(data.giftType, 0);

		if (!username) {
			return;
		}

		const giftKey = `${username}_${giftId}`;

		// Handle repeatable gifts with streak management (giftType 1)
		if (giftType === 1 && !repeatEnd) {
			const existingStreak = this.giftStreaks.get(giftKey);

			if (existingStreak) {
				clearTimeout(existingStreak.timer);
			}

			const timer = setTimeout(() => {
				this.finalizeGiftStreak(giftKey);
			}, this.GIFT_FINALIZE_TIMEOUT);

			this.giftStreaks.set(giftKey, {
				timer,
				lastCount: repeatCount,
				data,
			});

			return;
		}

		// Handle end of streak or non-repeatable gifts
		if (giftType === 1 && repeatEnd) {
			const existingStreak = this.giftStreaks.get(giftKey);
			if (existingStreak) {
				clearTimeout(existingStreak.timer);
				this.giftStreaks.delete(giftKey);
			}
		}

		// Process non-repeatable gifts or final gift in streak
		if (giftType !== 1 || repeatEnd) {
			const totalDiamonds = diamondCount * repeatCount;

			this.sessionData.diamonds += totalDiamonds;
			this.sessionData.lastGifter = username;

			await this.updateVariable("tikfinity_diamonds", this.sessionData.diamonds);
			await this.updateVariable("tikfinity_last_gifter", username);

			await this.lumia.triggerAlert({
				alert: ALERT_TYPES.GIFT,
				dynamic: {
					value: totalDiamonds,
					name: giftName,
				},
				extraSettings: {
					...this.buildAlertVariables(),
					username,
					giftName,
					giftAmount: repeatCount,
					diamonds: totalDiamonds,
					diamondCount,
				},
			});
		}
	}

	async handleFollowEvent(data) {
		const username = coerceString(data.uniqueId || data.username, "");

		if (!username || this.seenFollowers.has(username)) {
			return;
		}

		this.seenFollowers.add(username);
		this.sessionData.followers++;
		this.sessionData.lastFollower = username;

		await this.updateVariable("tikfinity_followers", this.sessionData.followers);
		await this.updateVariable("tikfinity_last_follower", username);

		await this.lumia.triggerAlert({
			alert: ALERT_TYPES.FOLLOW,
			extraSettings: {
				...this.buildAlertVariables(),
				username,
			},
		});
	}

	async handleShareEvent(data) {
		const username = coerceString(data.uniqueId || data.username, "");

		if (!username) {
			return;
		}

		this.sessionData.shares++;

		await this.updateVariable("tikfinity_shares", this.sessionData.shares);

		await this.lumia.triggerAlert({
			alert: ALERT_TYPES.SHARE,
			extraSettings: {
				...this.buildAlertVariables(),
				username,
			},
		});
	}

	async handleLikeEvent(data) {
		const username = coerceString(data.uniqueId || data.username, "");
		const likeCount = coerceNumber(data.likeCount, 1);
		const totalLikeCount = coerceNumber(data.totalLikeCount, 0);

		this.sessionData.likes = totalLikeCount || this.sessionData.likes + likeCount;

		await this.updateVariable("tikfinity_likes", this.sessionData.likes);

		await this.lumia.triggerAlert({
			alert: ALERT_TYPES.LIKE,
			dynamic: {
				value: likeCount,
				total: this.sessionData.likes,
			},
			extraSettings: {
				...this.buildAlertVariables(),
				username,
				likeCount,
				totalLikes: this.sessionData.likes,
			},
		});
	}

	async handleSubscribeEvent(data) {
		const username = coerceString(data.uniqueId || data.username, "");

		if (!username) {
			return;
		}

		await this.lumia.triggerAlert({
			alert: ALERT_TYPES.SUBSCRIBE,
			extraSettings: {
				...this.buildAlertVariables(),
				username,
			},
		});
	}

	async handleErrorEvent(data) {
		const message = coerceString(data.message || data.error, "Unknown error");
		await this.lumia.addLog(`[Tikfinity] Server error: ${message}`);
	}

	buildAlertVariables() {
		return {
			tikfinity_connected: this.ws?.readyState === 1,
			tikfinity_live: this.sessionData.live,
			tikfinity_viewers: this.sessionData.viewers,
			tikfinity_total_viewers: this.sessionData.totalViewers,
			tikfinity_title: this.sessionData.title,
			tikfinity_likes: this.sessionData.likes,
			tikfinity_diamonds: this.sessionData.diamonds,
			tikfinity_followers: this.sessionData.followers,
			tikfinity_shares: this.sessionData.shares,
			tikfinity_last_chatter: this.sessionData.lastChatter,
			tikfinity_last_gifter: this.sessionData.lastGifter,
			tikfinity_last_follower: this.sessionData.lastFollower,
		};
	}

	async updateVariable(name, value) {
		try {
			await this.lumia.setVariable(name, value);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			await this.lumia.addLog(
				`[Tikfinity] Error updating variable ${name}: ${message}`,
			);
		}
	}
}

module.exports = TikfinityPlugin;
