export function createBrawlStage() {
  const platforms = [
    {
      id: "main",
      x: 290,
      y: 515,
      width: 700,
      height: 42,
      type: "solid",
    },
    {
      id: "left-upper",
      x: 390,
      y: 390,
      width: 170,
      height: 18,
      type: "pass",
    },
    {
      id: "center-upper",
      x: 560,
      y: 330,
      width: 160,
      height: 18,
      type: "pass",
    },
    {
      id: "right-upper",
      x: 740,
      y: 390,
      width: 170,
      height: 18,
      type: "pass",
    },
  ];

  const main = platforms[0];
  const ledges = [
    { platformId: main.id, side: "left", x: main.x, y: main.y },
    { platformId: main.id, side: "right", x: main.x + main.width, y: main.y },
  ];

  return {
    id: "asgard-arena",
    name: "Asgard Arena",
    centerX: 640,
    centerY: 360,
    width: 1280,
    height: 720,
    collisionPadding: 8,
    recoveryTriggerY: 640,
    blastZone: {
      left: -360,
      right: 1640,
      top: -520,
      bottom: 1180,
    },
    platforms,
    ledges,
    spawnPoints: [
      { x: 480, y: 240 },
      { x: 740, y: 240 },
    ],
    weaponSpawns: [
      { x: 470, y: 260 },
      { x: 640, y: 190 },
      { x: 820, y: 260 },
    ],
  };
}