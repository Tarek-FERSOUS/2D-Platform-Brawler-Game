const DEFAULT_ANIMATIONS = {
  idle: { frames: 4, fps: 6 },
  run: { frames: 8, fps: 16 },
  jump: { frames: 2, fps: 10 },
  fall: { frames: 2, fps: 10 },
  attack: { frames: 5, fps: 18 },
  dodge: { frames: 3, fps: 20 },
  hitstun: { frames: 2, fps: 12 },
  respawn: { frames: 4, fps: 8 },
};

export class Player {
  constructor({ id, playerNumber, name, color, spawnX, spawnY, isBot = false }) {
    this.id = id;
    this.playerNumber = playerNumber;
    this.name = name;
    this.color = color;
    this.baseColor = color;
    this.isBot = isBot;

    this.width = 54;
    this.height = 84;

    this.spawnX = spawnX;
    this.spawnY = spawnY;
    this.x = spawnX;
    this.y = spawnY;
    this.prevX = spawnX;
    this.prevY = spawnY;

    this.vx = 0;
    this.vy = 0;
    this.facing = 1;

    this.onGround = false;
    this.isLedgeGrabbing = false;
    this.ledgeLockTimer = 0;
    this.groundPlatformId = null;
    this.touchingWall = null;

    this.damage = 0;
    this.stocks = 3;

    this.maxAirJumps = 1;
    this.airJumpsUsed = 0;

    this.maxRecoveryCharges = 1;
    this.recoveryCharges = this.maxRecoveryCharges;

    this.weaponType = "unarmed";
    this.weaponTime = 0;

    this.currentAttack = null;
    this.attackCooldowns = new Map();
    this.attackLockTimer = 0;
    this.hitstunTimer = 0;
    this.invulnTimer = 0;
    this.dodgeTimer = 0;
    this.dodgeCooldown = 0;

    this.comboCount = 0;
    this.comboTimer = 0;

    this.lastIntent = {
      moveX: 0,
      jumpPressed: false,
      jumpHeld: false,
      downHeld: false,
      lightPressed: false,
      heavyPressed: false,
      dodgePressed: false,
    };

    this.respawnTimer = 0;
    this.outOfStocks = false;

    this.animationState = "idle";
    this.animationTimer = 0;
    this.animationFrame = 0;
  }

  get centerX() {
    return this.x + this.width * 0.5;
  }

  get centerY() {
    return this.y + this.height * 0.5;
  }

  getHurtbox() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      ownerId: this.id,
    };
  }

  canControl() {
    return (
      this.respawnTimer <= 0 &&
      this.hitstunTimer <= 0 &&
      this.dodgeTimer <= 0 &&
      this.attackLockTimer <= 0
    );
  }

  isInvulnerable() {
    return this.invulnTimer > 0 || this.dodgeTimer > 0 || this.respawnTimer > 0;
  }

  startDodge(directionX) {
    this.dodgeTimer = 0.22;
    this.invulnTimer = Math.max(this.invulnTimer, 0.2);
    this.dodgeCooldown = 1.05;

    const impulse = 620;
    const direction = directionX === 0 ? this.facing : directionX;
    this.vx = direction * impulse;

    if (!this.onGround) {
      this.vy *= 0.2;
    }
  }

  beginRespawn(spawnPoint) {
    this.x = spawnPoint.x;
    this.y = spawnPoint.y;
    this.prevX = spawnPoint.x;
    this.prevY = spawnPoint.y;
    this.vx = 0;
    this.vy = 0;
    this.damage = 0;
    this.weaponType = "unarmed";
    this.currentAttack = null;
    this.attackLockTimer = 0;
    this.hitstunTimer = 0;
    this.dodgeTimer = 0;
    this.respawnTimer = 1.0;
    this.invulnTimer = 1.5;
    this.onGround = false;
    this.isLedgeGrabbing = false;
    this.airJumpsUsed = 0;
    this.recoveryCharges = this.maxRecoveryCharges;
  }

  tickTimers(dt) {
    this.weaponTime += dt;

    if (this.hitstunTimer > 0) {
      this.hitstunTimer = Math.max(0, this.hitstunTimer - dt);
    }

    if (this.attackLockTimer > 0) {
      this.attackLockTimer = Math.max(0, this.attackLockTimer - dt);
    }

    if (this.dodgeTimer > 0) {
      this.dodgeTimer = Math.max(0, this.dodgeTimer - dt);
    }

    if (this.dodgeCooldown > 0) {
      this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
    }

    if (this.invulnTimer > 0) {
      this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    }

    if (this.respawnTimer > 0) {
      this.respawnTimer = Math.max(0, this.respawnTimer - dt);
    }

    if (this.comboTimer > 0) {
      this.comboTimer = Math.max(0, this.comboTimer - dt);
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }

    for (const [attackId, cooldown] of this.attackCooldowns.entries()) {
      const updated = cooldown - dt;
      if (updated <= 0) {
        this.attackCooldowns.delete(attackId);
      } else {
        this.attackCooldowns.set(attackId, updated);
      }
    }
  }

  updateAnimation(dt) {
    let nextState = "idle";

    if (this.respawnTimer > 0) {
      nextState = "respawn";
    } else if (this.dodgeTimer > 0) {
      nextState = "dodge";
    } else if (this.hitstunTimer > 0) {
      nextState = "hitstun";
    } else if (this.currentAttack) {
      nextState = "attack";
    } else if (!this.onGround) {
      nextState = this.vy < 0 ? "jump" : "fall";
    } else if (Math.abs(this.vx) > 40) {
      nextState = "run";
    }

    if (this.animationState !== nextState) {
      this.animationState = nextState;
      this.animationTimer = 0;
      this.animationFrame = 0;
    }

    const config = DEFAULT_ANIMATIONS[this.animationState] || DEFAULT_ANIMATIONS.idle;
    this.animationTimer += dt;
    const frameDuration = 1 / config.fps;

    while (this.animationTimer >= frameDuration) {
      this.animationTimer -= frameDuration;
      this.animationFrame = (this.animationFrame + 1) % config.frames;
    }
  }
}