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
			await this.lumia.log(
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
			await this.lumia.log(
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
			await this.lumia.log(
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
					await this.lumia.log(
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
