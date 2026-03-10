export class EntityStore {
  constructor() {
    this.nextId = 1;
    this.entities = new Map();
  }

  create(initialComponents = {}) {
    const entity = {
      id: this.nextId++,
      active: true,
      components: { ...initialComponents },
    };
    this.entities.set(entity.id, entity);
    return entity;
  }

  remove(entityId) {
    this.entities.delete(entityId);
  }

  addComponent(entityId, name, value) {
    const entity = this.entities.get(entityId);
    if (!entity) {
      return;
    }
    entity.components[name] = value;
  }

  getComponent(entityId, name) {
    const entity = this.entities.get(entityId);
    return entity ? entity.components[name] : undefined;
  }

  removeComponent(entityId, name) {
    const entity = this.entities.get(entityId);
    if (!entity) {
      return;
    }
    delete entity.components[name];
  }

  query(componentNames = []) {
    const results = [];
    for (const entity of this.entities.values()) {
      if (!entity.active) {
        continue;
      }
      let valid = true;
      for (const name of componentNames) {
        if (!(name in entity.components)) {
          valid = false;
          break;
        }
      }
      if (valid) {
        results.push(entity);
      }
    }
    return results;
  }

  clear() {
    this.entities.clear();
    this.nextId = 1;
  }
}

export class Engine {
  constructor({ tickRate = 60, update, render }) {
    this.tickRate = tickRate;
    this.stepMs = 1000 / tickRate;
    this.stepSeconds = 1 / tickRate;
    this.updateFn = update;
    this.renderFn = render;

    this.running = false;
    this.lastTimestamp = 0;
    this.accumulator = 0;
    this.rafId = null;

    this.fps = 0;
    this.framesThisSecond = 0;
    this.fpsTimer = 0;

    this._loop = this._loop.bind(this);
  }

  start() {
    if (this.running) {
      return;
    }
    this.running = true;
    this.lastTimestamp = performance.now();
    this.accumulator = 0;
    this.fps = 0;
    this.framesThisSecond = 0;
    this.fpsTimer = 0;
    this.rafId = requestAnimationFrame(this._loop);
  }

  stop() {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  _loop(timestamp) {
    if (!this.running) {
      return;
    }

    let frameTime = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    // Clamp huge spikes to keep the simulation stable after tab switches.
    frameTime = Math.min(frameTime, 250);
    this.accumulator += frameTime;

    while (this.accumulator >= this.stepMs) {
      this.updateFn(this.stepSeconds);
      this.accumulator -= this.stepMs;
    }

    const alpha = this.accumulator / this.stepMs;
    this.renderFn(alpha);

    this.framesThisSecond += 1;
    this.fpsTimer += frameTime;
    if (this.fpsTimer >= 1000) {
      this.fps = this.framesThisSecond;
      this.framesThisSecond = 0;
      this.fpsTimer -= 1000;
    }

    this.rafId = requestAnimationFrame(this._loop);
  }
}