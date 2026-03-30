### Common Actions

- **Create Post**: publish text, replies, quote posts, plus one optional media item from a local file or `https` URL.
- **Delete Latest Created Post**: useful for "go live" announcement cleanup after a stream ends.
- **Like / Repost**: manage engagement on a target post ID.
- **Follow User**: accepts either a numeric X user ID or a handle such as `jack`.

### Live Announcement Flow

To mimic the common "post when live, remove when offline" setup:

1. Trigger **Create Post** from your stream-online event.
2. Use Lumia variables in the post text for title/category/game info.
3. Trigger **Delete Latest Created Post** from your stream-offline event.

### Media Input

The **Media** field opens a picker with local-file and URL modes.

- Local files are returned as absolute paths, for example `/Users/me/Videos/live.mp4`
- Remote files are stored as a single `https://...` URL

Images use the single-upload endpoint. Videos use X's chunked upload flow before the post is created.
