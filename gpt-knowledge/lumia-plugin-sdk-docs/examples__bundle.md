# Lumia Plugin Examples

Combined source files from the `examples/` directory. Each section shows the original path followed by file contents.

## base_plugin/README.md

```
# Showcase Plugin Template

This template demonstrates a minimal, production-friendly Lumia Stream plugin workflow:

- Defines a small set of settings with a short setup tutorial
- Exposes a single action that triggers an alert
- Updates a few variables that alerts and other Lumia features can use
- Keeps logging to errors only

Use the CLI to copy and customize the template:

```
npx lumia-plugin create my_plugin
```

After scaffolding you can tailor the manifest, code, and README to match your idea.

```

## base_plugin/actions_tutorial.md

```
---
### Trigger Sample Alert
Use this action to fire the sample alert. You can override the message, username, color, and duration per action. The alert uses both dynamic and extraSettings so variations and templates have the same data.
---

```

## base_plugin/main.js

```
const { Plugin } = require("@lumiastream/plugin");

const DEFAULTS = {
	message: "Hello from Showcase Plugin!",
	username: "Viewer",
	color: "#00c2ff",
	duration: 5,
};

const VARIABLE_NAMES = {
	message: "message",
	username: "username",
	color: "color",
	duration: "duration",
};

class ShowcasePluginTemplate extends Plugin {
	async onload() {
		await this._syncDefaults();
	}

	async onsettingsupdate(settings, previous = {}) {
		if (
			settings?.defaultMessage !== previous?.defaultMessage ||
			settings?.defaultColor !== previous?.defaultColor ||
			settings?.defaultDuration !== previous?.defaultDuration
		) {
			await this._syncDefaults(settings);
		}
	}

	async actions(config) {
		for (const action of config.actions) {
			if (action.type === "trigger_alert") {
				await this._triggerSampleAlert(action.value);
			}
		}
	}

	async _syncDefaults(settings = this.settings) {
		const message = settings?.defaultMessage ?? DEFAULTS.message;
		const color = settings?.defaultColor ?? DEFAULTS.color;
		const duration = Number(settings?.defaultDuration ?? DEFAULTS.duration);

		await this.lumia.setVariable(VARIABLE_NAMES.message, message);
		await this.lumia.setVariable(VARIABLE_NAMES.color, color);
		await this.lumia.setVariable(VARIABLE_NAMES.duration, duration);
	}

	async _triggerSampleAlert(data = {}) {
		const username = data?.username ?? DEFAULTS.username;
		const message =
			data?.message ?? this.settings?.defaultMessage ?? DEFAULTS.message;
		const color = data?.color ?? this.settings?.defaultColor ?? DEFAULTS.color;
		const duration = Number(
			data?.duration ?? this.settings?.defaultDuration ?? DEFAULTS.duration
		);

		await this.lumia.setVariable(VARIABLE_NAMES.username, username);
		await this.lumia.setVariable(VARIABLE_NAMES.message, message);
		await this.lumia.setVariable(VARIABLE_NAMES.color, color);
		await this.lumia.setVariable(VARIABLE_NAMES.duration, duration);

		try {
			await this.lumia.triggerAlert({
				alert: "sample_alert",
				dynamic: {
					value: color,
					username,
					message,
					color,
					duration,
				},
				extraSettings: {
					username,
					message,
					color,
					duration,
				},
			});
		} catch (error) {
			await this.lumia.log(
				`Sample alert failed: ${error?.message ?? String(error)}`
			);
		}
	}
}

module.exports = ShowcasePluginTemplate;

```

## base_plugin/manifest.json

```
{
	"id": "showcase_plugin",
	"name": "Showcase Plugin",
	"version": "1.0.2",
	"author": "Lumia Stream",
	"email": "",
	"website": "",
	"repository": "",
	"description": "Starter template that demonstrates settings, actions, variables, and alerts with a minimal code path.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "apps",
	"keywords": "sample, demo, lumia, showcase, template",
	"icon": "",
	"changelog": "",
	"config": {
		"settings": [
			{
				"key": "defaultMessage",
				"label": "Default Message",
				"type": "text",
				"defaultValue": "Hello from Showcase Plugin!",
				"helperText": "Used when the action does not supply a message."
			},
			{
				"key": "defaultColor",
				"label": "Default Color",
				"type": "color",
				"defaultValue": "#00c2ff",
				"helperText": "Used when the action does not supply a color."
			},
			{
				"key": "defaultDuration",
				"label": "Default Duration (seconds)",
				"type": "number",
				"defaultValue": 5,
				"min": 1,
				"max": 60,
				"helperText": "Used when the action does not supply a duration."
			}
		],
		"settings_tutorial": "./settings_tutorial.md",
		"actions_tutorial": "./actions_tutorial.md",
		"actions": [
			{
				"type": "trigger_alert",
				"label": "Trigger Sample Alert",
				"description": "Trigger the sample alert with optional overrides.",
				"fields": [
					{
						"key": "username",
						"label": "Username",
						"type": "text",
						"defaultValue": "Viewer"
					},
					{
						"key": "message",
						"label": "Message",
						"type": "text",
						"defaultValue": "Hello from Showcase Plugin!"
					},
					{
						"key": "color",
						"label": "Color",
						"type": "color",
						"defaultValue": "#00c2ff"
					},
					{
						"key": "duration",
						"label": "Duration (seconds)",
						"type": "number",
						"defaultValue": 5,
						"min": 1,
						"max": 60
					}
				]
			}
		],
		"variables": [
			{
				"name": "message",
				"description": "Stores the most recent message handled by the plugin.",
				"value": ""
			},
			{
				"name": "username",
				"description": "Stores the most recent username handled by the plugin.",
				"value": ""
			},
			{
				"name": "color",
				"description": "Tracks the color used by the latest sample alert.",
				"value": ""
			},
			{
				"name": "duration",
				"description": "Tracks the duration used by the latest sample alert.",
				"value": 0
			}
		],
		"alerts": [
			{
				"title": "Sample Alert",
				"key": "sample_alert",
				"acceptedVariables": [
					"message",
					"username",
					"color",
					"duration"
				],
				"defaultMessage": "{{username}}: {{message}}",
				"variationConditions": [
					{
						"type": "EQUAL_SELECTION",
						"description": "Matches dynamic.value against the selected color.",
						"selections": [
							{
								"label": "Blue",
								"value": "#00c2ff"
							},
							{
								"label": "Red",
								"value": "#ff5f5f"
							}
						]
					}
				]
			}
		],
		"translations": "./translations.json"
	}
}

```

## base_plugin/package.json

```
{
	"name": "lumia-showcase-plugin-template",
	"version": "1.0.0",
	"private": true,
	"description": "Internal template illustrating settings, actions, variables, and alerts for Lumia Stream plugins.",
	"main": "main.js",
	"dependencies": {
		"@lumiastream/plugin": "^0.4.2"
	}
}

```

## base_plugin/settings_tutorial.md

```
---
### Setup
1) Enter a default message and color.
2) Adjust the default duration if you want a longer or shorter alert.
3) Click Save to store the defaults.
---
### What this plugin does
- Stores the message, username, color, and duration in variables.
- Uses those values when triggering the sample alert.
---

```

## base_plugin/translations.json

```
{
	"en": {
		"message": "Stores the most recent message handled by the plugin.",
		"username": "Stores the most recent username handled by the plugin.",
		"color": "Tracks the color used by the latest sample alert.",
		"duration": "Tracks the duration used by the latest sample alert."
	}
}

```

## chat_summarizer/README.md

```
# Chat Summarizer (Lumia Stream)

Summarizes recent chat messages on a timer and posts the summary back into the Lumia chat message box. It also highlights users by category.

## How it works

- Use a Lumia automation (or dashboard chat trigger) to call **Ingest Chat Message** for each incoming chat message.
- The plugin buffers messages and posts a summary every N minutes.
- Categories and limits are configured in the plugin settings.

## Suggested Lumia automation

Trigger: **On Chat Message**
Action: **Chat Summarizer → Ingest Chat Message**

Fields:
- Username: `{{username}}`
- Message: `{{message}}`
- Platform: `{{site}}`
- User ID: `{{user_id}}`

## Actions

- **Ingest Chat Message**: Adds one message to the buffer.
- **Summarize Now**: Forces a summary immediately.
- **Clear Buffer**: Clears all buffered messages.

## Settings

- **Summary Interval (minutes)**: How often to summarize.
- **Summary Template**: Control the message format with placeholders like `{interval}` and `{topChatters}`.
- **Categories**: Which categories to include (defaults: feedback, questions, hype).
- **Category Keywords**: Optional per-category keyword overrides.
- **Minimum Messages to Summarize**: Skip summaries when chat is quiet.
- **Max Users Per Category**: Limits list length.
- **Max Summary Length**: Trims long summaries.
- **Max Buffered Messages**: Prevents unbounded memory growth (use 0 for unlimited).

## Variables

- `summary_buckets`: Readable string like `5min ago, totalMessages: 8, topChatters: user1, user2; feedback: (user1:"msg"), (user2:"msg")`. Only buckets with messages are shown.

```

## chat_summarizer/main.js

```
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

```

## chat_summarizer/manifest.json

```
{
  "id": "chat_summarizer",
  "name": "Chat Summarizer",
  "version": "1.0.0",
  "author": "Lumia Stream",
  "email": "dev@lumiastream.com",
  "website": "https://lumiastream.com",
  "description": "Summarizes chat on an interval and highlights users by category.",
  "license": "MIT",
  "lumiaVersion": "^9.0.0",
  "category": "apps",
  "keywords": "chat, summary, moderation, analytics",
  "icon": "chat_summarizer.png",
  "changelog": "",
  "bundle": {
    "commands": [
      "bundle/chatmatch/chat-summary_chatmatch.lumia",
      "bundle/commands/summarize_command.lumia"
    ]
  },
  "config": {
    "settings": [
      {
        "key": "summaryTemplate",
        "label": "Summary Template",
        "type": "textarea",
        "defaultValue": "Chat Summary (last {interval} min): {totalMessages} messages from {uniqueUsers} users. Top chatters: {topChatters}. Categories: {categories}.",
        "helperText": "Template placeholders: {interval}, {totalMessages}, {uniqueUsers}, {topChatters}, {categories}.",
        "section": "Summarizer",
        "sectionOrder": 2
      },
      {
        "key": "intervalMinutes",
        "label": "Summary Interval (minutes)",
        "type": "number",
        "defaultValue": 5,
        "min": 1,
        "max": 60,
        "helperText": "How often to summarize chat.",
        "refreshOnChange": true,
        "section": "Connection",
        "sectionOrder": 1,
        "group": "connection"
      },
      {
        "key": "summaryUsername",
        "label": "Summary Username",
        "type": "text",
        "defaultValue": "Chat Summary",
        "helperText": "Shown as the username in Lumia chat.",
        "section": "Connection",
        "sectionOrder": 1,
        "group": "connection"
      },
      {
        "key": "categories",
        "label": "Categories",
        "type": "select",
        "multiple": true,
        "allowTyping": true,
        "defaultValue": ["feedback", "questions", "hype"],
        "options": [
          { "label": "Feedback", "value": "feedback" },
          { "label": "Questions", "value": "questions" },
          { "label": "Hype", "value": "hype" }
        ],
        "helperText": "Select categories to include in the summary.",
        "section": "Summarizer",
        "sectionOrder": 2
      },
      {
        "key": "categoryRules",
        "label": "Category Keywords (optional)",
        "type": "textarea",
        "defaultValue": "feedback: feedback, suggest, idea, maybe, should, could, recommend, wish, feature\nquestions: ?, how, why, what, when, where, help, anyone, can i, could i\nhype: hype, pog, poggers, gg, lets go, let's go, lfg, fire, 🔥, wow",
        "helperText": "One category per line: category: keyword1, keyword2. Overrides defaults for listed categories. Example: feedback: suggest, idea, should",
        "section": "Summarizer",
        "sectionOrder": 2
      },
      {
        "key": "minMessages",
        "label": "Minimum Messages to Summarize",
        "type": "number",
        "defaultValue": 5,
        "min": 1,
        "max": 1000,
        "helperText": "Skip summary if fewer messages are collected in the interval.",
        "section": "Summarizer",
        "sectionOrder": 2
      },
      {
        "key": "maxUsersPerCategory",
        "label": "Max Users Per Category",
        "type": "number",
        "defaultValue": 10,
        "min": 1,
        "max": 50,
        "helperText": "Limits how many usernames are listed per category.",
        "section": "Summarizer",
        "sectionOrder": 2
      },
      {
        "key": "maxSummaryLength",
        "label": "Max Summary Length",
        "type": "number",
        "defaultValue": 350,
        "min": 100,
        "max": 2000,
        "helperText": "Trim summary text to this length.",
        "section": "Summarizer",
        "sectionOrder": 2
      },
      {
        "key": "maxBufferedMessages",
        "label": "Max Buffered Messages",
        "type": "number",
        "defaultValue": 1000,
        "min": 0,
        "max": 10000,
        "helperText": "Buffer size limit to avoid unbounded memory growth. Use 0 for unlimited.",
        "section": "Summarizer",
        "sectionOrder": 2
      }
    ],
    "variables": [
      {
        "name": "summary_buckets",
        "description": "Readable string: {N}min ago, totalMessages, topChatters, and per-bucket (user:\"msg\") for buckets with messages.",
        "value": ""
      }
    ],
    "settings_tutorial": "./settings_tutorial.md",
    "actions": [
      {
        "type": "ingest_chat",
        "label": "Ingest Chat Message",
        "description": "Add a chat message to the summarizer buffer (use in automations).",
        "fields": [
          {
            "key": "username",
            "label": "Username",
            "type": "text",
            "allowVariables": true,
            "defaultValue": "{{username}}"
          },
          {
            "key": "message",
            "label": "Message",
            "type": "text",
            "allowVariables": true,
            "defaultValue": "{{message}}"
          },
          {
            "key": "platform",
            "label": "Platform",
            "type": "text",
            "allowVariables": true,
            "defaultValue": "{{site}}"
          },
          {
            "key": "userId",
            "label": "User ID",
            "type": "text",
            "allowVariables": true,
            "defaultValue": "{{user_id}}"
          }
        ]
      },
      {
        "type": "summarize_now",
        "label": "Summarize Now",
        "description": "Force a summary immediately, even if minimum message count is not met.",
        "fields": []
      },
      {
        "type": "clear_buffer",
        "label": "Clear Buffer",
        "description": "Clear all buffered chat messages.",
        "fields": []
      }
    ]
  }
}

```

## chat_summarizer/package.json

```
{
	"name": "lumia-chat-summarizer",
	"version": "1.0.0",
	"private": true,
	"description": "Lumia Stream plugin that summarizes chat and highlights users by category.",
	"main": "main.js",
	"dependencies": {
		"@lumiastream/plugin": "^0.4.0"
	}
}

```

## chat_summarizer/settings_tutorial.md

```
# Chat Summarizer Setup

## Lumia Commands

There are **2 commands** that will be downloaded to use with Chat Summarizer:

1. **chatmatch** — Helps fill the buckets by ingesting chat messages into the summarizer.
2. **chatcommand** — Contains the `{{chat_summarizer_summary_buckets}}` variable where you'll see the detailed summary of the chat.

## Using with AI Chat

You can use `{{chat_summarizer_summary_buckets}}` as a starting point for your AI chat and display something different. For example:

```
{{ai_prompt={{chat_summarizer_summary_buckets}}}}
```

This passes the summary buckets into your AI prompt so it can analyze the chat and respond based on the categorized messages.

```

## divoom_pixoo/actions_tutorial.md

```
---
### 🔧 Available Commands

**Basic Control**:
- Set Brightness - Adjust display brightness (0-100)
- Set Channel - Switch to clock/visualizer/scene
- Screen On/Off - Power screen on or off
- Reset Display - Clear and reset to default

**Display Content**:
- Send Scrolling Text - Display text messages
- Clear Screen - Clear all content
- Display Image - Show image from URL
- Play GIF - Play animated GIF from URL

**Drawing**:
- Draw Pixel - Draw individual pixels
- Draw Rectangle - Draw colored rectangles

**Sound**:
- Play Buzzer - Play buzzer sound

**Advanced**:
- Send Raw Command - Send custom API commands

---
### 💡 Tips
- Commands are rate-limited to 1 per second (prevents crashes)
- Connection auto-refreshes every 250 commands
---

```

## divoom_pixoo/main.js

```
const { Plugin } = require("@lumiastream/plugin");
const http = require("node:http");
const https = require("node:https");

class DivoomPixooPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);

		// Connection state tracking
		this.connectionHealth = {
			lastSuccessTime: 0,
			consecutiveFailures: 0,
			commandsSinceRefresh: 0,
		};

		// Rate limiting to prevent device crashes
		this.lastPushTime = 0;
		this.MIN_PUSH_INTERVAL = 1000; // 1 second minimum between screen updates
		this.MAX_COMMANDS_BEFORE_REFRESH = 250; // Refresh before hitting 300-command limit

		// PicID counter for Draw/SendHttpGif (resets at 1000 like pixoo-api library)
		this.picIdCounter = 0;
		this._connected = false;
		this._connectionStatePublished = false;
	}

	async onload() {
		try {
			await this.resetHttpGifId();
			await this.testConnection();
		} catch (error) {
			await this.setConnectionState(false);
			throw error;
		}
	}

	async onunload() {
		await this.setConnectionState(false);
	}

	async onsettingsupdate(settings, previousSettings) {
		const addressChanged =
			settings?.deviceAddress !== previousSettings?.deviceAddress;
		const portChanged = settings?.devicePort !== previousSettings?.devicePort;

		if (addressChanged || portChanged) {
			await this.testConnection();
		}
	}

	async actions(config) {
		for (const action of config.actions) {
			const params = action.value;

			try {
				switch (action.type) {
					case "set_brightness":
						await this.setBrightness(
							this.normalizeNumber(params.brightness, 0, 100, 50),
						);
						break;

					case "send_text":
						await this.sendText({
							message: String(params.message || ""),
							color: params.color || "#FFFFFF",
							scrollSpeed: this.normalizeNumber(params.scrollSpeed, 1, 100, 32),
							direction: params.direction || "left",
							repeat: this.normalizeNumber(params.repeat, 0, 10, 1),
							align: params.align || "center",
						});
						break;

					case "clear_screen":
						await this.clearScreen(params.color || "#000000");
						break;

					case "draw_pixel":
						await this.drawPixel(params.pixels || "");
						break;

					case "draw_filled_rectangle":
						await this.drawFilledRectangle(params.rectangles || "");
						break;

					case "play_gif_url":
						await this.playGifFromUrl(params.url || "");
						break;

					case "set_screen_on":
						await this.setScreenPower(true);
						break;

					case "set_screen_off":
						await this.setScreenPower(false);
						break;

					case "play_buzzer":
						await this.playBuzzer(
							this.normalizeNumber(params.duration, 100, 5000, 500),
						);
						break;

					case "reset_display":
						await this.resetDisplay();
						break;

					case "send_raw_command":
						await this.sendRaw(
							params.command || "",
							this.parseJson(params.payload),
						);
						break;

					default:
						await this.lumia.log(
							`[Divoom Pixoo] Unknown action: ${String(action.type)}`,
						);
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				await this.lumia.log(
					`[Divoom Pixoo] Error in action ${action.type}: ${message}`,
				);
			}
		}
	}

	// ============================================================================
	// Connection Management
	// ============================================================================

	async testConnection() {
		const address = this.getDeviceAddress();
		if (!address) {
			await this.lumia.log(
				"[Divoom Pixoo] ⚠️ Device address not configured",
			);
			await this.lumia.showToast({
				message: "Please configure Pixoo device IP address in settings",
			});
			await this.setConnectionState(false);
			return false;
		}

		const result = await this.sendCommand("Device/GetDeviceTime", {});

		if (result.success) {
			this.connectionHealth.lastSuccessTime = Date.now();
			this.connectionHealth.consecutiveFailures = 0;
			await this.setConnectionState(true);
			return true;
		} else {
			await this.lumia.log(
				`[Divoom Pixoo] ❌ Connection failed: ${result.error}`,
			);
			await this.lumia.showToast({
				message: `Failed to connect to Pixoo: ${result.error}`,
			});
			this.connectionHealth.consecutiveFailures++;
			await this.setConnectionState(false);
			return false;
		}
	}

	shouldRefreshConnection() {
		// Refresh connection before hitting the ~300 command limit
		return (
			this.connectionHealth.commandsSinceRefresh >=
			this.MAX_COMMANDS_BEFORE_REFRESH
		);
	}

	async refreshConnection() {
		// Send a simple query to reset internal counter
		const result = await this.sendCommand("Device/GetDeviceTime", {});

		if (!result.success) {
			await this.lumia.log(
				"[Divoom Pixoo] Connection refresh failed, will retry",
			);
		}
	}

	// ============================================================================
	// Device Control Actions
	// ============================================================================

	async setBrightness(brightness) {
		const value = Math.round(brightness);
		const result = await this.sendCommand("Channel/SetBrightness", {
			Brightness: value,
		});

		if (!result.success) {
			await this.lumia.log(
				`[Divoom Pixoo] Failed to set brightness: ${result.error}`,
			);
		}
		return result.success;
	}

	async setChannel(channel, id) {
		// Map channel types to indices (based on pixoo-api library)
		const channelIndexMap = {
			faces: 0,
			cloud: 1,
			visualizer: 2,
			custom: 3,
			clock: 0, // Alias for faces
		};

		// First switch to the base channel using SetIndex
		const channelIndex = channelIndexMap[channel] ?? 0;
		await this.sendCommand("Channel/SetIndex", { SelectIndex: channelIndex });

		// Small delay for channel switch to take effect
		await new Promise((resolve) => setTimeout(resolve, 300));

		// Then set the specific ID if applicable
		if (id !== undefined && id !== null) {
			const mapping = {
				faces: { command: "Channel/SetClock", key: "ClockId" },
				clock: { command: "Channel/SetClock", key: "ClockId" },
				visualizer: { command: "Channel/SetVisualizer", key: "VisualizerId" },
				custom: { command: "Channel/SetCustomPageIndex", key: "Index" },
			};

			const entry = mapping[channel];
			if (entry) {
				const payload = {};
				payload[entry.key] = Math.floor(id);
				await this.sendCommand(entry.command, payload);
			}
		}

		return true;
	}

	async exitCustomMode() {
		// Switch to channel index 3 (Cloud/Custom channel) to exit any blocking modes
		await this.sendCommand("Channel/SetIndex", { SelectIndex: 3 });
		// Small delay to let the device process the mode change
		await new Promise((resolve) => setTimeout(resolve, 300));
	}

	async sendText({ message, color, scrollSpeed, direction, repeat, align }) {
		const trimmed = message.trim();
		if (!trimmed) {
			await this.lumia.log("[Divoom Pixoo] Text message cannot be empty");
			return false;
		}

		// Truncate to max 512 chars (API limit)
		const text = trimmed.substring(0, 512);

		// Clear the screen first using the buffer approach (like pixels)
		await this.clearScreen("#000000");

		const directionMap = { left: 0, right: 1 }; // API only supports left/right for dir
		const alignMap = { left: 1, center: 2, right: 3 };

		const { width } = this.getDefaultDimensions();

		// Ensure TextWidth is between 16-64 as per API docs
		const textWidth = Math.max(16, Math.min(64, width));

		const payload = {
			LcdId: 0, // Standard display
			TextId: 1, // Unique ID (1-19)
			x: 0,
			y: 0,
			dir: directionMap[direction] ?? directionMap.left,
			font: 0, // App animation font (0-7)
			TextWidth: textWidth,
			TextString: text,
			speed: Math.round(scrollSpeed), // Time in ms per step
			color: this.hexToDecimalColor(color),
			align: alignMap[align] ?? alignMap.center,
		};

		const result = await this.sendCommand("Draw/SendHttpText", payload);

		if (!result.success) {
			await this.lumia.log(
				`[Divoom Pixoo] Failed to send text: ${result.error}`,
			);
		}
		return result.success;
	}

	async clearScreen(color = "#000000") {
		// Ensure we're in the right channel for drawing
		await this.exitCustomMode();

		const rgb = this.parseColorToRGB(color);
		const { width, height } = this.getDefaultDimensions();

		// Create a full buffer filled with the specified color
		const buffer = [];
		for (let i = 0; i < width * height; i++) {
			buffer.push(rgb[0], rgb[1], rgb[2]);
		}

		// Encode as base64 and send
		const base64Data = this.encodeBase64(buffer);
		const result = await this.sendHttpGif(base64Data, width);

		if (!result.success) {
			await this.lumia.log(
				`[Divoom Pixoo] Failed to clear screen: ${result.error}`,
			);
		}
		return result.success;
	}

	async drawPixel(pixelsInput) {
		// Clear the screen first (required for all drawing actions)
		await this.clearScreen("#000000");

		const { width, height } = this.getDefaultDimensions();

		// Create black canvas buffer
		const buffer = [];
		for (let i = 0; i < width * height; i++) {
			buffer.push(0, 0, 0);
		}

		// Parse pixels: "x,y,color;x,y,color" or newline-separated
		const input = String(pixelsInput || "").replace(/\n/g, ";");
		const pixels = input.split(";").filter((p) => p.trim());
		let drawnCount = 0;

		for (const pixelStr of pixels) {
			const parts = pixelStr.split(",").map((p) => p.trim());
			if (parts.length < 3) continue;

			const x = this.normalizeNumber(parts[0], 0, width - 1, 0);
			const y = this.normalizeNumber(parts[1], 0, height - 1, 0);
			const color = parts[2];
			const rgb = this.parseColorToRGB(color);

			// Set pixel in buffer
			const index = (y * width + x) * 3;
			buffer[index] = rgb[0];
			buffer[index + 1] = rgb[1];
			buffer[index + 2] = rgb[2];
			drawnCount++;
		}

		if (drawnCount === 0) {
			await this.lumia.log("[Divoom Pixoo] No valid pixels to draw");
			return false;
		}

		// Encode as base64 and send
		const base64Data = this.encodeBase64(buffer);
		const result = await this.sendHttpGif(base64Data, width);

		if (!result.success) {
			await this.lumia.log(
				`[Divoom Pixoo] Failed to draw pixels: ${result.error}`,
			);
		}
		return result.success;
	}

	async drawFilledRectangle(rectanglesInput) {
		// Clear the screen first (required for all drawing actions)
		await this.clearScreen("#000000");

		const { width, height } = this.getDefaultDimensions();

		// Create black canvas buffer
		const buffer = [];
		for (let i = 0; i < width * height; i++) {
			buffer.push(0, 0, 0);
		}

		// Parse rectangles: "x,y,width,height,color;..." or newline-separated
		const input = String(rectanglesInput || "").replace(/\n/g, ";");
		const rectangles = input.split(";").filter((r) => r.trim());
		let drawnCount = 0;

		for (const rectStr of rectangles) {
			const parts = rectStr.split(",").map((p) => p.trim());
			if (parts.length < 5) continue;

			const x = this.normalizeNumber(parts[0], 0, width - 1, 0);
			const y = this.normalizeNumber(parts[1], 0, height - 1, 0);
			const rectWidth = this.normalizeNumber(parts[2], 1, width, 1);
			const rectHeight = this.normalizeNumber(parts[3], 1, height, 1);
			const color = parts[4];
			const rgb = this.parseColorToRGB(color);

			// Draw rectangle into buffer
			for (let py = 0; py < height; py++) {
				for (let px = 0; px < width; px++) {
					if (px >= x && px < x + rectWidth && py >= y && py < y + rectHeight) {
						const index = (py * width + px) * 3;
						buffer[index] = rgb[0];
						buffer[index + 1] = rgb[1];
						buffer[index + 2] = rgb[2];
					}
				}
			}
			drawnCount++;
		}

		if (drawnCount === 0) {
			await this.lumia.log("[Divoom Pixoo] No valid rectangles to draw");
			return false;
		}

		// Encode as base64 and send
		const base64Data = this.encodeBase64(buffer);
		const result = await this.sendHttpGif(base64Data, width);

		if (!result.success) {
			await this.lumia.log(
				`[Divoom Pixoo] Failed to draw rectangles: ${result.error}`,
			);
		}
		return result.success;
	}

	async playGifFromUrl(url) {
		if (!url || typeof url !== "string" || !url.startsWith("http")) {
			await this.lumia.log("[Divoom Pixoo] Invalid GIF URL");
			return false;
		}

		// Clear the screen first (like pixels)
		await this.clearScreen("#000000");

		// Use Device/PlayTFGif with FileType 2 for net files (per API docs)
		// Note: GIF must be 16x16, 32x32, or 64x64 pixels
		const result = await this.sendCommand("Device/PlayTFGif", {
			FileType: 2, // 2 = play net file (URL)
			FileName: url,
		});

		if (!result.success) {
			await this.lumia.log(
				`[Divoom Pixoo] Failed to play GIF: ${result.error}`,
			);
		}
		return result.success;
	}

	async setScreenPower(on) {
		const result = await this.sendCommand("Channel/OnOffScreen", {
			OnOff: on ? 1 : 0,
		});

		if (!result.success) {
			await this.lumia.log(
				`[Divoom Pixoo] Failed to set screen power: ${result.error}`,
			);
		}
		return result.success;
	}

	async playBuzzer(duration) {
		const result = await this.sendCommand("Device/PlayBuzzer", {
			ActiveTimeInCycle: Math.round(duration),
			OffTimeInCycle: 0,
			PlayTotalTime: Math.round(duration),
		});

		if (!result.success) {
			await this.lumia.log(
				`[Divoom Pixoo] Failed to play buzzer: ${result.error}`,
			);
		}
		return result.success;
	}

	async resetDisplay() {
		// Clear any text
		await this.sendCommand("Draw/ClearHttpText", {});

		// Reset to default channel (clock)
		await this.setChannel("clock", 0);

		// Refresh connection
		this.connectionHealth.commandsSinceRefresh = 0;

		return true;
	}

	async sendRaw(command, payload) {
		const trimmed = command.trim();
		if (!trimmed) {
			await this.lumia.log(
				"[Divoom Pixoo] Raw command requires a command string",
			);
			return false;
		}

		const extra = payload && typeof payload === "object" ? payload : {};
		const result = await this.sendCommand(trimmed, extra);

		if (!result.success) {
			await this.lumia.log(
				`[Divoom Pixoo] Raw command failed: ${result.error}`,
			);
		}
		return result.success;
	}

	// ============================================================================
	// HTTP Communication Layer
	// ============================================================================

	async sendCommand(command, payload = {}, retryCount = 0) {
		// Check if we need to refresh connection
		if (this.shouldRefreshConnection()) {
			await this.refreshConnection();
		}

		const deviceAddress = this.getDeviceAddress();
		if (!deviceAddress) {
			this.setConnectionStateSafe(false);
			return {
				success: false,
				error: "Device address not configured",
			};
		}

		// Rate limiting check
		const now = Date.now();
		const timeSinceLastPush = now - this.lastPushTime;

		if (timeSinceLastPush < this.MIN_PUSH_INTERVAL && this.lastPushTime > 0) {
			// Wait to respect rate limit
			const waitTime = this.MIN_PUSH_INTERVAL - timeSinceLastPush;
			await new Promise((resolve) => setTimeout(resolve, waitTime));
		}

		const body = JSON.stringify({
			Command: command,
			...payload,
		});

		const useHttps = this.getDevicePort() === 443;
		const protocol = useHttps ? https : http;

		const options = {
			host: deviceAddress,
			port: this.getDevicePort(),
			path: "/post",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Content-Length": Buffer.byteLength(body),
			},
			timeout: 5000,
		};

		return new Promise((resolve) => {
			const request = protocol.request(options, (response) => {
				const chunks = [];

				response.on("data", (chunk) => chunks.push(chunk));

				response.on("end", () => {
					const data = Buffer.concat(chunks).toString("utf8");

					if (response.statusCode >= 200 && response.statusCode < 300) {
						let parsed;
						try {
							parsed = data ? JSON.parse(data) : {};
						} catch (error) {
							parsed = { raw: data };
						}

						// Update connection health
						this.connectionHealth.lastSuccessTime = Date.now();
						this.connectionHealth.consecutiveFailures = 0;
						this.connectionHealth.commandsSinceRefresh++;
						this.lastPushTime = Date.now();
						this.setConnectionStateSafe(true);

						resolve({
							success: true,
							response: parsed,
						});
					} else {
						// Track failure
						this.connectionHealth.consecutiveFailures++;
						this.setConnectionStateSafe(false);

						resolve({
							success: false,
							error: `HTTP ${response.statusCode}: ${data}`,
						});
					}
				});
			});

			request.on("error", async (error) => {
				this.connectionHealth.consecutiveFailures++;

				// Retry logic for network errors
				const maxRetries = 2;
				if (retryCount < maxRetries) {
					await this.lumia.log(
						`[Divoom Pixoo] Network error, retrying (${retryCount + 1}/${maxRetries})...`,
					);
					await new Promise((r) => setTimeout(r, 1000));
					resolve(await this.sendCommand(command, payload, retryCount + 1));
				} else {
					this.setConnectionStateSafe(false);
					resolve({
						success: false,
						error: error.message,
					});
				}
			});

			request.on("timeout", () => {
				request.destroy(new Error("Request timed out"));
			});

			request.write(body);
			request.end();
		});
	}

	async setConnectionState(state) {
		const normalized = Boolean(state);
		if (this._connected === normalized && this._connectionStatePublished) {
			return;
		}

		this._connected = normalized;
		this._connectionStatePublished = true;

		try {
			await this.lumia.updateConnection(normalized);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			await this.lumia.log(
				`[Divoom Pixoo] Failed to update connection state: ${message}`,
			);
		}
	}

	setConnectionStateSafe(state) {
		void this.setConnectionState(state);
	}

	// ============================================================================
	// Helper Methods
	// ============================================================================

	getDeviceAddress() {
		const address = (this.settings.deviceAddress ?? "").trim();
		return address.length > 0 ? address : null;
	}

	getDevicePort() {
		const port = Number(this.settings.devicePort);
		if (!Number.isInteger(port) || port <= 0 || port > 65535) {
			return 80;
		}
		return port;
	}

	getDefaultDimensions() {
		const width = Number(this.settings.defaultTextWidth);
		const height = Number(this.settings.defaultTextHeight);
		return {
			width: Number.isInteger(width) && width > 0 ? width : 64,
			height: Number.isInteger(height) && height > 0 ? height : 64,
		};
	}

	normalizeNumber(value, min, max, defaultValue) {
		const num = Number(value);
		if (!Number.isFinite(num)) {
			return defaultValue;
		}
		return Math.max(min, Math.min(max, num));
	}

	parseJson(value) {
		if (typeof value !== "string" || value.trim().length === 0) {
			return {};
		}

		try {
			return JSON.parse(value);
		} catch (error) {
			void this.lumia.log(
				`[Divoom Pixoo] Failed to parse JSON: ${error.message}`,
			);
			return {};
		}
	}

	parseColorToRGB(input) {
		if (typeof input !== "string") {
			return [255, 255, 255];
		}

		const match = input.trim().match(/^#?([a-fA-F0-9]{6})$/);
		if (!match) {
			return [255, 255, 255];
		}

		const value = parseInt(match[1], 16);
		const r = (value >> 16) & 0xff;
		const g = (value >> 8) & 0xff;
		const b = value & 0xff;
		return [r, g, b];
	}

	hexToDecimalColor(hex) {
		// Convert hex color to decimal (e.g., "#FF0000" -> "#FF0000" format expected by API)
		if (typeof hex !== "string") {
			return "#FFFFFF";
		}
		const cleaned = hex.trim();
		if (cleaned.startsWith("#")) {
			return cleaned;
		}
		return `#${cleaned}`;
	}

	async resetHttpGifId() {
		// Reset the PicID counter (like pixoo-api's initialize method)
		this.picIdCounter = 0;
		return await this.sendCommand("Draw/ResetHttpGifId", {});
	}

	getNextPicId() {
		// Increment counter and reset at 1000 (like pixoo-api library)
		if (this.picIdCounter >= 1000) {
			this.picIdCounter = 0;
		}
		return this.picIdCounter++;
	}

	async sendHttpGif(base64Data, width) {
		// Send the buffer to the device using Draw/SendHttpGif
		const picId = this.getNextPicId();

		return await this.sendCommand("Draw/SendHttpGif", {
			PicNum: 1,
			PicWidth: width,
			PicOffset: 0,
			PicID: picId,
			PicSpeed: 1000,
			PicData: base64Data,
		});
	}

	encodeBase64(buffer) {
		// Convert buffer array to base64 string (like pixoo-api library)
		const uint8Array = new Uint8Array(buffer);
		return Buffer.from(uint8Array).toString("base64");
	}

	generatePixelData(x, y, rgb, width, height) {
		// Generate pixel data for a canvas with a single pixel
		const data = [];

		for (let py = 0; py < height; py++) {
			for (let px = 0; px < width; px++) {
				if (px === x && py === y) {
					data.push(rgb[0], rgb[1], rgb[2]);
				} else {
					data.push(0, 0, 0); // Black background
				}
			}
		}

		return data;
	}

	generateRectangleData(
		x,
		y,
		rectWidth,
		rectHeight,
		rgb,
		canvasWidth,
		canvasHeight,
	) {
		// Generate pixel data for a canvas with a filled rectangle
		const data = [];

		for (let py = 0; py < canvasHeight; py++) {
			for (let px = 0; px < canvasWidth; px++) {
				// Check if this pixel is inside the rectangle
				if (px >= x && px < x + rectWidth && py >= y && py < y + rectHeight) {
					data.push(rgb[0], rgb[1], rgb[2]);
				} else {
					data.push(0, 0, 0); // Black background
				}
			}
		}

		return data;
	}
}

module.exports = DivoomPixooPlugin;

```

## divoom_pixoo/manifest.json

```
{
	"id": "divoom_pixoo",
	"name": "Divoom Pixoo",
	"version": "1.0.3",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://lumiastream.com",
	"repository": "https://github.com/LumiaStream/divoom-pixoo-plugin",
	"description": "Send text, GIFs, drawings, and device controls to Divoom Pixoo LED displays over Wi-Fi.",
	"lumiaVersion": "^9.0.0",
	"license": "MIT",
	"category": "devices",
	"keywords": "divoom, pixoo, led matrix, display, wifi",
	"icon": "divoom.jpeg",
	"config": {
		"settings": [
			{
				"key": "deviceAddress",
				"label": "Pixoo IP Address",
				"type": "text",
				"placeholder": "192.168.1.42",
				"helperText": "Your Pixoo device IP address on the local network",
				"required": true
			},
			{
				"key": "devicePort",
				"label": "Port",
				"type": "number",
				"defaultValue": 80,
				"helperText": "HTTP port (usually 80)",
				"validation": {
					"min": 1,
					"max": 65535
				}
			},
			{
				"key": "defaultTextWidth",
				"label": "Screen Width",
				"type": "number",
				"defaultValue": 64,
				"helperText": "64 for Pixoo 64, 16 for Pixoo 16",
				"validation": {
					"min": 16,
					"max": 128
				}
			},
			{
				"key": "defaultTextHeight",
				"label": "Screen Height",
				"type": "number",
				"defaultValue": 64,
				"helperText": "64 for Pixoo 64, 16 for Pixoo 16",
				"validation": {
					"min": 16,
					"max": 128
				}
			}
		],
		"settings_tutorial": "./settings_tutorial.md",
		"actions_tutorial": "./actions_tutorial.md",
		"actions": [
			{
				"type": "set_screen_on",
				"label": "Screen On",
				"description": "Turn the screen on",
				"fields": []
			},
			{
				"type": "set_screen_off",
				"label": "Screen Off",
				"description": "Turn the screen off",
				"fields": []
			},
			{
				"type": "set_brightness",
				"label": "Set Brightness",
				"description": "Set device brightness (0-100%)",
				"fields": [
					{
						"key": "brightness",
						"label": "Brightness",
						"type": "number",
						"required": true,
						"defaultValue": 50,
						"validation": {
							"min": 0,
							"max": 100
						}
					}
				]
			},
			{
				"type": "play_buzzer",
				"label": "Play Buzzer",
				"description": "Play the built-in buzzer sound",
				"fields": [
					{
						"key": "duration",
						"label": "Duration (ms)",
						"type": "number",
						"required": true,
						"allowVariables": true,
						"defaultValue": 500,
						"validation": {
							"min": 100,
							"max": 5000
						},
						"helperText": "How long to play the buzzer (100-5000ms)"
					}
				]
			},
			{
				"type": "send_text",
				"label": "Send Scrolling Text",
				"description": "Display scrolling text message (max 512 characters)",
				"fields": [
					{
						"key": "message",
						"label": "Message",
						"type": "textarea",
						"required": true,
						"allowVariables": true,
						"placeholder": "Enter your message (max 512 chars)..."
					},
					{
						"key": "color",
						"label": "Text Color",
						"type": "color",
						"allowVariables": true,
						"defaultValue": "#FFFFFF"
					},
					{
						"key": "scrollSpeed",
						"label": "Scroll Speed (ms per step)",
						"type": "number",
						"defaultValue": 10,
						"helperText": "Time in milliseconds per step (lower = faster)",
						"validation": {
							"min": 1,
							"max": 100
						}
					},
					{
						"key": "direction",
						"label": "Scroll Direction",
						"type": "select",
						"defaultValue": "left",
						"options": [
							{
								"label": "Left",
								"value": "left"
							},
							{
								"label": "Right",
								"value": "right"
							}
						]
					},
					{
						"key": "align",
						"label": "Text Alignment",
						"type": "select",
						"defaultValue": "center",
						"options": [
							{
								"label": "Left",
								"value": "left"
							},
							{
								"label": "Center",
								"value": "center"
							},
							{
								"label": "Right",
								"value": "right"
							}
						]
					}
				]
			},
			{
				"type": "draw_pixel",
				"label": "Draw Pixels",
				"description": "Draw multiple pixels (one per line or semicolon-separated)",
				"fields": [
					{
						"key": "pixels",
						"label": "Pixels",
						"type": "textarea",
						"required": true,
						"allowVariables": true,
						"placeholder": "10,10,#FF0000\n20,20,#00FF00\n30,30,#0000FF",
						"helperText": "Format: x,y,color (one per line or use ; separator). Example: 10,10,#FF0000;20,20,#00FF00. Best example for this is using {{message}} as the value. Then your chat can type something like: !divoom 10,10,#FF0000;20,20,#00FF00;30,30,#0000FF"
					}
				]
			},
			{
				"type": "draw_filled_rectangle",
				"label": "Draw Filled Rectangles",
				"description": "Draw multiple filled rectangles (one per line or semicolon-separated)",
				"fields": [
					{
						"key": "rectangles",
						"label": "Rectangles",
						"type": "textarea",
						"required": true,
						"allowVariables": true,
						"placeholder": "10,10,20,20,#FF0000\n35,35,15,15,#00FF00",
						"helperText": "Format: x,y,width,height,color (one per line or use ; separator). Example: 10,10,20,20,#FF0000;30,30,15,15,#00FF00"
					}
				]
			},
			{
				"type": "play_gif_url",
				"label": "Play GIF from URL",
				"description": "Play an animated GIF from the internet (must be 16x16, 32x32, or 64x64 pixels)",
				"fields": [
					{
						"key": "url",
						"label": "GIF URL",
						"type": "text",
						"required": true,
						"allowVariables": true,
						"placeholder": "https://example.com/animation.gif",
						"helperText": "Direct link to animated GIF. Must be exactly 16x16, 32x32, or 64x64 pixels."
					}
				]
			},
			{
				"type": "clear_screen",
				"label": "Clear Screen",
				"description": "Clear all content from the display",
				"fields": [
					{
						"key": "color",
						"label": "Background Color",
						"type": "color",
						"allowVariables": true,
						"defaultValue": "#000000",
						"helperText": "Color to fill screen after clearing"
					}
				]
			},
			{
				"type": "reset_display",
				"label": "Reset Display",
				"description": "Clear everything and reset to default state (clock)",
				"fields": []
			},
			{
				"type": "send_raw_command",
				"label": "Send Raw Command",
				"description": "Send a custom command directly to the device API",
				"fields": [
					{
						"key": "command",
						"label": "Command",
						"type": "text",
						"required": true,
						"allowVariables": true,
						"placeholder": "Device/SetRTC",
						"helperText": "API command path (e.g., Channel/SetClock)"
					},
					{
						"key": "payload",
						"label": "Payload JSON",
						"type": "textarea",
						"allowVariables": true,
						"placeholder": "{\"ClockId\": 182}",
						"helperText": "Additional command parameters as JSON"
					}
				]
			}
		]
	}
}

```

## divoom_pixoo/package.json

```
{
	"name": "lumia_plugin-divoom-controller",
	"version": "1.0.0",
	"private": true,
	"description": "Control Divoom Pixoo WIFI devices from Lumia Stream actions.",
	"main": "main.js",
	"dependencies": {
		"@lumiastream/plugin": "^0.4.1"
	}
}

```

## divoom_pixoo/settings_tutorial.md

```
---
### 🎨 Setup Your Divoom Pixoo

1. **Find Your Pixoo's IP Address**:
   - Use your router's device list
   - Or use the Divoom app → Device Settings
   - Example: `192.168.1.42`

2. **Set Static IP (Recommended)**:
   - Reserve IP in your router's DHCP settings
   - Prevents IP from changing

3. **Enter Settings**:
   - IP Address (required)
   - Port: 80 (default)
   - Screen size: 64x64 (or 16x16 for Pixoo 16)

4. **Click Save** to store the settings.
---

```

## elevenlabs_tts/actions_tutorial.md

```
---
### 📢 Speak Action
1) Enter the **Message** you want spoken.
2) Paste the **Voice ID** you copied from ElevenLabs (find it at https://elevenlabs.io/app/voice-lab).
3) Choose a **Model ID** (view model docs at https://elevenlabs.io/docs/overview/models#models-overview).
4) Adjust **Stability**, **Similarity Boost**, and **Style** if desired.
---
### 🎵 Stream Music Action
1) Enter a **Prompt** (or provide a Composition Plan JSON).
2) Choose the **Model ID** (see music model docs at https://elevenlabs.io/docs/overview/models#models-overview).
3) Set **Music Length** and **Volume**.
---

```

## elevenlabs_tts/main.js

```
const { Plugin } = require("@lumiastream/plugin");
const fs = require("fs/promises");
const path = require("path");
const os = require("os");

const DEFAULTS = {
	modelId: "eleven_multilingual_v2",
	outputFormat: "mp3_44100_128",
	stability: 0.5,
	similarityBoost: 0.5,
	style: 0.0,
	speakerBoost: true,
	volume: 100,
};

const MODEL_CHAR_LIMITS = {
	eleven_v3: 5000,
	eleven_flash_v2_5: 40000,
	eleven_flash_v2: 30000,
	eleven_turbo_v2_5: 40000,
	eleven_turbo_v2: 30000,
	eleven_multilingual_v2: 10000,
	eleven_multilingual_v1: 10000,
	eleven_english_sts_v2: 10000,
	eleven_english_sts_v1: 10000,
};

const toNumber = (value, fallback) => {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === "string" && value.trim().length) {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : fallback;
	}
	return fallback;
};

const toBoolean = (value, fallback) => {
	if (typeof value === "boolean") {
		return value;
	}
	if (typeof value === "string") {
		const normalized = value.trim().toLowerCase();
		if (["true", "yes", "1", "on"].includes(normalized)) {
			return true;
		}
		if (["false", "no", "0", "off"].includes(normalized)) {
			return false;
		}
	}
	return fallback;
};

const trimString = (value, fallback = "") => {
	if (typeof value !== "string") {
		return fallback;
	}
	const trimmed = value.trim();
	return trimmed.length ? trimmed : fallback;
};

const getCharLimitForModel = (modelId) => {
	if (typeof modelId !== "string") {
		return null;
	}
	const normalized = modelId.trim().toLowerCase();
	return MODEL_CHAR_LIMITS[normalized] ?? null;
};

const getOptionalLimit = (value) => {
	const limit = toNumber(value, 0);
	return Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : null;
};

const truncateText = (text, limit) => {
	if (!limit || typeof text !== "string") {
		return { text, truncated: false, limit: null };
	}
	if (text.length <= limit) {
		return { text, truncated: false, limit };
	}
	return { text: text.slice(0, limit), truncated: true, limit };
};

const parseJson = (value) => {
	if (typeof value !== "string" || !value.trim().length) {
		return null;
	}
	try {
		return JSON.parse(value);
	} catch (_err) {
		return null;
	}
};

const buildVoiceSettings = ({
	stability,
	similarityBoost,
	style,
	speakerBoost,
}) => {
	const settings = {};
	if (Number.isFinite(stability)) settings.stability = stability;
	if (Number.isFinite(similarityBoost))
		settings.similarity_boost = similarityBoost;
	if (Number.isFinite(style)) settings.style = style;
	if (typeof speakerBoost === "boolean")
		settings.use_speaker_boost = speakerBoost;
	return settings;
};

const getAudioMimeType = (outputFormat) => {
	if (typeof outputFormat !== "string") {
		return "audio/mpeg";
	}
	const normalized = outputFormat.toLowerCase();
	if (normalized.includes("wav")) {
		return "audio/wav";
	}
	return "audio/mpeg";
};

const getAudioExtension = (outputFormat) => {
	if (typeof outputFormat !== "string") {
		return "mp3";
	}
	const normalized = outputFormat.toLowerCase();
	if (normalized.includes("wav")) {
		return "wav";
	}
	return "mp3";
};

const getDesktopPath = () => {
	const homeDir = os.homedir?.();
	if (!homeDir) {
		return null;
	}
	return path.join(homeDir, "Desktop");
};

const buildMusicFilename = (outputFormat) => {
	const extension = getAudioExtension(outputFormat);
	const now = new Date();
	const stamp = [
		now.getFullYear(),
		String(now.getMonth() + 1).padStart(2, "0"),
		String(now.getDate()).padStart(2, "0"),
		"_",
		String(now.getHours()).padStart(2, "0"),
		String(now.getMinutes()).padStart(2, "0"),
		String(now.getSeconds()).padStart(2, "0"),
	].join("");
	return `elevenlabs_music_${stamp}.${extension}`;
};

class ElevenLabsTTSPlugin extends Plugin {
	getSettingsSnapshot() {
		const raw = this.settings || {};
		return {
			apiKey: trimString(raw.apiKey),
		};
	}

	async actions(config) {
		for (const action of config.actions) {
			try {
				const actionData = action.value;
				if (action.type === "speak") {
					await this.handleSpeak(actionData);
				} else if (action.type === "stream_music") {
					await this.handleStreamMusic(actionData);
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				await this.lumia.log(`[ElevenLabs] Action failed: ${message}`);
			}
		}
	}

	async handleSpeak(data = {}) {
		const settings = this.getSettingsSnapshot();
		let message = trimString(data.message || data.text, "");
		if (!message) {
			await this.lumia.log("[ElevenLabs] Missing message text");
			return;
		}

		const apiKey = settings.apiKey;
		if (!apiKey) {
			await this.lumia.log("[ElevenLabs] Missing API key");
			return;
		}

		const voiceId = trimString(data.voiceId, "");
		if (!voiceId) {
			await this.lumia.log("[ElevenLabs] Missing Voice ID");
			return;
		}
		const modelId = trimString(data.modelId, DEFAULTS.modelId);
		const modelLimit = getCharLimitForModel(modelId);
		const userLimit = getOptionalLimit(data.maxChars);
		const effectiveLimit =
			modelLimit && userLimit
				? Math.min(modelLimit, userLimit)
				: (modelLimit ?? userLimit);
		const truncatedMessage = truncateText(message, effectiveLimit);
		message = truncatedMessage.text;
		if (truncatedMessage.truncated) {
			const limitLabel =
				modelLimit && userLimit
					? `${effectiveLimit} (min of model ${modelLimit} and user ${userLimit})`
					: `${effectiveLimit}`;
		}
		const outputFormat = DEFAULTS.outputFormat;
		const stability = Number.isFinite(toNumber(data.stability, NaN))
			? toNumber(data.stability, NaN)
			: DEFAULTS.stability;
		const similarityBoost = Number.isFinite(toNumber(data.similarityBoost, NaN))
			? toNumber(data.similarityBoost, NaN)
			: DEFAULTS.similarityBoost;
		const style = Number.isFinite(toNumber(data.style, NaN))
			? toNumber(data.style, NaN)
			: DEFAULTS.style;
		const speakerBoost = DEFAULTS.speakerBoost;
		const volume = Number.isFinite(toNumber(data.volume, NaN))
			? toNumber(data.volume, NaN)
			: DEFAULTS.volume;
		const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream`;
		const voiceSettings = buildVoiceSettings({
			stability,
			similarityBoost,
			style,
			speakerBoost,
		});

		if (typeof fetch !== "function") {
			throw new Error("fetch is not available in this runtime");
		}
		if (
			typeof Blob === "undefined" ||
			typeof URL === "undefined" ||
			typeof URL.createObjectURL !== "function"
		) {
			throw new Error("Blob/URL APIs are not available in this runtime");
		}

		const response = await fetch(endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"xi-api-key": apiKey,
			},
			body: JSON.stringify({
				text: message,
				model_id: modelId,
				voice_settings: voiceSettings,
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`ElevenLabs error ${response.status}: ${errorText || response.statusText}`,
			);
		}

		const audioBuffer = await response.arrayBuffer();
		const audioBlob = new Blob([audioBuffer], {
			type: getAudioMimeType(outputFormat),
		});
		const audioUrl = URL.createObjectURL(audioBlob);

		await this.lumia.playAudio({
			path: audioUrl,
			volume,
			waitForAudioToStop: true,
		});
		URL.revokeObjectURL(audioUrl);
	}

	async handleStreamMusic(data = {}) {
		const settings = this.getSettingsSnapshot();
		const apiKey = settings.apiKey;
		if (!apiKey) {
			await this.lumia.log("[ElevenLabs] Missing API key");
			return;
		}

		let prompt = trimString(data.prompt || data.text, "");
		const compositionPlan = parseJson(
			data.compositionPlanJson || data.composition_plan || "",
		);
		if (!prompt && !compositionPlan) {
			await this.lumia.log(
				"[ElevenLabs] Provide a prompt or composition plan",
			);
			return;
		}

		const modelId = trimString(data.modelId, "music_v1");
		const promptLimit = getOptionalLimit(data.maxPromptChars);
		if (promptLimit && prompt) {
			const truncatedPrompt = truncateText(prompt, promptLimit);
			prompt = truncatedPrompt.text;
			if (truncatedPrompt.truncated) {
			}
		}
		const outputFormat = DEFAULTS.outputFormat;
		const musicLengthMs = toNumber(
			data.musicLengthMs ?? data.music_length_ms,
			15000,
		);
		const forceInstrumental = toBoolean(
			data.forceInstrumental ?? data.force_instrumental,
			true,
		);
		const volume = Number.isFinite(toNumber(data.volume, NaN))
			? toNumber(data.volume, NaN)
			: DEFAULTS.volume;
		const saveToDesktop = toBoolean(data.saveToDesktop, false);
		// Always wait for playback to finish so we can safely revoke the blob URL.

		if (typeof fetch !== "function") {
			throw new Error("fetch is not available in this runtime");
		}
		if (
			typeof Blob === "undefined" ||
			typeof URL === "undefined" ||
			typeof URL.createObjectURL !== "function"
		) {
			throw new Error("Blob/URL APIs are not available in this runtime");
		}

		const endpoint = `https://api.elevenlabs.io/v1/music/stream?output_format=${encodeURIComponent(outputFormat)}`;
		const body = {
			model_id: modelId,
			music_length_ms: musicLengthMs,
			force_instrumental: forceInstrumental,
			...(prompt ? { prompt } : {}),
			...(compositionPlan ? { composition_plan: compositionPlan } : {}),
		};

		const response = await fetch(endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"xi-api-key": apiKey,
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`ElevenLabs music error ${response.status}: ${errorText || response.statusText}`,
			);
		}

		const audioBuffer = await response.arrayBuffer();
		const audioBlob = new Blob([audioBuffer], {
			type: getAudioMimeType(outputFormat),
		});
		const audioUrl = URL.createObjectURL(audioBlob);

		await this.lumia.playAudio({
			path: audioUrl,
			volume,
			waitForAudioToStop: true,
		});
		URL.revokeObjectURL(audioUrl);

		if (saveToDesktop) {
			const desktopPath = getDesktopPath();
			if (!desktopPath) {
				await this.lumia.log("[ElevenLabs] Could not resolve Desktop path");
				return;
			}
			const filename = buildMusicFilename(outputFormat);
			const filePath = path.join(desktopPath, filename);
			await fs.writeFile(filePath, Buffer.from(audioBuffer));
		}
	}
}

module.exports = ElevenLabsTTSPlugin;

```

## elevenlabs_tts/manifest.json

```
{
	"id": "elevenlabs_tts",
	"name": "ElevenLabs TTS",
	"version": "1.0.1",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://elevenlabs.io",
	"repository": "",
	"description": "Generate ElevenLabs speech or music audio and play it through Lumia Stream.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "audio",
	"keywords": "elevenlabs, tts, text-to-speech, voice, audio",
	"icon": "elevenlabs_icon.jpg",
	"config": {
		"settings": [
			{
				"key": "apiKey",
				"label": "Key ID (API Key)",
				"type": "password",
				"helperText": "Create an API key in your ElevenLabs dashboard.",
				"required": true
			}
		],
		"settings_tutorial": "./settings_tutorial.md",
		"actions_tutorial": "./actions_tutorial.md",
		"actions": [
			{
				"type": "speak",
				"label": "Speak",
				"description": "Generate ElevenLabs TTS audio and play it in Lumia.",
				"fields": [
					{
						"key": "message",
						"label": "Message",
						"type": "text",
						"defaultValue": "Hello from Lumia!",
						"helperText": "Text to synthesize. Character limits vary per model; long messages will be truncated.",
						"allowVariables": true
					},
					{
						"key": "maxChars",
						"label": "Max Characters (optional)",
						"type": "number",
						"helperText": "Leave empty to use the model limit; if set, the smaller limit is used.",
						"min": 0,
						"max": 100000
					},
					{
						"key": "voiceId",
						"label": "Voice ID",
						"type": "text",
						"defaultValue": "JBFqnCBsd6RMkjVDRZzb",
						"helperText": "Find this in ElevenLabs Voice Lab or your Voices page.",
						"allowVariables": true
					},
					{
						"key": "modelId",
						"label": "Model ID",
						"type": "select",
						"allowTyping": true,
						"defaultValue": "eleven_multilingual_v2",
						"helperText": "Choose a speech model or type a custom model ID.",
						"options": [
							{
								"label": "Eleven v3",
								"value": "eleven_v3"
							},
							{
								"label": "Multilingual v2",
								"value": "eleven_multilingual_v2"
							},
							{
								"label": "Multilingual v1",
								"value": "eleven_multilingual_v1"
							},
							{
								"label": "Turbo v2.5",
								"value": "eleven_turbo_v2_5"
							},
							{
								"label": "Turbo v2",
								"value": "eleven_turbo_v2"
							},
							{
								"label": "Flash v2.5",
								"value": "eleven_flash_v2_5"
							},
							{
								"label": "Flash v2",
								"value": "eleven_flash_v2"
							}
						]
					},
					{
						"key": "stability",
						"label": "Stability (0-1)",
						"type": "number",
						"defaultValue": 1,
						"helperText": "Higher is more consistent; lower is more expressive.",
						"min": 0,
						"max": 1
					},
					{
						"key": "similarityBoost",
						"label": "Similarity Boost (0-1)",
						"type": "number",
						"defaultValue": 1,
						"helperText": "Higher keeps closer to the original voice.",
						"min": 0,
						"max": 1
					},
					{
						"key": "style",
						"label": "Style (0-1)",
						"type": "number",
						"defaultValue": 0,
						"helperText": "Higher adds more stylistic variation.",
						"min": 0,
						"max": 1
					},
					{
						"key": "volume",
						"label": "Volume",
						"type": "number",
						"defaultValue": 100,
						"helperText": "Output volume in Lumia (0-100).",
						"min": 0,
						"max": 100
					}
				]
			},
			{
				"type": "stream_music",
				"label": "Stream Music",
				"description": "Generate ElevenLabs music and play it in Lumia.",
				"fields": [
					{
						"key": "prompt",
						"label": "Prompt",
						"type": "textarea",
						"defaultValue": "Warm lo-fi beats with soft piano and vinyl crackle.",
						"helperText": "Describe the music you want. Prompts can be long; use Max Characters to cap the length."
					},
					{
						"key": "maxPromptChars",
						"label": "Max Prompt Characters (optional)",
						"type": "number",
						"helperText": "Optional cap for prompt length.",
						"min": 0,
						"max": 100000
					},
					{
						"key": "compositionPlanJson",
						"label": "Composition Plan JSON (optional)",
						"type": "textarea",
						"placeholder": "{\"sections\":[{\"time\":0,\"notes\":\"intro\"}]}",
						"defaultValue": "",
						"helperText": "Advanced structure. Leave empty to use prompt only."
					},
					{
						"key": "musicLengthMs",
						"label": "Music Length (ms)",
						"type": "number",
						"defaultValue": 15000,
						"helperText": "Length of the generated clip in milliseconds.",
						"min": 1000,
						"max": 300000
					},
					{
						"key": "modelId",
						"label": "Model ID",
						"type": "select",
						"allowTyping": true,
						"defaultValue": "music_v1",
						"helperText": "Choose a music model or type a custom model ID.",
						"options": [
							{
								"label": "Music v1",
								"value": "music_v1"
							}
						]
					},
					{
						"key": "forceInstrumental",
						"label": "Force Instrumental",
						"type": "toggle",
						"defaultValue": true,
						"helperText": "If enabled, vocals are removed."
					},
					{
						"key": "volume",
						"label": "Volume",
						"type": "number",
						"defaultValue": 100,
						"helperText": "Output volume in Lumia (0-100).",
						"min": 0,
						"max": 100
					},
					{
						"key": "saveToDesktop",
						"label": "Save Music File to Desktop",
						"type": "checkbox",
						"defaultValue": false,
						"helperText": "Saves the generated audio to your Desktop."
					}
				]
			}
		]
	}
}

```

## elevenlabs_tts/package.json

```
{
	"name": "lumia-elevenlabs-tts",
	"version": "1.0.0",
	"private": true,
	"description": "ElevenLabs TTS plugin for Lumia Stream.",
	"main": "main.js",
	"dependencies": {
		"@lumiastream/plugin": "^0.4.1"
	}
}

```

## elevenlabs_tts/settings_tutorial.md

```
---
### 🔐 Get Your ElevenLabs API Key
1) Open https://elevenlabs.io/app/settings/api-keys while logged in and create an API Key. Then copy the Key ID and paste it here.
---
### 🎛️ Voice Tuning (used in Actions)
- **Stability**: Higher values make speech more consistent/predictable; lower values sound more dynamic.
- **Similarity Boost**: Higher values keep output closer to the original voice; lower values allow more variation.
- **Style**: Adds expressiveness/character; higher values can sound more dramatic.
---

```

## eveonline/actions_tutorial.md

```
---
### Actions
This plugin runs automatically and does not expose actions.
---

```

## eveonline/main.js

```
const { Plugin } = require("@lumiastream/plugin");

const DEFAULTS = {
	pollInterval: 120,
	compatibilityDate: "2026-02-03",
	userAgent: "LumiaStream EVE Online Plugin/1.0.0",
	walletAlertThreshold: 1000000,
};

const ESI_BASE_URL = "https://esi.evetech.net/latest";
const ESI_DATASOURCE = "tranquility";
const SSO_VERIFY_URL = "https://login.eveonline.com/oauth/verify";

const VARIABLE_NAMES = {
	characterId: "character_id",
	characterName: "character_name",
	corporationId: "corporation_id",
	allianceId: "alliance_id",
	securityStatus: "security_status",
	walletBalance: "wallet_balance",
	online: "online",
	solarSystemId: "solar_system_id",
	stationId: "station_id",
	structureId: "structure_id",
	shipName: "ship_name",
	shipTypeId: "ship_type_id",
	shipItemId: "ship_item_id",
	skillqueueCount: "skillqueue_count",
	skillqueueCurrentSkillId: "skillqueue_current_skill_id",
	skillqueueCurrentLevel: "skillqueue_current_level",
	skillqueueCurrentEnd: "skillqueue_current_end",
	skillqueueEndsAt: "skillqueue_ends_at",
	marketOrdersActive: "market_orders_active",
	marketOrdersBuy: "market_orders_buy",
	marketOrdersSell: "market_orders_sell",
	industryJobsActive: "industry_jobs_active",
	industryJobsTotal: "industry_jobs_total",
	killmailsRecentCount: "killmails_recent_count",
	notificationsCount: "notifications_count",
};

const ALERT_KEYS = {
	online: "eve_online_status",
	skillQueueEmpty: "eve_skillqueue_empty",
	walletSpike: "eve_wallet_spike",
	walletDrop: "eve_wallet_drop",
	killmail: "eve_killmail_new",
	notification: "eve_notification_new",
	eve_docked: "eve_docked",
	eve_undocked: "eve_undocked",
	shipChanged: "eve_ship_changed",
};

class EveOnlinePlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._pollTimer = null;
		this._refreshPromise = null;
		this._tokenRefreshPromise = null;
		this._lastConnectionState = null;
		this._lastVariables = new Map();
		this._etagCache = new Map();
		this._cooldownUntil = new Map();
		this._globalBackoffUntil = 0;
		this._authFailure = false;
		this._lastErrorLimitWarnAt = 0;
		this._lastErrorLimitRemaining = null;
		this._characterId = null;
		this._characterName = null;
	}

	async onload() {
		if (!this._hasAuthTokens()) {
			await this._log(
				"Missing OAuth tokens. Authorize the plugin in Connections to begin.",
				"warn",
			);
			await this._updateConnectionState(false);
			return;
		}

		await this._refreshData({ reason: "startup" });
		this._schedulePolling();
	}

	async onunload() {
		this._clearPolling();
		await this._updateConnectionState(false);
	}

	async onsettingsupdate(settings, previous = {}) {
		const pollChanged =
			this._pollInterval(settings) !== this._pollInterval(previous);
		const accessChanged =
			(settings?.accessToken ?? "") !== (previous?.accessToken ?? "");
		const refreshChanged =
			(settings?.refreshToken ?? "") !== (previous?.refreshToken ?? "");
		const authChanged = accessChanged || refreshChanged;

		if (pollChanged) {
			this._schedulePolling();
		}

		if (authChanged) {
			this._characterId = null;
			this._characterName = null;
			this._etagCache.clear();
			this._cooldownUntil.clear();
			this._authFailure = false;
		}

		if (authChanged || pollChanged) {
			await this._refreshData({ reason: "settings-update" });
		}
	}

	async actions() {
		return;
	}

	async validateAuth() {
		if (!this._hasAuthTokens()) {
			await this._log("Validation failed: missing OAuth tokens.", "warn");
			return false;
		}

		try {
			const token = await this._ensureAccessToken();
			await this._verifyToken(token);
			return true;
		} catch (error) {
			const message = this._errorMessage(error);
			await this._log(`EVE auth failed: ${message}`, "error");
			return false;
		}
	}

	_tag() {
		return `[${this.manifest?.id ?? "eveonline"}]`;
	}

	async _log(message, severity = "info") {
		if (severity !== "warn" && severity !== "error") {
			return;
		}

		const prefix = this._tag();
		const decorated =
			severity === "warn"
				? `${prefix} ⚠️ ${message}`
				: severity === "error"
					? `${prefix} ❌ ${message}`
					: `${prefix} ${message}`;

		await this.lumia.log(decorated);
	}

	async _refreshData({ reason } = {}) {
		if (!this._hasAuthTokens()) {
			await this._updateConnectionState(false);
			return;
		}

		const now = Date.now();
		if (this._globalBackoffUntil && now < this._globalBackoffUntil) {
			return;
		}

		if (this._authFailure) {
			return;
		}

		if (this._refreshPromise) {
			return this._refreshPromise;
		}

		this._refreshPromise = (async () => {
			try {
				const accessToken = await this._ensureAccessToken();
				const identity = await this._resolveCharacter(accessToken);
				const characterId = identity.characterId;

				const results = await Promise.all([
					this._safeFetch("character info", () =>
						this._fetchCharacterInfo(characterId, accessToken),
					),
					this._safeFetch("wallet", () =>
						this._fetchWallet(characterId, accessToken),
					),
					this._safeFetch("online status", () =>
						this._fetchOnline(characterId, accessToken),
					),
					this._safeFetch("location", () =>
						this._fetchLocation(characterId, accessToken),
					),
					this._safeFetch("ship", () =>
						this._fetchShip(characterId, accessToken),
					),
					this._safeFetch("skill queue", () =>
						this._fetchSkillQueue(characterId, accessToken),
					),
					this._safeFetch("industry jobs", () =>
						this._fetchIndustryJobs(characterId, accessToken),
					),
					this._safeFetch("market orders", () =>
						this._fetchOrders(characterId, accessToken),
					),
					this._safeFetch("killmails", () =>
						this._fetchKillmails(characterId, accessToken),
					),
					this._safeFetch("notifications", () =>
						this._fetchNotifications(characterId, accessToken),
					),
				]);

				const [
					characterInfoResult,
					walletResult,
					onlineResult,
					locationResult,
					shipResult,
					skillqueueResult,
					industryJobsResult,
					ordersResult,
					killmailsResult,
					notificationsResult,
				] = results;

				await this._applyCharacter(identity, characterInfoResult.data);
				await this._applyWallet(walletResult.data);
				await this._applyOnline(onlineResult.data);
				await this._applyLocation(locationResult.data);
				await this._applyShip(shipResult.data);
				await this._applySkillQueue(skillqueueResult.data);
				await this._applyIndustryJobs(industryJobsResult.data);
				await this._applyOrders(ordersResult.data);
				await this._applyKillmails(killmailsResult.data);
				await this._applyNotifications(notificationsResult.data);

				const snapshot = {
					character: identity,
					characterInfo: characterInfoResult.data,
					wallet: walletResult.data,
					online: onlineResult.data,
					location: locationResult.data,
					ship: shipResult.data,
					skillqueue: skillqueueResult.data,
					industryJobs: industryJobsResult.data,
					orders: ordersResult.data,
					killmails: killmailsResult.data,
					notifications: notificationsResult.data,
				};

				const successCount = results.filter((result) => result.ok).length;
				await this._updateConnectionState(successCount > 0);
			} catch (error) {
				const message = this._errorMessage(error);
				await this._log(`Failed to refresh ESI data: ${message}`, "warn");
				await this._updateConnectionState(false);
			}
			this._refreshPromise = null;
		})();

		return this._refreshPromise;
	}

	async _resolveCharacter(accessToken) {
		if (this._characterId && this._characterName) {
			return {
				characterId: this._characterId,
				characterName: this._characterName,
			};
		}

		const verify = await this._verifyTokenWithRefresh(accessToken);
		const characterId = this._coerceNumber(verify?.CharacterID, 0);
		const characterName = this._coerceString(verify?.CharacterName, "");

		if (!characterId || !characterName) {
			throw new Error("Failed to resolve character identity from SSO.");
		}

		this._characterId = characterId;
		this._characterName = characterName;

		return { characterId, characterName };
	}

	async _verifyTokenWithRefresh(accessToken) {
		try {
			return await this._verifyToken(accessToken);
		} catch (error) {
			const message = this._errorMessage(error);
			if (message.includes("401") && this._canRefreshTokens()) {
				const refreshed = await this._refreshAccessToken();
				return this._verifyToken(refreshed);
			}
			if (message.includes("401")) {
				this._authFailure = true;
				this._clearPolling();
				await this._showAuthFailureToast();
			}
			throw error;
		}
	}

	async _verifyToken(accessToken) {
		const response = await fetch(SSO_VERIFY_URL, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: "application/json",
				"User-Agent": DEFAULTS.userAgent,
			},
		});

		if (!response.ok) {
			const body = await response.text();
			const trimmed = this._truncateError(body);
			throw new Error(
				`SSO verify failed (${response.status}): ${trimmed || "No response body"}`,
			);
		}

		return response.json();
	}

	async _fetchCharacterInfo(characterId, token) {
		return this._fetchJson(`/characters/${characterId}/`, token);
	}

	async _fetchWallet(characterId, token) {
		return this._fetchJson(`/characters/${characterId}/wallet/`, token);
	}

	async _fetchOnline(characterId, token) {
		return this._fetchJson(`/characters/${characterId}/online/`, token);
	}

	async _fetchLocation(characterId, token) {
		return this._fetchJson(`/characters/${characterId}/location/`, token);
	}

	async _fetchShip(characterId, token) {
		return this._fetchJson(`/characters/${characterId}/ship/`, token);
	}

	async _fetchSkillQueue(characterId, token) {
		return this._fetchJson(`/characters/${characterId}/skillqueue/`, token);
	}

	async _fetchIndustryJobs(characterId, token) {
		return this._fetchJson(`/characters/${characterId}/industry/jobs/`, token, {
			include_completed: false,
		});
	}

	async _fetchOrders(characterId, token) {
		return this._fetchJson(`/characters/${characterId}/orders/`, token);
	}

	async _fetchKillmails(characterId, token) {
		return this._fetchJson(
			`/characters/${characterId}/killmails/recent/`,
			token,
		);
	}

	async _fetchNotifications(characterId, token) {
		return this._fetchJson(`/characters/${characterId}/notifications/`, token);
	}

	async _safeFetch(label, fn) {
		try {
			return { ok: true, data: await fn() };
		} catch (error) {
			const message = this._errorMessage(error);
			await this._log(`${label} fetch failed: ${message}`, "warn");
			return { ok: false, data: null };
		}
	}

	async _fetchJson(path, tokenOverride, query) {
		const initialToken = tokenOverride ?? (await this._ensureAccessToken());
		const url = this._buildUrl(path, query);
		if (this._isOnCooldown(url)) {
			return null;
		}
		let response = await this._request(url, initialToken);

		if (response.status === 401 && this._canRefreshTokens()) {
			const refreshed = await this._refreshAccessToken();
			response = await this._request(url, refreshed);
		}
		if (response.status === 401) {
			this._authFailure = true;
			this._clearPolling();
			await this._showAuthFailureToast();
			throw new Error(
				"Unauthorized (401). Re-authorize the plugin in Connections.",
			);
		}

		if (response.status === 429) {
			const retryAfter = this._coerceNumber(
				response.headers.get("Retry-After"),
				60,
			);
			this._applyGlobalBackoff(retryAfter);
			throw new Error(
				`ESI rate limited (429). Backing off for ${retryAfter}s.`,
			);
		}

		if (response.status === 304) {
			return null;
		}

		if (!response.ok) {
			const body = await response.text();
			const trimmed = this._truncateError(body);
			throw new Error(
				`ESI error (${response.status}) on ${path}: ${trimmed || "No response body"}`,
			);
		}

		return response.json();
	}

	_buildUrl(path, query) {
		const url = new URL(`${ESI_BASE_URL}${path}`);
		url.searchParams.set("datasource", ESI_DATASOURCE);

		if (query) {
			for (const [key, value] of Object.entries(query)) {
				if (value === undefined || value === null || value === "") {
					continue;
				}
				url.searchParams.set(key, String(value));
			}
		}

		return url.toString();
	}

	_isOnCooldown(url) {
		const until = this._cooldownUntil.get(url);
		return Boolean(until && Date.now() < until);
	}

	_updateCooldown(url, response) {
		const expiresHeader = response.headers.get("expires");
		if (!expiresHeader) {
			return;
		}
		const expiresAt = Date.parse(expiresHeader);
		if (Number.isNaN(expiresAt)) {
			return;
		}
		this._cooldownUntil.set(url, expiresAt);
	}

	async _request(url, token) {
		const headers = {
			Accept: "application/json",
			"User-Agent": DEFAULTS.userAgent,
			"X-Compatibility-Date": DEFAULTS.compatibilityDate,
		};

		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}

		const etag = this._etagCache.get(url);
		if (etag) {
			headers["If-None-Match"] = etag;
		}

		const response = await fetch(url, { headers });

		const responseEtag = response.headers.get("etag");
		this._updateCooldown(url, response);
		if (responseEtag) {
			this._etagCache.set(url, responseEtag);
		}

		const errorRemain = this._coerceNumber(
			response.headers.get("X-ESI-Error-Limit-Remain"),
			NaN,
		);
		if (!Number.isNaN(errorRemain)) {
			const now = Date.now();
			const wasLow =
				this._lastErrorLimitRemaining !== null &&
				this._lastErrorLimitRemaining <= 5;
			const isLow = errorRemain <= 5;
			const shouldLog =
				isLow && (!wasLow || now - this._lastErrorLimitWarnAt > 5 * 60 * 1000);
			if (shouldLog) {
				this._lastErrorLimitWarnAt = now;
			}
			if (!isLow) {
				this._lastErrorLimitWarnAt = 0;
			}
			this._lastErrorLimitRemaining = errorRemain;
		}

		return response;
	}

	async _refreshAccessToken() {
		if (this._tokenRefreshPromise) {
			return this._tokenRefreshPromise;
		}

		const refreshToken = this._refreshToken();
		if (!refreshToken) {
			throw new Error("Missing refresh token.");
		}

		this._tokenRefreshPromise = (async () => {
			if (typeof this.lumia?.refreshOAuthToken !== "function") {
				throw new Error("Missing OAuth refresh support.");
			}

			const payload = await this.lumia.refreshOAuthToken({ refreshToken });
			const accessToken = this._coerceString(payload?.accessToken, "");
			const nextRefreshToken =
				this._coerceString(payload?.refreshToken, "") || refreshToken;

			if (!accessToken) {
				throw new Error("OAuth refresh did not return an access token.");
			}

			this.updateSettings({
				accessToken,
				refreshToken: nextRefreshToken,
			});

			return accessToken;
		})();

		try {
			return await this._tokenRefreshPromise;
		} finally {
			this._tokenRefreshPromise = null;
		}
	}

	async _ensureAccessToken() {
		const accessToken = this._accessToken();
		const refreshToken = this._refreshToken();

		if (!accessToken && !refreshToken) {
			throw new Error("Missing EVE access credentials.");
		}

		if (accessToken) {
			return accessToken;
		}

		if (!refreshToken) {
			return accessToken;
		}

		return this._refreshAccessToken();
	}

	async _applyCharacter(identity, characterInfo) {
		await this._setVariableIfChanged(
			VARIABLE_NAMES.characterId,
			identity?.characterId ?? 0,
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.characterName,
			identity?.characterName ?? "",
		);

		if (!characterInfo) {
			return;
		}

		await this._setVariableIfChanged(
			VARIABLE_NAMES.corporationId,
			this._coerceNumber(characterInfo?.corporation_id, 0),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.allianceId,
			this._coerceNumber(characterInfo?.alliance_id, 0),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.securityStatus,
			this._coerceNumber(characterInfo?.security_status, 0),
		);
	}

	async _applyWallet(wallet) {
		if (wallet === null || wallet === undefined) {
			return;
		}

		await this._setVariableIfChanged(
			VARIABLE_NAMES.walletBalance,
			this._coerceNumber(wallet, 0),
		);
	}

	async _applyOnline(online) {
		if (!online) {
			return;
		}

		await this._setVariableIfChanged(
			VARIABLE_NAMES.online,
			Boolean(online?.online),
		);
	}

	async _applyLocation(location) {
		if (!location) {
			return;
		}

		await this._setVariableIfChanged(
			VARIABLE_NAMES.solarSystemId,
			this._coerceNumber(location?.solar_system_id, 0),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.stationId,
			this._coerceNumber(location?.station_id, 0),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.structureId,
			this._coerceNumber(location?.structure_id, 0),
		);
	}

	async _applyShip(ship) {
		if (!ship) {
			return;
		}

		await this._setVariableIfChanged(
			VARIABLE_NAMES.shipName,
			this._coerceString(ship?.ship_name, ""),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.shipTypeId,
			this._coerceNumber(ship?.ship_type_id, 0),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.shipItemId,
			this._coerceNumber(ship?.ship_item_id, 0),
		);
	}

	async _applySkillQueue(queue) {
		if (!Array.isArray(queue)) {
			return;
		}

		const sorted = [...queue].sort(
			(a, b) =>
				this._coerceNumber(a?.queue_position, 0) -
				this._coerceNumber(b?.queue_position, 0),
		);
		const current = sorted[0] || null;
		const last = sorted[sorted.length - 1] || null;

		await this._setVariableIfChanged(
			VARIABLE_NAMES.skillqueueCount,
			sorted.length,
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.skillqueueCurrentSkillId,
			this._coerceNumber(current?.skill_id, 0),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.skillqueueCurrentLevel,
			this._coerceNumber(current?.finished_level, 0),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.skillqueueCurrentEnd,
			this._coerceString(current?.finish_date, ""),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.skillqueueEndsAt,
			this._coerceString(last?.finish_date, ""),
		);
	}

	async _applyIndustryJobs(jobs) {
		if (!Array.isArray(jobs)) {
			return;
		}

		const activeCount = jobs.filter((job) => job?.status === "active").length;

		await this._setVariableIfChanged(
			VARIABLE_NAMES.industryJobsActive,
			activeCount,
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.industryJobsTotal,
			jobs.length,
		);
	}

	async _applyOrders(orders) {
		if (!Array.isArray(orders)) {
			return;
		}

		const buyCount = orders.filter((order) => order?.is_buy_order).length;
		const sellCount = orders.filter((order) => !order?.is_buy_order).length;

		await this._setVariableIfChanged(
			VARIABLE_NAMES.marketOrdersActive,
			orders.length,
		);
		await this._setVariableIfChanged(VARIABLE_NAMES.marketOrdersBuy, buyCount);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.marketOrdersSell,
			sellCount,
		);
	}

	async _applyKillmails(killmails) {
		if (!Array.isArray(killmails)) {
			return;
		}

		await this._setVariableIfChanged(
			VARIABLE_NAMES.killmailsRecentCount,
			killmails.length,
		);
	}

	async _applyNotifications(notifications) {
		if (!Array.isArray(notifications)) {
			return;
		}

		await this._setVariableIfChanged(
			VARIABLE_NAMES.notificationsCount,
			notifications.length,
		);
	}

	_alertsEnabled() {
		return this.settings?.enableAlerts !== false;
	}

	_walletAlertThreshold() {
		const threshold = this._coerceNumber(
			this.settings?.walletAlertThreshold,
			DEFAULTS.walletAlertThreshold,
		);
		return Number.isFinite(threshold)
			? threshold
			: DEFAULTS.walletAlertThreshold;
	}

	_buildAlertSnapshot({
		previous,
		characterInfo,
		wallet,
		online,
		location,
		ship,
		skillqueue,
		killmails,
		notifications,
	}) {
		const snapshot = {
			online: previous?.online ?? false,
			skillqueueCount: previous?.skillqueueCount ?? 0,
			walletBalance: previous?.walletBalance ?? 0,
			killmailsRecentCount: previous?.killmailsRecentCount ?? 0,
			notificationsCount: previous?.notificationsCount ?? 0,
			stationId: previous?.stationId ?? 0,
			structureId: previous?.structureId ?? 0,
			shipTypeId: previous?.shipTypeId ?? 0,
		};

		if (online) {
			snapshot.online = Boolean(online?.online);
		}

		if (Array.isArray(skillqueue)) {
			snapshot.skillqueueCount = skillqueue.length;
		}

		if (wallet !== null && wallet !== undefined) {
			snapshot.walletBalance = this._coerceNumber(wallet, 0);
		}

		if (Array.isArray(killmails)) {
			snapshot.killmailsRecentCount = killmails.length;
		}

		if (Array.isArray(notifications)) {
			snapshot.notificationsCount = notifications.length;
		}

		if (location) {
			snapshot.stationId = this._coerceNumber(location?.station_id, 0);
			snapshot.structureId = this._coerceNumber(location?.structure_id, 0);
		}

		if (ship) {
			snapshot.shipTypeId = this._coerceNumber(ship?.ship_type_id, 0);
		}

		return snapshot;
	}

	async _maybeTriggerAlerts({ previous, current }) {
		if (!previous || !current) {
			return;
		}

		if (previous.online !== current.online) {
			await this.lumia.triggerAlert({ alert: ALERT_KEYS.online });
		}

		if (previous.skillqueueCount > 0 && current.skillqueueCount === 0) {
			await this.lumia.triggerAlert({ alert: ALERT_KEYS.skillQueueEmpty });
		}

		const walletDelta = current.walletBalance - previous.walletBalance;
		const threshold = this._walletAlertThreshold();
		if (threshold > 0 && Math.abs(walletDelta) >= threshold) {
			await this.lumia.triggerAlert({
				alert:
					walletDelta >= 0 ? ALERT_KEYS.walletSpike : ALERT_KEYS.walletDrop,
			});
		}

		if (current.killmailsRecentCount > previous.killmailsRecentCount) {
			await this.lumia.triggerAlert({ alert: ALERT_KEYS.killmail });
		}

		if (current.notificationsCount > previous.notificationsCount) {
			await this.lumia.triggerAlert({ alert: ALERT_KEYS.notification });
		}

		const wasDocked = (previous.stationId || previous.structureId) > 0;
		const isDocked = (current.stationId || current.structureId) > 0;
		if (!wasDocked && isDocked) {
			await this.lumia.triggerAlert({ alert: ALERT_KEYS.eve_docked });
		} else if (wasDocked && !isDocked) {
			await this.lumia.triggerAlert({ alert: ALERT_KEYS.eve_undocked });
		}

		if (
			previous.shipTypeId &&
			current.shipTypeId &&
			previous.shipTypeId !== current.shipTypeId
		) {
			await this.lumia.triggerAlert({ alert: ALERT_KEYS.shipChanged });
		}
	}

	async _showAuthFailureToast() {
		if (typeof this.lumia?.showToast !== "function") {
			return;
		}
		try {
			await this.lumia.showToast({
				message:
					"EVE Online auth expired. Re-authorize the plugin in Connections.",
				time: 6,
			});
		} catch (error) {
			return;
		}
	}

	_applyGlobalBackoff(seconds) {
		const delayMs = Math.max(0, this._coerceNumber(seconds, 0)) * 1000;
		const until = Date.now() + delayMs;
		if (!this._globalBackoffUntil || until > this._globalBackoffUntil) {
			this._globalBackoffUntil = until;
		}
	}

	_schedulePolling() {
		this._clearPolling();

		const intervalSeconds = this._pollInterval(this.settings);
		if (!this._hasAuthTokens() || intervalSeconds <= 0) {
			return;
		}

		this._pollTimer = setInterval(() => {
			void this._refreshData({ reason: "poll" });
		}, intervalSeconds * 1000);
	}

	_clearPolling() {
		if (this._pollTimer) {
			clearInterval(this._pollTimer);
			this._pollTimer = null;
		}
	}

	_hasAuthTokens() {
		return Boolean(this._accessToken() || this._refreshToken());
	}

	_accessToken() {
		return this._coerceString(this.settings?.accessToken, "");
	}

	_refreshToken() {
		return this._coerceString(this.settings?.refreshToken, "");
	}

	_canRefreshTokens() {
		return Boolean(
			this._refreshToken() &&
			typeof this.lumia?.refreshOAuthToken === "function",
		);
	}

	_pollInterval(settings = this.settings) {
		const interval = this._coerceNumber(
			settings?.pollInterval,
			DEFAULTS.pollInterval,
		);
		return Number.isFinite(interval) ? interval : DEFAULTS.pollInterval;
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
				// const message = this._errorMessage(error);
			}
		}
	}

	async _setVariable(name, value) {
		if (typeof this.lumia.setVariable !== "function") {
			return;
		}

		await this.lumia.setVariable(name, value);
	}

	async _setVariableIfChanged(name, value) {
		const normalized = this._normalizeValue(value);
		const previous = this._lastVariables.get(name);
		if (this._valuesEqual(previous, normalized)) {
			return false;
		}
		this._lastVariables.set(name, normalized);
		await this._setVariable(name, value);
		return true;
	}

	_normalizeValue(value) {
		if (value === null || value === undefined) {
			return "";
		}
		if (typeof value === "object") {
			try {
				return JSON.stringify(value);
			} catch (error) {
				return String(value);
			}
		}
		return String(value);
	}

	_valuesEqual(a, b) {
		return a === b;
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

	_truncateError(value) {
		if (!value) {
			return "";
		}
		const trimmed = String(value).replace(/\s+/g, " ").trim();
		return trimmed.length > 200 ? `${trimmed.slice(0, 200)}…` : trimmed;
	}

	_coerceNumber(value, fallback = 0) {
		const number = Number(value);
		return Number.isFinite(number) ? number : fallback;
	}

	_coerceString(value, fallback = "") {
		if (typeof value === "string") {
			return value;
		}
		if (value === null || value === undefined) {
			return fallback;
		}
		return String(value);
	}
}

module.exports = EveOnlinePlugin;

```

## eveonline/manifest.json

```
{
	"id": "eveonline",
	"name": "EVE Online",
	"version": "1.0.2",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://lumiastream.com",
	"repository": "",
	"description": "Pull EVE Online character status, wallet, location, and activity from ESI into Lumia.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "games",
	"keywords": "eve online, esi, character, stats, mmo, games",
	"icon": "eveonline.png",
	"config": {
		"oauth": {
			"buttonLabel": "Authorize EVE Online",
			"helperText": "Connect your EVE Online character to pull ESI data.",
			"openInBrowser": true,
			"scopes": [
				"esi-characters.read_notifications.v1",
				"esi-industry.read_character_jobs.v1",
				"esi-killmails.read_killmails.v1",
				"esi-location.read_location.v1",
				"esi-location.read_online.v1",
				"esi-location.read_ship_type.v1",
				"esi-markets.read_character_orders.v1",
				"esi-skills.read_skillqueue.v1",
				"esi-wallet.read_character_wallet.v1"
			],
			"tokenKeys": {
				"accessToken": "accessToken",
				"refreshToken": "refreshToken",
				"tokenSecret": "tokenSecret"
			}
		},
		"settings": [
			{
				"key": "pollInterval",
				"label": "Poll Interval (seconds)",
				"type": "number",
				"defaultValue": 120,
				"min": 60,
				"max": 900,
				"helperText": "How often to refresh ESI data (60-900 seconds)."
			},
			{
				"key": "enableAlerts",
				"label": "Enable Alerts",
				"type": "toggle",
				"defaultValue": true,
				"helperText": "Trigger Lumia alerts for EVE Online events."
			},
			{
				"key": "walletAlertThreshold",
				"label": "Wallet Alert Threshold (ISK)",
				"type": "number",
				"defaultValue": 1000000,
				"min": 0,
				"helperText": "Minimum ISK change to trigger wallet spike/drop alerts."
			},
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
			}
		],
		"settings_tutorial": "./settings_tutorial.md",
		"actions": [],
		"variables": [
			{
				"name": "character_id",
				"description": "Authenticated character ID.",
				"value": 0
			},
			{
				"name": "character_name",
				"description": "Authenticated character name.",
				"value": ""
			},
			{
				"name": "corporation_id",
				"description": "Character corporation ID.",
				"value": 0
			},
			{
				"name": "alliance_id",
				"description": "Character alliance ID (0 if none).",
				"value": 0
			},
			{
				"name": "security_status",
				"description": "Character security status.",
				"value": 0
			},
			{
				"name": "wallet_balance",
				"description": "Current wallet balance.",
				"value": 0
			},
			{
				"name": "online",
				"description": "Whether the character is currently online.",
				"value": false
			},
			{
				"name": "solar_system_id",
				"description": "Current solar system ID.",
				"value": 0
			},
			{
				"name": "station_id",
				"description": "Current station ID (0 if not docked).",
				"value": 0
			},
			{
				"name": "structure_id",
				"description": "Current structure ID (0 if none).",
				"value": 0
			},
			{
				"name": "ship_name",
				"description": "Current ship name.",
				"value": ""
			},
			{
				"name": "ship_type_id",
				"description": "Current ship type ID.",
				"value": 0
			},
			{
				"name": "ship_item_id",
				"description": "Current ship item ID.",
				"value": 0
			},
			{
				"name": "skillqueue_count",
				"description": "Number of skills in the queue.",
				"value": 0
			},
			{
				"name": "skillqueue_current_skill_id",
				"description": "Skill ID currently training.",
				"value": 0
			},
			{
				"name": "skillqueue_current_level",
				"description": "Training level for the current skill.",
				"value": 0
			},
			{
				"name": "skillqueue_current_end",
				"description": "Finish time for the current skill (ISO).",
				"value": ""
			},
			{
				"name": "skillqueue_ends_at",
				"description": "Finish time for the last queued skill (ISO).",
				"value": ""
			},
			{
				"name": "market_orders_active",
				"description": "Number of active market orders.",
				"value": 0
			},
			{
				"name": "market_orders_buy",
				"description": "Number of active buy orders.",
				"value": 0
			},
			{
				"name": "market_orders_sell",
				"description": "Number of active sell orders.",
				"value": 0
			},
			{
				"name": "industry_jobs_active",
				"description": "Number of active industry jobs.",
				"value": 0
			},
			{
				"name": "industry_jobs_total",
				"description": "Total industry jobs returned by ESI.",
				"value": 0
			},
			{
				"name": "killmails_recent_count",
				"description": "Count of recent killmails.",
				"value": 0
			},
			{
				"name": "notifications_count",
				"description": "Number of notifications returned by ESI.",
				"value": 0
			}
		],
		"alerts": [
			{
				"title": "Online Status Changed",
				"key": "eve_online_status",
				"acceptedVariables": [
					"character_name",
					"online",
					"last_login",
					"last_logout"
				],
				"defaultMessage": "{{character_name}} is now {{online}}."
			},
			{
				"title": "Skill Queue Empty",
				"key": "eve_skillqueue_empty",
				"acceptedVariables": [
					"character_name",
					"skillqueue_count",
					"skillqueue_current_end"
				],
				"defaultMessage": "{{character_name}}'s skill queue is empty."
			},
			{
				"title": "Wallet Spike",
				"key": "eve_wallet_spike",
				"acceptedVariables": [
					"character_name",
					"wallet_balance"
				],
				"defaultMessage": "{{character_name}} wallet increased ({{wallet_balance}} ISK)."
			},
			{
				"title": "Wallet Drop",
				"key": "eve_wallet_drop",
				"acceptedVariables": [
					"character_name",
					"wallet_balance"
				],
				"defaultMessage": "{{character_name}} wallet decreased ({{wallet_balance}} ISK)."
			},
			{
				"title": "New Killmail",
				"key": "eve_killmail_new",
				"acceptedVariables": [
					"character_name",
					"killmails_recent_count"
				],
				"defaultMessage": "New killmail detected for {{character_name}}."
			},
			{
				"title": "New Notification",
				"key": "eve_notification_new",
				"acceptedVariables": [
					"character_name",
					"notifications_count"
				],
				"defaultMessage": "New EVE notification for {{character_name}}."
			},
			{
				"title": "Docked",
				"key": "eve_docked",
				"acceptedVariables": [
					"character_name",
					"station_id",
					"structure_id",
					"solar_system_id"
				],
				"defaultMessage": "{{character_name}} docked."
			},
			{
				"title": "Undocked",
				"key": "eve_undocked",
				"acceptedVariables": [
					"character_name",
					"station_id",
					"structure_id",
					"solar_system_id"
				],
				"defaultMessage": "{{character_name}} undocked."
			},
			{
				"title": "Ship Changed",
				"key": "eve_ship_changed",
				"acceptedVariables": [
					"character_name",
					"ship_type_id",
					"ship_name"
				],
				"defaultMessage": "{{character_name}} switched ships ({{ship_name}})."
			}
		],
		"actions_tutorial": "./actions_tutorial.md",
		"translations": "./translations.json"
	}
}

```

## eveonline/package.json

```
{
	"name": "lumia_plugin-eve-online",
	"version": "1.0.0",
	"private": true,
	"description": "Lumia Stream plugin that pulls EVE Online character data from ESI.",
	"main": "main.js",
	"scripts": {},
	"dependencies": {
		"@lumiastream/plugin": "^0.4.1"
	}
}

```

## eveonline/settings_tutorial.md

```
---
### Authorize This Plugin
1) Click **Authorize EVE Online** in the OAuth section.

**Note:** EVE SSO authorization is per character. To switch characters, re-authorize.
---
---

```

## eveonline/translations.json

```
{
	"en": {
		"character_id": "Authenticated character ID.",
		"character_name": "Authenticated character name.",
		"corporation_id": "Character corporation ID.",
		"alliance_id": "Character alliance ID (0 if none).",
		"security_status": "Character security status.",
		"wallet_balance": "Current wallet balance.",
		"online": "Whether the character is currently online.",
		"solar_system_id": "Current solar system ID.",
		"station_id": "Current station ID (0 if not docked).",
		"structure_id": "Current structure ID (0 if none).",
		"ship_name": "Current ship name.",
		"ship_type_id": "Current ship type ID.",
		"ship_item_id": "Current ship item ID.",
		"skillqueue_count": "Number of skills in the queue.",
		"skillqueue_current_skill_id": "Skill ID currently training.",
		"skillqueue_current_level": "Training level for the current skill.",
		"skillqueue_current_end": "Finish time for the current skill (ISO).",
		"skillqueue_ends_at": "Finish time for the last queued skill (ISO).",
		"market_orders_active": "Number of active market orders.",
		"market_orders_buy": "Number of active buy orders.",
		"market_orders_sell": "Number of active sell orders.",
		"industry_jobs_active": "Number of active industry jobs.",
		"industry_jobs_total": "Total industry jobs returned by ESI.",
		"killmails_recent_count": "Count of recent killmails.",
		"notifications_count": "Number of notifications returned by ESI.",
		"last_login": "Last Login",
		"last_logout": "Last Logout"
	}
}

```

## mawakit/main.js

```
const { Plugin } = require("@lumiastream/plugin");

/** Alert keys defined in manifest.json; used when triggering prayer/ramadan alerts. */
const ALERT_KEYS = {
  fajr: "mawakit_fajr",
  sunrise: "mawakit_shuruq",
  dhuhr: "mawakit_dhuhr",
  asr: "mawakit_asr",
  maghrib: "mawakit_maghrib",
  isha: "mawakit_isha",
  ramadan: "mawakit_ramadan_soon",
};

/** Prayer order and their corresponding alert/offset setting keys. Sunrise is displayed as Shuruq. */
const PRAYER_ORDER = [
  { key: "Fajr", alert: ALERT_KEYS.fajr, offsetKey: "offsetFajr" },
  { key: "Sunrise", alert: ALERT_KEYS.sunrise, offsetKey: "offsetSunrise" },
  { key: "Dhuhr", alert: ALERT_KEYS.dhuhr, offsetKey: "offsetDhuhr" },
  { key: "Asr", alert: ALERT_KEYS.asr, offsetKey: "offsetAsr" },
  { key: "Maghrib", alert: ALERT_KEYS.maghrib, offsetKey: "offsetMaghrib" },
  { key: "Isha", alert: ALERT_KEYS.isha, offsetKey: "offsetIsha" },
];

const VARIABLE_KEYS = {
  fajr: "fajr",
  sunrise: "sunrise",
  dhuhr: "dhuhr",
  asr: "asr",
  maghrib: "maghrib",
  isha: "isha",
  hijriDate: "hijri_date",
  hijriMonth: "hijri_month",
  hijriDay: "hijri_day",
  location: "location",
  nextPrayer: "next_prayer",
  nextPrayerTime: "next_prayer_time",
  prayerTimes: "prayer_times",
};

/** Cache timings for 10 minutes to avoid hitting the Aladhan API too frequently. */
const CACHE_TTL_MS = 10 * 60 * 1000;

/** Default city when only country is set (Aladhan API requires city+country). */
const DEFAULT_CITY_BY_COUNTRY = {
  Morocco: "Casablanca",
  "Saudi Arabia": "Mecca",
  Egypt: "Cairo",
  Turkey: "Istanbul",
  Indonesia: "Jakarta",
  Pakistan: "Karachi",
  Malaysia: "Kuala Lumpur",
  Algeria: "Algiers",
  "United Arab Emirates": "Dubai",
  Nigeria: "Lagos",
  Tunisia: "Tunis",
  Jordan: "Amman",
  Lebanon: "Beirut",
  Syria: "Damascus",
  Iraq: "Baghdad",
  Iran: "Tehran",
  Afghanistan: "Kabul",
  Bangladesh: "Dhaka",
  Yemen: "Sana'a",
  Libya: "Tripoli",
  Palestine: "Ramallah",
  Kuwait: "Kuwait City",
  Qatar: "Doha",
  Bahrain: "Manama",
  Oman: "Muscat",
  Sudan: "Khartoum",
  Somalia: "Mogadishu",
  Mauritania: "Nouakchott",
  Senegal: "Dakar",
  Mali: "Bamako",
  Niger: "Niamey",
  "Burkina Faso": "Ouagadougou",
  Gambia: "Banjul",
  Guinea: "Conakry",
};

class MawakitPlugin extends Plugin {
  constructor(manifest, context) {
    super(manifest, context);
    this._pollTimer = null;
    this._midnightTimer = null;
    this._ramadanTimer = null;
    this._bootstrapTimer = null;
    this._prayerTimers = new Map();
    this._cache = new Map();
    this._state = {
      timings: null,
      hijri: null,
      meta: null,
      location: null,
      locationLabel: "",
    };
    this._lastRamadanAlertDate = null;
    this._lastToast = null;
  }

  async onload() {
    this._ensureStart({ reason: "load" });
  }

  async onunload() {
    this._clearTimers();
  }

  async onsettingsupdate(settings, previous = {}) {
    this._ensureStart({ reason: "settings-update", previous });
  }

  async variableFunction(config) {
    const key = config?.key;
    const args = Array.isArray(config?.args) ? config.args : [];
    const raw = typeof config?.value === "string" ? config.value : "";

    if (key !== "mawakit_prayer_times" && key !== "mawakit_hijri_date") {
      return "";
    }

    // Resolve location: variable args (city|country or lat,lon) → settings → cached state
    const location =
      this._resolveLocationFromArgs(args, raw) ||
      this._resolveLocationWithCountryFallback(this.settings) ||
      this._state.location;

    if (!location) {
      // mawakit_prayer_times must never return empty - use last known or placeholder
      if (key === "mawakit_prayer_times" && this._state.locationLabel) {
        return (
          this._buildPrayerTimesString() ||
          `Location=${this._state.locationLabel}`
        );
      }
      return key === "mawakit_hijri_date"
        ? ""
        : "Set location in Mawakit settings";
    }

    const timings = await this._fetchTimingsCached({ location });
    if (!timings) {
      if (key === "mawakit_prayer_times") {
        const fallback = this._buildPrayerTimesString();
        if (fallback) return fallback;
        return `Location=${location?.city || location?.latitude || "Unknown"}`;
      }
      return "";
    }

    if (key === "mawakit_hijri_date") {
      return timings.hijri?.date ?? "";
    }

    const parts = [
      `Fajr=${timings.timings?.Fajr ?? ""}`,
      `Sunrise=${timings.timings?.Sunrise ?? ""}`,
      `Dhuhr=${timings.timings?.Dhuhr ?? ""}`,
      `Asr=${timings.timings?.Asr ?? ""}`,
      `Maghrib=${timings.timings?.Maghrib ?? ""}`,
      `Isha=${timings.timings?.Isha ?? ""}`,
      `Hijri=${timings.hijri?.date ?? ""}`,
      `Location=${timings.locationLabel ?? ""}`,
    ];

    return parts.join(", ");
  }

  async _start({ reason } = {}) {
    this._clearTimers();
    await this._refreshTimings({ reason });
    this._schedulePolling();
    this._scheduleMidnightRefresh();
    this._schedulePrayerAlerts();
    this._scheduleRamadanCheck();
  }

  _clearTimers() {
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
    if (this._midnightTimer) {
      clearTimeout(this._midnightTimer);
      this._midnightTimer = null;
    }
    if (this._ramadanTimer) {
      clearInterval(this._ramadanTimer);
      this._ramadanTimer = null;
    }
    for (const timer of this._prayerTimers.values()) {
      clearTimeout(timer);
    }
    this._prayerTimers.clear();
    if (this._bootstrapTimer) {
      clearTimeout(this._bootstrapTimer);
      this._bootstrapTimer = null;
    }
  }

  /**
   * Start the plugin when Lumia is ready. If context.lumia isn't available yet (e.g. during init),
   * retry after 500ms until it is.
   */
  _ensureStart({ reason, previous } = {}) {
    if (this._hasLumia()) {
      void this._start({ reason, previous });
      return;
    }
    if (this._bootstrapTimer) {
      return;
    }
    this._bootstrapTimer = setTimeout(() => {
      this._bootstrapTimer = null;
      this._ensureStart({ reason, previous });
    }, 500);
  }

  _schedulePolling() {
    const intervalMinutes = this._coerceNumber(
      this.settings?.pollIntervalMinutes,
      60,
    );
    if (intervalMinutes <= 0) {
      return;
    }
    this._pollTimer = setInterval(
      () => {
        void this._refreshTimings({ reason: "poll" });
      },
      intervalMinutes * 60 * 1000,
    );
  }

  /**
   * Refresh timings at 00:05 local time so a new day's prayer schedule is loaded.
   * Schedules itself again after each run to run every night.
   */
  _scheduleMidnightRefresh() {
    const now = new Date();
    const next = new Date(now);
    next.setHours(0, 5, 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    this._midnightTimer = setTimeout(() => {
      void this._refreshTimings({ reason: "midnight" }).then(() => {
        this._schedulePrayerAlerts();
        this._scheduleMidnightRefresh();
      });
    }, next.getTime() - now.getTime());
  }

  _schedulePrayerAlerts() {
    for (const timer of this._prayerTimers.values()) {
      clearTimeout(timer);
    }
    this._prayerTimers.clear();

    if (!this._state.timings) {
      return;
    }

    const now = new Date();
    const timezoneOffsetMinutes = this._coerceNumber(
      this.settings?.timezoneOffsetMinutes,
      0,
    );
    const alertMinutesBefore = this._coerceNumber(
      this.settings?.alertMinutesBefore,
      0,
    );

    for (const prayer of PRAYER_ORDER) {
      const time = this._state.timings?.[prayer.key];
      if (!time) {
        continue;
      }
      const offsetMinutes = this._coerceNumber(
        this.settings?.[prayer.offsetKey],
        0,
      );
      let target = this._buildTimeToday(
        time,
        timezoneOffsetMinutes + offsetMinutes,
      );
      if (!target || target <= now) {
        continue;
      }
      if (alertMinutesBefore > 0) {
        target = new Date(target.getTime() - alertMinutesBefore * 60 * 1000);
        if (target <= now) {
          continue;
        }
      }
      const delay = target.getTime() - now.getTime();
      const timer = setTimeout(() => {
        void this._emitPrayerAlert(prayer.key, time, alertMinutesBefore);
        void this._refreshNextPrayer();
      }, delay);
      this._prayerTimers.set(prayer.key, timer);
    }

    void this._refreshNextPrayer();
  }

  _scheduleRamadanCheck() {
    if (this.settings?.enableRamadanAlert === false) {
      return;
    }
    this._ramadanTimer = setInterval(
      () => {
        void this._maybeRamadanAlert();
      },
      6 * 60 * 60 * 1000,
    );
    void this._maybeRamadanAlert();
  }

  async _refreshTimings({ reason } = {}) {
    const location = this._resolveLocationWithCountryFallback(this.settings);
    if (!location) {
      if (reason !== "poll") {
        await this._toastOnce(
          "Set a location in Mawakit settings to enable prayer time alerts.",
        );
      }
      return;
    }

    const data = await this._fetchTimingsCached({ location });
    if (!data) {
      return;
    }

    this._state.timings = data.timings || null;
    this._state.hijri = data.hijri || null;
    this._state.meta = data.meta || null;
    this._state.location = location;
    this._state.locationLabel = data.locationLabel || "";
    await this._applyVariables();
  }

  async _applyVariables() {
    if (!this._hasLumia()) {
      return;
    }

    const timings = this._state.timings || {};
    const vars = {
      [VARIABLE_KEYS.fajr]: this._applyOffsetToTime(
        timings.Fajr,
        this.settings?.offsetFajr,
      ),
      [VARIABLE_KEYS.sunrise]: this._applyOffsetToTime(
        timings.Sunrise,
        this.settings?.offsetSunrise,
      ),
      [VARIABLE_KEYS.dhuhr]: this._applyOffsetToTime(
        timings.Dhuhr,
        this.settings?.offsetDhuhr,
      ),
      [VARIABLE_KEYS.asr]: this._applyOffsetToTime(
        timings.Asr,
        this.settings?.offsetAsr,
      ),
      [VARIABLE_KEYS.maghrib]: this._applyOffsetToTime(
        timings.Maghrib,
        this.settings?.offsetMaghrib,
      ),
      [VARIABLE_KEYS.isha]: this._applyOffsetToTime(
        timings.Isha,
        this.settings?.offsetIsha,
      ),
      [VARIABLE_KEYS.location]: this._state.locationLabel || "",
      [VARIABLE_KEYS.hijriDate]: (this._state.hijri || {}).date || "",
      [VARIABLE_KEYS.hijriMonth]:
        this._state.hijri?.month?.en || this._state.hijri?.month?.ar || "",
      [VARIABLE_KEYS.hijriDay]: (this._state.hijri || {}).day || "",
      [VARIABLE_KEYS.prayerTimes]: this._buildPrayerTimesString(),
    };

    for (const [key, value] of Object.entries(vars)) {
      await this._setVariable(key, value);
    }

    await this._refreshNextPrayer();
  }

  async _refreshNextPrayer() {
    if (!this._state.timings) {
      return;
    }
    const now = new Date();
    const timezoneOffsetMinutes = this._coerceNumber(
      this.settings?.timezoneOffsetMinutes,
      0,
    );
    let nextName = "";
    let nextTime = "";

    for (const prayer of PRAYER_ORDER) {
      const raw = this._state.timings?.[prayer.key];
      if (!raw) {
        continue;
      }
      const offsetMinutes = this._coerceNumber(
        this.settings?.[prayer.offsetKey],
        0,
      );
      const target = this._buildTimeToday(
        raw,
        timezoneOffsetMinutes + offsetMinutes,
      );
      if (target && target > now) {
        nextName = prayer.key === "Sunrise" ? "Shuruq" : prayer.key;
        nextTime = this._formatTime(target);
        break;
      }
    }

    if (!nextName) {
      const firstPrayer = PRAYER_ORDER[0];
      const raw = this._state.timings?.[firstPrayer.key];
      if (raw) {
        const offsetMinutes = this._coerceNumber(
          this.settings?.[firstPrayer.offsetKey],
          0,
        );
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const target = this._buildTimeOnDate(
          tomorrow,
          raw,
          timezoneOffsetMinutes + offsetMinutes,
        );
        if (target) {
          nextName = firstPrayer.key;
          nextTime = this._formatTime(target);
        }
      }
    }

    await this._setVariable(VARIABLE_KEYS.nextPrayer, nextName);
    await this._setVariable(VARIABLE_KEYS.nextPrayerTime, nextTime);
  }

  async _emitPrayerAlert(prayerKey, time, alertMinutesBefore = 0) {
    const prayer = PRAYER_ORDER.find((entry) => entry.key === prayerKey);
    if (!prayer) {
      return;
    }

    const hijriDate = this._state.hijri?.date || "";
    const location = this._state.locationLabel || "";
    const displayName = prayer.key === "Sunrise" ? "Shuruq" : prayer.key;
    const adjustedTime = this._applyOffsetToTime(
      time,
      this.settings?.[prayer.offsetKey],
    );

    // Maps to manifest variationConditions so Lumia can show the correct alert message
    const whenValue =
      alertMinutesBefore >= 20
        ? "20_before"
        : alertMinutesBefore >= 15
          ? "15_before"
          : alertMinutesBefore >= 10
            ? "10_before"
            : alertMinutesBefore >= 5
              ? "5_before"
              : "at_time";

    try {
      if (!this._hasLumia()) {
        return;
      }
      await this.context.lumia.triggerAlert({
        alert: prayer.alert,
        dynamic: { name: "value", value: whenValue },
        extraSettings: {
          prayer: displayName,
          time: adjustedTime,
          hijri_date: hijriDate,
          location,
          minutes_before: alertMinutesBefore,
        },
      });
    } catch (error) {
      if (this.context?.lumia?.log) {
        await this.context.lumia.log(
          `[Mawakit] Failed to trigger ${displayName} alert: ${error?.message ?? String(error)}`,
        );
      }
    }
  }

  /**
   * Fire Ramadan alert when we're in Hijri month 8 (Ramadan) and within N days of the end.
   * monthNumber 8 = Ramadan; day 1–30 is the day of the month.
   */
  async _maybeRamadanAlert() {
    if (this.settings?.enableRamadanAlert === false) {
      return;
    }
    const hijri = this._state.hijri;
    if (!hijri) {
      return;
    }
    const monthNumber = this._coerceNumber(hijri?.month?.number, 0);
    const day = this._coerceNumber(hijri?.day, 0);
    if (monthNumber !== 8 || day <= 0) {
      return;
    }
    const daysRemaining = Math.max(0, 30 - day);
    const threshold = this._coerceNumber(this.settings?.ramadanAlertDays, 10);
    if (daysRemaining > threshold) {
      return;
    }
    const todayKey = new Date().toISOString().slice(0, 10);
    if (this._lastRamadanAlertDate === todayKey) {
      return;
    }
    this._lastRamadanAlertDate = todayKey;
    try {
      if (!this._hasLumia()) {
        return;
      }
      await this.context.lumia.triggerAlert({
        alert: ALERT_KEYS.ramadan,
        extraSettings: {
          days_remaining: daysRemaining,
          hijri_date: hijri?.date || "",
          location: this._state.locationLabel || "",
        },
      });
    } catch (error) {
      if (this.context?.lumia?.log) {
        await this.context.lumia.log(
          `[Mawakit] Failed to trigger Ramadan alert: ${error?.message ?? String(error)}`,
        );
      }
    }
  }

  /**
   * Resolves location from settings: system location (if enabled), coordinates, or city+country.
   * When only country is set, uses DEFAULT_CITY_BY_COUNTRY so the Aladhan API gets a valid city.
   */
  _resolveLocationWithCountryFallback(settings = {}) {
    if (settings?.locationMode === "system") {
      const location = this._resolveSystemLocation();
      if (location) {
        return location;
      }
    }

    const type = settings?.locationType || "city";
    if (type === "coordinates") {
      const lat = this._coerceNumber(settings?.latitude, null);
      const lon = this._coerceNumber(settings?.longitude, null);
      if (typeof lat === "number" && typeof lon === "number") {
        return { type: "coordinates", latitude: lat, longitude: lon };
      }
      return null;
    }

    let city = this._coerceString(settings?.city, "").trim();
    const country = this._coerceString(settings?.country, "").trim();
    if (country && !city) {
      city = DEFAULT_CITY_BY_COUNTRY[country] || country;
    }
    if (city && country) {
      return { type: "city", city, country };
    }
    return null;
  }

  _resolveSystemLocation() {
    if (typeof this.lumia?.getLocation !== "function") {
      return null;
    }
    try {
      const data = this.lumia.getLocation();
      if (!data) {
        return null;
      }
      const latitude = this._coerceNumber(data.latitude, null);
      const longitude = this._coerceNumber(data.longitude, null);
      if (typeof latitude === "number" && typeof longitude === "number") {
        return { type: "coordinates", latitude, longitude };
      }
      if (data.city && data.country) {
        return { type: "city", city: data.city, country: data.country };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Parse location from variable function input: "city|country", "|country", or "lat,lon".
   */
  _resolveLocationFromArgs(args, raw) {
    if (!raw && args.length === 0) {
      return null;
    }
    const input = raw || args.join("|");
    const [first = "", second = ""] = input.split("|").map((s) => s.trim());
    if (first.includes(",")) {
      const [latRaw, lonRaw] = first.split(",");
      const lat = this._coerceNumber(latRaw, null);
      const lon = this._coerceNumber(lonRaw, null);
      if (typeof lat === "number" && typeof lon === "number") {
        return { type: "coordinates", latitude: lat, longitude: lon };
      }
      return null;
    }
    let city = first;
    const country = second;
    if (country && !city) {
      city = DEFAULT_CITY_BY_COUNTRY[country] || country;
    }
    if (city && country) {
      return { type: "city", city, country };
    }
    return null;
  }

  async _fetchTimingsCached({ location }) {
    const cacheKey = JSON.stringify({
      location,
      method: this._methodId(),
      school: this._schoolId(),
    });
    const cached = this._cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
    const data = await this._fetchTimings({ location });
    if (data) {
      this._cache.set(cacheKey, { timestamp: Date.now(), data });
    }
    return data;
  }

  async _fetchTimings({ location }) {
    const method = this._methodId();
    const school = this._schoolId();
    const date = this._formatApiDate(new Date());
    let url = "";
    if (location.type === "coordinates") {
      url = `https://api.aladhan.com/v1/timings/${date}?latitude=${encodeURIComponent(
        location.latitude,
      )}&longitude=${encodeURIComponent(location.longitude)}&method=${method}&school=${school}`;
    } else {
      url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(
        location.city,
      )}&country=${encodeURIComponent(location.country)}&method=${method}&school=${school}`;
    }

    let json;
    try {
      json = await this._fetchJson(url);
    } catch (error) {
      if (this._hasLumia()) {
        await this.context.lumia.log(
          `[Mawakit] Failed to fetch prayer times: ${error?.message ?? String(error)}`,
        );
      }
      return null;
    }

    const data = json?.data;
    if (!data?.timings) {
      return null;
    }

    const timings = data.timings || {};
    const hijri = data.date?.hijri || null;
    const meta = data.meta || null;
    const locationLabel = this._formatLocationLabel(location, meta);

    return { timings, hijri, meta, locationLabel };
  }

  async _fetchJson(url) {
    if (typeof fetch !== "function") {
      throw new Error("fetch is not available in this runtime");
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  _formatLocationLabel(location, meta) {
    if (location.type === "city") {
      return `${location.city}, ${location.country}`;
    }
    if (meta?.timezone) {
      return `${location.latitude}, ${location.longitude} (${meta.timezone})`;
    }
    return `${location.latitude}, ${location.longitude}`;
  }

  /** Aladhan API expects date as DD-MM-YYYY. */
  _formatApiDate(date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  _buildTimeOnDate(baseDate, time, offsetMinutes) {
    const normalized = this._normalizeTime(time);
    if (!normalized) {
      return null;
    }
    const [hours, minutes] = normalized
      .split(":")
      .map((value) => Number(value));
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return null;
    }
    const target = new Date(baseDate);
    target.setHours(hours, minutes, 0, 0);
    if (offsetMinutes) {
      target.setMinutes(target.getMinutes() + offsetMinutes);
    }
    return target;
  }

  _buildTimeToday(time, offsetMinutes) {
    return this._buildTimeOnDate(new Date(), time, offsetMinutes);
  }

  /** Extract HH:MM from API time strings (e.g. "05:30 (GMT+1)" → "05:30"). */
  _normalizeTime(time) {
    if (typeof time !== "string") {
      return "";
    }
    return time.split(" ")[0].trim();
  }

  _formatTime(date) {
    return date.toTimeString().slice(0, 5);
  }

  _applyOffsetToTime(time, offsetMinutes) {
    const normalized = this._normalizeTime(time);
    if (!normalized) {
      return "";
    }
    const [hours, minutes] = normalized
      .split(":")
      .map((value) => Number(value));
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return normalized;
    }
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    const offset = this._coerceNumber(offsetMinutes, 0);
    if (offset) {
      target.setMinutes(target.getMinutes() + offset);
    }
    return this._formatTime(target);
  }

  _buildPrayerTimesString() {
    if (!this._state.timings) {
      return "";
    }
    const timings = this._state.timings;
    const parts = [
      `Fajr=${this._applyOffsetToTime(timings.Fajr, this.settings?.offsetFajr)}`,
      `Sunrise=${this._applyOffsetToTime(timings.Sunrise, this.settings?.offsetSunrise)}`,
      `Dhuhr=${this._applyOffsetToTime(timings.Dhuhr, this.settings?.offsetDhuhr)}`,
      `Asr=${this._applyOffsetToTime(timings.Asr, this.settings?.offsetAsr)}`,
      `Maghrib=${this._applyOffsetToTime(timings.Maghrib, this.settings?.offsetMaghrib)}`,
      `Isha=${this._applyOffsetToTime(timings.Isha, this.settings?.offsetIsha)}`,
    ];
    if (this._state.hijri?.date) {
      parts.push(`Hijri=${this._state.hijri.date}`);
    }
    if (this._state.locationLabel) {
      parts.push(`Location=${this._state.locationLabel}`);
    }
    return parts.join(", ");
  }

  async _setVariable(key, value) {
    const lumia = this.context?.lumia;
    if (!lumia) {
      return;
    }
    const alias = this._prefixedKey(key);
    await lumia.setVariable(key, value);
    if (alias && alias !== key) {
      await lumia.setVariable(alias, value);
    }
  }

  /** Plugin-scoped variable alias (e.g. mawakit_fajr) so variables don't clash with other plugins. */
  _prefixedKey(key) {
    const id = this.manifest?.id || "";
    if (!id) {
      return "";
    }
    return `${id}_${key}`;
  }

  /** Aladhan calculation method ID (default 2 = Muslim World League). */
  _methodId() {
    return this._coerceNumber(this.settings?.calculationMethod, 2);
  }

  /** Asr juristic method: Hanafi uses shadow factor 2; Shafi/Maliki use 1. */
  _schoolId() {
    const method = this._coerceString(this.settings?.juristicMethod, "shafi");
    return method === "hanafi" ? 1 : 0;
  }

  _coerceNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  _coerceString(value, fallback) {
    return typeof value === "string" ? value : fallback;
  }

  async _toastOnce(message) {
    if (this._lastToast === message) {
      return;
    }
    this._lastToast = message;
    if (
      this._hasLumia() &&
      typeof this.context.lumia?.showToast === "function"
    ) {
      await this.context.lumia.showToast({ message });
    }
  }

  _hasLumia() {
    return Boolean(this.context && this.context.lumia);
  }
}

module.exports = MawakitPlugin;

```

## mawakit/manifest.json

```
{
  "id": "mawakit",
  "name": "Mawakit",
  "version": "1.0.1",
  "author": "Lumia Stream",
  "email": "dev@lumiastream.com",
  "website": "https://lumiastream.com",
  "description": "Prayer time alerts, Hijri date variables, and Ramadan reminders based on your location.",
  "license": "MIT",
  "lumiaVersion": "^9.0.0",
  "category": "utilities",
  "keywords": "prayer, islam, adhan, hijri, ramadan, alerts",
  "icon": "mawakit.png",
  "changelog": "1.0.0: Prayer time alerts for Fajr, Shuruq, Dhuhr, Asr, Maghrib, Isha. Hijri date variables and function variable support. Ramadan-near alerts based on Hijri date. Location via city/country or coordinates with optional system location fallback. Per-prayer time offsets. Juristic method (Shafi/Maliki/Hanafi) support.",
  "config": {
    "settings": [
      {
        "key": "locationMode",
        "label": "Location Mode",
        "type": "select",
        "defaultValue": "manual",
        "options": [
          { "label": "Manual", "value": "manual" },
          { "label": "System (if available)", "value": "system" }
        ],
        "section": "Location",
        "helperText": "System mode uses the host location only if the runtime provides it. Otherwise Mawakit falls back to manual settings."
      },
      {
        "key": "locationType",
        "label": "Location Type",
        "type": "select",
        "defaultValue": "city",
        "options": [
          { "label": "City + Country", "value": "city" },
          { "label": "Latitude + Longitude", "value": "coordinates" }
        ],
        "section": "Location"
      },
      {
        "key": "city",
        "label": "City",
        "type": "text",
        "placeholder": "Casablanca",
        "section": "Location",
        "visibleIf": { "key": "locationType", "equals": "city" }
      },
      {
        "key": "country",
        "label": "Country",
        "type": "text",
        "placeholder": "Morocco",
        "section": "Location",
        "visibleIf": { "key": "locationType", "equals": "city" }
      },
      {
        "key": "latitude",
        "label": "Latitude",
        "type": "number",
        "min": -90,
        "max": 90,
        "section": "Location",
        "visibleIf": { "key": "locationType", "equals": "coordinates" }
      },
      {
        "key": "longitude",
        "label": "Longitude",
        "type": "number",
        "min": -180,
        "max": 180,
        "section": "Location",
        "visibleIf": { "key": "locationType", "equals": "coordinates" }
      },
      {
        "key": "timezoneOffsetMinutes",
        "label": "Timezone Offset (minutes)",
        "type": "number",
        "defaultValue": 0,
        "min": -720,
        "max": 840,
        "section": "Location",
        "helperText": "Adjust timings if your system timezone differs from the selected location."
      },
      {
        "key": "calculationMethod",
        "label": "Calculation Method ID",
        "type": "number",
        "defaultValue": 2,
        "min": 0,
        "max": 20,
        "section": "Calculation",
        "helperText": "Uses Aladhan method IDs. Keep the default if you are unsure."
      },
      {
        "key": "juristicMethod",
        "label": "Juristic Method (Asr)",
        "type": "select",
        "defaultValue": "shafi",
        "options": [
          { "label": "Shafi", "value": "shafi" },
          { "label": "Maliki", "value": "maliki" },
          { "label": "Hanafi", "value": "hanafi" }
        ],
        "section": "Calculation",
        "helperText": "Shafi and Maliki share the same Asr calculation in most APIs."
      },
      {
        "key": "pollIntervalMinutes",
        "label": "Refresh Interval (minutes)",
        "type": "number",
        "defaultValue": 60,
        "min": 15,
        "max": 720,
        "section": "Schedule",
        "helperText": "How often Mawakit refreshes prayer times from the API."
      },
      {
        "key": "alertMinutesBefore",
        "label": "Alert Minutes Before Prayer",
        "type": "number",
        "defaultValue": 0,
        "min": 0,
        "max": 30,
        "section": "Alerts",
        "helperText": "Fire the alert this many minutes before the prayer time (0 = at exact time). E.g. 10 = alert when 10 min before Asr."
      },
      {
        "key": "enableRamadanAlert",
        "label": "Alert When Ramadan Is Near",
        "type": "toggle",
        "defaultValue": true,
        "section": "Alerts"
      },
      {
        "key": "ramadanAlertDays",
        "label": "Ramadan Alert Days Before",
        "type": "number",
        "defaultValue": 10,
        "min": 1,
        "max": 30,
        "section": "Alerts",
        "visibleIf": { "key": "enableRamadanAlert", "equals": true }
      },
      {
        "key": "offsetFajr",
        "label": "Fajr Offset (minutes)",
        "type": "number",
        "defaultValue": 0,
        "min": -60,
        "max": 60,
        "section": "Offsets"
      },
      {
        "key": "offsetSunrise",
        "label": "Shuruq Offset (minutes)",
        "type": "number",
        "defaultValue": 0,
        "min": -60,
        "max": 60,
        "section": "Offsets"
      },
      {
        "key": "offsetDhuhr",
        "label": "Dhuhr Offset (minutes)",
        "type": "number",
        "defaultValue": 0,
        "min": -60,
        "max": 60,
        "section": "Offsets"
      },
      {
        "key": "offsetAsr",
        "label": "Asr Offset (minutes)",
        "type": "number",
        "defaultValue": 0,
        "min": -60,
        "max": 60,
        "section": "Offsets"
      },
      {
        "key": "offsetMaghrib",
        "label": "Maghrib Offset (minutes)",
        "type": "number",
        "defaultValue": 0,
        "min": -60,
        "max": 60,
        "section": "Offsets"
      },
      {
        "key": "offsetIsha",
        "label": "Isha Offset (minutes)",
        "type": "number",
        "defaultValue": 0,
        "min": -60,
        "max": 60,
        "section": "Offsets"
      }
    ],
    "settings_tutorial": "./settings_tutorial.md",
    "actions": [],
    "variableFunctions": [
      {
        "key": "mawakit_prayer_times",
        "label": "Mawakit Prayer Times",
        "description": "Use {{mawakit_prayer_times=city|country}}, {{mawakit_prayer_times=|country}}, {{mawakit_prayer_times=lat,lon}}, or {{mawakit_prayer_times}} (uses settings) to return prayer times. Falls back to selected country."
      },
      {
        "key": "mawakit_hijri_date",
        "label": "Mawakit Hijri Date",
        "description": "Use {{mawakit_hijri_date=city|country}}, {{mawakit_hijri_date=|country}}, {{mawakit_hijri_date=lat,lon}}, or {{mawakit_hijri_date}} (uses settings) to return Hijri date."
      }
    ],
    "variables": [
      {
        "name": "fajr",
        "value": ""
      },
      {
        "name": "sunrise",
        "value": ""
      },
      {
        "name": "dhuhr",
        "value": ""
      },
      {
        "name": "asr",
        "value": ""
      },
      {
        "name": "maghrib",
        "value": ""
      },
      {
        "name": "isha",
        "value": ""
      },
      {
        "name": "hijri_date",
        "value": ""
      },
      {
        "name": "hijri_month",
        "value": ""
      },
      {
        "name": "hijri_day",
        "value": ""
      },
      {
        "name": "location",
        "value": ""
      },
      {
        "name": "next_prayer",
        "value": ""
      },
      {
        "name": "next_prayer_time",
        "value": ""
      },
      {
        "name": "prayer_times",
        "value": ""
      }
    ],
    "alerts": [
      {
        "title": "Fajr",
        "key": "mawakit_fajr",
        "acceptedVariables": [
          "prayer",
          "time",
          "hijri_date",
          "location",
          "minutes_before"
        ],
        "defaultMessage": "Fajr at {{time}} ({{hijri_date}})",
        "variationConditions": [
          {
            "type": "EQUAL_SELECTION",
            "description": "When to alert",
            "selections": [
              {
                "label": "At exact time",
                "value": "at_time",
                "message": "Fajr at {{time}} ({{hijri_date}})"
              },
              {
                "label": "5 min before",
                "value": "5_before",
                "message": "Fajr in {{minutes_before}} minutes! ({{time}}) - {{hijri_date}}"
              },
              {
                "label": "10 min before",
                "value": "10_before",
                "message": "Fajr in {{minutes_before}} minutes! ({{time}}) - {{hijri_date}}"
              },
              {
                "label": "15 min before",
                "value": "15_before",
                "message": "Fajr in {{minutes_before}} minutes! ({{time}}) - {{hijri_date}}"
              },
              {
                "label": "20 min before",
                "value": "20_before",
                "message": "Fajr in {{minutes_before}} minutes! ({{time}}) - {{hijri_date}}"
              }
            ]
          }
        ]
      },
      {
        "title": "Shuruq",
        "key": "mawakit_shuruq",
        "acceptedVariables": [
          "prayer",
          "time",
          "hijri_date",
          "location",
          "minutes_before"
        ],
        "defaultMessage": "Shuruq at {{time}} ({{hijri_date}})",
        "variationConditions": [
          {
            "type": "EQUAL_SELECTION",
            "description": "When to alert",
            "selections": [
              {
                "label": "At exact time",
                "value": "at_time",
                "message": "Shuruq at {{time}} ({{hijri_date}})"
              },
              {
                "label": "5 min before",
                "value": "5_before",
                "message": "Shuruq in {{minutes_before}} minutes! ({{time}}) - {{hijri_date}}"
              },
              {
                "label": "10 min before",
                "value": "10_before",
                "message": "Shuruq in {{minutes_before}} minutes! ({{time}}) - {{hijri_date}}"
              },
              {
                "label": "15 min before",
                "value": "15_before",
                "message": "Shuruq in {{minutes_before}} minutes! ({{time}}) - {{hijri_date}}"
              },
              {
                "label": "20 min before",
                "value": "20_before",
                "message": "Shuruq in {{minutes_before}} minutes! ({{time}}) - {{hijri_date}}"
              }
            ]
          }
        ]
      },
      {
        "title": "Dhuhr",
        "key": "mawakit_dhuhr",
        "acceptedVariables": [
          "prayer",
          "time",
          "hijri_date",
          "location",
          "minutes_before"
        ],
        "defaultMessage": "Dhuhr at {{time}} ({{hijri_date}})",
        "variationConditions": [
          {
            "type": "EQUAL_SELECTION",
            "description": "When to alert",
            "selections": [
              {
                "label": "At exact time",
                "value": "at_time",
                "message": "Dhuhr at {{time}} ({{hijri_date}})"
              },
              {
                "label": "5 min before",
                "value": "5_before",
                "message": "Dhuhr in {{minutes_before}} minutes! ({{time}}) - {{hijri_date}}"
              },
              {
                "label": "10 min before",
                "value": "10_before",
                "message": "Dhuhr in {{minutes_before}} minutes! ({{time}}) - {{hijri_date}}"
              },
              {
                "label": "15 min before",
                "value": "15_before",
                "message": "Dhuhr in {{minutes_before}} minutes! ({{time}}) - {{hijri_date}}"
              },
              {
                "label": "20 min before",
                "value": "20_before",
                "message": "Dhuhr in {{minutes_before}} minutes! ({{time}}) - {{hijri_date}}"
              }
            ]
          }
        ]
      },
      {
        "title": "Asr",
        "key": "mawakit_asr",
        "acceptedVariables": [
          "prayer",
          "time",
          "hijri_date",
          "location",
          "minutes_before"
        ],
        "defaultMessage": "Asr at {{time}} ({{hijri_date}})",
        "variationConditions": [
          {
            "type": "EQUAL_SELECTION",
            "description": "When to alert",
            "selections": [
              {
                "label": "At exact time",
                "value": "at_time",
                "message": "Asr at {{time}} ({{hijri_date}})"
              },
              {
                "label": "5 min before",
                "value": "5_before",
                "message": "Asr in {{minutes_before}} minutes! ({{time}}) - {{hijri_date}}"
              },
              {
                "label": "10 min before",
                "value": "10_before",
                "message": "Asr in {{minutes_before}} minutes! ({{time}}) - {{hijri_date}}"
              },
              {
                "label": "15 min before",
                "value": "15_before",
                "message": "Asr in {{minutes_before}} minutes! ({{time}}) - {{hijri_date}}"
              },
              {
                "label": "20 min before",
                "value": "20_before",
                "message": "Asr in {{minutes_before}} minutes! ({{time}}) - {{hijri_date}}"
              }
            ]
          }
        ]
      },
      {
        "title": "Maghrib",
        "key": "mawakit_maghrib",
        "acceptedVariables": [
          "prayer",
          "time",
          "hijri_date",
          "location",
          "minutes_before"
        ],
        "defaultMessage": "Maghrib at {{time}} ({{hijri_date}})",
        "variationConditions": [
          {
            "type": "EQUAL_SELECTION",
            "description": "When to alert",
            "selections": [
              {
                "label": "At exact time",
                "value": "at_time",
                "message": "Maghrib at {{time}} ({{hijri_date}})"
              },
              {
                "label": "5 min before",
                "value": "5_before",
                "message": "Maghrib in {{minutes_before}} minutes! ({{time}}) - {{hijri_date}}"
              },
              {
                "label": "10 min before",
                "value": "10_before",
                "message": "Maghrib in {{minutes_before}} minutes! ({{time}}) - {{hijri_date}}"
              },
              {
                "label": "15 min before",
                "value": "15_before",
                "message": "Maghrib in {{minutes_before}} minutes! ({{time}}) - {{hijri_date}}"
              },
              {
                "label": "20 min before",
                "value": "20_before",
                "message": "Maghrib in {{minutes_before}} minutes! ({{time}}) - {{hijri_date}}"
              }
            ]
          }
        ]
      },
      {
        "title": "Isha",
        "key": "mawakit_isha",
        "acceptedVariables": [
          "prayer",
          "time",
          "hijri_date",
          "location",
          "minutes_before"
        ],
        "defaultMessage": "Isha at {{time}} ({{hijri_date}})",
        "variationConditions": [
          {
            "type": "EQUAL_SELECTION",
            "description": "When to alert",
            "selections": [
              {
                "label": "At exact time",
                "value": "at_time",
                "message": "Isha at {{time}} ({{hijri_date}})"
              },
              {
                "label": "5 min before",
                "value": "5_before",
                "message": "Isha in {{minutes_before}} minutes! ({{time}}) - {{hijri_date}}"
              },
              {
                "label": "10 min before",
                "value": "10_before",
                "message": "Isha in {{minutes_before}} minutes! ({{time}}) - {{hijri_date}}"
              },
              {
                "label": "15 min before",
                "value": "15_before",
                "message": "Isha in {{minutes_before}} minutes! ({{time}}) - {{hijri_date}}"
              },
              {
                "label": "20 min before",
                "value": "20_before",
                "message": "Isha in {{minutes_before}} minutes! ({{time}}) - {{hijri_date}}"
              }
            ]
          }
        ]
      },
      {
        "title": "Ramadan Soon",
        "key": "mawakit_ramadan_soon",
        "acceptedVariables": ["days_remaining", "hijri_date", "location"],
        "defaultMessage": "Ramadan is near: {{days_remaining}} days remaining ({{hijri_date}})"
      }
    ],
    "translations": "./translations.json"
  }
}

```

## mawakit/package.json

```
{
	"name": "lumia-mawakit",
	"version": "1.0.0",
	"private": true,
	"description": "Prayer time alerts, Hijri date variables, and Ramadan reminders.",
	"main": "main.js",
	"dependencies": {
		"@lumiastream/plugin": "^0.4.0"
	}
}

```

## mawakit/settings_tutorial.md

```
### Mawakit Setup

1. Choose `Location Mode` and set either `City + Country` or `Latitude + Longitude`.
2. Pick the `Calculation Method ID` and `Juristic Method` that match your region.
3. Adjust prayer offsets if needed.
4. Save settings and enable Mawakit. Alerts fire at each prayer and shuruq.

Notes:
- If `Location Mode` is set to System, Mawakit will use system location only when the runtime provides it.
- If your system timezone differs from the chosen location, set `Timezone Offset (minutes)` to correct scheduling.
- Ramadan alerts use the Hijri date from the prayer time API and will trigger once per day when within the configured window.

Variable functions:
- `{{mawakit_prayer_times=city|country}}` or `{{mawakit_prayer_times=lat,lon}}` (returns comma-separated `key=value` pairs)
- `{{mawakit_prayer_times=}}` uses your current Mawakit location settings
- `{{mawakit_hijri_date=city|country}}` or `{{mawakit_hijri_date=lat,lon}}`

Built-in variables:
- `{{fajr}}`, `{{sunrise}}`, `{{dhuhr}}`, `{{asr}}`, `{{maghrib}}`, `{{isha}}`
- `{{hijri_date}}`, `{{hijri_month}}`, `{{hijri_day}}`
- `{{next_prayer}}`, `{{next_prayer_time}}`
- `{{prayer_times}}`

```

## mawakit/translations.json

```
{
	"en": {
		"fajr": "Fajr time for the current location.",
		"sunrise": "Shuruq (sunrise) time for the current location.",
		"dhuhr": "Dhuhr time for the current location.",
		"asr": "Asr time for the current location.",
		"maghrib": "Maghrib time for the current location.",
		"isha": "Isha time for the current location.",
		"hijri_date": "Hijri date for the current location.",
		"hijri_month": "Hijri month name.",
		"hijri_day": "Hijri day of month.",
		"location": "Resolved location label.",
		"next_prayer": "Next prayer name.",
		"next_prayer_time": "Next prayer time.",
		"prayer_times": "Prayer times (comma-separated key=value).",
		"mawakit_prayer_times": "Prayer times (comma-separated key=value).",
		"mawakit_hijri_date": "Hijri date for the specified location."
	}
}

```

## minecraft_server/actions_tutorial.md

```
---
### Actions
This plugin runs on the poll interval and does not expose actions.
---

```

## minecraft_server/main.js

```
const { Plugin } = require("@lumiastream/plugin");
const net = require("net");
const dgram = require("dgram");

/**
 * Minecraft Server Status Plugin
 *
 * Monitors Minecraft Java Edition servers using:
 * - Server List Ping (TCP) - Always available
 * - Query Protocol (UDP) - Requires enable-query=true
 *
 * Based on protocols documented at:
 * - https://wiki.vg/Server_List_Ping
 * - https://wiki.vg/Query
 */

const ALERT_TYPES = {
	SERVER_ONLINE: "serverOnline",
	SERVER_OFFLINE: "serverOffline",
	PLAYER_JOINED: "playerJoined",
	PLAYER_LEFT: "playerLeft",
	PLAYER_MILESTONE: "playerMilestone",
	SERVER_FULL: "serverFull",
};

class MinecraftServerPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);

		// Polling state
		this.pollInterval = null;
		this.lastState = null;
		this.hasBaseline = false;

		// Player tracking
		this.previousPlayers = new Set();
		this.milestonesReached = new Set();
	}

	async onload() {
		if (this.settings?.serverHost) {
			await this.startPolling();
		} else if (!this.settings?.serverHost) {
			await this.lumia.log(
				"[Minecraft Server] Server address not configured. Please configure in settings.",
			);
		}
	}

	async onunload() {
		await this.stopPolling();
	}

	async onsettingsupdate(settings, previousSettings) {
		const hostChanged = settings?.serverHost !== previousSettings?.serverHost;
		const portChanged = settings?.serverPort !== previousSettings?.serverPort;

		if (hostChanged || portChanged) {
			await this.stopPolling();

			if (settings?.serverHost) {
				await this.startPolling();
			}
		}
	}

	async validateAuth(data = {}) {
		const host = String(
			data?.serverHost ?? this.settings?.serverHost ?? "",
		).trim();
		const parsePort = (value, fallback) => {
			const port = Number(value);
			return Number.isInteger(port) && port > 0 && port <= 65535
				? port
				: fallback;
		};
		const port = parsePort(
			data?.serverPort ?? this.settings?.serverPort,
			25565,
		);
		const queryPort = parsePort(
			data?.queryPort ?? this.settings?.queryPort,
			port,
		);
		const useQuery = Boolean(
			data?.useQuery ?? this.settings?.useQuery ?? false,
		);

		if (!host) {
			return { ok: false, message: "Server address is required." };
		}

		try {
			await this.serverListPing(host, port);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			await this.lumia.log(
				`[Minecraft Server] Auth validation failed: ${message}`,
			);
			return {
				ok: false,
				message: `Unable to reach ${host}:${port}. ${message}`,
			};
		}

		if (!useQuery) {
			return {
				ok: true,
				message:
					"Connected. Query is disabled, so player list/username alerts will be generic. Enable enable-query=true for full tracking.",
			};
		}

		try {
			await this.queryServer(host, queryPort);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			await this.lumia.log(
				`[Minecraft Server] Query validation failed: ${message}`,
			);
			return {
				ok: true,
				message:
					"Connected, but Query is not reachable. Player list/username alerts will be generic. Ensure enable-query=true and UDP query.port is open.",
			};
		}

		return { ok: true, message: "Connection verified. Query is enabled." };
	}

	// ============================================================================
	// Polling Management
	// ============================================================================

	async startPolling() {
		if (this.pollInterval) {
			return;
		}

		const interval = this.getPollInterval();

		// Initial poll
		await this.pollServer();

		// Start interval
		this.pollInterval = setInterval(() => {
			void this.pollServer();
		}, interval * 1000);
	}

	async stopPolling() {
		if (this.pollInterval) {
			clearInterval(this.pollInterval);
			this.pollInterval = null;
		}
	}

	async pollServer() {
		try {
			const host = this.getServerHost();
			const port = this.getServerPort();

			if (!host) {
				return;
			}

			// Always try Server List Ping first
			const pingData = await this.serverListPing(host, port);

			// If Query is enabled, try to get additional data
			let queryData = null;
			if (this.settings?.useQuery) {
				try {
					const queryPort = this.getQueryPort();
					queryData = await this.queryServer(host, queryPort);
				} catch (error) {
					const message =
						error instanceof Error ? error.message : String(error);
					await this.lumia.log(
						`[Minecraft Server] Query failed: ${message}`,
					);
				}
			}

			// Process the combined data
			await this.processServerData(pingData, queryData);
		} catch (error) {
			// Server is offline
			await this.processServerData(null, null);
		}
	}

	// ============================================================================
	// Server List Ping Protocol (TCP)
	// ============================================================================

	async serverListPing(host, port) {
		return new Promise((resolve, reject) => {
			const timeout = this.getTimeout();
			const client = new net.Socket();
			let timeoutHandle;

			const cleanup = () => {
				clearTimeout(timeoutHandle);
				client.destroy();
			};

			timeoutHandle = setTimeout(() => {
				cleanup();
				reject(new Error("Connection timeout"));
			}, timeout * 1000);

			client.connect(port, host, () => {
				// Send handshake packet
				const handshake = this.createHandshakePacket(host, port);
				client.write(handshake);

				// Send status request packet
				const statusRequest = this.createStatusRequestPacket();
				client.write(statusRequest);
			});

			let buffer = Buffer.alloc(0);

			client.on("data", (data) => {
				buffer = Buffer.concat([buffer, data]);

				try {
					// Read packet length
					const lengthResult = this.readVarInt(buffer, 0);
					const packetLength = lengthResult.value;
					const dataStart = lengthResult.length;

					// Check if we have the full packet
					if (buffer.length < dataStart + packetLength) {
						return; // Wait for more data
					}

					// Read packet ID
					const idResult = this.readVarInt(buffer, dataStart);
					const packetId = idResult.value;

					if (packetId !== 0x00) {
						cleanup();
						reject(new Error(`Unexpected packet ID: ${packetId}`));
						return;
					}

					// Read JSON length
					const jsonLengthResult = this.readVarInt(
						buffer,
						dataStart + idResult.length,
					);
					const jsonLength = jsonLengthResult.value;
					const jsonStart =
						dataStart + idResult.length + jsonLengthResult.length;

					// Extract JSON string
					const jsonString = buffer
						.subarray(jsonStart, jsonStart + jsonLength)
						.toString("utf8");

					cleanup();
					resolve(JSON.parse(jsonString));
				} catch (error) {
					cleanup();
					reject(error);
				}
			});

			client.on("error", (error) => {
				cleanup();
				reject(error);
			});
		});
	}

	createHandshakePacket(host, port) {
		const protocolVersion = this.writeVarInt(47); // Protocol version 47 (1.8+)
		const hostLength = this.writeVarInt(host.length);
		const hostBuffer = Buffer.from(host, "utf8");
		const portBuffer = Buffer.allocUnsafe(2);
		portBuffer.writeUInt16BE(port, 0);
		const nextState = this.writeVarInt(1); // 1 = status

		const data = Buffer.concat([
			this.writeVarInt(0x00), // Packet ID
			protocolVersion,
			hostLength,
			hostBuffer,
			portBuffer,
			nextState,
		]);

		const length = this.writeVarInt(data.length);
		return Buffer.concat([length, data]);
	}

	createStatusRequestPacket() {
		const packetId = this.writeVarInt(0x00);
		const length = this.writeVarInt(packetId.length);
		return Buffer.concat([length, packetId]);
	}

	// ============================================================================
	// Query Protocol (UDP)
	// ============================================================================

	async queryServer(host, port) {
		return new Promise((resolve, reject) => {
			const timeout = this.getTimeout();
			const client = dgram.createSocket("udp4");
			let timeoutHandle;
			let sessionId;

			const cleanup = () => {
				clearTimeout(timeoutHandle);
				client.close();
			};

			timeoutHandle = setTimeout(() => {
				cleanup();
				reject(new Error("Query timeout"));
			}, timeout * 1000);

			// Step 1: Send handshake
			// Session ID must be masked with 0x0F0F0F0F per Minecraft Query Protocol
			sessionId = Math.floor(Math.random() * 0x0f0f0f0f) & 0x0f0f0f0f;
			const handshake = this.createQueryHandshake(sessionId);

			client.send(handshake, port, host, (error) => {
				if (error) {
					cleanup();
					reject(error);
				}
			});

			let challengeToken = null;

			client.on("message", async (msg) => {
				try {
					if (challengeToken === null) {
						// Parse handshake response (some servers include 0xFEFD prefix)
						let offset = 0;
						if (msg.length >= 2 && msg.readUInt16BE(0) === 0xfefd) {
							offset = 2;
						}

						const type = msg.readUInt8(offset);
						if (type !== 0x09) {
							throw new Error("Invalid handshake response");
						}

						const responseSessionId = msg.readInt32BE(offset + 1);
						sessionId = responseSessionId;

						// Extract challenge token
						const tokenStart = offset + 5;
						const tokenEnd = msg.indexOf(0, tokenStart);
						const tokenSliceEnd = tokenEnd === -1 ? msg.length : tokenEnd;
						const tokenString = msg
							.subarray(tokenStart, tokenSliceEnd)
							.toString("utf8")
							.trim();
						challengeToken = parseInt(tokenString, 10);
						if (Number.isNaN(challengeToken)) {
							throw new Error(
								`Invalid challenge token response: "${tokenString}"`,
							);
						}

						// Step 2: Send full stat request
						const statRequest = this.createQueryStatRequest(
							sessionId,
							challengeToken,
						);
						client.send(statRequest, port, host);
					} else {
						// Parse stat response
						const data = this.parseQueryResponse(msg);
						cleanup();
						resolve(data);
					}
				} catch (error) {
					cleanup();
					reject(error);
				}
			});

			client.on("error", (error) => {
				cleanup();
				reject(error);
			});
		});
	}

	createQueryHandshake(sessionId) {
		const buffer = Buffer.allocUnsafe(7);
		buffer.writeUInt16BE(0xfefd, 0); // Magic
		buffer.writeUInt8(0x09, 2); // Type: handshake
		buffer.writeInt32BE(sessionId, 3);
		return buffer;
	}

	createQueryStatRequest(sessionId, challengeToken) {
		const buffer = Buffer.allocUnsafe(15);
		buffer.writeUInt16BE(0xfefd, 0); // Magic
		buffer.writeUInt8(0x00, 2); // Type: stat
		buffer.writeInt32BE(sessionId, 3);
		buffer.writeInt32BE(challengeToken, 7);
		buffer.writeInt32BE(0x00000000, 11); // Padding for full stat
		return buffer;
	}

	parseQueryResponse(msg) {
		let offset = 0;
		if (msg.length >= 2 && msg.readUInt16BE(0) === 0xfefd) {
			offset = 2;
		}

		const type = msg.readUInt8(offset);
		if (type !== 0x00) {
			throw new Error("Invalid stat response");
		}

		// Skip header
		offset += 5;

		// Skip padding
		offset += 11;

		// Parse key-value pairs
		const data = {};
		while (offset < msg.length) {
			// Read key
			let keyEnd = msg.indexOf(0, offset);
			if (keyEnd === -1) break;
			const key = msg.subarray(offset, keyEnd).toString("utf8");
			offset = keyEnd + 1;

			// Read value
			let valueEnd = msg.indexOf(0, offset);
			if (valueEnd === -1) break;
			const value = msg.subarray(offset, valueEnd).toString("utf8");
			offset = valueEnd + 1;

			if (key.length === 0) {
				// End of key-value section
				break;
			}

			data[key] = value;
		}

		// Skip player list padding: \x01player_\x00\x00 (10 bytes)
		// Find the start of player names by looking for "player_\x00\x00"
		const playerMarker = Buffer.from([
			0x01, 0x70, 0x6c, 0x61, 0x79, 0x65, 0x72, 0x5f, 0x00, 0x00,
		]);
		const markerIndex = msg.indexOf(playerMarker, offset);
		if (markerIndex !== -1) {
			offset = markerIndex + playerMarker.length;
		}

		// Parse player list
		data.players = [];
		while (offset < msg.length) {
			let playerEnd = msg.indexOf(0, offset);
			if (playerEnd === -1) break;
			const player = msg.subarray(offset, playerEnd).toString("utf8");
			offset = playerEnd + 1;

			if (player.length > 0) {
				data.players.push(player);
			}
		}

		return data;
	}

	// ============================================================================
	// Data Processing
	// ============================================================================

	async processServerData(pingData, queryData) {
		const newState = {
			online: !!pingData,
			playersOnline: pingData ? pingData.players.online : 0,
			playersMax: pingData ? pingData.players.max : 0,
			version: pingData ? pingData.version.name : "",
			protocolVersion: pingData ? pingData.version.protocol : 0,
			motd: pingData ? this.cleanMOTD(pingData.description) : "",
			playerList: queryData?.players || [],
			map: queryData?.map || "",
			gameType: queryData?.gametype || "",
		};

		// Update variables
		await this.updateVariables(newState);

		if (!this.hasBaseline) {
			// First poll - establish baseline
			this.hasBaseline = true;
			this.lastState = newState;
			if (newState.online) {
				this.previousPlayers = new Set(newState.playerList);
			}
			return;
		}

		// Check for state changes
		await this.checkServerOnlineOffline(newState, this.lastState);

		if (newState.online) {
			await this.checkPlayerChanges(newState, this.lastState);
			await this.checkPlayerMilestones(newState);
			await this.checkServerFull(newState);
		}

		this.lastState = newState;
	}

	async updateVariables(state) {
		const updates = [
			this.lumia.setVariable("online", state.online),
			this.lumia.setVariable("players_online", state.playersOnline),
			this.lumia.setVariable("players_max", state.playersMax),
			this.lumia.setVariable("version", state.version),
			this.lumia.setVariable("motd", state.motd),
			this.lumia.setVariable("protocol_version", state.protocolVersion),
			this.lumia.setVariable("player_list", state.playerList.join(", ")),
			this.lumia.setVariable("map", state.map),
			this.lumia.setVariable("game_type", state.gameType),
		];

		await Promise.all(updates);
	}

	_buildAlertPayload(vars = {}) {
		return {
			dynamic: { ...vars },
			extraSettings: { ...vars },
		};
	}

	async checkServerOnlineOffline(newState, oldState) {
		if (newState.online && !oldState.online) {
			// Server came online
			const alertVars = {
				online: true,
				version: newState.version,
				motd: newState.motd,
				players_max: newState.playersMax,
			};
			await this.lumia.triggerAlert({
				alert: ALERT_TYPES.SERVER_ONLINE,
				...this._buildAlertPayload(alertVars),
			});
		} else if (!newState.online && oldState.online) {
			// Server went offline
			await this.lumia.triggerAlert({
				alert: ALERT_TYPES.SERVER_OFFLINE,
				...this._buildAlertPayload({}),
			});

			// Clear player tracking
			this.previousPlayers.clear();
			this.milestonesReached.clear();
		}
	}

	async checkPlayerChanges(newState, oldState) {
		const newPlayers = new Set(newState.playerList);
		const oldPlayers = this.previousPlayers;

		const hasPlayerList =
			(Array.isArray(newState.playerList) && newState.playerList.length > 0) ||
			(Array.isArray(oldState.playerList) && oldState.playerList.length > 0);

		if (!hasPlayerList) {
			const delta = newState.playersOnline - oldState.playersOnline;
			if (delta > 0) {
				for (let i = 0; i < delta; i += 1) {
					const label = "Player";
					await this.lumia.setVariable("last_player_joined", label);
					const alertVars = {
						username: label,
						last_player_joined: label,
						players_online: newState.playersOnline,
						players_max: newState.playersMax,
					};
					await this.lumia.triggerAlert({
						alert: ALERT_TYPES.PLAYER_JOINED,
						...this._buildAlertPayload(alertVars),
					});
				}
			} else if (delta < 0) {
				for (let i = 0; i < Math.abs(delta); i += 1) {
					const label = "Player";
					await this.lumia.setVariable("last_player_left", label);
					const alertVars = {
						username: label,
						last_player_left: label,
						players_online: newState.playersOnline,
						players_max: newState.playersMax,
					};
					await this.lumia.triggerAlert({
						alert: ALERT_TYPES.PLAYER_LEFT,
						...this._buildAlertPayload(alertVars),
					});
				}
			}

			this.previousPlayers = newPlayers;
			return;
		}
		// Check for joins
		for (const player of newPlayers) {
			if (!oldPlayers.has(player)) {
				await this.lumia.setVariable("last_player_joined", player);
				const alertVars = {
					username: player,
					last_player_joined: player,
					players_online: newState.playersOnline,
					players_max: newState.playersMax,
				};
				await this.lumia.triggerAlert({
					alert: ALERT_TYPES.PLAYER_JOINED,
					...this._buildAlertPayload(alertVars),
				});
			}
		}

		// Check for leaves
		for (const player of oldPlayers) {
			if (!newPlayers.has(player)) {
				await this.lumia.setVariable("last_player_left", player);
				const alertVars = {
					username: player,
					last_player_left: player,
					players_online: newState.playersOnline,
					players_max: newState.playersMax,
				};
				await this.lumia.triggerAlert({
					alert: ALERT_TYPES.PLAYER_LEFT,
					...this._buildAlertPayload(alertVars),
				});
			}
		}

		this.previousPlayers = newPlayers;
	}

	async checkPlayerMilestones(newState) {
		const count = newState.playersOnline;
		const milestones = [5, 10, 25, 50, 100, 200];

		for (const milestone of milestones) {
			if (count >= milestone && !this.milestonesReached.has(milestone)) {
				this.milestonesReached.add(milestone);
				const alertVars = {
					players_online: count,
					players_max: newState.playersMax,
				};
				await this.lumia.triggerAlert({
					alert: ALERT_TYPES.PLAYER_MILESTONE,
					dynamic: { value: count, ...alertVars },
					extraSettings: { ...alertVars },
				});
			}
		}

		// Reset milestones if player count drops below them
		for (const milestone of this.milestonesReached) {
			if (count < milestone) {
				this.milestonesReached.delete(milestone);
			}
		}
	}

	async checkServerFull(newState) {
		if (
			newState.playersOnline >= newState.playersMax &&
			newState.playersMax > 0
		) {
			if (
				!this.lastState ||
				this.lastState.playersOnline < this.lastState.playersMax
			) {
				const alertVars = {
					players_online: newState.playersOnline,
					players_max: newState.playersMax,
				};
				await this.lumia.triggerAlert({
					alert: ALERT_TYPES.SERVER_FULL,
					...this._buildAlertPayload(alertVars),
				});
			}
		}
	}

	// ============================================================================
	// Helper Methods
	// ============================================================================
	getServerHost() {
		const host = (this.settings?.serverHost ?? "").trim();
		return host.length > 0 ? host : null;
	}

	getServerPort() {
		const port = Number(this.settings?.serverPort);
		return Number.isInteger(port) && port > 0 && port <= 65535 ? port : 25565;
	}

	getQueryPort() {
		const port = Number(this.settings?.queryPort);
		return Number.isInteger(port) && port > 0 && port <= 65535
			? port
			: this.getServerPort();
	}

	getPollInterval() {
		const interval = Number(this.settings?.pollInterval);
		return Number.isInteger(interval) && interval >= 10 && interval <= 300
			? interval
			: 30;
	}

	getTimeout() {
		return 5;
	}

	cleanMOTD(description) {
		if (typeof description === "string") {
			return description.replace(/§./g, ""); // Remove color codes
		}
		if (typeof description === "object" && description.text) {
			return description.text.replace(/§./g, "");
		}
		if (typeof description === "object" && description.extra) {
			return description.extra
				.map((part) => (typeof part === "string" ? part : part.text || ""))
				.join("")
				.replace(/§./g, "");
		}
		return String(description).replace(/§./g, "");
	}

	// VarInt encoding/decoding for Minecraft protocol
	writeVarInt(value) {
		const buffer = [];
		do {
			let byte = value & 0x7f;
			value >>>= 7;
			if (value !== 0) {
				byte |= 0x80;
			}
			buffer.push(byte);
		} while (value !== 0);
		return Buffer.from(buffer);
	}

	readVarInt(buffer, offset) {
		let value = 0;
		let length = 0;
		let currentByte;

		do {
			if (offset + length >= buffer.length) {
				throw new Error("VarInt extends beyond buffer");
			}
			currentByte = buffer[offset + length];
			value |= (currentByte & 0x7f) << (length * 7);
			length++;
			if (length > 5) {
				throw new Error("VarInt is too big");
			}
		} while ((currentByte & 0x80) !== 0);

		return { value, length };
	}
}

module.exports = MinecraftServerPlugin;

```

## minecraft_server/manifest.json

```
{
	"id": "minecraft_server",
	"name": "Minecraft Server",
	"version": "1.0.2",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://lumiastream.com",
	"repository": "https://github.com/LumiaStream/minecraft-server-plugin",
	"description": "Monitor Minecraft Java servers for status and player changes with alerts and variables.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "games",
	"keywords": "minecraft, server, java edition, status, players, games",
	"icon": "minecraft.png",
	"config": {
		"settings": [
			{
				"key": "serverHost",
				"label": "Server Address",
				"type": "text",
				"placeholder": "play.hypixel.net or 192.168.1.100",
				"helperText": "Minecraft server hostname or IP address",
				"required": true
			},
			{
				"key": "serverPort",
				"label": "Server Port",
				"type": "number",
				"defaultValue": 25565,
				"helperText": "Default Minecraft port is 25565",
				"validation": {
					"min": 1,
					"max": 65535
				}
			},
			{
				"key": "useQuery",
				"label": "Enable Query Protocol (Required for player tracking)",
				"type": "checkbox",
				"defaultValue": true,
				"helperText": "Required for player list, join/leave alerts, map, and game type. Set enable-query=true in server.properties."
			},
			{
				"key": "queryPort",
				"label": "Query Port",
				"type": "number",
				"defaultValue": 25565,
				"helperText": "Must match query.port in server.properties (usually the same as server port)",
				"validation": {
					"min": 1,
					"max": 65535
				}
			},
			{
				"key": "pollInterval",
				"label": "Poll Interval (seconds)",
				"type": "number",
				"defaultValue": 10,
				"helperText": "How often to check server status (10-300 seconds)",
				"validation": {
					"min": 10,
					"max": 300
				}
			}
		],
		"settings_tutorial": "./settings_tutorial.md",
		"actions_tutorial": "./actions_tutorial.md",
		"actions": [],
		"variables": [
			{
				"name": "online",
				"description": "Whether the server is online",
				"value": false
			},
			{
				"name": "players_online",
				"description": "Number of players currently online",
				"value": 0
			},
			{
				"name": "players_max",
				"description": "Maximum number of players allowed",
				"value": 0
			},
			{
				"name": "version",
				"description": "Server version (e.g., 1.21.5)",
				"value": ""
			},
			{
				"name": "motd",
				"description": "Server Message of the Day",
				"value": ""
			},
			{
				"name": "protocol_version",
				"description": "Protocol version number",
				"value": 0
			},
			{
				"name": "player_list",
				"description": "Comma-separated list of player names (Query only)",
				"value": ""
			},
			{
				"name": "map",
				"description": "Current world/map name (Query only)",
				"value": ""
			},
			{
				"name": "game_type",
				"description": "Game type (Survival, Creative, etc.) (Query only)",
				"value": ""
			},
			{
				"name": "last_player_joined",
				"description": "Username of last player who joined",
				"value": ""
			},
			{
				"name": "last_player_left",
				"description": "Username of last player who left",
				"value": ""
			}
		],
		"alerts": [
			{
				"title": "Server Online",
				"key": "serverOnline",
				"acceptedVariables": [
					"online",
					"version",
					"motd",
					"players_max"
				],
				"defaultMessage": "Minecraft server is now online!",
				"variationConditions": [
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			},
			{
				"title": "Server Offline",
				"key": "serverOffline",
				"acceptedVariables": [],
				"defaultMessage": "Minecraft server went offline",
				"variationConditions": [
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			},
			{
				"title": "Player Joined",
				"key": "playerJoined",
				"acceptedVariables": [
					"username",
					"last_player_joined",
					"players_online",
					"players_max"
				],
				"defaultMessage": "{{last_player_joined}} joined the server! ({{players_online}}/{{players_max}})",
				"variationConditions": [
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			},
			{
				"title": "Player Left",
				"key": "playerLeft",
				"acceptedVariables": [
					"username",
					"last_player_left",
					"players_online",
					"players_max"
				],
				"defaultMessage": "{{last_player_left}} left the server ({{players_online}}/{{players_max}})",
				"variationConditions": [
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

## minecraft_server/package.json

```
{
	"name": "lumia-minecraft-server",
	"version": "1.0.0",
	"private": true,
	"description": "Monitor Minecraft Java Edition servers using Server List Ping and Query protocols.",
	"main": "main.js",
	"scripts": {},
	"dependencies": {
		"@lumiastream/plugin": "^0.4.1"
	}
}

```

## minecraft_server/settings_tutorial.md

```
---
### 🎮 Setup Your Minecraft Server Monitoring
1) Enter your server address (hostname or IP)
2) Enter server port (default: 25565)
3) **Enable Query protocol (required for player tracking)**
   - Set `enable-query=true` in server.properties
   - Ensure `query.port` matches the Query Port setting
   - Enables player list, join/leave alerts, map, and game type
4) Set poll interval (how often to check)
5) Click **Save** to start monitoring
### 📊 What Gets Tracked
- Server online/offline status
- Current player count
- Maximum players
- Server version
- MOTD (Message of the Day)
- Player list (Query required)
---

```

## minecraft_server/translations.json

```
{
	"en": {
		"online": "Whether the server is online",
		"players_online": "Number of players currently online",
		"players_max": "Maximum number of players allowed",
		"version": "Server version (e.g., 1.21.5)",
		"motd": "Server Message of the Day",
		"protocol_version": "Protocol version number",
		"player_list": "Comma-separated list of player names (Query only)",
		"map": "Current world/map name (Query only)",
		"game_type": "Game type (Survival, Creative, etc.) (Query only)",
		"last_player_joined": "Username of last player who joined",
		"last_player_left": "Username of last player who left",
		"username": "Username"
	}
}

```

## ntfy/actions_tutorial.md

```
---
### Actions
This plugin runs automatically and does not expose actions.
---

```

## ntfy/main.js

```
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

```

## ntfy/manifest.json

```
{
	"id": "ntfy",
	"name": "ntfy",
	"version": "1.0.3",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://lumiastream.com",
	"description": "Subscribe to ntfy topics and trigger Lumia alerts/variables for incoming notifications.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "apps",
	"keywords": "ntfy, notifications, subscribe, websocket, alerts",
	"icon": "ntfy.png",
	"config": {
		"settings": [
			{
				"key": "baseUrl",
				"label": "Server Base URL",
				"type": "url",
				"defaultValue": "https://ntfy.sh",
				"placeholder": "https://ntfy.sh",
				"helperText": "Base URL for your ntfy server (hosted or self-hosted).",
				"required": true
			},
			{
				"key": "topics",
				"label": "Topics",
				"type": "text",
				"placeholder": "alerts,stream,home",
				"helperText": "Comma-separated list of ntfy topics to subscribe to.",
				"required": true
			},
			{
				"key": "authType",
				"label": "Authentication Type",
				"type": "select",
				"defaultValue": "none",
				"options": [
					{
						"label": "None",
						"value": "none"
					},
					{
						"label": "Access Token",
						"value": "token"
					},
					{
						"label": "Username + Password",
						"value": "basic"
					}
				],
				"helperText": "Use an access token (recommended) or username/password if your server requires auth."
			},
			{
				"key": "accessToken",
				"label": "Access Token",
				"type": "password",
				"placeholder": "ntfy access token",
				"helperText": "Paste a personal access token if auth type is Access Token."
			},
			{
				"key": "username",
				"label": "Username",
				"type": "text",
				"placeholder": "ntfy username",
				"helperText": "Used when Authentication Type is Username + Password."
			},
			{
				"key": "password",
				"label": "Password",
				"type": "password",
				"placeholder": "ntfy password",
				"helperText": "Used when Authentication Type is Username + Password."
			},
			{
				"key": "minPriority",
				"label": "Minimum Priority",
				"type": "number",
				"defaultValue": 1,
				"min": 1,
				"max": 5,
				"helperText": "Ignore messages below this priority (1-5)."
			},
			{
				"key": "tagFilter",
				"label": "Required Tags",
				"type": "text",
				"placeholder": "alert,lumia",
				"helperText": "Optional comma-separated tags that must be present on a message."
			},
			{
				"key": "messageRegex",
				"label": "Message Regex",
				"type": "text",
				"placeholder": "error|warning",
				"helperText": "Optional regex filter applied to title + message (case-insensitive)."
			}
		],
		"settings_tutorial": "./settings_tutorial.md",
		"variables": [],
		"alerts": [
			{
				"title": "Notification",
				"key": "notification",
				"acceptedVariables": [
					"title",
					"message",
					"topic",
					"priority",
					"tags",
					"id",
					"time",
					"click",
					"icon",
					"attachment_url",
					"event"
				],
				"defaultMessage": "Notification: {{title}} {{message}}"
			}
		],
		"actions": [],
		"actions_tutorial": "./actions_tutorial.md",
		"translations": "./translations.json"
	}
}

```

## ntfy/package.json

```
{
	"name": "lumia-ntfy",
	"version": "1.0.0",
	"private": true,
	"description": "Lumia Stream plugin that subscribes to ntfy topics and triggers alerts on incoming messages.",
	"main": "main.js",
	"scripts": {},
	"dependencies": {
		"@lumiastream/plugin": "^0.4.1"
	}
}

```

## ntfy/settings_tutorial.md

```
---
1) Enter your ntfy server base URL (hosted or self-hosted).
2) Add one or more topics (comma-separated).
3) If your server requires auth, choose **Access Token** (recommended) or **Username + Password**.

### Notes
- Access tokens and Basic auth are supported for subscriptions.
- Topics are case-sensitive and should match your ntfy publisher topics.
---

```

## ntfy/translations.json

```
{
	"en": {
		"title": "Title",
		"message": "Message",
		"topic": "Topic",
		"priority": "Priority",
		"tags": "Tags",
		"id": "Id",
		"time": "Time",
		"click": "Click",
		"icon": "Icon",
		"attachment_url": "Attachment Url",
		"event": "Event"
	}
}

```

## ollama/main.js

```
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
		this._modelCache = { list: [], fetchedAt: 0, baseUrl: "" };
		this._modelFetchPromise = null;
		this._modelFetchBaseUrl = "";
		this._lastErrorToast = { message: "", at: 0 };
	}

	async onload() {
		await this._updateConnectionState(false);
		void this._refreshModelCache();
		void this.refreshSettingsOptions({ fieldKey: "defaultModel" });
	}

	async onsettingsupdate(settings, previous = {}) {
		const baseChanged = this._baseUrl(settings) !== this._baseUrl(previous);
		const modelChanged =
			this._defaultModel(settings) !== this._defaultModel(previous);
		if (baseChanged || modelChanged) {
			await this._validateConnection({ silent: true });
			void this._refreshModelCache({ force: true, silent: true });
			void this.refreshSettingsOptions({ fieldKey: "defaultModel" });
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
		const models = await this._refreshModelCache({
			force: Boolean(refresh),
			silent: true,
			settings,
			persistDefaultModel: false,
		});
		return models.map((model) => ({ value: model, name: model }));
	}

	async refreshSettingsOptions({ fieldKey, values, settings } = {}) {
		if (fieldKey && fieldKey !== "defaultModel" && fieldKey !== "baseUrl") {
			return;
		}

		if (typeof this.lumia?.updateSettingsFieldOptions !== "function") {
			return;
		}

		const previewSettings = {
			...(this.settings && typeof this.settings === "object"
				? this.settings
				: {}),
			...(settings && typeof settings === "object" ? settings : {}),
			...(values && typeof values === "object" ? values : {}),
		};
		const models = await this.aiModels({
			refresh: true,
			settings: previewSettings,
		});
		const selectedModel = this._trim(
			values?.defaultModel ??
				settings?.defaultModel ??
				this._defaultModel(previewSettings),
		);
		const modelValues = Array.from(
			new Set(
				[
					selectedModel,
					...models.map((model) => this._trim(model?.value)),
				].filter(Boolean),
			),
		);
		const options = [
			{ label: "Auto (first available)", value: "" },
			...modelValues.map((value) => ({
				label: value,
				value,
			})),
		];

		await this.lumia.updateSettingsFieldOptions({
			fieldKey: "defaultModel",
			options,
		});
	}

	async variableFunction({ key, value, raw, allVariables } = {}) {
		if (!key) return "";

		const input =
			typeof value === "string" ? value : typeof raw === "string" ? raw : "";
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
		const maxTokens = this._number(data?.max_tokens, this._defaultMaxTokens());
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
			const userMessage = this._userErrorMessage(error, "Ollama");
			await this._updateConnectionState(false);
			await this._reportApiError({
				userMessage,
				rawMessage: messageText,
			});
			if (format === "json") {
				return this._jsonErrorResponse(userMessage);
			}
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
		if (!responseText && typeof this.lumia?.log === "function") {
			await this.lumia.log("[Ollama] Chat request returned an empty response.");
		}

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
		const parsed = this._parseJsonCandidate(text);
		if (parsed !== null) {
			return JSON.stringify(parsed);
		}
		const trimmed = this._trim(text);
		if (!trimmed) {
			return "{}";
		}
		return JSON.stringify({
			error: "Invalid JSON response from Ollama.",
			raw: this._truncateText(trimmed, 300),
		});
	}

	_jsonErrorResponse(message) {
		return JSON.stringify({
			error: this._trim(message) || "Ollama request failed.",
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
			} catch (error) {}
		}

		return null;
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
		silent = false,
		settings = this.settings,
		persistDefaultModel = true,
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

		if (this._modelFetchPromise && this._modelFetchBaseUrl === baseUrl) {
			try {
				return await this._modelFetchPromise;
			} catch (error) {
				return this._modelCache.baseUrl === baseUrl
					? this._modelCache.list
					: [];
			}
		}

		this._modelFetchBaseUrl = baseUrl;
		this._modelFetchPromise = (async () => {
			const response = await this._fetchJson(
				this._url("/api/tags", settings),
				{
					method: "GET",
				},
				settings,
			);
			const models = Array.isArray(response?.models)
				? response.models
						.map((model) => this._trim(model?.name))
						.filter(Boolean)
				: [];
			this._modelCache = { list: models, fetchedAt: now, baseUrl };
			if (
				persistDefaultModel &&
				!this._defaultModel(settings) &&
				models.length > 0
			) {
				this.updateSettings({ defaultModel: models[0] });
			}
			return models;
		})().finally(() => {
			if (this._modelFetchBaseUrl === baseUrl) {
				this._modelFetchPromise = null;
				this._modelFetchBaseUrl = "";
			}
		});

		try {
			return await this._modelFetchPromise;
		} catch (error) {
			if (!silent) {
				await this._updateConnectionState(false);
			}
			return this._modelCache.baseUrl === baseUrl ? this._modelCache.list : [];
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
		return `${provider} request failed. ${this._truncateText(message, 180) || "Please check plugin settings and try again."}`;
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
			if (fromNested) return this._truncateText(fromNested, 220);
		}
		return this._truncateText(text, 220);
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
		const retryMatch = text.match(
			/retry (?:after|in)\s+([0-9]+(?:\.[0-9]+)?s?)/i,
		);
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

	_truncateText(text, max = 240) {
		const value = String(text ?? "")
			.replace(/\s+/g, " ")
			.trim();
		if (!value) return "";
		if (value.length <= max) return value;
		return `${value.slice(0, max)}...`;
	}

	async _reportApiError({ userMessage, rawMessage } = {}) {
		const compactUser = this._truncateText(userMessage, 220);
		const compactRaw = this._truncateText(rawMessage, 260);

		if (typeof this.lumia?.log === "function") {
			try {
				const message = compactRaw
					? `[Ollama] ${compactUser} | ${compactRaw}`
					: `[Ollama] ${compactUser}`;
				await this.lumia.log({ message, level: "error" });
			} catch (error) {
				try {
					await this.lumia.log(`[Ollama] ${compactUser}`);
				} catch (innerError) {}
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
				} catch (error) {}
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
		const response =
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
				await this.lumia.log(
					`[Ollama] Failed to update connection: ${message}`,
				);
			}
		}
	}
}

module.exports = OllamaPlugin;

```

## ollama/manifest.json

```
{
	"id": "ollama",
	"name": "Ollama",
	"version": "1.0.2",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://lumiastream.com",
	"description": "Send prompts to a local Ollama server and use responses in Lumia templates via {{ollama_prompt}} and related helpers.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "apps",
	"keywords": "ollama, ai, chat, llm, local",
	"icon": "ollama.png",
	"config": {
		"hasAI": true,
		"settings_tutorial": "./settings_tutorial.md",
		"translations": "./translations.json",
		"settings": [
			{
				"key": "baseUrl",
				"label": "Base URL",
				"type": "text",
				"defaultValue": "http://localhost:11434",
				"required": true,
				"helperText": "Your Ollama server URL.",
				"refreshOnChange": true,
				"section": "Connection",
				"sectionOrder": 1,
				"group": "connection"
			},
			{
				"key": "defaultModel",
				"label": "Default Model",
				"type": "select",
				"allowTyping": true,
				"dynamicOptions": true,
				"refreshOnChange": true,
				"placeholder": "gpt-oss:20b",
				"options": [
					{
						"label": "Auto (first available)",
						"value": ""
					}
				],
				"required": false,
				"helperText": "Loaded from Ollama /api/tags. Leave blank for auto-detect or type a custom model.",
				"section": "Connection",
				"sectionOrder": 1,
				"group": "connection"
			},
			{
				"key": "defaultSystemMessage",
				"label": "Default System Message",
				"type": "textarea",
				"rows": 3,
				"helperText": "Optional system message used when none is provided in the action.",
				"section": "Advanced",
				"sectionOrder": 2,
				"group": {
					"key": "advanced_tuning",
					"label": "Advanced Tuning",
					"helperText": "Optional controls for sampling, memory, and output behavior."
				}
			},
			{
				"key": "defaultTemperature",
				"label": "Default Temperature",
				"type": "number",
				"min": 0,
				"max": 2,
				"step": 0.1,
				"helperText": "Optional. Higher is more creative.",
				"section": "Advanced",
				"sectionOrder": 2,
				"group": "advanced_tuning"
			},
			{
				"key": "defaultTopP",
				"label": "Default Top P",
				"type": "number",
				"min": 0,
				"max": 1,
				"step": 0.05,
				"helperText": "Optional nucleus sampling value.",
				"section": "Advanced",
				"sectionOrder": 2,
				"group": "advanced_tuning"
			},
			{
				"key": "defaultMaxTokens",
				"label": "Default Max Tokens",
				"type": "number",
				"min": 1,
				"max": 8192,
				"helperText": "Optional. Maps to Ollama num_predict.",
				"section": "Advanced",
				"sectionOrder": 2,
				"group": "advanced_tuning"
			},
			{
				"key": "keepAlive",
				"label": "Keep Alive",
				"type": "text",
				"placeholder": "5m",
				"helperText": "How long to keep the model loaded (example: `5m`, `0`). Optional.",
				"section": "Advanced",
				"sectionOrder": 2,
				"group": "advanced_tuning"
			},
			{
				"key": "requestTimeoutMs",
				"label": "Request Timeout (ms)",
				"type": "number",
				"defaultValue": 0,
				"min": 0,
				"max": 300000,
				"helperText": "How long to wait for a response. Set to 0 to disable timeout.",
				"section": "Advanced",
				"sectionOrder": 2,
				"group": "advanced_tuning"
			},
			{
				"key": "rememberMessages",
				"label": "Remember Messages",
				"type": "toggle",
				"defaultValue": true,
				"helperText": "Store history per thread or username.",
				"section": "Advanced",
				"sectionOrder": 2,
				"group": "advanced_tuning"
			},
			{
				"key": "maxHistoryMessages",
				"label": "Max History Messages",
				"type": "number",
				"defaultValue": 12,
				"min": 0,
				"max": 100,
				"helperText": "How many recent messages to keep per thread/user.",
				"section": "Advanced",
				"sectionOrder": 2,
				"group": "advanced_tuning"
			},
			{
				"key": "maxOutputChars",
				"label": "Max Output Length (chars)",
				"type": "number",
				"defaultValue": 0,
				"min": 0,
				"max": 100000,
				"helperText": "Trim responses to this length (0 = no limit).",
				"section": "Advanced",
				"sectionOrder": 2,
				"group": "advanced_tuning"
			}
		],
		"actions": [],
		"variableFunctions": [
			{
				"key": "ollama_prompt",
				"label": "Ollama Prompt",
				"description": "Use {{ollama_prompt=message|thread|model}} to return a response from Ollama."
			},
			{
				"key": "ollama_json",
				"label": "Ollama JSON",
				"description": "Use {{ollama_json=message|thread|model}} to return JSON-only output."
			},
			{
				"key": "ollama_one_line",
				"label": "Ollama One Line",
				"description": "Use {{ollama_one_line=message|thread|model}} to return a single-line response."
			},
			{
				"key": "ollama_prompt_nostore",
				"label": "Ollama Prompt (No Store)",
				"description": "Use {{ollama_prompt_nostore=message|thread|model}} to run without history."
			},
			{
				"key": "ollama_prompt_clear",
				"label": "Ollama Clear Thread",
				"description": "Use {{ollama_prompt_clear=thread_name}} to clear a conversation thread."
			}
		],
		"variables": [],
		"alerts": []
	}
}

```

## ollama/package.json

```
{
	"name": "lumia-ollama",
	"version": "1.0.0",
	"private": true,
	"description": "Lumia Stream plugin that sends prompts to Ollama and exposes the response in variables and alerts.",
	"main": "main.js",
	"scripts": {},
	"dependencies": {
		"@lumiastream/plugin": "^0.4.1"
	}
}

```

## ollama/settings_tutorial.md

```
---
### 1) Install & Run Ollama
1) Install [Ollama](https://ollama.com).
2) Start the server: `ollama serve` (defaults to `http://localhost:11434`).
3) Pull a model you want to use, for example: `ollama pull gpt-oss:20b`.
---
### 2) Configure This Plugin
- **Base URL** should point to your Ollama server (default `http://localhost:11434`).
- **Default Model** should match a local model name from `ollama list`. If left blank, the plugin will try to auto-detect and use the first available model.
- **Max Output Length** trims long replies for overlays or chat boxes.
---
### 3) Variable Functions
**ollama_prompt**
Send prompts using a simple syntax.

Example:
`{{ollama_prompt=Make a funny quote}}`

Use user input:
`{{ollama_prompt={{message}}}}`

Keep conversation context with a thread name and optional model override:
`{{ollama_prompt={{message}}|thread_name|gpt-oss:20b}}`

Use a thread name to continue the conversation, and the last parameter to use a specific model.

**ollama_json**
Return JSON-only output:
`{{ollama_json=Summarize this clip as JSON}}`

**ollama_one_line**
Return a single-line response (newlines removed):
`{{ollama_one_line=Write a short hype line}}`

**ollama_prompt_nostore**
Run a prompt without storing or using history:
`{{ollama_prompt_nostore=Give me a quick summary}}`

**ollama_prompt_clear**
Clear a conversation thread:
`{{ollama_prompt_clear=thread_name}}`
---

```

## ollama/translations.json

```
{
	"en": {
		"connection": "Connection",
		"Connection": "Connection",
		"Advanced": "Advanced",
		"Advanced Tuning": "Advanced Tuning",
		"Base URL": "Base URL",
		"Your Ollama server URL.": "Your Ollama server URL.",
		"Default Model": "Default Model",
		"Auto (first available)": "Auto (first available)",
		"Loaded from Ollama /api/tags. Leave blank for auto-detect or type a custom model.": "Loaded from Ollama /api/tags. Leave blank for auto-detect or type a custom model.",
		"Default System Message": "Default System Message",
		"Optional system message used when none is provided in the action.": "Optional system message used when none is provided in the action.",
		"Optional controls for sampling, memory, and output behavior.": "Optional controls for sampling, memory, and output behavior.",
		"Default Temperature": "Default Temperature",
		"Optional. Higher is more creative.": "Optional. Higher is more creative.",
		"Default Top P": "Default Top P",
		"Optional nucleus sampling value.": "Optional nucleus sampling value.",
		"Default Max Tokens": "Default Max Tokens",
		"Optional. Maps to Ollama num_predict.": "Optional. Maps to Ollama num_predict.",
		"Keep Alive": "Keep Alive",
		"How long to keep the model loaded (example: `5m`, `0`). Optional.": "How long to keep the model loaded (example: `5m`, `0`). Optional.",
		"Request Timeout (ms)": "Request Timeout (ms)",
		"How long to wait for a response. Set to 0 to disable timeout.": "How long to wait for a response. Set to 0 to disable timeout.",
		"Remember Messages": "Remember Messages",
		"Store history per thread or username.": "Store history per thread or username.",
		"Max History Messages": "Max History Messages",
		"How many recent messages to keep per thread/user.": "How many recent messages to keep per thread/user.",
		"Max Output Length (chars)": "Max Output Length (chars)",
		"Trim responses to this length (0 = no limit).": "Trim responses to this length (0 = no limit).",
		"Ollama Prompt": "Ollama Prompt",
		"Use {{ollama_prompt=message|thread|model}} to return a response from Ollama.": "Use {{ollama_prompt=message|thread|model}} to return a response from Ollama.",
		"Ollama JSON": "Ollama JSON",
		"Use {{ollama_json=message|thread|model}} to return JSON-only output.": "Use {{ollama_json=message|thread|model}} to return JSON-only output.",
		"Ollama One Line": "Ollama One Line",
		"Use {{ollama_one_line=message|thread|model}} to return a single-line response.": "Use {{ollama_one_line=message|thread|model}} to return a single-line response.",
		"Ollama Prompt (No Store)": "Ollama Prompt (No Store)",
		"Use {{ollama_prompt_nostore=message|thread|model}} to run without history.": "Use {{ollama_prompt_nostore=message|thread|model}} to run without history.",
		"Ollama Clear Thread": "Ollama Clear Thread",
		"Use {{ollama_prompt_clear=thread_name}} to clear a conversation thread.": "Use {{ollama_prompt_clear=thread_name}} to clear a conversation thread."
	}
}

```

## openclaw/README.md

```
# OpenClaw Plugin (Agent Routing)

This plugin is agent-first.

## How Routing Works

- The plugin sends OpenClaw requests using an agent route in the request `model` field:
  - `openclaw:<agentId>`
- The plugin can also send `x-openclaw-agent-id` header from `Default Agent ID`.
- OpenClaw resolves the actual provider model through that agent's config.

## Agent vs Model Correlation

- In this plugin:
  - `agent` (or route) is what you pick in Lumia.
  - `model` in the API payload is the agent route (for OpenClaw routing).
- In OpenClaw config:
  - agents map to real LLM models (for example `openai/gpt-5-mini`).
  - changing an agent's model changes what that route uses.

### Example Mapping

- Lumia `Default Agent ID`: `main`
- OpenClaw agent `main` -> provider model `openai/gpt-5-mini`
- Result: prompts route to `main`, and `main` decides the real model.

## What To Change When You Want A Different LLM

- If you want a different LLM for the same route:
  - change the model behind that agent in OpenClaw config.
- If you want quick switching:
  - create multiple agents in OpenClaw (for example `main`, `research`, `fast`)
  - set `Known Agent IDs` in the plugin (comma-separated).
  - pick route per prompt: `{{openclaw_prompt=hello|thread|research}}`

## Prompt Override Syntax

- `{{openclaw_prompt=message|thread|agent}}`
- Third argument can be:
  - `main` (agent id)
  - `openclaw:main` (full route)

Both normalize to the same route for requests.

```

## openclaw/main.js

```
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
		const tokenChanged =
			this._authToken(settings) !== this._authToken(previous);
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
		const agents = Array.from(
			new Set([defaultAgent, ...fetchedAgents].filter(Boolean)),
		);
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
			...(this.settings && typeof this.settings === "object"
				? this.settings
				: {}),
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
			typeof value === "string" ? value : typeof raw === "string" ? raw : "";
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
		const maxTokens = this._number(data?.max_tokens, this._defaultMaxTokens());

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
			} catch (error) {}
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

	async _refreshModelCache({ force = false, settings = this.settings } = {}) {
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
		const retryMatch = text.match(
			/retry (?:after|in)\s+([0-9]+(?:\.[0-9]+)?s?)/i,
		);
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
		const value = String(text ?? "")
			.replace(/\s+/g, " ")
			.trim();
		if (value.length <= max) return value;
		return `${value.slice(0, max)}...`;
	}

	_formatErrorDetails(error) {
		if (!error) return "";
		const details = [];
		if (error?.status) details.push(`status=${error.status}`);
		if (error?.method) details.push(`method=${error.method}`);
		if (error?.url) details.push(`url=${error.url}`);
		if (error?.message)
			details.push(`error=${this._truncateForLog(error.message)}`);
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
		} catch (error) {}
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
				} catch (innerError) {}
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
				} catch (toastError) {}
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
		await this._logInfo(
			`Connection state changed: ${state ? "connected" : "disconnected"}`,
		);

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

```

## openclaw/manifest.json

```
{
	"id": "openclaw",
	"name": "OpenClaw",
	"version": "1.0.1",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://lumiastream.com",
	"description": "Send prompts to an OpenClaw Gateway and use responses in Lumia templates via {{openclaw_prompt}} and related helpers.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "apps",
	"keywords": "openclaw, ai, chat, llm, gateway",
	"icon": "openclaw.png",
	"config": {
		"hasAI": true,
		"settings_tutorial": "./settings_tutorial.md",
		"translations": "./translations.json",
		"settings": [
			{
				"key": "baseUrl",
				"label": "Base URL",
				"type": "text",
				"defaultValue": "http://127.0.0.1:18789",
				"required": true,
				"helperText": "Your OpenClaw Gateway URL.",
				"refreshOnChange": true,
				"section": "Connection",
				"sectionOrder": 1,
				"group": "connection"
			},
			{
				"key": "authToken",
				"label": "Gateway Token",
				"type": "password",
				"helperText": "Optional. Required when Gateway auth is enabled.",
				"refreshOnChange": true,
				"section": "Connection",
				"sectionOrder": 1,
				"group": "connection"
			},
			{
				"key": "defaultAgentId",
				"label": "Default Agent ID",
				"type": "select",
				"defaultValue": "",
				"allowTyping": true,
				"dynamicOptions": true,
				"refreshOnChange": true,
				"placeholder": "Auto",
				"options": [
					{
						"label": "Auto",
						"value": ""
					}
				],
				"required": false,
				"helperText": "Agent id used to build request route (openclaw:<agent>) and x-openclaw-agent-id.",
				"section": "Connection",
				"sectionOrder": 1,
				"group": "connection"
			},
			{
				"key": "knownAgentIds",
				"label": "Known Agent IDs",
				"type": "text",
				"defaultValue": "",
				"helperText": "Comma-separated agent IDs for the dropdown (example: main,research,fast).",
				"refreshOnChange": true,
				"section": "Connection",
				"sectionOrder": 1,
				"group": "connection"
			}
		],
		"actions": [],
		"variableFunctions": [
			{
				"key": "openclaw_prompt",
				"label": "OpenClaw Prompt",
				"description": "Use {{openclaw_prompt=message|thread|agent}} to return a response from OpenClaw."
			},
			{
				"key": "openclaw_json",
				"label": "OpenClaw JSON",
				"description": "Use {{openclaw_json=message|thread|agent}} to return JSON-only output."
			},
			{
				"key": "openclaw_one_line",
				"label": "OpenClaw One Line",
				"description": "Use {{openclaw_one_line=message|thread|agent}} to return a single-line response."
			},
			{
				"key": "openclaw_prompt_nostore",
				"label": "OpenClaw Prompt (No Store)",
				"description": "Use {{openclaw_prompt_nostore=message|thread|agent}} to run without history."
			},
			{
				"key": "openclaw_prompt_clear",
				"label": "OpenClaw Clear Thread",
				"description": "Use {{openclaw_prompt_clear=thread_name}} to clear a conversation thread."
			}
		],
		"variables": [],
		"alerts": []
	}
}

```

## openclaw/package.json

```
{
	"name": "lumia-openclaw",
	"version": "1.0.0",
	"private": true,
	"description": "Lumia Stream plugin that sends prompts to an OpenClaw Gateway and exposes the response in variables and alerts.",
	"main": "main.js",
	"scripts": {},
	"dependencies": {
		"@lumiastream/plugin": "^0.4.1"
	}
}

```

## openclaw/settings_tutorial.md

```
---
### 1) Run OpenClaw Gateway
1) Follow the OpenClaw docs: [docs.openclaw.ai](https://docs.openclaw.ai/).
2) Enable the OpenAI-compatible HTTP API in your Gateway config.
3) Start the Gateway (default `http://127.0.0.1:18789`).
---
### 2) Configure This Plugin (Minimal)
- **Base URL** should point to your OpenClaw Gateway.
- **Gateway Token** is required only if your Gateway auth is enabled.
- **Known Agent IDs** is a manual comma-separated list (example: `main,research,fast`).
- **Default Agent ID** uses that manual list for selection.
- **Model correlation:** the selected agent determines the real provider model inside OpenClaw.
---
### 3) Variable Functions
**openclaw_prompt**
Send prompts using a simple syntax.

Example:
`{{openclaw_prompt=Make a funny quote}}`

Use user input:
`{{openclaw_prompt={{message}}}}`

Keep conversation context with a thread name and optional agent override:
`{{openclaw_prompt={{message}}|thread_name|main}}`

You can pass an agent id (`main`) or route (`openclaw:main`) in the third slot.

**openclaw_json**
Return JSON-only output:
`{{openclaw_json=Summarize this clip as JSON}}`

**openclaw_one_line**
Return a single-line response (newlines removed):
`{{openclaw_one_line=Write a short hype line}}`

**openclaw_prompt_nostore**
Run a prompt without storing or using history:
`{{openclaw_prompt_nostore=Give me a quick summary}}`

**openclaw_prompt_clear**
Clear a conversation thread:
`{{openclaw_prompt_clear=thread_name}}`
---

```

## openclaw/translations.json

```
{
	"en": {
		"connection": "Connection",
		"Connection": "Connection",
		"Base URL": "Base URL",
		"Your OpenClaw Gateway URL.": "Your OpenClaw Gateway URL.",
		"Gateway Token": "Gateway Token",
		"Optional. Required when Gateway auth is enabled.": "Optional. Required when Gateway auth is enabled.",
		"Default Agent ID": "Default Agent ID",
		"Auto": "Auto",
		"Agent id used to build request route (openclaw:<agent>) and x-openclaw-agent-id.": "Agent id used to build request route (openclaw:<agent>) and x-openclaw-agent-id.",
		"Known Agent IDs": "Known Agent IDs",
		"Comma-separated agent IDs for the dropdown (example: main,research,fast).": "Comma-separated agent IDs for the dropdown (example: main,research,fast).",
		"OpenClaw Prompt": "OpenClaw Prompt",
		"Use {{openclaw_prompt=message|thread|agent}} to return a response from OpenClaw.": "Use {{openclaw_prompt=message|thread|agent}} to return a response from OpenClaw.",
		"OpenClaw JSON": "OpenClaw JSON",
		"Use {{openclaw_json=message|thread|agent}} to return JSON-only output.": "Use {{openclaw_json=message|thread|agent}} to return JSON-only output.",
		"OpenClaw One Line": "OpenClaw One Line",
		"Use {{openclaw_one_line=message|thread|agent}} to return a single-line response.": "Use {{openclaw_one_line=message|thread|agent}} to return a single-line response.",
		"OpenClaw Prompt (No Store)": "OpenClaw Prompt (No Store)",
		"Use {{openclaw_prompt_nostore=message|thread|agent}} to run without history.": "Use {{openclaw_prompt_nostore=message|thread|agent}} to run without history.",
		"OpenClaw Clear Thread": "OpenClaw Clear Thread",
		"Use {{openclaw_prompt_clear=thread_name}} to clear a conversation thread.": "Use {{openclaw_prompt_clear=thread_name}} to clear a conversation thread."
	}
}

```

## openrgb/README.md

```
# OpenRGB Plugin (Private)

Use OpenRGB devices as Lumia Stream lights through the OpenRGB SDK server.

## Features

- Discovers OpenRGB controllers and exposes them as selectable Lumia lights.
- Handles Lumia light updates (`onLightChange`) for real-time color/power/brightness control.
- Applies software fade transitions when Lumia sends a `transition` value.
- Exposes per-device OpenRGB modes as Studio Theme options.
- Provides actions for:
  - Loading/saving OpenRGB profiles

## Setup

1. Open OpenRGB and enable the SDK server.
2. In Lumia plugin settings, set host/port (default `127.0.0.1:6742`).
3. Activate plugin. The plugin always runs startup discovery automatically.
4. Optionally click **Discover OpenRGB Devices** in auth to refresh manually.
5. Select discovered devices in the light list.

## Notes

- This plugin writes per-LED colors through the OpenRGB SDK protocol.
- Live light color updates are sent fire-and-forget (no request timeout waiting).
- Discovery/auth calls use a fixed 4000ms timeout.
- SDK client name is fixed to `Lumia Stream`.
- Turning power off writes black to all LEDs for targeted devices.
- If discovery does not return a device, manual add accepts a controller ID.
- Controller ID is the zero-based index in OpenRGB's Devices list order (first device is `0`, second is `1`, etc.).

```

## openrgb/actions_tutorial.md

```
---
### OpenRGB Actions
- **Load/Save Profile**: Trigger OpenRGB profile commands through the SDK.

Light color/power/brightness are controlled through Lumia light actions and support software fade transitions via the `transition` value.
Studio Themes now include OpenRGB mode options per discovered device.
---

```

## openrgb/main.js

```
const net = require("net");
const { createHash } = require("crypto");
const { Plugin } = require("@lumiastream/plugin");

const PACKET_TYPES = {
	REQUEST_CONTROLLER_COUNT: 0,
	REQUEST_CONTROLLER_DATA: 1,
	REQUEST_PROTOCOL_VERSION: 40,
	SET_CLIENT_NAME: 50,
	DEVICE_LIST_UPDATED: 100,
	REQUEST_PROFILE_LIST: 150,
	REQUEST_SAVE_PROFILE: 151,
	REQUEST_LOAD_PROFILE: 152,
	REQUEST_DELETE_PROFILE: 153,
	RGBCONTROLLER_UPDATELEDS: 1050,
	RGBCONTROLLER_SETCUSTOMMODE: 1100,
	RGBCONTROLLER_UPDATEMODE: 1101,
};

const HEADER_SIZE = 16;
const HEADER_MAGIC = Buffer.from("ORGB", "ascii");
const ZONE_TYPE_MATRIX = 2;
const DEFAULT_PROTOCOL_VERSION = 4;
const DISCOVERY_TIMEOUT_MS = 4000;
const TRANSITION_STEP_MS = 33;
const MAX_TRANSITION_STEPS = 45;
const MAX_TRANSITION_MS = 30000;
const OPENRGB_CLIENT_NAME = "Lumia Stream";
const MODE_FLAG_HAS_SPEED = 1 << 0;
const MODE_FLAG_HAS_DIRECTION_LR = 1 << 1;
const MODE_FLAG_HAS_DIRECTION_UD = 1 << 2;
const MODE_FLAG_HAS_DIRECTION_HV = 1 << 3;
const MODE_FLAG_HAS_BRIGHTNESS = 1 << 4;

const DEFAULTS = {
	host: "127.0.0.1",
	port: 6742,
};

function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value));
}

function coerceString(value, fallback = "") {
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed.length ? trimmed : fallback;
	}
	if (value === null || value === undefined) {
		return fallback;
	}
	const text = String(value).trim();
	return text.length ? text : fallback;
}

function coerceNumber(value, fallback) {
	const unwrapped = unwrapActionValue(value);
	if (unwrapped === null || unwrapped === undefined || unwrapped === "") {
		return fallback;
	}
	if (typeof unwrapped === "number" && Number.isFinite(unwrapped)) {
		return unwrapped;
	}
	const parsed = Number(unwrapped);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function coerceBoolean(value, fallback = false) {
	const unwrapped = unwrapActionValue(value);
	if (typeof unwrapped === "boolean") {
		return unwrapped;
	}
	if (typeof unwrapped === "number") {
		return unwrapped !== 0;
	}
	if (typeof unwrapped === "string") {
		const text = unwrapped.trim().toLowerCase();
		if (["1", "true", "on", "yes", "enabled"].includes(text)) {
			return true;
		}
		if (["0", "false", "off", "no", "disabled"].includes(text)) {
			return false;
		}
	}
	return fallback;
}

function unwrapActionValue(value) {
	if (!value || typeof value !== "object") {
		return value;
	}
	if (Object.prototype.hasOwnProperty.call(value, "value")) {
		return value.value;
	}
	if (Object.prototype.hasOwnProperty.call(value, "label")) {
		return value.label;
	}
	return value;
}

function normalizeListInput(value) {
	const output = [];
	const seen = new Set();

	const append = (entry) => {
		if (entry === null || entry === undefined) {
			return;
		}
		if (Array.isArray(entry)) {
			entry.forEach(append);
			return;
		}

		const unwrapped = unwrapActionValue(entry);
		if (Array.isArray(unwrapped)) {
			unwrapped.forEach(append);
			return;
		}

		if (typeof unwrapped === "object" && unwrapped !== null) {
			if (unwrapped.id !== undefined) {
				append(unwrapped.id);
				return;
			}
			if (unwrapped.openrgbDeviceId !== undefined) {
				append(unwrapped.openrgbDeviceId);
				return;
			}
			if (unwrapped.deviceId !== undefined) {
				append(unwrapped.deviceId);
				return;
			}
			if (unwrapped.value !== undefined) {
				append(unwrapped.value);
				return;
			}
			return;
		}

		if (typeof unwrapped === "string") {
			unwrapped
				.split(",")
				.map((part) => part.trim())
				.filter(Boolean)
				.forEach((part) => {
					if (!seen.has(part)) {
						seen.add(part);
						output.push(part);
					}
				});
			return;
		}

		const normalized = String(unwrapped).trim();
		if (!normalized) {
			return;
		}
		if (!seen.has(normalized)) {
			seen.add(normalized);
			output.push(normalized);
		}
	};

	append(value);
	return output;
}

function normalizeColor(value) {
	const unwrapped = unwrapActionValue(value);

	if (!unwrapped && unwrapped !== 0) {
		return null;
	}

	if (Array.isArray(unwrapped) && unwrapped.length >= 3) {
		const r = clamp(Math.round(coerceNumber(unwrapped[0], 0)), 0, 255);
		const g = clamp(Math.round(coerceNumber(unwrapped[1], 0)), 0, 255);
		const b = clamp(Math.round(coerceNumber(unwrapped[2], 0)), 0, 255);
		return { r, g, b };
	}

	if (typeof unwrapped === "object") {
		const r = coerceNumber(unwrapped.r ?? unwrapped.red, NaN);
		const g = coerceNumber(unwrapped.g ?? unwrapped.green, NaN);
		const b = coerceNumber(unwrapped.b ?? unwrapped.blue, NaN);
		if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
			return {
				r: clamp(Math.round(r), 0, 255),
				g: clamp(Math.round(g), 0, 255),
				b: clamp(Math.round(b), 0, 255),
			};
		}
	}

	if (typeof unwrapped === "string") {
		const text = unwrapped.trim();
		const hexMatch = text.match(/^#?([0-9a-fA-F]{6})$/);
		if (hexMatch) {
			const hex = hexMatch[1];
			return {
				r: parseInt(hex.slice(0, 2), 16),
				g: parseInt(hex.slice(2, 4), 16),
				b: parseInt(hex.slice(4, 6), 16),
			};
		}

		const rgbMatch = text.match(
			/^\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*$/,
		);
		if (rgbMatch) {
			return {
				r: clamp(parseInt(rgbMatch[1], 10), 0, 255),
				g: clamp(parseInt(rgbMatch[2], 10), 0, 255),
				b: clamp(parseInt(rgbMatch[3], 10), 0, 255),
			};
		}
	}

	return null;
}

function applyBrightness(color, brightness) {
	const value = clamp(Math.round(coerceNumber(brightness, 100)), 0, 100) / 100;
	return {
		r: clamp(Math.round(color.r * value), 0, 255),
		g: clamp(Math.round(color.g * value), 0, 255),
		b: clamp(Math.round(color.b * value), 0, 255),
	};
}

function isBlackColor(color) {
	return Boolean(
		color &&
			Number(color.r) === 0 &&
			Number(color.g) === 0 &&
			Number(color.b) === 0,
	);
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function lerpChannel(start, end, t) {
	return clamp(Math.round(start + (end - start) * t), 0, 255);
}

function lerpColor(start, end, t) {
	return {
		r: lerpChannel(start.r, end.r, t),
		g: lerpChannel(start.g, end.g, t),
		b: lerpChannel(start.b, end.b, t),
	};
}

function colorsEqual(a, b) {
	return (
		Number(a?.r) === Number(b?.r) &&
		Number(a?.g) === Number(b?.g) &&
		Number(a?.b) === Number(b?.b)
	);
}

function buildUpdateLedsPayload(ledCount, color) {
	const total = Math.max(1, Math.floor(coerceNumber(ledCount, 1)));
	const packetSize = 6 + total * 4;
	const payload = Buffer.alloc(packetSize);
	payload.writeUInt32LE(packetSize, 0);
	payload.writeUInt16LE(total, 4);

	for (let i = 0; i < total; i++) {
		const offset = 6 + i * 4;
		payload.writeUInt8(color.r, offset);
		payload.writeUInt8(color.g, offset + 1);
		payload.writeUInt8(color.b, offset + 2);
		payload.writeUInt8(0, offset + 3);
	}

	return payload;
}

function packCString(value) {
	return Buffer.from(`${String(value ?? "")}\0`, "utf8");
}

function packLengthPrefixedString(value) {
	const text = String(value ?? "");
	const bytes = Buffer.from(text, "utf8");
	const out = Buffer.alloc(2 + bytes.length + 1);
	out.writeUInt16LE(bytes.length + 1, 0);
	bytes.copy(out, 2);
	out[out.length - 1] = 0;
	return out;
}

class BufferCursor {
	constructor(buffer) {
		this.buffer = buffer;
		this.offset = 0;
	}

	ensure(size) {
		if (this.offset + size > this.buffer.length) {
			throw new Error(
				`OpenRGB packet parse overflow (offset=${this.offset}, size=${size}, length=${this.buffer.length})`,
			);
		}
	}

	readUInt16() {
		this.ensure(2);
		const value = this.buffer.readUInt16LE(this.offset);
		this.offset += 2;
		return value;
	}

	readUInt8() {
		this.ensure(1);
		const value = this.buffer.readUInt8(this.offset);
		this.offset += 1;
		return value;
	}

	readUInt32() {
		this.ensure(4);
		const value = this.buffer.readUInt32LE(this.offset);
		this.offset += 4;
		return value;
	}

	readInt32() {
		this.ensure(4);
		const value = this.buffer.readInt32LE(this.offset);
		this.offset += 4;
		return value;
	}

	readString() {
		const length = this.readUInt16();
		this.ensure(length);
		const raw = this.buffer.subarray(this.offset, this.offset + length);
		this.offset += length;
		return raw.toString("utf8").replace(/\0+$/g, "");
	}

	skip(size) {
		this.ensure(size);
		this.offset += size;
	}
}

function parseMode(cursor, protocolVersion, index) {
	const name = cursor.readString();
	const value = cursor.readInt32();
	const flags = cursor.readUInt32();
	let speedMin = cursor.readUInt32();
	let speedMax = cursor.readUInt32();
	let brightnessMin = protocolVersion >= 3 ? cursor.readUInt32() : null;
	let brightnessMax = protocolVersion >= 3 ? cursor.readUInt32() : null;
	let colorsMin = cursor.readUInt32();
	let colorsMax = cursor.readUInt32();
	let speed = cursor.readUInt32();
	let brightness = protocolVersion >= 3 ? cursor.readUInt32() : null;
	let direction = cursor.readUInt32();
	const colorMode = cursor.readUInt32();
	const colorCount = cursor.readUInt16();
	const colors = [];
	for (let i = 0; i < colorCount; i++) {
		const r = cursor.readUInt8();
		const g = cursor.readUInt8();
		const b = cursor.readUInt8();
		cursor.readUInt8(); // Reserved/white channel
		colors.push({ r, g, b });
	}

	if ((flags & MODE_FLAG_HAS_SPEED) === 0) {
		speed = null;
		speedMin = null;
		speedMax = null;
	}
	if (protocolVersion < 3 || (flags & MODE_FLAG_HAS_BRIGHTNESS) === 0) {
		brightness = null;
		brightnessMin = null;
		brightnessMax = null;
	}
	if (colorCount === 0) {
		colorsMin = null;
		colorsMax = null;
	}
	if (
		(flags & MODE_FLAG_HAS_DIRECTION_LR) === 0 &&
		(flags & MODE_FLAG_HAS_DIRECTION_UD) === 0 &&
		(flags & MODE_FLAG_HAS_DIRECTION_HV) === 0
	) {
		direction = null;
	}

	return {
		index,
		id: index,
		name,
		value,
		flags,
		speedMin,
		speedMax,
		brightnessMin,
		brightnessMax,
		colorsMin,
		colorsMax,
		speed,
		brightness,
		direction,
		colorMode,
		colors,
	};
}

function parseZone(cursor, protocolVersion, index) {
	const name = cursor.readString();
	const type = cursor.readInt32();
	const ledsMin = cursor.readUInt32();
	const ledsMax = cursor.readUInt32();
	const numLeds = cursor.readUInt32();
	const matrixZoneSize = cursor.readUInt16();

	if (type === ZONE_TYPE_MATRIX) {
		const height = cursor.readUInt32();
		const width = cursor.readUInt32();
		const mapEntries = matrixZoneSize > 0 ? matrixZoneSize : width * height;
		cursor.skip(mapEntries * 4);
	} else if (matrixZoneSize > 0) {
		// Defensive skip if malformed payload reports matrix data for non-matrix zones.
		cursor.skip(matrixZoneSize * 4);
	}

	if (protocolVersion >= 4) {
		const segmentCount = cursor.readUInt16();
		for (let i = 0; i < segmentCount; i++) {
			cursor.readString();
			cursor.readInt32();
			cursor.readUInt32();
			cursor.readUInt32();
		}
	}

	return {
		index,
		name,
		type,
		ledsMin,
		ledsMax,
		numLeds,
	};
}

function parseLed(cursor) {
	cursor.readString();
	cursor.readUInt32();
}

function parseControllerData(payload, protocolVersion, deviceId) {
	const cursor = new BufferCursor(payload);
	const packetSize = cursor.readUInt32();
	const deviceType = cursor.readInt32();
	const name = cursor.readString();
	const vendor = protocolVersion >= 1 ? cursor.readString() : "";
	const description = cursor.readString();
	const firmwareVersion = cursor.readString();
	const serial = cursor.readString();
	const location = cursor.readString();
	const modeCount = cursor.readUInt16();
	const activeMode = cursor.readInt32();
	const modes = [];

	for (let i = 0; i < modeCount; i++) {
		modes.push(parseMode(cursor, protocolVersion, i));
	}

	const zoneCount = cursor.readUInt16();
	const zones = [];
	for (let i = 0; i < zoneCount; i++) {
		zones.push(parseZone(cursor, protocolVersion, i));
	}

	const ledCountFromList = cursor.readUInt16();
	for (let i = 0; i < ledCountFromList; i++) {
		parseLed(cursor);
	}

	const colorCount = cursor.readUInt16();
	cursor.skip(colorCount * 4);

	const totalZoneLeds = zones.reduce(
		(sum, zone) => sum + (Number.isFinite(zone.numLeds) ? zone.numLeds : 0),
		0,
	);

	const ledCount = Math.max(colorCount, ledCountFromList, totalZoneLeds, 1);
	const remaining = payload.length - cursor.offset;
	if (remaining > 0) {
		const tail = payload.subarray(cursor.offset);
		const hasNonZeroTail = tail.some((value) => value !== 0);
		if (hasNonZeroTail) {
			throw new Error(
				`OpenRGB controller parse left ${remaining} trailing bytes`,
			);
		}
	}

	return {
		controller: {
			id: deviceId,
			packetSize,
			deviceType,
			name,
			vendor,
			description,
			firmwareVersion,
			serial,
			location,
			modeCount,
			activeMode,
			modes,
			zoneCount,
			zones,
			ledCount,
		},
		usedVersion: protocolVersion,
	};
}

function parseControllerDataWithFallback(payload, preferredVersion, deviceId) {
	const normalizedPreferred = Number.isFinite(preferredVersion)
		? Math.max(0, Math.min(4, Math.floor(preferredVersion)))
		: DEFAULT_PROTOCOL_VERSION;
	return parseControllerData(payload, normalizedPreferred, deviceId);
}

function parseProfileNames(payload) {
	if (!payload.length) {
		return [];
	}
	const cursor = new BufferCursor(payload);
	if (payload.length >= 4) {
		cursor.readUInt32();
	}
	const count = cursor.readUInt16();
	const names = [];
	for (let i = 0; i < count; i++) {
		names.push(cursor.readString());
	}
	return names.filter((name) => name.length > 0);
}

function normalizeModeName(value) {
	return String(value ?? "")
		.trim()
		.toLowerCase();
}

function parseThemeModeToken(value) {
	const unwrapped = unwrapActionValue(value);
	if (unwrapped === null || unwrapped === undefined) {
		return null;
	}

	if (typeof unwrapped === "object") {
		const fromId = parseThemeModeToken(unwrapped.id ?? unwrapped.value);
		if (fromId) {
			return fromId;
		}
		const modeName = coerceString(unwrapped.name ?? unwrapped.modeName, "");
		if (modeName) {
			return {
				deviceId: null,
				modeIndex: null,
				modeName,
			};
		}
	}

	const text = String(unwrapped).trim();
	if (!text) {
		return null;
	}

	const scoped = text.match(/^openrgb-mode:(\d+):(\d+)$/i);
	if (scoped) {
		return {
			deviceId: parseInt(scoped[1], 10),
			modeIndex: parseInt(scoped[2], 10),
			modeName: "",
		};
	}

	if (/^\d+$/.test(text)) {
		return {
			deviceId: null,
			modeIndex: parseInt(text, 10),
			modeName: "",
		};
	}

	return {
		deviceId: null,
		modeIndex: null,
		modeName: text,
	};
}

function packModePayload(mode, protocolVersion) {
	const colors = Array.isArray(mode.colors) ? mode.colors : [];
	const payloadSegments = [];

	payloadSegments.push(Buffer.alloc(4));
	payloadSegments[payloadSegments.length - 1].writeInt32LE(
		Math.floor(coerceNumber(mode.id ?? mode.index, 0)),
		0,
	);
	payloadSegments.push(packLengthPrefixedString(mode.name));

	const value = Buffer.alloc(4);
	value.writeInt32LE(Math.floor(coerceNumber(mode.value, 0)), 0);
	payloadSegments.push(value);

	const flags = Buffer.alloc(4);
	flags.writeUInt32LE(Math.floor(coerceNumber(mode.flags, 0)) >>> 0, 0);
	payloadSegments.push(flags);

	const speedMin = Buffer.alloc(4);
	speedMin.writeUInt32LE(Math.floor(coerceNumber(mode.speedMin, 0)) >>> 0, 0);
	payloadSegments.push(speedMin);

	const speedMax = Buffer.alloc(4);
	speedMax.writeUInt32LE(Math.floor(coerceNumber(mode.speedMax, 0)) >>> 0, 0);
	payloadSegments.push(speedMax);

	if (protocolVersion >= 3) {
		const brightnessMin = Buffer.alloc(4);
		brightnessMin.writeUInt32LE(
			Math.floor(coerceNumber(mode.brightnessMin, 0)) >>> 0,
			0,
		);
		payloadSegments.push(brightnessMin);

		const brightnessMax = Buffer.alloc(4);
		brightnessMax.writeUInt32LE(
			Math.floor(coerceNumber(mode.brightnessMax, 0)) >>> 0,
			0,
		);
		payloadSegments.push(brightnessMax);
	}

	const colorsMin = Buffer.alloc(4);
	colorsMin.writeUInt32LE(Math.floor(coerceNumber(mode.colorsMin, 0)) >>> 0, 0);
	payloadSegments.push(colorsMin);

	const colorsMax = Buffer.alloc(4);
	colorsMax.writeUInt32LE(Math.floor(coerceNumber(mode.colorsMax, 0)) >>> 0, 0);
	payloadSegments.push(colorsMax);

	const speed = Buffer.alloc(4);
	speed.writeUInt32LE(Math.floor(coerceNumber(mode.speed, 0)) >>> 0, 0);
	payloadSegments.push(speed);

	if (protocolVersion >= 3) {
		const brightness = Buffer.alloc(4);
		brightness.writeUInt32LE(
			Math.floor(coerceNumber(mode.brightness, 0)) >>> 0,
			0,
		);
		payloadSegments.push(brightness);
	}

	const direction = Buffer.alloc(4);
	direction.writeUInt32LE(Math.floor(coerceNumber(mode.direction, 0)) >>> 0, 0);
	payloadSegments.push(direction);

	const colorMode = Buffer.alloc(4);
	colorMode.writeUInt32LE(Math.floor(coerceNumber(mode.colorMode, 0)) >>> 0, 0);
	payloadSegments.push(colorMode);

	const colorCount = Buffer.alloc(2);
	colorCount.writeUInt16LE(colors.length, 0);
	payloadSegments.push(colorCount);

	for (const color of colors) {
		const rgba = Buffer.alloc(4);
		rgba.writeUInt8(clamp(Math.round(coerceNumber(color?.r, 0)), 0, 255), 0);
		rgba.writeUInt8(clamp(Math.round(coerceNumber(color?.g, 0)), 0, 255), 1);
		rgba.writeUInt8(clamp(Math.round(coerceNumber(color?.b, 0)), 0, 255), 2);
		rgba.writeUInt8(0, 3);
		payloadSegments.push(rgba);
	}

	const body = Buffer.concat(payloadSegments);
	const packetSize = Buffer.alloc(4);
	packetSize.writeUInt32LE(body.length + 4, 0);
	return Buffer.concat([packetSize, body]);
}

class OpenRGBSocket {
	constructor(timeoutMs) {
		this.timeoutMs = timeoutMs;
		this.socket = null;
		this.buffer = Buffer.alloc(0);
		this.closed = false;
		this.error = null;
		this.pending = null;
	}

	async connect(host, port) {
		if (this.socket && !this.closed) {
			return;
		}

		this.buffer = Buffer.alloc(0);
		this.closed = false;
		this.error = null;

		const socket = new net.Socket();
		this.socket = socket;
		socket.setNoDelay(true);

		socket.on("data", (chunk) => {
			this.buffer = Buffer.concat([this.buffer, chunk]);
			if (this.pending) {
				const { resolve, timer } = this.pending;
				this.pending = null;
				clearTimeout(timer);
				resolve();
			}
		});

		socket.on("error", (error) => {
			this.error = error;
			if (this.pending) {
				const { reject, timer } = this.pending;
				this.pending = null;
				clearTimeout(timer);
				reject(error);
			}
		});

		socket.on("close", () => {
			this.closed = true;
			if (this.pending) {
				const { reject, timer } = this.pending;
				this.pending = null;
				clearTimeout(timer);
				reject(new Error("OpenRGB socket closed"));
			}
		});

		await new Promise((resolve, reject) => {
			let settled = false;
			const timer = setTimeout(() => {
				if (settled) return;
				settled = true;
				socket.destroy();
				reject(new Error("OpenRGB connection timeout"));
			}, this.timeoutMs);

			socket.connect(port, host, () => {
				if (settled) return;
				settled = true;
				clearTimeout(timer);
				resolve();
			});

			socket.once("error", (error) => {
				if (settled) return;
				settled = true;
				clearTimeout(timer);
				reject(error);
			});
		});
	}

	async write(buffer) {
		if (!this.socket || this.closed) {
			throw new Error("OpenRGB socket is not connected");
		}

		await new Promise((resolve, reject) => {
			this.socket.write(buffer, (error) => {
				if (error) {
					reject(error);
					return;
				}
				resolve();
			});
		});
	}

	writeFireAndForget(buffer) {
		if (!this.socket || this.closed) {
			throw new Error("OpenRGB socket is not connected");
		}
		this.socket.write(buffer);
	}

	async waitForData() {
		if (this.error) {
			throw this.error;
		}
		if (this.closed) {
			throw new Error("OpenRGB socket closed");
		}
		if (this.buffer.length > 0) {
			return;
		}
		if (this.pending) {
			await this.pending.promise;
			return;
		}

		let resolvePromise;
		let rejectPromise;
		const promise = new Promise((resolve, reject) => {
			resolvePromise = resolve;
			rejectPromise = reject;
		});

		const timer = setTimeout(() => {
			if (!this.pending) return;
			const { reject } = this.pending;
			this.pending = null;
			reject(new Error("OpenRGB read timeout"));
		}, this.timeoutMs);

		this.pending = {
			promise,
			resolve: resolvePromise,
			reject: rejectPromise,
			timer,
		};

		await promise;
	}

	async readExact(length) {
		while (this.buffer.length < length) {
			await this.waitForData();
		}

		const chunk = this.buffer.subarray(0, length);
		this.buffer = this.buffer.subarray(length);
		return chunk;
	}

	close() {
		if (this.pending) {
			const { reject, timer } = this.pending;
			this.pending = null;
			clearTimeout(timer);
			reject(new Error("OpenRGB socket closed"));
		}
		if (this.socket) {
			this.socket.destroy();
		}
		this.socket = null;
		this.closed = true;
	}
}

class OpenRGBPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._taskQueue = Promise.resolve();
		this._socket = null;
		this._protocolVersion = DEFAULT_PROTOCOL_VERSION;
		this._connected = false;
		this._connectionStatePublished = false;
		this._lights = [];
		this._deviceLedCounts = new Map();
		this._deviceModes = new Map();
		this._deviceState = new Map();
		this._lastErrorMessage = "";
		this._host = DEFAULTS.host;
		this._port = DEFAULTS.port;
		this._requestTimeoutMs = DISCOVERY_TIMEOUT_MS;
	}

	async onload() {
		await this._runExclusive(async () => {
			this._applySettings(this.settings);

			try {
				await this._discoverLightsInternal();
				await this._setConnected(true);
			} catch (error) {
				await this._setConnected(false);
				await this._recordError("Initial OpenRGB discovery failed", error);
			}
		});
	}

	async onunload() {
		await this._runExclusive(async () => {
			await this._setConnected(false);
			await this._closeSocket();
		});
	}

	async onsettingsupdate(settings) {
		await this._runExclusive(async () => {
			this._applySettings(settings);
			await this._closeSocket();
			await this._setConnected(false);

			try {
				await this._discoverLightsInternal();
				await this._setConnected(true);
			} catch (error) {
				await this._recordError("OpenRGB rediscovery failed", error);
			}
		});
	}

	async validateAuth() {
		return this._runExclusive(async () => {
			try {
				await this._ensureSocket();
				const count = await this._requestControllerCount();
				await this._setConnected(true);
				return {
					ok: true,
					message: `Connected to OpenRGB at ${this._host}:${this._port}. Controllers: ${count}.`,
				};
			} catch (error) {
				await this._setConnected(false);
				await this._recordError("OpenRGB validation failed", error);
				return {
					ok: false,
					message: `Unable to connect to OpenRGB at ${this._host}:${this._port}. ${this._errorMessage(error)}`,
				};
			}
		});
	}

	async searchLights() {
		return this._runExclusive(async () => {
			const lights = await this._discoverLightsInternal();
			await this._setConnected(true);
			return lights;
		});
	}

	async searchThemes() {
		return this._runExclusive(async () => {
			await this._discoverLightsInternal();
			await this._setConnected(true);
			return this._buildThemeModeOptions();
		});
	}

	async addLight(data = {}) {
		return this._runExclusive(async () => {
			const numericId = Math.floor(coerceNumber(data.deviceId ?? data.id, NaN));
			const customName = coerceString(data.name, "");
			if (!Number.isFinite(numericId) || numericId < 0) {
				throw new Error("A valid OpenRGB deviceId is required.");
			}

			let resolvedLight = null;
			try {
				await this._ensureSocket();
				const controller = await this._requestControllerData(numericId);
				resolvedLight = this._controllerToLight(controller);
			} catch {
				resolvedLight = {
					id: `openrgb-${numericId}`,
					name: customName || `OpenRGB Device ${numericId}`,
					openrgbDeviceId: numericId,
					manual: true,
					location: "",
					serial: "",
					ledCount: 1,
					zoneCount: 0,
				};
			}

			if (customName) {
				resolvedLight.name = customName;
			}

			this._mergeLights([resolvedLight]);
			return this._lights;
		});
	}

	async onLightChange(config = {}) {
		const targets = this._resolveDeviceIdsFromLights(config.lights, true);
		if (!targets.length) {
			return;
		}

		void this._runExclusive(async () => {
			try {
				const modeSelection = parseThemeModeToken(
					config.rawConfig?.theme ?? config.theme,
				);
				const isThemeRequest =
					Boolean(config.rawConfig?.fromTheme) ||
					(config.rawConfig &&
						Object.prototype.hasOwnProperty.call(config.rawConfig, "theme"));
				if (isThemeRequest && modeSelection) {
					await this._applyModeUpdate(targets, modeSelection, {
						allowNetworkLookups: true,
						fireAndForget: false,
						skipConnectIfUnavailable: false,
					});
					return;
				}
				if (isThemeRequest) {
					await this._recordError(
						"OpenRGB theme mode selection invalid",
						new Error("Theme mode value could not be parsed."),
					);
					return;
				}

				await this._applyColorUpdate(targets, {
					color: config.color,
					brightness: config.brightness,
					power: config.power,
					transition: config.transition,
					fireAndForget: true,
					skipConnectIfUnavailable: true,
					allowNetworkLookups: false,
				});
			} catch (error) {
				await this._recordError("OpenRGB light update failed", error);
			}
		});
	}

	async refreshActionOptions(config = {}) {
		return this._runExclusive(async () => {
			const actionType = coerceString(config.actionType, "");
			if (!actionType) {
				return;
			}

			if (["load_profile", "save_profile"].includes(actionType)) {
				let options = [];
				try {
					const profiles = await this._requestProfileList();
					options = profiles.map((name) => ({ label: name, value: name }));
				} catch {
					options = [];
				}

				await this.lumia.updateActionFieldOptions({
					actionType,
					fieldKey: "profileName",
					options,
				});
				return;
			}

		});
	}

	async actions(config) {
		return this._runExclusive(async () => {
			for (const action of config.actions) {
				const values = action.value;
				try {
					switch (action.type) {
						case "load_profile":
							await this._handleLoadProfileAction(values);
							break;
						case "save_profile":
							await this._handleSaveProfileAction(values);
							break;
						default:
							break;
					}
				} catch (error) {
					await this._recordError(
						`Action ${action.type || "unknown"} failed`,
						error,
					);
					throw error;
				}
			}
		});
	}

	_applySettings(settings = {}) {
		this._host = coerceString(settings.host, DEFAULTS.host);
		this._port = clamp(
			Math.floor(coerceNumber(settings.port, DEFAULTS.port)),
			1,
			65535,
		);
	}

	async _runExclusive(task) {
		const run = this._taskQueue.then(task, task);
		this._taskQueue = run.then(
			() => undefined,
			() => undefined,
		);
		return run;
	}

	async _setConnected(state) {
		// Always publish the first known state so stale persisted UI state is corrected.
		if (this._connected === state && this._connectionStatePublished) {
			return;
		}
		this._connected = state;
		this._connectionStatePublished = true;
		await this.lumia.updateConnection(state);
	}

	async _recordError(prefix, error) {
		const message = `${prefix}: ${this._errorMessage(error)}`;
		if (message === this._lastErrorMessage) {
			return;
		}
		this._lastErrorMessage = message;
		await this.lumia.log(`[openrgb] ${message}`);
	}

	_errorMessage(error) {
		if (!error) return "Unknown error";
		if (typeof error === "string") return error;
		if (error?.message) return error.message;
		return String(error);
	}

	async _closeSocket() {
		if (this._socket) {
			this._socket.close();
			this._socket = null;
		}
	}

	async _ensureSocket() {
		if (this._socket && !this._socket.closed) {
			return;
		}
		if (this._socket && this._socket.closed) {
			await this._closeSocket();
		}

		const socket = new OpenRGBSocket(this._requestTimeoutMs);
		await socket.connect(this._host, this._port);
		this._socket = socket;

		try {
			const protocolRequest = Buffer.alloc(4);
			protocolRequest.writeUInt32LE(DEFAULT_PROTOCOL_VERSION, 0);
			const protocolPayload = await this._sendPacket(
				0,
				PACKET_TYPES.REQUEST_PROTOCOL_VERSION,
				protocolRequest,
				{ expectResponse: true },
			);
			if (protocolPayload.length >= 4) {
				this._protocolVersion = Math.min(
					DEFAULT_PROTOCOL_VERSION,
					protocolPayload.readUInt32LE(0),
				);
			}

			await this._sendPacket(
				0,
				PACKET_TYPES.SET_CLIENT_NAME,
				Buffer.from(`${OPENRGB_CLIENT_NAME}\0`, "utf8"),
				{ expectResponse: false },
			);
			await this._setConnected(true);
		} catch (error) {
			await this._closeSocket();
			throw error;
		}
	}

	async _sendPacket(deviceId, packetType, payload, options = {}) {
		const expectResponse = options.expectResponse === true;
		const expectedPacketType = options.expectedPacketType ?? packetType;
		const fireAndForget = options.fireAndForget === true && !expectResponse;
		const skipConnectIfUnavailable =
			options.skipConnectIfUnavailable === true;

		if (!this._socket) {
			if (skipConnectIfUnavailable) {
				await this._setConnected(false);
				return Buffer.alloc(0);
			}
			await this._ensureSocket();
		}
		const packetPayload = payload || Buffer.alloc(0);

		const header = Buffer.alloc(HEADER_SIZE);
		HEADER_MAGIC.copy(header, 0);
		header.writeUInt32LE(deviceId >>> 0, 4);
		header.writeUInt32LE(packetType >>> 0, 8);
		header.writeUInt32LE(packetPayload.length >>> 0, 12);

		const socket = this._socket;
		if (!socket) {
			return Buffer.alloc(0);
		}
		try {
			const packet = Buffer.concat([header, packetPayload]);
			if (fireAndForget) {
				socket.writeFireAndForget(packet);
				return Buffer.alloc(0);
			}

			await socket.write(packet);
			if (!expectResponse) {
				return Buffer.alloc(0);
			}
			while (true) {
				const packet = await this._readPacket();
				if (packet.packetType === PACKET_TYPES.DEVICE_LIST_UPDATED) {
					continue;
				}
				if (packet.packetType !== expectedPacketType) {
					continue;
				}
				return packet.payload;
			}
		} catch (error) {
			await this._closeSocket();
			await this._setConnected(false);
			throw error;
		}
	}

	async _readPacket() {
		const socket = this._socket;
		const header = await socket.readExact(HEADER_SIZE);
		if (!header.subarray(0, 4).equals(HEADER_MAGIC)) {
			throw new Error("Invalid OpenRGB packet header magic.");
		}
		const packetType = header.readUInt32LE(8);
		const payloadSize = header.readUInt32LE(12);
		const payload =
			payloadSize > 0 ? await socket.readExact(payloadSize) : Buffer.alloc(0);

		return {
			packetType,
			payload,
		};
	}

	async _requestControllerCount() {
		const payload = await this._sendPacket(
			0,
			PACKET_TYPES.REQUEST_CONTROLLER_COUNT,
			Buffer.alloc(0),
			{ expectResponse: true },
		);
		if (payload.length < 4) {
			throw new Error("OpenRGB returned an invalid controller count response.");
		}
		return payload.readUInt32LE(0);
	}

	async _requestControllerData(deviceId) {
		const payloadVersion = Buffer.alloc(4);
		payloadVersion.writeUInt32LE(this._protocolVersion, 0);
		const payload = await this._sendPacket(
			deviceId,
			PACKET_TYPES.REQUEST_CONTROLLER_DATA,
			payloadVersion,
			{ expectResponse: true },
		);
		const parsed = parseControllerDataWithFallback(
			payload,
			this._protocolVersion,
			deviceId,
		);
		if (parsed.usedVersion !== this._protocolVersion) {
			this._protocolVersion = parsed.usedVersion;
		}
		return parsed.controller;
	}

	async _requestProfileList() {
		const payload = await this._sendPacket(
			0,
			PACKET_TYPES.REQUEST_PROFILE_LIST,
			Buffer.alloc(0),
			{ expectResponse: true },
		);
		return parseProfileNames(payload);
	}

	async _loadProfile(name) {
		await this._sendPacket(
			0,
			PACKET_TYPES.REQUEST_LOAD_PROFILE,
			packCString(name),
			{ expectResponse: false },
		);
	}

	async _saveProfile(name) {
		await this._sendPacket(
			0,
			PACKET_TYPES.REQUEST_SAVE_PROFILE,
			packCString(name),
			{ expectResponse: false },
		);
	}

	async _discoverLightsInternal() {
		await this._ensureSocket();
		const controllerCount = await this._requestControllerCount();
		const controllers = [];

		for (let i = 0; i < controllerCount; i++) {
			const controller = await this._requestControllerData(i);
			controllers.push(controller);
		}

		const usedExistingLightIds = new Set();
		const discoveredLights = [];
		for (const controller of controllers) {
			const existingLight = this._findExistingLightForController(
				controller,
				usedExistingLightIds,
			);
			if (existingLight) {
				usedExistingLightIds.add(String(existingLight.id));
			}
			const light = this._controllerToLight(controller, existingLight);
			discoveredLights.push(light);

		}
		this._setDiscoveredLights(discoveredLights);
		return this._lights;
	}

	_isMeaningfulIdentityPart(value) {
		const text = this._normalizeIdentityPart(value);
		if (!text) {
			return false;
		}
		return !["unknown", "n/a", "na", "none", "null", "undefined", "0"].includes(
			text,
		);
	}

	_normalizeIdentityPart(value) {
		return String(value ?? "")
			.trim()
			.toLowerCase()
			.replace(/\s+/g, " ");
	}

	_buildDeviceFingerprint(device = {}) {
		const name = this._normalizeIdentityPart(device.name);
		const vendor = this._normalizeIdentityPart(device.vendor);
		const description = this._normalizeIdentityPart(device.description);
		const serial = this._normalizeIdentityPart(device.serial);
		const location = this._normalizeIdentityPart(device.location);
		const firmwareVersion = this._normalizeIdentityPart(device.firmwareVersion);
		const deviceType = String(
			Number.isFinite(Number(device.deviceType)) ? Number(device.deviceType) : "",
		);
		const zoneCount = String(
			Number.isFinite(Number(device.zoneCount)) ? Number(device.zoneCount) : 0,
		);
		const ledCount = String(
			Number.isFinite(Number(device.ledCount)) ? Number(device.ledCount) : 0,
		);
		const zoneNames = Array.isArray(device.zones)
			? device.zones
					.map((zone) => this._normalizeIdentityPart(zone?.name))
					.filter(Boolean)
					.join("|")
			: "";

		let seed = "";
		if (this._isMeaningfulIdentityPart(serial)) {
			seed = `serial:${serial}|vendor:${vendor}|type:${deviceType}`;
		} else if (this._isMeaningfulIdentityPart(location)) {
			seed = `location:${location}|name:${name}|vendor:${vendor}|type:${deviceType}`;
		} else {
			seed = `name:${name}|vendor:${vendor}|description:${description}|fw:${firmwareVersion}|type:${deviceType}|zones:${zoneCount}|leds:${ledCount}|zoneNames:${zoneNames}`;
		}

		const hash = createHash("sha1").update(seed).digest("hex").slice(0, 16);
		return {
			fingerprint: `fp:${hash}`,
			seed,
		};
	}

	_buildStableLightId(controller) {
		const { fingerprint } = this._buildDeviceFingerprint(controller);
		let candidate = `openrgb-device-${fingerprint.replace(/^fp:/, "")}`;
		let suffix = 1;
		while (this._lights.some((light) => String(light.id) === candidate)) {
			candidate = `openrgb-device-${fingerprint.replace(/^fp:/, "")}-${suffix}`;
			suffix += 1;
		}
		return candidate;
	}

	_findExistingLightForController(controller, usedLightIds = new Set()) {
		const { fingerprint } = this._buildDeviceFingerprint(controller);

		const candidateLights = this._lights.filter(
			(light) => !usedLightIds.has(String(light.id)),
		);

		const fingerprintMatch = candidateLights.find((light) => {
			if (light.fingerprint && light.fingerprint === fingerprint) {
				return true;
			}
			const derived = this._buildDeviceFingerprint(light);
			return derived.fingerprint === fingerprint;
		});
		if (fingerprintMatch) {
			return fingerprintMatch;
		}

		return (
			candidateLights.find(
				(light) => Number(light.openrgbDeviceId) === Number(controller.id),
			) ||
			null
		);
	}

	_controllerToLight(controller, existingLight = null) {
		this._deviceLedCounts.set(controller.id, controller.ledCount || 1);
		this._deviceModes.set(controller.id, {
			activeMode: controller.activeMode,
			modes: Array.isArray(controller.modes) ? controller.modes : [],
		});
		const { fingerprint } = this._buildDeviceFingerprint(controller);

		const stableId = existingLight?.id ?? this._buildStableLightId(controller);

		return {
			id: stableId,
			openrgbDeviceId: controller.id,
			name: controller.name || `OpenRGB Device ${controller.id}`,
			serial: controller.serial || "",
			location: controller.location || "",
			vendor: controller.vendor || "",
			description: controller.description || "",
			firmwareVersion: controller.firmwareVersion || "",
			deviceType: controller.deviceType,
			ledCount: controller.ledCount,
			zoneCount: controller.zoneCount,
			modeCount: controller.modeCount,
			fingerprint,
		};
	}

	_setDiscoveredLights(discoveredLights) {
		const manualLights = this._lights.filter((light) => light.manual === true);
		const merged = new Map();

		for (const light of manualLights) {
			merged.set(String(light.id), { ...light });
		}
		for (const light of discoveredLights) {
			merged.set(String(light.id), { ...light });
		}

		this._lights = Array.from(merged.values()).sort((a, b) =>
			String(a.name || a.id).localeCompare(String(b.name || b.id)),
		);
	}

	_mergeLights(newLights) {
		const merged = new Map(
			this._lights.map((light) => [String(light.id), { ...light }]),
		);
		for (const light of newLights) {
			const key = String(light.id);
			merged.set(key, {
				...(merged.get(key) || {}),
				...light,
			});
		}
		this._lights = Array.from(merged.values()).sort((a, b) =>
			String(a.name || a.id).localeCompare(String(b.name || b.id)),
		);
	}

	_resolveDeviceIdFromAny(value) {
		if (value === null || value === undefined) {
			return null;
		}

		if (typeof value === "number" && Number.isFinite(value)) {
			return Math.floor(value);
		}

		if (typeof value === "object") {
			const byLightRef = this._resolveDeviceIdFromAny(
				value.id ?? value.lightId ?? value.openrgbLightId,
			);
			if (byLightRef !== null && byLightRef >= 0) {
				return byLightRef;
			}
			return this._resolveDeviceIdFromAny(
				value.openrgbDeviceId ?? value.deviceId ?? value.value,
			);
		}

		const text = String(value).trim();
		if (!text) {
			return null;
		}

		for (const light of this._lights) {
			if (String(light.id) === text) {
				const mapped = Math.floor(coerceNumber(light.openrgbDeviceId, NaN));
				if (Number.isFinite(mapped) && mapped >= 0) {
					return mapped;
				}
			}
		}

		if (/^\d+$/.test(text)) {
			return parseInt(text, 10);
		}

		return null;
	}

	_resolveDeviceIdsFromLights(lights, fallbackToAll = true) {
		const ids = new Set();
		const list = Array.isArray(lights) ? lights : normalizeListInput(lights);

		for (const item of list) {
			const deviceId = this._resolveDeviceIdFromAny(item);
			if (deviceId !== null && deviceId >= 0) {
				ids.add(deviceId);
			}
		}

		if (!ids.size && fallbackToAll) {
			for (const light of this._lights) {
				const deviceId = this._resolveDeviceIdFromAny(light);
				if (deviceId !== null && deviceId >= 0) {
					ids.add(deviceId);
				}
			}
		}

		return Array.from(ids.values());
	}

	_getDeviceModes(deviceId) {
		const entry = this._deviceModes.get(deviceId);
		if (!entry || !Array.isArray(entry.modes)) {
			return [];
		}
		return entry.modes;
	}

	_buildThemeModeOptions() {
		const options = [];

		for (const light of this._lights) {
			const deviceId = this._resolveDeviceIdFromAny(light);
			if (deviceId === null || deviceId < 0) {
				continue;
			}
			const modes = this._getDeviceModes(deviceId);
			for (const mode of modes) {
				const labelModeName = coerceString(mode?.name, `Mode ${mode?.index ?? 0}`);
				options.push({
					id: `openrgb-mode:${deviceId}:${mode.index}`,
					name: `${light.name || light.id}: ${labelModeName}`,
					parentId: light.id,
					deviceId,
					modeIndex: mode.index,
					modeName: labelModeName,
				});
			}
		}

		return options;
	}

	async _resolveModeSelectionForDevice(deviceId, selection, options = {}) {
		let modes = this._getDeviceModes(deviceId);
		const allowNetworkLookups = options.allowNetworkLookups !== false;
		if (!modes.length && allowNetworkLookups) {
			const controller = await this._requestControllerData(deviceId);
			this._deviceModes.set(deviceId, {
				activeMode: controller.activeMode,
				modes: Array.isArray(controller.modes) ? controller.modes : [],
			});
			modes = this._getDeviceModes(deviceId);
		}
		if (!modes.length) {
			return null;
		}

		const targetDeviceId =
			Number.isInteger(selection?.deviceId) && selection.deviceId >= 0
				? selection.deviceId
				: null;
		const targetModeIndex =
			Number.isInteger(selection?.modeIndex) && selection.modeIndex >= 0
				? selection.modeIndex
				: null;
		const targetModeName = normalizeModeName(selection?.modeName);

		if (targetDeviceId !== null && targetDeviceId === deviceId && targetModeIndex !== null) {
			return (
				modes.find((mode) => Number(mode?.index) === targetModeIndex) || null
			);
		}

		if (targetModeName) {
			const byName = modes.find(
				(mode) => normalizeModeName(mode?.name) === targetModeName,
			);
			if (byName) {
				return byName;
			}
		}

		if (targetModeIndex !== null) {
			const byIndex = modes.find(
				(mode) => Number(mode?.index) === targetModeIndex,
			);
			if (byIndex) {
				return byIndex;
			}
		}

		return null;
	}

	_storeControllerModeState(controller) {
		if (!controller || !Number.isFinite(controller.id)) {
			return;
		}
		this._deviceModes.set(controller.id, {
			activeMode: controller.activeMode,
			modes: Array.isArray(controller.modes) ? controller.modes : [],
		});
	}

	_isActiveModeMatch(controller, mode) {
		const activeMode = Number(controller?.activeMode);
		if (!Number.isFinite(activeMode)) {
			return false;
		}

		const targetIndex = Number(mode?.index);
		const targetId = Number(mode?.id);
		const targetValue = Number(mode?.value);

		if (
			(Number.isFinite(targetIndex) && activeMode === targetIndex) ||
			(Number.isFinite(targetId) && activeMode === targetId) ||
			(Number.isFinite(targetValue) && activeMode === targetValue)
		) {
			return true;
		}

		const modes = Array.isArray(controller?.modes) ? controller.modes : [];
		const activeModeEntry = modes.find((entry) => {
			const entryIndex = Number(entry?.index);
			const entryId = Number(entry?.id);
			const entryValue = Number(entry?.value);
			return (
				(Number.isFinite(entryIndex) && entryIndex === activeMode) ||
				(Number.isFinite(entryId) && entryId === activeMode) ||
				(Number.isFinite(entryValue) && entryValue === activeMode)
			);
		});
		if (!activeModeEntry) {
			return false;
		}

		return (
			Number(activeModeEntry?.index) === targetIndex ||
			normalizeModeName(activeModeEntry?.name) === normalizeModeName(mode?.name)
		);
	}

	_normalizeModeForApply(mode, deviceId) {
		const flags = Math.floor(coerceNumber(mode?.flags, 0)) >>> 0;
		const normalized = {
			...mode,
			colors: Array.isArray(mode?.colors)
				? mode.colors
						.map((color) => normalizeColor(color))
						.filter((color) => color !== null)
				: [],
		};
		const fallbackColor =
			this._deviceState.get(deviceId)?.lastNonBlackColor || { r: 255, g: 255, b: 255 };

		const brightness = coerceNumber(normalized.brightness, NaN);
		if (!Number.isFinite(brightness) || brightness <= 0) {
			const fallbackBrightness = clamp(
				Math.round(coerceNumber(normalized.brightnessMax, 100)),
				1,
				100,
			);
			normalized.brightness = fallbackBrightness;
		}

		const speed = coerceNumber(normalized.speed, NaN);
		if (!Number.isFinite(speed) || speed <= 0) {
			const fallbackSpeed = Math.max(
				1,
				Math.round(
					coerceNumber(
						normalized.speedMax,
						coerceNumber(normalized.speedMin, 100),
					),
				),
			);
			normalized.speed = fallbackSpeed;
		}

		const minColors = Math.max(0, Math.floor(coerceNumber(normalized.colorsMin, 0)));
		if (minColors > 0) {
			while (normalized.colors.length < minColors) {
				normalized.colors.push({ ...fallbackColor });
			}
			if (normalized.colors.every((color) => isBlackColor(color))) {
				normalized.colors[0] = { ...fallbackColor };
			}
		}

		return normalized;
	}

	async _applyModeUpdate(deviceIds, selection, options = {}) {
		const fireAndForget = options.fireAndForget === true;
		const skipConnectIfUnavailable = options.skipConnectIfUnavailable === true;
		const allowNetworkLookups = options.allowNetworkLookups !== false;
		let matchedMode = false;

		for (const deviceId of deviceIds) {
			const mode = await this._resolveModeSelectionForDevice(
				deviceId,
				selection,
				{ allowNetworkLookups },
			);
			if (!mode) {
				continue;
			}
			matchedMode = true;

			let beforeController = null;
			try {
				beforeController = await this._requestControllerData(deviceId);
				this._storeControllerModeState(beforeController);
			} catch {
				beforeController = null;
			}
			const modeForApply = this._normalizeModeForApply(mode, deviceId);
			const payload = packModePayload(modeForApply, this._protocolVersion);
			await this._sendPacket(
				deviceId,
				PACKET_TYPES.RGBCONTROLLER_UPDATEMODE,
				payload,
				{
					expectResponse: false,
					fireAndForget,
					skipConnectIfUnavailable,
				},
			);

			let applied = false;
			try {
				await sleep(60);
				const afterController = await this._requestControllerData(deviceId);
				this._storeControllerModeState(afterController);
				applied = this._isActiveModeMatch(afterController, mode);
			} catch {
				// Ignore verification read errors here; write already occurred.
			}
		}

		if (!matchedMode) {
			throw new Error(
				"No matching OpenRGB mode was found for the selected theme option.",
			);
		}
	}

	async _resolveLedCount(deviceId, options = {}) {
		if (this._deviceLedCounts.has(deviceId)) {
			return Math.max(1, this._deviceLedCounts.get(deviceId));
		}

		const allowNetworkLookups = options.allowNetworkLookups !== false;
		if (!allowNetworkLookups) {
			return 1;
		}

		const controller = await this._requestControllerData(deviceId);
		const ledCount = Math.max(1, controller.ledCount || 1);
		this._deviceLedCounts.set(deviceId, ledCount);
		return ledCount;
	}

	_normalizeTransitionMs(transition) {
		const parsed = coerceNumber(transition, 0);
		if (!Number.isFinite(parsed) || parsed <= 0) {
			return 0;
		}
		return clamp(Math.round(parsed), 0, MAX_TRANSITION_MS);
	}

	async _applyColorUpdate(deviceIds, update) {
		const normalizedColor = normalizeColor(update.color);
		const fireAndForget = update.fireAndForget === true;
		const skipConnectIfUnavailable = update.skipConnectIfUnavailable === true;
		const allowNetworkLookups = update.allowNetworkLookups !== false;
		const transitionMs = this._normalizeTransitionMs(update.transition);
		const transitionSteps = transitionMs
			? clamp(
					Math.round(transitionMs / TRANSITION_STEP_MS),
					1,
					MAX_TRANSITION_STEPS,
				)
			: 0;
		const transitionStepDelay = transitionSteps
			? Math.max(1, Math.round(transitionMs / transitionSteps))
			: 0;
		const plans = [];

		for (const deviceId of deviceIds) {
			const previous = this._deviceState.get(deviceId) || {
				color: { r: 255, g: 255, b: 255 },
				brightness: 100,
				power: true,
				lastNonBlackColor: { r: 255, g: 255, b: 255 },
			};

			const hasExplicitColor = normalizedColor !== null;
			const hasExplicitBrightness =
				update.brightness !== undefined && update.brightness !== null;
			const hasExplicitPower =
				update.power !== undefined && update.power !== null;

			let nextPower = hasExplicitPower
				? coerceBoolean(update.power, true)
				: previous.power;

			// If a new non-black color is provided without explicit power,
			// assume intent to turn the device on.
			if (
				!hasExplicitPower &&
				hasExplicitColor &&
				!isBlackColor(normalizedColor) &&
				previous.power === false
			) {
				nextPower = true;
			}

			let nextColor = hasExplicitColor ? normalizedColor : previous.color;

			// "Off" commands often include black; keep the previous on-color so
			// turning back on restores expected color behavior.
			if (!nextPower && hasExplicitColor && isBlackColor(normalizedColor)) {
				nextColor = previous.color;
			}

			let nextBrightness;
			if (hasExplicitBrightness) {
				nextBrightness = clamp(
					Math.round(coerceNumber(update.brightness, 100)),
					0,
					100,
				);
			} else if (hasExplicitColor && previous.brightness === 0) {
				// Recovery path after an off/zero-brightness state.
				nextBrightness = 100;
			} else {
				nextBrightness = previous.brightness;
			}

			let nextLastNonBlackColor = previous.lastNonBlackColor || previous.color;
			if (!isBlackColor(nextColor)) {
				nextLastNonBlackColor = nextColor;
			}

			const next = {
				color: nextColor,
				brightness: nextBrightness,
				power: nextPower,
				lastNonBlackColor: nextLastNonBlackColor,
			};

			const previousBaseColor =
				isBlackColor(previous.color) && previous.lastNonBlackColor
					? previous.lastNonBlackColor
					: previous.color;
			const previousOutputColor = previous.power
				? applyBrightness(previousBaseColor, previous.brightness)
				: { r: 0, g: 0, b: 0 };

			const nextBaseColor =
				isBlackColor(next.color) && next.lastNonBlackColor
					? next.lastNonBlackColor
					: next.color;
			const outputColor = next.power
				? applyBrightness(nextBaseColor, next.brightness)
				: { r: 0, g: 0, b: 0 };

			const ledCount = await this._resolveLedCount(deviceId, {
				allowNetworkLookups,
			});

			try {
				await this._sendPacket(
					deviceId,
					PACKET_TYPES.RGBCONTROLLER_SETCUSTOMMODE,
					Buffer.alloc(0),
					{
						expectResponse: false,
						fireAndForget,
						skipConnectIfUnavailable,
					},
				);
			} catch {
				// Some devices ignore custom mode calls; continue with LED write.
			}

			plans.push({
				deviceId,
				ledCount,
				fromColor: previousOutputColor,
				toColor: outputColor,
				nextState: next,
			});
		}

		if (!plans.length) {
			return;
		}

		const shouldFade = transitionSteps > 1;
		if (shouldFade) {
			const anyColorChange = plans.some(
				(plan) => !colorsEqual(plan.fromColor, plan.toColor),
			);
			if (anyColorChange) {
				for (let step = 1; step <= transitionSteps; step++) {
					const t = step / transitionSteps;
					for (const plan of plans) {
						const colorPayload = buildUpdateLedsPayload(
							plan.ledCount,
							lerpColor(plan.fromColor, plan.toColor, t),
						);
							await this._sendPacket(
								plan.deviceId,
								PACKET_TYPES.RGBCONTROLLER_UPDATELEDS,
								colorPayload,
								{
									expectResponse: false,
									fireAndForget,
									skipConnectIfUnavailable,
								},
							);
						}
					if (step < transitionSteps) {
						await sleep(transitionStepDelay);
					}
				}
			} else {
				for (const plan of plans) {
					const colorPayload = buildUpdateLedsPayload(
						plan.ledCount,
						plan.toColor,
					);
						await this._sendPacket(
							plan.deviceId,
							PACKET_TYPES.RGBCONTROLLER_UPDATELEDS,
							colorPayload,
							{
								expectResponse: false,
								fireAndForget,
								skipConnectIfUnavailable,
							},
						);
					}
				}
			} else {
			for (const plan of plans) {
				const colorPayload = buildUpdateLedsPayload(plan.ledCount, plan.toColor);
				await this._sendPacket(
					plan.deviceId,
					PACKET_TYPES.RGBCONTROLLER_UPDATELEDS,
					colorPayload,
					{
						expectResponse: false,
						fireAndForget,
						skipConnectIfUnavailable,
					},
				);
			}
		}

		for (const plan of plans) {
			this._deviceState.set(plan.deviceId, plan.nextState);
		}
	}

	async _handleLoadProfileAction(values) {
		const profileName = coerceString(values.profileName, "");
		if (!profileName) {
			throw new Error("Profile name is required.");
		}
		await this._loadProfile(profileName);
	}

	async _handleSaveProfileAction(values) {
		const profileName = coerceString(values.profileName, "");
		if (!profileName) {
			throw new Error("Profile name is required.");
		}
		await this._saveProfile(profileName);
	}
}

module.exports = OpenRGBPlugin;

```

## openrgb/manifest.json

```
{
	"id": "openrgb",
	"name": "OpenRGB",
	"version": "1.0.2",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://lumiastream.com",
	"repository": "",
	"description": "Control OpenRGB devices as Lumia lights and trigger OpenRGB profile actions (Corsair, Razer, ASUS, MSI, Gigabyte, ASRock, NZXT, SteelSeries, Logitech, HyperX, Cooler Master, and more).",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "lights",
	"keywords": "openrgb, rgb, led, lights, keyboard, mouse, motherboard, corsair, razer, asus, msi, gigabyte, asrock, nzxt, steelseries, logitech, hyperx, coolermaster",
	"icon": "openrgb.png",
	"config": {
		"settings": [
			{
				"key": "host",
				"label": "OpenRGB Host",
				"type": "text",
				"defaultValue": "127.0.0.1",
				"placeholder": "127.0.0.1",
				"required": true,
				"helperText": "Host running the OpenRGB SDK server."
			},
			{
				"key": "port",
				"label": "OpenRGB Port",
				"type": "number",
				"defaultValue": 6742,
				"required": true,
				"validation": {
					"min": 1,
					"max": 65535
				},
				"helperText": "Default OpenRGB SDK port is 6742."
			}
		],
		"settings_tutorial": "./settings_tutorial.md",
		"actions_tutorial": "./actions_tutorial.md",
		"lights": {
			"search": {
				"buttonLabel": "Discover OpenRGB Devices",
				"helperText": "Queries the OpenRGB SDK server for available RGB controllers."
			},
			"manualAdd": {
				"buttonLabel": "Add OpenRGB Device ID",
				"helperText": "Use this if discovery is blocked. Device ID is the zero-based index of the controller in OpenRGB's device list (top item = 0).",
				"fields": [
					{
						"key": "deviceId",
						"label": "OpenRGB Device ID",
						"type": "number",
						"required": true
					},
					{
						"key": "name",
						"label": "Custom Name (optional)",
						"type": "text",
						"required": false
					}
				]
			},
			"displayFields": [
				{
					"key": "name",
					"label": "Name"
				},
				{
					"key": "id",
					"label": "ID"
				},
				{
					"key": "location",
					"label": "Location",
					"fallback": "Unknown location"
				},
				{
					"key": "ledCount",
					"label": "LEDs",
					"fallback": "Unknown LED count"
				}
			],
			"emptyStateText": "No OpenRGB lights found yet. Run discovery or add a device ID manually."
		},
		"themeConfig": {
			"keyForThemes": "effects",
			"hasEffects": true,
			"sceneType": "light-theme",
			"showIndividualLights": true,
			"displayKey": "name"
		},
		"actions": [
			{
				"type": "load_profile",
				"label": "Load OpenRGB Profile",
				"description": "Load an OpenRGB profile by name.",
				"fields": [
					{
						"key": "profileName",
						"label": "Profile Name",
						"type": "select",
						"allowTyping": true,
						"allowVariables": true,
						"dynamicOptions": true,
						"options": [],
						"required": true,
						"placeholder": "example.orp"
					}
				]
			},
			{
				"type": "save_profile",
				"label": "Save OpenRGB Profile",
				"description": "Save an OpenRGB profile by name.",
				"fields": [
					{
						"key": "profileName",
						"label": "Profile Name",
						"type": "select",
						"allowTyping": true,
						"allowVariables": true,
						"dynamicOptions": true,
						"options": [],
						"required": true,
						"placeholder": "example.orp"
					}
				]
			}
		]
	}
}

```

## openrgb/package.json

```
{
	"name": "lumia-openrgb",
	"version": "1.0.0",
	"private": true,
	"description": "OpenRGB light integration plugin for Lumia Stream.",
	"main": "main.js",
	"dependencies": {
		"@lumiastream/plugin": "^0.4.1"
	}
}

```

## openrgb/settings_tutorial.md

```
---
1) Open **OpenRGB** and enable the **SDK Server**.
2) Confirm host/port (default `127.0.0.1:6742`).
3) Save these settings in Lumia and activate the plugin.
4) Use **Discover OpenRGB Devices** to import devices as selectable lights.
---
### Notes
- On remote hosts, allow incoming TCP to the OpenRGB SDK port.
- Some devices require a direct/custom mode before color writes. This plugin automatically attempts that.
---

```

## rumble/actions_tutorial.md

```
---
### Actions
This plugin runs automatically on the poll interval and does not expose actions.
---

```

## rumble/main.js

```
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
				username: message.username,
				displayname: message.username,
				message: message.text,
				avatar: message.avatar || undefined,
				messageId: `rumble-${message.timestamp}-${message.username}`,
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

## rumble/manifest.json

```
{
	"id": "rumble",
	"name": "Rumble",
	"version": "1.0.3",
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
				"acceptedVariables": [
					"followers",
					"stream_url",
					"title"
				],
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
				"acceptedVariables": [
					"rants",
					"rant_amount",
					"viewers",
					"title"
				],
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
				"acceptedVariables": [
					"likes",
					"stream_url",
					"title"
				],
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
				"acceptedVariables": [
					"dislikes",
					"stream_url",
					"title"
				],
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
				"acceptedVariables": [
					"subs",
					"stream_url",
					"title"
				],
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
				"acceptedVariables": [
					"sub_gifts",
					"stream_url",
					"title"
				],
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

## rumble/package.json

```
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

## rumble/settings_tutorial.md

```
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

## rumble/translations.json

```
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

## settings_showcase/main.js

```
const { Plugin } = require("@lumiastream/plugin");

const VARIABLE_NAMES = {
	saveCount: "save_count",
	lastSavedAt: "last_saved_at",
	lastSavedValuesJson: "last_saved_values_json",
};

const FIELD_SPECS = [
	{ key: "textField", label: "text", type: "text" },
	{ key: "numberField", label: "number", type: "number" },
	{ key: "selectField", label: "select", type: "select" },
	{
		key: "selectMultipleField",
		label: "select_multiple",
		type: "select",
		multiple: true,
	},
	{ key: "checkboxField", label: "checkbox", type: "checkbox" },
	{ key: "sliderField", label: "slider", type: "slider" },
	{ key: "hiddenTextField", label: "hidden_text", type: "text" },
	{ key: "groupedTextField", label: "grouped_text", type: "text" },
	{ key: "fileField", label: "file", type: "file" },
	{ key: "passwordField", label: "password", type: "password" },
	{ key: "toggleField", label: "toggle", type: "toggle" },
	{ key: "textareaField", label: "textarea", type: "textarea" },
	{ key: "emailField", label: "email", type: "email" },
	{ key: "urlField", label: "url", type: "url" },
	{ key: "colorField", label: "color", type: "color" },
	{ key: "jsonField", label: "json", type: "json" },
	{ key: "roiField", label: "roi", type: "roi" },
];

function asString(value, fallback = "") {
	if (typeof value === "string") {
		return value;
	}
	if (value === undefined || value === null) {
		return fallback;
	}
	return String(value);
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
		if (["1", "true", "yes", "on", "enabled"].includes(normalized)) {
			return true;
		}
		if (["0", "false", "no", "off", "disabled"].includes(normalized)) {
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

function asStringList(value) {
	if (!Array.isArray(value)) {
		return [];
	}
	const cleaned = value
		.map((item) => asString(item).trim())
		.filter((item) => item.length > 0);
	return Array.from(new Set(cleaned));
}

function asJsonValue(value) {
	if (value === undefined) {
		return null;
	}
	if (typeof value === "string") {
		const trimmed = value.trim();
		if (!trimmed.length) {
			return null;
		}
		try {
			return JSON.parse(trimmed);
		} catch {
			return { _invalidJson: trimmed };
		}
	}
	return value;
}

function asRoi(value) {
	const parsed = asJsonValue(value);
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		return null;
	}

	const unitToken = asString(parsed.unit, "ratio").toLowerCase();
	const unit = unitToken === "pixels" || unitToken === "px" ? "pixels" : "ratio";
	const max = unit === "ratio" ? 1 : Number.POSITIVE_INFINITY;
	const clamp = (input) => Math.max(0, Math.min(max, input));

	const x = clamp(asNumber(parsed.x, 0));
	const y = clamp(asNumber(parsed.y, 0));
	const width = clamp(asNumber(parsed.width, unit === "ratio" ? 1 : 500));
	const height = clamp(asNumber(parsed.height, unit === "ratio" ? 1 : 500));
	if (width <= 0 || height <= 0) {
		return null;
	}
	return { x, y, width, height, unit };
}

function normalizeValueByType(type, value, field = {}) {
	switch (type) {
		case "number":
		case "slider":
			return asNumber(value, 0);
		case "checkbox":
		case "toggle":
			return asBoolean(value, false);
		case "select":
			if (field?.multiple) {
				return asStringList(value);
			}
			return asString(value, "");
		case "json":
			return asJsonValue(value);
		case "roi":
			return asRoi(value);
		case "password": {
			const raw = asString(value, "");
			if (!raw.length) {
				return "";
			}
			return `***${raw.length} chars***`;
		}
		case "file":
		case "text":
		case "textarea":
		case "email":
		case "url":
		case "color":
		default:
			return asString(value, "");
	}
}

function formatForOutput(value) {
	if (typeof value === "string") {
		return value;
	}
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

function truncate(value, maxLength = 140) {
	const text = asString(value, "");
	if (text.length <= maxLength) {
		return text;
	}
	return `${text.slice(0, maxLength - 3)}...`;
}

class SettingsFieldShowcasePlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._saveCount = 0;
	}

	async onload() {
		await this.lumia.updateConnection(true);
		await this._log("[settings_field_showcase] Loaded.");
		await this._emitAllFieldValues(this.settings, { showToasts: false, reason: "load" });
	}

	async onunload() {
		await this.lumia.updateConnection(false);
	}

	async onsettingsupdate(settings) {
		await this._emitAllFieldValues(settings, { showToasts: true, reason: "save" });
	}

	async validateAuth() {
		return { ok: true };
	}

	async _emitAllFieldValues(settings, options = {}) {
		const showToasts = options.showToasts === true;
		const reason = asString(options.reason, "save");
		const snapshot = {};

		for (const field of FIELD_SPECS) {
			const normalized = normalizeValueByType(field.type, settings?.[field.key], field);
			const output = formatForOutput(normalized);
			snapshot[field.key] = normalized;

			await this._log(`[settings_field_showcase] ${field.label} (${field.key}) = ${output}`);

			if (showToasts) {
				await this.lumia.showToast({
					message: `${field.label}: ${truncate(output, 90)}`,
					time: 2600,
				});
			}
		}

		this._saveCount += 1;
		const savedAt = new Date().toISOString();

		await this.lumia.setVariable(VARIABLE_NAMES.saveCount, this._saveCount);
		await this.lumia.setVariable(VARIABLE_NAMES.lastSavedAt, savedAt);
		await this.lumia.setVariable(
			VARIABLE_NAMES.lastSavedValuesJson,
			JSON.stringify(
				{
					reason,
					savedAt,
					fields: snapshot,
				},
				null,
				2,
			),
		);

		if (showToasts) {
			await this.lumia.showToast({
				message: `Settings saved. Logged ${FIELD_SPECS.length} field values.`,
				time: 3500,
			});
		}
	}

	async _log(message) {
		await this.lumia.log(message);
	}
}

module.exports = SettingsFieldShowcasePlugin;

```

## settings_showcase/manifest.json

```
{
	"id": "settings_showcase",
	"name": "Settings Showcase",
	"version": "1.1.2",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://lumiastream.com",
	"repository": "",
	"description": "Example plugin demonstrating every available settings field type with logging/toasts on save.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "utilities",
	"icon": "settings_showcase.png",
	"config": {
		"settings_tutorial": "settings_tutorial.md",
		"settings": [
			{
				"key": "textField",
				"label": "Text Field",
				"type": "text",
				"section": "Basics",
				"sectionOrder": 1,
				"defaultValue": "Hello Lumia",
				"helperText": "Example of type `text`."
			},
			{
				"key": "numberField",
				"label": "Number Field",
				"type": "number",
				"section": "Basics",
				"sectionOrder": 1,
				"defaultValue": 42,
				"min": 0,
				"max": 1000,
				"helperText": "Example of type `number`."
			},
			{
				"key": "selectField",
				"label": "Select Field",
				"type": "select",
				"allowTyping": true,
				"section": "Basics",
				"sectionOrder": 1,
				"defaultValue": "custom",
				"options": [
					{
						"label": "Normal",
						"value": "normal"
					},
					{
						"label": "Custom",
						"value": "custom"
					},
					{
						"label": "Debug",
						"value": "debug"
					}
				],
				"helperText": "Example of type `select` with `allowTyping: true`."
			},
			{
				"key": "selectMultipleField",
				"label": "Select (Multiple) Field",
				"type": "select",
				"multiple": true,
				"allowTyping": true,
				"section": "Basics",
				"sectionOrder": 1,
				"defaultValue": [
					"valorant",
					"overwatch"
				],
				"options": [
					{
						"label": "Valorant",
						"value": "valorant"
					},
					{
						"label": "Rocket League",
						"value": "rocket_league"
					},
					{
						"label": "Overwatch",
						"value": "overwatch"
					},
					{
						"label": "League of Legends",
						"value": "league_of_legends"
					}
				],
				"helperText": "Example of type `select` with `multiple: true` and `allowTyping: true`."
			},
			{
				"key": "checkboxField",
				"label": "Checkbox Field",
				"type": "checkbox",
				"section": "Basics",
				"sectionOrder": 1,
				"defaultValue": true,
				"helperText": "Example of type `checkbox`."
			},
			{
				"key": "sliderField",
				"label": "Slider Field",
				"type": "slider",
				"section": "Basics",
				"sectionOrder": 1,
				"defaultValue": 65,
				"min": 0,
				"max": 100,
				"step": 1,
				"helperText": "Example of type `slider`."
			},
			{
				"key": "toggleField",
				"label": "Toggle Field",
				"type": "toggle",
				"section": "Visibility",
				"sectionOrder": 2,
				"defaultValue": true,
				"helperText": "Controls visibleIf examples below."
			},
			{
				"key": "hiddenTextField",
				"label": "Hidden Text Field",
				"type": "text",
				"section": "Visibility",
				"sectionOrder": 2,
				"hidden": true,
				"defaultValue": "hidden_default_value",
				"helperText": "Demonstrates `hidden: true`."
			},
			{
				"key": "groupedTextField",
				"label": "Grouped Text Field",
				"type": "text",
				"section": "Visibility",
				"sectionOrder": 2,
				"group": {
					"key": "visibility_group",
					"label": "Grouped Visibility Fields",
					"helperText": "This container demonstrates `group` and group-level `visibleIf`.",
					"visibleIf": {
						"key": "toggleField",
						"equals": true
					}
				},
				"defaultValue": "inside_group",
				"helperText": "Example of grouped field."
			},
			{
				"key": "fileField",
				"label": "File Field",
				"type": "file",
				"section": "Visibility",
				"sectionOrder": 2,
				"group": "visibility_group",
				"visibleIf": {
					"key": "toggleField",
					"equals": true
				},
				"helperText": "Example of type `file` with `visibleIf`."
			},
			{
				"key": "passwordField",
				"label": "Password Field",
				"type": "password",
				"section": "Visibility",
				"sectionOrder": 2,
				"group": "visibility_group",
				"defaultValue": "super_secret_value",
				"helperText": "Example of type `password`."
			},
			{
				"key": "textareaField",
				"label": "Textarea Field",
				"type": "textarea",
				"section": "Visibility",
				"sectionOrder": 2,
				"group": "visibility_group",
				"rows": 4,
				"defaultValue": "This is a multiline example.",
				"visibleIf": {
					"key": "checkboxField",
					"equals": true
				},
				"helperText": "Example of type `textarea` with `visibleIf`."
			},
			{
				"key": "emailField",
				"label": "Email Field",
				"type": "email",
				"section": "Advanced",
				"sectionOrder": 3,
				"defaultValue": "name@example.com",
				"helperText": "Example of type `email`."
			},
			{
				"key": "urlField",
				"label": "URL Field",
				"type": "url",
				"section": "Advanced",
				"sectionOrder": 3,
				"defaultValue": "https://lumiastream.com",
				"helperText": "Example of type `url`."
			},
			{
				"key": "colorField",
				"label": "Color Field",
				"type": "color",
				"section": "Advanced",
				"sectionOrder": 3,
				"defaultValue": "#33aaff",
				"helperText": "Example of type `color`."
			},
			{
				"key": "jsonField",
				"label": "JSON Field",
				"type": "json",
				"section": "Advanced",
				"sectionOrder": 3,
				"group": {
					"key": "advanced_detection_group",
					"label": "Advanced Detection Rules",
					"helperText": "Grouped advanced examples with custom JSON + ROI.",
					"order": 1
				},
				"rows": 8,
				"visibleIf": {
					"key": "selectField",
					"equals": "custom"
				},
				"defaultValue": {
					"rules": [
						{
							"name": "kill",
							"confidence": 0.9
						},
						{
							"name": "goal",
							"confidence": 0.92
						}
					],
					"cooldownMs": 1200
				},
				"helperText": "Example of type `json` with `visibleIf`."
			},
			{
				"key": "roiField",
				"label": "ROI Field",
				"type": "roi",
				"section": "Advanced",
				"sectionOrder": 3,
				"group": "advanced_detection_group",
				"visibleIf": {
					"key": "selectMultipleField",
					"equals": "valorant"
				},
				"defaultValue": {
					"x": 0.72,
					"y": 0.02,
					"width": 0.27,
					"height": 0.45,
					"unit": "ratio"
				},
				"helperText": "Example of type `roi` with `visibleIf` and array matching."
			}
		],
		"variables": [
			{
				"name": "save_count",
				"description": "How many times settings were saved/updated.",
				"value": 0
			},
			{
				"name": "last_saved_at",
				"description": "Timestamp of the last settings save.",
				"value": ""
			},
			{
				"name": "last_saved_values_json",
				"description": "JSON snapshot of values saved most recently.",
				"value": ""
			}
		],
		"alerts": [],
		"translations": "./translations.json"
	}
}

```

## settings_showcase/package.json

```
{
	"name": "lumia-settings-field-showcase",
	"version": "1.0.0",
	"private": true,
	"description": "Example Lumia plugin demonstrating roi/json/select+multiple/file/visibleIf settings.",
	"main": "main.js",
	"scripts": {},
	"dependencies": {
		"@lumiastream/plugin": "^0.4.2"
	}
}

```

## settings_showcase/settings_tutorial.md

```
### Settings Field Showcase

This example includes every supported settings field type:

- `text`
- `number`
- `select`
- `select` with `multiple: true`
- `allowTyping` on `select` for freeform values
- `checkbox`
- `slider`
- `file`
- `password`
- `toggle`
- `textarea`
- `email`
- `url`
- `color`
- `json`
- `roi`

It also demonstrates field metadata:

- `hidden`
- `section`
- `sectionOrder`
- `group` (object and string forms)
- `rows`
- `visibleIf`

When you save settings, the plugin:

- logs each value
- shows toast notifications
- updates `save_count`, `last_saved_at`, and `last_saved_values_json`

```

## settings_showcase/translations.json

```
{
	"en": {
		"save_count": "How many times settings were saved/updated.",
		"last_saved_at": "Timestamp of the last settings save.",
		"last_saved_values_json": "JSON snapshot of values saved most recently."
	}
}

```

## sound_trigger_alert/README.md

```
# Sound Trigger Alert Example

This plugin lets users upload a reference sound and trigger a Lumia alert when live audio matches it.

## Requirements

- FFmpeg installed and reachable by `ffmpeg` (or provide a full path in settings).
- A short reference audio clip (distinctive clips produce better matching).

## Recommended workflow

1. Run **List Capture Devices** and copy a device name/index if needed.
2. Configure **Reference Audio Map** with one or more named sounds.
3. Start with threshold `0.82` and cooldown `3000 ms`.
4. Enable **Log Similarity Scores** briefly while tuning.

## Notes

- Windows is the primary target:
  - mic/input uses `dshow`
  - output/loopback uses `wasapi`
- macOS/Linux are supported with FFmpeg backends (`avfoundation` / `pulse`) but may require device-specific setup.

```

## sound_trigger_alert/actions_tutorial.md

```
### Start Detection
Starts live listening with current settings.

### Stop Detection
Stops the FFmpeg capture process and analysis loop.

### List Capture Devices
Prints available capture devices to plugin logs for your current platform.

### Test Alert
Fires the `sound_detected` alert immediately using a test score.

```

## sound_trigger_alert/main.js

```
const { Plugin } = require("@lumiastream/plugin");
const { spawn } = require("child_process");
const fs = require("fs/promises");
const path = require("path");

const SAMPLE_RATE = 16000;
const MIN_REFERENCE_SECONDS = 0.3;
const MIN_ANALYSIS_SECONDS = 0.12;
const MIN_ANALYSIS_RMS = 0.0045;
const MIN_ANALYSIS_PEAK = 0.015;
const MIN_TRIGGER_RMS = 0.018;
const MIN_TRIGGER_PEAK = 0.07;
const DEFAULTS = {
	ffmpegPath: "ffmpeg",
	captureMode: "microphone",
	inputDevice: "",
	threshold: 0.82,
	cooldownMs: 3000,
	detectionIntervalMs: 700,
	maxReferenceSeconds: 6,
	autoStart: true,
	autoRestart: true,
	restartDelayMs: 2000,
	logSimilarity: false,
};

const FEATURE_BANDS_HZ = [
	90, 150, 240, 360, 520, 740, 1040, 1450, 2000, 2750, 3600, 4700, 6200,
];
const VARIABLE_NAMES = {
	status: "detector_status",
	referenceName: "reference_name",
	lastSimilarity: "last_similarity",
	lastMatchScore: "last_match_score",
	lastMatchTime: "last_match_time",
	referenceFile: "reference_file",
	captureDevice: "capture_device",
};

function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}

function toNumber(value, fallback) {
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

function toBoolean(value, fallback) {
	if (typeof value === "boolean") {
		return value;
	}
	if (typeof value === "string") {
		const normalized = value.trim().toLowerCase();
		if (["true", "1", "yes", "on"].includes(normalized)) return true;
		if (["false", "0", "no", "off"].includes(normalized)) return false;
	}
	return fallback;
}

function toString(value, fallback = "") {
	if (typeof value !== "string") {
		return fallback;
	}
	const trimmed = value.trim();
	return trimmed.length ? trimmed : fallback;
}

function toDeviceString(value, fallback = "") {
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed.length ? trimmed : fallback;
	}
	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}
	return fallback;
}

function computeRms(samples) {
	if (!(samples instanceof Float32Array) || samples.length === 0) {
		return 0;
	}
	let sum = 0;
	for (let i = 0; i < samples.length; i += 1) {
		const sample = samples[i];
		sum += sample * sample;
	}
	return Math.sqrt(sum / samples.length);
}

function computePeakAbs(samples) {
	if (!(samples instanceof Float32Array) || samples.length === 0) {
		return 0;
	}
	let peak = 0;
	for (let i = 0; i < samples.length; i += 1) {
		const abs = Math.abs(samples[i]);
		if (abs > peak) {
			peak = abs;
		}
	}
	return peak;
}

function computeActivity(samples) {
	if (!(samples instanceof Float32Array) || samples.length < 2) {
		return 0;
	}
	let sum = 0;
	for (let i = 1; i < samples.length; i += 1) {
		sum += Math.abs(samples[i] - samples[i - 1]);
	}
	return sum / (samples.length - 1);
}

function ratioScore(a, b) {
	if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) {
		return 0;
	}
	const ratio = Math.min(a, b) / Math.max(a, b);
	return clamp(Math.sqrt(ratio), 0, 1);
}

function normalizeVector(values) {
	let norm = 0;
	for (let i = 0; i < values.length; i += 1) {
		const v = values[i];
		norm += v * v;
	}
	norm = Math.sqrt(norm) || 1;
	const output = new Array(values.length);
	for (let i = 0; i < values.length; i += 1) {
		output[i] = values[i] / norm;
	}
	return output;
}

function cosineSimilarity(a, b) {
	if (
		!Array.isArray(a) ||
		!Array.isArray(b) ||
		a.length === 0 ||
		a.length !== b.length
	) {
		return 0;
	}
	let dot = 0;
	for (let i = 0; i < a.length; i += 1) {
		dot += a[i] * b[i];
	}
	return clamp(dot, 0, 1);
}

function trimSilence(samples) {
	if (!(samples instanceof Float32Array) || samples.length === 0) {
		return samples;
	}
	let maxAbs = 0;
	for (let i = 0; i < samples.length; i += 1) {
		const abs = Math.abs(samples[i]);
		if (abs > maxAbs) maxAbs = abs;
	}
	const threshold = Math.max(0.008, maxAbs * 0.08);
	let start = 0;
	let end = samples.length - 1;
	while (start < samples.length && Math.abs(samples[start]) < threshold) {
		start += 1;
	}
	while (end > start && Math.abs(samples[end]) < threshold) {
		end -= 1;
	}
	return samples.slice(start, end + 1);
}

function downsampleAverages(values, targetLength) {
	if (!Array.isArray(values) || values.length === 0 || targetLength <= 0) {
		return [];
	}
	if (values.length <= targetLength) {
		return values.slice();
	}
	const output = [];
	const stride = values.length / targetLength;
	for (let i = 0; i < targetLength; i += 1) {
		const start = Math.floor(i * stride);
		const end = Math.max(start + 1, Math.floor((i + 1) * stride));
		let sum = 0;
		for (let j = start; j < end && j < values.length; j += 1) {
			sum += values[j];
		}
		output.push(sum / (end - start));
	}
	return output;
}

function buildEnvelope(samples, parts = 48) {
	if (!(samples instanceof Float32Array) || samples.length === 0) {
		return [];
	}
	const output = [];
	const stride = samples.length / parts;
	for (let i = 0; i < parts; i += 1) {
		const start = Math.floor(i * stride);
		const end = Math.max(start + 1, Math.floor((i + 1) * stride));
		let sum = 0;
		for (let j = start; j < end && j < samples.length; j += 1) {
			sum += Math.abs(samples[j]);
		}
		output.push(sum / (end - start));
	}
	return output;
}

function buildEnvelopeDeltas(envelope, targetLength = 24) {
	if (!Array.isArray(envelope) || envelope.length < 2) {
		return [];
	}
	const deltas = [];
	for (let i = 1; i < envelope.length; i += 1) {
		deltas.push(Math.abs(envelope[i] - envelope[i - 1]));
	}
	return downsampleAverages(deltas, targetLength);
}

function goertzelPower(samples, offset, frameSize, coeff) {
	let s0 = 0;
	let s1 = 0;
	let s2 = 0;
	for (let i = 0; i < frameSize; i += 1) {
		s0 = samples[offset + i] + coeff * s1 - s2;
		s2 = s1;
		s1 = s0;
	}
	return s1 * s1 + s2 * s2 - coeff * s1 * s2;
}

function buildSpectralProfile(samples) {
	if (!(samples instanceof Float32Array) || samples.length < 1024) {
		return FEATURE_BANDS_HZ.map(() => 0);
	}
	const frameSize = 1024;
	const hop = 512;
	const coeffs = FEATURE_BANDS_HZ.map(
		(freq) => 2 * Math.cos((2 * Math.PI * freq) / SAMPLE_RATE),
	);
	const sums = FEATURE_BANDS_HZ.map(() => 0);
	let frameCount = 0;

	for (let offset = 0; offset + frameSize <= samples.length; offset += hop) {
		frameCount += 1;
		for (let i = 0; i < coeffs.length; i += 1) {
			const power = goertzelPower(samples, offset, frameSize, coeffs[i]);
			sums[i] += Math.log1p(Math.max(power, 0));
		}
	}

	if (frameCount === 0) return FEATURE_BANDS_HZ.map(() => 0);
	return sums.map((sum) => sum / frameCount);
}

function buildFeatureVector(rawSamples) {
	if (!(rawSamples instanceof Float32Array) || rawSamples.length === 0) {
		return [];
	}
	let rms = 0;
	for (let i = 0; i < rawSamples.length; i += 1) {
		rms += rawSamples[i] * rawSamples[i];
	}
	rms = Math.sqrt(rms / rawSamples.length) || 1;
	const normalizedSamples = new Float32Array(rawSamples.length);
	for (let i = 0; i < rawSamples.length; i += 1) {
		normalizedSamples[i] = clamp(rawSamples[i] / rms, -1, 1);
	}

	const envelope = buildEnvelope(normalizedSamples, 48);
	const envelopeSummary = downsampleAverages(envelope, 24);
	const envelopeDeltas = buildEnvelopeDeltas(envelope, 24);
	const spectral = buildSpectralProfile(normalizedSamples);
	return normalizeVector(spectral.concat(envelopeSummary, envelopeDeltas));
}

function decodeS16LEChunk(buffer) {
	const count = Math.floor(buffer.length / 2);
	const output = new Float32Array(count);
	for (let i = 0; i < count; i += 1) {
		output[i] = buffer.readInt16LE(i * 2) / 32768;
	}
	return output;
}

function mergeBuffers(buffers) {
	if (!Array.isArray(buffers) || buffers.length === 0) return Buffer.alloc(0);
	if (buffers.length === 1) return buffers[0];
	return Buffer.concat(buffers);
}

class CircularFloatBuffer {
	constructor(capacity) {
		this.capacity = Math.max(1, Math.floor(capacity));
		this.data = new Float32Array(this.capacity);
		this.size = 0;
		this.writeIndex = 0;
	}

	push(samples) {
		for (let i = 0; i < samples.length; i += 1) {
			this.data[this.writeIndex] = samples[i];
			this.writeIndex = (this.writeIndex + 1) % this.capacity;
			if (this.size < this.capacity) {
				this.size += 1;
			}
		}
	}

	getLatest(count) {
		if (this.size === 0 || count <= 0) return new Float32Array(0);
		const length = Math.min(count, this.size);
		const output = new Float32Array(length);
		let start = this.writeIndex - length;
		if (start < 0) start += this.capacity;
		for (let i = 0; i < length; i += 1) {
			output[i] = this.data[(start + i) % this.capacity];
		}
		return output;
	}
}

class SoundMatchTriggerPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._runtime = {
			running: false,
			startPromise: null,
			stopPromise: null,
			ffmpegProcess: null,
			buffer: null,
			leftoverBytes: Buffer.alloc(0),
			analysisTimer: null,
			analysisInProgress: false,
			lastTriggerAt: 0,
			lastSimilarityAt: 0,
			lastLoggedSimilarityAt: 0,
			restartTimer: null,
			stopRequested: false,
			settings: null,
			referenceProfiles: [],
			maxReferenceSampleCount: 0,
			stderrTail: [],
		};
	}

	async onload() {
		await this._setVariableSafe(VARIABLE_NAMES.status, "stopped");
		const settings = this._getSettingsSnapshot();
		if (settings.autoStart && settings.referenceEntries.length) {
			await this.startDetection("auto-start");
		}
	}

	async onunload() {
		await this.stopDetection("plugin unload");
	}

	async validateAuth(data = {}) {
		const mergedSettings = {
			...(this.settings || {}),
			...(data || {}),
		};
		const settings = this._getSettingsSnapshot(mergedSettings);

		if (!settings.referenceEntries.length) {
			return {
				ok: false,
				message:
					"Add at least one Reference Audio Map entry before activating.",
			};
		}

		const ffmpegVersion = await this._runCommand(
			settings.ffmpegPath,
			["-hide_banner", "-version"],
			10000,
		);
		if (ffmpegVersion.timedOut || ffmpegVersion.code !== 0) {
			const detail = String(
				ffmpegVersion.stderr || ffmpegVersion.error?.message || "",
			).trim();
			return {
				ok: false,
				message: `FFmpeg is not available at "${settings.ffmpegPath}". Install FFmpeg or set a valid FFmpeg Path.${detail ? ` ${detail}` : ""}`,
			};
		}

		const ffmpegSmoke = await this._runCommand(
			settings.ffmpegPath,
			[
				"-hide_banner",
				"-loglevel",
				"error",
				"-f",
				"lavfi",
				"-i",
				"anullsrc=r=16000:cl=mono",
				"-t",
				"0.1",
				"-f",
				"null",
				"-",
			],
			10000,
		);
		if (ffmpegSmoke.timedOut || ffmpegSmoke.code !== 0) {
			const detail = String(
				ffmpegSmoke.stderr || ffmpegSmoke.error?.message || "",
			).trim();
			return {
				ok: false,
				message: `FFmpeg was found but failed a runtime check.${detail ? ` ${detail}` : ""}`,
			};
		}

		const invalidReferences = [];
		for (const entry of settings.referenceEntries) {
			try {
				await this._loadReferenceEntryProfile(settings, entry);
			} catch (error) {
				const label = entry?.name || entry?.path || "unknown";
				invalidReferences.push(`${label}: ${this._errorMessage(error)}`);
			}
		}

		if (invalidReferences.length) {
			return {
				ok: false,
				message: `Reference map has invalid entries. ${invalidReferences[0]}`,
			};
		}

		return {
			ok: true,
			message: `FFmpeg check passed. ${settings.referenceEntries.length} reference sound(s) ready.`,
		};
	}

	async onsettingsupdate(settings, previousSettings = {}) {
		const next = this._getSettingsSnapshot(settings);
		const previous = this._getSettingsSnapshot(previousSettings);
		const affectDetection =
			next.referenceEntriesKey !== previous.referenceEntriesKey ||
			next.ffmpegPath !== previous.ffmpegPath ||
			next.captureMode !== previous.captureMode ||
			next.inputDevice !== previous.inputDevice ||
			next.maxReferenceSeconds !== previous.maxReferenceSeconds ||
			next.detectionIntervalMs !== previous.detectionIntervalMs;

		if (this._runtime.running && !next.autoStart) {
			await this.stopDetection("auto-start disabled");
			return;
		}

		if (this._runtime.running && affectDetection) {
			await this._restartDetection("capture settings changed");
			return;
		}

		if (
			!this._runtime.running &&
			next.autoStart &&
			next.referenceEntries.length
		) {
			await this.startDetection("settings update auto-start");
		}
	}

	async refreshSettingsOptions({ fieldKey, values, settings } = {}) {
		if (
			fieldKey &&
			fieldKey !== "inputDevice" &&
			fieldKey !== "captureMode" &&
			fieldKey !== "ffmpegPath"
		) {
			return;
		}
		if (typeof this.lumia?.updateSettingsFieldOptions !== "function") {
			return;
		}

		const previewSettings = {
			...(this.settings && typeof this.settings === "object"
				? this.settings
				: {}),
			...(settings && typeof settings === "object" ? settings : {}),
			...(values && typeof values === "object" ? values : {}),
		};
		const normalized = this._getSettingsSnapshot(previewSettings);
		const discoveredDevices = await this._discoverCaptureDevices(
			normalized,
			normalized.captureMode,
		);
		const selectedDevice = toDeviceString(
			values?.inputDevice ??
				settings?.inputDevice ??
				previewSettings?.inputDevice,
			"",
		);
		const options = this._toInputDeviceOptions(
			discoveredDevices,
			selectedDevice,
		);

		await this.lumia.updateSettingsFieldOptions({
			fieldKey: "inputDevice",
			options,
		});
	}

	async actions(config) {
		for (const action of config.actions || []) {
			const value = action?.value || {};
			switch (action?.type) {
				case "start_detection":
					await this.startDetection("action");
					break;
				case "stop_detection":
					await this.stopDetection("action");
					break;
				case "list_devices":
					await this._listCaptureDevices(value?.mode);
					break;
				case "test_alert":
					await this._triggerMatchAlert(
						clamp(toNumber(value?.score, 0.95), 0, 1),
						new Date().toISOString(),
						this._runtime.referenceProfiles[0] || null,
					);
					break;
				default:
					break;
			}
		}
	}

	async startDetection(reason = "manual") {
		if (this._runtime.running) {
			await this._log(`Detector already running (${reason}).`);
			return true;
		}
		if (this._runtime.startPromise) {
			return this._runtime.startPromise;
		}
		this._runtime.startPromise = this._startInternal(reason)
			.catch(async (error) => {
				await this._setVariableSafe(VARIABLE_NAMES.status, "error");
				await this._log(
					`Failed to start detector: ${this._errorMessage(error)}`,
					"error",
				);
				return false;
			})
			.finally(() => {
				this._runtime.startPromise = null;
			});
		return this._runtime.startPromise;
	}

	async stopDetection(reason = "manual") {
		if (!this._runtime.running && !this._runtime.ffmpegProcess) {
			await this._setVariableSafe(VARIABLE_NAMES.status, "stopped");
			return true;
		}
		if (this._runtime.stopPromise) {
			return this._runtime.stopPromise;
		}
		this._runtime.stopPromise = this._stopInternal(reason).finally(() => {
			this._runtime.stopPromise = null;
		});
		return this._runtime.stopPromise;
	}

	async _restartDetection(reason) {
		await this.stopDetection(`restart: ${reason}`);
		await this.startDetection(reason);
	}

	_getSettingsSnapshot(raw = this.settings || {}) {
		const captureMode =
			toString(raw.captureMode, DEFAULTS.captureMode).toLowerCase() === "system"
				? "system"
				: "microphone";
		const referenceEntries = this._normalizeReferenceEntries(
			raw.referenceAudioMap,
			raw.referenceAudioFile,
		);
		return {
			referenceEntries,
			referenceEntriesKey: this._serializeReferenceEntries(referenceEntries),
			ffmpegPath: toString(raw.ffmpegPath, DEFAULTS.ffmpegPath),
			captureMode,
			inputDevice: toDeviceString(raw.inputDevice),
			threshold: clamp(toNumber(raw.threshold, DEFAULTS.threshold), 0.4, 0.97),
			cooldownMs: Math.floor(
				clamp(toNumber(raw.cooldownMs, DEFAULTS.cooldownMs), 500, 60000),
			),
			detectionIntervalMs: Math.floor(
				clamp(
					toNumber(raw.detectionIntervalMs, DEFAULTS.detectionIntervalMs),
					200,
					5000,
				),
			),
			maxReferenceSeconds: clamp(
				toNumber(raw.maxReferenceSeconds, DEFAULTS.maxReferenceSeconds),
				1,
				30,
			),
			autoStart: toBoolean(raw.autoStart, DEFAULTS.autoStart),
			autoRestart: toBoolean(raw.autoRestart, DEFAULTS.autoRestart),
			restartDelayMs: Math.floor(
				clamp(
					toNumber(raw.restartDelayMs, DEFAULTS.restartDelayMs),
					500,
					30000,
				),
			),
			logSimilarity: toBoolean(raw.logSimilarity, DEFAULTS.logSimilarity),
		};
	}

	_normalizeReferenceEntries(rawMapValue, fallbackReferenceAudioFile) {
		let source = rawMapValue;
		if (typeof source === "string") {
			const trimmed = source.trim();
			if (!trimmed) {
				source = [];
			} else {
				try {
					source = JSON.parse(trimmed);
				} catch (_error) {
					source = [];
				}
			}
		}

		const output = [];
		const pushEntry = (rawEntry, fallbackName = "") => {
			if (rawEntry === undefined || rawEntry === null) {
				return;
			}

			if (typeof rawEntry === "string") {
				const filePath = toString(rawEntry);
				if (!filePath) return;
				const nameFromPath =
					path.parse(filePath).name || path.basename(filePath);
				const name = toString(fallbackName, nameFromPath);
				output.push({
					name,
					path: filePath,
				});
				return;
			}

			if (typeof rawEntry !== "object") {
				return;
			}

			const filePath = toString(
				rawEntry.path || rawEntry.filePath || rawEntry.value,
			);
			if (!filePath) return;
			const nameFromPath = path.parse(filePath).name || path.basename(filePath);
			const name = toString(
				rawEntry.name || rawEntry.label || fallbackName,
				nameFromPath,
			);
			output.push({
				name,
				path: filePath,
			});
		};

		if (Array.isArray(source)) {
			for (const entry of source) {
				pushEntry(entry);
			}
		} else if (source && typeof source === "object") {
			for (const [key, entry] of Object.entries(source)) {
				pushEntry(entry, key);
			}
		}

		const fallbackFilePath = toString(fallbackReferenceAudioFile);
		if (!output.length && fallbackFilePath) {
			pushEntry({
				name:
					path.parse(fallbackFilePath).name || path.basename(fallbackFilePath),
				path: fallbackFilePath,
			});
		}

		return output;
	}

	_serializeReferenceEntries(entries) {
		if (!Array.isArray(entries) || !entries.length) {
			return "";
		}
		return entries
			.map((entry) => `${entry.name}::${entry.path}`)
			.sort()
			.join("|");
	}

	async _startInternal(reason) {
		const settings = this._getSettingsSnapshot();
		if (!settings.referenceEntries.length) {
			await this._log(
				"At least one reference audio mapping is required before starting detection.",
				"warn",
			);
			await this._setVariableSafe(VARIABLE_NAMES.status, "stopped");
			return false;
		}

		const referenceProfiles = await this._loadReferenceProfiles(settings);
		const capture = this._buildCaptureConfig(settings);
		const maxReferenceSampleCount = Math.max(
			...referenceProfiles.map((entry) => entry.sampleCount),
		);
		const bufferCapacity = Math.max(
			maxReferenceSampleCount * 2,
			SAMPLE_RATE * 20,
		);

		this._runtime.running = true;
		this._runtime.stopRequested = false;
		this._runtime.settings = settings;
		this._runtime.buffer = new CircularFloatBuffer(bufferCapacity);
		this._runtime.leftoverBytes = Buffer.alloc(0);
		this._runtime.analysisInProgress = false;
		this._runtime.lastTriggerAt = 0;
		this._runtime.lastSimilarityAt = 0;
		this._runtime.lastLoggedSimilarityAt = 0;
		this._runtime.referenceProfiles = referenceProfiles;
		this._runtime.maxReferenceSampleCount = maxReferenceSampleCount;
		this._runtime.stderrTail = [];

		if (this._runtime.restartTimer) {
			clearTimeout(this._runtime.restartTimer);
			this._runtime.restartTimer = null;
		}

		const proc = spawn(settings.ffmpegPath, capture.args, {
			stdio: ["ignore", "pipe", "pipe"],
		});
		this._runtime.ffmpegProcess = proc;

		proc.stdout.on("data", (chunk) => {
			this._onAudioChunk(chunk);
		});

		proc.stderr.on("data", (chunk) => {
			const text = String(chunk || "").trim();
			if (!text) return;
			this._runtime.stderrTail.push(text);
			if (this._runtime.stderrTail.length > 20) {
				this._runtime.stderrTail.shift();
			}
		});

		proc.on("error", async (error) => {
			await this._log(
				`Capture process error: ${this._errorMessage(error)}`,
				"error",
			);
		});

		proc.on("exit", (code, signal) => {
			this._onCaptureExit(code, signal).catch(() => {});
		});

		this._runtime.analysisTimer = setInterval(() => {
			if (this._runtime.analysisInProgress || !this._runtime.running) return;
			this._runtime.analysisInProgress = true;
			this._analyzeLatestWindow()
				.catch(async (error) => {
					await this._log(
						`Analysis error: ${this._errorMessage(error)}`,
						"error",
					);
				})
				.finally(() => {
					this._runtime.analysisInProgress = false;
				});
		}, settings.detectionIntervalMs);

		await this._setVariableSafe(VARIABLE_NAMES.status, "running");
		await this._setVariableSafe(
			VARIABLE_NAMES.referenceName,
			referenceProfiles[0]?.name || "",
		);
		await this._setVariableSafe(
			VARIABLE_NAMES.referenceFile,
			referenceProfiles[0]?.fileLabel || "",
		);
		await this._setVariableSafe(VARIABLE_NAMES.captureDevice, capture.label);
		await this._setVariableSafe(VARIABLE_NAMES.lastSimilarity, 0);
		await this._log(
			`Detector started (${reason}). Loaded ${referenceProfiles.length} reference sounds, mode=${settings.captureMode}, device=${capture.label}`,
		);
		return true;
	}

	async _stopInternal(reason) {
		this._runtime.stopRequested = true;

		if (this._runtime.restartTimer) {
			clearTimeout(this._runtime.restartTimer);
			this._runtime.restartTimer = null;
		}
		if (this._runtime.analysisTimer) {
			clearInterval(this._runtime.analysisTimer);
			this._runtime.analysisTimer = null;
		}

		const proc = this._runtime.ffmpegProcess;
		this._runtime.ffmpegProcess = null;
		if (proc) {
			proc.removeAllListeners("exit");
			try {
				proc.kill("SIGTERM");
			} catch (_error) {}
			await new Promise((resolve) => setTimeout(resolve, 120));
			if (!proc.killed) {
				try {
					proc.kill("SIGKILL");
				} catch (_error) {}
			}
		}

		this._runtime.running = false;
		this._runtime.buffer = null;
		this._runtime.leftoverBytes = Buffer.alloc(0);
		this._runtime.referenceProfiles = [];
		this._runtime.maxReferenceSampleCount = 0;
		this._runtime.settings = null;
		await this._setVariableSafe(VARIABLE_NAMES.status, "stopped");
		await this._log(`Detector stopped (${reason}).`);
		return true;
	}

	_onAudioChunk(chunk) {
		if (!this._runtime.running || !this._runtime.buffer) {
			return;
		}
		const combined = this._runtime.leftoverBytes.length
			? Buffer.concat([this._runtime.leftoverBytes, chunk])
			: chunk;
		const usableBytes = combined.length - (combined.length % 2);
		if (usableBytes <= 0) {
			this._runtime.leftoverBytes = combined;
			return;
		}
		this._runtime.leftoverBytes = combined.slice(usableBytes);
		const pcm = decodeS16LEChunk(combined.subarray(0, usableBytes));
		this._runtime.buffer.push(pcm);
	}

	async _analyzeLatestWindow() {
		const runtime = this._runtime;
		if (
			!runtime.running ||
			!runtime.buffer ||
			runtime.maxReferenceSampleCount <= 0 ||
			!runtime.referenceProfiles.length
		) {
			return;
		}

		let bestMatch = null;
		const analysisBySampleCount = new Map();
		for (const reference of runtime.referenceProfiles) {
			if (!reference || !reference.sampleCount) continue;
			let analysis = analysisBySampleCount.get(reference.sampleCount);
			if (!analysis) {
				const samples = runtime.buffer.getLatest(reference.sampleCount);
				if (samples.length < reference.sampleCount) {
					continue;
				}

				const trimmed = trimSilence(samples);
				const minLiveSamples = Math.max(
					Math.floor(SAMPLE_RATE * MIN_ANALYSIS_SECONDS),
					Math.floor(reference.sampleCount * 0.2),
				);
				const rms = computeRms(trimmed);
				const peak = computePeakAbs(trimmed);
				const activity = computeActivity(trimmed);
				const feature =
					trimmed.length >= minLiveSamples &&
					rms >= MIN_ANALYSIS_RMS &&
					peak >= MIN_ANALYSIS_PEAK
						? buildFeatureVector(trimmed)
						: [];
				analysis = { feature, rms, peak, activity };
				analysisBySampleCount.set(reference.sampleCount, analysis);
			}
			if (!analysis.feature.length) {
				continue;
			}

			const baseSimilarity = cosineSimilarity(
				reference.feature,
				analysis.feature,
			);
			const energyScore = ratioScore(analysis.rms, reference.rms);
			const peakScore = ratioScore(analysis.peak, reference.peak);
			const activityScore = ratioScore(analysis.activity, reference.activity);
			const profileSimilarity = clamp(
				energyScore * 0.4 + peakScore * 0.3 + activityScore * 0.3,
				0,
				1,
			);
			const effectiveSimilarity = clamp(
				baseSimilarity * (0.85 + profileSimilarity * 0.15),
				0,
				1,
			);

			if (
				!bestMatch ||
				effectiveSimilarity > bestMatch.effectiveSimilarity
			) {
				bestMatch = {
					reference,
					baseSimilarity,
					effectiveSimilarity,
					profileSimilarity,
					liveRms: analysis.rms,
					livePeak: analysis.peak,
				};
			}
		}

		if (!bestMatch) {
			return;
		}

		const similarity = bestMatch.baseSimilarity;
		const now = Date.now();

		if (now - runtime.lastSimilarityAt > 1000) {
			runtime.lastSimilarityAt = now;
			await this._setVariableSafe(
				VARIABLE_NAMES.lastSimilarity,
				Number(similarity.toFixed(4)),
			);
		}

		if (
			runtime.settings?.logSimilarity &&
			now - runtime.lastLoggedSimilarityAt > 1000
		) {
			runtime.lastLoggedSimilarityAt = now;
			const profileGate = clamp(0.45 + runtime.settings.threshold * 0.2, 0.55, 0.75);
			await this._log(
				`Best similarity=${similarity.toFixed(4)} (effective=${bestMatch.effectiveSimilarity.toFixed(4)} profile=${bestMatch.profileSimilarity.toFixed(3)} gate=${profileGate.toFixed(3)} rms=${bestMatch.liveRms.toFixed(4)} peak=${bestMatch.livePeak.toFixed(4)}) threshold=${runtime.settings.threshold} reference=${bestMatch.reference.name}`,
			);
		}

		if (similarity < runtime.settings.threshold) {
			return;
		}
		const profileGate = clamp(0.45 + runtime.settings.threshold * 0.2, 0.55, 0.75);
		if (bestMatch.profileSimilarity < profileGate) {
			return;
		}
		if (bestMatch.liveRms < MIN_TRIGGER_RMS || bestMatch.livePeak < MIN_TRIGGER_PEAK) {
			return;
		}
		if (now - runtime.lastTriggerAt < runtime.settings.cooldownMs) {
			return;
		}

		runtime.lastTriggerAt = now;
		await this._triggerMatchAlert(
			similarity,
			new Date(now).toISOString(),
			bestMatch.reference,
		);
	}

	async _triggerMatchAlert(similarity, timestampIso, referenceMatch = null) {
		const runtime = this._runtime;
		const score = Number(similarity.toFixed(4));
		const fallbackReference =
			referenceMatch ||
			runtime.referenceProfiles[0] ||
			this._getSettingsSnapshot().referenceEntries[0] ||
			null;
		const referenceFile =
			fallbackReference?.fileLabel ||
			path.basename(fallbackReference?.path || "");
		const referenceName =
			fallbackReference?.name || path.parse(referenceFile || "").name || "";
		const variationValue = referenceName || referenceFile;
		const captureDevice = this._captureLabel(
			runtime.settings || this._getSettingsSnapshot(),
		);

		await this._setVariableSafe(VARIABLE_NAMES.lastMatchScore, score);
		await this._setVariableSafe(VARIABLE_NAMES.lastMatchTime, timestampIso);
		await this._setVariableSafe(VARIABLE_NAMES.referenceName, referenceName);
		await this._setVariableSafe(VARIABLE_NAMES.referenceFile, referenceFile);
		await this._setVariableSafe(VARIABLE_NAMES.captureDevice, captureDevice);

		try {
			await this.lumia.triggerAlert({
				alert: "sound_detected",
				dynamic: {
					name: "value",
					value: variationValue,
				},
				extraSettings: {
					reference_name: referenceName,
					last_match_score: score,
					last_match_time: timestampIso,
					reference_file: referenceFile,
					capture_device: captureDevice,
				},
				showInEventList: false,
			});
		} catch (error) {
			const errorMessage = this._errorMessage(error);
			await this._log(`Failed to trigger alert: ${errorMessage}`, "error");
			await this._toast(
				`Sound Trigger Alert failed to fire alert: ${errorMessage}`,
			);
			return;
		}

		await this._log(
			`Sound matched: score=${score} reference=${referenceName} file=${referenceFile} variation=${variationValue} device=${captureDevice}`,
		);
	}

	async _onCaptureExit(code, signal) {
		if (!this._runtime.running) {
			return;
		}
		const settings = this._runtime.settings || this._getSettingsSnapshot();
		const stderrSummary = this._runtime.stderrTail.slice(-5).join(" | ");

		this._runtime.running = false;
		this._runtime.ffmpegProcess = null;
		if (this._runtime.analysisTimer) {
			clearInterval(this._runtime.analysisTimer);
			this._runtime.analysisTimer = null;
		}

		if (this._runtime.stopRequested) {
			await this._setVariableSafe(VARIABLE_NAMES.status, "stopped");
			return;
		}

		await this._log(
			`Capture exited (code=${code ?? "null"}, signal=${signal ?? "null"}). ${stderrSummary}`,
			"warn",
		);

		if (!settings.autoRestart) {
			await this._setVariableSafe(VARIABLE_NAMES.status, "error");
			return;
		}

		await this._setVariableSafe(VARIABLE_NAMES.status, "restarting");
		this._runtime.restartTimer = setTimeout(() => {
			this.startDetection("auto-restart after capture exit").catch(() => {});
		}, settings.restartDelayMs);
	}

	async _loadReferenceProfiles(settings) {
		const output = [];
		for (const entry of settings.referenceEntries) {
			try {
				output.push(await this._loadReferenceEntryProfile(settings, entry));
			} catch (error) {
				const label = entry?.name || entry?.path || "unknown";
				await this._log(
					`Skipping reference "${label}": ${this._errorMessage(error)}`,
					"warn",
				);
			}
		}

		if (!output.length) {
			throw new Error("No valid reference audio mappings were loaded.");
		}

		return output;
	}

	async _loadReferenceEntryProfile(settings, entry) {
		const filePath = entry.path;
		await fs.access(filePath);

		const decodeArgs = [
			"-hide_banner",
			"-loglevel",
			"error",
			"-i",
			filePath,
			"-t",
			String(settings.maxReferenceSeconds),
			"-ac",
			"1",
			"-ar",
			String(SAMPLE_RATE),
			"-f",
			"s16le",
			"pipe:1",
		];
		const result = await this._runCommand(
			settings.ffmpegPath,
			decodeArgs,
			30000,
		);
		if (result.code !== 0 || !result.stdout.length) {
			throw new Error(
				`Unable to decode reference file. Verify FFmpeg path and file format. ${result.stderr || ""}`.trim(),
			);
		}

		let samples = decodeS16LEChunk(result.stdout);
		samples = trimSilence(samples);

		const minSamples = Math.floor(MIN_REFERENCE_SECONDS * SAMPLE_RATE);
		if (samples.length < minSamples) {
			throw new Error(
				`Reference audio is too short after trimming silence. Minimum is ${MIN_REFERENCE_SECONDS} seconds.`,
			);
		}

		const feature = buildFeatureVector(samples);
		if (!feature.length) {
			throw new Error("Reference audio feature extraction failed.");
		}

		return {
			name: toString(
				entry.name,
				path.parse(filePath).name || path.basename(filePath),
			),
			filePath,
			feature,
			rms: computeRms(samples),
			peak: computePeakAbs(samples),
			activity: computeActivity(samples),
			sampleCount: samples.length,
			durationSeconds: samples.length / SAMPLE_RATE,
			fileLabel: path.basename(filePath),
		};
	}

	_buildCaptureConfig(settings) {
		const platform = process.platform;
		const mode = settings.captureMode;
		const ffmpegArgs = ["-hide_banner", "-loglevel", "error"];

		if (platform === "win32") {
			if (mode === "system") {
				const input = settings.inputDevice || "default";
				ffmpegArgs.push("-f", "wasapi", "-i", input);
			} else {
				const source = settings.inputDevice
					? settings.inputDevice.startsWith("audio=")
						? settings.inputDevice
						: `audio=${settings.inputDevice}`
					: "audio=default";
				ffmpegArgs.push("-f", "dshow", "-i", source);
			}
		} else if (platform === "darwin") {
			const input = settings.inputDevice || "0";
			const source = input.includes(":") ? input : `:${input}`;
			ffmpegArgs.push("-f", "avfoundation", "-i", source);
		} else if (platform === "linux") {
			const source = settings.inputDevice || "default";
			ffmpegArgs.push("-f", "pulse", "-i", source);
		} else {
			const source = settings.inputDevice || "default";
			ffmpegArgs.push("-f", "pulse", "-i", source);
		}

		ffmpegArgs.push(
			"-ac",
			"1",
			"-ar",
			String(SAMPLE_RATE),
			"-f",
			"s16le",
			"pipe:1",
		);
		return {
			args: ffmpegArgs,
			label: this._captureLabel(settings),
		};
	}

	_captureLabel(settings) {
		const mode = settings?.captureMode === "system" ? "system" : "microphone";
		const device = settings?.inputDevice || "default";
		return `${mode}:${device}`;
	}

	_toInputDeviceOptions(devices, selectedDevice = "") {
		const byValue = new Map();
		const add = (label, value) => {
			const normalizedValue =
				typeof value === "string" ? value : String(value ?? "");
			if (byValue.has(normalizedValue)) {
				return;
			}
			byValue.set(normalizedValue, {
				label: toString(label, normalizedValue || "Default"),
				value: normalizedValue,
			});
		};

		add("Default", "");
		for (const device of devices || []) {
			if (!device || typeof device !== "object") continue;
			const value = toString(device.value);
			if (!value) continue;
			add(toString(device.label, value), value);
		}
		if (selectedDevice && !byValue.has(selectedDevice)) {
			add(selectedDevice, selectedDevice);
		}

		return Array.from(byValue.values());
	}

	async _discoverCaptureDevices(settings, modeInput = "auto") {
		const mode =
			modeInput && modeInput !== "auto" ? modeInput : settings.captureMode;
		const ffmpegPath = settings.ffmpegPath;
		const platform = process.platform;
		const output = [];
		const pushOption = (value, label = value) => {
			const normalizedValue = toString(value);
			if (!normalizedValue) return;
			output.push({
				value: normalizedValue,
				label: toString(label, normalizedValue),
			});
		};

		if (platform === "win32") {
			if (mode === "system") {
				const result = await this._runCommand(
					ffmpegPath,
					[
						"-hide_banner",
						"-list_devices",
						"true",
						"-f",
						"wasapi",
						"-i",
						"dummy",
					],
					15000,
				);
				for (const value of this._parseQuotedDeviceLines(result.stderr)) {
					pushOption(value);
				}
			} else {
				const result = await this._runCommand(
					ffmpegPath,
					[
						"-hide_banner",
						"-list_devices",
						"true",
						"-f",
						"dshow",
						"-i",
						"dummy",
					],
					15000,
				);
				for (const value of this._parseQuotedDeviceLines(result.stderr)) {
					pushOption(value);
				}
			}
		} else if (platform === "darwin") {
			const result = await this._runCommand(
				ffmpegPath,
				[
					"-hide_banner",
					"-f",
					"avfoundation",
					"-list_devices",
					"true",
					"-i",
					"",
				],
				15000,
			);
			const lines = String(result.stderr || "").split(/\r?\n/);
			let section = "";
			for (const rawLine of lines) {
				const line = rawLine.trim();
				if (!line) continue;
				if (/AVFoundation video devices/i.test(line)) {
					section = "video";
					continue;
				}
				if (/AVFoundation audio devices/i.test(line)) {
					section = "audio";
					continue;
				}
				// Sound Trigger Alert only records audio on macOS.
				if (section !== "audio") {
					continue;
				}
				const match = line.match(/\[(\d+)\]\s*(.+)$/);
				if (!match) continue;
				const index = match[1];
				const name = match[2];
				pushOption(index, `${index}: ${name}`);
			}
		} else if (platform === "linux") {
			const pactlResult = await this._runCommand(
				"pactl",
				["list", "short", "sources"],
				10000,
			);
			if (pactlResult.code === 0 && pactlResult.stdout.length) {
				const lines = pactlResult.stdout
					.toString()
					.split(/\r?\n/)
					.map((line) => line.trim())
					.filter(Boolean);
				for (const line of lines) {
					const parts = line.split(/\t+/).filter(Boolean);
					const sourceName = toString(parts[1] || parts[0]);
					if (!sourceName) continue;
					pushOption(sourceName, sourceName);
				}
			} else {
				const ffmpegResult = await this._runCommand(
					ffmpegPath,
					["-hide_banner", "-sources", "pulse"],
					15000,
				);
				const lines = String(ffmpegResult.stderr || "")
					.split(/\r?\n/)
					.map((line) => line.trim())
					.filter(Boolean);
				for (const line of lines) {
					const match = line.match(/^\*\s+(.+)$/);
					const value = toString((match && match[1]) || line);
					if (!value) continue;
					pushOption(value, value);
				}
			}
		}

		const deduped = new Map();
		for (const item of output) {
			if (!deduped.has(item.value)) {
				deduped.set(item.value, item);
			}
		}
		return Array.from(deduped.values());
	}

	async _listCaptureDevices(modeInput = "auto") {
		const settings = this._getSettingsSnapshot();
		const mode =
			modeInput && modeInput !== "auto" ? modeInput : settings.captureMode;
		const options = await this._discoverCaptureDevices(settings, mode);
		const outputLines = options.map(
			(entry) =>
				`${entry.value}${entry.label && entry.label !== entry.value ? ` (${entry.label})` : ""}`,
		);

		if (!outputLines.length) {
			await this._log(
				"No capture devices found or FFmpeg/PulseAudio is unavailable.",
				"warn",
			);
			await this._toast("No devices listed. Check plugin logs.");
			return;
		}

		await this._log(`Available ${mode} devices:\n${outputLines.join("\n")}`);
		await this._toast(`Found ${outputLines.length} devices. See logs.`);
	}

	_parseQuotedDeviceLines(text) {
		const lines = String(text || "")
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter(Boolean);
		const matches = [];
		for (const line of lines) {
			const quoted = line.match(/"([^"]+)"/g);
			if (!quoted || !quoted.length) continue;
			for (const item of quoted) {
				const value = item.replace(/"/g, "");
				if (value && !matches.includes(value)) {
					matches.push(value);
				}
			}
		}
		return matches;
	}

	async _runCommand(command, args, timeoutMs = 10000) {
		return new Promise((resolve) => {
			const proc = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
			const stdoutChunks = [];
			const stderrChunks = [];
			let timedOut = false;
			const timer = setTimeout(() => {
				timedOut = true;
				try {
					proc.kill("SIGKILL");
				} catch (_error) {}
			}, timeoutMs);

			proc.stdout.on("data", (chunk) => stdoutChunks.push(chunk));
			proc.stderr.on("data", (chunk) => stderrChunks.push(chunk));
			proc.on("error", (error) => {
				clearTimeout(timer);
				resolve({
					code: -1,
					stdout: mergeBuffers(stdoutChunks),
					stderr: String(mergeBuffers(stderrChunks) || ""),
					error,
					timedOut,
				});
			});
			proc.on("close", (code) => {
				clearTimeout(timer);
				resolve({
					code,
					stdout: mergeBuffers(stdoutChunks),
					stderr: String(mergeBuffers(stderrChunks) || ""),
					timedOut,
				});
			});
		});
	}

	async _setVariableSafe(name, value) {
		try {
			await this.lumia.setVariable(name, value);
		} catch (_error) {}
	}

	async _toast(message) {
		try {
			await this.lumia.showToast({ message, time: 3500 });
		} catch (_error) {}
	}

	async _log(message, level = "info") {
		try {
			await this.lumia.log({ message: `[SoundMatch] ${message}`, level });
		} catch (_error) {}
	}

	_errorMessage(error) {
		if (error instanceof Error) return error.message;
		return String(error);
	}
}

module.exports = SoundMatchTriggerPlugin;

```

## sound_trigger_alert/manifest.json

```
{
	"id": "sound_trigger_alert",
	"name": "Sound Trigger Alert",
	"version": "1.0.0",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "",
	"repository": "",
	"description": "Upload a reference sound, listen to live audio, and trigger Lumia alerts when that sound is detected.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "audio",
	"keywords": "audio, sound detection, trigger, microphone, wasapi, ffmpeg",
	"icon": "",
	"config": {
		"settings": [
			{
				"key": "referenceAudioMap",
				"label": "Reference Audio Map",
				"type": "named_map",
				"section": "General",
				"sectionOrder": 1,
				"valueType": "file",
				"valueKey": "path",
				"valueLabel": "Audio File",
				"outputMode": "array",
				"required": true,
				"helperText": "Add one or more named sounds to detect."
			},
			{
				"key": "ffmpegPath",
				"label": "FFmpeg Path",
				"type": "text",
				"section": "Advanced",
				"sectionOrder": 2,
				"group": {
					"key": "advanced_runtime",
					"label": "Advanced Runtime",
					"helperText": "Only change these if you need custom FFmpeg/runtime tuning."
				},
				"refreshOnChange": true,
				"defaultValue": "ffmpeg",
				"helperText": "Binary path or command name. Install FFmpeg if detection fails to start."
			},
			{
				"key": "captureMode",
				"label": "Capture Mode",
				"type": "select",
				"section": "General",
				"sectionOrder": 1,
				"refreshOnChange": true,
				"defaultValue": "microphone",
				"options": [
					{
						"label": "Microphone/Input Device",
						"value": "microphone"
					},
					{
						"label": "System Output/Loopback",
						"value": "system"
					}
				],
				"helperText": "Windows: microphone uses dshow, system uses WASAPI loopback."
			},
			{
				"key": "inputDevice",
				"label": "Input Device",
				"type": "select",
				"section": "General",
				"sectionOrder": 1,
				"allowTyping": true,
				"dynamicOptions": true,
				"defaultValue": "",
				"options": [
					{
						"label": "Default",
						"value": ""
					}
				],
				"helperText": "Optional device name/index. Leave empty for platform default."
			},
			{
				"key": "threshold",
				"label": "Detection Threshold (0-1)",
				"type": "number",
				"section": "General",
				"sectionOrder": 1,
				"defaultValue": 0.82,
				"min": 0.4,
				"max": 0.97,
				"helperText": "Higher values reduce false positives but may miss matches. Typical range is 0.75-0.9."
			},
			{
				"key": "cooldownMs",
				"label": "Cooldown (ms)",
				"type": "number",
				"section": "General",
				"sectionOrder": 1,
				"defaultValue": 3000,
				"min": 500,
				"max": 60000,
				"helperText": "Minimum time between alerts after a match."
			},
			{
				"key": "detectionIntervalMs",
				"label": "Analyze Interval (ms)",
				"type": "number",
				"section": "Advanced",
				"sectionOrder": 2,
				"group": "advanced_runtime",
				"defaultValue": 700,
				"min": 200,
				"max": 5000,
				"helperText": "How often live audio is analyzed."
			},
			{
				"key": "maxReferenceSeconds",
				"label": "Max Reference Length (seconds)",
				"type": "number",
				"section": "Advanced",
				"sectionOrder": 2,
				"group": "advanced_runtime",
				"defaultValue": 6,
				"min": 1,
				"max": 30,
				"helperText": "Only the first part of the file is used for matching."
			},
			{
				"key": "autoStart",
				"label": "Start Detector Automatically",
				"type": "switch",
				"section": "General",
				"sectionOrder": 1,
				"defaultValue": true
			},
			{
				"key": "autoRestart",
				"label": "Auto Restart On Capture Exit",
				"type": "checkbox",
				"section": "Advanced",
				"sectionOrder": 2,
				"group": "advanced_runtime",
				"defaultValue": true
			},
			{
				"key": "restartDelayMs",
				"label": "Restart Delay (ms)",
				"type": "number",
				"section": "Advanced",
				"sectionOrder": 2,
				"group": "advanced_runtime",
				"defaultValue": 2000,
				"min": 500,
				"max": 30000
			},
			{
				"key": "logSimilarity",
				"label": "Log Similarity Scores",
				"type": "switch",
				"section": "Advanced",
				"sectionOrder": 2,
				"group": "advanced_runtime",
				"defaultValue": false,
				"helperText": "Useful for threshold tuning."
			}
		],
		"settings_tutorial": "./settings_tutorial.md",
		"actions_tutorial": "./actions_tutorial.md",
		"actions": [
			{
				"type": "start_detection",
				"label": "Start Detection",
				"description": "Start live audio listening and sound matching.",
				"fields": []
			},
			{
				"type": "stop_detection",
				"label": "Stop Detection",
				"description": "Stop live audio listening.",
				"fields": []
			},
			{
				"type": "list_devices",
				"label": "List Capture Devices",
				"description": "Log available capture devices for the current OS.",
				"fields": [
					{
						"key": "mode",
						"label": "Mode",
						"type": "select",
						"defaultValue": "auto",
						"options": [
							{
								"label": "Use Current Setting",
								"value": "auto"
							},
							{
								"label": "Microphone/Input",
								"value": "microphone"
							},
							{
								"label": "System Output",
								"value": "system"
							}
						]
					}
				]
			},
			{
				"type": "test_alert",
				"label": "Test Alert",
				"description": "Fire a sample match alert without listening.",
				"fields": [
					{
						"key": "score",
						"label": "Test Score",
						"type": "number",
						"defaultValue": 0.95,
						"min": 0,
						"max": 1
					}
				]
			}
		],
		"variables": [
			{
				"name": "detector_status",
				"description": "Current detector status: stopped, running, restarting, or error.",
				"value": "stopped"
			},
			{
				"name": "reference_name",
				"description": "Name of the most recently matched reference entry.",
				"value": ""
			},
			{
				"name": "last_similarity",
				"description": "Most recent similarity score (0-1).",
				"value": 0
			},
			{
				"name": "last_match_score",
				"description": "Similarity score from the last triggered match.",
				"value": 0
			},
			{
				"name": "last_match_time",
				"description": "ISO timestamp of the last triggered match.",
				"value": ""
			},
			{
				"name": "reference_file",
				"description": "File name of the most recently matched reference audio sample.",
				"value": ""
			},
			{
				"name": "capture_device",
				"description": "Capture device currently used by FFmpeg.",
				"value": ""
			}
		],
		"alerts": [
			{
				"title": "Sound Detected",
				"key": "sound_detected",
				"acceptedVariables": [
					"reference_name",
					"last_match_score",
					"last_match_time",
					"reference_file",
					"capture_device"
				],
				"defaultMessage": "Matched {{reference_name}} ({{reference_file}}) score {{last_match_score}} on {{capture_device}}.",
				"variationConditions": [
					{
						"type": "EQUAL_SELECTION",
						"description": "Compares against each sound mapping variation value."
					}
				]
			}
		]
	}
}

```

## sound_trigger_alert/package.json

```
{
	"name": "lumia-sound-trigger-alert",
	"version": "1.0.0",
	"private": true,
	"description": "Detect a user-provided sound in live audio and trigger Lumia alerts.",
	"main": "main.js",
	"dependencies": {
		"@lumiastream/plugin": "^0.4.2"
	}
}

```

## sound_trigger_alert/settings_tutorial.md

```
### How This Plugin Works
- You add one or more reference sounds in **Reference Audio Map**.
- The plugin listens to live audio from your selected capture source.
- It compares recent live audio to each reference and picks the best match score.
- If the score passes your threshold and cooldown rules, it triggers the `sound_detected` alert.
- Alert variation matching uses the detected reference **Name** (`dynamic.value`).

### Set Up Your Own Audio Detection
1. Install FFmpeg (see section below) and make sure `ffmpeg` works in terminal.
2. In **Reference Audio Map**, add an entry:
   - **Name**: what this sound should be called (also used for variations)
   - **Audio File**: the sound clip to detect
3. Choose **Capture Mode**:
   - **Microphone/Input Device** for live mic/input
   - **System Output/Loopback** for desktop/output capture (Windows WASAPI loopback)
4. Pick **Input Device** from the dropdown (or type a custom device value).
5. Click **Activate**. The plugin validates FFmpeg and your reference files before activation completes.
6. Play your target sound and tune threshold/cooldown as needed.

### Install FFmpeg
If FFmpeg is not already installed, use one of these options:

- Windows:
  - `winget install Gyan.FFmpeg`
  - or `choco install ffmpeg -y`
  - then restart Lumia Stream.
- macOS:
  - `brew install ffmpeg`
- Linux:
  - Ubuntu/Debian: `sudo apt update && sudo apt install -y ffmpeg`
  - Fedora: `sudo dnf install -y ffmpeg`
  - Arch: `sudo pacman -S ffmpeg`

Verify install:
- Run `ffmpeg -version` in terminal.
- If command is not found, set **FFmpeg Path** to the full ffmpeg binary path.

### Tuning
- **Detection Threshold**:
  - Start around `0.82`
  - Raise threshold to reduce false positives
  - Lower threshold if real matches are missed
- **Cooldown** controls how often alerts can fire.
- **Analyze Interval** and **Max Reference Length** are in **Advanced** and control CPU usage vs responsiveness.
- Advanced runtime options (FFmpeg path, restart behavior, logging) are in the **Advanced** section.

### Platform Notes
- Windows:
  - Microphone mode uses FFmpeg `dshow`
  - System mode uses FFmpeg `wasapi`
- macOS:
  - Uses FFmpeg `avfoundation` (audio index in `Input Device`)
- Linux:
  - Uses FFmpeg `pulse` (source name in `Input Device`)

```

## steam/actions_tutorial.md

```
---
---
### Fetch Game Achievements
Use **Fetch Achievements For Game** to query a specific game by name or App ID.
The results are stored in the requested game variables.
---

```

## steam/main.js

```
const { Plugin } = require("@lumiastream/plugin");

const DEFAULTS = {
	pollInterval: 120,
	minPollInterval: 15,
	maxPollInterval: 900,
	achievementRefreshSeconds: 180,
	ownedGamesRefreshSeconds: 600,
	userAgent: "LumiaStream Steam Plugin/1.0.0",
	logThrottleMs: 5 * 60 * 1000,
	matchThreshold: 0.7,
};

const STEAM_API_BASE = "https://api.steampowered.com";

const ALERT_KEYS = {
	onlineStateChanged: "online_state_changed",
	achievementProgressChanged: "achievement_progress_changed",
	currentGameChanged: "current_game_changed",
};

const VARIABLE_NAMES = {
	steamId: "steamid",
	username: "persona_username",
	onlineStatus: "online_status",
	lastLogoff: "last_logoff",
	profileUrl: "profile_url",
	avatar: "avatar",
	currentGameName: "current_game_name",
	currentGameAppId: "current_game_appid",
	gameCount: "game_count",
	currentGameAchievementCount: "current_game_achievement_count",
	currentGameAchievementUnlocked: "current_game_achievement_unlocked_count",
	requestedGameAppId: "requested_game_appid",
	requestedGameName: "requested_game_name",
	requestedGameAchievementCount: "requested_game_achievement_count",
	requestedGameAchievementUnlocked: "requested_game_achievement_unlocked",
	requestedGameAchievements: "requested_game_achievements",
};

class SteamPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._pollTimer = null;
		this._refreshPromise = null;
		this._lastConnectionState = null;
		this._lastVariables = new Map();
		this._logTimestamps = new Map();
		this._globalBackoffUntil = 0;
		this._authFailure = false;
		this._resolvedSteamId = "";
		this._hasInitialSync = false;
		this._lastPersonaState = null;
		this._lastCurrentGameAppId = null;
		this._lastCurrentGameName = "";
		this._lastAchievementAppId = null;
		this._lastAchievementUnlocked = null;
		this._lastAchievementCount = null;
		this._lastOwnedFetchAt = 0;
		this._lastAchievementsFetchAt = 0;
		this._lastAchievementFetchAppId = 0;
	}

	async onload() {
		if (!this._hasRequiredSettings()) {
			await this._log("Missing Steam API key or Steam ID.", "warn");
			await this._updateConnectionState(false);
			return;
		}

		await this._refreshData({ reason: "startup" });
		this._schedulePolling();
	}

	async onunload() {
		this._clearPolling();
		await this._updateConnectionState(false);
	}

	async onsettingsupdate(settings, previous = {}) {
		const pollChanged =
			this._pollInterval(settings) !== this._pollInterval(previous);
		const keyChanged = (settings?.apiKey ?? "") !== (previous?.apiKey ?? "");
		const idChanged =
			(settings?.steamIdOrVanity ?? "") !== (previous?.steamIdOrVanity ?? "");

		if (pollChanged) {
			this._schedulePolling();
		}

		if (keyChanged || idChanged) {
			this._authFailure = false;
			this._globalBackoffUntil = 0;
			this._resolvedSteamId = "";
			this._hasInitialSync = false;
			this._lastPersonaState = null;
			this._lastCurrentGameAppId = null;
			this._lastCurrentGameName = "";
			this._lastAchievementAppId = null;
			this._lastAchievementUnlocked = null;
			this._lastAchievementCount = null;
			this._lastOwnedFetchAt = 0;
			this._lastAchievementsFetchAt = 0;
			this._lastAchievementFetchAppId = 0;
		}

		await this._refreshData({ reason: "settings-update" });
	}

	async actions(config) {
		for (const action of config.actions) {
			const params = action.value;
			try {
				switch (action.type) {
					case "refresh":
						await this._refreshData({ reason: "manual-action" });
						break;
					case "fetch_game":
						await this._handleFetchGame(params);
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

	async validateAuth() {
		if (!this._hasRequiredSettings()) {
			return {
				ok: false,
				message: "Missing Steam API key or Steam ID.",
			};
		}

		try {
			const steamId = await this._resolveSteamId();
			await this._fetchPlayerSummary(steamId);
			return { ok: true };
		} catch (error) {
			const message = this._errorMessage(error);
			await this._log(`Steam validation failed: ${message}`, "error");
			return { ok: false, message };
		}
	}

	_tag() {
		return `[${this.manifest?.id ?? "steam"}]`;
	}

	async _log(message, severity = "info") {
		const prefix = this._tag();
		const decorated =
			severity === "warn"
				? `${prefix} ⚠️ ${message}`
				: severity === "error"
					? `${prefix} ❌ ${message}`
					: `${prefix} ${message}`;

		await this.lumia.log(decorated);
	}

	async _logThrottled(
		key,
		message,
		severity = "info",
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

	async _refreshData({ reason } = {}) {
		if (!this._hasRequiredSettings()) {
			await this._updateConnectionState(false);
			return;
		}

		if (this._authFailure) {
			return;
		}

		const now = Date.now();
		if (this._globalBackoffUntil && now < this._globalBackoffUntil) {
			return;
		}

		if (this._refreshPromise) {
			return this._refreshPromise;
		}

		this._refreshPromise = (async () => {
			try {
				const steamId = await this._resolveSteamId();
				const forceFullRefresh =
					reason === "startup" ||
					reason === "settings-update" ||
					reason === "manual-action";
				const now = Date.now();

				const summaryResult = await this._safeFetch("summary", () =>
					this._fetchPlayerSummary(steamId),
				);
				const achievementAppId = this._determineAchievementAppId(summaryResult.data);
				if (!achievementAppId) {
					this._lastAchievementFetchAppId = 0;
					this._lastAchievementsFetchAt = 0;
				}

				const shouldFetchOwned =
					forceFullRefresh ||
					!this._lastOwnedFetchAt ||
					now - this._lastOwnedFetchAt >= this._ownedGamesRefreshMs();
				let ownedResult = { ok: false, data: null };
				if (shouldFetchOwned) {
					ownedResult = await this._safeFetch("owned games", () =>
						this._fetchOwnedGames(steamId),
					);
					if (ownedResult.ok) {
						this._lastOwnedFetchAt = Date.now();
					}
				}

				const shouldFetchAchievements =
					Boolean(achievementAppId) &&
					(forceFullRefresh ||
						this._lastAchievementFetchAppId !== achievementAppId ||
						!this._lastAchievementsFetchAt ||
						now - this._lastAchievementsFetchAt >= this._achievementRefreshMs());

				let achievementsResult = { ok: false, data: null };
				if (shouldFetchAchievements) {
					achievementsResult = await this._safeFetch("achievements", () =>
						this._fetchAchievements(steamId, achievementAppId),
					);
					if (achievementsResult.ok) {
						this._lastAchievementsFetchAt = Date.now();
						this._lastAchievementFetchAppId = achievementAppId;
					}
				}

				await this._applySummary(summaryResult.data, steamId);
				if (shouldFetchOwned) {
					await this._applyOwnedGames(ownedResult.data);
				}
				if (shouldFetchAchievements || !achievementAppId) {
					await this._applyAchievements(achievementsResult.data);
				}
				await this._emitAlerts({
					summary: summaryResult.data,
					achievementAppId,
					achievements: shouldFetchAchievements ? achievementsResult.data : null,
				});

				const hadSuccessfulRefresh =
					summaryResult.ok ||
					(shouldFetchOwned && ownedResult.ok) ||
					(shouldFetchAchievements && achievementsResult.ok);

				await this._updateConnectionState(hadSuccessfulRefresh);
			} catch (error) {
				const message = this._errorMessage(error);
				await this._logThrottled(
					"refresh-failure",
					`Failed to refresh Steam data: ${message}`,
					"warn",
				);
				await this._updateConnectionState(false);
			}
			this._refreshPromise = null;
		})();

		return this._refreshPromise;
	}

	async _resolveSteamId() {
		if (this._resolvedSteamId) {
			return this._resolvedSteamId;
		}

		const input = this._normalizeSteamIdentifier(
			this._coerceString(this.settings?.steamIdOrVanity, "").trim(),
		);
		if (!input) {
			throw new Error("Missing Steam ID or vanity name.");
		}

		if (/^\d{17}$/.test(input)) {
			this._resolvedSteamId = input;
			return input;
		}

		const resolved = await this._fetchResolveVanity(input);
		const steamId = this._coerceString(resolved?.steamid, "");
		if (!steamId) {
			throw new Error("Could not resolve vanity URL.");
		}

		this._resolvedSteamId = steamId;
		return steamId;
	}

	_normalizeSteamIdentifier(value) {
		if (!value) return "";
		const raw = String(value).trim();
		if (!raw) return "";

		const profileMatch = raw.match(
			/^https?:\/\/steamcommunity\.com\/(id|profiles)\/([^\/?#]+).*$/i,
		);
		if (profileMatch) {
			const [, type, identifier] = profileMatch;
			if (type.toLowerCase() === "profiles") {
				return identifier;
			}
			return identifier;
		}

		return raw;
	}

	async _fetchResolveVanity(vanity) {
		const url = `${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/?key=${encodeURIComponent(
			this._apiKey(),
		)}&vanityurl=${encodeURIComponent(vanity)}&url_type=1`;
		const response = await this._fetchJson(url);
		return response?.response ?? null;
	}

	async _fetchPlayerSummary(steamId) {
		const url = `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${encodeURIComponent(
			this._apiKey(),
		)}&steamids=${encodeURIComponent(steamId)}`;
		const response = await this._fetchJson(url);
		return response?.response?.players?.[0] ?? null;
	}

	async _fetchOwnedGames(steamId) {
		const url = `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/?key=${encodeURIComponent(
			this._apiKey(),
		)}&steamid=${encodeURIComponent(steamId)}&include_appinfo=0&include_played_free_games=1`;
		return this._fetchJson(url);
	}

	async _fetchAchievements(steamId, appId) {
		const targetAppId = this._coerceNumber(appId, 0);
		if (!targetAppId) {
			return null;
		}

		const url = `${STEAM_API_BASE}/ISteamUserStats/GetPlayerAchievements/v1/?key=${encodeURIComponent(
			this._apiKey(),
		)}&steamid=${encodeURIComponent(steamId)}&appid=${targetAppId}`;
		return this._fetchJson(url);
	}

	async _fetchOwnedGamesWithInfo(steamId) {
		const url = `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/?key=${encodeURIComponent(
			this._apiKey(),
		)}&steamid=${encodeURIComponent(steamId)}&include_appinfo=1&include_played_free_games=1`;
		return this._fetchJson(url);
	}

	_determineAchievementAppId(summary) {
		const summaryGameId = this._coerceNumber(summary?.gameid, 0);
		if (summaryGameId) {
			return summaryGameId;
		}
		return 0;
	}

	async _fetchJson(url) {
		let response = await this._request(url);

		if (response.status === 429) {
			const retryAfter = this._coerceNumber(
				response.headers.get("Retry-After"),
				60,
			);
			this._applyGlobalBackoff(retryAfter);
			throw new Error(`Rate limited (429). Backing off for ${retryAfter}s.`);
		}

		if (response.status === 401 || response.status === 403) {
			this._authFailure = true;
			this._clearPolling();
			await this._showApiKeyFailureToast();
			throw new Error("Unauthorized. Check your Steam API key.");
		}

		if (!response.ok) {
			const body = await response.text();
			const trimmed = this._truncateError(body);
			throw new Error(
				`Steam API error (${response.status}) on ${url}: ${trimmed || "No response body"}`,
			);
		}

		return response.json();
	}

	async _request(url) {
		const headers = {
			Accept: "application/json",
			"User-Agent": DEFAULTS.userAgent,
		};

		return fetch(url, { headers });
	}

	async _applySummary(summary, steamId) {
		if (!summary) {
			await this._setVariableIfChanged(VARIABLE_NAMES.steamId, steamId);
			return;
		}

		await this._setVariableIfChanged(
			VARIABLE_NAMES.steamId,
			this._coerceString(summary?.steamid ?? steamId, ""),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.username,
			this._coerceString(summary?.personaname, ""),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.onlineStatus,
			this._mapPersonaState(this._coerceNumber(summary?.personastate, 0)),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.lastLogoff,
			this._coerceNumber(summary?.lastlogoff, 0),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.profileUrl,
			this._coerceString(summary?.profileurl, ""),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.avatar,
			this._coerceString(summary?.avatarfull, ""),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.currentGameName,
			this._coerceString(summary?.gameextrainfo, ""),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.currentGameAppId,
			this._coerceNumber(summary?.gameid, 0),
		);
	}

	async _applyOwnedGames(owned) {
		if (!owned) {
			return;
		}

		await this._setVariableIfChanged(
			VARIABLE_NAMES.gameCount,
			this._coerceNumber(owned?.response?.game_count, 0),
		);
	}

	async _applyAchievements(payload) {
		if (!payload) {
			await this._setVariableIfChanged(
				VARIABLE_NAMES.currentGameAchievementCount,
				0,
			);
			await this._setVariableIfChanged(
				VARIABLE_NAMES.currentGameAchievementUnlocked,
				0,
			);
			return;
		}

		const achievements = Array.isArray(payload?.playerstats?.achievements)
			? payload.playerstats.achievements
			: [];
		const unlocked = achievements.filter((a) => a?.achieved === 1).length;

		await this._setVariableIfChanged(
			VARIABLE_NAMES.currentGameAchievementCount,
			achievements.length,
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.currentGameAchievementUnlocked,
			unlocked,
		);
	}

	async _emitAlerts({ summary, achievementAppId, achievements }) {
		if (this.settings?.enableAlerts === false) {
			return;
		}

		const hasSummary = Boolean(summary && typeof summary === "object");
		// Do not emit status/game-change alerts until we have at least one real
		// profile snapshot to use as baseline.
		if (!hasSummary) {
			return;
		}
		const personaStateRaw = hasSummary
			? this._coerceNumber(summary?.personastate, 0)
			: null;
		const personaState =
			personaStateRaw === null ? null : this._mapPersonaState(personaStateRaw);
		const currentGameAppId = this._coerceNumber(summary?.gameid, 0);
		const currentGameName = this._coerceString(summary?.gameextrainfo, "");

		const achievementList = Array.isArray(
			achievements?.playerstats?.achievements,
		)
			? achievements.playerstats.achievements
			: null;
		const unlocked = achievementList
			? achievementList.filter((a) => a?.achieved === 1).length
			: 0;
		const total = achievementList ? achievementList.length : 0;
		const alertVars = this._buildAlertVariables({
			summary,
			onlineStatus: personaState,
			achievementUnlocked: unlocked,
			achievementCount: total,
		});

		if (!this._hasInitialSync) {
			this._lastPersonaState = personaState;
			this._lastCurrentGameAppId = currentGameAppId || null;
			this._lastCurrentGameName = currentGameName;
			this._lastAchievementAppId = achievementAppId || null;
			this._lastAchievementUnlocked = achievementList ? unlocked : null;
			this._lastAchievementCount = achievementList ? total : null;
			this._hasInitialSync = true;
			return;
		}

		if (
			personaState !== null &&
			this._lastPersonaState !== null &&
			personaState !== this._lastPersonaState
		) {
			await this.lumia.triggerAlert({
				alert: ALERT_KEYS.onlineStateChanged,
				...this._buildAlertPayload(alertVars, {
					dynamicValue: alertVars.online_status,
				}),
			});
		}

		if (
			achievementList &&
			achievementAppId &&
			this._lastAchievementAppId === achievementAppId &&
			this._lastAchievementUnlocked !== null &&
			unlocked !== this._lastAchievementUnlocked
		) {
			await this.lumia.triggerAlert({
				alert: ALERT_KEYS.achievementProgressChanged,
				...this._buildAlertPayload(alertVars, {
					dynamicValue: `${alertVars.current_game_achievement_unlocked_count}/${alertVars.current_game_achievement_count}`,
				}),
			});
		}

		const previousGameAppId = this._lastCurrentGameAppId;
		const previousGameName = this._lastCurrentGameName;
		const changedToNewGame =
			Boolean(currentGameAppId) &&
			(previousGameAppId === null || currentGameAppId !== previousGameAppId);
		const changedToNoGame =
			!currentGameAppId &&
			previousGameAppId !== null &&
			Boolean(this.settings?.alertGameChangedWhenStopped ?? true);

		if (changedToNewGame || changedToNoGame) {
			const dynamicValue = changedToNoGame
				? "Stopped Playing"
				: alertVars.current_game_name;
			await this.lumia.triggerAlert({
				alert: ALERT_KEYS.currentGameChanged,
				...this._buildAlertPayload(alertVars, {
					dynamicValue,
					extraSettings: changedToNoGame
						? { previous_game_name: previousGameName ?? "" }
						: undefined,
				}),
			});
		}

		if (personaState !== null) {
			this._lastPersonaState = personaState;
		}
		if (currentGameAppId) {
			this._lastCurrentGameAppId = currentGameAppId;
		} else {
			this._lastCurrentGameAppId = null;
		}
		this._lastCurrentGameName = currentGameName;
		if (achievementAppId && achievementList) {
			this._lastAchievementAppId = achievementAppId;
			this._lastAchievementUnlocked = unlocked;
			this._lastAchievementCount = total;
		}
	}

	async _handleFetchGame(params = {}) {
		if (!this._hasRequiredSettings()) {
			await this._log("Missing Steam API key or Steam ID.", "warn");
			return;
		}

		const gameInput = this._coerceString(params?.game, "").trim();
		if (!gameInput) {
			await this._log("Game name or App ID is required.", "warn");
			return;
		}

		const steamId = await this._resolveSteamId();
		let appId = null;
		let gameName = "";

		const numericOnly = gameInput.match(/^\d+$/);
		if (numericOnly) {
			appId = this._coerceNumber(numericOnly[0], 0);
		}

		let ownedGames = null;
		if (!appId || !gameName) {
			ownedGames = await this._fetchOwnedGamesWithInfo(steamId);
			const games = Array.isArray(ownedGames?.response?.games)
				? ownedGames.response.games
				: [];
			if (!appId) {
				const match = this._resolveGameFromOwnedGames(games, gameInput);
				if (!match) {
					await this._log(`No close match found for '${gameInput}'.`, "warn");
					await this._showActionToast(
						`No owned game matched '${gameInput}'.`,
						"warn",
					);
					return;
				}
				appId = match.appid;
				gameName = match.name;
			} else {
				const found = games.find(
					(game) => String(game?.appid) === String(appId),
				);
				gameName = this._coerceString(found?.name, "");
			}

			// No search results variable exposed.
		}

		if (!appId) {
			await this._log(`Unable to resolve game '${gameInput}'.`, "warn");
			await this._showActionToast(
				`Unable to resolve game '${gameInput}'.`,
				"warn",
			);
			return;
		}

		const achievements = await this._fetchAchievements(steamId, appId);
		const list = Array.isArray(achievements?.playerstats?.achievements)
			? achievements.playerstats.achievements
			: [];
		const unlocked = list.filter((a) => a?.achieved === 1).length;

		await this._setVariableIfChanged(VARIABLE_NAMES.requestedGameAppId, appId);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.requestedGameName,
			gameName || this._coerceString(gameInput, ""),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.requestedGameAchievementCount,
			list.length,
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.requestedGameAchievementUnlocked,
			unlocked,
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.requestedGameAchievements,
			JSON.stringify(achievements ?? {}),
		);

		await this._showActionToast(
			gameName
				? `Fetched achievements for ${gameName}. Requested game variables updated.`
				: `Fetched achievements for App ID ${appId}. Requested game variables updated.`,
			"success",
		);
	}

	_resolveGameFromOwnedGames(games, input) {
		const ranked = this._rankGameMatches(games, input);
		if (!ranked.length) return null;
		const best = ranked[0];
		if (best.score < DEFAULTS.matchThreshold) {
			return null;
		}
		return best;
	}

	_rankGameMatches(games, input) {
		const normalizedInput = this._normalizeMatchText(input);
		if (!normalizedInput) return [];

		const results = [];
		for (const game of games) {
			const name = this._coerceString(game?.name, "");
			if (!name) continue;
			const score = this._scoreMatch(name, normalizedInput);
			if (score <= 0) continue;
			results.push({
				appid: game.appid,
				name,
				score: Number(score.toFixed(3)),
			});
		}

		results.sort((a, b) => b.score - a.score);
		return results.slice(0, 10);
	}

	_scoreMatch(name, normalizedInput) {
		const normalizedName = this._normalizeMatchText(name);
		if (!normalizedName) return 0;

		if (normalizedName === normalizedInput) return 1;
		if (normalizedName.startsWith(normalizedInput)) return 0.95;
		if (normalizedInput.startsWith(normalizedName)) return 0.9;
		if (
			normalizedName.includes(normalizedInput) ||
			normalizedInput.includes(normalizedName)
		) {
			return 0.85;
		}
		const distance = this._levenshtein(normalizedName, normalizedInput);
		const maxLen = Math.max(normalizedName.length, normalizedInput.length);
		return maxLen ? 1 - distance / maxLen : 0;
	}

	_normalizeMatchText(value) {
		return this._coerceString(value, "")
			.toLowerCase()
			.replace(/\s+/g, " ")
			.trim();
	}

	_mapPersonaState(value) {
		const map = {
			0: "Offline",
			1: "Online",
			2: "Busy",
			3: "Away",
			4: "Snooze",
			5: "Looking to Trade",
			6: "Looking to Play",
		};
		return map[value] ?? "Offline";
	}

	_buildAlertVariables({
		summary,
		onlineStatus,
		achievementUnlocked,
		achievementCount,
	}) {
		return {
			persona_username: this._coerceString(summary?.personaname, ""),
			online_status: this._coerceString(onlineStatus, ""),
			current_game_name: this._coerceString(summary?.gameextrainfo, ""),
			current_game_appid: this._coerceNumber(summary?.gameid, 0),
			current_game_achievement_unlocked_count: this._coerceNumber(
				achievementUnlocked,
				0,
			),
			current_game_achievement_count: this._coerceNumber(achievementCount, 0),
		};
	}

	_buildAlertPayload(variables, { dynamicValue, extraSettings } = {}) {
		const value =
			dynamicValue ??
			variables.current_game_name ??
			variables.persona_username ??
			"";
		return {
			dynamic: {
				value,
				online_status: variables.online_status,
			},
			extraSettings: {
				...(variables ?? {}),
				...(extraSettings ?? {}),
			},
		};
	}

	_levenshtein(a, b) {
		if (a === b) return 0;
		if (!a) return b.length;
		if (!b) return a.length;

		const matrix = Array.from({ length: a.length + 1 }, () =>
			new Array(b.length + 1).fill(0),
		);

		for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
		for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

		for (let i = 1; i <= a.length; i++) {
			for (let j = 1; j <= b.length; j++) {
				const cost = a[i - 1] === b[j - 1] ? 0 : 1;
				matrix[i][j] = Math.min(
					matrix[i - 1][j] + 1,
					matrix[i][j - 1] + 1,
					matrix[i - 1][j - 1] + cost,
				);
			}
		}

		return matrix[a.length][b.length];
	}

	_applyGlobalBackoff(seconds) {
		const delayMs = Math.max(0, this._coerceNumber(seconds, 0)) * 1000;
		const until = Date.now() + delayMs;
		if (!this._globalBackoffUntil || until > this._globalBackoffUntil) {
			this._globalBackoffUntil = until;
		}
	}

	async _showApiKeyFailureToast() {
		if (typeof this.lumia?.showToast !== "function") {
			return;
		}
		try {
			await this.lumia.showToast({
				message: "Invalid Steam API key. Update the plugin settings.",
				time: 6,
			});
		} catch (error) {
			return;
		}
	}

	async _showActionToast(message, type = "info") {
		if (typeof this.lumia?.showToast !== "function") {
			return;
		}
		try {
			await this.lumia.showToast({
				message,
				time: 4,
				type,
			});
		} catch (error) {
			return;
		}
	}

	_schedulePolling() {
		this._clearPolling();

		const intervalSeconds = this._pollInterval(this.settings);
		if (!this._hasRequiredSettings() || intervalSeconds <= 0) {
			return;
		}

		this._pollTimer = setInterval(() => {
			void this._refreshData({ reason: "poll" });
		}, intervalSeconds * 1000);
	}

	_clearPolling() {
		if (this._pollTimer) {
			clearInterval(this._pollTimer);
			this._pollTimer = null;
		}
	}

	_hasRequiredSettings() {
		return Boolean(this._apiKey() && this._steamIdInput());
	}

	_apiKey() {
		return this._coerceString(this.settings?.apiKey, "");
	}

	_steamIdInput() {
		return this._coerceString(this.settings?.steamIdOrVanity, "");
	}

	_pollInterval(settings = this.settings) {
		const interval = this._coerceNumber(
			settings?.pollInterval,
			DEFAULTS.pollInterval,
		);
		if (!Number.isFinite(interval)) {
			return DEFAULTS.pollInterval;
		}
		return Math.min(
			Math.max(interval, DEFAULTS.minPollInterval),
			DEFAULTS.maxPollInterval,
		);
	}

	_achievementRefreshMs(settings = this.settings) {
		const pollSeconds = this._pollInterval(settings);
		const refreshSeconds = Math.max(
			DEFAULTS.achievementRefreshSeconds,
			pollSeconds * 2,
		);
		return refreshSeconds * 1000;
	}

	_ownedGamesRefreshMs(settings = this.settings) {
		const pollSeconds = this._pollInterval(settings);
		const refreshSeconds = Math.max(
			DEFAULTS.ownedGamesRefreshSeconds,
			pollSeconds * 5,
		);
		return refreshSeconds * 1000;
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
				await this._log(
					`Failed to update connection state: ${message}`,
					"warn",
				);
			}
		}
	}

	async _safeFetch(label, fn) {
		try {
			return { ok: true, data: await fn() };
		} catch (error) {
			const message = this._errorMessage(error);
			await this._logThrottled(
				`fetch:${label}:${message}`,
				`${label} fetch failed: ${message}`,
				"warn",
			);
			return { ok: false, data: null };
		}
	}

	async _setVariable(name, value) {
		if (typeof this.lumia.setVariable !== "function") {
			return;
		}

		await this.lumia.setVariable(name, value);
	}

	async _setVariableIfChanged(name, value) {
		const normalized = this._normalizeValue(value);
		const previous = this._lastVariables.get(name);
		if (this._valuesEqual(previous, normalized)) {
			return false;
		}
		this._lastVariables.set(name, normalized);
		await this._setVariable(name, value);
		return true;
	}

	_normalizeValue(value) {
		if (value === null || value === undefined) {
			return "";
		}
		if (typeof value === "object") {
			try {
				return JSON.stringify(value);
			} catch (error) {
				return String(value);
			}
		}
		return String(value);
	}

	_valuesEqual(a, b) {
		return a === b;
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

	_truncateError(value) {
		if (!value) {
			return "";
		}
		const trimmed = String(value).replace(/\s+/g, " ").trim();
		return trimmed.length > 200 ? `${trimmed.slice(0, 200)}…` : trimmed;
	}

	_coerceNumber(value, fallback = 0) {
		const number = Number(value);
		return Number.isFinite(number) ? number : fallback;
	}

	_coerceString(value, fallback = "") {
		if (typeof value === "string") {
			return value;
		}
		if (value === null || value === undefined) {
			return fallback;
		}
		return String(value);
	}
}

module.exports = SteamPlugin;

```

## steam/manifest.json

```
{
	"id": "steam",
	"name": "Steam",
	"version": "1.0.4",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://lumiastream.com",
	"description": "Track Steam profile status, current/recent games, and achievements in Lumia with optional alerts and actions.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "games",
	"keywords": "steam, steam api, gaming, profile, online status, achievements, recently played",
	"icon": "steam.png",
	"config": {
		"settings": [
			{
				"key": "apiKey",
				"label": "Steam Web API Key",
				"type": "password",
				"helperText": "Required for all Steam Web API requests.",
				"required": true
			},
			{
				"key": "steamIdOrVanity",
				"label": "Steam ID or Vanity Name",
				"type": "text",
				"helperText": "Enter a SteamID64 or a vanity URL name.",
				"required": true
			},
			{
				"key": "pollInterval",
				"label": "Poll Interval (seconds)",
				"type": "number",
				"defaultValue": 15,
				"min": 15,
				"max": 900,
				"helperText": "How often to refresh current status/game (15-900 seconds). Achievements and owned games refresh less frequently automatically."
			},
			{
				"key": "alertGameChangedWhenStopped",
				"label": "Alert When Game Stops",
				"type": "checkbox",
				"defaultValue": true,
				"helperText": "When enabled, Game Changed alerts also trigger when you stop playing."
			}
		],
		"settings_tutorial": "./settings_tutorial.md",
		"actions_tutorial": "./actions_tutorial.md",
		"actions": [
			{
				"type": "fetch_game",
				"label": "Fetch Achievements For Game",
				"description": "Fetch achievements by game name or App ID (owned games only).",
				"fields": [
					{
						"key": "game",
						"label": "Game Name or App ID",
						"type": "text",
						"placeholder": "ex: Sonic or 1145360",
						"helperText": "Searches your owned games library for a match.",
						"allowVariables": true
					}
				]
			}
		],
		"variables": [
			{
				"name": "steamid",
				"description": "SteamID64.",
				"value": ""
			},
			{
				"name": "persona_username",
				"description": "Username (Steam persona name).",
				"value": ""
			},
			{
				"name": "online_status",
				"description": "Online status (text).",
				"value": "Offline"
			},
			{
				"name": "profile_url",
				"description": "Profile URL.",
				"value": ""
			},
			{
				"name": "avatar",
				"description": "Avatar URL.",
				"value": ""
			},
			{
				"name": "current_game_name",
				"description": "Current in-game name (if playing).",
				"value": ""
			},
			{
				"name": "current_game_appid",
				"description": "Current in-game app ID (if playing).",
				"value": 0
			},
			{
				"name": "game_count",
				"description": "Owned games count.",
				"value": 0
			},
			{
				"name": "current_game_achievement_count",
				"description": "Total achievements for the current/last played game.",
				"value": 0
			},
			{
				"name": "current_game_achievement_unlocked_count",
				"description": "Unlocked achievements for the current/last played game.",
				"value": 0
			},
			{
				"name": "requested_game_appid",
				"description": "App ID for the last requested game.",
				"value": 0
			},
			{
				"name": "requested_game_name",
				"description": "Name for the last requested game.",
				"value": ""
			},
			{
				"name": "requested_game_achievement_count",
				"description": "Total achievements for the last requested game.",
				"value": 0
			},
			{
				"name": "requested_game_achievement_unlocked",
				"description": "Unlocked achievements for the last requested game.",
				"value": 0
			},
			{
				"name": "requested_game_achievements",
				"description": "JSON payload of achievements for the last requested game.",
				"value": ""
			}
		],
		"alerts": [
			{
				"title": "Online Status Changed",
				"key": "online_state_changed",
				"acceptedVariables": [
					"persona_username",
					"online_status"
				],
				"defaultMessage": "{{persona_username}} is now {{online_status}}.",
				"variationConditions": [
					{
						"type": "EQUAL_SELECTION",
						"description": "Pick a online for status.",
						"selections": [
							{
								"label": "Online",
								"value": "online",
								"message": "{{persona_username}} is now Online."
							},
							{
								"label": "Offline",
								"value": "offline",
								"message": "{{persona_username}} went Offline."
							},
							{
								"label": "Busy",
								"value": "busy",
								"message": "{{persona_username}} is Busy."
							},
							{
								"label": "Away",
								"value": "away",
								"message": "{{persona_username}} is Away."
							},
							{
								"label": "Snooze",
								"value": "snooze",
								"message": "{{persona_username}} is Snoozing."
							},
							{
								"label": "Looking To Trade",
								"value": "trade",
								"message": "{{persona_username}} is Looking to Trade."
							},
							{
								"label": "Looking To Play",
								"value": "play",
								"message": "{{persona_username}} is Looking to Play."
							}
						]
					}
				]
			},
			{
				"title": "Achievement Unlocked",
				"key": "achievement_progress_changed",
				"acceptedVariables": [
					"current_game_name",
					"current_game_achievement_unlocked_count",
					"current_game_achievement_count"
				],
				"defaultMessage": "{{current_game_name}} achievements: {{current_game_achievement_unlocked_count}}/{{current_game_achievement_count}}."
			},
			{
				"title": "Game Changed",
				"key": "current_game_changed",
				"acceptedVariables": [
					"current_game_name",
					"current_game_appid"
				],
				"defaultMessage": "Now playing {{current_game_name}}.",
				"variationConditions": [
					{
						"type": "EQUAL_STRING",
						"description": "Game Name"
					}
				]
			}
		],
		"translations": "./translations.json"
	}
}

```

## steam/package.json

```
{
	"name": "lumia-example-steam",
	"version": "1.0.0",
	"private": true,
	"description": "Example Lumia Stream plugin that pulls Steam data from the Steam Web API.",
	"main": "main.js",
	"scripts": {},
	"dependencies": {
		"@lumiastream/plugin": "^0.4.1"
	}
}

```

## steam/settings_tutorial.md

```
---
### Steam Web API Key
1) Open the [Steam Web API Key page](https://steamcommunity.com/dev/apikey) and sign in.
2) Enter a domain name (you can use `localhost`).
3) Accept the terms and click **Register**.
4) Copy the generated key and paste it into **Steam Web API Key**.

### Steam ID
1) Open your Steam profile.
2) Paste **any** of the following into **Steam ID / Vanity Name**:
   - Your SteamID64 (from account details)
   - Your vanity profile name
   - Your full profile URL (example: `https://steamcommunity.com/id/yourname` or `https://steamcommunity.com/profiles/7656119...`)

### Achievements
Achievement stats are pulled automatically from your **current** game while you are playing.
---

```

## steam/translations.json

```
{
	"en": {
		"steamid": "SteamID64.",
		"persona_username": "Username (Steam persona name).",
		"online_status": "Online status (text).",
		"profile_url": "Profile URL.",
		"avatar": "Avatar URL.",
		"current_game_name": "Current in-game name (if playing).",
		"current_game_appid": "Current in-game app ID (if playing).",
		"game_count": "Owned games count.",
		"current_game_achievement_count": "Total achievements for the current/last played game.",
		"current_game_achievement_unlocked_count": "Unlocked achievements for the current/last played game.",
		"requested_game_appid": "App ID for the last requested game.",
		"requested_game_name": "Name for the last requested game.",
		"requested_game_achievement_count": "Total achievements for the last requested game.",
		"requested_game_achievement_unlocked": "Unlocked achievements for the last requested game.",
		"requested_game_achievements": "JSON payload of achievements for the last requested game."
	}
}

```

## system_monitor/README.md

```
# System Monitor Plugin

Monitors CPU, RAM, and GPU usage (when available) and exposes variables and alerts.

## Variables
- `cpu_usage`, `cpu_bucket`
- `ram_usage`, `ram_bucket`, `ram_used_mb`, `ram_total_mb`
- `gpu_available`, `gpu_usage`, `gpu_bucket`

## Alerts
- `cpu_alert` (warning/critical variations)
- `ram_alert` (warning/critical variations)
- `gpu_alert` (warning/critical variations)

Alerts only fire when entering a new bucket (normal -> warning -> critical).

## Notes
- GPU usage depends on OS and driver support. If not available, `gpu_available` is false and no GPU alert fires.

```

## system_monitor/main.js

```
const { Plugin } = require("@lumiastream/plugin");
const os = require("os");

function safeRequireSystemInformation() {
	try {
		return require("systeminformation");
	} catch (error) {
		return null;
	}
}

const DEFAULTS = {
	pollIntervalSec: 2,
	cpuWarn: 70,
	cpuCritical: 90,
	ramWarn: 70,
	ramCritical: 90,
	gpuWarn: 70,
	gpuCritical: 90,
};

const VARIABLES = {
	cpuUsage: "cpu_usage",
	cpuBucket: "cpu_bucket",
	ramUsage: "ram_usage",
	ramBucket: "ram_bucket",
	ramUsedMb: "ram_used_mb",
	ramTotalMb: "ram_total_mb",
	gpuAvailable: "gpu_available",
	gpuUsage: "gpu_usage",
	gpuBucket: "gpu_bucket",
};

const ALERTS = {
	cpu: "cpu_alert",
	ram: "ram_alert",
	gpu: "gpu_alert",
};

class SystemMonitorPlugin extends Plugin {
	async onload() {
		this._si = safeRequireSystemInformation();
		if (!this._si) {
			await this.lumia.log(
				"[System Monitor] systeminformation not installed. CPU/RAM will use basic OS stats and GPU will be disabled. Run `npm install` in the plugin folder for full support."
			);
		}

		this._interval = null;
		this._lastBuckets = {
			cpu: "normal",
			ram: "normal",
			gpu: "normal",
		};
		this._lastCpuSample = this._readCpuTimes();
		await this._startPolling();
	}

	async onsettingsupdate(settings, previous = {}) {
		const next = this._normalizeSettings(settings);
		const prev = this._normalizeSettings(previous);

		if (next.pollIntervalSec !== prev.pollIntervalSec) {
			await this._startPolling();
		}
	}

	onunload() {
		this._stopPolling();
	}

	_normalizeSettings(settings = this.settings) {
		return {
			pollIntervalSec: this._number(settings?.pollIntervalSec, DEFAULTS.pollIntervalSec),
			cpuWarn: this._number(settings?.cpuWarn, DEFAULTS.cpuWarn),
			cpuCritical: this._number(settings?.cpuCritical, DEFAULTS.cpuCritical),
			ramWarn: this._number(settings?.ramWarn, DEFAULTS.ramWarn),
			ramCritical: this._number(settings?.ramCritical, DEFAULTS.ramCritical),
			gpuWarn: this._number(settings?.gpuWarn, DEFAULTS.gpuWarn),
			gpuCritical: this._number(settings?.gpuCritical, DEFAULTS.gpuCritical),
		};
	}

	_number(value, fallback) {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : fallback;
	}

	_stopPolling() {
		if (this._interval) {
			clearInterval(this._interval);
			this._interval = null;
		}
	}

	async _startPolling() {
		this._stopPolling();
		const { pollIntervalSec } = this._normalizeSettings();
		const intervalMs = Math.max(1, pollIntervalSec) * 1000;

		await this._pollOnce();
		this._interval = setInterval(() => {
			this._pollOnce().catch((error) => {
				this.lumia.log(
					`[System Monitor] Poll failed: ${error?.message ?? String(error)}`
				);
			});
		}, intervalMs);
	}

	async _pollOnce() {
		const settings = this._normalizeSettings();
		const { cpuUsage, memUsed, memTotal, gpuInfo } = await this._readMetrics();
		const ramUsage =
			memTotal > 0
				? this._roundPercent((memUsed / memTotal) * 100)
				: 0;

		await Promise.all([
			this.lumia.setVariable(VARIABLES.cpuUsage, cpuUsage),
			this.lumia.setVariable(VARIABLES.ramUsage, ramUsage),
			this.lumia.setVariable(VARIABLES.ramUsedMb, this._toMb(memUsed)),
			this.lumia.setVariable(VARIABLES.ramTotalMb, this._toMb(memTotal)),
			this.lumia.setVariable(VARIABLES.gpuAvailable, gpuInfo.available),
			this.lumia.setVariable(VARIABLES.gpuUsage, gpuInfo.usage),
		]);

		const cpuBucket = this._bucket(cpuUsage, settings.cpuWarn, settings.cpuCritical);
		const ramBucket = this._bucket(ramUsage, settings.ramWarn, settings.ramCritical);
		const gpuBucket = gpuInfo.available
			? this._bucket(gpuInfo.usage, settings.gpuWarn, settings.gpuCritical)
			: "normal";

		await Promise.all([
			this.lumia.setVariable(VARIABLES.cpuBucket, cpuBucket),
			this.lumia.setVariable(VARIABLES.ramBucket, ramBucket),
			this.lumia.setVariable(VARIABLES.gpuBucket, gpuBucket),
		]);

		await this._maybeAlert({
			metric: "cpu",
			bucket: cpuBucket,
			usage: cpuUsage,
			variables: { cpu_usage: cpuUsage, cpu_bucket: cpuBucket },
		});

		await this._maybeAlert({
			metric: "ram",
			bucket: ramBucket,
			usage: ramUsage,
			variables: {
				ram_usage: ramUsage,
				ram_bucket: ramBucket,
				ram_used_mb: this._toMb(memUsed),
				ram_total_mb: this._toMb(memTotal),
			},
		});

		if (gpuInfo.available) {
			await this._maybeAlert({
				metric: "gpu",
				bucket: gpuBucket,
				usage: gpuInfo.usage,
				variables: { gpu_usage: gpuInfo.usage, gpu_bucket: gpuBucket },
			});
		}
	}

	async _readMetrics() {
		if (this._si) {
			const [load, mem, graphics] = await Promise.all([
				this._si.currentLoad(),
				this._si.mem(),
				this._si.graphics().catch(() => ({ controllers: [] })),
			]);

			const cpuUsage = this._roundPercent(load?.currentLoad);
			const memUsed = this._number(mem?.used ?? mem?.active, 0);
			const memTotal = this._number(mem?.total, 0);
			const gpuInfo = this._resolveGpuUsage(graphics);

			return { cpuUsage, memUsed, memTotal, gpuInfo };
		}

		const cpuUsage = this._readCpuUsageFallback();
		const memTotal = os.totalmem();
		const memFree = os.freemem();
		const memUsed = Math.max(0, memTotal - memFree);

		return {
			cpuUsage: this._roundPercent(cpuUsage),
			memUsed,
			memTotal,
			gpuInfo: { available: false, usage: 0 },
		};
	}

	_readCpuTimes() {
		const cpus = os.cpus();
		let idle = 0;
		let total = 0;

		for (const cpu of cpus) {
			const times = cpu.times || {};
			idle += times.idle ?? 0;
			total +=
				(times.user ?? 0) +
				(times.nice ?? 0) +
				(times.sys ?? 0) +
				(times.irq ?? 0) +
				(times.idle ?? 0);
		}

		return { idle, total };
	}

	_readCpuUsageFallback() {
		const prev = this._lastCpuSample || this._readCpuTimes();
		const next = this._readCpuTimes();
		this._lastCpuSample = next;

		const idle = next.idle - prev.idle;
		const total = next.total - prev.total;
		if (total <= 0) return 0;

		return (1 - idle / total) * 100;
	}

	_roundPercent(value) {
		const number = this._number(value, 0);
		return Math.max(0, Math.min(100, Number(number.toFixed(1))));
	}

	_toMb(value) {
		return Number((this._number(value, 0) / 1024 / 1024).toFixed(0));
	}

	_bucket(value, warn, critical) {
		if (value >= critical) return "critical";
		if (value >= warn) return "warning";
		return "normal";
	}

	_resolveGpuUsage(graphics) {
		const controllers = Array.isArray(graphics?.controllers)
			? graphics.controllers
			: [];

		const values = controllers
			.map((controller) => {
				const candidate =
					controller?.utilizationGpu ??
					controller?.utilizationGPU ??
					controller?.utilization ??
					controller?.utilization_gpu ??
					controller?.gpuUtilization ??
					controller?.gpu_utilization;
				return this._number(candidate, NaN);
			})
			.filter((value) => Number.isFinite(value));

		if (!values.length) {
			return { available: false, usage: 0 };
		}

		const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
		return { available: true, usage: this._roundPercent(avg) };
	}

	async _maybeAlert({ metric, bucket, usage, variables }) {
		const last = this._lastBuckets[metric] ?? "normal";
		this._lastBuckets[metric] = bucket;

		if (bucket === last || bucket === "normal") {
			return;
		}

		const alertKey = ALERTS[metric];
		if (!alertKey) return;

		await this.lumia.triggerAlert({
			alert: alertKey,
			dynamic: {
				name: "value",
				value: bucket,
			},
			extraSettings: variables,
		});
	}
}

module.exports = SystemMonitorPlugin;

```

## system_monitor/manifest.json

```
{
  "id": "system_monitor",
  "name": "System Monitor",
  "version": "1.0.0",
  "author": "Lumia Stream",
  "email": "",
  "website": "",
  "repository": "",
  "description": "Monitor CPU, RAM, and GPU usage with variables and alerts.",
  "license": "MIT",
  "lumiaVersion": "^9.0.0",
  "category": "utilities",
  "main": "main.js",
  "icon": "system_monitor.png",
  "keywords": "system, cpu, ram, gpu, alerts",
  "config": {
    "settings": [
      {
        "key": "pollIntervalSec",
        "label": "Poll Interval (seconds)",
        "type": "number",
        "defaultValue": 30,
        "min": 10,
        "max": 120,
        "helperText": "How often to sample CPU/RAM/GPU usage."
      },
      {
        "key": "cpuWarn",
        "label": "CPU Warning Threshold (%)",
        "type": "number",
        "defaultValue": 70,
        "min": 1,
        "max": 99
      },
      {
        "key": "cpuCritical",
        "label": "CPU Critical Threshold (%)",
        "type": "number",
        "defaultValue": 90,
        "min": 1,
        "max": 100
      },
      {
        "key": "ramWarn",
        "label": "RAM Warning Threshold (%)",
        "type": "number",
        "defaultValue": 70,
        "min": 1,
        "max": 99
      },
      {
        "key": "ramCritical",
        "label": "RAM Critical Threshold (%)",
        "type": "number",
        "defaultValue": 90,
        "min": 1,
        "max": 100
      },
      {
        "key": "gpuWarn",
        "label": "GPU Warning Threshold (%)",
        "type": "number",
        "defaultValue": 70,
        "min": 1,
        "max": 99
      },
      {
        "key": "gpuCritical",
        "label": "GPU Critical Threshold (%)",
        "type": "number",
        "defaultValue": 90,
        "min": 1,
        "max": 100
      }
    ],
    "variables": [
      {
        "name": "cpu_usage",
        "value": 0
      },
      {
        "name": "cpu_bucket",
        "value": "normal"
      },
      {
        "name": "ram_usage",
        "value": 0
      },
      {
        "name": "ram_bucket",
        "value": "normal"
      },
      {
        "name": "ram_used_mb",
        "value": 0
      },
      {
        "name": "ram_total_mb",
        "value": 0
      },
      {
        "name": "gpu_available",
        "value": false
      },
      {
        "name": "gpu_usage",
        "value": 0
      },
      {
        "name": "gpu_bucket",
        "value": "normal"
      }
    ],
    "translations": "./translations.json",
    "alerts": [
      {
        "title": "CPU Usage Alert",
        "key": "cpu_alert",
        "acceptedVariables": ["cpu_usage", "cpu_bucket"],
        "defaultMessage": "CPU at {{cpu_usage}}% ({{cpu_bucket}})",
        "variationConditions": [
          {
            "type": "EQUAL_SELECTION",
            "description": "Bucket type",
            "selections": [
              { "label": "Warning", "value": "warning" },
              { "label": "Critical", "value": "critical" }
            ]
          }
        ]
      },
      {
        "title": "RAM Usage Alert",
        "key": "ram_alert",
        "acceptedVariables": [
          "ram_usage",
          "ram_bucket",
          "ram_used_mb",
          "ram_total_mb"
        ],
        "defaultMessage": "RAM at {{ram_usage}}% ({{ram_bucket}})",
        "variationConditions": [
          {
            "type": "EQUAL_SELECTION",
            "description": "Bucket type",
            "selections": [
              { "label": "Warning", "value": "warning" },
              { "label": "Critical", "value": "critical" }
            ]
          }
        ]
      },
      {
        "title": "GPU Usage Alert",
        "key": "gpu_alert",
        "acceptedVariables": ["gpu_usage", "gpu_bucket"],
        "defaultMessage": "GPU at {{gpu_usage}}% ({{gpu_bucket}})",
        "variationConditions": [
          {
            "type": "EQUAL_SELECTION",
            "description": "Bucket type",
            "selections": [
              { "label": "Warning", "value": "warning" },
              { "label": "Critical", "value": "critical" }
            ]
          }
        ]
      }
    ]
  }
}

```

## system_monitor/package.json

```
{
	"name": "lumia-system-monitor-plugin",
	"version": "1.0.0",
	"description": "System monitor plugin for CPU/RAM/GPU usage with alerts.",
	"main": "main.js",
	"author": "Lumia Stream",
	"license": "MIT",
	"dependencies": {
		"systeminformation": "^5.23.6"
	}
}

```

## system_monitor/translations.json

```
{
  "en": {
    "variables": {
      "cpu_usage": "Current CPU usage percent.",
      "cpu_bucket": "Current CPU bucket: normal, warning, critical.",
      "ram_usage": "Current RAM usage percent.",
      "ram_bucket": "Current RAM bucket: normal, warning, critical.",
      "ram_used_mb": "Current RAM used (MB).",
      "ram_total_mb": "Total RAM (MB).",
      "gpu_available": "Whether GPU usage is available.",
      "gpu_usage": "Current GPU usage percent (if available).",
      "gpu_bucket": "Current GPU bucket: normal, warning, critical."
    }
  }
}

```

## trovo/actions_tutorial.md

```
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

## trovo/main.js

```
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

## trovo/manifest.json

```
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

## trovo/package.json

```
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

## trovo/settings_tutorial.md

```
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

## trovo/translations.json

```
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

## typescript_plugin/README.md

```
# TypeScript Plugin Example

This example shows a full Lumia Stream plugin workflow in TypeScript.

## What This Example Demonstrates

- Typed plugin lifecycle methods (`onload`, `onunload`, `onsettingsupdate`, `actions`)
- Typed settings and action payload parsing
- Variable updates (`last_username`, `last_message`, `last_heartbeat`)
- Triggering a Lumia alert from an action

## Project Layout

- `manifest.json` plugin metadata and UI config
- `src/main.ts` plugin implementation in TypeScript
- `tsconfig.json` TypeScript compiler setup
- `package.json` install/build/validate/package scripts

## Setup

```bash
cd examples/typescript_plugin
npm install
npm run build
npm run validate
```

After `npm run build`, the runtime entrypoint is `dist/main.js` (defined by `manifest.main`).
If you copy this example outside this SDK repo, use `npx lumia-plugin validate .` instead.

## How It Works

- On load, the plugin syncs default values to variables and starts a heartbeat timer.
- The heartbeat updates `last_heartbeat` on an interval configured in settings.
- The `send_sample_alert` action accepts optional `username`/`message` overrides.
- Each action run updates variables and triggers `ts_sample_alert`.

## Package For Distribution

```bash
npm run package
```

This runs TypeScript compilation and then builds a `.lumiaplugin` archive with the local CLI script.
If you copy this example outside this SDK repo, use `npx lumia-plugin build .` instead.

```

## typescript_plugin/manifest.json

```
{
	"id": "typescript_plugin_example",
	"name": "TypeScript Plugin Example",
	"version": "1.0.1",
	"author": "Lumia Stream",
	"email": "",
	"website": "",
	"repository": "",
	"description": "Example TypeScript plugin that shows typed settings, actions, variables, and alerts.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "utilities",
	"main": "dist/main.js",
	"keywords": "typescript, sample, lumia, plugin",
	"config": {
		"settings": [
			{
				"key": "defaultMessage",
				"label": "Default Message",
				"type": "text",
				"defaultValue": "Hello from TypeScript Plugin Example!",
				"helperText": "Used when the action does not include a message."
			},
			{
				"key": "heartbeatInterval",
				"label": "Heartbeat Interval (seconds)",
				"type": "number",
				"defaultValue": 15,
				"min": 5,
				"max": 300,
				"helperText": "How often to refresh the heartbeat variable."
			}
		],
		"actions": [
			{
				"type": "send_sample_alert",
				"label": "Send Sample Alert",
				"description": "Triggers the sample alert and updates plugin variables.",
				"fields": [
					{
						"key": "username",
						"label": "Username",
						"type": "text",
						"defaultValue": "Viewer"
					},
					{
						"key": "message",
						"label": "Message",
						"type": "text",
						"defaultValue": "Hello from TypeScript Plugin Example!"
					}
				]
			}
		],
		"variables": [
			{
				"name": "last_username",
				"description": "Most recent username used by the action.",
				"value": ""
			},
			{
				"name": "last_message",
				"description": "Most recent message used by the action.",
				"value": ""
			},
			{
				"name": "last_heartbeat",
				"description": "ISO timestamp from the plugin heartbeat loop.",
				"value": ""
			}
		],
		"alerts": [
			{
				"title": "TypeScript Sample Alert",
				"key": "ts_sample_alert",
				"acceptedVariables": [
					"last_username",
					"last_message"
				],
				"defaultMessage": "{{last_username}}: {{last_message}}"
			}
		],
		"translations": "./translations.json"
	}
}

```

## typescript_plugin/package.json

```
{
	"name": "lumia-typescript-plugin-example",
	"version": "1.0.0",
	"private": true,
	"description": "Example Lumia Stream plugin written in TypeScript.",
	"main": "dist/main.js",
	"scripts": {
		"build": "tsc -p tsconfig.json",
		"watch": "tsc -w -p tsconfig.json",
		"validate": "node ../../cli/scripts/validate-plugin.js .",
		"package": "npm run build && node ../../cli/scripts/build-plugin.js ."
	},
	"dependencies": {
		"@lumiastream/plugin": "^0.4.2"
	},
	"devDependencies": {
		"@types/node": "^20.11.30",
		"typescript": "^5.3.3"
	}
}

```

## typescript_plugin/src/main.ts

```
import {
	Plugin,
	type PluginActionPayload,
	type PluginContext,
	type PluginManifest,
} from "@lumiastream/plugin";

type ExampleSettings = {
	defaultMessage?: string;
	heartbeatInterval?: number;
};

type SendSampleAlertActionValue = {
	username?: string;
	message?: string;
};

const DEFAULTS = {
	defaultMessage: "Hello from TypeScript Plugin Example!",
	defaultUsername: "Viewer",
	heartbeatInterval: 15,
} as const;

const VARIABLE_NAMES = {
	lastUsername: "last_username",
	lastMessage: "last_message",
	lastHeartbeat: "last_heartbeat",
} as const;

class TypeScriptPluginExample extends Plugin {
	private heartbeatTimer?: NodeJS.Timeout;

	constructor(manifest: PluginManifest, context: PluginContext) {
		super(manifest, context);
	}

	async onload(): Promise<void> {
		await this.syncDefaults();
		this.startHeartbeat();
	}

	async onunload(): Promise<void> {
		this.stopHeartbeat();
	}

	async onsettingsupdate(
		settings: Record<string, unknown>,
		previousSettings: Record<string, unknown>,
	): Promise<void> {
		const nextSettings = settings as ExampleSettings;
		const previous = previousSettings as ExampleSettings;
		const nextInterval = Number(
			nextSettings.heartbeatInterval ?? DEFAULTS.heartbeatInterval,
		);
		const previousInterval = Number(
			previous.heartbeatInterval ?? DEFAULTS.heartbeatInterval,
		);

		if (
			nextSettings.defaultMessage !== previous.defaultMessage ||
			nextInterval !== previousInterval
		) {
			await this.syncDefaults(nextSettings);
			this.startHeartbeat();
		}
	}

	async actions(config: { actions: PluginActionPayload[] }): Promise<void> {
		for (const action of config.actions) {
			if (action.type === "send_sample_alert") {
				await this.sendSampleAlert(action.value as SendSampleAlertActionValue);
			}
		}
	}

	private getTypedSettings(
		source: ExampleSettings = this.settings as ExampleSettings,
	): Required<ExampleSettings> {
		const parsedInterval = Number(
			source.heartbeatInterval ?? DEFAULTS.heartbeatInterval,
		);
		const heartbeatInterval = Number.isFinite(parsedInterval)
			? Math.min(300, Math.max(5, parsedInterval))
			: DEFAULTS.heartbeatInterval;

		return {
			defaultMessage:
				source.defaultMessage?.trim() || DEFAULTS.defaultMessage,
			heartbeatInterval,
		};
	}

	private async syncDefaults(settings?: ExampleSettings): Promise<void> {
		const typedSettings = this.getTypedSettings(settings);
		await this.lumia.setVariable(
			VARIABLE_NAMES.lastMessage,
			typedSettings.defaultMessage,
		);
	}

	private startHeartbeat(): void {
		this.stopHeartbeat();
		const { heartbeatInterval } = this.getTypedSettings();

		this.heartbeatTimer = setInterval(() => {
			void this.lumia.setVariable(
				VARIABLE_NAMES.lastHeartbeat,
				new Date().toISOString(),
			);
		}, heartbeatInterval * 1000);
	}

	private stopHeartbeat(): void {
		if (!this.heartbeatTimer) return;
		clearInterval(this.heartbeatTimer);
		this.heartbeatTimer = undefined;
	}

	private async sendSampleAlert(
		data: SendSampleAlertActionValue,
	): Promise<void> {
		const { defaultMessage } = this.getTypedSettings();
		const username = data.username?.trim() || DEFAULTS.defaultUsername;
		const message = data.message?.trim() || defaultMessage;

		await this.lumia.setVariable(VARIABLE_NAMES.lastUsername, username);
		await this.lumia.setVariable(VARIABLE_NAMES.lastMessage, message);

		try {
			await this.lumia.triggerAlert({
				alert: "ts_sample_alert",
				dynamic: {
					name: "message",
					value: message,
				},
				extraSettings: {
					username,
					message,
				},
			});
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			await this.lumia.log(
				`send_sample_alert failed: ${errorMessage}`,
			);
		}
	}
}

export = TypeScriptPluginExample;

```

## typescript_plugin/translations.json

```
{
	"en": {
		"last_username": "Most recent username used by the action.",
		"last_message": "Most recent message used by the action.",
		"last_heartbeat": "ISO timestamp from the plugin heartbeat loop."
	}
}

```

## typescript_plugin/tsconfig.json

```
{
	"compilerOptions": {
		"target": "ES2022",
		"module": "CommonJS",
		"outDir": "./dist",
		"rootDir": "./src",
		"strict": true,
		"esModuleInterop": true,
		"forceConsistentCasingInFileNames": true,
		"skipLibCheck": true
	},
	"include": ["src/**/*.ts"],
	"exclude": ["dist", "node_modules"]
}

```
