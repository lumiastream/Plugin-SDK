---
### 1) Install & Run Ollama
1) Install [Ollama](https://ollama.com).
2) Start the server: `ollama serve` (defaults to `http://localhost:11434`).
3) Pull a model you want to use, for example: `ollama pull gpt-oss:20b`.
---
### 2) Configure This Plugin
- **Base URL** should point to your Ollama server (default `http://localhost:11434`).
- **Default Model** should match a local model name from `ollama list`. If left blank, the plugin will try to auto-detect and use the first available model.
- **Max Output Length** trims long replies for overlays or chat boxes.
---
### 3) Variable Functions
**ollama_prompt**
Send prompts using a simple syntax.

Example:
`{{ollama_prompt=Make a funny quote}}`

Use user input:
`{{ollama_prompt={{message}}}}`

Keep conversation context with a thread name and optional model override:
`{{ollama_prompt={{message}}|thread_name|gpt-oss:20b}}`

Use a thread name to continue the conversation, and the last parameter to use a specific model.

**ollama_json**
Return JSON-only output:
`{{ollama_json=Summarize this clip as JSON}}`

**ollama_one_line**
Return a single-line response (newlines removed):
`{{ollama_one_line=Write a short hype line}}`

**ollama_prompt_nostore**
Run a prompt without storing or using history:
`{{ollama_prompt_nostore=Give me a quick summary}}`

**ollama_prompt_clear**
Clear a conversation thread:
`{{ollama_prompt_clear=thread_name}}`
---
