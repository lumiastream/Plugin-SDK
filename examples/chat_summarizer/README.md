# Chat Summarizer (Lumia Stream)

Summarizes recent chat messages on a timer and posts the summary back into the Lumia chat message box. It also highlights users by category.

## How it works

- Use a Lumia automation (or dashboard chat trigger) to call **Ingest Chat Message** for each incoming chat message.
- The plugin buffers messages and posts a summary every N minutes.
- Categories and limits are configured in the plugin settings.

## Suggested Lumia automation

Trigger: **On Chat Message**
Action: **Chat Summarizer → Ingest Chat Message**

Fields:
- Username: `{{username}}`
- Message: `{{message}}`
- Platform: `{{site}}`
- User ID: `{{user_id}}`

## Actions

- **Ingest Chat Message**: Adds one message to the buffer.
- **Summarize Now**: Forces a summary immediately.
- **Clear Buffer**: Clears all buffered messages.

## Settings

- **Summary Interval (minutes)**: How often to summarize.
- **Summary Template**: Control the message format with placeholders like `{interval}` and `{topChatters}`.
- **Categories**: Which categories to include (defaults: feedback, questions, hype).
- **Category Keywords**: Optional per-category keyword overrides.
- **Minimum Messages to Summarize**: Skip summaries when chat is quiet.
- **Max Users Per Category**: Limits list length.
- **Max Summary Length**: Trims long summaries.
- **Max Buffered Messages**: Prevents unbounded memory growth (use 0 for unlimited).

## Variables

- `summary_buckets`: Readable string like `5min ago, totalMessages: 8, topChatters: user1, user2; feedback: (user1:"msg"), (user2:"msg")`. Only buckets with messages are shown.
