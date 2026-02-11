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
		await this.lumia.addLog(`[openrgb] ${message}`);
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
