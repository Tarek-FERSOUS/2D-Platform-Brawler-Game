export function createAABB(x, y, width, height) {
  return { x, y, width, height };
}

export function aabbIntersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function checkBlastZone(player, stage) {
  const blast = stage.blastZone;
  const centerX = player.x + player.width * 0.5;
  const centerY = player.y + player.height * 0.5;

  return (
    centerX < blast.left ||
    centerX > blast.right ||
    centerY < blast.top ||
    centerY > blast.bottom
  );
}

export function resolveStageCollisions(player, stage, intent) {
  player.onGround = false;
  player.isLedgeGrabbing = false;

  const playerBox = createAABB(player.x, player.y, player.width, player.height);
  const prevBottom = player.prevY + player.height;
  const currBottom = player.y + player.height;

  for (const platform of stage.platforms) {
    const overlapX =
      player.x + player.width > platform.x && player.x < platform.x + platform.width;

    if (!overlapX) {
      continue;
    }

    const landedFromAbove =
      player.vy >= 0 &&
      prevBottom <= platform.y + stage.collisionPadding &&
      currBottom >= platform.y;

    if (platform.type === "pass") {
      if (landedFromAbove && !intent.downHeld) {
        player.y = platform.y - player.height;
        player.vy = 0;
        player.onGround = true;
        player.groundPlatformId = platform.id;
      }
      continue;
    }

    // Solid platform top collision.
    if (landedFromAbove) {
      player.y = platform.y - player.height;
      player.vy = 0;
      player.onGround = true;
      player.groundPlatformId = platform.id;
      continue;
    }

    // Solid side / underside collision fallback.
    const platformBox = createAABB(platform.x, platform.y, platform.width, platform.height);
    if (!aabbIntersects(playerBox, platformBox)) {
      continue;
    }

    const overlapLeft = player.x + player.width - platform.x;
    const overlapRight = platform.x + platform.width - player.x;
    const overlapTop = player.y + player.height - platform.y;
    const overlapBottom = platform.y + platform.height - player.y;

    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

    if (minOverlap === overlapTop) {
      player.y = platform.y - player.height;
      player.vy = 0;
      player.onGround = true;
      player.groundPlatformId = platform.id;
    } else if (minOverlap === overlapBottom) {
      player.y = platform.y + platform.height;
      if (player.vy < 0) {
        player.vy = 0;
      }
    } else if (minOverlap === overlapLeft) {
      player.x = platform.x - player.width;
      if (player.vx > 0) {
        player.vx = 0;
      }
      player.touchingWall = "right";
    } else if (minOverlap === overlapRight) {
      player.x = platform.x + platform.width;
      if (player.vx < 0) {
        player.vx = 0;
      }
      player.touchingWall = "left";
    }
  }
}

export function tryLedgeGrab(player, stage, intent) {
  if (player.onGround || player.vy < 0 || intent.downHeld) {
    return false;
  }

  for (const ledge of stage.ledges) {
    const playerCenterX = player.x + player.width * 0.5;
    const playerTop = player.y;
    const playerBottom = player.y + player.height;

    const horizontalRange = Math.abs(playerCenterX - ledge.x) <= 26;
    const verticalRange = playerTop <= ledge.y + 24 && playerBottom >= ledge.y - 18;

    if (!horizontalRange || !verticalRange) {
      continue;
    }

    if (ledge.side === "left") {
      player.x = ledge.x - player.width + 6;
    } else {
      player.x = ledge.x - 6;
    }

    player.y = ledge.y - player.height + 5;
    player.vx = 0;
    player.vy = 0;
    player.onGround = true;
    player.isLedgeGrabbing = true;
    player.ledgeLockTimer = 0.12;
    player.groundPlatformId = ledge.platformId;
    return true;
  }

  return false;
}