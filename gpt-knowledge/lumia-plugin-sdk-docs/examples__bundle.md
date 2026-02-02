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
