---
1) Pick an auth mode: **Bot** (BotFather token) or **User** (MTProto session).
2) Bot mode:
   - Create a bot with @BotFather and paste the token.
   - Add the bot to the chat/group you want to monitor.
   - Optionally set an allow-list of chat IDs.
3) User mode:
   - Create an app at my.telegram.org to get `api_id` and `api_hash`.
   - Paste a saved session string (recommended), or enter your phone + login code when prompted.
4) Set a default chat ID if you want actions to send without specifying a chat.
5) Enable **Auto Connect** to start polling immediately.

### Notes
- Bots cannot start conversations with users; users must message the bot first or add it to a group.
- Group messages may be hidden if the bot’s privacy mode is enabled.
- User mode uses your own Telegram account; keep credentials private.
- The Send Message action dropdown fills as chats are seen; in user mode it also pulls your dialog list.
 - If Login Code fails, paste a new code and save to retry (codes are single-use).
---
