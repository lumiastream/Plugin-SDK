const { Plugin } = require("@lumiastream/plugin");

/** Alert keys defined in manifest.json; used when triggering prayer/ramadan alerts. */
const ALERT_KEYS = {
  fajr: "mawakit_fajr",
  sunrise: "mawakit_shuruq",
  dhuhr: "mawakit_dhuhr",
  asr: "mawakit_asr",
  maghrib: "mawakit_maghrib",
  isha: "mawakit_isha",
  ramadan: "mawakit_ramadan_soon",
};

/** Prayer order and their corresponding alert/offset setting keys. Sunrise is displayed as Shuruq. */
const PRAYER_ORDER = [
  { key: "Fajr", alert: ALERT_KEYS.fajr, offsetKey: "offsetFajr" },
  { key: "Sunrise", alert: ALERT_KEYS.sunrise, offsetKey: "offsetSunrise" },
  { key: "Dhuhr", alert: ALERT_KEYS.dhuhr, offsetKey: "offsetDhuhr" },
  { key: "Asr", alert: ALERT_KEYS.asr, offsetKey: "offsetAsr" },
  { key: "Maghrib", alert: ALERT_KEYS.maghrib, offsetKey: "offsetMaghrib" },
  { key: "Isha", alert: ALERT_KEYS.isha, offsetKey: "offsetIsha" },
];

const VARIABLE_KEYS = {
  fajr: "fajr",
  sunrise: "sunrise",
  dhuhr: "dhuhr",
  asr: "asr",
  maghrib: "maghrib",
  isha: "isha",
  hijriDate: "hijri_date",
  hijriMonth: "hijri_month",
  hijriDay: "hijri_day",
  location: "location",
  nextPrayer: "next_prayer",
  nextPrayerTime: "next_prayer_time",
  prayerTimes: "prayer_times",
};

/** Cache timings for 10 minutes to avoid hitting the Aladhan API too frequently. */
const CACHE_TTL_MS = 10 * 60 * 1000;

/** Default city when only country is set (Aladhan API requires city+country). */
const DEFAULT_CITY_BY_COUNTRY = {
  Morocco: "Casablanca",
  "Saudi Arabia": "Mecca",
  Egypt: "Cairo",
  Turkey: "Istanbul",
  Indonesia: "Jakarta",
  Pakistan: "Karachi",
  Malaysia: "Kuala Lumpur",
  Algeria: "Algiers",
  "United Arab Emirates": "Dubai",
  Nigeria: "Lagos",
  Tunisia: "Tunis",
  Jordan: "Amman",
  Lebanon: "Beirut",
  Syria: "Damascus",
  Iraq: "Baghdad",
  Iran: "Tehran",
  Afghanistan: "Kabul",
  Bangladesh: "Dhaka",
  Yemen: "Sana'a",
  Libya: "Tripoli",
  Palestine: "Ramallah",
  Kuwait: "Kuwait City",
  Qatar: "Doha",
  Bahrain: "Manama",
  Oman: "Muscat",
  Sudan: "Khartoum",
  Somalia: "Mogadishu",
  Mauritania: "Nouakchott",
  Senegal: "Dakar",
  Mali: "Bamako",
  Niger: "Niamey",
  "Burkina Faso": "Ouagadougou",
  Gambia: "Banjul",
  Guinea: "Conakry",
};

class MawakitPlugin extends Plugin {
  constructor(manifest, context) {
    super(manifest, context);
    this._pollTimer = null;
    this._midnightTimer = null;
    this._ramadanTimer = null;
    this._bootstrapTimer = null;
    this._prayerTimers = new Map();
    this._cache = new Map();
    this._state = {
      timings: null,
      hijri: null,
      meta: null,
      location: null,
      locationLabel: "",
    };
    this._lastRamadanAlertDate = null;
    this._lastToast = null;
  }

  async onload() {
    this._ensureStart({ reason: "load" });
  }

  async onunload() {
    this._clearTimers();
  }

  async onsettingsupdate(settings, previous = {}) {
    this._ensureStart({ reason: "settings-update", previous });
  }

  async variableFunction(config) {
    const key = config?.key;
    const args = Array.isArray(config?.args) ? config.args : [];
    const raw = typeof config?.value === "string" ? config.value : "";

    if (key !== "mawakit_prayer_times" && key !== "mawakit_hijri_date") {
      return "";
    }

    // Resolve location: variable args (city|country or lat,lon) → settings → cached state
    const location =
      this._resolveLocationFromArgs(args, raw) ||
      this._resolveLocationWithCountryFallback(this.settings) ||
      this._state.location;

    if (!location) {
      // mawakit_prayer_times must never return empty - use last known or placeholder
      if (key === "mawakit_prayer_times" && this._state.locationLabel) {
        return (
          this._buildPrayerTimesString() ||
          `Location=${this._state.locationLabel}`
        );
      }
      return key === "mawakit_hijri_date"
        ? ""
        : "Set location in Mawakit settings";
    }

    const timings = await this._fetchTimingsCached({ location });
    if (!timings) {
      if (key === "mawakit_prayer_times") {
        const fallback = this._buildPrayerTimesString();
        if (fallback) return fallback;
        return `Location=${location?.city || location?.latitude || "Unknown"}`;
      }
      return "";
    }

    if (key === "mawakit_hijri_date") {
      return timings.hijri?.date ?? "";
    }

    const parts = [
      `Fajr=${timings.timings?.Fajr ?? ""}`,
      `Sunrise=${timings.timings?.Sunrise ?? ""}`,
      `Dhuhr=${timings.timings?.Dhuhr ?? ""}`,
      `Asr=${timings.timings?.Asr ?? ""}`,
      `Maghrib=${timings.timings?.Maghrib ?? ""}`,
      `Isha=${timings.timings?.Isha ?? ""}`,
      `Hijri=${timings.hijri?.date ?? ""}`,
      `Location=${timings.locationLabel ?? ""}`,
    ];

    return parts.join(", ");
  }

  async _start({ reason } = {}) {
    this._clearTimers();
    await this._refreshTimings({ reason });
    this._schedulePolling();
    this._scheduleMidnightRefresh();
    this._schedulePrayerAlerts();
    this._scheduleRamadanCheck();
  }

  _clearTimers() {
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
    if (this._midnightTimer) {
      clearTimeout(this._midnightTimer);
      this._midnightTimer = null;
    }
    if (this._ramadanTimer) {
      clearInterval(this._ramadanTimer);
      this._ramadanTimer = null;
    }
    for (const timer of this._prayerTimers.values()) {
      clearTimeout(timer);
    }
    this._prayerTimers.clear();
    if (this._bootstrapTimer) {
      clearTimeout(this._bootstrapTimer);
      this._bootstrapTimer = null;
    }
  }

  /**
   * Start the plugin when Lumia is ready. If context.lumia isn't available yet (e.g. during init),
   * retry after 500ms until it is.
   */
  _ensureStart({ reason, previous } = {}) {
    if (this._hasLumia()) {
      void this._start({ reason, previous });
      return;
    }
    if (this._bootstrapTimer) {
      return;
    }
    this._bootstrapTimer = setTimeout(() => {
      this._bootstrapTimer = null;
      this._ensureStart({ reason, previous });
    }, 500);
  }

  _schedulePolling() {
    const intervalMinutes = this._coerceNumber(
      this.settings?.pollIntervalMinutes,
      60,
    );
    if (intervalMinutes <= 0) {
      return;
    }
    this._pollTimer = setInterval(
      () => {
        void this._refreshTimings({ reason: "poll" });
      },
      intervalMinutes * 60 * 1000,
    );
  }

  /**
   * Refresh timings at 00:05 local time so a new day's prayer schedule is loaded.
   * Schedules itself again after each run to run every night.
   */
  _scheduleMidnightRefresh() {
    const now = new Date();
    const next = new Date(now);
    next.setHours(0, 5, 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    this._midnightTimer = setTimeout(() => {
      void this._refreshTimings({ reason: "midnight" }).then(() => {
        this._schedulePrayerAlerts();
        this._scheduleMidnightRefresh();
      });
    }, next.getTime() - now.getTime());
  }

  _schedulePrayerAlerts() {
    for (const timer of this._prayerTimers.values()) {
      clearTimeout(timer);
    }
    this._prayerTimers.clear();

    if (!this._state.timings) {
      return;
    }

    const now = new Date();
    const timezoneOffsetMinutes = this._coerceNumber(
      this.settings?.timezoneOffsetMinutes,
      0,
    );
    const alertMinutesBefore = this._coerceNumber(
      this.settings?.alertMinutesBefore,
      0,
    );

    for (const prayer of PRAYER_ORDER) {
      const time = this._state.timings?.[prayer.key];
      if (!time) {
        continue;
      }
      const offsetMinutes = this._coerceNumber(
        this.settings?.[prayer.offsetKey],
        0,
      );
      let target = this._buildTimeToday(
        time,
        timezoneOffsetMinutes + offsetMinutes,
      );
      if (!target || target <= now) {
        continue;
      }
      if (alertMinutesBefore > 0) {
        target = new Date(target.getTime() - alertMinutesBefore * 60 * 1000);
        if (target <= now) {
          continue;
        }
      }
      const delay = target.getTime() - now.getTime();
      const timer = setTimeout(() => {
        void this._emitPrayerAlert(prayer.key, time, alertMinutesBefore);
        void this._refreshNextPrayer();
      }, delay);
      this._prayerTimers.set(prayer.key, timer);
    }

    void this._refreshNextPrayer();
  }

  _scheduleRamadanCheck() {
    if (this.settings?.enableRamadanAlert === false) {
      return;
    }
    this._ramadanTimer = setInterval(
      () => {
        void this._maybeRamadanAlert();
      },
      6 * 60 * 60 * 1000,
    );
    void this._maybeRamadanAlert();
  }

  async _refreshTimings({ reason } = {}) {
    const location = this._resolveLocationWithCountryFallback(this.settings);
    if (!location) {
      if (reason !== "poll") {
        await this._toastOnce(
          "Set a location in Mawakit settings to enable prayer time alerts.",
        );
      }
      return;
    }

    const data = await this._fetchTimingsCached({ location });
    if (!data) {
      return;
    }

    this._state.timings = data.timings || null;
    this._state.hijri = data.hijri || null;
    this._state.meta = data.meta || null;
    this._state.location = location;
    this._state.locationLabel = data.locationLabel || "";
    await this._applyVariables();
  }

  async _applyVariables() {
    if (!this._hasLumia()) {
      return;
    }

    const timings = this._state.timings || {};
    const vars = {
      [VARIABLE_KEYS.fajr]: this._applyOffsetToTime(
        timings.Fajr,
        this.settings?.offsetFajr,
      ),
      [VARIABLE_KEYS.sunrise]: this._applyOffsetToTime(
        timings.Sunrise,
        this.settings?.offsetSunrise,
      ),
      [VARIABLE_KEYS.dhuhr]: this._applyOffsetToTime(
        timings.Dhuhr,
        this.settings?.offsetDhuhr,
      ),
      [VARIABLE_KEYS.asr]: this._applyOffsetToTime(
        timings.Asr,
        this.settings?.offsetAsr,
      ),
      [VARIABLE_KEYS.maghrib]: this._applyOffsetToTime(
        timings.Maghrib,
        this.settings?.offsetMaghrib,
      ),
      [VARIABLE_KEYS.isha]: this._applyOffsetToTime(
        timings.Isha,
        this.settings?.offsetIsha,
      ),
      [VARIABLE_KEYS.location]: this._state.locationLabel || "",
      [VARIABLE_KEYS.hijriDate]: (this._state.hijri || {}).date || "",
      [VARIABLE_KEYS.hijriMonth]:
        this._state.hijri?.month?.en || this._state.hijri?.month?.ar || "",
      [VARIABLE_KEYS.hijriDay]: (this._state.hijri || {}).day || "",
      [VARIABLE_KEYS.prayerTimes]: this._buildPrayerTimesString(),
    };

    for (const [key, value] of Object.entries(vars)) {
      await this._setVariable(key, value);
    }

    await this._refreshNextPrayer();
  }

  async _refreshNextPrayer() {
    if (!this._state.timings) {
      return;
    }
    const now = new Date();
    const timezoneOffsetMinutes = this._coerceNumber(
      this.settings?.timezoneOffsetMinutes,
      0,
    );
    let nextName = "";
    let nextTime = "";

    for (const prayer of PRAYER_ORDER) {
      const raw = this._state.timings?.[prayer.key];
      if (!raw) {
        continue;
      }
      const offsetMinutes = this._coerceNumber(
        this.settings?.[prayer.offsetKey],
        0,
      );
      const target = this._buildTimeToday(
        raw,
        timezoneOffsetMinutes + offsetMinutes,
      );
      if (target && target > now) {
        nextName = prayer.key === "Sunrise" ? "Shuruq" : prayer.key;
        nextTime = this._formatTime(target);
        break;
      }
    }

    if (!nextName) {
      const firstPrayer = PRAYER_ORDER[0];
      const raw = this._state.timings?.[firstPrayer.key];
      if (raw) {
        const offsetMinutes = this._coerceNumber(
          this.settings?.[firstPrayer.offsetKey],
          0,
        );
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const target = this._buildTimeOnDate(
          tomorrow,
          raw,
          timezoneOffsetMinutes + offsetMinutes,
        );
        if (target) {
          nextName = firstPrayer.key;
          nextTime = this._formatTime(target);
        }
      }
    }

    await this._setVariable(VARIABLE_KEYS.nextPrayer, nextName);
    await this._setVariable(VARIABLE_KEYS.nextPrayerTime, nextTime);
  }

  async _emitPrayerAlert(prayerKey, time, alertMinutesBefore = 0) {
    const prayer = PRAYER_ORDER.find((entry) => entry.key === prayerKey);
    if (!prayer) {
      return;
    }

    const hijriDate = this._state.hijri?.date || "";
    const location = this._state.locationLabel || "";
    const displayName = prayer.key === "Sunrise" ? "Shuruq" : prayer.key;
    const adjustedTime = this._applyOffsetToTime(
      time,
      this.settings?.[prayer.offsetKey],
    );

    // Maps to manifest variationConditions so Lumia can show the correct alert message
    const whenValue =
      alertMinutesBefore >= 20
        ? "20_before"
        : alertMinutesBefore >= 15
          ? "15_before"
          : alertMinutesBefore >= 10
            ? "10_before"
            : alertMinutesBefore >= 5
              ? "5_before"
              : "at_time";

    try {
      if (!this._hasLumia()) {
        return;
      }
      await this.context.lumia.triggerAlert({
        alert: prayer.alert,
        dynamic: { name: "value", value: whenValue },
        extraSettings: {
          prayer: displayName,
          time: adjustedTime,
          hijri_date: hijriDate,
          location,
          minutes_before: alertMinutesBefore,
        },
      });
    } catch (error) {
      if (this.context?.lumia?.log) {
        await this.context.lumia.log(
          `[Mawakit] Failed to trigger ${displayName} alert: ${error?.message ?? String(error)}`,
        );
      }
    }
  }

  /**
   * Fire Ramadan alert when we're in Hijri month 8 (Ramadan) and within N days of the end.
   * monthNumber 8 = Ramadan; day 1–30 is the day of the month.
   */
  async _maybeRamadanAlert() {
    if (this.settings?.enableRamadanAlert === false) {
      return;
    }
    const hijri = this._state.hijri;
    if (!hijri) {
      return;
    }
    const monthNumber = this._coerceNumber(hijri?.month?.number, 0);
    const day = this._coerceNumber(hijri?.day, 0);
    if (monthNumber !== 8 || day <= 0) {
      return;
    }
    const daysRemaining = Math.max(0, 30 - day);
    const threshold = this._coerceNumber(this.settings?.ramadanAlertDays, 10);
    if (daysRemaining > threshold) {
      return;
    }
    const todayKey = new Date().toISOString().slice(0, 10);
    if (this._lastRamadanAlertDate === todayKey) {
      return;
    }
    this._lastRamadanAlertDate = todayKey;
    try {
      if (!this._hasLumia()) {
        return;
      }
      await this.context.lumia.triggerAlert({
        alert: ALERT_KEYS.ramadan,
        extraSettings: {
          days_remaining: daysRemaining,
          hijri_date: hijri?.date || "",
          location: this._state.locationLabel || "",
        },
      });
    } catch (error) {
      if (this.context?.lumia?.log) {
        await this.context.lumia.log(
          `[Mawakit] Failed to trigger Ramadan alert: ${error?.message ?? String(error)}`,
        );
      }
    }
  }

  /**
   * Resolves location from settings: system location (if enabled), coordinates, or city+country.
   * When only country is set, uses DEFAULT_CITY_BY_COUNTRY so the Aladhan API gets a valid city.
   */
  _resolveLocationWithCountryFallback(settings = {}) {
    if (settings?.locationMode === "system") {
      const location = this._resolveSystemLocation();
      if (location) {
        return location;
      }
    }

    const type = settings?.locationType || "city";
    if (type === "coordinates") {
      const lat = this._coerceNumber(settings?.latitude, null);
      const lon = this._coerceNumber(settings?.longitude, null);
      if (typeof lat === "number" && typeof lon === "number") {
        return { type: "coordinates", latitude: lat, longitude: lon };
      }
      return null;
    }

    let city = this._coerceString(settings?.city, "").trim();
    const country = this._coerceString(settings?.country, "").trim();
    if (country && !city) {
      city = DEFAULT_CITY_BY_COUNTRY[country] || country;
    }
    if (city && country) {
      return { type: "city", city, country };
    }
    return null;
  }

  _resolveSystemLocation() {
    if (typeof this.lumia?.getLocation !== "function") {
      return null;
    }
    try {
      const data = this.lumia.getLocation();
      if (!data) {
        return null;
      }
      const latitude = this._coerceNumber(data.latitude, null);
      const longitude = this._coerceNumber(data.longitude, null);
      if (typeof latitude === "number" && typeof longitude === "number") {
        return { type: "coordinates", latitude, longitude };
      }
      if (data.city && data.country) {
        return { type: "city", city: data.city, country: data.country };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Parse location from variable function input: "city|country", "|country", or "lat,lon".
   */
  _resolveLocationFromArgs(args, raw) {
    if (!raw && args.length === 0) {
      return null;
    }
    const input = raw || args.join("|");
    const [first = "", second = ""] = input.split("|").map((s) => s.trim());
    if (first.includes(",")) {
      const [latRaw, lonRaw] = first.split(",");
      const lat = this._coerceNumber(latRaw, null);
      const lon = this._coerceNumber(lonRaw, null);
      if (typeof lat === "number" && typeof lon === "number") {
        return { type: "coordinates", latitude: lat, longitude: lon };
      }
      return null;
    }
    let city = first;
    const country = second;
    if (country && !city) {
      city = DEFAULT_CITY_BY_COUNTRY[country] || country;
    }
    if (city && country) {
      return { type: "city", city, country };
    }
    return null;
  }

  async _fetchTimingsCached({ location }) {
    const cacheKey = JSON.stringify({
      location,
      method: this._methodId(),
      school: this._schoolId(),
    });
    const cached = this._cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
    const data = await this._fetchTimings({ location });
    if (data) {
      this._cache.set(cacheKey, { timestamp: Date.now(), data });
    }
    return data;
  }

  async _fetchTimings({ location }) {
    const method = this._methodId();
    const school = this._schoolId();
    const date = this._formatApiDate(new Date());
    let url = "";
    if (location.type === "coordinates") {
      url = `https://api.aladhan.com/v1/timings/${date}?latitude=${encodeURIComponent(
        location.latitude,
      )}&longitude=${encodeURIComponent(location.longitude)}&method=${method}&school=${school}`;
    } else {
      url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(
        location.city,
      )}&country=${encodeURIComponent(location.country)}&method=${method}&school=${school}`;
    }

    let json;
    try {
      json = await this._fetchJson(url);
    } catch (error) {
      if (this._hasLumia()) {
        await this.context.lumia.log(
          `[Mawakit] Failed to fetch prayer times: ${error?.message ?? String(error)}`,
        );
      }
      return null;
    }

    const data = json?.data;
    if (!data?.timings) {
      return null;
    }

    const timings = data.timings || {};
    const hijri = data.date?.hijri || null;
    const meta = data.meta || null;
    const locationLabel = this._formatLocationLabel(location, meta);

    return { timings, hijri, meta, locationLabel };
  }

  async _fetchJson(url) {
    if (typeof fetch !== "function") {
      throw new Error("fetch is not available in this runtime");
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  _formatLocationLabel(location, meta) {
    if (location.type === "city") {
      return `${location.city}, ${location.country}`;
    }
    if (meta?.timezone) {
      return `${location.latitude}, ${location.longitude} (${meta.timezone})`;
    }
    return `${location.latitude}, ${location.longitude}`;
  }

  /** Aladhan API expects date as DD-MM-YYYY. */
  _formatApiDate(date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  _buildTimeOnDate(baseDate, time, offsetMinutes) {
    const normalized = this._normalizeTime(time);
    if (!normalized) {
      return null;
    }
    const [hours, minutes] = normalized
      .split(":")
      .map((value) => Number(value));
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return null;
    }
    const target = new Date(baseDate);
    target.setHours(hours, minutes, 0, 0);
    if (offsetMinutes) {
      target.setMinutes(target.getMinutes() + offsetMinutes);
    }
    return target;
  }

  _buildTimeToday(time, offsetMinutes) {
    return this._buildTimeOnDate(new Date(), time, offsetMinutes);
  }

  /** Extract HH:MM from API time strings (e.g. "05:30 (GMT+1)" → "05:30"). */
  _normalizeTime(time) {
    if (typeof time !== "string") {
      return "";
    }
    return time.split(" ")[0].trim();
  }

  _formatTime(date) {
    return date.toTimeString().slice(0, 5);
  }

  _applyOffsetToTime(time, offsetMinutes) {
    const normalized = this._normalizeTime(time);
    if (!normalized) {
      return "";
    }
    const [hours, minutes] = normalized
      .split(":")
      .map((value) => Number(value));
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return normalized;
    }
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    const offset = this._coerceNumber(offsetMinutes, 0);
    if (offset) {
      target.setMinutes(target.getMinutes() + offset);
    }
    return this._formatTime(target);
  }

  _buildPrayerTimesString() {
    if (!this._state.timings) {
      return "";
    }
    const timings = this._state.timings;
    const parts = [
      `Fajr=${this._applyOffsetToTime(timings.Fajr, this.settings?.offsetFajr)}`,
      `Sunrise=${this._applyOffsetToTime(timings.Sunrise, this.settings?.offsetSunrise)}`,
      `Dhuhr=${this._applyOffsetToTime(timings.Dhuhr, this.settings?.offsetDhuhr)}`,
      `Asr=${this._applyOffsetToTime(timings.Asr, this.settings?.offsetAsr)}`,
      `Maghrib=${this._applyOffsetToTime(timings.Maghrib, this.settings?.offsetMaghrib)}`,
      `Isha=${this._applyOffsetToTime(timings.Isha, this.settings?.offsetIsha)}`,
    ];
    if (this._state.hijri?.date) {
      parts.push(`Hijri=${this._state.hijri.date}`);
    }
    if (this._state.locationLabel) {
      parts.push(`Location=${this._state.locationLabel}`);
    }
    return parts.join(", ");
  }

  async _setVariable(key, value) {
    const lumia = this.context?.lumia;
    if (!lumia) {
      return;
    }
    const alias = this._prefixedKey(key);
    await lumia.setVariable(key, value);
    if (alias && alias !== key) {
      await lumia.setVariable(alias, value);
    }
  }

  /** Plugin-scoped variable alias (e.g. mawakit_fajr) so variables don't clash with other plugins. */
  _prefixedKey(key) {
    const id = this.manifest?.id || "";
    if (!id) {
      return "";
    }
    return `${id}_${key}`;
  }

  /** Aladhan calculation method ID (default 2 = Muslim World League). */
  _methodId() {
    return this._coerceNumber(this.settings?.calculationMethod, 2);
  }

  /** Asr juristic method: Hanafi uses shadow factor 2; Shafi/Maliki use 1. */
  _schoolId() {
    const method = this._coerceString(this.settings?.juristicMethod, "shafi");
    return method === "hanafi" ? 1 : 0;
  }

  _coerceNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  _coerceString(value, fallback) {
    return typeof value === "string" ? value : fallback;
  }

  async _toastOnce(message) {
    if (this._lastToast === message) {
      return;
    }
    this._lastToast = message;
    if (
      this._hasLumia() &&
      typeof this.context.lumia?.showToast === "function"
    ) {
      await this.context.lumia.showToast({ message });
    }
  }

  _hasLumia() {
    return Boolean(this.context && this.context.lumia);
  }
}

module.exports = MawakitPlugin;
