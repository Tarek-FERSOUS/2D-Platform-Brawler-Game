function loadImage(src) {
  const image = new Image();
  image.src = src;
  return image;
}

function getSheetFrameCount(image) {
  if (!image || !image.naturalWidth || !image.naturalHeight) {
    return 1;
  }

  return Math.max(1, Math.floor(image.naturalWidth / image.naturalHeight));
}

function getFrameOpaqueBounds(image, frameIndex, cache) {
  let imageCache = cache.get(image);
  if (!imageCache) {
    imageCache = new Map();
    cache.set(image, imageCache);
  }

  if (imageCache.has(frameIndex)) {
    return imageCache.get(frameIndex);
  }

  const frameSize = image.naturalHeight;
  const sx = frameIndex * frameSize;

  const canvas = document.createElement("canvas");
  canvas.width = frameSize;
  canvas.height = frameSize;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.clearRect(0, 0, frameSize, frameSize);
  ctx.drawImage(image, sx, 0, frameSize, frameSize, 0, 0, frameSize, frameSize);

  const data = ctx.getImageData(0, 0, frameSize, frameSize).data;
  let minX = frameSize;
  let minY = frameSize;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < frameSize; y += 1) {
    for (let x = 0; x < frameSize; x += 1) {
      const alpha = data[(y * frameSize + x) * 4 + 3];
      if (alpha <= 6) {
        continue;
      }

      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  const fallback = {
    x: 0,
    y: 0,
    width: frameSize,
    height: frameSize,
    bottom: frameSize,
  };

  const result = maxX < minX || maxY < minY
    ? fallback
    : {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      bottom: maxY + 1,
    };

  imageCache.set(frameIndex, result);
  return result;
}

export function createAssetCatalog() {
  const boundsCache = new WeakMap();

  const images = {
    soldierIdle: loadImage("./characters/Soldier with shadows/Soldier-Idle.png"),
    soldierWalk: loadImage("./characters/Soldier with shadows/Soldier-Walk.png"),
    soldierAttack01: loadImage("./characters/Soldier with shadows/Soldier-Attack01.png"),
    soldierAttack02: loadImage("./characters/Soldier with shadows/Soldier-Attack02.png"),
    soldierAttack03: loadImage("./characters/Soldier with shadows/Soldier-Attack03.png"),
    soldierHurt: loadImage("./characters/Soldier with shadows/Soldier-Hurt.png"),
    soldierDeath: loadImage("./characters/Soldier with shadows/Soldier-Death.png"),
    orcIdle: loadImage("./characters/Orc with shadows/Orc-Idle.png"),
    orcWalk: loadImage("./characters/Orc with shadows/Orc-Walk.png"),
    orcAttack01: loadImage("./characters/Orc with shadows/Orc-Attack01.png"),
    orcAttack02: loadImage("./characters/Orc with shadows/Orc-Attack02.png"),
    orcHurt: loadImage("./characters/Orc with shadows/Orc-Hurt.png"),
    orcDeath: loadImage("./characters/Orc with shadows/Orc-Death.png"),
    hudBarBase: loadImage("./ui/UI Elements/Bars/SmallBar_Base.png"),
    hudBarFill: loadImage("./ui/UI Elements/Bars/SmallBar_Fill.png"),
    hudBanner: loadImage("./ui/UI Banners from the store page/Banner/Banner.png"),
    hudRibbonBlue: loadImage("./ui/UI Banners from the store page/Ribbons/Ribbon_Blue.png"),
    hudRibbonRed: loadImage("./ui/UI Banners from the store page/Ribbons/Ribbon_Red.png"),
  };

  const characterProfiles = {
    soldier: {
      idle: ["soldierIdle"],
      run: ["soldierWalk"],
      jump: ["soldierIdle"],
      fall: ["soldierIdle"],
      dodge: ["soldierWalk"],
      hitstun: ["soldierHurt"],
      respawn: ["soldierIdle"],
      defeat: ["soldierDeath"],
      attackLight: ["soldierAttack01", "soldierAttack02"],
      attackHeavy: ["soldierAttack03"],
    },
    orc: {
      idle: ["orcIdle"],
      run: ["orcWalk"],
      jump: ["orcIdle"],
      fall: ["orcIdle"],
      dodge: ["orcWalk"],
      hitstun: ["orcHurt"],
      respawn: ["orcIdle"],
      defeat: ["orcDeath"],
      attackLight: ["orcAttack01"],
      attackHeavy: ["orcAttack02"],
    },
  };

  function getImage(key) {
    return images[key] || null;
  }

  function getCharacterFrame(player) {
    const profile = characterProfiles[player.spriteProfile];
    if (!profile) {
      return null;
    }

    const isHeavy = player.currentAttack && ["heavy", "groundPound", "recovery"].includes(player.currentAttack.id);
    const animationKey =
      player.outOfStocks ? "defeat" :
      player.animationState === "attack" && isHeavy ? "attackHeavy" :
      player.animationState === "attack" ? "attackLight" :
      player.animationState;

    const sheetKeys = profile[animationKey] || profile.idle;
    if (!sheetKeys || sheetKeys.length === 0) {
      return null;
    }

    const chosenSheetKey = sheetKeys[player.animationFrame % sheetKeys.length];
    const image = getImage(chosenSheetKey);
    if (!image || !image.complete || !image.naturalWidth || !image.naturalHeight) {
      return null;
    }

    const frameCount = getSheetFrameCount(image);
    const frameSize = image.naturalHeight;
    const frameIndex = player.animationFrame % frameCount;
    const frameBounds = getFrameOpaqueBounds(image, frameIndex, boundsCache);

    return {
      image,
      sx: frameIndex * frameSize,
      sy: 0,
      sw: frameSize,
      sh: frameSize,
      frameSize,
      bounds: frameBounds,
    };
  }

  return {
    getImage,
    getCharacterFrame,
  };
}
