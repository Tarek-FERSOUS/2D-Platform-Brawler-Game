import { aabbIntersects, createAABB } from "./collision.js";

export const WEAPON_DEFS = {
  unarmed: {
    name: "Unarmed",
    color: "#f9f9f9",
    damageMultiplier: 1,
    knockbackMultiplier: 1,
    attackOverrides: {},
  },
  sword: {
    name: "Sword",
    color: "#9de8ff",
    damageMultiplier: 1.08,
    knockbackMultiplier: 1.05,
    attackOverrides: {
      sideLight: {
        damage: 12,
        knockbackScaling: 8.2,
        hitbox: { offsetX: 46, offsetY: 18, width: 64, height: 24 },
      },
      neutralAir: {
        startup: 0.05,
        damage: 11,
        angle: 84,
      },
    },
  },
  hammer: {
    name: "Hammer",
    color: "#ffc680",
    damageMultiplier: 1.2,
    knockbackMultiplier: 1.16,
    attackOverrides: {
      heavy: {
        startup: 0.18,
        active: 0.14,
        damage: 21,
        baseKnockback: 450,
        knockbackScaling: 11.8,
      },
      downAir: {
        damage: 17,
        angle: 290,
      },
    },
  },
  blasters: {
    name: "Blasters",
    color: "#b9b4ff",
    damageMultiplier: 0.95,
    knockbackMultiplier: 0.92,
    attackOverrides: {
      neutralLight: {
        startup: 0.04,
        active: 0.1,
        damage: 8,
        knockbackScaling: 5.6,
        hitbox: { offsetX: 38, offsetY: 10, width: 74, height: 18 },
      },
      sideAir: {
        startup: 0.06,
        damage: 10,
        hitbox: { offsetX: 42, offsetY: 8, width: 76, height: 22 },
      },
    },
  },
};

export class WeaponPickup {
  constructor(id, x, y, type) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.width = 30;
    this.height = 30;
    this.type = type;
    this.life = 16;
    this.bobTimer = Math.random() * Math.PI * 2;
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
    this.spawnTimer = 4;
    this.spawnCooldown = 9;
    this.nextPickupId = 1;
    this.maxPickups = 2;
    this.weaponPool = ["sword", "hammer", "blasters"];
  }

  update(dt, players) {
    this.spawnTimer -= dt;

    if (this.spawnTimer <= 0 && this.pickups.length < this.maxPickups) {
      this.spawnPickup();
      this.spawnTimer = this.spawnCooldown;
    }

    for (const pickup of this.pickups) {
      pickup.life -= dt;
      pickup.bobTimer += dt * 3.4;
      pickup.y = pickup.baseY + Math.sin(pickup.bobTimer) * 6;
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
    if (!WEAPON_DEFS[weaponType]) {
      return;
    }
    player.weaponType = weaponType;
    player.weaponTime = 0;
  }

  resetPlayerWeapon(player) {
    player.weaponType = "unarmed";
    player.weaponTime = 0;
  }
}