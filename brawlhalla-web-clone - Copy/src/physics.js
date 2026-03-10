import { resolveStageCollisions, tryLedgeGrab } from "./collision.js";

export const PHYSICS_CONFIG = {
  gravity: 2500,
  maxFallSpeed: 1700,
  fastFallMultiplier: 1.55,
  groundAcceleration: 4200,
  airAcceleration: 2600,
  groundFriction: 3800,
  airFriction: 140,
  maxRunSpeed: 460,
  jumpVelocity: 860,
  wallJumpHorizontal: 560,
  wallJumpVertical: 860,
  shortHopCutMultiplier: 0.5,
  recoveryHorizontal: 440,
  recoveryVertical: 980,
};

function approach(current, target, delta) {
  if (current < target) {
    return Math.min(current + delta, target);
  }
  if (current > target) {
    return Math.max(current - delta, target);
  }
  return current;
}

export function updatePlayerPhysics(player, intent, stage, dt) {
  player.prevX = player.x;
  player.prevY = player.y;
  const wallContact = player.touchingWall;
  player.touchingWall = null;

  const inControl =
    player.hitstunTimer <= 0 &&
    player.respawnTimer <= 0 &&
    player.dodgeTimer <= 0 &&
    player.attackLockTimer <= 0;

  if (inControl && player.ledgeLockTimer <= 0) {
    const acceleration = player.onGround
      ? PHYSICS_CONFIG.groundAcceleration
      : PHYSICS_CONFIG.airAcceleration;

    if (intent.moveX !== 0) {
      const targetSpeed = intent.moveX * PHYSICS_CONFIG.maxRunSpeed;
      player.vx = approach(player.vx, targetSpeed, acceleration * dt);
      player.facing = intent.moveX > 0 ? 1 : -1;
    } else {
      const friction = player.onGround
        ? PHYSICS_CONFIG.groundFriction
        : PHYSICS_CONFIG.airFriction;
      player.vx = approach(player.vx, 0, friction * dt);
    }

    if (intent.jumpPressed) {
      if (player.onGround || player.isLedgeGrabbing) {
        player.vy = -PHYSICS_CONFIG.jumpVelocity;
        player.onGround = false;
        player.isLedgeGrabbing = false;
        player.airJumpsUsed = 0;
      } else if (wallContact) {
        const wallDirection = wallContact === "left" ? 1 : -1;
        player.vx = wallDirection * PHYSICS_CONFIG.wallJumpHorizontal;
        player.vy = -PHYSICS_CONFIG.wallJumpVertical;
        player.facing = wallDirection;
        player.airJumpsUsed = 1;
      } else if (player.airJumpsUsed < player.maxAirJumps) {
        player.vy = -PHYSICS_CONFIG.jumpVelocity;
        player.airJumpsUsed += 1;
      } else if (player.recoveryCharges > 0 && player.y > stage.recoveryTriggerY) {
        // Off-stage recovery boost if jumps are exhausted.
        const targetX = stage.centerX - (player.x + player.width * 0.5);
        const horizontal = Math.sign(targetX) * PHYSICS_CONFIG.recoveryHorizontal;
        player.vx = horizontal;
        player.vy = -PHYSICS_CONFIG.recoveryVertical;
        player.recoveryCharges -= 1;
      }
    }

    if (!intent.jumpHeld && player.vy < -260) {
      player.vy = Math.max(player.vy * PHYSICS_CONFIG.shortHopCutMultiplier, -260);
    }
  }

  const gravityScale = !player.onGround && intent.downHeld && player.vy > 0
    ? PHYSICS_CONFIG.fastFallMultiplier
    : 1;

  player.vy += PHYSICS_CONFIG.gravity * gravityScale * dt;
  player.vy = Math.min(player.vy, PHYSICS_CONFIG.maxFallSpeed);

  player.x += player.vx * dt;
  player.y += player.vy * dt;

  resolveStageCollisions(player, stage, intent);

  if (!player.onGround) {
    tryLedgeGrab(player, stage, intent);
  }

  if (player.onGround) {
    player.airJumpsUsed = 0;
    player.recoveryCharges = player.maxRecoveryCharges;
  }

  if (player.ledgeLockTimer > 0) {
    player.ledgeLockTimer -= dt;
  }
}
