# Lumia Plugin Examples: Games

Use these examples for: Polling third-party game APIs into variables and alerts, with request timeouts, backoff, and change detection.

## Index

| Example | What it does | Shows | Field types |
| --- | --- | --- | --- |
| `eveonline` (EVE Online) | Pull EVE Online character status, wallet, location, and activity from ESI into Lumia. | OAuth, alerts, variables, translations, settings tutorial, actions tutorial | number, password, toggle |
| `minecraft_server` (Minecraft Server) | Monitor Minecraft Java servers for status and player changes with alerts and variables. | alerts, variables, translations, settings tutorial, actions tutorial | checkbox, number, text |
| `retro_achievements` (RetroAchievements) | Track RetroAchievements profile stats, recently played games, and unlocked achievements in Lumia. | actions, alerts, variables, translations, settings tutorial, actions tutorial | checkbox, number, password, text |
| `steam` (Steam) | Track Steam profile status, current/recent games, and achievements in Lumia with optional alerts and actions. | actions, alerts, variables, translations, settings tutorial, actions tutorial | checkbox, number, password, text |

## Example: eveonline

Source folder `examples/eveonline`, category `games`. Pull EVE Online character status, wallet, location, and activity from ESI into Lumia.

### eveonline/manifest.json

```json
{
	"id": "eveonline",
	"name": "EVE Online",
	"version": "1.0.4",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://lumiastream.com",
	"repository": "",
	"description": "Pull EVE Online character status, wallet, location, and activity from ESI into Lumia.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "games",
	"keywords": "eve online, esi, character, stats, mmo, games",
	"icon": "eveonline.png",
	"config": {
		"oauth": {
			"buttonLabel": "Authorize EVE Online",
			"helperText": "Connect your EVE Online character to pull ESI data.",
			"openInBrowser": true,
			"scopes": [
				"esi-characters.read_notifications.v1",
				"esi-industry.read_character_jobs.v1",
				"esi-killmails.read_killmails.v1",
				"esi-location.read_location.v1",
				"esi-location.read_online.v1",
				"esi-location.read_ship_type.v1",
				"esi-markets.read_character_orders.v1",
				"esi-skills.read_skillqueue.v1",
				"esi-wallet.read_character_wallet.v1"
			],
			"tokenKeys": {
				"accessToken": "accessToken",
				"refreshToken": "refreshToken",
				"tokenSecret": "tokenSecret"
			}
		},
		"settings": [
			{
				"key": "pollInterval",
				"label": "Poll Interval (seconds)",
				"type": "number",
				"defaultValue": 120,
				"min": 60,
				"max": 900,
				"helperText": "How often to refresh ESI data (60-900 seconds)."
			},
			{
				"key": "enableAlerts",
				"label": "Enable Alerts",
				"type": "toggle",
				"defaultValue": true,
				"helperText": "Trigger Lumia alerts for EVE Online events."
			},
			{
				"key": "walletAlertThreshold",
				"label": "Wallet Alert Threshold (ISK)",
				"type": "number",
				"defaultValue": 1000000,
				"min": 0,
				"helperText": "Minimum ISK change to trigger wallet spike/drop alerts."
			},
			{
				"key": "accessToken",
				"label": "Access Token",
				"type": "password",
				"helperText": "Auto-filled after OAuth completes.",
				"disabled": true,
				"required": false
			},
			{
				"key": "refreshToken",
				"label": "Refresh Token",
				"type": "password",
				"helperText": "Auto-filled after OAuth completes.",
				"disabled": true,
				"required": false
			}
		],
		"settings_tutorial": "./settings_tutorial.md",
		"actions": [],
		"variables": [
			{
				"name": "character_id",
				"description": "Authenticated character ID.",
				"value": 0
			},
			{
				"name": "character_name",
				"description": "Authenticated character name.",
				"value": ""
			},
			{
				"name": "corporation_id",
				"description": "Character corporation ID.",
				"value": 0
			},
			{
				"name": "alliance_id",
				"description": "Character alliance ID (0 if none).",
				"value": 0
			},
			{
				"name": "security_status",
				"description": "Character security status.",
				"value": 0
			},
			{
				"name": "wallet_balance",
				"description": "Current wallet balance.",
				"value": 0
			},
			{
				"name": "online",
				"description": "Whether the character is currently online.",
				"value": false
			},
			{
				"name": "solar_system_id",
				"description": "Current solar system ID.",
				"value": 0
			},
			{
				"name": "station_id",
				"description": "Current station ID (0 if not docked).",
				"value": 0
			},
			{
				"name": "structure_id",
				"description": "Current structure ID (0 if none).",
				"value": 0
			},
			{
				"name": "ship_name",
				"description": "Current ship name.",
				"value": ""
			},
			{
				"name": "ship_type_id",
				"description": "Current ship type ID.",
				"value": 0
			},
			{
				"name": "ship_item_id",
				"description": "Current ship item ID.",
				"value": 0
			},
			{
				"name": "skillqueue_count",
				"description": "Number of skills in the queue.",
				"value": 0
			},
			{
				"name": "skillqueue_current_skill_id",
				"description": "Skill ID currently training.",
				"value": 0
			},
			{
				"name": "skillqueue_current_level",
				"description": "Training level for the current skill.",
				"value": 0
			},
			{
				"name": "skillqueue_current_end",
				"description": "Finish time for the current skill (ISO).",
				"value": ""
			},
			{
				"name": "skillqueue_ends_at",
				"description": "Finish time for the last queued skill (ISO).",
				"value": ""
			},
			{
				"name": "market_orders_active",
				"description": "Number of active market orders.",
				"value": 0
			},
			{
				"name": "market_orders_buy",
				"description": "Number of active buy orders.",
				"value": 0
			},
			{
				"name": "market_orders_sell",
				"description": "Number of active sell orders.",
				"value": 0
			},
			{
				"name": "industry_jobs_active",
				"description": "Number of active industry jobs.",
				"value": 0
			},
			{
				"name": "industry_jobs_total",
				"description": "Total industry jobs returned by ESI.",
				"value": 0
			},
			{
				"name": "killmails_recent_count",
				"description": "Count of recent killmails.",
				"value": 0
			},
			{
				"name": "notifications_count",
				"description": "Number of notifications returned by ESI.",
				"value": 0
			}
		],
		"alerts": [
			{
				"title": "Online Status Changed",
				"key": "eve_online_status",
				"acceptedVariables": [
					"character_name",
					"online",
					"last_login",
					"last_logout"
				],
				"defaultMessage": "{{character_name}} is now {{online}}."
			},
			{
				"title": "Skill Queue Empty",
				"key": "eve_skillqueue_empty",
				"acceptedVariables": [
					"character_name",
					"skillqueue_count",
					"skillqueue_current_end"
				],
				"defaultMessage": "{{character_name}}'s skill queue is empty."
			},
			{
				"title": "Wallet Spike",
				"key": "eve_wallet_spike",
				"acceptedVariables": ["character_name", "wallet_balance"],
				"defaultMessage": "{{character_name}} wallet increased ({{wallet_balance}} ISK)."
			},
			{
				"title": "Wallet Drop",
				"key": "eve_wallet_drop",
				"acceptedVariables": ["character_name", "wallet_balance"],
				"defaultMessage": "{{character_name}} wallet decreased ({{wallet_balance}} ISK)."
			},
			{
				"title": "New Killmail",
				"key": "eve_killmail_new",
				"acceptedVariables": ["character_name", "killmails_recent_count"],
				"defaultMessage": "New killmail detected for {{character_name}}."
			},
			{
				"title": "New Notification",
				"key": "eve_notification_new",
				"acceptedVariables": ["character_name", "notifications_count"],
				"defaultMessage": "New EVE notification for {{character_name}}."
			},
			{
				"title": "Docked",
				"key": "eve_docked",
				"acceptedVariables": [
					"character_name",
					"station_id",
					"structure_id",
					"solar_system_id"
				],
				"defaultMessage": "{{character_name}} docked."
			},
			{
				"title": "Undocked",
				"key": "eve_undocked",
				"acceptedVariables": [
					"character_name",
					"station_id",
					"structure_id",
					"solar_system_id"
				],
				"defaultMessage": "{{character_name}} undocked."
			},
			{
				"title": "Ship Changed",
				"key": "eve_ship_changed",
				"acceptedVariables": ["character_name", "ship_type_id", "ship_name"],
				"defaultMessage": "{{character_name}} switched ships ({{ship_name}})."
			}
		],
		"actions_tutorial": "./actions_tutorial.md",
		"translations": "./translations.json"
	}
}
```

### eveonline/main.js

```javascript
const { Plugin } = require("@lumiastream/plugin");

const DEFAULTS = {
	pollInterval: 120,
	requestTimeoutMs: 15000,
	stuckRefreshMs: 60000,
	compatibilityDate: "2026-02-03",
	userAgent: "LumiaStream EVE Online Plugin/1.0.0",
	walletAlertThreshold: 1000000,
};

const ESI_BASE_URL = "https://esi.evetech.net/latest";
const ESI_DATASOURCE = "tranquility";
const SSO_VERIFY_URL = "https://login.eveonline.com/oauth/verify";

// showToast's `time` is milliseconds (the host passes it to react-toastify's autoClose),
// so small numbers make the toast flash and vanish before it can be read.
const TOAST_DURATION_MS = 8000;

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
		this._refreshStartedAt = 0;
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

		await this.lumia.log(decorated);
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
			const elapsed = Date.now() - this._refreshStartedAt;
			if (elapsed <= DEFAULTS.stuckRefreshMs) {
				return this._refreshPromise;
			}
			await this._log(
				`Refresh appears stuck for ${Math.round(elapsed / 1000)}s; restarting refresh loop.`,
				"warn",
			);
			this._refreshPromise = null;
			this._refreshStartedAt = 0;
		}

		this._refreshStartedAt = Date.now();
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
			} finally {
				this._refreshPromise = null;
				this._refreshStartedAt = 0;
			}
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
		const response = await this._fetchWithTimeout(SSO_VERIFY_URL, {
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

		const response = await this._fetchWithTimeout(url, { headers });

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

	async _fetchWithTimeout(url, options = {}) {
		const timeoutMs = Math.max(1000, DEFAULTS.requestTimeoutMs);
		const supportsAbort = typeof AbortController !== "undefined";
		if (!supportsAbort) {
			let timeoutId = null;
			try {
				return await Promise.race([
					fetch(url, options),
					new Promise((_, reject) => {
						timeoutId = setTimeout(() => {
							reject(new Error(`EVE request timed out after ${timeoutMs}ms.`));
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
				...options,
				signal: controller.signal,
			});
		} catch (error) {
			if (error?.name === "AbortError") {
				throw new Error(`EVE request timed out after ${timeoutMs}ms.`);
			}
			throw error;
		} finally {
			clearTimeout(timeoutId);
		}
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
				time: TOAST_DURATION_MS,
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
```

### eveonline/actions_tutorial.md

```markdown
---
### Actions
This plugin runs automatically and does not expose actions.
---
```

### eveonline/settings_tutorial.md

```markdown
---
### Authorize This Plugin
1) Click **Authorize EVE Online** in the OAuth section.

**Note:** EVE SSO authorization is per character. To switch characters, re-authorize.
---
---
```

### eveonline/package.json

```json
{
	"name": "lumia_plugin-eve-online",
	"version": "1.0.0",
	"private": true,
	"description": "Lumia Stream plugin that pulls EVE Online character data from ESI.",
	"main": "main.js",
	"scripts": {},
	"dependencies": {
		"@lumiastream/plugin": "^0.4.1"
	}
}
```

### eveonline/translations.json

```json
{
	"en": {
		"character_id": "Authenticated character ID.",
		"character_name": "Authenticated character name.",
		"corporation_id": "Character corporation ID.",
		"alliance_id": "Character alliance ID (0 if none).",
		"security_status": "Character security status.",
		"wallet_balance": "Current wallet balance.",
		"online": "Whether the character is currently online.",
		"solar_system_id": "Current solar system ID.",
		"station_id": "Current station ID (0 if not docked).",
		"structure_id": "Current structure ID (0 if none).",
		"ship_name": "Current ship name.",
		"ship_type_id": "Current ship type ID.",
		"ship_item_id": "Current ship item ID.",
		"skillqueue_count": "Number of skills in the queue.",
		"skillqueue_current_skill_id": "Skill ID currently training.",
		"skillqueue_current_level": "Training level for the current skill.",
		"skillqueue_current_end": "Finish time for the current skill (ISO).",
		"skillqueue_ends_at": "Finish time for the last queued skill (ISO).",
		"market_orders_active": "Number of active market orders.",
		"market_orders_buy": "Number of active buy orders.",
		"market_orders_sell": "Number of active sell orders.",
		"industry_jobs_active": "Number of active industry jobs.",
		"industry_jobs_total": "Total industry jobs returned by ESI.",
		"killmails_recent_count": "Count of recent killmails.",
		"notifications_count": "Number of notifications returned by ESI.",
		"last_login": "Last Login",
		"last_logout": "Last Logout"
	}
}
```

## Example: minecraft_server

Source folder `examples/minecraft_server`, category `games`. Monitor Minecraft Java servers for status and player changes with alerts and variables.

### minecraft_server/manifest.json

```json
{
	"id": "minecraft_server",
	"name": "Minecraft Server",
	"version": "1.0.2",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://lumiastream.com",
	"repository": "https://github.com/LumiaStream/minecraft-server-plugin",
	"description": "Monitor Minecraft Java servers for status and player changes with alerts and variables.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "games",
	"keywords": "minecraft, server, java edition, status, players, games",
	"icon": "minecraft.png",
	"config": {
		"settings": [
			{
				"key": "serverHost",
				"label": "Server Address",
				"type": "text",
				"placeholder": "play.hypixel.net or 192.168.1.100",
				"helperText": "Minecraft server hostname or IP address",
				"required": true
			},
			{
				"key": "serverPort",
				"label": "Server Port",
				"type": "number",
				"defaultValue": 25565,
				"helperText": "Default Minecraft port is 25565",
				"validation": {
					"min": 1,
					"max": 65535
				}
			},
			{
				"key": "useQuery",
				"label": "Enable Query Protocol (Required for player tracking)",
				"type": "checkbox",
				"defaultValue": true,
				"helperText": "Required for player list, join/leave alerts, map, and game type. Set enable-query=true in server.properties."
			},
			{
				"key": "queryPort",
				"label": "Query Port",
				"type": "number",
				"defaultValue": 25565,
				"helperText": "Must match query.port in server.properties (usually the same as server port)",
				"validation": {
					"min": 1,
					"max": 65535
				}
			},
			{
				"key": "pollInterval",
				"label": "Poll Interval (seconds)",
				"type": "number",
				"defaultValue": 10,
				"helperText": "How often to check server status (10-300 seconds)",
				"validation": {
					"min": 10,
					"max": 300
				}
			}
		],
		"settings_tutorial": "./settings_tutorial.md",
		"actions_tutorial": "./actions_tutorial.md",
		"actions": [],
		"variables": [
			{
				"name": "online",
				"description": "Whether the server is online",
				"value": false
			},
			{
				"name": "players_online",
				"description": "Number of players currently online",
				"value": 0
			},
			{
				"name": "players_max",
				"description": "Maximum number of players allowed",
				"value": 0
			},
			{
				"name": "version",
				"description": "Server version (e.g., 1.21.5)",
				"value": ""
			},
			{
				"name": "motd",
				"description": "Server Message of the Day",
				"value": ""
			},
			{
				"name": "protocol_version",
				"description": "Protocol version number",
				"value": 0
			},
			{
				"name": "player_list",
				"description": "Comma-separated list of player names (Query only)",
				"value": ""
			},
			{
				"name": "map",
				"description": "Current world/map name (Query only)",
				"value": ""
			},
			{
				"name": "game_type",
				"description": "Game type (Survival, Creative, etc.) (Query only)",
				"value": ""
			},
			{
				"name": "last_player_joined",
				"description": "Username of last player who joined",
				"value": ""
			},
			{
				"name": "last_player_left",
				"description": "Username of last player who left",
				"value": ""
			}
		],
		"alerts": [
			{
				"title": "Server Online",
				"key": "serverOnline",
				"acceptedVariables": [
					"online",
					"version",
					"motd",
					"players_max"
				],
				"defaultMessage": "Minecraft server is now online!",
				"variationConditions": [
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			},
			{
				"title": "Server Offline",
				"key": "serverOffline",
				"acceptedVariables": [],
				"defaultMessage": "Minecraft server went offline",
				"variationConditions": [
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			},
			{
				"title": "Player Joined",
				"key": "playerJoined",
				"acceptedVariables": [
					"username",
					"last_player_joined",
					"players_online",
					"players_max"
				],
				"defaultMessage": "{{last_player_joined}} joined the server! ({{players_online}}/{{players_max}})",
				"variationConditions": [
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			},
			{
				"title": "Player Left",
				"key": "playerLeft",
				"acceptedVariables": [
					"username",
					"last_player_left",
					"players_online",
					"players_max"
				],
				"defaultMessage": "{{last_player_left}} left the server ({{players_online}}/{{players_max}})",
				"variationConditions": [
					{
						"type": "RANDOM",
						"description": "Trigger this variation based on a percent chance."
					}
				]
			}
		],
		"translations": "./translations.json"
	}
}
```

### minecraft_server/main.js

```javascript
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
```

### minecraft_server/actions_tutorial.md

```markdown
---
### Actions
This plugin runs on the poll interval and does not expose actions.
---
```

### minecraft_server/settings_tutorial.md

```markdown
---
### 🎮 Setup Your Minecraft Server Monitoring
1) Enter your server address (hostname or IP)
2) Enter server port (default: 25565)
3) **Enable Query protocol (required for player tracking)**
   - Set `enable-query=true` in server.properties
   - Ensure `query.port` matches the Query Port setting
   - Enables player list, join/leave alerts, map, and game type
4) Set poll interval (how often to check)
5) Click **Save** to start monitoring
### 📊 What Gets Tracked
- Server online/offline status
- Current player count
- Maximum players
- Server version
- MOTD (Message of the Day)
- Player list (Query required)
---
```

### minecraft_server/package.json

```json
{
	"name": "lumia-minecraft-server",
	"version": "1.0.0",
	"private": true,
	"description": "Monitor Minecraft Java Edition servers using Server List Ping and Query protocols.",
	"main": "main.js",
	"scripts": {},
	"dependencies": {
		"@lumiastream/plugin": "^0.4.1"
	}
}
```

### minecraft_server/translations.json

```json
{
	"en": {
		"online": "Whether the server is online",
		"players_online": "Number of players currently online",
		"players_max": "Maximum number of players allowed",
		"version": "Server version (e.g., 1.21.5)",
		"motd": "Server Message of the Day",
		"protocol_version": "Protocol version number",
		"player_list": "Comma-separated list of player names (Query only)",
		"map": "Current world/map name (Query only)",
		"game_type": "Game type (Survival, Creative, etc.) (Query only)",
		"last_player_joined": "Username of last player who joined",
		"last_player_left": "Username of last player who left",
		"username": "Username"
	}
}
```

## Example: retro_achievements

Source folder `examples/retro_achievements`, category `games`. Track RetroAchievements profile stats, recently played games, and unlocked achievements in Lumia.

### retro_achievements/manifest.json

```json
{
	"id": "retro_achievements",
	"name": "RetroAchievements",
	"version": "1.0.5",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://lumiastream.com",
	"description": "Track RetroAchievements profile stats, recently played games, and unlocked achievements in Lumia.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "games",
	"keywords": "retroachievements, retro gaming, achievements, hardcore mode",
	"icon": "retro_achievements.png",
	"config": {
		"settings": [
			{
				"key": "apiKey",
				"label": "RetroAchievements Web API Key",
				"type": "password",
				"section": "General",
				"sectionOrder": 1,
				"required": true,
				"helperText": "Get this key from your RetroAchievements account settings."
			},
			{
				"key": "username",
				"label": "RetroAchievements Username",
				"type": "text",
				"section": "General",
				"sectionOrder": 1,
				"required": true,
				"helperText": "Your exact RetroAchievements username."
			},
			{
				"key": "pollInterval",
				"label": "Poll Interval (seconds)",
				"type": "number",
				"section": "General",
				"sectionOrder": 1,
				"defaultValue": 30,
				"min": 30,
				"max": 900,
				"helperText": "How often to refresh profile/game data (30-900 seconds)."
			},
			{
				"key": "debugLogs",
				"label": "Enable Debug Logs",
				"type": "checkbox",
				"section": "Advanced",
				"sectionOrder": 2,
				"defaultValue": false,
				"refreshOnChange": true,
				"helperText": "Writes detailed RetroAchievements diagnostics to Lumia logs."
			}
		],
		"settings_tutorial": "./settings_tutorial.md",
		"actions_tutorial": "./actions_tutorial.md",
		"actions": [
			{
				"type": "refresh",
				"label": "Refresh Now",
				"description": "Force an immediate profile and achievement refresh.",
				"fields": []
			},
			{
				"type": "fetch_game",
				"label": "Fetch Game Progress",
				"description": "Fetch progress by game title (recently played) or game ID.",
				"acceptedVariables": [
					"retro_achievements_username",
					"retro_achievements_requested_game_id",
					"retro_achievements_requested_game_title",
					"retro_achievements_requested_game_console",
					"retro_achievements_requested_game_icon",
					"retro_achievements_requested_game_achievement_total",
					"retro_achievements_requested_game_achievement_unlocked",
					"retro_achievements_requested_game_achievement_unlocked_hardcore",
					"retro_achievements_requested_game_completion",
					"retro_achievements_requested_game_payload"
				],
				"fields": [
					{
						"key": "game",
						"label": "Game Title or Game ID",
						"type": "text",
						"placeholder": "ex: Super Mario World or 228",
						"allowVariables": true,
						"helperText": "Title matching uses your recently played list."
					}
				]
			}
		],
		"variables": [
			{
				"name": "total_points",
				"description": "Total hardcore points.",
				"value": 0
			},
			{
				"name": "total_softcore_points",
				"description": "Total softcore points.",
				"value": 0
			},
			{
				"name": "total_true_points",
				"description": "Total true points.",
				"value": 0
			},
			{
				"name": "total_rank",
				"description": "Global rank.",
				"value": 0
			},
			{
				"name": "last_game_id",
				"description": "Most recent game ID from profile.",
				"value": 0
			},
			{
				"name": "last_game_title",
				"description": "Most recent game title from profile.",
				"value": ""
			},
			{
				"name": "last_game_console",
				"description": "Console name for last game (when available).",
				"value": ""
			},
			{
				"name": "last_game_icon",
				"description": "Game icon URL for last game.",
				"value": ""
			},
			{
				"name": "last_game_achievement_total",
				"description": "Total achievements in the last game.",
				"value": 0
			},
			{
				"name": "last_game_achievement_unlocked",
				"description": "Unlocked achievements in the last game.",
				"value": 0
			},
			{
				"name": "last_game_achievement_unlocked_hardcore",
				"description": "Hardcore unlocked achievements in the last game.",
				"value": 0
			},
			{
				"name": "last_game_completion",
				"description": "Completion percentage text from API.",
				"value": ""
			}
		],
		"alerts": [
			{
				"title": "Current Game Changed",
				"key": "current_game_changed",
				"acceptedVariables": [
					"username",
					"last_game_id",
					"last_game_title",
					"last_game_console",
					"last_game_icon",
					"previous_game_id",
					"previous_game_title"
				],
				"defaultMessage": "{{username}} is now playing {{last_game_title}}.",
				"variationConditions": [
					{
						"type": "EQUAL_STRING",
						"description": "Game Title"
					}
				]
			},
			{
				"title": "Current Game Over",
				"key": "current_game_over",
				"acceptedVariables": [
					"username",
					"previous_game_id",
					"previous_game_title"
				],
				"defaultMessage": "{{username}} stopped playing {{previous_game_title}}.",
				"variationConditions": [
					{
						"type": "EQUAL_STRING",
						"description": "Previous Game Title"
					}
				]
			},
			{
				"title": "Achievement Unlocked",
				"key": "achievement_unlocked",
				"acceptedVariables": [
					"username",
					"game_id",
					"game_title",
					"game_console",
					"achievement_id",
					"achievement_title",
					"achievement_description",
					"achievement_points",
					"achievement_hardcore",
					"achievement_date_awarded",
					"achievement_badge_url",
					"game_achievement_total",
					"game_achievement_unlocked"
				],
				"defaultMessage": "{{username}} unlocked {{achievement_title}} in {{game_title}}.",
				"variationConditions": [
					{
						"type": "EQUAL_STRING",
						"description": "Achievement Title"
					}
				]
			}
		],
		"translations": "./translations.json"
	}
}
```

### retro_achievements/main.js

```javascript
const { Plugin } = require("@lumiastream/plugin");

const DEFAULTS = {
	pollInterval: 30,
	minPollInterval: 30,
	maxPollInterval: 900,
	requestTimeoutMs: 15000,
	stuckRefreshMs: 60000,
	recentAchievementsWindowMinutes: 120,
	recentPlayedCount: 100,
	userAgent: "LumiaStream RetroAchievements Plugin/1.0.0",
	logThrottleMs: 5 * 60 * 1000,
	matchThreshold: 0.7,
	maxSeenUnlocks: 2000,
};

const RA_API_BASE = "https://retroachievements.org/API";
const RA_SITE_BASE = "https://retroachievements.org";

// showToast's `time` is milliseconds (the host passes it to react-toastify's autoClose),
// so small numbers make the toast flash and vanish before it can be read.
const TOAST_DURATION_MS = 8000;
const INFO_TOAST_DURATION_MS = 5000;

const ALERT_KEYS = {
	currentGameChanged: "current_game_changed",
	currentGameOver: "current_game_over",
	achievementUnlocked: "achievement_unlocked",
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
		this._hasInitialSync = false;
		this._refreshStartedAt = 0;
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
		try {
			await this.lumia.log(decorated);
		} catch {
			// Keep plugin flow alive when logging transport is unavailable.
		}

		if (this._debugEnabled()) {
			console.log(decorated);
		}
	}

	async _logThrottled(
		_key,
		message,
		severity = "info",
		_intervalMs = DEFAULTS.logThrottleMs,
	) {
		if (!this._debugEnabled()) {
			return;
		}
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
			const elapsed = Date.now() - this._refreshStartedAt;
			if (elapsed <= DEFAULTS.stuckRefreshMs) {
				return this._refreshPromise;
			}

			await this._logThrottled(
				"refresh-stuck",
				`Refresh appears stuck for ${Math.round(elapsed / 1000)}s; starting a new refresh cycle.`,
				"warn",
			);
			this._refreshPromise = null;
			this._refreshStartedAt = 0;
		}

		this._refreshStartedAt = Date.now();
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
			} finally {
				this._refreshPromise = null;
				this._refreshStartedAt = 0;
			}
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
		const timeoutMs = Math.max(1000, DEFAULTS.requestTimeoutMs);
		const supportsAbort = typeof AbortController !== "undefined";

		if (!supportsAbort) {
			let timeoutId = null;
			try {
				return await Promise.race([
					fetch(url, { headers, cache: "no-store" }),
					new Promise((_, reject) => {
						timeoutId = setTimeout(() => {
							reject(
								new Error(
									`RetroAchievements request timed out after ${timeoutMs}ms.`,
								),
							);
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
				throw new Error(`RetroAchievements request timed out after ${timeoutMs}ms.`);
			}
			throw error;
		} finally {
			clearTimeout(timeoutId);
		}
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

		const previousGameId = this._lastGameId;
		const previousGameTitle = this._lastGameTitle;
		const changedToNewGame =
			lastGameId > 0 && (previousGameId === null || lastGameId !== previousGameId);
		const changedToNoGame = !lastGameId && previousGameId !== null;

		if (changedToNewGame) {
			const vars = this._buildCurrentGameAlertVariables({
				profile,
				currentGame,
				gameProgress,
			});
			await this.lumia.triggerAlert({
				alert: ALERT_KEYS.currentGameChanged,
				...this._buildAlertPayload(vars, {
					dynamicValue: vars.last_game_title,
					previous_game_id: previousGameId,
					previous_game_title: previousGameTitle,
				}),
			});
		}

		if (changedToNoGame) {
			const vars = this._buildCurrentGameAlertVariables({
				profile,
				currentGame,
				gameProgress,
			});
			await this.lumia.triggerAlert({
				alert: ALERT_KEYS.currentGameOver,
				...this._buildAlertPayload(vars, {
					dynamicValue: previousGameTitle || "Stopped Playing",
					previous_game_id: previousGameId,
					previous_game_title: previousGameTitle,
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
		const time =
			type === "error" || type === "warn" || type === "warning"
				? TOAST_DURATION_MS
				: INFO_TOAST_DURATION_MS;
		try {
			await this.lumia.showToast({
				message,
				time,
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

		const previousState = this._lastConnectionState;
		this._lastConnectionState = state;
		if (typeof this.lumia.updateConnection !== "function") {
			return;
		}

		try {
			await this.lumia.updateConnection(state);
			if (!state) {
				await this._logThrottled(
					"connection-down",
					"RetroAchievements connection is down; polling will continue automatically.",
					"warn",
					60 * 1000,
				);
			} else if (previousState === false) {
				await this._log("RetroAchievements connection restored.");
			}
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
```

### retro_achievements/actions_tutorial.md

```markdown
---
### Refresh Now
Runs an immediate RetroAchievements refresh cycle.

### Fetch Game Progress
Use **Fetch Game Progress** with either:
- A numeric game ID, or
- A title from your recently played list.

The action triggers the **Requested Game Progress** alert with local `requested_game_*` variables.
---
```

### retro_achievements/settings_tutorial.md

```markdown
---
### RetroAchievements API Key
1) Sign in to your [RetroAchievements account settings](https://retroachievements.org/settings).
2) Copy your **Web API Key**.
3) Paste it into **RetroAchievements Web API Key** in plugin settings.

### Username
1) Enter your exact RetroAchievements username in **RetroAchievements Username**.
2) Save settings to start polling profile/game data.

### Polling Tips
- Keep **Poll Interval** at 30 seconds or higher to reduce API pressure.
- The plugin uses a fixed 120-minute recent-achievement lookback for reliable unlock detection.
---
```

### retro_achievements/package.json

```json
{
	"name": "lumia-plugin-retro-achievements",
	"version": "1.0.3",
	"private": true,
	"description": "Lumia Stream plugin for RetroAchievements profile and achievement tracking.",
	"main": "main.js",
	"scripts": {},
	"dependencies": {
		"@lumiastream/plugin": "^0.4.1"
	}
}
```

### retro_achievements/translations.json

```json
{
	"en": {
		"total_points": "Total hardcore points.",
		"total_softcore_points": "Total softcore points.",
		"total_true_points": "Total true points.",
		"total_rank": "Global rank.",
		"last_game_id": "Most recent game ID from profile.",
		"last_game_title": "Most recent game title from profile.",
		"last_game_console": "Console name for last game.",
		"last_game_icon": "Icon URL for last game.",
		"last_game_achievement_total": "Total achievements in the last game.",
		"last_game_achievement_unlocked": "Unlocked achievements in the last game.",
		"last_game_achievement_unlocked_hardcore": "Hardcore unlocked achievements in the last game.",
		"last_game_completion": "Completion percentage text from API."
	}
}
```

## Example: steam

Source folder `examples/steam`, category `games`. Track Steam profile status, current/recent games, and achievements in Lumia with optional alerts and actions.

### steam/manifest.json

```json
{
	"id": "steam",
	"name": "Steam",
	"version": "1.1.1",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://lumiastream.com",
	"description": "Track Steam profile status, current/recent games, and achievements in Lumia with optional alerts and actions.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "games",
	"keywords": "steam, steam api, gaming, profile, online status, achievements, recently played",
	"icon": "steam.png",
	"config": {
		"settings": [
			{
				"key": "apiKey",
				"label": "Steam Web API Key",
				"type": "password",
				"section": "General",
				"sectionOrder": 1,
				"helperText": "Required for all Steam Web API requests.",
				"required": true
			},
			{
				"key": "steamIdOrVanity",
				"label": "Steam ID or Vanity Name",
				"type": "text",
				"section": "General",
				"sectionOrder": 1,
				"helperText": "Enter a SteamID64 or a vanity URL name.",
				"required": true
			},
			{
				"key": "pollInterval",
				"label": "Poll Interval (seconds)",
				"type": "number",
				"section": "General",
				"sectionOrder": 1,
				"defaultValue": 30,
				"min": 30,
				"max": 900,
				"helperText": "How often to refresh current status/game and current-game achievements (30-900 seconds). Owned games refresh less frequently automatically."
			},
			{
				"key": "debugLogs",
				"label": "Enable Debug Logs",
				"type": "checkbox",
				"section": "Advanced",
				"sectionOrder": 2,
				"defaultValue": false,
				"refreshOnChange": true,
				"helperText": "Writes detailed Steam plugin diagnostics to Lumia logs for troubleshooting."
			}
		],
		"settings_tutorial": "./settings_tutorial.md",
		"actions_tutorial": "./actions_tutorial.md",
		"actions": [
			{
				"type": "fetch_game",
				"label": "Fetch Achievements For Game",
				"description": "Fetch achievements by game name or App ID (owned games only).",
				"acceptedVariables": [
					"steam_requested_game_input",
					"steam_requested_game_appid",
					"steam_requested_game_name",
					"steam_requested_game_graphics_url",
					"steam_requested_game_playtime_minutes",
					"steam_requested_game_achievement_count",
					"steam_requested_game_achievement_unlocked",
					"steam_requested_game_achievements"
				],
				"fields": [
					{
						"key": "game",
						"label": "Game Name or App ID",
						"type": "text",
						"placeholder": "ex: Sonic or 1145360",
						"helperText": "Searches your owned games library for a match.",
						"allowVariables": true
					}
				]
			}
		],
		"variables": [
			{
				"name": "steamid",
				"description": "SteamID64.",
				"value": ""
			},
			{
				"name": "persona_username",
				"description": "Username (Steam persona name).",
				"value": ""
			},
			{
				"name": "online_status",
				"description": "Online status (text).",
				"value": "Offline"
			},
			{
				"name": "last_logoff",
				"description": "Last logoff Unix timestamp.",
				"value": 0
			},
			{
				"name": "profile_url",
				"description": "Profile URL.",
				"value": ""
			},
			{
				"name": "avatar",
				"description": "Avatar URL.",
				"value": ""
			},
			{
				"name": "current_game_name",
				"description": "Current in-game name (if playing).",
				"value": ""
			},
			{
				"name": "current_game_appid",
				"description": "Current in-game app ID (if playing).",
				"value": 0
			},
			{
				"name": "current_game_graphics_url",
				"description": "Current game's Steam header image URL.",
				"value": ""
			},
			{
				"name": "current_game_playtime_minutes",
				"description": "Total Steam playtime for the current game, in minutes.",
				"value": 0
			},
			{
				"name": "game_count",
				"description": "Owned games count.",
				"value": 0
			},
			{
				"name": "current_game_achievement_count",
				"description": "Total achievements for the current/last played game.",
				"value": 0
			},
			{
				"name": "current_game_achievement_unlocked_count",
				"description": "Unlocked achievements for the current/last played game.",
				"value": 0
			},
			{
				"name": "current_game_achievement_name",
				"description": "Most recently unlocked current-game achievement name.",
				"value": ""
			},
			{
				"name": "current_game_achievement_description",
				"description": "Most recently unlocked current-game achievement description.",
				"value": ""
			}
		],
		"alerts": [
			{
				"title": "Online Status Changed",
				"key": "online_state_changed",
				"acceptedVariables": ["persona_username", "online_status"],
				"defaultMessage": "{{persona_username}} is now {{online_status}}.",
				"defaults": {
					"on": false
				},
				"variationConditions": [
					{
						"type": "EQUAL_SELECTION",
						"description": "Pick a online for status.",
						"selections": [
							{
								"label": "Online",
								"value": "online",
								"message": "{{persona_username}} is now Online."
							},
							{
								"label": "Offline",
								"value": "offline",
								"message": "{{persona_username}} went Offline."
							}
						]
					}
				]
			},
			{
				"title": "Achievement Unlocked",
				"key": "achievement_unlocked",
				"acceptedVariables": [
					"current_game_name",
					"achievement_name",
					"achievement_description",
					"current_game_achievement_unlocked_count",
					"current_game_achievement_count"
				],
				"defaultMessage": "{{current_game_name}}: {{achievement_name}} - {{achievement_description}}.",
				"variationConditions": [
					{
						"type": "EQUAL_STRING",
						"description": "Achievement Name"
					}
				]
			},
			{
				"title": "Achievement Progress Changed",
				"key": "achievement_progress_changed",
				"acceptedVariables": [
					"current_game_name",
					"achievement_name",
					"achievement_description",
					"current_game_achievement_unlocked_count",
					"current_game_achievement_count"
				],
				"defaultMessage": "{{current_game_name}} achievements: {{current_game_achievement_unlocked_count}}/{{current_game_achievement_count}}.",
				"defaults": {
					"on": false
				}
			},
			{
				"title": "Game Changed",
				"key": "current_game_changed",
				"acceptedVariables": [
					"current_game_name",
					"current_game_appid",
					"current_game_graphics_url",
					"current_game_playtime_minutes"
				],
				"defaultMessage": "Now playing {{current_game_name}}.",
				"variationConditions": [
					{
						"type": "EQUAL_STRING",
						"description": "Game Name"
					}
				]
			},
			{
				"title": "Game Over",
				"key": "current_game_over",
				"acceptedVariables": ["previous_game_name"],
				"defaultMessage": "Stopped playing {{previous_game_name}}.",
				"variationConditions": [
					{
						"type": "EQUAL_STRING",
						"description": "Previous Game Name"
					}
				]
			}
		],
		"translations": "./translations.json"
	}
}
```

### steam/main.js

```javascript
const { Plugin } = require("@lumiastream/plugin");

const DEFAULTS = {
	pollInterval: 120,
	minPollInterval: 30,
	maxPollInterval: 900,
	requestTimeoutMs: 15000,
	validationTimeoutMs: 20000,
	lumiaCallTimeoutMs: 1000,
	stuckRefreshMs: 60000,
	ownedGamesRefreshSeconds: 600,
	userAgent: "LumiaStream Steam Plugin/1.0.0",
	achievementSchemaCacheMaxEntries: 1,
	matchThreshold: 0.7,
};

const STEAM_API_BASE = "https://api.steampowered.com";

// showToast's `time` is milliseconds (the host passes it to react-toastify's autoClose),
// so small numbers make the toast flash and vanish before it can be read.
const TOAST_DURATION_MS = 8000;
const INFO_TOAST_DURATION_MS = 5000;

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
	currentGameGraphicsUrl: "current_game_graphics_url",
	currentGamePlaytimeMinutes: "current_game_playtime_minutes",
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
	requestedGameGraphicsUrl: "steam_requested_game_graphics_url",
	requestedGamePlaytimeMinutes: "steam_requested_game_playtime_minutes",
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
		this._ownedGamesByAppId = new Map();
	}

	async onload() {
		if (!this._hasRequiredSettings()) {
			await this._log("Missing Steam API key or Steam ID.", "warn");
			await this._updateConnectionState(false);
			return;
		}

		void this._refreshData({ reason: "startup" });
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
			this._ownedGamesByAppId.clear();
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

	async validateAuth(data = {}) {
		const settings = this._settingsWith(data);
		if (!this._hasRequiredSettings(settings)) {
			await this._log("Steam validation failed: missing API key or Steam ID.", "warn");
			await this._updateConnectionState(false);
			return {
				ok: false,
				message: "Missing Steam API key or Steam ID.",
			};
		}

		try {
			await this._log("Validating Steam connection.");
			const steamId = await this._withTimeout(
				(async () => {
					const resolvedSteamId = await this._resolveSteamId(settings, {
						cache: false,
					});
					await this._fetchPlayerSummary(resolvedSteamId, settings);
					return resolvedSteamId;
				})(),
				DEFAULTS.validationTimeoutMs,
				"Steam validation timed out.",
			);
			await this._updateConnectionState(true);
			await this._log(`Steam validation succeeded for SteamID64 ${steamId}.`);
			return { ok: true };
		} catch (error) {
			const message = this._errorMessage(error);
			await this._log(`Steam validation failed: ${message}`, "error");
			await this._updateConnectionState(false);
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
				? `${prefix} WARN ${message}`
				: severity === "error"
					? `${prefix} ERROR ${message}`
					: `${prefix} ${message}`;

		if (severity === "warn") {
			console.warn(decorated);
		} else if (severity === "error") {
			console.error(decorated);
		} else if (this._debugEnabled()) {
			console.log(decorated);
		}

		if (typeof this.lumia?.log !== "function") {
			return;
		}

		try {
			await this._withTimeout(
				Promise.resolve(this.lumia.log(decorated)),
				DEFAULTS.lumiaCallTimeoutMs,
				"Lumia log timed out.",
			);
		} catch {
			// Keep plugin flow alive when logging transport is unavailable.
		}
	}

	async _tempDebug(message) {
		if (!this._debugEnabled()) {
			return;
		}

		const prefixed = `[TEMP DEBUG] ${message}`;
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
				const currentGameAppId = this._coerceNumber(
					summaryResult?.data?.gameid,
					0,
				);

				const shouldFetchOwned =
					forceFullRefresh ||
					!this._lastOwnedFetchAt ||
					now - this._lastOwnedFetchAt >= this._ownedGamesRefreshMs() ||
					Boolean(
						currentGameAppId &&
							currentGameAppId !== this._lastCurrentGameAppId &&
							!this._ownedGamesByAppId.has(currentGameAppId),
					);
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
				);

				await this._applySummary(summaryResult.data, steamId);
				if (shouldFetchOwned) {
					await this._applyOwnedGames(ownedResult.data);
				}
				if (summaryResult.data) {
					await this._applyCurrentGameDetails(currentGameAppId);
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
				await this._log(
					`Steam refresh failed: ${this._errorMessage(error)}`,
					"error",
				);
				await this._updateConnectionState(false);
			} finally {
				this._refreshPromise = null;
				this._refreshStartedAt = 0;
			}
		})();

		return this._refreshPromise;
	}

	async _resolveSteamId(settings = this.settings, { cache = true } = {}) {
		if (cache && this._resolvedSteamId) {
			return this._resolvedSteamId;
		}

		const input = this._normalizeSteamIdentifier(
			this._coerceString(settings?.steamIdOrVanity, "").trim(),
		);
		if (!input) {
			throw new Error("Missing Steam ID or vanity name.");
		}

		if (/^\d{17}$/.test(input)) {
			if (cache) {
				this._resolvedSteamId = input;
			}
			return input;
		}

		const resolved = await this._fetchResolveVanity(input, settings);
		const steamId = this._coerceString(resolved?.steamid, "");
		if (!steamId) {
			throw new Error("Could not resolve vanity URL.");
		}

		if (cache) {
			this._resolvedSteamId = steamId;
		}
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

	async _fetchResolveVanity(vanity, settings = this.settings) {
		const url = `${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/?key=${encodeURIComponent(
			this._apiKey(settings),
		)}&vanityurl=${encodeURIComponent(vanity)}&url_type=1`;
		const response = await this._fetchJson(url);
		return response?.response ?? null;
	}

	async _fetchPlayerSummary(steamId, settings = this.settings) {
		const url = `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${encodeURIComponent(
			this._apiKey(settings),
		)}&steamids=${encodeURIComponent(steamId)}`;
		const response = await this._fetchJson(url);
		return response?.response?.players?.[0] ?? null;
	}

	async _fetchOwnedGames(steamId, settings = this.settings) {
		const url = `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/?key=${encodeURIComponent(
			this._apiKey(settings),
		)}&steamid=${encodeURIComponent(steamId)}&include_appinfo=0&include_played_free_games=1`;
		return this._fetchJson(url);
	}

	async _fetchAchievements(steamId, appId, settings = this.settings) {
		const targetAppId = this._coerceNumber(appId, 0);
		if (!targetAppId) {
			return null;
		}

		const url = `${STEAM_API_BASE}/ISteamUserStats/GetPlayerAchievements/v1/?key=${encodeURIComponent(
			this._apiKey(settings),
		)}&steamid=${encodeURIComponent(steamId)}&appid=${targetAppId}&l=en&_=${Date.now()}`;
		return this._fetchJson(url);
	}

	async _fetchAchievementSchema(appId, settings = this.settings) {
		const targetAppId = this._coerceNumber(appId, 0);
		if (!targetAppId) {
			return null;
		}

		const url = `${STEAM_API_BASE}/ISteamUserStats/GetSchemaForGame/v2/?key=${encodeURIComponent(
			this._apiKey(settings),
		)}&appid=${targetAppId}&l=en`;
		return this._fetchJson(url);
	}

	async _fetchOwnedGamesWithInfo(steamId, settings = this.settings) {
		const url = `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/?key=${encodeURIComponent(
			this._apiKey(settings),
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

		this._cacheOwnedGames(owned);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.gameCount,
			this._coerceNumber(owned?.response?.game_count, 0),
		);
	}

	_cacheOwnedGames(owned) {
		const games = Array.isArray(owned?.response?.games)
			? owned.response.games
			: [];
		this._ownedGamesByAppId.clear();
		if (!games.length) {
			return;
		}

		for (const game of games) {
			const appId = this._gameAppId(game);
			if (!appId) {
				continue;
			}
			this._ownedGamesByAppId.set(appId, game);
		}
	}

	async _applyCurrentGameDetails(appId) {
		const currentGameAppId = this._coerceNumber(appId, 0);
		if (!currentGameAppId) {
			await this._setVariableIfChanged(VARIABLE_NAMES.currentGameGraphicsUrl, "");
			await this._setVariableIfChanged(
				VARIABLE_NAMES.currentGamePlaytimeMinutes,
				0,
			);
			return;
		}

		const game = this._ownedGamesByAppId.get(currentGameAppId);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.currentGameGraphicsUrl,
			this._gameGraphicsUrl(currentGameAppId),
		);
		await this._setVariableIfChanged(
			VARIABLE_NAMES.currentGamePlaytimeMinutes,
			this._gamePlaytimeMinutes(game),
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

		const cached = this._achievementSchemaCache.get(targetAppId);
		if (cached && typeof cached === "object") {
			// Move hit to the end to preserve LRU order.
			this._achievementSchemaCache.delete(targetAppId);
			this._achievementSchemaCache.set(targetAppId, cached);
			return cached.value ?? null;
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

		this._achievementSchemaCache.set(targetAppId, {
			value: schemaMap,
		});
		this._pruneAchievementSchemaCache();
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
		let resolvedGame = null;

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
				resolvedGame = match.game;
			} else {
				const found = games.find(
					(game) => String(game?.appid) === String(appId),
				);
				gameName = this._coerceString(found?.name, "");
				resolvedGame = found ?? null;
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
			[ACTION_VARIABLE_NAMES.requestedGameGraphicsUrl]:
				this._gameGraphicsUrl(appId),
			[ACTION_VARIABLE_NAMES.requestedGamePlaytimeMinutes]:
				this._gamePlaytimeMinutes(resolvedGame),
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
				game,
				score: Number(score.toFixed(3)),
			});
		}

		results.sort((a, b) => b.score - a.score);
		return results.slice(0, 10);
	}

	_gameAppId(game) {
		return this._coerceNumber(game?.appid, 0);
	}

	_gameGraphicsUrl(appId) {
		const targetAppId = this._coerceNumber(appId, 0);
		if (!targetAppId) {
			return "";
		}
		return `https://cdn.akamai.steamstatic.com/steam/apps/${targetAppId}/header.jpg`;
	}

	_gamePlaytimeMinutes(game) {
		return this._coerceNumber(game?.playtime_forever, 0);
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
		const currentGameAppId = this._coerceNumber(summary?.gameid, 0);
		const currentGame = this._ownedGamesByAppId.get(currentGameAppId);
		return {
			persona_username: this._coerceString(summary?.personaname, ""),
			online_status: this._coerceString(onlineStatus, ""),
			current_game_name: this._coerceString(summary?.gameextrainfo, ""),
			current_game_appid: currentGameAppId,
			current_game_graphics_url: this._gameGraphicsUrl(currentGameAppId),
			current_game_playtime_minutes: this._gamePlaytimeMinutes(currentGame),
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
			await this._withTimeout(
				Promise.resolve(
					this.lumia.showToast({
						message: "Invalid Steam API key. Update the plugin settings.",
						time: TOAST_DURATION_MS,
						type: "error",
					}),
				),
				DEFAULTS.lumiaCallTimeoutMs,
				"Lumia toast timed out.",
			);
		} catch (error) {
			return;
		}
	}

	async _showActionToast(message, type = "info") {
		if (typeof this.lumia?.showToast !== "function") {
			return;
		}
		const time =
			type === "error" || type === "warn" || type === "warning"
				? TOAST_DURATION_MS
				: INFO_TOAST_DURATION_MS;
		try {
			await this._withTimeout(
				Promise.resolve(
					this.lumia.showToast({
						message,
						time,
						type,
					}),
				),
				DEFAULTS.lumiaCallTimeoutMs,
				"Lumia toast timed out.",
			);
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

	_settingsWith(data = {}) {
		return {
			...(this.settings && typeof this.settings === "object" ? this.settings : {}),
			...(data && typeof data === "object" ? data : {}),
		};
	}

	_hasRequiredSettings(settings = this.settings) {
		return Boolean(this._apiKey(settings) && this._steamIdInput(settings));
	}

	_apiKey(settings = this.settings) {
		return this._coerceString(settings?.apiKey, "");
	}

	_steamIdInput(settings = this.settings) {
		return this._coerceString(settings?.steamIdOrVanity, "");
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

		const previousState = this._lastConnectionState;
		this._lastConnectionState = state;

		if (typeof this.lumia?.updateConnection !== "function") {
			return;
		}

		try {
			await this._withTimeout(
				Promise.resolve(this.lumia.updateConnection(state)),
				DEFAULTS.lumiaCallTimeoutMs,
				"Lumia connection update timed out.",
			);
			if (!state) {
				await this._log(
					"Steam connection is down; check the API key, Steam ID, and Steam profile privacy.",
					"warn",
				);
			} else if (previousState === false) {
				await this._log("Steam connection restored.");
			}
		} catch (error) {
			const message = this._errorMessage(error);
			await this._log(
				`Failed to update Steam connection state: ${message}`,
				"warn",
			);
		}
	}

	async _safeFetch(label, fn) {
		try {
			return { ok: true, data: await fn() };
		} catch (error) {
			await this._log(
				`Steam ${label || "request"} failed: ${this._errorMessage(error)}`,
				"warn",
			);
			return { ok: false, data: null };
		}
	}

	_pruneAchievementSchemaCache() {
		const maxEntries = Math.max(
			1,
			this._coerceNumber(DEFAULTS.achievementSchemaCacheMaxEntries, 1),
		);
		while (this._achievementSchemaCache.size > maxEntries) {
			const oldestKey = this._achievementSchemaCache.keys().next().value;
			if (oldestKey === undefined) {
				return;
			}
			this._achievementSchemaCache.delete(oldestKey);
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

	_withTimeout(promise, timeoutMs, message) {
		const ms = Math.max(1, this._coerceNumber(timeoutMs, 1000));
		return new Promise((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				reject(new Error(message || `Operation timed out after ${ms}ms.`));
			}, ms);

			Promise.resolve(promise).then(
				(value) => {
					clearTimeout(timeoutId);
					resolve(value);
				},
				(error) => {
					clearTimeout(timeoutId);
					reject(error);
				},
			);
		});
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
```

### steam/actions_tutorial.md

```markdown
---
---
### Fetch Game Achievements
Use **Fetch Achievements For Game** to query a specific game by name or App ID.
The results are returned from the action through its accepted variables, including
the resolved App ID, Steam graphics URL, playtime in minutes, and achievement data.
---
```

### steam/settings_tutorial.md

```markdown
---
### Steam Web API Key
1) Open the [Steam Web API Key page](https://steamcommunity.com/dev/apikey) and sign in.
2) Enter a domain name (you can use `localhost`).
3) Accept the terms and click **Register**.
4) Copy the generated key and paste it into **Steam Web API Key**.

### Steam ID
1) Open your Steam profile.
2) Paste **any** of the following into **Steam ID / Vanity Name**:
   - Your SteamID64 (from account details)
   - Your vanity profile name
   - Your full profile URL (example: `https://steamcommunity.com/id/yourname` or `https://steamcommunity.com/profiles/7656119...`)

### Achievements
Achievement stats are pulled automatically from your **current** game while you are playing.
---
```

### steam/package.json

```json
{
	"name": "lumia-example-steam",
	"version": "1.0.1",
	"private": true,
	"description": "Example Lumia Stream plugin that pulls Steam data from the Steam Web API.",
	"main": "main.js",
	"scripts": {},
	"dependencies": {
		"@lumiastream/plugin": "^0.4.1"
	}
}
```

### steam/translations.json

```json
{
	"en": {
		"steamid": "SteamID64.",
		"persona_username": "Username (Steam persona name).",
		"online_status": "Online status (Online or Offline).",
		"last_logoff": "Last logoff Unix timestamp.",
		"profile_url": "Profile URL.",
		"avatar": "Avatar URL.",
		"current_game_name": "Current in-game name (if playing).",
		"current_game_appid": "Current in-game app ID (if playing).",
		"current_game_graphics_url": "Current game's Steam header image URL.",
		"current_game_playtime_minutes": "Total Steam playtime for the current game, in minutes.",
		"game_count": "Owned games count.",
		"current_game_achievement_count": "Total achievements for the current/last played game.",
		"current_game_achievement_unlocked_count": "Unlocked achievements for the current/last played game.",
		"current_game_achievement_name": "Most recently unlocked current-game achievement name.",
		"current_game_achievement_description": "Most recently unlocked current-game achievement description."
	}
}
```
