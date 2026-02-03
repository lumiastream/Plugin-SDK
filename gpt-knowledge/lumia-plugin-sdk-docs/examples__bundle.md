# Lumia Plugin Examples

Combined source files from the `examples/` directory. Each section shows the original path followed by file contents.

## base_plugin/README.md

```
# Showcase Plugin Template

This template demonstrates a handful of common Lumia Stream plugin capabilities:

- Logs lifecycle events and recent actions
- Stores and updates variables that other Lumia features can consume
- Responds to custom actions for logging, variable updates, and alert triggering
- Triggers a sample alert effect using configurable colors and duration
- Shows how to react to setting changes inside `onsettingsupdate`

Use the CLI to copy and customise the template:

```
npx lumia-plugin create my_plugin
```

After scaffolding you can tailor the manifest, code, and README to match your idea.

```

## base_plugin/main.js

```
const { Plugin } = require("@lumiastream/plugin");

const VARIABLE_NAMES = {
	lastMessage: "last_message",
	lastAlertColor: "last_alert_color",
};

const DEFAULTS = {
	welcomeMessage: "Hello from Showcase Plugin!",
	color: "#00c2ff",
	alertDuration: 5,
};

class ShowcasePluginTemplate extends Plugin {
	async onload() {
		const message = this._currentMessage();
		await this._log("Plugin loaded");
		await this._rememberMessage(message);

		if (this.settings.autoAlert === "load") {
			await this._triggerSampleAlert({
				color: this.settings.favoriteColor,
				duration: DEFAULTS.alertDuration,
			});
		}
	}

	async onunload() {
		await this._log("Plugin unloaded");
	}

	async onsettingsupdate(settings, previous = {}) {
		await this._log("Settings updated");

		if (
			settings?.welcomeMessage &&
			settings.welcomeMessage !== previous?.welcomeMessage
		) {
			await this._rememberMessage(settings.welcomeMessage);
		}

		if (settings?.autoAlert === "load" && previous?.autoAlert !== "load") {
			await this._log("Auto alert configured to fire on load");
		}
	}

	async actions(config = {}) {
		const actions = Array.isArray(config.actions) ? config.actions : [];
		for (const action of actions) {
			switch (action?.type) {
				case "log_message":
					await this._handleLogMessage(action.data);
					break;
				case "update_variable":
					await this._handleUpdateVariable(action.data);
					break;
				case "trigger_alert":
					await this._triggerSampleAlert(action.data);
					break;
				default:
					await this._log(
						`Unknown action type: ${action?.type ?? "undefined"}`
					);
			}
		}
	}

	_tag() {
		return `[${this.manifest?.id ?? "showcase_plugin"}]`;
	}

	_currentMessage() {
		return (
			this.settings?.welcomeMessage ||
			`Hello from ${this.manifest?.name ?? "Showcase Plugin"}!`
		);
	}

	async _log(message, severity = "info") {
		const prefix = this._tag();
		const decorated =
			severity === "warn"
				? `${prefix} ⚠️ ${message}`
				: severity === "error"
				? `${prefix} ❌ ${message}`
				: `${prefix} ${message}`;

		await this.lumia.addLog(decorated);
	}

	async _rememberMessage(value) {
		await this.lumia.setVariable(VARIABLE_NAMES.lastMessage, value);
	}

	async _handleLogMessage(data = {}) {
		const message = data?.message || this._currentMessage();
		const severity = data?.severity || "info";

		await this._log(message, severity);

		if (typeof this.lumia.showToast === "function") {
			await this.lumia.showToast({
				message: `${this.manifest?.name ?? "Plugin"}: ${message}`,
				time: 4,
			});
		}

		if (this.settings.autoAlert === "after-log") {
			await this._triggerSampleAlert({
				color: this.settings.favoriteColor,
				duration: DEFAULTS.alertDuration,
			});
		}
	}

	async _handleUpdateVariable(data = {}) {
		const value = data?.value ?? new Date().toISOString();
		await this._rememberMessage(value);
		await this._log(`Stored variable value: ${value}`);
	}

	async _triggerSampleAlert(data = {}) {
		const color = data?.color || this.settings?.favoriteColor || DEFAULTS.color;
		const duration = Number(data?.duration) || DEFAULTS.alertDuration;

		try {
			const success = await this.lumia.triggerAlert({
				alert: "sample_light",
				extraSettings: { color, duration },
			});

			if (!success) {
				await this._log("Sample alert reported failure", "warn");
				return;
			}

			await this.lumia.setVariable(VARIABLE_NAMES.lastAlertColor, color);
			await this._log(
				`Triggered sample alert with color ${color} for ${duration}s`
			);
		} catch (error) {
			await this._log(
				`Failed to trigger sample alert: ${error.message ?? error}`,
				"error"
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
	"version": "1.0.0",
	"author": "Lumia Stream",
	"email": "",
	"website": "",
	"repository": "",
	"description": "Sample plugin that demonstrates Lumia Stream logging, variables, alerts, and settings.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "examples",
	"icon": "",
	"changelog": "",
	"config": {
		"settings": [
			{
				"key": "welcomeMessage",
				"label": "Welcome Message",
				"type": "text",
				"defaultValue": "Hello from Showcase Plugin!",
				"helperText": "Shown when the plugin loads and stored in the sample variable."
			},
			{
				"key": "favoriteColor",
				"label": "Favorite Color",
				"type": "color",
				"defaultValue": "#00c2ff",
				"helperText": "Used when triggering the sample light alert."
			},
			{
				"key": "autoAlert",
				"label": "Trigger Sample Alert",
				"type": "select",
				"defaultValue": "never",
				"options": [
					{ "label": "Never", "value": "never" },
					{ "label": "On Load", "value": "load" },
					{ "label": "After Log Action", "value": "after-log" }
				],
				"helperText": "Automatically fire the sample alert at different times."
			}
		],
		"actions": [
			{
				"type": "log_message",
				"label": "Log Message",
				"description": "Write a formatted message to the Lumia log panel and optionally trigger the sample alert.",
				"fields": [
					{
						"key": "message",
						"label": "Message",
						"type": "text",
						"defaultValue": "Hello from Showcase Plugin!"
					},
					{
						"key": "severity",
						"label": "Severity",
						"type": "select",
						"defaultValue": "info",
						"options": [
							{ "label": "Info", "value": "info" },
							{ "label": "Warning", "value": "warn" },
							{ "label": "Error", "value": "error" }
						]
					}
				]
			},
			{
				"type": "update_variable",
				"label": "Update Variable",
				"description": "Persist a value into the sample Lumia variable.",
				"fields": [
					{
						"key": "value",
						"label": "Value",
						"type": "text",
						"defaultValue": "Triggered from an action"
					}
				]
			},
			{
				"type": "trigger_alert",
				"label": "Trigger Sample Alert",
				"description": "Fire the sample alert with optional overrides.",
				"fields": [
					{
						"key": "color",
						"label": "Color",
						"type": "color",
						"defaultValue": "#ff5f5f"
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
				"name": "last_message",
				"description": "Stores the most recent message handled by the plugin.",
				"value": ""
			},
			{
				"name": "last_alert_color",
				"description": "Tracks the color used by the latest sample alert.",
				"value": ""
			}
		],
		"alerts": [
			{
				"title": "Sample Light Alert",
				"key": "sample_light",
				"acceptedVariables": ["last_alert_color"],
				"defaultMessage": "Changing lights to {{last_alert_color}}.",
				"variationConditions": [
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			}
		]
	}
}

```

## base_plugin/package.json

```
{
	"name": "lumia-showcase-plugin-template",
	"version": "1.0.0",
	"private": true,
	"description": "Internal template illustrating logging, variables, actions, and alerts for Lumia Stream plugins.",
	"main": "main.js",
	"dependencies": {
		"@lumiastream/plugin": "^0.1.18"
	}
}

```

## clickup/README.md

```
# ClickUp Tasks (Lumia Plugin Example)

Monitors a ClickUp List for due/overdue tasks, triggers Lumia alerts, and exposes actions for common task workflows.

## Setup

1. Create a ClickUp Personal API Token in ClickUp **Settings** -> **Apps** and copy the token.
2. Open the ClickUp List you want to monitor and copy the List ID from the URL (the number after `/list/`).
3. In Lumia, paste the token and List ID in the plugin settings, then click **Save**.

## Actions

- `Refresh Tasks`: Pull tasks immediately and fire due/overdue alerts.
- `Create Task`: Create a task in the configured List.
- `Update Task Status`: Update an existing task to a new status string (for example, `complete`).

## Alerts

- `ClickUp Task Due Soon`
- `ClickUp Task Overdue`
- `ClickUp Task Created`
- `ClickUp Task Status Updated`

## Variables

- `clickup_last_sync`
- `clickup_due_soon_count`
- `clickup_overdue_count`
- `clickup_task_name`
- `clickup_task_id`
- `clickup_task_due_date`
- `clickup_task_url`
- `clickup_task_status`
- `clickup_last_error`

## Notes

- Due dates can be entered as ISO timestamps (for example, `2026-02-07T18:00:00Z`) or as milliseconds since epoch.
- Poll interval and due-soon thresholds are configurable in the plugin settings.

```

## clickup/main.js

```
const { Plugin } = require("@lumiastream/plugin");

const DEFAULTS = {
	pollIntervalSeconds: 60,
	dueSoonMinutes: 60,
};

const VARIABLE_NAMES = {
	lastSync: "clickup_last_sync",
	dueSoonCount: "clickup_due_soon_count",
	overdueCount: "clickup_overdue_count",
	taskName: "clickup_task_name",
	taskId: "clickup_task_id",
	taskDueDate: "clickup_task_due_date",
	taskUrl: "clickup_task_url",
	taskStatus: "clickup_task_status",
	lastError: "clickup_last_error",
};

const ALERT_KEYS = {
	dueSoon: "clickup_task_due_soon",
	overdue: "clickup_task_overdue",
	created: "clickup_task_created",
	statusUpdated: "clickup_task_status_updated",
};

class ClickUpTasksPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._interval = null;
		this._inFlight = false;
		this._lastDueSoonIds = new Set();
		this._lastOverdueIds = new Set();
	}

	async onload() {
		await this._log("ClickUp plugin loaded");
		await this._startPolling();
	}

	async onunload() {
		this._stopPolling();
		await this._log("ClickUp plugin unloaded");
	}

	async onsettingsupdate(settings, previous = {}) {
		await this._log("Settings updated");

		if (
			settings?.pollIntervalSeconds !== previous?.pollIntervalSeconds ||
			settings?.listId !== previous?.listId ||
			settings?.personalToken !== previous?.personalToken
		) {
			await this._startPolling();
		}
	}

	async actions(config = {}) {
		const actions = Array.isArray(config.actions) ? config.actions : [];
		for (const action of actions) {
			switch (action?.type) {
				case "refresh_tasks":
					await this._refreshTasks({ manual: true });
					break;
				case "create_task":
					await this._handleCreateTask(action?.data);
					break;
				case "update_task_status":
					await this._handleUpdateTaskStatus(action?.data);
					break;
				default:
					await this._log(
						`Unknown action type: ${action?.type ?? "undefined"}`,
						"warn"
					);
			}
		}
	}

	async _startPolling() {
		this._stopPolling();

		const intervalMs = this._pollIntervalMs();
		this._interval = setInterval(() => {
			void this._refreshTasks({ manual: false });
		}, intervalMs);

		await this._refreshTasks({ manual: true });
	}

	_stopPolling() {
		if (this._interval) {
			clearInterval(this._interval);
			this._interval = null;
		}
	}

	_pollIntervalMs() {
		const raw = Number(this.settings?.pollIntervalSeconds);
		const value = Number.isFinite(raw) ? raw : DEFAULTS.pollIntervalSeconds;
		const clamped = Math.min(Math.max(value, 15), 3600);
		return clamped * 1000;
	}

	_dueSoonMs() {
		const raw = Number(this.settings?.dueSoonMinutes);
		const value = Number.isFinite(raw) ? raw : DEFAULTS.dueSoonMinutes;
		const clamped = Math.min(Math.max(value, 5), 7 * 24 * 60);
		return clamped * 60 * 1000;
	}

	async _refreshTasks({ manual }) {
		if (this._inFlight) return;
		this._inFlight = true;

		try {
			const token = this._token();
			const listId = this._listId();
			if (!token || !listId) {
				await this._log(
					"Missing Personal API Token or List ID. Update settings and save.",
					"warn"
				);
				return;
			}

			const response = await this._request(`list/${listId}/task`, {
				method: "GET",
				query: {
					include_closed: "false",
				},
			});

			const tasks = Array.isArray(response?.tasks) ? response.tasks : [];
			const now = Date.now();
			const dueSoonWindow = now + this._dueSoonMs();

			const dueSoon = [];
			const overdue = [];

			for (const task of tasks) {
				const dueDate = this._parseEpoch(task?.due_date);
				if (!dueDate) continue;

				if (dueDate <= now) {
					overdue.push(task);
					continue;
				}

				if (dueDate <= dueSoonWindow) {
					dueSoon.push(task);
				}
			}

			await this.lumia.setVariable(
				VARIABLE_NAMES.lastSync,
				new Date().toISOString()
			);
			await this.lumia.setVariable(
				VARIABLE_NAMES.dueSoonCount,
				String(dueSoon.length)
			);
			await this.lumia.setVariable(
				VARIABLE_NAMES.overdueCount,
				String(overdue.length)
			);
			await this.lumia.setVariable(VARIABLE_NAMES.lastError, "");

			if (manual) {
				await this._log(
					`Fetched ${tasks.length} tasks. Due soon: ${
						dueSoon.length
					}, overdue: ${overdue.length}.`
				);
			}

			await this._emitTaskAlerts(dueSoon, overdue);
		} catch (error) {
			await this.lumia.setVariable(
				VARIABLE_NAMES.lastError,
				String(error?.message ?? error)
			);
			await this._log(
				`Failed to refresh tasks: ${error?.message ?? error}`,
				"error"
			);
		} finally {
			this._inFlight = false;
		}
	}

	async _emitTaskAlerts(dueSoon, overdue) {
		const dueSoonEnabled = this.settings?.enableDueSoonAlerts !== false;
		const overdueEnabled = this.settings?.enableOverdueAlerts !== false;

		const dueSoonIds = new Set(dueSoon.map((task) => task.id));
		const overdueIds = new Set(overdue.map((task) => task.id));

		if (dueSoonEnabled) {
			for (const task of dueSoon) {
				if (this._lastDueSoonIds.has(task.id)) continue;
				await this._setTaskVariables(task);
				await this.lumia.triggerAlert({ alert: ALERT_KEYS.dueSoon });
			}
		}

		if (overdueEnabled) {
			for (const task of overdue) {
				if (this._lastOverdueIds.has(task.id)) continue;
				await this._setTaskVariables(task);
				await this.lumia.triggerAlert({ alert: ALERT_KEYS.overdue });
			}
		}

		this._lastDueSoonIds = dueSoonIds;
		this._lastOverdueIds = overdueIds;
	}

	async _handleCreateTask(data = {}) {
		const token = this._token();
		const listId = this._listId();
		if (!token || !listId) {
			await this._log(
				"Missing Personal API Token or List ID. Update settings and save.",
				"warn"
			);
			return;
		}

		const name = String(data?.name ?? "").trim();
		if (!name) {
			await this._log("Task name is required.", "warn");
			return;
		}

		const payload = {
			name,
		};

		const description = String(data?.description ?? "").trim();
		if (description) {
			payload.description = description;
		}

		const assignees = this._parseAssignees(data?.assigneeIds);
		if (assignees.length) {
			payload.assignees = assignees;
		}

		const priority = this._parsePriority(data?.priority);
		if (priority) {
			payload.priority = priority;
		}

		const dueDate = this._parseDateInput(data?.dueDate);
		if (dueDate) {
			payload.due_date = dueDate;
			payload.due_date_time = true;
		}

		try {
			const task = await this._request(`list/${listId}/task`, {
				method: "POST",
				body: payload,
			});

			await this._setTaskVariables(task);
			await this.lumia.triggerAlert({ alert: ALERT_KEYS.created });
			await this._log(`Created ClickUp task: ${task?.name ?? name}`);
		} catch (error) {
			await this._log(
				`Failed to create task: ${error?.message ?? error}`,
				"error"
			);
		}
	}

	async _handleUpdateTaskStatus(data = {}) {
		const token = this._token();
		if (!token) {
			await this._log("Missing Personal API Token.", "warn");
			return;
		}

		const taskId = String(data?.taskId ?? "").trim();
		if (!taskId) {
			await this._log("Task ID is required.", "warn");
			return;
		}

		const status = String(data?.status ?? "").trim();
		if (!status) {
			await this._log("Status is required.", "warn");
			return;
		}

		try {
			const task = await this._request(`task/${taskId}`, {
				method: "PUT",
				body: { status },
			});

			await this._setTaskVariables(task);
			await this.lumia.setVariable(VARIABLE_NAMES.taskStatus, status);
			await this.lumia.triggerAlert({ alert: ALERT_KEYS.statusUpdated });
			await this._log(
				`Updated task ${task?.name ?? taskId} to status ${status}`
			);
		} catch (error) {
			await this._log(
				`Failed to update task status: ${error?.message ?? error}`,
				"error"
			);
		}
	}

	async _setTaskVariables(task = {}) {
		const dueDate = this._parseEpoch(task?.due_date);
		await this.lumia.setVariable(VARIABLE_NAMES.taskName, task?.name ?? "");
		await this.lumia.setVariable(VARIABLE_NAMES.taskId, task?.id ?? "");
		await this.lumia.setVariable(
			VARIABLE_NAMES.taskDueDate,
			dueDate ? new Date(dueDate).toISOString() : ""
		);
		await this.lumia.setVariable(VARIABLE_NAMES.taskUrl, task?.url ?? "");
		await this.lumia.setVariable(
			VARIABLE_NAMES.taskStatus,
			task?.status?.status ?? ""
		);
	}

	async _request(path, { method = "GET", body, query } = {}) {
		const token = this._token();
		if (!token) {
			throw new Error("Missing ClickUp Personal API Token");
		}

		const url = new URL(`https://api.clickup.com/api/v2/${path}`);
		if (query) {
			for (const [key, value] of Object.entries(query)) {
				if (value === undefined || value === null) continue;
				url.searchParams.set(key, String(value));
			}
		}

		const response = await fetch(url.toString(), {
			method,
			headers: {
				Authorization: token,
				"Content-Type": "application/json",
			},
			body: body ? JSON.stringify(body) : undefined,
		});

		const text = await response.text();
		let payload = null;
		if (text) {
			try {
				payload = JSON.parse(text);
			} catch (error) {
				payload = { message: text };
			}
		}

		if (!response.ok) {
			const message = payload?.err || payload?.message || response.statusText;
			throw new Error(message || "ClickUp API error");
		}

		return payload;
	}

	_token() {
		return String(this.settings?.personalToken ?? "").trim();
	}

	_listId() {
		return String(this.settings?.listId ?? "").trim();
	}

	_parseEpoch(value) {
		if (!value) return null;
		const numberValue = Number(value);
		if (!Number.isFinite(numberValue)) return null;
		return numberValue;
	}

	_parseDateInput(value) {
		if (!value) return null;
		const stringValue = String(value).trim();
		if (!stringValue) return null;

		const numeric = Number(stringValue);
		if (Number.isFinite(numeric)) {
			return numeric;
		}

		const parsed = Date.parse(stringValue);
		return Number.isFinite(parsed) ? parsed : null;
	}

	_parseAssignees(value) {
		if (Array.isArray(value)) {
			return value
				.map((entry) => Number(entry))
				.filter((entry) => Number.isFinite(entry));
		}

		if (typeof value === "string") {
			return value
				.split(",")
				.map((entry) => Number(entry.trim()))
				.filter((entry) => Number.isFinite(entry));
		}

		return [];
	}

	_parsePriority(value) {
		const priority = Number(value);
		if (!Number.isFinite(priority)) return null;
		if (priority < 1 || priority > 4) return null;
		return priority;
	}

	async _log(message, severity = "info") {
		const prefix = `[${this.manifest?.id ?? "clickup_tasks"}]`;
		const decorated =
			severity === "warn"
				? `${prefix} WARN: ${message}`
				: severity === "error"
				? `${prefix} ERROR: ${message}`
				: `${prefix} ${message}`;

		await this.lumia.addLog(decorated);
	}
}

module.exports = ClickUpTasksPlugin;

```

## clickup/manifest.json

```
{
	"id": "clickup_tasks",
	"name": "ClickUp Tasks",
	"version": "1.0.0",
	"author": "Lumia Stream",
	"description": "Monitor ClickUp tasks, trigger Lumia alerts, and create actions for task workflows.",
	"lumiaVersion": "^9.0.0",
	"category": "apps",
	"config": {
		"settings_tutorial": "---\n### Get a ClickUp Personal API Token\n1) In ClickUp, open **Settings**.\n2) Choose **Apps** in the left sidebar.\n3) Under **API Token**, click **Generate** and copy the token.\n4) Paste the token into **Personal API Token** below.\n---\n### Find a List ID\n1) Open the ClickUp List you want to monitor.\n2) Copy the List ID from the URL (the number after `/list/`).\n3) Paste it into **List ID** below.\n---\n### Polling\nSet how often the plugin checks ClickUp. Shorter intervals mean faster alerts but more API calls.\n---",
		"actions_tutorial": "---\n### Actions\n- **Refresh Tasks**: Pull the latest tasks immediately.\n- **Create Task**: Create a task in the configured List.\n- **Update Task Status**: Move a task to a new status (ex: `complete`).\n---\n### Alerts\nAlerts fire when tasks are due soon, overdue, created, or updated. Use the variables in your overlay/message templates.\n---",
		"settings": [
			{
				"key": "personalToken",
				"label": "Personal API Token",
				"type": "password",
				"required": true,
				"placeholder": "pk_...",
				"helperText": "Create this in ClickUp Settings -> Apps."
			},
			{
				"key": "listId",
				"label": "List ID",
				"type": "text",
				"required": true,
				"placeholder": "123456789",
				"helperText": "Used to poll tasks and create new tasks."
			},
			{
				"key": "pollIntervalSeconds",
				"label": "Poll Interval (seconds)",
				"type": "number",
				"defaultValue": 60,
				"min": 15,
				"max": 900,
				"helperText": "How often to check ClickUp for due/overdue tasks."
			},
			{
				"key": "dueSoonMinutes",
				"label": "Due Soon Threshold (minutes)",
				"type": "number",
				"defaultValue": 60,
				"min": 5,
				"max": 1440,
				"helperText": "Tasks due before this window trigger the Due Soon alert."
			},
			{
				"key": "enableDueSoonAlerts",
				"label": "Enable Due Soon Alerts",
				"type": "toggle",
				"defaultValue": true
			},
			{
				"key": "enableOverdueAlerts",
				"label": "Enable Overdue Alerts",
				"type": "toggle",
				"defaultValue": true
			}
		],
		"actions": [
			{
				"type": "refresh_tasks",
				"label": "Refresh Tasks",
				"description": "Poll ClickUp immediately and fire any due/overdue alerts."
			},
			{
				"type": "create_task",
				"label": "Create Task",
				"description": "Create a new ClickUp task in the configured List.",
				"fields": [
					{
						"key": "name",
						"label": "Task Name",
						"type": "text",
						"required": true
					},
					{
						"key": "description",
						"label": "Description",
						"type": "textarea"
					},
					{
						"key": "assigneeIds",
						"label": "Assignee IDs",
						"type": "text_list",
						"helperText": "Optional numeric ClickUp user IDs."
					},
					{
						"key": "priority",
						"label": "Priority (1-4)",
						"type": "number",
						"min": 1,
						"max": 4
					},
					{
						"key": "dueDate",
						"label": "Due Date",
						"type": "text",
						"placeholder": "2026-02-07T18:00:00Z or 1707242400000",
						"helperText": "ISO timestamp or milliseconds since epoch."
					}
				]
			},
			{
				"type": "update_task_status",
				"label": "Update Task Status",
				"description": "Update a task's status (ex: complete, in progress).",
				"fields": [
					{
						"key": "taskId",
						"label": "Task ID",
						"type": "text",
						"required": true
					},
					{
						"key": "status",
						"label": "Status",
						"type": "text",
						"defaultValue": "complete"
					}
				]
			}
		],
		"variables": [
			{
				"name": "clickup_last_sync",
				"description": "Last time the plugin successfully synced tasks.",
				"value": ""
			},
			{
				"name": "clickup_due_soon_count",
				"description": "Number of tasks due soon in the latest poll.",
				"value": "0"
			},
			{
				"name": "clickup_overdue_count",
				"description": "Number of overdue tasks in the latest poll.",
				"value": "0"
			},
			{
				"name": "clickup_task_name",
				"description": "Name of the task tied to the most recent alert/action.",
				"value": ""
			},
			{
				"name": "clickup_task_id",
				"description": "ClickUp task ID for the most recent alert/action.",
				"value": ""
			},
			{
				"name": "clickup_task_due_date",
				"description": "Due date (ISO) for the most recent alert/action.",
				"value": ""
			},
			{
				"name": "clickup_task_url",
				"description": "Task URL for the most recent alert/action.",
				"value": ""
			},
			{
				"name": "clickup_task_status",
				"description": "Status for the most recent alert/action.",
				"value": ""
			},
			{
				"name": "clickup_last_error",
				"description": "Most recent error message (if any).",
				"value": ""
			}
		],
		"alerts": [
			{
				"title": "ClickUp Task Due Soon",
				"key": "clickup_task_due_soon",
				"acceptedVariables": [
					"clickup_task_name",
					"clickup_task_due_date",
					"clickup_task_url",
					"clickup_task_id"
				],
				"defaultMessage": "Task '{{clickup_task_name}}' is due soon ({{clickup_task_due_date}})."
			},
			{
				"title": "ClickUp Task Overdue",
				"key": "clickup_task_overdue",
				"acceptedVariables": [
					"clickup_task_name",
					"clickup_task_due_date",
					"clickup_task_url",
					"clickup_task_id"
				],
				"defaultMessage": "Task '{{clickup_task_name}}' is overdue ({{clickup_task_due_date}})."
			},
			{
				"title": "ClickUp Task Created",
				"key": "clickup_task_created",
				"acceptedVariables": [
					"clickup_task_name",
					"clickup_task_url",
					"clickup_task_id"
				],
				"defaultMessage": "Created ClickUp task '{{clickup_task_name}}'."
			},
			{
				"title": "ClickUp Task Status Updated",
				"key": "clickup_task_status_updated",
				"acceptedVariables": [
					"clickup_task_name",
					"clickup_task_status",
					"clickup_task_id",
					"clickup_task_url"
				],
				"defaultMessage": "Updated '{{clickup_task_name}}' to status '{{clickup_task_status}}'."
			}
		]
	}
}

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
	}

	async onload() {
		await this.resetHttpGifId();
		await this.testConnection();
	}

	async onsettingsupdate(settings, previousSettings) {
		const addressChanged =
			settings?.deviceAddress !== previousSettings?.deviceAddress;
		const portChanged = settings?.devicePort !== previousSettings?.devicePort;

		if (addressChanged || portChanged) {
			await this.testConnection();
		}
	}

	async actions(config = {}) {
		const actionList = Array.isArray(config.actions) ? config.actions : [];

		for (const action of actionList) {
			const params = action?.value ?? action?.data ?? {};

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
						await this.lumia.addLog(
							`[Divoom Pixoo] Unknown action: ${String(action.type)}`,
						);
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				await this.lumia.addLog(
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
			await this.lumia.addLog(
				"[Divoom Pixoo] ⚠️ Device address not configured",
			);
			await this.lumia.showToast({
				message: "Please configure Pixoo device IP address in settings",
			});
			return false;
		}

		const result = await this.sendCommand("Device/GetDeviceTime", {});

		if (result.success) {
			this.connectionHealth.lastSuccessTime = Date.now();
			this.connectionHealth.consecutiveFailures = 0;
			return true;
		} else {
			await this.lumia.addLog(
				`[Divoom Pixoo] ❌ Connection failed: ${result.error}`,
			);
			await this.lumia.showToast({
				message: `Failed to connect to Pixoo: ${result.error}`,
			});
			this.connectionHealth.consecutiveFailures++;
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
		await this.lumia.addLog(
			"[Divoom Pixoo] Refreshing connection to prevent device freeze...",
		);

		// Send a simple query to reset internal counter
		const result = await this.sendCommand("Device/GetDeviceTime", {});

		if (!result.success) {
			await this.lumia.addLog(
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
			await this.lumia.addLog(
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
			await this.lumia.addLog("[Divoom Pixoo] Text message cannot be empty");
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
			await this.lumia.addLog(
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
			await this.lumia.addLog(
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
			await this.lumia.addLog("[Divoom Pixoo] No valid pixels to draw");
			return false;
		}

		// Encode as base64 and send
		const base64Data = this.encodeBase64(buffer);
		const result = await this.sendHttpGif(base64Data, width);

		if (!result.success) {
			await this.lumia.addLog(
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
			await this.lumia.addLog("[Divoom Pixoo] No valid rectangles to draw");
			return false;
		}

		// Encode as base64 and send
		const base64Data = this.encodeBase64(buffer);
		const result = await this.sendHttpGif(base64Data, width);

		if (!result.success) {
			await this.lumia.addLog(
				`[Divoom Pixoo] Failed to draw rectangles: ${result.error}`,
			);
		}
		return result.success;
	}

	async playGifFromUrl(url) {
		if (!url || typeof url !== "string" || !url.startsWith("http")) {
			await this.lumia.addLog("[Divoom Pixoo] Invalid GIF URL");
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
			await this.lumia.addLog(
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
			await this.lumia.addLog(
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
			await this.lumia.addLog(
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
			await this.lumia.addLog(
				"[Divoom Pixoo] Raw command requires a command string",
			);
			return false;
		}

		const extra = payload && typeof payload === "object" ? payload : {};
		const result = await this.sendCommand(trimmed, extra);

		if (!result.success) {
			await this.lumia.addLog(
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

						resolve({
							success: true,
							response: parsed,
						});
					} else {
						// Track failure
						this.connectionHealth.consecutiveFailures++;

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
					await this.lumia.addLog(
						`[Divoom Pixoo] Network error, retrying (${retryCount + 1}/${maxRetries})...`,
					);
					await new Promise((r) => setTimeout(r, 1000));
					resolve(await this.sendCommand(command, payload, retryCount + 1));
				} else {
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
			void this.lumia.addLog(
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
	"version": "1.0.0",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://lumiastream.com",
	"repository": "https://github.com/LumiaStream/divoom-pixoo-plugin",
	"description": "Control Divoom Pixoo WIFI LED matrix displays with reliable communication. Supports text, GIFs, drawing, and more. Includes automatic connection refresh to prevent device freezing.",
	"lumiaVersion": "^9.0.0",
	"license": "MIT",
	"category": "devices",
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
		"settings_tutorial": "---\n### 🎨 Setup Your Divoom Pixoo\n\n1. **Find Your Pixoo's IP Address**:\n   - Use your router's device list\n   - Or use the Divoom app → Device Settings\n   - Example: `192.168.1.42`\n\n2. **Set Static IP (Recommended)**:\n   - Reserve IP in your router's DHCP settings\n   - Prevents IP from changing\n\n3. **Enter Settings**:\n   - IP Address (required)\n   - Port: 80 (default)\n   - Screen size: 64x64 (or 16x16 for Pixoo 16)\n\n4. **Click Save**\n   - Plugin auto-tests connection\n   - Look for ✅ success message\n---",
		"actions_tutorial": "---\n### 🔧 Available Commands\n\n**Basic Control**:\n- Test Connection - Verify device is reachable\n- Set Brightness - Adjust display brightness (0-100)\n- Set Channel - Switch to clock/visualizer/scene\n- Screen On/Off - Power screen on or off\n- Reset Display - Clear and reset to default\n\n**Display Content**:\n- Send Scrolling Text - Display text messages\n- Clear Screen - Clear all content\n- Display Image - Show image from URL\n- Play GIF - Play animated GIF from URL\n\n**Drawing**:\n- Draw Pixel - Draw individual pixels\n- Draw Rectangle - Draw colored rectangles\n\n**Sound**:\n- Play Buzzer - Play buzzer sound\n\n**Advanced**:\n- Send Raw Command - Send custom API commands\n\n---\n### 💡 Tips\n- Commands are rate-limited to 1 per second (prevents crashes)\n- Connection auto-refreshes every 250 commands\n---",
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
						"placeholder": "Enter your message (max 512 chars)..."
					},
					{
						"key": "color",
						"label": "Text Color",
						"type": "color",
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
							{ "label": "Left", "value": "left" },
							{ "label": "Right", "value": "right" }
						]
					},
					{
						"key": "align",
						"label": "Text Alignment",
						"type": "select",
						"defaultValue": "center",
						"options": [
							{ "label": "Left", "value": "left" },
							{ "label": "Center", "value": "center" },
							{ "label": "Right", "value": "right" }
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
						"placeholder": "10,10,#FF0000\n20,20,#00FF00\n30,30,#0000FF",
						"helperText": "Format: x,y,color (one per line or use ; separator). Example: 10,10,#FF0000;20,20,#00FF00"
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
						"placeholder": "Device/SetRTC",
						"helperText": "API command path (e.g., Channel/SetClock)"
					},
					{
						"key": "payload",
						"label": "Payload JSON",
						"type": "textarea",
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
	"name": "lumia-example-divoom-controller",
	"version": "1.0.0",
	"private": true,
	"description": "Control Divoom Pixoo WIFI devices from Lumia Stream actions.",
	"main": "main.js",
	"dependencies": {
		"@lumiastream/plugin": "^0.1.18"
	}
}

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
	async onload() {
		await this.lumia.addLog("[ElevenLabs] Plugin loaded");
	}

	async onunload() {
		await this.lumia.addLog("[ElevenLabs] Plugin unloaded");
	}

	getSettingsSnapshot() {
		const raw = this.settings || {};
		return {
			apiKey: trimString(raw.apiKey),
		};
	}

	async actions(config = {}) {
		const actionList = Array.isArray(config.actions) ? config.actions : [];
		if (!actionList.length) {
			return;
		}

		for (const action of actionList) {
			try {
				const actionData =
					action?.value ?? action?.data ?? action?.params ?? {};
				if (action.type === "speak") {
					await this.handleSpeak(actionData);
				} else if (action.type === "stream_music") {
					await this.handleStreamMusic(actionData);
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				await this.lumia.addLog(`[ElevenLabs] Action failed: ${message}`);
			}
		}
	}

	async handleSpeak(data = {}) {
		const settings = this.getSettingsSnapshot();
		let message = trimString(data.message || data.text, "");
		if (!message) {
			await this.lumia.addLog("[ElevenLabs] Missing message text");
			return;
		}

		const apiKey = settings.apiKey;
		if (!apiKey) {
			await this.lumia.addLog("[ElevenLabs] Missing API key");
			return;
		}

		const voiceId = trimString(data.voiceId, "");
		if (!voiceId) {
			await this.lumia.addLog("[ElevenLabs] Missing Voice ID");
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
			await this.lumia.addLog(
				`[ElevenLabs] Message exceeded ${limitLabel} characters; truncated.`,
			);
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
			await this.lumia.addLog("[ElevenLabs] Missing API key");
			return;
		}

		let prompt = trimString(data.prompt || data.text, "");
		const compositionPlan = parseJson(
			data.compositionPlanJson || data.composition_plan || "",
		);
		if (!prompt && !compositionPlan) {
			await this.lumia.addLog(
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
				await this.lumia.addLog(
					`[ElevenLabs] Prompt exceeded ${promptLimit} characters; truncated.`,
				);
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
				await this.lumia.addLog("[ElevenLabs] Could not resolve Desktop path");
				return;
			}
			const filename = buildMusicFilename(outputFormat);
			const filePath = path.join(desktopPath, filename);
			await fs.writeFile(filePath, Buffer.from(audioBuffer));
			await this.lumia.addLog(`[ElevenLabs] Saved music to ${filePath}`);
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
	"version": "1.0.0",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://elevenlabs.io",
	"repository": "",
	"description": "Generate ElevenLabs text-to-speech audio and play it inside Lumia Stream.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "examples",
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
		"settings_tutorial": "---\n### \ud83d\udd10 Get Your ElevenLabs API Key\n1) Open https://elevenlabs.io/app/settings/api-keys while logged in and create an API Key. Then copy the Key ID and paste it here.\n---\n### \ud83c\udf9b\ufe0f Voice Tuning (used in Actions)\n- **Stability**: Higher values make speech more consistent/predictable; lower values sound more dynamic.\n- **Similarity Boost**: Higher values keep output closer to the original voice; lower values allow more variation.\n- **Style**: Adds expressiveness/character; higher values can sound more dramatic.\n---",
		"actions_tutorial": "---\n### \ud83d\udce2 Speak Action\n1) Enter the **Message** you want spoken.\n2) Paste the **Voice ID** you copied from ElevenLabs (find it at https://elevenlabs.io/app/voice-lab).\n3) Choose a **Model ID** (view model docs at https://elevenlabs.io/docs/overview/models#models-overview).\n4) Adjust **Stability**, **Similarity Boost**, and **Style** if desired.\n---\n### \ud83c\udfb5 Stream Music Action\n1) Enter a **Prompt** (or provide a Composition Plan JSON).\n2) Choose the **Model ID** (see music model docs at https://elevenlabs.io/docs/overview/models#models-overview).\n3) Set **Music Length** and **Volume**.\n---",
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
						"helperText": "Text to synthesize. Character limits vary per model; long messages will be truncated."
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
						"helperText": "Find this in ElevenLabs Voice Lab or your Voices page."
					},
					{
						"key": "modelId",
						"label": "Model ID",
						"type": "select",
						"allowTyping": true,
						"defaultValue": "eleven_multilingual_v2",
						"helperText": "Choose a speech model or type a custom model ID.",
						"options": [
							{ "label": "Eleven v3", "value": "eleven_v3" },
							{ "label": "Multilingual v2", "value": "eleven_multilingual_v2" },
							{ "label": "Multilingual v1", "value": "eleven_multilingual_v1" },
							{ "label": "Turbo v2.5", "value": "eleven_turbo_v2_5" },
							{ "label": "Turbo v2", "value": "eleven_turbo_v2" },
							{ "label": "Flash v2.5", "value": "eleven_flash_v2_5" },
							{ "label": "Flash v2", "value": "eleven_flash_v2" }
						]
					},
					{
						"key": "stability",
						"label": "Stability (0-1)",
						"type": "number",
						"defaultValue": 0.5,
						"helperText": "Higher is more consistent; lower is more expressive.",
						"min": 0,
						"max": 1
					},
					{
						"key": "similarityBoost",
						"label": "Similarity Boost (0-1)",
						"type": "number",
						"defaultValue": 0.5,
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
						"options": [{ "label": "Music v1", "value": "music_v1" }]
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
		"@lumiastream/plugin": "^0.1.18"
	}
}

```

## eveonline/main.js

```
const { Plugin } = require("@lumiastream/plugin");

const DEFAULTS = {
	pollInterval: 60,
	compatibilityDate: "2026-02-03",
	userAgent: "LumiaStream EVE Online Plugin/1.0.0",
};

const ESI_BASE_URL = "https://esi.evetech.net/latest";
const ESI_DATASOURCE = "tranquility";
const SSO_VERIFY_URL = "https://login.eveonline.com/oauth/verify";

const VARIABLE_NAMES = {
	characterId: "eve_character_id",
	characterName: "eve_character_name",
	corporationId: "eve_corporation_id",
	allianceId: "eve_alliance_id",
	securityStatus: "eve_security_status",
	walletBalance: "eve_wallet_balance",
	online: "eve_online",
	lastLogin: "eve_last_login",
	lastLogout: "eve_last_logout",
	logins: "eve_logins",
	solarSystemId: "eve_solar_system_id",
	stationId: "eve_station_id",
	structureId: "eve_structure_id",
	shipName: "eve_ship_name",
	shipTypeId: "eve_ship_type_id",
	shipItemId: "eve_ship_item_id",
	skillqueueCount: "eve_skillqueue_count",
	skillqueueCurrentSkillId: "eve_skillqueue_current_skill_id",
	skillqueueCurrentLevel: "eve_skillqueue_current_level",
	skillqueueCurrentEnd: "eve_skillqueue_current_end",
	skillqueueEndsAt: "eve_skillqueue_ends_at",
	marketOrdersActive: "eve_market_orders_active",
	marketOrdersBuy: "eve_market_orders_buy",
	marketOrdersSell: "eve_market_orders_sell",
	industryJobsActive: "eve_industry_jobs_active",
	industryJobsTotal: "eve_industry_jobs_total",
	killmailsRecentCount: "eve_killmails_recent_count",
	notificationsCount: "eve_notifications_count",
	lastUpdated: "eve_last_updated",
	snapshot: "eve_snapshot_json",
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
		this._characterId = null;
		this._characterName = null;
	}

	async onload() {
		await this._log("EVE Online plugin loaded.");

		if (!this._hasAuthTokens()) {
			await this._log(
				"Missing OAuth tokens. Authorize the plugin to begin.",
				"warn"
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
		await this._log("EVE Online plugin stopped.");
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
			await this._log("EVE Online authentication succeeded.");
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
		const prefix = this._tag();
		const decorated =
			severity === "warn"
				? `${prefix} ⚠️ ${message}`
				: severity === "error"
				? `${prefix} ❌ ${message}`
				: `${prefix} ${message}`;

		await this.lumia.addLog(decorated);
	}


	async _refreshData({ reason } = {}) {
		if (!this._hasAuthTokens()) {
			await this._updateConnectionState(false);
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
						this._fetchCharacterInfo(characterId, accessToken)
					),
					this._safeFetch("wallet", () =>
						this._fetchWallet(characterId, accessToken)
					),
					this._safeFetch("online status", () =>
						this._fetchOnline(characterId, accessToken)
					),
					this._safeFetch("location", () =>
						this._fetchLocation(characterId, accessToken)
					),
					this._safeFetch("ship", () =>
						this._fetchShip(characterId, accessToken)
					),
					this._safeFetch("skill queue", () =>
						this._fetchSkillQueue(characterId, accessToken)
					),
					this._safeFetch("industry jobs", () =>
						this._fetchIndustryJobs(characterId, accessToken)
					),
					this._safeFetch("market orders", () =>
						this._fetchOrders(characterId, accessToken)
					),
					this._safeFetch("killmails", () =>
						this._fetchKillmails(characterId, accessToken)
					),
					this._safeFetch("notifications", () =>
						this._fetchNotifications(characterId, accessToken)
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

				await this._setVariableIfChanged(
					VARIABLE_NAMES.snapshot,
					JSON.stringify(snapshot)
				);
				await this._setVariableIfChanged(
					VARIABLE_NAMES.lastUpdated,
					new Date().toISOString()
				);

				const successCount = results.filter((result) => result.ok).length;
				await this._updateConnectionState(successCount > 0);
				await this._log(
					`ESI data refreshed${reason ? ` (${reason})` : ""}.`
				);
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
			return { characterId: this._characterId, characterName: this._characterName };
		}

		const verify = await this._verifyToken(accessToken);
		const characterId = this._coerceNumber(verify?.CharacterID, 0);
		const characterName = this._coerceString(verify?.CharacterName, "");

		if (!characterId || !characterName) {
			throw new Error("Failed to resolve character identity from SSO.");
		}

		this._characterId = characterId;
		this._characterName = characterName;

		return { characterId, characterName };
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
			throw new Error(
				`SSO verify failed (${response.status}): ${body || "No response body"}`
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
		return this._fetchJson(`/characters/${characterId}/killmails/recent/`, token);
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
		let response = await this._request(path, initialToken, query);

		if (response.status === 401 && this._canRefreshTokens()) {
			const refreshed = await this._refreshAccessToken();
			response = await this._request(path, refreshed, query);
		}

		if (response.status === 304) {
			return null;
		}

		if (!response.ok) {
			const body = await response.text();
			throw new Error(
				`ESI error (${response.status}) on ${path}: ${body || "No response body"}`
			);
		}

		return response.json();
	}

	async _request(path, token, query) {
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

		const headers = {
			Accept: "application/json",
			"User-Agent": DEFAULTS.userAgent,
			"X-Compatibility-Date": DEFAULTS.compatibilityDate,
		};

		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}

		const etag = this._etagCache.get(url.toString());
		if (etag) {
			headers["If-None-Match"] = etag;
		}

		const response = await fetch(url.toString(), { headers });

		const responseEtag = response.headers.get("etag");
		if (responseEtag) {
			this._etagCache.set(url.toString(), responseEtag);
		}

		const errorRemain = this._coerceNumber(
			response.headers.get("X-ESI-Error-Limit-Remain"),
			NaN
		);
		if (!Number.isNaN(errorRemain) && errorRemain <= 5) {
			await this._log(
				`ESI error limit remaining is low (${errorRemain}).`,
				"warn"
			);
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

			await this._log("EVE access token refreshed.");
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
			identity?.characterId ?? 0
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.characterName,
			identity?.characterName ?? ""
		);

		if (!characterInfo) {
			return;
		}

		await this._setVariableIfChanged(
			VARIABLE_NAMES.corporationId,
			this._coerceNumber(characterInfo?.corporation_id, 0)
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.allianceId,
			this._coerceNumber(characterInfo?.alliance_id, 0)
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.securityStatus,
			this._coerceNumber(characterInfo?.security_status, 0)
		);
	}

	async _applyWallet(wallet) {
		if (wallet === null || wallet === undefined) {
			return;
		}

		await this._setVariableIfChanged(
			VARIABLE_NAMES.walletBalance,
			this._coerceNumber(wallet, 0)
		);
	}

	async _applyOnline(online) {
		if (!online) {
			return;
		}

		await this._setVariableIfChanged(
			VARIABLE_NAMES.online,
			Boolean(online?.online)
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.lastLogin,
			this._coerceString(online?.last_login, "")
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.lastLogout,
			this._coerceString(online?.last_logout, "")
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.logins,
			this._coerceNumber(online?.logins, 0)
		);
	}

	async _applyLocation(location) {
		if (!location) {
			return;
		}

		await this._setVariableIfChanged(
			VARIABLE_NAMES.solarSystemId,
			this._coerceNumber(location?.solar_system_id, 0)
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.stationId,
			this._coerceNumber(location?.station_id, 0)
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.structureId,
			this._coerceNumber(location?.structure_id, 0)
		);
	}

	async _applyShip(ship) {
		if (!ship) {
			return;
		}

		await this._setVariableIfChanged(
			VARIABLE_NAMES.shipName,
			this._coerceString(ship?.ship_name, "")
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.shipTypeId,
			this._coerceNumber(ship?.ship_type_id, 0)
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.shipItemId,
			this._coerceNumber(ship?.ship_item_id, 0)
		);
	}

	async _applySkillQueue(queue) {
		if (!Array.isArray(queue)) {
			return;
		}

		const sorted = [...queue].sort(
			(a, b) => this._coerceNumber(a?.queue_position, 0) - this._coerceNumber(b?.queue_position, 0)
		);
		const current = sorted[0] || null;
		const last = sorted[sorted.length - 1] || null;

		await this._setVariableIfChanged(
			VARIABLE_NAMES.skillqueueCount,
			sorted.length
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.skillqueueCurrentSkillId,
			this._coerceNumber(current?.skill_id, 0)
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.skillqueueCurrentLevel,
			this._coerceNumber(current?.finished_level, 0)
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.skillqueueCurrentEnd,
			this._coerceString(current?.finish_date, "")
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.skillqueueEndsAt,
			this._coerceString(last?.finish_date, "")
		);
	}

	async _applyIndustryJobs(jobs) {
		if (!Array.isArray(jobs)) {
			return;
		}

		const activeCount = jobs.filter((job) => job?.status === "active").length;

		await this._setVariableIfChanged(
			VARIABLE_NAMES.industryJobsActive,
			activeCount
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.industryJobsTotal,
			jobs.length
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
			orders.length
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.marketOrdersBuy,
			buyCount
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.marketOrdersSell,
			sellCount
		);
	}

	async _applyKillmails(killmails) {
		if (!Array.isArray(killmails)) {
			return;
		}

		await this._setVariableIfChanged(
			VARIABLE_NAMES.killmailsRecentCount,
			killmails.length
		);
	}

	async _applyNotifications(notifications) {
		if (!Array.isArray(notifications)) {
			return;
		}

		await this._setVariableIfChanged(
			VARIABLE_NAMES.notificationsCount,
			notifications.length
		);
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
			this._refreshToken() && typeof this.lumia?.refreshOAuthToken === "function"
		);
	}

	_pollInterval(settings = this.settings) {
		const interval = this._coerceNumber(
			settings?.pollInterval,
			DEFAULTS.pollInterval
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
				const message = this._errorMessage(error);
				await this._log(
					`Failed to update connection state: ${message}`,
					"warn"
				);
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
	"version": "1.0.0",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://lumiastream.com",
	"repository": "",
	"description": "Pull EVE Online character stats into Lumia variables using ESI.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "examples",
	"icon": "",
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
				"defaultValue": 60,
				"min": 30,
				"max": 900,
				"helperText": "How often to refresh ESI data (30-900 seconds)."
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
		"settings_tutorial": "---\n### Authorize This Plugin\n1) Click **Authorize EVE Online** in the OAuth section.\n2) Choose the character you want to connect and grant access.\n\n**Note:** EVE SSO authorization is per character. To switch characters, re-authorize.\n---\n### Polling\nThis plugin polls ESI on a fixed interval and respects ESI caching headers to avoid rate-limit issues.\n---",
		"actions": [],
		"variables": [
			{
				"name": "eve_character_id",
				"description": "Authenticated character ID.",
				"value": 0
			},
			{
				"name": "eve_character_name",
				"description": "Authenticated character name.",
				"value": ""
			},
			{
				"name": "eve_corporation_id",
				"description": "Character corporation ID.",
				"value": 0
			},
			{
				"name": "eve_alliance_id",
				"description": "Character alliance ID (0 if none).",
				"value": 0
			},
			{
				"name": "eve_security_status",
				"description": "Character security status.",
				"value": 0
			},
			{
				"name": "eve_wallet_balance",
				"description": "Current wallet balance.",
				"value": 0
			},
			{
				"name": "eve_online",
				"description": "Whether the character is currently online.",
				"value": false
			},
			{
				"name": "eve_last_login",
				"description": "Last login timestamp (ISO).",
				"value": ""
			},
			{
				"name": "eve_last_logout",
				"description": "Last logout timestamp (ISO).",
				"value": ""
			},
			{
				"name": "eve_logins",
				"description": "Login count returned by ESI online status.",
				"value": 0
			},
			{
				"name": "eve_solar_system_id",
				"description": "Current solar system ID.",
				"value": 0
			},
			{
				"name": "eve_station_id",
				"description": "Current station ID (0 if not docked).",
				"value": 0
			},
			{
				"name": "eve_structure_id",
				"description": "Current structure ID (0 if none).",
				"value": 0
			},
			{
				"name": "eve_ship_name",
				"description": "Current ship name.",
				"value": ""
			},
			{
				"name": "eve_ship_type_id",
				"description": "Current ship type ID.",
				"value": 0
			},
			{
				"name": "eve_ship_item_id",
				"description": "Current ship item ID.",
				"value": 0
			},
			{
				"name": "eve_skillqueue_count",
				"description": "Number of skills in the queue.",
				"value": 0
			},
			{
				"name": "eve_skillqueue_current_skill_id",
				"description": "Skill ID currently training.",
				"value": 0
			},
			{
				"name": "eve_skillqueue_current_level",
				"description": "Training level for the current skill.",
				"value": 0
			},
			{
				"name": "eve_skillqueue_current_end",
				"description": "Finish time for the current skill (ISO).",
				"value": ""
			},
			{
				"name": "eve_skillqueue_ends_at",
				"description": "Finish time for the last queued skill (ISO).",
				"value": ""
			},
			{
				"name": "eve_market_orders_active",
				"description": "Number of active market orders.",
				"value": 0
			},
			{
				"name": "eve_market_orders_buy",
				"description": "Number of active buy orders.",
				"value": 0
			},
			{
				"name": "eve_market_orders_sell",
				"description": "Number of active sell orders.",
				"value": 0
			},
			{
				"name": "eve_industry_jobs_active",
				"description": "Number of active industry jobs.",
				"value": 0
			},
			{
				"name": "eve_industry_jobs_total",
				"description": "Total industry jobs returned by ESI.",
				"value": 0
			},
			{
				"name": "eve_killmails_recent_count",
				"description": "Count of recent killmails.",
				"value": 0
			},
			{
				"name": "eve_notifications_count",
				"description": "Number of notifications returned by ESI.",
				"value": 0
			},
			{
				"name": "eve_last_updated",
				"description": "Timestamp when ESI data was last refreshed.",
				"value": ""
			},
			{
				"name": "eve_snapshot_json",
				"description": "JSON snapshot of the latest ESI payloads.",
				"value": ""
			}
		]
	}
}

```

## eveonline/package.json

```
{
  "name": "lumia-example-eve-online",
  "version": "1.0.0",
  "private": true,
  "description": "Example Lumia Stream plugin that pulls EVE Online character data from ESI.",
  "main": "main.js",
  "scripts": {},
  "dependencies": {
    "@lumiastream/plugin": "^0.1.18"
  }
}

```

## fitbit/main.js

```
const { Plugin } = require("@lumiastream/plugin");

const FITBIT_API_BASE = "https://api.fitbit.com/1";
const INTRADAY_DETAIL_LEVEL = "1min";
const HEART_RATE_DETAIL_LEVEL = "1min";
const ACTIVE_GAP_MINUTES = 2;
const ACTIVE_LOOKBACK_MINUTES = 5;
const SECONDARY_FETCH_MINUTES = 5;
const HEART_RATE_THRESHOLD_FALLBACK = 95;
const HEART_RATE_THRESHOLD_DELTA = 15;
const DEFAULTS = {
	pollInterval: 60,
};

const VARIABLE_NAMES = {
	date: "fitbit_date",
	steps: "fitbit_steps",
	distance: "fitbit_distance",
	calories: "fitbit_calories",
	restingHeartRate: "fitbit_resting_heart_rate",
	heartZones: "fitbit_heart_rate_zones",
	durationSecs: "fitbit_activity_duration_secs",
	durationMin: "fitbit_activity_duration_min",
	cadence: "fitbit_cadence",
	pace: "fitbit_pace",
	paceSource: "fitbit_pace_source",
	latestActivityName: "fitbit_latest_activity_name",
	latestActivityStart: "fitbit_latest_activity_start",
	lastUpdated: "fitbit_last_updated",
};

class FitbitPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._pollTimer = null;
		this._lastConnectionState = null;
		this._dataRefreshPromise = null;
		this._tokenRefreshPromise = null;
		this._lastVariables = new Map();
		this._intradayCache = {
			date: null,
			steps: null,
			distance: null,
			calories: null,
			heart: null,
		};
		this._lastSecondaryFetchAt = 0;
	}

	async onload() {
		await this._primeVariables();
		await this._log("Fitbit plugin loaded.");

		if (!this._hasAuthTokens()) {
			await this._log(
				"Fitbit access tokens not set. Use the OAuth button in the plugin settings to authorize.",
				"warn",
			);
			await this._updateConnectionState(false);
			return;
		}

		await this._refreshMetrics({ reason: "startup" });
		this._schedulePolling();
	}

	async onunload() {
		this._clearPolling();
		await this._updateConnectionState(false);
		await this._log("Fitbit plugin stopped.");
	}

	async onsettingsupdate(settings, previous = {}) {
		const authChanged =
			(settings?.accessToken ?? "") !== (previous?.accessToken ?? "") ||
			(settings?.refreshToken ?? "") !== (previous?.refreshToken ?? "");

		const pollChanged =
			this._coerceNumber(settings?.pollInterval, DEFAULTS.pollInterval) !==
			this._coerceNumber(previous?.pollInterval, DEFAULTS.pollInterval);

		if (pollChanged || authChanged) {
			this._schedulePolling();
		}

		if (authChanged) {
			if (!this._hasAuthTokens()) {
				await this._log(
					"Fitbit tokens cleared; polling paused until re-authorized.",
					"warn",
				);
				await this._updateConnectionState(false);
				return;
			}
		}

		if (authChanged) {
			await this._refreshMetrics({ reason: "settings-update" });
		}
	}

	async actions(config = {}) {
		const actions = Array.isArray(config.actions) ? config.actions : [];
		if (!actions.length) {
			return;
		}

		for (const action of actions) {
			try {
				switch (action?.type) {
					case "fitbit_refresh":
						await this._refreshMetrics({ reason: "manual-action" });
						break;
					default:
						await this._log(
							`Unknown action type: ${action?.type ?? "undefined"}`,
							"warn",
						);
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				await this._log(
					`Action ${action?.type ?? "unknown"} failed: ${message}`,
					"error",
				);
			}
		}
	}

	async validateAuth() {
		if (!this._hasAuthTokens()) {
			await this._log("Validation failed: missing Fitbit tokens.", "warn");
			return false;
		}

		try {
			const today = this._formatDate(new Date());
			await Promise.all([
				this._fetchIntradayResource("steps", today),
				this._fetchHeartRateIntraday(today),
			]);
			await this._log("Fitbit authentication succeeded.");
			return true;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			await this._log(`Fitbit validation failed: ${message}`, "error");
			return false;
		}
	}

	async _refreshMetrics({ reason } = {}) {
		if (!this._hasAuthTokens()) {
			await this._updateConnectionState(false);
			return;
		}

		if (this._dataRefreshPromise) {
			return this._dataRefreshPromise;
		}

		this._dataRefreshPromise = (async () => {
			try {
				const token = await this._ensureAccessToken();
				const date = this._formatDate(new Date());
				this._ensureIntradayDate(date);

				const [steps, heart] = await Promise.all([
					this._fetchIntradayResource("steps", date, token).catch(
						async (error) => {
							await this._log(
								`Steps data unavailable: ${this._errorMessage(error)}`,
								"warn",
							);
							return null;
						},
					),
					this._fetchHeartRateIntraday(date, token).catch(async (error) => {
						await this._log(
							`Heart rate data unavailable: ${this._errorMessage(error)}`,
							"warn",
						);
						return null;
					}),
				]);

				if (steps) {
					this._intradayCache.steps = steps;
				}
				if (heart) {
					this._intradayCache.heart = heart;
				}

				const activityState = this._detectActivity({
					steps: this._intradayCache.steps,
					heart: this._intradayCache.heart,
				});

				const shouldFetchSecondary =
					activityState.isActive &&
					(this._lastSecondaryFetchAt === 0 ||
						Date.now() - this._lastSecondaryFetchAt >=
							SECONDARY_FETCH_MINUTES * 60000);

				if (shouldFetchSecondary) {
					const [distance, calories] = await Promise.all([
						this._fetchIntradayResource("distance", date, token).catch(
							async (error) => {
								await this._log(
									`Distance data unavailable: ${this._errorMessage(error)}`,
									"warn",
								);
								return null;
							},
						),
						this._fetchIntradayResource("calories", date, token).catch(
							async (error) => {
								await this._log(
									`Calories data unavailable: ${this._errorMessage(error)}`,
									"warn",
								);
								return null;
							},
						),
					]);

					if (distance) {
						this._intradayCache.distance = distance;
					}
					if (calories) {
						this._intradayCache.calories = calories;
					}
					this._lastSecondaryFetchAt = Date.now();
				} else if (!activityState.isActive) {
					this._lastSecondaryFetchAt = 0;
				}

				const metrics = this._deriveActiveMetrics({
					date,
					steps: this._intradayCache.steps,
					distance: this._intradayCache.distance,
					calories: this._intradayCache.calories,
					heart: this._intradayCache.heart,
					activityState,
				});

				await this._applyMetrics(metrics);
				await this._updateConnectionState(true);
			} catch (error) {
				const message = this._errorMessage(error);
				await this._log(`Failed to refresh Fitbit data: ${message}`, "warn");
				await this._updateConnectionState(false);
			} finally {
				this._dataRefreshPromise = null;
			}
		})();

		return this._dataRefreshPromise;
	}

	async _applyMetrics(metrics) {
		const resolvedDate = metrics?.date ?? "";
		const steps = this._coerceNumber(metrics?.steps, 0);
		const distance = this._coerceNumber(metrics?.distance, 0);
		const calories = this._coerceNumber(metrics?.calories, 0);
		const durationSecs = this._coerceNumber(metrics?.durationSecs, 0);
		const durationMin = this._coerceNumber(metrics?.durationMin, 0);
		const cadence = this._coerceNumber(metrics?.cadence, 0);
		const pace = this._coerceNumber(metrics?.pace, 0);
		const paceSource = this._coerceString(metrics?.paceSource, "none");
		const resolvedHeartRate = this._coerceNumber(metrics?.heartRate, 0);
		const heartRateZones = Array.isArray(metrics?.heartRateZones)
			? metrics.heartRateZones
			: [];
		const latestName = this._coerceString(metrics?.activityName, "");
		const latestStart = this._coerceString(metrics?.activityStart, "");

		const updates = [
			{ name: VARIABLE_NAMES.date, value: resolvedDate },
			{ name: VARIABLE_NAMES.steps, value: steps },
			{ name: VARIABLE_NAMES.distance, value: distance },
			{ name: VARIABLE_NAMES.calories, value: calories },
			{ name: VARIABLE_NAMES.restingHeartRate, value: resolvedHeartRate },
			{
				name: VARIABLE_NAMES.heartZones,
				value: JSON.stringify(heartRateZones ?? []),
			},
			{ name: VARIABLE_NAMES.durationSecs, value: durationSecs },
			{ name: VARIABLE_NAMES.durationMin, value: durationMin },
			{ name: VARIABLE_NAMES.cadence, value: cadence },
			{ name: VARIABLE_NAMES.pace, value: pace },
			{ name: VARIABLE_NAMES.paceSource, value: paceSource },
			{ name: VARIABLE_NAMES.latestActivityName, value: latestName },
			{ name: VARIABLE_NAMES.latestActivityStart, value: latestStart },
		];

		let anyChanged = false;
		await Promise.all(
			updates.map(({ name, value }) =>
				this._setVariableIfChanged(name, value).then((changed) => {
					if (changed) {
						anyChanged = true;
					}
				}),
			),
		);

		if (anyChanged) {
			await this._setVariableIfChanged(
				VARIABLE_NAMES.lastUpdated,
				new Date().toISOString(),
			);
		}
	}

	_deriveActiveMetrics({
		date,
		steps,
		distance,
		calories,
		heart,
		activityState,
	}) {
		const stepsData = this._extractIntradaySeries(steps, "steps");
		const distanceData = this._extractIntradaySeries(distance, "distance");
		const caloriesData = this._extractIntradaySeries(calories, "calories");
		const heartSummary = this._extractHeartSummary(heart);
		const heartIntraday = this._extractHeartIntraday(heart);
		const heartThreshold =
			activityState?.heartThreshold ??
			this._heartRateThreshold(heartSummary.restingHeartRate);

		const stepsWindow = this._calculateActiveWindow({
			steps: stepsData.dataset,
			distance: distanceData.dataset,
			calories: caloriesData.dataset,
		});
		const heartWindow = this._calculateHeartActiveWindow(
			heartIntraday.dataset,
			heartThreshold,
		);
		const activeWindow = this._selectActiveWindow(stepsWindow, heartWindow);

		if (activeWindow.activeMinutes <= 0) {
			return this._inactiveMetrics(date);
		}

		const totals = this._sumWindowTotals(
			activeWindow,
			stepsData.dataset,
			distanceData.dataset,
			caloriesData.dataset,
		);

		const durationMin = activeWindow.activeMinutes;
		const durationSecs = durationMin * 60;

		const pace =
			totals.distance > 0 && durationMin > 0
				? durationMin / totals.distance
				: 0;
		const paceSource = totals.distance > 0 ? "computed" : "none";
		const cadence =
			durationMin > 0
				? Math.round((totals.steps / durationMin) * 100) / 100
				: 0;

		const heartRate = this._selectHeartRate({
			dataset: heartIntraday.dataset,
			endMinute: activeWindow.endMinute,
		});

		const activityStart =
			activeWindow.startMinute !== null
				? this._formatDateTime(date, activeWindow.startMinute)
				: "";
		const activityName = activeWindow.activeMinutes > 0 ? "Active session" : "";

		return {
			date,
			steps: totals.steps,
			distance: totals.distance,
			calories: totals.calories,
			durationSecs,
			durationMin,
			cadence,
			pace,
			paceSource,
			heartRate,
			heartRateZones: heartSummary.heartRateZones,
			activityName,
			activityStart,
		};
	}

	_inactiveMetrics(date) {
		return {
			date,
			steps: 0,
			distance: 0,
			calories: 0,
			durationSecs: 0,
			durationMin: 0,
			cadence: 0,
			pace: 0,
			paceSource: "none",
			heartRate: 0,
			heartRateZones: [],
			activityName: "",
			activityStart: "",
		};
	}

	_extractIntradaySeries(response, resource) {
		if (!response) {
			return { summary: 0, dataset: [] };
		}
		const summaryKey = `activities-${resource}`;
		const intradayKey = `activities-${resource}-intraday`;
		const summaryEntry = Array.isArray(response?.[summaryKey])
			? response[summaryKey][0]
			: null;
		const summaryValue = this._coerceNumber(summaryEntry?.value, 0);
		const dataset = Array.isArray(response?.[intradayKey]?.dataset)
			? response[intradayKey].dataset
			: [];

		return { summary: summaryValue, dataset };
	}

	_extractHeartSummary(response) {
		const day = Array.isArray(response?.["activities-heart"])
			? response["activities-heart"][0]
			: null;
		const value = day?.value ?? {};
		return {
			restingHeartRate:
				this._coerceNumber(value?.restingHeartRate, null) ?? null,
			heartRateZones: Array.isArray(value?.heartRateZones)
				? value.heartRateZones
				: [],
		};
	}

	_extractHeartIntraday(response) {
		const intraday = response?.["activities-heart-intraday"];
		const dataset = Array.isArray(intraday?.dataset) ? intraday.dataset : [];
		return { dataset };
	}

	_calculateActiveWindow({ steps, distance, calories }) {
		const stepsMap = this._datasetToMinuteMap(steps);
		const distanceMap = this._datasetToMinuteMap(distance);
		const caloriesMap = this._datasetToMinuteMap(calories);
		return this._calculateActiveWindowFromMaps(
			stepsMap,
			distanceMap,
			caloriesMap,
		);
	}

	_calculateHeartActiveWindow(dataset, threshold) {
		if (!Array.isArray(dataset) || dataset.length === 0) {
			return { startMinute: null, endMinute: null, activeMinutes: 0 };
		}
		const heartMap = new Map();
		for (const entry of dataset) {
			const minute = this._timeToMinute(entry?.time);
			if (minute === null) {
				continue;
			}
			const value = this._coerceNumber(entry?.value, 0);
			if (value >= threshold) {
				heartMap.set(minute, value);
			}
		}

		return this._calculateActiveWindowFromMaps(heartMap);
	}

	_calculateActiveWindowFromMaps(...maps) {
		const lastMinute = this._findLastActiveMinute(...maps);
		if (lastMinute === null) {
			return {
				startMinute: null,
				endMinute: null,
				activeMinutes: 0,
			};
		}

		let startMinute = lastMinute;
		let gap = 0;
		for (let minute = lastMinute; minute >= 0; minute -= 1) {
			if (this._isActiveMinute(minute, ...maps)) {
				startMinute = minute;
				gap = 0;
			} else {
				gap += 1;
				if (gap > ACTIVE_GAP_MINUTES) {
					break;
				}
			}
		}

		const activeMinutes = this._countActiveMinutes(
			startMinute,
			lastMinute,
			...maps,
		);

		return {
			startMinute,
			endMinute: lastMinute,
			activeMinutes,
		};
	}

	_findLastActiveMinute(...maps) {
		const minutes = [];
		for (const map of maps) {
			if (map && map.size) {
				for (const key of map.keys()) {
					minutes.push(Number(key));
				}
			}
		}
		const lastMinute = Math.max(...minutes);
		if (!Number.isFinite(lastMinute)) {
			return null;
		}
		for (let minute = lastMinute; minute >= 0; minute -= 1) {
			if (this._isActiveMinute(minute, ...maps)) {
				return minute;
			}
		}
		return null;
	}

	_selectActiveWindow(stepsWindow, heartWindow) {
		if (heartWindow.activeMinutes > stepsWindow.activeMinutes) {
			return heartWindow;
		}
		return stepsWindow;
	}

	_countActiveMinutes(startMinute, endMinute, ...maps) {
		if (startMinute === null || endMinute === null) {
			return 0;
		}
		let count = 0;
		for (let minute = startMinute; minute <= endMinute; minute += 1) {
			if (this._isActiveMinute(minute, ...maps)) {
				count += 1;
			}
		}
		return count;
	}

	_sumWindowTotals(activeWindow, steps, distance, calories) {
		if (activeWindow.startMinute === null || activeWindow.endMinute === null) {
			return { steps: 0, distance: 0, calories: 0 };
		}

		const stepsMap = this._datasetToMinuteMap(steps);
		const distanceMap = this._datasetToMinuteMap(distance);
		const caloriesMap = this._datasetToMinuteMap(calories);

		let stepsTotal = 0;
		let distanceTotal = 0;
		let caloriesTotal = 0;
		for (
			let minute = activeWindow.startMinute;
			minute <= activeWindow.endMinute;
			minute += 1
		) {
			stepsTotal += stepsMap.get(minute) ?? 0;
			distanceTotal += distanceMap.get(minute) ?? 0;
			caloriesTotal += caloriesMap.get(minute) ?? 0;
		}

		return {
			steps: Math.round(stepsTotal),
			distance: Math.round(distanceTotal * 1000) / 1000,
			calories: Math.round(caloriesTotal),
		};
	}

	_selectHeartRate({ dataset, endMinute }) {
		if (!Array.isArray(dataset) || dataset.length === 0) {
			return 0;
		}

		let candidate = null;
		for (const entry of dataset) {
			const minute = this._timeToMinute(entry?.time);
			if (minute === null) {
				continue;
			}
			if (endMinute !== null && minute > endMinute) {
				continue;
			}
			const value = this._coerceNumber(entry?.value, 0);
			if (value > 0) {
				candidate = value;
			}
		}

		if (candidate !== null) {
			return candidate;
		}

		const lastEntry = dataset[dataset.length - 1];
		return this._coerceNumber(lastEntry?.value, 0);
	}

	_isActiveMinute(minute, ...maps) {
		for (const map of maps) {
			if (!map) {
				continue;
			}
			if ((map.get(minute) ?? 0) > 0) {
				return true;
			}
		}
		return false;
	}

	_detectActivity({ steps, heart }) {
		const stepsData = this._extractIntradaySeries(steps, "steps");
		const heartSummary = this._extractHeartSummary(heart);
		const heartIntraday = this._extractHeartIntraday(heart);
		const heartThreshold = this._heartRateThreshold(
			heartSummary.restingHeartRate,
		);

		const hasStepActivity = this._hasRecentActivity(
			stepsData.dataset,
			ACTIVE_LOOKBACK_MINUTES,
			(entry) => this._coerceNumber(entry?.value, 0) > 0,
		);
		const hasHeartActivity = this._hasRecentActivity(
			heartIntraday.dataset,
			ACTIVE_LOOKBACK_MINUTES,
			(entry) => this._coerceNumber(entry?.value, 0) >= heartThreshold,
		);

		return {
			isActive: hasStepActivity || hasHeartActivity,
			hasStepActivity,
			hasHeartActivity,
			heartThreshold,
		};
	}

	_hasRecentActivity(dataset, lookbackMinutes, predicate) {
		if (!Array.isArray(dataset) || dataset.length === 0) {
			return false;
		}

		let lastMinute = null;
		for (const entry of dataset) {
			const minute = this._timeToMinute(entry?.time);
			if (minute === null) {
				continue;
			}
			lastMinute = minute;
		}
		if (lastMinute === null) {
			return false;
		}

		const cutoff = Math.max(0, lastMinute - lookbackMinutes);
		for (const entry of dataset) {
			const minute = this._timeToMinute(entry?.time);
			if (minute === null || minute < cutoff) {
				continue;
			}
			if (predicate(entry)) {
				return true;
			}
		}

		return false;
	}

	_heartRateThreshold(restingHeartRate) {
		const resting = this._coerceNumber(restingHeartRate, 0);
		if (resting > 0) {
			return Math.max(resting + HEART_RATE_THRESHOLD_DELTA, 80);
		}
		return HEART_RATE_THRESHOLD_FALLBACK;
	}

	_ensureIntradayDate(date) {
		if (this._intradayCache.date === date) {
			return;
		}

		this._intradayCache = {
			date,
			steps: null,
			distance: null,
			calories: null,
			heart: null,
		};
		this._lastSecondaryFetchAt = 0;
	}

	_datasetToMinuteMap(dataset) {
		const map = new Map();
		if (!Array.isArray(dataset)) {
			return map;
		}
		for (const entry of dataset) {
			const minute = this._timeToMinute(entry?.time);
			if (minute === null) {
				continue;
			}
			map.set(minute, this._coerceNumber(entry?.value, 0));
		}
		return map;
	}

	_timeToMinute(time) {
		if (!time || typeof time !== "string") {
			return null;
		}
		const [hours, minutes] = time.split(":").map(Number);
		if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
			return null;
		}
		return hours * 60 + minutes;
	}

	_formatDateTime(date, minuteOfDay) {
		if (!date || minuteOfDay === null || minuteOfDay === undefined) {
			return "";
		}
		const hours = Math.floor(minuteOfDay / 60);
		const minutes = minuteOfDay % 60;
		const hourLabel = String(hours).padStart(2, "0");
		const minuteLabel = String(minutes).padStart(2, "0");
		return `${date}T${hourLabel}:${minuteLabel}:00`;
	}

	async _fetchHeartRateIntraday(date, tokenOverride) {
		return this._fetchJson(
			`/user/-/activities/heart/date/${date}/1d/${HEART_RATE_DETAIL_LEVEL}.json`,
			{ tokenOverride },
		);
	}

	async _fetchIntradayResource(resource, date, tokenOverride) {
		return this._fetchJson(
			`/user/-/activities/${resource}/date/${date}/1d/${INTRADAY_DETAIL_LEVEL}.json`,
			{ tokenOverride },
		);
	}

	async _fetchJson(path, { tokenOverride, query } = {}) {
		const initialToken = tokenOverride ?? (await this._ensureAccessToken());
		const response = await this._request(path, initialToken, query);

		if (response.status === 401 && this._canRefreshTokens()) {
			const refreshed = await this._refreshAccessToken();
			const retry = await this._request(path, refreshed, query);
			return this._readResponse(retry, path);
		}

		return this._readResponse(response, path);
	}

	async _request(path, token, query) {
		const url = new URL(`${FITBIT_API_BASE}${path}`);
		if (query) {
			for (const [key, value] of Object.entries(query)) {
				if (value === undefined || value === null || value === "") {
					continue;
				}
				url.searchParams.set(key, String(value));
			}
		}

		return fetch(url.toString(), {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/json",
			},
		});
	}

	async _readResponse(response, path) {
		if (!response.ok) {
			const body = await response.text();
			throw new Error(
				`Fitbit API error (${response.status}) on ${path}: ${body || "No response body"}`,
			);
		}

		return response.json();
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

			const payload = await this.lumia.refreshOAuthToken({
				refreshToken,
				applicationId: 1,
			});
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

			await this._log("Fitbit access token refreshed.");
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
			throw new Error("Missing Fitbit access credentials.");
		}

		const expiresAt = this._tokenExpiresAt();
		const now = Date.now();
		if (accessToken && !expiresAt) {
			return accessToken;
		}

		if (accessToken && expiresAt && now < expiresAt - 60000) {
			return accessToken;
		}

		if (!this._canRefreshTokens()) {
			return accessToken;
		}

		if (!refreshToken) {
			return accessToken;
		}

		return this._refreshAccessToken();
	}

	_schedulePolling() {
		this._clearPolling();

		const intervalSeconds = this._pollInterval();
		if (!this._hasAuthTokens() || intervalSeconds <= 0) {
			return;
		}

		this._pollTimer = setInterval(() => {
			void this._refreshMetrics({ reason: "poll" });
		}, intervalSeconds * 1000);
	}

	_clearPolling() {
		if (this._pollTimer) {
			clearInterval(this._pollTimer);
			this._pollTimer = null;
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
				const message = this._errorMessage(error);
				await this._log(
					`Failed to update connection state: ${message}`,
					"warn",
				);
			}
		}
	}

	async _primeVariables() {
		await Promise.all([
			this._setVariableIfChanged(VARIABLE_NAMES.date, ""),
			this._setVariableIfChanged(VARIABLE_NAMES.steps, 0),
			this._setVariableIfChanged(VARIABLE_NAMES.distance, 0),
			this._setVariableIfChanged(VARIABLE_NAMES.calories, 0),
			this._setVariableIfChanged(VARIABLE_NAMES.restingHeartRate, 0),
			this._setVariableIfChanged(VARIABLE_NAMES.heartZones, ""),
			this._setVariableIfChanged(VARIABLE_NAMES.durationSecs, 0),
			this._setVariableIfChanged(VARIABLE_NAMES.durationMin, 0),
			this._setVariableIfChanged(VARIABLE_NAMES.cadence, 0),
			this._setVariableIfChanged(VARIABLE_NAMES.pace, 0),
			this._setVariableIfChanged(VARIABLE_NAMES.paceSource, ""),
			this._setVariableIfChanged(VARIABLE_NAMES.latestActivityName, ""),
			this._setVariableIfChanged(VARIABLE_NAMES.latestActivityStart, ""),
			this._setVariableIfChanged(VARIABLE_NAMES.lastUpdated, ""),
		]);
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

	async _log(message, severity = "info") {
		if (typeof this.lumia.addLog !== "function") {
			return;
		}

		await this.lumia.addLog(`[Fitbit] ${message}`, severity);
	}

	_errorMessage(error) {
		return error instanceof Error ? error.message : String(error);
	}

	_accessToken() {
		return this._coerceString(this.settings?.accessToken, "");
	}

	_refreshToken() {
		return this._coerceString(this.settings?.refreshToken, "");
	}

	_tokenExpiresAt() {
		return this._coerceNumber(this.settings?.tokenExpiresAt, 0);
	}

	_pollInterval() {
		return this._coerceNumber(
			this.settings?.pollInterval,
			DEFAULTS.pollInterval,
		);
	}

	_canRefreshTokens() {
		return Boolean(
			this._refreshToken() &&
			typeof this.lumia?.refreshOAuthToken === "function",
		);
	}

	_hasAuthTokens() {
		return Boolean(this._accessToken() || this._refreshToken());
	}

	_formatDate(date) {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	}

	_coerceNumber(value, fallback = 0) {
		if (typeof value === "number" && Number.isFinite(value)) {
			return value;
		}
		if (typeof value === "string" && value.trim().length) {
			const parsed = Number(value);
			return Number.isFinite(parsed) ? parsed : fallback;
		}
		return fallback;
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

	_normalizeValue(value) {
		if (typeof value === "number") {
			return Number.isFinite(value) ? value : 0;
		}
		if (typeof value === "string") {
			return value;
		}
		if (value === null || value === undefined) {
			return "";
		}
		if (typeof value === "object") {
			return JSON.stringify(value);
		}
		return String(value);
	}

	_valuesEqual(a, b) {
		if (typeof a === "number" && typeof b === "number") {
			if (Number.isNaN(a) && Number.isNaN(b)) {
				return true;
			}
		}
		return a === b;
	}
}

module.exports = FitbitPlugin;

```

## fitbit/manifest.json

```
{
	"id": "fitbit",
	"name": "Fitbit",
	"version": "1.0.0",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://lumiastream.com",
	"repository": "",
	"description": "Pull Fitbit current active-session metrics (intraday) into Lumia variables for alerts and overlays.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "examples",
	"icon": "fitbit.jpg",
	"config": {
		"oauth": {
			"buttonLabel": "Authorize Fitbit",
			"helperText": "Connect your Fitbit account to pull current activity metrics (intraday access required for server apps).",
			"openInBrowser": true,
			"scopes": ["activity", "heartrate"],
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
			}
		],
		"settings_tutorial": "---\n### Authorize This Plugin\n1) Click **Authorize Fitbit** in the OAuth section.\n2) Complete the login and grant access.\n---\n### Notes\n- Metrics reflect your current active session using intraday time series.\n- Server apps need Fitbit intraday access enabled.\n- Distance and pace use Fitbit's user unit settings.\n---",
		"actions_tutorial": "---\n### Refresh Metrics\nUse **Refresh Metrics** to pull the current active session right away.\n---",
		"actions": [
			{
				"type": "fitbit_refresh",
				"label": "Refresh Metrics",
				"description": "Fetch Fitbit metrics for the current active session.",
				"fields": []
			}
		],
		"variables": [
			{
				"name": "fitbit_date",
				"description": "Date of the current session (YYYY-MM-DD).",
				"value": ""
			},
			{
				"name": "fitbit_steps",
				"description": "Steps in the current active session.",
				"value": 0
			},
			{
				"name": "fitbit_distance",
				"description": "Distance in the current active session (Fitbit user units).",
				"value": 0
			},
			{
				"name": "fitbit_calories",
				"description": "Calories burned in the current active session.",
				"value": 0
			},
			{
				"name": "fitbit_resting_heart_rate",
				"description": "Current heart rate (latest intraday reading).",
				"value": 0
			},
			{
				"name": "fitbit_heart_rate_zones",
				"description": "JSON array of heart rate zone data for today.",
				"value": ""
			},
			{
				"name": "fitbit_activity_duration_secs",
				"description": "Active duration (seconds) for the current session.",
				"value": 0
			},
			{
				"name": "fitbit_activity_duration_min",
				"description": "Active duration (minutes) for the current session.",
				"value": 0
			},
			{
				"name": "fitbit_cadence",
				"description": "Cadence for the current active session (steps per minute).",
				"value": 0
			},
			{
				"name": "fitbit_pace",
				"description": "Pace computed from the current active session (minutes per distance unit).",
				"value": 0
			},
			{
				"name": "fitbit_pace_source",
				"description": "Source for pace: computed or none.",
				"value": ""
			},
			{
				"name": "fitbit_latest_activity_name",
				"description": "Label for the current active session.",
				"value": ""
			},
			{
				"name": "fitbit_latest_activity_start",
				"description": "Start time of the current active session.",
				"value": ""
			},
			{
				"name": "fitbit_last_updated",
				"description": "ISO timestamp when the Fitbit data was last refreshed.",
				"value": ""
			}
		]
	}
}

```

## fitbit/package.json

```
{
  "name": "lumia-example-fitbit",
  "version": "1.0.0",
  "private": true,
  "description": "Example Lumia Stream plugin that pulls Fitbit activity and heart-rate metrics.",
  "main": "main.js",
  "scripts": {},
  "dependencies": {
    "@lumiastream/plugin": "^0.1.18"
  }
}

```

## hot_news/main.js

```
const { Plugin } = require("@lumiastream/plugin");

const NEWS_API_BASE = "https://newsapi.org/v2";

const DEFAULTS = {
  pollInterval: 300,
  resultsLimit: 5,
};

const VARIABLE_NAMES = {
  title: "hotnews_latest_title",
  description: "hotnews_latest_description",
  url: "hotnews_latest_url",
  source: "hotnews_latest_source",
  image: "hotnews_latest_image",
  published: "hotnews_latest_published",
  count: "hotnews_article_count",
  collection: "hotnews_recent_articles",
  keyword: "hotnews_keyword",
  lastUpdated: "hotnews_last_updated",
};

class HotNewsPlugin extends Plugin {
  constructor(manifest, context) {
    super(manifest, context);
    this._pollTimer = null;
    this._seenUrls = new Set();
    this._seenQueue = [];
    this._lastConnectionState = null;
  }

  async onload() {
    await this._log("Hot News plugin starting up.");

    if (!this._apiKey()) {
      await this._log(
        "NewsAPI key not configured. Add your key in the plugin settings to start polling headlines.",
        "warn"
      );
      await this._updateConnectionState(false);
      await this._primeVariables();
      return;
    }

    await this._primeVariables();
    await this._refreshHeadlines({ initial: true });
    this._schedulePolling();
  }

  async onunload() {
    this._clearPolling();
    await this._updateConnectionState(false);
    await this._log("Hot News plugin stopped.");
  }

  async onsettingsupdate(settings, previous = {}) {
    const apiKeyChanged = (settings?.apiKey ?? "") !== (previous?.apiKey ?? "");
    const pollChanged =
      Number(settings?.pollInterval) !== Number(previous?.pollInterval);
    const filterChanged =
      settings?.country !== previous?.country ||
      settings?.category !== previous?.category ||
      settings?.query !== previous?.query ||
      settings?.resultsLimit !== previous?.resultsLimit;

    if (apiKeyChanged && !this._apiKey()) {
      await this._log(
        "NewsAPI key cleared from settings; pausing headline polling.",
        "warn"
      );
      this._clearPolling();
      await this._updateConnectionState(false);
      return;
    }

    if (pollChanged || apiKeyChanged) {
      this._schedulePolling();
    }

    if (filterChanged || apiKeyChanged) {
      this._seenUrls.clear();
      this._seenQueue = [];
      await this._refreshHeadlines({ reason: "settings-update" });
    }
  }

  async actions(config = {}) {
    const actions = Array.isArray(config.actions) ? config.actions : [];
    if (!actions.length) {
      return;
    }

    for (const action of actions) {
      const data = action?.data ?? action?.value ?? {};
      try {
        switch (action?.type) {
          case "hotnews_manual_refresh":
            await this._refreshHeadlines({ reason: "manual-action" });
            break;
          case "hotnews_search_topic":
            await this._handleSearchAction(data);
            break;
          default:
            await this._log(
              `Received unknown action type: ${action?.type ?? "undefined"}`,
              "warn"
            );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await this._log(
          `Action ${action?.type ?? "unknown"} failed: ${message}`,
          "error"
        );
      }
    }
  }

  async validateAuth(data = {}) {
    const apiKey =
      typeof data?.apiKey === "string" && data.apiKey.trim().length
        ? data.apiKey.trim()
        : this._apiKey();

    if (!apiKey) {
      await this._log("Validation failed: NewsAPI key is required.", "warn");
      return false;
    }

    try {
      const payload = await this._fetchHeadlines({
        apiKey,
        country: data?.country ?? this._country(),
        category: data?.category ?? this._category(),
        keyword: data?.query ?? this._keyword(),
        limit: 1,
      });

      if (Array.isArray(payload?.articles)) {
        await this._log("NewsAPI authentication succeeded.");
        return true;
      }

      await this._log(
        "Validation failed: unexpected response from NewsAPI.",
        "warn"
      );
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this._log(`NewsAPI validation failed: ${message}`, "error");
      return false;
    }
  }

  async _handleSearchAction(data = {}) {
    const rawQuery = typeof data?.query === "string" ? data.query.trim() : "";
    if (!rawQuery) {
      throw new Error("Search action requires a keyword or phrase.");
    }

    const limit = this._coerceNumber(data?.limit, this._resultsLimit());
    await this._log(`Running one-off search for "${rawQuery}".`);

    const response = await this._fetchHeadlines({
      keyword: rawQuery,
      limit,
      country: "",
      category: "",
    });

    await this._processHeadlines(response, {
      keyword: rawQuery,
      initial: true,
    });
  }

  async _refreshHeadlines(options = {}) {
    if (!this._apiKey()) {
      return;
    }

    try {
      const response = await this._fetchHeadlines({
        keyword: this._keyword(),
        limit: this._resultsLimit(),
        country: this._country(),
        category: this._category(),
      });

      await this._processHeadlines(response, {
        keyword: this._keyword(),
        initial: Boolean(options.initial),
      });

      await this._updateConnectionState(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this._log(`Failed to refresh headlines: ${message}`, "warn");
      await this._updateConnectionState(false);
    }
  }

  async _processHeadlines(payload = {}, options = {}) {
    const articles = Array.isArray(payload?.articles)
      ? payload.articles.filter((article) => article && article.title)
      : [];

    const keyword = options.keyword ?? this._keyword();
    const nowIso = new Date().toISOString();
    const latest = articles[0] ?? null;
    const unseenArticle = this._findFirstUnseen(articles);
    const articleSummaries = articles.slice(0, 20).map((article) => ({
      title: article.title ?? "",
      source: article.source?.name ?? "",
      url: article.url ?? "",
      publishedAt: article.publishedAt ?? "",
      image: article.urlToImage ?? "",
      description: article.description ?? "",
    }));

    await Promise.all([
      this._setVariable(VARIABLE_NAMES.title, latest?.title ?? ""),
      this._setVariable(VARIABLE_NAMES.description, latest?.description ?? ""),
      this._setVariable(VARIABLE_NAMES.url, latest?.url ?? ""),
      this._setVariable(VARIABLE_NAMES.source, latest?.source?.name ?? ""),
      this._setVariable(VARIABLE_NAMES.image, latest?.urlToImage ?? ""),
      this._setVariable(VARIABLE_NAMES.published, latest?.publishedAt ?? ""),
      this._setVariable(VARIABLE_NAMES.count, articles.length),
      this._setVariable(
        VARIABLE_NAMES.collection,
        JSON.stringify({
          keyword,
          count: articles.length,
          articles: articleSummaries,
        })
      ),
      this._setVariable(VARIABLE_NAMES.keyword, keyword || ""),
      this._setVariable(VARIABLE_NAMES.lastUpdated, nowIso),
    ]);

    for (const article of articles) {
      if (typeof article?.url === "string" && article.url) {
        this._rememberSeen(article.url);
      }
    }

    if (!options.initial && this._alertsEnabled() && unseenArticle) {
      await this._triggerNewHeadlineAlert(unseenArticle, keyword);
    }

    if (latest) {
      await this._log(
        `Latest headline: ${latest.source?.name ?? "Unknown Source"} – ${
          latest.title
        }`
      );
    } else {
      await this._log("No articles returned for the current filters.", "warn");
    }
  }

  async _triggerNewHeadlineAlert(article, keyword) {
    try {
      await this.lumia.triggerAlert({
        alert: "hotnews_new_headline",
        extraSettings: {
          hotnews_latest_title: article.title ?? "",
          hotnews_latest_source: article.source?.name ?? "",
          hotnews_latest_url: article.url ?? "",
          hotnews_latest_published: article.publishedAt ?? "",
          hotnews_keyword: keyword ?? "",
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this._log(`Failed to trigger headline alert: ${message}`, "warn");
    }
  }

  async _fetchHeadlines({ apiKey, keyword, limit, country, category }) {
    const effectiveKey = apiKey || this._apiKey();
    if (!effectiveKey) {
      throw new Error("Missing NewsAPI key.");
    }

    const clampedLimit = Math.max(
      1,
      Math.min(100, this._coerceNumber(limit, DEFAULTS.resultsLimit))
    );
    const url = new URL(`${NEWS_API_BASE}/top-headlines`);
    url.searchParams.set("pageSize", String(clampedLimit));
    url.searchParams.set("page", "1");

    const resolvedKeyword = typeof keyword === "string" ? keyword.trim() : "";
    if (resolvedKeyword) {
      url.searchParams.set("q", resolvedKeyword);
    }

    const resolvedCountry =
      typeof country === "string" ? country.trim().toLowerCase() : "";
    if (resolvedCountry) {
      url.searchParams.set("country", resolvedCountry);
    }

    const resolvedCategory =
      typeof category === "string" ? category.trim().toLowerCase() : "";
    if (resolvedCategory) {
      url.searchParams.set("category", resolvedCategory);
    }

    if (!resolvedCountry && !resolvedKeyword) {
      url.searchParams.set("language", "en");
    }

    const response = await fetch(url.toString(), {
      headers: {
        "X-Api-Key": effectiveKey,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `NewsAPI error (${response.status}): ${body || "No response body"}`
      );
    }

    const json = await response.json();
    if (json?.status !== "ok") {
      throw new Error(
        json?.message
          ? `NewsAPI returned an error: ${json.message}`
          : "NewsAPI response did not include a success status."
      );
    }

    return json;
  }

  _findFirstUnseen(articles = []) {
    for (const article of articles) {
      const url = typeof article?.url === "string" ? article.url : "";
      if (!url) {
        continue;
      }
      if (!this._seenUrls.has(url)) {
        return article;
      }
    }
    return null;
  }

  _rememberSeen(url) {
    if (!url || this._seenUrls.has(url)) {
      return;
    }

    this._seenUrls.add(url);
    this._seenQueue.push(url);

    const MAX_SEEN = 200;
    while (this._seenQueue.length > MAX_SEEN) {
      const removed = this._seenQueue.shift();
      if (removed) {
        this._seenUrls.delete(removed);
      }
    }
  }

  async _primeVariables() {
    await Promise.all([
      this._setVariable(VARIABLE_NAMES.title, ""),
      this._setVariable(VARIABLE_NAMES.description, ""),
      this._setVariable(VARIABLE_NAMES.url, ""),
      this._setVariable(VARIABLE_NAMES.source, ""),
      this._setVariable(VARIABLE_NAMES.image, ""),
      this._setVariable(VARIABLE_NAMES.published, ""),
      this._setVariable(VARIABLE_NAMES.count, 0),
      this._setVariable(
        VARIABLE_NAMES.collection,
        JSON.stringify({ keyword: "", count: 0, articles: [] })
      ),
      this._setVariable(VARIABLE_NAMES.keyword, this._keyword() || ""),
      this._setVariable(VARIABLE_NAMES.lastUpdated, ""),
    ]);
  }

  _schedulePolling() {
    this._clearPolling();

    const intervalSeconds = this._pollInterval();
    if (!this._apiKey() || intervalSeconds <= 0) {
      return;
    }

    this._pollTimer = setInterval(() => {
      void this._refreshHeadlines();
    }, intervalSeconds * 1000);
  }

  _clearPolling() {
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
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
        const message = error instanceof Error ? error.message : String(error);
        await this._log(
          `Failed to update connection state: ${message}`,
          "warn"
        );
      }
    }
  }

  _apiKey() {
    const value = this.settings?.apiKey;
    return typeof value === "string" ? value.trim() : "";
  }

  _pollInterval() {
    const configured = this._coerceNumber(this.settings?.pollInterval, null);
    if (configured === null) {
      return DEFAULTS.pollInterval;
    }
    return Math.max(60, Math.min(1800, Math.round(configured)));
  }

  _resultsLimit() {
    return Math.max(
      1,
      Math.min(
        20,
        this._coerceNumber(this.settings?.resultsLimit, DEFAULTS.resultsLimit)
      )
    );
  }

  _country() {
    const raw = this.settings?.country;
    return typeof raw === "string" ? raw.trim().toLowerCase() : "";
  }

  _category() {
    const raw = this.settings?.category;
    return typeof raw === "string" ? raw.trim().toLowerCase() : "";
  }

  _keyword() {
    const raw = this.settings?.query;
    return typeof raw === "string" ? raw.trim() : "";
  }

  _alertsEnabled() {
    return this.settings?.enableAlerts !== false;
  }

  _coerceNumber(value, fallback) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim().length) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
  }

  async _setVariable(name, value) {
    try {
      await this.lumia.setVariable(name, value);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this._log(`Failed to set variable ${name}: ${message}`, "warn");
    }
  }

  async _log(message, level = "info") {
    const prefix = `[${this.manifest?.id ?? "hot_planet_news"}]`;
    const decorated =
      level === "warn"
        ? `${prefix} ⚠️ ${message}`
        : level === "error"
        ? `${prefix} ❌ ${message}`
        : `${prefix} ${message}`;

    try {
      await this.lumia.addLog(decorated);
    } catch {
      // Silently ignore logging failures.
    }
  }
}

module.exports = HotNewsPlugin;

```

## hot_news/manifest.json

```
{
  "id": "hot_news",
  "name": "Hot News",
  "version": "1.0.3",
  "author": "Lumia Stream",
  "email": "dev@lumiastream.com",
  "website": "https://lumiastream.com",
  "description": "Fetch breaking headlines from NewsAPI.org, expose them as Lumia variables, and trigger alerts when fresh stories land on your chosen topic.",
  "license": "MIT",
  "lumiaVersion": "^9.0.0",
  "category": "utilities",
  "icon": "hot_news.png",
  "externalHelpLink": "https://lumiastream.com/contact",
  "config": {
    "settings": [
      {
        "key": "apiKey",
        "label": "NewsAPI Key",
        "type": "password",
        "placeholder": "Enter your NewsAPI.org key",
        "helperText": "Generate a key at https://newsapi.org/ to authenticate requests.",
        "required": true
      },
      {
        "key": "country",
        "label": "Country",
        "type": "select",
        "defaultValue": "us",
        "options": [
          { "label": "Argentina", "value": "ar" },
          { "label": "Australia", "value": "au" },
          { "label": "Austria", "value": "at" },
          { "label": "Algeria", "value": "dz" },
          { "label": "Belgium", "value": "be" },
          { "label": "Brazil", "value": "br" },
          { "label": "Bulgaria", "value": "bg" },
          { "label": "Canada", "value": "ca" },
          { "label": "China", "value": "cn" },
          { "label": "Colombia", "value": "co" },
          { "label": "Czechia", "value": "cz" },
          { "label": "Egypt", "value": "eg" },
          { "label": "France", "value": "fr" },
          { "label": "Germany", "value": "de" },
          { "label": "Greece", "value": "gr" },
          { "label": "Hong Kong", "value": "hk" },
          { "label": "Hungary", "value": "hu" },
          { "label": "India", "value": "in" },
          { "label": "Indonesia", "value": "id" },
          { "label": "Ireland", "value": "ie" },
          { "label": "Italy", "value": "it" },
          { "label": "Japan", "value": "jp" },
          { "label": "Latvia", "value": "lv" },
          { "label": "Lithuania", "value": "lt" },
          { "label": "Malaysia", "value": "my" },
          { "label": "Mexico", "value": "mx" },
          { "label": "Morocco", "value": "ma" },
          { "label": "Netherlands", "value": "nl" },
          { "label": "New Zealand", "value": "nz" },
          { "label": "Nigeria", "value": "ng" },
          { "label": "Norway", "value": "no" },
          { "label": "Philippines", "value": "ph" },
          { "label": "Poland", "value": "pl" },
          { "label": "Portugal", "value": "pt" },
          { "label": "Romania", "value": "ro" },
          { "label": "Russia", "value": "ru" },
          { "label": "Saudi Arabia", "value": "sa" },
          { "label": "Serbia", "value": "rs" },
          { "label": "Singapore", "value": "sg" },
          { "label": "Slovakia", "value": "sk" },
          { "label": "Slovenia", "value": "si" },
          { "label": "South Africa", "value": "za" },
          { "label": "South Korea", "value": "kr" },
          { "label": "Sweden", "value": "se" },
          { "label": "Switzerland", "value": "ch" },
          { "label": "Taiwan", "value": "tw" },
          { "label": "Thailand", "value": "th" },
          { "label": "Turkey", "value": "tr" },
          { "label": "Ukraine", "value": "ua" },
          { "label": "United Arab Emirates", "value": "ae" },
          { "label": "United Kingdom", "value": "gb" },
          { "label": "United States", "value": "us" },
          { "label": "Venezuela", "value": "ve" }
        ],
        "helperText": "Restrict headlines to a specific country (defaults to US)."
      },
      {
        "key": "category",
        "label": "Category",
        "type": "select",
        "defaultValue": "",
        "options": [
          { "label": "Any", "value": "" },
          { "label": "Business", "value": "business" },
          { "label": "Entertainment", "value": "entertainment" },
          { "label": "General", "value": "general" },
          { "label": "Health", "value": "health" },
          { "label": "Science", "value": "science" },
          { "label": "Sports", "value": "sports" },
          { "label": "Technology", "value": "technology" }
        ],
        "helperText": "Optional NewsAPI category filter."
      },
      {
        "key": "query",
        "label": "Keyword Filter",
        "type": "text",
        "placeholder": "e.g. spaceX, esports, climate",
        "helperText": "Only return articles matching this keyword or phrase (optional)."
      },
      {
        "key": "pollInterval",
        "label": "Poll Interval (seconds)",
        "type": "number",
        "defaultValue": 300,
        "min": 60,
        "max": 1800,
        "helperText": "How often to refresh headlines (1-30 minutes)."
      },
      {
        "key": "resultsLimit",
        "label": "Results Limit",
        "type": "number",
        "defaultValue": 5,
        "min": 1,
        "max": 20,
        "helperText": "How many headlines to pull each refresh (max 20)."
      },
      {
        "key": "enableAlerts",
        "label": "Enable New Headline Alerts",
        "type": "toggle",
        "defaultValue": true,
        "helperText": "Trigger the alert whenever a headline appears that has not been seen before."
      }
    ],
    "settings_tutorial": "---  ### 🔑 Get Your API Key  Sign up at [https://newsapi.org/](https://newsapi.org/) and copy your API key into the NewsAPI Key field.  ---  ### ⚙️ Choose Coverage  Pick a country, optional category, and keyword filter to focus on the stories you care about.  ---  ### ⏱️ Set Poll Interval  Adjust how often the plugin checks NewsAPI (defaults to every 5 minutes).  ---  ### 🚨 Enable Alerts  Leave alerts enabled to have Lumia announce fresh headlines as they arrive.  ---  ### 🪄 Manual Search with Lumia Actions  You can also use Lumia Actions to trigger a manual NewsAPI search whenever you want.  ---",
    "actions": [
      {
        "type": "hotnews_manual_refresh",
        "label": "Refresh Headlines",
        "description": "Fetch the latest headlines immediately.",
        "fields": []
      },
      {
        "type": "hotnews_search_topic",
        "label": "Search Topic",
        "description": "Run a one-off search for a different keyword and update variables.",
        "fields": [
          {
            "key": "query",
            "label": "Keyword or Phrase",
            "type": "text",
            "placeholder": "e.g. electric vehicles",
            "required": true
          },
          {
            "key": "limit",
            "label": "Results Limit",
            "type": "number",
            "defaultValue": 5,
            "min": 1,
            "max": 20
          }
        ]
      }
    ],
    "alerts": [
      {
        "title": "New Headline",
        "key": "hotnews_new_headline",
        "defaultMessage": "🔥 {{hotnews_latest_title}} ({{hotnews_latest_source}})",
        "acceptedVariables": [
          "hotnews_latest_title",
          "hotnews_latest_source",
          "hotnews_latest_url",
          "hotnews_latest_published",
          "hotnews_keyword"
        ]
      }
    ],
    "variables": [
      {
        "name": "hotnews_latest_title",
        "description": "Headline from the most recent article.",
        "value": ""
      },
      {
        "name": "hotnews_latest_description",
        "description": "Summary of the most recent article.",
        "value": ""
      },
      {
        "name": "hotnews_latest_url",
        "description": "Direct link to the latest article.",
        "value": ""
      },
      {
        "name": "hotnews_latest_source",
        "description": "Source/publisher of the latest article.",
        "value": ""
      },
      {
        "name": "hotnews_latest_image",
        "description": "URL to the lead image for the latest article.",
        "value": ""
      },
      {
        "name": "hotnews_latest_published",
        "description": "ISO timestamp of when the latest article was published.",
        "value": ""
      },
      {
        "name": "hotnews_article_count",
        "description": "Number of articles returned in the latest refresh.",
        "value": 0
      },
      {
        "name": "hotnews_recent_articles",
        "description": "JSON payload containing the most recent headlines.",
        "value": ""
      },
      {
        "name": "hotnews_keyword",
        "description": "Keyword used for the latest refresh.",
        "value": ""
      },
      {
        "name": "hotnews_last_updated",
        "description": "ISO timestamp of the last successful NewsAPI sync.",
        "value": ""
      }
    ]
  }
}

```

## hot_news/package.json

```
{
  "name": "lumia-example-hot-news",
  "version": "1.0.0",
  "private": true,
  "description": "Example Lumia Stream plugin that polls NewsAPI.org for the latest headlines and mirrors them into Lumia variables.",
  "main": "main.js",
  "scripts": {},
  "dependencies": {
    "@lumiastream/plugin": "^0.1.18"
  }
}

```

## lametric/main.js

```
const { Plugin } = require("@lumiastream/plugin");

const DEFAULTS = {
	appsCacheTtlMs: 60000,
};

class LaMetricPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._appsCache = { data: null, fetchedAt: 0 };
	}

	async onload() {
		await this._log("LaMetric plugin loaded.");
	}

	async onunload() {
		await this._log("LaMetric plugin stopped.");
	}

	async validateAuth() {
		if (!this._hasCredentials()) {
			await this._log("Validation failed: missing IP or API key.", "warn");
			return false;
		}

		try {
			await this._getApps(true);
			await this._log("LaMetric authentication succeeded.");
			return true;
		} catch (error) {
			const message = this._errorMessage(error);
			await this._log(`LaMetric validation failed: ${message}`, "error");
			return false;
		}
	}

	async actions(config = {}) {
		const actions = Array.isArray(config.actions) ? config.actions : [];
		if (!actions.length) return;

		for (const action of actions) {
			try {
				switch (action?.type) {
					case "lametric_list_apps":
						await this._handleListApps();
						break;
					case "lametric_switch_app":
						await this._handleSwitchApp(action);
						break;
					case "lametric_weather_forecast":
						await this._handleWeatherForecast(action);
						break;
					case "lametric_send_notification":
						await this._handleSendNotification(action);
						break;
					case "lametric_send_notification_json":
						await this._handleSendNotificationJson(action);
						break;
					default:
						await this._log(`Unknown action type: ${action?.type ?? "undefined"}`, "warn");
				}
			} catch (error) {
				const message = this._errorMessage(error);
				await this._log(`Action ${action?.type ?? "unknown"} failed: ${message}`, "error");
			}
		}
	}


	async refreshActionOptions(config = {}) {
		const actionType = this._coerceString(config?.actionType, "").trim();
		if (!actionType) return;
		const values = config?.values ?? {};
		const apps = await this._getApps(true);
		await this._updateActionOptions(actionType, values, apps);
	}

	async _handleListApps() {
		const apps = await this._getApps(true);
		await this._setVariable("lametric_apps_json", JSON.stringify(apps ?? {}));
		await this._updateActionOptions("lametric_switch_app", {}, apps);
		await this._updateActionOptions("lametric_weather_forecast", {}, apps);
		await this._log("LaMetric apps list updated.");
	}

	async _handleSwitchApp(action) {
		const packageName = this._coerceString(action?.package, "").trim();
		const widgetId = this._coerceString(action?.widgetId, "").trim();
		if (!packageName) {
			throw new Error("App package is required.");
		}

		const apps = await this._getApps(false);
		const resolvedWidgetId = this._resolveWidgetId(apps, packageName, widgetId);
		await this._requestJson(
			`/device/apps/${encodeURIComponent(packageName)}/widgets/${encodeURIComponent(resolvedWidgetId)}/activate`,
			{
				method: "PUT",
			}
		);
		await this._log(`Switched to app ${packageName}.`);
	}

	async _handleWeatherForecast(action) {
		const packageName = "com.lametric.weather";
		const widgetId = this._coerceString(action?.widgetId, "").trim();

		const apps = await this._getApps(false);
		const resolvedWidgetId = this._resolveWidgetId(apps, packageName, widgetId);
		await this._requestJson(
			`/device/apps/${encodeURIComponent(packageName)}/widgets/${encodeURIComponent(resolvedWidgetId)}/actions`,
			{
				method: "POST",
				body: {
					id: "weather.forecast",
					activate: true,
				},
			}
		);
		await this._log("Weather forecast triggered.");
	}

	async _handleSendNotification(action) {
		const message = this._coerceString(action?.message, "").trim();
		if (!message) {
			throw new Error("Message is required.");
		}

		const icon = this._coerceString(action?.icon, "").trim();
		const iconType = this._coerceString(action?.iconType, "none");
		const priority = this._coerceString(action?.priority, "info");
		const lifeTime = this._coerceNumber(action?.lifeTime, 0);
		const cycles = this._coerceNumber(action?.cycles, 0);
		const soundCategory = this._coerceString(action?.soundCategory, "none");
		const soundId = this._coerceString(action?.soundId, "");
		const soundRepeat = this._coerceNumber(action?.soundRepeat, 0);
		const soundUrl = this._coerceString(action?.soundUrl, "");

		const frame = { text: message };
		if (icon) {
			frame.icon = this._normalizeIcon(icon);
		}

		const payload = {
			priority,
			icon_type: iconType,
			model: {
				frames: [frame],
			},
		};

		if (lifeTime > 0) {
			payload.lifeTime = lifeTime;
		}
		if (cycles > 0) {
			payload.model.cycles = cycles;
		}

		const sound = this._buildSound({ soundCategory, soundId, soundRepeat, soundUrl });
		if (sound) {
			payload.model.sound = sound;
		}

		const response = await this._requestJson("/device/notifications", {
			method: "POST",
			body: payload,
		});

		if (response?.id) {
			await this._log(`Notification sent (${response.id}).`);
		} else {
			await this._log("Notification sent.");
		}
	}

	async _handleSendNotificationJson(action) {
		const payloadJson = this._coerceString(action?.payloadJson, "").trim();
		if (!payloadJson) {
			throw new Error("Payload JSON is required.");
		}

		let payload;
		try {
			const parsed = JSON.parse(payloadJson);
			if (Array.isArray(parsed)) {
				payload = { model: { frames: parsed } };
			} else if (parsed && typeof parsed === "object") {
				if (parsed.model || parsed.frames) {
					if (parsed.model) {
						payload = parsed;
					} else {
						payload = { model: { frames: parsed.frames } };
					}
				} else {
					payload = parsed;
				}
			} else {
				throw new Error("Payload must be a JSON object or array.");
			}
		} catch (error) {
			throw new Error("Invalid JSON payload.");
		}

		await this._requestJson("/device/notifications", {
			method: "POST",
			body: payload,
		});
		await this._log("Notification payload sent.");
	}

	_buildSound({ soundCategory, soundId, soundRepeat, soundUrl }) {
		if (soundUrl) {
			const sound = { url: soundUrl, type: "mp3" };
			if (soundRepeat > 0) {
				sound.repeat = soundRepeat;
			}
			if (soundCategory !== "none" && soundId) {
				sound.fallback = {
					category: soundCategory,
					id: soundId,
				};
				if (soundRepeat > 0) {
					sound.fallback.repeat = soundRepeat;
				}
			}
			return sound;
		}

		if (soundCategory === "none" || !soundId) {
			return null;
		}

		const sound = {
			category: soundCategory,
			id: soundId,
		};
		if (soundRepeat > 0) {
			sound.repeat = soundRepeat;
		}
		return sound;
	}

	_normalizeIcon(icon) {
		if (/^\d+$/.test(icon)) {
			return Number(icon);
		}
		return icon;
	}

	async _getApps(force) {
		if (!force && this._appsCache.data && Date.now() - this._appsCache.fetchedAt < DEFAULTS.appsCacheTtlMs) {
			return this._appsCache.data;
		}

		const data = await this._requestJson("/device/apps", { method: "GET" });
		this._appsCache = {
			data,
			fetchedAt: Date.now(),
		};
		return data;
	}

	_resolveWidgetId(apps, packageName, widgetId) {
		if (widgetId) return widgetId;
		const app = apps?.[packageName];
		if (!app) {
			throw new Error(`App not found: ${packageName}`);
		}
		const widgets = app.widgets ?? {};
		const entries = Object.entries(widgets);
		if (!entries.length) {
			throw new Error(`No widgets found for app ${packageName}.`);
		}
		const visible = entries.find(([, widget]) => widget?.visible);
		return (visible ? visible[0] : entries[0][0]);
	}


	async _updateActionOptions(actionType, values, apps) {
		if (!this._canUpdateActionOptions()) return;
		if (!apps || typeof apps !== "object") return;

		if (actionType === "lametric_switch_app") {
			const packageOptions = this._buildAppOptions(apps);
			await this._setActionOptions(actionType, "package", packageOptions);

			const packageName = this._coerceString(values?.package, "").trim();
			const widgetOptions = this._buildWidgetOptions(apps, packageName);
			await this._setActionOptions(actionType, "widgetId", widgetOptions);
			return;
		}

		if (actionType === "lametric_weather_forecast") {
			const widgetOptions = this._buildWidgetOptions(apps, "com.lametric.weather");
			await this._setActionOptions(actionType, "widgetId", widgetOptions);
		}
	}

	_canUpdateActionOptions() {
		return typeof this.lumia?.updateActionFieldOptions === "function";
	}

	async _setActionOptions(actionType, fieldKey, options) {
		if (!this._canUpdateActionOptions()) return;
		await this.lumia.updateActionFieldOptions({
			actionType,
			fieldKey,
			options,
		});
	}

	_buildAppOptions(apps) {
		return Object.entries(apps ?? {}).map(([packageName, app]) => ({
			label: app?.name ?? app?.title ?? packageName,
			value: packageName,
		}));
	}

	_buildWidgetOptions(apps, packageName) {
		if (!packageName) return [];
		const app = apps?.[packageName];
		if (!app) return [];
		const widgets = app.widgets ?? {};
		return Object.entries(widgets).map(([widgetId, widget]) => ({
			label: widget?.title ?? widget?.name ?? widgetId,
			value: widgetId,
		}));
	}
	async _requestJson(path, { method = "GET", body } = {}) {
		const url = `${this._baseUrl()}${path}`;
		const headers = {
			Authorization: this._authHeader(),
			Accept: "application/json",
		};
		const options = { method, headers };
		if (body !== undefined) {
			options.headers["Content-Type"] = "application/json";
			options.body = JSON.stringify(body);
		}

		const response = await fetch(url, options);
		const text = await response.text();
		if (!response.ok) {
			throw new Error(`LaMetric API error (${response.status}): ${text || "No response body"}`);
		}

		if (!text) {
			return null;
		}

		try {
			return JSON.parse(text);
		} catch (error) {
			return text;
		}
	}

	_baseUrl() {
		const ip = this._coerceString(this.settings?.deviceIp, "").trim();
		if (!ip) {
			throw new Error("Device IP address is required.");
		}
		if (/^https?:\/\//i.test(ip)) {
			return `${ip.replace(/\/+$/, "")}/api/v2`;
		}
		const hasPort = /:\d+$/.test(ip);
		const host = hasPort ? ip : `${ip}:8080`;
		return `http://${host}/api/v2`;
	}

	_authHeader() {
		const apiKey = this._coerceString(this.settings?.apiKey, "");
		if (!apiKey) {
			throw new Error("Device API key is required.");
		}
		const token = Buffer.from(`dev:${apiKey}`).toString("base64");
		return `Basic ${token}`;
	}

	_hasCredentials() {
		return Boolean(this.settings?.deviceIp && this.settings?.apiKey);
	}

	async _setVariable(name, value) {
		if (typeof this.lumia.setVariable !== "function") {
			return;
		}

		await this.lumia.setVariable(name, value);
	}

	async _log(message, severity = "info") {
		if (typeof this.lumia.addLog !== "function") {
			return;
		}

		await this.lumia.addLog(`[LaMetric] ${message}`, severity);
	}

	_errorMessage(error) {
		return error instanceof Error ? error.message : String(error);
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

	_coerceNumber(value, fallback = 0) {
		if (typeof value === "number" && Number.isFinite(value)) {
			return value;
		}
		if (typeof value === "string" && value.trim().length) {
			const parsed = Number(value);
			return Number.isFinite(parsed) ? parsed : fallback;
		}
		return fallback;
	}
}

module.exports = LaMetricPlugin;

```

## lametric/manifest.json

```
{
	"id": "lametric",
	"name": "LaMetric Time",
	"version": "1.0.0",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://lumiastream.com",
	"repository": "",
	"description": "Control LaMetric Time devices on your local network with actions for apps, weather, and notifications.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "devices",
	"config": {
		"settings": [
			{
				"key": "deviceIp",
				"label": "Device IP Address",
				"type": "text",
				"placeholder": "192.168.1.50",
				"helperText": "Find it in the LaMetric Time app: Settings -> Wi-Fi -> IP Address.",
				"required": true
			},
			{
				"key": "apiKey",
				"label": "Device API Key",
				"type": "password",
				"helperText": "Copy from the LaMetric Time app: Device -> Settings -> Device API Key.",
				"required": true
			}
		],
		"settings_tutorial": "---\n### Connect Your LaMetric\n\n1) Open the LaMetric Time mobile app.\n2) Go to **Settings -> Wi-Fi** and copy the **IP Address**.\n3) Go to **Device -> Settings -> Device API Key** and copy the key.\n4) Paste both values here and click Save.\n\nNotes:\n- This plugin uses the local device API on port 8080.\n- If your IP changes, update the setting.\n---",
		"actions_tutorial": "---\n### Actions\n\n**Refresh Settings**\n- Use the Refresh Settings button in the Actions panel to pull the latest app list for dropdowns.\n\n**List Apps**\n- Fetches installed apps and saves them into the `lametric_apps_json` variable.\n- Use this to find `package` and `widgetId` values.\n\n**Switch App**\n- Activates an app widget by package and widget ID.\n- Leave Widget ID empty to use the first widget found.\n\n**Weather Forecast**\n- Triggers the LaMetric weather app forecast action.\n- Leave Widget ID empty to use the first weather widget.\n\n**Send Notification**\n- Sends a notification with text and optional icon (icon ID or base64 data URI).\n- Use `data:image/gif;base64,...` to send animated icons if supported by your device.\n\n**Send Notification (JSON)**\n- Paste a full LaMetric notification payload or just an array of frames.\n---",
		"actions": [
			{
				"type": "lametric_list_apps",
				"label": "List Apps",
				"description": "Fetch installed apps and store them in a variable.",
				"fields": []
			},
			{
				"type": "lametric_switch_app",
				"label": "Switch App",
				"description": "Switch the device to a specific app widget.",
				"fields": [
					{
						"key": "package",
						"label": "App Package",
						"type": "select",
						"allowTyping": true,
						"options": [],
						"refreshOnChange": true,
						"dynamicOptions": true,
						"required": true,
						"placeholder": "com.lametric.clock"
					},
					{
						"key": "widgetId",
						"label": "Widget ID",
						"type": "select",
						"allowTyping": true,
						"options": [],
						"dynamicOptions": true,
						"required": false,
						"placeholder": "UUID",
						"helperText": "Leave blank to use the first widget found."
					}
				]
			},
			{
				"type": "lametric_weather_forecast",
				"label": "Weather Forecast",
				"description": "Show the weather forecast app.",
				"fields": [
					{
						"key": "widgetId",
						"label": "Weather Widget ID",
						"type": "select",
						"allowTyping": true,
						"options": [],
						"dynamicOptions": true,
						"required": false,
						"placeholder": "UUID",
						"helperText": "Leave blank to use the first weather widget found."
					}
				]
			},
			{
				"type": "lametric_send_notification",
				"label": "Send Notification",
				"description": "Send a text notification with optional icon and sound.",
				"fields": [
					{
						"key": "message",
						"label": "Message",
						"type": "textarea",
						"required": true,
						"placeholder": "Your message"
					},
					{
						"key": "icon",
						"label": "Icon (ID or data URI)",
						"type": "text",
						"required": false,
						"placeholder": "12345 or data:image/gif;base64,...",
						"helperText": "Use an icon ID from the LaMetric gallery or a base64 data URI."
					},
					{
						"key": "iconType",
						"label": "Icon Type",
						"type": "select",
						"defaultValue": "none",
						"options": [
							{ "label": "None", "value": "none" },
							{ "label": "Info", "value": "info" },
							{ "label": "Alert", "value": "alert" }
						]
					},
					{
						"key": "priority",
						"label": "Priority",
						"type": "select",
						"defaultValue": "info",
						"options": [
							{ "label": "Info", "value": "info" },
							{ "label": "Warning", "value": "warning" },
							{ "label": "Critical", "value": "critical" }
						]
					},
					{
						"key": "lifeTime",
						"label": "Lifetime (ms)",
						"type": "number",
						"required": false,
						"placeholder": "60000",
						"helperText": "How long the notification stays visible."
					},
					{
						"key": "cycles",
						"label": "Cycles",
						"type": "number",
						"required": false,
						"placeholder": "1",
						"helperText": "How many times to repeat the frames."
					},
					{
						"key": "soundCategory",
						"label": "Sound Category",
						"type": "select",
						"defaultValue": "none",
						"options": [
							{ "label": "None", "value": "none" },
							{ "label": "Notifications", "value": "notifications" },
							{ "label": "Alarms", "value": "alarms" }
						]
					},
					{
						"key": "soundId",
						"label": "Sound ID",
						"type": "text",
						"required": false,
						"placeholder": "bicycle"
					},
					{
						"key": "soundRepeat",
						"label": "Sound Repeat",
						"type": "number",
						"required": false,
						"placeholder": "1"
					},
					{
						"key": "soundUrl",
						"label": "Sound URL",
						"type": "text",
						"required": false,
						"placeholder": "https://example.com/sound.mp3",
						"helperText": "Optional custom sound URL."
					}
				]
			},
			{
				"type": "lametric_send_notification_json",
				"label": "Send Notification (JSON)",
				"description": "Send a raw notification payload or frames array.",
				"fields": [
					{
						"key": "payloadJson",
						"label": "Payload JSON",
						"type": "textarea",
						"required": true,
						"placeholder": "{ \"priority\": \"info\", \"model\": { \"frames\": [ { \"text\": \"Hello\" } ] } }",
						"helperText": "Provide full notification JSON or an array of frames."
					}
				]
			}
		],
		"variables": [
			{
				"name": "lametric_apps_json",
				"description": "JSON payload of installed apps from the last List Apps action.",
				"value": ""
			}
		]
	}
}

```

## lametric/package.json

```
{
  "name": "lumia-example-lametric",
  "version": "1.0.0",
  "main": "main.js",
  "private": true,
  "license": "MIT"
}

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
		await this.lumia.addLog("[Minecraft Server] Plugin loaded");

		if (this.settings?.enablePolling && this.settings?.serverHost) {
			await this.startPolling();
		} else if (!this.settings?.serverHost) {
			await this.lumia.addLog(
				"[Minecraft Server] Server address not configured. Please configure in settings."
			);
		}
	}

	async onunload() {
		await this.lumia.addLog("[Minecraft Server] Plugin unloaded");
		await this.stopPolling();
	}

	async onsettingsupdate(settings, previousSettings) {
		const hostChanged = settings?.serverHost !== previousSettings?.serverHost;
		const portChanged = settings?.serverPort !== previousSettings?.serverPort;
		const pollingChanged =
			settings?.enablePolling !== previousSettings?.enablePolling;

		if (hostChanged || portChanged || pollingChanged) {
			await this.stopPolling();

			if (settings?.enablePolling && settings?.serverHost) {
				await this.startPolling();
			}
		}
	}

	async actions(config = {}) {
		const actionList = Array.isArray(config.actions) ? config.actions : [];

		for (const action of actionList) {
			try {
				switch (action.type) {
					case "manual_poll":
						await this.lumia.addLog(
							"[Minecraft Server] Manual poll triggered"
						);
						await this.pollServer();
						break;

					case "test_connection":
						await this.lumia.addLog(
							"[Minecraft Server] Testing connection..."
						);
						await this.testConnection();
						break;

					default:
						await this.lumia.addLog(
							`[Minecraft Server] Unknown action: ${action.type}`
						);
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				await this.lumia.addLog(
					`[Minecraft Server] Error in action ${action.type}: ${message}`
				);
			}
		}
	}

	// ============================================================================
	// Polling Management
	// ============================================================================

	async startPolling() {
		if (this.pollInterval) {
			return;
		}

		const interval = this.getPollInterval();
		await this.lumia.addLog(
			`[Minecraft Server] Starting polling (every ${interval}s)`
		);

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
			await this.lumia.addLog("[Minecraft Server] Stopped polling");
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
					// Query failed, but that's okay - we have ping data
					await this.lumia.addLog(
						`[Minecraft Server] Query failed: ${error.message}`
					);
				}
			}

			// Process the combined data
			await this.processServerData(pingData, queryData);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			await this.lumia.addLog(
				`[Minecraft Server] Poll failed: ${message}`
			);

			// Server is offline
			await this.processServerData(null, null);
		}
	}

	async testConnection() {
		const host = this.getServerHost();
		const port = this.getServerPort();

		if (!host) {
			await this.lumia.showToast({
				message: "Please configure server address in settings",
			});
			return;
		}

		try {
			const data = await this.serverListPing(host, port);

			await this.lumia.showToast({
				message: `✅ Connected to ${host}:${port}\n${data.players.online}/${data.players.max} players online`,
			});

			await this.lumia.addLog(
				`[Minecraft Server] ✅ Connection successful!\n` +
					`Version: ${data.version.name}\n` +
					`Players: ${data.players.online}/${data.players.max}\n` +
					`MOTD: ${this.cleanMOTD(data.description)}`
			);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			await this.lumia.showToast({
				message: `❌ Connection failed: ${message}`,
			});
			await this.lumia.addLog(
				`[Minecraft Server] ❌ Connection failed: ${message}`
			);
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
						dataStart + idResult.length
					);
					const jsonLength = jsonLengthResult.value;
					const jsonStart = dataStart + idResult.length + jsonLengthResult.length;

					// Extract JSON string
					const jsonString = buffer
						.slice(jsonStart, jsonStart + jsonLength)
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
			sessionId = Math.floor(Math.random() * 0x7fffffff);
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
						// Parse handshake response
						const type = msg.readUInt8(0);
						if (type !== 0x09) {
							throw new Error("Invalid handshake response");
						}

						const responseSessionId = msg.readInt32BE(1);
						if (responseSessionId !== sessionId) {
							throw new Error("Session ID mismatch");
						}

						// Extract challenge token
						const tokenString = msg.slice(5, msg.length - 1).toString("utf8");
						challengeToken = parseInt(tokenString, 10);

						// Step 2: Send full stat request
						const statRequest = this.createQueryStatRequest(
							sessionId,
							challengeToken
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
		const type = msg.readUInt8(0);
		if (type !== 0x00) {
			throw new Error("Invalid stat response");
		}

		// Skip header
		let offset = 5;

		// Skip padding
		offset += 11;

		// Parse key-value pairs
		const data = {};
		while (offset < msg.length) {
			// Read key
			let keyEnd = msg.indexOf(0, offset);
			if (keyEnd === -1) break;
			const key = msg.slice(offset, keyEnd).toString("utf8");
			offset = keyEnd + 1;

			// Read value
			let valueEnd = msg.indexOf(0, offset);
			if (valueEnd === -1) break;
			const value = msg.slice(offset, valueEnd).toString("utf8");
			offset = valueEnd + 1;

			if (key.length === 0 && value.length === 0) {
				// End of key-value section
				offset++;
				break;
			}

			data[key] = value;
		}

		// Parse player list
		data.players = [];
		while (offset < msg.length) {
			let playerEnd = msg.indexOf(0, offset);
			if (playerEnd === -1) break;
			const player = msg.slice(offset, playerEnd).toString("utf8");
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
			this.lumia.setVariable("mc_online", state.online),
			this.lumia.setVariable("mc_players_online", state.playersOnline),
			this.lumia.setVariable("mc_players_max", state.playersMax),
			this.lumia.setVariable("mc_version", state.version),
			this.lumia.setVariable("mc_motd", state.motd),
			this.lumia.setVariable("mc_protocol_version", state.protocolVersion),
			this.lumia.setVariable("mc_player_list", state.playerList.join(", ")),
			this.lumia.setVariable("mc_map", state.map),
			this.lumia.setVariable("mc_game_type", state.gameType),
		];

		await Promise.all(updates);
	}

	async checkServerOnlineOffline(newState, oldState) {
		if (newState.online && !oldState.online) {
			// Server came online
			await this.lumia.addLog("[Minecraft Server] ✅ Server is now ONLINE");
			await this.lumia.triggerAlert({
				alert: ALERT_TYPES.SERVER_ONLINE,
				extraSettings: {
					mc_online: true,
					mc_version: newState.version,
					mc_motd: newState.motd,
					mc_players_max: newState.playersMax,
				},
			});
		} else if (!newState.online && oldState.online) {
			// Server went offline
			await this.lumia.addLog("[Minecraft Server] ❌ Server is now OFFLINE");
			await this.lumia.triggerAlert({
				alert: ALERT_TYPES.SERVER_OFFLINE,
				extraSettings: {},
			});

			// Clear player tracking
			this.previousPlayers.clear();
			this.milestonesReached.clear();
		}
	}

	async checkPlayerChanges(newState, oldState) {
		const newPlayers = new Set(newState.playerList);
		const oldPlayers = this.previousPlayers;

		// Check for joins
		for (const player of newPlayers) {
			if (!oldPlayers.has(player)) {
				await this.lumia.setVariable("mc_last_player_joined", player);
				await this.lumia.addLog(
					`[Minecraft Server] 👤 ${player} joined (${newState.playersOnline}/${newState.playersMax})`
				);
				await this.lumia.triggerAlert({
					alert: ALERT_TYPES.PLAYER_JOINED,
					extraSettings: {
						username: player,
						mc_last_player_joined: player,
						mc_players_online: newState.playersOnline,
						mc_players_max: newState.playersMax,
					},
				});
			}
		}

		// Check for leaves
		for (const player of oldPlayers) {
			if (!newPlayers.has(player)) {
				await this.lumia.setVariable("mc_last_player_left", player);
				await this.lumia.addLog(
					`[Minecraft Server] 👋 ${player} left (${newState.playersOnline}/${newState.playersMax})`
				);
				await this.lumia.triggerAlert({
					alert: ALERT_TYPES.PLAYER_LEFT,
					extraSettings: {
						username: player,
						mc_last_player_left: player,
						mc_players_online: newState.playersOnline,
						mc_players_max: newState.playersMax,
					},
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
				await this.lumia.addLog(
					`[Minecraft Server] 🎉 Player milestone reached: ${milestone} players!`
				);
				await this.lumia.triggerAlert({
					alert: ALERT_TYPES.PLAYER_MILESTONE,
					dynamic: { value: count },
					extraSettings: {
						mc_players_online: count,
						mc_players_max: newState.playersMax,
					},
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
				await this.lumia.addLog(
					`[Minecraft Server] 🔴 Server is FULL (${newState.playersMax}/${newState.playersMax})`
				);
				await this.lumia.triggerAlert({
					alert: ALERT_TYPES.SERVER_FULL,
					extraSettings: {
						mc_players_online: newState.playersOnline,
						mc_players_max: newState.playersMax,
					},
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
		const timeout = Number(this.settings?.timeout);
		return Number.isInteger(timeout) && timeout >= 1 && timeout <= 30
			? timeout
			: 5;
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
	"name": "Minecraft Server Status",
	"version": "1.0.0",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://lumiastream.com",
	"repository": "https://github.com/LumiaStream/minecraft-server-plugin",
	"description": "Monitor Minecraft Java Edition servers using Server List Ping and Query protocols. Track player count, server status, and trigger alerts based on server activity.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "platforms",
	"icon": "minecraft.png",
	"changelog": "# Changelog\n\n## 1.0.0\n- Initial release\n- Server List Ping support (always available)\n- Query protocol support (requires enable-query=true)\n- Automatic polling with configurable interval\n- Player tracking and events\n- Server online/offline detection\n- Template variables for server stats\n- Manual poll and test actions",
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
				"label": "Use Query Protocol",
				"type": "checkbox",
				"defaultValue": false,
				"helperText": "Enable if server has enable-query=true in server.properties. Provides more detailed stats including player list."
			},
			{
				"key": "queryPort",
				"label": "Query Port",
				"type": "number",
				"defaultValue": 25565,
				"helperText": "Query port (usually same as server port)",
				"validation": {
					"min": 1,
					"max": 65535
				}
			},
			{
				"key": "pollInterval",
				"label": "Poll Interval (seconds)",
				"type": "number",
				"defaultValue": 30,
				"helperText": "How often to check server status (10-300 seconds)",
				"validation": {
					"min": 10,
					"max": 300
				}
			},
			{
				"key": "enablePolling",
				"label": "Enable Automatic Polling",
				"type": "checkbox",
				"defaultValue": true,
				"helperText": "Automatically poll server at specified interval"
			},
			{
				"key": "timeout",
				"label": "Request Timeout (seconds)",
				"type": "number",
				"defaultValue": 5,
				"helperText": "Timeout for server requests",
				"validation": {
					"min": 1,
					"max": 30
				}
			}
		],
		"settings_tutorial": "---\n### 🎮 Setup Your Minecraft Server Monitoring\n1) Enter your server address (hostname or IP)\n2) Enter server port (default: 25565)\n3) (Optional) Enable Query protocol for detailed stats\n   - Requires `enable-query=true` in server.properties\n   - Provides player list and more details\n4) Set poll interval (how often to check)\n5) Click **Save** to start monitoring\n---\n### ✅ Verify Connection\nUse the **Test Connection** action to verify server is reachable.\n---\n### 📊 What Gets Tracked\n- Server online/offline status\n- Current player count\n- Maximum players\n- Server version\n- MOTD (Message of the Day)\n- Player list (if Query enabled)\n---",
		"actions_tutorial": "---\n### 🔄 Manual Poll\nManually check server status without waiting for next scheduled poll.\n---\n### 🧪 Test Connection\nTest connection to server and display current status.\n---",
		"actions": [
			{
				"type": "manual_poll",
				"label": "Manual Poll",
				"description": "Manually poll server status",
				"fields": []
			}
		],
		"variables": [
			{
				"name": "mc_online",
				"description": "Whether the server is online",
				"value": false
			},
			{
				"name": "mc_players_online",
				"description": "Number of players currently online",
				"value": 0
			},
			{
				"name": "mc_players_max",
				"description": "Maximum number of players allowed",
				"value": 0
			},
			{
				"name": "mc_version",
				"description": "Server version (e.g., 1.21.5)",
				"value": ""
			},
			{
				"name": "mc_motd",
				"description": "Server Message of the Day",
				"value": ""
			},
			{
				"name": "mc_protocol_version",
				"description": "Protocol version number",
				"value": 0
			},
			{
				"name": "mc_player_list",
				"description": "Comma-separated list of player names (Query only)",
				"value": ""
			},
			{
				"name": "mc_map",
				"description": "Current world/map name (Query only)",
				"value": ""
			},
			{
				"name": "mc_game_type",
				"description": "Game type (Survival, Creative, etc.) (Query only)",
				"value": ""
			},
			{
				"name": "mc_last_player_joined",
				"description": "Username of last player who joined",
				"value": ""
			},
			{
				"name": "mc_last_player_left",
				"description": "Username of last player who left",
				"value": ""
			}
		],
		"alerts": [
			{
				"title": "Server Online",
				"key": "serverOnline",
				"acceptedVariables": [
					"mc_online",
					"mc_version",
					"mc_motd",
					"mc_players_max"
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
					"mc_last_player_joined",
					"mc_players_online",
					"mc_players_max"
				],
				"defaultMessage": "{{username}} joined the server! ({{mc_players_online}}/{{mc_players_max}})",
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
					"mc_last_player_left",
					"mc_players_online",
					"mc_players_max"
				],
				"defaultMessage": "{{username}} left the server ({{mc_players_online}}/{{mc_players_max}})",
				"variationConditions": [
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			},
			{
				"title": "Player Milestone",
				"key": "playerMilestone",
				"acceptedVariables": ["mc_players_online", "mc_players_max"],
				"defaultMessage": "{{mc_players_online}} players online!",
				"variationConditions": [
					{
						"type": "GREATER_NUMBER",
						"description": "Player count is greater than.."
					},
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			},
			{
				"title": "Server Full",
				"key": "serverFull",
				"acceptedVariables": ["mc_players_online", "mc_players_max"],
				"defaultMessage": "Server is full! ({{mc_players_max}}/{{mc_players_max}})",
				"variationConditions": [
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			}
		]
	}
}

```

## minecraft_server/package-lock.json

```
{
	"name": "lumia-minecraft-server",
	"version": "1.0.0",
	"lockfileVersion": 3,
	"requires": true,
	"packages": {
		"": {
			"name": "lumia-minecraft-server",
			"version": "1.0.0",
			"dependencies": {
				"@lumiastream/plugin": "^0.1.18"
			}
		},
		"node_modules/@lumiastream/plugin": {
			"version": "0.1.18",
			"resolved": "https://registry.npmjs.org/@lumiastream/plugin/-/plugin-0.1.18.tgz",
			"integrity": "sha512-J290nM+G6wD8fUFAdJgzEWkRZEZCKtDjLDRAh5utHVOily+sJrg/tl2HhyEXGB+ALHZpEiYGfIyLWghhYlKiTQ==",
			"license": "MIT"
		}
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
		"@lumiastream/plugin": "^0.1.18"
	}
}

```

## mock_lights_plugin/main.js

```
const { Plugin } = require('@lumiastream/plugin');

const DEFAULT_LIGHTS = [
	{ id: 'mock-1', name: 'Mock Panel A', ip: '10.0.0.11' },
	{ id: 'mock-2', name: 'Mock Strip B', ip: '10.0.0.12' },
];

class MockLightsPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._lights = [...DEFAULT_LIGHTS];
		this._idCounter = DEFAULT_LIGHTS.length + 1;
	}

	async onload() {
		await this._log('Mock lights plugin loaded');
		await this.lumia.updateConnection(true);
	}

	async onunload() {
		await this._log('Mock lights plugin unloaded');
		await this.lumia.updateConnection(false);
	}

	async searchLights() {
		const newLight = {
			id: `mock-${this._idCounter}`,
			name: `Discovered Mock ${this._idCounter}`,
			ip: `10.0.0.${10 + this._idCounter}`,
		};
		this._idCounter++;
		this._mergeLights([newLight]);
		await this._log(`Discovered ${newLight.name} (${newLight.id})`);
		return this._lights;
	}

	async addLight(data = {}) {
		const newLight = {
			id: data.id || `manual-${Date.now()}`,
			name: data.name || `Manual Mock ${this._idCounter++}`,
			ip: data.ip,
		};
		this._mergeLights([newLight]);
		await this._log(`Manually added ${newLight.name} (${newLight.id})`);
		return this._lights;
	}

	async onLightChange(config = {}) {
		const ids = Array.isArray(config.lights) ? config.lights.map((l) => l?.id || l).join(', ') : 'unknown';
		const color = config.color ? `rgb(${config.color.r},${config.color.g},${config.color.b})` : 'no color';
		const brightness = typeof config.brightness === 'number' ? `${config.brightness}%` : 'unchanged';
		const power = typeof config.power === 'boolean' ? (config.power ? 'on' : 'off') : 'unchanged';

		await this._log(`onLightChange -> brand=${config.brand} lights=[${ids}] color=${color} brightness=${brightness} power=${power}`);
	}

	_mergeLights(newOnes = []) {
		const existing = new Map(this._lights.map((l) => [l.id, l]));
		newOnes.forEach((light) => {
			if (!existing.has(light.id)) {
				existing.set(light.id, light);
			}
		});
		this._lights = Array.from(existing.values());
	}

	async _log(message) {
		await this.lumia.addLog(`[${this.manifest.id}] ${message}`);
	}
}

module.exports = MockLightsPlugin;

```

## mock_lights_plugin/manifest.json

```
{
  "id": "mock_lights_plugin",
  "name": "Mock Lights Plugin",
  "version": "1.0.0",
  "author": "Lumia Stream",
  "email": "",
  "website": "",
  "repository": "",
  "description": "Creates fake lights and logs when Lumia sends color/brightness updates.",
  "license": "MIT",
  "lumiaVersion": "^9.0.0",
  "category": "lights",
  "icon": "",
  "changelog": "",
  "config": {
    "settings": [],
    "actions": [],
    "variables": [],
    "alerts": [],
    "lights": {
      "search": {
        "buttonLabel": "Discover mock lights",
        "helperText": "Generates a new fake light each time."
      },
      "manualAdd": {
        "buttonLabel": "Add mock light",
        "helperText": "Supply whatever identifiers you want to test manual entry.",
        "fields": [
          { "key": "name", "label": "Name", "type": "text", "required": true },
          { "key": "id", "label": "Light ID (optional)", "type": "text" },
          { "key": "ip", "label": "IP (optional)", "type": "text" }
        ]
      },
      "displayFields": [
        { "key": "name", "label": "Name" },
        { "key": "ip", "label": "IP", "fallback": "No IP" }
      ],
      "emptyStateText": "No mock lights yet. Discover or add one."
    }
  }
}

```

## mock_lights_plugin/package.json

```
{
  "name": "lumia-mock-lights-plugin",
  "version": "1.0.0",
  "private": true,
  "description": "Mock lights plugin for local testing of Lumia plugin light flows.",
  "main": "main.js",
  "dependencies": {
    "@lumiastream/plugin": "^0.1.18"
  }
}

```

## octoprint/README.md

```
# OctoPrint Integration (Example Plugin)

This example plugin polls OctoPrint for job and printer status, exposes variables for Lumia overlays/automations, and can trigger alerts on print events.

## Setup

1) In OctoPrint, open Settings -> Application Keys and create an API key.
2) Configure the plugin settings:
   - `OctoPrint Base URL`: e.g. `http://octopi.local` or `http://192.168.1.50`
   - `API Key`: the key you generated in OctoPrint
3) (Optional) Adjust polling interval, timeout, and alert toggles.

## Actions

- `Refresh Status` - manually fetch the latest OctoPrint job and printer status.
- `Pause Print` - pause the active job.
- `Resume Print` - resume a paused job.
- `Cancel Print` - cancel the active job.
- `Restart Print` - restart the active job from the beginning.

## Alerts

- `Print Started`
- `Print Paused`
- `Print Resumed`
- `Print Finished`
- `Print Cancelled`
- `Printer Error`

## Variables

- `octoprint_job_state`
- `octoprint_printer_state`
- `octoprint_is_printing`
- `octoprint_is_paused`
- `octoprint_is_operational`
- `octoprint_has_error`
- `octoprint_job_name`
- `octoprint_job_path`
- `octoprint_job_origin`
- `octoprint_progress_completion`
- `octoprint_progress_print_time`
- `octoprint_progress_print_time_left`
- `octoprint_progress_file_pos`
- `octoprint_estimated_print_time`
- `octoprint_tool0_actual`
- `octoprint_tool0_target`
- `octoprint_bed_actual`
- `octoprint_bed_target`
- `octoprint_error_message`
- `octoprint_last_updated`

## Notes

- The plugin uses the OctoPrint REST API endpoints `/api/job` and `/api/printer`.
- If you use HTTPS with a self-signed certificate, the runtime must trust that certificate.

OctoPrint API docs: https://docs.octoprint.org/en/main/api/

```

## octoprint/main.js

```
const { Plugin } = require("@lumiastream/plugin");

const DEFAULTS = {
	pollInterval: 10,
	requestTimeoutMs: 8000,
};

const VARIABLE_NAMES = {
	jobState: "octoprint_job_state",
	printerState: "octoprint_printer_state",
	isPrinting: "octoprint_is_printing",
	isPaused: "octoprint_is_paused",
	isOperational: "octoprint_is_operational",
	hasError: "octoprint_has_error",
	jobName: "octoprint_job_name",
	jobPath: "octoprint_job_path",
	jobOrigin: "octoprint_job_origin",
	progressCompletion: "octoprint_progress_completion",
	progressPrintTime: "octoprint_progress_print_time",
	progressPrintTimeLeft: "octoprint_progress_print_time_left",
	progressFilePos: "octoprint_progress_file_pos",
	estimatedPrintTime: "octoprint_estimated_print_time",
	tool0Actual: "octoprint_tool0_actual",
	tool0Target: "octoprint_tool0_target",
	bedActual: "octoprint_bed_actual",
	bedTarget: "octoprint_bed_target",
	errorMessage: "octoprint_error_message",
	lastUpdated: "octoprint_last_updated",
};

const ALERT_KEYS = {
	printStarted: "octoprint_print_started",
	printPaused: "octoprint_print_paused",
	printResumed: "octoprint_print_resumed",
	printFinished: "octoprint_print_finished",
	printCancelled: "octoprint_print_cancelled",
	error: "octoprint_printer_error",
};

class OctoPrintPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._pollTimer = null;
		this._refreshPromise = null;
		this._lastConnectionState = null;
		this._lastVariables = new Map();
		this._lastSnapshot = null;
		this._lastErrorMessage = "";
	}

	async onload() {
		await this._log("OctoPrint plugin loaded.");
		await this._refresh({ reason: "startup" });
		this._schedulePolling();
	}

	async onunload() {
		this._clearPolling();
		await this._updateConnectionState(false);
		await this._log("OctoPrint plugin stopped.");
	}

	async onsettingsupdate(settings, previous = {}) {
		const pollChanged =
			this._coerceNumber(settings?.pollInterval, DEFAULTS.pollInterval) !==
			this._coerceNumber(previous?.pollInterval, DEFAULTS.pollInterval);

		const timeoutChanged =
			this._coerceNumber(settings?.requestTimeoutMs, DEFAULTS.requestTimeoutMs) !==
			this._coerceNumber(previous?.requestTimeoutMs, DEFAULTS.requestTimeoutMs);

		const baseUrlChanged =
			(settings?.baseUrl || "") !== (previous?.baseUrl || "");
		const apiKeyChanged =
			(settings?.apiKey || "") !== (previous?.apiKey || "");

		if (pollChanged || timeoutChanged || baseUrlChanged || apiKeyChanged) {
			this._schedulePolling();
			await this._refresh({ reason: "settings-update" });
		}
	}

	async actions(config = {}) {
		const actions = Array.isArray(config.actions) ? config.actions : [];
		for (const action of actions) {
			switch (action?.type) {
				case "octoprint_refresh":
					await this._refresh({ reason: "manual-action" });
					break;
				case "octoprint_pause":
					await this._sendJobCommand("pause", { action: "pause" });
					await this._refresh({ reason: "manual-action" });
					break;
				case "octoprint_resume":
					await this._sendJobCommand("pause", { action: "resume" });
					await this._refresh({ reason: "manual-action" });
					break;
				case "octoprint_cancel":
					await this._sendJobCommand("cancel");
					await this._refresh({ reason: "manual-action" });
					break;
				case "octoprint_restart":
					await this._sendJobCommand("restart");
					await this._refresh({ reason: "manual-action" });
					break;
				default:
					await this._log(
						`Unknown action type: ${action?.type ?? "undefined"}`,
						"warn"
					);
			}
		}
	}

	async validateAuth() {
		if (!this._hasCredentials()) {
			await this._log("Validation failed: missing base URL or API key.", "warn");
			return false;
		}

		try {
			await this._fetchJob();
			await this._log("OctoPrint authentication succeeded.");
			return true;
		} catch (error) {
			await this._log(
				`OctoPrint validation failed: ${this._errorMessage(error)}`,
				"error"
			);
			return false;
		}
	}

	async _refresh({ reason } = {}) {
		if (this._refreshPromise) {
			return this._refreshPromise;
		}

		this._refreshPromise = (async () => {
			if (!this._hasCredentials()) {
				await this._updateConnectionState(false);
				return;
			}

			try {
				const [job, printer] = await Promise.all([
					this._fetchJob(),
					this._fetchPrinter(),
				]);
				await this._handleSnapshot(job, printer, reason);
				await this._updateConnectionState(true);
			} catch (error) {
				await this._log(
					`Refresh failed: ${this._errorMessage(error)}`,
					"error"
				);
				await this._updateConnectionState(false);
			}
		})().finally(() => {
			this._refreshPromise = null;
		});

		return this._refreshPromise;
	}

	async _handleSnapshot(job, printer, reason) {
		const jobState = this._safeString(job?.state);
		const jobFile = job?.job?.file || {};
		const jobProgress = job?.progress || {};
		const jobEstimated = this._toNumber(job?.job?.estimatedPrintTime);
		const printerStateText = this._safeString(printer?.state?.text);
		const flags = printer?.state?.flags || {};
		const temperature = printer?.temperature || {};
		const tool0 = temperature?.tool0 || {};
		const bed = temperature?.bed || {};
		const completion = this._toNumber(jobProgress?.completion);
		const errorMessage = this._safeString(job?.error);

		const isPrinting = Boolean(flags?.printing);
		const isPaused = Boolean(flags?.paused);
		const isOperational = Boolean(flags?.operational);
		const hasError = Boolean(flags?.error) || Boolean(errorMessage);

		await this._setVariable(VARIABLE_NAMES.jobState, jobState);
		await this._setVariable(VARIABLE_NAMES.printerState, printerStateText);
		await this._setVariable(VARIABLE_NAMES.isPrinting, isPrinting);
		await this._setVariable(VARIABLE_NAMES.isPaused, isPaused);
		await this._setVariable(VARIABLE_NAMES.isOperational, isOperational);
		await this._setVariable(VARIABLE_NAMES.hasError, hasError);
		await this._setVariable(VARIABLE_NAMES.jobName, this._safeString(jobFile?.name));
		await this._setVariable(VARIABLE_NAMES.jobPath, this._safeString(jobFile?.path));
		await this._setVariable(
			VARIABLE_NAMES.jobOrigin,
			this._safeString(jobFile?.origin)
		);
		await this._setVariable(VARIABLE_NAMES.progressCompletion, completion);
		await this._setVariable(
			VARIABLE_NAMES.progressPrintTime,
			this._toNumber(jobProgress?.printTime)
		);
		await this._setVariable(
			VARIABLE_NAMES.progressPrintTimeLeft,
			this._toNumber(jobProgress?.printTimeLeft)
		);
		await this._setVariable(
			VARIABLE_NAMES.progressFilePos,
			this._toNumber(jobProgress?.filepos)
		);
		await this._setVariable(
			VARIABLE_NAMES.estimatedPrintTime,
			jobEstimated
		);
		await this._setVariable(
			VARIABLE_NAMES.tool0Actual,
			this._toNumber(tool0?.actual)
		);
		await this._setVariable(
			VARIABLE_NAMES.tool0Target,
			this._toNumber(tool0?.target)
		);
		await this._setVariable(
			VARIABLE_NAMES.bedActual,
			this._toNumber(bed?.actual)
		);
		await this._setVariable(
			VARIABLE_NAMES.bedTarget,
			this._toNumber(bed?.target)
		);
		await this._setVariable(VARIABLE_NAMES.errorMessage, errorMessage);
		await this._setVariable(
			VARIABLE_NAMES.lastUpdated,
			new Date().toISOString()
		);

		if (this.settings?.enableAlerts && this._lastSnapshot) {
			await this._maybeTriggerAlerts({
				jobState,
				isPrinting,
				isPaused,
				isOperational,
				hasError,
				completion,
				errorMessage,
				previous: this._lastSnapshot,
			});
		}

		this._lastSnapshot = {
			isPrinting,
			isPaused,
			isOperational,
			hasError,
			completion,
			jobState,
		};

		this._lastErrorMessage = errorMessage;

		if (reason === "manual-action") {
			await this._log("Manual refresh complete.");
		}
	}

	async _maybeTriggerAlerts({
		jobState,
		isPrinting,
		isPaused,
		isOperational,
		hasError,
		completion,
		errorMessage,
		previous,
	}) {
		const wasPrinting = Boolean(previous?.isPrinting);
		const wasPaused = Boolean(previous?.isPaused);
		const wasError = Boolean(previous?.hasError);
		const wasCompletion = this._toNumber(previous?.completion);

		if (!wasPrinting && isPrinting) {
			await this.lumia.triggerAlert({ alert: ALERT_KEYS.printStarted });
		}

		if (!wasPaused && isPaused) {
			await this.lumia.triggerAlert({ alert: ALERT_KEYS.printPaused });
		}

		if (wasPaused && isPrinting) {
			await this.lumia.triggerAlert({ alert: ALERT_KEYS.printResumed });
		}

		const isIdle = !isPrinting && !isPaused;
		if ((wasPrinting || wasPaused) && isIdle) {
			const finished = wasCompletion >= 99;
			await this.lumia.triggerAlert({
				alert: finished ? ALERT_KEYS.printFinished : ALERT_KEYS.printCancelled,
			});
		}

		if (!wasError && hasError) {
			await this.lumia.triggerAlert({ alert: ALERT_KEYS.error });
		} else if (errorMessage && errorMessage !== this._lastErrorMessage) {
			await this.lumia.triggerAlert({ alert: ALERT_KEYS.error });
		}
	}

	async _fetchJob() {
		return this._fetchJson("/api/job");
	}

	async _fetchPrinter() {
		return this._fetchJson("/api/printer");
	}

	async _sendJobCommand(command, extra = {}) {
		if (!this._hasCredentials()) {
			throw new Error("Missing OctoPrint base URL or API key.");
		}
		await this._fetchJson("/api/job", {
			method: "POST",
			body: {
				command,
				...extra,
			},
		});
	}

	async _fetchJson(path, options = {}) {
		const baseUrl = this._normalizeBaseUrl(this.settings?.baseUrl);
		const apiKey = (this.settings?.apiKey || "").trim();
		if (!baseUrl || !apiKey) {
			throw new Error("Missing OctoPrint base URL or API key.");
		}

		const url = `${baseUrl}${path}`;
		const controller = new AbortController();
		const timeout = setTimeout(() => {
			controller.abort();
		}, this._coerceNumber(this.settings?.requestTimeoutMs, DEFAULTS.requestTimeoutMs));

		try {
			const response = await fetch(url, {
				method: options?.method || "GET",
				headers: {
					"content-type": "application/json",
					"X-Api-Key": apiKey,
					...(options?.headers || {}),
				},
				body: options?.body ? JSON.stringify(options.body) : undefined,
				signal: controller.signal,
			});

			if (!response.ok) {
				const message = await this._readResponseText(response);
				throw new Error(
					`HTTP ${response.status} ${response.statusText}: ${message}`
				);
			}

			if (response.status === 204) {
				return null;
			}

			const raw = await response.text();
			if (!raw) {
				return null;
			}

			try {
				return JSON.parse(raw);
			} catch (error) {
				return raw;
			}
		} finally {
			clearTimeout(timeout);
		}
	}

	async _readResponseText(response) {
		try {
			return await response.text();
		} catch (error) {
			return "";
		}
	}

	_hasCredentials() {
		const baseUrl = this._normalizeBaseUrl(this.settings?.baseUrl);
		const apiKey = (this.settings?.apiKey || "").trim();
		return Boolean(baseUrl && apiKey);
	}

	_normalizeBaseUrl(value) {
		const trimmed = (value || "").trim();
		if (!trimmed) {
			return "";
		}
		if (/^https?:\/\//i.test(trimmed)) {
			return trimmed.replace(/\/+$/, "");
		}
		return `http://${trimmed}`.replace(/\/+$/, "");
	}

	_safeString(value) {
		if (value === null || value === undefined) {
			return "";
		}
		return String(value);
	}

	_coerceNumber(value, fallback) {
		const number = Number(value);
		return Number.isFinite(number) ? number : fallback;
	}

	_toNumber(value) {
		const number = Number(value);
		return Number.isFinite(number) ? number : 0;
	}

	async _setVariable(name, value) {
		if (this._lastVariables.get(name) === value) {
			return;
		}
		this._lastVariables.set(name, value);
		await this.lumia.setVariable(name, value);
	}

	async _updateConnectionState(state) {
		if (this._lastConnectionState === state) {
			return;
		}
		this._lastConnectionState = state;
		await this.lumia.updateConnection(state);
	}

	_tag() {
		return `[${this.manifest?.id ?? "octoprint"}]`;
	}

	_errorMessage(error) {
		if (!error) {
			return "Unknown error";
		}
		return error?.message || String(error);
	}

	async _log(message, severity = "info") {
		const prefix = this._tag();
		const decorated =
			severity === "warn"
				? `${prefix} [WARN] ${message}`
				: severity === "error"
				? `${prefix} [ERROR] ${message}`
				: `${prefix} ${message}`;

		await this.lumia.addLog(decorated);
	}

	_schedulePolling() {
		this._clearPolling();
		const intervalSeconds = this._coerceNumber(
			this.settings?.pollInterval,
			DEFAULTS.pollInterval
		);
		if (!intervalSeconds || intervalSeconds <= 0) {
			return;
		}
		this._pollTimer = setInterval(() => {
			this._refresh({ reason: "poll" });
		}, intervalSeconds * 1000);
	}

	_clearPolling() {
		if (this._pollTimer) {
			clearInterval(this._pollTimer);
			this._pollTimer = null;
		}
	}
}

module.exports = OctoPrintPlugin;

```

## octoprint/manifest.json

```
{
	"id": "octoprint_integration",
	"name": "OctoPrint Integration",
	"version": "1.0.0",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://lumiastream.com",
	"repository": "",
	"description": "Monitor OctoPrint jobs and printer state, expose status variables, and trigger alerts on print events.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "devices",
	"keywords": "octoprint, octopi, 3d print, printer, job",
	"config": {
		"settings": [
			{
				"key": "baseUrl",
				"label": "OctoPrint Base URL",
				"type": "url",
				"placeholder": "http://octopi.local",
				"helperText": "Include the protocol and hostname/IP for your OctoPrint server.",
				"required": true
			},
			{
				"key": "apiKey",
				"label": "API Key",
				"type": "password",
				"placeholder": "Paste your OctoPrint API key",
				"helperText": "Create or copy an API key from OctoPrint Settings -> Application Keys.",
				"required": true
			},
			{
				"key": "pollInterval",
				"label": "Poll Interval (seconds)",
				"type": "number",
				"defaultValue": 10,
				"validation": {
					"min": 5,
					"max": 3600
				}
			},
			{
				"key": "enableAlerts",
				"label": "Enable Print Alerts",
				"type": "toggle",
				"defaultValue": true
			}
		],
		"settings_tutorial": "---\n### Connect OctoPrint\n1) In OctoPrint, open Settings -> Application Keys.\n2) Create an API key (or copy an existing one).\n3) Paste the key into **API Key** and set the **OctoPrint Base URL** (for example: `http://octopi.local` or `http://192.168.1.50`).\n---\n### Polling\nAdjust the poll interval to balance freshness with API usage.\n---",
		"actions_tutorial": "---\n### Manual Controls\n- **Refresh Status** pulls the latest job and printer data.\n- **Pause Print**, **Resume Print**, **Cancel Print**, and **Restart Print** call the OctoPrint job control API.\n---",
		"actions": [
			{
				"type": "octoprint_refresh",
				"label": "Refresh Status",
				"description": "Fetch the latest OctoPrint job and printer status.",
				"fields": []
			},
			{
				"type": "octoprint_pause",
				"label": "Pause Print",
				"description": "Pause the active print job.",
				"fields": []
			},
			{
				"type": "octoprint_resume",
				"label": "Resume Print",
				"description": "Resume a paused print job.",
				"fields": []
			},
			{
				"type": "octoprint_cancel",
				"label": "Cancel Print",
				"description": "Cancel the active print job.",
				"fields": []
			},
			{
				"type": "octoprint_restart",
				"label": "Restart Print",
				"description": "Restart the active print job from the beginning.",
				"fields": []
			}
		],
		"alerts": [
			{
				"title": "Print Started",
				"key": "octoprint_print_started",
				"defaultMessage": "Print started: {{octoprint_job_name}}",
				"acceptedVariables": ["octoprint_job_name", "octoprint_job_state"]
			},
			{
				"title": "Print Paused",
				"key": "octoprint_print_paused",
				"defaultMessage": "Print paused: {{octoprint_job_name}} ({{octoprint_progress_completion}}%)",
				"acceptedVariables": [
					"octoprint_job_name",
					"octoprint_progress_completion"
				]
			},
			{
				"title": "Print Resumed",
				"key": "octoprint_print_resumed",
				"defaultMessage": "Print resumed: {{octoprint_job_name}}",
				"acceptedVariables": ["octoprint_job_name", "octoprint_job_state"]
			},
			{
				"title": "Print Finished",
				"key": "octoprint_print_finished",
				"defaultMessage": "Print finished: {{octoprint_job_name}}",
				"acceptedVariables": [
					"octoprint_job_name",
					"octoprint_progress_completion"
				]
			},
			{
				"title": "Print Cancelled",
				"key": "octoprint_print_cancelled",
				"defaultMessage": "Print cancelled: {{octoprint_job_name}}",
				"acceptedVariables": [
					"octoprint_job_name",
					"octoprint_progress_completion"
				]
			},
			{
				"title": "Printer Error",
				"key": "octoprint_printer_error",
				"defaultMessage": "OctoPrint error: {{octoprint_error_message}}",
				"acceptedVariables": ["octoprint_error_message", "octoprint_job_state"]
			}
		],
		"variables": [
			{
				"name": "octoprint_job_state",
				"description": "Job state reported by OctoPrint.",
				"value": ""
			},
			{
				"name": "octoprint_printer_state",
				"description": "Printer state text reported by OctoPrint.",
				"value": ""
			},
			{
				"name": "octoprint_is_printing",
				"description": "True when the printer is actively printing.",
				"value": false
			},
			{
				"name": "octoprint_is_paused",
				"description": "True when the printer is paused.",
				"value": false
			},
			{
				"name": "octoprint_is_operational",
				"description": "True when the printer is idle/operational.",
				"value": false
			},
			{
				"name": "octoprint_has_error",
				"description": "True when OctoPrint reports an error state.",
				"value": false
			},
			{
				"name": "octoprint_job_name",
				"description": "Filename of the current job.",
				"value": ""
			},
			{
				"name": "octoprint_job_path",
				"description": "Path of the current job in OctoPrint storage.",
				"value": ""
			},
			{
				"name": "octoprint_job_origin",
				"description": "Storage origin for the current job (local/sdcard).",
				"value": ""
			},
			{
				"name": "octoprint_progress_completion",
				"description": "Completion percentage reported by OctoPrint (0-100).",
				"value": 0
			},
			{
				"name": "octoprint_progress_print_time",
				"description": "Elapsed print time in seconds.",
				"value": 0
			},
			{
				"name": "octoprint_progress_print_time_left",
				"description": "Estimated time remaining in seconds.",
				"value": 0
			},
			{
				"name": "octoprint_progress_file_pos",
				"description": "Current file position in bytes.",
				"value": 0
			},
			{
				"name": "octoprint_estimated_print_time",
				"description": "Estimated print time in seconds.",
				"value": 0
			},
			{
				"name": "octoprint_tool0_actual",
				"description": "Tool 0 actual temperature.",
				"value": 0
			},
			{
				"name": "octoprint_tool0_target",
				"description": "Tool 0 target temperature.",
				"value": 0
			},
			{
				"name": "octoprint_bed_actual",
				"description": "Bed actual temperature.",
				"value": 0
			},
			{
				"name": "octoprint_bed_target",
				"description": "Bed target temperature.",
				"value": 0
			},
			{
				"name": "octoprint_error_message",
				"description": "Error message reported by OctoPrint.",
				"value": ""
			},
			{
				"name": "octoprint_last_updated",
				"description": "ISO timestamp for the last refresh.",
				"value": ""
			}
		]
	}
}

```

## octoprint/package.json

```
{
	"name": "lumia-octoprint-integration",
	"version": "1.0.0",
	"private": true,
	"description": "OctoPrint integration example plugin for Lumia Stream.",
	"main": "main.js",
	"dependencies": {
		"@lumiastream/plugin": "^0.1.18"
	}
}

```

## playstation_network/README.md

```
# PlayStation Network Plugin (Example)

This example plugin polls PlayStation Network trophy title updates using `psn-api` and exposes the latest title data as Lumia variables.

## Setup

1. Install dependencies:
   - `npm install`
2. Open `manifest.json` and verify the settings and actions.
3. In Lumia Stream, load the plugin folder and paste your NPSSO cookie value in settings.

## Notes

- The plugin exchanges NPSSO for access/refresh tokens and stores them in disabled settings fields.
- Leave `Target Online ID` blank to use your own account ("me"). Use `Target Account ID` if lookup fails.

```

## playstation_network/main.js

```
const { Plugin } = require("@lumiastream/plugin");

const DEFAULTS = {
	pollInterval: 300,
};

const VARIABLE_NAMES = {
	accountId: "psn_account_id",
	lastTitleName: "psn_last_title_name",
	lastTitlePlatform: "psn_last_title_platform",
	lastTitleProgress: "psn_last_title_progress",
	lastTitleUpdated: "psn_last_title_last_updated",
	lastUpdated: "psn_last_updated",
};

class PlaystationNetworkPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._pollTimer = null;
		this._refreshPromise = null;
		this._lastConnectionState = null;
		this._lastVariables = new Map();
		this._psnApiPromise = null;
		this._cachedAccountId = null;
		this._cachedOnlineId = null;
		this._lastTitleSnapshot = null;
	}

	async onload() {
		await this._log("PlayStation Network plugin loaded.");

		if (!this._hasAuthInputs()) {
			await this._log(
				"Missing NPSSO or refresh token. Enter NPSSO in settings to begin.",
				"warn"
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
		await this._log("PlayStation Network plugin stopped.");
	}

	async onsettingsupdate(settings, previous = {}) {
		const pollChanged =
			this._coerceNumber(settings?.pollInterval, DEFAULTS.pollInterval) !==
			this._coerceNumber(previous?.pollInterval, DEFAULTS.pollInterval);
		const npssoChanged = (settings?.npsso ?? "") !== (previous?.npsso ?? "");
		const refreshTokenChanged =
			(settings?.refreshToken ?? "") !== (previous?.refreshToken ?? "");
		const authChanged = npssoChanged || refreshTokenChanged;
		const targetChanged =
			(settings?.targetOnlineId ?? "") !== (previous?.targetOnlineId ?? "") ||
			(settings?.targetAccountId ?? "") !== (previous?.targetAccountId ?? "");

		if (pollChanged) {
			this._schedulePolling();
		}

		if (npssoChanged) {
			this.updateSettings({
				accessToken: "",
				refreshToken: "",
				accessTokenExpiresAt: "",
				refreshTokenExpiresAt: "",
			});
		}

		if (authChanged || targetChanged) {
			this._cachedAccountId = null;
			this._cachedOnlineId = null;
			await this._refreshData({ reason: "settings-update" });
		}
	}

	async actions(config = {}) {
		const actions = Array.isArray(config.actions) ? config.actions : [];
		if (!actions.length) {
			return;
		}

		for (const action of actions) {
			try {
				switch (action?.type) {
					case "psn_refresh":
						await this._refreshData({ reason: "manual-action" });
						break;
					case "psn_chat_latest":
						await this._sendLatestTitleToChat(action);
						break;
					default:
						await this._log(
							`Unknown action type: ${action?.type ?? "undefined"}`,
							"warn"
						);
				}
			} catch (error) {
				const message = this._errorMessage(error);
				await this._log(
					`Action ${action?.type ?? "unknown"} failed: ${message}`,
					"error"
				);
			}
		}
	}

	async validateAuth() {
		if (!this._hasAuthInputs()) {
			await this._log("Validation failed: missing NPSSO/refresh token.", "warn");
			return false;
		}

		try {
			const authorization = await this._ensureAuthorization();
			const accountId = await this._resolveAccountId(authorization);
			const { getUserTitles } = await this._loadPsnApi();
			await getUserTitles(authorization, accountId, { limit: 1 });
			await this._log("PSN authentication succeeded.");
			return true;
		} catch (error) {
			const message = this._errorMessage(error);
			await this._log(`PSN validation failed: ${message}`, "error");
			return false;
		}
	}

	async _refreshData({ reason } = {}) {
		if (!this._hasAuthInputs()) {
			await this._updateConnectionState(false);
			return;
		}

		if (this._refreshPromise) {
			return this._refreshPromise;
		}

		this._refreshPromise = (async () => {
			try {
				const authorization = await this._ensureAuthorization();
				const accountId = await this._resolveAccountId(authorization);
				const { getUserTitles } = await this._loadPsnApi();
				const response = await getUserTitles(authorization, accountId, {
					limit: 1,
				});

				const titles = Array.isArray(response?.trophyTitles)
					? response.trophyTitles
					: [];
				const latest = titles[0] ?? null;

				await this._setVariableIfChanged(VARIABLE_NAMES.accountId, accountId);
				await this._setVariableIfChanged(
					VARIABLE_NAMES.lastUpdated,
					new Date().toISOString()
				);

				if (latest) {
					const titleName =
						latest?.trophyTitleName ?? latest?.name ?? latest?.titleName ?? "";
					const titlePlatform = Array.isArray(latest?.trophyTitlePlatform)
						? latest.trophyTitlePlatform.join(", ")
						: latest?.trophyTitlePlatform ?? "";
					const titleProgress = this._coerceNumber(latest?.progress, 0);
					const titleUpdated =
						latest?.lastUpdatedDateTime ?? latest?.lastUpdated ?? "";

					this._lastTitleSnapshot = {
						name: titleName,
						platform: titlePlatform,
						progress: titleProgress,
						updated: titleUpdated,
					};

					await this._setVariableIfChanged(
						VARIABLE_NAMES.lastTitleName,
						titleName
					);
					await this._setVariableIfChanged(
						VARIABLE_NAMES.lastTitlePlatform,
						titlePlatform
					);
					await this._setVariableIfChanged(
						VARIABLE_NAMES.lastTitleProgress,
						titleProgress
					);
					await this._setVariableIfChanged(
						VARIABLE_NAMES.lastTitleUpdated,
						titleUpdated
					);
				} else {
					this._lastTitleSnapshot = null;
					await this._setVariableIfChanged(VARIABLE_NAMES.lastTitleName, "");
					await this._setVariableIfChanged(VARIABLE_NAMES.lastTitlePlatform, "");
					await this._setVariableIfChanged(VARIABLE_NAMES.lastTitleProgress, 0);
					await this._setVariableIfChanged(VARIABLE_NAMES.lastTitleUpdated, "");
				}

				await this._updateConnectionState(true);

				if (reason) {
					await this._log(`PSN data refreshed (${reason}).`);
				}
			} catch (error) {
				const message = this._errorMessage(error);
				await this._updateConnectionState(false);
				await this._log(`Failed to refresh PSN data: ${message}`, "warn");
			} finally {
				this._refreshPromise = null;
			}
		})();

		return this._refreshPromise;
	}

	async _sendLatestTitleToChat(action = {}) {
		const messageTemplate = this._coerceString(
			action?.message,
			"Latest PSN title: {{psn_last_title_name}}"
		);
		const titleName =
			this._lastTitleSnapshot?.name ??
			this.lumia.getVariable(VARIABLE_NAMES.lastTitleName) ??
			"";

		const message = messageTemplate.replace(
			"{{psn_last_title_name}}",
			titleName || "Unknown"
		);

		this.displayChat({
			message,
		});
	}

	_schedulePolling() {
		this._clearPolling();

		const intervalSeconds = this._pollInterval();
		if (!intervalSeconds || intervalSeconds <= 0) {
			return;
		}

		this._pollTimer = setInterval(() => {
			this._refreshData({ reason: "poll" });
		}, intervalSeconds * 1000);
	}

	_clearPolling() {
		if (this._pollTimer) {
			clearInterval(this._pollTimer);
			this._pollTimer = null;
		}
	}

	async _ensureAuthorization() {
		const settings = this.settings ?? {};
		const accessToken = this._coerceString(settings.accessToken, "");
		const accessTokenExpiresAt = this._parseTime(settings.accessTokenExpiresAt);
		const refreshToken = this._coerceString(settings.refreshToken, "");
		const npsso = this._coerceString(settings.npsso, "");

		if (accessToken && (!accessTokenExpiresAt || accessTokenExpiresAt > Date.now())) {
			return { accessToken };
		}

		const { exchangeAccessCodeForAuthTokens, exchangeNpssoForAccessCode, exchangeRefreshTokenForAuthTokens } =
			await this._loadPsnApi();

		if (refreshToken) {
			try {
				const auth = await exchangeRefreshTokenForAuthTokens(refreshToken);
				await this._storeTokens(auth);
				return auth;
			} catch (error) {
				const message = this._errorMessage(error);
				await this._log(`Refresh token exchange failed: ${message}`, "warn");
			}
		}

		if (!npsso) {
			throw new Error("Missing NPSSO token.");
		}

		const accessCode = await exchangeNpssoForAccessCode(npsso);
		const auth = await exchangeAccessCodeForAuthTokens(accessCode);
		await this._storeTokens(auth);
		return auth;
	}

	async _storeTokens(auth) {
		if (!auth || typeof auth !== "object") {
			return;
		}

		const now = Date.now();
		const accessTokenExpiresAt = this._calculateExpiry(
			now,
			auth.expiresIn
		);
		const refreshTokenExpiresAt = this._calculateExpiry(
			now,
			auth.refreshTokenExpiresIn
		);

		this.updateSettings({
			accessToken: auth.accessToken ?? this.settings.accessToken ?? "",
			refreshToken: auth.refreshToken ?? this.settings.refreshToken ?? "",
			accessTokenExpiresAt,
			refreshTokenExpiresAt,
		});
	}

	async _resolveAccountId(authorization) {
		const settings = this.settings ?? {};
		const targetAccountId = this._coerceString(settings.targetAccountId, "");
		const targetOnlineId = this._coerceString(settings.targetOnlineId, "");

		if (targetAccountId) {
			return targetAccountId;
		}

		if (!targetOnlineId) {
			return "me";
		}

		if (this._cachedAccountId && this._cachedOnlineId === targetOnlineId) {
			return this._cachedAccountId;
		}

		const { makeUniversalSearch, getProfileFromUserName } =
			await this._loadPsnApi();

		let accountId = null;

		try {
			const search = await makeUniversalSearch(
				authorization,
				targetOnlineId,
				"SocialAllAccounts"
			);
			accountId = this._findAccountId(search);
		} catch (error) {
			accountId = null;
		}

		if (!accountId) {
			try {
				const profileResponse = await getProfileFromUserName(
					authorization,
					targetOnlineId
				);
				const profile = profileResponse?.profile ?? profileResponse ?? {};
				accountId = profile?.accountId ?? null;
			} catch (error) {
				accountId = null;
			}
		}

		if (!accountId) {
			throw new Error("Unable to resolve account ID. Try using the Account ID.");
		}

		this._cachedAccountId = accountId;
		this._cachedOnlineId = targetOnlineId;
		return accountId;
	}

	async _loadPsnApi() {
		if (!this._psnApiPromise) {
			this._psnApiPromise = import("psn-api");
		}
		return this._psnApiPromise;
	}

	async _updateConnectionState(state) {
		if (this._lastConnectionState === state) {
			return;
		}
		this._lastConnectionState = state;
		await this.lumia.updateConnection(state);
	}

	async _setVariableIfChanged(name, value) {
		const normalized = this._normalizeValue(value);
		const previous = this._lastVariables.get(name);
		if (this._valuesEqual(previous, normalized)) {
			return false;
		}
		this._lastVariables.set(name, normalized);
		await this.lumia.setVariable(name, value);
		return true;
	}

	_findAccountId(data) {
		if (!data || typeof data !== "object") {
			return null;
		}
		if (typeof data.accountId === "string" && data.accountId) {
			return data.accountId;
		}
		for (const value of Object.values(data)) {
			const found = this._findAccountId(value);
			if (found) {
				return found;
			}
		}
		return null;
	}

	_calculateExpiry(now, expiresIn) {
		const seconds = this._coerceNumber(expiresIn, 0);
		if (!seconds) {
			return "";
		}
		return new Date(now + seconds * 1000).toISOString();
	}

	_parseTime(value) {
		if (!value) {
			return 0;
		}
		const parsed = Date.parse(value);
		return Number.isNaN(parsed) ? 0 : parsed;
	}

	_pollInterval() {
		return this._coerceNumber(this.settings?.pollInterval, DEFAULTS.pollInterval);
	}

	_hasAuthInputs() {
		return Boolean(
			this._coerceString(this.settings?.npsso, "") ||
				this._coerceString(this.settings?.refreshToken, "") ||
				this._coerceString(this.settings?.accessToken, "")
		);
	}

	_normalizeValue(value) {
		if (typeof value === "number" && Number.isNaN(value)) {
			return null;
		}
		if (value instanceof Date) {
			return value.toISOString();
		}
		return value;
	}

	_valuesEqual(a, b) {
		if (Number.isNaN(a) && Number.isNaN(b)) {
			return true;
		}
		return a === b;
	}

	_coerceString(value, fallback) {
		if (typeof value === "string") {
			return value;
		}
		if (typeof value === "number") {
			return String(value);
		}
		return fallback;
	}

	_coerceNumber(value, fallback) {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : fallback;
	}

	_errorMessage(error) {
		return error instanceof Error ? error.message : String(error);
	}

	async _log(message, severity = "info") {
		if (typeof this.lumia.addLog !== "function") {
			return;
		}
		await this.lumia.addLog(`[PSN] ${message}`, severity);
	}
}

module.exports = PlaystationNetworkPlugin;

```

## playstation_network/manifest.json

```
{
	"id": "playstation_network",
	"name": "PlayStation Network",
	"version": "1.0.0",
	"author": "Lumia Stream",
	"email": "",
	"website": "",
	"repository": "",
	"description": "Pull PSN trophy title updates into Lumia variables using psn-api.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "apps",
	"icon": "",
	"config": {
		"settings": [
			{
				"key": "npsso",
				"label": "NPSSO Cookie",
				"type": "password",
				"placeholder": "Paste your NPSSO value",
				"helperText": "Used to exchange for PSN access/refresh tokens. Keep this private.",
				"required": true
			},
			{
				"key": "targetOnlineId",
				"label": "Target Online ID",
				"type": "text",
				"placeholder": "Optional",
				"helperText": "Leave blank to use your own account. Set this to monitor another public profile."
			},
			{
				"key": "targetAccountId",
				"label": "Target Account ID",
				"type": "text",
				"placeholder": "Optional override",
				"helperText": "Use only if the Online ID lookup fails or returns the wrong account."
			},
			{
				"key": "pollInterval",
				"label": "Poll Interval (seconds)",
				"type": "number",
				"defaultValue": 300,
				"min": 30,
				"max": 3600,
				"helperText": "How often to refresh PSN data."
			},
			{
				"key": "accessToken",
				"label": "Access Token",
				"type": "password",
				"helperText": "Auto-filled after the plugin exchanges NPSSO.",
				"disabled": true,
				"required": false
			},
			{
				"key": "refreshToken",
				"label": "Refresh Token",
				"type": "password",
				"helperText": "Auto-filled after the plugin exchanges NPSSO.",
				"disabled": true,
				"required": false
			},
			{
				"key": "accessTokenExpiresAt",
				"label": "Access Token Expires At (UTC)",
				"type": "text",
				"helperText": "Auto-filled after authentication.",
				"disabled": true,
				"required": false
			},
			{
				"key": "refreshTokenExpiresAt",
				"label": "Refresh Token Expires At (UTC)",
				"type": "text",
				"helperText": "Auto-filled after authentication.",
				"disabled": true,
				"required": false
			}
		],
		"settings_tutorial": "---\n### Connect Your Account\n1) Follow the psn-api NPSSO instructions to capture your NPSSO cookie value.\n2) Paste it into the **NPSSO Cookie** field above.\n3) Click Save so the plugin can exchange tokens.\n---\n### Monitoring Another Account\n- Fill **Target Online ID** to monitor another public profile.\n- If lookup fails, provide the numeric **Target Account ID** instead.\n---\n",
		"actions_tutorial": "---\n### Refresh Data\nUse **Refresh PSN Data** to fetch the latest title update immediately.\n---\n",
		"actions": [
			{
				"type": "psn_refresh",
				"label": "Refresh PSN Data",
				"description": "Fetch the latest PSN trophy title update now.",
				"fields": []
			},
			{
				"type": "psn_chat_latest",
				"label": "Share Latest Title in Chat",
				"description": "Post the most recent title update into Lumia chat.",
				"fields": [
					{
						"key": "message",
						"label": "Message",
						"type": "text",
						"defaultValue": "Latest PSN title: {{psn_last_title_name}}"
					}
				]
			}
		],
		"variables": [
			{
				"name": "psn_account_id",
				"description": "Account ID used for the latest query.",
				"value": ""
			},
			{
				"name": "psn_last_title_name",
				"description": "Most recently updated trophy title name.",
				"value": ""
			},
			{
				"name": "psn_last_title_platform",
				"description": "Platform string for the latest title.",
				"value": ""
			},
			{
				"name": "psn_last_title_progress",
				"description": "Trophy completion progress for the latest title.",
				"value": 0
			},
			{
				"name": "psn_last_title_last_updated",
				"description": "Timestamp for the latest title update.",
				"value": ""
			},
			{
				"name": "psn_last_updated",
				"description": "Timestamp when the plugin last refreshed PSN data.",
				"value": ""
			}
		]
	}
}

```

## playstation_network/package.json

```
{
  "name": "lumia-example-playstation-network",
  "version": "1.0.0",
  "private": true,
  "description": "Example Lumia Stream plugin that pulls PlayStation Network trophy activity via psn-api.",
  "main": "main.js",
  "scripts": {},
  "dependencies": {
    "@lumiastream/plugin": "^0.1.18",
    "psn-api": "^2.11.0"
  }
}

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

```

## rumble/manifest.json

```
{
	"id": "rumble",
	"name": "Rumble Livestream",
	"version": "1.0.0",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://lumiastream.com",
	"repository": "https://github.com/LumiaStream/rumble-plugin",
	"description": "Monitor Rumble livestream status, surface follower/rant/reaction/subscription activity, and display chat messages inside Lumia.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "platforms",
	"icon": "rumble-icon.png",
	"changelog": "# Changelog\n\n## 1.0.0\n- Simplified alerts to focus on followers, rants, likes, dislikes, subs, and sub gifts\n- Added variables for subs, sub gifts, likes, dislikes, and follower deltas\n- Removed milestone and peak-based alerts\n- Aligned alert identifiers with Lumia defaults (for example `rumble-follower`, `rumble-sub`)\n\n## 1.1.0\n- Added variables for chat members, followers, rumbles, rants, and scheduling info\n- New alerts for viewer milestones, new peak viewers, rumbles, rants, follower milestones, and chat spikes\n- Improved stream session tracking and alert payloads\n\n## 1.0.0\n- Initial release\n- Rumble API polling\n- Stream start/end detection\n- Viewer count change tracking\n- Template variable updates\n- Manual action handlers",
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
				"defaultValue": 30,
				"helperText": "How often to check for stream updates (10-300 seconds)"
			}
		],
		"settings_tutorial": "---\n### 🔑 Get Your Rumble Livestream API URL\n1) Open https://rumble.com/account/livestream-api while logged in.\n2) Copy the full Livestream API URL shown on that page.\n3) Paste it into the **API Key** field in Lumia (the plugin will extract the `key` automatically).\n---\n### ✅ Verify Access\nClick **Save**, then trigger **Manual Poll** to confirm data is flowing.\n---\n### ⏱️ Adjust Polling\nSet a poll interval that balances freshness with API limits (10–300 seconds).\n---",
		"actions_tutorial": "---\n### 🔁 Manual Poll\nUse this to fetch the latest livestream stats without waiting for the next scheduled poll.\n---\n### 🚨 Manual Alert\nFire the “Stream Started” alert for testing your alert/overlay setup.\n---",
		"actions": [
			{
				"type": "manual_poll",
				"label": "Manual Poll",
				"description": "Manually trigger a single API poll",
				"fields": []
			},
			{
				"type": "manual_alert",
				"label": "Manual Alert",
				"description": "Manually trigger the stream started alert",
				"fields": []
			}
		],
		"variables": [
			{
				"name": "rumble_live",
				"description": "Whether the Rumble stream is currently live",
				"value": false
			},
			{
				"name": "rumble_viewers",
				"description": "Current number of concurrent viewers watching the stream",
				"value": 0
			},
			{
				"name": "rumble_joined",
				"description": "Total viewers that have joined the stream session",
				"value": 0
			},
			{
				"name": "rumble_title",
				"description": "Current stream title",
				"value": ""
			},
			{
				"name": "rumble_thumbnail",
				"description": "Stream thumbnail URL",
				"value": ""
			},
			{
				"name": "rumble_stream_url",
				"description": "Public URL to the livestream",
				"value": ""
			},
			{
				"name": "rumble_video_id",
				"description": "Underlying Rumble video ID",
				"value": ""
			},
			{
				"name": "rumble_rumbles",
				"description": "Current Rumble reaction count on the stream",
				"value": 0
			},
			{
				"name": "rumble_followers",
				"description": "Current follower count of the channel",
				"value": 0
			},
			{
				"name": "rumble_likes",
				"description": "Thumbs-up reactions on the stream",
				"value": 0
			},
			{
				"name": "rumble_dislikes",
				"description": "Thumbs-down reactions on the stream",
				"value": 0
			},
			{
				"name": "rumble_subs",
				"description": "Total paid subscriptions/memberships for the channel",
				"value": 0
			},
			{
				"name": "rumble_sub_gifts",
				"description": "Gifted subscriptions/memberships received during the stream",
				"value": 0
			},
			{
				"name": "rumble_rants",
				"description": "Number of Rants received this stream",
				"value": 0
			},
			{
				"name": "rumble_rant_amount",
				"description": "Total value of Rants received this stream",
				"value": 0
			},
			{
				"name": "rumble_chat_members",
				"description": "Active chat members in the livestream chat",
				"value": 0
			},
			{
				"name": "rumble_category",
				"description": "Category assigned to the livestream",
				"value": ""
			},
			{
				"name": "rumble_description",
				"description": "Short description of the livestream",
				"value": ""
			},
			{
				"name": "rumble_language",
				"description": "Language reported by Rumble for the stream",
				"value": ""
			},
			{
				"name": "rumble_chat_url",
				"description": "Direct URL to the livestream chat",
				"value": ""
			},
			{
				"name": "rumble_channel_name",
				"description": "Rumble channel display name",
				"value": ""
			},
			{
				"name": "rumble_channel_image",
				"description": "Avatar image URL for the Rumble channel",
				"value": ""
			},
			{
				"name": "rumble_started_at",
				"description": "Timestamp of when the stream went live (ISO 8601)",
				"value": ""
			},
			{
				"name": "rumble_scheduled_start",
				"description": "Scheduled start time for the stream (ISO 8601)",
				"value": ""
			},
			{
				"name": "rumble_last_polled",
				"description": "Timestamp (ISO 8601) of the most recent Rumble API poll",
				"value": ""
			}
		],
		"alerts": [
			{
				"title": "Stream Started",
				"key": "streamStarted",
				"acceptedVariables": [
					"rumble_live",
					"rumble_viewers",
					"rumble_title",
					"rumble_stream_url",
					"rumble_followers",
					"rumble_likes",
					"rumble_dislikes",
					"rumble_subs",
					"rumble_sub_gifts",
					"rumble_rants",
					"rumble_rant_amount"
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
					"rumble_live",
					"rumble_viewers",
					"rumble_title",
					"rumble_followers",
					"rumble_likes",
					"rumble_dislikes",
					"rumble_subs",
					"rumble_sub_gifts",
					"rumble_rants",
					"rumble_rant_amount"
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
					"rumble_followers",
					"rumble_stream_url",
					"rumble_title"
				],
				"defaultMessage": "New followers! Total is now {{rumble_followers}}.",
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
					"rumble_rants",
					"rumble_rant_amount",
					"rumble_viewers",
					"rumble_title"
				],
				"defaultMessage": "New rant received! Total rants: {{rumble_rants}} ({{rumble_rant_amount}})",
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
					"rumble_likes",
					"rumble_stream_url",
					"rumble_title"
				],
				"defaultMessage": "Another thumbs-up! Likes: {{rumble_likes}}",
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
					"rumble_dislikes",
					"rumble_stream_url",
					"rumble_title"
				],
				"defaultMessage": "Someone hit dislike. Total dislikes: {{rumble_dislikes}}",
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
					"rumble_subs",
					"rumble_stream_url",
					"rumble_title"
				],
				"defaultMessage": "New subscription! Subs total: {{rumble_subs}}",
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
					"rumble_sub_gifts",
					"rumble_stream_url",
					"rumble_title"
				],
				"defaultMessage": "Gifted subs came through! Gift total: {{rumble_sub_gifts}}",
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
		]
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
		"@lumiastream/plugin": "^0.1.18"
	}
}

```

## stripe/README.md

```
# Stripe Payments (Lumia Plugin Example)

Monitor Stripe events, trigger Lumia alerts, and create Stripe Payment Links from Lumia actions.

## Setup

1. In Stripe Dashboard, go to **Developers -> API keys** and copy your **Secret key**.
2. Paste the key into **Secret API Key** in the plugin settings.
3. Add the Stripe event types you want to monitor (defaults include `payment_intent.succeeded`).
4. Click **Save** to start polling.

## Actions

- `Refresh Events`: Poll Stripe immediately and fire any new event alerts.
- `Create Payment Link`: Generate a Stripe Payment Link from a Price ID.
- `Create Customer`: Create a Stripe Customer record.
- `Refresh Balance`: Pull the latest Stripe balance summary.

## Alerts

- `Stripe Event Received`

## Variables

- `stripe_last_sync`
- `stripe_last_event_id`
- `stripe_last_event_type`
- `stripe_last_event_created`
- `stripe_last_event_object`
- `stripe_last_event_amount`
- `stripe_last_event_currency`
- `stripe_last_event_customer`
- `stripe_last_payment_link_url`
- `stripe_balance_available_amount`
- `stripe_balance_available_currency`
- `stripe_balance_pending_amount`
- `stripe_balance_pending_currency`
- `stripe_last_error`

## Notes

- The plugin uses Stripe's Events API (last 30 days). Increase `Max Events Per Poll` if you receive many events.
- Amounts are stored in the smallest currency unit (for example, cents).
- If `Alert On Startup` is disabled (default), the plugin primes itself with the latest event without triggering alerts.

```

## stripe/main.js

```
const { Plugin } = require("@lumiastream/plugin");

const DEFAULTS = {
	pollIntervalSeconds: 60,
	maxEventsPerPoll: 25,
	eventTypes: [
		"payment_intent.succeeded",
		"payment_intent.payment_failed",
		"checkout.session.completed",
		"charge.refunded",
		"invoice.paid",
		"invoice.payment_failed",
		"customer.subscription.created",
		"customer.subscription.updated",
		"customer.subscription.deleted",
	],
};

const VARIABLE_NAMES = {
	lastSync: "stripe_last_sync",
	lastEventId: "stripe_last_event_id",
	lastEventType: "stripe_last_event_type",
	lastEventCreated: "stripe_last_event_created",
	lastEventObject: "stripe_last_event_object",
	lastEventAmount: "stripe_last_event_amount",
	lastEventCurrency: "stripe_last_event_currency",
	lastEventCustomer: "stripe_last_event_customer",
	lastPaymentLinkUrl: "stripe_last_payment_link_url",
	balanceAvailableAmount: "stripe_balance_available_amount",
	balanceAvailableCurrency: "stripe_balance_available_currency",
	balancePendingAmount: "stripe_balance_pending_amount",
	balancePendingCurrency: "stripe_balance_pending_currency",
	lastError: "stripe_last_error",
};

const ALERT_KEYS = {
	eventReceived: "stripe_event_received",
};

class StripePaymentsPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._pollTimer = null;
		this._inFlight = false;
		this._hasPrimed = false;
		this._lastEventCreated = 0;
		this._lastEventId = "";
		this._recentEventIds = new Set();
	}

	async onload() {
		await this._log("Stripe plugin loaded");
		this._loadLastEventState();
		await this._primeEventsIfNeeded();
		await this._startPolling();
	}

	async onunload() {
		this._stopPolling();
		await this._log("Stripe plugin unloaded");
	}

	async onsettingsupdate(settings, previous = {}) {
		await this._log("Settings updated");

		if (settings?.alertOnStartup && !previous?.alertOnStartup) {
			this._resetEventState();
		}

		if (
			settings?.secretKey !== previous?.secretKey ||
			settings?.pollIntervalSeconds !== previous?.pollIntervalSeconds ||
			settings?.maxEventsPerPoll !== previous?.maxEventsPerPoll ||
			settings?.alertOnStartup !== previous?.alertOnStartup ||
			String(settings?.eventTypes) !== String(previous?.eventTypes)
		) {
			await this._primeEventsIfNeeded(true);
			await this._startPolling();
		}
	}

	async actions(config = {}) {
		const actions = Array.isArray(config.actions) ? config.actions : [];
		for (const action of actions) {
			switch (action?.type) {
				case "refresh_events":
					await this._refreshEvents({ manual: true });
					break;
				case "create_payment_link":
					await this._createPaymentLink(action?.data);
					break;
				case "create_customer":
					await this._createCustomer(action?.data);
					break;
				case "refresh_balance":
					await this._refreshBalance();
					break;
				default:
					await this._log(
						`Unknown action type: ${action?.type ?? "undefined"}`,
						"warn"
					);
			}
		}
	}

	async _startPolling() {
		this._stopPolling();

		const intervalMs = this._pollIntervalMs();
		if (intervalMs > 0) {
			this._pollTimer = setInterval(() => {
				void this._refreshEvents({ manual: false });
			}, intervalMs);
		}

		await this._refreshEvents({ manual: true });
	}

	_stopPolling() {
		if (this._pollTimer) {
			clearInterval(this._pollTimer);
			this._pollTimer = null;
		}
	}

	_pollIntervalMs() {
		const raw = Number(this.settings?.pollIntervalSeconds);
		const value = Number.isFinite(raw) ? raw : DEFAULTS.pollIntervalSeconds;
		const clamped = Math.min(Math.max(value, 15), 3600);
		return clamped * 1000;
	}

	_maxEventsPerPoll() {
		const raw = Number(this.settings?.maxEventsPerPoll);
		const value = Number.isFinite(raw) ? raw : DEFAULTS.maxEventsPerPoll;
		return Math.min(Math.max(value, 1), 100);
	}

	_eventTypes() {
		const raw = this.settings?.eventTypes;
		if (Array.isArray(raw)) {
			const list = raw
				.map((entry) => String(entry).trim())
				.filter(Boolean);
			return list;
		}

		if (typeof raw === "string") {
			const list = raw
				.split(",")
				.map((entry) => entry.trim())
				.filter(Boolean);
			return list;
		}

		return DEFAULTS.eventTypes;
	}

	_shouldAlert() {
		return this.settings?.enableAlerts !== false;
	}

	_loadLastEventState() {
		const lastEventId = this.lumia.getVariable(VARIABLE_NAMES.lastEventId);
		if (lastEventId) {
			this._lastEventId = String(lastEventId);
			this._rememberEventId(this._lastEventId);
		}

		const lastCreatedIso =
			this.lumia.getVariable(VARIABLE_NAMES.lastEventCreated) ?? "";
		const parsed = Date.parse(String(lastCreatedIso));
		if (Number.isFinite(parsed)) {
			this._lastEventCreated = Math.floor(parsed / 1000);
		}

		if (this._lastEventCreated) {
			this._hasPrimed = true;
		}
	}

	_resetEventState() {
		this._lastEventCreated = 0;
		this._lastEventId = "";
		this._recentEventIds.clear();
		this._hasPrimed = false;
	}

	async _primeEventsIfNeeded(force = false) {
		const alertOnStartup = this.settings?.alertOnStartup === true;
		if (alertOnStartup) {
			this._hasPrimed = true;
			return;
		}

		if (this._hasPrimed && !force) {
			return;
		}

		try {
			const events = await this._fetchEvents({ limit: 1 });
			const latest = events[0];
			if (latest) {
				await this._setEventVariables(latest);
				this._lastEventCreated = latest.created || 0;
				this._lastEventId = latest.id || "";
				this._rememberEventId(this._lastEventId);
			}
			this._hasPrimed = true;
		} catch (error) {
			await this._log(
				`Unable to prime events: ${error?.message ?? error}`,
				"warn"
			);
		}
	}

	async _refreshEvents({ manual }) {
		if (this._inFlight) return;
		this._inFlight = true;

		try {
			const secretKey = this._secretKey();
			if (!secretKey) {
				await this._log(
					"Missing Stripe Secret API Key. Update settings and save.",
					"warn"
				);
				return;
			}

			if (!this._hasPrimed) {
				await this._primeEventsIfNeeded();
			}

			const events = await this._fetchEvents({
				limit: this._maxEventsPerPoll(),
				since: this._lastEventCreated,
				types: this._eventTypes(),
			});

			const newEvents = this._filterNewEvents(events);
			if (!newEvents.length) {
				if (manual) {
					await this._log("No new Stripe events.");
				}
				await this._setLastSync();
				await this.lumia.setVariable(VARIABLE_NAMES.lastError, "");
				return;
			}

			for (const event of newEvents) {
				await this._setEventVariables(event);
				this._lastEventCreated = event.created || this._lastEventCreated;
				this._lastEventId = event.id || this._lastEventId;
				this._rememberEventId(this._lastEventId);

				if (this._shouldAlert()) {
					await this.lumia.triggerAlert({
						alert: ALERT_KEYS.eventReceived,
					});
				}
			}

			await this._setLastSync();
			await this.lumia.setVariable(VARIABLE_NAMES.lastError, "");

			if (manual) {
				await this._log(`Processed ${newEvents.length} Stripe events.`);
			}
		} catch (error) {
			const message = error?.message ?? error;
			await this.lumia.setVariable(VARIABLE_NAMES.lastError, String(message));
			await this._log(`Failed to refresh Stripe events: ${message}`, "error");
		} finally {
			this._inFlight = false;
		}
	}

	_filterNewEvents(events) {
		if (!Array.isArray(events) || !events.length) return [];
		const sorted = [...events].sort((a, b) => (a?.created ?? 0) - (b?.created ?? 0));
		const results = [];

		for (const event of sorted) {
			if (!event?.id || !event?.created) continue;
			if (event.created < this._lastEventCreated) continue;
			if (
				event.created === this._lastEventCreated &&
				this._recentEventIds.has(event.id)
			) {
				continue;
			}
			results.push(event);
		}

		return results;
	}

	_rememberEventId(eventId) {
		if (!eventId) return;
		this._recentEventIds.add(eventId);
		if (this._recentEventIds.size <= 200) return;
		const first = this._recentEventIds.values().next().value;
		if (first) this._recentEventIds.delete(first);
	}

	async _fetchEvents({ limit, since, types } = {}) {
		const query = {
			limit: limit ?? this._maxEventsPerPoll(),
		};

		if (Array.isArray(types) && types.length) {
			query.types = types;
		}

		if (since) {
			query.created = { gte: since };
		}

		const response = await this._request("events", { query });
		return Array.isArray(response?.data) ? response.data : [];
	}

	async _createPaymentLink(data = {}) {
		const secretKey = this._secretKey();
		if (!secretKey) {
			await this._log("Missing Stripe Secret API Key.", "warn");
			return;
		}

		const priceId = String(data?.priceId ?? "").trim();
		if (!priceId) {
			await this._log("Price ID is required.", "warn");
			return;
		}

		const quantityRaw = Number(data?.quantity ?? 1);
		const quantity = Number.isFinite(quantityRaw) ? quantityRaw : 1;
		const allowPromotionCodes = data?.allowPromotionCodes === true;
		const afterCompletionUrl = String(data?.afterCompletionUrl ?? "").trim();

		const payload = {
			line_items: [
				{
					price: priceId,
					quantity: Math.min(Math.max(quantity, 1), 100),
				},
			],
			allow_promotion_codes: allowPromotionCodes,
		};

		if (afterCompletionUrl) {
			payload.after_completion = {
				type: "redirect",
				redirect: {
					url: afterCompletionUrl,
				},
			};
		}

		try {
			const paymentLink = await this._request("payment_links", {
				method: "POST",
				body: payload,
			});

			const url = paymentLink?.url ?? "";
			await this.lumia.setVariable(VARIABLE_NAMES.lastPaymentLinkUrl, url);
			await this._log(
				url ? `Created Payment Link: ${url}` : "Created Payment Link."
			);
		} catch (error) {
			await this._log(
				`Failed to create Payment Link: ${error?.message ?? error}`,
				"error"
			);
		}
	}

	async _createCustomer(data = {}) {
		const secretKey = this._secretKey();
		if (!secretKey) {
			await this._log("Missing Stripe Secret API Key.", "warn");
			return;
		}

		const email = String(data?.email ?? "").trim();
		const name = String(data?.name ?? "").trim();
		const description = String(data?.description ?? "").trim();

		if (!email && !name && !description) {
			await this._log("Provide at least one customer field.", "warn");
			return;
		}

		const payload = {};
		if (email) payload.email = email;
		if (name) payload.name = name;
		if (description) payload.description = description;

		try {
			const customer = await this._request("customers", {
				method: "POST",
				body: payload,
			});

			await this._log(`Created customer ${customer?.id ?? ""}`.trim());
		} catch (error) {
			await this._log(
				`Failed to create customer: ${error?.message ?? error}`,
				"error"
			);
		}
	}

	async _refreshBalance() {
		const secretKey = this._secretKey();
		if (!secretKey) {
			await this._log("Missing Stripe Secret API Key.", "warn");
			return;
		}

		try {
			const balance = await this._request("balance", { method: "GET" });
			const available = Array.isArray(balance?.available)
				? balance.available[0]
				: null;
			const pending = Array.isArray(balance?.pending) ? balance.pending[0] : null;

			await this.lumia.setVariable(
				VARIABLE_NAMES.balanceAvailableAmount,
				available?.amount ?? ""
			);
			await this.lumia.setVariable(
				VARIABLE_NAMES.balanceAvailableCurrency,
				available?.currency ?? ""
			);
			await this.lumia.setVariable(
				VARIABLE_NAMES.balancePendingAmount,
				pending?.amount ?? ""
			);
			await this.lumia.setVariable(
				VARIABLE_NAMES.balancePendingCurrency,
				pending?.currency ?? ""
			);

			await this._log("Stripe balance refreshed.");
		} catch (error) {
			await this._log(
				`Failed to refresh balance: ${error?.message ?? error}`,
				"error"
			);
		}
	}

	async _setEventVariables(event = {}) {
		const created = event?.created
			? new Date(event.created * 1000).toISOString()
			: "";
		const dataObject = event?.data?.object ?? {};
		const amount =
			dataObject?.amount ??
			dataObject?.amount_total ??
			dataObject?.amount_captured ??
			dataObject?.amount_paid ??
			"";
		const currency = dataObject?.currency ?? "";
		const objectId = dataObject?.id ?? "";

		let customerValue = dataObject?.customer ?? "";
		if (typeof customerValue === "object" && customerValue !== null) {
			customerValue = customerValue?.id ?? customerValue?.email ?? "";
		}
		if (!customerValue && dataObject?.customer_details?.email) {
			customerValue = dataObject.customer_details.email;
		}

		await this.lumia.setVariable(VARIABLE_NAMES.lastEventId, event?.id ?? "");
		await this.lumia.setVariable(
			VARIABLE_NAMES.lastEventType,
			event?.type ?? ""
		);
		await this.lumia.setVariable(VARIABLE_NAMES.lastEventCreated, created);
		await this.lumia.setVariable(
			VARIABLE_NAMES.lastEventObject,
			objectId
		);
		await this.lumia.setVariable(
			VARIABLE_NAMES.lastEventAmount,
			amount ?? ""
		);
		await this.lumia.setVariable(
			VARIABLE_NAMES.lastEventCurrency,
			currency ?? ""
		);
		await this.lumia.setVariable(
			VARIABLE_NAMES.lastEventCustomer,
			customerValue ?? ""
		);
	}

	async _setLastSync() {
		await this.lumia.setVariable(
			VARIABLE_NAMES.lastSync,
			new Date().toISOString()
		);
	}

	async _request(path, { method = "GET", query, body } = {}) {
		const secretKey = this._secretKey();
		if (!secretKey) {
			throw new Error("Missing Stripe Secret API Key");
		}

		const url = new URL(`https://api.stripe.com/v1/${path}`);
		if (query) {
			const queryParams = this._buildParams(query);
			for (const [key, value] of queryParams.entries()) {
				url.searchParams.append(key, value);
			}
		}

		const headers = {
			Authorization: `Bearer ${secretKey}`,
		};

		let bodyString;
		if (body) {
			const bodyParams = this._buildParams(body);
			bodyString = bodyParams.toString();
			headers["Content-Type"] = "application/x-www-form-urlencoded";
		}

		const response = await fetch(url.toString(), {
			method,
			headers,
			body: bodyString,
		});

		const text = await response.text();
		let payload = null;
		if (text) {
			try {
				payload = JSON.parse(text);
			} catch (error) {
				payload = { message: text };
			}
		}

		if (!response.ok) {
			const message =
				payload?.error?.message ||
				payload?.message ||
				response.statusText ||
				"Stripe API error";
			throw new Error(message);
		}

		return payload;
	}

	_buildParams(params = {}) {
		const search = new URLSearchParams();

		const appendValue = (key, value) => {
			if (value === undefined || value === null) return;
			search.append(key, String(value));
		};

		const walk = (prefix, value) => {
			if (value === undefined || value === null) return;

			if (Array.isArray(value)) {
				value.forEach((entry, index) => {
					const useIndex =
						typeof entry === "object" && entry !== null && prefix;
					const nextPrefix = useIndex ? `${prefix}[${index}]` : `${prefix}[]`;
					walk(nextPrefix, entry);
				});
				return;
			}

			if (typeof value === "object") {
				for (const [key, entry] of Object.entries(value)) {
					walk(prefix ? `${prefix}[${key}]` : key, entry);
				}
				return;
			}

			appendValue(prefix, value);
		};

		for (const [key, value] of Object.entries(params)) {
			walk(key, value);
		}

		return search;
	}

	_secretKey() {
		return String(this.settings?.secretKey ?? "").trim();
	}

	async _log(message, severity = "info") {
		const prefix = `[${this.manifest?.id ?? "stripe_payments"}]`;
		const decorated =
			severity === "warn"
				? `${prefix} WARN: ${message}`
				: severity === "error"
				? `${prefix} ERROR: ${message}`
				: `${prefix} ${message}`;

		await this.lumia.addLog(decorated);
	}
}

module.exports = StripePaymentsPlugin;

```

## stripe/manifest.json

```
{
	"id": "stripe_payments",
	"name": "Stripe Payments",
	"version": "1.0.0",
	"author": "Lumia Stream",
	"description": "Monitor Stripe events, trigger Lumia alerts, and create Payment Links.",
	"lumiaVersion": "^9.0.0",
	"category": "apps",
	"config": {
		"settings_tutorial": "---\n### Get a Stripe Secret Key\n1) Open Stripe Dashboard -> Developers -> API keys.\n2) Copy your Secret key (starts with `sk_test_` or `sk_live_`).\n3) Paste it into **Secret API Key** below and click Save.\n---\n### Event Filters\nAdd one or more event types to monitor (example: `payment_intent.succeeded`, `checkout.session.completed`).\nLeave the list empty to receive all events.\n---\n### Polling\nSet how often the plugin checks Stripe for new events. Shorter intervals mean faster alerts but more API calls.\n---",
		"actions_tutorial": "---\n### Actions\n- **Refresh Events**: Poll Stripe immediately and fire alerts for new events.\n- **Create Payment Link**: Generate a Stripe Payment Link from a Price ID.\n- **Create Customer**: Create a Stripe Customer record.\n- **Refresh Balance**: Pull the latest Stripe balance summary.\n---",
		"settings": [
			{
				"key": "secretKey",
				"label": "Secret API Key",
				"type": "password",
				"required": true,
				"placeholder": "sk_test_...",
				"helperText": "Create this in Stripe Dashboard -> Developers -> API keys."
			},
			{
				"key": "pollIntervalSeconds",
				"label": "Poll Interval (seconds)",
				"type": "number",
				"defaultValue": 60,
				"min": 15,
				"max": 900,
				"helperText": "How often to check Stripe for new events."
			},
			{
				"key": "maxEventsPerPoll",
				"label": "Max Events Per Poll",
				"type": "number",
				"defaultValue": 25,
				"min": 1,
				"max": 100,
				"helperText": "Limit for each events API request."
			},
			{
				"key": "eventTypes",
				"label": "Event Types",
				"type": "text_list",
				"defaultValue": [
					"payment_intent.succeeded",
					"payment_intent.payment_failed",
					"checkout.session.completed",
					"charge.refunded",
					"invoice.paid",
					"invoice.payment_failed",
					"customer.subscription.created",
					"customer.subscription.updated",
					"customer.subscription.deleted"
				],
				"helperText": "Only alert on these Stripe event types."
			},
			{
				"key": "enableAlerts",
				"label": "Enable Alerts",
				"type": "toggle",
				"defaultValue": true
			},
			{
				"key": "alertOnStartup",
				"label": "Alert On Startup",
				"type": "toggle",
				"defaultValue": false,
				"helperText": "If enabled, the plugin will alert on recent events immediately after loading."
			}
		],
		"actions": [
			{
				"type": "refresh_events",
				"label": "Refresh Events",
				"description": "Poll Stripe immediately and fire any new event alerts."
			},
			{
				"type": "create_payment_link",
				"label": "Create Payment Link",
				"description": "Create a Stripe Payment Link from a Price ID.",
				"fields": [
					{
						"key": "priceId",
						"label": "Price ID",
						"type": "text",
						"required": true,
						"placeholder": "price_..."
					},
					{
						"key": "quantity",
						"label": "Quantity",
						"type": "number",
						"defaultValue": 1,
						"min": 1,
						"max": 100
					},
					{
						"key": "allowPromotionCodes",
						"label": "Allow Promotion Codes",
						"type": "toggle",
						"defaultValue": false
					},
					{
						"key": "afterCompletionUrl",
						"label": "After Completion Redirect URL",
						"type": "text",
						"placeholder": "https://example.com/thanks"
					}
				]
			},
			{
				"type": "create_customer",
				"label": "Create Customer",
				"description": "Create a Stripe Customer record.",
				"fields": [
					{
						"key": "email",
						"label": "Email",
						"type": "text"
					},
					{
						"key": "name",
						"label": "Name",
						"type": "text"
					},
					{
						"key": "description",
						"label": "Description",
						"type": "textarea",
						"rows": 3
					}
				]
			},
			{
				"type": "refresh_balance",
				"label": "Refresh Balance",
				"description": "Fetch the latest Stripe balance summary."
			}
		],
		"variables": [
			{
				"name": "stripe_last_sync",
				"description": "Last time the plugin synced with Stripe.",
				"value": ""
			},
			{
				"name": "stripe_last_event_id",
				"description": "Stripe event ID for the most recent processed event.",
				"value": ""
			},
			{
				"name": "stripe_last_event_type",
				"description": "Stripe event type for the most recent processed event.",
				"value": ""
			},
			{
				"name": "stripe_last_event_created",
				"description": "Event creation time (ISO) for the most recent processed event.",
				"value": ""
			},
			{
				"name": "stripe_last_event_object",
				"description": "Object ID for the most recent processed event (for example, payment intent ID).",
				"value": ""
			},
			{
				"name": "stripe_last_event_amount",
				"description": "Amount (in the smallest currency unit) for the most recent processed event.",
				"value": ""
			},
			{
				"name": "stripe_last_event_currency",
				"description": "Currency for the most recent processed event.",
				"value": ""
			},
			{
				"name": "stripe_last_event_customer",
				"description": "Customer ID or email for the most recent processed event.",
				"value": ""
			},
			{
				"name": "stripe_last_payment_link_url",
				"description": "Latest Payment Link URL created by the plugin.",
				"value": ""
			},
			{
				"name": "stripe_balance_available_amount",
				"description": "Available balance amount (smallest currency unit).",
				"value": ""
			},
			{
				"name": "stripe_balance_available_currency",
				"description": "Available balance currency.",
				"value": ""
			},
			{
				"name": "stripe_balance_pending_amount",
				"description": "Pending balance amount (smallest currency unit).",
				"value": ""
			},
			{
				"name": "stripe_balance_pending_currency",
				"description": "Pending balance currency.",
				"value": ""
			},
			{
				"name": "stripe_last_error",
				"description": "Most recent error message (if any).",
				"value": ""
			}
		],
		"alerts": [
			{
				"title": "Stripe Event Received",
				"key": "stripe_event_received",
				"acceptedVariables": [
					"stripe_last_event_type",
					"stripe_last_event_id",
					"stripe_last_event_created",
					"stripe_last_event_amount",
					"stripe_last_event_currency",
					"stripe_last_event_object",
					"stripe_last_event_customer"
				],
				"defaultMessage": "Stripe event {{stripe_last_event_type}} received."
			}
		]
	}
}

```

## stripe/package.json

```
{
	"name": "lumia-stripe-payments-plugin",
	"version": "1.0.0",
	"private": true,
	"description": "Stripe payments plugin example for Lumia Stream.",
	"main": "main.js",
	"dependencies": {
		"@lumiastream/plugin": "^0.1.18"
	}
}

```

## tikfinity/main.js

```
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
			await this.lumia.addLog(
				`[Tikfinity] Error processing message: ${message}`,
			);
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
				await this.lumia.addLog(`[Tikfinity] Unknown event type: ${eventType}`);
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
		const displayname = coerceString(
			data.nickname || data.displayName || username,
			"",
		);
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
		const finalRepeatCount =
			streak.lastCount || coerceNumber(data.repeatCount, 1);
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

			await this.updateVariable(
				"tikfinity_diamonds",
				this.sessionData.diamonds,
			);
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

		await this.updateVariable(
			"tikfinity_followers",
			this.sessionData.followers,
		);
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

		this.sessionData.likes =
			totalLikeCount || this.sessionData.likes + likeCount;

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

```

## tikfinity/manifest.json

```
{
	"id": "tikfinity",
	"name": "Tikfinity TikTok LIVE",
	"version": "1.0.0",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://lumiastream.com",
	"repository": "https://github.com/LumiaStream/tikfinity-plugin",
	"description": "Connect to TikTok LIVE streams via Tikfinity Desktop WebSocket service to receive real-time events like chat, gifts, follows, shares, likes, and more.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "platforms",
	"icon": "tikfinity-icon.png",
	"changelog": "# Changelog\n\n## 1.0.0\n- Initial release\n- WebSocket connection to Tikfinity API\n- Real-time event processing for chat, gifts, follows, shares, likes\n- Stream start/end detection\n- Viewer count tracking\n- Template variable updates\n- Manual connection/disconnection handlers",
	"config": {
		"settings": [
			{
				"key": "username",
				"label": "TikTok Username",
				"type": "text",
				"placeholder": "Enter your TikTok username (without @)",
				"helperText": "Your TikTok username to monitor for LIVE events",
				"required": true
			},
			{
				"key": "apiKey",
				"label": "Tikfinity API Key (Optional)",
				"type": "text",
				"placeholder": "Enter your Tikfinity API key for Pro features",
				"helperText": "Optional: Get your API key from https://tikfinity.zerody.one for Pro features",
				"required": false
			},
			{
				"key": "reconnectInterval",
				"label": "Reconnect Interval (seconds)",
				"type": "number",
				"defaultValue": 30,
				"helperText": "How long to wait before attempting reconnection (10-300 seconds)"
			}
		],
		"settings_tutorial": "---\n### 🔑 Setup Your Tikfinity Connection\n1) Enter your TikTok username (the one you use to go LIVE).\n2) (Optional) Get a Pro API key from https://tikfinity.zerody.one for enhanced features.\n3) Click **Save** to establish the connection.\n---\n### ✅ Verify Connection\nThe plugin will attempt to connect when you go LIVE on TikTok.\n---\n### ⏱️ Adjust Reconnection\nSet a reconnect interval for automatic reconnection attempts (10–300 seconds).\n---",
		"actions_tutorial": "---\n### 🔗 Manual Connect\nUse this to manually establish a connection to Tikfinity.\n---\n### ❌ Manual Disconnect\nUse this to manually disconnect from Tikfinity.\n---\n### 🚨 Test Alert\nFire a test alert to verify your alert/overlay setup.\n---",
		"actions": [
			{
				"type": "manual_connect",
				"label": "Manual Connect",
				"description": "Manually connect to Tikfinity WebSocket",
				"fields": []
			},
			{
				"type": "manual_disconnect",
				"label": "Manual Disconnect",
				"description": "Manually disconnect from Tikfinity",
				"fields": []
			},
			{
				"type": "test_alert",
				"label": "Test Alert",
				"description": "Trigger a test alert",
				"fields": []
			}
		],
		"variables": [
			{
				"name": "tikfinity_connected",
				"description": "Whether the Tikfinity connection is active",
				"value": false
			},
			{
				"name": "tikfinity_live",
				"description": "Whether the TikTok stream is currently live",
				"value": false
			},
			{
				"name": "tikfinity_viewers",
				"description": "Current number of viewers watching the stream",
				"value": 0
			},
			{
				"name": "tikfinity_title",
				"description": "Current stream title",
				"value": ""
			},
			{
				"name": "tikfinity_total_viewers",
				"description": "Total viewers that have joined the stream session",
				"value": 0
			},
			{
				"name": "tikfinity_likes",
				"description": "Total likes received during the stream",
				"value": 0
			},
			{
				"name": "tikfinity_diamonds",
				"description": "Total diamonds received during the stream",
				"value": 0
			},
			{
				"name": "tikfinity_followers",
				"description": "Session follower count",
				"value": 0
			},
			{
				"name": "tikfinity_shares",
				"description": "Number of shares during the stream",
				"value": 0
			},
			{
				"name": "tikfinity_last_chatter",
				"description": "Username of the last person to chat",
				"value": ""
			},
			{
				"name": "tikfinity_last_gifter",
				"description": "Username of the last person to send a gift",
				"value": ""
			},
			{
				"name": "tikfinity_last_follower",
				"description": "Username of the last person to follow",
				"value": ""
			}
		],
		"alerts": [
			{
				"title": "Stream Started",
				"key": "streamStarted",
				"acceptedVariables": [
					"tikfinity_live",
					"tikfinity_viewers",
					"tikfinity_title"
				],
				"defaultMessage": "{{username}} has started streaming on TikTok!",
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
					"tikfinity_viewers",
					"tikfinity_likes",
					"tikfinity_diamonds",
					"tikfinity_followers",
					"tikfinity_shares"
				],
				"defaultMessage": "{{username}} has ended their TikTok stream.",
				"variationConditions": [
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			},
			{
				"title": "Chat Message",
				"key": "chat",
				"acceptedVariables": ["tikfinity_last_chatter"],
				"defaultMessage": "{{username}}: {{message}}",
				"variationConditions": [
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			},
			{
				"title": "Gift",
				"key": "gift",
				"acceptedVariables": ["tikfinity_last_gifter", "tikfinity_diamonds"],
				"defaultMessage": "{{username}} sent {{giftName}} x{{giftAmount}}!",
				"variationConditions": [
					{
						"type": "GREATER_NUMBER",
						"description": "Gift diamond value is greater than.."
					},
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			},
			{
				"title": "Follow",
				"key": "follow",
				"acceptedVariables": ["tikfinity_last_follower", "tikfinity_followers"],
				"defaultMessage": "{{username}} followed!",
				"variationConditions": [
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			},
			{
				"title": "Share",
				"key": "share",
				"acceptedVariables": ["tikfinity_shares"],
				"defaultMessage": "{{username}} shared the stream!",
				"variationConditions": [
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			},
			{
				"title": "Like",
				"key": "like",
				"acceptedVariables": ["tikfinity_likes"],
				"defaultMessage": "{{username}} liked the stream!",
				"variationConditions": [
					{
						"type": "GREATER_NUMBER",
						"description": "Like count is greater than.."
					},
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			},
			{
				"title": "Subscribe",
				"key": "subscribe",
				"acceptedVariables": [],
				"defaultMessage": "{{username}} subscribed!",
				"variationConditions": [
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			}
		]
	}
}

```

## tikfinity/package.json

```
{
	"name": "lumia-tikfinity",
	"version": "1.0.0",
	"private": true,
	"description": "Lumia Stream plugin that connects to TikTok LIVE streams via Tikfinity WebSocket service to receive real-time events.",
	"main": "main.js",
	"scripts": {},
	"dependencies": {
		"@lumiastream/plugin": "^0.1.18"
	}
}

```

## unraid/README.md

```
# Unraid Integration (Example Plugin)

This example plugin polls the Unraid GraphQL API and exposes array + Docker status as Lumia variables.

## Setup

1) Enable the Unraid API and create an API key in the Unraid web UI (Settings > Management Access).
2) Configure the plugin settings:
   - `Server Base URL`: e.g. `http://tower.local` or `http://192.168.1.10`
   - `API Key`: the key you generated in Unraid
3) (Optional) Adjust the polling interval and timeout.

## Actions

- `Refresh Status` - manually fetch the latest Unraid summary data.
- `Docker Action` - start or stop a Docker container (id or name).
- `VM Action` - start/stop/pause/resume/force stop/reboot/reset a VM.
- `Parity Check` - start/pause/resume/cancel a parity check.
- `Set Array State` - start or stop the array.
- `Send Unraid Notification` - create an Unraid notification.

## Alerts

Base alert messages are disabled by default using `defaults.disableBaseAlert`. Configure alert variations in Lumia to enable notifications.

- High CPU usage (GREATER_NUMBER variations using percent).
- High memory usage (GREATER_NUMBER variations using percent).
- High disk temperature (GREATER_NUMBER variations using temperature).
- Disk SMART warning count (GREATER_NUMBER variations).
- Docker containers stopped count (GREATER_NUMBER variations).
- Array state change (EQUAL_SELECTION variations).

## Variables

- `unraid_array_state`
- `unraid_array_total_bytes`
- `unraid_array_used_bytes`
- `unraid_array_free_bytes`
- `unraid_disk_count`
- `unraid_disk_total_count`
- `unraid_disk_temp_max_c`
- `unraid_disk_temp_avg_c`
- `unraid_disk_smart_unknown_count`
- `unraid_disk_spinning_count`
- `unraid_disks_json`
- `unraid_docker_total`
- `unraid_docker_running`
- `unraid_docker_stopped`
- `unraid_docker_stopped_names`
- `unraid_os_release`
- `unraid_os_uptime`
- `unraid_cpu_brand`
- `unraid_cpu_percent`
- `unraid_mem_percent`
- `unraid_mem_total_bytes`
- `unraid_mem_used_bytes`
- `unraid_mem_free_bytes`
- `unraid_mem_available_bytes`
- `unraid_swap_percent`
- `unraid_swap_total_bytes`
- `unraid_swap_used_bytes`
- `unraid_swap_free_bytes`
- `unraid_last_updated`

## Notes

- The plugin calls the Unraid GraphQL endpoint at `/graphql`.
- The plugin auto-detects Docker fields. If the API schema does not expose containers, Docker metrics are skipped.
- Actions are skipped if the API schema or permissions do not expose the required mutations.
- If you use HTTPS with a self-signed certificate, the runtime must trust that certificate.

Unraid API docs: https://docs.unraid.net/API/

```

## unraid/main.js

```
const { Plugin } = require("@lumiastream/plugin");

const DEFAULTS = {
	pollInterval: 30,
	requestTimeoutMs: 8000,
};

const ALERT_COOLDOWN_SECONDS = 300;

const VARIABLE_NAMES = {
	arrayState: "unraid_array_state",
	arrayTotal: "unraid_array_total_bytes",
	arrayUsed: "unraid_array_used_bytes",
	arrayFree: "unraid_array_free_bytes",
	diskCount: "unraid_disk_count",
	diskTotalCount: "unraid_disk_total_count",
	diskTempMax: "unraid_disk_temp_max_c",
	diskTempAvg: "unraid_disk_temp_avg_c",
	diskSmartUnknownCount: "unraid_disk_smart_unknown_count",
	diskSpinningCount: "unraid_disk_spinning_count",
	disksJson: "unraid_disks_json",
	dockerTotal: "unraid_docker_total",
	dockerRunning: "unraid_docker_running",
	dockerStopped: "unraid_docker_stopped",
	dockerStoppedNames: "unraid_docker_stopped_names",
	osRelease: "unraid_os_release",
	osUptime: "unraid_os_uptime",
	cpuBrand: "unraid_cpu_brand",
	cpuPercent: "unraid_cpu_percent",
	memPercent: "unraid_mem_percent",
	memTotal: "unraid_mem_total_bytes",
	memUsed: "unraid_mem_used_bytes",
	memFree: "unraid_mem_free_bytes",
	memAvailable: "unraid_mem_available_bytes",
	swapPercent: "unraid_swap_percent",
	swapTotal: "unraid_swap_total_bytes",
	swapUsed: "unraid_swap_used_bytes",
	swapFree: "unraid_swap_free_bytes",
	lastUpdated: "unraid_last_updated",
};

const ALERT_KEYS = {
	cpuHigh: "unraid_cpu_high",
	memHigh: "unraid_mem_high",
	diskTempHigh: "unraid_disk_temp_high",
	diskSmart: "unraid_disk_smart",
	dockerStopped: "unraid_docker_stopped",
	arrayState: "unraid_array_state_change",
};

class UnraidPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._pollTimer = null;
		this._refreshPromise = null;
		this._lastConnectionState = null;
		this._lastArrayState = null;
		this._lastVariables = new Map();
		this._dockerInfo = null;
		this._dockerIndex = new Map();
		this._vmInfo = null;
		this._vmIndex = new Map();
		this._rootInfo = null;
		this._mutationInfo = null;
		this._arrayStateOptions = null;
		this._notificationImportance = null;
		this._alertState = new Map();
	}

	async onload() {
		await this._log("Unraid plugin loaded.");
		await this._refresh({ reason: "startup" });
		this._schedulePolling();
	}

	async onunload() {
		this._clearPolling();
		await this._updateConnectionState(false);
		await this._log("Unraid plugin stopped.");
	}

	async onsettingsupdate(settings, previous = {}) {
		const pollChanged =
			this._coerceNumber(settings?.pollInterval, DEFAULTS.pollInterval) !==
			this._coerceNumber(previous?.pollInterval, DEFAULTS.pollInterval);

		const baseUrlChanged =
			(settings?.baseUrl || "") !== (previous?.baseUrl || "");
		const apiKeyChanged =
			(settings?.apiKey || "") !== (previous?.apiKey || "");

		if (pollChanged || baseUrlChanged || apiKeyChanged) {
			this._schedulePolling();
			await this._refresh({ reason: "settings-update" });
		}
	}

	async actions(config = {}) {
		const actions = Array.isArray(config.actions) ? config.actions : [];
		for (const action of actions) {
			switch (action?.type) {
				case "unraid_refresh":
					await this._refresh({ reason: "manual-action" });
					break;
				case "unraid_docker_action":
					await this._handleDockerAction(action.data);
					break;
				case "unraid_vm_action":
					await this._handleVmAction(action.data);
					break;
				case "unraid_parity_action":
					await this._handleParityAction(action.data);
					break;
				case "unraid_array_state":
					await this._handleArrayStateAction(action.data);
					break;
				case "unraid_notify":
					await this._handleNotificationAction(action.data);
					break;
				default:
					await this._log(
						`Unknown action type: ${action?.type ?? "undefined"}`,
						"warn"
					);
			}
		}
	}

	async validateAuth() {
		if (!this._hasCredentials()) {
			await this._log("Validation failed: missing base URL or API key.", "warn");
			return false;
		}

		try {
			await this._fetchSummary();
			await this._log("Unraid authentication succeeded.");
			return true;
		} catch (error) {
			await this._log(
				`Unraid validation failed: ${this._errorMessage(error)}`,
				"error"
			);
			return false;
		}
	}

	async _refresh({ reason } = {}) {
		if (this._refreshPromise) {
			return this._refreshPromise;
		}

		this._refreshPromise = (async () => {
			if (!this._hasCredentials()) {
				await this._updateConnectionState(false);
				return;
			}

			try {
				const data = await this._fetchSummary();
				await this._handleSummary(data, reason);
				await this._updateConnectionState(true);
			} catch (error) {
				await this._log(
					`Refresh failed: ${this._errorMessage(error)}`,
					"error"
				);
				await this._updateConnectionState(false);
			}
		})().finally(() => {
			this._refreshPromise = null;
		});

		return this._refreshPromise;
	}

	async _handleSummary(data, reason) {
		if (!data) {
			return;
		}

		const arrayState = data?.array?.state ?? "unknown";
		const capacity = data?.array?.capacity?.disks || {};
		const disks = Array.isArray(data?.array?.disks) ? data.array.disks : [];
		const diskInventory = Array.isArray(data?.disks) ? data.disks : null;
		const dockerContainers = Array.isArray(data?.dockerContainers)
			? data.dockerContainers
			: null;
		const vms = data?.vms;
		const cpuPercentValue = data?.metrics?.cpu?.percentTotal;
		const cpuPercent = Number.isFinite(Number(cpuPercentValue))
			? Number(cpuPercentValue)
			: null;
		const memory = data?.metrics?.memory || {};
		const memPercentValue = memory?.percentTotal;
		const memPercent = Number.isFinite(Number(memPercentValue))
			? Number(memPercentValue)
			: null;

		const dockerRunning = Array.isArray(dockerContainers)
			? dockerContainers.filter((container) => {
					const state = (container?.state || "").toString().toLowerCase();
					return state === "running";
			  }).length
			: 0;

		const dockerTotal = Array.isArray(dockerContainers)
			? dockerContainers.length
			: 0;
		const dockerStopped = Array.isArray(dockerContainers)
			? Math.max(0, dockerTotal - dockerRunning)
			: 0;
		const dockerStoppedNames = Array.isArray(dockerContainers)
			? dockerContainers
					.filter((container) => {
						const state = (container?.state || "")
							.toString()
							.toLowerCase();
						return state && state !== "running";
					})
					.flatMap((container) =>
						Array.isArray(container?.names) ? container.names : []
					)
					.map((name) => (name || "").toString().replace(/^\\/+/, ""))
					.filter(Boolean)
			: [];

		if (Array.isArray(dockerContainers)) {
			this._updateDockerIndex(dockerContainers);
		}
		if (Array.isArray(vms)) {
			this._updateVmIndex(vms);
		}

		await this._setVariable(VARIABLE_NAMES.arrayState, arrayState);
		await this._setVariable(
			VARIABLE_NAMES.arrayTotal,
			this._toNumber(capacity?.total)
		);
		await this._setVariable(
			VARIABLE_NAMES.arrayUsed,
			this._toNumber(capacity?.used)
		);
		await this._setVariable(
			VARIABLE_NAMES.arrayFree,
			this._toNumber(capacity?.free)
		);
		await this._setVariable(VARIABLE_NAMES.diskCount, disks.length);
		if (Array.isArray(diskInventory)) {
			await this._setVariable(
				VARIABLE_NAMES.diskTotalCount,
				diskInventory.length
			);
		}
		if (Array.isArray(dockerContainers)) {
			await this._setVariable(VARIABLE_NAMES.dockerTotal, dockerTotal);
			await this._setVariable(VARIABLE_NAMES.dockerRunning, dockerRunning);
			await this._setVariable(VARIABLE_NAMES.dockerStopped, dockerStopped);
			await this._setVariable(
				VARIABLE_NAMES.dockerStoppedNames,
				dockerStoppedNames.join(", ")
			);
		}
		await this._setVariable(
			VARIABLE_NAMES.osRelease,
			data?.info?.os?.release ?? ""
		);
		await this._setVariable(
			VARIABLE_NAMES.osUptime,
			this._toNumber(data?.info?.os?.uptime)
		);
		await this._setVariable(
			VARIABLE_NAMES.cpuBrand,
			data?.info?.cpu?.brand ?? ""
		);
		if (data?.metrics?.cpu?.percentTotal != null) {
			await this._setVariable(
				VARIABLE_NAMES.cpuPercent,
				this._toNumber(data?.metrics?.cpu?.percentTotal)
			);
		}
		if (data?.metrics?.memory) {
			await this._setVariable(
				VARIABLE_NAMES.memPercent,
				this._toNumber(memory?.percentTotal)
			);
			await this._setVariable(
				VARIABLE_NAMES.memTotal,
				this._toNumber(memory?.total)
			);
			await this._setVariable(
				VARIABLE_NAMES.memUsed,
				this._toNumber(memory?.used)
			);
			await this._setVariable(
				VARIABLE_NAMES.memFree,
				this._toNumber(memory?.free)
			);
			await this._setVariable(
				VARIABLE_NAMES.memAvailable,
				this._toNumber(memory?.available)
			);
			await this._setVariable(
				VARIABLE_NAMES.swapPercent,
				this._toNumber(memory?.percentSwapTotal)
			);
			await this._setVariable(
				VARIABLE_NAMES.swapTotal,
				this._toNumber(memory?.swapTotal)
			);
			await this._setVariable(
				VARIABLE_NAMES.swapUsed,
				this._toNumber(memory?.swapUsed)
			);
			await this._setVariable(
				VARIABLE_NAMES.swapFree,
				this._toNumber(memory?.swapFree)
			);
		}
		if (Array.isArray(diskInventory)) {
			await this._updateDiskMetrics(diskInventory);
		}
		await this._setVariable(
			VARIABLE_NAMES.lastUpdated,
			new Date().toISOString()
		);

		await this._maybeTriggerAlerts({
			arrayState,
			cpuPercent,
			memPercent,
			diskMetrics: Array.isArray(diskInventory)
				? {
						tempMax: this._toNumber(
							this._lastVariables.get(VARIABLE_NAMES.diskTempMax)
						),
						tempAvg: this._toNumber(
							this._lastVariables.get(VARIABLE_NAMES.diskTempAvg)
						),
						smartUnknownCount: this._toNumber(
							this._lastVariables.get(
								VARIABLE_NAMES.diskSmartUnknownCount
							)
						),
				  }
				: null,
			docker: Array.isArray(dockerContainers)
				? {
						stopped: dockerStopped,
						running: dockerRunning,
						total: dockerTotal,
						stoppedNames: dockerStoppedNames,
				  }
				: null,
		});

		if (this.settings?.logArrayStateChanges) {
			if (this._lastArrayState && this._lastArrayState !== arrayState) {
				await this._log(
					`Array state changed from ${this._lastArrayState} to ${arrayState}.`
				);
			}
			this._lastArrayState = arrayState;
		}

		if (reason === "manual-action") {
			await this._log("Manual refresh complete.");
		}
	}

	async _updateDiskMetrics(disks = []) {
		if (!disks.length) {
			await this._setVariable(VARIABLE_NAMES.diskTempMax, 0);
			await this._setVariable(VARIABLE_NAMES.diskTempAvg, 0);
			await this._setVariable(VARIABLE_NAMES.diskSmartUnknownCount, 0);
			await this._setVariable(VARIABLE_NAMES.diskSpinningCount, 0);
			await this._setVariable(VARIABLE_NAMES.disksJson, "[]");
			return;
		}

		const temps = disks
			.map((disk) => Number(disk?.temperature))
			.filter((value) => Number.isFinite(value));
		const tempMax = temps.length ? Math.max(...temps) : 0;
		const tempAvg = temps.length
			? temps.reduce((sum, value) => sum + value, 0) / temps.length
			: 0;

		const smartUnknownCount = disks.filter(
			(disk) => (disk?.smartStatus || "").toString() !== "OK"
		).length;
		const spinningCount = disks.filter((disk) => disk?.isSpinning).length;

		await this._setVariable(VARIABLE_NAMES.diskTempMax, tempMax);
		await this._setVariable(VARIABLE_NAMES.diskTempAvg, tempAvg);
		await this._setVariable(
			VARIABLE_NAMES.diskSmartUnknownCount,
			smartUnknownCount
		);
		await this._setVariable(
			VARIABLE_NAMES.diskSpinningCount,
			spinningCount
		);

		const compact = disks.map((disk) => ({
			name: disk?.name ?? "",
			device: disk?.device ?? "",
			vendor: disk?.vendor ?? "",
			size: this._toNumber(disk?.size),
			smartStatus: disk?.smartStatus ?? "",
			temperature: Number.isFinite(Number(disk?.temperature))
				? Number(disk.temperature)
				: null,
			isSpinning: Boolean(disk?.isSpinning),
		}));
		await this._setVariable(
			VARIABLE_NAMES.disksJson,
			JSON.stringify(compact)
		);
	}

	_getAlertCooldownMs() {
		const seconds = this._coerceNumber(ALERT_COOLDOWN_SECONDS, 300);
		return Math.max(30, seconds) * 1000;
	}

	_shouldTriggerCooldown(key) {
		const state = this._alertState.get(key) || { lastAt: 0 };
		const now = Date.now();
		if (!state.lastAt || now - state.lastAt >= this._getAlertCooldownMs()) {
			state.lastAt = now;
			this._alertState.set(key, state);
			return true;
		}
		return false;
	}

	_shouldTriggerPresenceAlert(key, isActive) {
		const state = this._alertState.get(key) || {
			lastActive: false,
			lastAt: 0,
		};

		if (!isActive) {
			state.lastActive = false;
			this._alertState.set(key, state);
			return false;
		}

		const now = Date.now();
		if (!state.lastActive || now - state.lastAt >= this._getAlertCooldownMs()) {
			state.lastActive = true;
			state.lastAt = now;
			this._alertState.set(key, state);
			return true;
		}

		return false;
	}

	_shouldTriggerChangeAlert(key, value) {
		const state = this._alertState.get(key) || {};
		if (!state.hasSeen) {
			state.lastValue = value;
			state.hasSeen = true;
			this._alertState.set(key, state);
			return false;
		}

		if (state.lastValue !== value) {
			state.lastValue = value;
			this._alertState.set(key, state);
			return true;
		}
		return false;
	}

	async _maybeTriggerAlerts(payload = {}) {
		if (Number.isFinite(payload.cpuPercent)) {
			if (this._shouldTriggerCooldown(ALERT_KEYS.cpuHigh)) {
				await this.lumia.triggerAlert({
					alert: ALERT_KEYS.cpuHigh,
					dynamic: { value: payload.cpuPercent },
					extraSettings: {
						unraid_cpu_percent: payload.cpuPercent,
					},
				});
			}
		}

		if (Number.isFinite(payload.memPercent)) {
			if (this._shouldTriggerCooldown(ALERT_KEYS.memHigh)) {
				await this.lumia.triggerAlert({
					alert: ALERT_KEYS.memHigh,
					dynamic: { value: payload.memPercent },
					extraSettings: {
						unraid_mem_percent: payload.memPercent,
						unraid_mem_total_bytes: this._toNumber(
							this._lastVariables.get(VARIABLE_NAMES.memTotal)
						),
						unraid_mem_used_bytes: this._toNumber(
							this._lastVariables.get(VARIABLE_NAMES.memUsed)
						),
					},
				});
			}
		}

		if (payload.diskMetrics?.tempMax != null) {
			if (this._shouldTriggerCooldown(ALERT_KEYS.diskTempHigh)) {
				await this.lumia.triggerAlert({
					alert: ALERT_KEYS.diskTempHigh,
					dynamic: { value: payload.diskMetrics.tempMax },
					extraSettings: {
						unraid_disk_temp_max_c: payload.diskMetrics.tempMax,
						unraid_disk_temp_avg_c: payload.diskMetrics.tempAvg,
						unraid_disks_json: this._lastVariables.get(
							VARIABLE_NAMES.disksJson
						),
					},
				});
			}
		}

		if (payload.diskMetrics) {
			const active = payload.diskMetrics.smartUnknownCount > 0;
			if (this._shouldTriggerPresenceAlert(ALERT_KEYS.diskSmart, active)) {
				await this.lumia.triggerAlert({
					alert: ALERT_KEYS.diskSmart,
					dynamic: { value: payload.diskMetrics.smartUnknownCount },
					extraSettings: {
						unraid_disk_smart_unknown_count:
							payload.diskMetrics.smartUnknownCount,
						unraid_disks_json: this._lastVariables.get(
							VARIABLE_NAMES.disksJson
						),
					},
				});
			}
		}

		if (payload.docker) {
			const active = payload.docker.stopped > 0;
			if (this._shouldTriggerPresenceAlert(ALERT_KEYS.dockerStopped, active)) {
				await this.lumia.triggerAlert({
					alert: ALERT_KEYS.dockerStopped,
					dynamic: { value: payload.docker.stopped },
					extraSettings: {
						unraid_docker_stopped: payload.docker.stopped,
						unraid_docker_running: payload.docker.running,
						unraid_docker_total: payload.docker.total,
						unraid_docker_stopped_names: payload.docker.stoppedNames.join(
							", "
						),
					},
				});
			}
		}

		if (payload.arrayState) {
			if (this._shouldTriggerChangeAlert(ALERT_KEYS.arrayState, payload.arrayState)) {
				await this.lumia.triggerAlert({
					alert: ALERT_KEYS.arrayState,
					dynamic: { value: payload.arrayState },
					extraSettings: {
						unraid_array_state: payload.arrayState,
					},
				});
			}
		}
	}

	_normalizeName(value) {
		return (value || "")
			.toString()
			.trim()
			.replace(/^\\/+/, "")
			.toLowerCase();
	}

	_updateDockerIndex(containers = []) {
		this._dockerIndex.clear();
		for (const container of containers) {
			const id = container?.id;
			if (!id) {
				continue;
			}
			const names = Array.isArray(container?.names) ? container.names : [];
			for (const name of names) {
				const key = this._normalizeName(name);
				if (key) {
					this._dockerIndex.set(key, id);
				}
			}
		}
	}

	_updateVmIndex(vms = []) {
		this._vmIndex.clear();
		for (const vm of vms) {
			const id = vm?.id;
			if (!id) {
				continue;
			}
			const nameCandidates = [
				vm?.name,
				vm?.domainName,
				vm?.title,
				vm?.uuid,
			].filter(Boolean);
			for (const name of nameCandidates) {
				const key = this._normalizeName(name);
				if (key) {
					this._vmIndex.set(key, id);
				}
			}
		}
	}

	_resolveDockerIdByName(name) {
		if (!name) {
			return "";
		}
		const key = this._normalizeName(name);
		return this._dockerIndex.get(key) || "";
	}

	_resolveVmIdByName(name) {
		if (!name) {
			return "";
		}
		const key = this._normalizeName(name);
		return this._vmIndex.get(key) || "";
	}

	async _refreshDockerIndex() {
		const containers = await this._fetchDockerContainers();
		if (Array.isArray(containers)) {
			this._updateDockerIndex(containers);
		}
	}

	async _fetchVmsList() {
		const vmInfo = await this._ensureVmInfo();
		if (!vmInfo?.fields?.length) {
			return [];
		}

		const query = `
			query Vms {
				vms {
					${vmInfo.fields.join(" ")}
				}
			}
		`;

		const data = await this._fetchGraphQL(query);
		return Array.isArray(data?.vms) ? data.vms : [];
	}

	async _handleDockerAction(data = {}) {
		const operation = (data?.operation || "").toLowerCase();
		if (!["start", "stop"].includes(operation)) {
			await this._log("Docker action requires operation start or stop.", "warn");
			return;
		}

		const mutationInfo = await this._ensureMutationInfo();
		const dockerMutation = mutationInfo?.docker;
		const fieldInfo = dockerMutation?.fields?.get(operation);
		if (!fieldInfo) {
			await this._log(
				"Docker actions are not available in this Unraid API schema.",
				"warn"
			);
			return;
		}

		let id = (data?.id || "").trim();
		if (!id) {
			const name = (data?.name || "").trim();
			if (!name) {
				await this._log(
					"Docker action requires a container id or name.",
					"warn"
				);
				return;
			}
			id = this._resolveDockerIdByName(name);
			if (!id) {
				await this._refreshDockerIndex();
				id = this._resolveDockerIdByName(name);
			}
		}

		if (!id) {
			await this._log("Docker container not found for the given name.", "warn");
			return;
		}

		const selection = this._requiresSelection(fieldInfo?.type)
			? " { __typename }"
			: "";
		const query = `
			mutation DockerAction($id: PrefixedID!) {
				docker {
					${operation}(id: $id)${selection}
				}
			}
		`;

		await this._runMutation(query, { id }, `Docker ${operation}`);
	}

	async _handleVmAction(data = {}) {
		const requested = (data?.operation || "").toLowerCase();
		const operationMap = {
			start: "start",
			stop: "stop",
			pause: "pause",
			resume: "resume",
			forcestop: "forceStop",
			reboot: "reboot",
			reset: "reset",
		};
		const operation = operationMap[requested];
		if (!operation) {
			await this._log("VM action requires a valid operation.", "warn");
			return;
		}

		const mutationInfo = await this._ensureMutationInfo();
		const vmMutation = mutationInfo?.vm;
		const fieldInfo = vmMutation?.fields?.get(operation);
		if (!fieldInfo) {
			await this._log(
				"VM actions are not available in this Unraid API schema.",
				"warn"
			);
			return;
		}

		let id = (data?.id || "").trim();
		if (!id) {
			const name = (data?.name || "").trim();
			if (!name) {
				await this._log("VM action requires a VM id or name.", "warn");
				return;
			}
			id = this._resolveVmIdByName(name);
			if (!id) {
				const vms = await this._fetchVmsList();
				this._updateVmIndex(vms);
				id = this._resolveVmIdByName(name);
			}
		}

		if (!id) {
			await this._log("VM not found for the given name.", "warn");
			return;
		}

		const selection = this._requiresSelection(fieldInfo?.type)
			? " { __typename }"
			: "";
		const query = `
			mutation VmAction($id: PrefixedID!) {
				vm {
					${operation}(id: $id)${selection}
				}
			}
		`;

		await this._runMutation(query, { id }, `VM ${operation}`);
	}

	async _handleParityAction(data = {}) {
		const operation = (data?.operation || "").toLowerCase();
		const allowed = ["start", "pause", "resume", "cancel"];
		if (!allowed.includes(operation)) {
			await this._log("Parity action requires a valid operation.", "warn");
			return;
		}

		const mutationInfo = await this._ensureMutationInfo();
		const parityMutation = mutationInfo?.parityCheck;
		const fieldInfo = parityMutation?.fields?.get(operation);
		if (!fieldInfo) {
			await this._log(
				"Parity actions are not available in this Unraid API schema.",
				"warn"
			);
			return;
		}

		const selection = this._requiresSelection(fieldInfo?.type)
			? " { __typename }"
			: "";

		if (operation === "start") {
			const correct = Boolean(data?.correct);
			const query = `
				mutation ParityStart($correct: Boolean!) {
					parityCheck {
						start(correct: $correct)${selection}
					}
				}
			`;
			await this._runMutation(query, { correct }, "Parity start");
			return;
		}

		const query = `
			mutation ParityAction {
				parityCheck {
					${operation}${selection}
				}
			}
		`;
		await this._runMutation(query, {}, `Parity ${operation}`);
	}

	async _handleArrayStateAction(data = {}) {
		const desiredState = (data?.desiredState || "").trim();
		if (!desiredState) {
			await this._log("Array state action requires a desired state.", "warn");
			return;
		}

		const mutationInfo = await this._ensureMutationInfo();
		const arrayMutation = mutationInfo?.array;
		const fieldInfo = arrayMutation?.fields?.get("setState");
		if (!fieldInfo) {
			await this._log(
				"Array state actions are not available in this Unraid API schema.",
				"warn"
			);
			return;
		}

		const options = await this._ensureArrayStateOptions();
		if (options.length && !options.includes(desiredState)) {
			await this._log(
				`Array state '${desiredState}' is not valid for this server.`,
				"warn"
			);
			return;
		}

		const selection = this._requiresSelection(fieldInfo?.type)
			? " { __typename }"
			: "";
		const query = `
			mutation ArrayState($state: ArrayStateInputState!) {
				array {
					setState(input: { desiredState: $state })${selection}
				}
			}
		`;

		await this._runMutation(query, { state: desiredState }, "Array state");
	}

	async _handleNotificationAction(data = {}) {
		const title = (data?.title || "").trim();
		const subject = (data?.subject || "").trim();
		const description = (data?.description || "").trim();
		const importance = (data?.importance || "").trim();
		const link = (data?.link || "").trim();

		if (!title || !subject || !description || !importance) {
			await this._log(
				"Notification action requires title, subject, description, and importance.",
				"warn"
			);
			return;
		}

		const mutationInfo = await this._ensureMutationInfo();
		const createNotification = mutationInfo?.createNotification;
		if (!createNotification) {
			await this._log(
				"Notifications are not available in this Unraid API schema.",
				"warn"
			);
			return;
		}

		const options = await this._ensureNotificationImportance();
		if (options.length && !options.includes(importance)) {
			await this._log(
				`Notification importance '${importance}' is not valid for this server.`,
				"warn"
			);
			return;
		}

		const input = { title, subject, description, importance };
		if (link) {
			input.link = link;
		}

		const selection = this._requiresSelection(createNotification?.type)
			? " { __typename }"
			: "";
		const query = `
			mutation CreateNotification($input: NotificationData!) {
				createNotification(input: $input)${selection}
			}
		`;

		await this._runMutation(query, { input }, "Create notification");
	}

	async _runMutation(query, variables, label) {
		try {
			const payload = await this._fetchGraphQLRaw(query, variables);
			if (payload?.errors?.length) {
				const messages = payload.errors
					.map((item) => item?.message)
					.filter(Boolean)
					.join("; ");
				await this._log(
					`${label} failed: ${messages || "unknown error"}`,
					"warn"
				);
				return false;
			}
			await this._log(`${label} completed.`);
			return true;
		} catch (error) {
			await this._log(`${label} failed: ${this._errorMessage(error)}`, "warn");
			return false;
		}
	}

	_requiresSelection(type) {
		const resolved = this._unwrapType(type);
		if (!resolved) {
			return false;
		}
		return !["SCALAR", "ENUM"].includes(resolved.kind || "");
	}

	async _ensureRootInfo() {
		if (this._rootInfo) {
			return this._rootInfo;
		}

		const query = `
			query RootInfo {
				__schema {
					queryType {
						fields {
							name
							type {
								name
								kind
								ofType {
									name
									kind
									ofType {
										name
										kind
									}
								}
							}
						}
					}
				}
			}
		`;

		try {
			const payload = await this._fetchGraphQLRaw(query);
			if (payload?.errors?.length) {
				await this._log(
					"Unable to inspect API schema. Using minimal queries.",
					"warn"
				);
				this._rootInfo = { available: false };
				return this._rootInfo;
			}

			const fields = payload?.data?.__schema?.queryType?.fields || [];
			const fieldMap = new Map();
			for (const field of fields) {
				if (field?.name) {
					fieldMap.set(field.name, field);
				}
			}

			this._rootInfo = {
				available: fieldMap.size > 0,
				fieldMap,
			};
		} catch (error) {
			await this._log(
				`Unable to inspect API schema: ${this._errorMessage(error)}`,
				"warn"
			);
			this._rootInfo = { available: false };
		}
		return this._rootInfo;
	}

	async _ensureVmInfo() {
		if (this._vmInfo) {
			return this._vmInfo;
		}

		const rootInfo = await this._ensureRootInfo();
		const vmField = rootInfo?.fieldMap?.get("vms");
		if (!vmField) {
			this._vmInfo = { fields: [] };
			return this._vmInfo;
		}

		const vmType = this._unwrapType(vmField.type);
		const fields = await this._loadTypeFields(vmType?.name);
		const scalarFields = fields
			.filter((field) => {
				const type = this._unwrapType(field?.type);
				return type?.kind === "SCALAR" || type?.kind === "ENUM";
			})
			.map((field) => field.name);

		const preferred = [
			"id",
			"name",
			"domainName",
			"state",
			"status",
			"uuid",
		];
		const selected = preferred.filter((name) => scalarFields.includes(name));
		if (!selected.includes("id") && scalarFields.includes("id")) {
			selected.unshift("id");
		}

		this._vmInfo = {
			fields: selected.length ? selected : scalarFields,
		};
		return this._vmInfo;
	}

	async _ensureMutationInfo() {
		if (this._mutationInfo) {
			return this._mutationInfo;
		}

		const query = `
			query MutationInfo {
				__schema {
					mutationType {
						fields {
							name
							type {
								name
								kind
								ofType {
									name
									kind
									ofType {
										name
										kind
									}
								}
							}
						}
					}
				}
			}
		`;

		try {
			const payload = await this._fetchGraphQLRaw(query);
			if (payload?.errors?.length) {
				await this._log(
					"Unable to inspect mutation schema. Actions will be disabled.",
					"warn"
				);
				this._mutationInfo = {};
				return this._mutationInfo;
			}

			const fields = payload?.data?.__schema?.mutationType?.fields || [];
			const fieldMap = new Map();
			for (const field of fields) {
				if (field?.name) {
					fieldMap.set(field.name, field);
				}
			}

			const info = {};
			const dockerField = fieldMap.get("docker");
			if (dockerField) {
				const dockerType = this._unwrapType(dockerField.type);
				info.docker = {
					fields: new Map(
						(await this._loadTypeFields(dockerType?.name)).map((field) => [
							field.name,
							field,
						])
					),
				};
			}

			const vmField = fieldMap.get("vm");
			if (vmField) {
				const vmType = this._unwrapType(vmField.type);
				info.vm = {
					fields: new Map(
						(await this._loadTypeFields(vmType?.name)).map((field) => [
							field.name,
							field,
						])
					),
				};
			}

			const arrayField = fieldMap.get("array");
			if (arrayField) {
				const arrayType = this._unwrapType(arrayField.type);
				info.array = {
					fields: new Map(
						(await this._loadTypeFields(arrayType?.name)).map((field) => [
							field.name,
							field,
						])
					),
				};
			}

			const parityField = fieldMap.get("parityCheck");
			if (parityField) {
				const parityType = this._unwrapType(parityField.type);
				info.parityCheck = {
					fields: new Map(
						(await this._loadTypeFields(parityType?.name)).map((field) => [
							field.name,
							field,
						])
					),
				};
			}

			const createNotification = fieldMap.get("createNotification");
			if (createNotification) {
				info.createNotification = createNotification;
			}

			this._mutationInfo = info;
		} catch (error) {
			await this._log(
				`Unable to inspect mutation schema: ${this._errorMessage(error)}`,
				"warn"
			);
			this._mutationInfo = {};
		}
		return this._mutationInfo;
	}

	async _ensureArrayStateOptions() {
		if (this._arrayStateOptions) {
			return this._arrayStateOptions;
		}

		const query = `
			query ArrayStateEnum {
				__type(name: "ArrayStateInputState") {
					enumValues {
						name
					}
				}
			}
		`;

		try {
			const payload = await this._fetchGraphQLRaw(query);
			if (payload?.errors?.length) {
				this._arrayStateOptions = [];
				return this._arrayStateOptions;
			}

			this._arrayStateOptions =
				payload?.data?.__type?.enumValues?.map((value) => value.name) || [];
		} catch (error) {
			this._arrayStateOptions = [];
		}
		return this._arrayStateOptions;
	}

	async _ensureNotificationImportance() {
		if (this._notificationImportance) {
			return this._notificationImportance;
		}

		const query = `
			query NotificationImportanceEnum {
				__type(name: "NotificationImportance") {
					enumValues {
						name
					}
				}
			}
		`;

		try {
			const payload = await this._fetchGraphQLRaw(query);
			if (payload?.errors?.length) {
				this._notificationImportance = [];
				return this._notificationImportance;
			}

			this._notificationImportance =
				payload?.data?.__type?.enumValues?.map((value) => value.name) || [];
		} catch (error) {
			this._notificationImportance = [];
		}
		return this._notificationImportance;
	}

	async _fetchSummary() {
		const rootInfo = await this._ensureRootInfo();
		const hasField = (name) => rootInfo?.available && rootInfo.fieldMap?.has(name);
		const baseBlocks = [];
		if (!rootInfo?.available || hasField("info")) {
			baseBlocks.push(`
				info {
					os {
						release
						uptime
					}
					cpu {
						brand
					}
				}
			`);
		}
		if (!rootInfo?.available || hasField("array")) {
			baseBlocks.push(`
				array {
					state
					capacity {
						disks {
							total
							used
							free
						}
					}
					disks {
						name
						size
						status
						temp
					}
				}
			`);
		}

		let data = {};
		if (baseBlocks.length) {
			const baseQuery = `
				query SummaryBase {
					${baseBlocks.join("\n")}
				}
			`;
			data = await this._fetchGraphQL(baseQuery);
		}

		if (hasField("metrics")) {
			try {
				const metricsQuery = `
					query SummaryMetrics {
						metrics {
							cpu {
								percentTotal
							}
							memory {
								total
								used
								free
								available
								percentTotal
								swapTotal
								swapUsed
								swapFree
								percentSwapTotal
							}
						}
					}
				`;
				const metricsData = await this._fetchGraphQL(metricsQuery);
				if (metricsData?.metrics) {
					data.metrics = metricsData.metrics;
				}
			} catch (error) {
				await this._log(
					`Metrics unavailable: ${this._errorMessage(error)}`,
					"warn"
				);
			}
		}

		if (hasField("disks")) {
			try {
				const disksQuery = `
					query SummaryDisks {
						disks {
							name
							device
							vendor
							size
							smartStatus
							temperature
							isSpinning
						}
					}
				`;
				const disksData = await this._fetchGraphQL(disksQuery);
				if (Array.isArray(disksData?.disks)) {
					data.disks = disksData.disks;
				}
			} catch (error) {
				await this._log(
					`Disk inventory unavailable: ${this._errorMessage(error)}`,
					"warn"
				);
			}
		}

		if (hasField("vms")) {
			const vmInfo = await this._ensureVmInfo();
			if (vmInfo?.fields?.length) {
				try {
					const vmsQuery = `
						query SummaryVms {
							vms {
								${vmInfo.fields.join(" ")}
							}
						}
					`;
					const vmsData = await this._fetchGraphQL(vmsQuery);
					if (Array.isArray(vmsData?.vms)) {
						data.vms = vmsData.vms;
					}
				} catch (error) {
					await this._log(
						`VM list unavailable: ${this._errorMessage(error)}`,
						"warn"
					);
				}
			}
		}

		const dockerContainers = await this._fetchDockerContainers();

		return {
			...data,
			dockerContainers,
		};
	}

	async _fetchDockerContainers() {
		const dockerInfo = await this._ensureDockerInfo();
		if (!dockerInfo || dockerInfo.mode === "none") {
			return null;
		}

		const fields = dockerInfo.containerFields?.join(" ");
		if (!fields) {
			return null;
		}

		const dockerQuery =
			dockerInfo.mode === "dockerContainers"
				? `
					query DockerContainers {
						dockerContainers {
							${fields}
						}
					}
				`
				: `
					query DockerContainers {
						docker {
							${dockerInfo.containerField} {
								${fields}
							}
						}
					}
				`;

		const payload = await this._fetchGraphQLRaw(dockerQuery);
		if (payload?.errors?.length) {
			const message = payload.errors
				.map((item) => item?.message)
				.filter(Boolean)
				.join("; ");
			await this._log(
				`Docker query failed (${message || "unknown error"}). Skipping Docker metrics.`,
				"warn"
			);
			this._dockerInfo = { mode: "none" };
			return null;
		}

		if (dockerInfo.mode === "dockerContainers") {
			return Array.isArray(payload?.data?.dockerContainers)
				? payload.data.dockerContainers
				: null;
		}

		return Array.isArray(payload?.data?.docker?.[dockerInfo.containerField])
			? payload.data.docker[dockerInfo.containerField]
			: null;
	}

	async _ensureDockerInfo() {
		if (this._dockerInfo) {
			return this._dockerInfo;
		}

		const query = `
			query DockerRootIntrospection {
				__schema {
					queryType {
						fields {
							name
							type {
								name
								kind
								ofType {
									name
									kind
									ofType {
										name
										kind
									}
								}
							}
						}
					}
				}
			}
		`;

		const payload = await this._fetchGraphQLRaw(query);
		if (payload?.errors?.length) {
			await this._log(
				"Unable to inspect Docker schema. Skipping Docker metrics.",
				"warn"
			);
			this._dockerInfo = { mode: "none" };
			return this._dockerInfo;
		}

		const fields = payload?.data?.__schema?.queryType?.fields || [];
		const dockerContainersRoot = fields.find(
			(field) => field?.name === "dockerContainers"
		);
		if (dockerContainersRoot) {
			const containerType = this._unwrapType(dockerContainersRoot.type);
			const containerFields = await this._loadContainerFields(
				containerType?.name
			);
			this._dockerInfo = containerFields?.length
				? {
						mode: "dockerContainers",
						containerFields,
				  }
				: { mode: "none" };
			return this._dockerInfo;
		}

		const dockerRoot = fields.find((field) => field?.name === "docker");
		if (!dockerRoot) {
			await this._log(
				"Docker query field not available in this Unraid API schema.",
				"warn"
			);
			this._dockerInfo = { mode: "none" };
			return this._dockerInfo;
		}

		const dockerType = this._unwrapType(dockerRoot.type);
		const dockerFields = await this._loadTypeFields(dockerType?.name);
		const containerField = this._pickContainerField(dockerFields);
		if (!containerField) {
			await this._log(
				"Docker containers field not available in this Unraid API schema.",
				"warn"
			);
			this._dockerInfo = { mode: "none" };
			return this._dockerInfo;
		}

		const containerType = this._unwrapType(containerField.type);
		const containerFields = await this._loadContainerFields(
			containerType?.name
		);

		this._dockerInfo = containerFields?.length
			? {
					mode: "docker",
					containerField: containerField.name,
					containerFields,
			  }
			: { mode: "none" };

		return this._dockerInfo;
	}

	_pickContainerField(fields = []) {
		const containerField = fields.find(
			(field) =>
				field?.name === "containers" ||
				field?.name === "dockerContainers" ||
				(field?.name || "").toLowerCase().includes("container")
		);
		return containerField || null;
	}

	async _loadContainerFields(typeName) {
		const fields = await this._loadTypeFields(typeName);
		if (!fields.length) {
			return [];
		}

		const preferred = [
			"id",
			"name",
			"names",
			"state",
			"status",
			"autoStart",
			"image",
			"uptime",
			"health",
		];

		const scalarFields = fields
			.filter((field) => {
				const type = this._unwrapType(field?.type);
				return type?.kind === "SCALAR" || type?.kind === "ENUM";
			})
			.map((field) => field.name);

		const selected = preferred.filter((name) => scalarFields.includes(name));
		if (selected.length) {
			return selected;
		}

		return scalarFields.slice(0, 4);
	}

	async _loadTypeFields(typeName) {
		if (!typeName) {
			return [];
		}

		const query = `
			query DockerTypeIntrospection($name: String!) {
				__type(name: $name) {
					fields {
						name
						type {
							name
							kind
							ofType {
								name
								kind
								ofType {
									name
									kind
								}
							}
						}
					}
				}
			}
		`;

		const payload = await this._fetchGraphQLRaw(query, { name: typeName });
		if (payload?.errors?.length) {
			return [];
		}
		return payload?.data?.__type?.fields || [];
	}

	_unwrapType(type) {
		let current = type;
		while (current && !current.name && current.ofType) {
			current = current.ofType;
		}
		return current || null;
	}

	async _fetchGraphQL(query, variables) {
		const payload = await this._fetchGraphQLRaw(query, variables);
		if (payload?.errors?.length) {
			const messages = payload.errors
				.map((item) => item?.message)
				.filter(Boolean);
			throw new Error(messages.join("; ") || "GraphQL error");
		}
		return payload?.data;
	}

	async _fetchGraphQLRaw(query, variables) {
		const baseUrl = this._normalizeBaseUrl(this.settings?.baseUrl);
		const apiKey = (this.settings?.apiKey || "").trim();
		if (!baseUrl || !apiKey) {
			throw new Error("Missing Unraid base URL or API key.");
		}

		const url = `${baseUrl}/graphql`;
		const controller = new AbortController();
		const timeout = setTimeout(() => {
			controller.abort();
		}, this._coerceNumber(this.settings?.requestTimeoutMs, DEFAULTS.requestTimeoutMs));

		try {
			const response = await fetch(url, {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-api-key": apiKey,
				},
				body: JSON.stringify({ query, variables }),
				signal: controller.signal,
			});

			if (!response.ok) {
				const message = await this._readResponseText(response);
				throw new Error(
					`HTTP ${response.status} ${response.statusText}: ${message}`
				);
			}

			return await response.json();
		} finally {
			clearTimeout(timeout);
		}
	}

	async _readResponseText(response) {
		try {
			return await response.text();
		} catch (error) {
			return "";
		}
	}

	_errorMessage(error) {
		return error instanceof Error ? error.message : String(error);
	}

	_hasCredentials() {
		const baseUrl = this._normalizeBaseUrl(this.settings?.baseUrl);
		const apiKey = (this.settings?.apiKey || "").trim();
		return Boolean(baseUrl && apiKey);
	}

	_normalizeBaseUrl(value) {
		const trimmed = (value || "").trim();
		if (!trimmed) {
			return "";
		}
		if (/^https?:\/\//i.test(trimmed)) {
			return trimmed.replace(/\/+$/, "");
		}
		return `http://${trimmed}`.replace(/\/+$/, "");
	}

	_coerceNumber(value, fallback) {
		const number = Number(value);
		return Number.isFinite(number) ? number : fallback;
	}

	_toNumber(value) {
		const number = Number(value);
		return Number.isFinite(number) ? number : 0;
	}

	async _setVariable(name, value) {
		if (this._lastVariables.get(name) === value) {
			return;
		}
		this._lastVariables.set(name, value);
		await this.lumia.setVariable(name, value);
	}

	async _updateConnectionState(state) {
		if (this._lastConnectionState === state) {
			return;
		}
		this._lastConnectionState = state;
		await this.lumia.updateConnection(state);
	}

	_tag() {
		return `[${this.manifest?.id ?? "unraid"}]`;
	}

	async _log(message, severity = "info") {
		const prefix = this._tag();
		const decorated =
			severity === "warn"
				? `${prefix} [WARN] ${message}`
				: severity === "error"
				? `${prefix} [ERROR] ${message}`
				: `${prefix} ${message}`;

		await this.lumia.addLog(decorated);
	}

	_schedulePolling() {
		this._clearPolling();
		const intervalSeconds = this._coerceNumber(
			this.settings?.pollInterval,
			DEFAULTS.pollInterval
		);
		if (!intervalSeconds || intervalSeconds <= 0) {
			return;
		}
		this._pollTimer = setInterval(() => {
			this._refresh({ reason: "poll" });
		}, intervalSeconds * 1000);
	}

	_clearPolling() {
		if (this._pollTimer) {
			clearInterval(this._pollTimer);
			this._pollTimer = null;
		}
	}
}

module.exports = UnraidPlugin;

```

## unraid/manifest.json

```
{
	"id": "unraid",
	"name": "Unraid",
	"version": "1.0.0",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://lumiastream.com",
	"repository": "",
	"description": "Pull Unraid array and Docker status into Lumia variables for overlays and automations.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "devices",
	"keywords": "unraid, nas, server, array, docker",
	"config": {
		"settings": [
			{
				"key": "baseUrl",
				"label": "Server Base URL",
				"type": "url",
				"placeholder": "http://tower.local",
				"helperText": "Include the protocol and hostname/IP for your Unraid server.",
				"required": true
			},
			{
				"key": "apiKey",
				"label": "API Key",
				"type": "password",
				"placeholder": "Paste your Unraid API key",
				"helperText": "Create an API key in the Unraid web UI (Settings > Management Access).",
				"required": true
			},
			{
				"key": "pollInterval",
				"label": "Poll Interval (seconds)",
				"type": "number",
				"defaultValue": 30,
				"validation": {
					"min": 10,
					"max": 3600
				}
			},
			{
				"key": "requestTimeoutMs",
				"label": "Request Timeout (ms)",
				"type": "number",
				"defaultValue": 8000,
				"validation": {
					"min": 1000,
					"max": 30000
				}
			},
			{
				"key": "logArrayStateChanges",
				"label": "Log Array State Changes",
				"type": "toggle",
				"defaultValue": true
			}
		],
		"settings_tutorial": "---\n### Connect Unraid\n1) In the Unraid web UI, enable the API and create an API key (Settings > Management Access).\n2) Copy the API key into the **API Key** field.\n3) Enter the base URL for your Unraid server (for example: `http://tower.local` or `http://192.168.1.10`).\n---\n### Alerts\n- Base alerts are disabled by default using defaults.disableBaseAlert. Configure alert variations in Lumia to enable notifications.\n- For threshold-style alerts, use GREATER_NUMBER variations and set your percentage/temperature.\n---\n### Notes\n- The plugin uses the Unraid GraphQL endpoint at `/graphql`.\n- If you use HTTPS with a self-signed certificate, the request may fail unless your environment trusts it.\n---",
		"actions_tutorial": "---\n### Refresh Now\nUse **Refresh Status** to pull the latest Unraid data immediately.\n---",
		"actions": [
			{
				"type": "unraid_refresh",
				"label": "Refresh Status",
				"description": "Fetch the latest Unraid summary data.",
				"fields": []
			},
			{
				"type": "unraid_docker_action",
				"label": "Docker Action",
				"description": "Start or stop a Docker container.",
				"fields": [
					{
						"key": "operation",
						"label": "Operation",
						"type": "select",
						"options": [
							{ "label": "Start", "value": "start" },
							{ "label": "Stop", "value": "stop" }
						],
						"required": true
					},
					{
						"key": "id",
						"label": "Container ID",
						"type": "text",
						"placeholder": "PrefixedID (optional)"
					},
					{
						"key": "name",
						"label": "Container Name",
						"type": "text",
						"placeholder": "Container name (optional)"
					}
				]
			},
			{
				"type": "unraid_vm_action",
				"label": "VM Action",
				"description": "Start, stop, or control a VM.",
				"fields": [
					{
						"key": "operation",
						"label": "Operation",
						"type": "select",
						"options": [
							{ "label": "Start", "value": "start" },
							{ "label": "Stop", "value": "stop" },
							{ "label": "Pause", "value": "pause" },
							{ "label": "Resume", "value": "resume" },
							{ "label": "Force Stop", "value": "forceStop" },
							{ "label": "Reboot", "value": "reboot" },
							{ "label": "Reset", "value": "reset" }
						],
						"required": true
					},
					{
						"key": "id",
						"label": "VM ID",
						"type": "text",
						"placeholder": "PrefixedID (optional)"
					},
					{
						"key": "name",
						"label": "VM Name",
						"type": "text",
						"placeholder": "VM name (optional)"
					}
				]
			},
			{
				"type": "unraid_parity_action",
				"label": "Parity Check",
				"description": "Start, pause, resume, or cancel a parity check.",
				"fields": [
					{
						"key": "operation",
						"label": "Operation",
						"type": "select",
						"options": [
							{ "label": "Start", "value": "start" },
							{ "label": "Pause", "value": "pause" },
							{ "label": "Resume", "value": "resume" },
							{ "label": "Cancel", "value": "cancel" }
						],
						"required": true
					},
					{
						"key": "correct",
						"label": "Correct Errors (start only)",
						"type": "toggle",
						"defaultValue": false
					}
				]
			},
			{
				"type": "unraid_array_state",
				"label": "Set Array State",
				"description": "Start or stop the array.",
				"fields": [
					{
						"key": "desiredState",
						"label": "Desired State",
						"type": "select",
						"allowTyping": true,
						"options": [
							{ "label": "STARTED", "value": "STARTED" },
							{ "label": "STOPPED", "value": "STOPPED" }
						],
						"required": true
					}
				]
			},
			{
				"type": "unraid_notify",
				"label": "Send Unraid Notification",
				"description": "Create a notification in Unraid.",
				"fields": [
					{
						"key": "title",
						"label": "Title",
						"type": "text",
						"required": true
					},
					{
						"key": "subject",
						"label": "Subject",
						"type": "text",
						"required": true
					},
					{
						"key": "description",
						"label": "Description",
						"type": "textarea",
						"required": true
					},
					{
						"key": "importance",
						"label": "Importance",
						"type": "select",
						"options": [
							{ "label": "ALERT", "value": "ALERT" },
							{ "label": "WARNING", "value": "WARNING" },
							{ "label": "INFO", "value": "INFO" }
						],
						"required": true
					},
					{
						"key": "link",
						"label": "Link (optional)",
						"type": "url"
					}
				]
			}
		],
		"variables": [
			{
				"name": "unraid_array_state",
				"description": "Current array state (e.g., STARTED, STOPPED).",
				"value": ""
			},
			{
				"name": "unraid_array_total_bytes",
				"description": "Total array capacity (bytes).",
				"value": 0
			},
			{
				"name": "unraid_array_used_bytes",
				"description": "Used array capacity (bytes).",
				"value": 0
			},
			{
				"name": "unraid_array_free_bytes",
				"description": "Free array capacity (bytes).",
				"value": 0
			},
			{
				"name": "unraid_disk_count",
				"description": "Number of disks reported in the array.",
				"value": 0
			},
			{
				"name": "unraid_disk_total_count",
				"description": "Total number of disks in the system.",
				"value": 0
			},
			{
				"name": "unraid_disk_temp_max_c",
				"description": "Maximum disk temperature in Celsius.",
				"value": 0
			},
			{
				"name": "unraid_disk_temp_avg_c",
				"description": "Average disk temperature in Celsius.",
				"value": 0
			},
			{
				"name": "unraid_disk_smart_unknown_count",
				"description": "Disks with SMART status other than OK.",
				"value": 0
			},
			{
				"name": "unraid_disk_spinning_count",
				"description": "Disks currently spinning.",
				"value": 0
			},
			{
				"name": "unraid_disks_json",
				"description": "JSON array of disk summary data (name, device, vendor, size, smartStatus, temperature, isSpinning).",
				"value": ""
			},
			{
				"name": "unraid_docker_total",
				"description": "Total Docker containers.",
				"value": 0
			},
			{
				"name": "unraid_docker_running",
				"description": "Running Docker containers.",
				"value": 0
			},
			{
				"name": "unraid_docker_stopped",
				"description": "Stopped Docker containers.",
				"value": 0
			},
			{
				"name": "unraid_docker_stopped_names",
				"description": "Comma-separated names of stopped Docker containers.",
				"value": ""
			},
			{
				"name": "unraid_os_release",
				"description": "Unraid OS release string.",
				"value": ""
			},
			{
				"name": "unraid_os_uptime",
				"description": "Unraid OS uptime (seconds, if reported).",
				"value": 0
			},
			{
				"name": "unraid_cpu_brand",
				"description": "CPU brand/model string.",
				"value": ""
			},
			{
				"name": "unraid_cpu_percent",
				"description": "CPU utilization percent.",
				"value": 0
			},
			{
				"name": "unraid_mem_percent",
				"description": "Memory utilization percent.",
				"value": 0
			},
			{
				"name": "unraid_mem_total_bytes",
				"description": "Total system memory (bytes).",
				"value": 0
			},
			{
				"name": "unraid_mem_used_bytes",
				"description": "Used system memory (bytes).",
				"value": 0
			},
			{
				"name": "unraid_mem_free_bytes",
				"description": "Free system memory (bytes).",
				"value": 0
			},
			{
				"name": "unraid_mem_available_bytes",
				"description": "Available system memory (bytes).",
				"value": 0
			},
			{
				"name": "unraid_swap_percent",
				"description": "Swap utilization percent.",
				"value": 0
			},
			{
				"name": "unraid_swap_total_bytes",
				"description": "Total swap memory (bytes).",
				"value": 0
			},
			{
				"name": "unraid_swap_used_bytes",
				"description": "Used swap memory (bytes).",
				"value": 0
			},
			{
				"name": "unraid_swap_free_bytes",
				"description": "Free swap memory (bytes).",
				"value": 0
			},
			{
				"name": "unraid_last_updated",
				"description": "ISO timestamp for the last refresh.",
				"value": ""
			}
		],
		"alerts": [
			{
				"title": "High CPU Usage",
				"key": "unraid_cpu_high",
				"acceptedVariables": ["unraid_cpu_percent"],
				"defaultMessage": "",
				"defaults": {
					"disableBaseAlert": true
				},
				"variationConditions": [
					{
						"type": "GREATER_NUMBER",
						"description": "Trigger when CPU percent is greater than the configured threshold."
					}
				]
			},
			{
				"title": "High Memory Usage",
				"key": "unraid_mem_high",
				"acceptedVariables": [
					"unraid_mem_percent",
					"unraid_mem_used_bytes",
					"unraid_mem_total_bytes"
				],
				"defaultMessage": "",
				"defaults": {
					"disableBaseAlert": true
				},
				"variationConditions": [
					{
						"type": "GREATER_NUMBER",
						"description": "Trigger when memory percent is greater than the configured threshold."
					}
				]
			},
			{
				"title": "High Disk Temperature",
				"key": "unraid_disk_temp_high",
				"acceptedVariables": [
					"unraid_disk_temp_max_c",
					"unraid_disk_temp_avg_c",
					"unraid_disks_json"
				],
				"defaultMessage": "",
				"defaults": {
					"disableBaseAlert": true
				},
				"variationConditions": [
					{
						"type": "GREATER_NUMBER",
						"description": "Trigger when disk temperature exceeds the configured threshold."
					}
				]
			},
			{
				"title": "Disk SMART Warning",
				"key": "unraid_disk_smart",
				"acceptedVariables": [
					"unraid_disk_smart_unknown_count",
					"unraid_disks_json"
				],
				"defaultMessage": "",
				"defaults": {
					"disableBaseAlert": true
				},
				"variationConditions": [
					{
						"type": "GREATER_NUMBER",
						"description": "Trigger when SMART warnings are greater than the configured threshold."
					}
				]
			},
			{
				"title": "Docker Containers Stopped",
				"key": "unraid_docker_stopped",
				"acceptedVariables": [
					"unraid_docker_stopped",
					"unraid_docker_stopped_names",
					"unraid_docker_total"
				],
				"defaultMessage": "",
				"defaults": {
					"disableBaseAlert": true
				},
				"variationConditions": [
					{
						"type": "GREATER_NUMBER",
						"description": "Trigger when stopped containers exceed the configured threshold."
					}
				]
			},
			{
				"title": "Array State Changed",
				"key": "unraid_array_state_change",
				"acceptedVariables": ["unraid_array_state"],
				"defaultMessage": "",
				"defaults": {
					"disableBaseAlert": true
				},
				"variationConditions": [
					{
						"type": "EQUAL_SELECTION",
						"description": "Trigger when the array state matches the selected value.",
						"selections": [
							{ "label": "STARTED", "value": "STARTED" },
							{ "label": "STOPPED", "value": "STOPPED" },
							{ "label": "PAUSED", "value": "PAUSED" },
							{ "label": "ERROR", "value": "ERROR" },
							{ "label": "UNKNOWN", "value": "UNKNOWN" }
						]
					}
				]
			}
		]
	}
}

```

## unraid/package.json

```
{
	"name": "lumia-unraid-integration",
	"version": "1.0.0",
	"private": true,
	"description": "Unraid integration example plugin for Lumia Stream.",
	"main": "main.js",
	"dependencies": {
		"@lumiastream/plugin": "^0.1.18"
	}
}

```
