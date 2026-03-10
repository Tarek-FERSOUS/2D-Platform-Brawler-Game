const PLAYER_BINDINGS = {
  1: {
    left: "KeyA",
    right: "KeyD",
    jump: "KeyW",
    down: "KeyS",
    light: "KeyJ",
    heavy: "KeyK",
    dodge: "KeyL",
  },
  2: {
    left: "ArrowLeft",
    right: "ArrowRight",
    jump: "ArrowUp",
    down: "ArrowDown",
    light: "Numpad1",
    heavy: "Numpad2",
    dodge: "Numpad3",
  },
};

export class InputManager {
  constructor() {
    this.keysDown = new Set();
    this.prevKeysDown = new Set();

    window.addEventListener("keydown", (event) => {
      this.keysDown.add(event.code);

      // Prevent page scroll for gameplay keys.
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
        event.preventDefault();
      }
    });

    window.addEventListener("keyup", (event) => {
      this.keysDown.delete(event.code);
    });

    window.addEventListener("blur", () => {
      this.keysDown.clear();
      this.prevKeysDown.clear();
    });
  }

  isDown(code) {
    return this.keysDown.has(code);
  }

  wasPressed(code) {
    return this.keysDown.has(code) && !this.prevKeysDown.has(code);
  }

  wasReleased(code) {
    return !this.keysDown.has(code) && this.prevKeysDown.has(code);
  }

  getPlayerIntent(playerNumber) {
    const binding = PLAYER_BINDINGS[playerNumber];
    if (!binding) {
      return this.getNeutralIntent();
    }

    const left = this.isDown(binding.left);
    const right = this.isDown(binding.right);

    return {
      moveX: (right ? 1 : 0) - (left ? 1 : 0),
      jumpPressed: this.wasPressed(binding.jump),
      jumpHeld: this.isDown(binding.jump),
      downHeld: this.isDown(binding.down),
      lightPressed: this.wasPressed(binding.light),
      heavyPressed: this.wasPressed(binding.heavy),
      dodgePressed: this.wasPressed(binding.dodge),
    };
  }

  getNeutralIntent() {
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

  commitFrame() {
    this.prevKeysDown = new Set(this.keysDown);
  }
}