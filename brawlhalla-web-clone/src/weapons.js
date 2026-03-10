import { aabbIntersects, createAABB } from "./collision.js";

export const WEAPON_DEFS = {
  unarmed: {
    name: "None",
    kind: "neutral",
    color: "#f9f9f9",
    duration: 0,
    damageMultiplier: 1,
    knockbackMultiplier: 1,
    speedMultiplier: 1,
    gravityMultiplier: 1,
    maxFallMultiplier: 1,
    damageTakenMultiplier: 1,
    throwCooldown: 0.55,
    grenadeCooldown: 1.05,
    attackOverrides: {},
  },
  shield: {
    name: "Aegis Shield",
    kind: "defense",
    color: "#7de3ff",
    duration: 10,
    damageMultiplier: 1,
    knockbackMultiplier: 0.96,
    speedMultiplier: 0.96,
    gravityMultiplier: 1,
    maxFallMultiplier: 1,
    damageTakenMultiplier: 0.68,
    throwCooldown: 0.55,
    grenadeCooldown: 1.05,
    attackOverrides: {},
  },
  float: {
    name: "Sky Float",
    kind: "mobility",
    color: "#dcb8ff",
    duration: 10,
    damageMultiplier: 1,
    knockbackMultiplier: 1,
    speedMultiplier: 1,
    gravityMultiplier: 0.62,
    maxFallMultiplier: 0.64,
    damageTakenMultiplier: 1,
    throwCooldown: 0.55,
    grenadeCooldown: 1.05,
    attackOverrides: {},
  },
  speed: {
    name: "Velocity Core",
    kind: "mobility",
    color: "#73ff96",
    duration: 9,
    damageMultiplier: 0.95,
    knockbackMultiplier: 0.95,
    speedMultiplier: 1.3,
    gravityMultiplier: 1,
    maxFallMultiplier: 1,
    damageTakenMultiplier: 1,
    throwCooldown: 0.48,
    grenadeCooldown: 1.05,
    attackOverrides: {},
  },
  heavy: {
    name: "Titan Force",
    kind: "offense",
    color: "#ffcb6b",
    duration: 9,
    damageMultiplier: 1.28,
    knockbackMultiplier: 1.24,
    speedMultiplier: 0.96,
    gravityMultiplier: 1,
    maxFallMultiplier: 1,
    damageTakenMultiplier: 1,
    throwCooldown: 0.55,
    grenadeCooldown: 1.05,
    attackOverrides: {},
  },
  throwables: {
    name: "Arc Throw",
    kind: "offense",
    color: "#76f8ff",
    duration: 10,
    damageMultiplier: 1,
    knockbackMultiplier: 1,
    speedMultiplier: 1,
    gravityMultiplier: 1,
    maxFallMultiplier: 1,
    damageTakenMultiplier: 1,
    throwCooldown: 0.38,
    grenadeCooldown: 1.05,
    attackOverrides: {},
  },
  explosives: {
    name: "Grenadier",
    kind: "offense",
    color: "#ff7f7f",
    duration: 9,
    damageMultiplier: 1.05,
    knockbackMultiplier: 1.08,
    speedMultiplier: 1,
    gravityMultiplier: 1,
    maxFallMultiplier: 1,
    damageTakenMultiplier: 1,
    throwCooldown: 0.55,
    grenadeCooldown: 0.85,
    attackOverrides: {},
  },
};

const ORB_POOL = ["shield", "float", "speed", "heavy", "throwables", "explosives"];

export class WeaponPickup {
  constructor(id, x, y, type) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.width = 34;
    this.height = 34;
    this.type = type;
    this.life = 14;
    this.bobTimer = Math.random() * Math.PI * 2;
    this.spin = Math.random() * Math.PI * 2;
  }

  getAABB() {
    return createAABB(this.x, this.y, this.width, this.height);
  }
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class WeaponSystem {
  constructor(stage) {
    this.stage = stage;
    this.pickups = [];
    this.spawnTimer = 3;
    this.spawnCooldown = 6.8;
    this.nextPickupId = 1;
    this.maxPickups = 3;
    this.weaponPool = ORB_POOL;
  }

  update(dt, players) {
    this.spawnTimer -= dt;

    if (this.spawnTimer <= 0 && this.pickups.length < this.maxPickups) {
      this.spawnPickup();
      this.spawnTimer = this.spawnCooldown;
    }

    for (const pickup of this.pickups) {
      pickup.life -= dt;
      pickup.bobTimer += dt * 3.1;
      pickup.spin += dt * 2.2;
      pickup.y = pickup.baseY + Math.sin(pickup.bobTimer) * 7;
    }

    this.pickups = this.pickups.filter((pickup) => pickup.life > 0);

    for (const player of players) {
      if (player.outOfStocks || player.respawnTimer > 0) {
        continue;
      }

      const hurtbox = player.getHurtbox();
      for (let i = this.pickups.length - 1; i >= 0; i -= 1) {
        const pickup = this.pickups[i];
        if (!aabbIntersects(hurtbox, pickup.getAABB())) {
          continue;
        }

        this.applyWeapon(player, pickup.type);
        this.pickups.splice(i, 1);
        break;
      }
    }
  }

  spawnPickup() {
    const spawn = pickRandom(this.stage.weaponSpawns);
    const type = pickRandom(this.weaponPool);
    const pickup = new WeaponPickup(this.nextPickupId++, spawn.x, spawn.y, type);
    this.pickups.push(pickup);
  }

  applyWeapon(player, weaponType) {
    const def = WEAPON_DEFS[weaponType];
    if (!def || weaponType === "unarmed") {
      return;
    }

    player.weaponType = weaponType;
    player.weaponTime = 0;
    player.abilityTimer = def.duration;
  }

  resetPlayerWeapon(player) {
    player.weaponType = "unarmed";
    player.weaponTime = 0;
    player.abilityTimer = 0;
    player.throwableCooldown = 0;
    player.grenadeCooldown = 0;
    player.teleportCooldown = 0;
  }
}
