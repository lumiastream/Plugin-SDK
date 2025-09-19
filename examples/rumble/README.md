# Rumble Livestream Plugin (Example)

A minimal Lumia Stream plugin that polls the Rumble livestream API, updates Lumia variables, and fires alerts when your stream starts, ends, or sees large viewer swings.

The example is written in plain JavaScript so you can copy the files directly into `~/Documents/LumiaStream/Plugins/<your-plugin-id>` (or use **Load from Directory** inside Lumia Stream) without running a build step.

## Files

```
examples/rumble/
├── assets/                 # Icon and screenshot assets referenced by the manifest
├── main.js                 # Plugin implementation (CommonJS module)
├── manifest.json           # Plugin metadata and configuration definition
├── package.json            # Optional: declares the SDK dependency when you `npm install`
└── README.md
```

## Quick Copy/Paste Instructions

1. Create a new folder for your plugin (for example `~/Documents/LumiaStream/Plugins/rumble`).
2. Copy `manifest.json`, `main.js`, and the `assets/` directory from this example into that folder.
3. (Optional) copy `package.json` if you want to track dependencies – then run `npm install` to pull in `@lumiastream/plugin-sdk`.
4. Launch Lumia Stream and load the plugin from the directory (or restart if you copied into the plugins folder).
5. Open the plugin settings and paste your Rumble livestream API key. A valid key looks like `https://rumble.com/-livestream-api/get-data?key=YOUR_KEY` (copy the value after `key=`).

The plugin will begin polling every 30 seconds by default and will log activity in the Lumia console.

## Highlights

- Uses the `@lumiastream/plugin-sdk` runtime `Plugin` base class
- Keeps three variables in sync: `rumble_live`, `rumble_viewers`, `rumble_title`
- Raises alerts for stream start, stream end, and big viewer-count deltas
- Demonstrates manual actions (`manual_poll`, `manual_alert`) that can be triggered from the Lumia UI

## Customising

- Adjust the `VIEWER_MILESTONES` array in `main.js` to celebrate your own thresholds.
- Change the polling cadence via the `pollInterval` setting (10–300 seconds). The plugin normalises milliseconds as well.
- Extend the alert payloads by editing `handleStreamStart`, `handleStreamEnd`, or `checkViewerChanges`.

## TypeScript Version?

If you prefer TypeScript, start from this JavaScript version and rename `main.js` to `main.ts`. Add a local `tsconfig.json` such as:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "."
  },
  "include": ["main.ts"]
}
```

Compile with `npx tsc` and point `manifest.json` at the emitted `dist/main.js` file (or copy the compiled file into the plugin root). Keeping the TypeScript config beside the file avoids any `../../tsconfig.json` references, so the project still copies cleanly.

MIT License
