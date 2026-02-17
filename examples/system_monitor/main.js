const { Plugin } = require("@lumiastream/plugin");
const os = require("os");

function safeRequireSystemInformation() {
	try {
		return require("systeminformation");
	} catch (error) {
		return null;
	}
}

const DEFAULTS = {
	pollIntervalSec: 2,
	cpuWarn: 70,
	cpuCritical: 90,
	ramWarn: 70,
	ramCritical: 90,
	gpuWarn: 70,
	gpuCritical: 90,
};

const VARIABLES = {
	cpuUsage: "cpu_usage",
	cpuBucket: "cpu_bucket",
	ramUsage: "ram_usage",
	ramBucket: "ram_bucket",
	ramUsedMb: "ram_used_mb",
	ramTotalMb: "ram_total_mb",
	gpuAvailable: "gpu_available",
	gpuUsage: "gpu_usage",
	gpuBucket: "gpu_bucket",
};

const ALERTS = {
	cpu: "cpu_alert",
	ram: "ram_alert",
	gpu: "gpu_alert",
};

class SystemMonitorPlugin extends Plugin {
	async onload() {
		this._si = safeRequireSystemInformation();
		if (!this._si) {
			await this.lumia.log(
				"[System Monitor] systeminformation not installed. CPU/RAM will use basic OS stats and GPU will be disabled. Run `npm install` in the plugin folder for full support."
			);
		}

		this._interval = null;
		this._lastBuckets = {
			cpu: "normal",
			ram: "normal",
			gpu: "normal",
		};
		this._lastCpuSample = this._readCpuTimes();
		await this._startPolling();
	}

	async onsettingsupdate(settings, previous = {}) {
		const next = this._normalizeSettings(settings);
		const prev = this._normalizeSettings(previous);

		if (next.pollIntervalSec !== prev.pollIntervalSec) {
			await this._startPolling();
		}
	}

	onunload() {
		this._stopPolling();
	}

	_normalizeSettings(settings = this.settings) {
		return {
			pollIntervalSec: this._number(settings?.pollIntervalSec, DEFAULTS.pollIntervalSec),
			cpuWarn: this._number(settings?.cpuWarn, DEFAULTS.cpuWarn),
			cpuCritical: this._number(settings?.cpuCritical, DEFAULTS.cpuCritical),
			ramWarn: this._number(settings?.ramWarn, DEFAULTS.ramWarn),
			ramCritical: this._number(settings?.ramCritical, DEFAULTS.ramCritical),
			gpuWarn: this._number(settings?.gpuWarn, DEFAULTS.gpuWarn),
			gpuCritical: this._number(settings?.gpuCritical, DEFAULTS.gpuCritical),
		};
	}

	_number(value, fallback) {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : fallback;
	}

	_stopPolling() {
		if (this._interval) {
			clearInterval(this._interval);
			this._interval = null;
		}
	}

	async _startPolling() {
		this._stopPolling();
		const { pollIntervalSec } = this._normalizeSettings();
		const intervalMs = Math.max(1, pollIntervalSec) * 1000;

		await this._pollOnce();
		this._interval = setInterval(() => {
			this._pollOnce().catch((error) => {
				this.lumia.log(
					`[System Monitor] Poll failed: ${error?.message ?? String(error)}`
				);
			});
		}, intervalMs);
	}

	async _pollOnce() {
		const settings = this._normalizeSettings();
		const { cpuUsage, memUsed, memTotal, gpuInfo } = await this._readMetrics();
		const ramUsage =
			memTotal > 0
				? this._roundPercent((memUsed / memTotal) * 100)
				: 0;

		await Promise.all([
			this.lumia.setVariable(VARIABLES.cpuUsage, cpuUsage),
			this.lumia.setVariable(VARIABLES.ramUsage, ramUsage),
			this.lumia.setVariable(VARIABLES.ramUsedMb, this._toMb(memUsed)),
			this.lumia.setVariable(VARIABLES.ramTotalMb, this._toMb(memTotal)),
			this.lumia.setVariable(VARIABLES.gpuAvailable, gpuInfo.available),
			this.lumia.setVariable(VARIABLES.gpuUsage, gpuInfo.usage),
		]);

		const cpuBucket = this._bucket(cpuUsage, settings.cpuWarn, settings.cpuCritical);
		const ramBucket = this._bucket(ramUsage, settings.ramWarn, settings.ramCritical);
		const gpuBucket = gpuInfo.available
			? this._bucket(gpuInfo.usage, settings.gpuWarn, settings.gpuCritical)
			: "normal";

		await Promise.all([
			this.lumia.setVariable(VARIABLES.cpuBucket, cpuBucket),
			this.lumia.setVariable(VARIABLES.ramBucket, ramBucket),
			this.lumia.setVariable(VARIABLES.gpuBucket, gpuBucket),
		]);

		await this._maybeAlert({
			metric: "cpu",
			bucket: cpuBucket,
			usage: cpuUsage,
			variables: { cpu_usage: cpuUsage, cpu_bucket: cpuBucket },
		});

		await this._maybeAlert({
			metric: "ram",
			bucket: ramBucket,
			usage: ramUsage,
			variables: {
				ram_usage: ramUsage,
				ram_bucket: ramBucket,
				ram_used_mb: this._toMb(memUsed),
				ram_total_mb: this._toMb(memTotal),
			},
		});

		if (gpuInfo.available) {
			await this._maybeAlert({
				metric: "gpu",
				bucket: gpuBucket,
				usage: gpuInfo.usage,
				variables: { gpu_usage: gpuInfo.usage, gpu_bucket: gpuBucket },
			});
		}
	}

	async _readMetrics() {
		if (this._si) {
			const [load, mem, graphics] = await Promise.all([
				this._si.currentLoad(),
				this._si.mem(),
				this._si.graphics().catch(() => ({ controllers: [] })),
			]);

			const cpuUsage = this._roundPercent(load?.currentLoad);
			const memUsed = this._number(mem?.used ?? mem?.active, 0);
			const memTotal = this._number(mem?.total, 0);
			const gpuInfo = this._resolveGpuUsage(graphics);

			return { cpuUsage, memUsed, memTotal, gpuInfo };
		}

		const cpuUsage = this._readCpuUsageFallback();
		const memTotal = os.totalmem();
		const memFree = os.freemem();
		const memUsed = Math.max(0, memTotal - memFree);

		return {
			cpuUsage: this._roundPercent(cpuUsage),
			memUsed,
			memTotal,
			gpuInfo: { available: false, usage: 0 },
		};
	}

	_readCpuTimes() {
		const cpus = os.cpus();
		let idle = 0;
		let total = 0;

		for (const cpu of cpus) {
			const times = cpu.times || {};
			idle += times.idle ?? 0;
			total +=
				(times.user ?? 0) +
				(times.nice ?? 0) +
				(times.sys ?? 0) +
				(times.irq ?? 0) +
				(times.idle ?? 0);
		}

		return { idle, total };
	}

	_readCpuUsageFallback() {
		const prev = this._lastCpuSample || this._readCpuTimes();
		const next = this._readCpuTimes();
		this._lastCpuSample = next;

		const idle = next.idle - prev.idle;
		const total = next.total - prev.total;
		if (total <= 0) return 0;

		return (1 - idle / total) * 100;
	}

	_roundPercent(value) {
		const number = this._number(value, 0);
		return Math.max(0, Math.min(100, Number(number.toFixed(1))));
	}

	_toMb(value) {
		return Number((this._number(value, 0) / 1024 / 1024).toFixed(0));
	}

	_bucket(value, warn, critical) {
		if (value >= critical) return "critical";
		if (value >= warn) return "warning";
		return "normal";
	}

	_resolveGpuUsage(graphics) {
		const controllers = Array.isArray(graphics?.controllers)
			? graphics.controllers
			: [];

		const values = controllers
			.map((controller) => {
				const candidate =
					controller?.utilizationGpu ??
					controller?.utilizationGPU ??
					controller?.utilization ??
					controller?.utilization_gpu ??
					controller?.gpuUtilization ??
					controller?.gpu_utilization;
				return this._number(candidate, NaN);
			})
			.filter((value) => Number.isFinite(value));

		if (!values.length) {
			return { available: false, usage: 0 };
		}

		const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
		return { available: true, usage: this._roundPercent(avg) };
	}

	async _maybeAlert({ metric, bucket, usage, variables }) {
		const last = this._lastBuckets[metric] ?? "normal";
		this._lastBuckets[metric] = bucket;

		if (bucket === last || bucket === "normal") {
			return;
		}

		const alertKey = ALERTS[metric];
		if (!alertKey) return;

		await this.lumia.triggerAlert({
			alert: alertKey,
			dynamic: {
				name: "value",
				value: bucket,
			},
			extraSettings: variables,
		});
	}
}

module.exports = SystemMonitorPlugin;
