# RSS Feed Monitor

Monitor multiple RSS or Atom feeds and trigger a Lumia alert for each newly discovered item. This plugin is alert-only and does not publish Lumia variables.

## Alert Variations

The `Feed Item Changed` alert supports feed-name variations. In Lumia's alert editor, add a variation with the selection condition and pick one of the configured feed names from the dropdown.

## Feed Format

Add one named feed row in the plugin settings for each source:

- `Name`: the label used in alerts and variables
- `Feed URL`: the RSS or Atom endpoint

Older string-based formats are still accepted by the runtime for backward compatibility, but the UI now uses the native `named_map` field.

## Persistence

Seen item state and pending alerts are stored in:

```text
~/Library/Application Support/LumiaStream/plugin-cache/rss_feed_monitor/state.json
```

That lets the plugin replay missed alerts after Lumia has been offline.
