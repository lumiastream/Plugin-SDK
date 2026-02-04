const { Plugin } = require("@lumiastream/plugin");

const NEWS_API_BASE = "https://newsapi.org/v2";

const DEFAULTS = {
  pollInterval: 300,
  resultsLimit: 5,
};

const VARIABLE_NAMES = {
  title: "hotnews_latest_title",
  description: "hotnews_latest_description",
  url: "hotnews_latest_url",
  source: "hotnews_latest_source",
  image: "hotnews_latest_image",
  published: "hotnews_latest_published",
  count: "hotnews_article_count",
  collection: "hotnews_recent_articles",
  keyword: "hotnews_keyword",
  lastUpdated: "hotnews_last_updated",
};

class HotNewsPlugin extends Plugin {
  constructor(manifest, context) {
    super(manifest, context);
    this._pollTimer = null;
    this._seenUrls = new Set();
    this._seenQueue = [];
    this._lastConnectionState = null;
  }

  async onload() {
    await this._log("Hot News plugin starting up.");

    if (!this._apiKey()) {
      await this._log(
        "NewsAPI key not configured. Add your key in the plugin settings to start polling headlines.",
        "warn"
      );
      await this._updateConnectionState(false);
      await this._primeVariables();
      return;
    }

    await this._primeVariables();
    await this._refreshHeadlines({ initial: true });
    this._schedulePolling();
  }

  async onunload() {
    this._clearPolling();
    await this._updateConnectionState(false);
    await this._log("Hot News plugin stopped.");
  }

  async onsettingsupdate(settings, previous = {}) {
    const apiKeyChanged = (settings?.apiKey ?? "") !== (previous?.apiKey ?? "");
    const pollChanged =
      Number(settings?.pollInterval) !== Number(previous?.pollInterval);
    const filterChanged =
      settings?.country !== previous?.country ||
      settings?.category !== previous?.category ||
      settings?.query !== previous?.query ||
      settings?.resultsLimit !== previous?.resultsLimit;

    if (apiKeyChanged && !this._apiKey()) {
      await this._log(
        "NewsAPI key cleared from settings; pausing headline polling.",
        "warn"
      );
      this._clearPolling();
      await this._updateConnectionState(false);
      return;
    }

    if (pollChanged || apiKeyChanged) {
      this._schedulePolling();
    }

    if (filterChanged || apiKeyChanged) {
      this._seenUrls.clear();
      this._seenQueue = [];
      await this._refreshHeadlines({ reason: "settings-update" });
    }
  }

  async actions(config = {}) {
    const actions = Array.isArray(config.actions) ? config.actions : [];
    if (!actions.length) {
      return;
    }

    for (const action of actions) {
      const data = action?.data ?? action?.value ?? {};
      try {
        switch (action?.type) {
          case "hotnews_manual_refresh":
            await this._refreshHeadlines({ reason: "manual-action" });
            break;
          case "hotnews_search_topic":
            await this._handleSearchAction(data);
            break;
          default:
            await this._log(
              `Received unknown action type: ${action?.type ?? "undefined"}`,
              "warn"
            );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await this._log(
          `Action ${action?.type ?? "unknown"} failed: ${message}`,
          "error"
        );
      }
    }
  }

  async validateAuth(data = {}) {
    const apiKey =
      typeof data?.apiKey === "string" && data.apiKey.trim().length
        ? data.apiKey.trim()
        : this._apiKey();

    if (!apiKey) {
      await this._log("Validation failed: NewsAPI key is required.", "warn");
      return false;
    }

    try {
      const payload = await this._fetchHeadlines({
        apiKey,
        country: data?.country ?? this._country(),
        category: data?.category ?? this._category(),
        keyword: data?.query ?? this._keyword(),
        limit: 1,
      });

      if (Array.isArray(payload?.articles)) {
        await this._log("NewsAPI authentication succeeded.");
        return true;
      }

      await this._log(
        "Validation failed: unexpected response from NewsAPI.",
        "warn"
      );
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this._log(`NewsAPI validation failed: ${message}`, "error");
      return false;
    }
  }

  async _handleSearchAction(data = {}) {
    const rawQuery = typeof data?.query === "string" ? data.query.trim() : "";
    if (!rawQuery) {
      throw new Error("Search action requires a keyword or phrase.");
    }

    const limit = this._coerceNumber(data?.limit, this._resultsLimit());
    await this._log(`Running one-off search for "${rawQuery}".`);

    const response = await this._fetchHeadlines({
      keyword: rawQuery,
      limit,
      country: "",
      category: "",
    });

    await this._processHeadlines(response, {
      keyword: rawQuery,
      initial: true,
    });
  }

  async _refreshHeadlines(options = {}) {
    if (!this._apiKey()) {
      return;
    }

    try {
      const response = await this._fetchHeadlines({
        keyword: this._keyword(),
        limit: this._resultsLimit(),
        country: this._country(),
        category: this._category(),
      });

      await this._processHeadlines(response, {
        keyword: this._keyword(),
        initial: Boolean(options.initial),
      });

      await this._updateConnectionState(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this._log(`Failed to refresh headlines: ${message}`, "warn");
      await this._updateConnectionState(false);
    }
  }

  async _processHeadlines(payload = {}, options = {}) {
    const articles = Array.isArray(payload?.articles)
      ? payload.articles.filter((article) => article && article.title)
      : [];

    const keyword = options.keyword ?? this._keyword();
    const nowIso = new Date().toISOString();
    const latest = articles[0] ?? null;
    const unseenArticle = this._findFirstUnseen(articles);
    const articleSummaries = articles.slice(0, 20).map((article) => ({
      title: article.title ?? "",
      source: article.source?.name ?? "",
      url: article.url ?? "",
      publishedAt: article.publishedAt ?? "",
      image: article.urlToImage ?? "",
      description: article.description ?? "",
    }));

    await Promise.all([
      this._setVariable(VARIABLE_NAMES.title, latest?.title ?? ""),
      this._setVariable(VARIABLE_NAMES.description, latest?.description ?? ""),
      this._setVariable(VARIABLE_NAMES.url, latest?.url ?? ""),
      this._setVariable(VARIABLE_NAMES.source, latest?.source?.name ?? ""),
      this._setVariable(VARIABLE_NAMES.image, latest?.urlToImage ?? ""),
      this._setVariable(VARIABLE_NAMES.published, latest?.publishedAt ?? ""),
      this._setVariable(VARIABLE_NAMES.count, articles.length),
      this._setVariable(
        VARIABLE_NAMES.collection,
        JSON.stringify({
          keyword,
          count: articles.length,
          articles: articleSummaries,
        })
      ),
      this._setVariable(VARIABLE_NAMES.keyword, keyword || ""),
      this._setVariable(VARIABLE_NAMES.lastUpdated, nowIso),
    ]);

    for (const article of articles) {
      if (typeof article?.url === "string" && article.url) {
        this._rememberSeen(article.url);
      }
    }

    if (!options.initial && this._alertsEnabled() && unseenArticle) {
      await this._triggerNewHeadlineAlert(unseenArticle, keyword);
    }

    if (latest) {
      await this._log(
        `Latest headline: ${latest.source?.name ?? "Unknown Source"} – ${
          latest.title
        }`
      );
    } else {
      await this._log("No articles returned for the current filters.", "warn");
    }
  }

  async _triggerNewHeadlineAlert(article, keyword) {
    try {
      await this.lumia.triggerAlert({
        alert: "hotnews_new_headline",
        extraSettings: {
          hotnews_latest_title: article.title ?? "",
          hotnews_latest_source: article.source?.name ?? "",
          hotnews_latest_url: article.url ?? "",
          hotnews_latest_published: article.publishedAt ?? "",
          hotnews_keyword: keyword ?? "",
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this._log(`Failed to trigger headline alert: ${message}`, "warn");
    }
  }

  async _fetchHeadlines({ apiKey, keyword, limit, country, category }) {
    const effectiveKey = apiKey || this._apiKey();
    if (!effectiveKey) {
      throw new Error("Missing NewsAPI key.");
    }

    const clampedLimit = Math.max(
      1,
      Math.min(100, this._coerceNumber(limit, DEFAULTS.resultsLimit))
    );
    const url = new URL(`${NEWS_API_BASE}/top-headlines`);
    url.searchParams.set("pageSize", String(clampedLimit));
    url.searchParams.set("page", "1");

    const resolvedKeyword = typeof keyword === "string" ? keyword.trim() : "";
    if (resolvedKeyword) {
      url.searchParams.set("q", resolvedKeyword);
    }

    const resolvedCountry =
      typeof country === "string" ? country.trim().toLowerCase() : "";
    if (resolvedCountry) {
      url.searchParams.set("country", resolvedCountry);
    }

    const resolvedCategory =
      typeof category === "string" ? category.trim().toLowerCase() : "";
    if (resolvedCategory) {
      url.searchParams.set("category", resolvedCategory);
    }

    if (!resolvedCountry && !resolvedKeyword) {
      url.searchParams.set("language", "en");
    }

    const response = await fetch(url.toString(), {
      headers: {
        "X-Api-Key": effectiveKey,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `NewsAPI error (${response.status}): ${body || "No response body"}`
      );
    }

    const json = await response.json();
    if (json?.status !== "ok") {
      throw new Error(
        json?.message
          ? `NewsAPI returned an error: ${json.message}`
          : "NewsAPI response did not include a success status."
      );
    }

    return json;
  }

  _findFirstUnseen(articles = []) {
    for (const article of articles) {
      const url = typeof article?.url === "string" ? article.url : "";
      if (!url) {
        continue;
      }
      if (!this._seenUrls.has(url)) {
        return article;
      }
    }
    return null;
  }

  _rememberSeen(url) {
    if (!url || this._seenUrls.has(url)) {
      return;
    }

    this._seenUrls.add(url);
    this._seenQueue.push(url);

    const MAX_SEEN = 200;
    while (this._seenQueue.length > MAX_SEEN) {
      const removed = this._seenQueue.shift();
      if (removed) {
        this._seenUrls.delete(removed);
      }
    }
  }

  async _primeVariables() {
    await Promise.all([
      this._setVariable(VARIABLE_NAMES.title, ""),
      this._setVariable(VARIABLE_NAMES.description, ""),
      this._setVariable(VARIABLE_NAMES.url, ""),
      this._setVariable(VARIABLE_NAMES.source, ""),
      this._setVariable(VARIABLE_NAMES.image, ""),
      this._setVariable(VARIABLE_NAMES.published, ""),
      this._setVariable(VARIABLE_NAMES.count, 0),
      this._setVariable(
        VARIABLE_NAMES.collection,
        JSON.stringify({ keyword: "", count: 0, articles: [] })
      ),
      this._setVariable(VARIABLE_NAMES.keyword, this._keyword() || ""),
      this._setVariable(VARIABLE_NAMES.lastUpdated, ""),
    ]);
  }

  _schedulePolling() {
    this._clearPolling();

    const intervalSeconds = this._pollInterval();
    if (!this._apiKey() || intervalSeconds <= 0) {
      return;
    }

    this._pollTimer = setInterval(() => {
      void this._refreshHeadlines();
    }, intervalSeconds * 1000);
  }

  _clearPolling() {
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  }

  async _updateConnectionState(state) {
    if (this._lastConnectionState === state) {
      return;
    }

    this._lastConnectionState = state;

    if (typeof this.lumia.updateConnection === "function") {
      try {
        await this.lumia.updateConnection(state);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await this._log(
          `Failed to update connection state: ${message}`,
          "warn"
        );
      }
    }
  }

  _apiKey() {
    const value = this.settings?.apiKey;
    return typeof value === "string" ? value.trim() : "";
  }

  _pollInterval() {
    const configured = this._coerceNumber(this.settings?.pollInterval, null);
    if (configured === null) {
      return DEFAULTS.pollInterval;
    }
    return Math.max(60, Math.min(1800, Math.round(configured)));
  }

  _resultsLimit() {
    return Math.max(
      1,
      Math.min(
        20,
        this._coerceNumber(this.settings?.resultsLimit, DEFAULTS.resultsLimit)
      )
    );
  }

  _country() {
    const raw = this.settings?.country;
    return typeof raw === "string" ? raw.trim().toLowerCase() : "";
  }

  _category() {
    const raw = this.settings?.category;
    return typeof raw === "string" ? raw.trim().toLowerCase() : "";
  }

  _keyword() {
    const raw = this.settings?.query;
    return typeof raw === "string" ? raw.trim() : "";
  }

  _alertsEnabled() {
    return this.settings?.enableAlerts !== false;
  }

  _coerceNumber(value, fallback) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim().length) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
  }

  async _setVariable(name, value) {
    try {
      await this.lumia.setVariable(name, value);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this._log(`Failed to set variable ${name}: ${message}`, "warn");
    }
  }

  async _log(message, level = "info") {
    if (level !== "warn" && level !== "error") {
      return;
    }
    const prefix = `[${this.manifest?.id ?? "hot_planet_news"}]`;
    const decorated =
      level === "warn"
        ? `${prefix} ⚠️ ${message}`
        : level === "error"
        ? `${prefix} ❌ ${message}`
        : `${prefix} ${message}`;

    try {
      await this.lumia.addLog(decorated);
    } catch {
      // Silently ignore logging failures.
    }
  }
}

module.exports = HotNewsPlugin;
