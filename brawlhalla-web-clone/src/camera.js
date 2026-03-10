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

  setStage(stage) {
    if (!stage) {
      return;
    }

    this.x = stage.centerX;
    this.y = stage.centerY;
  }

  update(players, canvas, dt, stage = null) {
    const alivePlayers = players.filter((player) => !player.outOfStocks);
    if (!alivePlayers.length) {
      return;
    }

    const cameraConfig = stage?.camera || {};
    const minZoom = cameraConfig.minZoom ?? this.minZoom;
    const maxZoom = cameraConfig.maxZoom ?? this.maxZoom;
    const baseSpreadX = cameraConfig.baseSpreadX ?? 420;
    const baseSpreadY = cameraConfig.baseSpreadY ?? 260;
    const paddingX = cameraConfig.paddingX ?? 320;
    const paddingY = cameraConfig.paddingY ?? 260;
    const damping = cameraConfig.damping ?? 4.2;
    const closeZoomBoost = cameraConfig.closeZoomBoost ?? 0.3;
    const closeRange = cameraConfig.closeRange ?? 180;
    const farRange = cameraConfig.farRange ?? 980;

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

    const spreadX = Math.max(baseSpreadX, maxX - minX + paddingX);
    const spreadY = Math.max(baseSpreadY, maxY - minY + paddingY);

    const zoomX = canvas.width / spreadX;
    const zoomY = canvas.height / spreadY;
    let targetZoom = clamp(Math.min(zoomX, zoomY), minZoom, maxZoom);

    const separationX = maxX - minX;
    const separationY = maxY - minY;
    const playerSeparation = Math.hypot(separationX, separationY);
    const closeT = 1 - clamp((playerSeparation - closeRange) / (farRange - closeRange), 0, 1);
    if (closeT > 0) {
      const boostAmount = (maxZoom - targetZoom) * closeZoomBoost * closeT;
      targetZoom = clamp(targetZoom + boostAmount, minZoom, maxZoom);
    }

    const halfViewWidth = canvas.width * 0.5 / targetZoom;
    const halfViewHeight = canvas.height * 0.5 / targetZoom;

    const clampedTargetX = stage
      ? clamp(targetX, stage.blastZone.left + halfViewWidth, stage.blastZone.right - halfViewWidth)
      : targetX;
    const clampedTargetY = stage
      ? clamp(targetY, stage.blastZone.top + halfViewHeight, stage.blastZone.bottom - halfViewHeight)
      : targetY;

    this.x = damp(this.x, clampedTargetX, damping, dt);
    this.y = damp(this.y, clampedTargetY, damping, dt);
    this.zoom = damp(this.zoom, targetZoom, damping, dt);

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