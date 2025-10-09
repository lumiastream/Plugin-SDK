const { Plugin } = require("@lumiastream/plugin");
const axios = require("axios");
const Color = require("color");
const { DateTime } = require("luxon");
const {
	uniqueNamesGenerator,
	adjectives,
	colors,
	animals,
} = require("unique-names-generator");

const GEO_BASE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_BASE_URL = "https://api.open-meteo.com/v1/forecast";

class CosmicWeather extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._pollHandle = null;
		this._lastWeatherType = null; // Track previous weather type for change detection
	}

	async onload() {
		await this.lumia.addLog("[CosmicWeather] Initializing neon satellites…");
		const currentCity = this.settings.city || "Neo Tokyo";
		const currentState = this.settings.state || "";
		await this._broadcastForecast(
			currentCity,
			currentState,
			this.settings.units
		);

		if (Number(this.settings.autoInterval) > 0) {
			this._scheduleAutoForecast();
		}

		await this.lumia.addLog("[CosmicWeather] Online and glowing.");
	}

	async onunload() {
		this._clearAutoForecast();
		await this.lumia.addLog("[CosmicWeather] Going dark.");
	}

	async onsettingsupdate(settings, previousSettings) {
		const cityChanged = settings.city !== previousSettings?.city;
		const stateChanged = settings.state !== previousSettings?.state;
		const unitsChanged = settings.units !== previousSettings?.units;
		const scheduleChanged =
			settings.autoInterval !== previousSettings?.autoInterval;

		if (scheduleChanged) {
			if (Number(settings.autoInterval) > 0) {
				this._scheduleAutoForecast();
			} else {
				this._clearAutoForecast();
			}
		}

		if (cityChanged || stateChanged || unitsChanged) {
			await this._broadcastForecast(
				settings.city,
				settings.state,
				settings.units
			);
		}
	}

	async actions(config = {}) {
		const actionList = Array.isArray(config.actions) ? config.actions : [];

		if (!actionList.length) {
			return;
		}

		for (const action of actionList) {
			if (action?.type === "triggerForecast") {
				const city = action.value?.city || this.settings.city;
				const state =
					action.value?.state !== undefined
						? action.value.state
						: this.settings.state;
				await this._broadcastForecast(city, state, this.settings.units);
			}
		}
	}

	async validateAuth() {
		const city = (this.settings.city || "").trim();
		const state = (this.settings.state || "").trim();

		if (!city) {
			await this.lumia.addLog(
				"[CosmicWeather] Validation failed: City setting is required to resolve a forecast."
			);
			return false;
		}

		try {
			await this._resolveLocation(city, state);
			return true;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			await this.lumia.addLog(
				`[CosmicWeather] Validation failed: ${message}`
			);
			return false;
		}
	}

	_scheduleAutoForecast() {
		const intervalMinutes = Number(this.settings.autoInterval);

		if (!Number.isFinite(intervalMinutes) || intervalMinutes <= 0) {
			this._clearAutoForecast();
			return;
		}

		this._clearAutoForecast();
		this._pollHandle = setInterval(() => {
			void this._broadcastForecast(
				this.settings.city,
				this.settings.state,
				this.settings.units
			);
		}, intervalMinutes * 60 * 1000);
	}

	_clearAutoForecast() {
		if (this._pollHandle) {
			clearInterval(this._pollHandle);
			this._pollHandle = null;
		}
	}

	async _broadcastForecast(city = "Neo Tokyo", state = "", units = "metric") {
		try {
			const forecast = await this._createForecast(city, state, units);

			await this.lumia.updateSettings({
				city: forecast.city,
				state: forecast.state,
				lastUpdated: forecast.renderedAt,
				temperature: forecast.displayTemperature,
			});

			await this._updateVariables(forecast);
			await this._triggerAlert(forecast);
			// Toast
			this.lumia.showToast({
				message: `Forecast broadcasted for ${
					forecast.city
				} with ${JSON.stringify(forecast)}`,
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			await this.lumia.addLog(`[CosmicWeather] Forecast failed: ${message}`);
		}
	}

	async _createForecast(city, state, units) {
		const location = await this._resolveLocation(city, state);
		const weather = await this._fetchWeather(location, units);
		const palette = this._buildPalette(weather.temperatureC);
		const vibe = uniqueNamesGenerator({
			dictionaries: [adjectives, colors, animals],
			separator: " ",
			style: "capital",
		});

		const renderedAt = DateTime.utc().toISO();
		const displayTemperature =
			units === "imperial"
				? `${(weather.temperatureC * 9) / 5 + 32}°F`
				: `${weather.temperatureC}°C`;

		const weatherType = this._categorizeWeatherType(weather.weatherCode);

		return {
			city: location.displayName,
			state: location.state,
			country: location.country,
			latitude: location.latitude,
			longitude: location.longitude,
			temperatureC: weather.temperatureC,
			displayTemperature,
			summary: weather.summary,
			weatherCode: weather.weatherCode,
			weatherType,
			trend: vibe,
			palette,
			renderedAt,
		};
	}

	async _resolveLocation(city, state) {
		const trimmedCity = (city || "").trim();
		const trimmedState = (state || "").trim();

		if (!trimmedCity) {
			throw new Error("City is required to fetch a forecast");
		}

		const fetchLocations = async (query, limit = 5) => {
			const response = await axios.get(GEO_BASE_URL, {
				params: {
					name: query,
					count: limit,
					language: "en",
					format: "json",
				},
			});
			return Array.isArray(response.data?.results) ? response.data.results : [];
		};

		const normalize = (value) =>
			typeof value === "string"
				? value.toLowerCase().replace(/\./g, "").trim()
				: "";

		let results = await fetchLocations(trimmedCity, trimmedState ? 10 : 5);
		if (!results.length && trimmedState) {
			results = await fetchLocations(`${trimmedCity} ${trimmedState}`, 10);
		}

		if (!results.length) {
			const target = trimmedState
				? `${trimmedCity}, ${trimmedState}`
				: trimmedCity;
			throw new Error(`Unable to locate coordinates for ${target}`);
		}

		let selection = results[0];

		if (trimmedState) {
			const normalizedState = normalize(trimmedState);
			const exactMatch = results.find(
				(location) => normalize(location.admin1) === normalizedState
			);
			const partialMatch = results.find((location) =>
				normalize(location.admin1)?.includes(normalizedState)
			);
			selection = exactMatch || partialMatch || selection;
		}

		const stateName = selection.admin1 || "";
		const countryName = selection.country || selection.country_code || "";
		return {
			name: selection.name,
			displayName:
				trimmedState && stateName
					? `${selection.name}, ${stateName}`
					: selection.name,
			state: stateName,
			country: countryName,
			latitude: selection.latitude,
			longitude: selection.longitude,
		};
	}

	async _fetchWeather(location, units) {
		const params = {
			latitude: location.latitude,
			longitude: location.longitude,
			current_weather: true,
			timezone: "UTC",
		};

		const response = await axios.get(WEATHER_BASE_URL, { params });
		const current = response.data?.current_weather;

		if (!current) {
			throw new Error("Weather payload missing current conditions");
		}

		const temperatureC = Math.round(current.temperature);
		const weatherCode = current.weathercode;
		const summary = this._describeConditions(weatherCode);

		return {
			temperatureC,
			summary,
			weatherCode,
		};
	}

	_describeConditions(code) {
		const lookup = {
			0: "crystal-clear neon skies",
			1: "dreamy synth clouds",
			2: "lo-fi drifting fog",
			3: "electric overcast",
			45: "holographic haze",
			51: "pixel drizzle",
			61: "analog rain showers",
			71: "laser snowfall",
			80: "glitchy downpour",
			95: "thunderous bass storms",
		};
		return lookup[code] || "mysterious cosmic weather";
	}

	_categorizeWeatherType(code) {
		// Categorize weather codes into types for significant change detection
		if (code === 0 || code === 1) return "clear";
		if (code === 2 || code === 3) return "cloudy";
		if (code === 45) return "foggy";
		if (code === 51 || code === 61 || code === 80) return "rainy";
		if (code === 71) return "snowy";
		if (code === 95) return "stormy";
		return "unknown";
	}

	_buildPalette(tempC) {
		const base = tempC > 25 ? Color("#ff2e92") : Color("#00f0ff");
		const accent = base.rotate(tempC > 25 ? 45 : -45).lighten(0.2);
		const shadow = base.darken(0.4);

		return {
			base: base.hex(),
			accent: accent.hex(),
			shadow: shadow.hex(),
		};
	}

	async _updateVariables(forecast) {
		await this.lumia.setVariable("city", forecast.city);
		await this.lumia.setVariable("temperature", forecast.displayTemperature);
		await this.lumia.setVariable("trend", forecast.trend);
	}

	async _triggerAlert(forecast) {
		// Only trigger alert if weather type has significantly changed
		const currentWeatherType = forecast.weatherType;
		const hasChanged = this._lastWeatherType !== currentWeatherType;

		if (hasChanged) {
			const previousType = this._lastWeatherType || "none";

			await this.lumia.triggerAlert({
				alert: "cosmic-weather-forecast",
				dynamic: {
					city: forecast.city,
					temperature: forecast.displayTemperature,
					summary: forecast.summary,
					trend: forecast.trend,
					palette: forecast.palette,
					timestamp: forecast.renderedAt,
					weatherType: currentWeatherType,
					previousWeatherType: previousType,
				},
			});

			await this.lumia.addLog(
				`[CosmicWeather] Weather changed: ${previousType} → ${currentWeatherType}`
			);

			// Update the last weather type after triggering
			this._lastWeatherType = currentWeatherType;
		} else {
			await this.lumia.addLog(
				`[CosmicWeather] Weather type unchanged (${currentWeatherType}), skipping alert`
			);
		}
	}
}

module.exports = CosmicWeather;
