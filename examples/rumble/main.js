const { Plugin } = require("@lumiastream/plugin");

// Default polling cadence (seconds) that balances freshness with API limits.
const DEFAULT_POLL_INTERVAL = 30;
// Hard floor/ceiling so user input cannot hammer or starve the API.
const MIN_POLL_INTERVAL = 10;
const MAX_POLL_INTERVAL = 300;
// Ignore insignificant float drift when calculating rant tips.
const RANT_AMOUNT_EPSILON = 0.01;

// Alert identifiers aligned with Lumia's built-in conventions.
const ALERT_TYPES = {
	STREAM_START: "streamStarted",
	STREAM_END: "streamEnded",
	FOLLOWER: "follower",
	RANT: "rant",
	LIKE: "like",
	DISLIKE: "dislike",
	SUB: "sub",
	SUB_GIFT: "subGift",
};

// Rumble payloads have evolved; probe the current `livestreams`/`followers` shape first.
const FIELD_PATHS = {
	live: [
		["livestreams", 0, "is_live"],
		["livestreams", 0, "live"],
		["livestreams", 0, "status"],
	],
	viewers: [
		["livestreams", 0, "watching_now"],
		["livestreams", 0, "num_viewers"],
		["livestreams", 0, "viewers"],
	],
	joined: [
		["livestreams", 0, "num_viewers_total"],
		["livestreams", 0, "total_viewers"],
	],
	title: [["livestreams", 0, "title"]],
	thumbnail: [
		["livestreams", 0, "thumbnail_url"],
		["livestreams", 0, "thumbnail"],
		["livestreams", 0, "image_url"],
	],
	streamUrl: [
		["livestreams", 0, "watch_url"],
		["livestreams", 0, "share_url"],
	],
	videoId: [
		["livestreams", 0, "id"],
		["livestreams", 0, "video_id"],
	],
	rumbles: [
		["livestreams", 0, "num_rumbles"],
		["livestreams", 0, "rumbles"],
	],
	rants: [
		["livestreams", 0, "num_rants"],
		["livestreams", 0, "rants"],
	],
	rantAmount: [
		["livestreams", 0, "total_rant_amount"],
		["livestreams", 0, "rant_amount_total"],
	],
	followers: [
		["followers", "num_followers"],
		["followers", "num_followers_total"],
	],
	likes: [
		["livestreams", 0, "num_likes"],
		["livestreams", 0, "likes"],
	],
	dislikes: [
		["livestreams", 0, "num_dislikes"],
		["livestreams", 0, "dislikes"],
	],
	subs: [["subscribers", "num_subscribers"]],
	subGifts: [["gifted_subs", "num_gifted_subs"]],
	chatMembers: [
		["livestreams", 0, "chat_members"],
		["livestreams", 0, "num_chatters"],
	],
	category: [["livestreams", 0, "category"]],
	description: [["livestreams", 0, "description"]],
	language: [["livestreams", 0, "language"]],
	chatUrl: [["livestreams", 0, "chat_url"]],
	channelName: [["channel_name"], ["username"]],
	channelImage: [["channel_image"], ["channel_icon_url"]],
	startedAt: [
		["livestreams", 0, "started_on"],
		["livestreams", 0, "started_at"],
	],
	scheduledStart: [
		["livestreams", 0, "scheduled_start"],
		["livestreams", 0, "scheduled_on"],
	],
};

// Simple helpers: resolve nested properties and coerce API values to primitives.
function resolvePath(source, path) {
	let current = source;
	for (const part of path) {
		if (current == null) {
			return undefined;
		}
		current = current[part];
	}
	return current;
}

function pickFirst(source, paths = [], fallback) {
	for (const path of paths) {
		const value = resolvePath(source, path);
		if (value !== undefined && value !== null) {
			return value;
		}
	}
	return fallback;
}

function coerceNumber(value, fallback = 0) {
	// Many counters ship as strings; normalise to a finite numeric value.
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
	// Accept booleans, stringified booleans, or numeric 0/1 style responses.
	if (typeof value === "boolean") {
		return value;
	}
	if (typeof value === "number") {
		return value !== 0;
	}
	if (typeof value === "string") {
		const normalized = value.trim().toLowerCase();
		if (
			normalized === "true" ||
			normalized === "yes" ||
			normalized === "on" ||
			normalized === "live" ||
			normalized === "online"
		) {
			return true;
		}
		if (
			normalized === "false" ||
			normalized === "no" ||
			normalized === "off" ||
			normalized === "offline" ||
			normalized === "ended"
		) {
			return false;
		}
		const parsed = Number(value);
		if (Number.isFinite(parsed)) {
			return parsed !== 0;
		}
	}
	return fallback;
}

function coerceString(value, fallback = "") {
	// Provide a string for template usage even if the payload is null/number.
	if (typeof value === "string") {
		return value;
	}
	if (value === null || value === undefined) {
		return fallback;
	}
	return String(value);
}

function roundToTwo(value) {
	// Useful for currency-style outputs (Rumble rants report cents).
	const numeric = coerceNumber(value, 0);
	return Math.round(numeric * 100) / 100;
}

function parseTimestamp(value) {
	// Accept ISO strings, seconds, milliseconds, or Date instances.
	if (value === null || value === undefined) {
		return null;
	}

	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? null : value;
	}

	if (typeof value === "number" && Number.isFinite(value)) {
		const treated = value > 1e12 ? value : value * 1000;
		const date = new Date(treated);
		return Number.isNaN(date.getTime()) ? null : date;
	}

	if (typeof value === "string") {
		const trimmed = value.trim();
		if (!trimmed.length) {
			return null;
		}

		const numeric = Number(trimmed);
		if (Number.isFinite(numeric)) {
			return parseTimestamp(numeric);
		}

		const date = new Date(trimmed);
		return Number.isNaN(date.getTime()) ? null : date;
	}

	return null;
}

function normalizeBadges(value) {
	if (Array.isArray(value)) {
		return value
			.map((badge) => normalizeBadgeUrl(coerceString(badge, "")))
			.filter(Boolean);
	}

	if (typeof value === "string") {
		const trimmed = value.trim();
		if (!trimmed.length) {
			return [];
		}
		const parts = trimmed.includes(",")
			? trimmed.split(",").map((badge) => badge.trim())
			: [trimmed];
		return parts.map((badge) => normalizeBadgeUrl(badge)).filter(Boolean);
	}

	if (value && typeof value === "object") {
		const candidate =
			coerceString(value.url, "") ||
			coerceString(value.image, "") ||
			coerceString(value.icon, "") ||
			coerceString(value.badge, "") ||
			coerceString(value.badge_url, "") ||
			coerceString(value.badgeUrl, "") ||
			coerceString(value.src, "");
		const normalized = normalizeBadgeUrl(candidate);
		return normalized ? [normalized] : [];
	}

	return [];
}

function normalizeBadgeUrl(value) {
	if (!value || typeof value !== "string") {
		return "";
	}
	const trimmed = value.trim();
	if (!trimmed.length) {
		return "";
	}
	// Rumble chat can send badge names like "admin" without a path.
	if (!/[/.]/.test(trimmed)) {
		return `https://rumble.com/i/badges/${trimmed}_48.png`;
	}
	if (/^https?:\/\//i.test(trimmed)) {
		return trimmed;
	}
	if (trimmed.startsWith("//")) {
		return `https:${trimmed}`;
	}
	if (trimmed.startsWith("/")) {
		return `https://rumble.com${trimmed}`;
	}
	return `https://rumble.com/${trimmed}`;
}

function buildAlertVariables(state) {
	if (!state) {
		return {};
	}
	return {
		rumble_live: state.live,
		rumble_viewers: state.viewers,
		rumble_title: state.title,
		rumble_stream_url: state.streamUrl,
		rumble_followers: state.followers,
		rumble_likes: state.likes,
		rumble_dislikes: state.dislikes,
		rumble_subs: state.subs,
		rumble_sub_gifts: state.subGifts,
		rumble_rants: state.rants,
		rumble_rant_amount: roundToTwo(state.rantAmount),
	};
}

function normalizeAvatar(value) {
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed.length ? trimmed : "";
	}

	if (value && typeof value === "object") {
		return (
			coerceString(value.url, "") ||
			coerceString(value.image, "") ||
			coerceString(value.avatar, "") ||
			coerceString(value.src, "")
		);
	}

	return "";
}

function extractChatAvatar(message) {
	if (!message || typeof message !== "object") {
		return "";
	}

	return (
		normalizeAvatar(message.avatar) ||
		normalizeAvatar(message.profile_pic_url) ||
		normalizeAvatar(message.user_image) ||
		normalizeAvatar(message.user_image_url) ||
		normalizeAvatar(message.profile_image) ||
		normalizeAvatar(message.profile_image_url) ||
		normalizeAvatar(message.image) ||
		normalizeAvatar(message.thumbnail) ||
		normalizeAvatar(message.user?.avatar) ||
		normalizeAvatar(message.user?.image) ||
		normalizeAvatar(message.user?.profile_image) ||
		normalizeAvatar(message.user?.profile_image_url)
	);
}

function parseChatTimestamp(value) {
	const parsed = parseTimestamp(value);
	return parsed ? parsed.getTime() : 0;
}

// Top-level plugin that polls the API, tracks session state, and surfaces events to Lumia.
class RumblePlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);

		this.pollIntervalId = null;
		this.lastKnownState = this.createEmptyState();
		this.sessionData = this.createEmptySession();
		this.hasBaseline = false;
		this.streamCounter = 0;
		this.chatState = this.createEmptyChatState();
		this.chatHasBaseline = false;
	}

	createEmptyState() {
		// Defaults for every variable we expose so first poll starts populated.
		return {
			live: false,
			viewers: 0,
			joined: 0,
			title: "",
			thumbnail: "",
			streamUrl: "",
			videoId: "",
			rumbles: 0,
			rants: 0,
			rantAmount: 0,
			followers: 0,
			likes: 0,
			dislikes: 0,
			subs: 0,
			subGifts: 0,
			chatMembers: 0,
			category: "",
			description: "",
			language: "",
			chatUrl: "",
			channelName: "",
			channelImage: "",
			startedAt: null,
			scheduledStart: null,
		};
	}

	createEmptyChatState() {
		return {
			lastTimestamp: 0,
			seenKeys: new Set(),
			seenOrder: [],
		};
	}

	createEmptySession() {
		// Per-stream counters that reset when the broadcast ends.
		return {
			streamStartTime: null,
			lastRantsCount: 0,
			lastRantAmount: 0,
		};
	}

	get currentSettings() {
		return this.settings || {};
	}

	get apiKey() {
		return this.extractApiKey(this.currentSettings.apiKey);
	}

	async onload() {
		await this.lumia.addLog("[Rumble] Plugin loading...");

		if (this.apiKey) {
			await this.startPolling({ showToast: false });
		}

		await this.lumia.addLog("[Rumble] Plugin loaded");
	}

	async onunload() {
		await this.lumia.addLog("[Rumble] Plugin unloading...");
		await this.stopPolling(false);
		await this.lumia.addLog("[Rumble] Plugin unloaded");
	}

	async onsettingsupdate(settings, previousSettings) {
		const next = settings || {};
		const previous = previousSettings || {};

		const nextApiKey = this.extractApiKey(next.apiKey);
		const prevApiKey = this.extractApiKey(previous.apiKey);

		const nextInterval = this.normalizePollInterval(next.pollInterval);
		const prevInterval = this.normalizePollInterval(previous.pollInterval);

		const apiKeyChanged = nextApiKey !== prevApiKey;
		const intervalChanged = nextInterval !== prevInterval;

		if (!nextApiKey) {
			await this.stopPolling(false);
			return;
		}

		if (!this.pollIntervalId) {
			await this.startPolling({ showToast: false });
			return;
		}

		if (apiKeyChanged || intervalChanged) {
			await this.stopPolling(false);
			await this.startPolling({ showToast: false });
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
					case "manual_poll": {
						await this.pollAPI();
						await this.lumia.addLog("[Rumble] Manual poll triggered");
						break;
					}

					case "manual_alert": {
						await this.lumia.triggerAlert({
							alert: ALERT_TYPES.STREAM_START,
							extraSettings: {
								...buildAlertVariables(this.lastKnownState),
								title: this.lastKnownState.title,
								thumbnail: this.lastKnownState.thumbnail || "",
								viewers: this.lastKnownState.viewers,
								streamNumber: this.streamCounter,
								streamUrl: this.lastKnownState.streamUrl,
							},
						});
						await this.lumia.addLog("[Rumble] Manual alert triggered");
						break;
					}

					default: {
						await this.lumia.addLog(
							`[Rumble] Unknown action type: ${action.type}`,
						);
					}
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				await this.lumia.addLog(`[Rumble] Action failed: ${message}`);
			}
		}
	}

	// Lumia runs this during setup to confirm the key is valid before saving it.
	async validateAuth(data = {}) {
		try {
			const apiKey = this.extractApiKey(data.apiKey);
			if (!apiKey) {
				return false;
			}

			await this.fetchStreamData(apiKey);
			return true;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			await this.lumia.addLog(`[Rumble] Auth validation failed: ${message}`);
			return false;
		}
	}

	// Trim whitespace and discard empty strings so settings checks stay clean.
	extractApiKey(value) {
		if (typeof value !== "string") {
			return undefined;
		}
		const trimmed = value.trim();
		if (!trimmed.length) {
			return undefined;
		}

		try {
			const asUrl = new URL(trimmed);
			const keyParam = asUrl.searchParams.get("key");
			if (keyParam) {
				return keyParam.trim() || undefined;
			}
		} catch {
			// Not a URL – fall through to treating it as the raw key
		}

		return trimmed;
	}

	// Kick off the polling interval and optionally inform the user via toast.
	async startPolling(options = {}) {
		const { showToast = true } = options;

		if (!this.apiKey) {
			await this.lumia.addLog("[Rumble] Missing API key, cannot start polling");
			if (showToast) {
				await this.lumia.showToast({
					message: "Rumble API key required to poll",
				});
			}
			return;
		}

		if (this.pollIntervalId) {
			return;
		}

		const normalizedInterval = this.normalizePollInterval(
			this.currentSettings.pollInterval,
		);

		if (normalizedInterval !== this.currentSettings.pollInterval) {
			// Persist the clamped value so the UI reflects what we are using.
			this.updateSettings({ pollInterval: normalizedInterval });
		}

		await this.pollAPI();

		this.pollIntervalId = setInterval(() => {
			// Avoid awaiting the result here so the timer keeps its cadence.
			void this.pollAPI();
		}, normalizedInterval * 1000);

		if (showToast) {
			await this.lumia.showToast({
				message: `Started polling Rumble API (${normalizedInterval}s)`,
			});
		}

		await this.lumia.updateConnection(true);
	}

	// Halt polling and let Lumia know the integration is disconnected.
	async stopPolling(showToast = true) {
		if (this.pollIntervalId) {
			clearInterval(this.pollIntervalId);
			this.pollIntervalId = null;
		}

		if (showToast) {
			await this.lumia.showToast({ message: "Stopped polling Rumble API" });
		}

		await this.lumia.updateConnection(false);
	}

	// Poll the Rumble endpoint once, then delegate processing to the diff logic.
	async pollAPI() {
		try {
			const apiKey = this.apiKey;
			if (!apiKey) {
				await this.lumia.addLog(
					"[Rumble] Poll skipped: API key not configured",
				);
				return;
			}

			const data = await this.fetchStreamData(apiKey);
			await this.processStreamData(data);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			await this.lumia.addLog(`[Rumble] Error polling API: ${message}`);
		}
	}

	buildStateFromData(data = {}) {
		// Flatten the API payload into a canonical structure with sensible defaults.
		const state = this.createEmptyState();

		state.live = coerceBoolean(pickFirst(data, FIELD_PATHS.live), false);
		state.viewers = coerceNumber(pickFirst(data, FIELD_PATHS.viewers));
		state.joined = coerceNumber(pickFirst(data, FIELD_PATHS.joined));
		state.title = coerceString(pickFirst(data, FIELD_PATHS.title), "");
		state.thumbnail = coerceString(pickFirst(data, FIELD_PATHS.thumbnail), "");
		state.streamUrl = coerceString(pickFirst(data, FIELD_PATHS.streamUrl), "");
		state.videoId = coerceString(pickFirst(data, FIELD_PATHS.videoId), "");
		state.rumbles = coerceNumber(pickFirst(data, FIELD_PATHS.rumbles));
		state.rants = coerceNumber(pickFirst(data, FIELD_PATHS.rants));
		state.rantAmount = coerceNumber(pickFirst(data, FIELD_PATHS.rantAmount), 0);
		state.followers = coerceNumber(
			pickFirst(data, FIELD_PATHS.followers),
			this.lastKnownState.followers || 0,
		);
		state.likes = coerceNumber(pickFirst(data, FIELD_PATHS.likes));
		state.dislikes = coerceNumber(pickFirst(data, FIELD_PATHS.dislikes));
		state.subs = coerceNumber(pickFirst(data, FIELD_PATHS.subs));
		state.subGifts = coerceNumber(pickFirst(data, FIELD_PATHS.subGifts));
		state.chatMembers = coerceNumber(
			pickFirst(data, FIELD_PATHS.chatMembers),
			0,
		);
		state.category = coerceString(pickFirst(data, FIELD_PATHS.category), "");
		state.description = coerceString(
			pickFirst(data, FIELD_PATHS.description),
			"",
		);
		state.language = coerceString(pickFirst(data, FIELD_PATHS.language), "");
		state.chatUrl = coerceString(pickFirst(data, FIELD_PATHS.chatUrl), "");
		state.channelName = coerceString(
			pickFirst(data, FIELD_PATHS.channelName),
			"",
		);
		state.channelImage = coerceString(
			pickFirst(data, FIELD_PATHS.channelImage),
			"",
		);
		state.startedAt = parseTimestamp(pickFirst(data, FIELD_PATHS.startedAt));
		state.scheduledStart = parseTimestamp(
			pickFirst(data, FIELD_PATHS.scheduledStart),
		);

		return state;
	}

	// Main processing loop: handle lifecycle changes, detect counters, and persist variables.
	async processStreamData(data = {}) {
		const state = this.buildStateFromData(data);
		const previous = this.lastKnownState;
		const hadBaseline = this.hasBaseline;

		if (state.live && !previous.live) {
			await this.handleStreamStart(data, state);
		} else if (!state.live && previous.live) {
			await this.handleStreamEnd(state);
		}

		if (hadBaseline) {
			await Promise.all([
				this.checkFollowerChange(state, previous),
				this.checkLikes(state, previous),
				this.checkDislikes(state, previous),
				this.checkSubs(state, previous),
				this.checkSubGifts(state, previous),
				this.checkRants(state, previous),
			]);
		} else {
			this.sessionData.lastRantsCount = state.rants;
			this.sessionData.lastRantAmount = state.rantAmount;
		}

		await this.updateVariables(state, previous, !hadBaseline);
		if (state.live) {
			await this.processChatMessages(data);
		} else if (this.chatHasBaseline) {
			this.resetChatState();
		}
		this.lastKnownState = state;
		this.hasBaseline = true;
	}

	// Push the latest payload values into Lumia variables for automations and overlays.
	async updateVariables(state, previousState, forceAll = false) {
		const startedIso = state.startedAt ? state.startedAt.toISOString() : "";
		const prevStartedIso = previousState?.startedAt
			? previousState.startedAt.toISOString()
			: "";
		const scheduledIso = state.scheduledStart
			? state.scheduledStart.toISOString()
			: "";
		const prevScheduledIso = previousState?.scheduledStart
			? previousState.scheduledStart.toISOString()
			: "";
		const nowIso = new Date().toISOString();
		const prevRantAmount = previousState
			? roundToTwo(previousState.rantAmount)
			: null;

		const updates = [];
		const setIfChanged = (key, value, previousValue) => {
			if (forceAll || previousValue !== value) {
				updates.push(this.lumia.setVariable(key, value));
			}
		};

		setIfChanged("rumble_live", state.live, previousState?.live);
		setIfChanged("rumble_viewers", state.viewers, previousState?.viewers);
		setIfChanged("rumble_joined", state.joined, previousState?.joined);
		setIfChanged("rumble_title", state.title, previousState?.title);
		setIfChanged("rumble_thumbnail", state.thumbnail, previousState?.thumbnail);
		setIfChanged(
			"rumble_stream_url",
			state.streamUrl,
			previousState?.streamUrl,
		);
		setIfChanged("rumble_video_id", state.videoId, previousState?.videoId);
		setIfChanged("rumble_rumbles", state.rumbles, previousState?.rumbles);
		setIfChanged("rumble_followers", state.followers, previousState?.followers);
		setIfChanged("rumble_likes", state.likes, previousState?.likes);
		setIfChanged("rumble_dislikes", state.dislikes, previousState?.dislikes);
		setIfChanged("rumble_subs", state.subs, previousState?.subs);
		setIfChanged("rumble_sub_gifts", state.subGifts, previousState?.subGifts);
		setIfChanged("rumble_rants", state.rants, previousState?.rants);
		setIfChanged(
			"rumble_rant_amount",
			roundToTwo(state.rantAmount),
			prevRantAmount,
		);
		setIfChanged(
			"rumble_chat_members",
			state.chatMembers,
			previousState?.chatMembers,
		);
		setIfChanged("rumble_category", state.category, previousState?.category);
		setIfChanged(
			"rumble_description",
			state.description,
			previousState?.description,
		);
		setIfChanged("rumble_language", state.language, previousState?.language);
		setIfChanged("rumble_chat_url", state.chatUrl, previousState?.chatUrl);
		setIfChanged(
			"rumble_channel_name",
			state.channelName,
			previousState?.channelName,
		);
		setIfChanged(
			"rumble_channel_image",
			state.channelImage,
			previousState?.channelImage,
		);
		setIfChanged("rumble_started_at", startedIso, prevStartedIso);
		setIfChanged("rumble_scheduled_start", scheduledIso, prevScheduledIso);
		setIfChanged("rumble_last_polled", nowIso, previousState?.lastPolledIso);

		if (updates.length) {
			await Promise.all(updates);
		}

		// Store derived timestamps so we can compare next loop without recomputing.
		state.lastPolledIso = nowIso;
	}

	// When a stream flips from offline to live, start a new session and alert.
	async handleStreamStart(rawData, state) {
		this.resetChatState();
		this.sessionData = this.createEmptySession();
		this.sessionData.streamStartTime = new Date();
		this.sessionData.lastRantsCount = state.rants;
		this.sessionData.lastRantAmount = state.rantAmount;
		this.streamCounter += 1;

		await this.lumia.triggerAlert({
			alert: ALERT_TYPES.STREAM_START,
			dynamic: {
				name: state.title,
				value: this.streamCounter,
			},
			extraSettings: {
				...buildAlertVariables(state),
				title: state.title,
				thumbnail: state.thumbnail,
				viewers: state.viewers,
				streamNumber: this.streamCounter,
				streamUrl: state.streamUrl,
				channelName: state.channelName,
				startedAt: state.startedAt ? state.startedAt.toISOString() : "",
				scheduledStart: state.scheduledStart
					? state.scheduledStart.toISOString()
					: "",
				followers: state.followers,
				likes: state.likes,
				dislikes: state.dislikes,
				subs: state.subs,
				subGifts: state.subGifts,
				rumbles: state.rumbles,
				rants: state.rants,
				rantAmount: roundToTwo(state.rantAmount),
				raw: rawData,
			},
		});
	}

	// Stream has gone offline: summarise the session and clean up session state.
	async handleStreamEnd(state) {
		const now = Date.now();
		const startTime = this.sessionData.streamStartTime
			? this.sessionData.streamStartTime.getTime()
			: now;
		const durationMs = Math.max(now - startTime, 0);
		const durationMinutes = Math.floor(durationMs / 60000);

		await this.lumia.triggerAlert({
			alert: ALERT_TYPES.STREAM_END,
			dynamic: {
				value: state.viewers,
				total: this.streamCounter,
			},
			extraSettings: {
				...buildAlertVariables(state),
				streamNumber: this.streamCounter,
				finalViewers: state.viewers,
				durationMinutes,
				durationMs,
				followers: state.followers,
				likes: state.likes,
				dislikes: state.dislikes,
				subs: state.subs,
				subGifts: state.subGifts,
				rants: state.rants,
				rantAmountTotal: roundToTwo(state.rantAmount),
				streamUrl: state.streamUrl,
				channelName: state.channelName,
			},
		});

		this.sessionData.streamStartTime = null;
		this.resetChatState();
	}

	// Emit a follower alert whenever the cumulative follower total increases.
	async checkFollowerChange(state, previous) {
		const delta = state.followers - (previous.followers || 0);
		if (delta <= 0) {
			return;
		}

		await this.lumia.triggerAlert({
			alert: ALERT_TYPES.FOLLOWER,
			showInEventList: true,
			dynamic: {
				value: delta,
				total: state.followers,
			},
			extraSettings: {
				...buildAlertVariables(state),
				newFollowers: delta,
				totalFollowers: state.followers,
				streamUrl: state.streamUrl,
				title: state.title,
			},
		});
	}

	// Emit when net likes increase.
	async checkLikes(state, previous) {
		const delta = state.likes - (previous.likes || 0);
		if (delta <= 0) {
			return;
		}

		await this.lumia.triggerAlert({
			alert: ALERT_TYPES.LIKE,
			showInEventList: true,
			dynamic: {
				value: delta,
				total: state.likes,
			},
			extraSettings: {
				...buildAlertVariables(state),
				newLikes: delta,
				totalLikes: state.likes,
				streamUrl: state.streamUrl,
				title: state.title,
			},
		});
	}

	// Emit when net dislikes increase.
	async checkDislikes(state, previous) {
		const delta = state.dislikes - (previous.dislikes || 0);
		if (delta <= 0) {
			return;
		}

		await this.lumia.triggerAlert({
			alert: ALERT_TYPES.DISLIKE,
			showInEventList: true,
			dynamic: {
				value: delta,
				total: state.dislikes,
			},
			extraSettings: {
				...buildAlertVariables(state),
				newDislikes: delta,
				totalDislikes: state.dislikes,
				streamUrl: state.streamUrl,
				title: state.title,
			},
		});
	}

	// Emit when paid subs/memberships increase.
	async checkSubs(state, previous) {
		const delta = state.subs - (previous.subs || 0);
		if (delta <= 0) {
			return;
		}

		await this.lumia.triggerAlert({
			alert: ALERT_TYPES.SUB,
			showInEventList: true,
			dynamic: {
				value: delta,
				total: state.subs,
			},
			extraSettings: {
				...buildAlertVariables(state),
				newSubs: delta,
				totalSubs: state.subs,
				streamUrl: state.streamUrl,
				title: state.title,
			},
		});
	}

	// Emit when gifted subs increase.
	async checkSubGifts(state, previous) {
		const delta = state.subGifts - (previous.subGifts || 0);
		if (delta <= 0) {
			return;
		}

		await this.lumia.triggerAlert({
			alert: ALERT_TYPES.SUB_GIFT,
			showInEventList: true,
			dynamic: {
				value: delta,
				total: state.subGifts,
			},
			extraSettings: {
				...buildAlertVariables(state),
				newGiftSubs: delta,
				totalGiftSubs: state.subGifts,
				streamUrl: state.streamUrl,
				title: state.title,
			},
		});
	}

	// Emit when the stream receives new rants or the total rant amount increases.
	async checkRants(state, previous) {
		const previousCount = previous.rants || 0;
		const previousAmount = previous.rantAmount || 0;
		const countDelta = state.rants - previousCount;
		const amountDelta = state.rantAmount - previousAmount;

		if (countDelta <= 0 && amountDelta <= RANT_AMOUNT_EPSILON) {
			return;
		}

		this.sessionData.lastRantsCount = state.rants;
		this.sessionData.lastRantAmount = state.rantAmount;

		await this.lumia.triggerAlert({
			alert: ALERT_TYPES.RANT,
			showInEventList: true,
			dynamic: {
				value: roundToTwo(amountDelta > 0 ? amountDelta : countDelta),
				total: roundToTwo(state.rantAmount),
			},
			extraSettings: {
				...buildAlertVariables(state),
				newRants: Math.max(countDelta, 0),
				rantsTotal: state.rants,
				rantAmountIncrement: roundToTwo(amountDelta),
				rantAmountTotal: roundToTwo(state.rantAmount),
				streamUrl: state.streamUrl,
				viewers: state.viewers,
				title: state.title,
			},
		});
	}

	resetChatState() {
		this.chatState = this.createEmptyChatState();
		this.chatHasBaseline = false;
	}

	extractChatMessages(rawData = {}) {
		const livestream = Array.isArray(rawData.livestreams)
			? rawData.livestreams[0]
			: null;
		const chat = livestream?.chat;
		if (!chat) {
			return [];
		}

		const recentMessages = Array.isArray(chat.recent_messages)
			? chat.recent_messages
			: [];
		const latestMessage = chat.latest_message ? [chat.latest_message] : [];
		const combined = [...recentMessages, ...latestMessage];

		const normalized = combined
			.map((message) => {
				const username = coerceString(message?.username, "");
				const text = coerceString(message?.text ?? message?.message, "");
				const timestamp = parseChatTimestamp(
					message?.created_on ?? message?.created_at,
				);
				return {
					username,
					text,
					timestamp,
					avatar: extractChatAvatar(message),
				};
			})
			.filter((message) => message.username && message.text);

		normalized.sort((a, b) => a.timestamp - b.timestamp);
		return normalized;
	}

	cacheChatKey(key) {
		this.chatState.seenKeys.add(key);
		this.chatState.seenOrder.push(key);
		const maxCacheSize = 200;
		if (this.chatState.seenOrder.length > maxCacheSize) {
			const overflow = this.chatState.seenOrder.length - maxCacheSize;
			const removed = this.chatState.seenOrder.splice(0, overflow);
			removed.forEach((oldKey) => this.chatState.seenKeys.delete(oldKey));
		}
	}

	async processChatMessages(rawData = {}) {
		const messages = this.extractChatMessages(rawData);
		if (!messages.length) {
			return;
		}

		if (!this.chatHasBaseline) {
			messages.forEach((message) => {
				const key = `${message.timestamp}:${message.username}:${message.text}`;
				this.cacheChatKey(key);
				this.chatState.lastTimestamp = Math.max(
					this.chatState.lastTimestamp,
					message.timestamp,
				);
			});
			this.chatHasBaseline = true;
			return;
		}

		for (const message of messages) {
			const key = `${message.timestamp}:${message.username}:${message.text}`;
			if (this.chatState.seenKeys.has(key)) {
				continue;
			}

			if (
				message.timestamp &&
				message.timestamp < this.chatState.lastTimestamp
			) {
				this.cacheChatKey(key);
				continue;
			}

			this.cacheChatKey(key);
			this.chatState.lastTimestamp = Math.max(
				this.chatState.lastTimestamp,
				message.timestamp,
			);

			this.lumia.displayChat({
				platform: "rumble",
				username: message.username,
				displayname: message.username,
				message: message.text,
				avatar: message.avatar || undefined,
				messageId: `rumble-${message.timestamp}-${message.username}`,
			});
		}
	}

	// Wraps the fetch call so we can centralise error handling and payload shape.
	async fetchStreamData(apiKey) {
		const url = `https://rumble.com/-livestream-api/get-data?key=${encodeURIComponent(
			apiKey,
		)}`;
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(
				`HTTP ${response.status}: ${response.statusText || "Request failed"}`,
			);
		}

		const payload = await response.json();
		if (payload && typeof payload === "object") {
			if ("data" in payload && payload.data) {
				return payload.data;
			}
			return payload;
		}

		throw new Error("Invalid response from Rumble API");
	}

	// Accept strings/numbers for the poll interval and clamp to our allowed window.
	normalizePollInterval(value) {
		if (typeof value === "number" && Number.isFinite(value)) {
			return this.clampInterval(value);
		}

		const parsed = Number(value);
		if (Number.isFinite(parsed)) {
			return this.clampInterval(parsed);
		}

		return DEFAULT_POLL_INTERVAL;
	}

	// Convert millisecond inputs to seconds and enforce min/max constraints.
	clampInterval(value) {
		const interpreted =
			value > MAX_POLL_INTERVAL && value >= MIN_POLL_INTERVAL * 1000
				? value / 1000
				: value;
		const rounded = Math.round(interpreted);
		return Math.min(Math.max(rounded, MIN_POLL_INTERVAL), MAX_POLL_INTERVAL);
	}
}

module.exports = RumblePlugin;
