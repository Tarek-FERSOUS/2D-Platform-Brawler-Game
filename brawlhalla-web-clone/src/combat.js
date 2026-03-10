import { aabbIntersects, createAABB } from "./collision.js";
import { WEAPON_DEFS } from "./weapons.js";

export const BASE_ATTACKS = {
  neutralLight: {
    id: "neutralLight",
    name: "Neutral Light",
    startup: 0.06,
    active: 0.08,
    recovery: 0.18,
    damage: 9,
    baseKnockback: 190,
    knockbackScaling: 5.2,
    angle: 75,
    cooldown: 0.22,
    groundOnly: true,
    hitbox: { offsetX: 36, offsetY: 16, width: 52, height: 26 },
  },
  sideLight: {
    id: "sideLight",
    name: "Side Light",
    startup: 0.07,
    active: 0.1,
    recovery: 0.2,
    damage: 11,
    baseKnockback: 235,
    knockbackScaling: 6.5,
    angle: 34,
    cooldown: 0.27,
    groundOnly: true,
    hitbox: { offsetX: 42, offsetY: 18, width: 58, height: 24 },
  },
  downLight: {
    id: "downLight",
    name: "Down Light",
    startup: 0.08,
    active: 0.09,
    recovery: 0.24,
    damage: 10,
    baseKnockback: 205,
    knockbackScaling: 5.9,
    angle: 58,
    cooldown: 0.3,
    groundOnly: true,
    hitbox: { offsetX: 40, offsetY: 34, width: 56, height: 28 },
  },
  neutralAir: {
    id: "neutralAir",
    name: "Neutral Air",
    startup: 0.05,
    active: 0.12,
    recovery: 0.2,
    damage: 10,
    baseKnockback: 205,
    knockbackScaling: 5.4,
    angle: 78,
    cooldown: 0.26,
    airOnly: true,
    hitbox: { offsetX: 30, offsetY: 6, width: 70, height: 34 },
  },
  sideAir: {
    id: "sideAir",
    name: "Side Air",
    startup: 0.06,
    active: 0.12,
    recovery: 0.24,
    damage: 12,
    baseKnockback: 255,
    knockbackScaling: 7.2,
    angle: 32,
    cooldown: 0.33,
    airOnly: true,
    hitbox: { offsetX: 44, offsetY: 14, width: 62, height: 24 },
  },
  downAir: {
    id: "downAir",
    name: "Down Air",
    startup: 0.07,
    active: 0.13,
    recovery: 0.26,
    damage: 13,
    baseKnockback: 250,
    knockbackScaling: 7,
    angle: 292,
    cooldown: 0.34,
    airOnly: true,
    hitbox: { offsetX: 34, offsetY: 38, width: 52, height: 34 },
  },
  heavy: {
    id: "heavy",
    name: "Heavy",
    startup: 0.15,
    active: 0.11,
    recovery: 0.33,
    damage: 18,
    baseKnockback: 360,
    knockbackScaling: 9.6,
    angle: 38,
    cooldown: 0.52,
    hitbox: { offsetX: 46, offsetY: 14, width: 68, height: 30 },
  },
  groundPound: {
    id: "groundPound",
    name: "Ground Pound",
    startup: 0.1,
    active: 0.24,
    recovery: 0.24,
    damage: 16,
    baseKnockback: 300,
    knockbackScaling: 8.2,
    angle: 285,
    cooldown: 0.5,
    airOnly: true,
    hitbox: { offsetX: 14, offsetY: 44, width: 28, height: 62 },
  },
  recovery: {
    id: "recovery",
    name: "Recovery",
    startup: 0.07,
    active: 0.18,
    recovery: 0.28,
    damage: 14,
    baseKnockback: 295,
    knockbackScaling: 7.4,
    angle: 86,
    cooldown: 0.44,
    airOnly: true,
    hitbox: { offsetX: 18, offsetY: -26, width: 34, height: 56 },
  },
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createMergedAttack(base, override) {
  return {
    ...base,
    ...override,
    hitbox: {
      ...base.hitbox,
      ...(override?.hitbox || {}),
    },
  };
}

export class CombatSystem {
  constructor({ particles, camera }) {
    this.particles = particles;
    this.camera = camera;
    this.debugHitboxes = [];
    this.projectiles = [];
  }

  update(players, dt) {
    this.debugHitboxes.length = 0;

    for (const attacker of players) {
      if (!attacker.currentAttack) {
        continue;
      }

      const attackState = attacker.currentAttack;
      attackState.timer += dt;

      const startupEnd = attackState.data.startup;
      const activeEnd = startupEnd + attackState.data.active;
      const recoveryEnd = activeEnd + attackState.data.recovery;

      if (attackState.timer >= startupEnd && attackState.timer <= activeEnd) {
        this.tryHitTargets(attacker, attackState, players);
      }

      if (attackState.timer >= recoveryEnd) {
        attacker.currentAttack = null;
      }
    }

    for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
      const projectile = this.projectiles[i];
      projectile.life -= dt;
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.vy += projectile.gravity * dt;

      if (projectile.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      let consumed = false;
      for (const target of players) {
        if (target.id === projectile.ownerId || target.outOfStocks || target.respawnTimer > 0) {
          continue;
        }

        if (target.isInvulnerable()) {
          continue;
        }

        const hitbox = createAABB(projectile.x - projectile.radius, projectile.y - projectile.radius, projectile.radius * 2, projectile.radius * 2);
        if (!aabbIntersects(hitbox, target.getHurtbox())) {
          continue;
        }

        if (projectile.kind === "throwable") {
          target.damage += projectile.damage;
          target.vx = projectile.vx * 0.92;
          target.vy = -240;
          target.hitstunTimer = Math.max(target.hitstunTimer, 0.2);
          this.particles.spawnHitSpark(target.centerX, target.centerY, projectile.color);
        } else {
          this.applyExplosion(projectile, target, players);
        }

        this.projectiles.splice(i, 1);
        consumed = true;
        break;
      }

      if (!consumed && projectile.kind === "grenade" && projectile.vy > 0 && projectile.life < 0.6) {
        this.applyExplosion(projectile, null, players);
        this.projectiles.splice(i, 1);
      }
    }
  }

  applyExplosion(projectile, primaryTarget, players) {
    const radius = 92;
    for (const target of players) {
      if (target.id === projectile.ownerId || target.outOfStocks || target.respawnTimer > 0) {
        continue;
      }

      const dx = target.centerX - projectile.x;
      const dy = target.centerY - projectile.y;
      const dist = Math.hypot(dx, dy);
      if (dist > radius) {
        continue;
      }

      const forceT = 1 - dist / radius;
      const damage = projectile.damage * (0.55 + forceT * 0.8);
      target.damage += damage;
      target.vx = Math.sign(dx || 1) * (220 + 240 * forceT);
      target.vy = -(220 + 260 * forceT);
      target.onGround = false;
      target.hitstunTimer = Math.max(target.hitstunTimer, 0.18 + 0.18 * forceT);
    }

    this.particles.spawnHitSpark(projectile.x, projectile.y, projectile.color);
    this.camera.addShake(primaryTarget ? 0.18 : 0.12, 0.15);
  }

  handlePlayerActions(player, intent) {
    if (player.outOfStocks || player.respawnTimer > 0) {
      return;
    }

    if (
      intent.dodgePressed &&
      player.dodgeCooldown <= 0 &&
      player.hitstunTimer <= 0 &&
      player.attackLockTimer <= 0
    ) {
      player.startDodge(intent.moveX);
      return;
    }

    if (player.hitstunTimer > 0 || player.dodgeTimer > 0 || player.attackLockTimer > 0) {
      return;
    }

    const ability = WEAPON_DEFS[player.weaponType] || WEAPON_DEFS.unarmed;

    if (player.weaponType === "throwables" && intent.lightPressed && player.throwableCooldown <= 0) {
      this.projectiles.push({
        kind: "throwable",
        ownerId: player.id,
        x: player.centerX + player.facing * 26,
        y: player.y + player.height * 0.45,
        vx: player.facing * 620,
        vy: -70,
        gravity: 520,
        life: 1.8,
        radius: 11,
        damage: 8,
        color: ability.color,
      });
      player.throwableCooldown = ability.throwCooldown;
      return;
    }

    if (player.weaponType === "explosives" && intent.heavyPressed && player.grenadeCooldown <= 0) {
      this.projectiles.push({
        kind: "grenade",
        ownerId: player.id,
        x: player.centerX + player.facing * 20,
        y: player.y + player.height * 0.28,
        vx: player.facing * 450,
        vy: -540,
        gravity: 980,
        life: 1.35,
        radius: 14,
        damage: 12,
        color: ability.color,
      });
      player.grenadeCooldown = ability.grenadeCooldown;
      return;
    }

    const attackId = this.resolveAttackInput(player, intent);
    if (!attackId) {
      return;
    }

    this.tryStartAttack(player, attackId);
  }

  resolveAttackInput(player, intent) {
    if (intent.heavyPressed) {
      if (!player.onGround && intent.downHeld) {
        return "groundPound";
      }
      if (!player.onGround && intent.jumpHeld) {
        return "recovery";
      }
      return "heavy";
    }

    if (!intent.lightPressed) {
      return null;
    }

    if (player.onGround) {
      if (intent.downHeld) {
        return "downLight";
      }
      if (intent.moveX !== 0) {
        return "sideLight";
      }
      return "neutralLight";
    }

    if (intent.downHeld) {
      return "downAir";
    }
    if (intent.moveX !== 0) {
      return "sideAir";
    }
    return "neutralAir";
  }

  tryStartAttack(player, attackId) {
    const attack = this.getAttackData(player, attackId);
    if (!attack) {
      return false;
    }

    if (attack.groundOnly && !player.onGround) {
      return false;
    }

    if (attack.airOnly && player.onGround) {
      return false;
    }

    if (player.attackCooldowns.has(attackId)) {
      return false;
    }

    player.attackCooldowns.set(attackId, attack.cooldown);
    player.attackLockTimer = attack.startup + attack.active + attack.recovery;
    player.currentAttack = {
      id: attackId,
      timer: 0,
      data: attack,
      hitTargets: new Set(),
    };

    if (!player.onGround) {
      player.vx *= 0.72;
    }

    return true;
  }

  getAttackData(player, attackId) {
    const base = BASE_ATTACKS[attackId];
    if (!base) {
      return null;
    }

    const weapon = WEAPON_DEFS[player.weaponType] || WEAPON_DEFS.unarmed;
    const override = weapon.attackOverrides[attackId] || null;

    const merged = createMergedAttack(base, override);
    merged.damage *= weapon.damageMultiplier;
    merged.baseKnockback *= weapon.knockbackMultiplier;
    merged.knockbackScaling *= weapon.knockbackMultiplier;

    return merged;
  }

  tryHitTargets(attacker, attackState, players) {
    const hitbox = this.buildHitbox(attacker, attackState.data);
    this.debugHitboxes.push(hitbox);

    for (const target of players) {
      if (target.id === attacker.id || target.outOfStocks || target.respawnTimer > 0) {
        continue;
      }

      if (target.isInvulnerable()) {
        continue;
      }

      if (attackState.hitTargets.has(target.id)) {
        continue;
      }

      if (!aabbIntersects(hitbox, target.getHurtbox())) {
        continue;
      }

      attackState.hitTargets.add(target.id);
      this.applyHit(attacker, target, attackState.data);
    }
  }

  buildHitbox(attacker, attackData) {
    const baseX = attacker.facing === 1
      ? attacker.x + attackData.hitbox.offsetX
      : attacker.x + attacker.width - attackData.hitbox.offsetX - attackData.hitbox.width;

    const box = createAABB(
      baseX,
      attacker.y + attackData.hitbox.offsetY,
      attackData.hitbox.width,
      attackData.hitbox.height
    );

    box.ownerId = attacker.id;
    box.attackId = attackData.id;

    return box;
  }

  applyHit(attacker, target, attack) {
    const attackerAbility = WEAPON_DEFS[attacker.weaponType] || WEAPON_DEFS.unarmed;
    const targetAbility = WEAPON_DEFS[target.weaponType] || WEAPON_DEFS.unarmed;

    const totalDamage = attack.damage * attackerAbility.damageMultiplier * targetAbility.damageTakenMultiplier;
    target.damage += totalDamage;

    const kbMagnitude =
      (attack.baseKnockback + target.damage * attack.knockbackScaling) * attackerAbility.knockbackMultiplier;
    const rad = (attack.angle * Math.PI) / 180;

    let dirX = Math.cos(rad);
    const dirY = -Math.sin(rad);

    if (attacker.facing < 0) {
      dirX *= -1;
    }

    target.vx = dirX * kbMagnitude;
    target.vy = dirY * kbMagnitude;
    target.onGround = false;

    const hitstun = clamp(0.11 + kbMagnitude / 1350, 0.1, 0.85);
    target.hitstunTimer = Math.max(target.hitstunTimer, hitstun);

    if (attacker.comboTimer > 0) {
      attacker.comboCount += 1;
    } else {
      attacker.comboCount = 1;
    }
    attacker.comboTimer = 1.3;

    target.lastHitBy = attacker.id;

    this.particles.spawnHitSpark(target.centerX, target.centerY, attacker.color);
    this.particles.spawnKnockbackTrail(target.centerX, target.centerY, dirX, dirY);

    const shake = clamp(kbMagnitude / 1200, 0.08, 0.24);
    this.camera.addShake(shake, 0.16);
  }
}