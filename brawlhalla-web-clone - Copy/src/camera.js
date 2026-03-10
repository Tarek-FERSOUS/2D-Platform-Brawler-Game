function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function damp(current, target, lambda, dt) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

export class Camera {
  constructor() {
    this.x = 640;
    this.y = 360;
    this.zoom = 1;

    this.minZoom = 0.72;
    this.maxZoom = 1.22;

    this.shakeTime = 0;
    this.shakeDuration = 0;
    this.shakeStrength = 0;
    this.shakeX = 0;
    this.shakeY = 0;
  }

  update(players, canvas, dt) {
    const alivePlayers = players.filter((player) => !player.outOfStocks);
    if (!alivePlayers.length) {
      return;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const player of alivePlayers) {
      const x = player.centerX;
      const y = player.centerY;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    const targetX = (minX + maxX) * 0.5;
    const targetY = (minY + maxY) * 0.5;

    const spreadX = Math.max(360, maxX - minX + 320);
    const spreadY = Math.max(220, maxY - minY + 260);

    const zoomX = canvas.width / spreadX;
    const zoomY = canvas.height / spreadY;
    const targetZoom = clamp(Math.min(zoomX, zoomY), this.minZoom, this.maxZoom);

    this.x = damp(this.x, targetX, 4.2, dt);
    this.y = damp(this.y, targetY, 4.2, dt);
    this.zoom = damp(this.zoom, targetZoom, 4.2, dt);

    if (this.shakeTime > 0) {
      this.shakeTime = Math.max(0, this.shakeTime - dt);
      const t = this.shakeDuration > 0 ? this.shakeTime / this.shakeDuration : 0;
      const strength = this.shakeStrength * t;
      this.shakeX = (Math.random() * 2 - 1) * strength * 30;
      this.shakeY = (Math.random() * 2 - 1) * strength * 30;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }
  }

  addShake(strength, duration = 0.12) {
    this.shakeStrength = Math.max(this.shakeStrength, strength);
    this.shakeDuration = duration;
    this.shakeTime = duration;
  }

  begin(ctx, canvas) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(canvas.width * 0.5, canvas.height * 0.5);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x + this.shakeX, -this.y + this.shakeY);
  }

  end(ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}