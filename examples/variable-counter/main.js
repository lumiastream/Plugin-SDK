const { Plugin } = require("@lumiastream/plugin-sdk");

class VariableCounter extends Plugin {
	async onload() {
		const startValue = Number(this.settings.startValue) || 0;
		await this.lumia.setVariable("variable-counter_count", startValue);
		await this.lumia.addLog(
			`[variable-counter] Counter initialised at ${startValue}`
		);
	}

	async actions(config = {}) {
		const actionList = Array.isArray(config.actions) ? config.actions : [];
		for (const action of actionList) {
			if (action.type === "increment") {
				await this.increment(Number(action.value?.amount));
			}
			if (action.type === "reset") {
				await this.reset();
			}
		}
	}

	async increment(amount) {
		const incrementBy = Number.isFinite(amount) ? amount : 1;
		const current =
			Number(this.lumia.getVariable("variable-counter_count")) || 0;
		const next = current + incrementBy;
		await this.lumia.setVariable("variable-counter_count", next);
		await this.lumia.addLog(`[variable-counter] Counter increased to ${next}`);
	}

	async reset() {
		const startValue = Number(this.settings.startValue) || 0;
		await this.lumia.setVariable("variable-counter_count", startValue);
		await this.lumia.addLog(
			`[variable-counter] Counter reset to ${startValue}`
		);
	}
}

module.exports = VariableCounter;
