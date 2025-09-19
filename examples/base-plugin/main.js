const { Plugin } = require('@lumiastream/plugin-sdk');

class BasePluginTemplate extends Plugin {
  async onload() {
    await this.lumia.addLog('[base-plugin] Template plugin loaded');
  }

  async onunload() {
    await this.lumia.addLog('[base-plugin] Template plugin unloaded');
  }

  async actions(config = {}) {
    const actions = Array.isArray(config.actions) ? config.actions : [];
    for (const action of actions) {
      if (action.type === 'example_action') {
        const message = action.data?.message || 'Hello from Base Plugin';
        await this.lumia.addLog(`[base-plugin] ${message}`);
      }
    }
  }
}

module.exports = BasePluginTemplate;
