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
