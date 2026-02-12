const { Plugin } = require("@lumiastream/plugin");

const VARIABLE_NAMES = {
	saveCount: "save_count",
	lastSavedAt: "last_saved_at",
	lastSavedValuesJson: "last_saved_values_json",
};

const FIELD_SPECS = [
	{ key: "textField", label: "text", type: "text" },
	{ key: "numberField", label: "number", type: "number" },
	{ key: "selectField", label: "select", type: "select" },
	{
		key: "selectMultipleField",
		label: "select_multiple",
		type: "select",
		multiple: true,
	},
	{ key: "checkboxField", label: "checkbox", type: "checkbox" },
	{ key: "sliderField", label: "slider", type: "slider" },
	{ key: "hiddenTextField", label: "hidden_text", type: "text" },
	{ key: "groupedTextField", label: "grouped_text", type: "text" },
	{ key: "fileField", label: "file", type: "file" },
	{ key: "passwordField", label: "password", type: "password" },
	{ key: "toggleField", label: "toggle", type: "toggle" },
	{ key: "textareaField", label: "textarea", type: "textarea" },
	{ key: "emailField", label: "email", type: "email" },
	{ key: "urlField", label: "url", type: "url" },
	{ key: "colorField", label: "color", type: "color" },
	{ key: "jsonField", label: "json", type: "json" },
	{ key: "roiField", label: "roi", type: "roi" },
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
		await this._emitAllFieldValues(this.settings, { showToasts: false, reason: "load" });
	}

	async onunload() {
		await this.lumia.updateConnection(false);
	}

	async onsettingsupdate(settings) {
		await this._emitAllFieldValues(settings, { showToasts: true, reason: "save" });
	}

	async validateAuth() {
		return { ok: true };
	}

	async _emitAllFieldValues(settings, options = {}) {
		const showToasts = options.showToasts === true;
		const reason = asString(options.reason, "save");
		const snapshot = {};

		for (const field of FIELD_SPECS) {
			const normalized = normalizeValueByType(field.type, settings?.[field.key], field);
			const output = formatForOutput(normalized);
			snapshot[field.key] = normalized;

			await this._log(`[settings_field_showcase] ${field.label} (${field.key}) = ${output}`);

			if (showToasts) {
				await this.lumia.showToast({
					message: `${field.label}: ${truncate(output, 90)}`,
					time: 2600,
				});
			}
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

		if (showToasts) {
			await this.lumia.showToast({
				message: `Settings saved. Logged ${FIELD_SPECS.length} field values.`,
				time: 3500,
			});
		}
	}

	async _log(message) {
		await this.lumia.log(message);
	}
}

module.exports = SettingsFieldShowcasePlugin;
