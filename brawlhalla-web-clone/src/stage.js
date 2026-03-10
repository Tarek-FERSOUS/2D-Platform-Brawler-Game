function createStageBase({ id, name, centerX, centerY, width, height, platforms, spawnPoints, weaponSpawns, camera }) {
  const main = platforms.find((platform) => platform.id === "main") || platforms[0];
  const ledges = [
    { platformId: main.id, side: "left", x: main.x, y: main.y },
    { platformId: main.id, side: "right", x: main.x + main.width, y: main.y },
  ];

  return {
    id,
    name,
    centerX,
    centerY,
    width,
    height,
    camera,
    collisionPadding: 8,
    recoveryTriggerY: centerY + 380,
    blastZone: {
      left: centerX - width * 0.98,
      right: centerX + width * 0.98,
      top: centerY - height * 1.15,
      bottom: centerY + height * 1.2,
    },
    platforms,
    ledges,
    spawnPoints,
    weaponSpawns,
  };
}

function createAsgardArena() {
  const platforms = [
    { id: "main", x: 120, y: 560, width: 1160, height: 50, type: "solid" },
    { id: "left-lower", x: 180, y: 450, width: 220, height: 18, type: "pass" },
    { id: "mid-left", x: 430, y: 365, width: 210, height: 18, type: "pass" },
    { id: "center-peak", x: 665, y: 300, width: 90, height: 18, type: "pass" },
    { id: "mid-right", x: 770, y: 365, width: 210, height: 18, type: "pass" },
    { id: "right-lower", x: 1010, y: 450, width: 220, height: 18, type: "pass" },
  ];

  return createStageBase({
    id: "asgard-arena",
    name: "Asgard Arena",
    centerX: 700,
    centerY: 400,
    width: 1500,
    height: 860,
    camera: { minZoom: 0.56, maxZoom: 1.02, baseSpreadX: 940, baseSpreadY: 560, paddingX: 500, paddingY: 360 },
    platforms,
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

function createSkyRuins() {
  const platforms = [
    { id: "main", x: 80, y: 585, width: 1240, height: 48, type: "solid" },
    { id: "left-wing", x: 110, y: 430, width: 190, height: 16, type: "pass" },
    { id: "left-mid", x: 340, y: 355, width: 180, height: 16, type: "pass" },
    { id: "center", x: 600, y: 295, width: 200, height: 18, type: "pass" },
    { id: "right-mid", x: 880, y: 355, width: 180, height: 16, type: "pass" },
    { id: "right-wing", x: 1100, y: 430, width: 190, height: 16, type: "pass" },
    { id: "upper-left", x: 500, y: 245, width: 110, height: 14, type: "pass" },
    { id: "upper-right", x: 790, y: 245, width: 110, height: 14, type: "pass" },
  ];

  return createStageBase({
    id: "sky-ruins",
    name: "Sky Ruins",
    centerX: 700,
    centerY: 410,
    width: 1560,
    height: 920,
    camera: { minZoom: 0.52, maxZoom: 0.98, baseSpreadX: 1000, baseSpreadY: 600, paddingX: 520, paddingY: 380 },
    platforms,
    spawnPoints: [
      { x: 380, y: 300 },
      { x: 940, y: 300 },
    ],
    weaponSpawns: [
      { x: 210, y: 340 },
      { x: 700, y: 230 },
      { x: 1190, y: 340 },
    ],
  });
}

function createTitanHarbor() {
  const platforms = [
    { id: "main", x: 60, y: 600, width: 1280, height: 52, type: "solid" },
    { id: "left-low", x: 120, y: 500, width: 170, height: 16, type: "pass" },
    { id: "left-mid", x: 320, y: 420, width: 190, height: 16, type: "pass" },
    { id: "center-left", x: 530, y: 348, width: 160, height: 16, type: "pass" },
    { id: "center-right", x: 710, y: 348, width: 160, height: 16, type: "pass" },
    { id: "right-mid", x: 890, y: 420, width: 190, height: 16, type: "pass" },
    { id: "right-low", x: 1110, y: 500, width: 170, height: 16, type: "pass" },
    { id: "spire", x: 665, y: 275, width: 70, height: 14, type: "pass" },
  ];

  return createStageBase({
    id: "titan-harbor",
    name: "Titan Harbor",
    centerX: 700,
    centerY: 430,
    width: 1640,
    height: 960,
    camera: { minZoom: 0.5, maxZoom: 0.96, baseSpreadX: 1060, baseSpreadY: 620, paddingX: 560, paddingY: 400 },
    platforms,
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
  return [createAsgardArena(), createSkyRuins(), createTitanHarbor()];
}