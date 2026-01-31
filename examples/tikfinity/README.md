# Tikfinity TikTok LIVE Plugin (Example)

A Lumia Stream plugin that connects to TikTok LIVE streams via the Tikfinity WebSocket service. Receive real-time events including chat messages, gifts, follows, shares, likes, and stream status directly in Lumia Stream.

This example is written in plain JavaScript so you can copy the files directly into `~/Documents/LumiaStream/Plugins/<your_plugin_id>` (or use **Load from Directory** inside Lumia Stream) without running a build step.

## Features

- **Real-time WebSocket Connection**: Live event streaming from TikTok LIVE via Tikfinity
- **Comprehensive Event Support**:
  - Stream start/end detection
  - Live viewer count tracking
  - Chat messages with avatar display
  - Gift tracking with streak support (combo gifts)
  - Follow notifications
  - Share notifications
  - Like events
  - Subscribe events
- **Automatic Reconnection**: Built-in reconnect logic if connection drops
- **Gift Streak Management**: Properly handles TikTok's combo gift system
- **Template Variables**: All data exposed as Lumia variables for use in automations and overlays

## Files

```
examples/tikfinity/
├── main.js                 # Plugin implementation (CommonJS module)
├── manifest.json           # Plugin metadata and configuration definition
├── package.json            # Declares the SDK dependency
└── README.md               # This file
```

## Quick Setup Instructions

### 1. Copy Files

Create a new folder for your plugin (e.g., `~/Documents/LumiaStream/Plugins/tikfinity`):

```bash
mkdir -p ~/Documents/LumiaStream/Plugins/tikfinity
```

Copy the following files from this example into that folder:
- `manifest.json`
- `main.js`
- `package.json`

### 2. Install Dependencies (Optional)

If you want to use `npm` to manage dependencies:

```bash
cd ~/Documents/LumiaStream/Plugins/tikfinity
npm install
```

### 3. Load in Lumia Stream

1. Launch Lumia Stream
2. Go to **Settings** → **Plugins**
3. Click **Load from Directory** and select your plugin folder
4. Or restart Lumia Stream if you copied files into the plugins folder

### 4. Configure the Plugin

1. Open the plugin settings in Lumia Stream
2. Enter your **TikTok username** (without the @ symbol)
3. (Optional) Add your **Tikfinity API Key** for Pro features
   - Get your API key from [https://tikfinity.zerody.one](https://tikfinity.zerody.one)
4. Click **Save**
5. The plugin will automatically connect when you go LIVE on TikTok

## How It Works

### Connection

The plugin uses WebSocket to connect to Tikfinity's service:

```
wss://tikfinity-cws-1.zerody.one/?uniqueId=YOUR_USERNAME
```

When you provide an API key, it's appended:

```
wss://tikfinity-cws-1.zerody.one/?uniqueId=YOUR_USERNAME&apiKey=YOUR_API_KEY
```

### Event Processing

The plugin listens for various TikTok LIVE events and processes them:

1. **Stream Events**: Connected (stream start), disconnected, stream end
2. **Viewer Events**: Room user updates (viewer count), member joins
3. **Chat Events**: Real-time chat messages displayed in Lumia
4. **Gift Events**: Gifts with proper streak/combo handling
5. **Social Events**: Follows, shares, likes, subscribes

### Gift Streak Handling

TikTok has a combo gift system where viewers can send the same gift multiple times rapidly. The plugin handles this by:

1. Detecting repeatable gifts (giftType === 1)
2. Accumulating the repeat count
3. Waiting 5 seconds after the last increment
4. Triggering a single alert with the final count

This prevents alert spam and shows the actual total gift amount.

## Variables

The plugin exposes the following Lumia variables:

| Variable | Description |
|----------|-------------|
| `tikfinity_connected` | Whether the WebSocket connection is active |
| `tikfinity_live` | Whether the TikTok stream is currently live |
| `tikfinity_viewers` | Current number of concurrent viewers |
| `tikfinity_total_viewers` | Total viewers that have joined the session |
| `tikfinity_title` | Current stream title |
| `tikfinity_likes` | Total likes received during the stream |
| `tikfinity_diamonds` | Total diamonds received during the stream |
| `tikfinity_followers` | Session follower count |
| `tikfinity_shares` | Number of shares during the stream |
| `tikfinity_last_chatter` | Username of the last person to chat |
| `tikfinity_last_gifter` | Username of the last person to send a gift |
| `tikfinity_last_follower` | Username of the last person to follow |

## Alerts

The plugin triggers the following alerts:

### streamStarted
Triggered when the stream goes live.

**Variables**: `tikfinity_live`, `tikfinity_viewers`, `tikfinity_title`

### streamEnded
Triggered when the stream ends.

**Variables**: `tikfinity_viewers`, `tikfinity_likes`, `tikfinity_diamonds`, `tikfinity_followers`, `tikfinity_shares`

### chat
Triggered for each chat message (optional, currently disabled in code to reduce alert spam).

**Variables**: `tikfinity_last_chatter`

### gift
Triggered when a gift is received (after streak finalization).

**Variables**: `tikfinity_last_gifter`, `tikfinity_diamonds`

**Variation Conditions**:
- Greater than (diamond value threshold)
- Random (percent chance)

### follow
Triggered when someone follows.

**Variables**: `tikfinity_last_follower`, `tikfinity_followers`

### share
Triggered when someone shares the stream.

**Variables**: `tikfinity_shares`

### like
Triggered when someone likes.

**Variables**: `tikfinity_likes`

**Variation Conditions**:
- Greater than (like count threshold)
- Random (percent chance)

### subscribe
Triggered when someone subscribes.

## Actions

### Manual Connect
Manually initiate connection to Tikfinity WebSocket service.

### Manual Disconnect
Manually disconnect from Tikfinity.

### Test Alert
Trigger a test stream started alert to verify your setup.

## Settings

### TikTok Username (Required)
Your TikTok username without the @ symbol. This is the username you use to go LIVE.

### Tikfinity API Key (Optional)
Your Tikfinity Pro API key for enhanced features. Get it from [https://tikfinity.zerody.one](https://tikfinity.zerody.one).

### Reconnect Interval (Default: 30 seconds)
How long to wait before attempting reconnection after a disconnect. Range: 10-300 seconds.

## Architecture Notes

### WebSocket Management
- Automatic reconnection on disconnect (unless manually disconnected)
- Proper cleanup of timers and event handlers
- Connection state tracking

### Gift Streak System
The plugin maintains a Map of active gift streaks:

```javascript
{
  "username_giftId": {
    timer: setTimeout,
    lastCount: number,
    data: originalEventData
  }
}
```

When a repeatable gift event comes in:
1. Clear existing timer if present
2. Update last count
3. Set new 5-second finalization timer
4. If `repeatEnd` is received, finalize immediately

### Session Management
Session data resets on stream end:
- Viewer counts
- Like/diamond totals
- Follower tracking (Set)
- Last user tracking

## Customization

### Adjust Gift Finalization Timeout

In `main.js`, line ~92:

```javascript
this.GIFT_FINALIZE_TIMEOUT = 5000; // Change to your preference (milliseconds)
```

### Enable Chat Alerts

In the `handleChatEvent` method (line ~578), uncomment:

```javascript
await this.lumia.triggerAlert({
	alert: ALERT_TYPES.CHAT,
	extraSettings: {
		...this.buildAlertVariables(),
		username,
		displayname,
		message,
		avatar,
	},
});
```

### Add Custom Variables

1. Add to `manifest.json` under `config.variables`
2. Update session data structure in `createEmptySession()`
3. Set values in appropriate event handlers
4. Include in `buildAlertVariables()`

### Modify WebSocket URL

Change the `buildWebSocketUrl()` method to use different instances or endpoints.

## Comparison to Other Integrations

### vs. Built-in TikTok Integration
The built-in TikTok integration in Lumia Stream uses the `tiktok-live-connector` library and connects directly to TikTok. This plugin uses Tikfinity as a proxy service, which may provide:

- More stability (if TikTok changes their API)
- Additional features from Tikfinity
- Potential rate limit advantages

### vs. Rumble Plugin
- **Rumble**: Polling-based (REST API every N seconds)
- **Tikfinity**: WebSocket-based (real-time events)

Tikfinity provides instant notifications, while Rumble requires periodic polling. However, Tikfinity requires an active WebSocket connection.

## Troubleshooting

### Connection Fails
1. Verify your TikTok username is correct
2. Make sure you're going LIVE on TikTok
3. Check if you need a Tikfinity Pro API key
4. Check Lumia logs for specific error messages

### Reconnection Loop
1. Check your reconnect interval setting
2. Verify Tikfinity service status
3. Ensure your API key is valid (if using Pro)

### Missing Events
1. Verify alerts are enabled in Lumia
2. Check that the stream is actually live
3. Review Lumia logs for processing errors

### Gift Alerts Delayed
This is expected behavior due to gift streak handling. The plugin waits 5 seconds after the last gift in a combo before triggering the alert with the total count.

## TypeScript Version

To convert to TypeScript:

1. Rename `main.js` to `main.ts`
2. Add type definitions for the Plugin SDK
3. Create a `tsconfig.json`:

```json
{
	"compilerOptions": {
		"target": "ES2020",
		"module": "CommonJS",
		"strict": true,
		"esModuleInterop": true,
		"skipLibCheck": true,
		"outDir": "dist",
		"rootDir": "."
	},
	"include": ["main.ts"]
}
```

4. Compile with `npx tsc`
5. Update `manifest.json` to point to `dist/main.js`

## Contributing

This is an example plugin. Feel free to modify and enhance it for your needs. If you add useful features, consider sharing them with the Lumia Stream community!

## License

MIT License

## Support

- **Tikfinity**: [https://tikfinity.zerody.one](https://tikfinity.zerody.one)
- **Lumia Stream**: [https://lumiastream.com](https://lumiastream.com)
- **Lumia Discord**: [Join Discord](https://discord.gg/lumiastream)

## Credits

Created based on the Lumia Stream Plugin SDK and inspired by the built-in TikTok integration and Rumble plugin example.
