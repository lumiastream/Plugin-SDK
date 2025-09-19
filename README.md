# Lumia Stream Plugin SDK

Official TypeScript/JavaScript SDK for developing plugins for [Lumia Stream](https://lumiastream.com).

## Installation

```bash
npm install @lumiastream/plugin-sdk
```

## Usage

```ts
import { Plugin, type PluginManifest, type PluginContext } from '@lumiastream/plugin-sdk';

export default class MyPlugin extends Plugin {
  constructor(manifest: PluginManifest, context: PluginContext) {
    super(manifest, context);
  }

  async onload(): Promise<void> {
    this.lumia.addLog('Plugin loaded successfully!');
  }

  async onunload(): Promise<void> {
    this.lumia.addLog('Plugin unloaded');
  }
}
```

## Plugin Manifest

Every plugin requires a `manifest.json` file that describes your plugin, its metadata, and configuration:

```json
{
  "id": "my-awesome-plugin",
  "name": "My Awesome Plugin",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "A brief description of what your plugin does",
  "lumiaVersion": "^9.0.0",
  "category": "utilities",
  "config": {
    "settings": [
      {
        "key": "apiKey",
        "label": "API Key",
        "type": "text",
        "required": true
      }
    ]
  }
}
```

## Lifecycle Hooks

- `onload()` – invoked when the plugin is enabled inside Lumia Stream.
- `onunload()` – called when your plugin is disabled or unloaded.
- `onupdate(oldVersion, newVersion)` – triggered after version upgrades.
- `onsettingsupdate(settings, previousSettings)` – called whenever settings change.
- `actions(config)` – handle custom actions invoked from Lumia automations.

## Lumia API Highlights

Interact with Lumia Stream using the strongly typed `ILumiaAPI` helper on the plugin context:

```ts
await this.lumia.triggerAlert({ alert: 'follow', extraSettings: { username: 'StreamerFan' } });
await this.lumia.playAudio({ path: 'alert.mp3', volume: 0.7 });
this.lumia.setVariable('follower_count', 1337);
```

See the [API reference](./docs/api-reference.md) for the full surface area.

## Scripts

- `npm run build` – compile the SDK to the `dist` folder.
- `npm run lint` – type-check the source without emitting output.

## CLI Helpers

Run these utilities with `npm run <script> -- [options]` from the SDK repo.

- `npm run create:plugin -- ./my-plugin` scaffold a fresh plugin folder with `manifest.json`, `main.js`, and README
- `npx create-lumiastream-plugin my-plugin` same scaffold without cloning the repo (requires npm 7+)
- `npm run validate:plugin -- ./path/to/plugin` check `manifest.json` and core files for common mistakes
- `npm run build:plugin -- ./path/to/plugin --out ./dist` bundle the directory into a distributable `.lumiaplugin` archive

## Documentation

- [Getting Started](./docs/getting-started.md)
- [API Reference](./docs/api-reference.md)
- [Manifest Guide](./docs/manifest-guide.md)

## Examples

- `examples/basic-logger` – Smallest possible plugin: logs lifecycle events and handles a single action.
- `examples/toast-notifier` – Demonstrates settings + actions to trigger Lumia toast notifications.
- `examples/variable-counter` – Shows how to persist state via Lumia variables and support multiple actions.
- `examples/rumble` – Plain JavaScript Rumble livestream plugin that polls the API, updates variables, and fires alerts.

## License

The SDK is released under the MIT License. See [LICENSE](./LICENSE) for details.
