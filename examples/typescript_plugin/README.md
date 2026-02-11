# TypeScript Plugin Example

This example shows a full Lumia Stream plugin workflow in TypeScript.

## What This Example Demonstrates

- Typed plugin lifecycle methods (`onload`, `onunload`, `onsettingsupdate`, `actions`)
- Typed settings and action payload parsing
- Variable updates (`last_username`, `last_message`, `last_heartbeat`)
- Triggering a Lumia alert from an action

## Project Layout

- `manifest.json` plugin metadata and UI config
- `src/main.ts` plugin implementation in TypeScript
- `tsconfig.json` TypeScript compiler setup
- `package.json` install/build/validate/package scripts

## Setup

```bash
cd examples/typescript_plugin
npm install
npm run build
npm run validate
```

After `npm run build`, the runtime entrypoint is `dist/main.js` (defined by `manifest.main`).
If you copy this example outside this SDK repo, use `npx lumia-plugin validate .` instead.

## How It Works

- On load, the plugin syncs default values to variables and starts a heartbeat timer.
- The heartbeat updates `last_heartbeat` on an interval configured in settings.
- The `send_sample_alert` action accepts optional `username`/`message` overrides.
- Each action run updates variables and triggers `ts_sample_alert`.

## Package For Distribution

```bash
npm run package
```

This runs TypeScript compilation and then builds a `.lumiaplugin` archive with the local CLI script.
If you copy this example outside this SDK repo, use `npx lumia-plugin build .` instead.
