const { Plugin } = require('@lumiastream/plugin');

const DEFAULT_LIGHTS = [
	{ id: 'mock-1', name: 'Mock Panel A', ip: '10.0.0.11' },
	{ id: 'mock-2', name: 'Mock Strip B', ip: '10.0.0.12' },
];

class MockLightsPlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._lights = [...DEFAULT_LIGHTS];
		this._idCounter = DEFAULT_LIGHTS.length + 1;
	}

	async onload() {
		await this._log('Mock lights plugin loaded');
		await this.lumia.updateConnection(true);
	}

	async onunload() {
		await this._log('Mock lights plugin unloaded');
		await this.lumia.updateConnection(false);
	}

	async searchLights() {
		const newLight = {
			id: `mock-${this._idCounter}`,
			name: `Discovered Mock ${this._idCounter}`,
			ip: `10.0.0.${10 + this._idCounter}`,
		};
		this._idCounter++;
		this._mergeLights([newLight]);
		await this._log(`Discovered ${newLight.name} (${newLight.id})`);
		return this._lights;
	}

	async addLight(data = {}) {
		const newLight = {
			id: data.id || `manual-${Date.now()}`,
			name: data.name || `Manual Mock ${this._idCounter++}`,
			ip: data.ip,
		};
		this._mergeLights([newLight]);
		await this._log(`Manually added ${newLight.name} (${newLight.id})`);
		return this._lights;
	}

	async onLightChange(config = {}) {
		const ids = Array.isArray(config.lights) ? config.lights.map((l) => l?.id || l).join(', ') : 'unknown';
		const color = config.color ? `rgb(${config.color.r},${config.color.g},${config.color.b})` : 'no color';
		const brightness = typeof config.brightness === 'number' ? `${config.brightness}%` : 'unchanged';
		const power = typeof config.power === 'boolean' ? (config.power ? 'on' : 'off') : 'unchanged';

		await this._log(`onLightChange -> brand=${config.brand} lights=[${ids}] color=${color} brightness=${brightness} power=${power}`);
	}

	_mergeLights(newOnes = []) {
		const existing = new Map(this._lights.map((l) => [l.id, l]));
		newOnes.forEach((light) => {
			if (!existing.has(light.id)) {
				existing.set(light.id, light);
			}
		});
		this._lights = Array.from(existing.values());
	}

	async _log(message) {
		await this.lumia.addLog(`[${this.manifest.id}] ${message}`);
	}
}

module.exports = MockLightsPlugin;
