# Chat Summarizer Setup

## Lumia Commands

There are **2 commands** that will be downloaded to use with Chat Summarizer:

1. **chatmatch** — Helps fill the buckets by ingesting chat messages into the summarizer.
2. **chatcommand** — Contains the `{{chat_summarizer_summary_buckets}}` variable where you'll see the detailed summary of the chat.

## Using with AI Chat

You can use `{{chat_summarizer_summary_buckets}}` as a starting point for your AI chat and display something different. For example:

```
{{ai_prompt={{chat_summarizer_summary_buckets}}}}
```

This passes the summary buckets into your AI prompt so it can analyze the chat and respond based on the categorized messages.
