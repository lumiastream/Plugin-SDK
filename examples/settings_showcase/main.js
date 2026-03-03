const { Plugin } = require("@lumiastream/plugin");

const VARIABLE_NAMES = {
	saveCount: "save_count",
	lastSavedAt: "last_saved_at",
	lastSavedValuesJson: "last_saved_values_json",
};
const ACTION_VARIABLE_NAMES = {
	actionMessage: "settings_showcase_action_message",
	actionStatus: "settings_showcase_action_status",
	actionSaveCount: "settings_showcase_action_save_count",
	actionSnapshot: "settings_showcase_action_snapshot",
};

const TEAM_OPTIONS_BY_LEAGUE = Object.freeze({
	nfl: Object.freeze([
		{ label: "Kansas City Chiefs", value: "nfl:kc" },
		{ label: "San Francisco 49ers", value: "nfl:sf" },
		{ label: "Buffalo Bills", value: "nfl:buf" },
		{ label: "Detroit Lions", value: "nfl:det" },
	]),
	nba: Object.freeze([
		{ label: "Boston Celtics", value: "nba:bos" },
		{ label: "Los Angeles Lakers", value: "nba:lal" },
		{ label: "Milwaukee Bucks", value: "nba:mil" },
		{ label: "Denver Nuggets", value: "nba:den" },
	]),
	mlb: Object.freeze([
		{ label: "Los Angeles Dodgers", value: "mlb:lad" },
		{ label: "Atlanta Braves", value: "mlb:atl" },
		{ label: "New York Yankees", value: "mlb:nyy" },
		{ label: "Houston Astros", value: "mlb:hou" },
	]),
	nhl: Object.freeze([
		{ label: "Vegas Golden Knights", value: "nhl:vgk" },
		{ label: "Colorado Avalanche", value: "nhl:col" },
		{ label: "New York Rangers", value: "nhl:nyr" },
		{ label: "Edmonton Oilers", value: "nhl:edm" },
	]),
});

const FIELD_SPECS = [
	{ key: "textField", label: "text", type: "text" },
	{ key: "validatedTextField", label: "validated_text", type: "text" },
	{ key: "numberField", label: "number", type: "number" },
	{ key: "pollIntervalField", label: "poll_interval", type: "number" },
	{ key: "selectField", label: "select", type: "select" },
	{
		key: "selectMultipleField",
		label: "select_multiple",
		type: "select",
		multiple: true,
	},
	{ key: "checkboxField", label: "checkbox", type: "checkbox" },
	{ key: "sliderField", label: "slider", type: "slider" },
	{ key: "disabledInfoField", label: "disabled_info", type: "text" },
	{ key: "hiddenTextField", label: "hidden_text", type: "text" },
	{ key: "groupedTextField", label: "grouped_text", type: "text" },
	{ key: "fileField", label: "file", type: "file" },
	{ key: "passwordField", label: "password", type: "password" },
	{
		key: "oauthAccessToken",
		label: "oauth_access_token",
		type: "password",
	},
	{
		key: "oauthRefreshToken",
		label: "oauth_refresh_token",
		type: "password",
	},
	{
		key: "oauthTokenSecret",
		label: "oauth_token_secret",
		type: "password",
	},
	{ key: "toggleField", label: "toggle", type: "toggle" },
	{ key: "textareaField", label: "textarea", type: "textarea" },
	{ key: "emailField", label: "email", type: "email" },
	{ key: "urlField", label: "url", type: "url" },
	{ key: "datetimeField", label: "datetime", type: "datetime" },
	{ key: "colorField", label: "color", type: "color" },
	{ key: "leagueField", label: "league", type: "select" },
	{
		key: "teamLookupField",
		label: "team_lookup",
		type: "select",
		multiple: true,
	},
	{ key: "jsonField", label: "json", type: "json" },
	{ key: "roiField", label: "roi", type: "roi" },
	{ key: "namedMapField", label: "named_map", type: "named_map" },
];

function asString(value, fallback = "") {
	if (typeof value === "string") {
		return value;
	}
	if (value === undefined || value === null) {
		return fallback;
	}
	return String(value);
}

function asBoolean(value, fallback = false) {
	if (typeof value === "boolean") {
		return value;
	}
	if (typeof value === "number") {
		return value !== 0;
	}
	if (typeof value === "string") {
		const normalized = value.trim().toLowerCase();
		if (["1", "true", "yes", "on", "enabled"].includes(normalized)) {
			return true;
		}
		if (["0", "false", "no", "off", "disabled"].includes(normalized)) {
			return false;
		}
	}
	return fallback;
}

function asNumber(value, fallback = 0) {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === "string" && value.trim().length) {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) {
			return parsed;
		}
	}
	return fallback;
}

function asStringList(value) {
	if (!Array.isArray(value)) {
		return [];
	}
	const cleaned = value
		.map((item) => asString(item).trim())
		.filter((item) => item.length > 0);
	return Array.from(new Set(cleaned));
}

function asJsonValue(value) {
	if (value === undefined) {
		return null;
	}
	if (typeof value === "string") {
		const trimmed = value.trim();
		if (!trimmed.length) {
			return null;
		}
		try {
			return JSON.parse(trimmed);
		} catch {
			return { _invalidJson: trimmed };
		}
	}
	return value;
}

function asRoi(value) {
	const parsed = asJsonValue(value);
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		return null;
	}

	const unitToken = asString(parsed.unit, "ratio").toLowerCase();
	const unit = unitToken === "pixels" || unitToken === "px" ? "pixels" : "ratio";
	const max = unit === "ratio" ? 1 : Number.POSITIVE_INFINITY;
	const clamp = (input) => Math.max(0, Math.min(max, input));

	const x = clamp(asNumber(parsed.x, 0));
	const y = clamp(asNumber(parsed.y, 0));
	const width = clamp(asNumber(parsed.width, unit === "ratio" ? 1 : 500));
	const height = clamp(asNumber(parsed.height, unit === "ratio" ? 1 : 500));
	if (width <= 0 || height <= 0) {
		return null;
	}
	return { x, y, width, height, unit };
}

function asNamedMap(value) {
	const parsed = asJsonValue(value);
	if (!parsed) {
		return [];
	}

	if (Array.isArray(parsed)) {
		return parsed
			.map((entry) => {
				if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
					return null;
				}
				const name = asString(entry.name ?? entry.key, "").trim();
				const rawValue = entry.value ?? entry.path ?? "";
				const mappedValue =
					typeof rawValue === "string"
						? rawValue
						: formatForOutput(asJsonValue(rawValue));
				if (!name && !mappedValue) {
					return null;
				}
				return { name, value: mappedValue };
			})
			.filter(Boolean);
	}

	if (typeof parsed === "object") {
		return Object.entries(parsed).map(([name, rawValue]) => ({
			name: asString(name, "").trim(),
			value:
				typeof rawValue === "string"
					? rawValue
					: formatForOutput(asJsonValue(rawValue)),
		}));
	}

	return [];
}

function normalizeValueByType(type, value, field = {}) {
	switch (type) {
		case "number":
		case "slider":
			return asNumber(value, 0);
		case "checkbox":
		case "toggle":
			return asBoolean(value, false);
		case "select":
			if (field?.multiple) {
				return asStringList(value);
			}
			return asString(value, "");
		case "json":
			return asJsonValue(value);
		case "roi":
			return asRoi(value);
		case "named_map":
			return asNamedMap(value);
		case "password": {
			const raw = asString(value, "");
			if (!raw.length) {
				return "";
			}
			return `***${raw.length} chars***`;
		}
		case "file":
		case "text":
		case "textarea":
		case "email":
		case "url":
		case "color":
		default:
			return asString(value, "");
	}
}

function formatForOutput(value) {
	if (typeof value === "string") {
		return value;
	}
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

function truncate(value, maxLength = 140) {
	const text = asString(value, "");
	if (text.length <= maxLength) {
		return text;
	}
	return `${text.slice(0, maxLength - 3)}...`;
}

class SettingsFieldShowcasePlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._saveCount = 0;
	}

	async onload() {
		await this.lumia.updateConnection(true);
		await this._log("[settings_field_showcase] Loaded.");
		void this.refreshSettingsOptions({ fieldKey: "leagueField" });
		await this._emitAllFieldValues(this.settings, { reason: "load" });
	}

	async onunload() {
		await this.lumia.updateConnection(false);
	}

	async onsettingsupdate(settings, previous = {}) {
		if (this._league(settings) !== this._league(previous)) {
			void this.refreshSettingsOptions({ fieldKey: "leagueField", settings });
		}
		await this._emitAllFieldValues(settings, { reason: "save" });
	}

	async validateAuth() {
		return { ok: true };
	}

	async actions(config = {}) {
		const actions = Array.isArray(config?.actions) ? config.actions : [];
		const newlyPassedVariables = {};
		let shouldStop = false;

		for (const action of actions) {
			if (action?.type !== "passVariablesExample") {
				continue;
			}

			const params =
				action?.value && typeof action.value === "object"
					? action.value
					: {};
			const message =
				asString(
					params?.message,
					"Hello from settings_showcase action",
				).trim() || "Hello from settings_showcase action";
			const includeSnapshot = asBoolean(params?.includeSnapshot, true);
			const stopChain = asBoolean(params?.stopChain, false);

			newlyPassedVariables[ACTION_VARIABLE_NAMES.actionMessage] = message;
			newlyPassedVariables[ACTION_VARIABLE_NAMES.actionStatus] = "ok";
			newlyPassedVariables[ACTION_VARIABLE_NAMES.actionSaveCount] =
				this._saveCount;

			if (includeSnapshot) {
				newlyPassedVariables[ACTION_VARIABLE_NAMES.actionSnapshot] =
					JSON.stringify({
						savedAt: new Date().toISOString(),
						leagueField: asString(this.settings?.leagueField, ""),
						selectField: asString(this.settings?.selectField, ""),
						toggleField: asBoolean(this.settings?.toggleField, false),
						saveCount: this._saveCount,
					});
			}

			shouldStop = shouldStop || stopChain;
			await this._log(
				`[settings_field_showcase] passVariablesExample emitted variables (shouldStop=${stopChain})`,
			);
		}

		const hasReturnedVariables =
			Object.keys(newlyPassedVariables).length > 0;
		if (!hasReturnedVariables && !shouldStop) {
			return;
		}

		return {
			...(hasReturnedVariables ? { newlyPassedVariables } : {}),
			...(shouldStop ? { shouldStop: true } : {}),
		};
	}

	async onCustomAuthDisplaySignal(config = {}) {
		const signalType = asString(
			config?.type ?? config?.signalType ?? config?.signal,
			"",
		)
			.trim()
			.toLowerCase();
		const payload =
			config?.payload && typeof config.payload === "object"
				? config.payload
				: {};

		switch (signalType) {
			case "ready":
				return {
					ok: true,
					pluginId: this.manifest?.id,
					message: "Settings showcase custom auth is ready.",
					league: this._league(),
				};
			case "ping":
				return {
					ok: true,
					pongAt: new Date().toISOString(),
					saveCount: this._saveCount,
				};
			case "setleague": {
				const requestedLeague = asString(payload.league ?? payload.value, "nfl")
					.trim()
					.toLowerCase();
				const nextLeague = TEAM_OPTIONS_BY_LEAGUE[requestedLeague]
					? requestedLeague
					: "nfl";
				this.updateSettings({ leagueField: nextLeague });
				void this.refreshSettingsOptions({
					fieldKey: "leagueField",
					settings: { ...this.settings, leagueField: nextLeague },
				});
				return {
					ok: true,
					leagueField: nextLeague,
					message: "League field updated from custom auth display.",
				};
			}
			case "setgroupedtext": {
				const nextValue =
					asString(payload.text, "").trim() ||
					"Updated from custom auth display";
				this.updateSettings({ groupedTextField: nextValue });
				return {
					ok: true,
					groupedTextField: nextValue,
					message: "Grouped text field updated from custom auth display.",
				};
			}
			case "snapshot":
				return {
					ok: true,
					fields: {
						leagueField: asString(this.settings?.leagueField, ""),
						groupedTextField: asString(this.settings?.groupedTextField, ""),
						selectField: asString(this.settings?.selectField, ""),
					},
				};
			case "close":
				return { ok: true, close: true };
			default:
				throw new Error(
					`Unsupported customAuthDisplay signal: ${signalType || "unknown"}`,
				);
		}
	}

	async onCustomAuthDisplayClose(config = {}) {
		await this._log(
			`[settings_field_showcase] custom auth display closed: ${formatForOutput(config)}`,
		);
	}

	async refreshSettingsOptions({ fieldKey, values, settings } = {}) {
		if (
			fieldKey &&
			fieldKey !== "leagueField" &&
			fieldKey !== "teamLookupField"
		) {
			return;
		}

		if (typeof this.lumia?.updateSettingsFieldOptions !== "function") {
			return;
		}

		const previewSettings = {
			...(this.settings && typeof this.settings === "object"
				? this.settings
				: {}),
			...(settings && typeof settings === "object" ? settings : {}),
			...(values && typeof values === "object" ? values : {}),
		};

		const league = this._league(previewSettings);
		const baseOptions = TEAM_OPTIONS_BY_LEAGUE[league] || TEAM_OPTIONS_BY_LEAGUE.nfl;
		const selectedValues = asStringList(
			values?.teamLookupField ??
				settings?.teamLookupField ??
				previewSettings.teamLookupField,
		);
		const knownValues = new Set(baseOptions.map((option) => option.value));
		const customOptions = selectedValues
			.filter((value) => !knownValues.has(value))
			.map((value) => ({
				label: `Custom: ${value}`,
				value,
			}));

		await this.lumia.updateSettingsFieldOptions({
			fieldKey: "teamLookupField",
			options: [...baseOptions, ...customOptions],
		});
	}

	async _emitAllFieldValues(settings, options = {}) {
		const reason = asString(options.reason, "save");
		const snapshot = {};

		for (const field of FIELD_SPECS) {
			const normalized = normalizeValueByType(field.type, settings?.[field.key], field);
			const output = formatForOutput(normalized);
			snapshot[field.key] = normalized;

			await this._log(`[settings_field_showcase] ${field.label} (${field.key}) = ${output}`);

		}

		this._saveCount += 1;
		const savedAt = new Date().toISOString();

		await this.lumia.setVariable(VARIABLE_NAMES.saveCount, this._saveCount);
		await this.lumia.setVariable(VARIABLE_NAMES.lastSavedAt, savedAt);
		await this.lumia.setVariable(
			VARIABLE_NAMES.lastSavedValuesJson,
			JSON.stringify(
				{
					reason,
					savedAt,
					fields: snapshot,
				},
				null,
				2,
			),
		);

	}

	async _log(message) {
		await this.lumia.log(message);
	}

	_league(settings = this.settings) {
		const token = asString(settings?.leagueField, "nfl").trim().toLowerCase();
		return TEAM_OPTIONS_BY_LEAGUE[token] ? token : "nfl";
	}
}

module.exports = SettingsFieldShowcasePlugin;
