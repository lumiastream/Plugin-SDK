const { Plugin } = require("@lumiastream/plugin");

const DEFAULTS = {
	pollInterval: 30,
	minPollInterval: 15,
	maxPollInterval: 900,
	recentAchievementsWindowMinutes: 120,
	recentPlayedCount: 100,
	userAgent: "LumiaStream RetroAchievements Plugin/1.0.0",
	logThrottleMs: 5 * 60 * 1000,
	matchThreshold: 0.7,
	maxSeenUnlocks: 2000,
};

const RA_API_BASE = "https://retroachievements.org/API";
const RA_SITE_BASE = "https://retroachievements.org";

const ALERT_KEYS = {
	currentGameChanged: "current_game_changed",
	achievementUnlocked: "achievement_unlocked",
	hardcoreAchievementUnlocked: "hardcore_achievement_unlocked",
};

const VARIABLE_NAMES = {
	totalPoints: "total_points",
	totalSoftcorePoints: "total_softcore_points",
	totalTruePoints: "total_true_points",
	totalRank: "total_rank",
	lastGameId: "last_game_id",
	lastGameTitle: "last_game_title",
	lastGameConsole: "last_game_console",
	lastGameIcon: "last_game_icon",
	lastGameAchievementTotal: "last_game_achievement_total",
	lastGameAchievementUnlocked: "last_game_achievement_unlocked",
	lastGameAchievementUnlockedHardcore: "last_game_achievement_unlocked_hardcore",
	lastGameCompletion: "last_game_completion",
};

const ACTION_VARIABLE_NAMES = {
	username: "retro_achievements_username",
	requestedGameId: "retro_achievements_requested_game_id",
	requestedGameTitle: "retro_achievements_requested_game_title",
	requestedGameConsole: "retro_achievements_requested_game_console",
	requestedGameIcon: "retro_achievements_requested_game_icon",
	requestedGameAchievementTotal:
		"retro_achievements_requested_game_achievement_total",
	requestedGameAchievementUnlocked:
		"retro_achievements_requested_game_achievement_unlocked",
	requestedGameAchievementUnlockedHardcore:
		"retro_achievements_requested_game_achievement_unlocked_hardcore",
	requestedGameCompletion: "retro_achievements_requested_game_completion",
	requestedGamePayload: "retro_achievements_requested_game_payload",
};

class RetroAchievementsPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._pollTimer = null;
		this._refreshPromise = null;
		this._lastConnectionState = null;
		this._lastVariables = new Map();
		this._logTimestamps = new Map();
		this._hasInitialSync = false;
		this._lastGameId = null;
		this._lastGameTitle = "";
		this._seenUnlockKeys = new Set();
		this._seenUnlockOrder = [];
	}

	async onload() {
		if (!this._hasRequiredSettings()) {
			await this._log("Missing RetroAchievements API key or username.", "warn");
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

	async onsettingsupdate(settings = {}, previous = {}) {
		const pollChanged =
			this._pollIntervalSeconds(settings) !== this._pollIntervalSeconds(previous);
		const authChanged =
			this._coerceString(settings?.apiKey, "") !==
				this._coerceString(previous?.apiKey, "") ||
			this._coerceString(settings?.username, "").trim().toLowerCase() !==
				this._coerceString(previous?.username, "").trim().toLowerCase();

		if (pollChanged) {
			this._schedulePolling();
		}

		if (authChanged) {
			this._resetRuntimeState();
		}

		await this._refreshData({ reason: "settings-update" });
	}

	async actions(config = {}) {
		const actions = Array.isArray(config.actions) ? config.actions : [];
		const newlyPassedVariables = {};
		for (const action of actions) {
			try {
				switch (action?.type) {
					case "refresh":
						await this._refreshData({ reason: "manual-action" });
						break;
					case "fetch_game":
						this._mergeActionVariables(
							newlyPassedVariables,
							await this._handleFetchGame(action?.value || {}),
						);
						break;
					default:
						break;
				}
			} catch (error) {
				await this._log(
					`Action ${this._coerceString(action?.type, "unknown")} failed: ${this._errorMessage(error)}`,
					"error",
				);
			}
		}

		if (Object.keys(newlyPassedVariables).length) {
			return { newlyPassedVariables };
		}
	}

	async validateAuth(data = {}) {
		const apiKey = this._coerceString(data?.apiKey, this._apiKey()).trim();
		const username = this._coerceString(data?.username, this._username()).trim();
		if (!apiKey || !username) {
			return false;
		}

		try {
			const profile = await this._fetchUserProfile({ apiKey, username });
			return Boolean(this._coerceString(profile?.User, "").trim());
		} catch (error) {
			await this._log(
				`RetroAchievements validation failed: ${this._errorMessage(error)}`,
				"warn",
			);
			return false;
		}
	}

	_tag() {
		return `[${this.manifest?.id ?? "retro_achievements"}]`;
	}

	async _log(message, severity = "info") {
		const prefix = this._tag();
		let decorated = `${prefix} ${message}`;
		if (severity === "warn") {
			decorated = `${prefix} WARN ${message}`;
		}
		if (severity === "error") {
			decorated = `${prefix} ERROR ${message}`;
		}
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

	async _tempDebug(message, { throttleKey = "", intervalMs = 20 * 1000 } = {}) {
		if (!this._debugEnabled()) {
			return;
		}

		if (throttleKey) {
			await this._logThrottled(
				`debug:${throttleKey}`,
				`[debug] ${message}`,
				"info",
				intervalMs,
			);
			return;
		}

		await this._log(`[debug] ${message}`);
	}

	_resetRuntimeState() {
		this._hasInitialSync = false;
		this._lastGameId = null;
		this._lastGameTitle = "";
		this._seenUnlockKeys.clear();
		this._seenUnlockOrder = [];
	}

	async _refreshData({ reason = "poll" } = {}) {
		if (!this._hasRequiredSettings()) {
			await this._updateConnectionState(false);
			return;
		}

		if (this._refreshPromise) {
			return this._refreshPromise;
		}

		this._refreshPromise = (async () => {
			try {
				const profile = await this._fetchUserProfile();
				const currentGameId = this._profileLastGameId(profile);

				const recentPlayedResult = await this._safeFetch("recently played games", () =>
					this._fetchRecentlyPlayedGames(),
				);
				const recentAchievementsResult = await this._safeFetch(
					"recent achievements",
					() => this._fetchRecentAchievements(),
				);
				const gameProgressResult = currentGameId
					? await this._safeFetch("current game progress", () =>
							this._fetchGameInfoAndUserProgress(currentGameId),
						)
					: { ok: false, data: null };

				const currentGame = this._findRecentlyPlayedGame(
					recentPlayedResult.data,
					currentGameId,
				);
				const sortedRecentAchievements = this._sortRecentAchievements(
					recentAchievementsResult.data,
				);

				await this._applyProfile(profile, currentGame);
				await this._applyGameProgress(gameProgressResult.data, currentGame);

				await this._emitAlerts({
					profile,
					currentGame,
					gameProgress: gameProgressResult.data,
					recentAchievements: sortedRecentAchievements,
				});

				await this._tempDebug(
					`refresh reason=${reason} user=${this._profileUser(profile)} gameId=${currentGameId} recentUnlocks=${sortedRecentAchievements.length} points=${this._profileTotalPoints(profile)}/${this._profileSoftcorePoints(profile)}/${this._profileTruePoints(profile)}`,
					{
						throttleKey: `refresh:${currentGameId}:${sortedRecentAchievements.length}`,
						intervalMs: 15 * 1000,
					},
				);

				await this._updateConnectionState(true);
			} catch (error) {
				await this._logThrottled(
					"refresh-failed",
					`RetroAchievements refresh failed: ${this._errorMessage(error)}`,
					"warn",
				);
				await this._updateConnectionState(false);
			}

			this._refreshPromise = null;
		})();

		return this._refreshPromise;
	}

	async _fetchUserProfile(overrides = {}) {
		const apiKey = this._coerceString(overrides.apiKey, this._apiKey()).trim();
		const username = this._coerceString(overrides.username, this._username()).trim();

		const query = new URLSearchParams({
			y: apiKey,
			u: username,
		});
		const url = `${RA_API_BASE}/API_GetUserProfile.php?${query.toString()}`;
		const response = await this._fetchJson(url);
		if (!response || typeof response !== "object" || Array.isArray(response)) {
			throw new Error("Unexpected profile response from RetroAchievements API.");
		}
		if (!this._profileUser(response)) {
			throw new Error("RetroAchievements profile response did not include a user.");
		}
		return response;
	}

	async _fetchRecentlyPlayedGames() {
		const query = new URLSearchParams({
			y: this._apiKey(),
			u: this._username(),
			c: String(DEFAULTS.recentPlayedCount),
		});
		const url = `${RA_API_BASE}/API_GetUserRecentlyPlayedGames.php?${query.toString()}`;
		const response = await this._fetchJson(url);
		if (Array.isArray(response)) {
			return response;
		}
		return [];
	}

	async _fetchRecentAchievements() {
		const query = new URLSearchParams({
			y: this._apiKey(),
			u: this._username(),
			m: String(DEFAULTS.recentAchievementsWindowMinutes),
		});
		const url = `${RA_API_BASE}/API_GetUserRecentAchievements.php?${query.toString()}`;
		const response = await this._fetchJson(url);
		if (Array.isArray(response)) {
			return response;
		}
		return [];
	}

	async _fetchGameInfoAndUserProgress(gameId) {
		const targetGameId = this._coerceNumber(gameId, 0);
		if (!targetGameId) {
			return null;
		}

		const query = new URLSearchParams({
			y: this._apiKey(),
			u: this._username(),
			g: String(targetGameId),
		});
		const url = `${RA_API_BASE}/API_GetGameInfoAndUserProgress.php?${query.toString()}`;
		const response = await this._fetchJson(url);
		if (!response || typeof response !== "object" || Array.isArray(response)) {
			return null;
		}
		return response;
	}

	async _fetchJson(url) {
		const response = await this._request(url);
		if (!response.ok) {
			const body = await response.text();
			throw new Error(
				`RetroAchievements API error (${response.status}) on ${url}: ${this._truncateError(body) || "No response body"}`,
			);
		}

		const payload = await response.json();
		if (
			payload &&
			typeof payload === "object" &&
			!Array.isArray(payload) &&
			this._coerceString(payload.Error, "")
		) {
			throw new Error(this._coerceString(payload.Error, "RetroAchievements API error"));
		}
		return payload;
	}

	async _request(url) {
		const headers = {
			Accept: "application/json",
			"User-Agent": DEFAULTS.userAgent,
			"Cache-Control": "no-cache, no-store, max-age=0",
			Pragma: "no-cache",
		};

		return fetch(url, { headers, cache: "no-store" });
	}

	async _applyProfile(profile, currentGame = null) {
		await this._setVariableIfChanged(
			VARIABLE_NAMES.totalPoints,
			this._profileTotalPoints(profile),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.totalSoftcorePoints,
			this._profileSoftcorePoints(profile),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.totalTruePoints,
			this._profileTruePoints(profile),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.totalRank,
			this._profileRank(profile),
		);

		const lastGameId = this._profileLastGameId(profile);
		await this._setVariableIfChanged(VARIABLE_NAMES.lastGameId, lastGameId);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.lastGameTitle,
			this._profileLastGameTitle(
				profile,
				this._coerceString(currentGame?.Title, ""),
			),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.lastGameConsole,
			this._coerceString(currentGame?.ConsoleName, ""),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.lastGameIcon,
			this._absoluteImageUrl(currentGame?.ImageIcon),
		);
	}

	async _applyGameProgress(progress, currentGame = null) {
		if (!progress) {
			await this._setVariableIfChanged(VARIABLE_NAMES.lastGameAchievementTotal, 0);
			await this._setVariableIfChanged(VARIABLE_NAMES.lastGameAchievementUnlocked, 0);
			await this._setVariableIfChanged(
				VARIABLE_NAMES.lastGameAchievementUnlockedHardcore,
				0,
			);
			await this._setVariableIfChanged(VARIABLE_NAMES.lastGameCompletion, "");
			return;
		}

		await this._setVariableIfChanged(
			VARIABLE_NAMES.lastGameAchievementTotal,
			this._coerceNumber(progress?.NumPossibleAchievements, 0),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.lastGameAchievementUnlocked,
			this._coerceNumber(progress?.NumAchieved, 0),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.lastGameAchievementUnlockedHardcore,
			this._coerceNumber(progress?.NumAchievedHardcore, 0),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.lastGameCompletion,
			this._coerceString(progress?.UserCompletion, ""),
		);

		const resolvedTitle = this._coerceString(
			progress?.Title,
			this._coerceString(currentGame?.Title, ""),
		);
		if (resolvedTitle) {
			await this._setVariableIfChanged(VARIABLE_NAMES.lastGameTitle, resolvedTitle);
		}

		const resolvedConsole = this._coerceString(
			progress?.ConsoleName,
			this._coerceString(currentGame?.ConsoleName, ""),
		);
		if (resolvedConsole) {
			await this._setVariableIfChanged(VARIABLE_NAMES.lastGameConsole, resolvedConsole);
		}

		const resolvedIcon = this._absoluteImageUrl(progress?.ImageIcon || currentGame?.ImageIcon);
		if (resolvedIcon) {
			await this._setVariableIfChanged(VARIABLE_NAMES.lastGameIcon, resolvedIcon);
		}
	}

	async _emitAlerts({
		profile,
		currentGame,
		gameProgress,
		recentAchievements = [],
	}) {
		const lastGameId = this._profileLastGameId(profile);
		const lastGameTitle = this._profileLastGameTitle(
			profile,
			this._coerceString(currentGame?.Title, ""),
		);

		if (!this._hasInitialSync) {
			for (const achievement of recentAchievements) {
				this._rememberRecentAchievementKey(this._buildRecentAchievementKey(achievement));
			}
			this._lastGameId = lastGameId;
			this._lastGameTitle = lastGameTitle;
			this._hasInitialSync = true;
			return;
		}

		if (
			this._lastGameId !== null &&
			lastGameId > 0 &&
			lastGameId !== this._lastGameId
		) {
			const vars = this._buildCurrentGameAlertVariables({
				profile,
				currentGame,
				gameProgress,
			});
			await this.lumia.triggerAlert({
				alert: ALERT_KEYS.currentGameChanged,
				...this._buildAlertPayload(vars, {
					dynamicValue: vars.last_game_title,
					previous_game_id: this._lastGameId,
					previous_game_title: this._lastGameTitle,
				}),
			});
		}

		const newUnlocks = [];
		for (const achievement of recentAchievements) {
			const key = this._buildRecentAchievementKey(achievement);
			if (!key || this._seenUnlockKeys.has(key)) {
				continue;
			}
			this._rememberRecentAchievementKey(key);
			newUnlocks.push(achievement);
		}

		for (const achievement of newUnlocks) {
			const vars = this._buildAchievementAlertVariables({
				profile,
				currentGame,
				gameProgress,
				achievement,
			});
			await this.lumia.triggerAlert({
				alert: ALERT_KEYS.achievementUnlocked,
				...this._buildAlertPayload(vars, {
					dynamicValue: vars.achievement_title,
				}),
			});

			if (vars.achievement_hardcore) {
				await this.lumia.triggerAlert({
					alert: ALERT_KEYS.hardcoreAchievementUnlocked,
					...this._buildAlertPayload(vars, {
						dynamicValue: vars.achievement_title,
					}),
				});
			}
		}

		this._lastGameId = lastGameId;
		this._lastGameTitle = lastGameTitle;
	}

	_buildCurrentGameAlertVariables({ profile, currentGame, gameProgress }) {
		return {
			username: this._profileUser(profile) || this._username(),
			last_game_id: this._profileLastGameId(profile),
			last_game_title: this._profileLastGameTitle(
				profile,
				this._coerceString(currentGame?.Title, ""),
			),
			last_game_console: this._coerceString(currentGame?.ConsoleName, ""),
			last_game_icon: this._absoluteImageUrl(currentGame?.ImageIcon),
		};
	}

	_buildAchievementAlertVariables({
		profile,
		currentGame,
		gameProgress,
		achievement,
	}) {
		return {
			username: this._profileUser(profile) || this._username(),
			game_id: this._achievementGameId(achievement) || this._profileLastGameId(profile),
			game_title:
				this._achievementGameTitle(achievement) ||
				this._profileLastGameTitle(
					profile,
					this._coerceString(currentGame?.Title, ""),
				),
			game_console: this._coerceString(
				currentGame?.ConsoleName ?? gameProgress?.ConsoleName,
				"",
			),
			game_achievement_total: this._coerceNumber(
				gameProgress?.NumPossibleAchievements,
				0,
			),
			game_achievement_unlocked: this._coerceNumber(gameProgress?.NumAchieved, 0),
			achievement_id: this._achievementId(achievement),
			achievement_title: this._achievementTitle(achievement),
			achievement_description: this._achievementDescription(achievement),
			achievement_points: this._achievementPoints(achievement),
			achievement_hardcore: this._achievementHardcore(achievement),
			achievement_date_awarded: this._achievementDate(achievement),
			achievement_badge_url:
				this._achievementBadgeUrl(achievement) ||
				this._badgeUrl(this._achievementBadgeName(achievement)),
		};
	}

	_buildAlertPayload(variables, { dynamicValue, ...extraSettings } = {}) {
		const value =
			dynamicValue ||
			this._coerceString(variables?.achievement_title, "") ||
			this._coerceString(variables?.last_game_title, "") ||
			this._coerceString(variables?.game_title, "") ||
			this._coerceString(variables?.username, "");
		return {
			dynamic: {
				value,
			},
			extraSettings: {
				...(variables || {}),
				...(extraSettings || {}),
			},
		};
	}

	_buildRecentAchievementKey(achievement) {
		const id = this._achievementId(achievement);
		if (!id) {
			return "";
		}
		const awardedAt = this._achievementDate(achievement);
		const hardcore = this._achievementHardcore(achievement) ? "1" : "0";
		return `${id}:${awardedAt}:${hardcore}`;
	}

	_rememberRecentAchievementKey(key) {
		if (!key || this._seenUnlockKeys.has(key)) {
			return;
		}
		this._seenUnlockKeys.add(key);
		this._seenUnlockOrder.push(key);
		while (this._seenUnlockOrder.length > DEFAULTS.maxSeenUnlocks) {
			const oldest = this._seenUnlockOrder.shift();
			if (oldest) {
				this._seenUnlockKeys.delete(oldest);
			}
		}
	}

	_sortRecentAchievements(achievements) {
		if (!Array.isArray(achievements)) {
			return [];
		}

		return [...achievements].sort((a, b) => {
			const aTime = Date.parse(this._achievementDate(a)) || 0;
			const bTime = Date.parse(this._achievementDate(b)) || 0;
			if (aTime !== bTime) {
				return aTime - bTime;
			}
			return this._achievementId(a) - this._achievementId(b);
		});
	}

	_profileUser(profile) {
		return this._coerceString(profile?.User ?? profile?.user, "").trim();
	}

	_profileTotalPoints(profile) {
		return this._coerceNumber(
			profile?.TotalPoints ?? profile?.totalPoints ?? profile?.Points ?? profile?.points,
			0,
		);
	}

	_profileSoftcorePoints(profile) {
		return this._coerceNumber(
			profile?.TotalSoftcorePoints ??
				profile?.totalSoftcorePoints ??
				profile?.SoftcorePoints ??
				profile?.softcorePoints,
			0,
		);
	}

	_profileTruePoints(profile) {
		return this._coerceNumber(
			profile?.TotalTruePoints ?? profile?.totalTruePoints,
			0,
		);
	}

	_profileRank(profile) {
		return this._coerceNumber(
			profile?.Rank ?? profile?.rank ?? profile?.TotalRank ?? profile?.totalRank,
			0,
		);
	}

	_profileLastGameId(profile) {
		return this._coerceNumber(profile?.LastGameID ?? profile?.lastGameId, 0);
	}

	_profileLastGameTitle(profile, fallback = "") {
		return this._coerceString(profile?.LastGame ?? profile?.lastGame, fallback);
	}

	_achievementId(achievement) {
		return this._coerceNumber(
			achievement?.AchievementID ??
				achievement?.achievementId ??
				achievement?.ID ??
				achievement?.id,
			0,
		);
	}

	_achievementTitle(achievement) {
		return this._coerceString(achievement?.Title ?? achievement?.title, "");
	}

	_achievementDescription(achievement) {
		return this._coerceString(
			achievement?.Description ?? achievement?.description,
			"",
		);
	}

	_achievementPoints(achievement) {
		return this._coerceNumber(achievement?.Points ?? achievement?.points, 0);
	}

	_achievementTrueRatio(achievement) {
		return this._coerceNumber(
			achievement?.TrueRatio ?? achievement?.trueRatio,
			0,
		);
	}

	_achievementGameId(achievement) {
		return this._coerceNumber(achievement?.GameID ?? achievement?.gameId, 0);
	}

	_achievementGameTitle(achievement) {
		return this._coerceString(
			achievement?.GameTitle ?? achievement?.gameTitle,
			"",
		);
	}

	_achievementDate(achievement) {
		return this._coerceString(
			achievement?.DateAwarded ??
				achievement?.dateAwarded ??
				achievement?.Date ??
				achievement?.date,
			"",
		);
	}

	_achievementHardcore(achievement) {
		return this._coerceBoolean(
			achievement?.HardcoreAwarded ??
				achievement?.hardcoreAwarded ??
				achievement?.HardcoreMode ??
				achievement?.hardcoreMode,
			false,
		);
	}

	_achievementBadgeName(achievement) {
		return this._coerceString(achievement?.BadgeName ?? achievement?.badgeName, "");
	}

	_achievementBadgeUrl(achievement) {
		return this._absoluteImageUrl(
			this._coerceString(achievement?.BadgeURL ?? achievement?.badgeUrl, ""),
		);
	}

	_findRecentlyPlayedGame(recentlyPlayed, gameId) {
		if (!Array.isArray(recentlyPlayed) || !recentlyPlayed.length || !gameId) {
			return null;
		}

		const target = this._coerceNumber(gameId, 0);
		return (
			recentlyPlayed.find(
				(game) => this._coerceNumber(game?.GameID, 0) === target,
			) || null
		);
	}

	_absoluteImageUrl(imagePath) {
		const value = this._coerceString(imagePath, "").trim();
		if (!value) {
			return "";
		}
		if (/^https?:\/\//i.test(value)) {
			return value;
		}
		return `${RA_SITE_BASE}${value.startsWith("/") ? "" : "/"}${value}`;
	}

	_badgeUrl(badgeName) {
		const badge = this._coerceString(badgeName, "").trim();
		if (!badge) {
			return "";
		}
		return `${RA_SITE_BASE}/Badge/${encodeURIComponent(badge)}.png`;
	}

	async _handleFetchGame(params = {}) {
		if (!this._hasRequiredSettings()) {
			await this._showActionToast(
				"Missing RetroAchievements API key or username in plugin settings.",
				"warn",
			);
			return null;
		}

		const gameInput = this._coerceString(params?.game, "").trim();
		if (!gameInput) {
			await this._showActionToast("Game title or game ID is required.", "warn");
			return null;
		}

		const resolved = await this._resolveGameInput(gameInput);
		if (!resolved?.gameId) {
			await this._showActionToast(
				`Could not resolve game '${gameInput}' from recently played titles.`,
				"warn",
			);
			return null;
		}

		const progress = await this._fetchGameInfoAndUserProgress(resolved.gameId);
		if (!progress) {
			await this._showActionToast(
				`No game progress returned for game ID ${resolved.gameId}.`,
				"warn",
			);
			return null;
		}

		const resolvedTitle =
			this._coerceString(progress?.Title, "") ||
			this._coerceString(resolved?.title, "") ||
			gameInput;

		const requestedVars = {
			username: this._username(),
			requested_game_id: resolved.gameId,
			requested_game_title: resolvedTitle,
			requested_game_console: this._coerceString(progress?.ConsoleName, ""),
			requested_game_icon: this._absoluteImageUrl(progress?.ImageIcon),
			requested_game_achievement_total: this._coerceNumber(
				progress?.NumPossibleAchievements,
				0,
			),
			requested_game_achievement_unlocked: this._coerceNumber(
				progress?.NumAchieved,
				0,
			),
			requested_game_achievement_unlocked_hardcore: this._coerceNumber(
				progress?.NumAchievedHardcore,
				0,
			),
			requested_game_completion: this._coerceString(progress?.UserCompletion, ""),
			requested_game_payload: JSON.stringify(progress || {}),
		};

		await this._showActionToast(
			`Fetched progress for ${resolvedTitle}.`,
			"success",
		);

		return this._buildFetchGameActionVariables(requestedVars);
	}

	_buildFetchGameActionVariables(requestedVars = {}) {
		return {
			[ACTION_VARIABLE_NAMES.username]: this._coerceString(
				requestedVars.username,
				"",
			),
			[ACTION_VARIABLE_NAMES.requestedGameId]: this._coerceNumber(
				requestedVars.requested_game_id,
				0,
			),
			[ACTION_VARIABLE_NAMES.requestedGameTitle]: this._coerceString(
				requestedVars.requested_game_title,
				"",
			),
			[ACTION_VARIABLE_NAMES.requestedGameConsole]: this._coerceString(
				requestedVars.requested_game_console,
				"",
			),
			[ACTION_VARIABLE_NAMES.requestedGameIcon]: this._coerceString(
				requestedVars.requested_game_icon,
				"",
			),
			[ACTION_VARIABLE_NAMES.requestedGameAchievementTotal]: this._coerceNumber(
				requestedVars.requested_game_achievement_total,
				0,
			),
			[ACTION_VARIABLE_NAMES.requestedGameAchievementUnlocked]: this._coerceNumber(
				requestedVars.requested_game_achievement_unlocked,
				0,
			),
			[ACTION_VARIABLE_NAMES.requestedGameAchievementUnlockedHardcore]:
				this._coerceNumber(
					requestedVars.requested_game_achievement_unlocked_hardcore,
					0,
				),
			[ACTION_VARIABLE_NAMES.requestedGameCompletion]: this._coerceString(
				requestedVars.requested_game_completion,
				"",
			),
			[ACTION_VARIABLE_NAMES.requestedGamePayload]: this._coerceString(
				requestedVars.requested_game_payload,
				"",
			),
		};
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

	async _resolveGameInput(gameInput) {
		const numericOnly = gameInput.match(/^\d+$/);
		if (numericOnly) {
			return {
				gameId: this._coerceNumber(numericOnly[0], 0),
				title: "",
			};
		}

		const recentlyPlayed = await this._fetchRecentlyPlayedGames();
		const match = this._resolveGameByTitle(recentlyPlayed, gameInput);
		if (!match) {
			return null;
		}

		return {
			gameId: this._coerceNumber(match?.GameID, 0),
			title: this._coerceString(match?.Title, ""),
		};
	}

	_resolveGameByTitle(games, input) {
		const ranked = this._rankGameMatches(games, input);
		if (!ranked.length) {
			return null;
		}
		if (ranked[0].score < DEFAULTS.matchThreshold) {
			return null;
		}
		return ranked[0].game;
	}

	_rankGameMatches(games, input) {
		if (!Array.isArray(games) || !games.length) {
			return [];
		}
		const normalizedInput = this._normalizeMatchText(input);
		if (!normalizedInput) {
			return [];
		}

		const results = [];
		for (const game of games) {
			const name = this._coerceString(game?.Title, "");
			if (!name) {
				continue;
			}
			const score = this._scoreMatch(name, normalizedInput);
			if (score <= 0) {
				continue;
			}
			results.push({
				game,
				score: Number(score.toFixed(3)),
			});
		}

		results.sort((a, b) => b.score - a.score);
		return results.slice(0, 10);
	}

	_scoreMatch(name, normalizedInput) {
		const normalizedName = this._normalizeMatchText(name);
		if (!normalizedName) {
			return 0;
		}
		if (normalizedName === normalizedInput) {
			return 1;
		}
		if (normalizedName.startsWith(normalizedInput)) {
			return 0.95;
		}
		if (normalizedInput.startsWith(normalizedName)) {
			return 0.9;
		}
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

	_levenshtein(a, b) {
		if (a === b) {
			return 0;
		}
		if (!a) {
			return b.length;
		}
		if (!b) {
			return a.length;
		}

		const matrix = Array.from({ length: a.length + 1 }, () =>
			new Array(b.length + 1).fill(0),
		);
		for (let i = 0; i <= a.length; i += 1) {
			matrix[i][0] = i;
		}
		for (let j = 0; j <= b.length; j += 1) {
			matrix[0][j] = j;
		}

		for (let i = 1; i <= a.length; i += 1) {
			for (let j = 1; j <= b.length; j += 1) {
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
		} catch {
			return;
		}
	}

	_schedulePolling() {
		this._clearPolling();

		const intervalSeconds = this._pollIntervalSeconds();
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
		return Boolean(this._apiKey() && this._username());
	}

	_apiKey() {
		return this._coerceString(this.settings?.apiKey, "").trim();
	}

	_username() {
		return this._coerceString(this.settings?.username, "").trim();
	}

	_pollIntervalSeconds(settings = this.settings) {
		const value = this._coerceNumber(settings?.pollInterval, DEFAULTS.pollInterval);
		if (!Number.isFinite(value)) {
			return DEFAULTS.pollInterval;
		}
		return Math.min(
			Math.max(value, DEFAULTS.minPollInterval),
			DEFAULTS.maxPollInterval,
		);
	}

	_debugEnabled(settings = this.settings) {
		return Boolean(settings?.debugLogs);
	}

	async _updateConnectionState(state) {
		if (this._lastConnectionState === state) {
			return;
		}

		this._lastConnectionState = state;
		if (typeof this.lumia.updateConnection !== "function") {
			return;
		}

		try {
			await this.lumia.updateConnection(state);
		} catch (error) {
			await this._log(
				`Failed to update connection state: ${this._errorMessage(error)}`,
				"warn",
			);
		}
	}

	async _safeFetch(label, fn) {
		try {
			return { ok: true, data: await fn() };
		} catch (error) {
			await this._logThrottled(
				`fetch:${label}`,
				`${label} request failed: ${this._errorMessage(error)}`,
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
			} catch {
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
		const text = this._coerceString(value, "").replace(/\s+/g, " ").trim();
		if (!text) {
			return "";
		}
		if (text.length <= 200) {
			return text;
		}
		return `${text.slice(0, 200)}...`;
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

	_coerceBoolean(value, fallback = false) {
		if (typeof value === "boolean") {
			return value;
		}
		if (typeof value === "number") {
			return value !== 0;
		}
		if (typeof value === "string") {
			const normalized = value.trim().toLowerCase();
			if (["1", "true", "yes", "on"].includes(normalized)) {
				return true;
			}
			if (["0", "false", "no", "off", ""].includes(normalized)) {
				return false;
			}
		}
		return fallback;
	}
}

module.exports = RetroAchievementsPlugin;
