# Lumia Plugin Examples: Devices, Feeds And Monitors

Use these examples for: LAN devices, notification and RSS feeds, system stats, and scheduled alerts; persisted state and long-running subscriptions.

## Index

| Example | What it does | Shows | Field types |
| --- | --- | --- | --- |
| `divoom_pixoo` (Divoom Pixoo) | Send text, GIFs, drawings, and device controls to Divoom Pixoo LED displays over Wi-Fi. | actions, settings tutorial, actions tutorial | color, number, select, text, textarea |
| `mawakit` (Mawakit) | Prayer time alerts, Hijri date variables, and Ramadan reminders based on your location. | variable functions, alerts, variables, translations, settings tutorial | number, select, text, toggle |
| `ntfy` (ntfy) | Subscribe to ntfy topics and trigger Lumia alerts/variables for incoming notifications. | alerts, translations, settings tutorial, actions tutorial | checkbox, number, password, select, text, url |
| `rss_feed_monitor` (RSS Feed Monitor) | Monitor multiple RSS or Atom feeds, persist unseen items, and trigger Lumia alerts for each new entry even after Lumia has been offline. | alerts, settings tutorial, actions tutorial | named_map, number |
| `system_monitor` (System Monitor) | Monitor CPU, RAM, and GPU usage with variables and alerts. | alerts, variables, translations | number |

## Example: divoom_pixoo

Source folder `examples/divoom_pixoo`, category `devices`. Send text, GIFs, drawings, and device controls to Divoom Pixoo LED displays over Wi-Fi.

### divoom_pixoo/manifest.json

```json
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

### divoom_pixoo/main.js

```javascript
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

### divoom_pixoo/actions_tutorial.md

```markdown
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

### divoom_pixoo/settings_tutorial.md

```markdown
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

### divoom_pixoo/package.json

```json
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

## Example: mawakit

Source folder `examples/mawakit`, category `utilities`. Prayer time alerts, Hijri date variables, and Ramadan reminders based on your location.

### mawakit/manifest.json

```json
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

### mawakit/main.js

```javascript
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

### mawakit/settings_tutorial.md

```markdown
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

### mawakit/package.json

```json
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

### mawakit/translations.json

```json
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

## Example: ntfy

Source folder `examples/ntfy`, category `apps`. Subscribe to ntfy topics and trigger Lumia alerts/variables for incoming notifications.

### ntfy/manifest.json

```json
{
	"id": "ntfy",
	"name": "ntfy",
	"version": "1.0.4",
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
			},
			{
				"key": "debugLogs",
				"label": "Enable Debug Logs",
				"type": "checkbox",
				"section": "Advanced",
				"sectionOrder": 2,
				"defaultValue": false,
				"refreshOnChange": true,
				"helperText": "Writes detailed ntfy diagnostics to Lumia logs for troubleshooting."
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

### ntfy/main.js

```javascript
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
		_key,
		message,
		severity = "warn",
		_intervalMs = DEFAULTS.logThrottleMs,
	) {
		if (!this.settings?.debugLogs) {
			return;
		}
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

### ntfy/actions_tutorial.md

```markdown
---
### Actions
This plugin runs automatically and does not expose actions.
---
```

### ntfy/settings_tutorial.md

```markdown
---
1) Enter your ntfy server base URL (hosted or self-hosted).
2) Add one or more topics (comma-separated).
3) If your server requires auth, choose **Access Token** (recommended) or **Username + Password**.

### Notes
- Access tokens and Basic auth are supported for subscriptions.
- Topics are case-sensitive and should match your ntfy publisher topics.
---
```

### ntfy/package.json

```json
{
	"name": "lumia-ntfy",
	"version": "1.0.1",
	"private": true,
	"description": "Lumia Stream plugin that subscribes to ntfy topics and triggers alerts on incoming messages.",
	"main": "main.js",
	"scripts": {},
	"dependencies": {
		"@lumiastream/plugin": "^0.4.1"
	}
}
```

### ntfy/translations.json

```json
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

## Example: rss_feed_monitor

Source folder `examples/rss_feed_monitor`, category `utilities`. Monitor multiple RSS or Atom feeds, persist unseen items, and trigger Lumia alerts for each new entry even after Lumia has been offline.

### rss_feed_monitor/manifest.json

```json
{
	"id": "rss_feed_monitor",
	"name": "RSS Feed Monitor",
	"version": "1.0.0",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://lumiastream.com",
	"description": "Monitor multiple RSS or Atom feeds, persist unseen items, and trigger Lumia alerts for each new entry even after Lumia has been offline.",
	"license": "MIT",
	"main": "main.js",
	"lumiaVersion": "^9.0.0",
	"category": "utilities",
	"keywords": "rss, atom, feeds, alerts, news, monitor",
	"icon": "rss_feed_monitor.jpg",
	"config": {
		"settings": [
			{
				"key": "feeds",
				"label": "Feeds",
				"type": "named_map",
				"required": true,
				"valueType": "text",
				"valueLabel": "Feed URL",
				"valuePlaceholder": "https://example.com/rss.xml",
				"valueField": {
					"type": "text",
					"required": true,
					"placeholder": "https://example.com/rss.xml"
				},
				"outputMode": "map",
				"objectValueMode": "value",
				"defaultValue": {
					"Lumia Blog": "https://example.com/rss.xml"
				},
				"helperText": "Add one named feed per row. The row name is the feed label and the value is the feed URL."
			},
			{
				"key": "pollInterval",
				"label": "Poll Interval (seconds)",
				"type": "number",
				"defaultValue": 300,
				"required": true,
				"helperText": "How often the plugin checks the configured feeds.",
				"validation": {
					"min": 30,
					"max": 86400
				}
			},
			{
				"key": "itemWindow",
				"label": "Recent Items Per Feed",
				"type": "number",
				"defaultValue": 25,
				"required": true,
				"helperText": "How many recent entries to track per feed for offline catch-up and duplicate prevention.",
				"validation": {
					"min": 5,
					"max": 100
				}
			}
		],
		"settings_tutorial": "---\n### Feed Format\nAdd one named row per feed.\n- **Name**: label shown in Lumia variables and alerts\n- **Feed URL**: RSS or Atom URL to poll\n\n### Offline Catch-up\nThe plugin stores seen items on disk. If Lumia is offline for a while, the next startup will replay alerts for any newly discovered entries still present in each feed's recent item window.\n\n### Tuning\n- **Poll Interval** controls how often feeds are checked.\n- **Recent Items Per Feed** increases how much backlog the plugin can catch after downtime.\n---",
		"actions": [],
		"alerts": [
			{
				"title": "Feed Item Changed",
				"key": "rss_feed_item_changed",
				"defaultMessage": "{{feed_name}}: {{item_title}}\n{{item_summary}}",
				"acceptedVariables": [
					"feed_name",
					"feed_url",
					"item_title",
					"item_url",
					"item_published",
					"item_summary",
					"item_guid",
					"item_id",
					"item_author"
				],
				"variationConditions": [
					{
						"type": "EQUAL_SELECTION",
						"description": "Feed name (compares against dynamic.value).",
						"dynamicOptions": true
					}
				]
			}
		],
		"actions_tutorial": "---\n### Actions\nThis plugin runs on a polling loop and does not expose actions.\n---"
	}
}
```

### rss_feed_monitor/main.js

```javascript
const { Plugin } = require("@lumiastream/plugin");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

const DEFAULTS = {
  pollInterval: 300,
  itemWindow: 25,
  requestTimeoutMs: 15000,
  userAgent: "Lumia Stream RSS Feed Monitor/1.0.0",
  maxSeenIdsPerFeed: 500,
};

const ALERT_KEYS = {
  itemChanged: "rss_feed_item_changed",
};

const VARIATION_SELECTION_ACTION_TYPES = new Set([
  "active_input",
  "preview_input",
  "transition_input",
]);

class RssFeedMonitorPlugin extends Plugin {
  constructor(manifest, context) {
    super(manifest, context);
    this._pollTimer = null;
    this._refreshPromise = null;
    this._drainPromise = null;
    this._lastConnectionState = null;
    this._state = this._emptyState();
  }

  async onload() {
    await this._loadStateFromDisk();
    await this._drainPendingAlerts();

    const feeds = this._configuredFeeds();
    if (!feeds.length) {
      await this._updateConnectionState(false);
      await this._log(
        "No valid RSS or Atom feed URLs configured. Add one or more feeds in plugin settings."
      );
      return;
    }

    await this._refreshFeeds({ reason: "startup" });
    this._schedulePolling();
  }

  async onunload() {
    this._clearPolling();
    await this._updateConnectionState(false);
  }

  async onsettingsupdate(settings, previous = {}) {
    const pollChanged =
      this._pollInterval(settings) !== this._pollInterval(previous);
    const itemWindowChanged =
      this._itemWindow(settings) !== this._itemWindow(previous);
    const feedsChanged =
      this._feedsSignature(settings) !== this._feedsSignature(previous);

    if (pollChanged) {
      this._schedulePolling();
    }

    if (feedsChanged) {
      this._pruneStateForFeeds(this._configuredFeeds(settings));
      await this._saveStateToDisk();
    }

    const feeds = this._configuredFeeds(settings);
    if (!feeds.length) {
      this._clearPolling();
      await this._updateConnectionState(false);
      await this._log(
        "Feed monitoring paused because no valid feed URLs are configured."
      );
      return;
    }

    if (!this._pollTimer) {
      this._schedulePolling();
    }

    if (feedsChanged || itemWindowChanged) {
      await this._refreshFeeds({ reason: "settings-update" });
    }
  }

  async validateAuth(data = {}) {
    const feeds = this._configuredFeeds(data);
    if (!feeds.length) {
      return {
        ok: false,
        message: "Add at least one valid RSS or Atom feed URL.",
      };
    }

    try {
      const result = await this._fetchAndParseFeed(feeds[0]);
      if (!Array.isArray(result.items) || !result.items.length) {
        return {
          ok: false,
          message: "The feed loaded, but no items were found.",
        };
      }
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: `Feed validation failed: ${this._errorMessage(error)}`,
      };
    }
  }

  async refreshActionOptions({ actionType, values } = {}) {
    if (!VARIATION_SELECTION_ACTION_TYPES.has(String(actionType || ""))) {
      return;
    }

    if (typeof this.lumia?.updateActionFieldOptions !== "function") {
      return;
    }

    const previewSettings = {
      ...(this.settings && typeof this.settings === "object"
        ? this.settings
        : {}),
      ...(values && typeof values === "object" ? values : {}),
    };

    await this.lumia.updateActionFieldOptions({
      actionType,
      fieldKey: "input",
      options: this._feedVariationOptions(previewSettings),
    });
  }

  async _refreshFeeds({ reason } = {}) {
    if (this._refreshPromise) {
      return this._refreshPromise;
    }

    this._refreshPromise = (async () => {
      const feeds = this._configuredFeeds();
      if (!feeds.length) {
        await this._updateConnectionState(false);
        return;
      }

      this._pruneStateForFeeds(feeds);

      const results = await Promise.allSettled(
        feeds.map((feed) => this._fetchAndParseFeed(feed))
      );

      let successCount = 0;

      for (let index = 0; index < results.length; index += 1) {
        const feed = feeds[index];
        const result = results[index];

        if (result.status !== "fulfilled") {
          await this._log(
            `Failed to refresh ${feed.name}: ${this._errorMessage(result.reason)}`
          );
          continue;
        }

        successCount += 1;
        const feedResult = result.value;
        const feedState = this._ensureFeedState(feed);
        const baselineOnly = !feedState.initialized;
        const normalizedItems = feedResult.items
          .slice(0, this._itemWindow())
          .map((item, itemIndex) =>
            this._normalizeItem(feed, feedResult.feedTitle, item, itemIndex)
          )
          .filter((item) => item);

        const seenIds = new Set(
          Array.isArray(feedState.seenIds) ? feedState.seenIds : []
        );
        const queuedIds = new Set(
          this._state.pendingAlerts.map((entry) => entry.alertId)
        );

        for (const item of normalizedItems) {
          if (seenIds.has(item.id)) {
            continue;
          }

          seenIds.add(item.id);
          if (baselineOnly) {
            continue;
          }

          const pendingAlert = this._buildPendingAlert(item);
          if (!queuedIds.has(pendingAlert.alertId)) {
            this._state.pendingAlerts.push(pendingAlert);
            queuedIds.add(pendingAlert.alertId);
          }
        }

        feedState.initialized = true;
        feedState.url = feed.url;
        feedState.name = feed.name;
        feedState.feedTitle = feedResult.feedTitle || feed.name;
        feedState.updatedAt = Date.now();
        feedState.seenIds = this._trimSeenIds([
          ...normalizedItems.map((item) => item.id),
          ...Array.from(seenIds),
        ]);
      }

      this._state.pendingAlerts = this._sortPendingAlerts(
        this._state.pendingAlerts
      );
      await this._saveStateToDisk();

      if (successCount > 0) {
        await this._updateConnectionState(true);
      } else {
        await this._updateConnectionState(false);
        await this._log(
          `All feed requests failed during ${reason || "refresh"} cycle.`
        );
      }

      await this._drainPendingAlerts();
    })().finally(() => {
      this._refreshPromise = null;
    });

    return this._refreshPromise;
  }

  async _drainPendingAlerts() {
    if (this._drainPromise) {
      return this._drainPromise;
    }

    this._drainPromise = (async () => {
      this._state.pendingAlerts = this._sortPendingAlerts(
        this._state.pendingAlerts
      );

      while (this._state.pendingAlerts.length) {
        const next = this._state.pendingAlerts[0];

        try {
          const dynamic = this._alertDynamic(next);
          await this.lumia.triggerAlert({
            alert: ALERT_KEYS.itemChanged,
            dynamic,
            extraSettings: this._alertVariables(next),
          });
          this._state.pendingAlerts.shift();
          await this._saveStateToDisk();
        } catch (error) {
          await this._log(
            `Failed to trigger RSS alert: ${this._errorMessage(error)}`
          );
          break;
        }
      }

    })().finally(() => {
      this._drainPromise = null;
    });

    return this._drainPromise;
  }

  _schedulePolling() {
    this._clearPolling();
    const intervalMs = this._pollInterval() * 1000;
    this._pollTimer = setTimeout(async () => {
      try {
        await this._refreshFeeds({ reason: "poll" });
      } finally {
        this._schedulePolling();
      }
    }, intervalMs);
  }

  _clearPolling() {
    if (this._pollTimer) {
      clearTimeout(this._pollTimer);
      this._pollTimer = null;
    }
  }

  async _fetchAndParseFeed(feed) {
    const { text: xml } = await this._fetchWithTimeout(feed.url);

    const parsed = this._parseFeedXml(xml, feed);
    if (!parsed.items.length) {
      throw new Error("The feed did not contain any parsable items.");
    }

    return parsed;
  }

  async _fetchWithTimeout(url) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      DEFAULTS.requestTimeoutMs
    );

    try {
      const response = await fetch(url, {
        headers: {
          Accept:
            "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
          "User-Agent": DEFAULTS.userAgent,
        },
        signal: controller.signal,
      });

      const text = await response.text();

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""}`
        );
      }

      return { response, text };
    } catch (error) {
      if (error && error.name === "AbortError") {
        throw new Error("Feed request timed out.");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  _parseFeedXml(xml, feed) {
    const source = String(xml || "");
    if (/<feed\b/i.test(source) && /<entry\b/i.test(source)) {
      return this._parseAtomFeed(source, feed);
    }
    return this._parseRssFeed(source, feed);
  }

  _parseRssFeed(xml, feed) {
    const channelBlock = this._extractFirstBlock(xml, "channel") || xml;
    const feedTitle =
      this._cleanText(this._extractTagText(channelBlock, "title")) ||
      feed.name ||
      this._deriveFeedName(feed.url);
    const itemBlocks = this._extractBlocks(channelBlock, "item");

    return {
      feedTitle,
      items: itemBlocks.map((block) => ({
        title: this._extractTagText(block, "title"),
        link:
          this._extractTagText(block, "link") ||
          this._extractLinkHref(block, "link"),
        guid:
          this._extractTagText(block, "guid") ||
          this._extractTagText(block, "id"),
        publishedAt:
          this._extractTagText(block, "pubDate") ||
          this._extractTagText(block, "published") ||
          this._extractTagText(block, "updated"),
        summary:
          this._extractTagText(block, "description") ||
          this._extractTagText(block, "content:encoded") ||
          this._extractTagText(block, "summary") ||
          this._extractTagText(block, "content"),
        author:
          this._extractTagText(block, "author") ||
          this._extractTagText(block, "dc:creator"),
      })),
    };
  }

  _parseAtomFeed(xml, feed) {
    const feedBlock = this._extractFirstBlock(xml, "feed") || xml;
    const feedTitle =
      this._cleanText(this._extractTagText(feedBlock, "title")) ||
      feed.name ||
      this._deriveFeedName(feed.url);
    const entryBlocks = this._extractBlocks(feedBlock, "entry");

    return {
      feedTitle,
      items: entryBlocks.map((block) => {
        const authorBlock = this._extractFirstBlock(block, "author");
        return {
          title: this._extractTagText(block, "title"),
          link: this._extractAtomLink(block),
          guid: this._extractTagText(block, "id"),
          publishedAt:
            this._extractTagText(block, "published") ||
            this._extractTagText(block, "updated"),
          summary:
            this._extractTagText(block, "summary") ||
            this._extractTagText(block, "content"),
          author:
            this._extractTagText(authorBlock, "name") ||
            this._extractTagText(block, "author"),
        };
      }),
    };
  }

  _normalizeItem(feed, feedTitle, item = {}, sourceIndex = 0) {
    const title = this._cleanText(item.title) || "Untitled item";
    const url = this._normalizeUrlCandidate(item.link);
    const guid = this._cleanText(item.guid, { stripHtml: false });
    const published = this._normalizeTimestamp(item.publishedAt);
    const summary = this._cleanText(item.summary);
    const author = this._cleanText(item.author);
    const identitySource =
      guid || url || `${title}|${published.display}|${summary}|${author}`;

    if (!identitySource) {
      return null;
    }

    return {
      id: this._hash(`${feed.key}|${identitySource}`),
      feedKey: feed.key,
      feedName: feedTitle || feed.name,
      feedUrl: feed.url,
      title,
      url,
      guid: guid || "",
      publishedAt: published.display,
      publishedAtMs: published.ms,
      summary,
      author,
      sourceIndex,
    };
  }

  _buildPendingAlert(item) {
    return {
      alertId: this._hash(`alert|${item.feedKey}|${item.id}`),
      createdAt: Date.now(),
      feed_key: item.feedKey,
      feed_name: item.feedName || "",
      feed_url: item.feedUrl || "",
      item_title: item.title || "",
      item_url: item.url || "",
      item_published: item.publishedAt || "",
      item_summary: item.summary || "",
      item_guid: item.guid || "",
      item_id: item.id || "",
      item_author: item.author || "",
      publishedAtMs: item.publishedAtMs || 0,
    };
  }

  _alertVariables(alert = {}) {
    const feedName = alert.feed_name || alert.latest_feed_name || "";
    const feedUrl = alert.feed_url || alert.latest_feed_url || "";
    const itemTitle = alert.item_title || alert.latest_item_title || "";
    const itemUrl = alert.item_url || alert.latest_item_url || "";
    const itemPublished =
      alert.item_published || alert.latest_item_published || "";
    const itemSummary = alert.item_summary || alert.latest_item_summary || "";
    const itemGuid = alert.item_guid || alert.latest_item_guid || "";
    const itemId = alert.item_id || alert.latest_item_id || "";
    const itemAuthor = alert.item_author || alert.latest_item_author || "";

    return {
      feed_name: feedName,
      feed_url: feedUrl,
      item_title: itemTitle,
      item_url: itemUrl,
      item_published: itemPublished,
      item_summary: itemSummary,
      item_guid: itemGuid,
      item_id: itemId,
      item_author: itemAuthor,
      latest_feed_name: feedName,
      latest_feed_url: feedUrl,
      latest_item_title: itemTitle,
      latest_item_url: itemUrl,
      latest_item_published: itemPublished,
      latest_item_summary: itemSummary,
      latest_item_guid: itemGuid,
      latest_item_id: itemId,
      latest_item_author: itemAuthor,
    };
  }

  _alertDynamic(alert = {}) {
    return {
      value: String(alert.feed_name || alert.latest_feed_name || "").trim(),
    };
  }

  _configuredFeeds(settings = this.settings) {
    const raw = settings?.feeds;
    const feeds = [];
    const seen = new Set();

    for (const parsedLine of this._coerceFeedEntries(raw)) {
      if (!parsedLine?.url) {
        continue;
      }

      try {
        const normalizedUrl = new URL(parsedLine.url);
        if (!/^https?:$/i.test(normalizedUrl.protocol)) {
          continue;
        }

        const finalUrl = normalizedUrl.toString();
        const key = this._hash(finalUrl);
        if (seen.has(key)) {
          continue;
        }

        seen.add(key);
        feeds.push({
          key,
          url: finalUrl,
          name: parsedLine.name || this._deriveFeedName(finalUrl),
        });
      } catch (_error) {}
    }

    return feeds;
  }

  _coerceFeedEntries(raw) {
    if (typeof raw === "string") {
      return raw
        .split(/\r\n|\n|\r/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => this._parseFeedLine(line))
        .filter(Boolean);
    }

    if (Array.isArray(raw)) {
      return raw
        .map((entry) => {
          if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
            return null;
          }
          return {
            name: String(entry.name ?? entry.key ?? "").trim(),
            url: String(entry.value ?? entry.url ?? "").trim(),
          };
        })
        .filter((entry) => entry && entry.url);
    }

    if (raw && typeof raw === "object") {
      return Object.entries(raw)
        .map(([name, value]) => ({
          name: String(name || "").trim(),
          url: String(value ?? "").trim(),
        }))
        .filter((entry) => entry.url);
    }

    return [];
  }

  _parseFeedLine(line) {
    const trimmed = String(line || "").trim();
    if (!trimmed) {
      return null;
    }

    if (/^https?:\/\//i.test(trimmed)) {
      return { name: "", url: trimmed };
    }

    const pipeIndex = trimmed.indexOf("|");
    if (pipeIndex > 0) {
      return {
        name: trimmed.slice(0, pipeIndex).trim(),
        url: trimmed.slice(pipeIndex + 1).trim(),
      };
    }

    const equalsMatch = trimmed.match(/^(.+?)\s*=\s*(https?:\/\/.+)$/i);
    if (equalsMatch) {
      return {
        name: equalsMatch[1].trim(),
        url: equalsMatch[2].trim(),
      };
    }

    return null;
  }

  _feedsSignature(settings = this.settings) {
    return JSON.stringify(
      this._configuredFeeds(settings).map((feed) => [feed.key, feed.name, feed.url])
    );
  }

  _feedVariationOptions(settings = this.settings) {
    return this._configuredFeeds(settings).map((feed) => ({
      label: feed.name,
      value: feed.name,
    }));
  }

  _pollInterval(settings = this.settings) {
    return this._clampNumber(settings?.pollInterval, DEFAULTS.pollInterval, 30, 86400);
  }

  _itemWindow(settings = this.settings) {
    return this._clampNumber(settings?.itemWindow, DEFAULTS.itemWindow, 5, 100);
  }

  _deriveFeedName(urlText = "") {
    try {
      const parsed = new URL(urlText);
      const pathName = parsed.pathname.replace(/\/$/, "");
      return pathName ? `${parsed.host}${pathName}` : parsed.host;
    } catch (_error) {
      return "RSS Feed";
    }
  }

  _normalizeUrlCandidate(value) {
    const trimmed = this._cleanText(value, { stripHtml: false });
    if (!trimmed) {
      return "";
    }

    try {
      const parsed = new URL(trimmed);
      return parsed.toString();
    } catch (_error) {
      return trimmed;
    }
  }

  _normalizeTimestamp(value) {
    const raw = this._cleanText(value, { stripHtml: false });
    if (!raw) {
      return { display: "", ms: 0 };
    }

    const ms = Date.parse(raw);
    if (Number.isFinite(ms)) {
      return { display: new Date(ms).toISOString(), ms };
    }

    return { display: raw, ms: 0 };
  }

  _sortPendingAlerts(alerts = []) {
    return [...alerts].sort((a, b) => {
      const timeDiff = (a?.publishedAtMs || 0) - (b?.publishedAtMs || 0);
      if (timeDiff !== 0) {
        return timeDiff;
      }
      return (a?.createdAt || 0) - (b?.createdAt || 0);
    });
  }

  _trimSeenIds(ids = []) {
    const unique = [];
    const seen = new Set();

    for (const value of ids) {
      const key = String(value || "").trim();
      if (!key || seen.has(key)) {
        continue;
      }
      seen.add(key);
      unique.push(key);
      if (unique.length >= DEFAULTS.maxSeenIdsPerFeed) {
        break;
      }
    }

    return unique;
  }

  _emptyState() {
    return {
      version: 1,
      feeds: {},
      pendingAlerts: [],
    };
  }

  _ensureFeedState(feed) {
    if (!this._state.feeds[feed.key]) {
      this._state.feeds[feed.key] = {
        initialized: false,
        url: feed.url,
        name: feed.name,
        feedTitle: feed.name,
        seenIds: [],
        updatedAt: 0,
      };
    }

    return this._state.feeds[feed.key];
  }

  _pruneStateForFeeds(feeds = []) {
    const allowed = new Set(feeds.map((feed) => feed.key));
    const nextFeeds = {};

    for (const [key, value] of Object.entries(this._state.feeds || {})) {
      if (allowed.has(key)) {
        nextFeeds[key] = value;
      }
    }

    this._state.feeds = nextFeeds;
    this._state.pendingAlerts = this._state.pendingAlerts.filter((entry) =>
      allowed.has(String(entry?.feed_key || ""))
    );
  }

  _stateFilePath() {
    const home = String(process.env.HOME || "").trim();
    if (!home) {
      return path.join(__dirname, ".rss_feed_monitor_state.json");
    }

    return path.join(
      home,
      "Library",
      "Application Support",
      "LumiaStream",
      "plugin-cache",
      "rss_feed_monitor",
      "state.json"
    );
  }

  async _loadStateFromDisk() {
    const filePath = this._stateFilePath();

    try {
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = JSON.parse(raw);
      this._state = {
        version: 1,
        feeds:
          parsed && typeof parsed.feeds === "object" && parsed.feeds
            ? parsed.feeds
            : {},
        pendingAlerts: Array.isArray(parsed?.pendingAlerts)
          ? parsed.pendingAlerts
          : [],
      };
      this._state.pendingAlerts = this._sortPendingAlerts(this._state.pendingAlerts);
    } catch (_error) {
      this._state = this._emptyState();
    }
  }

  async _saveStateToDisk() {
    const filePath = this._stateFilePath();
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(this._state, null, 2), "utf8");
  }

  _extractBlocks(source, tagName) {
    const escaped = this._escapeRegex(tagName);
    const regex = new RegExp(
      `<${escaped}(?:\\s[^>]*)?>[\\s\\S]*?<\\/${escaped}>`,
      "gi"
    );
    return String(source || "").match(regex) || [];
  }

  _extractFirstBlock(source, tagName) {
    return this._extractBlocks(source, tagName)[0] || "";
  }

  _extractTagText(source, tagName) {
    const escaped = this._escapeRegex(tagName);
    const regex = new RegExp(
      `<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`,
      "i"
    );
    const match = String(source || "").match(regex);
    return match ? match[1] : "";
  }

  _extractLinkHref(source, tagName) {
    const escaped = this._escapeRegex(tagName);
    const regex = new RegExp(`<${escaped}\\b([^>]*)\\/?>`, "i");
    const match = String(source || "").match(regex);
    if (!match) {
      return "";
    }
    const attributes = this._parseAttributes(match[1]);
    return attributes.href || "";
  }

  _extractAtomLink(source) {
    const regex = /<link\b([^>]*)\/?>/gi;
    let match = null;
    let fallbackHref = "";

    while ((match = regex.exec(String(source || "")))) {
      const attributes = this._parseAttributes(match[1]);
      const href = attributes.href || "";
      if (!href) {
        continue;
      }
      if (!fallbackHref) {
        fallbackHref = href;
      }
      const rel = String(attributes.rel || "").toLowerCase();
      if (!rel || rel === "alternate") {
        return href;
      }
    }

    return fallbackHref;
  }

  _parseAttributes(source) {
    const attributes = {};
    const regex = /([A-Za-z_:][\w:.-]*)\s*=\s*(['"])(.*?)\2/g;
    let match = null;

    while ((match = regex.exec(String(source || "")))) {
      attributes[match[1]] = match[3];
    }

    return attributes;
  }

  _cleanText(value, options = {}) {
    const stripHtml = options.stripHtml !== false;
    let result = String(value || "");

    result = result.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
    result = result.replace(/<!--[\s\S]*?-->/g, "");
    result = this._decodeXmlEntities(result);

    if (stripHtml) {
      result = result.replace(/<[^>]+>/g, " ");
    }

    return result.replace(/\s+/g, " ").trim();
  }

  _decodeXmlEntities(value) {
    return String(value || "").replace(
      /&(#x?[0-9a-fA-F]+|amp|lt|gt|quot|apos);/g,
      (match, entity) => {
        switch (entity) {
          case "amp":
            return "&";
          case "lt":
            return "<";
          case "gt":
            return ">";
          case "quot":
            return '"';
          case "apos":
            return "'";
          default:
            if (entity.startsWith("#x")) {
              return String.fromCodePoint(parseInt(entity.slice(2), 16));
            }
            if (entity.startsWith("#")) {
              return String.fromCodePoint(parseInt(entity.slice(1), 10));
            }
            return match;
        }
      }
    );
  }

  _clampNumber(value, fallback, min, max) {
    const parsed = Number(value);
    const resolved = Number.isFinite(parsed) ? parsed : fallback;
    return Math.min(max, Math.max(min, Math.round(resolved)));
  }

  _hash(value) {
    return crypto.createHash("sha1").update(String(value || "")).digest("hex");
  }

  _escapeRegex(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  async _updateConnectionState(state) {
    if (this._lastConnectionState === state) {
      return;
    }

    this._lastConnectionState = state;

    try {
      await this.lumia.updateConnection(state);
    } catch (error) {
      await this._log(
        `Failed to update connection state: ${this._errorMessage(error)}`
      );
    }
  }

  async _log(message) {
    await this.lumia.log(`[RSS Feed Monitor] ${message}`);
  }

  _errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
  }
}

module.exports = RssFeedMonitorPlugin;
```

### rss_feed_monitor/README.md

````markdown
# RSS Feed Monitor

Monitor multiple RSS or Atom feeds and trigger a Lumia alert for each newly discovered item. This plugin is alert-only and does not publish Lumia variables.

## Alert Variations

The `Feed Item Changed` alert supports feed-name variations. In Lumia's alert editor, add a variation with the selection condition and pick one of the configured feed names from the dropdown.

## Feed Format

Add one named feed row in the plugin settings for each source:

- `Name`: the label used in alerts and variables
- `Feed URL`: the RSS or Atom endpoint

Older string-based formats are still accepted by the runtime for backward compatibility, but the UI now uses the native `named_map` field.

## Persistence

Seen item state and pending alerts are stored in:

```text
~/Library/Application Support/LumiaStream/plugin-cache/rss_feed_monitor/state.json
```

That lets the plugin replay missed alerts after Lumia has been offline.
````

### rss_feed_monitor/package.json

```json
{
  "name": "lumia_plugin-rss-feed-monitor",
  "version": "1.0.0",
  "private": true,
  "description": "Lumia Stream plugin that monitors RSS and Atom feeds with persisted backlog alerts.",
  "main": "main.js",
  "scripts": {},
  "dependencies": {
    "@lumiastream/plugin": "^0.3.2"
  }
}
```

## Example: system_monitor

Source folder `examples/system_monitor`, category `utilities`. Monitor CPU, RAM, and GPU usage with variables and alerts.

### system_monitor/manifest.json

```json
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

### system_monitor/main.js

```javascript
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

### system_monitor/README.md

```markdown
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

### system_monitor/package.json

```json
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

### system_monitor/translations.json

```json
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
