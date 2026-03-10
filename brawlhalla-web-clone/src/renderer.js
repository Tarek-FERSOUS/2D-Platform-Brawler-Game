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
  constructor(canvas, camera, assets = null) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.camera = camera;
    this.assets = assets;
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
    const skyGlow = ctx.createRadialGradient(stage.centerX, 70, 80, stage.centerX, 180, 980);
    skyGlow.addColorStop(0, "rgba(99, 189, 255, 0.19)");
    skyGlow.addColorStop(0.55, "rgba(116, 134, 255, 0.08)");
    skyGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = skyGlow;
    ctx.fillRect(stage.blastZone.left, stage.blastZone.top, stage.blastZone.right - stage.blastZone.left, 900);

    for (let i = 0; i < 120; i += 1) {
      const xSeed = Math.sin((i + 1) * 92.345) * 0.5 + 0.5;
      const ySeed = Math.sin((i + 1) * 38.177) * 0.5 + 0.5;
      const x = stage.blastZone.left + xSeed * (stage.blastZone.right - stage.blastZone.left);
      const y = stage.blastZone.top + 80 + ySeed * 340;
      const radius = 0.8 + (i % 3) * 0.6;
      ctx.fillStyle = i % 4 === 0 ? "rgba(255, 248, 215, 0.75)" : "rgba(190, 226, 255, 0.62)";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const ridgeLayers = [
      { y: 600, color: "rgba(16, 33, 66, 0.72)", wave: 55, step: 220 },
      { y: 640, color: "rgba(11, 25, 50, 0.85)", wave: 40, step: 180 },
    ];

    for (const ridge of ridgeLayers) {
      ctx.fillStyle = ridge.color;
      ctx.beginPath();
      ctx.moveTo(stage.blastZone.left, stage.blastZone.bottom);
      for (let x = stage.blastZone.left; x <= stage.blastZone.right + ridge.step; x += ridge.step) {
        const crest = ridge.y + Math.sin(x * 0.01) * ridge.wave;
        ctx.quadraticCurveTo(x - ridge.step * 0.5, crest - ridge.wave * 0.6, x, crest);
      }
      ctx.lineTo(stage.blastZone.right, stage.blastZone.bottom);
      ctx.closePath();
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
      gradient.addColorStop(0, isMain ? "#77c4ff" : "#9fd5ff");
      gradient.addColorStop(0.55, isMain ? "#4d92de" : "#6ea7e0");
      gradient.addColorStop(1, isMain ? "#2c4f88" : "#3f628d");

      ctx.shadowColor = isMain ? "rgba(104, 206, 255, 0.4)" : "rgba(150, 205, 255, 0.24)";
      ctx.shadowBlur = isMain ? 18 : 10;

      ctx.fillStyle = gradient;
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

      ctx.shadowBlur = 0;

      const highlight = ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.height * 0.5);
      highlight.addColorStop(0, "rgba(255,255,255,0.38)");
      highlight.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = highlight;
      ctx.fillRect(platform.x + 2, platform.y + 2, platform.width - 4, platform.height * 0.45);

      ctx.strokeStyle = isMain ? "#ffd28f" : "#c7deff";
      ctx.lineWidth = 2;
      ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);

      const underside = ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.height + 18);
      underside.addColorStop(0, "rgba(0,0,0,0.15)");
      underside.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = underside;
      ctx.fillRect(platform.x, platform.y + platform.height, platform.width, 18);
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

    const sway =
      player.animationState === "run"
        ? Math.sin(player.animationFrame * 0.8) * 2.2
        : player.animationState === "attack"
          ? Math.sin(player.animationFrame * 1.7) * 3
          : 0;

    ctx.save();
    ctx.translate(player.centerX, player.y + player.height);
    ctx.scale(player.facing, 1);

    if (player.dodgeTimer > 0) {
      ctx.globalAlpha = 0.65;
    }

    const w = player.width * 0.62;
    const h = player.height;
    const characterFrame = this.assets ? this.assets.getCharacterFrame(player) : null;
    let attackEffectX = w * 0.24;
    let attackEffectY = -h * 0.56 + sway;
    let attackEffectRadius = 17;

    if (characterFrame) {
      const spriteScale = 1.46;
      const fullDrawSize = player.height * spriteScale;
      const pixelScale = fullDrawSize / characterFrame.frameSize;
      const drawW = characterFrame.bounds.width * pixelScale;
      const drawH = characterFrame.bounds.height * pixelScale;
      const fullX = -fullDrawSize * 0.5;
      const fullY = -(characterFrame.bounds.bottom * pixelScale) + 1 + sway;
      const drawX = fullX + characterFrame.bounds.x * pixelScale;
      const drawY = fullY + characterFrame.bounds.y * pixelScale;

      attackEffectX = drawX + drawW * 0.64;
      attackEffectY = drawY + drawH * 0.68;
      attackEffectRadius = Math.max(11, Math.min(18, drawW * 0.18));

      ctx.drawImage(
        characterFrame.image,
        characterFrame.sx + characterFrame.bounds.x,
        characterFrame.sy + characterFrame.bounds.y,
        characterFrame.bounds.width,
        characterFrame.bounds.height,
        drawX,
        drawY,
        drawW,
        drawH
      );
    } else {
      ctx.fillStyle = player.color;
      ctx.fillRect(-w * 0.5, -h + sway, w, h);

      ctx.fillStyle = "#f4f8ff";
      ctx.beginPath();
      ctx.arc(0, -h * 0.78 + sway, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    if (player.currentAttack) {
      ctx.strokeStyle = "#ffe490";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(attackEffectX, attackEffectY, attackEffectRadius, -0.6, 0.7);
      ctx.stroke();

      const slashGlow = ctx.createRadialGradient(
        attackEffectX,
        attackEffectY,
        1,
        attackEffectX,
        attackEffectY,
        attackEffectRadius * 1.45
      );
      slashGlow.addColorStop(0, colorWithAlpha(weapon.color, 0.35));
      slashGlow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = slashGlow;
      const glowSize = attackEffectRadius * 2.9;
      ctx.fillRect(attackEffectX - glowSize * 0.5, attackEffectY - glowSize * 0.5, glowSize, glowSize);
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
    const panelWidth = Math.min(360, width * 0.45);
    const panelHeight = 86;
    const hudBarBase = this.assets ? this.assets.getImage("hudBarBase") : null;
    const hudBarFill = this.assets ? this.assets.getImage("hudBarFill") : null;

    players.forEach((player, index) => {
      const x = index === 0 ? 16 : this.canvas.width - panelWidth - 16;
      const y = this.canvas.height - panelHeight - 16;
      const align = index === 0 ? "left" : "right";

      const panelGradient = ctx.createLinearGradient(0, y, 0, y + panelHeight);
      panelGradient.addColorStop(0, "rgba(18, 34, 62, 0.84)");
      panelGradient.addColorStop(1, "rgba(7, 14, 28, 0.72)");
      ctx.fillStyle = panelGradient;
      ctx.fillRect(x, y, panelWidth, panelHeight);
      ctx.strokeStyle = colorWithAlpha(player.baseColor, 0.95);
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, panelWidth, panelHeight);

      const barX = x + 10;
      const barY = y + 42;
      const barW = panelWidth - 20;
      const barH = 24;

      if (hudBarBase && hudBarBase.complete && hudBarBase.naturalWidth > 0) {
        ctx.drawImage(hudBarBase, barX, barY, barW, barH);
      }

      const damageRatio = clamp(player.damage / 220, 0, 1);
      const fillW = Math.floor(barW * damageRatio);
      if (fillW > 0) {
        if (hudBarFill && hudBarFill.complete && hudBarFill.naturalWidth > 0) {
          const pattern = ctx.createPattern(hudBarFill, "repeat");
          if (pattern) {
            ctx.fillStyle = pattern;
            ctx.fillRect(barX, barY, fillW, barH);
          }
        } else {
          ctx.fillStyle = this.damageColor(player.damage);
          ctx.fillRect(barX, barY, fillW, barH);
        }

        const fillGlow = ctx.createLinearGradient(0, barY, 0, barY + barH);
        fillGlow.addColorStop(0, "rgba(255,255,255,0.22)");
        fillGlow.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = fillGlow;
        ctx.fillRect(barX, barY, fillW, barH);
      }

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px Trebuchet MS";
      ctx.textAlign = align;

      const nameX = index === 0 ? x + 12 : x + panelWidth - 12;
      const percentX = nameX;

      ctx.fillText(player.name, nameX, y + 24);
      ctx.fillStyle = this.damageColor(player.damage);
      ctx.font = "bold 28px Trebuchet MS";
      ctx.fillText(`${Math.floor(player.damage)}%`, percentX, y + 35);

      ctx.fillStyle = "#f9f2d0";
      ctx.font = "14px Trebuchet MS";
      ctx.fillText(`Stocks: ${player.stocks}`, nameX, y + 80);
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
