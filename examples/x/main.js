const { Plugin } = require("@lumiastream/plugin");
const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");

const API_BASE_URL = "https://api.x.com";
const REQUEST_TIMEOUT_MS = 20000;
const DEFAULT_POLL_INTERVAL_SECONDS = 300;
const MIN_POLL_INTERVAL_SECONDS = 15;
const MAX_POLL_INTERVAL_SECONDS = 900;
const MAX_TRACKED_MENTION_IDS = 200;
const MAX_CHUNK_SIZE = 5 * 1024 * 1024;

const ALERT_KEYS = {
	postCreated: "post_created",
	mention: "mention",
	followerGain: "follower_gain",
};

const VARIABLE_NAMES = {
	userId: "user_id",
	username: "username",
	displayName: "display_name",
	bio: "bio",
	verified: "verified",
	followersCount: "followers_count",
	followingCount: "following_count",
	listedCount: "listed_count",
	postCount: "post_count",
	latestPostId: "latest_post_id",
	latestPostText: "latest_post_text",
	latestPostUrl: "latest_post_url",
	latestPostCreatedAt: "latest_post_created_at",
	lastCreatedPostId: "last_created_post_id",
	latestMentionId: "latest_mention_id",
	latestMentionText: "latest_mention_text",
	latestMentionAuthor: "latest_mention_author",
	latestMentionUrl: "latest_mention_url",
	followerDelta: "follower_delta",
	lastActionStatus: "last_action_status",
	lastActionError: "last_action_error",
};

const VARIABLE_DEFAULTS = {
	[VARIABLE_NAMES.userId]: "",
	[VARIABLE_NAMES.username]: "",
	[VARIABLE_NAMES.displayName]: "",
	[VARIABLE_NAMES.bio]: "",
	[VARIABLE_NAMES.verified]: false,
	[VARIABLE_NAMES.followersCount]: 0,
	[VARIABLE_NAMES.followingCount]: 0,
	[VARIABLE_NAMES.listedCount]: 0,
	[VARIABLE_NAMES.postCount]: 0,
	[VARIABLE_NAMES.latestPostId]: "",
	[VARIABLE_NAMES.latestPostText]: "",
	[VARIABLE_NAMES.latestPostUrl]: "",
	[VARIABLE_NAMES.latestPostCreatedAt]: "",
	[VARIABLE_NAMES.lastCreatedPostId]: "",
	[VARIABLE_NAMES.latestMentionId]: "",
	[VARIABLE_NAMES.latestMentionText]: "",
	[VARIABLE_NAMES.latestMentionAuthor]: "",
	[VARIABLE_NAMES.latestMentionUrl]: "",
	[VARIABLE_NAMES.followerDelta]: 0,
	[VARIABLE_NAMES.lastActionStatus]: "",
	[VARIABLE_NAMES.lastActionError]: "",
};

const MIME_TYPES = {
	".bmp": "image/bmp",
	".gif": "image/gif",
	".jpeg": "image/jpeg",
	".jpg": "image/jpeg",
	".mov": "video/quicktime",
	".mp4": "video/mp4",
	".m4v": "video/mp4",
	".png": "image/png",
	".tif": "image/tiff",
	".tiff": "image/tiff",
	".webm": "video/webm",
	".webp": "image/webp",
};

function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

function trimString(value, fallback = "") {
	if (typeof value !== "string") {
		if (value === null || value === undefined) {
			return fallback;
		}
		return String(value).trim();
	}
	return value.trim();
}

function asBoolean(value, fallback = false) {
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

function asNumber(value, fallback = 0) {
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
}

function normalizeHandle(value) {
	const trimmed = trimString(value);
	return trimmed.replace(/^@+/, "");
}

function percentEncode(value) {
	return encodeURIComponent(String(value)).replace(
		/[!'()*]/g,
		(character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
	);
}

function buildQueryString(params = {}) {
	const entries = Object.entries(params).filter(
		([, value]) => value !== undefined && value !== null && value !== "",
	);
	return entries
		.map(([key, value]) => `${percentEncode(key)}=${percentEncode(value)}`)
		.join("&");
}

function guessMimeType(input, fallback = "application/octet-stream") {
	const extension = path.extname(trimString(input).toLowerCase());
	return MIME_TYPES[extension] || fallback;
}

function isNumericId(value) {
	return /^[0-9]{1,19}$/.test(trimString(value));
}

function createPostUrl(username, postId) {
	const safeUser = normalizeHandle(username);
	const safePostId = trimString(postId);
	if (!safeUser || !safePostId) {
		return "";
	}
	return `https://x.com/${encodeURIComponent(safeUser)}/status/${encodeURIComponent(
		safePostId,
	)}`;
}

class XPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._pollTimer = null;
		this._stopped = false;
		this._pollInFlight = false;
		this._mentionIds = [];
		this._baselineReady = false;
		this._state = {
			userId: "",
			username: "",
			displayName: "",
			bio: "",
			verified: false,
			followersCount: 0,
			followingCount: 0,
			listedCount: 0,
			postCount: 0,
			latestPostId: "",
			latestPostText: "",
			latestPostUrl: "",
			latestPostCreatedAt: "",
			lastCreatedPostId: "",
			latestMentionId: "",
			latestMentionText: "",
			latestMentionAuthor: "",
			latestMentionUrl: "",
			followerDelta: 0,
		};
	}

	async onload() {
		await this._hydrateDefaults();
		if (!this._hasCredentials(this.settings)) {
			await this._updateConnection(false);
			return;
		}

		if (!this._alertsEnabled(this.settings)) {
			await this._updateConnection(true);
			return;
		}

		await this._connectAndPrime({ suppressAlerts: true });
	}

	async onunload() {
		this._stopped = true;
		this._clearPollTimer();
		await this._updateConnection(false);
	}

	async onsettingsupdate(settings, previous = {}) {
		if (!this._hasCredentials(settings)) {
			this._stopped = true;
			this._clearPollTimer();
			await this._updateConnection(false);
			return;
		}

		if (this._settingsRequireReconnect(settings, previous)) {
			this._stopped = false;
			this._mentionIds = [];
			this._baselineReady = false;
			this._clearPollTimer();
			if (!this._alertsEnabled(settings)) {
				await this._updateConnection(true);
				return;
			}
			await this._connectAndPrime({ suppressAlerts: true });
			return;
		}

		if (this._pollRelevantSettingChanged(settings, previous)) {
			this._clearPollTimer();
			const wereAlertsEnabled = this._alertsEnabled(previous);
			const areAlertsEnabled = this._alertsEnabled(settings);

			if (!areAlertsEnabled) {
				return;
			}

			if (!wereAlertsEnabled) {
				this._mentionIds = [];
				this._baselineReady = false;
				await this._refreshSnapshot({
					suppressAlerts: true,
					establishBaseline: true,
				});
			}

			this._scheduleNextPoll();
		}
	}

	async validateAuth(data = {}) {
		if (!this._hasCredentials(data)) {
			return {
				ok: false,
				message: "Consumer key/secret and access token/secret are required.",
			};
		}

		try {
			const profile = await this._fetchAuthenticatedUser(data);
			const username = trimString(profile?.username, "unknown");
			const expected = normalizeHandle(data?.username);
			if (expected && expected.toLowerCase() !== username.toLowerCase()) {
				return {
					ok: false,
					message: `Token belongs to @${username}, not @${expected}.`,
				};
			}
			return { ok: true, message: `Validated as @${username}.` };
		} catch (error) {
			return { ok: false, message: this._errorMessage(error) };
		}
	}

	async actions(config = {}) {
		const actions = Array.isArray(config.actions) ? config.actions : [];
		for (const action of actions) {
			if (!action || action.on === false) {
				continue;
			}

			try {
				switch (action.type) {
					case "create_post":
						await this._createPostAction(action.value);
						break;
					case "delete_post":
						await this._deletePostAction(action.value);
						break;
					case "delete_latest_post":
						await this._deleteLatestPostAction();
						break;
					case "like_post":
						await this._likeAction(action.value, true);
						break;
					case "repost_post":
						await this._repostAction(action.value, true);
						break;
					case "follow_user":
						await this._followAction(action.value, true);
						break;
					default:
						await this._debug(`Ignoring unsupported action type "${action.type}".`);
						break;
				}
			} catch (error) {
				await this._setActionError(this._errorMessage(error));
				throw error;
			}
		}
	}

	async _connectAndPrime({ suppressAlerts = false } = {}) {
		try {
			await this._refreshSnapshot({ suppressAlerts, establishBaseline: true });
			this._stopped = false;
			await this._updateConnection(true);
			if (this._alertsEnabled(this.settings)) {
				this._scheduleNextPoll();
			}
		} catch (error) {
			await this._updateConnection(false);
			await this._log(`X setup failed: ${this._errorMessage(error)}`, "error");
			throw error;
		}
	}

	_settingsRequireReconnect(settings, previous) {
		const keys = [
			"consumerKey",
			"consumerSecret",
			"accessToken",
			"accessTokenSecret",
			"username",
			"latestPostMode",
		];
		return keys.some((key) => trimString(settings?.[key]) !== trimString(previous?.[key]));
	}

	_pollRelevantSettingChanged(settings, previous) {
		const keys = ["enableAlerts", "pollInterval", "trackFollowerAlerts", "trackMentionAlerts", "debugLogs"];
		return keys.some((key) => String(settings?.[key] ?? "") !== String(previous?.[key] ?? ""));
	}

	_hasCredentials(settings = this.settings) {
		return Boolean(
			trimString(settings?.consumerKey) &&
				trimString(settings?.consumerSecret) &&
				trimString(settings?.accessToken) &&
				trimString(settings?.accessTokenSecret),
		);
	}

	_credentials(settings = this.settings) {
		return {
			consumerKey: trimString(settings?.consumerKey),
			consumerSecret: trimString(settings?.consumerSecret),
			accessToken: trimString(settings?.accessToken),
			accessTokenSecret: trimString(settings?.accessTokenSecret),
		};
	}

	_pollIntervalMs() {
		const seconds = Math.max(
			MIN_POLL_INTERVAL_SECONDS,
			Math.min(
				MAX_POLL_INTERVAL_SECONDS,
				asNumber(this.settings?.pollInterval, DEFAULT_POLL_INTERVAL_SECONDS),
			),
		);
		return seconds * 1000;
	}

	_alertsEnabled(settings = this.settings) {
		return Boolean(
			asBoolean(settings?.enableAlerts, false) &&
				(asBoolean(settings?.trackFollowerAlerts, false) ||
					asBoolean(settings?.trackMentionAlerts, false)),
		);
	}

	_clearPollTimer() {
		if (this._pollTimer) {
			clearTimeout(this._pollTimer);
			this._pollTimer = null;
		}
	}

	_scheduleNextPoll(delayMs = this._pollIntervalMs()) {
		if (
			this._stopped ||
			!this._hasCredentials(this.settings) ||
			!this._alertsEnabled(this.settings)
		) {
			return;
		}

		this._clearPollTimer();
		this._pollTimer = setTimeout(async () => {
			if (this._pollInFlight) {
				this._scheduleNextPoll();
				return;
			}

			this._pollInFlight = true;
			try {
				await this._refreshSnapshot();
				await this._updateConnection(true);
			} catch (error) {
				await this._log(`X poll failed: ${this._errorMessage(error)}`, "warn");
			} finally {
				this._pollInFlight = false;
				this._scheduleNextPoll();
			}
		}, Math.max(1000, delayMs));
	}

	async _hydrateDefaults() {
		await Promise.all(
			Object.entries(VARIABLE_DEFAULTS).map(([name, value]) =>
				this.lumia.setVariable(name, value),
			),
		);
	}

	async _refreshSnapshot({
		suppressAlerts = false,
		establishBaseline = false,
	} = {}) {
		const previousFollowerCount = asNumber(this._state.followersCount, 0);
		const profile = await this._fetchAuthenticatedUser();
		const userId = trimString(profile?.id);
		const username = trimString(profile?.username);
		const displayName = trimString(profile?.name);
		const bio = trimString(profile?.description);
		const verified = asBoolean(profile?.verified, false);
		const metrics = profile?.public_metrics || {};
		const followersCount = asNumber(metrics?.followers_count, 0);
		const followingCount = asNumber(metrics?.following_count, 0);
		const listedCount = asNumber(metrics?.listed_count, 0);
		const postCount = asNumber(metrics?.tweet_count, 0);

		const expected = normalizeHandle(this.settings?.username);
		if (expected && expected.toLowerCase() !== username.toLowerCase()) {
			throw new Error(`Configured username @${expected} does not match token @${username}.`);
		}

		const latestPost = await this._fetchLatestPost(userId);
		const mentions = await this._fetchMentions(userId);

		const updates = {
			[VARIABLE_NAMES.userId]: userId,
			[VARIABLE_NAMES.username]: username,
			[VARIABLE_NAMES.displayName]: displayName,
			[VARIABLE_NAMES.bio]: bio,
			[VARIABLE_NAMES.verified]: verified,
			[VARIABLE_NAMES.followersCount]: followersCount,
			[VARIABLE_NAMES.followingCount]: followingCount,
			[VARIABLE_NAMES.listedCount]: listedCount,
			[VARIABLE_NAMES.postCount]: postCount,
		};

		this._state.userId = userId;
		this._state.username = username;
		this._state.displayName = displayName;
		this._state.bio = bio;
		this._state.verified = verified;
		this._state.followersCount = followersCount;
		this._state.followingCount = followingCount;
		this._state.listedCount = listedCount;
		this._state.postCount = postCount;

		if (latestPost) {
			const latestPostUrl = createPostUrl(username, latestPost.id);
			updates[VARIABLE_NAMES.latestPostId] = trimString(latestPost.id);
			updates[VARIABLE_NAMES.latestPostText] = trimString(latestPost.text);
			updates[VARIABLE_NAMES.latestPostUrl] = latestPostUrl;
			updates[VARIABLE_NAMES.latestPostCreatedAt] = trimString(latestPost.created_at);

			this._state.latestPostId = trimString(latestPost.id);
			this._state.latestPostText = trimString(latestPost.text);
			this._state.latestPostUrl = latestPostUrl;
			this._state.latestPostCreatedAt = trimString(latestPost.created_at);
		}

		await Promise.all(
			Object.entries(updates).map(([name, value]) => this.lumia.setVariable(name, value)),
		);

		const latestMention = Array.isArray(mentions?.posts) ? mentions.posts[0] : null;
		if (latestMention) {
			const mentionAuthor = this._lookupIncludedUser(
				mentions?.includes?.users,
				latestMention.author_id,
			);
			const mentionHandle = trimString(mentionAuthor?.username);
			const mentionUrl = createPostUrl(mentionHandle, latestMention.id);
			await Promise.all([
				this.lumia.setVariable(VARIABLE_NAMES.latestMentionId, trimString(latestMention.id)),
				this.lumia.setVariable(
					VARIABLE_NAMES.latestMentionText,
					trimString(latestMention.text),
				),
				this.lumia.setVariable(VARIABLE_NAMES.latestMentionAuthor, mentionHandle),
				this.lumia.setVariable(VARIABLE_NAMES.latestMentionUrl, mentionUrl),
			]);
			this._state.latestMentionId = trimString(latestMention.id);
		this._state.latestMentionText = trimString(latestMention.text);
		this._state.latestMentionAuthor = mentionHandle;
		this._state.latestMentionUrl = mentionUrl;
	}

		const followerDelta = Math.max(0, followersCount - previousFollowerCount);
		this._state.followerDelta = followerDelta;
		await this.lumia.setVariable(VARIABLE_NAMES.followerDelta, followerDelta);

		const mentionAlertsEnabled = asBoolean(this.settings?.trackMentionAlerts, true);
		const followerAlertsEnabled = asBoolean(this.settings?.trackFollowerAlerts, true);

		if (!this._baselineReady || establishBaseline) {
			this._mentionIds = (mentions?.posts || [])
				.map((post) => trimString(post?.id))
				.filter(Boolean)
				.slice(0, MAX_TRACKED_MENTION_IDS);
			this._baselineReady = true;
			return;
		}

		if (!suppressAlerts && followerAlertsEnabled && followerDelta > 0) {
			await this._triggerFollowerAlert(followerDelta);
		}

		if (!suppressAlerts && mentionAlertsEnabled) {
			await this._processNewMentions(mentions);
		}
	}

	async _fetchAuthenticatedUser(settings = this.settings) {
		const response = await this._request("GET", "/2/users/me", {
			settings,
			query: {
				"user.fields": "created_at,description,profile_image_url,public_metrics,url,verified",
			},
		});
		return response?.data || null;
	}

	async _fetchLatestPost(userId) {
		if (!trimString(userId)) {
			return null;
		}

		const exclude =
			this.settings?.latestPostMode === "include_replies" ? "retweets" : "retweets,replies";

		const response = await this._request("GET", `/2/users/${encodeURIComponent(userId)}/tweets`, {
			query: {
				max_results: 5,
				exclude,
				"tweet.fields": "author_id,created_at,conversation_id",
			},
		});
		return Array.isArray(response?.data) && response.data.length ? response.data[0] : null;
	}

	async _fetchMentions(userId) {
		if (!trimString(userId)) {
			return { posts: [], includes: {} };
		}

		const response = await this._request(
			"GET",
			`/2/users/${encodeURIComponent(userId)}/mentions`,
			{
				query: {
					max_results: 10,
					expansions: "author_id",
					"tweet.fields": "author_id,conversation_id,created_at,referenced_tweets",
					"user.fields": "name,profile_image_url,username,verified",
				},
			},
		);
		return {
			posts: Array.isArray(response?.data) ? response.data : [],
			includes: response?.includes || {},
		};
	}

	_lookupIncludedUser(users = [], userId) {
		return Array.isArray(users)
			? users.find((user) => trimString(user?.id) === trimString(userId)) || null
			: null;
	}

	async _processNewMentions(mentions = {}) {
		const posts = Array.isArray(mentions.posts) ? mentions.posts : [];
		if (!posts.length) {
			return;
		}

		const known = new Set(this._mentionIds);
		const fresh = posts
			.filter((post) => {
				const id = trimString(post?.id);
				return id && !known.has(id);
			})
			.reverse();

		for (const post of fresh) {
			const author = this._lookupIncludedUser(mentions?.includes?.users, post.author_id);
			const authorHandle = trimString(author?.username);
			const mentionUrl = createPostUrl(authorHandle, post.id);
			await Promise.all([
				this.lumia.setVariable(VARIABLE_NAMES.latestMentionId, trimString(post.id)),
				this.lumia.setVariable(VARIABLE_NAMES.latestMentionText, trimString(post.text)),
				this.lumia.setVariable(VARIABLE_NAMES.latestMentionAuthor, authorHandle),
				this.lumia.setVariable(VARIABLE_NAMES.latestMentionUrl, mentionUrl),
			]);

			this._state.latestMentionId = trimString(post.id);
			this._state.latestMentionText = trimString(post.text);
			this._state.latestMentionAuthor = authorHandle;
			this._state.latestMentionUrl = mentionUrl;

			await this.lumia.triggerAlert({
				alert: ALERT_KEYS.mention,
				showInEventList: true,
				extraSettings: {
					username: this._state.username,
					display_name: this._state.displayName,
					latest_mention_id: trimString(post.id),
					latest_mention_text: trimString(post.text),
					latest_mention_author: authorHandle,
					latest_mention_url: mentionUrl,
				},
			});
		}

		this._mentionIds = posts
			.map((post) => trimString(post?.id))
			.filter(Boolean)
			.slice(0, MAX_TRACKED_MENTION_IDS);
	}

	async _triggerFollowerAlert(followerDelta) {
		await this.lumia.triggerAlert({
			alert: ALERT_KEYS.followerGain,
			showInEventList: true,
			dynamic: {
				value: String(followerDelta),
			},
			extraSettings: {
				username: this._state.username,
				display_name: this._state.displayName,
				followers_count: this._state.followersCount,
				follower_delta: followerDelta,
			},
		});
	}

	async _createPostAction(data = {}) {
		const text = trimString(data?.text);
		const replyToPostId = trimString(data?.replyToPostId);
		const quotePostId = trimString(data?.quotePostId);
		const mediaSource = trimString(data?.media);

		if (!text) {
			throw new Error("Create Post requires text.");
		}
		if (replyToPostId && quotePostId) {
			throw new Error("A post cannot be both a reply and a quote in one action.");
		}

		const mediaIds = mediaSource ? [await this._uploadSingleMediaSource(mediaSource)] : [];

		const payload = { text };
		if (replyToPostId) {
			payload.reply = { in_reply_to_tweet_id: replyToPostId };
		}
		if (quotePostId) {
			payload.quote_tweet_id = quotePostId;
		}
		if (mediaIds.length) {
			payload.media = { media_ids: mediaIds };
		}

		const response = await this._request("POST", "/2/tweets", {
			body: payload,
		});
		const postId = trimString(response?.data?.id);
		const url = createPostUrl(this._state.username, postId);

		this._state.lastCreatedPostId = postId;
		this._state.latestPostId = postId;
		this._state.latestPostText = text;
		this._state.latestPostUrl = url;
		this._state.latestPostCreatedAt = new Date().toISOString();

		await Promise.all([
			this.lumia.setVariable(VARIABLE_NAMES.lastCreatedPostId, postId),
			this.lumia.setVariable(VARIABLE_NAMES.latestPostId, postId),
			this.lumia.setVariable(VARIABLE_NAMES.latestPostText, text),
			this.lumia.setVariable(VARIABLE_NAMES.latestPostUrl, url),
			this.lumia.setVariable(
				VARIABLE_NAMES.latestPostCreatedAt,
				this._state.latestPostCreatedAt,
			),
		]);

		await this.lumia.triggerAlert({
			alert: ALERT_KEYS.postCreated,
			showInEventList: true,
			extraSettings: {
				username: this._state.username,
				display_name: this._state.displayName,
				latest_post_id: postId,
				latest_post_text: text,
				latest_post_url: url,
				last_created_post_id: postId,
			},
		});

		await this._setActionStatus(`Created X post ${postId}.`);
	}

	async _deletePostAction(data = {}) {
		const postId = trimString(data?.postId);
		if (!postId) {
			throw new Error("Delete Post requires a post ID.");
		}
		await this._deletePostById(postId);
		await this._setActionStatus(`Deleted X post ${postId}.`);
	}

	async _deleteLatestPostAction() {
		const postId =
			this._state.lastCreatedPostId ||
			trimString(await this.lumia.getVariable(VARIABLE_NAMES.lastCreatedPostId)) ||
			this._state.latestPostId ||
			trimString(await this.lumia.getVariable(VARIABLE_NAMES.latestPostId));
		if (!postId) {
			throw new Error("No stored X post ID is available to delete.");
		}
		await this._deletePostById(postId);
		await this._setActionStatus(`Deleted latest stored X post ${postId}.`);
	}

	async _deletePostById(postId) {
		await this._request("DELETE", `/2/tweets/${encodeURIComponent(postId)}`);
		if (trimString(this._state.lastCreatedPostId) === trimString(postId)) {
			this._state.lastCreatedPostId = "";
			await this.lumia.setVariable(VARIABLE_NAMES.lastCreatedPostId, "");
		}
	}

	async _likeAction(data = {}, shouldLike) {
		const postId = trimString(data?.postId);
		if (!postId) {
			throw new Error(`${shouldLike ? "Like" : "Unlike"} Post requires a post ID.`);
		}

		await this._ensureUserId();
		if (shouldLike) {
			await this._request(
				"POST",
				`/2/users/${encodeURIComponent(this._state.userId)}/likes`,
				{
					body: { tweet_id: postId },
				},
			);
		} else {
			await this._request(
				"DELETE",
				`/2/users/${encodeURIComponent(this._state.userId)}/likes/${encodeURIComponent(
					postId,
				)}`,
			);
		}

		await this._setActionStatus(
			`${shouldLike ? "Liked" : "Unliked"} X post ${postId}.`,
		);
	}

	async _repostAction(data = {}, shouldRepost) {
		const postId = trimString(data?.postId);
		if (!postId) {
			throw new Error(`${shouldRepost ? "Repost" : "Undo Repost"} requires a post ID.`);
		}

		await this._ensureUserId();
		if (shouldRepost) {
			await this._request(
				"POST",
				`/2/users/${encodeURIComponent(this._state.userId)}/retweets`,
				{
					body: { tweet_id: postId },
				},
			);
		} else {
			await this._request(
				"DELETE",
				`/2/users/${encodeURIComponent(this._state.userId)}/retweets/${encodeURIComponent(
					postId,
				)}`,
			);
		}

		await this._setActionStatus(
			`${shouldRepost ? "Reposted" : "Removed repost of"} X post ${postId}.`,
		);
	}

	async _followAction(data = {}, shouldFollow) {
		const target = trimString(data?.user);
		if (!target) {
			throw new Error(`${shouldFollow ? "Follow" : "Unfollow"} requires a user value.`);
		}

		await this._ensureUserId();
		const targetUserId = await this._resolveUserId(target);
		if (shouldFollow) {
			await this._request(
				"POST",
				`/2/users/${encodeURIComponent(this._state.userId)}/following`,
				{
					body: { target_user_id: targetUserId },
				},
			);
		} else {
			await this._request(
				"DELETE",
				`/2/users/${encodeURIComponent(
					this._state.userId,
				)}/following/${encodeURIComponent(targetUserId)}`,
			);
		}

		await this._setActionStatus(
			`${shouldFollow ? "Followed" : "Unfollowed"} X user ${target}.`,
		);
	}

	async _ensureUserId() {
		if (trimString(this._state.userId)) {
			return this._state.userId;
		}
		const profile = await this._fetchAuthenticatedUser();
		this._state.userId = trimString(profile?.id);
		await this.lumia.setVariable(VARIABLE_NAMES.userId, this._state.userId);
		return this._state.userId;
	}

	async _resolveUserId(value) {
		const normalized = trimString(value);
		if (isNumericId(normalized)) {
			return normalized;
		}

		const username = normalizeHandle(normalized);
		const response = await this._request(
			"GET",
			`/2/users/by/username/${encodeURIComponent(username)}`,
			{
				query: {
					"user.fields": "username",
				},
			},
		);
		const resolved = trimString(response?.data?.id);
		if (!resolved) {
			throw new Error(`Could not resolve X user "${value}".`);
		}
		return resolved;
	}

	async _uploadSingleMediaSource(source) {
		const asset = await this._loadMediaSource(source);
		if (asset.kind === "image") {
			return this._uploadImage(asset);
		}
		if (asset.kind === "video") {
			return this._uploadChunkedVideo(asset);
		}
		throw new Error(`Unsupported media type for "${source}".`);
	}

	async _loadMediaSource(source) {
		if (/^https:\/\//i.test(source)) {
			const response = await this._fetchRaw(source);
			const mimeType = trimString(response.contentType) || guessMimeType(source);
			const buffer = Buffer.from(response.buffer);
			return this._buildMediaAsset({
				label: source,
				filename: path.basename(new URL(source).pathname) || "remote-media",
				mimeType,
				buffer,
			});
		}

		const resolvedPath = path.resolve(source);
		const buffer = await fs.readFile(resolvedPath);
		const mimeType = guessMimeType(resolvedPath);
		return this._buildMediaAsset({
			label: resolvedPath,
			filename: path.basename(resolvedPath),
			mimeType,
			buffer,
		});
	}

	_buildMediaAsset({ label, filename, mimeType, buffer }) {
		const normalizedMime = trimString(mimeType).toLowerCase();
		if (normalizedMime.startsWith("image/")) {
			return {
				label,
				filename,
				mimeType: normalizedMime,
				buffer,
				kind: normalizedMime === "image/gif" ? "video" : "image",
				mediaCategory:
					normalizedMime === "image/gif" ? "tweet_gif" : "tweet_image",
			};
		}
		if (normalizedMime.startsWith("video/")) {
			return {
				label,
				filename,
				mimeType: normalizedMime,
				buffer,
				kind: "video",
				mediaCategory: "tweet_video",
			};
		}
		return {
			label,
			filename,
			mimeType: normalizedMime,
			buffer,
			kind: "unsupported",
			mediaCategory: "",
		};
	}

	async _uploadImage(asset) {
		const form = new FormData();
		form.set(
			"media",
			new Blob([asset.buffer], { type: asset.mimeType }),
			asset.filename,
		);
		form.set("media_category", asset.mediaCategory);
		form.set("media_type", asset.mimeType);
		form.set("shared", "false");

		const response = await this._request("POST", "/2/media/upload", {
			body: form,
		});
		const mediaId = trimString(response?.data?.id);
		if (!mediaId) {
			throw new Error(`X did not return a media ID for "${asset.label}".`);
		}
		return mediaId;
	}

	async _uploadChunkedVideo(asset) {
		const initResponse = await this._request("POST", "/2/media/upload/initialize", {
			body: {
				media_category: asset.mediaCategory,
				media_type: asset.mimeType,
				shared: false,
				total_bytes: asset.buffer.length,
			},
		});
		const mediaId = trimString(initResponse?.data?.id);
		if (!mediaId) {
			throw new Error(`Failed to initialize media upload for "${asset.label}".`);
		}

		let segmentIndex = 0;
		for (let offset = 0; offset < asset.buffer.length; offset += MAX_CHUNK_SIZE) {
			const chunk = asset.buffer.subarray(offset, offset + MAX_CHUNK_SIZE);
			const form = new FormData();
			form.set("media", new Blob([chunk], { type: asset.mimeType }), asset.filename);
			form.set("segment_index", String(segmentIndex));
			await this._request(
				"POST",
				`/2/media/upload/${encodeURIComponent(mediaId)}/append`,
				{
					body: form,
				},
			);
			segmentIndex += 1;
		}

		const finalizeResponse = await this._request(
			"POST",
			`/2/media/upload/${encodeURIComponent(mediaId)}/finalize`,
		);
		await this._waitForMediaReady(mediaId, finalizeResponse?.data?.processing_info);
		return mediaId;
	}

	async _waitForMediaReady(mediaId, processingInfo) {
		let current = processingInfo || null;
		while (current && ["pending", "in_progress"].includes(current.state)) {
			const delaySeconds = Math.max(1, asNumber(current.check_after_secs, 2));
			await sleep(delaySeconds * 1000);
			const statusResponse = await this._request("GET", "/2/media/upload", {
				query: {
					command: "STATUS",
					media_id: mediaId,
				},
			});
			current = statusResponse?.data?.processing_info || null;
		}

		if (current && current.state === "failed") {
			const message =
				trimString(current?.error?.message) ||
				trimString(current?.error?.detail) ||
				`Media upload ${mediaId} failed during processing.`;
			throw new Error(message);
		}
	}

	async _fetchRaw(url) {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
		try {
			const response = await fetch(url, {
				method: "GET",
				signal: controller.signal,
			});
			if (!response.ok) {
				throw new Error(`Media download failed (${response.status}) for ${url}`);
			}
			const buffer = await response.arrayBuffer();
			return {
				buffer,
				contentType: trimString(response.headers.get("content-type")),
			};
		} finally {
			clearTimeout(timeout);
		}
	}

	async _request(method, endpoint, options = {}) {
		const settings = options.settings || this.settings;
		const credentials = this._credentials(settings);
		const query = options.query || {};
		const baseUrl = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
		const queryString = buildQueryString(query);
		const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;
		const oauthHeader = this._buildOAuthHeader(method, baseUrl, query, credentials);
		const headers = new Headers(options.headers || {});
		headers.set("Authorization", oauthHeader);
		headers.set("Accept", "application/json");

		let body = options.body;
		if (body && !(body instanceof FormData)) {
			headers.set("Content-Type", "application/json");
			body = JSON.stringify(body);
		}

		await this._debug(`${method} ${url}`);

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
		try {
			const response = await fetch(url, {
				method,
				headers,
				body,
				signal: controller.signal,
			});
			const text = await response.text();
			const parsed = text ? this._safeJsonParse(text) : {};

			if (!response.ok || Array.isArray(parsed?.errors)) {
				const message =
					this._extractApiError(parsed) ||
					`${method} ${endpoint} failed with status ${response.status}`;
				throw new Error(message);
			}

			return parsed;
		} catch (error) {
			if (error?.name === "AbortError") {
				throw new Error(`Request timed out for ${endpoint}`);
			}
			throw error;
		} finally {
			clearTimeout(timeout);
		}
	}

	_buildOAuthHeader(method, baseUrl, query, credentials) {
		const oauthParams = {
			oauth_consumer_key: credentials.consumerKey,
			oauth_nonce: crypto.randomBytes(16).toString("hex"),
			oauth_signature_method: "HMAC-SHA1",
			oauth_timestamp: String(Math.floor(Date.now() / 1000)),
			oauth_token: credentials.accessToken,
			oauth_version: "1.0",
		};

		const signatureParams = { ...oauthParams, ...(query || {}) };
		const parameterString = Object.keys(signatureParams)
			.sort()
			.map((key) => `${percentEncode(key)}=${percentEncode(signatureParams[key])}`)
			.join("&");
		const signatureBaseString = [
			method.toUpperCase(),
			percentEncode(baseUrl),
			percentEncode(parameterString),
		].join("&");
		const signingKey = `${percentEncode(credentials.consumerSecret)}&${percentEncode(
			credentials.accessTokenSecret,
		)}`;
		const signature = crypto
			.createHmac("sha1", signingKey)
			.update(signatureBaseString)
			.digest("base64");
		const authParams = {
			...oauthParams,
			oauth_signature: signature,
		};

		return `OAuth ${Object.keys(authParams)
			.sort()
			.map(
				(key) =>
					`${percentEncode(key)}="${percentEncode(authParams[key])}"`,
			)
			.join(", ")}`;
	}

	_safeJsonParse(text) {
		try {
			return JSON.parse(text);
		} catch (_error) {
			return { raw: text };
		}
	}

	_extractApiError(payload) {
		if (typeof payload === "string") {
			return payload;
		}

		if (Array.isArray(payload?.errors) && payload.errors.length) {
			const first = payload.errors[0] || {};
			return trimString(first.detail || first.message || first.title);
		}

		if (payload?.detail || payload?.message || payload?.title) {
			return trimString(payload.detail || payload.message || payload.title);
		}

		if (typeof payload?.raw === "string") {
			return trimString(payload.raw);
		}

		return "";
	}

	async _setActionStatus(message) {
		await Promise.all([
			this.lumia.setVariable(VARIABLE_NAMES.lastActionStatus, message),
			this.lumia.setVariable(VARIABLE_NAMES.lastActionError, ""),
		]);
		await this._debug(message);
	}

	async _setActionError(message) {
		await Promise.all([
			this.lumia.setVariable(VARIABLE_NAMES.lastActionError, message),
			this.lumia.setVariable(VARIABLE_NAMES.lastActionStatus, ""),
		]);
		await this._log(message, "error");
	}

	async _updateConnection(state) {
		try {
			await this.lumia.updateConnection(Boolean(state));
		} catch (_error) {
			// Ignore runtime connection update failures.
		}
	}

	async _log(message, level = "info") {
		if (typeof this.lumia?.log === "function") {
			await this.lumia.log({ message, level });
		}
	}

	async _debug(message) {
		if (!asBoolean(this.settings?.debugLogs, false)) {
			return;
		}
		await this._log(`[X] ${message}`, "debug");
	}

	_errorMessage(error) {
		if (!error) {
			return "Unknown X plugin error.";
		}
		if (typeof error === "string") {
			return error;
		}
		return trimString(error.message || error.detail || String(error), "Unknown X plugin error.");
	}
}

module.exports = XPlugin;
