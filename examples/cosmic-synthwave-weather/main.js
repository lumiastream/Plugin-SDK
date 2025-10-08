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

class CosmicSynthwaveWeather extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._pollHandle = null;
	}

	async onload() {
		await this.lumia.addLog("[CosmicWeather] Initializing neon satellites…");
		const currentCity = this.settings.city || "Neo Tokyo";
		await this._broadcastForecast(currentCity, this.settings.units);

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

		if (cityChanged || unitsChanged) {
			await this._broadcastForecast(settings.city, settings.units);
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
				await this._broadcastForecast(city, this.settings.units);
			}
		}
	}

	async validateAuth() {
		// Open-Meteo endpoints used here do not require keys, so validation always succeeds.
		return true;
	}

	_scheduleAutoForecast() {
		const intervalMinutes = Number(this.settings.autoInterval);

		if (!Number.isFinite(intervalMinutes) || intervalMinutes <= 0) {
			this._clearAutoForecast();
			return;
		}

		this._clearAutoForecast();
		this._pollHandle = setInterval(() => {
			void this._broadcastForecast(this.settings.city, this.settings.units);
		}, intervalMinutes * 60 * 1000);
	}

	_clearAutoForecast() {
		if (this._pollHandle) {
			clearInterval(this._pollHandle);
			this._pollHandle = null;
		}
	}

	async _broadcastForecast(city = "Neo Tokyo", units = "metric") {
		try {
			const forecast = await this._createForecast(city, units);

			await this.lumia.updateSettings({
				city: forecast.city,
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

	async _createForecast(city, units) {
		const location = await this._resolveLocation(city);
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

		return {
			city: location.name,
			latitude: location.latitude,
			longitude: location.longitude,
			temperatureC: weather.temperatureC,
			displayTemperature,
			summary: weather.summary,
			trend: vibe,
			palette,
			renderedAt,
		};
	}

	async _resolveLocation(city) {
		const response = await axios.get(GEO_BASE_URL, {
			params: {
				name: city,
				count: 1,
				language: "en",
				format: "json",
			},
		});

		const result = response.data?.results?.[0];
		if (!result) {
			throw new Error(`Unable to locate coordinates for ${city}`);
		}

		return {
			name: result.name,
			latitude: result.latitude,
			longitude: result.longitude,
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
		const summary = this._describeConditions(current.weathercode);

		return {
			temperatureC,
			summary,
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
		await this.lumia.triggerAlert({
			alert: "cosmic-synthwave-weather-forecast",
			dynamic: {
				city: forecast.city,
				temperature: forecast.displayTemperature,
				summary: forecast.summary,
				trend: forecast.trend,
				palette: forecast.palette,
				timestamp: forecast.renderedAt,
			},
		});
	}
}

module.exports = CosmicSynthwaveWeather;
