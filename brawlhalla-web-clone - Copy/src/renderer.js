import { WEAPON_DEFS } from "./weapons.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function colorWithAlpha(hex, alpha) {
  if (!hex.startsWith("#") || (hex.length !== 7 && hex.length !== 4)) {
    return hex;
  }

  let r;
  let g;
  let b;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export class Renderer {
  constructor(canvas, camera) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.camera = camera;
    this.showDebugHitboxes = false;
  }

  resize(width, height) {
    this.canvas.width = Math.floor(width);
    this.canvas.height = Math.floor(height);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
  }

  render(state) {
    const {
      stage,
      players,
      particles,
      weaponSystem,
      combat,
      phase,
      countdown,
      winner,
      botEnabled,
      fps,
    } = state;

    const ctx = this.ctx;
    const displayWidth = this.canvas.clientWidth;
    const displayHeight = this.canvas.clientHeight;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, "#112042");
    gradient.addColorStop(0.55, "#172e53");
    gradient.addColorStop(1, "#0f1b31");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.camera.begin(ctx, this.canvas);

    this.drawParallax(stage, ctx);
    this.drawStage(stage, ctx);
    this.drawWeaponPickups(weaponSystem.pickups, ctx);
    particles.draw(ctx);

    for (const player of players) {
      if (player.outOfStocks) {
        continue;
      }
      this.drawPlayer(player, ctx);
    }

    if (this.showDebugHitboxes) {
      this.drawDebugHitboxes(combat.debugHitboxes, players, ctx);
    }

    this.camera.end(ctx);

    this.drawHud(players, phase, countdown, winner, botEnabled, fps, displayWidth, ctx);
  }

  drawParallax(stage, ctx) {
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    for (let i = 0; i < 10; i += 1) {
      const x = (i * 180 + 120) % 1700;
      const y = 110 + Math.sin(i * 0.7) * 26;
      ctx.beginPath();
      ctx.arc(x, y, 60 + (i % 3) * 14, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "rgba(130, 186, 245, 0.25)";
    ctx.lineWidth = 4;
    ctx.strokeRect(
      stage.blastZone.left,
      stage.blastZone.top,
      stage.blastZone.right - stage.blastZone.left,
      stage.blastZone.bottom - stage.blastZone.top
    );
  }

  drawStage(stage, ctx) {
    for (const platform of stage.platforms) {
      const isMain = platform.id === "main";
      const gradient = ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.height);
      gradient.addColorStop(0, isMain ? "#63b5f7" : "#9ad0ff");
      gradient.addColorStop(1, isMain ? "#355f9c" : "#4b6fa0");

      ctx.fillStyle = gradient;
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

      ctx.strokeStyle = isMain ? "#ffd28f" : "#c7deff";
      ctx.lineWidth = 2;
      ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    }
  }

  drawWeaponPickups(pickups, ctx) {
    for (const pickup of pickups) {
      const weapon = WEAPON_DEFS[pickup.type];
      const glow = ctx.createRadialGradient(
        pickup.x + pickup.width * 0.5,
        pickup.y + pickup.height * 0.5,
        2,
        pickup.x + pickup.width * 0.5,
        pickup.y + pickup.height * 0.5,
        24
      );
      glow.addColorStop(0, colorWithAlpha(weapon.color, 0.82));
      glow.addColorStop(1, "rgba(255,255,255,0)");

      ctx.fillStyle = glow;
      ctx.fillRect(pickup.x - 10, pickup.y - 10, pickup.width + 20, pickup.height + 20);

      ctx.fillStyle = weapon.color;
      ctx.fillRect(pickup.x, pickup.y, pickup.width, pickup.height);

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.strokeRect(pickup.x, pickup.y, pickup.width, pickup.height);
    }
  }

  drawPlayer(player, ctx) {
    const blink = player.invulnTimer > 0 && Math.floor(player.invulnTimer * 25) % 2 === 0;
    if (blink) {
      return;
    }

    const weapon = WEAPON_DEFS[player.weaponType] || WEAPON_DEFS.unarmed;

    const bodySquash =
      player.animationState === "run"
        ? 0.92 + (player.animationFrame % 2) * 0.08
        : player.animationState === "jump"
          ? 1.08
          : 1;

    const sway =
      player.animationState === "run"
        ? Math.sin(player.animationFrame * 0.8) * 2.2
        : player.animationState === "attack"
          ? Math.sin(player.animationFrame * 1.7) * 3
          : 0;

    ctx.save();
    ctx.translate(player.centerX, player.centerY);
    ctx.scale(player.facing, 1);

    if (player.dodgeTimer > 0) {
      ctx.globalAlpha = 0.65;
    }

    const w = player.width * 0.62;
    const h = player.height * bodySquash;

    ctx.fillStyle = player.color;
    ctx.fillRect(-w * 0.5, -h * 0.5 + sway, w, h);

    ctx.fillStyle = "#f4f8ff";
    ctx.beginPath();
    ctx.arc(0, -h * 0.52 + sway, 12, 0, Math.PI * 2);
    ctx.fill();

    // Weapon marker keeps sprites optional while preserving weapon readability.
    ctx.fillStyle = weapon.color;
    ctx.fillRect(w * 0.34, -8 + sway, 20, 10);

    if (player.currentAttack) {
      ctx.strokeStyle = "#ffe490";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(w * 0.34, -2 + sway, 17, -0.6, 0.7);
      ctx.stroke();
    }

    ctx.restore();

    ctx.fillStyle = "#ffffff";
    ctx.font = "14px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText(player.name, player.centerX, player.y - 14);

    if (player.comboCount > 1 && player.comboTimer > 0) {
      ctx.fillStyle = "#ffda80";
      ctx.font = "12px Trebuchet MS";
      ctx.fillText(`${player.comboCount}x`, player.centerX, player.y - 30);
    }
  }

  drawDebugHitboxes(hitboxes, players, ctx) {
    ctx.strokeStyle = "rgba(255, 0, 0, 0.85)";
    ctx.lineWidth = 2;

    for (const box of hitboxes) {
      ctx.strokeRect(box.x, box.y, box.width, box.height);
    }

    ctx.strokeStyle = "rgba(80, 255, 120, 0.9)";
    for (const player of players) {
      const h = player.getHurtbox();
      ctx.strokeRect(h.x, h.y, h.width, h.height);
    }
  }

  drawHud(players, phase, countdown, winner, botEnabled, fps, width, ctx) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const alivePlayers = players.filter((p) => !p.outOfStocks);
    const panelWidth = Math.min(350, width * 0.45);

    players.forEach((player, index) => {
      const x = index === 0 ? 16 : this.canvas.width - panelWidth - 16;
      const y = this.canvas.height - 92;
      const align = index === 0 ? "left" : "right";

      ctx.fillStyle = "rgba(8, 15, 28, 0.66)";
      ctx.fillRect(x, y, panelWidth, 76);

      ctx.strokeStyle = colorWithAlpha(player.baseColor, 0.95);
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, panelWidth, 76);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px Trebuchet MS";
      ctx.textAlign = align;

      const nameX = index === 0 ? x + 12 : x + panelWidth - 12;
      const percentX = nameX;

      ctx.fillText(player.name, nameX, y + 24);
      ctx.fillStyle = this.damageColor(player.damage);
      ctx.font = "bold 28px Trebuchet MS";
      ctx.fillText(`${Math.floor(player.damage)}%`, percentX, y + 55);

      ctx.fillStyle = "#f9f2d0";
      ctx.font = "14px Trebuchet MS";
      ctx.fillText(`Stocks: ${player.stocks}`, nameX, y + 72);
    });

    ctx.textAlign = "center";

    if (phase === "countdown") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.fillStyle = "#ffecad";
      ctx.font = "bold 98px Trebuchet MS";
      const text = countdown > 0 ? `${Math.ceil(countdown)}` : "FIGHT!";
      ctx.fillText(text, this.canvas.width * 0.5, this.canvas.height * 0.5);
    }

    if (phase === "finished" && winner) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.fillStyle = "#ffd27a";
      ctx.font = "bold 62px Trebuchet MS";
      ctx.fillText(`${winner.name} Wins`, this.canvas.width * 0.5, this.canvas.height * 0.44);

      ctx.fillStyle = "#ffffff";
      ctx.font = "24px Trebuchet MS";
      ctx.fillText("Press R to Restart", this.canvas.width * 0.5, this.canvas.height * 0.54);
    }

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "13px Trebuchet MS";
    ctx.fillText(
      `Mode: ${botEnabled ? "P1 vs Bot" : "Local P1 vs P2"} | Alive: ${alivePlayers.length} | FPS: ${fps}`,
      this.canvas.width * 0.5,
      24
    );

    ctx.restore();
  }

  damageColor(value) {
    const t = clamp(value / 220, 0, 1);
    const r = Math.floor(120 + 135 * t);
    const g = Math.floor(255 - 175 * t);
    const b = Math.floor(150 - 120 * t);
    return `rgb(${r}, ${g}, ${b})`;
  }
}
