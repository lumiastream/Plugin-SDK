const { Plugin } = require("@lumiastream/plugin");

const TRACK_SECONDS = 20;

class DemoSongSource extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this.current = null;
		this.timer = null;
		this.remainingMs = 0;
		this.startedAt = 0;
	}

	async onload() {
		await this.lumia.updateConnection(true);
		this.lumia.log("Demo song source ready");
	}

	async onunload() {
		this.clearTimer();
		this.current = null;
		await this.lumia.updateConnection(false);
	}

	async resolveSongRequest({ query, requesterUsername, requesterPlatform }) {
		const trimmed = String(query ?? "").trim();
		if (!trimmed || trimmed.toLowerCase().includes("unfindable")) {
			return null;
		}
		if (trimmed.toLowerCase().includes("unresolved")) {
			return { resolved: false, track: { artist: "Unknown Artist" } };
		}
		return {
			id: `demo-${Buffer.from(trimmed.toLowerCase()).toString("base64url")}`,
			title: trimmed.replace(/\b\w/g, (c) => c.toUpperCase()),
			artist: "Demo Artist",
			thumbnailUrl: "https://storage.lumiastream.com/logo/lumia-icon.png",
			url: `https://example.com/track/${encodeURIComponent(trimmed)}`,
			durationSeconds: TRACK_SECONDS,
			requesterUsername,
			requesterPlatform,
		};
	}

	async playSongRequest(track) {
		this.clearTimer();
		this.current = track;
		this.remainingMs = (track.durationSeconds ?? TRACK_SECONDS) * 1000;
		this.lumia.log(`Playing: ${track.title} (requested by ${track.requesterUsername ?? "unknown"})`);
		await this.lumia.songRequestNowPlaying(track);
		this.armEndTimer();
	}

	async skipSongRequest() {
		if (!this.current) return;
		this.lumia.log(`Skipping: ${this.current.title}`);
		await this.finishTrack();
	}

	async pauseSongRequest() {
		if (!this.current || !this.timer) return;
		this.remainingMs = Math.max(0, this.remainingMs - (Date.now() - this.startedAt));
		this.clearTimer();
		this.lumia.log(`Paused: ${this.current.title}`);
	}

	async resumeSongRequest() {
		if (!this.current || this.timer) return;
		this.lumia.log(`Resumed: ${this.current.title}`);
		this.armEndTimer();
	}

	async setSongRequestVolume(volume) {
		this.lumia.log(`Volume set to ${volume}%`);
	}

	async clearSongRequestQueue() {
		this.lumia.log("Queue cleared by Lumia");
	}

	armEndTimer() {
		this.startedAt = Date.now();
		this.timer = setTimeout(() => {
			void this.finishTrack();
		}, this.remainingMs);
	}

	async finishTrack() {
		const ended = this.current;
		this.clearTimer();
		this.current = null;
		if (ended) {
			await this.lumia.songRequestEnded(ended.id);
		}
	}

	clearTimer() {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
	}
}

module.exports = DemoSongSource;
