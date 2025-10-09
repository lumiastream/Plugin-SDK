const { Plugin } = require("@lumiastream/plugin");

const VARIABLE_NAMES = {
	lastMessage: "last_message",
	lastAlertColor: "last_alert_color",
};

const DEFAULTS = {
	welcomeMessage: "Hello from Showcase Plugin!",
	color: "#00c2ff",
	alertDuration: 5,
};

class ShowcasePluginTemplate extends Plugin {
	async onload() {
		const message = this._currentMessage();
		await this._log("Plugin loaded");
		await this._rememberMessage(message);

		if (this.settings.autoAlert === "load") {
			await this._triggerSampleAlert({
				color: this.settings.favoriteColor,
				duration: DEFAULTS.alertDuration,
			});
		}
	}

	async onunload() {
		await this._log("Plugin unloaded");
	}

	async onsettingsupdate(settings, previous = {}) {
		await this._log("Settings updated");

		if (
			settings?.welcomeMessage &&
			settings.welcomeMessage !== previous?.welcomeMessage
		) {
			await this._rememberMessage(settings.welcomeMessage);
		}

		if (settings?.autoAlert === "load" && previous?.autoAlert !== "load") {
			await this._log("Auto alert configured to fire on load");
		}
	}

	async actions(config = {}) {
		const actions = Array.isArray(config.actions) ? config.actions : [];
		for (const action of actions) {
			switch (action?.type) {
				case "log_message":
					await this._handleLogMessage(action.data);
					break;
				case "update_variable":
					await this._handleUpdateVariable(action.data);
					break;
				case "trigger_alert":
					await this._triggerSampleAlert(action.data);
					break;
				default:
					await this._log(
						`Unknown action type: ${action?.type ?? "undefined"}`
					);
			}
		}
	}

	_tag() {
		return `[${this.manifest?.id ?? "showcase_plugin"}]`;
	}

	_currentMessage() {
		return (
			this.settings?.welcomeMessage ||
			`Hello from ${this.manifest?.name ?? "Showcase Plugin"}!`
		);
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

	async _rememberMessage(value) {
		await this.lumia.setVariable(VARIABLE_NAMES.lastMessage, value);
	}

	async _handleLogMessage(data = {}) {
		const message = data?.message || this._currentMessage();
		const severity = data?.severity || "info";

		await this._log(message, severity);

		if (typeof this.lumia.showToast === "function") {
			await this.lumia.showToast({
				message: `${this.manifest?.name ?? "Plugin"}: ${message}`,
				time: 4,
			});
		}

		if (this.settings.autoAlert === "after-log") {
			await this._triggerSampleAlert({
				color: this.settings.favoriteColor,
				duration: DEFAULTS.alertDuration,
			});
		}
	}

	async _handleUpdateVariable(data = {}) {
		const value = data?.value ?? new Date().toISOString();
		await this._rememberMessage(value);
		await this._log(`Stored variable value: ${value}`);
	}

	async _triggerSampleAlert(data = {}) {
		const color = data?.color || this.settings?.favoriteColor || DEFAULTS.color;
		const duration = Number(data?.duration) || DEFAULTS.alertDuration;

		try {
			const success = await this.lumia.triggerAlert({
				alert: "sample_light",
				extraSettings: { color, duration },
			});

			if (!success) {
				await this._log("Sample alert reported failure", "warn");
				return;
			}

			await this.lumia.setVariable(VARIABLE_NAMES.lastAlertColor, color);
			await this._log(
				`Triggered sample alert with color ${color} for ${duration}s`
			);
		} catch (error) {
			await this._log(
				`Failed to trigger sample alert: ${error.message ?? error}`,
				"error"
			);
		}
	}
}

module.exports = ShowcasePluginTemplate;
