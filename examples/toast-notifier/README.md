# Toast Notifier Plugin (Example)

Demonstrates how to read plugin settings and use action payloads to show toast notifications inside Lumia Stream.

## Settings

- `defaultMessage` – fallback message when an action does not provide one.
- `displayTime` – default toast duration in milliseconds.

## Actions

- **show_toast** – optionally override the message or duration when triggering the action. The plugin falls back to the saved settings otherwise.

## Usage

1. Copy the plugin directory and enable it in Lumia Stream.
2. Configure the default toast message/duration in the plugin settings panel.
3. Trigger the **Show Toast** action to see the toast and log output.

MIT License
