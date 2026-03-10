function neutralIntent() {
  return {
    moveX: 0,
    jumpPressed: false,
    jumpHeld: false,
    downHeld: false,
    lightPressed: false,
    heavyPressed: false,
    dodgePressed: false,
  };
}

function distance(a, b) {
  const dx = a.centerX - b.centerX;
  const dy = a.centerY - b.centerY;
  return Math.hypot(dx, dy);
}

export class BotAI {
  constructor() {
    this.stateByPlayerId = new Map();
  }

  getState(playerId) {
    if (!this.stateByPlayerId.has(playerId)) {
      this.stateByPlayerId.set(playerId, {
        jumpDecisionTimer: 0,
        attackDecisionTimer: 0,
        recoveryPulse: 0,
      });
    }
    return this.stateByPlayerId.get(playerId);
  }

  getIntent(bot, players, stage, dt) {
    const intent = neutralIntent();
    const state = this.getState(bot.id);

    state.jumpDecisionTimer -= dt;
    state.attackDecisionTimer -= dt;
    state.recoveryPulse -= dt;

    const opponents = players.filter((player) => player.id !== bot.id && !player.outOfStocks);
    if (!opponents.length || bot.outOfStocks || bot.respawnTimer > 0) {
      return intent;
    }

    const target = opponents.sort((a, b) => distance(bot, a) - distance(bot, b))[0];

    const dx = target.centerX - bot.centerX;
    const dy = target.centerY - bot.centerY;

    intent.moveX = Math.abs(dx) > 26 ? Math.sign(dx) : 0;

    const mainPlatform = stage.platforms.find((p) => p.id === "main");
    const offStage =
      bot.centerY > mainPlatform.y + 80 ||
      bot.centerX < mainPlatform.x - 70 ||
      bot.centerX > mainPlatform.x + mainPlatform.width + 70;

    if (offStage) {
      intent.moveX = bot.centerX < stage.centerX ? 1 : -1;
      intent.downHeld = false;

      if (state.recoveryPulse <= 0) {
        intent.jumpPressed = true;
        intent.jumpHeld = true;
        state.recoveryPulse = 0.35;

        if (bot.recoveryCharges <= 0 && bot.airJumpsUsed >= bot.maxAirJumps) {
          intent.heavyPressed = true;
        }
      }

      return intent;
    }

    if (dy < -80 && bot.onGround && state.jumpDecisionTimer <= 0) {
      intent.jumpPressed = true;
      intent.jumpHeld = true;
      state.jumpDecisionTimer = 0.25;
    }

    const dangerOpponent = opponents.find((opponent) => {
      if (!opponent.currentAttack) {
        return false;
      }
      const nearX = Math.abs(opponent.centerX - bot.centerX) < 130;
      const nearY = Math.abs(opponent.centerY - bot.centerY) < 90;
      return nearX && nearY;
    });

    if (dangerOpponent && bot.dodgeCooldown <= 0 && bot.hitstunTimer <= 0) {
      intent.dodgePressed = true;
      intent.moveX = dx === 0 ? -bot.facing : -Math.sign(dx);
      return intent;
    }

    const inCloseRange = Math.abs(dx) < 110 && Math.abs(dy) < 90;
    const inHeavyRange = Math.abs(dx) < 85 && Math.abs(dy) < 70;

    if (state.attackDecisionTimer <= 0 && bot.attackLockTimer <= 0 && bot.hitstunTimer <= 0) {
      if (inHeavyRange && Math.random() > 0.7) {
        intent.heavyPressed = true;
      } else if (inCloseRange) {
        intent.lightPressed = true;

        if (!bot.onGround && dy > 30) {
          intent.downHeld = true;
        }
      }

      state.attackDecisionTimer = 0.16 + Math.random() * 0.22;
    }

    if (!bot.onGround && dy > 70) {
      intent.downHeld = true;
    }

    return intent;
  }
}