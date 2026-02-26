# Custom Overlays Interop (Plugin + Overlay)

Use this guide when a plugin should also drive a visual overlay.

## When To Pair A Plugin With An Overlay

- Use the plugin for API polling, auth, business logic, and normalization.
- Use a custom overlay for on-screen visuals, animations, and event presentation.
- If the feature is mostly visual, build both together with an explicit data contract.

## Primary Bridge: Variables + Alerts

The most reliable communication path between plugin logic and overlay UI is:

1. Plugin writes variables with `this.lumia.setVariable(key, value)`.
2. Plugin triggers alerts with `this.lumia.triggerAlert(...)`.
3. Overlay reads:
   - variables via `Overlay.getVariable("key")` and `{{key}}` in HTML/CSS
   - alert payload via `Overlay.on("alert", (data) => ...)`

### Alert Payload Rules

- Use `dynamic` only for variation matching (`variationConditions`).
- Use `extraSettings` for all payload values that templates/overlays should consume.
- If no variation matching is needed, omit `dynamic`.

```js
await this.lumia.triggerAlert({
	alert: "rumble_stream_started",
	extraSettings: {
		username: state.username,
		stream_title: state.title,
		viewer_count: state.viewerCount,
		thumbnail_url: state.thumbnail,
	},
});
```

## Overlay Runtime Syntax (JS Tab)

```js
Overlay.on("alert", (data) => {
	if (data.alert !== "rumble_stream_started") return;

	const username = data.extraSettings?.username ?? "unknown";
	const title = data.extraSettings?.stream_title ?? "Untitled";
	const viewers = data.extraSettings?.viewer_count ?? 0;

	document.getElementById("line").textContent = `${username} is live: ${title} (${viewers})`;
});

const latestTitle = Overlay.getVariable("rumble_title");
if (latestTitle) {
	document.getElementById("title").textContent = String(latestTitle);
}
```

Notes:

- Use `data.alert` to branch alert types.
- `Overlay.getVariable` should use a string literal key so dependencies can be detected.
- Available listeners: `chat`, `alert`, `hfx`, `virtuallight`, `overlaycontent`.

## Optional Direct Push: `overlaycontent`

Use this only when you need targeted payload delivery to a specific overlay instance.

Plugin side:

```js
await this.lumia.overlaySendCustomContent({
	layer: "custom",
	codeId: "rumble_live_card",
	content: { title: state.title, viewers: state.viewerCount },
});
```

Overlay side:

```js
Overlay.on("overlaycontent", (data) => {
	if (data.codeId !== "rumble_live_card") return;
	const payload = data.content ?? {};
	// render payload...
});
```

`codeId` constraints: letters, numbers, hyphens, underscores, max 25 chars.

## Contract Checklist

Before implementing, define:

- Variable keys written by plugin
- Alert keys triggered by plugin
- `extraSettings` keys consumed by overlay
- Whether `dynamic` is needed for variation matching
- Optional `codeId` if using `overlaycontent`

## References

- Overlay docs: https://dev.lumiastream.com/docs/custom-overlays/custom-overlays-documentation
- Overlay assistant: https://chatgpt.com/g/g-6760d2a59b048191b17812250884971b-lumia-custom-overlays-assistant
