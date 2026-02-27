import {
  type PluginManifest,
  type PluginContext,
  type ILumiaAPI,
  type PluginDisplayChatOptions,
  type PluginAuthValidationResponse,
  type PluginActionPayload,
  type PluginAIRequestOptions,
  type PluginAIResponse,
  type PluginAIModelsRequestOptions,
  type PluginAIModelOption,
  type PluginModCommandOption,
  type PluginModCommandPayload,
  type PluginChatterProfileUrlPayload,
} from './types';

/**
 * Base Plugin Class - every Lumia Stream plugin should extend this class.
 */
export abstract class Plugin {
  public readonly context: PluginContext;

  constructor(_manifest: PluginManifest, context: PluginContext) {
    this.context = context;
  }

  /**
   * Called when the plugin is first loaded or enabled.
   */
  abstract onload(): Promise<void>;

  /**
   * Called when the plugin is unloaded or disabled.
   */
  abstract onunload(): Promise<void>;

  /**
   * Called when Lumia upgrades the plugin to a new version.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onupdate(_oldVersion: string, _newVersion: string): Promise<void> {}

  /**
   * Handle custom actions triggered from the UI or Lumia automations.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async actions(_config: { actions: PluginActionPayload[]; extraSettings?: Record<string, unknown> }): Promise<void> {}

  /**
   * Optional AI prompt handler used when `config.hasAI` is enabled.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async aiPrompt(_config: PluginAIRequestOptions): Promise<string | PluginAIResponse | void> {}

  /**
   * Optional AI model list handler used when `config.hasAI` is enabled.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async aiModels(
    _config?: PluginAIModelsRequestOptions,
  ): Promise<Array<PluginAIModelOption | string> | { models?: Array<PluginAIModelOption | string> } | void> {
    return [];
  }

  /**
   * Handle dashboard/API moderation commands when declared in manifest config.modcommandOptions.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async modCommand(_type: PluginModCommandOption, _value: PluginModCommandPayload): Promise<boolean | void> {}

  /**
   * Resolve a chatter profile URL when manifest config.modcommandOptions includes "profile".
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async chatterProfileUrl(_value: PluginChatterProfileUrlPayload): Promise<string | { url?: string; profileUrl?: string; href?: string; link?: string } | void> {}

  /**
   * Refresh dynamic action field options in the UI.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async refreshActionOptions(_config: { actionType: string; values?: Record<string, any>; action?: any }): Promise<void> {}

  /**
   * Refresh dynamic settings field options in the PluginAuth UI.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async refreshSettingsOptions(_config: { fieldKey: string; values?: Record<string, any>; settings?: Record<string, any> }): Promise<void> {}

  /**
   * Invoked whenever plugin settings are changed.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onsettingsupdate(
    _settings: Record<string, any>,
    _previousSettings: Record<string, any>,
  ): Promise<void> {}

  get settings(): Record<string, any> {
    return (this.context?.lumia?.getSettings?.() as Record<string, any>) ?? {};
  }

  set settings(value: Record<string, any>) {
    if (this.context?.lumia?.setSettings) {
      this.context.lumia.setSettings(value);
    }
  }

  updateSettings(updates: Record<string, any>): void {
    if (this.context?.lumia?.updateSettings) {
      this.context.lumia.updateSettings(updates);
    }
  }

  get manifest(): PluginManifest {
    return this.context.plugin;
  }

  get lumia(): ILumiaAPI {
    return this.context.lumia;
  }

  displayChat(options: PluginDisplayChatOptions): void {
    this.lumia.displayChat(options);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async validateAuth(_data: any): Promise<PluginAuthValidationResponse> {
    return true;
  }

  async refreshAuth<TData>(data: TData): Promise<TData> {
    return data;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async searchLights(_query?: Record<string, any>): Promise<any> {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async searchThemes(_query?: Record<string, any>): Promise<any> {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async addLight(_data: Record<string, any>): Promise<any> {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async removeLight(_data: Record<string, any>): Promise<any> {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async searchPlugs(_query?: Record<string, any>): Promise<any> {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async addPlug(_data: Record<string, any>): Promise<any> {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async removePlug(_data: Record<string, any>): Promise<any> {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onLightChange(_config: {
    brand: string;
    lights: any[];
    color?: { r: number; g: number; b: number };
    power?: boolean;
    brightness?: number;
    transition?: number;
    rawConfig?: any;
  }): Promise<void> {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onPlugChange(_config: {
    brand: string;
    devices: any[];
    state?: boolean;
    rawConfig?: any;
  }): Promise<void> {
    return;
  }
}

export default Plugin;
