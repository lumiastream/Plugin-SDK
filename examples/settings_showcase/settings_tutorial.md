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

Custom auth display example included:

- `config.custom_auth_display` with:
  - `entry: ./auth/setup-wizard.html`
  - `autoAutoOpen`
  - `authButtonLabel`
  - `title`
- runtime hooks:
  - `onCustomAuthDisplaySignal(config)`
  - `onCustomAuthDisplayClose(config)`

When you save settings, the plugin:

- logs each value
- updates `save_count`, `last_saved_at`, and `last_saved_values_json`

Action return example included:

- `passVariablesExample` demonstrates `actions()` returning:
  - `newlyPassedVariables`
  - optional `shouldStop`
- returned variables are plugin-prefixed and can be used by later actions in the same command:
  - `{{settings_showcase_action_message}}`
  - `{{settings_showcase_action_status}}`
  - `{{settings_showcase_action_save_count}}`
  - `{{settings_showcase_action_snapshot}}`

Additional real-world examples included:

- sports-style dynamic team selection (`leagueField` + `teamLookupField`)
- named key/value mapping for channel or target aliases (`namedMapField`)

Tab layout is intentionally split into focused sections:

- `Text & Numbers`
- `Selections`
- `Booleans & Sliders`
- `Visibility & Layout`
- `Specialized Inputs`
- `Dynamic Lookup`
- `Structured Data`
- `ROI`
- `OAuth Example`

### Embedded Media Examples In `settings_tutorial`

This section demonstrates embedding rich media in PluginAuth setup docs, using the same pattern as `local_tuya` (plain markdown + inline HTML).

#### Embedded Image (local plugin asset)

![Settings Showcase Preview](./settings_showcase.png)

#### Embedded Audio

<audio controls preload="none" src="https://www.w3schools.com/html/horse.mp3">
  Your browser does not support the audio element.
</audio>

Audio fallback link: https://www.w3schools.com/html/horse.mp3

#### Embedded Video (MP4)

<video controls preload="none" width="560">
  <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
  Your browser does not support the video tag.
</video>

Video fallback link: https://www.w3schools.com/html/mov_bbb.mp4

#### Embedded YouTube Video

<iframe src="https://www.youtube-nocookie.com/embed/VCd0kYWLvMQ" title="Lumia Plugin Media Embed Example" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

YouTube fallback link: https://www.youtube.com/watch?v=VCd0kYWLvMQ
