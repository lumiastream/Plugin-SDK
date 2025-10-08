const { Plugin } = require("@lumiastream/plugin");

class BasicLoggerPlugin extends Plugin {
	async onload() {
		await this.lumia.addLog("[basic-logger] Plugin loaded");
	}

	async onunload() {
		await this.lumia.addLog("[basic-logger] Plugin unloaded");
	}

	async actions(config = {}) {
		const actionList = Array.isArray(config.actions) ? config.actions : [];
		for (const action of actionList) {
			if (action.type === "log_message") {
				const message = action.value?.message || "Hello from Basic Logger";
				await this.lumia.addLog(`[basic-logger] ${message}`);
			}
		}
	}
}

module.exports = BasicLoggerPlugin;
