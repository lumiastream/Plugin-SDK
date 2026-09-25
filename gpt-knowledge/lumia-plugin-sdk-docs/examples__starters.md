# Lumia Plugin Examples: Starter Templates

Use these examples for: Start here: the `npx lumia-plugin create` template, a TypeScript build setup, and a reference plugin covering every settings field type, OAuth, and a custom auth display.

## Index

| Example | What it does | Shows | Field types |
| --- | --- | --- | --- |
| `base_plugin` (Showcase Plugin) | Starter template that demonstrates settings, actions, variables, and alerts with a minimal code path. | actions, alerts, variables, translations, settings tutorial, actions tutorial | color, number, text |
| `settings_showcase` (Settings Showcase) | Example plugin demonstrating every available settings field type with logging on save. | OAuth, custom auth display, actions, variables, translations, settings tutorial | checkbox, color, datetime, email, file, json, named_map, number, password, roi, select, slider, text, textarea, toggle, url |
| `typescript_plugin` (TypeScript Plugin Example) | Example TypeScript plugin that shows typed settings, actions, variables, and alerts. | TypeScript, actions, alerts, variables, translations | number, text |

## Example: base_plugin

Source folder `examples/base_plugin`, category `apps`. Starter template that demonstrates settings, actions, variables, and alerts with a minimal code path.

### base_plugin/manifest.json

```json
{
	"id": "showcase_plugin",
	"name": "Showcase Plugin",
	"version": "1.0.2",
	"author": "Lumia Stream",
	"email": "",
	"website": "",
	"repository": "",
	"description": "Starter template that demonstrates settings, actions, variables, and alerts with a minimal code path.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "apps",
	"keywords": "sample, demo, lumia, showcase, template",
	"icon": "",
	"changelog": "",
	"config": {
		"settings": [
			{
				"key": "defaultMessage",
				"label": "Default Message",
				"type": "text",
				"defaultValue": "Hello from Showcase Plugin!",
				"helperText": "Used when the action does not supply a message."
			},
			{
				"key": "defaultColor",
				"label": "Default Color",
				"type": "color",
				"defaultValue": "#00c2ff",
				"helperText": "Used when the action does not supply a color."
			},
			{
				"key": "defaultDuration",
				"label": "Default Duration (seconds)",
				"type": "number",
				"defaultValue": 5,
				"min": 1,
				"max": 60,
				"helperText": "Used when the action does not supply a duration."
			}
		],
		"settings_tutorial": "./settings_tutorial.md",
		"actions_tutorial": "./actions_tutorial.md",
		"actions": [
			{
				"type": "trigger_alert",
				"label": "Trigger Sample Alert",
				"description": "Trigger the sample alert with optional overrides.",
				"fields": [
					{
						"key": "username",
						"label": "Username",
						"type": "text",
						"defaultValue": "Viewer"
					},
					{
						"key": "message",
						"label": "Message",
						"type": "text",
						"defaultValue": "Hello from Showcase Plugin!"
					},
					{
						"key": "color",
						"label": "Color",
						"type": "color",
						"defaultValue": "#00c2ff"
					},
					{
						"key": "duration",
						"label": "Duration (seconds)",
						"type": "number",
						"defaultValue": 5,
						"min": 1,
						"max": 60
					}
				]
			}
		],
		"variables": [
			{
				"name": "message",
				"description": "Stores the most recent message handled by the plugin.",
				"value": ""
			},
			{
				"name": "username",
				"description": "Stores the most recent username handled by the plugin.",
				"value": ""
			},
			{
				"name": "color",
				"description": "Tracks the color used by the latest sample alert.",
				"value": ""
			},
			{
				"name": "duration",
				"description": "Tracks the duration used by the latest sample alert.",
				"value": 0
			}
		],
		"alerts": [
			{
				"title": "Sample Alert",
				"key": "sample_alert",
				"acceptedVariables": [
					"message",
					"username",
					"color",
					"duration"
				],
				"defaultMessage": "{{username}}: {{message}}",
				"variationConditions": [
					{
						"type": "EQUAL_SELECTION",
						"description": "Matches dynamic.value against the selected color.",
						"selections": [
							{
								"label": "Blue",
								"value": "#00c2ff"
							},
							{
								"label": "Red",
								"value": "#ff5f5f"
							}
						]
					}
				]
			}
		],
		"translations": "./translations.json"
	}
}
```

### base_plugin/main.js

```javascript
const { Plugin } = require("@lumiastream/plugin");

const DEFAULTS = {
	message: "Hello from Showcase Plugin!",
	username: "Viewer",
	color: "#00c2ff",
	duration: 5,
};

const VARIABLE_NAMES = {
	message: "message",
	username: "username",
	color: "color",
	duration: "duration",
};

class ShowcasePluginTemplate extends Plugin {
	async onload() {
		await this._syncDefaults();
	}

	async onsettingsupdate(settings, previous = {}) {
		if (
			settings?.defaultMessage !== previous?.defaultMessage ||
			settings?.defaultColor !== previous?.defaultColor ||
			settings?.defaultDuration !== previous?.defaultDuration
		) {
			await this._syncDefaults(settings);
		}
	}

	async actions(config) {
		for (const action of config.actions) {
			if (action.type === "trigger_alert") {
				await this._triggerSampleAlert(action.value);
			}
		}
	}

	async _syncDefaults(settings = this.settings) {
		const message = settings?.defaultMessage ?? DEFAULTS.message;
		const color = settings?.defaultColor ?? DEFAULTS.color;
		const duration = Number(settings?.defaultDuration ?? DEFAULTS.duration);

		await this.lumia.setVariable(VARIABLE_NAMES.message, message);
		await this.lumia.setVariable(VARIABLE_NAMES.color, color);
		await this.lumia.setVariable(VARIABLE_NAMES.duration, duration);
	}

	async _triggerSampleAlert(data = {}) {
		const username = data?.username ?? DEFAULTS.username;
		const message =
			data?.message ?? this.settings?.defaultMessage ?? DEFAULTS.message;
		const color = data?.color ?? this.settings?.defaultColor ?? DEFAULTS.color;
		const duration = Number(
			data?.duration ?? this.settings?.defaultDuration ?? DEFAULTS.duration
		);

		await this.lumia.setVariable(VARIABLE_NAMES.username, username);
		await this.lumia.setVariable(VARIABLE_NAMES.message, message);
		await this.lumia.setVariable(VARIABLE_NAMES.color, color);
		await this.lumia.setVariable(VARIABLE_NAMES.duration, duration);

		try {
			await this.lumia.triggerAlert({
				alert: "sample_alert",
				dynamic: {
					value: color,
					username,
					message,
					color,
					duration,
				},
				extraSettings: {
					username,
					message,
					color,
					duration,
				},
			});
		} catch (error) {
			await this.lumia.log(
				`Sample alert failed: ${error?.message ?? String(error)}`
			);
		}
	}
}

module.exports = ShowcasePluginTemplate;
```

### base_plugin/actions_tutorial.md

```markdown
---
### Trigger Sample Alert
Use this action to fire the sample alert. You can override the message, username, color, and duration per action. The alert uses both dynamic and extraSettings so variations and templates have the same data.
---
```

### base_plugin/README.md

````markdown
# Showcase Plugin Template

This template demonstrates a minimal, production-friendly Lumia Stream plugin workflow:

- Defines a small set of settings with a short setup tutorial
- Exposes a single action that triggers an alert
- Updates a few variables that alerts and other Lumia features can use
- Keeps logging to errors only

Use the CLI to copy and customize the template:

```
npx lumia-plugin create my_plugin
```

After scaffolding you can tailor the manifest, code, and README to match your idea.
````

### base_plugin/settings_tutorial.md

```markdown
---
### Setup
1) Enter a default message and color.
2) Adjust the default duration if you want a longer or shorter alert.
3) Click Save to store the defaults.
---
### What this plugin does
- Stores the message, username, color, and duration in variables.
- Uses those values when triggering the sample alert.
---
```

### base_plugin/package.json

```json
{
	"name": "lumia-showcase-plugin-template",
	"version": "1.0.0",
	"private": true,
	"description": "Internal template illustrating settings, actions, variables, and alerts for Lumia Stream plugins.",
	"main": "main.js",
	"dependencies": {
		"@lumiastream/plugin": "^0.10.1"
	}
}
```

### base_plugin/translations.json

```json
{
	"en": {
		"message": "Stores the most recent message handled by the plugin.",
		"username": "Stores the most recent username handled by the plugin.",
		"color": "Tracks the color used by the latest sample alert.",
		"duration": "Tracks the duration used by the latest sample alert."
	}
}
```

## Example: settings_showcase

Source folder `examples/settings_showcase`, category `utilities`. Example plugin demonstrating every available settings field type with logging on save.

### settings_showcase/manifest.json

```json
{
	"id": "settings_showcase",
	"name": "Settings Showcase",
	"version": "1.1.6",
	"author": "Lumia Stream",
	"email": "dev@lumiastream.com",
	"website": "https://lumiastream.com",
	"repository": "",
	"description": "Example plugin demonstrating every available settings field type with logging on save.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "utilities",
	"icon": "settings_showcase.png",
	"config": {
		"settings_tutorial": "settings_tutorial.md",
		"oauth": {
			"buttonLabel": "Authorize Custom OAuth Example",
			"helperText": "Demonstrates custom OAuth configuration with serviceUrl override, extraParams, and tokenKeys mapping.",
			"openInBrowser": true,
			"serviceUrl": "https://example.com/oauth/authorize?provider=settings_showcase",
			"extraParams": "external=true&source=settings_showcase",
			"scopes": ["profile.read", "activity.read", "chat.write"],
			"tokenKeys": {
				"accessToken": "oauthAccessToken",
				"refreshToken": "oauthRefreshToken",
				"tokenSecret": "oauthTokenSecret"
			}
		},
		"custom_auth_display": {
			"entry": "./auth/setup-wizard.html",
			"autoAutoOpen": false,
			"authButtonLabel": "Open Settings Showcase Wizard",
			"title": "Settings Showcase Custom Auth"
		},
		"settings": [
			{
				"key": "textField",
				"label": "Text Field",
				"type": "text",
				"section": "Text & Numbers",
				"sectionOrder": 1,
				"group": {
					"key": "core_text_group",
					"label": "Core Text Inputs",
					"helperText": "Foundational text input examples.",
					"order": 1
				},
				"defaultValue": "Hello Lumia",
				"helperText": "Example of type `text`."
			},
			{
				"key": "validatedTextField",
				"label": "Validated Text Field",
				"type": "text",
				"section": "Text & Numbers",
				"sectionOrder": 1,
				"group": "core_text_group",
				"defaultValue": "stream_alert",
				"validation": {
					"minLength": 3,
					"maxLength": 24,
					"pattern": "^[a-z0-9_]+$"
				},
				"helperText": "Example of `validation` with minLength/maxLength/pattern."
			},
			{
				"key": "numberField",
				"label": "Number Field",
				"type": "number",
				"section": "Text & Numbers",
				"sectionOrder": 1,
				"group": {
					"key": "numeric_range_group",
					"label": "Numeric Range Inputs",
					"helperText": "Number field examples with limits and validation.",
					"order": 2
				},
				"defaultValue": 42,
				"min": 0,
				"max": 1000,
				"helperText": "Example of type `number`."
			},
			{
				"key": "pollIntervalField",
				"label": "Poll Interval (seconds)",
				"type": "number",
				"section": "Text & Numbers",
				"sectionOrder": 1,
				"group": "numeric_range_group",
				"defaultValue": 15,
				"validation": {
					"min": 5,
					"max": 600
				},
				"helperText": "Example of `validation` min/max, similar to polling plugins."
			},
			{
				"key": "selectField",
				"label": "Select Field",
				"type": "select",
				"allowTyping": true,
				"section": "Selections",
				"sectionOrder": 2,
				"group": {
					"key": "selection_modes_group",
					"label": "Selection Modes",
					"helperText": "Single-select and multi-select behaviors.",
					"order": 1
				},
				"defaultValue": "custom",
				"options": [
					{
						"label": "Normal",
						"value": "normal"
					},
					{
						"label": "Custom",
						"value": "custom"
					},
					{
						"label": "Debug",
						"value": "debug"
					}
				],
				"helperText": "Example of type `select` with `allowTyping: true`."
			},
			{
				"key": "selectMultipleField",
				"label": "Select (Multiple) Field",
				"type": "select",
				"multiple": true,
				"allowTyping": true,
				"section": "Selections",
				"sectionOrder": 2,
				"group": "selection_modes_group",
				"defaultValue": ["valorant", "overwatch"],
				"options": [
					{
						"label": "Valorant",
						"value": "valorant"
					},
					{
						"label": "Rocket League",
						"value": "rocket_league"
					},
					{
						"label": "Overwatch",
						"value": "overwatch"
					},
					{
						"label": "League of Legends",
						"value": "league_of_legends"
					}
				],
				"helperText": "Example of type `select` with `multiple: true` and `allowTyping: true`."
			},
			{
				"key": "checkboxField",
				"label": "Checkbox Field",
				"type": "checkbox",
				"section": "Booleans & Sliders",
				"sectionOrder": 3,
				"group": {
					"key": "state_controls_group",
					"label": "State Controls",
					"helperText": "Boolean and range controls for state toggles.",
					"order": 1
				},
				"defaultValue": true,
				"helperText": "Example of type `checkbox`."
			},
			{
				"key": "sliderField",
				"label": "Slider Field",
				"type": "slider",
				"section": "Booleans & Sliders",
				"sectionOrder": 3,
				"group": "state_controls_group",
				"defaultValue": 65,
				"min": 0,
				"max": 100,
				"step": 1,
				"helperText": "Example of type `slider`."
			},
			{
				"key": "toggleField",
				"label": "Toggle Field",
				"type": "toggle",
				"section": "Booleans & Sliders",
				"sectionOrder": 3,
				"group": "state_controls_group",
				"defaultValue": true,
				"helperText": "Controls visibleIf examples below."
			},
			{
				"key": "disabledInfoField",
				"label": "Disabled Read-Only Field",
				"type": "text",
				"section": "Visibility & Layout",
				"sectionOrder": 4,
				"group": {
					"key": "metadata_flags_group",
					"label": "Metadata Flags",
					"helperText": "Examples of disabled and hidden field metadata.",
					"order": 1
				},
				"defaultValue": "Runtime-managed status field",
				"disabled": true,
				"helperText": "Demonstrates `disabled: true`."
			},
			{
				"key": "hiddenTextField",
				"label": "Hidden Text Field",
				"type": "text",
				"section": "Visibility & Layout",
				"sectionOrder": 4,
				"group": "metadata_flags_group",
				"hidden": true,
				"defaultValue": "hidden_default_value",
				"helperText": "Demonstrates `hidden: true`."
			},
			{
				"key": "groupedTextField",
				"label": "Grouped Text Field",
				"type": "text",
				"section": "Visibility & Layout",
				"sectionOrder": 4,
				"group": {
					"key": "visibility_group",
					"label": "Grouped Visibility Fields",
					"helperText": "This container demonstrates `group` and group-level `visibleIf`.",
					"visibleIf": {
						"key": "toggleField",
						"equals": true
					}
				},
				"defaultValue": "inside_group",
				"helperText": "Example of grouped field."
			},
			{
				"key": "fileField",
				"label": "File Field",
				"type": "file",
				"section": "Visibility & Layout",
				"sectionOrder": 4,
				"group": "visibility_group",
				"visibleIf": {
					"key": "toggleField",
					"equals": true
				},
				"helperText": "Example of type `file` with `visibleIf`."
			},
			{
				"key": "passwordField",
				"label": "Password Field",
				"type": "password",
				"section": "Visibility & Layout",
				"sectionOrder": 4,
				"group": "visibility_group",
				"defaultValue": "super_secret_value",
				"helperText": "Example of type `password`."
			},
			{
				"key": "textareaField",
				"label": "Textarea Field",
				"type": "textarea",
				"section": "Visibility & Layout",
				"sectionOrder": 4,
				"group": "visibility_group",
				"rows": 4,
				"defaultValue": "This is a multiline example.",
				"visibleIf": {
					"key": "checkboxField",
					"equals": true
				},
				"helperText": "Example of type `textarea` with `visibleIf`."
			},
			{
				"key": "emailField",
				"label": "Email Field",
				"type": "email",
				"section": "Specialized Inputs",
				"sectionOrder": 5,
				"group": {
					"key": "contact_format_group",
					"label": "Contact & Link Inputs",
					"helperText": "Typed fields for contact and URL values.",
					"order": 1
				},
				"defaultValue": "name@example.com",
				"helperText": "Example of type `email`."
			},
			{
				"key": "urlField",
				"label": "URL Field",
				"type": "url",
				"section": "Specialized Inputs",
				"sectionOrder": 5,
				"group": "contact_format_group",
				"defaultValue": "https://lumiastream.com",
				"helperText": "Example of type `url`."
			},
			{
				"key": "datetimeField",
				"label": "Datetime Field",
				"type": "datetime",
				"section": "Specialized Inputs",
				"sectionOrder": 5,
				"group": {
					"key": "time_color_group",
					"label": "Time & Color Inputs",
					"helperText": "Structured datetime and color input examples.",
					"order": 2
				},
				"defaultValue": "2026-03-01T15:30",
				"helperText": "Example of type `datetime` (YYYY-MM-DDTHH:mm)."
			},
			{
				"key": "colorField",
				"label": "Color Field",
				"type": "color",
				"section": "Specialized Inputs",
				"sectionOrder": 5,
				"group": "time_color_group",
				"defaultValue": "#33aaff",
				"helperText": "Example of type `color`."
			},
			{
				"key": "leagueField",
				"label": "League (Dynamic Source)",
				"type": "select",
				"section": "Dynamic Lookup",
				"sectionOrder": 6,
				"group": {
					"key": "dynamic_lookup_group",
					"label": "Runtime Option Loading",
					"helperText": "Demonstrates dynamic options, lookup, and dependency refresh.",
					"order": 1
				},
				"defaultValue": "nfl",
				"refreshOnChange": true,
				"options": [
					{
						"label": "NFL",
						"value": "nfl"
					},
					{
						"label": "NBA",
						"value": "nba"
					},
					{
						"label": "MLB",
						"value": "mlb"
					},
					{
						"label": "NHL",
						"value": "nhl"
					}
				],
				"helperText": "Changing this refreshes team options below."
			},
			{
				"key": "teamLookupField",
				"label": "Teams (Dynamic + Lookup)",
				"type": "select",
				"section": "Dynamic Lookup",
				"sectionOrder": 6,
				"group": "dynamic_lookup_group",
				"multiple": true,
				"lookup": true,
				"dynamicOptions": true,
				"refreshOnChange": true,
				"defaultValue": ["nfl:kc"],
				"placeholder": "Search leagues or teams",
				"options": [],
				"helperText": "Example of `dynamicOptions` + `lookup` + `refreshOnChange`."
			},
			{
				"key": "jsonField",
				"label": "JSON Field",
				"type": "json",
				"section": "Structured Data",
				"sectionOrder": 7,
				"group": {
					"key": "structured_json_group",
					"label": "Structured Rule Payloads",
					"helperText": "Examples of structured JSON for advanced configuration payloads.",
					"order": 1
				},
				"rows": 8,
				"visibleIf": {
					"key": "selectField",
					"equals": "custom"
				},
				"defaultValue": {
					"rules": [
						{
							"name": "kill",
							"confidence": 0.9
						},
						{
							"name": "goal",
							"confidence": 0.92
						}
					],
					"cooldownMs": 1200
				},
				"helperText": "Example of type `json` with `visibleIf`."
			},
			{
				"key": "roiField",
				"label": "ROI Field",
				"type": "roi",
				"section": "ROI",
				"sectionOrder": 8,
				"group": {
					"key": "roi_capture_group",
					"label": "Region Capture",
					"helperText": "ROI is isolated because it is specific to screen-detection workflows.",
					"order": 1
				},
				"visibleIf": {
					"key": "selectMultipleField",
					"equals": "valorant"
				},
				"defaultValue": {
					"x": 0.72,
					"y": 0.02,
					"width": 0.27,
					"height": 0.45,
					"unit": "ratio"
				},
				"helperText": "Example of type `roi` with `visibleIf` and array matching."
			},
			{
				"key": "namedMapField",
				"label": "Named Targets Map",
				"type": "named_map",
				"section": "Structured Data",
				"sectionOrder": 7,
				"group": {
					"key": "named_map_examples_group",
					"label": "Named Mapping",
					"helperText": "Map user-defined names to values (real-world multi-channel pattern).",
					"order": 2
				},
				"valueType": "text",
				"valueLabel": "Target Value",
				"valuePlaceholder": "username|channelId|chatroomId",
				"valueField": {
					"type": "text",
					"required": true,
					"placeholder": "lumiastream|123456|987654"
				},
				"outputMode": "array",
				"allowDuplicateNames": false,
				"defaultValue": [
					{
						"name": "primary",
						"value": "lumiastream"
					},
					{
						"name": "mods",
						"value": "lumiastream_mods"
					}
				],
				"helperText": "Example of type `named_map`."
			},
			{
				"key": "oauthAccessToken",
				"label": "OAuth Access Token (Mapped)",
				"type": "password",
				"section": "OAuth Example",
				"sectionOrder": 9,
				"group": {
					"key": "oauth_mapped_tokens_group",
					"label": "Mapped OAuth Tokens",
					"helperText": "Read-only fields populated by oauth.tokenKeys mapping.",
					"order": 1
				},
				"disabled": true,
				"required": false,
				"helperText": "Auto-filled by oauth.tokenKeys.accessToken."
			},
			{
				"key": "oauthRefreshToken",
				"label": "OAuth Refresh Token (Mapped)",
				"type": "password",
				"section": "OAuth Example",
				"sectionOrder": 9,
				"group": "oauth_mapped_tokens_group",
				"disabled": true,
				"required": false,
				"helperText": "Auto-filled by oauth.tokenKeys.refreshToken."
			},
			{
				"key": "oauthTokenSecret",
				"label": "OAuth Token Secret (Mapped)",
				"type": "password",
				"section": "OAuth Example",
				"sectionOrder": 9,
				"group": "oauth_mapped_tokens_group",
				"disabled": true,
				"required": false,
				"helperText": "Auto-filled by oauth.tokenKeys.tokenSecret."
			}
			],
			"actions": [
				{
					"type": "passVariablesExample",
					"label": "Pass Variables Example",
					"description": "Demonstrates returning newlyPassedVariables from actions() for later actions in the same command.",
					"acceptedVariables": [
						"settings_showcase_action_message",
						"settings_showcase_action_status",
						"settings_showcase_action_save_count",
						"settings_showcase_action_snapshot"
					],
					"fields": [
						{
							"key": "message",
							"label": "Message",
							"type": "text",
							"defaultValue": "Hello from settings_showcase action",
							"allowVariables": true,
							"helperText": "Returned as settings_showcase_action_message."
						},
						{
							"key": "includeSnapshot",
							"label": "Include Snapshot",
							"type": "toggle",
							"defaultValue": true,
							"helperText": "When enabled, returns a compact JSON snapshot in settings_showcase_action_snapshot."
						},
						{
							"key": "stopChain",
							"label": "Stop Remaining Actions",
							"type": "toggle",
							"defaultValue": false,
							"helperText": "When enabled, actions() also returns shouldStop: true."
						}
					]
				}
			],
			"variables": [
			{
				"name": "save_count",
				"description": "How many times settings were saved/updated.",
				"value": 0
			},
			{
				"name": "last_saved_at",
				"description": "Timestamp of the last settings save.",
				"value": ""
			},
			{
				"name": "last_saved_values_json",
				"description": "JSON snapshot of values saved most recently.",
				"value": ""
			}
		],
		"alerts": [],
		"translations": "./translations.json"
	}
}
```

### settings_showcase/main.js

```javascript
const { Plugin } = require("@lumiastream/plugin");

const VARIABLE_NAMES = {
	saveCount: "save_count",
	lastSavedAt: "last_saved_at",
	lastSavedValuesJson: "last_saved_values_json",
};
const ACTION_VARIABLE_NAMES = {
	actionMessage: "settings_showcase_action_message",
	actionStatus: "settings_showcase_action_status",
	actionSaveCount: "settings_showcase_action_save_count",
	actionSnapshot: "settings_showcase_action_snapshot",
};

const TEAM_OPTIONS_BY_LEAGUE = Object.freeze({
	nfl: Object.freeze([
		{ label: "Kansas City Chiefs", value: "nfl:kc" },
		{ label: "San Francisco 49ers", value: "nfl:sf" },
		{ label: "Buffalo Bills", value: "nfl:buf" },
		{ label: "Detroit Lions", value: "nfl:det" },
	]),
	nba: Object.freeze([
		{ label: "Boston Celtics", value: "nba:bos" },
		{ label: "Los Angeles Lakers", value: "nba:lal" },
		{ label: "Milwaukee Bucks", value: "nba:mil" },
		{ label: "Denver Nuggets", value: "nba:den" },
	]),
	mlb: Object.freeze([
		{ label: "Los Angeles Dodgers", value: "mlb:lad" },
		{ label: "Atlanta Braves", value: "mlb:atl" },
		{ label: "New York Yankees", value: "mlb:nyy" },
		{ label: "Houston Astros", value: "mlb:hou" },
	]),
	nhl: Object.freeze([
		{ label: "Vegas Golden Knights", value: "nhl:vgk" },
		{ label: "Colorado Avalanche", value: "nhl:col" },
		{ label: "New York Rangers", value: "nhl:nyr" },
		{ label: "Edmonton Oilers", value: "nhl:edm" },
	]),
});

const FIELD_SPECS = [
	{ key: "textField", label: "text", type: "text" },
	{ key: "validatedTextField", label: "validated_text", type: "text" },
	{ key: "numberField", label: "number", type: "number" },
	{ key: "pollIntervalField", label: "poll_interval", type: "number" },
	{ key: "selectField", label: "select", type: "select" },
	{
		key: "selectMultipleField",
		label: "select_multiple",
		type: "select",
		multiple: true,
	},
	{ key: "checkboxField", label: "checkbox", type: "checkbox" },
	{ key: "sliderField", label: "slider", type: "slider" },
	{ key: "disabledInfoField", label: "disabled_info", type: "text" },
	{ key: "hiddenTextField", label: "hidden_text", type: "text" },
	{ key: "groupedTextField", label: "grouped_text", type: "text" },
	{ key: "fileField", label: "file", type: "file" },
	{ key: "passwordField", label: "password", type: "password" },
	{
		key: "oauthAccessToken",
		label: "oauth_access_token",
		type: "password",
	},
	{
		key: "oauthRefreshToken",
		label: "oauth_refresh_token",
		type: "password",
	},
	{
		key: "oauthTokenSecret",
		label: "oauth_token_secret",
		type: "password",
	},
	{ key: "toggleField", label: "toggle", type: "toggle" },
	{ key: "textareaField", label: "textarea", type: "textarea" },
	{ key: "emailField", label: "email", type: "email" },
	{ key: "urlField", label: "url", type: "url" },
	{ key: "datetimeField", label: "datetime", type: "datetime" },
	{ key: "colorField", label: "color", type: "color" },
	{ key: "leagueField", label: "league", type: "select" },
	{
		key: "teamLookupField",
		label: "team_lookup",
		type: "select",
		multiple: true,
	},
	{ key: "jsonField", label: "json", type: "json" },
	{ key: "roiField", label: "roi", type: "roi" },
	{ key: "namedMapField", label: "named_map", type: "named_map" },
];

function asString(value, fallback = "") {
	if (typeof value === "string") {
		return value;
	}
	if (value === undefined || value === null) {
		return fallback;
	}
	return String(value);
}

function asBoolean(value, fallback = false) {
	if (typeof value === "boolean") {
		return value;
	}
	if (typeof value === "number") {
		return value !== 0;
	}
	if (typeof value === "string") {
		const normalized = value.trim().toLowerCase();
		if (["1", "true", "yes", "on", "enabled"].includes(normalized)) {
			return true;
		}
		if (["0", "false", "no", "off", "disabled"].includes(normalized)) {
			return false;
		}
	}
	return fallback;
}

function asNumber(value, fallback = 0) {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === "string" && value.trim().length) {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) {
			return parsed;
		}
	}
	return fallback;
}

function asStringList(value) {
	if (!Array.isArray(value)) {
		return [];
	}
	const cleaned = value
		.map((item) => asString(item).trim())
		.filter((item) => item.length > 0);
	return Array.from(new Set(cleaned));
}

function asJsonValue(value) {
	if (value === undefined) {
		return null;
	}
	if (typeof value === "string") {
		const trimmed = value.trim();
		if (!trimmed.length) {
			return null;
		}
		try {
			return JSON.parse(trimmed);
		} catch {
			return { _invalidJson: trimmed };
		}
	}
	return value;
}

function asRoi(value) {
	const parsed = asJsonValue(value);
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		return null;
	}

	const unitToken = asString(parsed.unit, "ratio").toLowerCase();
	const unit = unitToken === "pixels" || unitToken === "px" ? "pixels" : "ratio";
	const max = unit === "ratio" ? 1 : Number.POSITIVE_INFINITY;
	const clamp = (input) => Math.max(0, Math.min(max, input));

	const x = clamp(asNumber(parsed.x, 0));
	const y = clamp(asNumber(parsed.y, 0));
	const width = clamp(asNumber(parsed.width, unit === "ratio" ? 1 : 500));
	const height = clamp(asNumber(parsed.height, unit === "ratio" ? 1 : 500));
	if (width <= 0 || height <= 0) {
		return null;
	}
	return { x, y, width, height, unit };
}

function asNamedMap(value) {
	const parsed = asJsonValue(value);
	if (!parsed) {
		return [];
	}

	if (Array.isArray(parsed)) {
		return parsed
			.map((entry) => {
				if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
					return null;
				}
				const name = asString(entry.name ?? entry.key, "").trim();
				const rawValue = entry.value ?? entry.path ?? "";
				const mappedValue =
					typeof rawValue === "string"
						? rawValue
						: formatForOutput(asJsonValue(rawValue));
				if (!name && !mappedValue) {
					return null;
				}
				return { name, value: mappedValue };
			})
			.filter(Boolean);
	}

	if (typeof parsed === "object") {
		return Object.entries(parsed).map(([name, rawValue]) => ({
			name: asString(name, "").trim(),
			value:
				typeof rawValue === "string"
					? rawValue
					: formatForOutput(asJsonValue(rawValue)),
		}));
	}

	return [];
}

function normalizeValueByType(type, value, field = {}) {
	switch (type) {
		case "number":
		case "slider":
			return asNumber(value, 0);
		case "checkbox":
		case "toggle":
			return asBoolean(value, false);
		case "select":
			if (field?.multiple) {
				return asStringList(value);
			}
			return asString(value, "");
		case "json":
			return asJsonValue(value);
		case "roi":
			return asRoi(value);
		case "named_map":
			return asNamedMap(value);
		case "password": {
			const raw = asString(value, "");
			if (!raw.length) {
				return "";
			}
			return `***${raw.length} chars***`;
		}
		case "file":
		case "text":
		case "textarea":
		case "email":
		case "url":
		case "color":
		default:
			return asString(value, "");
	}
}

function formatForOutput(value) {
	if (typeof value === "string") {
		return value;
	}
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

function truncate(value, maxLength = 140) {
	const text = asString(value, "");
	if (text.length <= maxLength) {
		return text;
	}
	return `${text.slice(0, maxLength - 3)}...`;
}

class SettingsFieldShowcasePlugin extends Plugin {
	constructor(manifest, context) {
		super(manifest, context);
		this._saveCount = 0;
	}

	async onload() {
		await this.lumia.updateConnection(true);
		await this._log("[settings_field_showcase] Loaded.");
		void this.refreshSettingsOptions({ fieldKey: "leagueField" });
		await this._emitAllFieldValues(this.settings, { reason: "load" });
	}

	async onunload() {
		await this.lumia.updateConnection(false);
	}

	async onsettingsupdate(settings, previous = {}) {
		if (this._league(settings) !== this._league(previous)) {
			void this.refreshSettingsOptions({ fieldKey: "leagueField", settings });
		}
		await this._emitAllFieldValues(settings, { reason: "save" });
	}

	async validateAuth() {
		return { ok: true };
	}

	async actions(config = {}) {
		const actions = Array.isArray(config?.actions) ? config.actions : [];
		const newlyPassedVariables = {};
		let shouldStop = false;

		for (const action of actions) {
			if (action?.type !== "passVariablesExample") {
				continue;
			}

			const params =
				action?.value && typeof action.value === "object"
					? action.value
					: {};
			const message =
				asString(
					params?.message,
					"Hello from settings_showcase action",
				).trim() || "Hello from settings_showcase action";
			const includeSnapshot = asBoolean(params?.includeSnapshot, true);
			const stopChain = asBoolean(params?.stopChain, false);

			newlyPassedVariables[ACTION_VARIABLE_NAMES.actionMessage] = message;
			newlyPassedVariables[ACTION_VARIABLE_NAMES.actionStatus] = "ok";
			newlyPassedVariables[ACTION_VARIABLE_NAMES.actionSaveCount] =
				this._saveCount;

			if (includeSnapshot) {
				newlyPassedVariables[ACTION_VARIABLE_NAMES.actionSnapshot] =
					JSON.stringify({
						savedAt: new Date().toISOString(),
						leagueField: asString(this.settings?.leagueField, ""),
						selectField: asString(this.settings?.selectField, ""),
						toggleField: asBoolean(this.settings?.toggleField, false),
						saveCount: this._saveCount,
					});
			}

			shouldStop = shouldStop || stopChain;
			await this._log(
				`[settings_field_showcase] passVariablesExample emitted variables (shouldStop=${stopChain})`,
			);
		}

		const hasReturnedVariables =
			Object.keys(newlyPassedVariables).length > 0;
		if (!hasReturnedVariables && !shouldStop) {
			return;
		}

		return {
			...(hasReturnedVariables ? { newlyPassedVariables } : {}),
			...(shouldStop ? { shouldStop: true } : {}),
		};
	}

	async onCustomAuthDisplaySignal(config = {}) {
		const signalType = asString(
			config?.type ?? config?.signalType ?? config?.signal,
			"",
		)
			.trim()
			.toLowerCase();
		const payload =
			config?.payload && typeof config.payload === "object"
				? config.payload
				: {};

		switch (signalType) {
			case "ready":
				return {
					ok: true,
					pluginId: this.manifest?.id,
					message: "Settings showcase custom auth is ready.",
					league: this._league(),
				};
			case "ping":
				return {
					ok: true,
					pongAt: new Date().toISOString(),
					saveCount: this._saveCount,
				};
			case "setleague": {
				const requestedLeague = asString(payload.league ?? payload.value, "nfl")
					.trim()
					.toLowerCase();
				const nextLeague = TEAM_OPTIONS_BY_LEAGUE[requestedLeague]
					? requestedLeague
					: "nfl";
				this.updateSettings({ leagueField: nextLeague });
				void this.refreshSettingsOptions({
					fieldKey: "leagueField",
					settings: { ...this.settings, leagueField: nextLeague },
				});
				return {
					ok: true,
					leagueField: nextLeague,
					message: "League field updated from custom auth display.",
				};
			}
			case "setgroupedtext": {
				const nextValue =
					asString(payload.text, "").trim() ||
					"Updated from custom auth display";
				this.updateSettings({ groupedTextField: nextValue });
				return {
					ok: true,
					groupedTextField: nextValue,
					message: "Grouped text field updated from custom auth display.",
				};
			}
			case "snapshot":
				return {
					ok: true,
					fields: {
						leagueField: asString(this.settings?.leagueField, ""),
						groupedTextField: asString(this.settings?.groupedTextField, ""),
						selectField: asString(this.settings?.selectField, ""),
					},
				};
			case "close":
				return { ok: true, close: true };
			default:
				throw new Error(
					`Unsupported customAuthDisplay signal: ${signalType || "unknown"}`,
				);
		}
	}

	async onCustomAuthDisplayClose(config = {}) {
		await this._log(
			`[settings_field_showcase] custom auth display closed: ${formatForOutput(config)}`,
		);
	}

	async refreshSettingsOptions({ fieldKey, values, settings } = {}) {
		if (
			fieldKey &&
			fieldKey !== "leagueField" &&
			fieldKey !== "teamLookupField"
		) {
			return;
		}

		if (typeof this.lumia?.updateSettingsFieldOptions !== "function") {
			return;
		}

		const previewSettings = {
			...(this.settings && typeof this.settings === "object"
				? this.settings
				: {}),
			...(settings && typeof settings === "object" ? settings : {}),
			...(values && typeof values === "object" ? values : {}),
		};

		const league = this._league(previewSettings);
		const baseOptions = TEAM_OPTIONS_BY_LEAGUE[league] || TEAM_OPTIONS_BY_LEAGUE.nfl;
		const selectedValues = asStringList(
			values?.teamLookupField ??
				settings?.teamLookupField ??
				previewSettings.teamLookupField,
		);
		const knownValues = new Set(baseOptions.map((option) => option.value));
		const customOptions = selectedValues
			.filter((value) => !knownValues.has(value))
			.map((value) => ({
				label: `Custom: ${value}`,
				value,
			}));

		await this.lumia.updateSettingsFieldOptions({
			fieldKey: "teamLookupField",
			options: [...baseOptions, ...customOptions],
		});
	}

	async _emitAllFieldValues(settings, options = {}) {
		const reason = asString(options.reason, "save");
		const snapshot = {};

		for (const field of FIELD_SPECS) {
			const normalized = normalizeValueByType(field.type, settings?.[field.key], field);
			const output = formatForOutput(normalized);
			snapshot[field.key] = normalized;

			await this._log(`[settings_field_showcase] ${field.label} (${field.key}) = ${output}`);

		}

		this._saveCount += 1;
		const savedAt = new Date().toISOString();

		await this.lumia.setVariable(VARIABLE_NAMES.saveCount, this._saveCount);
		await this.lumia.setVariable(VARIABLE_NAMES.lastSavedAt, savedAt);
		await this.lumia.setVariable(
			VARIABLE_NAMES.lastSavedValuesJson,
			JSON.stringify(
				{
					reason,
					savedAt,
					fields: snapshot,
				},
				null,
				2,
			),
		);

	}

	async _log(message) {
		await this.lumia.log(message);
	}

	_league(settings = this.settings) {
		const token = asString(settings?.leagueField, "nfl").trim().toLowerCase();
		return TEAM_OPTIONS_BY_LEAGUE[token] ? token : "nfl";
	}
}

module.exports = SettingsFieldShowcasePlugin;
```

### settings_showcase/settings_tutorial.md

```markdown
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
```

### settings_showcase/package.json

```json
{
	"name": "lumia-settings-field-showcase",
	"version": "1.0.0",
	"private": true,
	"description": "Example Lumia plugin demonstrating roi/json/select+multiple/file/visibleIf settings.",
	"main": "main.js",
	"scripts": {},
	"dependencies": {
		"@lumiastream/plugin": "^0.10.1"
	}
}
```

### settings_showcase/translations.json

```json
{
	"en": {
		"save_count": "How many times settings were saved/updated.",
		"last_saved_at": "Timestamp of the last settings save.",
		"last_saved_values_json": "JSON snapshot of values saved most recently.",
		"settings_showcase_action_message": "Message returned from the passVariablesExample action.",
		"settings_showcase_action_status": "Status returned from the passVariablesExample action.",
		"settings_showcase_action_save_count": "Current save counter returned by the passVariablesExample action.",
		"settings_showcase_action_snapshot": "Compact JSON snapshot returned by the passVariablesExample action."
	}
}
```

## Example: typescript_plugin

Source folder `examples/typescript_plugin`, category `utilities`. Example TypeScript plugin that shows typed settings, actions, variables, and alerts.

### typescript_plugin/manifest.json

```json
{
	"id": "typescript_plugin_example",
	"name": "TypeScript Plugin Example",
	"version": "1.0.1",
	"author": "Lumia Stream",
	"email": "",
	"website": "",
	"repository": "",
	"description": "Example TypeScript plugin that shows typed settings, actions, variables, and alerts.",
	"license": "MIT",
	"lumiaVersion": "^9.0.0",
	"category": "utilities",
	"main": "dist/main.js",
	"keywords": "typescript, sample, lumia, plugin",
	"config": {
		"settings": [
			{
				"key": "defaultMessage",
				"label": "Default Message",
				"type": "text",
				"defaultValue": "Hello from TypeScript Plugin Example!",
				"helperText": "Used when the action does not include a message."
			},
			{
				"key": "heartbeatInterval",
				"label": "Heartbeat Interval (seconds)",
				"type": "number",
				"defaultValue": 15,
				"min": 5,
				"max": 300,
				"helperText": "How often to refresh the heartbeat variable."
			}
		],
		"actions": [
			{
				"type": "send_sample_alert",
				"label": "Send Sample Alert",
				"description": "Triggers the sample alert and updates plugin variables.",
				"fields": [
					{
						"key": "username",
						"label": "Username",
						"type": "text",
						"defaultValue": "Viewer"
					},
					{
						"key": "message",
						"label": "Message",
						"type": "text",
						"defaultValue": "Hello from TypeScript Plugin Example!"
					}
				]
			}
		],
		"variables": [
			{
				"name": "last_username",
				"description": "Most recent username used by the action.",
				"value": ""
			},
			{
				"name": "last_message",
				"description": "Most recent message used by the action.",
				"value": ""
			},
			{
				"name": "last_heartbeat",
				"description": "ISO timestamp from the plugin heartbeat loop.",
				"value": ""
			}
		],
		"alerts": [
			{
				"title": "TypeScript Sample Alert",
				"key": "ts_sample_alert",
				"acceptedVariables": [
					"last_username",
					"last_message"
				],
				"defaultMessage": "{{last_username}}: {{last_message}}"
			}
		],
		"translations": "./translations.json"
	}
}
```

### typescript_plugin/src/main.ts

```typescript
import {
	Plugin,
	type PluginActionPayload,
	type PluginContext,
	type PluginManifest,
} from "@lumiastream/plugin";

type ExampleSettings = {
	defaultMessage?: string;
	heartbeatInterval?: number;
};

type SendSampleAlertActionValue = {
	username?: string;
	message?: string;
};

const DEFAULTS = {
	defaultMessage: "Hello from TypeScript Plugin Example!",
	defaultUsername: "Viewer",
	heartbeatInterval: 15,
} as const;

const VARIABLE_NAMES = {
	lastUsername: "last_username",
	lastMessage: "last_message",
	lastHeartbeat: "last_heartbeat",
} as const;

class TypeScriptPluginExample extends Plugin {
	private heartbeatTimer?: NodeJS.Timeout;

	constructor(manifest: PluginManifest, context: PluginContext) {
		super(manifest, context);
	}

	async onload(): Promise<void> {
		await this.syncDefaults();
		this.startHeartbeat();
	}

	async onunload(): Promise<void> {
		this.stopHeartbeat();
	}

	async onsettingsupdate(
		settings: Record<string, unknown>,
		previousSettings: Record<string, unknown>,
	): Promise<void> {
		const nextSettings = settings as ExampleSettings;
		const previous = previousSettings as ExampleSettings;
		const nextInterval = Number(
			nextSettings.heartbeatInterval ?? DEFAULTS.heartbeatInterval,
		);
		const previousInterval = Number(
			previous.heartbeatInterval ?? DEFAULTS.heartbeatInterval,
		);

		if (
			nextSettings.defaultMessage !== previous.defaultMessage ||
			nextInterval !== previousInterval
		) {
			await this.syncDefaults(nextSettings);
			this.startHeartbeat();
		}
	}

	async actions(config: { actions: PluginActionPayload[] }): Promise<void> {
		for (const action of config.actions) {
			if (action.type === "send_sample_alert") {
				await this.sendSampleAlert(action.value as SendSampleAlertActionValue);
			}
		}
	}

	private getTypedSettings(
		source: ExampleSettings = this.settings as ExampleSettings,
	): Required<ExampleSettings> {
		const parsedInterval = Number(
			source.heartbeatInterval ?? DEFAULTS.heartbeatInterval,
		);
		const heartbeatInterval = Number.isFinite(parsedInterval)
			? Math.min(300, Math.max(5, parsedInterval))
			: DEFAULTS.heartbeatInterval;

		return {
			defaultMessage:
				source.defaultMessage?.trim() || DEFAULTS.defaultMessage,
			heartbeatInterval,
		};
	}

	private async syncDefaults(settings?: ExampleSettings): Promise<void> {
		const typedSettings = this.getTypedSettings(settings);
		await this.lumia.setVariable(
			VARIABLE_NAMES.lastMessage,
			typedSettings.defaultMessage,
		);
	}

	private startHeartbeat(): void {
		this.stopHeartbeat();
		const { heartbeatInterval } = this.getTypedSettings();

		this.heartbeatTimer = setInterval(() => {
			void this.lumia.setVariable(
				VARIABLE_NAMES.lastHeartbeat,
				new Date().toISOString(),
			);
		}, heartbeatInterval * 1000);
	}

	private stopHeartbeat(): void {
		if (!this.heartbeatTimer) return;
		clearInterval(this.heartbeatTimer);
		this.heartbeatTimer = undefined;
	}

	private async sendSampleAlert(
		data: SendSampleAlertActionValue,
	): Promise<void> {
		const { defaultMessage } = this.getTypedSettings();
		const username = data.username?.trim() || DEFAULTS.defaultUsername;
		const message = data.message?.trim() || defaultMessage;

		await this.lumia.setVariable(VARIABLE_NAMES.lastUsername, username);
		await this.lumia.setVariable(VARIABLE_NAMES.lastMessage, message);

		try {
			await this.lumia.triggerAlert({
				alert: "ts_sample_alert",
				dynamic: {
					name: "message",
					value: message,
				},
				extraSettings: {
					username,
					message,
				},
			});
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			await this.lumia.log(
				`send_sample_alert failed: ${errorMessage}`,
			);
		}
	}
}

export = TypeScriptPluginExample;
```

### typescript_plugin/README.md

````markdown
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
````

### typescript_plugin/package.json

```json
{
	"name": "lumia-typescript-plugin-example",
	"version": "1.0.0",
	"private": true,
	"description": "Example Lumia Stream plugin written in TypeScript.",
	"main": "dist/main.js",
	"scripts": {
		"build": "tsc -p tsconfig.json",
		"watch": "tsc -w -p tsconfig.json",
		"validate": "node ../../cli/scripts/validate-plugin.js .",
		"package": "npm run build && node ../../cli/scripts/build-plugin.js ."
	},
	"dependencies": {
		"@lumiastream/plugin": "^0.10.1"
	},
	"devDependencies": {
		"@types/node": "^20.11.30",
		"typescript": "^5.3.3"
	}
}
```

### typescript_plugin/translations.json

```json
{
	"en": {
		"last_username": "Most recent username used by the action.",
		"last_message": "Most recent message used by the action.",
		"last_heartbeat": "ISO timestamp from the plugin heartbeat loop."
	}
}
```

### typescript_plugin/tsconfig.json

```json
{
	"compilerOptions": {
		"target": "ES2022",
		"module": "CommonJS",
		"outDir": "./dist",
		"rootDir": "./src",
		"strict": true,
		"esModuleInterop": true,
		"forceConsistentCasingInFileNames": true,
		"skipLibCheck": true
	},
	"include": ["src/**/*.ts"],
	"exclude": ["dist", "node_modules"]
}
```
