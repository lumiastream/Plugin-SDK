import {
  type PluginManifest,
  type PluginContext,
  type ILumiaAPI,
  type PluginDisplayChatOptions,
  type PluginAuthValidationResponse,
  type PluginActionPayload,
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
   * Refresh dynamic action field options in the UI.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async refreshActionOptions(_config: { actionType: string; values?: Record<string, any>; action?: any }): Promise<void> {}

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
}

export default Plugin;
