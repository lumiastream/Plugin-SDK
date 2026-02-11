const { Plugin } = require("@lumiastream/plugin");

const DEFAULTS = {
	message: "Hello from Showcase Plugin!",
	username: "Viewer",
	color: "#00c2ff",
	duration: 5,
};

const VARIABLE_NAMES = {
	message: "message",
	username: "username",
	color: "color",
	duration: "duration",
};

class ShowcasePluginTemplate extends Plugin {
	async onload() {
		await this._syncDefaults();
	}

	async onsettingsupdate(settings, previous = {}) {
		if (
			settings?.defaultMessage !== previous?.defaultMessage ||
			settings?.defaultColor !== previous?.defaultColor ||
			settings?.defaultDuration !== previous?.defaultDuration
		) {
			await this._syncDefaults(settings);
		}
	}

	async actions(config) {
		for (const action of config.actions) {
			if (action.type === "trigger_alert") {
				await this._triggerSampleAlert(action.value);
			}
		}
	}

	async _syncDefaults(settings = this.settings) {
		const message = settings?.defaultMessage ?? DEFAULTS.message;
		const color = settings?.defaultColor ?? DEFAULTS.color;
		const duration = Number(settings?.defaultDuration ?? DEFAULTS.duration);

		await this.lumia.setVariable(VARIABLE_NAMES.message, message);
		await this.lumia.setVariable(VARIABLE_NAMES.color, color);
		await this.lumia.setVariable(VARIABLE_NAMES.duration, duration);
	}

	async _triggerSampleAlert(data = {}) {
		const username = data?.username ?? DEFAULTS.username;
		const message =
			data?.message ?? this.settings?.defaultMessage ?? DEFAULTS.message;
		const color = data?.color ?? this.settings?.defaultColor ?? DEFAULTS.color;
		const duration = Number(
			data?.duration ?? this.settings?.defaultDuration ?? DEFAULTS.duration
		);

		await this.lumia.setVariable(VARIABLE_NAMES.username, username);
		await this.lumia.setVariable(VARIABLE_NAMES.message, message);
		await this.lumia.setVariable(VARIABLE_NAMES.color, color);
		await this.lumia.setVariable(VARIABLE_NAMES.duration, duration);

		try {
			await this.lumia.triggerAlert({
				alert: "sample_alert",
				dynamic: {
					value: color,
					username,
					message,
					color,
					duration,
				},
				extraSettings: {
					username,
					message,
					color,
					duration,
				},
			});
		} catch (error) {
			await this.lumia.addLog(
				`Sample alert failed: ${error?.message ?? String(error)}`
			);
		}
	}
}

module.exports = ShowcasePluginTemplate;
