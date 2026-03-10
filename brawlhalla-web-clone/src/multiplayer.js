export class MultiplayerManager {
  constructor({ mode = "local" } = {}) {
    this.mode = mode;
    this.socket = null;
    this.connected = false;

    this.remoteInputs = new Map();
    this.listeners = {
      open: [],
      close: [],
      error: [],
      state: [],
    };
  }

  setMode(mode) {
    this.mode = mode;
  }

  on(eventName, callback) {
    if (!this.listeners[eventName]) {
      return;
    }
    this.listeners[eventName].push(callback);
  }

  emit(eventName, payload) {
    const listeners = this.listeners[eventName] || [];
    for (const listener of listeners) {
      listener(payload);
    }
  }

  connect(url) {
    if (typeof WebSocket === "undefined") {
      throw new Error("WebSocket is not available in this runtime.");
    }

    this.mode = "online";
    this.socket = new WebSocket(url);

    this.socket.addEventListener("open", () => {
      this.connected = true;
      this.emit("open", { url });
    });

    this.socket.addEventListener("close", () => {
      this.connected = false;
      this.emit("close", null);
    });

    this.socket.addEventListener("error", (error) => {
      this.emit("error", error);
    });

    this.socket.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleNetworkMessage(data);
      } catch (error) {
        this.emit("error", error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connected = false;
    this.mode = "local";
  }

  handleNetworkMessage(message) {
    if (!message || typeof message !== "object") {
      return;
    }

    if (message.type === "remoteInput") {
      this.remoteInputs.set(message.playerId, message.intent);
      return;
    }

    if (message.type === "state") {
      this.emit("state", message.payload);
    }
  }

  sendInput(playerId, intent, frame) {
    if (this.mode !== "online" || !this.connected || !this.socket) {
      return;
    }

    const payload = {
      type: "input",
      playerId,
      intent,
      frame,
      sentAt: performance.now(),
    };

    this.socket.send(JSON.stringify(payload));
  }

  getRemoteIntent(playerId) {
    return this.remoteInputs.get(playerId) || null;
  }
}