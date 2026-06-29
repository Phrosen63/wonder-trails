(function () {
  const SKY_BLUE = '#87ceeb';
  const STORM_SKY = '#4b5563';
  const STORM_DARK = '#171a21';
  const CLOUD_WHITE = { r: 255, g: 255, b: 255 };
  const CLOUD_DARK = { r: 71, g: 75, b: 84 };

  const DEFAULT_BACKGROUND_COLOR = SKY_BLUE;

  const CONFIG =
    window.innerWidth <= 768
      ? {
          cloudsToGather: 5, // clicks needed before clouds gather & it rains
          cloudWidth: [70, 130],
          cloudHeight: [30, 55],
          altitudeRange: [0.3, 0.5], // fraction of screen height — kept clear of the effect-picker UI
          gatherAltitudeRange: [0.3, 0.42], // where clouds cluster once gathered
          driftAmplitude: [40, 110], // px of lazy back-and-forth sway
          driftFrequency: [0.08, 0.22], // how fast it sways
          depthRange: [0.5, 1], // smaller/fainter = "further away"
          gatherDuration: 1.8,
          rainDuration: 5,
          clearDuration: 2,
          rainDropsPerCloudPerSecond: 14,
          rainDropSpeed: [380, 620],
          rainDropLength: [10, 22],
          tapThreshold: 0.18,
          holdThresholdForStorm: 1.2,

          // --- click-and-hold storm ---
          stormChargeVisualDelay: 0.3,
          stormCloudCount: 7,
          stormSpawnDuration: 1, // clouds rapidly pop in over this window
          stormDuration: 7,
          stormClearDuration: 1.4,
          stormCloudWidth: [90, 160],
          stormCloudHeight: [38, 65],
          stormRainDropsPerCloudPerSecond: 26,
          stormAmbientRainPerSecond: 40, // extra rain spawned anywhere on screen
          stormRainDropSpeed: [500, 760],
          stormRainDropLength: [14, 28],
          lightningChancePerSecond: 0.42,
          lightningFlashDecay: 3.2, // how fast the screen flash fades (per second)
          boltLife: [0.2, 0.35],
        }
      : {
          cloudsToGather: 8, // higher threshold before clouds gather & it rains
          cloudWidth: [110, 200],
          cloudHeight: [45, 80],
          altitudeRange: [0.06, 0.26],
          gatherAltitudeRange: [0.08, 0.16],
          driftAmplitude: [60, 160],
          driftFrequency: [0.05, 0.18],
          depthRange: [0.45, 1],
          gatherDuration: 2.2,
          rainDuration: 7,
          clearDuration: 2.5,
          rainDropsPerCloudPerSecond: 22,
          rainDropSpeed: [420, 700],
          rainDropLength: [14, 30],
          tapThreshold: 0.15,
          holdThresholdForStorm: 1.2,

          // --- click-and-hold storm ---
          stormChargeVisualDelay: 0.3,
          stormCloudCount: 22,
          stormSpawnDuration: 1.4,
          stormDuration: 9,
          stormClearDuration: 1.8,
          stormCloudWidth: [140, 260],
          stormCloudHeight: [55, 100],
          stormRainDropsPerCloudPerSecond: 55,
          stormAmbientRainPerSecond: 110,
          stormRainDropSpeed: [600, 900],
          stormRainDropLength: [18, 36],
          lightningChancePerSecond: 0.45,
          lightningFlashDecay: 3.4,
          boltLife: [0.2, 0.35],
        };

  // idle -> forming -> gathering -> raining -> clearing -> idle
  // idle -> storm -> storm-clearing -> idle   (triggered by click-and-hold)
  let state = 'idle';
  let clouds = [];
  let raindrops = [];
  let lightningBolts = [];
  let flashIntensity = 0;
  let ambientRainTimer = 0;
  let stormCharge = 0;
  let elapsed = 0;
  let phaseTimer = 0;
  let pointerDownTime = null;
  let wasPointerActive = false;
  let visualStormCharge = 0;
  let inputLocked = false;
  let _emit = null;

  function randRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function pick([min, max]) {
    return randRange(min, max);
  }

  function clamp01(t) {
    return Math.min(1, Math.max(0, t));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function hexToRgb(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbToHex({ r, g, b }) {
    const c = (v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, '0');
    return `#${c(r)}${c(g)}${c(b)}`;
  }

  function lerpColor(a, b, t) {
    return { r: lerp(a.r, b.r, t), g: lerp(a.g, b.g, t), b: lerp(a.b, b.b, t) };
  }

  function makeCloud(options = {}) {
    const isStorm = !!options.storm;
    const widthRange = isStorm ? CONFIG.stormCloudWidth : CONFIG.cloudWidth;
    const heightRange = isStorm ? CONFIG.stormCloudHeight : CONFIG.cloudHeight;
    const depth = pick(CONFIG.depthRange);
    const width = pick(widthRange) * depth;
    const height = pick(heightRange) * depth;
    const altitudeFrac = pick(CONFIG.altitudeRange);
    const puffCount = Math.round(randRange(4, 7));
    const puffs = [];

    for (let i = 0; i < puffCount; i++) {
      puffs.push({
        ox: randRange(-0.5, 0.5),
        oy: randRange(-0.25, 0.2),
        r: randRange(0.35, 0.65),
      });
    }

    return {
      baseX: isStorm
        ? randRange(0, window.innerWidth)
        : randRange(width, Math.max(width, window.innerWidth - width)),
      baseY: altitudeFrac * window.innerHeight,
      x: 0,
      y: 0,
      width,
      height,
      depth,
      amplitude: pick(CONFIG.driftAmplitude) * depth * (isStorm ? 1.5 : 1),
      frequency: pick(CONFIG.driftFrequency) * (isStorm ? 1.8 : 1),
      phase: randRange(0, Math.PI * 2),
      bobAmplitude: randRange(4, 12),
      bobFrequency: randRange(0.15, 0.4),
      puffs,
      tone: isStorm ? 1 : 0,
      opacity: 0,
      targetOpacity: 1,
      gatherX: 0,
      gatherY: 0,
      gatherFrom: { x: 0, y: 0 },
      rainTimer: randRange(0, 0.3),
      appearAt: isStorm ? elapsed + randRange(0, CONFIG.stormSpawnDuration) : undefined,
    };
  }

  function addCloud() {
    const cloud = makeCloud();
    cloud.x = cloud.baseX;
    cloud.y = cloud.baseY;
    clouds.push(cloud);
    state = 'forming';

    if (clouds.length >= CONFIG.cloudsToGather) {
      beginGathering();
    }
  }

  function beginGathering() {
    inputLocked = true;
    state = 'gathering';
    phaseTimer = 0;
    const n = clouds.length;
    const spread = Math.min(window.innerWidth * 0.7, 120 * n);
    const startX = window.innerWidth / 2 - spread / 2;

    clouds.forEach((cloud, i) => {
      cloud.gatherFrom = { x: cloud.x, y: cloud.y };
      cloud.gatherX = startX + (spread * (i + 0.5)) / n + randRange(-15, 15);
      cloud.gatherY = window.innerHeight * pick(CONFIG.gatherAltitudeRange);
    });
  }

  function beginRaining() {
    state = 'raining';
    phaseTimer = 0;
    if (_emit) _emit('sound', { id: 'rain-loop-start' });
  }

  function beginClearing() {
    state = 'clearing';
    phaseTimer = 0;
    clouds.forEach((c) => (c.targetOpacity = 0));
    if (_emit) _emit('sound', { id: 'rain-loop-stop' });
  }

  function reset() {
    inputLocked = false;
    state = 'idle';
    clouds = [];
    raindrops = [];
    lightningBolts = [];
    flashIntensity = 0;
    ambientRainTimer = 0;
    stormCharge = 0;
    visualStormCharge = 0;
    phaseTimer = 0;
    pointerDownTime = null;
    wasPointerActive = false;
  }

  function triggerStorm(emit) {
    if (state === 'storm' || state === 'storm-clearing') return;
    clouds = [];
    raindrops = [];
    lightningBolts = [];
    flashIntensity = 0;
    ambientRainTimer = 0;
    state = 'storm';
    phaseTimer = 0;

    if (emit) emit('sound', { id: 'rain-loop-start' });

    for (let i = 0; i < CONFIG.stormCloudCount; i++) {
      const cloud = makeCloud({ storm: true });
      cloud.x = cloud.baseX;
      cloud.y = cloud.baseY;
      clouds.push(cloud);
    }

    if (emit) {
      emit('background-change', { color: STORM_DARK });
      emit('sound', { id: 'thunder-clap', intensity: 1 });
    }
  }

  function beginStormClearing() {
    state = 'storm-clearing';
    phaseTimer = 0;
    clouds.forEach((c) => (c.targetOpacity = 0));
    if (_emit) _emit('sound', { id: 'rain-loop-stop' });
  }

  function triggerLightning(emit) {
    flashIntensity = 1;
    const topX = randRange(window.innerWidth * 0.15, window.innerWidth * 0.85);
    const startY = window.innerHeight * randRange(0.04, 0.18);
    const endY = window.innerHeight * randRange(0.55, 0.85);
    const segments = Math.round(randRange(5, 9));
    const points = [{ x: topX, y: startY }];
    let x = topX;

    for (let i = 1; i <= segments; i++) {
      const y = startY + ((endY - startY) * i) / segments;
      x += randRange(-40, 40);
      points.push({ x, y });
    }

    lightningBolts.push({ points, age: 0, life: pick(CONFIG.boltLife) });

    if (emit) emit('sound', { id: 'thunder-clap', intensity: randRange(0.6, 1) });
  }

  function activate(emit) {
    reset();
    if (emit) emit('background-change', { color: DEFAULT_BACKGROUND_COLOR });
  }

  function deactivate(emit) {
    reset();
    if (emit) emit('background-change', null);
  }

  function spawn() {}

  function update(dt, pointer, emit) {
    _emit = emit;
    elapsed += dt;
    const activePointer = inputLocked ? { active: false, x: pointer.x, y: pointer.y } : pointer;

    if (activePointer.active && !wasPointerActive) {
      pointerDownTime = elapsed;
    }

    stormCharge = 0;
    if (activePointer.active && pointerDownTime !== null) {
      const heldFor = elapsed - pointerDownTime;

      if (heldFor >= CONFIG.holdThresholdForStorm) {
        triggerStorm(emit);
        pointerDownTime = null;
        stormCharge = 0;
        visualStormCharge = 0;
      } else {
        stormCharge = clamp01(heldFor / CONFIG.holdThresholdForStorm);
        const visualHeldFor = Math.max(0, heldFor - CONFIG.stormChargeVisualDelay);
        visualStormCharge = clamp01(
          visualHeldFor / (CONFIG.holdThresholdForStorm - CONFIG.stormChargeVisualDelay),
        );

        if (emit && state !== 'storm') {
          emit('background-change', {
            color: rgbToHex(
              lerpColor(hexToRgb(SKY_BLUE), hexToRgb(STORM_DARK), visualStormCharge * 0.35),
            ),
          });
        }
      }
    }

    if (!activePointer.active && wasPointerActive && pointerDownTime !== null) {
      const heldFor = elapsed - pointerDownTime;

      if (heldFor < CONFIG.holdThresholdForStorm) {
        if (state === 'idle' || state === 'forming') {
          addCloud();
        }
      }

      pointerDownTime = null;
      stormCharge = 0;
      visualStormCharge = 0;

      if (
        emit &&
        state !== 'gathering' &&
        state !== 'raining' &&
        state !== 'clearing' &&
        state !== 'storm' &&
        state !== 'storm-clearing'
      ) {
        emit('background-change', { color: SKY_BLUE });
      }
    }

    wasPointerActive = activePointer.active;
    const relevantClearDuration =
      state === 'storm-clearing' ? CONFIG.stormClearDuration : CONFIG.clearDuration;

    clouds.forEach((cloud) => {
      if (cloud.appearAt !== undefined && elapsed < cloud.appearAt) {
        return;
      }
      const fadeRate =
        cloud.targetOpacity > cloud.opacity
          ? dt * 3
          : state === 'storm-clearing'
            ? dt * 5.5
            : dt * 5.5;
      cloud.opacity += (cloud.targetOpacity - cloud.opacity) * Math.min(1, fadeRate);

      if (state === 'gathering') {
        const t = clamp01(phaseTimer / CONFIG.gatherDuration);
        const eased = t * t * (3 - 2 * t);
        cloud.x = lerp(cloud.gatherFrom.x, cloud.gatherX, eased);
        cloud.y = lerp(cloud.gatherFrom.y, cloud.gatherY, eased);
        cloud.tone = eased;
      } else if (state === 'raining' || state === 'clearing') {
        cloud.x = cloud.gatherX + Math.sin(elapsed * 0.3 + cloud.phase) * 6;
        cloud.y = cloud.gatherY;
        cloud.tone = state === 'clearing' ? Math.max(0, 1 - phaseTimer / CONFIG.clearDuration) : 1;
      } else {
        cloud.x = cloud.baseX + Math.sin(elapsed * cloud.frequency + cloud.phase) * cloud.amplitude;
        cloud.y =
          cloud.baseY + Math.sin(elapsed * cloud.bobFrequency + cloud.phase) * cloud.bobAmplitude;
      }
    });

    if (state === 'gathering') {
      phaseTimer += dt;
      if (phaseTimer >= CONFIG.gatherDuration) beginRaining();
    } else if (state === 'raining') {
      phaseTimer += dt;
      clouds.forEach((cloud) => {
        cloud.rainTimer -= dt;
        if (cloud.rainTimer <= 0) {
          cloud.rainTimer = 1 / CONFIG.rainDropsPerCloudPerSecond;
          raindrops.push({
            x: cloud.x + randRange(-cloud.width * 0.4, cloud.width * 0.4),
            y: cloud.y + cloud.height * 0.3,
            vy: pick(CONFIG.rainDropSpeed),
            length: pick(CONFIG.rainDropLength),
            opacity: randRange(0.4, 0.8),
          });
        }
      });

      if (phaseTimer >= CONFIG.rainDuration) beginClearing();
    } else if (state === 'clearing') {
      phaseTimer += dt;
      const allFaded = clouds.every((c) => c.opacity < 0.02);

      if (phaseTimer >= CONFIG.clearDuration && allFaded && raindrops.length === 0) {
        reset();
        if (emit) emit('background-change', { color: SKY_BLUE });
      }
    } else if (state === 'storm') {
      phaseTimer += dt;
      // ambient rain: pick a random visible cloud as the spawn source instead of the top of the screen
      ambientRainTimer -= dt;

      if (ambientRainTimer <= 0) {
        ambientRainTimer = 1 / CONFIG.stormAmbientRainPerSecond;
        const visibleClouds = clouds.filter(
          (c) => c.appearAt === undefined || elapsed >= c.appearAt,
        );

        if (visibleClouds.length > 0) {
          const src = visibleClouds[Math.floor(Math.random() * visibleClouds.length)];
          raindrops.push({
            x: src.x + randRange(-src.width * 0.5, src.width * 0.5),
            y: src.y + src.height * 0.3,
            vy: pick(CONFIG.stormRainDropSpeed),
            length: pick(CONFIG.stormRainDropLength),
            opacity: randRange(0.5, 0.85),
          });
        }
      }

      // heavy rain under each storm cloud
      clouds.forEach((cloud) => {
        if (cloud.appearAt !== undefined && elapsed < cloud.appearAt) return;
        cloud.rainTimer -= dt;
        if (cloud.rainTimer <= 0) {
          cloud.rainTimer = 1 / CONFIG.stormRainDropsPerCloudPerSecond;
          raindrops.push({
            x: cloud.x + randRange(-cloud.width * 0.4, cloud.width * 0.4),
            y: cloud.y + cloud.height * 0.3,
            vy: pick(CONFIG.stormRainDropSpeed),
            length: pick(CONFIG.stormRainDropLength),
            opacity: randRange(0.5, 0.9),
          });
        }
      });

      if (Math.random() < CONFIG.lightningChancePerSecond * dt) {
        triggerLightning(emit);
      }

      if (phaseTimer >= CONFIG.stormDuration) beginStormClearing();
    } else if (state === 'storm-clearing') {
      phaseTimer += dt;
      const allFaded = clouds.every((c) => c.opacity < 0.02);

      if (
        phaseTimer >= CONFIG.stormClearDuration &&
        allFaded &&
        raindrops.length === 0 &&
        lightningBolts.length === 0
      ) {
        reset();
        if (emit) {
          emit('background-change', {
            color: SKY_BLUE,
          });
        }
      }
    }

    if (emit) {
      if (state === 'gathering') {
        const t = clamp01(phaseTimer / CONFIG.gatherDuration);
        emit('background-change', {
          color: rgbToHex(lerpColor(hexToRgb(SKY_BLUE), hexToRgb(STORM_SKY), t)),
        });
      } else if (state === 'clearing') {
        const t = clamp01(phaseTimer / CONFIG.clearDuration);
        emit('background-change', {
          color: rgbToHex(lerpColor(hexToRgb(STORM_SKY), hexToRgb(SKY_BLUE), t)),
        });
      } else if (state === 'storm-clearing') {
        const t = clamp01(phaseTimer / CONFIG.stormClearDuration);
        emit('background-change', {
          color: rgbToHex(lerpColor(hexToRgb(STORM_DARK), hexToRgb(SKY_BLUE), t)),
        });
      }
    }

    for (let i = raindrops.length - 1; i >= 0; i--) {
      const d = raindrops[i];
      d.y += d.vy * dt;
      if (d.y - d.length > window.innerHeight) raindrops.splice(i, 1);
    }

    flashIntensity = Math.max(0, flashIntensity - CONFIG.lightningFlashDecay * dt);
    for (let i = lightningBolts.length - 1; i >= 0; i--) {
      const bolt = lightningBolts[i];
      bolt.age += dt;
      if (bolt.age >= bolt.life) lightningBolts.splice(i, 1);
    }
  }

  function drawCloud(ctx, cloud) {
    if (cloud.opacity <= 0.01) return;
    const color = rgbToHex(lerpColor(CLOUD_WHITE, CLOUD_DARK, cloud.tone));
    ctx.save();
    ctx.globalAlpha = cloud.opacity * (0.6 + cloud.depth * 0.4);
    ctx.fillStyle = color;
    cloud.puffs.forEach((puff) => {
      const px = cloud.x + puff.ox * cloud.width;
      const py = cloud.y + puff.oy * cloud.height;
      const pr = puff.r * cloud.height;
      ctx.beginPath();
      ctx.ellipse(px, py, pr * 1.4, pr, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawLightning(ctx) {
    if (flashIntensity > 0.01) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.55, flashIntensity * 0.6);
      ctx.fillStyle = '#dce8f7';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.restore();
    }
    for (const bolt of lightningBolts) {
      const fade = clamp01(1 - bolt.age / bolt.life);
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.strokeStyle = 'rgba(225, 240, 255, 0.95)';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(180, 210, 255, 0.9)';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      bolt.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.restore();
    }
  }

  function draw(ctx, pointer) {
    const x = pointer.x;
    const y = pointer.y;
    clouds.forEach((cloud) => drawCloud(ctx, cloud));
    ctx.save();
    ctx.strokeStyle = 'rgba(210, 230, 245, 0.7)';
    ctx.lineCap = 'round';
    for (const d of raindrops) {
      ctx.globalAlpha = d.opacity;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - 2, d.y - d.length);
      ctx.stroke();
    }
    ctx.restore();
    drawLightning(ctx);

    if (visualStormCharge > 0 && state !== 'storm' && state !== 'storm-clearing') {
      const radius = 18 + visualStormCharge * 35;
      ctx.save();
      ctx.globalAlpha = 0.35 + visualStormCharge * 0.4;
      ctx.strokeStyle = '#cfdfff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * visualStormCharge);
      ctx.stroke();
      ctx.restore();
    }
  }

  EffectManager.register('rain', {
    activate,
    deactivate,
    spawn,
    update,
    draw,
  });
})();
