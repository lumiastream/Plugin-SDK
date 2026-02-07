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

	async actions(config = {}) {
		const actions = Array.isArray(config.actions) ? config.actions : [];
		for (const action of actions) {
			if (action?.type === "trigger_alert") {
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
			await this.lumia.addLog(
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
	"version": "1.0.0",
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
		"settings_tutorial": "---\n### Setup\n1) Enter a default message and color.\n2) Adjust the default duration if you want a longer or shorter alert.\n3) Click Save to store the defaults.\n---\n### What this plugin does\n- Stores the message, username, color, and duration in variables.\n- Uses those values when triggering the sample alert.\n---",
		"actions_tutorial": "---\n### Trigger Sample Alert\nUse this action to fire the sample alert. You can override the message, username, color, and duration per action. The alert uses both dynamic and extraSettings so variations and templates have the same data.\n---",
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
							{ "label": "Blue", "value": "#00c2ff" },
							{ "label": "Red", "value": "#ff5f5f" }
						]
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
	"description": "Internal template illustrating settings, actions, variables, and alerts for Lumia Stream plugins.",
	"main": "main.js",
	"dependencies": {
		"@lumiastream/plugin": "^0.2.9"
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
			const params = action?.value ?? {};

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
	"version": "1.0.1",
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
		"settings_tutorial": "---\n### \ud83c\udfa8 Setup Your Divoom Pixoo\n\n1. **Find Your Pixoo's IP Address**:\n   - Use your router's device list\n   - Or use the Divoom app \u2192 Device Settings\n   - Example: `192.168.1.42`\n\n2. **Set Static IP (Recommended)**:\n   - Reserve IP in your router's DHCP settings\n   - Prevents IP from changing\n\n3. **Enter Settings**:\n   - IP Address (required)\n   - Port: 80 (default)\n   - Screen size: 64x64 (or 16x16 for Pixoo 16)\n\n4. **Click Save** to store the settings.\n---",
		"actions_tutorial": "---\n### \ud83d\udd27 Available Commands\n\n**Basic Control**:\n- Set Brightness - Adjust display brightness (0-100)\n- Set Channel - Switch to clock/visualizer/scene\n- Screen On/Off - Power screen on or off\n- Reset Display - Clear and reset to default\n\n**Display Content**:\n- Send Scrolling Text - Display text messages\n- Clear Screen - Clear all content\n- Display Image - Show image from URL\n- Play GIF - Play animated GIF from URL\n\n**Drawing**:\n- Draw Pixel - Draw individual pixels\n- Draw Rectangle - Draw colored rectangles\n\n**Sound**:\n- Play Buzzer - Play buzzer sound\n\n**Advanced**:\n- Send Raw Command - Send custom API commands\n\n---\n### \ud83d\udca1 Tips\n- Commands are rate-limited to 1 per second (prevents crashes)\n- Connection auto-refreshes every 250 commands\n---",
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
		"@lumiastream/plugin": "^0.2.9"
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
				const actionData = action?.value ?? {};
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
		"@lumiastream/plugin": "^0.2.9"
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
	date: "date",
	steps: "steps",
	distance: "distance",
	calories: "calories",
	restingHeartRate: "resting_heart_rate",
	durationSecs: "activity_duration_secs",
	durationMin: "activity_duration_min",
	cadence: "cadence",
	pace: "pace",
	paceSource: "pace_source",
	latestActivityName: "latest_activity_name",
	latestActivityStart: "latest_activity_start",
	lastUpdated: "last_updated",
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
		this._failureCount = 0;
		this._backoffMultiplier = 1;
		this._offline = false;
	}

	async onload() {
		await this._primeVariables();

		if (!this._hasAuthTokens()) {
			await this.lumia.addLog(
				"Fitbit access tokens not set. Use the OAuth button in the plugin settings to authorize.",
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
	}

	async onsettingsupdate(settings, previous = {}) {
		const authChanged =
			(settings?.accessToken ?? "") !== (previous?.accessToken ?? "") ||
			(settings?.refreshToken ?? "") !== (previous?.refreshToken ?? "");

		const pollChanged =
			this._coerceNumber(settings?.pollInterval, DEFAULTS.pollInterval) !==
			this._coerceNumber(previous?.pollInterval, DEFAULTS.pollInterval);

		if (pollChanged || authChanged) {
			this._offline = false;
			this._failureCount = 0;
			this._backoffMultiplier = 1;
			this._schedulePolling();
		}

		if (authChanged) {
			if (!this._hasAuthTokens()) {
				await this._updateConnectionState(false);
				return;
			}
		}

		if (authChanged) {
			await this._refreshMetrics({ reason: "settings-update" });
		}
	}

	async validateAuth() {
		if (!this._hasAuthTokens()) {
			await this.lumia.addLog("Validation failed: missing Fitbit tokens.");
			return false;
		}

		try {
			const today = this._formatDate(new Date());
			await Promise.all([
				this._fetchIntradayResource("steps", today),
				this._fetchHeartRateIntraday(today),
			]);
			return true;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			await this.lumia.addLog(`Fitbit validation failed: ${message}`);
			return false;
		}
	}

	async _refreshMetrics({ reason } = {}) {
		if (!this._hasAuthTokens()) {
			await this._updateConnectionState(false);
			return;
		}
		if (this._offline) {
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
							await this.lumia.addLog(
								`Steps data unavailable: ${this._errorMessage(error)}`,
							);
							return null;
						},
					),
					this._fetchHeartRateIntraday(date, token).catch(async (error) => {
						await this.lumia.addLog(
							`Heart rate data unavailable: ${this._errorMessage(error)}`,
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
								await this.lumia.addLog(
									`Distance data unavailable: ${this._errorMessage(error)}`,
								);
								return null;
							},
						),
						this._fetchIntradayResource("calories", date, token).catch(
							async (error) => {
								await this.lumia.addLog(
									`Calories data unavailable: ${this._errorMessage(error)}`,
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
				this._failureCount = 0;
				this._backoffMultiplier = 1;
				await this._updateConnectionState(true);
			} catch (error) {
				const message = this._errorMessage(error);
				this._failureCount += 1;
				if (this._failureCount >= 3) {
					this._offline = true;
					this._clearPolling();
				} else {
					this._backoffMultiplier = Math.min(8, 2 ** this._failureCount);
					this._schedulePolling();
				}
				await this.lumia.addLog(`Failed to refresh Fitbit data: ${message}`);
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
		const latestName = this._coerceString(metrics?.activityName, "");
		const latestStart = this._coerceString(metrics?.activityStart, "");

		const updates = [
			{ name: VARIABLE_NAMES.date, value: resolvedDate },
			{ name: VARIABLE_NAMES.steps, value: steps },
			{ name: VARIABLE_NAMES.distance, value: distance },
			{ name: VARIABLE_NAMES.calories, value: calories },
			{ name: VARIABLE_NAMES.restingHeartRate, value: resolvedHeartRate },
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
		const latestHeartRate = this._selectHeartRate({
			dataset: heartIntraday.dataset,
			endMinute: null,
		});

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
			return this._inactiveMetrics(date, { heartRate: latestHeartRate });
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
			activityName,
			activityStart,
		};
	}

	_inactiveMetrics(date, { heartRate = 0 } = {}) {
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
			heartRate,
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

		if (this._offline) {
			return;
		}

		const baseInterval = this._pollInterval();
		if (!this._hasAuthTokens() || baseInterval <= 0) {
			return;
		}

		const intervalSeconds = Math.min(
			Math.max(Math.round(baseInterval * this._backoffMultiplier), 30),
			1800,
		);
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
				await this.lumia.addLog(
					`Failed to update connection state: ${message}`,
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
  "version": "1.0.6",
  "author": "Lumia Stream",
  "email": "dev@lumiastream.com",
  "website": "https://lumiastream.com",
  "repository": "",
  "description": "Fetch Fitbit intraday activity metrics into Lumia variables and alerts.",
  "license": "MIT",
  "lumiaVersion": "^9.0.0",
  "category": "apps",
  "keywords": "fitbit, fitness, activity, steps, heartrate",
  "icon": "fitbit.jpg",
  "config": {
    "oauth": {
      "buttonLabel": "Authorize Fitbit",
      "helperText": "Connect your Fitbit account to pull current activity metrics (intraday access required for server apps).",
      "openInBrowser": true,
      "scopes": [
        "activity",
        "heartrate",
        "profile",
        "settings"
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
      }
    ],
    "settings_tutorial": "---\n### Authorize This Plugin\n1) Click **Authorize Fitbit** in the OAuth section.\n2) Complete the login and grant access.\n---\n### Notes\n- Metrics reflect your current active session using intraday time series.\n- Server apps need Fitbit intraday access enabled.\n- Distance and pace use Fitbit's user unit settings.\n---",
    "actions_tutorial": "---\n### Actions\nThis plugin refreshes metrics automatically after OAuth and on the poll interval. There are no actions to run.\n---",
    "actions": [],
    "variables": [
      {
        "name": "date",
        "description": "Date of the current session (YYYY-MM-DD).",
        "value": ""
      },
      {
        "name": "steps",
        "description": "Steps in the current active session.",
        "value": 0
      },
      {
        "name": "distance",
        "description": "Distance in the current active session (Fitbit user units).",
        "value": 0
      },
      {
        "name": "calories",
        "description": "Calories burned in the current active session.",
        "value": 0
      },
      {
        "name": "resting_heart_rate",
        "description": "Current heart rate (latest intraday reading).",
        "value": 0
      },
      {
        "name": "activity_duration_secs",
        "description": "Active duration (seconds) for the current session.",
        "value": 0
      },
      {
        "name": "activity_duration_min",
        "description": "Active duration (minutes) for the current session.",
        "value": 0
      },
      {
        "name": "cadence",
        "description": "Cadence for the current active session (steps per minute).",
        "value": 0
      },
      {
        "name": "pace",
        "description": "Pace computed from the current active session (minutes per distance unit).",
        "value": 0
      },
      {
        "name": "pace_source",
        "description": "Source for pace: computed or none.",
        "value": ""
      },
      {
        "name": "latest_activity_name",
        "description": "Label for the current active session.",
        "value": ""
      },
      {
        "name": "latest_activity_start",
        "description": "Start time of the current active session.",
        "value": ""
      },
      {
        "name": "last_updated",
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
	"name": "lumia_plugin-fitbit",
	"version": "1.0.0",
	"private": true,
	"description": "Lumia Stream plugin that pulls Fitbit activity and heart-rate metrics.",
	"main": "main.js",
	"scripts": {},
	"dependencies": {
		"@lumiastream/plugin": "^0.2.9"
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
  title: "latest_title",
  description: "latest_description",
  url: "latest_url",
  source: "latest_source",
  image: "latest_image",
  published: "latest_published",
  count: "article_count",
  collection: "recent_articles",
  keyword: "keyword",
  lastUpdated: "last_updated",
};

class HotNewsPlugin extends Plugin {
  constructor(manifest, context) {
    super(manifest, context);
    this._pollTimer = null;
    this._seenUrls = new Set();
    this._seenQueue = [];
    this._lastConnectionState = null;
    this._failureCount = 0;
    this._backoffMultiplier = 1;
    this._offline = false;
  }

  async onload() {
    if (!this._apiKey()) {
      await this.lumia.addLog(
        "NewsAPI key not configured. Add your key in the plugin settings to start polling headlines."
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
      await this.lumia.addLog(
        "NewsAPI key cleared from settings; pausing headline polling."
      );
      this._clearPolling();
      await this._updateConnectionState(false);
      return;
    }

    if (pollChanged || apiKeyChanged) {
      this._offline = false;
      this._failureCount = 0;
      this._backoffMultiplier = 1;
      this._schedulePolling();
    }

    if (filterChanged || apiKeyChanged) {
      this._seenUrls.clear();
      this._seenQueue = [];
      await this._refreshHeadlines({ reason: "settings-update" });
    }
  }



  async validateAuth(data = {}) {
    const apiKey =
      typeof data?.apiKey === "string" && data.apiKey.trim().length
        ? data.apiKey.trim()
        : this._apiKey();

    if (!apiKey) {
      await this.lumia.addLog("Validation failed: NewsAPI key is required.");
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
        return true;
      }

      await this.lumia.addLog(
        "Validation failed: unexpected response from NewsAPI."
      );
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.lumia.addLog(`NewsAPI validation failed: ${message}`);
      return false;
    }
  }

  async _refreshHeadlines(options = {}) {
    if (!this._apiKey()) {
      return;
    }
    if (this._offline) {
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

      this._failureCount = 0;
      this._backoffMultiplier = 1;
      await this._updateConnectionState(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this._failureCount += 1;
      if (this._failureCount >= 3) {
        this._offline = true;
        this._clearPolling();
      } else {
        this._backoffMultiplier = Math.min(8, 2 ** this._failureCount);
        this._schedulePolling();
      }
      await this.lumia.addLog(`Failed to refresh headlines: ${message}`);
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
  }

  async _triggerNewHeadlineAlert(article, keyword) {
    try {
      const alertVars = {
        latest_title: article.title ?? "",
        latest_source: article.source?.name ?? "",
        latest_url: article.url ?? "",
        latest_published: article.publishedAt ?? "",
        keyword: keyword ?? "",
      };

      await this.lumia.triggerAlert({
        alert: "hotnews_new_headline",
        dynamic: { ...alertVars },
        extraSettings: { ...alertVars },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.lumia.addLog(`Failed to trigger headline alert: ${message}`);
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

    if (this._offline) {
      return;
    }

    const baseInterval = this._pollInterval();
    if (!this._apiKey() || baseInterval <= 0) {
      return;
    }

    const intervalSeconds = Math.min(
      Math.max(Math.round(baseInterval * this._backoffMultiplier), 60),
      3600
    );
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
        await this.lumia.addLog(
          `Failed to update connection state: ${message}`
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
      await this.lumia.addLog(`Failed to set variable ${name}: ${message}`);
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
  "description": "Poll NewsAPI for topic headlines, store latest articles in variables, and trigger alerts.",
  "license": "MIT",
  "lumiaVersion": "^9.0.0",
  "category": "utilities",
  "keywords": "news, headlines, newsapi, breaking, alerts",
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
          {
            "label": "Argentina",
            "value": "ar"
          },
          {
            "label": "Australia",
            "value": "au"
          },
          {
            "label": "Austria",
            "value": "at"
          },
          {
            "label": "Algeria",
            "value": "dz"
          },
          {
            "label": "Belgium",
            "value": "be"
          },
          {
            "label": "Brazil",
            "value": "br"
          },
          {
            "label": "Bulgaria",
            "value": "bg"
          },
          {
            "label": "Canada",
            "value": "ca"
          },
          {
            "label": "China",
            "value": "cn"
          },
          {
            "label": "Colombia",
            "value": "co"
          },
          {
            "label": "Czechia",
            "value": "cz"
          },
          {
            "label": "Egypt",
            "value": "eg"
          },
          {
            "label": "France",
            "value": "fr"
          },
          {
            "label": "Germany",
            "value": "de"
          },
          {
            "label": "Greece",
            "value": "gr"
          },
          {
            "label": "Hong Kong",
            "value": "hk"
          },
          {
            "label": "Hungary",
            "value": "hu"
          },
          {
            "label": "India",
            "value": "in"
          },
          {
            "label": "Indonesia",
            "value": "id"
          },
          {
            "label": "Ireland",
            "value": "ie"
          },
          {
            "label": "Italy",
            "value": "it"
          },
          {
            "label": "Japan",
            "value": "jp"
          },
          {
            "label": "Latvia",
            "value": "lv"
          },
          {
            "label": "Lithuania",
            "value": "lt"
          },
          {
            "label": "Malaysia",
            "value": "my"
          },
          {
            "label": "Mexico",
            "value": "mx"
          },
          {
            "label": "Morocco",
            "value": "ma"
          },
          {
            "label": "Netherlands",
            "value": "nl"
          },
          {
            "label": "New Zealand",
            "value": "nz"
          },
          {
            "label": "Nigeria",
            "value": "ng"
          },
          {
            "label": "Norway",
            "value": "no"
          },
          {
            "label": "Philippines",
            "value": "ph"
          },
          {
            "label": "Poland",
            "value": "pl"
          },
          {
            "label": "Portugal",
            "value": "pt"
          },
          {
            "label": "Romania",
            "value": "ro"
          },
          {
            "label": "Russia",
            "value": "ru"
          },
          {
            "label": "Saudi Arabia",
            "value": "sa"
          },
          {
            "label": "Serbia",
            "value": "rs"
          },
          {
            "label": "Singapore",
            "value": "sg"
          },
          {
            "label": "Slovakia",
            "value": "sk"
          },
          {
            "label": "Slovenia",
            "value": "si"
          },
          {
            "label": "South Africa",
            "value": "za"
          },
          {
            "label": "South Korea",
            "value": "kr"
          },
          {
            "label": "Sweden",
            "value": "se"
          },
          {
            "label": "Switzerland",
            "value": "ch"
          },
          {
            "label": "Taiwan",
            "value": "tw"
          },
          {
            "label": "Thailand",
            "value": "th"
          },
          {
            "label": "Turkey",
            "value": "tr"
          },
          {
            "label": "Ukraine",
            "value": "ua"
          },
          {
            "label": "United Arab Emirates",
            "value": "ae"
          },
          {
            "label": "United Kingdom",
            "value": "gb"
          },
          {
            "label": "United States",
            "value": "us"
          },
          {
            "label": "Venezuela",
            "value": "ve"
          }
        ],
        "helperText": "Restrict headlines to a specific country (defaults to US)."
      },
      {
        "key": "category",
        "label": "Category",
        "type": "select",
        "defaultValue": "",
        "options": [
          {
            "label": "Any",
            "value": ""
          },
          {
            "label": "Business",
            "value": "business"
          },
          {
            "label": "Entertainment",
            "value": "entertainment"
          },
          {
            "label": "General",
            "value": "general"
          },
          {
            "label": "Health",
            "value": "health"
          },
          {
            "label": "Science",
            "value": "science"
          },
          {
            "label": "Sports",
            "value": "sports"
          },
          {
            "label": "Technology",
            "value": "technology"
          }
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
    "settings_tutorial": "---\n### \ud83d\udd11 Get Your API Key\n1) Sign up at https://newsapi.org/ and copy your API key into the NewsAPI Key field.\n---\n### \u2699\ufe0f Choose Coverage\nPick a country, optional category, and keyword filter to focus on the stories you care about.\n---\n### \u23f1\ufe0f Set Poll Interval\nAdjust how often the plugin checks NewsAPI (defaults to every 5 minutes).\n---\n### \ud83d\udea8 Enable Alerts\nLeave alerts enabled to have Lumia announce fresh headlines as they arrive.\n---",
    "actions": [],
    "alerts": [
      {
        "title": "New Headline",
        "key": "hotnews_new_headline",
        "defaultMessage": "\ud83d\udd25 {{latest_title}} ({{latest_source}})",
        "acceptedVariables": [
          "latest_title",
          "latest_source",
          "latest_url",
          "latest_published",
          "keyword"
        ]
      }
    ],
    "variables": [
      {
        "name": "latest_title",
        "description": "Headline from the most recent article.",
        "value": ""
      },
      {
        "name": "latest_description",
        "description": "Summary of the most recent article.",
        "value": ""
      },
      {
        "name": "latest_url",
        "description": "Direct link to the latest article.",
        "value": ""
      },
      {
        "name": "latest_source",
        "description": "Source/publisher of the latest article.",
        "value": ""
      },
      {
        "name": "latest_image",
        "description": "URL to the lead image for the latest article.",
        "value": ""
      },
      {
        "name": "latest_published",
        "description": "ISO timestamp of when the latest article was published.",
        "value": ""
      },
      {
        "name": "article_count",
        "description": "Number of articles returned in the latest refresh.",
        "value": 0
      },
      {
        "name": "recent_articles",
        "description": "JSON payload containing the most recent headlines.",
        "value": ""
      },
      {
        "name": "keyword",
        "description": "Keyword used for the latest refresh.",
        "value": ""
      },
      {
        "name": "last_updated",
        "description": "ISO timestamp of the last successful NewsAPI sync.",
        "value": ""
      }
    ],
    "actions_tutorial": "---\n### Actions\nThis plugin runs on a poll interval and does not expose actions. Update settings to change coverage or refresh timing.\n---"
  }
}
```

## hot_news/package.json

```
{
	"name": "lumia_plugin-hot-news",
	"version": "1.0.0",
	"private": true,
	"description": "Lumia Stream plugin that polls NewsAPI.org for the latest headlines and mirrors them into Lumia variables.",
	"main": "main.js",
	"scripts": {},
	"dependencies": {
		"@lumiastream/plugin": "^0.2.9"
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
		if (this.settings?.serverHost) {
			await this.startPolling();
		} else if (!this.settings?.serverHost) {
			await this.lumia.addLog(
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
			await this.lumia.addLog(
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
			await this.lumia.addLog(
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
					await this.lumia.addLog(
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
  "version": "1.0.0",
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
    "settings_tutorial": "---\n### \ud83c\udfae Setup Your Minecraft Server Monitoring\n1) Enter your server address (hostname or IP)\n2) Enter server port (default: 25565)\n3) **Enable Query protocol (required for player tracking)**\n   - Set `enable-query=true` in server.properties\n   - Ensure `query.port` matches the Query Port setting\n   - Enables player list, join/leave alerts, map, and game type\n4) Set poll interval (how often to check)\n5) Click **Save** to start monitoring\n### \ud83d\udcca What Gets Tracked\n- Server online/offline status\n- Current player count\n- Maximum players\n- Server version\n- MOTD (Message of the Day)\n- Player list (Query required)\n---",
    "actions_tutorial": "---\n### Actions\nThis plugin runs on the poll interval and does not expose actions.\n---",
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
				"@lumiastream/plugin": "^0.2.4"
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
		"@lumiastream/plugin": "^0.2.9"
	}
}

```

## mock_lights_plugin/main.js

```
const { Plugin } = require("@lumiastream/plugin");

const DEFAULT_LIGHTS = [
	{ id: "mock-1", name: "Mock Panel A", ip: "10.0.0.11" },
	{ id: "mock-2", name: "Mock Strip B", ip: "10.0.0.12" },
];

class MockLightsPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._lights = [...DEFAULT_LIGHTS];
		this._idCounter = DEFAULT_LIGHTS.length + 1;
	}

	async onload() {
		await this.lumia.updateConnection(true);
	}

	async onunload() {
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
		const ids = Array.isArray(config.lights)
			? config.lights.map((l) => l?.id || l).join(", ")
			: "unknown";
		const color = config.color
			? `rgb(${config.color.r},${config.color.g},${config.color.b})`
			: "no color";
		const brightness =
			typeof config.brightness === "number"
				? `${config.brightness}%`
				: "unchanged";
		const power =
			typeof config.power === "boolean"
				? config.power
					? "on"
					: "off"
				: "unchanged";

		await this._log(
			`onLightChange -> brand=${config.brand} lights=[${ids}] color=${color} brightness=${brightness} power=${power}`,
		);
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

	async _log(message, severity = "info") {
		if (severity !== "error") {
			return;
		}
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
  "description": "Mock light provider that simulates lights for testing Lumia device actions.",
  "license": "MIT",
  "lumiaVersion": "^9.0.0",
  "category": "lights",
  "keywords": "mock, lights, testing, sample, debug",
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
    "@lumiastream/plugin": "^0.2.9"
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

function buildAlertPayload(vars, dynamicOverrides = {}) {
	return {
		dynamic: { ...vars, ...dynamicOverrides },
		extraSettings: { ...vars },
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
		this.failureCount = 0;
		this.backoffMultiplier = 1;
		this.offline = false;
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
			Math.max(Math.round(normalizedInterval * this.backoffMultiplier), MIN_POLL_INTERVAL),
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

		await this.lumia.updateConnection(false);
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
			await this.lumia.updateConnection(true);
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
			await this.lumia.addLog(`[Rumble] Error polling API: ${message}`);
			await this.lumia.updateConnection(false);
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
		setIfChanged("last_polled", nowIso, previousState?.lastPolledIso);

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
				name: state.title,
				value: this.streamCounter,
			}),
		});
	}

	// Stream has gone offline: summarise the session and clean up session state.
	async handleStreamEnd(state) {
		const alertVars = buildAlertVariables(state);
		await this.lumia.triggerAlert({
			alert: ALERT_TYPES.STREAM_END,
			...buildAlertPayload(alertVars, {
				value: state.viewers,
				total: this.streamCounter,
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
				value: delta,
				total: state.followers,
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
				value: delta,
				total: state.likes,
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
				value: delta,
				total: state.dislikes,
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
				value: delta,
				total: state.subs,
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
				value: delta,
				total: state.subGifts,
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
				value: roundToTwo(amountDelta > 0 ? amountDelta : countDelta),
				total: roundToTwo(state.rantAmount),
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
  "name": "Rumble",
  "version": "1.0.0",
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
        "defaultValue": 30,
        "helperText": "How often to check for stream updates (10-300 seconds)"
      }
    ],
    "settings_tutorial": "---\n### \ud83d\udd11 Get Your Rumble Livestream API URL\n1) Open https://rumble.com/account/livestream-api while logged in.\n2) Copy the full Livestream API URL shown on that page.\n3) Paste it into the **API Key** field in Lumia (the plugin will extract the `key` automatically).\n---\n### \u2705 Verify Access\nClick **Save** to start syncing data.\n---\n### \u23f1\ufe0f Adjust Polling\nSet a poll interval that balances freshness with API limits (10\u2013300 seconds).\n---",
    "actions_tutorial": "---\n### Actions\nThis plugin runs automatically on the poll interval and does not expose actions.\n---",
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
      },
      {
        "name": "last_polled",
        "description": "Timestamp (ISO 8601) of the most recent Rumble API poll",
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
		"@lumiastream/plugin": "^0.2.9"
	}
}

```
