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
	LIGHTS = "lights",
	SWITCH = "switch",
	DECK = "deck",
	PROTOCOLS = "protocols",
	KEYLIGHT = "keylight",
	DEVICES = "devices",
}

export interface PluginVariableDefinition {
	name: string;
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

export interface PluginAlertDefinition {
	title: string;
	key: string;
	acceptedVariables?: string[];
	defaultMessage?: string;
	variationConditions?: PluginAlertVariationCondition[];
}

export interface PluginDependency {
	id: string;
	version?: string;
	optional?: boolean;
}

export interface PluginSetting {
	key: string;
	label: string;
	type:
		| "text"
		| "number"
		| "text_list"
		| "select"
		| "checkbox"
		| "slider"
		| "file"
		| "password"
		| "toggle"
		| "textarea"
		| "email"
		| "url"
		| "color";
	placeholder?: string;
	helperText?: string;
	required?: boolean;
	options?: Array<{ label: string; value: string | number | boolean }>;
	allowTyping?: boolean;
	rows?: number;
	defaultValue?: string | number | boolean | string[];
	disabled?: boolean;
	validation?: {
		pattern?: string;
		min?: number;
		max?: number;
		minLength?: number;
		maxLength?: number;
	};
}

export interface PluginActionField {
	key: string;
	label: string;
	type:
		| "text"
		| "number"
		| "select"
		| "checkbox"
		| "switch"
		| "slider"
		| "file"
		| "email"
		| "url"
		| "password"
		| "textarea"
		| "color";
	placeholder?: string;
	helperText?: string;
	required?: boolean;
	options?: PluginActionFieldOption[];
	min?: number;
	max?: number;
	step?: number;
	rows?: number;
	allowTyping?: boolean;
	defaultValue?: any;
	/**
	 * When true, changing this field triggers refreshActionOptions in the UI.
	 */
	refreshOnChange?: boolean;
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
	fields: PluginActionField[];
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

export interface PluginIntegrationConfig {
	settings?: PluginSetting[];
	settings_tutorial?: string;
	actions_tutorial?: string;
	variables?: PluginVariableDefinition[];
	alerts?: PluginAlertDefinition[];
	actions?: PluginActionDefinition[];
	lights?: PluginLightsConfig;
	oauth?: PluginOAuthConfig;
	[key: string]: any;
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
	changelog?: string;
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
	username: string;
	displayname?: string;
	message: string;
	avatar?: string;
	color?: string;
	badges?: string[];
	messageId?: string;
	channel?: string;
	user?: {
		isSelf?: boolean;
		broadcaster?: boolean;
		mod?: boolean;
		vip?: boolean;
		subscriber?: boolean;
		member?: boolean;
		tier1?: boolean;
		tier2?: boolean;
		tier3?: boolean;
		follower?: boolean;
		regular?: boolean;
		badges?: Record<string, any> | string[];
		userId?: string;
	};
	emotesRaw?: string;
	emotesPack?: Record<string, any> | any[];
	isCheer?: boolean;
	extraInfo?: Record<string, any>;
}

export interface PluginContext {
	plugin: PluginManifest;
	lumia: ILumiaAPI;
}

export interface ILumiaAPI {
	updateConnection: (state: boolean) => Promise<void>;
	getConnectionState: () => boolean;
	getSettings: () => Record<string, any>;
	setSettings: (newSettings: Record<string, any>) => void;
	updateSettings: (updates: Record<string, any>) => void;
	updateActionFieldOptions: (params: { actionType: string; fieldKey: string; options: PluginActionFieldOption[] }) => Promise<boolean>;
	setVariable: (name: string, value: any) => Promise<void>;
	getVariable: (name: string) => any;
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
		lights?: string[];
		color: string | any;
		power?: boolean;
		brightness?: number;
		transition?: number;
	}) => Promise<boolean>;
	getLights: () => Promise<any>;
	showToast: (params: { message: string; time?: number }) => Promise<boolean>;
	addLog: (message: string) => Promise<boolean>;
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
	actions?(config: { actions: any[]; extraSettings?: any }): Promise<void>;
	refreshActionOptions?(config: { actionType: string; values?: Record<string, any>; action?: any }): Promise<void>;
	searchLights?(config?: Record<string, any>): Promise<any>;
	addLight?(config: Record<string, any>): Promise<any>;
	onLightChange?(config: {
		brand: string;
		lights: PluginLight[];
		color?: { r: number; g: number; b: number };
		power?: boolean;
		brightness?: number;
		transition?: number;
		rawConfig?: any;
	}): Promise<void>;
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
	type:
		| "text"
		| "password"
		| "number"
		| "email"
		| "url"
		| "textarea"
		| "select"
		| "checkbox"
		| "toggle"
		| "color"
		| "slider"
		| "file";
	placeholder?: string;
	helperText?: string;
	required?: boolean;
	defaultValue?: any;
	rows?: number;
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
	options?: Array<{ label: string; value: any }>;
	disabled?: boolean;
	visible?: boolean;
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
