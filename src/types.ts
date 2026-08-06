/**
 * Lumia Stream Plugin SDK - Core Types and Interfaces
 * Provides the type system that plugin developers rely on when building plugins.
 */

/**
 * Plugin lifecycle status as represented inside Lumia Stream.
 */
export enum PluginStatus {
	INSTALLED = "installed",
	ACTIVE = "active",
	INACTIVE = "inactive",
	ERROR = "error",
	UPDATING = "updating",
	PENDING_INSTALL = "pending_install",
	UNINSTALLING = "uninstalling",
}

/**
 * High level plugin marketplace categories.
 */
export enum PluginCategory {
	SYSTEM = "system",
	PLATFORMS = "platforms",
	APPS = "apps",
	AUDIO = "audio",
	VIDEO = "video",
	LIGHTS = "lights",
	SWITCH = "switch",
	DECK = "deck",
	PROTOCOLS = "protocols",
	KEYLIGHT = "keylight",
	DEVICES = "devices",
	GAMES = "games",
	UTILITIES = "utilities",
}

export interface PluginVariableDefinition {
	name: string;
	/**
	 * @deprecated Use plugin translations (`config.translations`) for variable display text.
	 */
	description?: string;
	value: string | number | boolean | null;
}

export interface PluginAlertVariationSelection {
	label: string;
	message?: string;
	value: string | number;
}

export interface PluginAlertVariationCondition {
	type: string;
	description?: string;
	/**
	 * When true (and `type` is `EQUAL_SELECTION`), Lumia allows custom typed values
	 * in addition to the manifest-provided `selections`.
	 */
	dynamicOptions?: boolean;
	selections?: PluginAlertVariationSelection[];
}

export interface PluginAlertExtraOption {
	type: "bool" | "number" | "string";
	property: string;
	title: string;
	info: string;
	min?: number;
	max?: number;
}

export interface PluginGeneratedAlertVariation {
	name: string;
	condition?: string | number;
	conditionType?: string;
	conditionExtra?: string | number;
	image?: string;
	value?: {
		linked?: string | [number, number, number] | { r: number; g: number; b: number };
	};
	tts?: {
		on: boolean;
	};
	chatbot?: {
		on: boolean;
	};
	on?: boolean;
}

export interface PluginAlertVariationGenerationConfig {
	title?: string;
	description?: string;
	buttonLabel?: string;
	generateLabel?: string;
	fields?: PluginFormField[];
}

export interface PluginAlertDefinition {
	title: string;
	key: string;
	/**
	 * Variable keys available for this alert template scope.
	 */
	acceptedVariables?: string[];
	defaultMessage?: string;
	variationConditions?: PluginAlertVariationCondition[];
	variationGeneration?: PluginAlertVariationGenerationConfig;
}

export interface PluginDependency {
	id: string;
	version?: string;
	optional?: boolean;
}

export interface PluginBundleConfig {
	/**
	 * Bundled exported command files (`.lumia` / `.lumiastream`).
	 */
	commands?: string[];
	/**
	 * Bundled marketplace overlay upload IDs or shared download URLs.
	 */
	overlays?: string[];
}

export type PluginNamedMapFieldType = "named_map";

export type PluginBooleanFieldType = "switch" | "toggle";

export type PluginCommonFieldType =
	| "text"
	| "datetime"
	| "number"
	| "select"
	| "checkbox"
	| PluginBooleanFieldType
	| "slider"
	| "file"
	| "email"
	| "url"
	| "textarea"
	| "color";

export type PluginSettingFieldType =
	| PluginCommonFieldType
	| "media"
	| "password"
	| "json"
	| "roi"
	| PluginNamedMapFieldType;

export type PluginActionFieldType = PluginCommonFieldType | "media";

export type PluginNamedMapValueType =
	| "text"
	| "datetime"
	| "number"
	| "select"
	| "checkbox"
	| PluginBooleanFieldType
	| "file"
	| "json";

export type PluginNamedMapOutputMode = "array" | "object" | "map";

export type PluginNamedMapObjectValueMode = "object" | "value" | "path";

export interface PluginNamedMapOption {
	id?: string;
	label: string;
	value: string | number | boolean;
}

export interface PluginNamedMapValueFieldConfig {
	type?: Exclude<PluginSettingFieldType, PluginNamedMapFieldType>;
	placeholder?: string;
	helperText?: string;
	required?: boolean;
	options?: PluginNamedMapOption[];
	allowTyping?: boolean;
	multiple?: boolean;
	rows?: number;
	validation?: {
		pattern?: string;
		min?: number;
		max?: number;
		minLength?: number;
		maxLength?: number;
	};
}

export interface PluginSetting {
	key: string;
	label: string;
	type: PluginSettingFieldType;
	placeholder?: string;
	helperText?: string;
	required?: boolean;
	options?: Array<{
		id?: string;
		label: string;
		value: string | number | boolean;
	}>;
	allowTyping?: boolean;
	multiple?: boolean;
	lookup?: boolean;
	dynamicOptions?: boolean;
	refreshOnChange?: boolean;
	rows?: number;
	section?: string;
	sectionOrder?: number;
	group?: string | PluginSettingGroupConfig;
	defaultValue?:
		| string
		| number
		| boolean
		| string[]
		| Record<string, unknown>
		| Array<unknown>;
	disabled?: boolean;
	hidden?: boolean;
	visibleIf?: PluginVisibleIfCondition;
	validation?: {
		pattern?: string;
		min?: number;
		max?: number;
		minLength?: number;
		maxLength?: number;
	};
	/**
	 * named_map only: value field type per row. Defaults to "text".
	 */
	valueType?: PluginNamedMapValueType;
	/**
	 * named_map only: key used for the entry name in serialized payload (default: "name").
	 */
	nameKey?: string;
	/**
	 * named_map only: key used for the value in serialized payload (default: "value", or "path" for file values).
	 */
	valueKey?: string;
	/**
	 * named_map only: label/placeholder/default for each row value input.
	 */
	valueLabel?: string;
	valuePlaceholder?: string;
	valueDefault?: unknown;
	/**
	 * named_map only: override value input config for each row.
	 */
	valueField?: PluginNamedMapValueFieldConfig;
	allowDuplicateNames?: boolean;
	/**
	 * named_map only: output serialization shape.
	 */
	outputMode?: PluginNamedMapOutputMode;
	/**
	 * named_map object output value shape (default: "object").
	 */
	objectValueMode?: PluginNamedMapObjectValueMode;
	includeNameInObjectValue?: boolean;
}

export interface PluginVisibleIfCondition {
	key: string;
	equals:
		| string
		| number
		| boolean
		| null
		| Array<string | number | boolean | null>;
}

export interface PluginSettingGroupConfig {
	key: string;
	label?: string;
	helperText?: string;
	section?: string;
	order?: number;
	visibleIf?: PluginVisibleIfCondition;
}

export interface PluginActionField {
	key: string;
	label: string;
	type: PluginActionFieldType;
	placeholder?: string;
	helperText?: string;
	required?: boolean;
	options?: PluginActionFieldOption[];
	min?: number;
	max?: number;
	step?: number;
	rows?: number;
	allowTyping?: boolean;
	/**
	 * When true, allows selecting multiple values (select fields only).
	 */
	multiple?: boolean;
	defaultValue?: any;
	/**
	 * When true, allow template variables (e.g. {{username}}) in this field.
	 */
	allowVariables?: boolean;
	/**
	 * When true, this field can receive dynamic options from the plugin.
	 */
	dynamicOptions?: boolean;
	validation?: {
		min?: number;
		max?: number;
		pattern?: string;
	};
}

export interface PluginActionFieldOption {
	label: string;
	value: string | number | boolean;
}

export interface PluginActionDefinition {
	type: string;
	label: string;
	description?: string;
	icon?: string;
	/**
	 * Variable keys that this action exposes for downstream actions/messages.
	 * Must use your plugin prefix (e.g. "<pluginId>_song_name").
	 * Unprefixed entries are ignored by Lumia.
	 */
	acceptedVariables?: string[];
	/**
	 * When true, the UI refreshes dynamic options when the action is selected.
	 */
	refreshOnChange?: boolean;
	fields: PluginActionField[];
}

export type PluginActionPayloadValue =
	| Record<string, unknown>
	| string
	| number
	| boolean
	| Array<unknown>
	| null;

export interface PluginActionPayload {
	type: string;
	value: PluginActionPayloadValue;
	id?: string;
	on?: boolean;
	base?: string;
	delay?: number;
	variables?: Record<string, unknown>;
	args?: unknown;
	[key: string]: unknown;
}

export interface PluginActionResult {
	/**
	 * Variables returned from this action that should be merged into runtime extraSettings
	 * and made available to subsequent actions in the same execution chain.
	 * Keys must be prefixed with your plugin id (e.g. "<pluginId>_next_value").
	 * Unprefixed keys are ignored by Lumia.
	 */
	newlyPassedVariables?: Record<string, unknown>;
	/**
	 * When true, Lumia stops processing the remaining actions in the current chain.
	 */
	shouldStop?: boolean;
}

export interface PluginVariableFunctionDefinition {
	key: string;
	label?: string;
	description?: string;
	fields?: PluginActionField[];
}

export interface PluginVariableFunctionContext {
	key: string;
	value?: string;
	raw?: string;
	args?: string[];
	allVariables?: Record<string, any>;
}

export interface PluginVariableFunctionResult {
	value: string;
	variables?: Record<string, any>;
}

export interface PluginOAuthTokenKeys {
	accessToken?: string;
	refreshToken?: string;
	tokenSecret?: string;
}

export interface PluginOAuthConfig {
	/**
	 * Full OAuth service URL. When set, it overrides provider-based URLs.
	 */
	serviceUrl?: string;
	/**
	 * Opens OAuth in the system browser instead of the embedded window.
	 */
	openInBrowser?: boolean;
	/**
	 * Optional button label shown in the PluginAuth UI.
	 */
	buttonLabel?: string;
	/**
	 * Helper text shown below the OAuth button.
	 */
	helperText?: string;
	/**
	 * Extra query string params (without leading "?") to append to the service URL.
	 */
	extraParams?: string;
	/**
	 * Optional OAuth scopes to request.
	 */
	scopes?: string[];
	/**
	 * Map OAuth response tokens into plugin settings keys.
	 */
	tokenKeys?: PluginOAuthTokenKeys;
}

export interface PluginCustomAuthDisplayConfig {
	/**
	 * Relative file path to the custom auth HTML entry (from plugin root).
	 */
	entry: string;
	/**
	 * When true, PluginAuth opens the custom auth modal automatically.
	 */
	autoAutoOpen?: boolean;
	/**
	 * Optional button label shown in PluginAuth for opening the custom auth modal.
	 */
	authButtonLabel?: string;
	/**
	 * Modal title shown in PluginAuth.
	 */
	title: string;
}

export interface PluginCustomAuthDisplaySignalRequest {
	type: string;
	payload?: unknown;
	settings?: Record<string, any>;
	connection?: string;
	sessionId?: string;
	[key: string]: unknown;
}

export interface PluginCustomAuthDisplayCloseRequest {
	reason?: string;
	payload?: unknown;
	settings?: Record<string, any>;
	connection?: string;
	sessionId?: string;
	[key: string]: unknown;
}

export type PluginTranslationDictionary = Record<string, unknown>;

export type PluginTranslationLanguageMap = Record<string, PluginTranslationDictionary | string>;

export type PluginTranslations = PluginTranslationLanguageMap | string;

/**
 * A resolved track as understood by your plugin's music source. Return it from
 * `resolveSongRequest`, and report it back through `songRequestNowPlaying` /
 * `updateSongRequestQueue`. Lumia treats `id` as an opaque match key.
 */
export interface PluginSongRequestTrack {
	id: string;
	title: string;
	artist?: string;
	thumbnailUrl?: string;
	url?: string;
	durationSeconds?: number;
	requesterUsername?: string;
	requesterPlatform?: string;
	/** When the request entered the queue (epoch ms). Set by Lumia on hand-off. */
	requestedAt?: number;
}

/**
 * Explicit resolve outcome for `resolveSongRequest`. You may also return a bare
 * `PluginSongRequestTrack` (shorthand for resolved) or `null` (reject).
 * `resolved: false` queues the request anyway, unresolved — for sources with
 * partial or no search coverage (cloud catalogs, no search API). Optional
 * `track` fields are metadata hints that override Lumia's own lookup.
 */
export interface PluginSongRequestResolveResult {
	resolved: boolean;
	track?: Partial<PluginSongRequestTrack>;
}

/** What Lumia hands your `resolveSongRequest` hook when a viewer requests a song. */
export interface PluginSongRequestResolveRequest {
	query: string;
	requesterUsername?: string;
	requesterPlatform?: string;
}

/** Submit a song request into Lumia's queue from your plugin (`lumia.addSongRequest`). */
export interface PluginAddSongRequestOptions {
	query: string;
	requesterUsername?: string;
}

export interface PluginAddSongRequestResult {
	accepted: boolean;
	/** Rejection reason when `accepted` is false (queue full, disabled source, throttled, …). */
	reason?: string;
}

/**
 * Declares your plugin as a song-request source/player. Presence of this object
 * (or `hasSongRequests: true`) makes the plugin selectable as the song-request
 * mode. Capability flags let Lumia hide controls your source can't honor.
 */
export interface PluginSongRequestSourceConfig {
	/** Label in the song-request mode picker. Defaults to the plugin name. */
	label?: string;
	/** Set false if your source only accepts URLs it recognizes, not free-text search. */
	supportsSearch?: boolean;
	supportsSkip?: boolean;
	supportsPause?: boolean;
	supportsVolume?: boolean;
	/** True when your app owns the queue (Lumia hands off every request); false when Lumia drives one track at a time. */
	supportsQueue?: boolean;
}

/** A voice your plugin can synthesize, surfaced in Lumia's native TTS voice picker. */
export interface PluginTtsVoice {
	/** Stable id passed back to your `synthesizeTts` hook as `voiceId`. Keep it stable across restarts. */
	id: string;
	/** Display name shown in the voice picker. */
	name: string;
	/** Optional BCP-47-style language tag (e.g. "en_US"). */
	language?: string;
	/** Optional preview-clip URL shown in the picker. */
	previewUrl?: string;
	/** Optional avatar/thumbnail URL shown next to the voice. */
	imageUrl?: string;
}

/** What Lumia passes your `ttsVoices` hook. `refresh` is true when the user explicitly asked to re-pull. */
export interface PluginTtsVoicesRequestOptions {
	refresh?: boolean;
}

/** What Lumia hands your `synthesizeTts` hook when one of your voices is chosen. */
export interface PluginTtsSynthesizeRequest {
	/** The `id` of the `PluginTtsVoice` the user selected. */
	voiceId: string;
	/** Text to speak — already variable-resolved, emote/URL-stripped and length-capped by Lumia. */
	message: string;
	/** Requested output volume 0-100 (advisory; Lumia also applies its own playback gain). */
	volume?: number;
}

/**
 * Audio your `synthesizeTts` hook returns for Lumia to play. Provide either raw
 * `audio` bytes (base64) with an optional `mime`, or a ready-to-play `audioUrl`
 * (`data:` / `file://` / `https:`). Returning a bare string is treated as `audio`
 * when it is base64, or as `audioUrl` when it looks like a URL.
 */
export interface PluginTtsSynthesizeResult {
	audio?: string;
	audioUrl?: string;
	mime?: string;
}

/**
 * Declares your plugin as a TTS voice provider. Presence of this object (or
 * `hasTtsVoices: true`) makes the voices returned by your `ttsVoices` hook appear
 * in Lumia's native TTS voice picker, so they work anywhere native TTS runs —
 * alerts, chatbox/event-list read-aloud, the `!tts` command, and TTS actions.
 * Lumia calls your `synthesizeTts` hook to render audio when a viewer triggers one.
 */
export interface PluginTtsVoiceSourceConfig {
	/** Group label shown before your voices in the picker. Defaults to the plugin name. */
	label?: string;
}

export interface PluginIntegrationConfig {
	settings?: PluginSetting[];
	/**
	 * Markdown content or a relative `.md` path resolved at install time.
	 */
	settings_tutorial?: string;
	/**
	 * Markdown content or a relative `.md` path resolved at install time.
	 */
	actions_tutorial?: string;
	/**
	 * Language resource bundles loaded under the plugin namespace in i18next.
	 *
	 * Accepts either:
	 * - a language map object (`{ en: {...}, es: {...} }`)
	 * - a relative `.json` file path resolved from the plugin root at install/load time
	 *
	 * Language-map values can be inline objects or relative `.json` file paths.
	 */
	translations?: PluginTranslations;
	variables?: PluginVariableDefinition[];
	alerts?: PluginAlertDefinition[];
	actions?: PluginActionDefinition[];
	variableFunctions?: PluginVariableFunctionDefinition[];
	lights?: PluginLightsConfig;
	plugs?: PluginPlugsConfig;
	oauth?: PluginOAuthConfig;
	custom_auth_display?: PluginCustomAuthDisplayConfig;
	hasAI?: boolean;
	hasChatbot?: boolean;
	hasHeartrate?: boolean;
	/** Declare the plugin as a song-request source. Prefer `songRequest` for capability details. */
	hasSongRequests?: boolean;
	songRequest?: PluginSongRequestSourceConfig;
	/** Declare the plugin as a TTS voice provider. Prefer `ttsVoiceSource` for details. */
	hasTtsVoices?: boolean;
	ttsVoiceSource?: PluginTtsVoiceSourceConfig;
	modcommandOptions?: PluginModCommandOption[];
	[key: string]: any;
}

export type PluginModCommandOption =
	| "delete"
	| "copy"
	| "translate"
	| "shoutout"
	| "ban"
	| "unban"
	| "timeout"
	| "add-vip"
	| "remove-vip"
	| "add-moderator"
	| "remove-moderator";

export interface PluginModCommandPayload {
	username?: string;
	message: string;
	userToChatAs?: string;
	reason?: string;
	language?: string;
	duration?: number;
}

export interface PluginChatbotHandlerOptions {
	message: string;
	userToChatAs?: string;
	chatAsSelf?: boolean;
	color?: string;
	replyParentMessageId?: string;
	username?: string;
	extraSettings?: Record<string, any>;
}

export interface PluginAIRequestOptions {
	message: string;
	prompt?: string;
	thread?: string;
	model?: string;
	username?: string;
	systemMessage?: string;
	temperature?: number;
	top_p?: number;
	max_tokens?: number;
	keepTrackOfMessages?: boolean;
	limitMessagesForUser?: boolean;
	extraSettings?: Record<string, any>;
}

export interface PluginAIResponse {
	text?: string;
	response?: string;
	message?: string;
	content?: string;
	[key: string]: unknown;
}

export interface PluginAIModelOption {
	value: string;
	name?: string;
}

export interface PluginAIModelsRequestOptions {
	refresh?: boolean;
}

export interface PluginManifest {
	id: string;
	name: string;
	version: string;
	author: string;
	email?: string;
	website?: string;
	repository?: string;
	description: string;
	license: string;
	lumiaVersion: string;
	category: PluginCategory | string;
	icon?: string;
	/**
	 * Markdown content or a relative `.md` path resolved at install time.
	 */
	changelog?: string;
	/**
	 * Optional install-time content bundle (commands/overlays).
	 */
	bundle?: PluginBundleConfig;
	/**
	 * Alias for `bundle`.
	 */
	bundles?: PluginBundleConfig;
	config: PluginIntegrationConfig;
}

export interface PluginFile {
	path: string;
	type: "main" | "icon" | "translation" | "asset" | "config";
	size: number;
	hash: string;
	compressed?: boolean;
}

export interface PluginPackage {
	manifest: PluginManifest;
	files: PluginFile[];
	signature: string;
	checksum: string;
	extractedFiles?: Record<string, string>;
}

export interface PluginStats {
	activations: number;
	errors: number;
	lastError?: Date;
	performanceMetrics?: {
		avgStartupTime: number;
		avgMemoryUsage: number;
		crashCount: number;
	};
}

export interface PluginConfig {
	enabled: boolean;
	autoUpdate: boolean;
	settings?: Record<string, any>;
}

export interface PluginInstance<TPlugin extends PluginRuntime = PluginRuntime> {
	manifest: PluginManifest;
	status: PluginStatus;
	installedAt: Date;
	lastUsed?: Date;
	errorMessage?: string;
	config?: PluginConfig;
	stats?: PluginStats;
	instance?: TPlugin;
	developmentPath?: string;
}

export interface PluginTriggerAlertOptions {
	alert: string;
	dynamic?: { name: string; value: string | number | boolean };
	extraSettings?: Record<string, any>;
	showInEventList?: boolean;
}

export interface PluginDisplayChatOptions {
	/**
	 * Show the message in chat without triggering command parsing.
	 */
	skipCommandProcessing?: boolean;
	username: string;
	displayname?: string;
	message: string;
	avatar?: string;
	color?: string;
	badges?: string[];
	messageId?: string;
	channel?: string;
	userId?: string;
	userLevels?: {
		isSelf?: boolean;
		mod?: boolean;
		vip?: boolean;
		tier3?: boolean;
		tier2?: boolean;
		subscriber?: boolean;
		follower?: boolean;
	};
	/**
	 * Emotes payload.
	 *
	 * Supports:
	 * - Twitch index string (e.g. "25:0-4/1902:6-10")
	 * - Common plugin JSON format:
	 *   [{ id?: string, url?: string, urls?: string[], start: number, end: number }]
	 *   or { emotes: [...] }
	 *
	 * start/end are inclusive character offsets in `message`.
	 */
	emotesRaw?: string;
	isCheer?: boolean;
}

export interface PluginContext {
	plugin: PluginManifest;
	lumia: ILumiaAPI;
}

export interface PluginSharedResourceOptions<T = any> {
	/**
	 * Optional cleanup callback for shared resources.
	 * Runs once when the final plugin reference is released.
	 */
	dispose?: (resource: T) => void | Promise<void>;
}

export interface PluginNobleScanOptions {
	/**
	 * Optional list of service UUID filters. Omit to scan all services.
	 */
	serviceUuids?: string[];
	/**
	 * Whether duplicate discoveries should be emitted continuously.
	 */
	allowDuplicates?: boolean;
}

export interface PluginSharedNobleClient {
	/**
	 * Raw noble module instance.
	 */
	getNoble: () => any;
	/**
	 * Last observed adapter state.
	 */
	getState: () => string;
	/**
	 * Whether the shared runtime is currently scanning.
	 */
	isScanning: () => boolean;
	/**
	 * Wait until adapter state becomes "poweredOn".
	 */
	waitForPoweredOn: (timeoutMs?: number) => Promise<string>;
	/**
	 * Subscribe to discovered peripherals.
	 * Returns an unsubscribe callback.
	 */
	onDiscover: (listener: (peripheral: any) => void) => () => void;
	/**
	 * Subscribe to adapter state changes.
	 * Returns an unsubscribe callback.
	 */
	onStateChange: (listener: (state: string) => void) => () => void;
	/**
	 * Start plugin-scoped scan request against shared noble runtime.
	 */
	startScanning: (options?: PluginNobleScanOptions) => Promise<boolean>;
	/**
	 * Stop this plugin's scan request.
	 */
	stopScanning: () => Promise<boolean>;
}

export interface ILumiaAPI {
	updateConnection: (state: boolean) => Promise<void>;
	getConnectionState: () => boolean;
	getSettings: () => Record<string, any>;
	setSettings: (newSettings: Record<string, any>) => void;
	updateSettings: (updates: Record<string, any>) => void;
	/**
	 * Acquire a host-level shared resource by key.
	 * The first caller should provide a factory; subsequent callers can reuse by key.
	 */
	acquireShared: <T = any>(
		key: string,
		factory?: () => T | Promise<T>,
		options?: PluginSharedResourceOptions<T>,
	) => Promise<T>;
	/**
	 * Release one reference to a shared resource for the current plugin.
	 * Returns true when a reference was released.
	 */
	releaseShared: (key: string) => Promise<boolean>;
	/**
	 * Acquire a shared BLE noble runtime with plugin-scoped listeners and scan controls.
	 */
	acquireSharedNoble: (options?: {
		key?: string;
	}) => Promise<PluginSharedNobleClient>;
	/**
	 * Release one reference to the shared BLE noble runtime.
	 */
	releaseSharedNoble: (options?: { key?: string }) => Promise<boolean>;
	updateActionFieldOptions: (params: {
		actionType: string;
		fieldKey: string;
		options: PluginActionFieldOption[];
	}) => Promise<boolean>;
	updateSettingsFieldOptions: (params: {
		fieldKey: string;
		options: PluginActionFieldOption[];
	}) => Promise<boolean>;
	setVariable: (name: string, value: any) => Promise<void>;
	getVariable: (name: string) => Promise<any>;
	updateHeartRate: (bpm: number) => Promise<void>;
	/** Submit a song request into Lumia's queue from your plugin. */
	addSongRequest: (params: PluginAddSongRequestOptions) => Promise<PluginAddSongRequestResult>;
	/** Report the track your source just started playing, so Lumia's now-playing + variables update. */
	songRequestNowPlaying: (track: PluginSongRequestTrack) => Promise<void>;
	/** Report that a track finished playing. Lumia clears its now-playing and, when it drives your player track-by-track (`supportsQueue: false`), hands you the next queued track via `playSongRequest`. Pass the track id when known. */
	songRequestEnded: (trackId?: string) => Promise<void>;
	/** Report that a single request was removed on your side (denied/withdrawn in your app), so Lumia drops it from its queue too. `requesterUsername` disambiguates duplicate requests for the same track. */
	songRequestRemoved: (params: { trackId: string; requesterUsername?: string }) => Promise<void>;
	/** Report your source's current upcoming queue, so Lumia reconciles its own list. */
	updateSongRequestQueue: (tracks: PluginSongRequestTrack[]) => Promise<void>;
	/** Nudge Lumia to re-pull your `ttsVoices()` list — call after the user sets an API key or your voice list changes. */
	refreshTtsVoices: () => Promise<void>;
	callCommand: (name: string, variableValues?: any) => Promise<any>;
	triggerAlert: (params: PluginTriggerAlertOptions) => Promise<boolean>;
	displayChat: (params: PluginDisplayChatOptions) => void;
	overlaySendCustomContent: (params: {
		layer: string;
		codeId: string;
		content: any;
	}) => Promise<boolean>;
	playAudio: (params: {
		path: string;
		volume?: number;
		waitForAudioToStop?: boolean;
	}) => Promise<boolean>;
	tts: (params: {
		message: string;
		voice?: string;
		volume?: number;
	}) => Promise<boolean>;
	writeFile: (params: {
		path: string;
		message: string;
		append?: boolean;
		value?: string;
	}) => Promise<boolean>;
	readFile: (path: string) => Promise<string | boolean>;
	getAllCommands: (params?: { onlyOn?: boolean }) => Promise<any>;
	sendColor: (params: {
		lights?: Array<{ id: string | number; type: string } | string>;
		color: string | any;
		power?: boolean;
		brightness?: number;
		transition?: number;
	}) => Promise<boolean>;
	getLights: () => Promise<
		Array<{ id: string | number; name?: string; alias?: string; type: string }>
	>;
	showToast: (params: {
		message: string;
		time?: number;
		type?: "info" | "success" | "warning" | "warn" | "error";
	}) => Promise<boolean>;
	/**
	 * Open a SweetAlert input prompt.
	 * Returns { value } on confirm or null if cancelled/failed.
	 */
	prompt: (params: {
		title?: string;
		message?: string;
		inputLabel?: string;
		inputPlaceholder?: string;
		confirmLabel?: string;
		showCancelButton?: boolean;
		inputType?: "text" | "password";
	}) => Promise<{ value: string } | null>;
	log: (
		params:
			| {
					message?: unknown;
					level?: "info" | "warn" | "warning" | "error" | "success" | "debug";
					type?: "info" | "warn" | "warning" | "error" | "success" | "debug";
			  }
			| string
			| number,
		type?: "info" | "warn" | "warning" | "error" | "success" | "debug",
	) => Promise<boolean>;
	dashboardLog: (
		params:
			| {
					message?: unknown;
					level?: "info" | "warn" | "warning" | "error" | "success" | "debug";
					type?: "info" | "warn" | "warning" | "error" | "success" | "debug";
			  }
			| string
			| number,
		type?: "info" | "warn" | "warning" | "error" | "success" | "debug",
	) => Promise<boolean>;
	/** @deprecated Alias of `log`. Use `dashboardLog` for Lumia dashboard log feed entries. */
	addLog?: (
		params:
			| {
					message?: unknown;
					level?: "info" | "warn" | "warning" | "error" | "success" | "debug";
					type?: "info" | "warn" | "warning" | "error" | "success" | "debug";
			  }
			| string
			| number,
		type?: "info" | "warn" | "warning" | "error" | "success" | "debug",
	) => Promise<boolean>;
	chatbot: (params: {
		message: string;
		site?: string | string[];
		color?: string;
		chatAsSelf?: boolean;
	}) => Promise<boolean>;
	refreshOAuthToken: (params: {
		refreshToken: string;
		applicationId?: number;
		secondaryAccount?: boolean;
	}) => Promise<{ accessToken?: string; refreshToken?: string; raw?: any }>;
	integration: {
		getId: () => string;
		getConfig: () => Record<string, any>;
		isConnected: () => boolean;
		isEnabled: () => boolean;
	};
}

export interface PluginRuntime {
	context: PluginContext;
	onload(): Promise<void>;
	onunload(): Promise<void>;
	onupdate?(oldVersion: string, newVersion: string): Promise<void>;
	aiPrompt?(config: PluginAIRequestOptions): Promise<string | PluginAIResponse | void> | string | PluginAIResponse | void;
	aiModels?(
		config?: PluginAIModelsRequestOptions,
	):
		| Promise<Array<PluginAIModelOption | string> | { models?: Array<PluginAIModelOption | string> } | void>
		| Array<PluginAIModelOption | string>
		| { models?: Array<PluginAIModelOption | string> }
		| void;
	chatbot?(config: PluginChatbotHandlerOptions): Promise<boolean | void> | boolean | void;
	modCommand?(type: PluginModCommandOption, value: PluginModCommandPayload): Promise<boolean | void> | boolean | void;
	actions?(config: {
		actions: PluginActionPayload[];
		extraSettings?: Record<string, unknown>;
	}): Promise<PluginActionResult | void> | PluginActionResult | void;
	variableFunction?(
		config: PluginVariableFunctionContext,
	): Promise<string | PluginVariableFunctionResult | undefined>;
	refreshActionOptions?(config: {
		actionType: string;
		values?: Record<string, any>;
		action?: any;
	}): Promise<void>;
	refreshSettingsOptions?(config: {
		fieldKey: string;
		values?: Record<string, any>;
		settings?: Record<string, any>;
	}): Promise<void>;
	generateVariations?(config: {
		alertKey: string;
		options?: Record<string, any>;
		existingVariations?: Array<{
			name?: string;
			condition?: string | number;
			conditionType?: string;
			conditionExtra?: string | number;
		}>;
	}): Promise<PluginGeneratedAlertVariation[] | void> | PluginGeneratedAlertVariation[] | void;
	searchLights?(config?: Record<string, any>): Promise<any>;
	searchThemes?(config?: Record<string, any>): Promise<any>;
	addLight?(config: Record<string, any>): Promise<any>;
	removeLight?(config: Record<string, any>): Promise<any>;
	searchPlugs?(config?: Record<string, any>): Promise<any>;
	addPlug?(config: Record<string, any>): Promise<any>;
	removePlug?(config: Record<string, any>): Promise<any>;
	onCustomAuthDisplaySignal?(config: PluginCustomAuthDisplaySignalRequest): Promise<any>;
	onCustomAuthDisplayClose?(config: PluginCustomAuthDisplayCloseRequest): Promise<void> | void;
	onLightChange?(config: {
		brand: string;
		lights: PluginLight[];
		color?: { r: number; g: number; b: number };
		power?: boolean;
		brightness?: number;
		transition?: number;
		rawConfig?: any;
	}): Promise<void>;
	onPlugChange?(config: {
		brand: string;
		devices: any[];
		state?: boolean;
		rawConfig?: any;
	}): Promise<void>;
	resolveSongRequest?(
		request: PluginSongRequestResolveRequest,
	): Promise<PluginSongRequestTrack | PluginSongRequestResolveResult | null | void> | PluginSongRequestTrack | PluginSongRequestResolveResult | null | void;
	enqueueSongRequest?(track: PluginSongRequestTrack): Promise<void> | void;
	removeSongRequest?(track: PluginSongRequestTrack): Promise<void> | void;
	playSongRequest?(track: PluginSongRequestTrack): Promise<void> | void;
	skipSongRequest?(): Promise<void> | void;
	pauseSongRequest?(): Promise<void> | void;
	resumeSongRequest?(): Promise<void> | void;
	setSongRequestVolume?(volume: number): Promise<void> | void;
	clearSongRequestQueue?(): Promise<void> | void;
	ttsVoices?(
		config?: PluginTtsVoicesRequestOptions,
	):
		| Promise<PluginTtsVoice[] | { voices?: PluginTtsVoice[] } | void>
		| PluginTtsVoice[]
		| { voices?: PluginTtsVoice[] }
		| void;
	synthesizeTts?(
		request: PluginTtsSynthesizeRequest,
	): Promise<PluginTtsSynthesizeResult | string | void> | PluginTtsSynthesizeResult | string | void;
	settings: Record<string, any>;
	onsettingsupdate?(
		settings: Record<string, any>,
		previousSettings: Record<string, any>,
	): Promise<void> | void;
}

/**
 * Plugin Form configuration used by the SDK helper UIs.
 */
export interface PluginFormField {
	key: string;
	label: string;
	type: PluginSettingFieldType;
	placeholder?: string;
	helperText?: string;
	required?: boolean;
	defaultValue?: any;
	rows?: number;
	section?: string;
	sectionOrder?: number;
	group?: string | PluginSettingGroupConfig;
	min?: number;
	max?: number;
	step?: number;
	validation?: {
		pattern?: string;
		min?: number;
		max?: number;
		maxLength?: number;
		minLength?: number;
		custom?: string;
	};
	options?: Array<{ id?: string; label: string; value: any }>;
	multiple?: boolean;
	lookup?: boolean;
	dynamicOptions?: boolean;
	refreshOnChange?: boolean;
	disabled?: boolean;
	hidden?: boolean;
	visibleIf?: PluginVisibleIfCondition;
	visible?: boolean;
	valueType?: PluginNamedMapValueType;
	nameKey?: string;
	valueKey?: string;
	valueLabel?: string;
	valuePlaceholder?: string;
	valueDefault?: unknown;
	valueField?: PluginNamedMapValueFieldConfig;
	allowDuplicateNames?: boolean;
	outputMode?: PluginNamedMapOutputMode;
	objectValueMode?: PluginNamedMapObjectValueMode;
	includeNameInObjectValue?: boolean;
}

export interface PluginLight {
	id: string;
	name?: string;
	alias?: string;
	[key: string]: any;
}

export interface PluginLightDisplayField {
	key: string;
	label: string;
	fallback?: string;
}

export interface PluginAuthValidationResult {
	ok: boolean;
	message?: string;
}

export type PluginAuthValidationResponse =
	| boolean
	| PluginAuthValidationResult
	| string;

export interface PluginLightSearchConfig {
	label?: string;
	helperText?: string;
	buttonLabel?: string;
}

export interface PluginLightManualAddConfig {
	fields: PluginFormField[];
	buttonLabel?: string;
	helperText?: string;
}

export interface PluginLightsConfig {
	search?: PluginLightSearchConfig;
	manualAdd?: PluginLightManualAddConfig;
	displayFields?: PluginLightDisplayField[];
	emptyStateText?: string;
}

export interface PluginPlugDisplayField {
	key: string;
	label: string;
	fallback?: string;
}

export interface PluginPlugSearchConfig {
	label?: string;
	helperText?: string;
	buttonLabel?: string;
}

export interface PluginPlugManualAddConfig {
	fields: PluginFormField[];
	buttonLabel?: string;
	helperText?: string;
}

export interface PluginPlugsConfig {
	search?: PluginPlugSearchConfig;
	manualAdd?: PluginPlugManualAddConfig;
	displayFields?: PluginPlugDisplayField[];
	emptyStateText?: string;
}

export interface PluginAuthConfig {
	title?: string;
	description?: string;
	fields: PluginFormField[];
	testConnection?: {
		enabled: boolean;
		label?: string;
		loadingText?: string;
		successMessage?: string;
		errorMessage?: string;
	};
	buttons?: {
		save?: { label: string; variant?: "primary" | "secondary" };
		cancel?: { label: string; variant?: "primary" | "secondary" };
		test?: { label: string; variant?: "primary" | "secondary" };
	};
	validationRules?: Record<string, (value: any) => string | null>;
}

export interface PluginActionsConfig {
	title?: string;
	description?: string;
	actionTypes: Array<{
		type: string;
		label: string;
		description?: string;
		icon?: string;
		fields: PluginFormField[];
		preview?: boolean;
	}>;
	defaults?: {
		type: string;
		data?: any;
	};
	maxActions?: number;
	grouped?: boolean;
	allowReorder?: boolean;
	validation?: {
		requireAtLeastOne?: boolean;
		custom?: string;
	};
}
