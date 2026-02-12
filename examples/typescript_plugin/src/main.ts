import {
	Plugin,
	type PluginActionPayload,
	type PluginContext,
	type PluginManifest,
} from "@lumiastream/plugin";

type ExampleSettings = {
	defaultMessage?: string;
	heartbeatInterval?: number;
};

type SendSampleAlertActionValue = {
	username?: string;
	message?: string;
};

const DEFAULTS = {
	defaultMessage: "Hello from TypeScript Plugin Example!",
	defaultUsername: "Viewer",
	heartbeatInterval: 15,
} as const;

const VARIABLE_NAMES = {
	lastUsername: "last_username",
	lastMessage: "last_message",
	lastHeartbeat: "last_heartbeat",
} as const;

class TypeScriptPluginExample extends Plugin {
	private heartbeatTimer?: NodeJS.Timeout;

	constructor(manifest: PluginManifest, context: PluginContext) {
		super(manifest, context);
	}

	async onload(): Promise<void> {
		await this.syncDefaults();
		this.startHeartbeat();
	}

	async onunload(): Promise<void> {
		this.stopHeartbeat();
	}

	async onsettingsupdate(
		settings: Record<string, unknown>,
		previousSettings: Record<string, unknown>,
	): Promise<void> {
		const nextSettings = settings as ExampleSettings;
		const previous = previousSettings as ExampleSettings;
		const nextInterval = Number(
			nextSettings.heartbeatInterval ?? DEFAULTS.heartbeatInterval,
		);
		const previousInterval = Number(
			previous.heartbeatInterval ?? DEFAULTS.heartbeatInterval,
		);

		if (
			nextSettings.defaultMessage !== previous.defaultMessage ||
			nextInterval !== previousInterval
		) {
			await this.syncDefaults(nextSettings);
			this.startHeartbeat();
		}
	}

	async actions(config: { actions: PluginActionPayload[] }): Promise<void> {
		for (const action of config.actions) {
			if (action.type === "send_sample_alert") {
				await this.sendSampleAlert(action.value as SendSampleAlertActionValue);
			}
		}
	}

	private getTypedSettings(
		source: ExampleSettings = this.settings as ExampleSettings,
	): Required<ExampleSettings> {
		const parsedInterval = Number(
			source.heartbeatInterval ?? DEFAULTS.heartbeatInterval,
		);
		const heartbeatInterval = Number.isFinite(parsedInterval)
			? Math.min(300, Math.max(5, parsedInterval))
			: DEFAULTS.heartbeatInterval;

		return {
			defaultMessage:
				source.defaultMessage?.trim() || DEFAULTS.defaultMessage,
			heartbeatInterval,
		};
	}

	private async syncDefaults(settings?: ExampleSettings): Promise<void> {
		const typedSettings = this.getTypedSettings(settings);
		await this.lumia.setVariable(
			VARIABLE_NAMES.lastMessage,
			typedSettings.defaultMessage,
		);
	}

	private startHeartbeat(): void {
		this.stopHeartbeat();
		const { heartbeatInterval } = this.getTypedSettings();

		this.heartbeatTimer = setInterval(() => {
			void this.lumia.setVariable(
				VARIABLE_NAMES.lastHeartbeat,
				new Date().toISOString(),
			);
		}, heartbeatInterval * 1000);
	}

	private stopHeartbeat(): void {
		if (!this.heartbeatTimer) return;
		clearInterval(this.heartbeatTimer);
		this.heartbeatTimer = undefined;
	}

	private async sendSampleAlert(
		data: SendSampleAlertActionValue,
	): Promise<void> {
		const { defaultMessage } = this.getTypedSettings();
		const username = data.username?.trim() || DEFAULTS.defaultUsername;
		const message = data.message?.trim() || defaultMessage;

		await this.lumia.setVariable(VARIABLE_NAMES.lastUsername, username);
		await this.lumia.setVariable(VARIABLE_NAMES.lastMessage, message);

		try {
			await this.lumia.triggerAlert({
				alert: "ts_sample_alert",
				dynamic: {
					name: "message",
					value: message,
				},
				extraSettings: {
					username,
					message,
				},
			});
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			await this.lumia.log(
				`send_sample_alert failed: ${errorMessage}`,
			);
		}
	}
}

export = TypeScriptPluginExample;
