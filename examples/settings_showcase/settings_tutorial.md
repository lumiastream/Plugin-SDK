### Settings Field Showcase

This example includes every supported settings field type:

- `text`
- `number`
- `select`
- `select` with `multiple: true`
- `allowTyping` on `select` for freeform values
- `checkbox`
- `slider`
- `file`
- `password`
- `toggle`
- `textarea`
- `email`
- `url`
- `color`
- `json`
- `roi`

It also demonstrates field metadata:

- `hidden`
- `section`
- `sectionOrder`
- `group` (object and string forms)
- `rows`
- `visibleIf`

When you save settings, the plugin:

- logs each value
- shows toast notifications
- updates `save_count`, `last_saved_at`, and `last_saved_values_json`
