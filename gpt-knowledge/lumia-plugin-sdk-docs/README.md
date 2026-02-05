# Lumia Stream Plugin SDK

Official TypeScript/JavaScript SDK for developing plugins for [Lumia Stream](https://lumiastream.com).

![Lumia Stream Plugin](docs/lumiaplugin-banner.png)

## Installation

```bash
npm install @lumiastream/plugin
```

## Usage

```ts
import {
	Plugin,
	type PluginManifest,
	type PluginContext,
} from "@lumiastream/plugin";

export default class MyPlugin extends Plugin {
	constructor(manifest: PluginManifest, context: PluginContext) {
		super(manifest, context);
	}

	async onload(): Promise<void> {
		// Plugin loaded
	}

	async onunload(): Promise<void> {
		// Plugin unloaded
	}
}
```

## Plugin Manifest

Every plugin requires a `manifest.json` file that describes your plugin, its metadata, and configuration:

```json
{
	"id": "my_awesome_plugin",
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
await this.lumia.triggerAlert({
	alert: "follow",
	extraSettings: { username: "StreamerFan" },
	showInEventList: true,
});
await this.lumia.playAudio({ path: "alert.mp3", volume: 0.7 });
this.lumia.setVariable("follower_count", 1337);
this.lumia.displayChat({
	username: "Viewer123",
	message: "Hello from the plugin!",
});
```

See the [API reference](./docs/api-reference.md) for the full surface area.

## Scripts

- `npm run build` – compile the SDK to the `dist` folder.
- `npm run lint` – type-check the source without emitting output.

## CLI Helpers

The CLI is distributed separately via `lumia-plugin`. Use it with `npx` (requires npm 7+).

- `npx lumia-plugin create my_plugin` scaffold a feature-rich sample plugin showing settings, actions, variables, and alerts
- `npx lumia-plugin validate ./path/to/plugin` check `manifest.json`, entry files, and config for common mistakes
- `npx lumia-plugin build ./path/to/plugin --out ./plugin.lumiaplugin` bundle the directory into a distributable archive

## Documentation

- [Getting Started](./docs/getting-started.md)
- [API Reference](./docs/api-reference.md)
- [Manifest Guide](./docs/manifest-guide.md)
- [Field Types Reference](./docs/field-types-reference.md)

## Examples

- `examples/rumble` – Plain JavaScript Rumble livestream plugin that polls the API, updates variables, and fires alerts.
<!-- TODO: add more from examples -->

## License

The SDK is released under the MIT License. See [LICENSE](./LICENSE) for details.
