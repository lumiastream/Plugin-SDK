const { Plugin } = require("@lumiastream/plugin");

const DEFAULTS = {
	pollInterval: 120,
	compatibilityDate: "2026-02-03",
	userAgent: "LumiaStream EVE Online Plugin/1.0.0",
	walletAlertThreshold: 1000000,
};

const ESI_BASE_URL = "https://esi.evetech.net/latest";
const ESI_DATASOURCE = "tranquility";
const SSO_VERIFY_URL = "https://login.eveonline.com/oauth/verify";

const VARIABLE_NAMES = {
	characterId: "character_id",
	characterName: "character_name",
	corporationId: "corporation_id",
	allianceId: "alliance_id",
	securityStatus: "security_status",
	walletBalance: "wallet_balance",
	online: "online",
	solarSystemId: "solar_system_id",
	stationId: "station_id",
	structureId: "structure_id",
	shipName: "ship_name",
	shipTypeId: "ship_type_id",
	shipItemId: "ship_item_id",
	skillqueueCount: "skillqueue_count",
	skillqueueCurrentSkillId: "skillqueue_current_skill_id",
	skillqueueCurrentLevel: "skillqueue_current_level",
	skillqueueCurrentEnd: "skillqueue_current_end",
	skillqueueEndsAt: "skillqueue_ends_at",
	marketOrdersActive: "market_orders_active",
	marketOrdersBuy: "market_orders_buy",
	marketOrdersSell: "market_orders_sell",
	industryJobsActive: "industry_jobs_active",
	industryJobsTotal: "industry_jobs_total",
	killmailsRecentCount: "killmails_recent_count",
	notificationsCount: "notifications_count",
};

const ALERT_KEYS = {
	online: "eve_online_status",
	skillQueueEmpty: "eve_skillqueue_empty",
	walletSpike: "eve_wallet_spike",
	walletDrop: "eve_wallet_drop",
	killmail: "eve_killmail_new",
	notification: "eve_notification_new",
	eve_docked: "eve_docked",
	eve_undocked: "eve_undocked",
	shipChanged: "eve_ship_changed",
};

class EveOnlinePlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._pollTimer = null;
		this._refreshPromise = null;
		this._tokenRefreshPromise = null;
		this._lastConnectionState = null;
		this._lastVariables = new Map();
		this._etagCache = new Map();
		this._cooldownUntil = new Map();
		this._globalBackoffUntil = 0;
		this._authFailure = false;
		this._lastErrorLimitWarnAt = 0;
		this._lastErrorLimitRemaining = null;
		this._characterId = null;
		this._characterName = null;
	}

	async onload() {
		if (!this._hasAuthTokens()) {
			await this._log(
				"Missing OAuth tokens. Authorize the plugin in Connections to begin.",
				"warn",
			);
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
		const accessChanged =
			(settings?.accessToken ?? "") !== (previous?.accessToken ?? "");
		const refreshChanged =
			(settings?.refreshToken ?? "") !== (previous?.refreshToken ?? "");
		const authChanged = accessChanged || refreshChanged;

		if (pollChanged) {
			this._schedulePolling();
		}

		if (authChanged) {
			this._characterId = null;
			this._characterName = null;
			this._etagCache.clear();
			this._cooldownUntil.clear();
			this._authFailure = false;
		}

		if (authChanged || pollChanged) {
			await this._refreshData({ reason: "settings-update" });
		}
	}

	async actions() {
		return;
	}

	async validateAuth() {
		if (!this._hasAuthTokens()) {
			await this._log("Validation failed: missing OAuth tokens.", "warn");
			return false;
		}

		try {
			const token = await this._ensureAccessToken();
			await this._verifyToken(token);
			return true;
		} catch (error) {
			const message = this._errorMessage(error);
			await this._log(`EVE auth failed: ${message}`, "error");
			return false;
		}
	}

	_tag() {
		return `[${this.manifest?.id ?? "eveonline"}]`;
	}

	async _log(message, severity = "info") {
		if (severity !== "warn" && severity !== "error") {
			return;
		}

		const prefix = this._tag();
		const decorated =
			severity === "warn"
				? `${prefix} ⚠️ ${message}`
				: severity === "error"
					? `${prefix} ❌ ${message}`
					: `${prefix} ${message}`;

		await this.lumia.addLog(decorated);
	}

	async _refreshData({ reason } = {}) {
		if (!this._hasAuthTokens()) {
			await this._updateConnectionState(false);
			return;
		}

		const now = Date.now();
		if (this._globalBackoffUntil && now < this._globalBackoffUntil) {
			return;
		}

		if (this._authFailure) {
			return;
		}

		if (this._refreshPromise) {
			return this._refreshPromise;
		}

		this._refreshPromise = (async () => {
			try {
				const accessToken = await this._ensureAccessToken();
				const identity = await this._resolveCharacter(accessToken);
				const characterId = identity.characterId;

				const results = await Promise.all([
					this._safeFetch("character info", () =>
						this._fetchCharacterInfo(characterId, accessToken),
					),
					this._safeFetch("wallet", () =>
						this._fetchWallet(characterId, accessToken),
					),
					this._safeFetch("online status", () =>
						this._fetchOnline(characterId, accessToken),
					),
					this._safeFetch("location", () =>
						this._fetchLocation(characterId, accessToken),
					),
					this._safeFetch("ship", () =>
						this._fetchShip(characterId, accessToken),
					),
					this._safeFetch("skill queue", () =>
						this._fetchSkillQueue(characterId, accessToken),
					),
					this._safeFetch("industry jobs", () =>
						this._fetchIndustryJobs(characterId, accessToken),
					),
					this._safeFetch("market orders", () =>
						this._fetchOrders(characterId, accessToken),
					),
					this._safeFetch("killmails", () =>
						this._fetchKillmails(characterId, accessToken),
					),
					this._safeFetch("notifications", () =>
						this._fetchNotifications(characterId, accessToken),
					),
				]);

				const [
					characterInfoResult,
					walletResult,
					onlineResult,
					locationResult,
					shipResult,
					skillqueueResult,
					industryJobsResult,
					ordersResult,
					killmailsResult,
					notificationsResult,
				] = results;

				await this._applyCharacter(identity, characterInfoResult.data);
				await this._applyWallet(walletResult.data);
				await this._applyOnline(onlineResult.data);
				await this._applyLocation(locationResult.data);
				await this._applyShip(shipResult.data);
				await this._applySkillQueue(skillqueueResult.data);
				await this._applyIndustryJobs(industryJobsResult.data);
				await this._applyOrders(ordersResult.data);
				await this._applyKillmails(killmailsResult.data);
				await this._applyNotifications(notificationsResult.data);

				const snapshot = {
					character: identity,
					characterInfo: characterInfoResult.data,
					wallet: walletResult.data,
					online: onlineResult.data,
					location: locationResult.data,
					ship: shipResult.data,
					skillqueue: skillqueueResult.data,
					industryJobs: industryJobsResult.data,
					orders: ordersResult.data,
					killmails: killmailsResult.data,
					notifications: notificationsResult.data,
				};

				const successCount = results.filter((result) => result.ok).length;
				await this._updateConnectionState(successCount > 0);
			} catch (error) {
				const message = this._errorMessage(error);
				await this._log(`Failed to refresh ESI data: ${message}`, "warn");
				await this._updateConnectionState(false);
			}
			this._refreshPromise = null;
		})();

		return this._refreshPromise;
	}

	async _resolveCharacter(accessToken) {
		if (this._characterId && this._characterName) {
			return {
				characterId: this._characterId,
				characterName: this._characterName,
			};
		}

		const verify = await this._verifyTokenWithRefresh(accessToken);
		const characterId = this._coerceNumber(verify?.CharacterID, 0);
		const characterName = this._coerceString(verify?.CharacterName, "");

		if (!characterId || !characterName) {
			throw new Error("Failed to resolve character identity from SSO.");
		}

		this._characterId = characterId;
		this._characterName = characterName;

		return { characterId, characterName };
	}

	async _verifyTokenWithRefresh(accessToken) {
		try {
			return await this._verifyToken(accessToken);
		} catch (error) {
			const message = this._errorMessage(error);
			if (message.includes("401") && this._canRefreshTokens()) {
				const refreshed = await this._refreshAccessToken();
				return this._verifyToken(refreshed);
			}
			if (message.includes("401")) {
				this._authFailure = true;
				this._clearPolling();
				await this._showAuthFailureToast();
			}
			throw error;
		}
	}

	async _verifyToken(accessToken) {
		const response = await fetch(SSO_VERIFY_URL, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: "application/json",
				"User-Agent": DEFAULTS.userAgent,
			},
		});

		if (!response.ok) {
			const body = await response.text();
			const trimmed = this._truncateError(body);
			throw new Error(
				`SSO verify failed (${response.status}): ${trimmed || "No response body"}`,
			);
		}

		return response.json();
	}

	async _fetchCharacterInfo(characterId, token) {
		return this._fetchJson(`/characters/${characterId}/`, token);
	}

	async _fetchWallet(characterId, token) {
		return this._fetchJson(`/characters/${characterId}/wallet/`, token);
	}

	async _fetchOnline(characterId, token) {
		return this._fetchJson(`/characters/${characterId}/online/`, token);
	}

	async _fetchLocation(characterId, token) {
		return this._fetchJson(`/characters/${characterId}/location/`, token);
	}

	async _fetchShip(characterId, token) {
		return this._fetchJson(`/characters/${characterId}/ship/`, token);
	}

	async _fetchSkillQueue(characterId, token) {
		return this._fetchJson(`/characters/${characterId}/skillqueue/`, token);
	}

	async _fetchIndustryJobs(characterId, token) {
		return this._fetchJson(`/characters/${characterId}/industry/jobs/`, token, {
			include_completed: false,
		});
	}

	async _fetchOrders(characterId, token) {
		return this._fetchJson(`/characters/${characterId}/orders/`, token);
	}

	async _fetchKillmails(characterId, token) {
		return this._fetchJson(
			`/characters/${characterId}/killmails/recent/`,
			token,
		);
	}

	async _fetchNotifications(characterId, token) {
		return this._fetchJson(`/characters/${characterId}/notifications/`, token);
	}

	async _safeFetch(label, fn) {
		try {
			return { ok: true, data: await fn() };
		} catch (error) {
			const message = this._errorMessage(error);
			await this._log(`${label} fetch failed: ${message}`, "warn");
			return { ok: false, data: null };
		}
	}

	async _fetchJson(path, tokenOverride, query) {
		const initialToken = tokenOverride ?? (await this._ensureAccessToken());
		const url = this._buildUrl(path, query);
		if (this._isOnCooldown(url)) {
			return null;
		}
		let response = await this._request(url, initialToken);

		if (response.status === 401 && this._canRefreshTokens()) {
			const refreshed = await this._refreshAccessToken();
			response = await this._request(url, refreshed);
		}
		if (response.status === 401) {
			this._authFailure = true;
			this._clearPolling();
			await this._showAuthFailureToast();
			throw new Error(
				"Unauthorized (401). Re-authorize the plugin in Connections.",
			);
		}

		if (response.status === 429) {
			const retryAfter = this._coerceNumber(
				response.headers.get("Retry-After"),
				60,
			);
			this._applyGlobalBackoff(retryAfter);
			throw new Error(
				`ESI rate limited (429). Backing off for ${retryAfter}s.`,
			);
		}

		if (response.status === 304) {
			return null;
		}

		if (!response.ok) {
			const body = await response.text();
			const trimmed = this._truncateError(body);
			throw new Error(
				`ESI error (${response.status}) on ${path}: ${trimmed || "No response body"}`,
			);
		}

		return response.json();
	}

	_buildUrl(path, query) {
		const url = new URL(`${ESI_BASE_URL}${path}`);
		url.searchParams.set("datasource", ESI_DATASOURCE);

		if (query) {
			for (const [key, value] of Object.entries(query)) {
				if (value === undefined || value === null || value === "") {
					continue;
				}
				url.searchParams.set(key, String(value));
			}
		}

		return url.toString();
	}

	_isOnCooldown(url) {
		const until = this._cooldownUntil.get(url);
		return Boolean(until && Date.now() < until);
	}

	_updateCooldown(url, response) {
		const expiresHeader = response.headers.get("expires");
		if (!expiresHeader) {
			return;
		}
		const expiresAt = Date.parse(expiresHeader);
		if (Number.isNaN(expiresAt)) {
			return;
		}
		this._cooldownUntil.set(url, expiresAt);
	}

	async _request(url, token) {
		const headers = {
			Accept: "application/json",
			"User-Agent": DEFAULTS.userAgent,
			"X-Compatibility-Date": DEFAULTS.compatibilityDate,
		};

		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}

		const etag = this._etagCache.get(url);
		if (etag) {
			headers["If-None-Match"] = etag;
		}

		const response = await fetch(url, { headers });

		const responseEtag = response.headers.get("etag");
		this._updateCooldown(url, response);
		if (responseEtag) {
			this._etagCache.set(url, responseEtag);
		}

		const errorRemain = this._coerceNumber(
			response.headers.get("X-ESI-Error-Limit-Remain"),
			NaN,
		);
		if (!Number.isNaN(errorRemain)) {
			const now = Date.now();
			const wasLow =
				this._lastErrorLimitRemaining !== null &&
				this._lastErrorLimitRemaining <= 5;
			const isLow = errorRemain <= 5;
			const shouldLog =
				isLow && (!wasLow || now - this._lastErrorLimitWarnAt > 5 * 60 * 1000);
			if (shouldLog) {
				this._lastErrorLimitWarnAt = now;
			}
			if (!isLow) {
				this._lastErrorLimitWarnAt = 0;
			}
			this._lastErrorLimitRemaining = errorRemain;
		}

		return response;
	}

	async _refreshAccessToken() {
		if (this._tokenRefreshPromise) {
			return this._tokenRefreshPromise;
		}

		const refreshToken = this._refreshToken();
		if (!refreshToken) {
			throw new Error("Missing refresh token.");
		}

		this._tokenRefreshPromise = (async () => {
			if (typeof this.lumia?.refreshOAuthToken !== "function") {
				throw new Error("Missing OAuth refresh support.");
			}

			const payload = await this.lumia.refreshOAuthToken({ refreshToken });
			const accessToken = this._coerceString(payload?.accessToken, "");
			const nextRefreshToken =
				this._coerceString(payload?.refreshToken, "") || refreshToken;

			if (!accessToken) {
				throw new Error("OAuth refresh did not return an access token.");
			}

			this.updateSettings({
				accessToken,
				refreshToken: nextRefreshToken,
			});

			return accessToken;
		})();

		try {
			return await this._tokenRefreshPromise;
		} finally {
			this._tokenRefreshPromise = null;
		}
	}

	async _ensureAccessToken() {
		const accessToken = this._accessToken();
		const refreshToken = this._refreshToken();

		if (!accessToken && !refreshToken) {
			throw new Error("Missing EVE access credentials.");
		}

		if (accessToken) {
			return accessToken;
		}

		if (!refreshToken) {
			return accessToken;
		}

		return this._refreshAccessToken();
	}

	async _applyCharacter(identity, characterInfo) {
		await this._setVariableIfChanged(
			VARIABLE_NAMES.characterId,
			identity?.characterId ?? 0,
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.characterName,
			identity?.characterName ?? "",
		);

		if (!characterInfo) {
			return;
		}

		await this._setVariableIfChanged(
			VARIABLE_NAMES.corporationId,
			this._coerceNumber(characterInfo?.corporation_id, 0),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.allianceId,
			this._coerceNumber(characterInfo?.alliance_id, 0),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.securityStatus,
			this._coerceNumber(characterInfo?.security_status, 0),
		);
	}

	async _applyWallet(wallet) {
		if (wallet === null || wallet === undefined) {
			return;
		}

		await this._setVariableIfChanged(
			VARIABLE_NAMES.walletBalance,
			this._coerceNumber(wallet, 0),
		);
	}

	async _applyOnline(online) {
		if (!online) {
			return;
		}

		await this._setVariableIfChanged(
			VARIABLE_NAMES.online,
			Boolean(online?.online),
		);
	}

	async _applyLocation(location) {
		if (!location) {
			return;
		}

		await this._setVariableIfChanged(
			VARIABLE_NAMES.solarSystemId,
			this._coerceNumber(location?.solar_system_id, 0),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.stationId,
			this._coerceNumber(location?.station_id, 0),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.structureId,
			this._coerceNumber(location?.structure_id, 0),
		);
	}

	async _applyShip(ship) {
		if (!ship) {
			return;
		}

		await this._setVariableIfChanged(
			VARIABLE_NAMES.shipName,
			this._coerceString(ship?.ship_name, ""),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.shipTypeId,
			this._coerceNumber(ship?.ship_type_id, 0),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.shipItemId,
			this._coerceNumber(ship?.ship_item_id, 0),
		);
	}

	async _applySkillQueue(queue) {
		if (!Array.isArray(queue)) {
			return;
		}

		const sorted = [...queue].sort(
			(a, b) =>
				this._coerceNumber(a?.queue_position, 0) -
				this._coerceNumber(b?.queue_position, 0),
		);
		const current = sorted[0] || null;
		const last = sorted[sorted.length - 1] || null;

		await this._setVariableIfChanged(
			VARIABLE_NAMES.skillqueueCount,
			sorted.length,
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.skillqueueCurrentSkillId,
			this._coerceNumber(current?.skill_id, 0),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.skillqueueCurrentLevel,
			this._coerceNumber(current?.finished_level, 0),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.skillqueueCurrentEnd,
			this._coerceString(current?.finish_date, ""),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.skillqueueEndsAt,
			this._coerceString(last?.finish_date, ""),
		);
	}

	async _applyIndustryJobs(jobs) {
		if (!Array.isArray(jobs)) {
			return;
		}

		const activeCount = jobs.filter((job) => job?.status === "active").length;

		await this._setVariableIfChanged(
			VARIABLE_NAMES.industryJobsActive,
			activeCount,
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.industryJobsTotal,
			jobs.length,
		);
	}

	async _applyOrders(orders) {
		if (!Array.isArray(orders)) {
			return;
		}

		const buyCount = orders.filter((order) => order?.is_buy_order).length;
		const sellCount = orders.filter((order) => !order?.is_buy_order).length;

		await this._setVariableIfChanged(
			VARIABLE_NAMES.marketOrdersActive,
			orders.length,
		);
		await this._setVariableIfChanged(VARIABLE_NAMES.marketOrdersBuy, buyCount);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.marketOrdersSell,
			sellCount,
		);
	}

	async _applyKillmails(killmails) {
		if (!Array.isArray(killmails)) {
			return;
		}

		await this._setVariableIfChanged(
			VARIABLE_NAMES.killmailsRecentCount,
			killmails.length,
		);
	}

	async _applyNotifications(notifications) {
		if (!Array.isArray(notifications)) {
			return;
		}

		await this._setVariableIfChanged(
			VARIABLE_NAMES.notificationsCount,
			notifications.length,
		);
	}

	_alertsEnabled() {
		return this.settings?.enableAlerts !== false;
	}

	_walletAlertThreshold() {
		const threshold = this._coerceNumber(
			this.settings?.walletAlertThreshold,
			DEFAULTS.walletAlertThreshold,
		);
		return Number.isFinite(threshold)
			? threshold
			: DEFAULTS.walletAlertThreshold;
	}

	_buildAlertSnapshot({
		previous,
		characterInfo,
		wallet,
		online,
		location,
		ship,
		skillqueue,
		killmails,
		notifications,
	}) {
		const snapshot = {
			online: previous?.online ?? false,
			skillqueueCount: previous?.skillqueueCount ?? 0,
			walletBalance: previous?.walletBalance ?? 0,
			killmailsRecentCount: previous?.killmailsRecentCount ?? 0,
			notificationsCount: previous?.notificationsCount ?? 0,
			stationId: previous?.stationId ?? 0,
			structureId: previous?.structureId ?? 0,
			shipTypeId: previous?.shipTypeId ?? 0,
		};

		if (online) {
			snapshot.online = Boolean(online?.online);
		}

		if (Array.isArray(skillqueue)) {
			snapshot.skillqueueCount = skillqueue.length;
		}

		if (wallet !== null && wallet !== undefined) {
			snapshot.walletBalance = this._coerceNumber(wallet, 0);
		}

		if (Array.isArray(killmails)) {
			snapshot.killmailsRecentCount = killmails.length;
		}

		if (Array.isArray(notifications)) {
			snapshot.notificationsCount = notifications.length;
		}

		if (location) {
			snapshot.stationId = this._coerceNumber(location?.station_id, 0);
			snapshot.structureId = this._coerceNumber(location?.structure_id, 0);
		}

		if (ship) {
			snapshot.shipTypeId = this._coerceNumber(ship?.ship_type_id, 0);
		}

		return snapshot;
	}

	async _maybeTriggerAlerts({ previous, current }) {
		if (!previous || !current) {
			return;
		}

		if (previous.online !== current.online) {
			await this.lumia.triggerAlert({ alert: ALERT_KEYS.online });
		}

		if (previous.skillqueueCount > 0 && current.skillqueueCount === 0) {
			await this.lumia.triggerAlert({ alert: ALERT_KEYS.skillQueueEmpty });
		}

		const walletDelta = current.walletBalance - previous.walletBalance;
		const threshold = this._walletAlertThreshold();
		if (threshold > 0 && Math.abs(walletDelta) >= threshold) {
			await this.lumia.triggerAlert({
				alert:
					walletDelta >= 0 ? ALERT_KEYS.walletSpike : ALERT_KEYS.walletDrop,
			});
		}

		if (current.killmailsRecentCount > previous.killmailsRecentCount) {
			await this.lumia.triggerAlert({ alert: ALERT_KEYS.killmail });
		}

		if (current.notificationsCount > previous.notificationsCount) {
			await this.lumia.triggerAlert({ alert: ALERT_KEYS.notification });
		}

		const wasDocked = (previous.stationId || previous.structureId) > 0;
		const isDocked = (current.stationId || current.structureId) > 0;
		if (!wasDocked && isDocked) {
			await this.lumia.triggerAlert({ alert: ALERT_KEYS.eve_docked });
		} else if (wasDocked && !isDocked) {
			await this.lumia.triggerAlert({ alert: ALERT_KEYS.eve_undocked });
		}

		if (
			previous.shipTypeId &&
			current.shipTypeId &&
			previous.shipTypeId !== current.shipTypeId
		) {
			await this.lumia.triggerAlert({ alert: ALERT_KEYS.shipChanged });
		}
	}

	async _showAuthFailureToast() {
		if (typeof this.lumia?.showToast !== "function") {
			return;
		}
		try {
			await this.lumia.showToast({
				message:
					"EVE Online auth expired. Re-authorize the plugin in Connections.",
				time: 6,
			});
		} catch (error) {
			return;
		}
	}

	_applyGlobalBackoff(seconds) {
		const delayMs = Math.max(0, this._coerceNumber(seconds, 0)) * 1000;
		const until = Date.now() + delayMs;
		if (!this._globalBackoffUntil || until > this._globalBackoffUntil) {
			this._globalBackoffUntil = until;
		}
	}

	_schedulePolling() {
		this._clearPolling();

		const intervalSeconds = this._pollInterval(this.settings);
		if (!this._hasAuthTokens() || intervalSeconds <= 0) {
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

	_hasAuthTokens() {
		return Boolean(this._accessToken() || this._refreshToken());
	}

	_accessToken() {
		return this._coerceString(this.settings?.accessToken, "");
	}

	_refreshToken() {
		return this._coerceString(this.settings?.refreshToken, "");
	}

	_canRefreshTokens() {
		return Boolean(
			this._refreshToken() &&
			typeof this.lumia?.refreshOAuthToken === "function",
		);
	}

	_pollInterval(settings = this.settings) {
		const interval = this._coerceNumber(
			settings?.pollInterval,
			DEFAULTS.pollInterval,
		);
		return Number.isFinite(interval) ? interval : DEFAULTS.pollInterval;
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
				// const message = this._errorMessage(error);
			}
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

module.exports = EveOnlinePlugin;
