# Lumia Plugin Examples: AI And Chat Tools

Use these examples for: AI providers (`hasAI`, `aiPrompt`, `aiModels`), template variable functions, and processing chat messages.

## Index

| Example | What it does | Shows | Field types |
| --- | --- | --- | --- |
| `chat_summarizer` (Chat Summarizer) | Summarizes chat on an interval and highlights users by category. | actions, variables, settings tutorial | number, select, text, textarea |
| `ollama` (Ollama) | Send prompts to a local Ollama server and use responses in Lumia templates via {{ollama_prompt}} and related helpers. | AI provider (`hasAI`), variable functions, translations, settings tutorial | number, select, text, textarea, toggle |
| `openclaw` (OpenClaw) | Send prompts to an OpenClaw Gateway and use responses in Lumia templates via {{openclaw_prompt}} and related helpers. | AI provider (`hasAI`), variable functions, translations, settings tutorial | password, select, text |

## Example: chat_summarizer

Source folder `examples/chat_summarizer`, category `apps`. Summarizes chat on an interval and highlights users by category.

### chat_summarizer/manifest.json

```json
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

### chat_summarizer/main.js

```javascript
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

### chat_summarizer/README.md

```markdown
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

### chat_summarizer/settings_tutorial.md

````markdown
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
````

### chat_summarizer/package.json

```json
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

## Example: ollama

Source folder `examples/ollama`, category `apps`. Send prompts to a local Ollama server and use responses in Lumia templates via {{ollama_prompt}} and related helpers.

### ollama/manifest.json

```json
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

### ollama/main.js

````javascript
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
		const base = this._trim(data?.systemMessage) || this._defaultSystemMessage();
		const maxChars = Number(data?.maxChars);
		const lengthRule = Number.isFinite(maxChars) && maxChars > 0 ? `Keep your entire response under ${maxChars} characters.` : "";
		return [base, lengthRule].filter(Boolean).join(" ").trim();
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
````

### ollama/settings_tutorial.md

```markdown
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

### ollama/package.json

```json
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

### ollama/translations.json

```json
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

## Example: openclaw

Source folder `examples/openclaw`, category `apps`. Send prompts to an OpenClaw Gateway and use responses in Lumia templates via {{openclaw_prompt}} and related helpers.

### openclaw/manifest.json

```json
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

### openclaw/main.js

````javascript
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
		const base = this._trim(data?.systemMessage) || this._defaultSystemMessage();
		const maxChars = Number(data?.maxChars);
		const lengthRule = Number.isFinite(maxChars) && maxChars > 0 ? `Keep your entire response under ${maxChars} characters.` : "";
		return [base, lengthRule].filter(Boolean).join(" ").trim();
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
````

### openclaw/README.md

```markdown
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

### openclaw/settings_tutorial.md

```markdown
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

### openclaw/package.json

```json
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

### openclaw/translations.json

```json
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
