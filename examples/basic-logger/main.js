const { Plugin } = require('@lumiastream/plugin-sdk');

class BasicLoggerPlugin extends Plugin {
  async onload() {
    await this.lumia.addLog('[basic-logger] Plugin loaded');
  }

  async onunload() {
    await this.lumia.addLog('[basic-logger] Plugin unloaded');
  }

  async actions(config = {}) {
    const actions = Array.isArray(config.actions) ? config.actions : [];
    for (const action of actions) {
      if (action.type === 'log_message') {
        const message = action.data?.message || 'Hello from Basic Logger';
        await this.lumia.addLog(`[basic-logger] ${message}`);
      }
    }
  }
}

module.exports = BasicLoggerPlugin;
