---
### 1) Run OpenClaw Gateway
1) Follow the OpenClaw docs: [docs.openclaw.ai](https://docs.openclaw.ai/).
2) Enable the OpenAI-compatible HTTP API in your Gateway config.
3) Start the Gateway (default `http://127.0.0.1:18789`).
---
### 2) Configure This Plugin (Minimal)
- **Base URL** should point to your OpenClaw Gateway.
- **Gateway Token** is required only if your Gateway auth is enabled.
- **Known Agent IDs** is a manual comma-separated list (example: `main,research,fast`).
- **Default Agent ID** uses that manual list for selection.
- **Model correlation:** the selected agent determines the real provider model inside OpenClaw.
---
### 3) Variable Functions
**openclaw_prompt**
Send prompts using a simple syntax.

Example:
`{{openclaw_prompt=Make a funny quote}}`

Use user input:
`{{openclaw_prompt={{message}}}}`

Keep conversation context with a thread name and optional agent override:
`{{openclaw_prompt={{message}}|thread_name|main}}`

You can pass an agent id (`main`) or route (`openclaw:main`) in the third slot.

**openclaw_json**
Return JSON-only output:
`{{openclaw_json=Summarize this clip as JSON}}`

**openclaw_one_line**
Return a single-line response (newlines removed):
`{{openclaw_one_line=Write a short hype line}}`

**openclaw_prompt_nostore**
Run a prompt without storing or using history:
`{{openclaw_prompt_nostore=Give me a quick summary}}`

**openclaw_prompt_clear**
Clear a conversation thread:
`{{openclaw_prompt_clear=thread_name}}`
---
