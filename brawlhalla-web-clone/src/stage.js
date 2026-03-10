function clonePlatforms(platforms) {
  return platforms.map((platform) => ({
    ...platform,
    baseX: platform.x,
    baseY: platform.y,
    deltaX: 0,
    deltaY: 0,
  }));
}

function createStageBase({
  id,
  name,
  centerX,
  centerY,
  width,
  height,
  camera,
  visuals,
  platforms,
  teleportGates,
  spawnPoints,
  weaponSpawns,
}) {
  const stagePlatforms = clonePlatforms(platforms);
  const main = stagePlatforms.find((platform) => platform.id === "main") || stagePlatforms[0];

  return {
    id,
    name,
    centerX,
    centerY,
    width,
    height,
    camera,
    visuals,
    time: 0,
    collisionPadding: 8,
    recoveryTriggerY: centerY + 380,
    blastZone: {
      left: centerX - width * 0.98,
      right: centerX + width * 0.98,
      top: centerY - height * 1.15,
      bottom: centerY + height * 1.2,
    },
    platforms: stagePlatforms,
    ledges: [
      { platformId: main.id, side: "left", x: main.x, y: main.y },
      { platformId: main.id, side: "right", x: main.x + main.width, y: main.y },
    ],
    teleportGates: teleportGates || [],
    spawnPoints,
    weaponSpawns,
  };
}

function stageVisuals(config) {
  return {
    skyTop: config.skyTop,
    skyMid: config.skyMid,
    skyBottom: config.skyBottom,
    sun: config.sun,
    hazeNear: config.hazeNear,
    hazeFar: config.hazeFar,
    fog: config.fog,
    starColor: config.starColor,
    platformMain: config.platformMain,
    platformAlt: config.platformAlt,
    platformEdgeMain: config.platformEdgeMain,
    platformEdgeAlt: config.platformEdgeAlt,
  };
}

function createAsgardArena() {
  return createStageBase({
    id: "asgard-arena",
    name: "Asgard Arena",
    centerX: 700,
    centerY: 400,
    width: 1500,
    height: 860,
    camera: {
      minZoom: 0.56,
      maxZoom: 1.04,
      baseSpreadX: 880,
      baseSpreadY: 540,
      paddingX: 500,
      paddingY: 340,
      closeZoomBoost: 0.26,
      closeRange: 170,
      farRange: 980,
    },
    visuals: stageVisuals({
      skyTop: "#5aa7e8",
      skyMid: "#8fc8ff",
      skyBottom: "#dbefff",
      sun: "rgba(255, 234, 180, 0.72)",
      hazeNear: "rgba(95, 144, 196, 0.42)",
      hazeFar: "rgba(36, 80, 132, 0.5)",
      fog: "rgba(225, 239, 255, 0.14)",
      starColor: "rgba(255,255,255,0.45)",
      platformMain: ["#81cc72", "#3f7758", "#25333f"],
      platformAlt: ["#d7d18e", "#847457", "#3c3a35"],
      platformEdgeMain: "#caec8b",
      platformEdgeAlt: "#f0ddb0",
    }),
    platforms: [
      { id: "main", x: 120, y: 560, width: 1160, height: 50, type: "solid" },
      { id: "left-lower", x: 180, y: 450, width: 220, height: 18, type: "pass" },
      { id: "mid-left", x: 430, y: 365, width: 210, height: 18, type: "pass" },
      { id: "center-peak", x: 665, y: 300, width: 90, height: 18, type: "pass" },
      { id: "mid-right", x: 770, y: 365, width: 210, height: 18, type: "pass" },
      { id: "right-lower", x: 1010, y: 450, width: 220, height: 18, type: "pass" },
    ],
    teleportGates: [
      { id: "leftGate", x: 105, y: 500, radius: 30, targetId: "rightGate", color: "#65d8ff" },
      { id: "rightGate", x: 1295, y: 500, radius: 30, targetId: "leftGate", color: "#65d8ff" },
    ],
    spawnPoints: [
      { x: 430, y: 285 },
      { x: 900, y: 285 },
    ],
    weaponSpawns: [
      { x: 290, y: 320 },
      { x: 700, y: 240 },
      { x: 1110, y: 320 },
    ],
  });
}

function createNebulaRift() {
  return createStageBase({
    id: "nebula-rift",
    name: "Nebula Rift",
    centerX: 700,
    centerY: 410,
    width: 1600,
    height: 920,
    camera: {
      minZoom: 0.5,
      maxZoom: 1.0,
      baseSpreadX: 980,
      baseSpreadY: 610,
      paddingX: 560,
      paddingY: 390,
      closeZoomBoost: 0.22,
      closeRange: 180,
      farRange: 1080,
    },
    visuals: stageVisuals({
      skyTop: "#2d255f",
      skyMid: "#4b318f",
      skyBottom: "#130f33",
      sun: "rgba(200, 133, 255, 0.58)",
      hazeNear: "rgba(138, 94, 237, 0.35)",
      hazeFar: "rgba(34, 20, 76, 0.62)",
      fog: "rgba(145, 120, 255, 0.1)",
      starColor: "rgba(212, 186, 255, 0.84)",
      platformMain: ["#c589ff", "#5f3d8d", "#2a1f45"],
      platformAlt: ["#7de8ff", "#35738c", "#1d2b3b"],
      platformEdgeMain: "#ffd2a7",
      platformEdgeAlt: "#b6f5ff",
    }),
    platforms: [
      { id: "main", x: 90, y: 590, width: 1220, height: 52, type: "solid" },
      { id: "left-wing", x: 140, y: 460, width: 190, height: 18, type: "pass", motion: { axis: "y", amplitude: 28, speed: 1.2, phase: 0.3 } },
      { id: "left-mid", x: 360, y: 370, width: 180, height: 16, type: "pass" },
      { id: "center", x: 610, y: 305, width: 180, height: 18, type: "pass", motion: { axis: "x", amplitude: 90, speed: 0.75, phase: 1.5 } },
      { id: "right-mid", x: 890, y: 370, width: 180, height: 16, type: "pass" },
      { id: "right-wing", x: 1090, y: 460, width: 190, height: 18, type: "pass", motion: { axis: "y", amplitude: 28, speed: 1.2, phase: 3.8 } },
      { id: "upper-left", x: 520, y: 245, width: 120, height: 14, type: "pass" },
      { id: "upper-right", x: 770, y: 245, width: 120, height: 14, type: "pass" },
    ],
    teleportGates: [
      { id: "riftTop", x: 700, y: 215, radius: 26, targetId: "riftBottom", color: "#d29dff" },
      { id: "riftBottom", x: 700, y: 620, radius: 26, targetId: "riftTop", color: "#d29dff" },
    ],
    spawnPoints: [
      { x: 370, y: 310 },
      { x: 930, y: 310 },
    ],
    weaponSpawns: [
      { x: 240, y: 345 },
      { x: 700, y: 230 },
      { x: 1160, y: 345 },
    ],
  });
}

function createSunforgeCliffs() {
  return createStageBase({
    id: "sunforge-cliffs",
    name: "Sunforge Cliffs",
    centerX: 700,
    centerY: 430,
    width: 1680,
    height: 980,
    camera: {
      minZoom: 0.48,
      maxZoom: 0.98,
      baseSpreadX: 1040,
      baseSpreadY: 640,
      paddingX: 570,
      paddingY: 420,
      closeZoomBoost: 0.2,
      closeRange: 180,
      farRange: 1120,
    },
    visuals: stageVisuals({
      skyTop: "#ffb56a",
      skyMid: "#ff8d66",
      skyBottom: "#5b2d4f",
      sun: "rgba(255, 246, 187, 0.76)",
      hazeNear: "rgba(255, 134, 102, 0.32)",
      hazeFar: "rgba(78, 36, 82, 0.58)",
      fog: "rgba(255, 202, 134, 0.13)",
      starColor: "rgba(255, 230, 201, 0.55)",
      platformMain: ["#f8c16b", "#b3683c", "#4c2f2b"],
      platformAlt: ["#f6e2a2", "#986f4c", "#4b3c34"],
      platformEdgeMain: "#fff2b3",
      platformEdgeAlt: "#ffeec8",
    }),
    platforms: [
      { id: "main", x: 60, y: 610, width: 1280, height: 52, type: "solid" },
      { id: "left-low", x: 120, y: 500, width: 170, height: 16, type: "pass" },
      { id: "left-mid", x: 320, y: 420, width: 190, height: 16, type: "pass", motion: { axis: "x", amplitude: 76, speed: 0.7, phase: 0.5 } },
      { id: "center-left", x: 530, y: 348, width: 160, height: 16, type: "pass" },
      { id: "center-right", x: 710, y: 348, width: 160, height: 16, type: "pass" },
      { id: "right-mid", x: 890, y: 420, width: 190, height: 16, type: "pass", motion: { axis: "x", amplitude: 76, speed: 0.7, phase: 3.2 } },
      { id: "right-low", x: 1110, y: 500, width: 170, height: 16, type: "pass" },
      { id: "spire", x: 665, y: 275, width: 70, height: 14, type: "pass", motion: { axis: "y", amplitude: 38, speed: 1.1, phase: 2.6 } },
    ],
    teleportGates: [
      { id: "cliffLeft", x: 88, y: 548, radius: 28, targetId: "cliffRight", color: "#ffcb74" },
      { id: "cliffRight", x: 1310, y: 548, radius: 28, targetId: "cliffLeft", color: "#ffcb74" },
    ],
    spawnPoints: [
      { x: 355, y: 315 },
      { x: 980, y: 315 },
    ],
    weaponSpawns: [
      { x: 190, y: 360 },
      { x: 700, y: 250 },
      { x: 1210, y: 360 },
    ],
  });
}

export function createBrawlStage() {
  return createAsgardArena();
}

export function createStageRotation() {
  return [createAsgardArena(), createNebulaRift(), createSunforgeCliffs()];
}

export function updateStageDynamics(stage, dt) {
  stage.time += dt;

  for (const platform of stage.platforms) {
    if (!platform.motion) {
      platform.deltaX = 0;
      platform.deltaY = 0;
      continue;
    }

    const t = stage.time * platform.motion.speed + platform.motion.phase;
    const nextX = platform.motion.axis === "x"
      ? platform.baseX + Math.sin(t) * platform.motion.amplitude
      : platform.baseX;
    const nextY = platform.motion.axis === "y"
      ? platform.baseY + Math.sin(t) * platform.motion.amplitude
      : platform.baseY;

    platform.deltaX = nextX - platform.x;
    platform.deltaY = nextY - platform.y;
    platform.x = nextX;
    platform.y = nextY;
  }

  const main = stage.platforms.find((platform) => platform.id === "main") || stage.platforms[0];
  if (stage.ledges && main) {
    stage.ledges[0].x = main.x;
    stage.ledges[0].y = main.y;
    stage.ledges[1].x = main.x + main.width;
    stage.ledges[1].y = main.y;
  }
}

export function applyStageTeleports(stage, players, particles) {
  if (!stage.teleportGates || stage.teleportGates.length === 0) {
    return;
  }

  const gateById = new Map(stage.teleportGates.map((gate) => [gate.id, gate]));

  for (const player of players) {
    if (player.outOfStocks || player.respawnTimer > 0 || player.teleportCooldown > 0) {
      continue;
    }

    for (const gate of stage.teleportGates) {
      const dx = player.centerX - gate.x;
      const dy = player.centerY - gate.y;
      const dist = Math.hypot(dx, dy);
      if (dist > gate.radius + 12) {
        continue;
      }

      const target = gateById.get(gate.targetId);
      if (!target) {
        continue;
      }

      player.x = target.x - player.width * 0.5;
      player.y = target.y - player.height * 0.62;
      player.prevX = player.x;
      player.prevY = player.y;
      player.vx *= 0.9;
      player.vy = Math.min(player.vy, 0);
      player.onGround = false;
      player.teleportCooldown = 0.85;
      if (particles) {
        particles.spawnHitSpark(gate.x, gate.y, gate.color);
        particles.spawnHitSpark(target.x, target.y, target.color);
      }
      break;
    }
  }
}
