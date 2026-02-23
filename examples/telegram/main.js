const { Plugin } = require("@lumiastream/plugin");
const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = __dirname;

const DEFAULTS = {
  authMode: "bot",
  pollInterval: 2,
  longPollTimeout: 20,
  maxLogIntervalMs: 5 * 60 * 1000, // Every 5 minutes
};

const ENV_KEYS = {
  apiId: "LUMIA_TELEGRAM_API_ID",
  apiHash: "LUMIA_TELEGRAM_API_HASH",
};

const ALERT_KEYS = {
  message: "message",
};

const VARIABLE_NAMES = {
  chatId: "chat_id",
  chatType: "chat_type",
  lastChatter: "last_chatter",
  lastUserId: "last_user_id",
  lastMessage: "last_message",
  lastMessageId: "last_message_id",
  lastMessageAt: "last_message_at",
  memberCount: "member_count",
};

class TelegramPlugin extends Plugin {
  constructor(manifest, context) {
    super(manifest, context);
    this._botPolling = false;
    this._botOffset = 0;
    this._botLoopPromise = null;
    this._botAbortController = null;
    this._userClient = null;
    this._userConnected = false;
    this._isConnecting = false;
    this._lastConnectionState = null;
    this._cachedRegex = null;
    this._cachedRegexSource = "";
    this._allowedChats = new Set();
    this._telegramLibPromise = null;
    this._authBlocked = false;
    this._forceLogin = false;
    this._pendingAuthMode = null;
    this._pendingPhoneNumber = "";
    this._appEnv = null;
    this._toastTimestamps = new Map();
    this._suppressSettingsReconnect = false;
    this._cachedSession = null;
    this._chatOptions = new Map();
    this._lastChatOptionsUpdate = 0;
  }

  async onload() {
    this._refreshFilters();
    await this.connect({ showToast: false });
  }

  async onunload() {
    await this.disconnect(false);
  }

  async onsettingsupdate(settings, previous = {}) {
    const skipReconnect = this._suppressSettingsReconnect;
    if (skipReconnect) {
      this._suppressSettingsReconnect = false;
    }
    const nextMode = this._authMode(settings);
    const previousMode = this._authMode(previous);
    const modeChanged = nextMode !== previousMode;
    const botChanged =
      this._botToken(settings) !== this._botToken(previous) ||
      this._botDefaultChat(settings) !== this._botDefaultChat(previous);
    const userChanged =
      nextMode === "user" &&
      (this._userApiId(settings) !== this._userApiId(previous) ||
        this._userApiHash(settings) !== this._userApiHash(previous) ||
        this._userSessionString(settings) !==
          this._userSessionString(previous) ||
        this._userPhone(settings) !== this._userPhone(previous));
    const lumiaChanged =
      nextMode === "lumia" &&
      this._lumiaPhone(settings) !== this._lumiaPhone(previous);
    const pollingChanged =
      this._botPollInterval(settings) !== this._botPollInterval(previous) ||
      this._botLongPollTimeout(settings) !== this._botLongPollTimeout(previous);
    const filterChanged =
      this._filterRegex(settings) !== this._filterRegex(previous) ||
      this._allowedChatRaw(settings) !== this._allowedChatRaw(previous);

    if (filterChanged) {
      this._refreshFilters(settings);
    }

    if (modeChanged) {
      this._authBlocked = false;
    }

    if ((userChanged || lumiaChanged || modeChanged) && this._authBlocked) {
      this._authBlocked = false;
    }

    if (
      modeChanged ||
      botChanged ||
      userChanged ||
      lumiaChanged ||
      pollingChanged
    ) {
      if (!skipReconnect) {
        await this.disconnect(false);
        await this.connect({ showToast: false });
      }
    }
  }

  async actions(config) {
    for (const action of config.actions || []) {
      try {
        switch (action.type) {
          case "send_message":
            await this._runSendMessageAction(action.value);
            break;
          default:
            break;
        }
      } catch (error) {
        await this._toast(
          `Telegram action "${action.type || "unknown"}" failed: ${this._errorMessage(error)}`,
          "warn",
        );
      }
    }
  }

  async refreshActionOptions(config = {}) {
    const actionType = this._string(config?.actionType, "");
    if (actionType !== "send_message") {
      return;
    }

    await this._hydrateChatOptions();
    await this._refreshActionChatOptions();
  }

  async onSettingsAction({ key, values } = {}) {
    if (key !== "verifyLogin") {
      return;
    }

    await this._toast("Starting Telegram verification…", "info");

    if (typeof this.lumia.prompt !== "function") {
      await this._toast(
        "Verify requires the latest Lumia prompt API. Please update Lumia Stream.",
        "warn",
      );
      return;
    }

		const mode = this._authMode(values || this.settings);
		if (mode === "bot") {
			await this._toast(
				"Verify is only available for Use Built in Bot or Use Custom Bot.",
				"warn",
			);
			return;
		}

    const phone = this._resolvePhoneNumber(values || this.settings, mode);
    if (!phone) {
      await this._toast("Please enter your phone number first.", "warn");
      return;
    }

    const phoneKey = mode === "lumia" ? "lumiaPhoneNumber" : "userPhoneNumber";
    this._pendingAuthMode = mode;
    this._pendingPhoneNumber = phone;
    await this.disconnect(false);
    this._authBlocked = false;
    this._forceLogin = true;
    await this._toast("Sending Telegram code…", "info");
    await this.connect({ showToast: true, forceLogin: true });
  }

  async validateAuth(data = {}) {
    const merged = { ...this.settings, ...(data || {}) };
    const mode = this._authMode(merged);
    if (mode === "bot") {
      const token = this._botToken(merged);
      if (!token) {
        return { ok: false, message: "Missing bot token." };
      }
      try {
        const response = await fetch(
          `https://api.telegram.org/bot${token}/getMe`,
        );
        const payload = await response.json();
        if (!payload?.ok) {
          return {
            ok: false,
            message: payload?.description || "Bot token validation failed.",
          };
        }
      } catch (error) {
        return {
          ok: false,
          message: `Bot validation failed: ${this._errorMessage(error)}`,
        };
      }
      return { ok: true };
    }

    const credentials = this._resolveApiCredentials(merged, mode);
    if (!credentials?.apiId) {
      return {
        ok: false,
        message:
          mode === "lumia"
            ? `Missing Lumia app API ID (set ${ENV_KEYS.apiId} in .env).`
            : "Missing API ID.",
      };
    }
    if (!credentials?.apiHash) {
      return {
        ok: false,
        message:
          mode === "lumia"
            ? `Missing Lumia app API hash (set ${ENV_KEYS.apiHash} in .env).`
            : "Missing API hash.",
      };
    }

    const session = this._userSessionString(merged);
    if (!session) {
      return {
        ok: false,
        message: "Phone not verified. Click Verify to sign in first.",
      };
    }
    return { ok: true };
  }

  async chatbot(config = {}) {
    const message = this._string(config?.message, "").trim();
    if (!message) {
      return false;
    }

    try {
      await this._sendMessage({ message });
      return true;
    } catch (error) {
      await this._toast(
        `Telegram send failed: ${this._errorMessage(error)}`,
        "warn",
      );
      return false;
    }
  }

  async connect({ showToast = true, forceLogin = false } = {}) {
    if (this._isConnecting) {
      return;
    }

    this._isConnecting = true;
    try {
      if (forceLogin) {
        this._forceLogin = true;
      }
      const mode = this._authMode();
      const resolvedSession = this._resolveSessionString();
      const hasSession = Boolean(resolvedSession);
      if (
        (mode === "lumia" || mode === "user") &&
        !hasSession &&
        !this._forceLogin
      ) {
        this._authBlocked = true;
        await this._toast(
          "Click Verify to receive a Telegram code and sign in.",
          "warn",
        );
        await this._updateConnectionState(false);
        return;
      }

      if (this._authBlocked && mode !== "bot") {
        await this._toast(
          "Waiting for a new Telegram login code. Click Verify to retry.",
          "warn",
        );
        await this._updateConnectionState(false);
        return;
      }

      if (mode !== "bot") {
        await this._connectUser();
      } else {
        await this._startBotPolling();
      }
      if (showToast && typeof this.lumia.showToast === "function") {
        await this.lumia.showToast({ message: "Telegram connected" });
      }
    } catch (error) {
      await this._updateConnectionState(false);
      await this._toast(
        `Telegram connect failed: ${this._errorMessage(error)}`,
        "warn",
      );
      if (showToast && typeof this.lumia.showToast === "function") {
        await this.lumia.showToast({
          message: `Telegram connect failed: ${this._errorMessage(error)}`,
        });
      }
    } finally {
      this._isConnecting = false;
      if (forceLogin) {
        this._forceLogin = false;
        this._pendingAuthMode = null;
        this._pendingPhoneNumber = "";
      }
    }
  }

  async disconnect(showToast = true) {
    await this._stopBotPolling();
    await this._disconnectUser();
    await this._updateConnectionState(false);
    if (showToast && typeof this.lumia.showToast === "function") {
      await this.lumia.showToast({ message: "Telegram disconnected" });
    }
  }

  async _startBotPolling() {
    const token = this._botToken();
    if (!token) {
      throw new Error("Missing bot token");
    }

    if (this._botLoopPromise) {
      return;
    }

    this._botPolling = true;
    await this._updateConnectionState(true);

    this._botLoopPromise = this._botPollLoop(token).finally(() => {
      this._botLoopPromise = null;
    });
  }

  async _stopBotPolling() {
    this._botPolling = false;
    if (this._botAbortController) {
      this._botAbortController.abort();
      this._botAbortController = null;
    }
    if (this._botLoopPromise) {
      try {
        await this._botLoopPromise;
      } catch (error) {
        // ignore
      }
      this._botLoopPromise = null;
    }
  }

  async _botPollLoop(token) {
    while (this._botPolling) {
      try {
        await this._pollBotOnce(token);
      } catch (error) {
        await this._sleep(this._botPollInterval() * 1000);
      }
    }
  }

  async _pollBotOnce(token) {
    const timeoutSeconds = this._botLongPollTimeout();
    const url = `https://api.telegram.org/bot${token}/getUpdates`;
    const payload = {
      offset: this._botOffset,
      timeout: timeoutSeconds,
      allowed_updates: [
        "message",
        "edited_message",
        "channel_post",
        "edited_channel_post",
      ],
    };

    this._botAbortController = new AbortController();
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: this._botAbortController.signal,
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        this._botPolling = false;
        await this._updateConnectionState(false);
        throw new Error("Bot token rejected by Telegram");
      }
      await this._sleep(this._botPollInterval() * 1000);
      return;
    }

    const data = await response.json();
    if (!data?.ok) {
      if (data?.error_code === 409) {
        await this._toastThrottled(
          "bot-409",
          "Telegram Bot API conflict: another getUpdates or webhook is active.",
        );
      }
      await this._sleep(this._botPollInterval() * 1000);
      return;
    }

    for (const update of data.result || []) {
      if (typeof update?.update_id === "number") {
        this._botOffset = update.update_id + 1;
      }
      await this._handleBotUpdate(update);
    }

    await this._sleep(this._botPollInterval() * 1000);
  }

  async _handleBotUpdate(update) {
    const message =
      update?.message ||
      update?.edited_message ||
      update?.channel_post ||
      update?.edited_channel_post;
    if (!message) {
      return;
    }

    const payload = this._normalizeBotMessage(message);
    if (!payload) {
      return;
    }

    const added = this._recordChatOption(payload);
    if (added) {
      void this._refreshActionChatOptions();
    }

    if (!this._passesFilters(payload)) {
      return;
    }

    await this._handleIncomingMessage(payload);
  }

  _normalizeBotMessage(message) {
    const text = this._string(message?.text || message?.caption, "").trim();
    if (!text && this._ignoreServiceMessages()) {
      return null;
    }

    const chat = message?.chat || {};
    const sender = message?.from || message?.sender_chat || {};
    const chatId = this._string(chat?.id, "");
    const chatType = this._string(chat?.type, "");
    const chatTitle =
      this._string(chat?.title, "") ||
      this._string(chat?.username, "") ||
      this._string(chat?.first_name, "");
    const username = this._string(sender?.username, "");
    const displayName =
      this._string(
        [sender?.first_name, sender?.last_name].filter(Boolean).join(" "),
        "",
      ) || username;
    const userId = this._string(sender?.id, "");
    const messageId = this._string(message?.message_id, "");
    const timestamp = message?.date
      ? new Date(message.date * 1000).toISOString()
      : new Date().toISOString();

    return {
      text,
      chatId,
      chatTitle,
      chatType,
      username,
      displayName,
      userId,
      messageId,
      timestamp,
      isBot: Boolean(sender?.is_bot),
    };
  }

  async _connectUser() {
    const { TelegramClient, StringSession, NewMessage } =
      await this._loadTelegramLib();

    const mode = this._authMode();
    const credentials = this._resolveApiCredentials(this.settings, mode);
    const apiId = credentials?.apiId;
    const apiHash = credentials?.apiHash;
    if (!apiId || !apiHash) {
      throw new Error(
        mode === "lumia"
          ? `Missing Lumia app credentials. Set ${ENV_KEYS.apiId} and ${ENV_KEYS.apiHash} in .env.`
          : "Missing API ID or API hash for user mode.",
      );
    }

    const forceLogin = this._forceLogin;
    const hasPending = Boolean(
      this._pendingAuthMode || this._pendingPhoneNumber,
    );
    const cachedSession = this._resolveSessionString();
    const pendingMode = this._pendingAuthMode;
    const pendingPhone = this._pendingPhoneNumber;
    const session = forceLogin || hasPending ? "" : cachedSession;
    const stringSession = new StringSession(session || "");
    const client = new TelegramClient(stringSession, Number(apiId), apiHash, {
      connectionRetries: 3,
    });

    this._userClient = client;
    this._userConnected = false;

    try {
      if (session) {
        await client.connect();
      } else {
        await client.start({
          phoneNumber: async () => this._requireUserPhone(),
          phoneCode: async () => this._waitForUserCode(),
          password: async () => this._waitForUserPassword(),
          onError: (err) => {
            const message = this._errorMessage(err);
            const isTwoFactor = /two-factor password required/i.test(message);
            const key = isTwoFactor ? "auth-2fa" : "auth-error";
            if (isTwoFactor) {
              this._authBlocked = true;
            }
            void this._toastThrottled(
              key,
              isTwoFactor
                ? "Two-factor password required. Enter it, then click Verify."
                : `Telegram login error: ${message}`,
              10000,
            );
          },
        });
      }
    } catch (error) {
      const message = this._errorMessage(error);
      this._authBlocked = true;
      await this._updateConnectionState(false);
      await this._toast(
        `Telegram login failed: ${message}. Click Verify to retry.`,
        "warn",
      );
      throw error;
    } finally {
      this._forceLogin = false;
      this._pendingAuthMode = null;
      this._pendingPhoneNumber = "";
    }

    if (!session) {
      const savedSession = client.session.save();
      const update = {};
      if (savedSession) {
        update.userSessionString = savedSession;
        this._saveCachedSession(savedSession);
      }
      if (pendingMode) {
        update.authMode = pendingMode;
        const phoneKey =
          pendingMode === "lumia" ? "lumiaPhoneNumber" : "userPhoneNumber";
        if (pendingPhone) {
          update[phoneKey] = pendingPhone;
        }
      }
      if (Object.keys(update).length) {
        this._suppressSettingsReconnect = true;
        this.updateSettings({ ...this.settings, ...update });
      }
    }

    client.addEventHandler((event) => {
      void this._handleUserEvent(event);
    }, new NewMessage({}));

    this._userConnected = true;
    await this._updateConnectionState(true);

    await this._hydrateChatOptions();
    await this._refreshActionChatOptions();
  }

  async _loadTelegramLib() {
    if (!this._telegramLibPromise) {
      this._telegramLibPromise = Promise.resolve().then(() => {
        try {
          const { TelegramClient } = require("telegram");
          const { StringSession } = require("telegram/sessions");
          const { NewMessage } = require("telegram/events");
          if (!TelegramClient || !StringSession || !NewMessage) {
            throw new Error("Telegram MTProto exports missing");
          }
          return { TelegramClient, StringSession, NewMessage };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          throw new Error(
            `Telegram user mode requires the telegram package. Install dependencies for the plugin so the runtime can resolve \"telegram\". (${message})`,
          );
        }
      });
    }
    return this._telegramLibPromise;
  }

  async _disconnectUser() {
    if (!this._userClient) {
      return;
    }

    try {
      await this._userClient.disconnect();
    } catch (error) {
      // ignore
    }

    this._userClient = null;
    this._userConnected = false;
  }

  async _handleUserEvent(event) {
    if (!event?.message) {
      return;
    }

    const payload = await this._normalizeUserMessage(event);
    if (!payload) {
      return;
    }

    const added = this._recordChatOption(payload);
    if (added) {
      void this._refreshActionChatOptions();
    }

    if (!this._passesFilters(payload)) {
      return;
    }

    await this._handleIncomingMessage(payload);
  }

  async _normalizeUserMessage(event) {
    const message = event?.message;
    if (!message) {
      return null;
    }

    const text = this._string(message?.message, "").trim();
    if (!text && this._ignoreServiceMessages()) {
      return null;
    }

    const chatId = this._string(event?.chatId ?? message?.chatId, "");
    const chat = event?.chat;
    const chatTitle =
      this._string(chat?.title, "") ||
      this._string(chat?.username, "") ||
      this._string(chat?.firstName, "") ||
      this._string(chat?.lastName, "");
    const chatType = event?.isPrivate
      ? "private"
      : event?.isChannel
        ? "channel"
        : event?.isGroup
          ? "group"
          : "unknown";

    let sender = message?.sender;
    if (!sender && typeof message?.getSender === "function") {
      try {
        sender = await message.getSender();
      } catch (error) {
        sender = null;
      }
    }

    const username = this._string(sender?.username, "");
    const displayName =
      this._string(
        [sender?.firstName, sender?.lastName].filter(Boolean).join(" "),
        "",
      ) || username;
    const userId = this._string(message?.senderId ?? sender?.id, "");
    const messageId = this._string(message?.id, "");
    const timestamp =
      message?.date instanceof Date
        ? message.date.toISOString()
        : new Date().toISOString();

    return {
      text,
      chatId,
      chatTitle,
      chatType,
      username,
      displayName,
      userId,
      messageId,
      timestamp,
      isBot: false,
    };
  }

  async _handleIncomingMessage(payload) {
    const message = payload?.text || "";
    if (!message) {
      return;
    }

    await Promise.all([
      this._setVariable(
        VARIABLE_NAMES.lastChatter,
        payload.username || payload.displayName || "",
      ),
      this._setVariable(VARIABLE_NAMES.lastUserId, payload.userId || ""),
      this._setVariable(VARIABLE_NAMES.lastMessage, message),
      this._setVariable(VARIABLE_NAMES.lastMessageId, payload.messageId || ""),
      this._setVariable(VARIABLE_NAMES.lastMessageAt, payload.timestamp || ""),
      this._setVariable(VARIABLE_NAMES.chatId, payload.chatId || ""),
      this._setVariable(VARIABLE_NAMES.chatType, payload.chatType || ""),
    ]);

    await this._triggerMessageAlert(payload);
    this._displayChat(payload);
  }

  async _triggerMessageAlert(payload) {
    try {
      await this.lumia.triggerAlert({
        alert: ALERT_KEYS.message,
        extraSettings: this._buildAlertExtra(payload),
        dynamic: {
          name: payload.username || payload.displayName || "message",
          value: payload.text || "",
        },
      });
    } catch (error) {}
  }

  _buildAlertExtra(payload, overrides = {}) {
    return {
      chat_id: payload.chatId || "",
      chat_type: payload.chatType || "",
      last_chatter: payload.username || payload.displayName || "",
      last_user_id: payload.userId || "",
      last_message: payload.text || "",
      last_message_id: payload.messageId || "",
      last_message_at: payload.timestamp || "",
      ...overrides,
    };
  }

  _displayChat(payload) {
    try {
      this.lumia.displayChat({
        username: payload.username || payload.displayName || "telegram",
        displayname: payload.displayName || payload.username || "telegram",
        message: payload.text || "",
        messageId: payload.messageId || undefined,
        userId: payload.userId || undefined,
        userLevels: {},
      });
    } catch (error) {
      // ignore display failures
    }
  }

  _recordChatOption(payload) {
    const chatId = this._string(payload?.chatId, "").trim();
    const chatTitle = this._string(payload?.chatTitle, "").trim();
    const username = this._string(payload?.username, "").trim();
    const chatType = this._string(payload?.chatType, "").trim();
    if (!chatId && !chatTitle && !username) {
      return false;
    }

    const value = chatId || (username ? `@${username}` : chatTitle);
    if (!value) {
      return false;
    }

    const labelParts = [];
    if (chatTitle) {
      labelParts.push(chatTitle);
    } else if (username) {
      labelParts.push(`@${username}`);
    }
    if (username && chatTitle && !labelParts.includes(`@${username}`)) {
      labelParts.push(`@${username}`);
    }
    if (chatType) {
      labelParts.push(chatType);
    }
    if (chatId) {
      labelParts.push(chatId);
    }
    const label = labelParts.join(" • ") || value;

    const existing = this._chatOptions.get(value);
    if (existing && existing.label === label) {
      return false;
    }

    this._chatOptions.set(value, { label, value });
    return true;
  }

  async _hydrateChatOptions() {
    if (this._authMode() === "bot" || !this._userClient) {
      return;
    }

    if (typeof this._userClient.getDialogs !== "function") {
      return;
    }

    try {
      const dialogs = await this._userClient.getDialogs({});
      if (!Array.isArray(dialogs)) {
        return;
      }
      for (const dialog of dialogs) {
        const entity = dialog?.entity ?? dialog;
        const id = this._string(entity?.id ?? dialog?.id ?? "", "").trim();
        const title = this._string(
          entity?.title ??
            entity?.username ??
            entity?.firstName ??
            entity?.lastName ??
            "",
          "",
        ).trim();
        const username = this._string(entity?.username ?? "", "").trim();
        const chatType = entity?.className
          ? String(entity.className).replace(/^.*\\./, "")
          : "";
        const payload = {
          chatId: id,
          chatTitle: title,
          username,
          chatType,
        };
        this._recordChatOption(payload);
      }
    } catch (error) {}
  }

  async _refreshActionChatOptions() {
    const now = Date.now();
    if (now - this._lastChatOptionsUpdate < 3000) {
      return;
    }
    this._lastChatOptionsUpdate = now;

    const options = Array.from(this._chatOptions.values())
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(0, 200);

    if (!options.length) {
      return;
    }

    try {
      await this.lumia.updateActionFieldOptions({
        actionType: "send_message",
        fieldKey: "chatId",
        options,
      });
    } catch (error) {}
  }

  async _runSendMessageAction(raw = {}) {
    await this._sendMessage({
      chatId: this._string(raw?.chatId, ""),
      message: this._string(raw?.message, ""),
      parseMode: this._string(raw?.parseMode, "none"),
      disableNotification: Boolean(raw?.disableNotification),
      replyToMessageId: this._string(raw?.replyToMessageId, ""),
    });
  }

  async _sendMessage({
    chatId,
    message,
    parseMode,
    disableNotification,
    replyToMessageId,
  } = {}) {
    const text = this._string(message, "").trim();
    if (!text) {
      return;
    }

    const normalized = this._normalizeParseMode(parseMode);
    if (this._authMode() !== "bot") {
      await this._sendUserMessage({
        chatId,
        message: text,
        parseMode: normalized.user,
      });
      return;
    }

    await this._sendBotMessage({
      chatId,
      message: text,
      parseMode: normalized.bot,
      disableNotification,
      replyToMessageId,
    });
  }

  async _sendBotMessage({
    chatId,
    message,
    parseMode,
    disableNotification,
    replyToMessageId,
  }) {
    const token = this._botToken();
    if (!token) {
      throw new Error("Missing bot token");
    }

    const targetChat = this._string(chatId, "") || this._botDefaultChat();
    if (!targetChat) {
      throw new Error("Missing chat ID");
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const payload = {
      chat_id: targetChat,
      text: message,
      disable_notification: Boolean(disableNotification),
    };
    if (parseMode && parseMode !== "none") {
      payload.parse_mode = parseMode;
    }
    if (replyToMessageId) {
      payload.reply_to_message_id = replyToMessageId;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!data?.ok) {
      const description = this._string(
        data?.description || "Telegram sendMessage failed",
        "Telegram sendMessage failed",
      );
      if (description.includes("USERNAME_INVALID")) {
        throw new Error(
          "Username invalid. Pick a chat from the dropdown or use a numeric chat ID.",
        );
      }
      throw new Error(description);
    }
  }

  async _sendUserMessage({ chatId, message, parseMode }) {
    if (!this._userClient) {
      throw new Error("User mode is not connected");
    }

    const targetChat = this._string(chatId, "") || this._userDefaultChat();
    if (!targetChat) {
      throw new Error("Missing chat ID");
    }

    const options = { message };
    if (parseMode) {
      options.parseMode = parseMode;
    }
    await this._userClient.sendMessage(targetChat, options);
  }

  async _refreshMemberCount(raw = {}) {
    const chatId = this._string(raw?.chatId, "") || this._defaultChatId();
    if (!chatId) {
      return;
    }

    if (this._authMode() === "bot") {
      const count = await this._botGetMemberCount(chatId);
      if (typeof count === "number") {
        await this._setVariable(VARIABLE_NAMES.memberCount, count);
      }
      return;
    }

    // User mode: skip unless a connected client can fetch participants.
    try {
      if (!this._userClient) {
        return;
      }
      const participants = await this._userClient.getParticipants(chatId, {
        limit: 0,
      });
      if (participants?.count != null) {
        await this._setVariable(VARIABLE_NAMES.memberCount, participants.count);
      }
    } catch (error) {
      await this._toast(
        `Failed to refresh member count: ${this._errorMessage(error)}`,
        "warn",
      );
    }
  }

  async _botGetMemberCount(chatId) {
    const token = this._botToken();
    if (!token) {
      return null;
    }
    try {
      const url = `https://api.telegram.org/bot${token}/getChatMemberCount`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chatId }),
      });
      const data = await response.json();
      if (!data?.ok) {
        return null;
      }
      return Number(data?.result ?? 0);
    } catch (error) {
      await this._toastThrottled(
        "bot-member-count",
        `Failed to fetch member count: ${this._errorMessage(error)}`,
      );
      return null;
    }
  }

  _refreshFilters(settings = this.settings) {
    this._allowedChats = new Set(
      this._parseAllowList(this._allowedChatRaw(settings)),
    );

    const regexValue = this._filterRegex(settings);
    if (!regexValue) {
      this._cachedRegex = null;
      this._cachedRegexSource = "";
      return;
    }

    try {
      this._cachedRegex = new RegExp(regexValue, "i");
      this._cachedRegexSource = regexValue;
    } catch (error) {
      this._cachedRegex = null;
      this._cachedRegexSource = "";
    }
  }

  _passesFilters(payload) {
    if (payload?.isBot && this._ignoreBots()) {
      return false;
    }

    const chatType = this._string(payload?.chatType, "");
    if (this._authMode() === "bot") {
      if (chatType === "private" && !this._botIncludePrivate()) {
        return false;
      }
      if (
        (chatType === "group" || chatType === "supergroup") &&
        !this._botIncludeGroups()
      ) {
        return false;
      }
      if (chatType === "channel" && !this._botIncludeChannels()) {
        return false;
      }
    }

    if (this._allowedChats.size > 0) {
      const id = this._string(payload?.chatId, "");
      const title = this._string(payload?.chatTitle, "");
      if (!this._allowedChats.has(id) && !this._allowedChats.has(title)) {
        return false;
      }
    }

    if (this._cachedRegex) {
      const text = this._string(payload?.text, "");
      if (!this._cachedRegex.test(text)) {
        return false;
      }
    }

    return true;
  }

  async _updateConnectionState(state) {
    if (this._lastConnectionState === state) {
      return;
    }
    this._lastConnectionState = state;
    if (typeof this.lumia.updateConnection === "function") {
      try {
        await this.lumia.updateConnection(state);
      } catch (error) {}
    }
  }

  async _setVariable(name, value) {
    try {
      await this.lumia.setVariable(name, value);
    } catch (error) {
      // ignore set failures
    }
  }

  _defaultChatId() {
    return this._authMode() === "bot"
      ? this._botDefaultChat()
      : this._userDefaultChat();
  }

  _autoConnect() {
    return true;
  }

  _authMode(settings = this.settings) {
    if (this._pendingAuthMode) {
      return this._pendingAuthMode;
    }
    const mode = this._string(settings?.authMode, DEFAULTS.authMode);
    if (mode === "user" || mode === "lumia") {
      return mode;
    }
    return "bot";
  }

  _botToken(settings = this.settings) {
    return this._string(settings?.botToken, "").trim();
  }

  _botDefaultChat(settings = this.settings) {
    return this._string(settings?.botDefaultChatId, "").trim();
  }

  _botPollInterval(settings = this.settings) {
    const interval = this._number(
      settings?.botPollInterval,
      DEFAULTS.pollInterval,
    );
    return Math.min(60, Math.max(1, interval));
  }

  _botLongPollTimeout(settings = this.settings) {
    const timeout = this._number(
      settings?.botLongPollTimeout,
      DEFAULTS.longPollTimeout,
    );
    return Math.min(50, Math.max(1, timeout));
  }

  _botIncludePrivate(settings = this.settings) {
    return this._bool(settings?.botIncludePrivate, true);
  }

  _botIncludeGroups(settings = this.settings) {
    return this._bool(settings?.botIncludeGroups, true);
  }

  _botIncludeChannels(settings = this.settings) {
    return this._bool(settings?.botIncludeChannels, false);
  }

  _ignoreBots(settings = this.settings) {
    return this._bool(settings?.botIgnoreBots, true);
  }

  _ignoreServiceMessages(settings = this.settings) {
    return this._bool(settings?.ignoreServiceMessages, true);
  }

  _allowedChatRaw(settings = this.settings) {
    return this._string(settings?.botAllowedChats, "").trim();
  }

  _filterRegex(settings = this.settings) {
    return this._string(settings?.filterRegex, "").trim();
  }

  _userApiId(settings = this.settings) {
    return this._number(settings?.userApiId, 0);
  }

  _userApiHash(settings = this.settings) {
    return this._string(settings?.userApiHash, "").trim();
  }

  _userSessionString(settings = this.settings) {
    return this._string(settings?.userSessionString, "").trim();
  }

  _userPhone(settings = this.settings) {
    return this._string(settings?.userPhoneNumber, "").trim();
  }

  _userDefaultChat(settings = this.settings) {
    return this._string(settings?.userDefaultChatId, "").trim();
  }

  _lumiaPhone(settings = this.settings) {
    return this._string(settings?.lumiaPhoneNumber, "").trim();
  }

  _resolvePhoneNumber(
    settings = this.settings,
    mode = this._authMode(settings),
  ) {
    if (this._pendingPhoneNumber) {
      return this._pendingPhoneNumber;
    }
    if (mode === "lumia") {
      return this._lumiaPhone(settings) || this._userPhone(settings);
    }
    return this._userPhone(settings);
  }

  _loadAppEnv() {
    if (this._appEnv) {
      return this._appEnv;
    }
    const env = {};
    try {
      const candidates = [
        path.join(ROOT_DIR, ".env"),
        path.join(process.cwd(), ".env"),
      ];
      for (const envPath of candidates) {
        if (!fs.existsSync(envPath)) {
          continue;
        }
        const raw = fs.readFileSync(envPath, "utf8");
        for (const line of raw.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) {
            continue;
          }
          const idx = trimmed.indexOf("=");
          if (idx === -1) {
            continue;
          }
          const key = trimmed.slice(0, idx).trim();
          let value = trimmed.slice(idx + 1).trim();
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }
          env[key] = value;
        }
        break;
      }
    } catch {
      // ignore env parsing errors
    }
    this._appEnv = env;
    return env;
  }

  _envValue(key) {
    const env = this._loadAppEnv();
    return env[key] ?? process.env?.[key] ?? "";
  }

  _resolveSessionString() {
    const fromSettings = this._userSessionString();
    if (fromSettings) {
      return fromSettings;
    }
    return this._loadCachedSession();
  }

  _sessionCachePath() {
    return path.join(ROOT_DIR, ".telegram_session");
  }

  _loadCachedSession() {
    if (typeof this._cachedSession === "string") {
      return this._cachedSession;
    }
    this._cachedSession = "";
    try {
      const sessionPath = this._sessionCachePath();
      if (fs.existsSync(sessionPath)) {
        const raw = fs.readFileSync(sessionPath, "utf8").trim();
        if (raw) {
          this._cachedSession = raw;
        }
      }
    } catch (error) {}
    return this._cachedSession;
  }

  _saveCachedSession(session) {
    const value = this._string(session, "").trim();
    if (!value) {
      return;
    }
    try {
      const sessionPath = this._sessionCachePath();
      fs.writeFileSync(sessionPath, value, "utf8");
      this._cachedSession = value;
    } catch (error) {}
  }

  _normalizeParseMode(parseMode) {
    const raw = this._string(parseMode, "").trim();
    if (!raw || raw.toLowerCase() === "none") {
      return { bot: null, user: null };
    }
    const normalized = raw.toLowerCase();
    if (normalized === "markdownv2" || normalized === "md2") {
      return { bot: "MarkdownV2", user: "markdownv2" };
    }
    if (normalized === "markdown" || normalized === "md") {
      return { bot: "Markdown", user: "markdown" };
    }
    if (normalized === "html") {
      return { bot: "HTML", user: "html" };
    }
    return { bot: raw, user: raw };
  }

  _resolveApiCredentials(
    settings = this.settings,
    mode = this._authMode(settings),
  ) {
    if (mode === "lumia") {
      const apiId = this._number(this._envValue(ENV_KEYS.apiId), 0);
      const apiHash = this._string(this._envValue(ENV_KEYS.apiHash), "").trim();
      return { apiId, apiHash };
    }
    return {
      apiId: this._userApiId(settings),
      apiHash: this._userApiHash(settings),
    };
  }

  _requireUserPhone() {
    const phone = this._resolvePhoneNumber();
    if (!phone) {
      throw new Error("Missing phone number for Telegram login.");
    }
    return phone;
  }

  async _waitForUserCode() {
    if (typeof this.lumia.prompt !== "function") {
      await this._toast(
        "Login requires the latest Lumia prompt API. Please update Lumia Stream.",
        "warn",
      );
      throw new Error("Login code prompt unavailable.");
    }

    const result = await this.lumia.prompt({
      title: "Telegram Verification",
      message: "Enter the code from Telegram",
      inputLabel: "Login Code",
      inputPlaceholder: "12345",
      confirmLabel: "Verify",
    });
    if (!result || !result.value) {
      throw new Error("Login code not provided.");
    }
    const code = this._string(result.value, "").trim();
    if (!code) {
      throw new Error("Login code not provided.");
    }
    return code;
  }

  async _waitForUserPassword() {
    if (typeof this.lumia.prompt === "function") {
			const result = await this.lumia.prompt({
				title: "Telegram Two-Factor Password",
				message: "Enter your Telegram 2FA password",
				inputLabel: "2FA Password",
				inputPlaceholder: "Password",
				confirmLabel: "Continue",
				inputType: "password",
			});
      if (!result || !result.value) {
        throw new Error("Two-factor password required.");
      }
      const value = this._string(result.value, "").trim();
      if (!value) {
        throw new Error("Two-factor password required.");
      }
      return value;
    }
    throw new Error("Two-factor password required.");
  }

  _parseAllowList(raw) {
    if (!raw) {
      return [];
    }
    return raw
      .split(/\n|,/g)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  _formatDuration(ms) {
    const seconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  }

  _string(value, fallback = "") {
    if (typeof value === "string") {
      return value;
    }
    if (value == null) {
      return fallback;
    }
    return String(value);
  }

  _number(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  _bool(value, fallback = false) {
    if (typeof value === "boolean") {
      return value;
    }
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }
    return fallback;
  }

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  _errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
  }

  async _toast(message, _severity = "info") {
    if (typeof this.lumia.showToast !== "function") {
      return;
    }
    try {
      await this.lumia.showToast({ message: String(message) });
    } catch (error) {
      // ignore toast errors
    }
  }

  async _toastThrottled(key, message, intervalMs = DEFAULTS.maxLogIntervalMs) {
    const now = Date.now();
    const last = this._toastTimestamps.get(key) ?? 0;
    if (now - last < intervalMs) {
      return;
    }
    this._toastTimestamps.set(key, now);
    await this._toast(message);
  }
}

module.exports = TelegramPlugin;
