const { Plugin } = require("@lumiastream/plugin");

const DEFAULTS = {
	pollInterval: 120,
	minPollInterval: 15,
	maxPollInterval: 900,
	achievementRefreshSeconds: 180,
	ownedGamesRefreshSeconds: 600,
	userAgent: "LumiaStream Steam Plugin/1.0.0",
	logThrottleMs: 5 * 60 * 1000,
	matchThreshold: 0.7,
};

const STEAM_API_BASE = "https://api.steampowered.com";

const ALERT_KEYS = {
	onlineStateChanged: "online_state_changed",
	achievementProgressChanged: "achievement_progress_changed",
	currentGameChanged: "current_game_changed",
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
	requestedGameAppId: "requested_game_appid",
	requestedGameName: "requested_game_name",
	requestedGameAchievementCount: "requested_game_achievement_count",
	requestedGameAchievementUnlocked: "requested_game_achievement_unlocked",
	requestedGameAchievements: "requested_game_achievements",
};

class SteamPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._pollTimer = null;
		this._refreshPromise = null;
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
		this._lastAchievementCount = null;
		this._lastOwnedFetchAt = 0;
		this._lastAchievementsFetchAt = 0;
		this._lastAchievementFetchAppId = 0;
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
			this._lastAchievementCount = null;
			this._lastOwnedFetchAt = 0;
			this._lastAchievementsFetchAt = 0;
			this._lastAchievementFetchAppId = 0;
		}

		await this._refreshData({ reason: "settings-update" });
	}

	async actions(config) {
		for (const action of config.actions) {
			const params = action.value;
			try {
				switch (action.type) {
					case "refresh":
						await this._refreshData({ reason: "manual-action" });
						break;
					case "fetch_game":
						await this._handleFetchGame(params);
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

		await this.lumia.addLog(decorated);
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
			return this._refreshPromise;
		}

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
				if (!achievementAppId) {
					this._lastAchievementFetchAppId = 0;
					this._lastAchievementsFetchAt = 0;
				}

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

				const shouldFetchAchievements =
					Boolean(achievementAppId) &&
					(forceFullRefresh ||
						this._lastAchievementFetchAppId !== achievementAppId ||
						!this._lastAchievementsFetchAt ||
						now - this._lastAchievementsFetchAt >= this._achievementRefreshMs());

				let achievementsResult = { ok: false, data: null };
				if (shouldFetchAchievements) {
					achievementsResult = await this._safeFetch("achievements", () =>
						this._fetchAchievements(steamId, achievementAppId),
					);
					if (achievementsResult.ok) {
						this._lastAchievementsFetchAt = Date.now();
						this._lastAchievementFetchAppId = achievementAppId;
					}
				}

				await this._applySummary(summaryResult.data, steamId);
				if (shouldFetchOwned) {
					await this._applyOwnedGames(ownedResult.data);
				}
				if (shouldFetchAchievements || !achievementAppId) {
					await this._applyAchievements(achievementsResult.data);
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
			}
			this._refreshPromise = null;
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
		)}&steamid=${encodeURIComponent(steamId)}&appid=${targetAppId}`;
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
		};

		return fetch(url, { headers });
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

	async _applyAchievements(payload) {
		if (!payload) {
			await this._setVariableIfChanged(
				VARIABLE_NAMES.currentGameAchievementCount,
				0,
			);
			await this._setVariableIfChanged(
				VARIABLE_NAMES.currentGameAchievementUnlocked,
				0,
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
		if (this.settings?.enableAlerts === false) {
			return;
		}

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
		const unlocked = achievementList
			? achievementList.filter((a) => a?.achieved === 1).length
			: 0;
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
			this._lastAchievementCount = achievementList ? total : null;
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
			await this.lumia.triggerAlert({
				alert: ALERT_KEYS.achievementProgressChanged,
				...this._buildAlertPayload(alertVars, {
					dynamicValue: `${alertVars.current_game_achievement_unlocked_count}/${alertVars.current_game_achievement_count}`,
				}),
			});
		}

		const previousGameAppId = this._lastCurrentGameAppId;
		const previousGameName = this._lastCurrentGameName;
		const changedToNewGame =
			Boolean(currentGameAppId) &&
			(previousGameAppId === null || currentGameAppId !== previousGameAppId);
		const changedToNoGame =
			!currentGameAppId &&
			previousGameAppId !== null &&
			Boolean(this.settings?.alertGameChangedWhenStopped ?? true);

		if (changedToNewGame || changedToNoGame) {
			const dynamicValue = changedToNoGame
				? "Stopped Playing"
				: alertVars.current_game_name;
			await this.lumia.triggerAlert({
				alert: ALERT_KEYS.currentGameChanged,
				...this._buildAlertPayload(alertVars, {
					dynamicValue,
					extraSettings: changedToNoGame
						? { previous_game_name: previousGameName ?? "" }
						: undefined,
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
			this._lastAchievementCount = total;
		}
	}

	async _handleFetchGame(params = {}) {
		if (!this._hasRequiredSettings()) {
			await this._log("Missing Steam API key or Steam ID.", "warn");
			return;
		}

		const gameInput = this._coerceString(params?.game, "").trim();
		if (!gameInput) {
			await this._log("Game name or App ID is required.", "warn");
			return;
		}

		const steamId = await this._resolveSteamId();
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
			if (!appId) {
				const match = this._resolveGameFromOwnedGames(games, gameInput);
				if (!match) {
					await this._log(`No close match found for '${gameInput}'.`, "warn");
					await this._showActionToast(
						`No owned game matched '${gameInput}'.`,
						"warn",
					);
					return;
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
			return;
		}

		const achievements = await this._fetchAchievements(steamId, appId);
		const list = Array.isArray(achievements?.playerstats?.achievements)
			? achievements.playerstats.achievements
			: [];
		const unlocked = list.filter((a) => a?.achieved === 1).length;

		await this._setVariableIfChanged(VARIABLE_NAMES.requestedGameAppId, appId);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.requestedGameName,
			gameName || this._coerceString(gameInput, ""),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.requestedGameAchievementCount,
			list.length,
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.requestedGameAchievementUnlocked,
			unlocked,
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.requestedGameAchievements,
			JSON.stringify(achievements ?? {}),
		);

		await this._showActionToast(
			gameName
				? `Fetched achievements for ${gameName}. Requested game variables updated.`
				: `Fetched achievements for App ID ${appId}. Requested game variables updated.`,
			"success",
		);
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

	_mapPersonaState(value) {
		const map = {
			0: "Offline",
			1: "Online",
			2: "Busy",
			3: "Away",
			4: "Snooze",
			5: "Looking to Trade",
			6: "Looking to Play",
		};
		return map[value] ?? "Offline";
	}

	_buildAlertVariables({
		summary,
		onlineStatus,
		achievementUnlocked,
		achievementCount,
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

	_achievementRefreshMs(settings = this.settings) {
		const pollSeconds = this._pollInterval(settings);
		const refreshSeconds = Math.max(
			DEFAULTS.achievementRefreshSeconds,
			pollSeconds * 2,
		);
		return refreshSeconds * 1000;
	}

	_ownedGamesRefreshMs(settings = this.settings) {
		const pollSeconds = this._pollInterval(settings);
		const refreshSeconds = Math.max(
			DEFAULTS.ownedGamesRefreshSeconds,
			pollSeconds * 5,
		);
		return refreshSeconds * 1000;
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
