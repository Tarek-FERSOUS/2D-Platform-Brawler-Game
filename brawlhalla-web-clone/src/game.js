import { Engine, EntityStore } from "./engine.js";
import { InputManager } from "./input.js";
import { updatePlayerPhysics } from "./physics.js";
import { checkBlastZone } from "./collision.js";
import { Player } from "./player.js";
import { BotAI } from "./ai.js";
import { CombatSystem } from "./combat.js";
import { WeaponSystem } from "./weapons.js";
import { ParticleSystem } from "./particles.js";
import { Camera } from "./camera.js";
import { createStageRotation } from "./stage.js";
import { Renderer } from "./renderer.js";
import { MultiplayerManager } from "./multiplayer.js";
import { createAssetCatalog } from "./assets.js";

const canvas = document.getElementById("game-canvas");
const stages = createStageRotation();
let stageIndex = 0;
let stage = stages[stageIndex];
const assets = createAssetCatalog();

const camera = new Camera();
const renderer = new Renderer(canvas, camera, assets);
const input = new InputManager();
const particles = new ParticleSystem();
const weaponSystem = new WeaponSystem(stage);
const combat = new CombatSystem({ particles, camera });
const ai = new BotAI();
const multiplayer = new MultiplayerManager({ mode: "local" });

const ecs = new EntityStore();

const players = [
  new Player({
    id: 1,
    playerNumber: 1,
    name: "Player 1",
    color: "#40f0cf",
    spriteProfile: "soldier",
    spawnX: stage.spawnPoints[0].x,
    spawnY: stage.spawnPoints[0].y,
  }),
  new Player({
    id: 2,
    playerNumber: 2,
    name: "Player 2",
    color: "#ff8a6f",
    spriteProfile: "orc",
    spawnX: stage.spawnPoints[1].x,
    spawnY: stage.spawnPoints[1].y,
  }),
];

const playerEntityById = new Map();
for (const player of players) {
  const entity = ecs.create({
    type: "player",
    ref: player,
    transform: { x: player.x, y: player.y },
    physics: { vx: player.vx, vy: player.vy, onGround: false },
    stats: { damage: player.damage, stocks: player.stocks },
    control: { isBot: player.isBot },
  });

  playerEntityById.set(player.id, entity.id);
}

let phase = "countdown";
let countdown = 3;
let winner = null;
let botEnabled = false;
let frameNumber = 0;

function resize() {
  renderer.resize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", resize);
resize();

function syncEcsFromPlayers() {
  for (const player of players) {
    const entityId = playerEntityById.get(player.id);
    const entity = ecs.entities.get(entityId);
    if (!entity) {
      continue;
    }

    entity.components.transform.x = player.x;
    entity.components.transform.y = player.y;
    entity.components.physics.vx = player.vx;
    entity.components.physics.vy = player.vy;
    entity.components.physics.onGround = player.onGround;
    entity.components.stats.damage = player.damage;
    entity.components.stats.stocks = player.stocks;
    entity.components.control.isBot = player.isBot;
  }
}

function applyStage(nextIndex) {
  stageIndex = (nextIndex + stages.length) % stages.length;
  stage = stages[stageIndex];
  weaponSystem.stage = stage;
  camera.setStage(stage);

  if (window.__BRAWL_GAME__) {
    window.__BRAWL_GAME__.stage = stage;
    window.__BRAWL_GAME__.stageIndex = stageIndex;
  }
}

function resetMatch({ cycleStage = false } = {}) {
  if (cycleStage) {
    applyStage(stageIndex + 1);
  }

  camera.setStage(stage);

  phase = "countdown";
  countdown = 3;
  winner = null;
  frameNumber = 0;

  weaponSystem.pickups = [];
  weaponSystem.spawnTimer = 3;
  particles.particles = [];

  for (let i = 0; i < players.length; i += 1) {
    const player = players[i];
    const spawn = stage.spawnPoints[i % stage.spawnPoints.length];

    player.stocks = 3;
    player.outOfStocks = false;
    player.damage = 0;
    player.weaponType = "unarmed";
    player.currentAttack = null;
    player.attackLockTimer = 0;
    player.attackCooldowns.clear();
    player.hitstunTimer = 0;
    player.dodgeTimer = 0;
    player.dodgeCooldown = 0;
    player.invulnTimer = 0;
    player.comboCount = 0;
    player.comboTimer = 0;

    player.x = spawn.x;
    player.y = spawn.y;
    player.prevX = spawn.x;
    player.prevY = spawn.y;
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
    player.isLedgeGrabbing = false;
    player.airJumpsUsed = 0;
    player.recoveryCharges = player.maxRecoveryCharges;
    player.respawnTimer = 0;
  }

  syncEcsFromPlayers();
}

function getPlayerIntent(player, dt) {
  if (player.id === 1) {
    return input.getPlayerIntent(1);
  }

  if (player.id === 2) {
    if (botEnabled) {
      return ai.getIntent(player, players, stage, dt);
    }
    return input.getPlayerIntent(2);
  }

  return input.getNeutralIntent();
}

function registerLandingAndJumpEffects(player, previousOnGround, intent) {
  if (!previousOnGround && player.onGround && player.vy >= 0) {
    particles.spawnLandingDust(player.centerX, player.y + player.height, player.color);
  }

  if (previousOnGround && !player.onGround && intent.jumpPressed) {
    particles.spawnJumpDust(player.centerX, player.y + player.height, player.color);
  }
}

function handleOutOfBounds(player) {
  if (!checkBlastZone(player, stage)) {
    return;
  }

  player.stocks -= 1;
  weaponSystem.resetPlayerWeapon(player);
  camera.addShake(0.24, 0.18);
  particles.spawnHitSpark(player.centerX, player.centerY, "#ff9f8f");

  if (player.stocks <= 0) {
    player.outOfStocks = true;
    player.currentAttack = null;
    player.attackLockTimer = 0;
    player.vx = 0;
    player.vy = 0;
    return;
  }

  const spawn = stage.spawnPoints[(player.playerNumber - 1) % stage.spawnPoints.length];
  player.beginRespawn(spawn);
}

function update(dt) {
  frameNumber += 1;

  if (input.wasPressed("KeyM")) {
    resetMatch({ cycleStage: true });
  }

  if (input.wasPressed("KeyB")) {
    botEnabled = !botEnabled;
    players[1].isBot = botEnabled;
  }

  if (phase === "finished" && input.wasPressed("KeyR")) {
    resetMatch({ cycleStage: true });
  }

  for (const player of players) {
    player.tickTimers(dt);
  }

  if (phase === "countdown") {
    countdown -= dt;

    if (countdown <= -0.45) {
      phase = "playing";
    }

    const neutralIntent = input.getNeutralIntent();
    for (const player of players) {
      if (player.outOfStocks) {
        continue;
      }

      const wasOnGround = player.onGround;
      updatePlayerPhysics(player, neutralIntent, stage, dt);
      registerLandingAndJumpEffects(player, wasOnGround, neutralIntent);
    }

    camera.update(players, canvas, dt, stage);
    particles.update(dt);
    for (const player of players) {
      player.updateAnimation(dt);
    }

    syncEcsFromPlayers();
    input.commitFrame();
    return;
  }

  if (phase === "playing") {
    for (const player of players) {
      if (player.outOfStocks) {
        continue;
      }

      const intent = getPlayerIntent(player, dt);
      player.lastIntent = intent;

      if (multiplayer.mode === "online") {
        multiplayer.sendInput(player.id, intent, frameNumber);
      }

      combat.handlePlayerActions(player, intent);

      const wasOnGround = player.onGround;
      updatePlayerPhysics(player, intent, stage, dt);
      registerLandingAndJumpEffects(player, wasOnGround, intent);
    }

    combat.update(players, dt);
    weaponSystem.update(dt, players);

    for (const player of players) {
      if (!player.outOfStocks) {
        handleOutOfBounds(player);
      }
    }

    const alive = players.filter((player) => !player.outOfStocks);
    if (alive.length <= 1) {
      phase = "finished";
      winner = alive[0] || null;
    }
  }

  particles.update(dt);
  camera.update(players, canvas, dt, stage);

  for (const player of players) {
    player.updateAnimation(dt);
  }

  syncEcsFromPlayers();
  input.commitFrame();
}

function render() {
  renderer.render({
    stage,
    players,
    particles,
    weaponSystem,
    combat,
    phase,
    countdown,
    winner,
    botEnabled,
    fps: engine.fps,
  });
}

const engine = new Engine({
  tickRate: 60,
  update,
  render,
});

window.__BRAWL_GAME__ = {
  engine,
  stages,
  stageIndex,
  players,
  stage,
  ecs,
  combat,
  weaponSystem,
  particles,
  camera,
  multiplayer,
  resetMatch,
};

resetMatch();
engine.start();
