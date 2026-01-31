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

## ble_messenger/README.md

```
# BLE Messenger Plugin

A Lumia Stream plugin that connects to a Bluetooth Low Energy (BLE) peripheral and writes payloads to a configurable characteristic.

## Requirements

- Node.js 18+
- [`@abandonware/noble`](https://www.npmjs.com/package/@abandonware/noble) installed locally (native drivers/services for your platform may also be required)
- The BLE peripheral must expose a writable characteristic

Install dependencies inside the plugin folder:

```bash
npm install
```

On macOS you may also need to grant Bluetooth permissions to the Lumia Stream app.

## Configuration

1. Enter the **Service UUID** and **Characteristic UUID** that should be used when connecting.
2. Provide either the **Device Name** or **Device Address (MAC)** so the plugin can match the correct peripheral.
3. Choose the default payload encoding (`UTF-8`, `Hex`, or `Base64`) and optional line ending handling.
4. Enable **Auto Connect** / **Auto Reconnect** if you want the plugin to maintain the connection automatically.
5. Adjust scan timeout, retry delay, and queue size to fit your setup.

The plugin keeps two Lumia variables updated:

- `ble_status` – text description of the current connection state.
- `ble_last_message` – the last successfully transmitted message (raw text before encoding).

## Available Actions

- **Connect** – start scanning using the configured filters.
- **Disconnect** – stop scanning and close the active connection.
- **Send Message** – transmit a payload to the BLE characteristic. The action fields can override encoding, apply a specific line ending, and choose whether to queue the payload when the device is offline.

Queued payloads are flushed automatically once the BLE device reconnects. Set the queue size to `0` if you prefer actions to fail immediately when the device is offline.

## Notes

- The plugin falls back to write-without-response when the target characteristic does not support the requested write mode.
- Scanning and reconnect attempts automatically stop when the plugin is disabled.
- For debugging, enable **Verbose Logging** in the settings to print additional adapter state transitions.


```

## ble_messenger/main.js

```
const { Plugin } = require("@lumiastream/plugin");

const LOG_TAG = "[ble_messenger]";
const VARIABLES = {
  status: "ble_status",
  lastMessage: "ble_last_message",
};
const VALID_ENCODINGS = ["utf8", "hex", "base64"];
const VALID_LINE_ENDINGS = ["none", "lf", "crlf"];

class BLEMessengerPlugin extends Plugin {
  constructor(manifest, context) {
    super(manifest, context);

    this.noble = null;
    this.peripheral = null;
    this.writeCharacteristic = null;
    this.writeMode = "with"; // "with" -> response, "without" -> write without response
    this.pendingMessages = [];
    this.isScanning = false;
    this.connecting = false;
    this.connected = false;
    this.scanTimer = null;
    this.retryTimer = null;

    this._handleStateChange = (state) => {
      void this._handleStateChangeAsync(state);
    };
    this._handleDiscover = (peripheral) => {
      void this._handleDiscoverAsync(peripheral);
    };
    this._handleDisconnect = (error) => {
      void this._handleDisconnectAsync(error);
    };
  }

  async onload() {
    await this._log("Plugin loaded");

    await this.lumia.setVariable(VARIABLES.status, "initialising");
    await this._updateConnectionState(false, "idle");

    try {
      // Lazy load to surface friendly errors when dependency is missing.
      // eslint-disable-next-line global-require
      this.noble = require("@abandonware/noble");
    } catch (error) {
      await this._log(
        `Failed to load @abandonware/noble: ${error?.message ?? error}`,
        "error"
      );
      await this.lumia.setVariable(
        VARIABLES.status,
        "missing @abandonware/noble dependency"
      );
      return;
    }

    this.noble.on("stateChange", this._handleStateChange);
    this.noble.on("discover", this._handleDiscover);

    if (!this._hasRequiredConnectionFields()) {
      await this._log(
        "Service and characteristic UUIDs must be configured before connecting.",
        "warn"
      );
      return;
    }

    if (this.noble.state === "poweredOn") {
      if (this._autoConnectEnabled()) {
        await this._startScanning();
      }
    } else if (this._autoConnectEnabled()) {
      await this._log(
        `Bluetooth adapter state is '${this.noble.state}'. Waiting for power on.`,
        "warn"
      );
    }
  }

  async onunload() {
    await this._log("Plugin unloading");
    this._clearScanTimer();
    this._clearRetryTimer();

    await this._stopScanning();
    await this._teardownPeripheral();

    if (this.noble) {
      try {
        this.noble.removeListener("stateChange", this._handleStateChange);
        this.noble.removeListener("discover", this._handleDiscover);
        this.noble.stopScanning();
      } catch (error) {
        await this._log(
          `Error while detaching noble listeners: ${error?.message ?? error}`,
          "warn"
        );
      }
      this.noble = null;
    }

    await this._updateConnectionState(false, "unloaded");
    await this.lumia.setVariable(VARIABLES.status, "unloaded");
    await this._log("Plugin unloaded");
  }

  async onsettingsupdate(settings, previous = {}) {
    await this._log("Settings updated");

    if (this._connectionSettingsChanged(settings, previous)) {
      await this._log(
        "Connection-related settings changed. Restarting BLE connection.",
        "warn"
      );
      await this._restartConnection();
    }
  }

  async actions(config = {}) {
    const list = Array.isArray(config.actions) ? config.actions : [];

    for (const action of list) {
      const type = action?.type;
      const data = action?.data ?? action?.value ?? {};

      switch (type) {
        case "connect":
          await this._log("Connect action triggered");
          await this._startScanning(true);
          break;
        case "disconnect":
          await this._log("Disconnect action triggered");
          await this._disconnectRequested();
          break;
        case "send_message":
          await this._handleSendMessage(data);
          break;
        default:
          await this._log(`Unknown action type: ${String(type)}`, "warn");
      }
    }
  }

  async _handleStateChangeAsync(state) {
    if (this._verbose()) {
      await this._log(`Adapter state changed: ${state}`);
    }

    if (state === "poweredOn") {
      if (this._autoConnectEnabled()) {
        await this._startScanning(true);
      }
    } else {
      await this._log(`Adapter state '${state}' – tearing down connection.`, "warn");
      await this._stopScanning();
      await this._teardownPeripheral();
      await this._updateConnectionState(false, `adapter ${state}`);
    }
  }

  async _handleDiscoverAsync(peripheral) {
    if (!peripheral || this.connecting || this.connected) {
      return;
    }

    if (!this._matchesTarget(peripheral)) {
      return;
    }

    this.connecting = true;
    this.peripheral = peripheral;

    await this._log(
      `Connecting to ${peripheral.advertisement?.localName ?? peripheral.id}`
    );

    peripheral.removeListener("disconnect", this._handleDisconnect);
    peripheral.once("disconnect", this._handleDisconnect);

    this._clearScanTimer();
    this.isScanning = false;

    try {
      await this._connectPeripheral(peripheral);
      await this._updateConnectionState(true);
      await this.lumia.setVariable(
        VARIABLES.status,
        `connected to ${this._peripheralLabel(peripheral)}`
      );
      await this._flushPendingMessages();
    } catch (error) {
      await this._log(
        `Failed to connect: ${error?.message ?? error}`,
        "error"
      );
      await this._updateConnectionState(false, error?.message ?? "connect error");
      await this._teardownPeripheral();
      await this._scheduleRetry("connection failure");
    } finally {
      this.connecting = false;
    }
  }

  async _handleDisconnectAsync(error) {
    const reason = error?.message ?? error ?? "peripheral disconnected";
    await this._log(`Device disconnected: ${reason}`, "warn");
    await this._teardownPeripheral();
    await this._updateConnectionState(false, reason);
    await this._scheduleRetry("device disconnected");
  }

  async _disconnectRequested() {
    this._clearRetryTimer();
    await this._stopScanning();
    await this._teardownPeripheral();
    await this._updateConnectionState(false, "manual disconnect");
    await this.lumia.setVariable(VARIABLES.status, "manually disconnected");
  }

  async _handleSendMessage(data = {}) {
    const rawMessage = typeof data.message === "string" ? data.message : "";
    if (!rawMessage) {
      await this._log("Send Message action requires a message payload.", "warn");
      return;
    }

    const encoding = this._resolveEncoding(data.encoding);
    const lineEnding = this._resolveLineEnding(data.lineEnding);

    let buffer;
    try {
      buffer = this._buildBuffer(rawMessage, encoding, lineEnding);
    } catch (error) {
      await this._log(
        `Failed to build payload: ${error?.message ?? error}`,
        "error"
      );
      return;
    }

    const queueAllowed = this._shouldQueue(data);

    if (this._canSend()) {
      try {
        await this._performWrite(buffer);
        await this._log(
          `Sent ${buffer.length} bytes using ${this.writeMode === "with" ? "write with response" : "write without response"}.`
        );
        await this.lumia.setVariable(VARIABLES.lastMessage, rawMessage);
      } catch (error) {
        await this._log(
          `Failed to write payload: ${error?.message ?? error}`,
          "error"
        );
        await this._scheduleRetry("write failure");
      }
      return;
    }

    if (!queueAllowed || this._maxQueueLength() === 0) {
      await this._log(
        "BLE device offline and queueing disabled. Payload dropped.",
        "warn"
      );
      return;
    }

    if (this.pendingMessages.length >= this._maxQueueLength()) {
      this.pendingMessages.shift();
      await this._log("Pending queue full. Dropped oldest payload.", "warn");
    }

    this.pendingMessages.push({ buffer, rawMessage });
    await this._log("Queued payload until BLE device reconnects.");

    if (!this.connecting && !this.isScanning && this._autoConnectEnabled()) {
      await this._startScanning();
    }
  }

  async _performWrite(buffer) {
    if (!this.writeCharacteristic) {
      throw new Error("No writable characteristic selected");
    }

    const withoutResponse = this.writeMode !== "with";
    await new Promise((resolve, reject) => {
      this.writeCharacteristic.write(buffer, withoutResponse, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  async _flushPendingMessages() {
    if (!this._canSend() || this.pendingMessages.length === 0) {
      return;
    }

    const queue = [...this.pendingMessages];
    this.pendingMessages.length = 0;

    for (const entry of queue) {
      try {
        await this._performWrite(entry.buffer);
        await this._log(
          `Flushed queued payload (${entry.buffer.length} bytes).`
        );
        if (entry.rawMessage) {
          await this.lumia.setVariable(VARIABLES.lastMessage, entry.rawMessage);
        }
      } catch (error) {
        await this._log(
          `Failed to flush queued payload: ${error?.message ?? error}`,
          "error"
        );
        this.pendingMessages.unshift(entry);
        await this._scheduleRetry("flush failure");
        break;
      }
    }
  }

  async _connectPeripheral(peripheral) {
    await new Promise((resolve, reject) => {
      peripheral.connect((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    const serviceUuids = this._serviceUuidList();
    const characteristicUuids = this._characteristicUuidList();

    const { characteristic, properties } = await new Promise(
      (resolve, reject) => {
        peripheral.discoverSomeServicesAndCharacteristics(
          serviceUuids,
          characteristicUuids,
          (error, services, characteristics) => {
            if (error) {
              reject(error);
              return;
            }
            const targetUuid = characteristicUuids[0];
            const found = Array.isArray(characteristics)
              ? characteristics.find((item) =>
                  this._uuidEquals(item.uuid, targetUuid)
                ) || characteristics[0]
              : null;

            if (!found) {
              reject(new Error("Writable characteristic not found"));
              return;
            }

            resolve({ characteristic: found, properties: found.properties || [] });
          }
        );
      }
    );

    const supportsWithResponse = properties.includes("write");
    const supportsWithoutResponse = properties.includes("writeWithoutResponse");

    if (!supportsWithResponse && !supportsWithoutResponse) {
      throw new Error("Characteristic is not writable");
    }

    const wantsResponse = this._writeWithResponse();
    if (wantsResponse && supportsWithResponse) {
      this.writeMode = "with";
    } else if (supportsWithoutResponse) {
      if (wantsResponse && !supportsWithResponse) {
        await this._log(
          "Characteristic does not support write with response. Using write without response.",
          "warn"
        );
      }
      this.writeMode = "without";
    } else {
      this.writeMode = "with";
    }

    this.writeCharacteristic = characteristic;
    await this._log(
      `Connected. Using ${
        this.writeMode === "with" ? "write with response" : "write without response"
      } on ${characteristic.uuid}.`
    );
  }

  async _stopScanning() {
    if (!this.noble || !this.isScanning) {
      return;
    }

    this._clearScanTimer();
    this.isScanning = false;

    await new Promise((resolve) => {
      let finished = false;
      const done = () => {
        if (finished) {
          return;
        }
        finished = true;
        resolve();
      };
      try {
        this.noble.stopScanning(done);
      } catch (_error) {
        done();
        return;
      }
      setTimeout(done, 50);
    });
  }

  async _startScanning(force = false) {
    if (!this.noble) {
      await this._log("BLE library not initialised", "error");
      return;
    }

    if (!this._hasRequiredConnectionFields()) {
      await this._log(
        "Service and characteristic UUIDs must be configured before scanning.",
        "warn"
      );
      return;
    }

    if (!force && this.isScanning) {
      if (this._verbose()) {
        await this._log("Scan already in progress");
      }
      return;
    }

    if (this.noble.state !== "poweredOn") {
      await this._log(
        `Cannot start scan. Adapter state: ${this.noble.state}`,
        "warn"
      );
      return;
    }

    const serviceUuids = this._serviceUuidList();
    if (!this._targetName() && !this._targetAddress()) {
      await this._log(
        "Consider configuring a device name or address to avoid connecting to unintended peripherals.",
        "warn"
      );
    }

    this.isScanning = true;
    await this.lumia.setVariable(VARIABLES.status, "scanning");
    await this._log(
      `Scanning for target device (${serviceUuids.length || "any"} service filter)`
    );

    try {
      await new Promise((resolve, reject) => {
        this.noble.startScanning(serviceUuids, false, (error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    } catch (error) {
      this.isScanning = false;
      await this._log(
        `Failed to start BLE scan: ${error?.message ?? error}`,
        "error"
      );
      await this._scheduleRetry("scan failure");
      return;
    }

    const scanTimeout = this._scanTimeoutMs();
    if (scanTimeout > 0) {
      this._clearScanTimer();
      this.scanTimer = setTimeout(() => {
        this.scanTimer = null;
        void this._log("Scan timed out without finding the device.", "warn");
        void this._stopScanning();
        void this._scheduleRetry("scan timeout");
      }, scanTimeout);
    }
  }

  async _teardownPeripheral() {
    if (!this.peripheral) {
      this.writeCharacteristic = null;
      return;
    }

    try {
      this.peripheral.removeListener("disconnect", this._handleDisconnect);
    } catch (_error) {
      // Ignore removal errors during teardown.
    }

    if (this.peripheral.state === "connected" || this.peripheral.state === "connecting") {
      await new Promise((resolve) => {
        this.peripheral.disconnect(() => resolve());
      });
    }

    this.peripheral = null;
    this.writeCharacteristic = null;
    this.writeMode = this._writeWithResponse() ? "with" : "without";
  }

  async _restartConnection() {
    this._clearRetryTimer();
    await this._stopScanning();
    await this._teardownPeripheral();
    this.pendingMessages.length = 0;

    if (this._autoConnectEnabled()) {
      await this._startScanning(true);
    }
  }

  async _scheduleRetry(reason) {
    if (!this._autoReconnectEnabled()) {
      return;
    }

    const delay = this._retryDelayMs();
    if (delay <= 0) {
      return;
    }

    this._clearRetryTimer();
    await this.lumia.setVariable(
      VARIABLES.status,
      `reconnecting in ${Math.round(delay / 1000)}s`
    );

    if (reason) {
      await this._log(`Retry scheduled (${reason}) in ${Math.round(delay / 1000)}s.`);
    } else {
      await this._log(`Retry scheduled in ${Math.round(delay / 1000)}s.`);
    }

    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      if (!this.noble || !this._autoConnectEnabled()) {
        return;
      }
      void this._startScanning(true);
    }, delay);
  }

  _clearScanTimer() {
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
      this.scanTimer = null;
    }
  }

  _clearRetryTimer() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  async _updateConnectionState(connected, reason = "") {
    this.connected = Boolean(connected);
    try {
      await this.lumia.updateConnection(this.connected);
    } catch (_error) {
      // Silently ignore update errors to prevent cascading failures.
    }

    if (!connected) {
      const detail = reason ? `disconnected (${reason})` : "disconnected";
      await this.lumia.setVariable(VARIABLES.status, detail);
    }
  }

  _connectionSettingsChanged(next = {}, previous = {}) {
    const keys = [
      "deviceName",
      "deviceAddress",
      "serviceUuid",
      "characteristicUuid",
      "writeWithResponse",
    ];

    return keys.some(
      (key) => (next?.[key] ?? null) !== (previous?.[key] ?? null)
    );
  }

  _resolveEncoding(value) {
    if (VALID_ENCODINGS.includes(value)) {
      return value;
    }

    const fallback = this.settings?.defaultEncoding;
    if (VALID_ENCODINGS.includes(fallback)) {
      return fallback;
    }

    return "utf8";
  }

  _resolveLineEnding(value) {
    if (VALID_LINE_ENDINGS.includes(value)) {
      return value;
    }

    const fallback = this.settings?.defaultLineEnding;
    if (VALID_LINE_ENDINGS.includes(fallback)) {
      return fallback;
    }

    return "none";
  }

  _buildBuffer(message, encoding, lineEnding) {
    if (encoding === "hex") {
      const sanitized = message.replace(/[^0-9a-fA-F]/g, "");
      if (sanitized.length === 0) {
        throw new Error("Hex payload is empty");
      }
      if (sanitized.length % 2 !== 0) {
        throw new Error("Hex payload must contain an even number of characters");
      }
      let buffer = Buffer.from(sanitized, "hex");
      const suffix = this._lineEndingBuffer(lineEnding, encoding);
      if (suffix?.length) {
        buffer = Buffer.concat([buffer, suffix]);
      }
      return buffer;
    }

    if (encoding === "base64") {
      let buffer;
      try {
        buffer = Buffer.from(message, "base64");
      } catch (error) {
        throw new Error("Invalid base64 payload");
      }
      if (buffer.length === 0) {
        throw new Error("Base64 payload decoded to an empty buffer");
      }
      const suffix = this._lineEndingBuffer(lineEnding, encoding);
      if (suffix?.length) {
        buffer = Buffer.concat([buffer, suffix]);
      }
      return buffer;
    }

    const suffix = this._lineEndingString(lineEnding);
    const text = suffix ? `${message}${suffix}` : message;
    return Buffer.from(text, "utf8");
  }

  _lineEndingString(lineEnding) {
    switch (lineEnding) {
      case "lf":
        return "\n";
      case "crlf":
        return "\r\n";
      default:
        return "";
    }
  }

  _lineEndingBuffer(lineEnding, encoding) {
    if (lineEnding === "none" || !lineEnding) {
      return null;
    }

    if (encoding === "hex") {
      const hex = lineEnding === "crlf" ? "0d0a" : "0a";
      return Buffer.from(hex, "hex");
    }

    return Buffer.from(this._lineEndingString(lineEnding), "utf8");
  }

  _shouldQueue(data = {}) {
    if (typeof data.queueWhenDisconnected === "boolean") {
      return data.queueWhenDisconnected;
    }
    return this._maxQueueLength() > 0;
  }

  _maxQueueLength() {
    const value = Number(this.settings?.maxQueueLength);
    if (!Number.isFinite(value) || value < 0) {
      return 10;
    }
    return value;
  }

  _writeWithResponse() {
    return this.settings?.writeWithResponse !== false;
  }

  _autoConnectEnabled() {
    return this.settings?.autoConnect !== false;
  }

  _autoReconnectEnabled() {
    return this.settings?.autoReconnect !== false;
  }

  _retryDelayMs() {
    const value = Number(this.settings?.retryDelay);
    if (!Number.isFinite(value) || value <= 0) {
      return 5000;
    }
    return Math.min(Math.max(value, 1), 300) * 1000;
  }

  _scanTimeoutMs() {
    const value = Number(this.settings?.scanTimeout);
    if (!Number.isFinite(value) || value <= 0) {
      return 0;
    }
    return Math.min(Math.max(value, 0), 3600) * 1000;
  }

  _serviceUuidList() {
    const raw = this.settings?.serviceUuid;
    if (!raw || typeof raw !== "string") {
      return [];
    }

    return raw
      .split(",")
      .map((entry) => this._normaliseUuid(entry))
      .filter(Boolean);
  }

  _characteristicUuidList() {
    const raw = this.settings?.characteristicUuid;
    if (!raw || typeof raw !== "string") {
      return [];
    }

    return [this._normaliseUuid(raw)].filter(Boolean);
  }

  _normaliseUuid(value) {
    if (typeof value !== "string") {
      return "";
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return "";
    }

    return trimmed.replace(/[^0-9a-fA-F]/g, "").toLowerCase();
  }

  _targetName() {
    const name = this.settings?.deviceName;
    return typeof name === "string" && name.trim() ? name.trim() : "";
  }

  _targetAddress() {
    const address = this.settings?.deviceAddress;
    if (typeof address !== "string") {
      return "";
    }

    return address.replace(/[^0-9a-fA-F]/g, "").toLowerCase();
  }

  _matchesTarget(peripheral) {
    const targetAddress = this._targetAddress();
    const peripheralAddress = (peripheral.address || "").replace(
      /[^0-9a-fA-F]/g,
      ""
    ).toLowerCase();

    if (targetAddress && targetAddress !== peripheralAddress) {
      return false;
    }

    const targetName = this._targetName();
    if (targetName) {
      const advName = peripheral.advertisement?.localName;
      if (!advName || advName.trim() !== targetName) {
        return false;
      }
    }

    return true;
  }

  _hasRequiredConnectionFields() {
    const hasService = Boolean(this._serviceUuidList().length);
    const hasCharacteristic = Boolean(this._characteristicUuidList().length);
    return hasService && hasCharacteristic;
  }

  _peripheralLabel(peripheral) {
    return (
      peripheral.advertisement?.localName ||
      peripheral?.id ||
      peripheral?.uuid ||
      "unknown"
    );
  }

  _uuidEquals(a, b) {
    if (!a || !b) {
      return false;
    }
    return String(a).toLowerCase() === String(b).toLowerCase();
  }

  _canSend() {
    return Boolean(this.writeCharacteristic && this.connected);
  }

  _verbose() {
    return this.settings?.verboseLogging === true;
  }

  async _log(message, severity = "info") {
    let decorated = `${LOG_TAG} ${message}`;
    if (severity === "warn") {
      decorated = `${LOG_TAG} [warn] ${message}`;
    } else if (severity === "error") {
      decorated = `${LOG_TAG} [error] ${message}`;
    }
    await this.lumia.addLog(decorated);
  }
}

module.exports = BLEMessengerPlugin;

```

## ble_messenger/manifest.json

```
{
	"id": "ble_messenger",
	"name": "BLE Messenger",
	"version": "1.0.1",
	"author": "Lumia Stream",
	"description": "Connect to a Bluetooth Low Energy peripheral and send messages to it from Lumia actions.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "hardware",
	"icon": "ble-messenger.png",
	"changelog": "",
	"config": {
		"settings": [
			{
				"key": "deviceName",
				"label": "Device Name",
				"type": "text",
				"placeholder": "BLE Peripheral Name",
				"helperText": "Exact advertised name used to match the target peripheral. Leave blank to match by address only."
			},
			{
				"key": "deviceAddress",
				"label": "Device Address (MAC)",
				"type": "text",
				"placeholder": "AA:BB:CC:DD:EE:FF",
				"helperText": "Optional. Colons and dashes are ignored when matching the peripheral."
			},
			{
				"key": "serviceUuid",
				"label": "Service UUID",
				"type": "text",
				"placeholder": "FFF0",
				"helperText": "Single UUID or comma separated list used while scanning.",
				"required": true
			},
			{
				"key": "characteristicUuid",
				"label": "Characteristic UUID",
				"type": "text",
				"placeholder": "FFF1",
				"helperText": "Writable characteristic used when sending messages.",
				"required": true
			},
			{
				"key": "defaultEncoding",
				"label": "Default Encoding",
				"type": "select",
				"defaultValue": "utf8",
				"options": [
					{ "label": "UTF-8 Text", "value": "utf8" },
					{ "label": "Hexadecimal", "value": "hex" },
					{ "label": "Base64", "value": "base64" }
				],
				"helperText": "Used when an action does not override the encoding."
			},
			{
				"key": "defaultLineEnding",
				"label": "Default Line Ending",
				"type": "select",
				"defaultValue": "none",
				"options": [
					{ "label": "None", "value": "none" },
					{ "label": "LF (\\n)", "value": "lf" },
					{ "label": "CRLF (\\r\\n)", "value": "crlf" }
				],
				"helperText": "Automatically appended for UTF-8 messages."
			},
			{
				"key": "autoConnect",
				"label": "Auto Connect on Load",
				"type": "toggle",
				"defaultValue": true
			},
			{
				"key": "autoReconnect",
				"label": "Auto Reconnect on Drop",
				"type": "toggle",
				"defaultValue": true
			},
			{
				"key": "retryDelay",
				"label": "Reconnect Delay (seconds)",
				"type": "number",
				"defaultValue": 5,
				"validation": {
					"min": 1,
					"max": 300
				},
				"helperText": "Wait time before attempting to reconnect when auto reconnect is enabled."
			},
			{
				"key": "scanTimeout",
				"label": "Scan Timeout (seconds)",
				"type": "number",
				"defaultValue": 15,
				"validation": {
					"min": 0,
					"max": 120
				},
				"helperText": "Stop scanning after this many seconds. Zero keeps scanning until a match is found."
			},
			{
				"key": "maxQueueLength",
				"label": "Pending Message Queue Size",
				"type": "number",
				"defaultValue": 10,
				"validation": {
					"min": 0,
					"max": 100
				},
				"helperText": "Messages queued while disconnected. Zero disables queueing."
			},
			{
				"key": "writeWithResponse",
				"label": "Request Write Response",
				"type": "toggle",
				"defaultValue": true,
				"helperText": "Disable if the characteristic only supports write without response."
			},
			{
				"key": "verboseLogging",
				"label": "Verbose Logging",
				"type": "toggle",
				"defaultValue": false,
				"helperText": "Emit extra BLE lifecycle details to the Lumia log panel."
			}
		],
		"actions": [
			{
				"type": "connect",
				"label": "Connect",
				"description": "Start scanning and connect to the configured BLE device."
			},
			{
				"type": "disconnect",
				"label": "Disconnect",
				"description": "Tear down the current connection and stop scanning."
			},
			{
				"type": "send_message",
				"label": "Send Message",
				"description": "Write a payload to the configured characteristic.",
				"fields": [
					{
						"key": "message",
						"label": "Message",
						"type": "textarea",
						"rows": 4,
						"defaultValue": "Hello from Lumia Stream!",
						"helperText": "Supports variables and dynamic content."
					},
					{
						"key": "encoding",
						"label": "Encoding",
						"type": "select",
						"defaultValue": "inherit",
						"options": [
							{ "label": "Use Default", "value": "inherit" },
							{ "label": "UTF-8 Text", "value": "utf8" },
							{ "label": "Hexadecimal", "value": "hex" },
							{ "label": "Base64", "value": "base64" }
						]
					},
					{
						"key": "lineEnding",
						"label": "Line Ending",
						"type": "select",
						"defaultValue": "inherit",
						"options": [
							{ "label": "Use Default", "value": "inherit" },
							{ "label": "None", "value": "none" },
							{ "label": "LF (\\n)", "value": "lf" },
							{ "label": "CRLF (\\r\\n)", "value": "crlf" }
						],
						"helperText": "Applied only for UTF-8 messages unless sending hex line endings."
					},
					{
						"key": "queueWhenDisconnected",
						"label": "Queue When Disconnected",
						"type": "toggle",
						"defaultValue": true,
						"helperText": "Queue this payload until the device reconnects."
					}
				]
			}
		],
		"variables": [
			{
				"name": "ble_status",
				"description": "Current BLE connection state reported by the plugin.",
				"value": "disconnected"
			},
			{
				"name": "ble_last_message",
				"description": "Most recent payload successfully sent to the BLE device.",
				"value": ""
			}
		]
	}
}

```

## ble_messenger/package-lock.json

```
{
  "name": "lumia-example-ble-messenger",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "lumia-example-ble-messenger",
      "version": "1.0.0",
      "dependencies": {
        "@abandonware/noble": "^1.9.2-15",
        "@lumiastream/plugin": "^0.1.15"
      }
    },
    "node_modules/@abandonware/bluetooth-hci-socket": {
      "version": "0.5.3-12",
      "resolved": "https://registry.npmjs.org/@abandonware/bluetooth-hci-socket/-/bluetooth-hci-socket-0.5.3-12.tgz",
      "integrity": "sha512-qo2cBoh94j6RPusaNXSLYI8Bzxuz01Bx3MD80a/QYzhHED/FZ6Y0k2w2kRbfIA2EEhFSCbXrBZDQlpilL4nbxA==",
      "hasInstallScript": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux",
        "android",
        "freebsd",
        "win32"
      ],
      "dependencies": {
        "@mapbox/node-pre-gyp": "^1.0.11",
        "debug": "^4.3.4",
        "nan": "^2.18.0",
        "node-gyp": "^10.0.1"
      },
      "engines": {
        "node": ">=10.0.0"
      },
      "optionalDependencies": {
        "usb": "^2.11.0"
      }
    },
    "node_modules/@abandonware/noble": {
      "version": "1.9.2-26",
      "resolved": "https://registry.npmjs.org/@abandonware/noble/-/noble-1.9.2-26.tgz",
      "integrity": "sha512-dPx78rkxF+z2oR8KhVlNt3gHi5E6dMSkil6HaZuDanFlWAL/bP2oHqAtHrHZdqtKDnTiZUf7f93hpDkKWx36Lw==",
      "hasInstallScript": true,
      "license": "MIT",
      "os": [
        "darwin",
        "linux",
        "freebsd",
        "win32"
      ],
      "dependencies": {
        "debug": "^4.3.4",
        "napi-thread-safe-callback": "^0.0.6",
        "node-addon-api": "^8.3.0",
        "node-gyp-build": "^4.8.4"
      },
      "engines": {
        "node": ">=16"
      },
      "optionalDependencies": {
        "@abandonware/bluetooth-hci-socket": "^0.5.3-11"
      }
    },
    "node_modules/@isaacs/cliui": {
      "version": "8.0.2",
      "resolved": "https://registry.npmjs.org/@isaacs/cliui/-/cliui-8.0.2.tgz",
      "integrity": "sha512-O8jcjabXaleOG9DQ0+ARXWZBTfnP4WNAqzuiJK7ll44AmxGKv/J2M4TPjxjY3znBCfvBXFzucm1twdyFybFqEA==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "string-width": "^5.1.2",
        "string-width-cjs": "npm:string-width@^4.2.0",
        "strip-ansi": "^7.0.1",
        "strip-ansi-cjs": "npm:strip-ansi@^6.0.1",
        "wrap-ansi": "^8.1.0",
        "wrap-ansi-cjs": "npm:wrap-ansi@^7.0.0"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@lumiastream/plugin": {
      "version": "0.1.15",
      "resolved": "https://registry.npmjs.org/@lumiastream/plugin/-/plugin-0.1.15.tgz",
      "integrity": "sha512-wv8958Jo43dCoNRluID9tgBMN8W012MURIIdyryg8amUxj67M1+eN3RTBSOvICChyyN8m9ZESc9ZzbPezPLG3Q==",
      "license": "MIT"
    },
    "node_modules/@mapbox/node-pre-gyp": {
      "version": "1.0.11",
      "resolved": "https://registry.npmjs.org/@mapbox/node-pre-gyp/-/node-pre-gyp-1.0.11.tgz",
      "integrity": "sha512-Yhlar6v9WQgUp/He7BdgzOz8lqMQ8sU+jkCq7Wx8Myc5YFJLbEe7lgui/V7G1qB1DJykHSGwreceSaD60Y0PUQ==",
      "license": "BSD-3-Clause",
      "optional": true,
      "dependencies": {
        "detect-libc": "^2.0.0",
        "https-proxy-agent": "^5.0.0",
        "make-dir": "^3.1.0",
        "node-fetch": "^2.6.7",
        "nopt": "^5.0.0",
        "npmlog": "^5.0.1",
        "rimraf": "^3.0.2",
        "semver": "^7.3.5",
        "tar": "^6.1.11"
      },
      "bin": {
        "node-pre-gyp": "bin/node-pre-gyp"
      }
    },
    "node_modules/@npmcli/agent": {
      "version": "2.2.2",
      "resolved": "https://registry.npmjs.org/@npmcli/agent/-/agent-2.2.2.tgz",
      "integrity": "sha512-OrcNPXdpSl9UX7qPVRWbmWMCSXrcDa2M9DvrbOTj7ao1S4PlqVFYv9/yLKMkrJKZ/V5A/kDBC690or307i26Og==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "agent-base": "^7.1.0",
        "http-proxy-agent": "^7.0.0",
        "https-proxy-agent": "^7.0.1",
        "lru-cache": "^10.0.1",
        "socks-proxy-agent": "^8.0.3"
      },
      "engines": {
        "node": "^16.14.0 || >=18.0.0"
      }
    },
    "node_modules/@npmcli/agent/node_modules/agent-base": {
      "version": "7.1.4",
      "resolved": "https://registry.npmjs.org/agent-base/-/agent-base-7.1.4.tgz",
      "integrity": "sha512-MnA+YT8fwfJPgBx3m60MNqakm30XOkyIoH1y6huTQvC0PwZG7ki8NacLBcrPbNoo8vEZy7Jpuk7+jMO+CUovTQ==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">= 14"
      }
    },
    "node_modules/@npmcli/agent/node_modules/https-proxy-agent": {
      "version": "7.0.6",
      "resolved": "https://registry.npmjs.org/https-proxy-agent/-/https-proxy-agent-7.0.6.tgz",
      "integrity": "sha512-vK9P5/iUfdl95AI+JVyUuIcVtd4ofvtrOr3HNtM2yxC9bnMbEdp3x01OhQNnjb8IJYi38VlTE3mBXwcfvywuSw==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "agent-base": "^7.1.2",
        "debug": "4"
      },
      "engines": {
        "node": ">= 14"
      }
    },
    "node_modules/@npmcli/fs": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/@npmcli/fs/-/fs-3.1.1.tgz",
      "integrity": "sha512-q9CRWjpHCMIh5sVyefoD1cA7PkvILqCZsnSOEUUivORLjxCO/Irmue2DprETiNgEqktDBZaM1Bi+jrarx1XdCg==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "semver": "^7.3.5"
      },
      "engines": {
        "node": "^14.17.0 || ^16.13.0 || >=18.0.0"
      }
    },
    "node_modules/@pkgjs/parseargs": {
      "version": "0.11.0",
      "resolved": "https://registry.npmjs.org/@pkgjs/parseargs/-/parseargs-0.11.0.tgz",
      "integrity": "sha512-+1VkjdD0QBLPodGrJUeqarH8VAIvQODIbwh9XpP5Syisf7YoQgsJKPNFoqqLQlu+VQ/tVSshMR6loPMn8U+dPg==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=14"
      }
    },
    "node_modules/@types/w3c-web-usb": {
      "version": "1.0.13",
      "resolved": "https://registry.npmjs.org/@types/w3c-web-usb/-/w3c-web-usb-1.0.13.tgz",
      "integrity": "sha512-N2nSl3Xsx8mRHZBvMSdNGtzMyeleTvtlEw+ujujgXalPqOjIA6UtrqcB6OzyUjkTbDm3J7P1RNK1lgoO7jxtsw==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/abbrev": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/abbrev/-/abbrev-1.1.1.tgz",
      "integrity": "sha512-nne9/IiQ/hzIhY6pdDnbBtz7DjPTKrY00P/zvPSm5pOFkl6xuGrGnXn/VtTNNfNtAfZ9/1RtehkszU9qcTii0Q==",
      "license": "ISC",
      "optional": true
    },
    "node_modules/agent-base": {
      "version": "6.0.2",
      "resolved": "https://registry.npmjs.org/agent-base/-/agent-base-6.0.2.tgz",
      "integrity": "sha512-RZNwNclF7+MS/8bDg70amg32dyeZGZxiDuQmZxKLAlQjr3jGyLx+4Kkk58UO7D2QdgFIQCovuSuZESne6RG6XQ==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "debug": "4"
      },
      "engines": {
        "node": ">= 6.0.0"
      }
    },
    "node_modules/aggregate-error": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/aggregate-error/-/aggregate-error-3.1.0.tgz",
      "integrity": "sha512-4I7Td01quW/RpocfNayFdFVk1qSuoh0E7JrbRJ16nH01HhKFQ88INq9Sd+nd72zqRySlr9BmDA8xlEJ6vJMrYA==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "clean-stack": "^2.0.0",
        "indent-string": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/ansi-regex": {
      "version": "6.2.2",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-6.2.2.tgz",
      "integrity": "sha512-Bq3SmSpyFHaWjPk8If9yc6svM8c56dB5BAtW4Qbw5jHTwwXXcTLoRMkpDJp6VL0XzlWaCHTXrkFURMYmD0sLqg==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-regex?sponsor=1"
      }
    },
    "node_modules/ansi-styles": {
      "version": "6.2.3",
      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-6.2.3.tgz",
      "integrity": "sha512-4Dj6M28JB+oAH8kFkTLUo+a2jwOFkuqb3yucU0CANcRRUbxS0cP0nZYCGjcc3BNXwRIsUVmDGgzawme7zvJHvg==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
      }
    },
    "node_modules/aproba": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/aproba/-/aproba-2.1.0.tgz",
      "integrity": "sha512-tLIEcj5GuR2RSTnxNKdkK0dJ/GrC7P38sUkiDmDuHfsHmbagTFAxDVIBltoklXEVIQ/f14IL8IMJ5pn9Hez1Ew==",
      "license": "ISC",
      "optional": true
    },
    "node_modules/are-we-there-yet": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/are-we-there-yet/-/are-we-there-yet-2.0.0.tgz",
      "integrity": "sha512-Ci/qENmwHnsYo9xKIcUJN5LeDKdJ6R1Z1j9V/J5wyq8nh/mYPEpIKJbBZXtZjG04HiK7zV/p6Vs9952MrMeUIw==",
      "deprecated": "This package is no longer supported.",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "delegates": "^1.0.0",
        "readable-stream": "^3.6.0"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/balanced-match": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/balanced-match/-/balanced-match-1.0.2.tgz",
      "integrity": "sha512-3oSeUO0TMV67hN1AmbXsK4yaqU7tjiHlbxRDZOpH0KW9+CeX4bRAaX0Anxt0tx2MrpRpWwQaPwIlISEJhYU5Pw==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/brace-expansion": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-2.0.2.tgz",
      "integrity": "sha512-Jt0vHyM+jmUBqojB7E1NIYadt0vI0Qxjxd2TErW94wDz+E2LAm5vKMXXwg6ZZBTHPuUlDgQHKXvjGBdfcF1ZDQ==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "balanced-match": "^1.0.0"
      }
    },
    "node_modules/cacache": {
      "version": "18.0.4",
      "resolved": "https://registry.npmjs.org/cacache/-/cacache-18.0.4.tgz",
      "integrity": "sha512-B+L5iIa9mgcjLbliir2th36yEwPftrzteHYujzsx3dFP/31GCHcIeS8f5MGd80odLOjaOvSpU3EEAmRQptkxLQ==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "@npmcli/fs": "^3.1.0",
        "fs-minipass": "^3.0.0",
        "glob": "^10.2.2",
        "lru-cache": "^10.0.1",
        "minipass": "^7.0.3",
        "minipass-collect": "^2.0.1",
        "minipass-flush": "^1.0.5",
        "minipass-pipeline": "^1.2.4",
        "p-map": "^4.0.0",
        "ssri": "^10.0.0",
        "tar": "^6.1.11",
        "unique-filename": "^3.0.0"
      },
      "engines": {
        "node": "^16.14.0 || >=18.0.0"
      }
    },
    "node_modules/chownr": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/chownr/-/chownr-2.0.0.tgz",
      "integrity": "sha512-bIomtDF5KGpdogkLd9VspvFzk9KfpyyGlS8YFVZl7TGPBHL5snIOnxeshwVgPteQ9b4Eydl+pVbIyE1DcvCWgQ==",
      "license": "ISC",
      "optional": true,
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/clean-stack": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/clean-stack/-/clean-stack-2.2.0.tgz",
      "integrity": "sha512-4diC9HaTE+KRAMWhDhrGOECgWZxoevMc5TlkObMqNSsVU62PYzXZ/SMTjzyGAFF1YusgxGcSWTEXBhp0CPwQ1A==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/color-convert": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/color-convert/-/color-convert-2.0.1.tgz",
      "integrity": "sha512-RRECPsj7iu/xb5oKYcsFHSppFNnsj/52OVTRKb4zP5onXwVF3zVmmToNcOfGC+CRDpfK/U584fMg38ZHCaElKQ==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "color-name": "~1.1.4"
      },
      "engines": {
        "node": ">=7.0.0"
      }
    },
    "node_modules/color-name": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/color-name/-/color-name-1.1.4.tgz",
      "integrity": "sha512-dOy+3AuW3a2wNbZHIuMZpTcgjGuLU/uBL/ubcZF9OXbDo8ff4O8yVp5Bf0efS8uEoYo5q4Fx7dY9OgQGXgAsQA==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/color-support": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/color-support/-/color-support-1.1.3.tgz",
      "integrity": "sha512-qiBjkpbMLO/HL68y+lh4q0/O1MZFj2RX6X/KmMa3+gJD3z+WwI1ZzDHysvqHGS3mP6mznPckpXmw1nI9cJjyRg==",
      "license": "ISC",
      "optional": true,
      "bin": {
        "color-support": "bin.js"
      }
    },
    "node_modules/concat-map": {
      "version": "0.0.1",
      "resolved": "https://registry.npmjs.org/concat-map/-/concat-map-0.0.1.tgz",
      "integrity": "sha512-/Srv4dswyQNBfohGpz9o6Yb3Gz3SrUDqBH5rTuhGR7ahtlbYKnVxw2bCFMRljaA7EXHaXZ8wsHdodFvbkhKmqg==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/console-control-strings": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/console-control-strings/-/console-control-strings-1.1.0.tgz",
      "integrity": "sha512-ty/fTekppD2fIwRvnZAVdeOiGd1c7YXEixbgJTNzqcxJWKQnjJ/V1bNEEE6hygpM3WjwHFUVK6HTjWSzV4a8sQ==",
      "license": "ISC",
      "optional": true
    },
    "node_modules/cross-spawn": {
      "version": "7.0.6",
      "resolved": "https://registry.npmjs.org/cross-spawn/-/cross-spawn-7.0.6.tgz",
      "integrity": "sha512-uV2QOWP2nWzsy2aMp8aRibhi9dlzF5Hgh5SHaB9OiTGEyDTiJJyx0uy51QXdyWbtAHNua4XJzUKca3OzKUd3vA==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "path-key": "^3.1.0",
        "shebang-command": "^2.0.0",
        "which": "^2.0.1"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/cross-spawn/node_modules/isexe": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/isexe/-/isexe-2.0.0.tgz",
      "integrity": "sha512-RHxMLp9lnKHGHRng9QFhRCMbYAcVpn69smSGcq3f36xjgVVWThj4qqLbTLlq7Ssj8B+fIQ1EuCEGI2lKsyQeIw==",
      "license": "ISC",
      "optional": true
    },
    "node_modules/cross-spawn/node_modules/which": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/which/-/which-2.0.2.tgz",
      "integrity": "sha512-BLI3Tl1TW3Pvl70l3yq3Y64i+awpwXqsGBYWkkqMtnbXgrMD+yj7rhW0kuEDxzJaYXGjEW5ogapKNMEKNMjibA==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "isexe": "^2.0.0"
      },
      "bin": {
        "node-which": "bin/node-which"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/debug": {
      "version": "4.4.3",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.4.3.tgz",
      "integrity": "sha512-RGwwWnwQvkVfavKVt22FGLw+xYSdzARwm0ru6DhTVA3umU5hZc28V3kO4stgYryrTlLpuvgI9GiijltAjNbcqA==",
      "license": "MIT",
      "dependencies": {
        "ms": "^2.1.3"
      },
      "engines": {
        "node": ">=6.0"
      },
      "peerDependenciesMeta": {
        "supports-color": {
          "optional": true
        }
      }
    },
    "node_modules/delegates": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/delegates/-/delegates-1.0.0.tgz",
      "integrity": "sha512-bd2L678uiWATM6m5Z1VzNCErI3jiGzt6HGY8OVICs40JQq/HALfbyNJmp0UDakEY4pMMaN0Ly5om/B1VI/+xfQ==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/detect-libc": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/detect-libc/-/detect-libc-2.1.2.tgz",
      "integrity": "sha512-Btj2BOOO83o3WyH59e8MgXsxEQVcarkUOpEYrubB0urwnN10yQ364rsiByU11nZlqWYZm05i/of7io4mzihBtQ==",
      "license": "Apache-2.0",
      "optional": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/eastasianwidth": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/eastasianwidth/-/eastasianwidth-0.2.0.tgz",
      "integrity": "sha512-I88TYZWc9XiYHRQ4/3c5rjjfgkjhLyW2luGIheGERbNQ6OY7yTybanSpDXZa8y7VUP9YmDcYa+eyq4ca7iLqWA==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/emoji-regex": {
      "version": "9.2.2",
      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-9.2.2.tgz",
      "integrity": "sha512-L18DaJsXSUk2+42pv8mLs5jJT2hqFkFE4j21wOmgbUqsZ2hL72NsUU785g9RXgo3s0ZNgVl42TiHp3ZtOv/Vyg==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/env-paths": {
      "version": "2.2.1",
      "resolved": "https://registry.npmjs.org/env-paths/-/env-paths-2.2.1.tgz",
      "integrity": "sha512-+h1lkLKhZMTYjog1VEpJNG7NZJWcuc2DDk/qsqSTRRCOXiLjeQ1d1/udrUGhqMxUgAlwKNZ0cf2uqan5GLuS2A==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/err-code": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/err-code/-/err-code-2.0.3.tgz",
      "integrity": "sha512-2bmlRpNKBxT/CRmPOlyISQpNj+qSeYvcym/uT0Jx2bMOlKLtSy1ZmLuVxSEKKyor/N5yhvp/ZiG1oE3DEYMSFA==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/exponential-backoff": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/exponential-backoff/-/exponential-backoff-3.1.2.tgz",
      "integrity": "sha512-8QxYTVXUkuy7fIIoitQkPwGonB8F3Zj8eEO8Sqg9Zv/bkI7RJAzowee4gr81Hak/dUTpA2Z7VfQgoijjPNlUZA==",
      "license": "Apache-2.0",
      "optional": true
    },
    "node_modules/foreground-child": {
      "version": "3.3.1",
      "resolved": "https://registry.npmjs.org/foreground-child/-/foreground-child-3.3.1.tgz",
      "integrity": "sha512-gIXjKqtFuWEgzFRJA9WCQeSJLZDjgJUOMCMzxtvFq/37KojM1BFGufqsCy0r4qSQmYLsZYMeyRqzIWOMup03sw==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "cross-spawn": "^7.0.6",
        "signal-exit": "^4.0.1"
      },
      "engines": {
        "node": ">=14"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/fs-minipass": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/fs-minipass/-/fs-minipass-3.0.3.tgz",
      "integrity": "sha512-XUBA9XClHbnJWSfBzjkm6RvPsyg3sryZt06BEQoXcF7EK/xpGaQYJgQKDJSUH5SGZ76Y7pFx1QBnXz09rU5Fbw==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "minipass": "^7.0.3"
      },
      "engines": {
        "node": "^14.17.0 || ^16.13.0 || >=18.0.0"
      }
    },
    "node_modules/fs.realpath": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/fs.realpath/-/fs.realpath-1.0.0.tgz",
      "integrity": "sha512-OO0pH2lK6a0hZnAdau5ItzHPI6pUlvI7jMVnxUQRtw4owF2wk8lOSabtGDCTP4Ggrg2MbGnWO9X8K1t4+fGMDw==",
      "license": "ISC",
      "optional": true
    },
    "node_modules/gauge": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/gauge/-/gauge-3.0.2.tgz",
      "integrity": "sha512-+5J6MS/5XksCuXq++uFRsnUd7Ovu1XenbeuIuNRJxYWjgQbPuFhT14lAvsWfqfAmnwluf1OwMjz39HjfLPci0Q==",
      "deprecated": "This package is no longer supported.",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "aproba": "^1.0.3 || ^2.0.0",
        "color-support": "^1.1.2",
        "console-control-strings": "^1.0.0",
        "has-unicode": "^2.0.1",
        "object-assign": "^4.1.1",
        "signal-exit": "^3.0.0",
        "string-width": "^4.2.3",
        "strip-ansi": "^6.0.1",
        "wide-align": "^1.1.2"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/gauge/node_modules/ansi-regex": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-5.0.1.tgz",
      "integrity": "sha512-quJQXlTSUGL2LH9SUXo8VwsY4soanhgo6LNSm84E1LBcE8s3O0wpdiRzyR9z/ZZJMlMWv37qOOb9pdJlMUEKFQ==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/gauge/node_modules/emoji-regex": {
      "version": "8.0.0",
      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-8.0.0.tgz",
      "integrity": "sha512-MSjYzcWNOA0ewAHpz0MxpYFvwg6yjy1NG3xteoqz644VCo/RPgnr1/GGt+ic3iJTzQ8Eu3TdM14SawnVUmGE6A==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/gauge/node_modules/signal-exit": {
      "version": "3.0.7",
      "resolved": "https://registry.npmjs.org/signal-exit/-/signal-exit-3.0.7.tgz",
      "integrity": "sha512-wnD2ZE+l+SPC/uoS0vXeE9L1+0wuaMqKlfz9AMUo38JsyLSBWSFcHR1Rri62LZc12vLr1gb3jl7iwQhgwpAbGQ==",
      "license": "ISC",
      "optional": true
    },
    "node_modules/gauge/node_modules/string-width": {
      "version": "4.2.3",
      "resolved": "https://registry.npmjs.org/string-width/-/string-width-4.2.3.tgz",
      "integrity": "sha512-wKyQRQpjJ0sIp62ErSZdGsjMJWsap5oRNihHhu6G7JVO/9jIB6UyevL+tXuOqrng8j/cxKTWyWUwvSTriiZz/g==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "emoji-regex": "^8.0.0",
        "is-fullwidth-code-point": "^3.0.0",
        "strip-ansi": "^6.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/gauge/node_modules/strip-ansi": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-6.0.1.tgz",
      "integrity": "sha512-Y38VPSHcqkFrCpFnQ9vuSXmquuv5oXOKpGeT6aGrr3o3Gc9AlVa6JBfUSOCnbxGGZF+/0ooI7KrPuUSztUdU5A==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "ansi-regex": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/glob": {
      "version": "10.4.5",
      "resolved": "https://registry.npmjs.org/glob/-/glob-10.4.5.tgz",
      "integrity": "sha512-7Bv8RF0k6xjo7d4A/PxYLbUCfb6c+Vpd2/mB2yRDlew7Jb5hEXiCD9ibfO7wpk8i4sevK6DFny9h7EYbM3/sHg==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "foreground-child": "^3.1.0",
        "jackspeak": "^3.1.2",
        "minimatch": "^9.0.4",
        "minipass": "^7.1.2",
        "package-json-from-dist": "^1.0.0",
        "path-scurry": "^1.11.1"
      },
      "bin": {
        "glob": "dist/esm/bin.mjs"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/graceful-fs": {
      "version": "4.2.11",
      "resolved": "https://registry.npmjs.org/graceful-fs/-/graceful-fs-4.2.11.tgz",
      "integrity": "sha512-RbJ5/jmFcNNCcDV5o9eTnBLJ/HszWV0P73bc+Ff4nS/rJj+YaS6IGyiOL0VoBYX+l1Wrl3k63h/KrH+nhJ0XvQ==",
      "license": "ISC",
      "optional": true
    },
    "node_modules/has-unicode": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/has-unicode/-/has-unicode-2.0.1.tgz",
      "integrity": "sha512-8Rf9Y83NBReMnx0gFzA8JImQACstCYWUplepDa9xprwwtmgEZUF0h/i5xSA625zB/I37EtrswSST6OXxwaaIJQ==",
      "license": "ISC",
      "optional": true
    },
    "node_modules/http-cache-semantics": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/http-cache-semantics/-/http-cache-semantics-4.2.0.tgz",
      "integrity": "sha512-dTxcvPXqPvXBQpq5dUr6mEMJX4oIEFv6bwom3FDwKRDsuIjjJGANqhBuoAn9c1RQJIdAKav33ED65E2ys+87QQ==",
      "license": "BSD-2-Clause",
      "optional": true
    },
    "node_modules/http-proxy-agent": {
      "version": "7.0.2",
      "resolved": "https://registry.npmjs.org/http-proxy-agent/-/http-proxy-agent-7.0.2.tgz",
      "integrity": "sha512-T1gkAiYYDWYx3V5Bmyu7HcfcvL7mUrTWiM6yOfa3PIphViJ/gFPbvidQ+veqSOHci/PxBcDabeUNCzpOODJZig==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "agent-base": "^7.1.0",
        "debug": "^4.3.4"
      },
      "engines": {
        "node": ">= 14"
      }
    },
    "node_modules/http-proxy-agent/node_modules/agent-base": {
      "version": "7.1.4",
      "resolved": "https://registry.npmjs.org/agent-base/-/agent-base-7.1.4.tgz",
      "integrity": "sha512-MnA+YT8fwfJPgBx3m60MNqakm30XOkyIoH1y6huTQvC0PwZG7ki8NacLBcrPbNoo8vEZy7Jpuk7+jMO+CUovTQ==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">= 14"
      }
    },
    "node_modules/https-proxy-agent": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/https-proxy-agent/-/https-proxy-agent-5.0.1.tgz",
      "integrity": "sha512-dFcAjpTQFgoLMzC2VwU+C/CbS7uRL0lWmxDITmqm7C+7F0Odmj6s9l6alZc6AELXhrnggM2CeWSXHGOdX2YtwA==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "agent-base": "6",
        "debug": "4"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/iconv-lite": {
      "version": "0.6.3",
      "resolved": "https://registry.npmjs.org/iconv-lite/-/iconv-lite-0.6.3.tgz",
      "integrity": "sha512-4fCk79wshMdzMp2rH06qWrJE4iolqLhCUH+OiuIgU++RB0+94NlDL81atO7GX55uUKueo0txHNtvEyI6D7WdMw==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "safer-buffer": ">= 2.1.2 < 3.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/imurmurhash": {
      "version": "0.1.4",
      "resolved": "https://registry.npmjs.org/imurmurhash/-/imurmurhash-0.1.4.tgz",
      "integrity": "sha512-JmXMZ6wuvDmLiHEml9ykzqO6lwFbof0GG4IkcGaENdCRDDmMVnny7s5HsIgHCbaq0w2MyPhDqkhTUgS2LU2PHA==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=0.8.19"
      }
    },
    "node_modules/indent-string": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/indent-string/-/indent-string-4.0.0.tgz",
      "integrity": "sha512-EdDDZu4A2OyIK7Lr/2zG+w5jmbuk1DVBnEwREQvBzspBJkCEbRa8GxU1lghYcaGJCnRWibjDXlq779X1/y5xwg==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/inflight": {
      "version": "1.0.6",
      "resolved": "https://registry.npmjs.org/inflight/-/inflight-1.0.6.tgz",
      "integrity": "sha512-k92I/b08q4wvFscXCLvqfsHCrjrF7yiXsQuIVvVE7N82W3+aqpzuUdBbfhWcy/FZR3/4IgflMgKLOsvPDrGCJA==",
      "deprecated": "This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "once": "^1.3.0",
        "wrappy": "1"
      }
    },
    "node_modules/inherits": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/inherits/-/inherits-2.0.4.tgz",
      "integrity": "sha512-k/vGaX4/Yla3WzyMCvTQOXYeIHvqOKtnqBduzTHpzpQZzAskKMhZ2K+EnBiSM9zGSoIFeMpXKxa4dYeZIQqewQ==",
      "license": "ISC",
      "optional": true
    },
    "node_modules/ip-address": {
      "version": "10.0.1",
      "resolved": "https://registry.npmjs.org/ip-address/-/ip-address-10.0.1.tgz",
      "integrity": "sha512-NWv9YLW4PoW2B7xtzaS3NCot75m6nK7Icdv0o3lfMceJVRfSoQwqD4wEH5rLwoKJwUiZ/rfpiVBhnaF0FK4HoA==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">= 12"
      }
    },
    "node_modules/is-fullwidth-code-point": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/is-fullwidth-code-point/-/is-fullwidth-code-point-3.0.0.tgz",
      "integrity": "sha512-zymm5+u+sCsSWyD9qNaejV3DFvhCKclKdizYaJUuHA83RLjb7nSuGnddCHGv0hk+KY7BMAlsWeK4Ueg6EV6XQg==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/is-lambda": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/is-lambda/-/is-lambda-1.0.1.tgz",
      "integrity": "sha512-z7CMFGNrENq5iFB9Bqo64Xk6Y9sg+epq1myIcdHaGnbMTYOxvzsEtdYqQUylB7LxfkvgrrjP32T6Ywciio9UIQ==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/isexe": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/isexe/-/isexe-3.1.1.tgz",
      "integrity": "sha512-LpB/54B+/2J5hqQ7imZHfdU31OlgQqx7ZicVlkm9kzg9/w8GKLEcFfJl/t7DCEDueOyBAD6zCCwTO6Fzs0NoEQ==",
      "license": "ISC",
      "optional": true,
      "engines": {
        "node": ">=16"
      }
    },
    "node_modules/jackspeak": {
      "version": "3.4.3",
      "resolved": "https://registry.npmjs.org/jackspeak/-/jackspeak-3.4.3.tgz",
      "integrity": "sha512-OGlZQpz2yfahA/Rd1Y8Cd9SIEsqvXkLVoSw/cgwhnhFMDbsQFeZYoJJ7bIZBS9BcamUW96asq/npPWugM+RQBw==",
      "license": "BlueOak-1.0.0",
      "optional": true,
      "dependencies": {
        "@isaacs/cliui": "^8.0.2"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      },
      "optionalDependencies": {
        "@pkgjs/parseargs": "^0.11.0"
      }
    },
    "node_modules/lru-cache": {
      "version": "10.4.3",
      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-10.4.3.tgz",
      "integrity": "sha512-JNAzZcXrCt42VGLuYz0zfAzDfAvJWW6AfYlDBQyDV5DClI2m5sAmK+OIO7s59XfsRsWHp02jAJrRadPRGTt6SQ==",
      "license": "ISC",
      "optional": true
    },
    "node_modules/make-dir": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/make-dir/-/make-dir-3.1.0.tgz",
      "integrity": "sha512-g3FeP20LNwhALb/6Cz6Dd4F2ngze0jz7tbzrD2wAV+o9FeNHe4rL+yK2md0J/fiSf1sa1ADhXqi5+oVwOM/eGw==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "semver": "^6.0.0"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/make-dir/node_modules/semver": {
      "version": "6.3.1",
      "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.1.tgz",
      "integrity": "sha512-BR7VvDCVHO+q2xBEWskxS6DJE1qRnb7DxzUrogb71CWoSficBxYsiAGd+Kl0mmq/MprG9yArRkyrQxTO6XjMzA==",
      "license": "ISC",
      "optional": true,
      "bin": {
        "semver": "bin/semver.js"
      }
    },
    "node_modules/make-fetch-happen": {
      "version": "13.0.1",
      "resolved": "https://registry.npmjs.org/make-fetch-happen/-/make-fetch-happen-13.0.1.tgz",
      "integrity": "sha512-cKTUFc/rbKUd/9meOvgrpJ2WrNzymt6jfRDdwg5UCnVzv9dTpEj9JS5m3wtziXVCjluIXyL8pcaukYqezIzZQA==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "@npmcli/agent": "^2.0.0",
        "cacache": "^18.0.0",
        "http-cache-semantics": "^4.1.1",
        "is-lambda": "^1.0.1",
        "minipass": "^7.0.2",
        "minipass-fetch": "^3.0.0",
        "minipass-flush": "^1.0.5",
        "minipass-pipeline": "^1.2.4",
        "negotiator": "^0.6.3",
        "proc-log": "^4.2.0",
        "promise-retry": "^2.0.1",
        "ssri": "^10.0.0"
      },
      "engines": {
        "node": "^16.14.0 || >=18.0.0"
      }
    },
    "node_modules/minimatch": {
      "version": "9.0.5",
      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-9.0.5.tgz",
      "integrity": "sha512-G6T0ZX48xgozx7587koeX9Ys2NYy6Gmv//P89sEte9V9whIapMNF4idKxnW2QtCcLiTWlb/wfCabAtAFWhhBow==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "brace-expansion": "^2.0.1"
      },
      "engines": {
        "node": ">=16 || 14 >=14.17"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/minipass": {
      "version": "7.1.2",
      "resolved": "https://registry.npmjs.org/minipass/-/minipass-7.1.2.tgz",
      "integrity": "sha512-qOOzS1cBTWYF4BH8fVePDBOO9iptMnGUEZwNc/cMWnTV2nVLZ7VoNWEPHkYczZA0pdoA7dl6e7FL659nX9S2aw==",
      "license": "ISC",
      "optional": true,
      "engines": {
        "node": ">=16 || 14 >=14.17"
      }
    },
    "node_modules/minipass-collect": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/minipass-collect/-/minipass-collect-2.0.1.tgz",
      "integrity": "sha512-D7V8PO9oaz7PWGLbCACuI1qEOsq7UKfLotx/C0Aet43fCUB/wfQ7DYeq2oR/svFJGYDHPr38SHATeaj/ZoKHKw==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "minipass": "^7.0.3"
      },
      "engines": {
        "node": ">=16 || 14 >=14.17"
      }
    },
    "node_modules/minipass-fetch": {
      "version": "3.0.5",
      "resolved": "https://registry.npmjs.org/minipass-fetch/-/minipass-fetch-3.0.5.tgz",
      "integrity": "sha512-2N8elDQAtSnFV0Dk7gt15KHsS0Fyz6CbYZ360h0WTYV1Ty46li3rAXVOQj1THMNLdmrD9Vt5pBPtWtVkpwGBqg==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "minipass": "^7.0.3",
        "minipass-sized": "^1.0.3",
        "minizlib": "^2.1.2"
      },
      "engines": {
        "node": "^14.17.0 || ^16.13.0 || >=18.0.0"
      },
      "optionalDependencies": {
        "encoding": "^0.1.13"
      }
    },
    "node_modules/minipass-flush": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/minipass-flush/-/minipass-flush-1.0.5.tgz",
      "integrity": "sha512-JmQSYYpPUqX5Jyn1mXaRwOda1uQ8HP5KAT/oDSLCzt1BYRhQU0/hDtsB1ufZfEEzMZ9aAVmsBw8+FWsIXlClWw==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "minipass": "^3.0.0"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/minipass-flush/node_modules/minipass": {
      "version": "3.3.6",
      "resolved": "https://registry.npmjs.org/minipass/-/minipass-3.3.6.tgz",
      "integrity": "sha512-DxiNidxSEK+tHG6zOIklvNOwm3hvCrbUrdtzY74U6HKTJxvIDfOUL5W5P2Ghd3DTkhhKPYGqeNUIh5qcM4YBfw==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "yallist": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/minipass-pipeline": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/minipass-pipeline/-/minipass-pipeline-1.2.4.tgz",
      "integrity": "sha512-xuIq7cIOt09RPRJ19gdi4b+RiNvDFYe5JH+ggNvBqGqpQXcru3PcRmOZuHBKWK1Txf9+cQ+HMVN4d6z46LZP7A==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "minipass": "^3.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/minipass-pipeline/node_modules/minipass": {
      "version": "3.3.6",
      "resolved": "https://registry.npmjs.org/minipass/-/minipass-3.3.6.tgz",
      "integrity": "sha512-DxiNidxSEK+tHG6zOIklvNOwm3hvCrbUrdtzY74U6HKTJxvIDfOUL5W5P2Ghd3DTkhhKPYGqeNUIh5qcM4YBfw==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "yallist": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/minipass-sized": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/minipass-sized/-/minipass-sized-1.0.3.tgz",
      "integrity": "sha512-MbkQQ2CTiBMlA2Dm/5cY+9SWFEN8pzzOXi6rlM5Xxq0Yqbda5ZQy9sU75a673FE9ZK0Zsbr6Y5iP6u9nktfg2g==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "minipass": "^3.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/minipass-sized/node_modules/minipass": {
      "version": "3.3.6",
      "resolved": "https://registry.npmjs.org/minipass/-/minipass-3.3.6.tgz",
      "integrity": "sha512-DxiNidxSEK+tHG6zOIklvNOwm3hvCrbUrdtzY74U6HKTJxvIDfOUL5W5P2Ghd3DTkhhKPYGqeNUIh5qcM4YBfw==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "yallist": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/minizlib": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/minizlib/-/minizlib-2.1.2.tgz",
      "integrity": "sha512-bAxsR8BVfj60DWXHE3u30oHzfl4G7khkSuPW+qvpd7jFRHm7dLxOjUk1EHACJ/hxLY8phGJ0YhYHZo7jil7Qdg==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "minipass": "^3.0.0",
        "yallist": "^4.0.0"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/minizlib/node_modules/minipass": {
      "version": "3.3.6",
      "resolved": "https://registry.npmjs.org/minipass/-/minipass-3.3.6.tgz",
      "integrity": "sha512-DxiNidxSEK+tHG6zOIklvNOwm3hvCrbUrdtzY74U6HKTJxvIDfOUL5W5P2Ghd3DTkhhKPYGqeNUIh5qcM4YBfw==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "yallist": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/mkdirp": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/mkdirp/-/mkdirp-1.0.4.tgz",
      "integrity": "sha512-vVqVZQyf3WLx2Shd0qJ9xuvqgAyKPLAiqITEtqW0oIUjzo3PePDd6fW9iFz30ef7Ysp/oiWqbhszeGWW2T6Gzw==",
      "license": "MIT",
      "optional": true,
      "bin": {
        "mkdirp": "bin/cmd.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/ms": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
      "license": "MIT"
    },
    "node_modules/nan": {
      "version": "2.23.0",
      "resolved": "https://registry.npmjs.org/nan/-/nan-2.23.0.tgz",
      "integrity": "sha512-1UxuyYGdoQHcGg87Lkqm3FzefucTa0NAiOcuRsDmysep3c1LVCRK2krrUDafMWtjSG04htvAmvg96+SDknOmgQ==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/napi-thread-safe-callback": {
      "version": "0.0.6",
      "resolved": "https://registry.npmjs.org/napi-thread-safe-callback/-/napi-thread-safe-callback-0.0.6.tgz",
      "integrity": "sha512-X7uHCOCdY4u0yamDxDrv3jF2NtYc8A1nvPzBQgvpoSX+WB3jAe2cVNsY448V1ucq7Whf9Wdy02HEUoLW5rJKWg==",
      "license": "ISC"
    },
    "node_modules/negotiator": {
      "version": "0.6.4",
      "resolved": "https://registry.npmjs.org/negotiator/-/negotiator-0.6.4.tgz",
      "integrity": "sha512-myRT3DiWPHqho5PrJaIRyaMv2kgYf0mUVgBNOYMuCH5Ki1yEiQaf/ZJuQ62nvpc44wL5WDbTX7yGJi1Neevw8w==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/node-addon-api": {
      "version": "8.5.0",
      "resolved": "https://registry.npmjs.org/node-addon-api/-/node-addon-api-8.5.0.tgz",
      "integrity": "sha512-/bRZty2mXUIFY/xU5HLvveNHlswNJej+RnxBjOMkidWfwZzgTbPG1E3K5TOxRLOR+5hX7bSofy8yf1hZevMS8A==",
      "license": "MIT",
      "engines": {
        "node": "^18 || ^20 || >= 21"
      }
    },
    "node_modules/node-fetch": {
      "version": "2.7.0",
      "resolved": "https://registry.npmjs.org/node-fetch/-/node-fetch-2.7.0.tgz",
      "integrity": "sha512-c4FRfUm/dbcWZ7U+1Wq0AwCyFL+3nt2bEw05wfxSz+DWpWsitgmSgYmy2dQdWyKC1694ELPqMs/YzUSNozLt8A==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "whatwg-url": "^5.0.0"
      },
      "engines": {
        "node": "4.x || >=6.0.0"
      },
      "peerDependencies": {
        "encoding": "^0.1.0"
      },
      "peerDependenciesMeta": {
        "encoding": {
          "optional": true
        }
      }
    },
    "node_modules/node-gyp": {
      "version": "10.3.1",
      "resolved": "https://registry.npmjs.org/node-gyp/-/node-gyp-10.3.1.tgz",
      "integrity": "sha512-Pp3nFHBThHzVtNY7U6JfPjvT/DTE8+o/4xKsLQtBoU+j2HLsGlhcfzflAoUreaJbNmYnX+LlLi0qjV8kpyO6xQ==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "env-paths": "^2.2.0",
        "exponential-backoff": "^3.1.1",
        "glob": "^10.3.10",
        "graceful-fs": "^4.2.6",
        "make-fetch-happen": "^13.0.0",
        "nopt": "^7.0.0",
        "proc-log": "^4.1.0",
        "semver": "^7.3.5",
        "tar": "^6.2.1",
        "which": "^4.0.0"
      },
      "bin": {
        "node-gyp": "bin/node-gyp.js"
      },
      "engines": {
        "node": "^16.14.0 || >=18.0.0"
      }
    },
    "node_modules/node-gyp-build": {
      "version": "4.8.4",
      "resolved": "https://registry.npmjs.org/node-gyp-build/-/node-gyp-build-4.8.4.tgz",
      "integrity": "sha512-LA4ZjwlnUblHVgq0oBF3Jl/6h/Nvs5fzBLwdEF4nuxnFdsfajde4WfxtJr3CaiH+F6ewcIB/q4jQ4UzPyid+CQ==",
      "license": "MIT",
      "bin": {
        "node-gyp-build": "bin.js",
        "node-gyp-build-optional": "optional.js",
        "node-gyp-build-test": "build-test.js"
      }
    },
    "node_modules/node-gyp/node_modules/abbrev": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/abbrev/-/abbrev-2.0.0.tgz",
      "integrity": "sha512-6/mh1E2u2YgEsCHdY0Yx5oW+61gZU+1vXaoiHHrpKeuRNNgFvS+/jrwHiQhB5apAf5oB7UB7E19ol2R2LKH8hQ==",
      "license": "ISC",
      "optional": true,
      "engines": {
        "node": "^14.17.0 || ^16.13.0 || >=18.0.0"
      }
    },
    "node_modules/node-gyp/node_modules/nopt": {
      "version": "7.2.1",
      "resolved": "https://registry.npmjs.org/nopt/-/nopt-7.2.1.tgz",
      "integrity": "sha512-taM24ViiimT/XntxbPyJQzCG+p4EKOpgD3mxFwW38mGjVUrfERQOeY4EDHjdnptttfHuHQXFx+lTP08Q+mLa/w==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "abbrev": "^2.0.0"
      },
      "bin": {
        "nopt": "bin/nopt.js"
      },
      "engines": {
        "node": "^14.17.0 || ^16.13.0 || >=18.0.0"
      }
    },
    "node_modules/nopt": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/nopt/-/nopt-5.0.0.tgz",
      "integrity": "sha512-Tbj67rffqceeLpcRXrT7vKAN8CwfPeIBgM7E6iBkmKLV7bEMwpGgYLGv0jACUsECaa/vuxP0IjEont6umdMgtQ==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "abbrev": "1"
      },
      "bin": {
        "nopt": "bin/nopt.js"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/npmlog": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/npmlog/-/npmlog-5.0.1.tgz",
      "integrity": "sha512-AqZtDUWOMKs1G/8lwylVjrdYgqA4d9nu8hc+0gzRxlDb1I10+FHBGMXs6aiQHFdCUUlqH99MUMuLfzWDNDtfxw==",
      "deprecated": "This package is no longer supported.",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "are-we-there-yet": "^2.0.0",
        "console-control-strings": "^1.1.0",
        "gauge": "^3.0.0",
        "set-blocking": "^2.0.0"
      }
    },
    "node_modules/object-assign": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/object-assign/-/object-assign-4.1.1.tgz",
      "integrity": "sha512-rJgTQnkUnH1sFw8yT6VSU3zD3sWmu6sZhIseY8VX+GRu3P6F7Fu+JNDoXfklElbLJSnc3FUQHVe4cU5hj+BcUg==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/once": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/once/-/once-1.4.0.tgz",
      "integrity": "sha512-lNaJgI+2Q5URQBkccEKHTQOPaXdUxnZZElQTZY0MFUAuaEqe1E+Nyvgdz/aIyNi6Z9MzO5dv1H8n58/GELp3+w==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "wrappy": "1"
      }
    },
    "node_modules/p-map": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/p-map/-/p-map-4.0.0.tgz",
      "integrity": "sha512-/bjOqmgETBYB5BoEeGVea8dmvHb2m9GLy1E9W43yeyfP6QQCZGFNa+XRceJEuDB6zqr+gKpIAmlLebMpykw/MQ==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "aggregate-error": "^3.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/package-json-from-dist": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/package-json-from-dist/-/package-json-from-dist-1.0.1.tgz",
      "integrity": "sha512-UEZIS3/by4OC8vL3P2dTXRETpebLI2NiI5vIrjaD/5UtrkFX/tNbwjTSRAGC/+7CAo2pIcBaRgWmcBBHcsaCIw==",
      "license": "BlueOak-1.0.0",
      "optional": true
    },
    "node_modules/path-is-absolute": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/path-is-absolute/-/path-is-absolute-1.0.1.tgz",
      "integrity": "sha512-AVbw3UJ2e9bq64vSaS9Am0fje1Pa8pbGqTTsmXfaIiMpnr5DlDhfJOuLj9Sf95ZPVDAUerDfEk88MPmPe7UCQg==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/path-key": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/path-key/-/path-key-3.1.1.tgz",
      "integrity": "sha512-ojmeN0qd+y0jszEtoY48r0Peq5dwMEkIlCOu6Q5f41lfkswXuKtYrhgoTpLnyIcHm24Uhqx+5Tqm2InSwLhE6Q==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/path-scurry": {
      "version": "1.11.1",
      "resolved": "https://registry.npmjs.org/path-scurry/-/path-scurry-1.11.1.tgz",
      "integrity": "sha512-Xa4Nw17FS9ApQFJ9umLiJS4orGjm7ZzwUrwamcGQuHSzDyth9boKDaycYdDcZDuqYATXw4HFXgaqWTctW/v1HA==",
      "license": "BlueOak-1.0.0",
      "optional": true,
      "dependencies": {
        "lru-cache": "^10.2.0",
        "minipass": "^5.0.0 || ^6.0.2 || ^7.0.0"
      },
      "engines": {
        "node": ">=16 || 14 >=14.18"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/proc-log": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/proc-log/-/proc-log-4.2.0.tgz",
      "integrity": "sha512-g8+OnU/L2v+wyiVK+D5fA34J7EH8jZ8DDlvwhRCMxmMj7UCBvxiO1mGeN+36JXIKF4zevU4kRBd8lVgG9vLelA==",
      "license": "ISC",
      "optional": true,
      "engines": {
        "node": "^14.17.0 || ^16.13.0 || >=18.0.0"
      }
    },
    "node_modules/promise-retry": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/promise-retry/-/promise-retry-2.0.1.tgz",
      "integrity": "sha512-y+WKFlBR8BGXnsNlIHFGPZmyDf3DFMoLhaflAnyZgV6rG6xu+JwesTo2Q9R6XwYmtmwAFCkAk3e35jEdoeh/3g==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "err-code": "^2.0.2",
        "retry": "^0.12.0"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/readable-stream": {
      "version": "3.6.2",
      "resolved": "https://registry.npmjs.org/readable-stream/-/readable-stream-3.6.2.tgz",
      "integrity": "sha512-9u/sniCrY3D5WdsERHzHE4G2YCXqoG5FTHUiCC4SIbr6XcLZBY05ya9EKjYek9O5xOAwjGq+1JdGBAS7Q9ScoA==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "inherits": "^2.0.3",
        "string_decoder": "^1.1.1",
        "util-deprecate": "^1.0.1"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/retry": {
      "version": "0.12.0",
      "resolved": "https://registry.npmjs.org/retry/-/retry-0.12.0.tgz",
      "integrity": "sha512-9LkiTwjUh6rT555DtE9rTX+BKByPfrMzEAtnlEtdEwr3Nkffwiihqe2bWADg+OQRjt9gl6ICdmB/ZFDCGAtSow==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">= 4"
      }
    },
    "node_modules/rimraf": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/rimraf/-/rimraf-3.0.2.tgz",
      "integrity": "sha512-JZkJMZkAGFFPP2YqXZXPbMlMBgsxzE8ILs4lMIX/2o0L9UBw9O/Y3o6wFw/i9YLapcUJWwqbi3kdxIPdC62TIA==",
      "deprecated": "Rimraf versions prior to v4 are no longer supported",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "glob": "^7.1.3"
      },
      "bin": {
        "rimraf": "bin.js"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/rimraf/node_modules/brace-expansion": {
      "version": "1.1.12",
      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-1.1.12.tgz",
      "integrity": "sha512-9T9UjW3r0UW5c1Q7GTwllptXwhvYmEzFhzMfZ9H7FQWt+uZePjZPjBP/W1ZEyZ1twGWom5/56TF4lPcqjnDHcg==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "balanced-match": "^1.0.0",
        "concat-map": "0.0.1"
      }
    },
    "node_modules/rimraf/node_modules/glob": {
      "version": "7.2.3",
      "resolved": "https://registry.npmjs.org/glob/-/glob-7.2.3.tgz",
      "integrity": "sha512-nFR0zLpU2YCaRxwoCJvL6UvCH2JFyFVIvwTLsIf21AuHlMskA1hhTdk+LlYJtOlYt9v6dvszD2BGRqBL+iQK9Q==",
      "deprecated": "Glob versions prior to v9 are no longer supported",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "fs.realpath": "^1.0.0",
        "inflight": "^1.0.4",
        "inherits": "2",
        "minimatch": "^3.1.1",
        "once": "^1.3.0",
        "path-is-absolute": "^1.0.0"
      },
      "engines": {
        "node": "*"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/rimraf/node_modules/minimatch": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-3.1.2.tgz",
      "integrity": "sha512-J7p63hRiAjw1NDEww1W7i37+ByIrOWO5XQQAzZ3VOcL0PNybwpfmV/N05zFAzwQ9USyEcX6t3UO+K5aqBQOIHw==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "brace-expansion": "^1.1.7"
      },
      "engines": {
        "node": "*"
      }
    },
    "node_modules/safe-buffer": {
      "version": "5.2.1",
      "resolved": "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.2.1.tgz",
      "integrity": "sha512-rp3So07KcdmmKbGvgaNxQSJr7bGVSVk5S9Eq1F+ppbRo70+YeaDxkw5Dd8NPN+GD6bjnYm2VuPuCXmpuYvmCXQ==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT",
      "optional": true
    },
    "node_modules/safer-buffer": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/safer-buffer/-/safer-buffer-2.1.2.tgz",
      "integrity": "sha512-YZo3K82SD7Riyi0E1EQPojLz7kpepnSQI9IyPbHHg1XXXevb5dJI7tpyN2ADxGcQbHG7vcyRHk0cbwqcQriUtg==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/semver": {
      "version": "7.7.3",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.7.3.tgz",
      "integrity": "sha512-SdsKMrI9TdgjdweUSR9MweHA4EJ8YxHn8DFaDisvhVlUOe4BF1tLD7GAj0lIqWVl+dPb/rExr0Btby5loQm20Q==",
      "license": "ISC",
      "optional": true,
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/set-blocking": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/set-blocking/-/set-blocking-2.0.0.tgz",
      "integrity": "sha512-KiKBS8AnWGEyLzofFfmvKwpdPzqiy16LvQfK3yv/fVH7Bj13/wl3JSR1J+rfgRE9q7xUJK4qvgS8raSOeLUehw==",
      "license": "ISC",
      "optional": true
    },
    "node_modules/shebang-command": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/shebang-command/-/shebang-command-2.0.0.tgz",
      "integrity": "sha512-kHxr2zZpYtdmrN1qDjrrX/Z1rR1kG8Dx+gkpK1G4eXmvXswmcE1hTWBWYUzlraYw1/yZp6YuDY77YtvbN0dmDA==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "shebang-regex": "^3.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/shebang-regex": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/shebang-regex/-/shebang-regex-3.0.0.tgz",
      "integrity": "sha512-7++dFhtcx3353uBaq8DDR4NuxBetBzC7ZQOhmTQInHEd6bSrXdiEyzCvG07Z44UYdLShWUyXt5M/yhz8ekcb1A==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/signal-exit": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/signal-exit/-/signal-exit-4.1.0.tgz",
      "integrity": "sha512-bzyZ1e88w9O1iNJbKnOlvYTrWPDl46O1bG0D3XInv+9tkPrxrN8jUUTiFlDkkmKWgn1M6CfIA13SuGqOa9Korw==",
      "license": "ISC",
      "optional": true,
      "engines": {
        "node": ">=14"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/smart-buffer": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/smart-buffer/-/smart-buffer-4.2.0.tgz",
      "integrity": "sha512-94hK0Hh8rPqQl2xXc3HsaBoOXKV20MToPkcXvwbISWLEs+64sBq5kFgn2kJDHb1Pry9yrP0dxrCI9RRci7RXKg==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">= 6.0.0",
        "npm": ">= 3.0.0"
      }
    },
    "node_modules/socks": {
      "version": "2.8.7",
      "resolved": "https://registry.npmjs.org/socks/-/socks-2.8.7.tgz",
      "integrity": "sha512-HLpt+uLy/pxB+bum/9DzAgiKS8CX1EvbWxI4zlmgGCExImLdiad2iCwXT5Z4c9c3Eq8rP2318mPW2c+QbtjK8A==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "ip-address": "^10.0.1",
        "smart-buffer": "^4.2.0"
      },
      "engines": {
        "node": ">= 10.0.0",
        "npm": ">= 3.0.0"
      }
    },
    "node_modules/socks-proxy-agent": {
      "version": "8.0.5",
      "resolved": "https://registry.npmjs.org/socks-proxy-agent/-/socks-proxy-agent-8.0.5.tgz",
      "integrity": "sha512-HehCEsotFqbPW9sJ8WVYB6UbmIMv7kUUORIF2Nncq4VQvBfNBLibW9YZR5dlYCSUhwcD628pRllm7n+E+YTzJw==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "agent-base": "^7.1.2",
        "debug": "^4.3.4",
        "socks": "^2.8.3"
      },
      "engines": {
        "node": ">= 14"
      }
    },
    "node_modules/socks-proxy-agent/node_modules/agent-base": {
      "version": "7.1.4",
      "resolved": "https://registry.npmjs.org/agent-base/-/agent-base-7.1.4.tgz",
      "integrity": "sha512-MnA+YT8fwfJPgBx3m60MNqakm30XOkyIoH1y6huTQvC0PwZG7ki8NacLBcrPbNoo8vEZy7Jpuk7+jMO+CUovTQ==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">= 14"
      }
    },
    "node_modules/ssri": {
      "version": "10.0.6",
      "resolved": "https://registry.npmjs.org/ssri/-/ssri-10.0.6.tgz",
      "integrity": "sha512-MGrFH9Z4NP9Iyhqn16sDtBpRRNJ0Y2hNa6D65h736fVSaPCHr4DM4sWUNvVaSuC+0OBGhwsrydQwmgfg5LncqQ==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "minipass": "^7.0.3"
      },
      "engines": {
        "node": "^14.17.0 || ^16.13.0 || >=18.0.0"
      }
    },
    "node_modules/string_decoder": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/string_decoder/-/string_decoder-1.3.0.tgz",
      "integrity": "sha512-hkRX8U1WjJFd8LsDJ2yQ/wWWxaopEsABU1XfkM8A+j0+85JAGppt16cr1Whg6KIbb4okU6Mql6BOj+uup/wKeA==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "safe-buffer": "~5.2.0"
      }
    },
    "node_modules/string-width": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/string-width/-/string-width-5.1.2.tgz",
      "integrity": "sha512-HnLOCR3vjcY8beoNLtcjZ5/nxn2afmME6lhrDrebokqMap+XbeW8n9TXpPDOqdGK5qcI3oT0GKTW6wC7EMiVqA==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "eastasianwidth": "^0.2.0",
        "emoji-regex": "^9.2.2",
        "strip-ansi": "^7.0.1"
      },
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/string-width-cjs": {
      "name": "string-width",
      "version": "4.2.3",
      "resolved": "https://registry.npmjs.org/string-width/-/string-width-4.2.3.tgz",
      "integrity": "sha512-wKyQRQpjJ0sIp62ErSZdGsjMJWsap5oRNihHhu6G7JVO/9jIB6UyevL+tXuOqrng8j/cxKTWyWUwvSTriiZz/g==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "emoji-regex": "^8.0.0",
        "is-fullwidth-code-point": "^3.0.0",
        "strip-ansi": "^6.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/string-width-cjs/node_modules/ansi-regex": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-5.0.1.tgz",
      "integrity": "sha512-quJQXlTSUGL2LH9SUXo8VwsY4soanhgo6LNSm84E1LBcE8s3O0wpdiRzyR9z/ZZJMlMWv37qOOb9pdJlMUEKFQ==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/string-width-cjs/node_modules/emoji-regex": {
      "version": "8.0.0",
      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-8.0.0.tgz",
      "integrity": "sha512-MSjYzcWNOA0ewAHpz0MxpYFvwg6yjy1NG3xteoqz644VCo/RPgnr1/GGt+ic3iJTzQ8Eu3TdM14SawnVUmGE6A==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/string-width-cjs/node_modules/strip-ansi": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-6.0.1.tgz",
      "integrity": "sha512-Y38VPSHcqkFrCpFnQ9vuSXmquuv5oXOKpGeT6aGrr3o3Gc9AlVa6JBfUSOCnbxGGZF+/0ooI7KrPuUSztUdU5A==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "ansi-regex": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/strip-ansi": {
      "version": "7.1.2",
      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-7.1.2.tgz",
      "integrity": "sha512-gmBGslpoQJtgnMAvOVqGZpEz9dyoKTCzy2nfz/n8aIFhN/jCE/rCmcxabB6jOOHV+0WNnylOxaxBQPSvcWklhA==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "ansi-regex": "^6.0.1"
      },
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/chalk/strip-ansi?sponsor=1"
      }
    },
    "node_modules/strip-ansi-cjs": {
      "name": "strip-ansi",
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-6.0.1.tgz",
      "integrity": "sha512-Y38VPSHcqkFrCpFnQ9vuSXmquuv5oXOKpGeT6aGrr3o3Gc9AlVa6JBfUSOCnbxGGZF+/0ooI7KrPuUSztUdU5A==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "ansi-regex": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/strip-ansi-cjs/node_modules/ansi-regex": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-5.0.1.tgz",
      "integrity": "sha512-quJQXlTSUGL2LH9SUXo8VwsY4soanhgo6LNSm84E1LBcE8s3O0wpdiRzyR9z/ZZJMlMWv37qOOb9pdJlMUEKFQ==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/tar": {
      "version": "6.2.1",
      "resolved": "https://registry.npmjs.org/tar/-/tar-6.2.1.tgz",
      "integrity": "sha512-DZ4yORTwrbTj/7MZYq2w+/ZFdI6OZ/f9SFHR+71gIVUZhOQPHzVCLpvRnPgyaMpfWxxk/4ONva3GQSyNIKRv6A==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "chownr": "^2.0.0",
        "fs-minipass": "^2.0.0",
        "minipass": "^5.0.0",
        "minizlib": "^2.1.1",
        "mkdirp": "^1.0.3",
        "yallist": "^4.0.0"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/tar/node_modules/fs-minipass": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/fs-minipass/-/fs-minipass-2.1.0.tgz",
      "integrity": "sha512-V/JgOLFCS+R6Vcq0slCuaeWEdNC3ouDlJMNIsacH2VtALiu9mV4LPrHc5cDl8k5aw6J8jwgWWpiTo5RYhmIzvg==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "minipass": "^3.0.0"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/tar/node_modules/fs-minipass/node_modules/minipass": {
      "version": "3.3.6",
      "resolved": "https://registry.npmjs.org/minipass/-/minipass-3.3.6.tgz",
      "integrity": "sha512-DxiNidxSEK+tHG6zOIklvNOwm3hvCrbUrdtzY74U6HKTJxvIDfOUL5W5P2Ghd3DTkhhKPYGqeNUIh5qcM4YBfw==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "yallist": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/tar/node_modules/minipass": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/minipass/-/minipass-5.0.0.tgz",
      "integrity": "sha512-3FnjYuehv9k6ovOEbyOswadCDPX1piCfhV8ncmYtHOjuPwylVWsghTLo7rabjC3Rx5xD4HDx8Wm1xnMF7S5qFQ==",
      "license": "ISC",
      "optional": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/tr46": {
      "version": "0.0.3",
      "resolved": "https://registry.npmjs.org/tr46/-/tr46-0.0.3.tgz",
      "integrity": "sha512-N3WMsuqV66lT30CrXNbEjx4GEwlow3v6rr4mCcv6prnfwhS01rkgyFdjPNBYd9br7LpXV1+Emh01fHnq2Gdgrw==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/unique-filename": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/unique-filename/-/unique-filename-3.0.0.tgz",
      "integrity": "sha512-afXhuC55wkAmZ0P18QsVE6kp8JaxrEokN2HGIoIVv2ijHQd419H0+6EigAFcIzXeMIkcIkNBpB3L/DXB3cTS/g==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "unique-slug": "^4.0.0"
      },
      "engines": {
        "node": "^14.17.0 || ^16.13.0 || >=18.0.0"
      }
    },
    "node_modules/unique-slug": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/unique-slug/-/unique-slug-4.0.0.tgz",
      "integrity": "sha512-WrcA6AyEfqDX5bWige/4NQfPZMtASNVxdmWR76WESYQVAACSgWcR6e9i0mofqqBxYFtL4oAxPIptY73/0YE1DQ==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "imurmurhash": "^0.1.4"
      },
      "engines": {
        "node": "^14.17.0 || ^16.13.0 || >=18.0.0"
      }
    },
    "node_modules/usb": {
      "version": "2.16.0",
      "resolved": "https://registry.npmjs.org/usb/-/usb-2.16.0.tgz",
      "integrity": "sha512-jD88fvzDViMDH5KmmNJgzMBDj/95bDTt6+kBNaNxP4G98xUTnDMiLUY2CYmToba6JAFhM9VkcaQuxCNRLGR7zg==",
      "hasInstallScript": true,
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "@types/w3c-web-usb": "^1.0.6",
        "node-addon-api": "^8.0.0",
        "node-gyp-build": "^4.5.0"
      },
      "engines": {
        "node": ">=12.22.0 <13.0 || >=14.17.0"
      }
    },
    "node_modules/util-deprecate": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/util-deprecate/-/util-deprecate-1.0.2.tgz",
      "integrity": "sha512-EPD5q1uXyFxJpCrLnCc1nHnq3gOa6DZBocAIiI2TaSCA7VCJ1UJDMagCzIkXNsUYfD1daK//LTEQ8xiIbrHtcw==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/webidl-conversions": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/webidl-conversions/-/webidl-conversions-3.0.1.tgz",
      "integrity": "sha512-2JAn3z8AR6rjK8Sm8orRC0h/bcl/DqL7tRPdGZ4I1CjdF+EaMLmYxBHyXuKL849eucPFhvBoxMsflfOb8kxaeQ==",
      "license": "BSD-2-Clause",
      "optional": true
    },
    "node_modules/whatwg-url": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/whatwg-url/-/whatwg-url-5.0.0.tgz",
      "integrity": "sha512-saE57nupxk6v3HY35+jzBwYa0rKSy0XR8JSxZPwgLr7ys0IBzhGviA1/TUGJLmSVqs8pb9AnvICXEuOHLprYTw==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "tr46": "~0.0.3",
        "webidl-conversions": "^3.0.0"
      }
    },
    "node_modules/which": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/which/-/which-4.0.0.tgz",
      "integrity": "sha512-GlaYyEb07DPxYCKhKzplCWBJtvxZcZMrL+4UkrTSJHHPyZU4mYYTv3qaOe77H7EODLSSopAUFAc6W8U4yqvscg==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "isexe": "^3.1.1"
      },
      "bin": {
        "node-which": "bin/which.js"
      },
      "engines": {
        "node": "^16.13.0 || >=18.0.0"
      }
    },
    "node_modules/wide-align": {
      "version": "1.1.5",
      "resolved": "https://registry.npmjs.org/wide-align/-/wide-align-1.1.5.tgz",
      "integrity": "sha512-eDMORYaPNZ4sQIuuYPDHdQvf4gyCF9rEEV/yPxGfwPkRodwEgiMUUXTx/dex+Me0wxx53S+NgUHaP7y3MGlDmg==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "string-width": "^1.0.2 || 2 || 3 || 4"
      }
    },
    "node_modules/wide-align/node_modules/ansi-regex": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-5.0.1.tgz",
      "integrity": "sha512-quJQXlTSUGL2LH9SUXo8VwsY4soanhgo6LNSm84E1LBcE8s3O0wpdiRzyR9z/ZZJMlMWv37qOOb9pdJlMUEKFQ==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/wide-align/node_modules/emoji-regex": {
      "version": "8.0.0",
      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-8.0.0.tgz",
      "integrity": "sha512-MSjYzcWNOA0ewAHpz0MxpYFvwg6yjy1NG3xteoqz644VCo/RPgnr1/GGt+ic3iJTzQ8Eu3TdM14SawnVUmGE6A==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/wide-align/node_modules/string-width": {
      "version": "4.2.3",
      "resolved": "https://registry.npmjs.org/string-width/-/string-width-4.2.3.tgz",
      "integrity": "sha512-wKyQRQpjJ0sIp62ErSZdGsjMJWsap5oRNihHhu6G7JVO/9jIB6UyevL+tXuOqrng8j/cxKTWyWUwvSTriiZz/g==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "emoji-regex": "^8.0.0",
        "is-fullwidth-code-point": "^3.0.0",
        "strip-ansi": "^6.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/wide-align/node_modules/strip-ansi": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-6.0.1.tgz",
      "integrity": "sha512-Y38VPSHcqkFrCpFnQ9vuSXmquuv5oXOKpGeT6aGrr3o3Gc9AlVa6JBfUSOCnbxGGZF+/0ooI7KrPuUSztUdU5A==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "ansi-regex": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/wrap-ansi": {
      "version": "8.1.0",
      "resolved": "https://registry.npmjs.org/wrap-ansi/-/wrap-ansi-8.1.0.tgz",
      "integrity": "sha512-si7QWI6zUMq56bESFvagtmzMdGOtoxfR+Sez11Mobfc7tm+VkUckk9bW2UeffTGVUbOksxmSw0AA2gs8g71NCQ==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "ansi-styles": "^6.1.0",
        "string-width": "^5.0.1",
        "strip-ansi": "^7.0.1"
      },
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/chalk/wrap-ansi?sponsor=1"
      }
    },
    "node_modules/wrap-ansi-cjs": {
      "name": "wrap-ansi",
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/wrap-ansi/-/wrap-ansi-7.0.0.tgz",
      "integrity": "sha512-YVGIj2kamLSTxw6NsZjoBxfSwsn0ycdesmc4p+Q21c5zPuZ1pl+NfxVdxPtdHvmNVOQ6XSYG4AUtyt/Fi7D16Q==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "ansi-styles": "^4.0.0",
        "string-width": "^4.1.0",
        "strip-ansi": "^6.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/chalk/wrap-ansi?sponsor=1"
      }
    },
    "node_modules/wrap-ansi-cjs/node_modules/ansi-regex": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-5.0.1.tgz",
      "integrity": "sha512-quJQXlTSUGL2LH9SUXo8VwsY4soanhgo6LNSm84E1LBcE8s3O0wpdiRzyR9z/ZZJMlMWv37qOOb9pdJlMUEKFQ==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/wrap-ansi-cjs/node_modules/ansi-styles": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-4.3.0.tgz",
      "integrity": "sha512-zbB9rCJAT1rbjiVDb2hqKFHNYLxgtk8NURxZ3IZwD3F6NtxbXZQCnnSi1Lkx+IDohdPlFp222wVALIheZJQSEg==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "color-convert": "^2.0.1"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
      }
    },
    "node_modules/wrap-ansi-cjs/node_modules/emoji-regex": {
      "version": "8.0.0",
      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-8.0.0.tgz",
      "integrity": "sha512-MSjYzcWNOA0ewAHpz0MxpYFvwg6yjy1NG3xteoqz644VCo/RPgnr1/GGt+ic3iJTzQ8Eu3TdM14SawnVUmGE6A==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/wrap-ansi-cjs/node_modules/string-width": {
      "version": "4.2.3",
      "resolved": "https://registry.npmjs.org/string-width/-/string-width-4.2.3.tgz",
      "integrity": "sha512-wKyQRQpjJ0sIp62ErSZdGsjMJWsap5oRNihHhu6G7JVO/9jIB6UyevL+tXuOqrng8j/cxKTWyWUwvSTriiZz/g==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "emoji-regex": "^8.0.0",
        "is-fullwidth-code-point": "^3.0.0",
        "strip-ansi": "^6.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/wrap-ansi-cjs/node_modules/strip-ansi": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-6.0.1.tgz",
      "integrity": "sha512-Y38VPSHcqkFrCpFnQ9vuSXmquuv5oXOKpGeT6aGrr3o3Gc9AlVa6JBfUSOCnbxGGZF+/0ooI7KrPuUSztUdU5A==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "ansi-regex": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/wrappy": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/wrappy/-/wrappy-1.0.2.tgz",
      "integrity": "sha512-l4Sp/DRseor9wL6EvV2+TuQn63dMkPjZ/sp9XkghTEbV9KlPS1xUsZ3u7/IQO4wxtcFB4bgpQPRcR3QCvezPcQ==",
      "license": "ISC",
      "optional": true
    },
    "node_modules/yallist": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/yallist/-/yallist-4.0.0.tgz",
      "integrity": "sha512-3wdGidZyq5PB084XLES5TpOSRA3wjXAlIWMhum2kRcv/41Sn2emQ0dycQW4uZXLejwKvg6EsvbdlVL+FYEct7A==",
      "license": "ISC",
      "optional": true
    }
  }
}

```

## ble_messenger/package.json

```
{
  "name": "lumia-example-ble-messenger",
  "version": "1.0.0",
  "private": true,
  "description": "Bluetooth Low Energy messaging plugin for Lumia Stream.",
  "main": "main.js",
  "keywords": ["lumia", "plugin", "bluetooth", "ble"],
  "dependencies": {
    "@abandonware/noble": "^1.9.2-15",
    "@lumiastream/plugin": "^0.1.18"
  }
}

```

## cosmic_weather/README.md

```
# Weather

A sample Lumia Stream plugin bundled with the SDK examples. It demonstrates how to require multiple npm packages from inside a plugin:

- [`axios`](https://www.npmjs.com/package/axios) for HTTP requests
- [`luxon`](https://www.npmjs.com/package/luxon) for time formatting
- [`color`](https://www.npmjs.com/package/color) for palette generation
- [`unique-names-generator`](https://www.npmjs.com/package/unique-names-generator) for playful AI-like verbiage

The plugin fetches live weather data from the free [Open-Meteo](https://open-meteo.com/) APIs, remixes the response with synthwave-inspired copy, and emits a Lumia alert packed with neon-friendly metadata.

## Getting Started

```bash
cd plugins/examples/weather
npm install
zip -r weather.lumiaplugin .
```

Install the resulting `weather.lumiaplugin` with the Lumia Stream plugin manager. After installation, open the **Weather** connection, enter a city, optionally add the state/region to disambiguate, and enable the recurring interval if you want automatic updates.

Trigger the included "Trigger Forecast" action to broadcast a fresh neon forecast on demand—the action accepts both city and state inputs as well.

## Notes

- The example intentionally keeps dependencies unbundled so the runtime can exercise nested `node_modules/` lookups.
- No API key is required—the sample uses the open endpoints for geocoding and current conditions.
- Feel free to swap dependencies or enhance the visuals to experiment with the plugin sandbox.

```

## cosmic_weather/main.js

```
const { Plugin } = require("@lumiastream/plugin");
const axios = require("axios");
const Color = require("color");
const { DateTime } = require("luxon");
const {
	uniqueNamesGenerator,
	adjectives,
	colors,
	animals,
} = require("unique-names-generator");

const GEO_BASE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_BASE_URL = "https://api.open-meteo.com/v1/forecast";

class CosmicWeather extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._pollHandle = null;
		this._lastWeatherType = null; // Track previous weather type for change detection
	}

	async onload() {
		await this.lumia.addLog("[CosmicWeather] Initializing neon satellites…");
		const currentCity = this.settings.city || "Neo Tokyo";
		const currentState = this.settings.state || "";
		await this._broadcastForecast(
			currentCity,
			currentState,
			this.settings.units
		);

		if (Number(this.settings.autoInterval) > 0) {
			this._scheduleAutoForecast();
		}

		await this.lumia.addLog("[CosmicWeather] Online and glowing.");
	}

	async onunload() {
		this._clearAutoForecast();
		await this.lumia.addLog("[CosmicWeather] Going dark.");
	}

	async onsettingsupdate(settings, previousSettings) {
		const cityChanged = settings.city !== previousSettings?.city;
		const stateChanged = settings.state !== previousSettings?.state;
		const unitsChanged = settings.units !== previousSettings?.units;
		const scheduleChanged =
			settings.autoInterval !== previousSettings?.autoInterval;

		if (scheduleChanged) {
			if (Number(settings.autoInterval) > 0) {
				this._scheduleAutoForecast();
			} else {
				this._clearAutoForecast();
			}
		}

		if (cityChanged || stateChanged || unitsChanged) {
			await this._broadcastForecast(
				settings.city,
				settings.state,
				settings.units
			);
		}
	}

	async actions(config = {}) {
		const actionList = Array.isArray(config.actions) ? config.actions : [];

		if (!actionList.length) {
			return;
		}

		for (const action of actionList) {
			if (action?.type === "triggerForecast") {
				const city = action.value?.city || this.settings.city;
				const state =
					action.value?.state !== undefined
						? action.value.state
						: this.settings.state;
				await this._broadcastForecast(city, state, this.settings.units);
			}
		}
	}

	async validateAuth() {
		const city = (this.settings.city || "").trim();
		const state = (this.settings.state || "").trim();

		if (!city) {
			await this.lumia.addLog(
				"[CosmicWeather] Validation failed: City setting is required to resolve a forecast."
			);
			return false;
		}

		try {
			await this._resolveLocation(city, state);
			return true;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			await this.lumia.addLog(`[CosmicWeather] Validation failed: ${message}`);
			return false;
		}
	}

	_scheduleAutoForecast() {
		const intervalMinutes = Number(this.settings.autoInterval);

		if (!Number.isFinite(intervalMinutes) || intervalMinutes <= 0) {
			this._clearAutoForecast();
			return;
		}

		this._clearAutoForecast();
		this._pollHandle = setInterval(() => {
			void this._broadcastForecast(
				this.settings.city,
				this.settings.state,
				this.settings.units
			);
		}, intervalMinutes * 60 * 1000);
	}

	_clearAutoForecast() {
		if (this._pollHandle) {
			clearInterval(this._pollHandle);
			this._pollHandle = null;
		}
	}

	async _broadcastForecast(city = "Neo Tokyo", state = "", units = "metric") {
		try {
			const forecast = await this._createForecast(city, state, units);

			await this.lumia.updateSettings({
				lastUpdated: forecast.renderedAt,
				temperature: forecast.displayTemperature,
			});

			await this._updateVariables(forecast);
			await this._triggerAlert(forecast);
			// Toast
			this.lumia.showToast({
				message: `Forecast broadcasted for ${
					forecast.city
				} with ${JSON.stringify(forecast)}`,
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			await this.lumia.addLog(`[CosmicWeather] Forecast failed: ${message}`);
		}
	}

	async _createForecast(city, state, units) {
		const location = await this._resolveLocation(city, state);
		const weather = await this._fetchWeather(location, units);
		const palette = this._buildPalette(weather.temperatureC);
		const vibe = uniqueNamesGenerator({
			dictionaries: [adjectives, colors, animals],
			separator: " ",
			style: "capital",
		});

		const renderedAt = DateTime.utc().toISO();
		const displayTemperature =
			units === "imperial"
				? `${(weather.temperatureC * 9) / 5 + 32}°F`
				: `${weather.temperatureC}°C`;

		const weatherType = this._categorizeWeatherType(weather.weatherCode);

		return {
			city: location.displayName,
			state: location.state,
			country: location.country,
			latitude: location.latitude,
			longitude: location.longitude,
			temperatureC: weather.temperatureC,
			displayTemperature,
			summary: weather.summary,
			weatherCode: weather.weatherCode,
			weatherType,
			trend: vibe,
			palette,
			renderedAt,
		};
	}

	async _resolveLocation(city, state) {
		const trimmedCity = (city || "").trim();
		const trimmedState = (state || "").trim();

		if (!trimmedCity) {
			throw new Error("City is required to fetch a forecast");
		}

		const fetchLocations = async (query, limit = 5) => {
			const response = await axios.get(GEO_BASE_URL, {
				params: {
					name: query,
					count: limit,
					language: "en",
					format: "json",
				},
			});
			return Array.isArray(response.data?.results) ? response.data.results : [];
		};

		const normalize = (value) =>
			typeof value === "string"
				? value.toLowerCase().replace(/\./g, "").trim()
				: "";

		let results = await fetchLocations(trimmedCity, trimmedState ? 10 : 5);
		if (!results.length && trimmedState) {
			results = await fetchLocations(`${trimmedCity} ${trimmedState}`, 10);
		}

		if (!results.length) {
			const target = trimmedState
				? `${trimmedCity}, ${trimmedState}`
				: trimmedCity;
			throw new Error(`Unable to locate coordinates for ${target}`);
		}

		let selection = results[0];

		if (trimmedState) {
			const normalizedState = normalize(trimmedState);
			const exactMatch = results.find(
				(location) => normalize(location.admin1) === normalizedState
			);
			const partialMatch = results.find((location) =>
				normalize(location.admin1)?.includes(normalizedState)
			);
			selection = exactMatch || partialMatch || selection;
		}

		const stateName = selection.admin1 || "";
		const countryName = selection.country || selection.country_code || "";
		return {
			name: selection.name,
			displayName:
				trimmedState && stateName
					? `${selection.name}, ${stateName}`
					: selection.name,
			state: stateName,
			country: countryName,
			latitude: selection.latitude,
			longitude: selection.longitude,
		};
	}

	async _fetchWeather(location, units) {
		const params = {
			latitude: location.latitude,
			longitude: location.longitude,
			current_weather: true,
			timezone: "UTC",
		};

		const response = await axios.get(WEATHER_BASE_URL, { params });
		const current = response.data?.current_weather;

		if (!current) {
			throw new Error("Weather payload missing current conditions");
		}

		const temperatureC = Math.round(current.temperature);
		const weatherCode = current.weathercode;
		const summary = this._describeConditions(weatherCode);

		return {
			temperatureC,
			summary,
			weatherCode,
		};
	}

	_describeConditions(code) {
		const lookup = {
			0: "crystal-clear neon skies",
			1: "dreamy synth clouds",
			2: "lo-fi drifting fog",
			3: "electric overcast",
			45: "holographic haze",
			51: "pixel drizzle",
			61: "analog rain showers",
			71: "laser snowfall",
			80: "glitchy downpour",
			95: "thunderous bass storms",
		};
		return lookup[code] || "mysterious cosmic weather";
	}

	_categorizeWeatherType(code) {
		// Categorize weather codes into types for significant change detection
		if (code === 0 || code === 1) return "clear";
		if (code === 2 || code === 3) return "cloudy";
		if (code === 45) return "foggy";
		if (code === 51 || code === 61 || code === 80) return "rainy";
		if (code === 71) return "snowy";
		if (code === 95) return "stormy";
		return "unknown";
	}

	_buildPalette(tempC) {
		const base = tempC > 25 ? Color("#ff2e92") : Color("#00f0ff");
		const accent = base.rotate(tempC > 25 ? 45 : -45).lighten(0.2);
		const shadow = base.darken(0.4);

		return {
			base: base.hex(),
			accent: accent.hex(),
			shadow: shadow.hex(),
		};
	}

	async _updateVariables(forecast) {
		await this.lumia.setVariable("city", forecast.city);
		await this.lumia.setVariable("temperature", forecast.displayTemperature);
		await this.lumia.setVariable("trend", forecast.trend);
	}

	async _triggerAlert(forecast) {
		// Only trigger alert if weather type has significantly changed
		const currentWeatherType = forecast.weatherType;
		const hasChanged = this._lastWeatherType !== currentWeatherType;

		if (hasChanged) {
			const previousType = this._lastWeatherType || "none";

			await this.lumia.triggerAlert({
				alert: "weatherChange",
				dynamic: {
					city: forecast.city,
					temperature: forecast.displayTemperature,
					summary: forecast.summary,
					trend: forecast.trend,
					palette: forecast.palette,
					timestamp: forecast.renderedAt,
					weatherType: currentWeatherType,
					previousWeatherType: previousType,
				},
			});

			await this.lumia.addLog(
				`[CosmicWeather] Weather changed: ${previousType} → ${currentWeatherType}`
			);

			// Update the last weather type after triggering
			this._lastWeatherType = currentWeatherType;
		} else {
			await this.lumia.addLog(
				`[CosmicWeather] Weather type unchanged (${currentWeatherType}), skipping alert`
			);
		}
	}
}

module.exports = CosmicWeather;

```

## cosmic_weather/manifest.json

```
{
	"id": "cosmic_weather",
	"name": "Cosmic Weather",
	"version": "1.0.0",
	"author": "Lumia Stream",
	"description": "Streams weather reports and alerts when the weather changes.",
	"license": "MIT",
	"lumiaVersion": ">=8.9.0",
	"category": "utilities",
	"icon": "cosmic-weather.png",
	"config": {
		"settings": [
			{
				"key": "city",
				"label": "City",
				"type": "text",
				"placeholder": "San Francisco",
				"defaultValue": "San Francisco",
				"required": true
			},
			{
				"key": "state",
				"label": "State / Region",
				"type": "text",
				"placeholder": "California",
				"defaultValue": "",
				"helperText": "Optional: narrow the geocoding to a specific state or region."
			},
			{
				"key": "units",
				"label": "Units",
				"type": "select",
				"defaultValue": "metric",
				"options": [
					{ "label": "Celsius", "value": "metric" },
					{ "label": "Fahrenheit", "value": "imperial" }
				]
			},
			{
				"key": "autoInterval",
				"label": "Auto Forecast Interval (minutes)",
				"type": "number",
				"defaultValue": 0,
				"helperText": "Set to a value greater than 0 to schedule recurring synthwave forecasts."
			},
			{
				"key": "apiKey",
				"label": "Weather API Key",
				"type": "password",
				"helperText": "Optional: provide an OpenWeather-style API key to fetch live data."
			}
		],
		"actions": [
			{
				"type": "triggerForecast",
				"label": "Trigger Forecast",
				"description": "Push a fresh synthwave forecast to Lumia",
				"fields": [
					{
						"key": "city",
						"label": "City",
						"type": "text",
						"placeholder": "San Francisco"
					},
					{
						"key": "state",
						"label": "State / Region",
						"type": "text",
						"placeholder": "California"
					}
				]
			}
		],
		"alerts": [
			{
				"title": "Weather Change",
				"key": "weatherChange",
				"info": "Plays when a a major weather change is detected. For example, from sunny to cloudy, or from clear to rain.",
				"defaultMessage": "{{city}} is glowing at {{temperature}}° with {{summary}} vibes",
				"acceptedVariables": [
					"city",
					"temperature",
					"summary",
					"trend",
					"palette",
					"timestamp",
					"weatherType",
					"previousWeatherType"
				]
			}
		],
		"variables": [
			{
				"name": "cosmic_weather_city",
				"description": "City last forecasted",
				"value": ""
			},
			{
				"name": "cosmic_weather_temperature",
				"description": "Last temperature reading",
				"value": ""
			}
		]
	}
}

```

## cosmic_weather/package-lock.json

```
{
	"name": "weather",
	"version": "1.0.0",
	"lockfileVersion": 3,
	"requires": true,
	"packages": {
		"": {
			"name": "weather",
			"version": "1.0.0",
			"license": "MIT",
			"dependencies": {
				"axios": "^1.6.7",
				"color": "^4.2.3",
				"luxon": "^3.4.4",
				"unique-names-generator": "^4.7.1"
			}
		},
		"node_modules/async-function": {
			"version": "1.0.0",
			"resolved": "https://registry.npmjs.org/async-function/-/async-function-1.0.0.tgz",
			"integrity": "sha512-hsU18Ae8CDTR6Kgu9DYf0EbCr/a5iGL0rytQDobUcdpYOKokk8LEjVphnXkDkgpi0wYVsqrXuP0bZxJaTqdgoA==",
			"license": "MIT",
			"engines": {
				"node": ">= 0.4"
			}
		},
		"node_modules/async-generator-function": {
			"version": "1.0.0",
			"resolved": "https://registry.npmjs.org/async-generator-function/-/async-generator-function-1.0.0.tgz",
			"integrity": "sha512-+NAXNqgCrB95ya4Sr66i1CL2hqLVckAk7xwRYWdcm39/ELQ6YNn1aw5r0bdQtqNZgQpEWzc5yc/igXc7aL5SLA==",
			"license": "MIT",
			"engines": {
				"node": ">= 0.4"
			}
		},
		"node_modules/asynckit": {
			"version": "0.4.0",
			"resolved": "https://registry.npmjs.org/asynckit/-/asynckit-0.4.0.tgz",
			"integrity": "sha512-Oei9OH4tRh0YqU3GxhX79dM/mwVgvbZJaSNaRk+bshkj0S5cfHcgYakreBjrHwatXKbz+IoIdYLxrKim2MjW0Q==",
			"license": "MIT"
		},
		"node_modules/axios": {
			"version": "1.12.2",
			"resolved": "https://registry.npmjs.org/axios/-/axios-1.12.2.tgz",
			"integrity": "sha512-vMJzPewAlRyOgxV2dU0Cuz2O8zzzx9VYtbJOaBgXFeLc4IV/Eg50n4LowmehOOR61S8ZMpc2K5Sa7g6A4jfkUw==",
			"license": "MIT",
			"dependencies": {
				"follow-redirects": "^1.15.6",
				"form-data": "^4.0.4",
				"proxy-from-env": "^1.1.0"
			}
		},
		"node_modules/call-bind-apply-helpers": {
			"version": "1.0.2",
			"resolved": "https://registry.npmjs.org/call-bind-apply-helpers/-/call-bind-apply-helpers-1.0.2.tgz",
			"integrity": "sha512-Sp1ablJ0ivDkSzjcaJdxEunN5/XvksFJ2sMBFfq6x0ryhQV/2b/KwFe21cMpmHtPOSij8K99/wSfoEuTObmuMQ==",
			"license": "MIT",
			"dependencies": {
				"es-errors": "^1.3.0",
				"function-bind": "^1.1.2"
			},
			"engines": {
				"node": ">= 0.4"
			}
		},
		"node_modules/color": {
			"version": "4.2.3",
			"resolved": "https://registry.npmjs.org/color/-/color-4.2.3.tgz",
			"integrity": "sha512-1rXeuUUiGGrykh+CeBdu5Ie7OJwinCgQY0bc7GCRxy5xVHy+moaqkpL/jqQq0MtQOeYcrqEz4abc5f0KtU7W4A==",
			"license": "MIT",
			"dependencies": {
				"color-convert": "^2.0.1",
				"color-string": "^1.9.0"
			},
			"engines": {
				"node": ">=12.5.0"
			}
		},
		"node_modules/color-convert": {
			"version": "2.0.1",
			"resolved": "https://registry.npmjs.org/color-convert/-/color-convert-2.0.1.tgz",
			"integrity": "sha512-RRECPsj7iu/xb5oKYcsFHSppFNnsj/52OVTRKb4zP5onXwVF3zVmmToNcOfGC+CRDpfK/U584fMg38ZHCaElKQ==",
			"license": "MIT",
			"dependencies": {
				"color-name": "~1.1.4"
			},
			"engines": {
				"node": ">=7.0.0"
			}
		},
		"node_modules/color-name": {
			"version": "1.1.4",
			"resolved": "https://registry.npmjs.org/color-name/-/color-name-1.1.4.tgz",
			"integrity": "sha512-dOy+3AuW3a2wNbZHIuMZpTcgjGuLU/uBL/ubcZF9OXbDo8ff4O8yVp5Bf0efS8uEoYo5q4Fx7dY9OgQGXgAsQA==",
			"license": "MIT"
		},
		"node_modules/color-string": {
			"version": "1.9.1",
			"resolved": "https://registry.npmjs.org/color-string/-/color-string-1.9.1.tgz",
			"integrity": "sha512-shrVawQFojnZv6xM40anx4CkoDP+fZsw/ZerEMsW/pyzsRbElpsL/DBVW7q3ExxwusdNXI3lXpuhEZkzs8p5Eg==",
			"license": "MIT",
			"dependencies": {
				"color-name": "^1.0.0",
				"simple-swizzle": "^0.2.2"
			}
		},
		"node_modules/combined-stream": {
			"version": "1.0.8",
			"resolved": "https://registry.npmjs.org/combined-stream/-/combined-stream-1.0.8.tgz",
			"integrity": "sha512-FQN4MRfuJeHf7cBbBMJFXhKSDq+2kAArBlmRBvcvFE5BB1HZKXtSFASDhdlz9zOYwxh8lDdnvmMOe/+5cdoEdg==",
			"license": "MIT",
			"dependencies": {
				"delayed-stream": "~1.0.0"
			},
			"engines": {
				"node": ">= 0.8"
			}
		},
		"node_modules/delayed-stream": {
			"version": "1.0.0",
			"resolved": "https://registry.npmjs.org/delayed-stream/-/delayed-stream-1.0.0.tgz",
			"integrity": "sha512-ZySD7Nf91aLB0RxL4KGrKHBXl7Eds1DAmEdcoVawXnLD7SDhpNgtuII2aAkg7a7QS41jxPSZ17p4VdGnMHk3MQ==",
			"license": "MIT",
			"engines": {
				"node": ">=0.4.0"
			}
		},
		"node_modules/dunder-proto": {
			"version": "1.0.1",
			"resolved": "https://registry.npmjs.org/dunder-proto/-/dunder-proto-1.0.1.tgz",
			"integrity": "sha512-KIN/nDJBQRcXw0MLVhZE9iQHmG68qAVIBg9CqmUYjmQIhgij9U5MFvrqkUL5FbtyyzZuOeOt0zdeRe4UY7ct+A==",
			"license": "MIT",
			"dependencies": {
				"call-bind-apply-helpers": "^1.0.1",
				"es-errors": "^1.3.0",
				"gopd": "^1.0.0"
			},
			"engines": {
				"node": ">= 0.4"
			}
		},
		"node_modules/es-define-property": {
			"version": "1.0.1",
			"resolved": "https://registry.npmjs.org/es-define-property/-/es-define-property-1.0.1.tgz",
			"integrity": "sha512-e3nRfgfUZ4rNGL232gUgX06QNyyez04KdjFrF+LTRoOXmrOgFKDg4BCdsjW8EnT69eqdYGmRpJwiPVYNrCaW3g==",
			"license": "MIT",
			"engines": {
				"node": ">= 0.4"
			}
		},
		"node_modules/es-errors": {
			"version": "1.3.0",
			"resolved": "https://registry.npmjs.org/es-errors/-/es-errors-1.3.0.tgz",
			"integrity": "sha512-Zf5H2Kxt2xjTvbJvP2ZWLEICxA6j+hAmMzIlypy4xcBg1vKVnx89Wy0GbS+kf5cwCVFFzdCFh2XSCFNULS6csw==",
			"license": "MIT",
			"engines": {
				"node": ">= 0.4"
			}
		},
		"node_modules/es-object-atoms": {
			"version": "1.1.1",
			"resolved": "https://registry.npmjs.org/es-object-atoms/-/es-object-atoms-1.1.1.tgz",
			"integrity": "sha512-FGgH2h8zKNim9ljj7dankFPcICIK9Cp5bm+c2gQSYePhpaG5+esrLODihIorn+Pe6FGJzWhXQotPv73jTaldXA==",
			"license": "MIT",
			"dependencies": {
				"es-errors": "^1.3.0"
			},
			"engines": {
				"node": ">= 0.4"
			}
		},
		"node_modules/es-set-tostringtag": {
			"version": "2.1.0",
			"resolved": "https://registry.npmjs.org/es-set-tostringtag/-/es-set-tostringtag-2.1.0.tgz",
			"integrity": "sha512-j6vWzfrGVfyXxge+O0x5sh6cvxAog0a/4Rdd2K36zCMV5eJ+/+tOAngRO8cODMNWbVRdVlmGZQL2YS3yR8bIUA==",
			"license": "MIT",
			"dependencies": {
				"es-errors": "^1.3.0",
				"get-intrinsic": "^1.2.6",
				"has-tostringtag": "^1.0.2",
				"hasown": "^2.0.2"
			},
			"engines": {
				"node": ">= 0.4"
			}
		},
		"node_modules/follow-redirects": {
			"version": "1.15.11",
			"resolved": "https://registry.npmjs.org/follow-redirects/-/follow-redirects-1.15.11.tgz",
			"integrity": "sha512-deG2P0JfjrTxl50XGCDyfI97ZGVCxIpfKYmfyrQ54n5FO/0gfIES8C/Psl6kWVDolizcaaxZJnTS0QSMxvnsBQ==",
			"funding": [
				{
					"type": "individual",
					"url": "https://github.com/sponsors/RubenVerborgh"
				}
			],
			"license": "MIT",
			"engines": {
				"node": ">=4.0"
			},
			"peerDependenciesMeta": {
				"debug": {
					"optional": true
				}
			}
		},
		"node_modules/form-data": {
			"version": "4.0.4",
			"resolved": "https://registry.npmjs.org/form-data/-/form-data-4.0.4.tgz",
			"integrity": "sha512-KrGhL9Q4zjj0kiUt5OO4Mr/A/jlI2jDYs5eHBpYHPcBEVSiipAvn2Ko2HnPe20rmcuuvMHNdZFp+4IlGTMF0Ow==",
			"license": "MIT",
			"dependencies": {
				"asynckit": "^0.4.0",
				"combined-stream": "^1.0.8",
				"es-set-tostringtag": "^2.1.0",
				"hasown": "^2.0.2",
				"mime-types": "^2.1.12"
			},
			"engines": {
				"node": ">= 6"
			}
		},
		"node_modules/function-bind": {
			"version": "1.1.2",
			"resolved": "https://registry.npmjs.org/function-bind/-/function-bind-1.1.2.tgz",
			"integrity": "sha512-7XHNxH7qX9xG5mIwxkhumTox/MIRNcOgDrxWsMt2pAr23WHp6MrRlN7FBSFpCpr+oVO0F744iUgR82nJMfG2SA==",
			"license": "MIT",
			"funding": {
				"url": "https://github.com/sponsors/ljharb"
			}
		},
		"node_modules/generator-function": {
			"version": "2.0.0",
			"resolved": "https://registry.npmjs.org/generator-function/-/generator-function-2.0.0.tgz",
			"integrity": "sha512-xPypGGincdfyl/AiSGa7GjXLkvld9V7GjZlowup9SHIJnQnHLFiLODCd/DqKOp0PBagbHJ68r1KJI9Mut7m4sA==",
			"license": "MIT",
			"engines": {
				"node": ">= 0.4"
			}
		},
		"node_modules/get-intrinsic": {
			"version": "1.3.1",
			"resolved": "https://registry.npmjs.org/get-intrinsic/-/get-intrinsic-1.3.1.tgz",
			"integrity": "sha512-fk1ZVEeOX9hVZ6QzoBNEC55+Ucqg4sTVwrVuigZhuRPESVFpMyXnd3sbXvPOwp7Y9riVyANiqhEuRF0G1aVSeQ==",
			"license": "MIT",
			"dependencies": {
				"async-function": "^1.0.0",
				"async-generator-function": "^1.0.0",
				"call-bind-apply-helpers": "^1.0.2",
				"es-define-property": "^1.0.1",
				"es-errors": "^1.3.0",
				"es-object-atoms": "^1.1.1",
				"function-bind": "^1.1.2",
				"generator-function": "^2.0.0",
				"get-proto": "^1.0.1",
				"gopd": "^1.0.0",
				"has-symbols": "^1.1.0",
				"hasown": "^2.0.2",
				"math-intrinsics": "^1.1.0"
			},
			"engines": {
				"node": ">= 0.4"
			},
			"funding": {
				"url": "https://github.com/sponsors/ljharb"
			}
		},
		"node_modules/get-proto": {
			"version": "1.0.1",
			"resolved": "https://registry.npmjs.org/get-proto/-/get-proto-1.0.1.tgz",
			"integrity": "sha512-sTSfBjoXBp89JvIKIefqw7U2CCebsc74kiY6awiGogKtoSGbgjYE/G/+l9sF3MWFPNc9IcoOC4ODfKHfxFmp0g==",
			"license": "MIT",
			"dependencies": {
				"dunder-proto": "^1.0.1",
				"es-object-atoms": "^1.0.0"
			},
			"engines": {
				"node": ">= 0.4"
			}
		},
		"node_modules/gopd": {
			"version": "1.0.0",
			"resolved": "https://registry.npmjs.org/gopd/-/gopd-1.0.0.tgz",
			"integrity": "sha512-ZUKRh6/kUFoAiTAtTYPZJ3hw9wNxx+BIBOijnlG9PnrJsCcSjs1wyyD6vJpaYtgnzDrKYRSqf3OO6Rfa93xsRg==",
			"license": "MIT",
			"engines": {
				"node": ">= 0.4"
			},
			"funding": {
				"url": "https://github.com/sponsors/ljharb"
			}
		},
		"node_modules/has-symbols": {
			"version": "1.1.0",
			"resolved": "https://registry.npmjs.org/has-symbols/-/has-symbols-1.1.0.tgz",
			"integrity": "sha512-1cDNdwJ2Jaohmb3sg4OmKaMBwuC48sYni5HUw2DvsC8LjGTLK9h+eb1X6RyuOHe4hT0ULCW68iomhjUoKUqlPQ==",
			"license": "MIT",
			"engines": {
				"node": ">= 0.4"
			},
			"funding": {
				"url": "https://github.com/sponsors/ljharb"
			}
		},
		"node_modules/has-tostringtag": {
			"version": "1.0.2",
			"resolved": "https://registry.npmjs.org/has-tostringtag/-/has-tostringtag-1.0.2.tgz",
			"integrity": "sha512-NqADB8VjPFLM2V0VvHUewwwsw0ZWBaIdgo+ieHtK3hasLz4qeCRjYcqfB6AQrBggRKppKF8L52/VqdVsO47Dlw==",
			"license": "MIT",
			"dependencies": {
				"has-symbols": "^1.0.3"
			},
			"engines": {
				"node": ">= 0.4"
			},
			"funding": {
				"url": "https://github.com/sponsors/ljharb"
			}
		},
		"node_modules/hasown": {
			"version": "2.0.2",
			"resolved": "https://registry.npmjs.org/hasown/-/hasown-2.0.2.tgz",
			"integrity": "sha512-0hJU9SCPvmMzIBdZFqNPXWa6dqh7WdH0cII9y+CyS8rG3nL48Bclra9HmKhVVUHyPWNH5Y7xDwAB7bfgSjkUMQ==",
			"license": "MIT",
			"dependencies": {
				"function-bind": "^1.1.2"
			},
			"engines": {
				"node": ">= 0.4"
			}
		},
		"node_modules/is-arrayish": {
			"version": "0.3.4",
			"resolved": "https://registry.npmjs.org/is-arrayish/-/is-arrayish-0.3.4.tgz",
			"integrity": "sha512-m6UrgzFVUYawGBh1dUsWR5M2Clqic9RVXC/9f8ceNlv2IcO9j9J/z8UoCLPqtsPBFNzEpfR3xftohbfqDx8EQA==",
			"license": "MIT"
		},
		"node_modules/luxon": {
			"version": "3.7.2",
			"resolved": "https://registry.npmjs.org/luxon/-/luxon-3.7.2.tgz",
			"integrity": "sha512-vtEhXh/gNjI9Yg1u4jX/0YVPMvxzHuGgCm6tC5kZyb08yjGWGnqAjGJvcXbqQR2P3MyMEFnRbpcdFS6PBcLqew==",
			"license": "MIT",
			"engines": {
				"node": ">=12"
			}
		},
		"node_modules/math-intrinsics": {
			"version": "1.1.0",
			"resolved": "https://registry.npmjs.org/math-intrinsics/-/math-intrinsics-1.1.0.tgz",
			"integrity": "sha512-/IXtbwEk5HTPyEwyKX6hGkYXxM9nbj64B+ilVJnC/R6B0pH5G4V3b0pVbL7DBj4tkhBAppbQUlf6F6Xl9LHu1g==",
			"license": "MIT",
			"engines": {
				"node": ">= 0.4"
			}
		},
		"node_modules/mime-db": {
			"version": "1.52.0",
			"resolved": "https://registry.npmjs.org/mime-db/-/mime-db-1.52.0.tgz",
			"integrity": "sha512-sPU4uV7dYlvtWJxwwxHD0PuihVNiE7TyAbQ5SWxDCB9mUYvOgroQOwYQQOKPJ8CIbE+1ETVlOoK1UC2nU3gYvg==",
			"license": "MIT",
			"engines": {
				"node": ">= 0.6"
			}
		},
		"node_modules/mime-types": {
			"version": "2.1.35",
			"resolved": "https://registry.npmjs.org/mime-types/-/mime-types-2.1.35.tgz",
			"integrity": "sha512-ZDY+bPm5zTTF+YpCrAU9nK0UgICYPT0QtT1NZWFv4s++TNkcgVaT0g6+4R2uI4MjQjzysHB1zxuWL50hzaeXiw==",
			"license": "MIT",
			"dependencies": {
				"mime-db": "1.52.0"
			},
			"engines": {
				"node": ">= 0.6"
			}
		},
		"node_modules/proxy-from-env": {
			"version": "1.1.0",
			"resolved": "https://registry.npmjs.org/proxy-from-env/-/proxy-from-env-1.1.0.tgz",
			"integrity": "sha512-D+zkORCbA9f1tdWRK0RaCR3GPv50cMxcrz4X8k5LTSUD1Dkw47mKJEZQNunItRTkWwgtaUSo1RVFRIG9ZXiFYg==",
			"license": "MIT"
		},
		"node_modules/simple-swizzle": {
			"version": "0.2.4",
			"resolved": "https://registry.npmjs.org/simple-swizzle/-/simple-swizzle-0.2.4.tgz",
			"integrity": "sha512-nAu1WFPQSMNr2Zn9PGSZK9AGn4t/y97lEm+MXTtUDwfP0ksAIX4nO+6ruD9Jwut4C49SB1Ws+fbXsm/yScWOHw==",
			"license": "MIT",
			"dependencies": {
				"is-arrayish": "^0.3.1"
			}
		},
		"node_modules/unique-names-generator": {
			"version": "4.7.1",
			"resolved": "https://registry.npmjs.org/unique-names-generator/-/unique-names-generator-4.7.1.tgz",
			"integrity": "sha512-lMx9dX+KRmG8sq6gulYYpKWZc9RlGsgBR6aoO8Qsm3qvkSJ+3rAymr+TnV8EDMrIrwuFJ4kruzMWM/OpYzPoow==",
			"license": "MIT",
			"engines": {
				"node": ">=8"
			}
		}
	}
}

```

## cosmic_weather/package.json

```
{
	"name": "weather",
	"version": "1.0.0",
	"description": "Sample Lumia plugin that showcases requiring multiple npm dependencies.",
	"main": "main.js",
	"license": "MIT",
	"dependencies": {
		"axios": "^1.6.7",
		"color": "^4.2.3",
		"luxon": "^3.4.4",
		"unique-names-generator": "^4.7.1"
	}
}

```

## divoom_controller/README.md

```
# Divoom Controller Example Plugin

A Lumia Stream example plugin that sends commands to Divoom Pixoo devices. The plugin exposes actions that can be wired into Lumia automations so you can change brightness, switch channels, or push scrolling text when events occur.

> The Divoom Local API is undocumented by the vendor. The commands used here follow the behaviours observed on Pixoo 16/64 devices. If you run a different model, double-check the endpoint list in the official mobile app capture or Divoom community documentation.

## Features

- Simple HTTP client that posts to `http://<ip>/post`
- Configurable device address, port, timeout, and default canvas size for text
- High-level actions for brightness, channel switching, and scrolling text
- Escape hatch action for raw JSON when you need more control

## Settings

| Key                 | Description                                                |
| ------------------- | ---------------------------------------------------------- |
| `deviceAddress`     | Required IPv4/hostname of the Pixoo (e.g. `192.168.1.42`). |
| `devicePort`        | API port (default `80`).                                   |
| `requestTimeout`    | Timeout in milliseconds for each request (default `5000`). |
| `defaultTextWidth`  | Canvas width used by scrolling text (default `64`).        |
| `defaultTextHeight` | Canvas height used by scrolling text (default `64`).       |

## Actions

### Set Brightness (`set_brightness`)

Sets the global panel brightness via `Channel/SetBrightness`. Accepts a number between `0` and `100`.

### Switch Channel (`set_channel`)

Routes to one of the channel commands listed below and sends the selected identifier:

| Option            | Command                      | Payload key    |
| ----------------- | ---------------------------- | -------------- |
| Clock             | `Channel/SetClock`           | `ClockId`      |
| Visualizer        | `Channel/SetVisualizer`      | `VisualizerId` |
| Scene             | `Channel/SetScene`           | `SceneId`      |
| Custom Page Index | `Channel/SetCustomPageIndex` | `Index`        |

You can find valid ids by using the official Divoom app and monitoring network traffic or browsing community lists. For example, `ClockId` `46` is a minimal digital clock on Pixoo 64.

### Send Scrolling Text (`send_text`)

Sends a `Draw/SendHttpText` payload. Fields:

- `message` – text to render (required)
- `color` – hex colour (defaults to `#FFFFFF`, converted to an `[r, g, b]` array)
- `scrollSpeed` – 1–100 (maps to `TextSpeed`)
- `direction` – left/right/up/down (converted to `ScrollDirection` 0–3)
- `repeat` – number of loops (1–10)

The plugin also injects `TextWidth`, `TextHeight`, `TextAlign`, and `TextFont` from settings so you can tailor the marquee to your Pixoo resolution.

### Send Raw Command (`send_raw_command`)

Allows power users to send any payload that the local API understands. The `command` field is merged into the `Command` property, and the JSON payload is merged into the root body. Example:

```json
{
	"command": "Device/SetRTC",
	"payload": "{ \"RtcHour\": 12, \"RtcMin\": 34, \"RtcSec\": 56 }"
}
```

## Testing

1. Set the plugin settings inside Lumia Stream (IP/port/timeout).
2. Trigger an action manually from the Lumia UI to confirm connectivity.
3. For debugging, open the Lumia Stream log panel to view the messages emitted by the plugin.

If a command fails (HTTP errors, timeouts, invalid JSON), the plugin logs the reason so you can adjust the payload and try again.

## Packaging

```
npm install
npx lumia-plugin build ./examples/divoom_controller --out ./divoom_controller-1.0.0.lumiaplugin
```

You can then load the generated `.lumiaplugin` file in the Lumia Stream desktop app.

```

## divoom_controller/main.js

```
const { Plugin } = require("@lumiastream/plugin");
const http = require("node:http");

class DivoomControllerPlugin extends Plugin {
  async onload() {
    await this.lumia.addLog("[divoom_controller] Plugin loaded");
  }

  async onunload() {
    await this.lumia.addLog("[divoom_controller] Plugin unloaded");
  }

  async actions(config = {}) {
    const actionList = Array.isArray(config.actions) ? config.actions : [];

    for (const action of actionList) {
      const params = action?.value ?? action?.data ?? {};

      switch (action.type) {
        case "set_brightness": {
          const raw = Number(params.brightness);
          const brightness = Number.isFinite(raw) ? raw : 0;
          await this.setBrightness(brightness);
          break;
        }
        case "set_channel": {
          const channel = typeof params.channel === "string" ? params.channel : "clock";
          const id = Number(params.id);
          await this.setChannel(channel, Number.isFinite(id) ? id : 0);
          break;
        }
        case "send_text": {
          const message = typeof params.message === "string" ? params.message : "";
          const color = typeof params.color === "string" ? params.color : "#FFFFFF";
          const scrollSpeed = Number(params.scrollSpeed);
          const direction = typeof params.direction === "string" ? params.direction : "left";
          const repeat = Number(params.repeat);
          await this.sendText({
            message,
            color,
            scrollSpeed: Number.isFinite(scrollSpeed) ? scrollSpeed : 32,
            direction,
            repeat: Number.isFinite(repeat) ? repeat : 1,
          });
          break;
        }
        case "send_raw_command": {
          const command = typeof params.command === "string" ? params.command : "";
          const payload = this.parseJson(params.payload);
          await this.sendRaw(command, payload);
          break;
        }
        default:
          await this.lumia.addLog(
            `[divoom_controller] Unknown action type: ${String(action.type)}`
          );
      }
    }
  }

  getDeviceAddress() {
    const address = (this.settings.deviceAddress ?? "").trim();
    return address.length > 0 ? address : null;
  }

  getDevicePort() {
    const fallback = 80;
    const port = Number(this.settings.devicePort);
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
      return fallback;
    }
    return port;
  }

  getRequestTimeout() {
    const fallback = 5000;
    const timeout = Number(this.settings.requestTimeout);
    if (!Number.isInteger(timeout) || timeout < 500) {
      return fallback;
    }
    return timeout;
  }

  getDefaultDimensions() {
    const width = Number(this.settings.defaultTextWidth);
    const height = Number(this.settings.defaultTextHeight);
    return {
      width: Number.isInteger(width) && width > 0 ? width : 64,
      height: Number.isInteger(height) && height > 0 ? height : 64,
    };
  }

  async setBrightness(brightness) {
    const value = Math.max(0, Math.min(100, Math.round(brightness)));
    const result = await this.sendCommand("Channel/SetBrightness", {
      Brightness: value,
    });

    if (result.success) {
      await this.lumia.addLog(
        `[divoom_controller] Brightness set to ${value}`
      );
    } else {
      await this.lumia.addLog(
        `[divoom_controller] Failed to set brightness: ${result.error}`
      );
    }
  }

  async setChannel(channel, id) {
    const mapping = {
      clock: { command: "Channel/SetClock", key: "ClockId" },
      visualizer: { command: "Channel/SetVisualizer", key: "VisualizerId" },
      scene: { command: "Channel/SetScene", key: "SceneId" },
      custom_page_index: {
        command: "Channel/SetCustomPageIndex",
        key: "Index",
      },
    };

    const entry = mapping[channel] ?? mapping.clock;
    const payload = {};
    payload[entry.key] = Math.max(0, Math.floor(id));

    const result = await this.sendCommand(entry.command, payload);

    if (result.success) {
      await this.lumia.addLog(
        `[divoom_controller] Switched channel (${entry.command}) with ${entry.key}=${payload[entry.key]}`
      );
    } else {
      await this.lumia.addLog(
        `[divoom_controller] Failed to switch channel: ${result.error}`
      );
    }
  }

  async sendText({ message, color, scrollSpeed, direction, repeat }) {
    const trimmed = message.trim();
    if (!trimmed) {
      await this.lumia.addLog(
        "[divoom_controller] Text message cannot be empty"
      );
      return;
    }

    const speed = Math.max(1, Math.min(100, Math.round(scrollSpeed)));
    const directionMap = {
      left: 0,
      right: 1,
      up: 2,
      down: 3,
    };
    const scrollDirection = directionMap[direction] ?? directionMap.left;
    const repeatCount = Math.max(1, Math.min(10, Math.round(repeat)));
    const { width, height } = this.getDefaultDimensions();

    const result = await this.sendCommand("Draw/SendHttpText", {
      TextId: 0,
      TextString: trimmed,
      TextWidth: width,
      TextHeight: height,
      TextAlign: 1,
      TextVAlign: 0,
      TextSpace: 0,
      FontId: 0,
      TextSpeed: speed,
      ScrollDirection: scrollDirection,
      TextDirection: scrollDirection,
      Repeat: repeatCount,
      TextMode: 0,
      TextSound: 0,
      TextColor: this.parseColor(color),
    });

    if (result.success) {
      await this.lumia.addLog(
        `[divoom_controller] Sent scrolling text (${trimmed})`
      );
    } else {
      await this.lumia.addLog(
        `[divoom_controller] Failed to send scrolling text: ${result.error}`
      );
    }
  }

  async sendRaw(command, payload) {
    const trimmed = command.trim();
    if (!trimmed) {
      await this.lumia.addLog(
        "[divoom_controller] Raw command requires a command string"
      );
      return;
    }

    const extra = payload && typeof payload === "object" ? payload : {};
    const result = await this.sendCommand(trimmed, extra);

    if (result.success) {
      await this.lumia.addLog(
        `[divoom_controller] Sent raw command ${trimmed}`
      );
    } else {
      await this.lumia.addLog(
        `[divoom_controller] Failed raw command ${trimmed}: ${result.error}`
      );
    }
  }

  async sendCommand(command, payload = {}) {
    const deviceAddress = this.getDeviceAddress();
    if (!deviceAddress) {
      return {
        success: false,
        error: "Device address not configured",
      };
    }

    const body = JSON.stringify({
      Command: command,
      ...payload,
    });

    const options = {
      host: deviceAddress,
      port: this.getDevicePort(),
      path: "/post",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
      timeout: this.getRequestTimeout(),
    };

    return new Promise((resolve) => {
      const request = http.request(options, (response) => {
        const chunks = [];

        response.on("data", (chunk) => chunks.push(chunk));

        response.on("end", () => {
          const data = Buffer.concat(chunks).toString("utf8");
          if (response.statusCode >= 200 && response.statusCode < 300) {
            let parsed;
            try {
              parsed = data ? JSON.parse(data) : undefined;
            } catch (error) {
              parsed = undefined;
            }

            resolve({
              success: true,
              response: parsed,
            });
          } else {
            resolve({
              success: false,
              error: `HTTP ${response.statusCode}: ${data}`,
            });
          }
        });
      });

      request.on("error", (error) => {
        resolve({
          success: false,
          error: error.message,
        });
      });

      request.on("timeout", () => {
        request.destroy(new Error("Request timed out"));
      });

      request.write(body);
      request.end();
    });
  }

  parseJson(value) {
    if (typeof value !== "string" || value.trim().length === 0) {
      return undefined;
    }

    try {
      return JSON.parse(value);
    } catch (error) {
      void this.lumia.addLog(
        `[divoom_controller] Failed to parse JSON payload: ${error.message}`
      );
      return undefined;
    }
  }

  parseColor(input) {
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
}

module.exports = DivoomControllerPlugin;

```

## divoom_controller/manifest.json

```
{
	"id": "divoom_controller",
	"name": "Divoom Controller",
	"version": "1.0.0",
	"author": "Lumia Stream",
	"description": "Control Divoom Pixoo displays via Lumia Stream actions.",
	"lumiaVersion": "^9.0.0",
	"license": "MIT",
	"category": "devices",
	"icon": "divoom.png",
	"config": {
		"settings": [
			{
				"key": "deviceAddress",
				"label": "Divoom IP Address",
				"type": "text",
				"placeholder": "192.168.1.42",
				"required": true
			},
			{
				"key": "devicePort",
				"label": "Port",
				"type": "number",
				"defaultValue": 80,
				"validation": {
					"min": 1,
					"max": 65535
				}
			},
			{
				"key": "requestTimeout",
				"label": "Request Timeout (ms)",
				"type": "number",
				"defaultValue": 5000,
				"validation": {
					"min": 500,
					"max": 15000
				}
			},
			{
				"key": "defaultTextWidth",
				"label": "Default Text Width",
				"type": "number",
				"defaultValue": 64,
				"validation": {
					"min": 16,
					"max": 128
				}
			},
			{
				"key": "defaultTextHeight",
				"label": "Default Text Height",
				"type": "number",
				"defaultValue": 64,
				"validation": {
					"min": 16,
					"max": 128
				}
			}
		],
		"actions": [
			{
				"type": "set_brightness",
				"label": "Set Brightness",
				"description": "Set device brightness between 0 and 100.",
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
				"type": "set_channel",
				"label": "Switch Channel",
				"description": "Switch to a clock, visualizer, scene, or custom page.",
				"fields": [
					{
						"key": "channel",
						"label": "Channel",
						"type": "select",
						"required": true,
						"options": [
							{
								"label": "Clock (Channel/SetClock)",
								"value": "clock"
							},
							{
								"label": "Visualizer (Channel/SetVisualizer)",
								"value": "visualizer"
							},
							{
								"label": "Scene (Channel/SetScene)",
								"value": "scene"
							},
							{
								"label": "Custom Page Index (Channel/SetCustomPageIndex)",
								"value": "custom_page_index"
							}
						]
					},
					{
						"key": "id",
						"label": "Channel ID / Index",
						"type": "number",
						"required": true,
						"defaultValue": 0
					}
				]
			},
			{
				"type": "send_text",
				"label": "Send Scrolling Text",
				"description": "Display a scrolling message using Draw/SendHttpText.",
				"fields": [
					{
						"key": "message",
						"label": "Message",
						"type": "textarea",
						"required": true
					},
					{
						"key": "color",
						"label": "Text Color",
						"type": "color",
						"defaultValue": "#FFFFFF"
					},
					{
						"key": "scrollSpeed",
						"label": "Scroll Speed (1-100)",
						"type": "number",
						"defaultValue": 32,
						"validation": {
							"min": 1,
							"max": 100
						}
					},
					{
						"key": "direction",
						"label": "Direction",
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
							},
							{
								"label": "Up",
								"value": "up"
							},
							{
								"label": "Down",
								"value": "down"
							}
						]
					},
					{
						"key": "repeat",
						"label": "Repeat Count",
						"type": "number",
						"defaultValue": 1,
						"validation": {
							"min": 1,
							"max": 10
						}
					}
				]
			},
			{
				"type": "send_raw_command",
				"label": "Send Raw Command",
				"description": "Send a custom command payload directly to the device.",
				"fields": [
					{
						"key": "command",
						"label": "Command",
						"type": "text",
						"required": true
					},
					{
						"key": "payload",
						"label": "Payload JSON",
						"type": "textarea",
						"helperText": "Additional properties as JSON (e.g. { \"SceneId\": 6 })."
					}
				]
			}
		]
	}
}

```

## divoom_controller/package.json

```
{
  "name": "lumia-example-divoom-controller",
  "version": "1.0.0",
  "private": true,
  "description": "Control Divoom Pixoo devices from Lumia Stream actions.",
  "main": "main.js",
  "dependencies": {
    "@lumiastream/plugin": "^0.1.18"
  }
}

```

## elevenlabs_tts/README.md

```
# ElevenLabs TTS Example

This example plugin generates ElevenLabs text-to-speech audio and plays it in Lumia Stream using `playAudio`.

## Setup

1. Create an ElevenLabs API key in your account dashboard.
2. Copy a Voice ID from your Voices list.
3. Paste the API key into settings and provide the Voice ID when you trigger **Speak**.

## Usage

- Trigger the **Speak** action and provide a message.
- Trigger **Stream Music** to generate a music clip from a prompt (or composition plan JSON).
- Optional action fields let you override voice/model/output format and tweak voice settings.

## Notes

- Audio is downloaded from the ElevenLabs streaming endpoints, kept in memory as a blob URL, then played via `playAudio`.
- Playback is always awaited so the blob URL can be revoked immediately after audio finishes.

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
	"name": "lumia-elevenlabs-tts-example",
	"version": "1.0.0",
	"private": true,
	"description": "Example ElevenLabs TTS plugin for Lumia Stream.",
	"main": "main.js",
	"dependencies": {
		"@lumiastream/plugin": "^0.1.18"
	}
}

```

## hot_news/README.md

```
# Hot News Plugin

Example Lumia Stream plugin that taps into [NewsAPI.org](https://newsapi.org/) to surface breaking headlines. It keeps Lumia variables in sync with the freshest story, pushes a compact JSON payload of recent results, and triggers an alert whenever a brand-new headline lands for your selected topic.

## Features

- Polls NewsAPI for top headlines using optional country, category, and keyword filters.
- Stores the latest headline details (title, summary, URL, image, published time) in Lumia variables.
- Persists a JSON bundle (`hotnews_recent_articles`) with up to 20 stories for overlays or chat commands.
- Detects unseen headlines and fires a configurable Lumia alert.
- Manual actions let you refresh immediately or run an on-demand topic search.

## Requirements

1. Create a free NewsAPI account and generate an API key: https://newsapi.org/register.
2. Enter the key in the **NewsAPI Key** setting (stored client-side only).
3. Adjust country/category/keyword filters to match the coverage you want.

⚠️ NewsAPI free tiers enforce daily request limits (currently 100 requests/day) and block commercial usage. Increase the poll interval if you are close to the limit.

## Settings

| Setting | Default | Description |
| ------- | ------- | ----------- |
| `apiKey` | — | Your NewsAPI key (required). |
| `country` | `us` | Country code to localise headlines (set blank to disable). |
| `category` | `""` | Optional NewsAPI category filter (business, sports, etc.). |
| `query` | `""` | Keyword/phrase filter to focus on a specific topic. |
| `pollInterval` | 300s | How often to refresh headlines (clamped 60-1800s). |
| `resultsLimit` | 5 | Number of articles to pull per refresh (1-20). |
| `enableAlerts` | true | Toggle alerts when a headline appears that has not been seen before. |

## Actions

- `hotnews_manual_refresh` – Fetch headlines immediately using the saved settings.
- `hotnews_search_topic` – Run a one-off search with a custom keyword/limit (does not fire alerts).

## Alerts

| Alert Key | Default Message | Trigger |
| --------- | --------------- | ------- |
| `hotnews_new_headline` | `🔥 {{hotnews_latest_title}} ({{hotnews_latest_source}})` | Fired when a new headline is detected and alerts are enabled. |

## Variables

- `hotnews_latest_title`
- `hotnews_latest_description`
- `hotnews_latest_url`
- `hotnews_latest_source`
- `hotnews_latest_image`
- `hotnews_latest_published`
- `hotnews_article_count`
- `hotnews_recent_articles` – JSON payload with `keyword`, `count`, and `articles[]` (title, source, url, image, description, publishedAt).
- `hotnews_keyword`
- `hotnews_last_updated`

## Extending The Plugin

- Add additional alert types keyed on source names or categories (for example, “Tech Update” when `source` matches your favourite publication).
- Store the full `payload.totalResults` in another variable to track overall volume for a topic.
- Layer in NewsAPI’s `/everything` endpoint for deeper historical searches (watch the request quota).
- Use the `hotnews_recent_articles` JSON inside a custom Lumia overlay to render a scrolling news ticker.

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

## rumble/README.md

```
# Rumble Livestream Plugin (Example)

An opinionated Lumia Stream plugin that polls the Rumble livestream API and surfaces live viewers, chat activity, rumbles, rants, followers, likes, dislikes, subs, and stream metadata directly into Lumia variables and alerts.

The example is written in plain JavaScript so you can copy the files directly into `~/Documents/LumiaStream/Plugins/<your_plugin_id>` (or use **Load from Directory** inside Lumia Stream) without running a build step.

## Files

```
examples/rumble/
├── assets/                 # Icon and screenshot assets referenced by the manifest
├── main.js                 # Plugin implementation (CommonJS module)
├── manifest.json           # Plugin metadata and configuration definition
├── package.json            # Optional: declares the SDK dependency when you `npm install`
└── README.md
```

## Quick Copy/Paste Instructions

1. Create a new folder for your plugin (for example `~/Documents/LumiaStream/Plugins/rumble`).
2. Copy `manifest.json`, `main.js`, and the `assets/` directory from this example into that folder.
3. (Optional) copy `package.json` if you want to track dependencies – then run `npm install` to pull in `@lumiastream/plugin`.
4. Launch Lumia Stream and load the plugin from the directory (or restart if you copied into the plugins folder).
5. Open the plugin settings and paste your Rumble livestream API key. A valid key looks like `https://rumble.com/-livestream-api/get-data?key=YOUR_KEY` (copy the value after `key=`).

The plugin will begin polling every 30 seconds by default and will log activity in the Lumia console.

## Highlights

- Built with the `@lumiastream/plugin` runtime `Plugin` base class
- Tracks a rich set of variables including viewers, chat members, followers, likes, dislikes, subs, rumbles, rants, thumbnails, URLs, and timestamps
- Raises alerts for stream lifecycle events plus follower, rant, like/dislike, sub, and sub gift changes
- Demonstrates manual actions (`manual_poll`, `manual_alert`) that can be triggered from the Lumia UI

## Variables at a Glance

The plugin keeps the following Lumia variables updated (see `manifest.json` for full descriptions):

- `rumble_live`, `rumble_viewers`, `rumble_joined`
- `rumble_rumbles`, `rumble_rants`, `rumble_rant_amount`
- `rumble_chat_members`, `rumble_followers`, `rumble_likes`, `rumble_dislikes`, `rumble_subs`, `rumble_sub_gifts`
- `rumble_title`, `rumble_thumbnail`, `rumble_stream_url`, `rumble_video_id`
- `rumble_channel_name`, `rumble_channel_image`, `rumble_category`, `rumble_language`
- `rumble_started_at`, `rumble_scheduled_start`, `rumble_last_polled`

## Alert Triggers

Alerts fire automatically for:

- Stream start / end (`rumble-streamStarted`, `rumble-streamEnded`)
- Follower gains (`rumble-follower`)
- Rants (with amount raised) (`rumble-rant`)
- Likes (`rumble-like`) and dislikes (`rumble-dislike`)
- New subs (`rumble-sub`) and gifted subs (`rumble-subGift`)

## Customising

- Tweak the polling cadence via the `pollInterval` setting (10–300 seconds). The plugin normalises milliseconds as well.
- Adjust detection details (for example `RANT_AMOUNT_EPSILON`) or extend alert payloads by editing `check*` helpers in `main.js`.
- Add more custom variables or alerts to match your channel’s workflow—the code is intentionally straightforward to modify.

## TypeScript Version?

If you prefer TypeScript, start from this JavaScript version and rename `main.js` to `main.ts`. Add a local `tsconfig.json` such as:

```json
{
	"compilerOptions": {
		"target": "ES2020",
		"module": "CommonJS",
		"strict": true,
		"esModuleInterop": true,
		"skipLibCheck": true,
		"outDir": "dist",
		"rootDir": "."
	},
	"include": ["main.ts"]
}
```

Compile with `npx tsc` and point `manifest.json` at the emitted `dist/main.js` file (or copy the compiled file into the plugin root). Keeping the TypeScript config beside the file avoids any `../../tsconfig.json` references, so the project still copies cleanly.

MIT License

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
				platform: "rumble",
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
	"name": "lumia-example-rumble",
	"version": "1.0.0",
	"private": true,
	"description": "Example Lumia Stream plugin that monitors a Rumble livestream and surfaces follower, rant, reaction, and subscription activity.",
	"main": "main.js",
	"scripts": {},
	"dependencies": {
		"@lumiastream/plugin": "^0.1.18"
	}
}

```
