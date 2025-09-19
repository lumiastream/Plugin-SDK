const { Plugin } = require('@lumiastream/plugin-sdk');

const DEFAULT_POLL_INTERVAL = 30; // seconds
const MIN_POLL_INTERVAL = 10;
const MAX_POLL_INTERVAL = 300;
const VIEWER_CHANGE_THRESHOLD = 10;
const VIEWER_MILESTONES = [50, 100, 250, 500, 1000];

const ALERT_TYPES = {
  STREAM_STARTED: 'rumble-streamStarted',
  STREAM_ENDED: 'rumble-streamEnded',
  VIEWER_COUNT_CHANGED: 'rumble-viewerCountChanged',
};

class RumblePlugin extends Plugin {
  constructor(manifest, context) {
    super(manifest, context);

    this.pollIntervalId = null;
    this.lastKnownState = {
      live: false,
      viewers: 0,
      title: '',
      thumbnail: '',
    };

    this.sessionData = {
      streamStartTime: null,
      totalStreams: 0,
      peakViewers: 0,
      milestonesReached: new Set(),
      lastMilestoneReached: 0,
    };
  }

  get currentSettings() {
    return this.settings || {};
  }

  get apiKey() {
    return this.extractApiKey(this.currentSettings.apiKey);
  }

  async onload() {
    await this.lumia.addLog('[Rumble] Plugin loading...');

    if (this.apiKey) {
      await this.startPolling({ showToast: false });
    }

    await this.lumia.addLog('[Rumble] Plugin loaded');
  }

  async onunload() {
    await this.lumia.addLog('[Rumble] Plugin unloading...');
    await this.stopPolling(false);
    await this.lumia.addLog('[Rumble] Plugin unloaded');
  }

  async onsettingsupdate(settings, previousSettings) {
    const next = settings || {};
    const previous = previousSettings || {};

    const nextApiKey = this.extractApiKey(next.apiKey);
    const prevApiKey = this.extractApiKey(previous.apiKey);

    const nextInterval = this.normalizePollInterval(next.pollInterval);
    const prevInterval = this.normalizePollInterval(previous.pollInterval);

    const apiKeyChanged = nextApiKey !== prevApiKey;
    const intervalChanged = nextInterval !== prevInterval;

    if (!nextApiKey) {
      await this.stopPolling(false);
      return;
    }

    if (!this.pollIntervalId) {
      await this.startPolling({ showToast: false });
      return;
    }

    if (apiKeyChanged || intervalChanged) {
      await this.stopPolling(false);
      await this.startPolling({ showToast: false });
    }
  }

  async actions(config = {}) {
    const actionList = Array.isArray(config.actions) ? config.actions : [];

    if (!actionList.length) {
      return;
    }

    for (const action of actionList) {
      try {
        await this.handleAction(action);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await this.lumia.addLog(`[Rumble] Action failed: ${message}`);
      }
    }
  }

  async validateAuth(data = {}) {
    try {
      const apiKey = this.extractApiKey(data.apiKey);
      if (!apiKey) {
        return false;
      }

      await this.fetchStreamData(apiKey);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.lumia.addLog(`[Rumble] Auth validation failed: ${message}`);
      return false;
    }
  }

  extractApiKey(value) {
    if (typeof value !== 'string') {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }

  async startPolling(options = {}) {
    const { showToast = true } = options;

    if (!this.apiKey) {
      await this.lumia.addLog('[Rumble] Missing API key, cannot start polling');
      if (showToast) {
        await this.lumia.showToast({ message: 'Rumble API key required to poll' });
      }
      return;
    }

    if (this.pollIntervalId) {
      return;
    }

    const normalizedInterval = this.normalizePollInterval(this.currentSettings.pollInterval);

    if (normalizedInterval !== this.currentSettings.pollInterval) {
      this.updateSettings({ pollInterval: normalizedInterval });
    }

    await this.pollAPI();

    this.pollIntervalId = setInterval(() => {
      void this.pollAPI();
    }, normalizedInterval * 1000);

    if (showToast) {
      await this.lumia.showToast({ message: `Started polling Rumble API (${normalizedInterval}s)` });
    }

    await this.lumia.updateConnection(true);
  }

  async stopPolling(showToast = true) {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }

    if (showToast) {
      await this.lumia.showToast({ message: 'Stopped polling Rumble API' });
    }

    await this.lumia.updateConnection(false);
  }

  async pollAPI() {
    try {
      const apiKey = this.apiKey;
      if (!apiKey) {
        await this.lumia.addLog('[Rumble] Poll skipped: API key not configured');
        return;
      }

      const data = await this.fetchStreamData(apiKey);
      await this.processStreamData(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.lumia.addLog(`[Rumble] Error polling API: ${message}`);
    }
  }

  async processStreamData(data = {}) {
    const currentLive = Boolean(data.live);
    const currentViewers = Number.isFinite(Number(data.viewers)) ? Number(data.viewers) : 0;
    const currentTitle = typeof data.title === 'string' ? data.title : '';
    const currentThumbnail = typeof data.thumbnail === 'string' ? data.thumbnail : '';

    if (currentLive !== this.lastKnownState.live) {
      if (currentLive) {
        await this.handleStreamStart({ ...data, thumbnail: currentThumbnail }, currentViewers);
      } else {
        await this.handleStreamEnd(currentViewers);
      }
    }

    if (currentLive) {
      if (currentViewers > this.sessionData.peakViewers) {
        this.sessionData.peakViewers = currentViewers;
      }

      await this.checkViewerMilestones(currentViewers);
      await this.checkViewerChanges(currentViewers);
    }

    this.lastKnownState = {
      live: currentLive,
      viewers: currentViewers,
      title: currentTitle,
      thumbnail: currentThumbnail,
    };

    await this.lumia.setVariable('rumble_live', currentLive);
    await this.lumia.setVariable('rumble_viewers', currentViewers);
    await this.lumia.setVariable('rumble_title', currentTitle);
  }

  async handleStreamStart(data, currentViewers) {
    this.sessionData.streamStartTime = new Date();
    this.sessionData.totalStreams += 1;
    this.sessionData.peakViewers = currentViewers;
    this.sessionData.milestonesReached.clear();
    this.sessionData.lastMilestoneReached = 0;

    await this.lumia.triggerAlert({
      alert: ALERT_TYPES.STREAM_STARTED,
      extraSettings: {
        title: data?.title || '',
        thumbnail: data?.thumbnail || '',
        viewers: currentViewers,
        streamNumber: this.sessionData.totalStreams,
      },
    });
  }

  async handleStreamEnd(finalViewers) {
    const durationMs = this.sessionData.streamStartTime
      ? Date.now() - this.sessionData.streamStartTime.getTime()
      : 0;

    await this.lumia.triggerAlert({
      alert: ALERT_TYPES.STREAM_ENDED,
      extraSettings: {
        finalViewers,
        peakViewers: this.sessionData.peakViewers,
        durationMinutes: Math.floor(durationMs / (1000 * 60)),
        milestonesReached: Array.from(this.sessionData.milestonesReached),
      },
    });

    this.sessionData.streamStartTime = null;
    this.sessionData.peakViewers = 0;
    this.sessionData.milestonesReached.clear();
  }

  async checkViewerMilestones(currentViewers) {
    for (const milestone of VIEWER_MILESTONES) {
      if (currentViewers >= milestone && !this.sessionData.milestonesReached.has(milestone)) {
        this.sessionData.milestonesReached.add(milestone);
        this.sessionData.lastMilestoneReached = milestone;
        await this.lumia.addLog(`[Rumble] Viewer milestone reached: ${milestone}`);
      }
    }
  }

  async checkViewerChanges(currentViewers) {
    const previousViewers = this.lastKnownState.viewers;
    const change = currentViewers - previousViewers;

    if (Math.abs(change) < VIEWER_CHANGE_THRESHOLD) {
      return;
    }

    await this.lumia.triggerAlert({
      alert: ALERT_TYPES.VIEWER_COUNT_CHANGED,
      dynamic: {
        name: 'rumble_viewers',
        value: currentViewers,
      },
      extraSettings: {
        previousViewers,
        currentViewers,
        change,
        changeType: change > 0 ? 'increase' : 'decrease',
        isSpike: Math.abs(change) >= VIEWER_CHANGE_THRESHOLD * 3,
      },
    });
  }

  async handleAction(action = {}) {
    switch (action.type) {
      case 'manual_poll': {
        await this.pollAPI();
        await this.lumia.addLog('[Rumble] Manual poll triggered');
        break;
      }

      case 'manual_alert': {
        await this.lumia.triggerAlert({
          alert: ALERT_TYPES.STREAM_STARTED,
          extraSettings: {
            title: this.lastKnownState.title,
            thumbnail: this.lastKnownState.thumbnail || '',
            viewers: this.lastKnownState.viewers,
            streamNumber: this.sessionData.totalStreams,
          },
        });
        await this.lumia.addLog('[Rumble] Manual alert triggered');
        break;
      }

      default: {
        await this.lumia.addLog(`[Rumble] Unknown action type: ${action.type}`);
      }
    }
  }

  async fetchStreamData(apiKey) {
    const url = `https://rumble.com/-livestream-api/get-data?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText || 'Request failed'}`);
    }

    const payload = await response.json();
    if (payload && typeof payload === 'object') {
      if ('data' in payload && payload.data) {
        return payload.data;
      }
      return payload;
    }

    throw new Error('Invalid response from Rumble API');
  }

  normalizePollInterval(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return this.clampInterval(value);
    }

    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return this.clampInterval(parsed);
    }

    return DEFAULT_POLL_INTERVAL;
  }

  clampInterval(value) {
    const interpreted = value > MAX_POLL_INTERVAL && value >= MIN_POLL_INTERVAL * 1000 ? value / 1000 : value;
    const rounded = Math.round(interpreted);
    return Math.min(Math.max(rounded, MIN_POLL_INTERVAL), MAX_POLL_INTERVAL);
  }
}

module.exports = RumblePlugin;
