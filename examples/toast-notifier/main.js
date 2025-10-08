const { Plugin } = require("@lumiastream/plugin");

class ToastNotifier extends Plugin {
	get defaultMessage() {
		return this.settings.defaultMessage || "Hello from Toast Notifier!";
	}

	get defaultDuration() {
		const value = Number(this.settings.displayTime);
		return Number.isFinite(value) ? value : 4000;
	}

	async onload() {
		await this.lumia.addLog("[toast-notifier] Ready to display toasts");
	}

	async actions(config = {}) {
		const actionList = Array.isArray(config.actions) ? config.actions : [];
		for (const action of actionList) {
			if (action.type !== "show_toast") continue;

			const message = action.value?.message || this.defaultMessage;
			const duration = Number.isFinite(Number(action.value?.duration))
				? Number(action.value.duration)
				: this.defaultDuration;

			await this.lumia.showToast({ message, time: duration });
			await this.lumia.addLog(
				`[toast-notifier] Toast displayed: "${message}" (${duration}ms)`
			);
		}
	}
}

module.exports = ToastNotifier;
