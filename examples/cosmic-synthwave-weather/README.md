# Cosmic Synthwave Weather

A sample Lumia Stream plugin bundled with the SDK examples. It demonstrates how to require multiple npm packages from inside a plugin:

- [`axios`](https://www.npmjs.com/package/axios) for HTTP requests
- [`luxon`](https://www.npmjs.com/package/luxon) for time formatting
- [`color`](https://www.npmjs.com/package/color) for palette generation
- [`unique-names-generator`](https://www.npmjs.com/package/unique-names-generator) for playful AI-like verbiage

The plugin fetches live weather data from the free [Open-Meteo](https://open-meteo.com/) APIs, remixes the response with synthwave-inspired copy, and emits a Lumia alert packed with neon-friendly metadata.

## Getting Started

```bash
cd plugins/examples/cosmic-synthwave-weather
npm install
zip -r cosmic-synthwave-weather.lumiaplugin .
```

Install the resulting `cosmic-synthwave-weather.lumiaplugin` with the Lumia Stream plugin manager. After installation, open the **Cosmic Synthwave Weather** connection, enter a city, and optionally enable the recurring interval.

Trigger the included "Trigger Forecast" action to broadcast a fresh neon forecast on demand.

## Notes

- The example intentionally keeps dependencies unbundled so the runtime can exercise nested `node_modules/` lookups.
- No API key is required—the sample uses the open endpoints for geocoding and current conditions.
- Feel free to swap dependencies or enhance the visuals to experiment with the plugin sandbox.
