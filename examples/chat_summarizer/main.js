const { Plugin } = require("@lumiastream/plugin");

const DEFAULT_RULES = {
	feedback: [
		"feedback",
		"suggest",
		"idea",
		"maybe",
		"should",
		"could",
		"recommend",
		"wish",
		"feature",
	],
	questions: ["?", "how", "why", "what", "when", "where", "help", "anyone", "can i", "could i"],
	hype: ["hype", "pog", "poggers", "gg", "lets go", "let's go", "lfg", "fire", "🔥", "wow"],
};

function normalizeText(value) {
	return String(value || "")
		.trim()
		.toLowerCase();
}

function parseCategoryRules(input) {
	const rules = new Map();
	if (!input || typeof input !== "string") return rules;
	const lines = input.split(/\r?\n/);
	for (const raw of lines) {
		const line = raw.trim();
		if (!line) continue;
		const sepIndex = line.indexOf(":");
		if (sepIndex === -1) continue;
		const category = normalizeText(line.slice(0, sepIndex));
		const keywords = line
			.slice(sepIndex + 1)
			.split(",")
			.map((entry) => normalizeText(entry))
			.filter(Boolean);
		if (category && keywords.length) {
			rules.set(category, keywords);
		}
	}
	return rules;
}

function buildRules(settingsCategories, customRules) {
	const selected = Array.isArray(settingsCategories) ? settingsCategories : [];
	const ruleMap = new Map();
	for (const raw of selected) {
		const key = normalizeText(raw);
		if (!key) continue;
		if (customRules.has(key)) {
			ruleMap.set(key, customRules.get(key));
			continue;
		}
		if (DEFAULT_RULES[key]) {
			ruleMap.set(key, DEFAULT_RULES[key]);
		}
	}
	return ruleMap;
}

function truncateText(text, maxLength) {
	if (!maxLength || text.length <= maxLength) return text;
	if (maxLength <= 3) return text.slice(0, maxLength);
	return `${text.slice(0, maxLength - 1)}…`;
}

function renderTemplate(template, data) {
	if (!template || typeof template !== "string") return "";
	return template.replace(/\{(\w+)\}/g, (match, key) => {
		const value = data[key];
		if (value === undefined || value === null) return match;
		return String(value);
	});
}

function formatBucketsAsString(buckets) {
	const intervalMinutes = buckets.intervalMinutes ?? 0;
	const totalMessages = buckets.totalMessages ?? 0;
	const topChatters = buckets.topChatters || "None";

	const parts = [
		`${intervalMinutes}min ago`,
		`totalMessages: ${totalMessages}`,
		`topChatters: ${topChatters}`,
	];

	const formatBucketMessages = (items) =>
		items
			.map((m) => {
				const user = m.displayname || m.username || "?";
				const msg = String(m.message || "").replace(/"/g, "'");
				return `(${user}:"${msg}")`;
			})
			.join(", ");

	for (const [key, items] of Object.entries(buckets.buckets || {})) {
		if (!Array.isArray(items) || !items.length) continue;
		const label = key.charAt(0).toUpperCase() + key.slice(1);
		parts.push(`${label}: ${formatBucketMessages(items)}`);
	}

	if (Array.isArray(buckets.other) && buckets.other.length) {
		parts.push(`Other: ${formatBucketMessages(buckets.other)}`);
	}

	return parts.join(", ");
}

module.exports = class ChatSummarizer extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._timer = null;
		this._buffer = [];
	}

	async onload() {
		this._schedule();
		await this.lumia.updateConnection(true);
		await this._logInfo("Chat Summarizer loaded.");
		await this._toast("Chat Summarizer connected.");
	}

	async onunload() {
		this._clearTimer();
		this._buffer = [];
		await this.lumia.updateConnection(false);
		await this._logInfo("Chat Summarizer unloaded.");
	}

	async onsettingsupdate() {
		this._clearTimer();
		this._schedule();
		await this._logInfo("Settings updated. Summary timer restarted.");
	}

	async actions(config) {
		for (const action of config.actions ?? []) {
			switch (action.type) {
				case "ingest_chat":
					this._ingestChat(action.value || {});
					break;
				case "summarize_now":
					await this._summarizeAndPost(true);
					break;
				case "clear_buffer":
					this._buffer = [];
					await this._logInfo("Buffer cleared via action.");
					break;
				default:
					break;
			}
		}
	}

	_ingestChat(payload) {
		const username = normalizeText(payload.username);
		const message = String(payload.message || "").trim();
		if (!username || !message) return;

		this._buffer.push({
			username,
			displayname: payload.username || username,
			message,
			platform: payload.platform ? String(payload.platform) : "",
			userId: payload.userId ? String(payload.userId) : "",
			timestamp: Date.now(),
		});

		const maxBuffered = this._numberSetting("maxBufferedMessages", 1000, 0, 10000);
		if (maxBuffered > 0 && this._buffer.length > maxBuffered) {
			this._buffer.splice(0, this._buffer.length - maxBuffered);
		}
	}

	_schedule() {
		const intervalMinutes = this._numberSetting("intervalMinutes", 5, 1, 60);
		this._timer = setInterval(() => {
			this._summarizeAndPost(false);
		}, intervalMinutes * 60 * 1000);
	}

	_clearTimer() {
		if (this._timer) {
			clearInterval(this._timer);
			this._timer = null;
		}
	}

	async _summarizeAndPost(force) {
		const minMessages = this._numberSetting("minMessages", 5, 1, 1000);
		if (!force && this._buffer.length < minMessages) {
			await this._logDebug(
				`Summary skipped. ${this._buffer.length} messages buffered (min ${minMessages}).`,
			);
			return;
		}

		const snapshot = this._buffer.slice();
		this._buffer = [];
		if (!snapshot.length) return;

		const summaryResult = this._buildSummary(snapshot);
		const summaryUsername =
			String(this.settings.summaryUsername || "Chat Summary").trim() || "Chat Summary";

		this.displayChat({
			username: summaryUsername,
			displayname: summaryUsername,
			message: summaryResult.text,
			skipCommandProcessing: true,
			userLevels: { isSelf: true },
		});
		await this.lumia.setVariable("summary_buckets", formatBucketsAsString(summaryResult.buckets));
		await this._logInfo(`Summary posted (${snapshot.length} messages).`);
		await this._toast("Chat summary posted.");
	}

	_buildSummary(messages) {
		const intervalMinutes = this._numberSetting("intervalMinutes", 5, 1, 60);
		const totalMessages = messages.length;
		const userMap = new Map();
		for (const item of messages) {
			const key = item.username;
			const entry = userMap.get(key) || {
				displayname: item.displayname || key,
				count: 0,
				messages: [],
			};
			entry.count += 1;
			entry.messages.push(item.message);
			userMap.set(key, entry);
		}

		const uniqueUsers = userMap.size;
		const topChatters = Array.from(userMap.values())
			.sort((a, b) => b.count - a.count)
			.slice(0, 5)
			.map((entry) => `${entry.displayname}(${entry.count})`)
			.join(", ");

		const categories = Array.isArray(this.settings.categories)
			? this.settings.categories
			: ["feedback", "questions", "hype"];
		const customRules = parseCategoryRules(this.settings.categoryRules);
		const ruleMap = buildRules(categories, customRules);

		const categoryUsers = new Map();
		const categoryBuckets = new Map();
		for (const raw of categories) {
			const key = normalizeText(raw);
			if (!key) continue;
			categoryUsers.set(key, new Set());
			categoryBuckets.set(key, []);
		}
		const otherUsers = new Set();
		const otherBucket = [];

		for (const [username, entry] of userMap.entries()) {
			const text = normalizeText(entry.messages.join(" "));
			let matched = false;
			for (const [category, keywords] of ruleMap.entries()) {
				for (const keyword of keywords) {
					if (!keyword) continue;
					if (keyword === "?" ? text.includes("?") : text.includes(keyword)) {
						categoryUsers.get(category)?.add(entry.displayname || username);
						matched = true;
						break;
					}
				}
			}
			if (!matched) {
				otherUsers.add(entry.displayname || username);
			}
		}

		for (const item of messages) {
			const messageText = normalizeText(item.message);
			const matchedCategories = [];
			for (const [category, keywords] of ruleMap.entries()) {
				for (const keyword of keywords) {
					if (!keyword) continue;
					if (keyword === "?" ? messageText.includes("?") : messageText.includes(keyword)) {
						matchedCategories.push(category);
						break;
					}
				}
			}

			const payload = {
				username: item.username,
				displayname: item.displayname,
				message: item.message,
				timestamp: item.timestamp,
				platform: item.platform,
				userId: item.userId,
			};

			if (!matchedCategories.length) {
				otherBucket.push(payload);
				continue;
			}

			for (const category of matchedCategories) {
				categoryBuckets.get(category)?.push(payload);
			}
		}

		const maxUsersPerCategory = this._numberSetting("maxUsersPerCategory", 10, 1, 50);
		const categoryLines = [];
		for (const [category, users] of categoryUsers.entries()) {
			const label = category.charAt(0).toUpperCase() + category.slice(1);
			const list = Array.from(users);
			const display = this._limitNames(list, maxUsersPerCategory);
			if (display) categoryLines.push(`${label}: ${display}`);
		}
		if (otherUsers.size) {
			const display = this._limitNames(Array.from(otherUsers), maxUsersPerCategory);
			if (display) categoryLines.push(`Other: ${display}`);
		}

		const summaryTemplate = String(this.settings.summaryTemplate || "").trim();
		const templateData = {
			interval: intervalMinutes,
			totalMessages,
			uniqueUsers,
			topChatters: topChatters || "None",
			categories: categoryLines.length ? categoryLines.join(" | ") : "None",
		};

		const templateResult = summaryTemplate ? renderTemplate(summaryTemplate, templateData) : "";
		const lines = templateResult
			? [templateResult]
			: [
					`Chat Summary (last ${intervalMinutes} min): ${totalMessages} messages from ${uniqueUsers} users.`,
					`Top chatters: ${topChatters || "None"}.`,
					`Categories: ${categoryLines.length ? categoryLines.join(" | ") : "None"}.`,
				];

		const maxSummaryLength = this._numberSetting("maxSummaryLength", 350, 100, 2000);
		const summaryText = truncateText(lines.join(" "), maxSummaryLength);
		const buckets = {
			intervalMinutes,
			totalMessages,
			uniqueUsers,
			topChatters: topChatters || "",
			categories: categoryLines,
			buckets: Object.fromEntries(categoryBuckets),
			other: otherBucket,
		};
		return { text: summaryText, buckets };
	}

	_limitNames(list, maxCount) {
		if (!list.length) return "";
		if (list.length <= maxCount) return list.join(", ");
		const head = list.slice(0, maxCount).join(", ");
		return `${head} (+${list.length - maxCount})`;
	}

	_numberSetting(key, fallback, min, max) {
		const raw = this.settings?.[key];
		const num = Number(raw);
		if (!Number.isFinite(num)) return fallback;
		if (min !== undefined && num < min) return min;
		if (max !== undefined && num > max) return max;
		return num;
	}

	async _logInfo(message) {
		if (this.lumia?.log) {
			await this.lumia.log({ message, level: "info" });
		}
	}

	async _logDebug(message) {
		if (this.lumia?.log) {
			await this.lumia.log({ message, level: "debug" });
		}
	}

	async _toast(message) {
		if (this.lumia?.showToast) {
			await this.lumia.showToast({ message, time: 3000 });
		}
	}
};
