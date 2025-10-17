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
