### Settings Field Showcase

This example includes every supported settings field type:

- `text`
- `datetime`
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
- `named_map`

It also demonstrates field metadata:

- `hidden`
- `disabled`
- `section`
- `sectionOrder`
- `group` (object and string forms)
- `rows`
- `visibleIf`
- `validation`
- `dynamicOptions`
- `lookup`
- `refreshOnChange`

OAuth example included:

- `config.oauth.serviceUrl` override
- `config.oauth.extraParams`
- custom `config.oauth.tokenKeys` mapping to:
  - `oauthAccessToken`
  - `oauthRefreshToken`
  - `oauthTokenSecret`

When you save settings, the plugin:

- logs each value
- updates `save_count`, `last_saved_at`, and `last_saved_values_json`

Additional real-world examples included:

- sports-style dynamic team selection (`leagueField` + `teamLookupField`)
- named key/value mapping for channel or target aliases (`namedMapField`)
