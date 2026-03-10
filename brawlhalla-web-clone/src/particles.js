function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawn(particle) {
    this.particles.push(particle);
  }

  spawnJumpDust(x, y, color = "#ffffff") {
    for (let i = 0; i < 6; i += 1) {
      this.spawn({
        type: "dust",
        x,
        y,
        vx: randomRange(-120, 120),
        vy: randomRange(-40, -8),
        radius: randomRange(3, 6),
        life: randomRange(0.22, 0.36),
        maxLife: 0,
        color,
      });
    }
  }

  spawnLandingDust(x, y, color = "#f2f2f2") {
    for (let i = 0; i < 8; i += 1) {
      this.spawn({
        type: "dust",
        x,
        y,
        vx: randomRange(-170, 170),
        vy: randomRange(-120, -30),
        radius: randomRange(2, 5),
        life: randomRange(0.2, 0.45),
        maxLife: 0,
        color,
      });
    }
  }

  spawnHitSpark(x, y, color = "#ffea8a") {
    for (let i = 0; i < 12; i += 1) {
      this.spawn({
        type: "spark",
        x,
        y,
        vx: randomRange(-300, 300),
        vy: randomRange(-260, 260),
        radius: randomRange(2, 4),
        life: randomRange(0.12, 0.24),
        maxLife: 0,
        color,
      });
    }
  }

  spawnKnockbackTrail(x, y, dirX, dirY) {
    for (let i = 0; i < 10; i += 1) {
      const spread = i * 0.02;
      this.spawn({
        type: "trail",
        x: x - dirX * i * 8,
        y: y - dirY * i * 8,
        vx: -dirX * randomRange(70, 180),
        vy: -dirY * randomRange(70, 180) + spread,
        radius: randomRange(2, 3.5),
        life: randomRange(0.1, 0.2),
        maxLife: 0,
        color: "#fff0b3",
      });
    }
  }

  update(dt) {
    for (const p of this.particles) {
      if (!p.maxLife) {
        p.maxLife = p.life;
      }

      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      p.vx *= 0.92;
      p.vy *= 0.92;

      if (p.type === "dust") {
        p.vy += 240 * dt;
      }
    }

    this.particles = this.particles.filter((p) => p.life > 0);
  }

  draw(ctx) {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }
}