const { Plugin } = require("@lumiastream/plugin");
const http = require("node:http");

class DivoomControllerPlugin extends Plugin {
  async onload() {
    await this.lumia.addLog("[divoom-controller] Plugin loaded");
  }

  async onunload() {
    await this.lumia.addLog("[divoom-controller] Plugin unloaded");
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
            `[divoom-controller] Unknown action type: ${String(action.type)}`
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
        `[divoom-controller] Brightness set to ${value}`
      );
    } else {
      await this.lumia.addLog(
        `[divoom-controller] Failed to set brightness: ${result.error}`
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
        `[divoom-controller] Switched channel (${entry.command}) with ${entry.key}=${payload[entry.key]}`
      );
    } else {
      await this.lumia.addLog(
        `[divoom-controller] Failed to switch channel: ${result.error}`
      );
    }
  }

  async sendText({ message, color, scrollSpeed, direction, repeat }) {
    const trimmed = message.trim();
    if (!trimmed) {
      await this.lumia.addLog(
        "[divoom-controller] Text message cannot be empty"
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
        `[divoom-controller] Sent scrolling text (${trimmed})`
      );
    } else {
      await this.lumia.addLog(
        `[divoom-controller] Failed to send scrolling text: ${result.error}`
      );
    }
  }

  async sendRaw(command, payload) {
    const trimmed = command.trim();
    if (!trimmed) {
      await this.lumia.addLog(
        "[divoom-controller] Raw command requires a command string"
      );
      return;
    }

    const extra = payload && typeof payload === "object" ? payload : {};
    const result = await this.sendCommand(trimmed, extra);

    if (result.success) {
      await this.lumia.addLog(
        `[divoom-controller] Sent raw command ${trimmed}`
      );
    } else {
      await this.lumia.addLog(
        `[divoom-controller] Failed raw command ${trimmed}: ${result.error}`
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
        `[divoom-controller] Failed to parse JSON payload: ${error.message}`
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
