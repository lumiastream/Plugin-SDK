const { Plugin } = require("@lumiastream/plugin");

const DEFAULTS = {
	pollInterval: 120,
	minPollInterval: 15,
	maxPollInterval: 900,
	requestTimeoutMs: 15000,
	stuckRefreshMs: 60000,
	ownedGamesRefreshSeconds: 600,
	userAgent: "LumiaStream Steam Plugin/1.0.0",
	logThrottleMs: 5 * 60 * 1000,
	matchThreshold: 0.7,
};

const STEAM_API_BASE = "https://api.steampowered.com";

const ALERT_KEYS = {
	onlineStateChanged: "online_state_changed",
	achievementUnlocked: "achievement_unlocked",
	achievementProgressChanged: "achievement_progress_changed",
	currentGameChanged: "current_game_changed",
	currentGameOver: "current_game_over",
};

const VARIABLE_NAMES = {
	steamId: "steamid",
	username: "persona_username",
	onlineStatus: "online_status",
	lastLogoff: "last_logoff",
	profileUrl: "profile_url",
	avatar: "avatar",
	currentGameName: "current_game_name",
	currentGameAppId: "current_game_appid",
	gameCount: "game_count",
	currentGameAchievementCount: "current_game_achievement_count",
	currentGameAchievementUnlocked: "current_game_achievement_unlocked_count",
	achievementName: "current_game_achievement_name",
	achievementDescription: "current_game_achievement_description",
};

const ACTION_VARIABLE_NAMES = {
	requestedGameInput: "steam_requested_game_input",
	requestedGameAppId: "steam_requested_game_appid",
	requestedGameName: "steam_requested_game_name",
	requestedGameAchievementCount: "steam_requested_game_achievement_count",
	requestedGameAchievementUnlocked: "steam_requested_game_achievement_unlocked",
	requestedGameAchievements: "steam_requested_game_achievements",
};

class SteamPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._pollTimer = null;
		this._refreshPromise = null;
		this._refreshStartedAt = 0;
		this._lastConnectionState = null;
		this._lastVariables = new Map();
		this._logTimestamps = new Map();
		this._globalBackoffUntil = 0;
		this._authFailure = false;
		this._resolvedSteamId = "";
		this._hasInitialSync = false;
		this._lastPersonaState = null;
		this._lastCurrentGameAppId = null;
		this._lastCurrentGameName = "";
		this._lastAchievementAppId = null;
		this._lastAchievementUnlocked = null;
		this._lastAchievementUnlockedKeys = null;
		this._achievementSchemaCache = new Map();
		this._lastOwnedFetchAt = 0;
	}

	async onload() {
		if (!this._hasRequiredSettings()) {
			await this._log("Missing Steam API key or Steam ID.", "warn");
			await this._updateConnectionState(false);
			return;
		}

		await this._refreshData({ reason: "startup" });
		this._schedulePolling();
	}

	async onunload() {
		this._clearPolling();
		await this._updateConnectionState(false);
	}

	async onsettingsupdate(settings, previous = {}) {
		const pollChanged =
			this._pollInterval(settings) !== this._pollInterval(previous);
		const keyChanged = (settings?.apiKey ?? "") !== (previous?.apiKey ?? "");
		const idChanged =
			(settings?.steamIdOrVanity ?? "") !== (previous?.steamIdOrVanity ?? "");

		if (pollChanged) {
			this._schedulePolling();
		}

		if (keyChanged || idChanged) {
			this._authFailure = false;
			this._globalBackoffUntil = 0;
			this._resolvedSteamId = "";
			this._hasInitialSync = false;
			this._lastPersonaState = null;
			this._lastCurrentGameAppId = null;
			this._lastCurrentGameName = "";
			this._lastAchievementAppId = null;
			this._lastAchievementUnlocked = null;
			this._lastAchievementUnlockedKeys = null;
			this._achievementSchemaCache.clear();
			this._lastOwnedFetchAt = 0;
		}

		await this._refreshData({ reason: "settings-update" });
	}

	async actions(config) {
		const actions = Array.isArray(config?.actions) ? config.actions : [];
		const newlyPassedVariables = {};
		for (const action of actions) {
			const params = action.value;
			try {
				switch (action.type) {
					case "refresh":
						await this._refreshData({ reason: "manual-action" });
						break;
					case "fetch_game":
						this._mergeActionVariables(
							newlyPassedVariables,
							await this._handleFetchGame(params),
						);
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

		if (Object.keys(newlyPassedVariables).length) {
			return { newlyPassedVariables };
		}
	}

	_mergeActionVariables(target, variables) {
		if (!variables || typeof variables !== "object") {
			return;
		}
		for (const [key, value] of Object.entries(variables)) {
			if (!key) {
				continue;
			}
			target[key] = value;
		}
	}

	async validateAuth() {
		if (!this._hasRequiredSettings()) {
			return {
				ok: false,
				message: "Missing Steam API key or Steam ID.",
			};
		}

		try {
			const steamId = await this._resolveSteamId();
			await this._fetchPlayerSummary(steamId);
			return { ok: true };
		} catch (error) {
			const message = this._errorMessage(error);
			await this._log(`Steam validation failed: ${message}`, "error");
			return { ok: false, message };
		}
	}

	_tag() {
		return `[${this.manifest?.id ?? "steam"}]`;
	}

	async _log(message, severity = "info") {
		const prefix = this._tag();
		const decorated =
			severity === "warn"
				? `${prefix} ⚠️ ${message}`
				: severity === "error"
					? `${prefix} ❌ ${message}`
					: `${prefix} ${message}`;

		await this.lumia.log(decorated);
	}

	async _logThrottled(
		key,
		message,
		severity = "info",
		intervalMs = DEFAULTS.logThrottleMs,
	) {
		const now = Date.now();
		const last = this._logTimestamps.get(key) ?? 0;
		if (now - last < intervalMs) {
			return;
		}
		this._logTimestamps.set(key, now);
		await this._log(message, severity);
	}

	async _tempDebug(message, { throttleKey = "", intervalMs = 30 * 1000 } = {}) {
		if (!this._debugEnabled()) {
			return;
		}

		const prefixed = `[TEMP DEBUG] ${message}`;
		if (throttleKey) {
			await this._logThrottled(
				`temp-debug:${throttleKey}`,
				prefixed,
				"info",
				intervalMs,
			);
			return;
		}

		await this._log(prefixed, "info");
	}

	async _refreshData({ reason } = {}) {
		if (!this._hasRequiredSettings()) {
			await this._updateConnectionState(false);
			return;
		}

		if (this._authFailure) {
			return;
		}

		const now = Date.now();
		if (this._globalBackoffUntil && now < this._globalBackoffUntil) {
			return;
		}

		if (this._refreshPromise) {
			const elapsed = Date.now() - this._refreshStartedAt;
			if (elapsed <= DEFAULTS.stuckRefreshMs) {
				return this._refreshPromise;
			}
			await this._logThrottled(
				"refresh-stuck",
				`Steam refresh appears stuck for ${Math.round(elapsed / 1000)}s; restarting refresh loop.`,
				"warn",
			);
			this._refreshPromise = null;
			this._refreshStartedAt = 0;
		}

		this._refreshStartedAt = Date.now();
		this._refreshPromise = (async () => {
			try {
				const steamId = await this._resolveSteamId();
				const forceFullRefresh =
					reason === "startup" ||
					reason === "settings-update" ||
					reason === "manual-action";
				const now = Date.now();

				const summaryResult = await this._safeFetch("summary", () =>
					this._fetchPlayerSummary(steamId),
				);
				const achievementAppId = this._determineAchievementAppId(summaryResult.data);

				const shouldFetchOwned =
					forceFullRefresh ||
					!this._lastOwnedFetchAt ||
					now - this._lastOwnedFetchAt >= this._ownedGamesRefreshMs();
				let ownedResult = { ok: false, data: null };
				if (shouldFetchOwned) {
					ownedResult = await this._safeFetch("owned games", () =>
						this._fetchOwnedGames(steamId),
					);
					if (ownedResult.ok) {
						this._lastOwnedFetchAt = Date.now();
					}
				}

				// Poll current-game achievements each cycle so multiple unlocks in
				// the same play session can be detected without long delays.
				const shouldFetchAchievements = Boolean(achievementAppId);

				let achievementsResult = { ok: false, data: null };
				if (shouldFetchAchievements) {
					achievementsResult = await this._safeFetch("achievements", () =>
						this._fetchAchievements(steamId, achievementAppId),
					);
				}

				const currentGameName = this._coerceString(
					summaryResult?.data?.gameextrainfo,
					"",
				);
				const achievementEntries = Array.isArray(
					achievementsResult?.data?.playerstats?.achievements,
				)
					? achievementsResult.data.playerstats.achievements
					: [];
				const achievementCount = achievementEntries.length;
				const unlockedCount = achievementEntries.filter(
					(achievement) => achievement?.achieved === 1,
				).length;
				const achievementSnapshot = this._summarizeAchievements(
					achievementEntries,
					40,
				);
				await this._tempDebug(
					`refresh reason=${reason ?? "unknown"} steamId=${steamId} game='${currentGameName || "none"}' appId=${achievementAppId || 0} summaryOk=${summaryResult.ok} ownedFetched=${shouldFetchOwned} ownedOk=${ownedResult.ok} achievementsFetched=${shouldFetchAchievements} achievementsOk=${shouldFetchAchievements ? achievementsResult.ok : "skipped"} unlocked=${unlockedCount}/${achievementCount} achievements='${achievementSnapshot || "none"}'`,
					{
						throttleKey: `refresh:${achievementAppId || 0}:${
							currentGameName || "none"
						}:${unlockedCount}/${achievementCount}`,
						intervalMs: 15 * 1000,
					},
				);

				await this._applySummary(summaryResult.data, steamId);
				if (shouldFetchOwned) {
					await this._applyOwnedGames(ownedResult.data);
				}
				if (shouldFetchAchievements) {
					await this._applyAchievements(achievementsResult.data);
				} else {
					await this._applyAchievements(null, { clear: true });
				}
				await this._emitAlerts({
					summary: summaryResult.data,
					achievementAppId,
					achievements: shouldFetchAchievements ? achievementsResult.data : null,
				});

				const hadSuccessfulRefresh =
					summaryResult.ok ||
					(shouldFetchOwned && ownedResult.ok) ||
					(shouldFetchAchievements && achievementsResult.ok);

				await this._updateConnectionState(hadSuccessfulRefresh);
			} catch (error) {
				const message = this._errorMessage(error);
				await this._logThrottled(
					"refresh-failure",
					`Failed to refresh Steam data: ${message}`,
					"warn",
				);
				await this._updateConnectionState(false);
			} finally {
				this._refreshPromise = null;
				this._refreshStartedAt = 0;
			}
		})();

		return this._refreshPromise;
	}

	async _resolveSteamId() {
		if (this._resolvedSteamId) {
			return this._resolvedSteamId;
		}

		const input = this._normalizeSteamIdentifier(
			this._coerceString(this.settings?.steamIdOrVanity, "").trim(),
		);
		if (!input) {
			throw new Error("Missing Steam ID or vanity name.");
		}

		if (/^\d{17}$/.test(input)) {
			this._resolvedSteamId = input;
			return input;
		}

		const resolved = await this._fetchResolveVanity(input);
		const steamId = this._coerceString(resolved?.steamid, "");
		if (!steamId) {
			throw new Error("Could not resolve vanity URL.");
		}

		this._resolvedSteamId = steamId;
		return steamId;
	}

	_normalizeSteamIdentifier(value) {
		if (!value) return "";
		const raw = String(value).trim();
		if (!raw) return "";

		const profileMatch = raw.match(
			/^https?:\/\/steamcommunity\.com\/(id|profiles)\/([^\/?#]+).*$/i,
		);
		if (profileMatch) {
			const [, type, identifier] = profileMatch;
			if (type.toLowerCase() === "profiles") {
				return identifier;
			}
			return identifier;
		}

		return raw;
	}

	async _fetchResolveVanity(vanity) {
		const url = `${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/?key=${encodeURIComponent(
			this._apiKey(),
		)}&vanityurl=${encodeURIComponent(vanity)}&url_type=1`;
		const response = await this._fetchJson(url);
		return response?.response ?? null;
	}

	async _fetchPlayerSummary(steamId) {
		const url = `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${encodeURIComponent(
			this._apiKey(),
		)}&steamids=${encodeURIComponent(steamId)}`;
		const response = await this._fetchJson(url);
		return response?.response?.players?.[0] ?? null;
	}

	async _fetchOwnedGames(steamId) {
		const url = `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/?key=${encodeURIComponent(
			this._apiKey(),
		)}&steamid=${encodeURIComponent(steamId)}&include_appinfo=0&include_played_free_games=1`;
		return this._fetchJson(url);
	}

	async _fetchAchievements(steamId, appId) {
		const targetAppId = this._coerceNumber(appId, 0);
		if (!targetAppId) {
			return null;
		}

		const url = `${STEAM_API_BASE}/ISteamUserStats/GetPlayerAchievements/v1/?key=${encodeURIComponent(
			this._apiKey(),
		)}&steamid=${encodeURIComponent(steamId)}&appid=${targetAppId}&l=en&_=${Date.now()}`;
		return this._fetchJson(url);
	}

	async _fetchAchievementSchema(appId) {
		const targetAppId = this._coerceNumber(appId, 0);
		if (!targetAppId) {
			return null;
		}

		const url = `${STEAM_API_BASE}/ISteamUserStats/GetSchemaForGame/v2/?key=${encodeURIComponent(
			this._apiKey(),
		)}&appid=${targetAppId}&l=en`;
		return this._fetchJson(url);
	}

	async _fetchOwnedGamesWithInfo(steamId) {
		const url = `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/?key=${encodeURIComponent(
			this._apiKey(),
		)}&steamid=${encodeURIComponent(steamId)}&include_appinfo=1&include_played_free_games=1`;
		return this._fetchJson(url);
	}

	_determineAchievementAppId(summary) {
		const summaryGameId = this._coerceNumber(summary?.gameid, 0);
		if (summaryGameId) {
			return summaryGameId;
		}
		return 0;
	}

	async _fetchJson(url) {
		let response = await this._request(url);
		if (url.includes("/ISteamUserStats/GetPlayerAchievements/")) {
			const appIdMatch = url.match(/[?&]appid=(\d+)/);
			const appId = appIdMatch?.[1] ?? "unknown";
			await this._tempDebug(
				`achievement_http appId=${appId} status=${response.status} cacheControl='${this._coerceString(response.headers.get("cache-control"), "")}' age='${this._coerceString(response.headers.get("age"), "")}' etag='${this._coerceString(response.headers.get("etag"), "")}'`,
				{ throttleKey: `achievement-http:${appId}:${response.status}`, intervalMs: 10 * 1000 },
			);
		}

		if (response.status === 429) {
			const retryAfter = this._coerceNumber(
				response.headers.get("Retry-After"),
				60,
			);
			this._applyGlobalBackoff(retryAfter);
			throw new Error(`Rate limited (429). Backing off for ${retryAfter}s.`);
		}

		if (response.status === 401 || response.status === 403) {
			this._authFailure = true;
			this._clearPolling();
			await this._showApiKeyFailureToast();
			throw new Error("Unauthorized. Check your Steam API key.");
		}

		if (!response.ok) {
			const body = await response.text();
			const trimmed = this._truncateError(body);
			throw new Error(
				`Steam API error (${response.status}) on ${url}: ${trimmed || "No response body"}`,
			);
		}

		return response.json();
	}

	async _request(url) {
		const headers = {
			Accept: "application/json",
			"User-Agent": DEFAULTS.userAgent,
			"Cache-Control": "no-cache, no-store, max-age=0",
			Pragma: "no-cache",
		};
		const timeoutMs = Math.max(1000, DEFAULTS.requestTimeoutMs);
		const supportsAbort = typeof AbortController !== "undefined";

		if (!supportsAbort) {
			let timeoutId = null;
			try {
				return await Promise.race([
					fetch(url, { headers, cache: "no-store" }),
					new Promise((_, reject) => {
						timeoutId = setTimeout(() => {
							reject(new Error(`Steam request timed out after ${timeoutMs}ms.`));
						}, timeoutMs);
					}),
				]);
			} finally {
				if (timeoutId) {
					clearTimeout(timeoutId);
				}
			}
		}

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
		try {
			return await fetch(url, {
				headers,
				cache: "no-store",
				signal: controller.signal,
			});
		} catch (error) {
			if (error?.name === "AbortError") {
				throw new Error(`Steam request timed out after ${timeoutMs}ms.`);
			}
			throw error;
		} finally {
			clearTimeout(timeoutId);
		}
	}

	async _applySummary(summary, steamId) {
		if (!summary) {
			await this._setVariableIfChanged(VARIABLE_NAMES.steamId, steamId);
			return;
		}

		await this._setVariableIfChanged(
			VARIABLE_NAMES.steamId,
			this._coerceString(summary?.steamid ?? steamId, ""),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.username,
			this._coerceString(summary?.personaname, ""),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.onlineStatus,
			this._mapPersonaState(this._coerceNumber(summary?.personastate, 0)),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.lastLogoff,
			this._coerceNumber(summary?.lastlogoff, 0),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.profileUrl,
			this._coerceString(summary?.profileurl, ""),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.avatar,
			this._coerceString(summary?.avatarfull, ""),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.currentGameName,
			this._coerceString(summary?.gameextrainfo, ""),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.currentGameAppId,
			this._coerceNumber(summary?.gameid, 0),
		);
	}

	async _applyOwnedGames(owned) {
		if (!owned) {
			return;
		}

		await this._setVariableIfChanged(
			VARIABLE_NAMES.gameCount,
			this._coerceNumber(owned?.response?.game_count, 0),
		);
	}

	async _applyAchievements(payload, { clear = false } = {}) {
		if (!payload) {
			if (!clear) {
				return;
			}
			await this._setVariableIfChanged(
				VARIABLE_NAMES.currentGameAchievementCount,
				0,
			);
			await this._setVariableIfChanged(
				VARIABLE_NAMES.currentGameAchievementUnlocked,
				0,
			);
			await this._setVariableIfChanged(VARIABLE_NAMES.achievementName, "");
			await this._setVariableIfChanged(
				VARIABLE_NAMES.achievementDescription,
				"",
			);
			return;
		}

		const achievements = Array.isArray(payload?.playerstats?.achievements)
			? payload.playerstats.achievements
			: [];
		const unlocked = achievements.filter((a) => a?.achieved === 1).length;

		await this._setVariableIfChanged(
			VARIABLE_NAMES.currentGameAchievementCount,
			achievements.length,
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.currentGameAchievementUnlocked,
			unlocked,
		);
	}

	async _emitAlerts({ summary, achievementAppId, achievements }) {
		const hasSummary = Boolean(summary && typeof summary === "object");
		// Do not emit status/game-change alerts until we have at least one real
		// profile snapshot to use as baseline.
		if (!hasSummary) {
			return;
		}
		const personaStateRaw = hasSummary
			? this._coerceNumber(summary?.personastate, 0)
			: null;
		const personaState =
			personaStateRaw === null ? null : this._mapPersonaState(personaStateRaw);
		const currentGameAppId = this._coerceNumber(summary?.gameid, 0);
		const currentGameName = this._coerceString(summary?.gameextrainfo, "");

		const achievementList = Array.isArray(
			achievements?.playerstats?.achievements,
		)
			? achievements.playerstats.achievements
			: null;
		const unlockedAchievements = achievementList
			? achievementList.filter((a) => a?.achieved === 1)
			: [];
		const unlockedAchievementKeys = achievementList
			? this._getAchievementUnlockedKeys(unlockedAchievements)
			: null;
		const unlocked = unlockedAchievements.length;
		const total = achievementList ? achievementList.length : 0;
		const alertVars = this._buildAlertVariables({
			summary,
			onlineStatus: personaState,
			achievementUnlocked: unlocked,
			achievementCount: total,
		});

		if (!this._hasInitialSync) {
			this._lastPersonaState = personaState;
			this._lastCurrentGameAppId = currentGameAppId || null;
			this._lastCurrentGameName = currentGameName;
			this._lastAchievementAppId = achievementAppId || null;
			this._lastAchievementUnlocked = achievementList ? unlocked : null;
			this._lastAchievementUnlockedKeys = unlockedAchievementKeys;
			this._hasInitialSync = true;
			return;
		}

		if (
			personaState !== null &&
			this._lastPersonaState !== null &&
			personaState !== this._lastPersonaState
		) {
			await this.lumia.triggerAlert({
				alert: ALERT_KEYS.onlineStateChanged,
				...this._buildAlertPayload(alertVars, {
					dynamicValue: alertVars.online_status,
				}),
			});
		}

		if (
			achievementList &&
			achievementAppId &&
			this._lastAchievementAppId === achievementAppId &&
			this._lastAchievementUnlocked !== null &&
			unlocked !== this._lastAchievementUnlocked
		) {
			const newlyUnlocked = unlockedAchievements.filter((achievement) => {
				const key = this._achievementKey(achievement);
				if (!key) {
					return false;
				}

				return !this._lastAchievementUnlockedKeys?.has(key);
			});
			const achievementAlertVars = this._buildAlertVariables({
				summary,
				onlineStatus: personaState,
				achievementUnlocked: unlocked,
				achievementCount: total,
				achievementName: "",
				achievementDescription: "",
			});

			const sortedNewlyUnlocked = [...newlyUnlocked].sort(
				(a, b) =>
					this._coerceNumber(a?.unlocktime, 0) -
					this._coerceNumber(b?.unlocktime, 0),
			);
			for (const unlockedAchievement of sortedNewlyUnlocked) {
				const unlockedDetails = await this._resolveAchievementDetails(
					achievementAppId,
					unlockedAchievement,
				);
				const unlockedAlertVars = this._buildAlertVariables({
					summary,
					onlineStatus: personaState,
					achievementUnlocked: unlocked,
					achievementCount: total,
					achievementName: unlockedDetails.name,
					achievementDescription: unlockedDetails.description,
				});
				await this._setVariableIfChanged(
					VARIABLE_NAMES.achievementName,
					unlockedDetails.name,
				);
				await this._setVariableIfChanged(
					VARIABLE_NAMES.achievementDescription,
					unlockedDetails.description,
				);
				await this.lumia.triggerAlert({
					alert: ALERT_KEYS.achievementUnlocked,
					...this._buildAlertPayload(unlockedAlertVars, {
						dynamicValue: unlockedAlertVars.achievement_name,
					}),
				});
			}

			await this.lumia.triggerAlert({
				alert: ALERT_KEYS.achievementProgressChanged,
				...this._buildAlertPayload(achievementAlertVars, {
					dynamicValue: `${achievementAlertVars.current_game_achievement_unlocked_count}/${achievementAlertVars.current_game_achievement_count}`,
				}),
			});
		}

		const previousGameAppId = this._lastCurrentGameAppId;
		const previousGameName = this._lastCurrentGameName;
		const changedToNewGame =
			Boolean(currentGameAppId) &&
			(previousGameAppId === null || currentGameAppId !== previousGameAppId);
		const changedToNoGame =
			!currentGameAppId && previousGameAppId !== null;

		if (changedToNewGame) {
			await this.lumia.triggerAlert({
				alert: ALERT_KEYS.currentGameChanged,
				...this._buildAlertPayload(alertVars, {
					dynamicValue: alertVars.current_game_name,
				}),
			});
		}

		if (changedToNoGame) {
			await this.lumia.triggerAlert({
				alert: ALERT_KEYS.currentGameOver,
				...this._buildAlertPayload(alertVars, {
					dynamicValue: previousGameName || "Stopped Playing",
					extraSettings: { previous_game_name: previousGameName ?? "" },
				}),
			});
		}

		if (personaState !== null) {
			this._lastPersonaState = personaState;
		}
		if (currentGameAppId) {
			this._lastCurrentGameAppId = currentGameAppId;
		} else {
			this._lastCurrentGameAppId = null;
		}
		this._lastCurrentGameName = currentGameName;
		if (achievementAppId && achievementList) {
			this._lastAchievementAppId = achievementAppId;
			this._lastAchievementUnlocked = unlocked;
			this._lastAchievementUnlockedKeys = unlockedAchievementKeys;
		}
	}

	_achievementKey(achievement) {
		const key = this._coerceString(achievement?.apiname, "").trim();
		return key || "";
	}

	_getAchievementUnlockedKeys(achievementList) {
		const keys = new Set();
		for (const achievement of achievementList) {
			const key = this._achievementKey(achievement);
			if (!key) {
				continue;
			}
			keys.add(key);
		}
		return keys;
	}

	async _getAchievementSchemaByApp(appId) {
		const targetAppId = this._coerceNumber(appId, 0);
		if (!targetAppId) {
			return null;
		}

		if (this._achievementSchemaCache.has(targetAppId)) {
			return this._achievementSchemaCache.get(targetAppId);
		}

		const schemaResult = await this._safeFetch("achievement schema", () =>
			this._fetchAchievementSchema(targetAppId),
		);
		const schemaAchievements = Array.isArray(
			schemaResult?.data?.game?.availableGameStats?.achievements,
		)
			? schemaResult.data.game.availableGameStats.achievements
			: [];
		const schemaMap = new Map();
		for (const achievement of schemaAchievements) {
			const key = this._coerceString(achievement?.name, "").trim();
			if (!key) {
				continue;
			}
			schemaMap.set(key, {
				name: this._coerceString(
					achievement?.displayName ?? achievement?.name,
					"",
				),
				description: this._coerceString(achievement?.description, ""),
			});
		}

		this._achievementSchemaCache.set(targetAppId, schemaMap);
		return schemaMap;
	}

	async _resolveAchievementDetails(appId, achievement) {
		const apiName = this._coerceString(achievement?.apiname, "").trim();
		if (!apiName) {
			return { name: "", description: "" };
		}

		const runtimeName = this._coerceString(
			achievement?.name ?? achievement?.displayName,
			"",
		).trim();
		const runtimeDescription = this._coerceString(
			achievement?.description,
			"",
		).trim();
		if (runtimeName && runtimeDescription) {
			return { name: runtimeName, description: runtimeDescription };
		}

		const schemaMap = await this._getAchievementSchemaByApp(appId);
		const schemaMatch = schemaMap?.get(apiName);

		return {
			name: runtimeName || this._coerceString(schemaMatch?.name, apiName),
			description:
				runtimeDescription || this._coerceString(schemaMatch?.description, ""),
		};
	}

	async _handleFetchGame(params = {}) {
		if (!this._hasRequiredSettings()) {
			await this._log("Missing Steam API key or Steam ID.", "warn");
			return null;
		}

		const gameInput = this._coerceString(params?.game, "").trim();
		if (!gameInput) {
			await this._log("Game name or App ID is required.", "warn");
			return null;
		}

		const steamId = await this._resolveSteamId();
		await this._tempDebug(
			`fetch_game input='${gameInput}' steamId=${steamId}`,
		);
		let appId = null;
		let gameName = "";

		const numericOnly = gameInput.match(/^\d+$/);
		if (numericOnly) {
			appId = this._coerceNumber(numericOnly[0], 0);
		}

		let ownedGames = null;
		if (!appId || !gameName) {
			ownedGames = await this._fetchOwnedGamesWithInfo(steamId);
			const games = Array.isArray(ownedGames?.response?.games)
				? ownedGames.response.games
				: [];
			const ownedSample = games
				.slice(0, 5)
				.map((game) => this._coerceString(game?.name, ""))
				.filter(Boolean)
				.join(" | ");
			await this._tempDebug(
				`fetch_game ownedGamesCount=${games.length} sample='${ownedSample}'`,
			);
			if (!appId) {
				const match = this._resolveGameFromOwnedGames(games, gameInput);
				if (!match) {
					const ranked = this._rankGameMatches(games, gameInput)
						.slice(0, 5)
						.map((item) => `${item.name} (${item.appid}) score=${item.score}`)
						.join(" | ");
					await this._tempDebug(
						`fetch_game no_match input='${gameInput}' topMatches='${ranked || "none"}'`,
					);
					await this._log(`No close match found for '${gameInput}'.`, "warn");
					await this._showActionToast(
						`No owned game matched '${gameInput}'.`,
						"warn",
					);
					return null;
				}
				appId = match.appid;
				gameName = match.name;
			} else {
				const found = games.find(
					(game) => String(game?.appid) === String(appId),
				);
				gameName = this._coerceString(found?.name, "");
			}

			// No search results variable exposed.
		}

		if (!appId) {
			await this._log(`Unable to resolve game '${gameInput}'.`, "warn");
			await this._showActionToast(
				`Unable to resolve game '${gameInput}'.`,
				"warn",
			);
			return null;
		}
		await this._tempDebug(
			`fetch_game resolved appId=${appId} gameName='${gameName || "unknown"}'`,
		);

		const achievements = await this._fetchAchievements(steamId, appId);
		const list = Array.isArray(achievements?.playerstats?.achievements)
			? achievements.playerstats.achievements
			: [];
		const unlocked = list.filter((a) => a?.achieved === 1).length;
		const achievementSnapshot = this._summarizeAchievements(list, 80);
		const playerStatsSuccess = achievements?.playerstats?.success;
		const playerStatsGameName = this._coerceString(
			achievements?.playerstats?.gameName,
			"",
		);
		await this._tempDebug(
			`fetch_game achievements appId=${appId} playerStatsSuccess=${
				playerStatsSuccess === undefined ? "undefined" : playerStatsSuccess
			} gameName='${playerStatsGameName || gameName || "unknown"}' unlocked=${unlocked}/${list.length} achievements='${achievementSnapshot || "none"}'`,
		);

		const resolvedGameName = gameName || this._coerceString(gameInput, "");
		const actionVariables = {
			[ACTION_VARIABLE_NAMES.requestedGameInput]: gameInput,
			[ACTION_VARIABLE_NAMES.requestedGameAppId]: appId,
			[ACTION_VARIABLE_NAMES.requestedGameName]: resolvedGameName,
			[ACTION_VARIABLE_NAMES.requestedGameAchievementCount]: list.length,
			[ACTION_VARIABLE_NAMES.requestedGameAchievementUnlocked]: unlocked,
			[ACTION_VARIABLE_NAMES.requestedGameAchievements]: JSON.stringify(
				achievements ?? {},
			),
		};

		await this._showActionToast(
			gameName
				? `Fetched achievements for ${gameName}.`
				: `Fetched achievements for App ID ${appId}.`,
			"success",
		);

		return actionVariables;
	}

	_resolveGameFromOwnedGames(games, input) {
		const ranked = this._rankGameMatches(games, input);
		if (!ranked.length) return null;
		const best = ranked[0];
		if (best.score < DEFAULTS.matchThreshold) {
			return null;
		}
		return best;
	}

	_rankGameMatches(games, input) {
		const normalizedInput = this._normalizeMatchText(input);
		if (!normalizedInput) return [];

		const results = [];
		for (const game of games) {
			const name = this._coerceString(game?.name, "");
			if (!name) continue;
			const score = this._scoreMatch(name, normalizedInput);
			if (score <= 0) continue;
			results.push({
				appid: game.appid,
				name,
				score: Number(score.toFixed(3)),
			});
		}

		results.sort((a, b) => b.score - a.score);
		return results.slice(0, 10);
	}

	_scoreMatch(name, normalizedInput) {
		const normalizedName = this._normalizeMatchText(name);
		if (!normalizedName) return 0;

		if (normalizedName === normalizedInput) return 1;
		if (normalizedName.startsWith(normalizedInput)) return 0.95;
		if (normalizedInput.startsWith(normalizedName)) return 0.9;
		if (
			normalizedName.includes(normalizedInput) ||
			normalizedInput.includes(normalizedName)
		) {
			return 0.85;
		}
		const distance = this._levenshtein(normalizedName, normalizedInput);
		const maxLen = Math.max(normalizedName.length, normalizedInput.length);
		return maxLen ? 1 - distance / maxLen : 0;
	}

	_normalizeMatchText(value) {
		return this._coerceString(value, "")
			.toLowerCase()
			.replace(/\s+/g, " ")
			.trim();
	}

	_summarizeAchievementEntry(achievement) {
		const key = this._coerceString(
			achievement?.apiname ?? achievement?.name ?? achievement?.displayName,
			"unknown",
		).trim();
		const achieved = achievement?.achieved === 1 ? 1 : 0;
		return `${key}:${achieved}`;
	}

	_summarizeAchievements(achievementList, limit = 40) {
		if (!Array.isArray(achievementList) || !achievementList.length) {
			return "";
		}

		const max = Math.max(1, this._coerceNumber(limit, 40));
		const limited = achievementList.slice(0, max);
		const summary = limited
			.map((achievement) => this._summarizeAchievementEntry(achievement))
			.join(", ");
		const remaining = achievementList.length - limited.length;
		if (remaining > 0) {
			return `${summary} ... +${remaining} more`;
		}
		return summary;
	}

	_mapPersonaState(value) {
		return this._coerceNumber(value, 0) === 0 ? "Offline" : "Online";
	}

	_buildAlertVariables({
		summary,
		onlineStatus,
		achievementUnlocked,
		achievementCount,
		achievementName = "",
		achievementDescription = "",
	}) {
		return {
			persona_username: this._coerceString(summary?.personaname, ""),
			online_status: this._coerceString(onlineStatus, ""),
			current_game_name: this._coerceString(summary?.gameextrainfo, ""),
			current_game_appid: this._coerceNumber(summary?.gameid, 0),
			current_game_achievement_unlocked_count: this._coerceNumber(
				achievementUnlocked,
				0,
			),
			current_game_achievement_count: this._coerceNumber(achievementCount, 0),
			achievement_name: this._coerceString(achievementName, ""),
			achievement_description: this._coerceString(achievementDescription, ""),
		};
	}

	_buildAlertPayload(variables, { dynamicValue, extraSettings } = {}) {
		const value =
			dynamicValue ??
			variables.current_game_name ??
			variables.persona_username ??
			"";
		return {
			dynamic: {
				value,
				online_status: variables.online_status,
			},
			extraSettings: {
				...(variables ?? {}),
				...(extraSettings ?? {}),
			},
		};
	}

	_levenshtein(a, b) {
		if (a === b) return 0;
		if (!a) return b.length;
		if (!b) return a.length;

		const matrix = Array.from({ length: a.length + 1 }, () =>
			new Array(b.length + 1).fill(0),
		);

		for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
		for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

		for (let i = 1; i <= a.length; i++) {
			for (let j = 1; j <= b.length; j++) {
				const cost = a[i - 1] === b[j - 1] ? 0 : 1;
				matrix[i][j] = Math.min(
					matrix[i - 1][j] + 1,
					matrix[i][j - 1] + 1,
					matrix[i - 1][j - 1] + cost,
				);
			}
		}

		return matrix[a.length][b.length];
	}

	_applyGlobalBackoff(seconds) {
		const delayMs = Math.max(0, this._coerceNumber(seconds, 0)) * 1000;
		const until = Date.now() + delayMs;
		if (!this._globalBackoffUntil || until > this._globalBackoffUntil) {
			this._globalBackoffUntil = until;
		}
	}

	async _showApiKeyFailureToast() {
		if (typeof this.lumia?.showToast !== "function") {
			return;
		}
		try {
			await this.lumia.showToast({
				message: "Invalid Steam API key. Update the plugin settings.",
				time: 6,
			});
		} catch (error) {
			return;
		}
	}

	async _showActionToast(message, type = "info") {
		if (typeof this.lumia?.showToast !== "function") {
			return;
		}
		try {
			await this.lumia.showToast({
				message,
				time: 4,
				type,
			});
		} catch (error) {
			return;
		}
	}

	_schedulePolling() {
		this._clearPolling();

		const intervalSeconds = this._pollInterval(this.settings);
		if (!this._hasRequiredSettings() || intervalSeconds <= 0) {
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

	_hasRequiredSettings() {
		return Boolean(this._apiKey() && this._steamIdInput());
	}

	_apiKey() {
		return this._coerceString(this.settings?.apiKey, "");
	}

	_steamIdInput() {
		return this._coerceString(this.settings?.steamIdOrVanity, "");
	}

	_pollInterval(settings = this.settings) {
		const interval = this._coerceNumber(
			settings?.pollInterval,
			DEFAULTS.pollInterval,
		);
		if (!Number.isFinite(interval)) {
			return DEFAULTS.pollInterval;
		}
		return Math.min(
			Math.max(interval, DEFAULTS.minPollInterval),
			DEFAULTS.maxPollInterval,
		);
	}

	_ownedGamesRefreshMs(settings = this.settings) {
		const pollSeconds = this._pollInterval(settings);
		const refreshSeconds = Math.max(
			DEFAULTS.ownedGamesRefreshSeconds,
			pollSeconds * 5,
		);
		return refreshSeconds * 1000;
	}

	_debugEnabled(settings = this.settings) {
		return Boolean(settings?.debugLogs);
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

	async _safeFetch(label, fn) {
		try {
			return { ok: true, data: await fn() };
		} catch (error) {
			const message = this._errorMessage(error);
			await this._logThrottled(
				`fetch:${label}:${message}`,
				`${label} fetch failed: ${message}`,
				"warn",
			);
			return { ok: false, data: null };
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

	_truncateError(value) {
		if (!value) {
			return "";
		}
		const trimmed = String(value).replace(/\s+/g, " ").trim();
		return trimmed.length > 200 ? `${trimmed.slice(0, 200)}…` : trimmed;
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

module.exports = SteamPlugin;
