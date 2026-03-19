const { Plugin } = require("@lumiastream/plugin");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

const DEFAULTS = {
  pollInterval: 300,
  itemWindow: 25,
  requestTimeoutMs: 15000,
  userAgent: "Lumia Stream RSS Feed Monitor/1.0.0",
  maxSeenIdsPerFeed: 500,
};

const ALERT_KEYS = {
  itemChanged: "rss_feed_item_changed",
};

const VARIATION_SELECTION_ACTION_TYPES = new Set([
  "active_input",
  "preview_input",
  "transition_input",
]);

class RssFeedMonitorPlugin extends Plugin {
  constructor(manifest, context) {
    super(manifest, context);
    this._pollTimer = null;
    this._refreshPromise = null;
    this._drainPromise = null;
    this._lastConnectionState = null;
    this._state = this._emptyState();
  }

  async onload() {
    await this._loadStateFromDisk();
    await this._drainPendingAlerts();

    const feeds = this._configuredFeeds();
    if (!feeds.length) {
      await this._updateConnectionState(false);
      await this._log(
        "No valid RSS or Atom feed URLs configured. Add one or more feeds in plugin settings."
      );
      return;
    }

    await this._refreshFeeds({ reason: "startup" });
    this._schedulePolling();
  }

  async onunload() {
    this._clearPolling();
    await this._updateConnectionState(false);
  }

  async onsettingsupdate(settings, previous = {}) {
    const pollChanged =
      this._pollInterval(settings) !== this._pollInterval(previous);
    const itemWindowChanged =
      this._itemWindow(settings) !== this._itemWindow(previous);
    const feedsChanged =
      this._feedsSignature(settings) !== this._feedsSignature(previous);

    if (pollChanged) {
      this._schedulePolling();
    }

    if (feedsChanged) {
      this._pruneStateForFeeds(this._configuredFeeds(settings));
      await this._saveStateToDisk();
    }

    const feeds = this._configuredFeeds(settings);
    if (!feeds.length) {
      this._clearPolling();
      await this._updateConnectionState(false);
      await this._log(
        "Feed monitoring paused because no valid feed URLs are configured."
      );
      return;
    }

    if (!this._pollTimer) {
      this._schedulePolling();
    }

    if (feedsChanged || itemWindowChanged) {
      await this._refreshFeeds({ reason: "settings-update" });
    }
  }

  async validateAuth(data = {}) {
    const feeds = this._configuredFeeds(data);
    if (!feeds.length) {
      return {
        ok: false,
        message: "Add at least one valid RSS or Atom feed URL.",
      };
    }

    try {
      const result = await this._fetchAndParseFeed(feeds[0]);
      if (!Array.isArray(result.items) || !result.items.length) {
        return {
          ok: false,
          message: "The feed loaded, but no items were found.",
        };
      }
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: `Feed validation failed: ${this._errorMessage(error)}`,
      };
    }
  }

  async refreshActionOptions({ actionType, values } = {}) {
    if (!VARIATION_SELECTION_ACTION_TYPES.has(String(actionType || ""))) {
      return;
    }

    if (typeof this.lumia?.updateActionFieldOptions !== "function") {
      return;
    }

    const previewSettings = {
      ...(this.settings && typeof this.settings === "object"
        ? this.settings
        : {}),
      ...(values && typeof values === "object" ? values : {}),
    };

    await this.lumia.updateActionFieldOptions({
      actionType,
      fieldKey: "input",
      options: this._feedVariationOptions(previewSettings),
    });
  }

  async _refreshFeeds({ reason } = {}) {
    if (this._refreshPromise) {
      return this._refreshPromise;
    }

    this._refreshPromise = (async () => {
      const feeds = this._configuredFeeds();
      if (!feeds.length) {
        await this._updateConnectionState(false);
        return;
      }

      this._pruneStateForFeeds(feeds);

      const results = await Promise.allSettled(
        feeds.map((feed) => this._fetchAndParseFeed(feed))
      );

      let successCount = 0;

      for (let index = 0; index < results.length; index += 1) {
        const feed = feeds[index];
        const result = results[index];

        if (result.status !== "fulfilled") {
          await this._log(
            `Failed to refresh ${feed.name}: ${this._errorMessage(result.reason)}`
          );
          continue;
        }

        successCount += 1;
        const feedResult = result.value;
        const feedState = this._ensureFeedState(feed);
        const baselineOnly = !feedState.initialized;
        const normalizedItems = feedResult.items
          .slice(0, this._itemWindow())
          .map((item, itemIndex) =>
            this._normalizeItem(feed, feedResult.feedTitle, item, itemIndex)
          )
          .filter((item) => item);

        const seenIds = new Set(
          Array.isArray(feedState.seenIds) ? feedState.seenIds : []
        );
        const queuedIds = new Set(
          this._state.pendingAlerts.map((entry) => entry.alertId)
        );

        for (const item of normalizedItems) {
          if (seenIds.has(item.id)) {
            continue;
          }

          seenIds.add(item.id);
          if (baselineOnly) {
            continue;
          }

          const pendingAlert = this._buildPendingAlert(item);
          if (!queuedIds.has(pendingAlert.alertId)) {
            this._state.pendingAlerts.push(pendingAlert);
            queuedIds.add(pendingAlert.alertId);
          }
        }

        feedState.initialized = true;
        feedState.url = feed.url;
        feedState.name = feed.name;
        feedState.feedTitle = feedResult.feedTitle || feed.name;
        feedState.updatedAt = Date.now();
        feedState.seenIds = this._trimSeenIds([
          ...normalizedItems.map((item) => item.id),
          ...Array.from(seenIds),
        ]);
      }

      this._state.pendingAlerts = this._sortPendingAlerts(
        this._state.pendingAlerts
      );
      await this._saveStateToDisk();

      if (successCount > 0) {
        await this._updateConnectionState(true);
      } else {
        await this._updateConnectionState(false);
        await this._log(
          `All feed requests failed during ${reason || "refresh"} cycle.`
        );
      }

      await this._drainPendingAlerts();
    })().finally(() => {
      this._refreshPromise = null;
    });

    return this._refreshPromise;
  }

  async _drainPendingAlerts() {
    if (this._drainPromise) {
      return this._drainPromise;
    }

    this._drainPromise = (async () => {
      this._state.pendingAlerts = this._sortPendingAlerts(
        this._state.pendingAlerts
      );

      while (this._state.pendingAlerts.length) {
        const next = this._state.pendingAlerts[0];

        try {
          const dynamic = this._alertDynamic(next);
          await this.lumia.triggerAlert({
            alert: ALERT_KEYS.itemChanged,
            dynamic,
            extraSettings: this._alertVariables(next),
          });
          this._state.pendingAlerts.shift();
          await this._saveStateToDisk();
        } catch (error) {
          await this._log(
            `Failed to trigger RSS alert: ${this._errorMessage(error)}`
          );
          break;
        }
      }

    })().finally(() => {
      this._drainPromise = null;
    });

    return this._drainPromise;
  }

  _schedulePolling() {
    this._clearPolling();
    const intervalMs = this._pollInterval() * 1000;
    this._pollTimer = setTimeout(async () => {
      try {
        await this._refreshFeeds({ reason: "poll" });
      } finally {
        this._schedulePolling();
      }
    }, intervalMs);
  }

  _clearPolling() {
    if (this._pollTimer) {
      clearTimeout(this._pollTimer);
      this._pollTimer = null;
    }
  }

  async _fetchAndParseFeed(feed) {
    const { text: xml } = await this._fetchWithTimeout(feed.url);

    const parsed = this._parseFeedXml(xml, feed);
    if (!parsed.items.length) {
      throw new Error("The feed did not contain any parsable items.");
    }

    return parsed;
  }

  async _fetchWithTimeout(url) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      DEFAULTS.requestTimeoutMs
    );

    try {
      const response = await fetch(url, {
        headers: {
          Accept:
            "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
          "User-Agent": DEFAULTS.userAgent,
        },
        signal: controller.signal,
      });

      const text = await response.text();

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""}`
        );
      }

      return { response, text };
    } catch (error) {
      if (error && error.name === "AbortError") {
        throw new Error("Feed request timed out.");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  _parseFeedXml(xml, feed) {
    const source = String(xml || "");
    if (/<feed\b/i.test(source) && /<entry\b/i.test(source)) {
      return this._parseAtomFeed(source, feed);
    }
    return this._parseRssFeed(source, feed);
  }

  _parseRssFeed(xml, feed) {
    const channelBlock = this._extractFirstBlock(xml, "channel") || xml;
    const feedTitle =
      this._cleanText(this._extractTagText(channelBlock, "title")) ||
      feed.name ||
      this._deriveFeedName(feed.url);
    const itemBlocks = this._extractBlocks(channelBlock, "item");

    return {
      feedTitle,
      items: itemBlocks.map((block) => ({
        title: this._extractTagText(block, "title"),
        link:
          this._extractTagText(block, "link") ||
          this._extractLinkHref(block, "link"),
        guid:
          this._extractTagText(block, "guid") ||
          this._extractTagText(block, "id"),
        publishedAt:
          this._extractTagText(block, "pubDate") ||
          this._extractTagText(block, "published") ||
          this._extractTagText(block, "updated"),
        summary:
          this._extractTagText(block, "description") ||
          this._extractTagText(block, "content:encoded") ||
          this._extractTagText(block, "summary") ||
          this._extractTagText(block, "content"),
        author:
          this._extractTagText(block, "author") ||
          this._extractTagText(block, "dc:creator"),
      })),
    };
  }

  _parseAtomFeed(xml, feed) {
    const feedBlock = this._extractFirstBlock(xml, "feed") || xml;
    const feedTitle =
      this._cleanText(this._extractTagText(feedBlock, "title")) ||
      feed.name ||
      this._deriveFeedName(feed.url);
    const entryBlocks = this._extractBlocks(feedBlock, "entry");

    return {
      feedTitle,
      items: entryBlocks.map((block) => {
        const authorBlock = this._extractFirstBlock(block, "author");
        return {
          title: this._extractTagText(block, "title"),
          link: this._extractAtomLink(block),
          guid: this._extractTagText(block, "id"),
          publishedAt:
            this._extractTagText(block, "published") ||
            this._extractTagText(block, "updated"),
          summary:
            this._extractTagText(block, "summary") ||
            this._extractTagText(block, "content"),
          author:
            this._extractTagText(authorBlock, "name") ||
            this._extractTagText(block, "author"),
        };
      }),
    };
  }

  _normalizeItem(feed, feedTitle, item = {}, sourceIndex = 0) {
    const title = this._cleanText(item.title) || "Untitled item";
    const url = this._normalizeUrlCandidate(item.link);
    const guid = this._cleanText(item.guid, { stripHtml: false });
    const published = this._normalizeTimestamp(item.publishedAt);
    const summary = this._cleanText(item.summary);
    const author = this._cleanText(item.author);
    const identitySource =
      guid || url || `${title}|${published.display}|${summary}|${author}`;

    if (!identitySource) {
      return null;
    }

    return {
      id: this._hash(`${feed.key}|${identitySource}`),
      feedKey: feed.key,
      feedName: feedTitle || feed.name,
      feedUrl: feed.url,
      title,
      url,
      guid: guid || "",
      publishedAt: published.display,
      publishedAtMs: published.ms,
      summary,
      author,
      sourceIndex,
    };
  }

  _buildPendingAlert(item) {
    return {
      alertId: this._hash(`alert|${item.feedKey}|${item.id}`),
      createdAt: Date.now(),
      feed_key: item.feedKey,
      feed_name: item.feedName || "",
      feed_url: item.feedUrl || "",
      item_title: item.title || "",
      item_url: item.url || "",
      item_published: item.publishedAt || "",
      item_summary: item.summary || "",
      item_guid: item.guid || "",
      item_id: item.id || "",
      item_author: item.author || "",
      publishedAtMs: item.publishedAtMs || 0,
    };
  }

  _alertVariables(alert = {}) {
    const feedName = alert.feed_name || alert.latest_feed_name || "";
    const feedUrl = alert.feed_url || alert.latest_feed_url || "";
    const itemTitle = alert.item_title || alert.latest_item_title || "";
    const itemUrl = alert.item_url || alert.latest_item_url || "";
    const itemPublished =
      alert.item_published || alert.latest_item_published || "";
    const itemSummary = alert.item_summary || alert.latest_item_summary || "";
    const itemGuid = alert.item_guid || alert.latest_item_guid || "";
    const itemId = alert.item_id || alert.latest_item_id || "";
    const itemAuthor = alert.item_author || alert.latest_item_author || "";

    return {
      feed_name: feedName,
      feed_url: feedUrl,
      item_title: itemTitle,
      item_url: itemUrl,
      item_published: itemPublished,
      item_summary: itemSummary,
      item_guid: itemGuid,
      item_id: itemId,
      item_author: itemAuthor,
      latest_feed_name: feedName,
      latest_feed_url: feedUrl,
      latest_item_title: itemTitle,
      latest_item_url: itemUrl,
      latest_item_published: itemPublished,
      latest_item_summary: itemSummary,
      latest_item_guid: itemGuid,
      latest_item_id: itemId,
      latest_item_author: itemAuthor,
    };
  }

  _alertDynamic(alert = {}) {
    return {
      value: String(alert.feed_name || alert.latest_feed_name || "").trim(),
    };
  }

  _configuredFeeds(settings = this.settings) {
    const raw = settings?.feeds;
    const feeds = [];
    const seen = new Set();

    for (const parsedLine of this._coerceFeedEntries(raw)) {
      if (!parsedLine?.url) {
        continue;
      }

      try {
        const normalizedUrl = new URL(parsedLine.url);
        if (!/^https?:$/i.test(normalizedUrl.protocol)) {
          continue;
        }

        const finalUrl = normalizedUrl.toString();
        const key = this._hash(finalUrl);
        if (seen.has(key)) {
          continue;
        }

        seen.add(key);
        feeds.push({
          key,
          url: finalUrl,
          name: parsedLine.name || this._deriveFeedName(finalUrl),
        });
      } catch (_error) {}
    }

    return feeds;
  }

  _coerceFeedEntries(raw) {
    if (typeof raw === "string") {
      return raw
        .split(/\r\n|\n|\r/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => this._parseFeedLine(line))
        .filter(Boolean);
    }

    if (Array.isArray(raw)) {
      return raw
        .map((entry) => {
          if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
            return null;
          }
          return {
            name: String(entry.name ?? entry.key ?? "").trim(),
            url: String(entry.value ?? entry.url ?? "").trim(),
          };
        })
        .filter((entry) => entry && entry.url);
    }

    if (raw && typeof raw === "object") {
      return Object.entries(raw)
        .map(([name, value]) => ({
          name: String(name || "").trim(),
          url: String(value ?? "").trim(),
        }))
        .filter((entry) => entry.url);
    }

    return [];
  }

  _parseFeedLine(line) {
    const trimmed = String(line || "").trim();
    if (!trimmed) {
      return null;
    }

    if (/^https?:\/\//i.test(trimmed)) {
      return { name: "", url: trimmed };
    }

    const pipeIndex = trimmed.indexOf("|");
    if (pipeIndex > 0) {
      return {
        name: trimmed.slice(0, pipeIndex).trim(),
        url: trimmed.slice(pipeIndex + 1).trim(),
      };
    }

    const equalsMatch = trimmed.match(/^(.+?)\s*=\s*(https?:\/\/.+)$/i);
    if (equalsMatch) {
      return {
        name: equalsMatch[1].trim(),
        url: equalsMatch[2].trim(),
      };
    }

    return null;
  }

  _feedsSignature(settings = this.settings) {
    return JSON.stringify(
      this._configuredFeeds(settings).map((feed) => [feed.key, feed.name, feed.url])
    );
  }

  _feedVariationOptions(settings = this.settings) {
    return this._configuredFeeds(settings).map((feed) => ({
      label: feed.name,
      value: feed.name,
    }));
  }

  _pollInterval(settings = this.settings) {
    return this._clampNumber(settings?.pollInterval, DEFAULTS.pollInterval, 30, 86400);
  }

  _itemWindow(settings = this.settings) {
    return this._clampNumber(settings?.itemWindow, DEFAULTS.itemWindow, 5, 100);
  }

  _deriveFeedName(urlText = "") {
    try {
      const parsed = new URL(urlText);
      const pathName = parsed.pathname.replace(/\/$/, "");
      return pathName ? `${parsed.host}${pathName}` : parsed.host;
    } catch (_error) {
      return "RSS Feed";
    }
  }

  _normalizeUrlCandidate(value) {
    const trimmed = this._cleanText(value, { stripHtml: false });
    if (!trimmed) {
      return "";
    }

    try {
      const parsed = new URL(trimmed);
      return parsed.toString();
    } catch (_error) {
      return trimmed;
    }
  }

  _normalizeTimestamp(value) {
    const raw = this._cleanText(value, { stripHtml: false });
    if (!raw) {
      return { display: "", ms: 0 };
    }

    const ms = Date.parse(raw);
    if (Number.isFinite(ms)) {
      return { display: new Date(ms).toISOString(), ms };
    }

    return { display: raw, ms: 0 };
  }

  _sortPendingAlerts(alerts = []) {
    return [...alerts].sort((a, b) => {
      const timeDiff = (a?.publishedAtMs || 0) - (b?.publishedAtMs || 0);
      if (timeDiff !== 0) {
        return timeDiff;
      }
      return (a?.createdAt || 0) - (b?.createdAt || 0);
    });
  }

  _trimSeenIds(ids = []) {
    const unique = [];
    const seen = new Set();

    for (const value of ids) {
      const key = String(value || "").trim();
      if (!key || seen.has(key)) {
        continue;
      }
      seen.add(key);
      unique.push(key);
      if (unique.length >= DEFAULTS.maxSeenIdsPerFeed) {
        break;
      }
    }

    return unique;
  }

  _emptyState() {
    return {
      version: 1,
      feeds: {},
      pendingAlerts: [],
    };
  }

  _ensureFeedState(feed) {
    if (!this._state.feeds[feed.key]) {
      this._state.feeds[feed.key] = {
        initialized: false,
        url: feed.url,
        name: feed.name,
        feedTitle: feed.name,
        seenIds: [],
        updatedAt: 0,
      };
    }

    return this._state.feeds[feed.key];
  }

  _pruneStateForFeeds(feeds = []) {
    const allowed = new Set(feeds.map((feed) => feed.key));
    const nextFeeds = {};

    for (const [key, value] of Object.entries(this._state.feeds || {})) {
      if (allowed.has(key)) {
        nextFeeds[key] = value;
      }
    }

    this._state.feeds = nextFeeds;
    this._state.pendingAlerts = this._state.pendingAlerts.filter((entry) =>
      allowed.has(String(entry?.feed_key || ""))
    );
  }

  _stateFilePath() {
    const home = String(process.env.HOME || "").trim();
    if (!home) {
      return path.join(__dirname, ".rss_feed_monitor_state.json");
    }

    return path.join(
      home,
      "Library",
      "Application Support",
      "LumiaStream",
      "plugin-cache",
      "rss_feed_monitor",
      "state.json"
    );
  }

  async _loadStateFromDisk() {
    const filePath = this._stateFilePath();

    try {
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = JSON.parse(raw);
      this._state = {
        version: 1,
        feeds:
          parsed && typeof parsed.feeds === "object" && parsed.feeds
            ? parsed.feeds
            : {},
        pendingAlerts: Array.isArray(parsed?.pendingAlerts)
          ? parsed.pendingAlerts
          : [],
      };
      this._state.pendingAlerts = this._sortPendingAlerts(this._state.pendingAlerts);
    } catch (_error) {
      this._state = this._emptyState();
    }
  }

  async _saveStateToDisk() {
    const filePath = this._stateFilePath();
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(this._state, null, 2), "utf8");
  }

  _extractBlocks(source, tagName) {
    const escaped = this._escapeRegex(tagName);
    const regex = new RegExp(
      `<${escaped}(?:\\s[^>]*)?>[\\s\\S]*?<\\/${escaped}>`,
      "gi"
    );
    return String(source || "").match(regex) || [];
  }

  _extractFirstBlock(source, tagName) {
    return this._extractBlocks(source, tagName)[0] || "";
  }

  _extractTagText(source, tagName) {
    const escaped = this._escapeRegex(tagName);
    const regex = new RegExp(
      `<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`,
      "i"
    );
    const match = String(source || "").match(regex);
    return match ? match[1] : "";
  }

  _extractLinkHref(source, tagName) {
    const escaped = this._escapeRegex(tagName);
    const regex = new RegExp(`<${escaped}\\b([^>]*)\\/?>`, "i");
    const match = String(source || "").match(regex);
    if (!match) {
      return "";
    }
    const attributes = this._parseAttributes(match[1]);
    return attributes.href || "";
  }

  _extractAtomLink(source) {
    const regex = /<link\b([^>]*)\/?>/gi;
    let match = null;
    let fallbackHref = "";

    while ((match = regex.exec(String(source || "")))) {
      const attributes = this._parseAttributes(match[1]);
      const href = attributes.href || "";
      if (!href) {
        continue;
      }
      if (!fallbackHref) {
        fallbackHref = href;
      }
      const rel = String(attributes.rel || "").toLowerCase();
      if (!rel || rel === "alternate") {
        return href;
      }
    }

    return fallbackHref;
  }

  _parseAttributes(source) {
    const attributes = {};
    const regex = /([A-Za-z_:][\w:.-]*)\s*=\s*(['"])(.*?)\2/g;
    let match = null;

    while ((match = regex.exec(String(source || "")))) {
      attributes[match[1]] = match[3];
    }

    return attributes;
  }

  _cleanText(value, options = {}) {
    const stripHtml = options.stripHtml !== false;
    let result = String(value || "");

    result = result.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
    result = result.replace(/<!--[\s\S]*?-->/g, "");
    result = this._decodeXmlEntities(result);

    if (stripHtml) {
      result = result.replace(/<[^>]+>/g, " ");
    }

    return result.replace(/\s+/g, " ").trim();
  }

  _decodeXmlEntities(value) {
    return String(value || "").replace(
      /&(#x?[0-9a-fA-F]+|amp|lt|gt|quot|apos);/g,
      (match, entity) => {
        switch (entity) {
          case "amp":
            return "&";
          case "lt":
            return "<";
          case "gt":
            return ">";
          case "quot":
            return '"';
          case "apos":
            return "'";
          default:
            if (entity.startsWith("#x")) {
              return String.fromCodePoint(parseInt(entity.slice(2), 16));
            }
            if (entity.startsWith("#")) {
              return String.fromCodePoint(parseInt(entity.slice(1), 10));
            }
            return match;
        }
      }
    );
  }

  _clampNumber(value, fallback, min, max) {
    const parsed = Number(value);
    const resolved = Number.isFinite(parsed) ? parsed : fallback;
    return Math.min(max, Math.max(min, Math.round(resolved)));
  }

  _hash(value) {
    return crypto.createHash("sha1").update(String(value || "")).digest("hex");
  }

  _escapeRegex(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  async _updateConnectionState(state) {
    if (this._lastConnectionState === state) {
      return;
    }

    this._lastConnectionState = state;

    try {
      await this.lumia.updateConnection(state);
    } catch (error) {
      await this._log(
        `Failed to update connection state: ${this._errorMessage(error)}`
      );
    }
  }

  async _log(message) {
    await this.lumia.log(`[RSS Feed Monitor] ${message}`);
  }

  _errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
  }
}

module.exports = RssFeedMonitorPlugin;
