const { Plugin } = require("@lumiastream/plugin");

const FITBIT_API_BASE = "https://api.fitbit.com/1";
const INTRADAY_DETAIL_LEVEL = "1min";
const HEART_RATE_DETAIL_LEVEL = "1min";
const ACTIVE_GAP_MINUTES = 2;
const ACTIVE_LOOKBACK_MINUTES = 5;
const SECONDARY_FETCH_MINUTES = 5;
const HEART_RATE_THRESHOLD_FALLBACK = 95;
const HEART_RATE_THRESHOLD_DELTA = 15;
const DEFAULTS = {
	pollInterval: 60,
};

const VARIABLE_NAMES = {
	date: "fitbit_date",
	steps: "fitbit_steps",
	distance: "fitbit_distance",
	calories: "fitbit_calories",
	restingHeartRate: "fitbit_resting_heart_rate",
	durationSecs: "fitbit_activity_duration_secs",
	durationMin: "fitbit_activity_duration_min",
	cadence: "fitbit_cadence",
	pace: "fitbit_pace",
	paceSource: "fitbit_pace_source",
	latestActivityName: "fitbit_latest_activity_name",
	latestActivityStart: "fitbit_latest_activity_start",
	lastUpdated: "fitbit_last_updated",
};

class FitbitPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._pollTimer = null;
		this._lastConnectionState = null;
		this._dataRefreshPromise = null;
		this._tokenRefreshPromise = null;
		this._lastVariables = new Map();
		this._intradayCache = {
			date: null,
			steps: null,
			distance: null,
			calories: null,
			heart: null,
		};
		this._lastSecondaryFetchAt = 0;
	}

	async onload() {
		await this._primeVariables();

		if (!this._hasAuthTokens()) {
			await this._log(
				"Fitbit access tokens not set. Use the OAuth button in the plugin settings to authorize.",
				"warn",
			);
			await this._updateConnectionState(false);
			return;
		}

		await this._refreshMetrics({ reason: "startup" });
		this._schedulePolling();
	}

	async onunload() {
		this._clearPolling();
		await this._updateConnectionState(false);
	}

	async onsettingsupdate(settings, previous = {}) {
		const authChanged =
			(settings?.accessToken ?? "") !== (previous?.accessToken ?? "") ||
			(settings?.refreshToken ?? "") !== (previous?.refreshToken ?? "");

		const pollChanged =
			this._coerceNumber(settings?.pollInterval, DEFAULTS.pollInterval) !==
			this._coerceNumber(previous?.pollInterval, DEFAULTS.pollInterval);

		if (pollChanged || authChanged) {
			this._schedulePolling();
		}

		if (authChanged) {
			if (!this._hasAuthTokens()) {
				await this._updateConnectionState(false);
				return;
			}
		}

		if (authChanged) {
			await this._refreshMetrics({ reason: "settings-update" });
		}
	}

	async actions(config = {}) {
		const actions = Array.isArray(config.actions) ? config.actions : [];
		if (!actions.length) {
			return;
		}

		for (const action of actions) {
			try {
				switch (action?.type) {
					case "fitbit_refresh":
						await this._refreshMetrics({ reason: "manual-action" });
						break;
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				await this._log(
					`Action ${action?.type ?? "unknown"} failed: ${message}`,
					"error",
				);
			}
		}
	}

	async validateAuth() {
		if (!this._hasAuthTokens()) {
			await this._log("Validation failed: missing Fitbit tokens.", "warn");
			return false;
		}

		try {
			const today = this._formatDate(new Date());
			await Promise.all([
				this._fetchIntradayResource("steps", today),
				this._fetchHeartRateIntraday(today),
			]);
			return true;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			await this._log(`Fitbit validation failed: ${message}`, "error");
			return false;
		}
	}

	async _refreshMetrics({ reason } = {}) {
		if (!this._hasAuthTokens()) {
			await this._updateConnectionState(false);
			return;
		}

		if (this._dataRefreshPromise) {
			return this._dataRefreshPromise;
		}

		this._dataRefreshPromise = (async () => {
			try {
				const token = await this._ensureAccessToken();
				const date = this._formatDate(new Date());
				this._ensureIntradayDate(date);

				const [steps, heart] = await Promise.all([
					this._fetchIntradayResource("steps", date, token).catch(
						async (error) => {
							await this._log(
								`Steps data unavailable: ${this._errorMessage(error)}`,
								"warn",
							);
							return null;
						},
					),
					this._fetchHeartRateIntraday(date, token).catch(async (error) => {
						await this._log(
							`Heart rate data unavailable: ${this._errorMessage(error)}`,
							"warn",
						);
						return null;
					}),
				]);

				if (steps) {
					this._intradayCache.steps = steps;
				}
				if (heart) {
					this._intradayCache.heart = heart;
				}

				const activityState = this._detectActivity({
					steps: this._intradayCache.steps,
					heart: this._intradayCache.heart,
				});

				const shouldFetchSecondary =
					activityState.isActive &&
					(this._lastSecondaryFetchAt === 0 ||
						Date.now() - this._lastSecondaryFetchAt >=
							SECONDARY_FETCH_MINUTES * 60000);

				if (shouldFetchSecondary) {
					const [distance, calories] = await Promise.all([
						this._fetchIntradayResource("distance", date, token).catch(
							async (error) => {
								await this._log(
									`Distance data unavailable: ${this._errorMessage(error)}`,
									"warn",
								);
								return null;
							},
						),
						this._fetchIntradayResource("calories", date, token).catch(
							async (error) => {
								await this._log(
									`Calories data unavailable: ${this._errorMessage(error)}`,
									"warn",
								);
								return null;
							},
						),
					]);

					if (distance) {
						this._intradayCache.distance = distance;
					}
					if (calories) {
						this._intradayCache.calories = calories;
					}
					this._lastSecondaryFetchAt = Date.now();
				} else if (!activityState.isActive) {
					this._lastSecondaryFetchAt = 0;
				}

				const metrics = this._deriveActiveMetrics({
					date,
					steps: this._intradayCache.steps,
					distance: this._intradayCache.distance,
					calories: this._intradayCache.calories,
					heart: this._intradayCache.heart,
					activityState,
				});

				await this._applyMetrics(metrics);
				await this._updateConnectionState(true);
			} catch (error) {
				const message = this._errorMessage(error);
				await this._log(`Failed to refresh Fitbit data: ${message}`, "warn");
				await this._updateConnectionState(false);
			} finally {
				this._dataRefreshPromise = null;
			}
		})();

		return this._dataRefreshPromise;
	}

	async _applyMetrics(metrics) {
		const resolvedDate = metrics?.date ?? "";
		const steps = this._coerceNumber(metrics?.steps, 0);
		const distance = this._coerceNumber(metrics?.distance, 0);
		const calories = this._coerceNumber(metrics?.calories, 0);
		const durationSecs = this._coerceNumber(metrics?.durationSecs, 0);
		const durationMin = this._coerceNumber(metrics?.durationMin, 0);
		const cadence = this._coerceNumber(metrics?.cadence, 0);
		const pace = this._coerceNumber(metrics?.pace, 0);
		const paceSource = this._coerceString(metrics?.paceSource, "none");
		const resolvedHeartRate = this._coerceNumber(metrics?.heartRate, 0);
		const latestName = this._coerceString(metrics?.activityName, "");
		const latestStart = this._coerceString(metrics?.activityStart, "");

		const updates = [
			{ name: VARIABLE_NAMES.date, value: resolvedDate },
			{ name: VARIABLE_NAMES.steps, value: steps },
			{ name: VARIABLE_NAMES.distance, value: distance },
			{ name: VARIABLE_NAMES.calories, value: calories },
			{ name: VARIABLE_NAMES.restingHeartRate, value: resolvedHeartRate },
			{ name: VARIABLE_NAMES.durationSecs, value: durationSecs },
			{ name: VARIABLE_NAMES.durationMin, value: durationMin },
			{ name: VARIABLE_NAMES.cadence, value: cadence },
			{ name: VARIABLE_NAMES.pace, value: pace },
			{ name: VARIABLE_NAMES.paceSource, value: paceSource },
			{ name: VARIABLE_NAMES.latestActivityName, value: latestName },
			{ name: VARIABLE_NAMES.latestActivityStart, value: latestStart },
		];

		let anyChanged = false;
		await Promise.all(
			updates.map(({ name, value }) =>
				this._setVariableIfChanged(name, value).then((changed) => {
					if (changed) {
						anyChanged = true;
					}
				}),
			),
		);

		if (anyChanged) {
			await this._setVariableIfChanged(
				VARIABLE_NAMES.lastUpdated,
				new Date().toISOString(),
			);
		}
	}

	_deriveActiveMetrics({
		date,
		steps,
		distance,
		calories,
		heart,
		activityState,
	}) {
		const stepsData = this._extractIntradaySeries(steps, "steps");
		const distanceData = this._extractIntradaySeries(distance, "distance");
		const caloriesData = this._extractIntradaySeries(calories, "calories");
		const heartSummary = this._extractHeartSummary(heart);
		const heartIntraday = this._extractHeartIntraday(heart);
		const heartThreshold =
			activityState?.heartThreshold ??
			this._heartRateThreshold(heartSummary.restingHeartRate);
		const latestHeartRate = this._selectHeartRate({
			dataset: heartIntraday.dataset,
			endMinute: null,
		});

		const stepsWindow = this._calculateActiveWindow({
			steps: stepsData.dataset,
			distance: distanceData.dataset,
			calories: caloriesData.dataset,
		});
		const heartWindow = this._calculateHeartActiveWindow(
			heartIntraday.dataset,
			heartThreshold,
		);
		const activeWindow = this._selectActiveWindow(stepsWindow, heartWindow);

		if (activeWindow.activeMinutes <= 0) {
			return this._inactiveMetrics(date, { heartRate: latestHeartRate });
		}

		const totals = this._sumWindowTotals(
			activeWindow,
			stepsData.dataset,
			distanceData.dataset,
			caloriesData.dataset,
		);

		const durationMin = activeWindow.activeMinutes;
		const durationSecs = durationMin * 60;

		const pace =
			totals.distance > 0 && durationMin > 0
				? durationMin / totals.distance
				: 0;
		const paceSource = totals.distance > 0 ? "computed" : "none";
		const cadence =
			durationMin > 0
				? Math.round((totals.steps / durationMin) * 100) / 100
				: 0;

		const heartRate = this._selectHeartRate({
			dataset: heartIntraday.dataset,
			endMinute: activeWindow.endMinute,
		});

		const activityStart =
			activeWindow.startMinute !== null
				? this._formatDateTime(date, activeWindow.startMinute)
				: "";
		const activityName = activeWindow.activeMinutes > 0 ? "Active session" : "";

		return {
			date,
			steps: totals.steps,
			distance: totals.distance,
			calories: totals.calories,
			durationSecs,
			durationMin,
			cadence,
			pace,
			paceSource,
			heartRate,
			activityName,
			activityStart,
		};
	}

	_inactiveMetrics(date, { heartRate = 0 } = {}) {
		return {
			date,
			steps: 0,
			distance: 0,
			calories: 0,
			durationSecs: 0,
			durationMin: 0,
			cadence: 0,
			pace: 0,
			paceSource: "none",
			heartRate,
			activityName: "",
			activityStart: "",
		};
	}

	_extractIntradaySeries(response, resource) {
		if (!response) {
			return { summary: 0, dataset: [] };
		}
		const summaryKey = `activities-${resource}`;
		const intradayKey = `activities-${resource}-intraday`;
		const summaryEntry = Array.isArray(response?.[summaryKey])
			? response[summaryKey][0]
			: null;
		const summaryValue = this._coerceNumber(summaryEntry?.value, 0);
		const dataset = Array.isArray(response?.[intradayKey]?.dataset)
			? response[intradayKey].dataset
			: [];

		return { summary: summaryValue, dataset };
	}

	_extractHeartSummary(response) {
		const day = Array.isArray(response?.["activities-heart"])
			? response["activities-heart"][0]
			: null;
		const value = day?.value ?? {};
		return {
			restingHeartRate:
				this._coerceNumber(value?.restingHeartRate, null) ?? null,
			heartRateZones: Array.isArray(value?.heartRateZones)
				? value.heartRateZones
				: [],
		};
	}

	_extractHeartIntraday(response) {
		const intraday = response?.["activities-heart-intraday"];
		const dataset = Array.isArray(intraday?.dataset) ? intraday.dataset : [];
		return { dataset };
	}

	_calculateActiveWindow({ steps, distance, calories }) {
		const stepsMap = this._datasetToMinuteMap(steps);
		const distanceMap = this._datasetToMinuteMap(distance);
		const caloriesMap = this._datasetToMinuteMap(calories);
		return this._calculateActiveWindowFromMaps(
			stepsMap,
			distanceMap,
			caloriesMap,
		);
	}

	_calculateHeartActiveWindow(dataset, threshold) {
		if (!Array.isArray(dataset) || dataset.length === 0) {
			return { startMinute: null, endMinute: null, activeMinutes: 0 };
		}
		const heartMap = new Map();
		for (const entry of dataset) {
			const minute = this._timeToMinute(entry?.time);
			if (minute === null) {
				continue;
			}
			const value = this._coerceNumber(entry?.value, 0);
			if (value >= threshold) {
				heartMap.set(minute, value);
			}
		}

		return this._calculateActiveWindowFromMaps(heartMap);
	}

	_calculateActiveWindowFromMaps(...maps) {
		const lastMinute = this._findLastActiveMinute(...maps);
		if (lastMinute === null) {
			return {
				startMinute: null,
				endMinute: null,
				activeMinutes: 0,
			};
		}

		let startMinute = lastMinute;
		let gap = 0;
		for (let minute = lastMinute; minute >= 0; minute -= 1) {
			if (this._isActiveMinute(minute, ...maps)) {
				startMinute = minute;
				gap = 0;
			} else {
				gap += 1;
				if (gap > ACTIVE_GAP_MINUTES) {
					break;
				}
			}
		}

		const activeMinutes = this._countActiveMinutes(
			startMinute,
			lastMinute,
			...maps,
		);

		return {
			startMinute,
			endMinute: lastMinute,
			activeMinutes,
		};
	}

	_findLastActiveMinute(...maps) {
		const minutes = [];
		for (const map of maps) {
			if (map && map.size) {
				for (const key of map.keys()) {
					minutes.push(Number(key));
				}
			}
		}
		const lastMinute = Math.max(...minutes);
		if (!Number.isFinite(lastMinute)) {
			return null;
		}
		for (let minute = lastMinute; minute >= 0; minute -= 1) {
			if (this._isActiveMinute(minute, ...maps)) {
				return minute;
			}
		}
		return null;
	}

	_selectActiveWindow(stepsWindow, heartWindow) {
		if (heartWindow.activeMinutes > stepsWindow.activeMinutes) {
			return heartWindow;
		}
		return stepsWindow;
	}

	_countActiveMinutes(startMinute, endMinute, ...maps) {
		if (startMinute === null || endMinute === null) {
			return 0;
		}
		let count = 0;
		for (let minute = startMinute; minute <= endMinute; minute += 1) {
			if (this._isActiveMinute(minute, ...maps)) {
				count += 1;
			}
		}
		return count;
	}

	_sumWindowTotals(activeWindow, steps, distance, calories) {
		if (activeWindow.startMinute === null || activeWindow.endMinute === null) {
			return { steps: 0, distance: 0, calories: 0 };
		}

		const stepsMap = this._datasetToMinuteMap(steps);
		const distanceMap = this._datasetToMinuteMap(distance);
		const caloriesMap = this._datasetToMinuteMap(calories);

		let stepsTotal = 0;
		let distanceTotal = 0;
		let caloriesTotal = 0;
		for (
			let minute = activeWindow.startMinute;
			minute <= activeWindow.endMinute;
			minute += 1
		) {
			stepsTotal += stepsMap.get(minute) ?? 0;
			distanceTotal += distanceMap.get(minute) ?? 0;
			caloriesTotal += caloriesMap.get(minute) ?? 0;
		}

		return {
			steps: Math.round(stepsTotal),
			distance: Math.round(distanceTotal * 1000) / 1000,
			calories: Math.round(caloriesTotal),
		};
	}

	_selectHeartRate({ dataset, endMinute }) {
		if (!Array.isArray(dataset) || dataset.length === 0) {
			return 0;
		}

		let candidate = null;
		for (const entry of dataset) {
			const minute = this._timeToMinute(entry?.time);
			if (minute === null) {
				continue;
			}
			if (endMinute !== null && minute > endMinute) {
				continue;
			}
			const value = this._coerceNumber(entry?.value, 0);
			if (value > 0) {
				candidate = value;
			}
		}

		if (candidate !== null) {
			return candidate;
		}

		const lastEntry = dataset[dataset.length - 1];
		return this._coerceNumber(lastEntry?.value, 0);
	}

	_isActiveMinute(minute, ...maps) {
		for (const map of maps) {
			if (!map) {
				continue;
			}
			if ((map.get(minute) ?? 0) > 0) {
				return true;
			}
		}
		return false;
	}

	_detectActivity({ steps, heart }) {
		const stepsData = this._extractIntradaySeries(steps, "steps");
		const heartSummary = this._extractHeartSummary(heart);
		const heartIntraday = this._extractHeartIntraday(heart);
		const heartThreshold = this._heartRateThreshold(
			heartSummary.restingHeartRate,
		);

		const hasStepActivity = this._hasRecentActivity(
			stepsData.dataset,
			ACTIVE_LOOKBACK_MINUTES,
			(entry) => this._coerceNumber(entry?.value, 0) > 0,
		);
		const hasHeartActivity = this._hasRecentActivity(
			heartIntraday.dataset,
			ACTIVE_LOOKBACK_MINUTES,
			(entry) => this._coerceNumber(entry?.value, 0) >= heartThreshold,
		);

		return {
			isActive: hasStepActivity || hasHeartActivity,
			hasStepActivity,
			hasHeartActivity,
			heartThreshold,
		};
	}

	_hasRecentActivity(dataset, lookbackMinutes, predicate) {
		if (!Array.isArray(dataset) || dataset.length === 0) {
			return false;
		}

		let lastMinute = null;
		for (const entry of dataset) {
			const minute = this._timeToMinute(entry?.time);
			if (minute === null) {
				continue;
			}
			lastMinute = minute;
		}
		if (lastMinute === null) {
			return false;
		}

		const cutoff = Math.max(0, lastMinute - lookbackMinutes);
		for (const entry of dataset) {
			const minute = this._timeToMinute(entry?.time);
			if (minute === null || minute < cutoff) {
				continue;
			}
			if (predicate(entry)) {
				return true;
			}
		}

		return false;
	}

	_heartRateThreshold(restingHeartRate) {
		const resting = this._coerceNumber(restingHeartRate, 0);
		if (resting > 0) {
			return Math.max(resting + HEART_RATE_THRESHOLD_DELTA, 80);
		}
		return HEART_RATE_THRESHOLD_FALLBACK;
	}

	_ensureIntradayDate(date) {
		if (this._intradayCache.date === date) {
			return;
		}

		this._intradayCache = {
			date,
			steps: null,
			distance: null,
			calories: null,
			heart: null,
		};
		this._lastSecondaryFetchAt = 0;
	}

	_datasetToMinuteMap(dataset) {
		const map = new Map();
		if (!Array.isArray(dataset)) {
			return map;
		}
		for (const entry of dataset) {
			const minute = this._timeToMinute(entry?.time);
			if (minute === null) {
				continue;
			}
			map.set(minute, this._coerceNumber(entry?.value, 0));
		}
		return map;
	}

	_timeToMinute(time) {
		if (!time || typeof time !== "string") {
			return null;
		}
		const [hours, minutes] = time.split(":").map(Number);
		if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
			return null;
		}
		return hours * 60 + minutes;
	}

	_formatDateTime(date, minuteOfDay) {
		if (!date || minuteOfDay === null || minuteOfDay === undefined) {
			return "";
		}
		const hours = Math.floor(minuteOfDay / 60);
		const minutes = minuteOfDay % 60;
		const hourLabel = String(hours).padStart(2, "0");
		const minuteLabel = String(minutes).padStart(2, "0");
		return `${date}T${hourLabel}:${minuteLabel}:00`;
	}

	async _fetchHeartRateIntraday(date, tokenOverride) {
		return this._fetchJson(
			`/user/-/activities/heart/date/${date}/1d/${HEART_RATE_DETAIL_LEVEL}.json`,
			{ tokenOverride },
		);
	}

	async _fetchIntradayResource(resource, date, tokenOverride) {
		return this._fetchJson(
			`/user/-/activities/${resource}/date/${date}/1d/${INTRADAY_DETAIL_LEVEL}.json`,
			{ tokenOverride },
		);
	}

	async _fetchJson(path, { tokenOverride, query } = {}) {
		const initialToken = tokenOverride ?? (await this._ensureAccessToken());
		const response = await this._request(path, initialToken, query);

		if (response.status === 401 && this._canRefreshTokens()) {
			const refreshed = await this._refreshAccessToken();
			const retry = await this._request(path, refreshed, query);
			return this._readResponse(retry, path);
		}

		return this._readResponse(response, path);
	}

	async _request(path, token, query) {
		const url = new URL(`${FITBIT_API_BASE}${path}`);
		if (query) {
			for (const [key, value] of Object.entries(query)) {
				if (value === undefined || value === null || value === "") {
					continue;
				}
				url.searchParams.set(key, String(value));
			}
		}

		return fetch(url.toString(), {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/json",
			},
		});
	}

	async _readResponse(response, path) {
		if (!response.ok) {
			const body = await response.text();
			throw new Error(
				`Fitbit API error (${response.status}) on ${path}: ${body || "No response body"}`,
			);
		}

		return response.json();
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

			const payload = await this.lumia.refreshOAuthToken({
				refreshToken,
				applicationId: 1,
			});
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
			throw new Error("Missing Fitbit access credentials.");
		}

		const expiresAt = this._tokenExpiresAt();
		const now = Date.now();
		if (accessToken && !expiresAt) {
			return accessToken;
		}

		if (accessToken && expiresAt && now < expiresAt - 60000) {
			return accessToken;
		}

		if (!this._canRefreshTokens()) {
			return accessToken;
		}

		if (!refreshToken) {
			return accessToken;
		}

		return this._refreshAccessToken();
	}

	_schedulePolling() {
		this._clearPolling();

		const intervalSeconds = this._pollInterval();
		if (!this._hasAuthTokens() || intervalSeconds <= 0) {
			return;
		}

		this._pollTimer = setInterval(() => {
			void this._refreshMetrics({ reason: "poll" });
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
				const message = this._errorMessage(error);
				await this._log(
					`Failed to update connection state: ${message}`,
					"warn",
				);
			}
		}
	}

	async _primeVariables() {
		await Promise.all([
			this._setVariableIfChanged(VARIABLE_NAMES.date, ""),
			this._setVariableIfChanged(VARIABLE_NAMES.steps, 0),
			this._setVariableIfChanged(VARIABLE_NAMES.distance, 0),
			this._setVariableIfChanged(VARIABLE_NAMES.calories, 0),
			this._setVariableIfChanged(VARIABLE_NAMES.restingHeartRate, 0),
			this._setVariableIfChanged(VARIABLE_NAMES.durationSecs, 0),
			this._setVariableIfChanged(VARIABLE_NAMES.durationMin, 0),
			this._setVariableIfChanged(VARIABLE_NAMES.cadence, 0),
			this._setVariableIfChanged(VARIABLE_NAMES.pace, 0),
			this._setVariableIfChanged(VARIABLE_NAMES.paceSource, ""),
			this._setVariableIfChanged(VARIABLE_NAMES.latestActivityName, ""),
			this._setVariableIfChanged(VARIABLE_NAMES.latestActivityStart, ""),
			this._setVariableIfChanged(VARIABLE_NAMES.lastUpdated, ""),
		]);
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

	async _log(message, severity = "info") {
		if (typeof this.lumia.addLog !== "function") {
			return;
		}
		if (severity !== "warn" && severity !== "error") {
			return;
		}

		await this.lumia.addLog(`[Fitbit] ${message}`, severity);
	}

	_errorMessage(error) {
		return error instanceof Error ? error.message : String(error);
	}

	_accessToken() {
		return this._coerceString(this.settings?.accessToken, "");
	}

	_refreshToken() {
		return this._coerceString(this.settings?.refreshToken, "");
	}

	_tokenExpiresAt() {
		return this._coerceNumber(this.settings?.tokenExpiresAt, 0);
	}

	_pollInterval() {
		return this._coerceNumber(
			this.settings?.pollInterval,
			DEFAULTS.pollInterval,
		);
	}

	_canRefreshTokens() {
		return Boolean(
			this._refreshToken() &&
			typeof this.lumia?.refreshOAuthToken === "function",
		);
	}

	_hasAuthTokens() {
		return Boolean(this._accessToken() || this._refreshToken());
	}

	_formatDate(date) {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	}

	_coerceNumber(value, fallback = 0) {
		if (typeof value === "number" && Number.isFinite(value)) {
			return value;
		}
		if (typeof value === "string" && value.trim().length) {
			const parsed = Number(value);
			return Number.isFinite(parsed) ? parsed : fallback;
		}
		return fallback;
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

	_normalizeValue(value) {
		if (typeof value === "number") {
			return Number.isFinite(value) ? value : 0;
		}
		if (typeof value === "string") {
			return value;
		}
		if (value === null || value === undefined) {
			return "";
		}
		if (typeof value === "object") {
			return JSON.stringify(value);
		}
		return String(value);
	}

	_valuesEqual(a, b) {
		if (typeof a === "number" && typeof b === "number") {
			if (Number.isNaN(a) && Number.isNaN(b)) {
				return true;
			}
		}
		return a === b;
	}
}

module.exports = FitbitPlugin;
