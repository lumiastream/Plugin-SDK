# Lumia Plugin Examples: Streaming Platforms

Use these examples for: Streaming and social platform integrations: live status, chat display, native chatbot (`hasChatbot`), moderation commands (`modcommandOptions`), OAuth, and posting.

## Index

| Example | What it does | Shows | Field types |
| --- | --- | --- | --- |
| `rumble` (Rumble) | Track Rumble livestream state and engagement with alerts, variables, and chat display. | alerts, variables, translations, settings tutorial, actions tutorial | number, text |
| `trovo` (Trovo) | Trovo Live integration with chat, alerts, chatbot, moderation, variables, and stream actions. | native chatbot (`hasChatbot`), moderation commands, variable functions, OAuth, actions, alerts, variables, translations, settings tutorial, actions tutorial | checkbox, color, password, select, text, toggle |
| `x` (X) | Create and delete X posts with your own developer tokens, sync account variables, and trigger polling-based alerts for mentions and follower growth. | actions, alerts, variables, settings tutorial, actions tutorial | checkbox, media, number, password, select, text, textarea |

## Example: rumble

Source folder `examples/rumble`, category `platforms`. Track Rumble livestream state and engagement with alerts, variables, and chat display.

### rumble/manifest.json

```json
{
	"id": "rumble",
	"name": "Rumble",
	"version": "1.1.1",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://lumiastream.com",
	"description": "Track Rumble livestream state and engagement with alerts, variables, and chat display.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "platforms",
	"keywords": "rumble, livestream, chat, followers, alerts",
	"icon": "rumble.png",
	"config": {
		"settings": [
			{
				"key": "apiKey",
				"label": "API Key",
				"type": "text",
				"placeholder": "Enter your Rumble livestream API key",
				"helperText": "Copy the key parameter from your Rumble livestream API URL",
				"required": true
			},
			{
				"key": "pollInterval",
				"label": "Poll Interval (seconds)",
				"type": "number",
				"defaultValue": 10,
				"helperText": "How often to check for stream updates (10-300 seconds)"
			}
		],
		"settings_tutorial": "./settings_tutorial.md",
		"actions_tutorial": "./actions_tutorial.md",
		"actions": [],
		"variables": [
			{
				"name": "live",
				"description": "Whether the Rumble stream is currently live",
				"value": false
			},
			{
				"name": "viewers",
				"description": "Current number of concurrent viewers watching the stream",
				"value": 0
			},
			{
				"name": "joined",
				"description": "Total viewers that have joined the stream session",
				"value": 0
			},
			{
				"name": "title",
				"description": "Current stream title",
				"value": ""
			},
			{
				"name": "thumbnail",
				"description": "Stream thumbnail URL",
				"value": ""
			},
			{
				"name": "stream_url",
				"description": "Public URL to the livestream",
				"value": ""
			},
			{
				"name": "video_id",
				"description": "Underlying Rumble video ID",
				"value": ""
			},
			{
				"name": "reactions",
				"description": "Current reaction count on the stream",
				"value": 0
			},
			{
				"name": "followers",
				"description": "Current follower count of the channel",
				"value": 0
			},
			{
				"name": "likes",
				"description": "Thumbs-up reactions on the stream",
				"value": 0
			},
			{
				"name": "dislikes",
				"description": "Thumbs-down reactions on the stream",
				"value": 0
			},
			{
				"name": "subs",
				"description": "Total paid subscriptions/memberships for the channel",
				"value": 0
			},
			{
				"name": "sub_gifts",
				"description": "Gifted subscriptions/memberships received during the stream",
				"value": 0
			},
			{
				"name": "rants",
				"description": "Number of Rants received this stream",
				"value": 0
			},
			{
				"name": "rant_amount",
				"description": "Total value of Rants received this stream",
				"value": 0
			},
			{
				"name": "chat_members",
				"description": "Active chat members in the livestream chat",
				"value": 0
			},
			{
				"name": "category",
				"description": "Category assigned to the livestream",
				"value": ""
			},
			{
				"name": "description",
				"description": "Short description of the livestream",
				"value": ""
			},
			{
				"name": "language",
				"description": "Language reported by Rumble for the stream",
				"value": ""
			},
			{
				"name": "chat_url",
				"description": "Direct URL to the livestream chat",
				"value": ""
			},
			{
				"name": "channel_name",
				"description": "Rumble channel display name",
				"value": ""
			},
			{
				"name": "channel_image",
				"description": "Avatar image URL for the Rumble channel",
				"value": ""
			},
			{
				"name": "started_at",
				"description": "Timestamp of when the stream went live (ISO 8601)",
				"value": ""
			},
			{
				"name": "scheduled_start",
				"description": "Scheduled start time for the stream (ISO 8601)",
				"value": ""
			}
		],
		"alerts": [
			{
				"title": "Stream Started",
				"key": "streamStarted",
				"acceptedVariables": [
					"live",
					"viewers",
					"title",
					"stream_url",
					"followers",
					"likes",
					"dislikes",
					"subs",
					"sub_gifts",
					"rants",
					"rant_amount"
				],
				"defaultMessage": "{{username}} has started streaming on Rumble!",
				"variationConditions": [
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			},
			{
				"title": "Stream Ended",
				"key": "streamEnded",
				"acceptedVariables": [
					"live",
					"viewers",
					"title",
					"followers",
					"likes",
					"dislikes",
					"subs",
					"sub_gifts",
					"rants",
					"rant_amount"
				],
				"defaultMessage": "{{username}} has ended their Rumble stream.",
				"variationConditions": [
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			},
			{
				"title": "Follower",
				"key": "follower",
				"acceptedVariables": ["followers", "stream_url", "title"],
				"defaultMessage": "New followers! Total is now {{followers}}.",
				"variationConditions": [
					{
						"type": "GREATER_NUMBER",
						"description": "Follow number is greater than.."
					},
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			},
			{
				"title": "Rant",
				"key": "rant",
				"acceptedVariables": ["rants", "rant_amount", "viewers", "title"],
				"defaultMessage": "New rant received! Total rants: {{rants}} ({{rant_amount}})",
				"variationConditions": [
					{
						"type": "GREATER_NUMBER",
						"description": "Rant number is greater than.."
					},
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			},
			{
				"title": "Like",
				"key": "like",
				"acceptedVariables": ["likes", "stream_url", "title"],
				"defaultMessage": "Another thumbs-up! Likes: {{likes}}",
				"variationConditions": [
					{
						"type": "GREATER_NUMBER",
						"description": "Like number is greater than.."
					},
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			},
			{
				"title": "Dislike",
				"key": "dislike",
				"acceptedVariables": ["dislikes", "stream_url", "title"],
				"defaultMessage": "Someone hit dislike. Total dislikes: {{dislikes}}",
				"variationConditions": [
					{
						"type": "GREATER_NUMBER",
						"description": "Dislike number is greater than.."
					},
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			},
			{
				"title": "Subscriber",
				"key": "sub",
				"acceptedVariables": ["subs", "stream_url", "title"],
				"defaultMessage": "New subscription! Subs total: {{subs}}",
				"variationConditions": [
					{
						"type": "GREATER_NUMBER",
						"description": "Sub number is greater than.."
					},
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			},
			{
				"title": "Gift Subscription",
				"key": "subGift",
				"acceptedVariables": ["sub_gifts", "stream_url", "title"],
				"defaultMessage": "Gifted subs came through! Gift total: {{sub_gifts}}",
				"variationConditions": [
					{
						"type": "GREATER_NUMBER",
						"description": "Gift sub number is greater than.."
					},
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			}
		],
		"translations": "./translations.json"
	}
}
```

### rumble/main.js

```javascript
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

function coerceOptionalNumber(value) {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === "string" && value.trim().length) {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : undefined;
	}
	if (typeof value === "boolean") {
		return value ? 1 : 0;
	}
	return undefined;
}

function pickFirstNumber(source, paths = [], fallback = 0) {
	for (const path of paths) {
		const parsed = coerceOptionalNumber(resolvePath(source, path));
		if (parsed !== undefined) {
			return parsed;
		}
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
		live: state.live,
		viewers: state.viewers,
		title: state.title,
		stream_url: state.streamUrl,
		followers: state.followers,
		likes: state.likes,
		dislikes: state.dislikes,
		subs: state.subs,
		sub_gifts: state.subGifts,
		rants: state.rants,
		rant_amount: roundToTwo(state.rantAmount),
	};
}

function buildAlertIdentity(state) {
	const username = coerceString(state?.channelName, "rumble");
	const displayname = coerceString(state?.channelName, username);
	const avatar = coerceString(state?.channelImage, "");
	const userId = coerceString(state?.videoId, "");
	return {
		username,
		displayname,
		avatar: avatar || undefined,
		userId: userId || undefined,
	};
}

function buildAlertPayload(
	vars,
	{ state, name, value, extraSettings = {} } = {},
) {
	const identity = buildAlertIdentity(state);
	const normalizedDynamic = buildAlertDynamic({ name, value });
	return {
		dynamic: normalizedDynamic,
		extraSettings: {
			...vars,
			...extraSettings,
			username: identity.username,
			displayname: identity.displayname,
			avatar: identity.avatar,
			userId: identity.userId,
			name: normalizedDynamic.name,
			value: normalizedDynamic.value,
		},
	};
}

function buildAlertDynamic({ name, value } = {}) {
	const normalizedName = coerceString(name, "");
	let normalizedValue = value;
	if (
		typeof normalizedValue !== "string" &&
		typeof normalizedValue !== "number" &&
		typeof normalizedValue !== "boolean"
	) {
		normalizedValue = coerceString(normalizedValue, "");
	}
	return { name: normalizedName, value: normalizedValue };
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

function hasTruthyField(message, fields = []) {
	for (const field of fields) {
		const value = resolvePath(message, field.split("."));
		if (coerceBoolean(value, false)) {
			return true;
		}
	}
	return false;
}

function coerceTier(value) {
	if (typeof value === "number" && Number.isFinite(value)) {
		return Math.max(0, Math.floor(value));
	}
	if (typeof value === "string") {
		const normalized = value.trim().toLowerCase();
		if (!normalized) {
			return 0;
		}
		const parsedDirect = Number(normalized);
		if (Number.isFinite(parsedDirect)) {
			return Math.max(0, Math.floor(parsedDirect));
		}
		const match =
			normalized.match(/tier[^0-9]*([0-9]+)/) || normalized.match(/([0-9]+)/);
		if (match?.[1]) {
			const parsed = Number(match[1]);
			if (Number.isFinite(parsed)) {
				return Math.max(0, Math.floor(parsed));
			}
		}
	}
	return 0;
}

function extractRoleTokens(message) {
	const rawValues = [
		message?.role,
		message?.user_role,
		message?.userRole,
		message?.roles,
		message?.user_roles,
		message?.userRoles,
		message?.badge,
		message?.badges,
		message?.user?.role,
		message?.user?.roles,
		message?.user?.badge,
		message?.user?.badges,
	];
	const tokens = new Set();
	for (const value of rawValues) {
		if (Array.isArray(value)) {
			for (const entry of value) {
				const text =
					typeof entry === "string"
						? entry
						: coerceString(entry?.name || entry?.id || entry?.badge, "");
				const normalized = text.trim().toLowerCase();
				if (normalized) {
					tokens.add(normalized);
				}
			}
			continue;
		}
		const normalized = coerceString(value, "").trim().toLowerCase();
		if (normalized) {
			tokens.add(normalized);
		}
	}
	return tokens;
}

function extractChatBadges(message) {
	if (!message || typeof message !== "object") {
		return [];
	}
	return normalizeBadges(
		message.badges ||
			message.user_badges ||
			message.badge ||
			message.user?.badges ||
			message.user?.badge ||
			[],
	);
}

function extractChatUserId(message) {
	if (!message || typeof message !== "object") {
		return "";
	}
	return coerceString(
		message.user_id ||
			message.userid ||
			message.id_user ||
			message.user?.id ||
			message.user?.user_id,
		"",
	);
}

function extractChatUserLevels(message) {
	const tokens = extractRoleTokens(message);
	const tier = Math.max(
		coerceTier(message?.subscription_tier),
		coerceTier(message?.sub_tier),
		coerceTier(message?.tier),
		coerceTier(message?.user?.subscription_tier),
		coerceTier(message?.user?.sub_tier),
		coerceTier(message?.user?.tier),
	);

	const isSelf =
		hasTruthyField(message, [
			"is_self",
			"isSelf",
			"is_broadcaster",
			"isBroadcaster",
			"user.is_self",
			"user.is_broadcaster",
		]) ||
		[...tokens].some((token) =>
			["broadcaster", "streamer", "owner", "creator"].some((word) =>
				token.includes(word),
			),
		);

	const mod =
		hasTruthyField(message, ["is_mod", "isMod", "user.is_mod"]) ||
		[...tokens].some((token) => token.includes("moderator") || token === "mod");

	const vip =
		hasTruthyField(message, ["is_vip", "isVip", "user.is_vip"]) ||
		[...tokens].some((token) => token.includes("vip"));

	const tier3 =
		tier >= 3 ||
		[...tokens].some(
			(token) => token.includes("tier3") || token.includes("tier_3"),
		);
	const tier2 =
		tier >= 2 ||
		tier3 ||
		[...tokens].some(
			(token) => token.includes("tier2") || token.includes("tier_2"),
		);

	const subscriber =
		hasTruthyField(message, [
			"is_subscriber",
			"isSubscriber",
			"is_member",
			"isMember",
			"user.is_subscriber",
			"user.is_member",
		]) ||
		tier >= 1 ||
		tier2 ||
		tier3 ||
		[...tokens].some((token) =>
			["subscriber", "member", "supporter", "founder"].some((word) =>
				token.includes(word),
			),
		);

	const follower =
		hasTruthyField(message, [
			"is_follower",
			"isFollower",
			"user.is_follower",
		]) || [...tokens].some((token) => token.includes("follower"));

	return { isSelf, mod, vip, tier3, tier2, subscriber, follower };
}

function parseChatTimestamp(value) {
	const parsed = parseTimestamp(value);
	return parsed ? parsed.getTime() : 0;
}

function extractChatMessageId(message) {
	return coerceString(
		message?.id ||
			message?.message_id ||
			message?.messageId ||
			message?.chat_message_id ||
			message?.chatMessageId,
		"",
	).trim();
}

function hashChatMessage(value) {
	let hash = 0;
	for (let index = 0; index < value.length; index += 1) {
		hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
	}
	return hash.toString(36);
}

function getChatMessageKey(message) {
	if (message.messageId) {
		return `id:${message.messageId}`;
	}
	return `fallback:${message.timestamp}:${message.username}:${message.text}`;
}

function getDisplayChatMessageId(message) {
	if (message.messageId) {
		return `rumble-${message.messageId}`;
	}

	return `rumble-${message.timestamp || "no-time"}-${hashChatMessage(
		`${message.username}:${message.text}`,
	)}`;
}

// Top-level plugin that polls the API, tracks session state, and surfaces events to Lumia.
class RumblePlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);

		this.pollIntervalId = null;
		this.pollInFlight = false;
		this.lastKnownState = this.createEmptyState();
		this.sessionData = this.createEmptySession();
		this.hasBaseline = false;
		this.streamCounter = 0;
		this.chatState = this.createEmptyChatState();
		this.chatHasBaseline = false;
		this.failureCount = 0;
		this.backoffMultiplier = 1;
		this.offline = false;
		this.lastConnectionState = null;
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
		if (this.apiKey) {
			await this.startPolling({ showToast: false });
		}
	}

	async onunload() {
		await this.stopPolling(false);
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
			this.offline = false;
			this.failureCount = 0;
			this.backoffMultiplier = 1;
			await this.stopPolling(false);
			await this.startPolling({ showToast: false });
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
			await this.lumia.log(`[Rumble] Auth validation failed: ${message}`);
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
			await this.lumia.log("[Rumble] Missing API key, cannot start polling");
			if (showToast) {
				await this.lumia.showToast({
					message: "Rumble API key required to poll",
				});
			}
			return;
		}

		if (this.offline) {
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

		const intervalSeconds = Math.min(
			Math.max(
				Math.round(normalizedInterval * this.backoffMultiplier),
				MIN_POLL_INTERVAL,
			),
			MAX_POLL_INTERVAL * 4,
		);

		await this.pollAPI();

		this.pollIntervalId = setInterval(() => {
			// Avoid awaiting the result here so the timer keeps its cadence.
			void this.pollAPI();
		}, intervalSeconds * 1000);
	}

	// Halt polling and let Lumia know the integration is disconnected.
	async stopPolling(showToast = true) {
		if (this.pollIntervalId) {
			clearInterval(this.pollIntervalId);
			this.pollIntervalId = null;
		}

		await this.updateConnectionState(false);
	}

	// Poll the Rumble endpoint once, then delegate processing to the diff logic.
	async pollAPI() {
		if (this.pollInFlight) {
			return;
		}

		this.pollInFlight = true;
		try {
			if (this.offline) {
				return;
			}

			const apiKey = this.apiKey;
			if (!apiKey) {
				return;
			}

			const data = await this.fetchStreamData(apiKey);
			await this.processStreamData(data);
			this.failureCount = 0;
			this.backoffMultiplier = 1;
			await this.updateConnectionState(true);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			this.failureCount += 1;
			if (this.failureCount >= 3) {
				this.offline = true;
				await this.stopPolling(false);
			} else {
				this.backoffMultiplier = Math.min(8, 2 ** this.failureCount);
				await this.stopPolling(false);
				await this.startPolling({ showToast: false });
			}
			await this.lumia.log(`[Rumble] Error polling API: ${message}`);
			await this.updateConnectionState(false);
		} finally {
			this.pollInFlight = false;
		}
	}

	async updateConnectionState(nextState) {
		if (this.lastConnectionState === nextState) {
			return;
		}
		this.lastConnectionState = nextState;
		await this.lumia.updateConnection(nextState);
	}

	buildStateFromData(data = {}) {
		// Flatten the API payload into a canonical structure with sensible defaults.
		const state = this.createEmptyState();
		const previousState = this.lastKnownState || {};

		state.live = coerceBoolean(pickFirst(data, FIELD_PATHS.live), false);
		state.viewers = coerceNumber(pickFirst(data, FIELD_PATHS.viewers));
		state.joined = coerceNumber(pickFirst(data, FIELD_PATHS.joined));
		state.title = coerceString(pickFirst(data, FIELD_PATHS.title), "");
		state.thumbnail = coerceString(pickFirst(data, FIELD_PATHS.thumbnail), "");
		state.streamUrl = coerceString(pickFirst(data, FIELD_PATHS.streamUrl), "");
		state.videoId = coerceString(pickFirst(data, FIELD_PATHS.videoId), "");
		state.rumbles = pickFirstNumber(
			data,
			FIELD_PATHS.rumbles,
			previousState.rumbles || 0,
		);
		state.rants = pickFirstNumber(
			data,
			FIELD_PATHS.rants,
			previousState.rants || 0,
		);
		state.rantAmount = pickFirstNumber(
			data,
			FIELD_PATHS.rantAmount,
			previousState.rantAmount || 0,
		);
		state.followers = pickFirstNumber(
			data,
			FIELD_PATHS.followers,
			previousState.followers || 0,
		);
		state.likes = pickFirstNumber(
			data,
			FIELD_PATHS.likes,
			previousState.likes || 0,
		);
		state.dislikes = pickFirstNumber(
			data,
			FIELD_PATHS.dislikes,
			previousState.dislikes || 0,
		);
		state.subs = pickFirstNumber(
			data,
			FIELD_PATHS.subs,
			previousState.subs || 0,
		);
		state.subGifts = pickFirstNumber(
			data,
			FIELD_PATHS.subGifts,
			previousState.subGifts || 0,
		);
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
			await this.handleStreamStart(state);
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

		setIfChanged("live", state.live, previousState?.live);
		setIfChanged("viewers", state.viewers, previousState?.viewers);
		setIfChanged("joined", state.joined, previousState?.joined);
		setIfChanged("title", state.title, previousState?.title);
		setIfChanged("thumbnail", state.thumbnail, previousState?.thumbnail);
		setIfChanged("stream_url", state.streamUrl, previousState?.streamUrl);
		setIfChanged("video_id", state.videoId, previousState?.videoId);
		setIfChanged("reactions", state.rumbles, previousState?.rumbles);
		setIfChanged("followers", state.followers, previousState?.followers);
		setIfChanged("likes", state.likes, previousState?.likes);
		setIfChanged("dislikes", state.dislikes, previousState?.dislikes);
		setIfChanged("subs", state.subs, previousState?.subs);
		setIfChanged("sub_gifts", state.subGifts, previousState?.subGifts);
		setIfChanged("rants", state.rants, previousState?.rants);
		setIfChanged("rant_amount", roundToTwo(state.rantAmount), prevRantAmount);
		setIfChanged("chat_members", state.chatMembers, previousState?.chatMembers);
		setIfChanged("category", state.category, previousState?.category);
		setIfChanged("description", state.description, previousState?.description);
		setIfChanged("language", state.language, previousState?.language);
		setIfChanged("chat_url", state.chatUrl, previousState?.chatUrl);
		setIfChanged("channel_name", state.channelName, previousState?.channelName);
		setIfChanged(
			"channel_image",
			state.channelImage,
			previousState?.channelImage,
		);
		setIfChanged("started_at", startedIso, prevStartedIso);
		setIfChanged("scheduled_start", scheduledIso, prevScheduledIso);

		if (updates.length) {
			await Promise.all(updates);
		}

		// Store derived timestamps so we can compare next loop without recomputing.
		state.lastPolledIso = nowIso;
	}

	// When a stream flips from offline to live, start a new session and alert.
	async handleStreamStart(state) {
		this.resetChatState();
		this.sessionData = this.createEmptySession();
		this.sessionData.streamStartTime = new Date();
		this.sessionData.lastRantsCount = state.rants;
		this.sessionData.lastRantAmount = state.rantAmount;
		this.streamCounter += 1;

		const alertVars = buildAlertVariables(state);
		await this.lumia.triggerAlert({
			alert: ALERT_TYPES.STREAM_START,
			...buildAlertPayload(alertVars, {
				state,
				name: state.title || state.channelName || "rumble",
				value: this.streamCounter,
				extraSettings: {
					stream_counter: this.streamCounter,
				},
			}),
		});
	}

	// Stream has gone offline: summarise the session and clean up session state.
	async handleStreamEnd(state) {
		const alertVars = buildAlertVariables(state);
		await this.lumia.triggerAlert({
			alert: ALERT_TYPES.STREAM_END,
			...buildAlertPayload(alertVars, {
				state,
				name: state.channelName || state.title || "rumble",
				value: state.viewers,
				extraSettings: {
					total: this.streamCounter,
				},
			}),
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

		const alertVars = buildAlertVariables(state);
		await this.lumia.triggerAlert({
			alert: ALERT_TYPES.FOLLOWER,
			showInEventList: true,
			...buildAlertPayload(alertVars, {
				state,
				name: state.channelName || "rumble",
				value: delta,
				extraSettings: {
					amount: delta,
					total: state.followers,
					followers: state.followers,
				},
			}),
		});
	}

	// Emit when net likes increase.
	async checkLikes(state, previous) {
		const delta = state.likes - (previous.likes || 0);
		if (delta <= 0) {
			return;
		}

		const alertVars = buildAlertVariables(state);
		await this.lumia.triggerAlert({
			alert: ALERT_TYPES.LIKE,
			showInEventList: true,
			...buildAlertPayload(alertVars, {
				state,
				name: state.channelName || "rumble",
				value: delta,
				extraSettings: {
					amount: delta,
					total: state.likes,
					likes: state.likes,
				},
			}),
		});
	}

	// Emit when net dislikes increase.
	async checkDislikes(state, previous) {
		const delta = state.dislikes - (previous.dislikes || 0);
		if (delta <= 0) {
			return;
		}

		const alertVars = buildAlertVariables(state);
		await this.lumia.triggerAlert({
			alert: ALERT_TYPES.DISLIKE,
			showInEventList: true,
			...buildAlertPayload(alertVars, {
				state,
				name: state.channelName || "rumble",
				value: delta,
				extraSettings: {
					amount: delta,
					total: state.dislikes,
					dislikes: state.dislikes,
				},
			}),
		});
	}

	// Emit when paid subs/memberships increase.
	async checkSubs(state, previous) {
		const delta = state.subs - (previous.subs || 0);
		if (delta <= 0) {
			return;
		}

		const alertVars = buildAlertVariables(state);
		await this.lumia.triggerAlert({
			alert: ALERT_TYPES.SUB,
			showInEventList: true,
			...buildAlertPayload(alertVars, {
				state,
				name: state.channelName || "rumble",
				value: delta,
				extraSettings: {
					amount: delta,
					total: state.subs,
					subs: state.subs,
				},
			}),
		});
	}

	// Emit when gifted subs increase.
	async checkSubGifts(state, previous) {
		const delta = state.subGifts - (previous.subGifts || 0);
		if (delta <= 0) {
			return;
		}

		const alertVars = buildAlertVariables(state);
		await this.lumia.triggerAlert({
			alert: ALERT_TYPES.SUB_GIFT,
			showInEventList: true,
			...buildAlertPayload(alertVars, {
				state,
				name: state.channelName || "rumble",
				value: delta,
				extraSettings: {
					amount: delta,
					total: state.subGifts,
					sub_gifts: state.subGifts,
				},
			}),
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

		const alertVars = buildAlertVariables(state);
		await this.lumia.triggerAlert({
			alert: ALERT_TYPES.RANT,
			showInEventList: true,
			...buildAlertPayload(alertVars, {
				state,
				name: state.channelName || "rumble",
				value: roundToTwo(amountDelta > 0 ? amountDelta : countDelta),
				extraSettings: {
					amount: roundToTwo(amountDelta > 0 ? amountDelta : countDelta),
					total: roundToTwo(state.rantAmount),
					rants: state.rants,
					rant_amount: roundToTwo(state.rantAmount),
				},
			}),
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
				const username = coerceString(
					message?.username || message?.user?.username || message?.displayname,
					"",
				);
				const text = coerceString(message?.text ?? message?.message, "");
				const timestamp = parseChatTimestamp(
					message?.created_on ?? message?.created_at,
				);
				return {
					messageId: extractChatMessageId(message),
					username,
					text,
					timestamp,
					avatar: extractChatAvatar(message),
					userId: extractChatUserId(message),
					badges: extractChatBadges(message),
					userLevels: extractChatUserLevels(message),
				};
			})
			.filter((message) => message.username && message.text);

		normalized.sort((a, b) => a.timestamp - b.timestamp);

		const seenInPayload = new Set();
		return normalized.filter((message) => {
			const key = getChatMessageKey(message);
			if (seenInPayload.has(key)) {
				return false;
			}
			seenInPayload.add(key);
			return true;
		});
	}

	cacheChatKey(key) {
		if (this.chatState.seenKeys.has(key)) {
			return;
		}

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
			this.chatHasBaseline = true;
			return;
		}

		if (!this.chatHasBaseline) {
			messages.forEach((message) => {
				const key = getChatMessageKey(message);
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
			const key = getChatMessageKey(message);
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
				username: message.username,
				displayname: message.username,
				message: message.text,
				avatar: message.avatar || undefined,
				messageId: getDisplayChatMessageId(message),
				badges: message.badges?.length ? message.badges : undefined,
				userId: message.userId || undefined,
				userLevels: message.userLevels,
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
```

### rumble/actions_tutorial.md

```markdown
---
### Actions
This plugin runs automatically on the poll interval and does not expose actions.
---
```

### rumble/settings_tutorial.md

```markdown
---
### 🔑 Get Your Rumble Livestream API URL
1) Open https://rumble.com/account/livestream-api while logged in.
2) Copy the full Livestream API URL shown on that page.
3) Paste it into the **API Key** field in Lumia (the plugin will extract the `key` automatically).
---
### ✅ Verify Access
Click **Save** to start syncing data.
---
### ⏱️ Adjust Polling
Set a poll interval that balances freshness with API limits (10–300 seconds).
---
```

### rumble/package.json

```json
{
	"name": "lumia-rumble",
	"version": "1.0.0",
	"private": true,
	"description": "Lumia Stream plugin that monitors a Rumble livestream and surfaces follower, rant, reaction, and subscription activity.",
	"main": "main.js",
	"scripts": {},
	"dependencies": {
		"@lumiastream/plugin": "^0.4.1"
	}
}
```

### rumble/translations.json

```json
{
	"en": {
		"live": "Whether the Rumble stream is currently live",
		"viewers": "Current number of concurrent viewers watching the stream",
		"joined": "Total viewers that have joined the stream session",
		"title": "Current stream title",
		"thumbnail": "Stream thumbnail URL",
		"stream_url": "Public URL to the livestream",
		"video_id": "Underlying Rumble video ID",
		"reactions": "Current reaction count on the stream",
		"followers": "Current follower count of the channel",
		"likes": "Thumbs-up reactions on the stream",
		"dislikes": "Thumbs-down reactions on the stream",
		"subs": "Total paid subscriptions/memberships for the channel",
		"sub_gifts": "Gifted subscriptions/memberships received during the stream",
		"rants": "Number of Rants received this stream",
		"rant_amount": "Total value of Rants received this stream",
		"chat_members": "Active chat members in the livestream chat",
		"category": "Category assigned to the livestream",
		"description": "Short description of the livestream",
		"language": "Language reported by Rumble for the stream",
		"chat_url": "Direct URL to the livestream chat",
		"channel_name": "Rumble channel display name",
		"channel_image": "Avatar image URL for the Rumble channel",
		"started_at": "Timestamp of when the stream went live (ISO 8601)",
		"scheduled_start": "Scheduled start time for the stream (ISO 8601)"
	}
}
```

## Example: trovo

Source folder `examples/trovo`, category `platforms`. Trovo Live integration with chat, alerts, chatbot, moderation, variables, and stream actions.

### trovo/manifest.json

```json
{
	"id": "trovo_live",
	"name": "Trovo",
	"version": "1.0.2",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://lumiastream.com",
	"description": "Trovo Live integration with chat, alerts, chatbot, moderation, variables, and stream actions.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "platforms",
	"keywords": "trovo, livestream, chat, alerts, spells",
	"icon": "trovo.png",
	"config": {
		"hasChatbot": true,
		"oauth": {
			"buttonLabel": "Authorize Trovo",
			"helperText": "Connect your Trovo account to stream chat/events and auto-refresh tokens.",
			"openInBrowser": true,
			"scopes": [
				"user_details_self",
				"chat_connect",
				"chat_send_self",
				"channel_details_self",
				"channel_subscriptions",
				"channel_update_self",
				"manage_messages",
				"send_to_my_channel"
			],
			"tokenKeys": {
				"accessToken": "accessToken",
				"refreshToken": "refreshToken",
				"tokenSecret": "tokenSecret"
			}
		},
		"settings": [
			{
				"key": "accessToken",
				"label": "Access Token",
				"type": "password",
				"helperText": "Auto-filled after OAuth completes.",
				"disabled": true,
				"required": false
			},
			{
				"key": "refreshToken",
				"label": "Refresh Token",
				"type": "password",
				"helperText": "Auto-filled after OAuth completes.",
				"disabled": true,
				"required": false
			},
			{
				"key": "entranceOnlyWhenLive",
				"label": "Entrance Alerts Only While Live",
				"type": "toggle",
				"defaultValue": true
			},
			{
				"key": "firstChatterOnlyWhenLive",
				"label": "First Chatter Alerts Only While Live",
				"type": "toggle",
				"defaultValue": true
			}
		],
		"modcommandOptions": [
			"delete",
			"ban",
			"unban",
			"timeout",
			"add-moderator",
			"remove-moderator"
		],
		"settings_tutorial": "./settings_tutorial.md",
		"actions_tutorial": "./actions_tutorial.md",
		"actions": [
			{
				"type": "send_chat",
				"label": "Send Chat Message",
				"description": "Send a chatbot message to Trovo.",
				"fields": [
					{
						"key": "message",
						"label": "Message",
						"type": "text",
						"required": true,
						"allowVariables": true
					},
					{
						"key": "chatAsSelf",
						"label": "Chat As Self",
						"type": "checkbox",
						"defaultValue": false
					},
					{
						"key": "color",
						"label": "Message Color (optional)",
						"type": "color"
					}
				]
			},
			{
				"type": "update_live_title",
				"label": "Update Live Title",
				"description": "Update the Trovo live title for your channel.",
				"fields": [
					{
						"key": "liveTitle",
						"label": "Live Title",
						"type": "text",
						"required": true,
						"allowVariables": true
					}
				]
			},
			{
				"type": "update_category",
				"label": "Update Category",
				"description": "Search Trovo categories and update to the closest matching category.",
				"fields": [
					{
						"key": "category",
						"label": "Category (name or id)",
						"type": "text",
						"required": true,
						"allowVariables": true
					}
				]
			},
			{
				"type": "host_channel",
				"label": "Host Channel",
				"description": "Host another Trovo channel using /host command.",
				"fields": [
					{
						"key": "username",
						"label": "Username",
						"type": "text",
						"required": true,
						"allowVariables": true
					}
				]
			},
			{
				"type": "unhost_channel",
				"label": "Unhost Channel",
				"description": "Stop hosting using /unhost command.",
				"fields": []
			},
			{
				"type": "set_title_command",
				"label": "Set Title (Command)",
				"description": "Set stream title using /settitle command.",
				"fields": [
					{
						"key": "title",
						"label": "Title",
						"type": "text",
						"required": true,
						"allowVariables": true
					}
				]
			},
			{
				"type": "trigger_alert",
				"label": "Trigger Alert",
				"description": "Manually trigger one of the Trovo alerts.",
				"fields": [
					{
						"key": "alertKey",
						"label": "Alert",
						"type": "select",
						"required": true,
						"defaultValue": "follower",
						"options": [
							{
								"label": "Stream Live",
								"value": "streamLive"
							},
							{
								"label": "Stream Offline",
								"value": "streamOffline"
							},
							{
								"label": "First Chatter",
								"value": "firstChatter"
							},
							{
								"label": "Entrance",
								"value": "entrance"
							},
							{
								"label": "Channel Join",
								"value": "channelJoin"
							},
							{
								"label": "Follower",
								"value": "follower"
							},
							{
								"label": "Subscriber",
								"value": "subscriber"
							},
							{
								"label": "Gift Subscription",
								"value": "subscriptionGift"
							},
							{
								"label": "Raid",
								"value": "raid"
							},
							{
								"label": "Spell",
								"value": "spell"
							}
						]
					},
					{
						"key": "username",
						"label": "Username",
						"type": "text",
						"allowVariables": true
					},
					{
						"key": "value",
						"label": "Value",
						"type": "text",
						"allowVariables": true
					}
				]
			}
		],
		"variableFunctions": [
			{
				"key": "uptime",
				"label": "Trovo Uptime",
				"description": "Returns current Trovo live uptime as a friendly duration."
			}
		],
		"variables": [
			{
				"name": "uptime",
				"description": "Friendly uptime of the current Trovo live session.",
				"value": ""
			},
			{
				"name": "live",
				"description": "Whether Trovo stream is currently live.",
				"value": false
			},
			{
				"name": "session_chat_count",
				"description": "Number of chat messages seen in current session.",
				"value": 0
			},
			{
				"name": "last_follower",
				"description": "Username of the latest follower event.",
				"value": ""
			},
			{
				"name": "current_first_chatter",
				"description": "First chatter username for the current stream session.",
				"value": ""
			},
			{
				"name": "current_first_chatter_count",
				"description": "Current first chatter streak count.",
				"value": 0
			},
			{
				"name": "previous_first_chatter",
				"description": "First chatter username from previous stream session.",
				"value": ""
			},
			{
				"name": "previous_first_chatter_count",
				"description": "Previous first chatter streak count.",
				"value": 0
			},
			{
				"name": "last_chatter",
				"description": "Username of the latest chat message author.",
				"value": ""
			},
			{
				"name": "last_raider",
				"description": "Username of the latest raider.",
				"value": ""
			},
			{
				"name": "last_raid_amount",
				"description": "Viewer count from the latest raid.",
				"value": 0
			},
			{
				"name": "session_follower_count",
				"description": "Follower events counted for current session.",
				"value": 0
			},
			{
				"name": "session_subscribers_count",
				"description": "Subscriber events counted for current session.",
				"value": 0
			},
			{
				"name": "session_raiders",
				"description": "Comma-separated list of raiders for current session.",
				"value": ""
			},
			{
				"name": "last_subscriber",
				"description": "Username of the latest subscriber or gift recipient.",
				"value": ""
			},
			{
				"name": "session_subscribers",
				"description": "Comma-separated list of subscribers for current session.",
				"value": ""
			},
			{
				"name": "channel_id",
				"description": "Resolved Trovo channel ID.",
				"value": ""
			},
			{
				"name": "username",
				"description": "Resolved Trovo username.",
				"value": ""
			},
			{
				"name": "display_name",
				"description": "Resolved Trovo display name.",
				"value": ""
			},
			{
				"name": "last_spell",
				"description": "Name of the latest Trovo spell.",
				"value": ""
			},
			{
				"name": "last_spell_amount",
				"description": "Quantity of the latest Trovo spell.",
				"value": 0
			},
			{
				"name": "last_spell_value",
				"description": "Value per unit of the latest Trovo spell.",
				"value": 0
			},
			{
				"name": "last_message",
				"description": "Text of the latest relayed Trovo chat message.",
				"value": ""
			},
			{
				"name": "last_message_id",
				"description": "Message id of the latest relayed Trovo chat message.",
				"value": ""
			},
			{
				"name": "last_event_at",
				"description": "ISO timestamp of the latest Trovo event processed.",
				"value": ""
			}
		],
		"alerts": [
			{
				"title": "Stream Live",
				"key": "streamLive",
				"acceptedVariables": [
					"live",
					"username",
					"channel_id",
					"uptime"
				],
				"defaultMessage": "{{username}} is now live on Trovo!"
			},
			{
				"title": "Stream Offline",
				"key": "streamOffline",
				"acceptedVariables": [
					"live",
					"username",
					"uptime"
				],
				"defaultMessage": "{{username}} has ended the Trovo stream."
			},
			{
				"title": "First Chatter",
				"key": "firstChatter",
				"acceptedVariables": [
					"current_first_chatter",
					"current_first_chatter_count",
					"previous_first_chatter",
					"previous_first_chatter_count",
					"live"
				],
				"defaultMessage": "{{username}} is first chatter!",
				"variationConditions": [
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			},
			{
				"title": "Entrance",
				"key": "entrance",
				"acceptedVariables": [
					"live",
					"session_chat_count"
				],
				"defaultMessage": "{{username}} entered chat.",
				"variationConditions": [
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			},
			{
				"title": "Channel Join",
				"key": "channelJoin",
				"acceptedVariables": [
					"live",
					"username"
				],
				"defaultMessage": "{{username}} joined the channel.",
				"defaults": {
					"on": false
				}
			},
			{
				"title": "Follower",
				"key": "follower",
				"acceptedVariables": [
					"last_follower",
					"session_follower_count",
					"username"
				],
				"defaultMessage": "New Trovo follower: {{username}}",
				"variationConditions": [
					{
						"type": "GREATER_NUMBER",
						"description": "Follower count is greater than.."
					},
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			},
			{
				"title": "Subscriber",
				"key": "subscriber",
				"acceptedVariables": [
					"last_subscriber",
					"session_subscribers_count",
					"session_subscribers",
					"username"
				],
				"defaultMessage": "New Trovo subscriber: {{username}}",
				"variationConditions": [
					{
						"type": "GREATER_NUMBER",
						"description": "Subscriber count is greater than.."
					},
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			},
			{
				"title": "Gift Subscription",
				"key": "subscriptionGift",
				"acceptedVariables": [
					"last_subscriber",
					"session_subscribers_count",
					"session_subscribers",
					"username"
				],
				"defaultMessage": "Gift subscription event by {{username}}",
				"variationConditions": [
					{
						"type": "GREATER_NUMBER",
						"description": "Gift amount is greater than.."
					},
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			},
			{
				"title": "Raid",
				"key": "raid",
				"acceptedVariables": [
					"last_raider",
					"last_raid_amount",
					"session_raiders",
					"username"
				],
				"defaultMessage": "{{username}} raided with {{value}} viewers!",
				"variationConditions": [
					{
						"type": "GREATER_NUMBER",
						"description": "Raid amount is greater than.."
					},
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			},
			{
				"title": "Spell",
				"key": "spell",
				"acceptedVariables": [
					"last_spell",
					"last_spell_amount",
					"last_spell_value",
					"username"
				],
				"defaultMessage": "{{username}} cast {{spell}} x{{spell_quantity}}"
			}
		],
		"translations": "./translations.json"
	}
}
```

### trovo/main.js

```javascript
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
```

### trovo/actions_tutorial.md

```markdown
---
### Actions
- **Send Chat Message**: post a message to Trovo chat.
- **Update Live Title**: update your Trovo stream title via channel API.
- **Update Category**: find the closest Trovo category from your text and update it.
- **Host Channel**: run `/host username` command.
- **Unhost Channel**: run `/unhost` command.
- **Set Title (Command)**: run `/settitle title` command.
- **Trigger Alert**: fire one Trovo alert manually for testing.
---
```

### trovo/settings_tutorial.md

```markdown
---
### Setup
1) Click **Authorize Trovo** in the OAuth section.
2) Save the plugin; it will fetch your profile and chat token, then connect to Trovo websocket chat.

### Notes
- Access/refresh tokens are filled automatically by OAuth and refreshed at runtime.
- Channel ID and username are auto-detected from Trovo API.
- Entrance and first chatter alerts can be limited to live sessions with the provided toggles.
---
```

### trovo/package.json

```json
{
	"name": "lumia-trovo",
	"version": "1.0.0",
	"private": true,
	"description": "Lumia Stream Trovo plugin with realtime chat/events, alerts, variables, and actions.",
	"main": "main.js",
	"scripts": {},
	"dependencies": {
		"@lumiastream/plugin": "^0.4.1",
		"ws": "^8.18.3"
	}
}
```

### trovo/translations.json

```json
{
	"en": {
		"uptime": "Friendly uptime of the current Trovo live session.",
		"live": "Whether Trovo stream is currently live.",
		"session_chat_count": "Number of chat messages seen in current session.",
		"last_follower": "Username of the latest follower event.",
		"current_first_chatter": "First chatter username for the current stream session.",
		"current_first_chatter_count": "Current first chatter streak count.",
		"previous_first_chatter": "First chatter username from previous stream session.",
		"previous_first_chatter_count": "Previous first chatter streak count.",
		"last_chatter": "Username of the latest chat message author.",
		"last_raider": "Username of the latest raider.",
		"last_raid_amount": "Viewer count from the latest raid.",
		"session_follower_count": "Follower events counted for current session.",
		"session_subscribers_count": "Subscriber events counted for current session.",
		"session_raiders": "Comma-separated list of raiders for current session.",
		"last_subscriber": "Username of the latest subscriber or gift recipient.",
		"session_subscribers": "Comma-separated list of subscribers for current session.",
		"channel_id": "Resolved Trovo channel ID.",
		"username": "Resolved Trovo username.",
		"display_name": "Resolved Trovo display name.",
		"last_spell": "Name of the latest Trovo spell.",
		"last_spell_amount": "Quantity of the latest Trovo spell.",
		"last_spell_value": "Value per unit of the latest Trovo spell.",
		"last_message": "Text of the latest relayed Trovo chat message.",
		"last_message_id": "Message id of the latest relayed Trovo chat message.",
		"last_event_at": "ISO timestamp of the latest Trovo event processed."
	}
}
```

## Example: x

Source folder `examples/x`, category `platforms`. Create and delete X posts with your own developer tokens, sync account variables, and trigger polling-based alerts for mentions and follower growth.

### x/manifest.json

```json
{
	"id": "x",
	"name": "X",
	"version": "1.0.0",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://lumiastream.com",
	"description": "Create and delete X posts with your own developer tokens, sync account variables, and trigger polling-based alerts for mentions and follower growth.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "platforms",
	"keywords": "x, twitter, social, posts, mentions, followers",
	"icon": "x.png",
	"config": {
		"settings_tutorial": "./settings_tutorial.md",
		"actions_tutorial": "./actions_tutorial.md",
		"settings": [
			{
				"key": "consumerKey",
				"label": "Consumer Key",
				"type": "password",
				"helperText": "From your X app's Keys and tokens page.",
				"required": true,
				"refreshOnChange": true,
				"section": "Authentication",
				"sectionOrder": 1
			},
			{
				"key": "consumerSecret",
				"label": "Consumer Secret",
				"type": "password",
				"helperText": "From your X app's Keys and tokens page.",
				"required": true,
				"refreshOnChange": true,
				"section": "Authentication",
				"sectionOrder": 1
			},
			{
				"key": "accessToken",
				"label": "Access Token",
				"type": "password",
				"helperText": "User access token generated for your X app.",
				"required": true,
				"refreshOnChange": true,
				"section": "Authentication",
				"sectionOrder": 1
			},
			{
				"key": "accessTokenSecret",
				"label": "Access Token Secret",
				"type": "password",
				"helperText": "User access token secret generated for your X app.",
				"required": true,
				"refreshOnChange": true,
				"section": "Authentication",
				"sectionOrder": 1
			},
			{
				"key": "username",
				"label": "Expected Username",
				"type": "text",
				"placeholder": "optional_handle",
				"helperText": "Optional safety check. If set, Lumia will warn when the token belongs to a different account.",
				"refreshOnChange": true,
				"section": "Authentication",
				"sectionOrder": 1
			},
			{
				"key": "enableAlerts",
				"label": "Enable Alerts",
				"type": "checkbox",
				"defaultValue": false,
				"helperText": "Master switch for all background X alert polling. Leave this off to avoid background read usage.",
				"refreshOnChange": true,
				"section": "Alerts",
				"sectionOrder": 2
			},
			{
				"key": "pollInterval",
				"label": "Poll Interval (seconds)",
				"type": "number",
				"defaultValue": 300,
				"min": 15,
				"max": 900,
				"helperText": "How often to refresh profile, mentions, and follower totals when alerts are enabled.",
				"refreshOnChange": true,
				"section": "Alerts",
				"sectionOrder": 2,
				"visibleIf": {
					"key": "enableAlerts",
					"equals": true
				}
			},
			{
				"key": "trackFollowerAlerts",
				"label": "Follower Alerts",
				"type": "checkbox",
				"defaultValue": false,
				"helperText": "Trigger Lumia alerts when follower count increases. Disabled by default to avoid background read usage.",
				"refreshOnChange": true,
				"section": "Alerts",
				"sectionOrder": 2,
				"visibleIf": {
					"key": "enableAlerts",
					"equals": true
				}
			},
			{
				"key": "trackMentionAlerts",
				"label": "Mention Alerts",
				"type": "checkbox",
				"defaultValue": false,
				"helperText": "Trigger Lumia alerts for new mentions and replies found in the mention timeline. Disabled by default to avoid background read usage.",
				"refreshOnChange": true,
				"section": "Alerts",
				"sectionOrder": 2,
				"visibleIf": {
					"key": "enableAlerts",
					"equals": true
				}
			},
			{
				"key": "latestPostMode",
				"label": "Latest Post Timeline",
				"type": "select",
				"defaultValue": "posts_only",
				"options": [
					{
						"label": "Posts Only",
						"value": "posts_only"
					},
					{
						"label": "Include Replies",
						"value": "include_replies"
					}
				],
				"helperText": "Choose whether the latest-post variables should ignore replies.",
				"refreshOnChange": true,
				"section": "Alerts",
				"sectionOrder": 2,
				"visibleIf": {
					"key": "enableAlerts",
					"equals": true
				}
			},
			{
				"key": "debugLogs",
				"label": "Debug Logs",
				"type": "checkbox",
				"defaultValue": false,
				"helperText": "Writes extra X API diagnostics to the Lumia plugin log.",
				"refreshOnChange": true,
				"section": "Advanced",
				"sectionOrder": 3
			}
		],
		"actions": [
			{
				"type": "create_post",
				"label": "Create Post",
				"description": "Create a text, reply, quote, image, or video post on X.",
				"fields": [
					{
						"key": "text",
						"label": "Text",
						"type": "textarea",
						"required": true,
						"rows": 5,
						"allowVariables": true
					},
					{
						"key": "replyToPostId",
						"label": "Reply To Post ID",
						"type": "text",
						"allowVariables": true
					},
					{
						"key": "quotePostId",
						"label": "Quote Post ID",
						"type": "text",
						"allowVariables": true
					},
					{
						"key": "media",
						"label": "Media",
						"type": "media",
						"allowVariables": true,
						"helperText": "Optional. Choose one local file or enter one https URL. Images and mp4/webm/mov video are supported."
					}
				]
			},
			{
				"type": "delete_post",
				"label": "Delete Post",
				"description": "Delete a specific X post by ID.",
				"fields": [
					{
						"key": "postId",
						"label": "Post ID",
						"type": "text",
						"required": true,
						"allowVariables": true
					}
				]
			},
			{
				"type": "delete_latest_post",
				"label": "Delete Latest Created Post",
				"description": "Delete the last post created by this plugin session, or the latest saved post if available.",
				"fields": []
			},
			{
				"type": "like_post",
				"label": "Like Post",
				"description": "Like a post on behalf of the authenticated user.",
				"fields": [
					{
						"key": "postId",
						"label": "Post ID",
						"type": "text",
						"required": true,
						"allowVariables": true
					}
				]
			},
			{
				"type": "repost_post",
				"label": "Repost Post",
				"description": "Repost a post on behalf of the authenticated user.",
				"fields": [
					{
						"key": "postId",
						"label": "Post ID",
						"type": "text",
						"required": true,
						"allowVariables": true
					}
				]
			},
			{
				"type": "follow_user",
				"label": "Follow User",
				"description": "Follow a user by handle or numeric user ID.",
				"fields": [
					{
						"key": "user",
						"label": "Handle Or User ID",
						"type": "text",
						"required": true,
						"allowVariables": true
					}
				]
			}
		],
		"variables": [
			{
				"name": "user_id",
				"description": "Authenticated X user ID.",
				"value": ""
			},
			{
				"name": "username",
				"description": "Authenticated X handle without @.",
				"value": ""
			},
			{
				"name": "display_name",
				"description": "Authenticated X display name.",
				"value": ""
			},
			{
				"name": "bio",
				"description": "Current account bio/description.",
				"value": ""
			},
			{
				"name": "verified",
				"description": "Whether the authenticated account is verified.",
				"value": false
			},
			{
				"name": "followers_count",
				"description": "Current follower count from X public metrics.",
				"value": 0
			},
			{
				"name": "following_count",
				"description": "Current following count from X public metrics.",
				"value": 0
			},
			{
				"name": "listed_count",
				"description": "Current listed count from X public metrics.",
				"value": 0
			},
			{
				"name": "post_count",
				"description": "Current post count from X public metrics.",
				"value": 0
			},
			{
				"name": "latest_post_id",
				"description": "Most recent authored post ID seen by the plugin.",
				"value": ""
			},
			{
				"name": "latest_post_text",
				"description": "Text of the most recent authored post seen by the plugin.",
				"value": ""
			},
			{
				"name": "latest_post_url",
				"description": "URL of the most recent authored post seen by the plugin.",
				"value": ""
			},
			{
				"name": "latest_post_created_at",
				"description": "ISO timestamp of the most recent authored post seen by the plugin.",
				"value": ""
			},
			{
				"name": "last_created_post_id",
				"description": "Most recent post ID created by the plugin via an action.",
				"value": ""
			},
			{
				"name": "latest_mention_id",
				"description": "Most recent mention ID seen by the plugin.",
				"value": ""
			},
			{
				"name": "latest_mention_text",
				"description": "Text of the most recent mention seen by the plugin.",
				"value": ""
			},
			{
				"name": "latest_mention_author",
				"description": "Author handle of the most recent mention seen by the plugin.",
				"value": ""
			},
			{
				"name": "latest_mention_url",
				"description": "URL of the most recent mention seen by the plugin.",
				"value": ""
			},
			{
				"name": "follower_delta",
				"description": "Follower increase detected during the last polling cycle.",
				"value": 0
			},
			{
				"name": "last_action_status",
				"description": "Short success status from the last executed action.",
				"value": ""
			},
			{
				"name": "last_action_error",
				"description": "Last action error message, if any.",
				"value": ""
			}
		],
		"alerts": [
			{
				"title": "Post Created",
				"key": "post_created",
				"acceptedVariables": [
					"username",
					"display_name",
					"latest_post_id",
					"latest_post_text",
					"latest_post_url",
					"last_created_post_id"
				],
				"defaultMessage": "{{display_name}} posted on X: {{latest_post_text}}"
			},
			{
				"title": "Mention",
				"key": "mention",
				"acceptedVariables": [
					"username",
					"display_name",
					"latest_mention_id",
					"latest_mention_text",
					"latest_mention_author",
					"latest_mention_url"
				],
				"defaultMessage": "@{{latest_mention_author}} mentioned {{display_name}} on X."
			},
			{
				"title": "Follower Gain",
				"key": "follower_gain",
				"acceptedVariables": [
					"username",
					"display_name",
					"followers_count",
					"follower_delta"
				],
				"defaultMessage": "{{display_name}} gained {{follower_delta}} follower(s) on X. Total: {{followers_count}}"
			}
		]
	}
}
```

### x/main.js

```javascript
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
```

### x/actions_tutorial.md

```markdown
### Common Actions

- **Create Post**: publish text, replies, quote posts, plus one optional media item from a local file or `https` URL.
- **Delete Latest Created Post**: useful for "go live" announcement cleanup after a stream ends.
- **Like / Repost**: manage engagement on a target post ID.
- **Follow User**: accepts either a numeric X user ID or a handle such as `jack`.

### Live Announcement Flow

To mimic the common "post when live, remove when offline" setup:

1. Trigger **Create Post** from your stream-online event.
2. Use Lumia variables in the post text for title/category/game info.
3. Trigger **Delete Latest Created Post** from your stream-offline event.

### Media Input

The **Media** field opens a picker with local-file and URL modes.

- Local files are returned as absolute paths, for example `/Users/me/Videos/live.mp4`
- Remote files are stored as a single `https://...` URL

Images use the single-upload endpoint. Videos use X's chunked upload flow before the post is created.
```

### x/README.md

```markdown
# Lumia X Plugin Example

This example plugin adds a token-based X integration to Lumia Stream.

## Included

- Create text, reply, quote, image, and video posts with one optional media attachment
- Delete a specific post or the most recent post created by the plugin
- Like, unlike, repost, undo repost, follow, and unfollow actions
- Polling-backed variables for account metrics, latest post, and latest mention
- Alerts for created posts, mentions, and follower growth

## Authentication

The plugin expects the classic four-token X app flow:

- Consumer Key
- Consumer Secret
- Access Token
- Access Token Secret

See [settings_tutorial.md](./settings_tutorial.md) for the setup steps.
```

### x/settings_tutorial.md

```markdown
### Setup

This plugin uses your own X developer app credentials. Lumia does not proxy requests for you, so you need to create your own X app once and paste the keys into the plugin.

### Step-by-Step

1. Open the [X Developer Console](https://console.x.com/), sign in, click **Apps** in the left sidebar, then click **Create App**.

![Open Apps and click Create App](./assets/screen1-create_app.png)

2. In the **Create New Client Application** window:
   - enter any app name you want
   - leave **Environment** set to `Development`
   - click **Create New Client Application**

![Create the client application](./assets/screen2-create_client.png)

3. X will immediately show the first set of credentials. Copy and save these now:
   - `Consumer Key`
   - `Secret Key`

You only get one clean copy popup here, so save them somewhere safe before closing the window.

![Save the Consumer Key and Secret Key](./assets/screen3-consumer_key_and_secret.png)

4. Back on the app page, click your new app, then click **Set up** in the **User authentication settings** section.

![Open the app and click Set up for User authentication settings](./assets/screen4-user_auth_settings.png)

5. Configure authentication like this, then click **Save Changes**:
   - **App permissions**: `Read and write`
   - **Type of App**: `Web App, Automated App or Bot`
   - **Callback / Redirect URI**: `http://localhost`
   - **Website URL**: any valid URL you control, or a harmless placeholder such as `https://lumiastream.com`

If X shows extra optional fields below that, they can stay empty unless your account requires them.

![Configure the authentication settings](./assets/screen5-auth_settings.png)

6. Return to the app's key page. You should be back on the screen that shows the app keys and the **OAuth 1.0 Keys** section. From here:
   - reveal or copy the `Consumer Key` if you have not already saved it
   - click the button next to **Access Token** to generate the user token

![Return to the app key page and generate the access token](./assets/screen-app_key_page_accesstoken.png)

7. X will then show the second set of credentials. Copy and save these too:
   - `Access Token`
   - `Access Token Secret`

At the end of this step you should have all four values the Lumia plugin needs.

![Save the Access Token and Access Token Secret](./assets/screen6-access_token.png)

8. Before testing posts, make sure the app has credits. In the X Developer Console go to:
   - **Billing**
   - **Credits**
   - **Purchase credits**

Without credits, write requests can fail even if the keys are correct.

![Open Billing > Credits and purchase credits](./assets/screen7-credits.png)

9. Back in Lumia, open the X plugin settings and paste the four saved values into:
   - **Consumer Key**
   - **Consumer Secret**
   - **Access Token**
   - **Access Token Secret**

10. Optional: fill in **Expected Username** if you want Lumia to verify that the token belongs to the account you expect.

11. By default, **Enable Alerts** is turned off. This is intentional so the plugin does not spend X API credits on background read requests until you explicitly want alerts.

12. If you want follower or mention alerts later, go to the **Alerts** tab in the plugin settings, then manually turn on:
   - **Enable Alerts**
   - the specific alert types you want
   - the polling interval you are comfortable paying for

13. Save the plugin settings. Then test it with the **Create Post** action. A successful test should publish a post like the example below.

![Example successful test post on X](./assets/screen8-testaction.png)

### Costs and Credit Usage

As of March 30, 2026, X's public docs say the API uses pay-per-usage pricing and that exact prices vary by endpoint. X does not publish a simple fixed dollar table in the docs, so you need to check your live rates in the Developer Console:

- [Pricing](https://docs.x.com/x-api/getting-started/pricing)
- [Usage and Billing](https://docs.x.com/x-api/fundamentals/post-cap)
- [Usage API](https://docs.x.com/x-api/usage/introduction)

### What Each Action Uses

- **Create Post** without media: `1` write request (`POST /2/tweets`)
- **Create Post** with one image: `2` requests (`POST /2/media/upload` + `POST /2/tweets`)
- **Create Post** with one video: variable, but more expensive than an image post because it uses chunked media upload before the final post create call
- **Delete Post**: `1` write request (`DELETE /2/tweets/:id`)
- **Delete Latest Created Post**: `1` write request (`DELETE /2/tweets/:id`)
- **Like Post**: `1` write request (`POST /2/users/:id/likes`)
- **Repost Post**: `1` write request (`POST /2/users/:id/retweets`)
- **Follow User** by numeric user ID: `1` write request (`POST /2/users/:id/following`)
- **Follow User** by username/handle: `2` requests because the plugin first resolves the username, then follows that user

### What Alerts Use

- If **Enable Alerts** is off: `0` background read requests
- If **Enable Alerts** is on and at least one alert type is enabled, the current plugin poll cycle makes `3` read requests each time:
- `GET /2/users/me`
- `GET /2/users/{id}/tweets`
- `GET /2/users/{id}/mentions`

### Poll Interval Examples

- `300` seconds: `288` polls/day = `864` API requests/day
- `60` seconds: `1,440` polls/day = `4,320` API requests/day
- `15` seconds: `5,760` polls/day = `17,280` API requests/day

### Important Billing Notes

- X says **User posts** and **User mentions** timeline endpoints count toward Post usage tracking.
- X says billable resources are usually deduplicated within a `24-hour UTC` window, so repeatedly seeing the same returned Post in one day usually does not bill again.
- X says failed requests do **not** count toward billing.
- The safest way to measure real cost is to keep alerts off at first, test one action at a time, then watch your **Usage** page in the Developer Console.

### Notes

- The plugin uses OAuth 1.0a style user tokens, so you need all four values above.
- Alerts are disabled by default so the plugin does not spend read credits unless you manually turn them on.
- If you enable mention or follower alerts later, the plugin will begin polling X on the interval you choose.
```

### x/package.json

```json
{
	"name": "lumia-x",
	"version": "1.0.0",
	"private": true,
	"description": "Lumia Stream plugin for X that posts with user-supplied developer tokens and exposes polling-based variables and alerts.",
	"main": "main.js",
	"scripts": {},
	"dependencies": {
		"@lumiastream/plugin": "^0.7.2"
	}
}
```
