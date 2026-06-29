(function () {
  const particles = [];
  const DEFAULT_BACKGROUND_COLOR = '#000000';

  const CONFIG =
    window.innerWidth <= 768
      ? {
          particlesPerBurst: 20,
          minSpeed: 80,
          maxSpeed: 250,
          minLife: 0.8,
          maxLife: 1.8,
          minSize: 1,
          maxSize: 3,
          maxChargeTime: 1.4,
          tapThreshold: 0.15,
          minBursts: 1,
          maxBursts: 12,
          chargeBurstInterval: 0.3,
          autoReleaseDelay: 0.5,
          minStragglers: 1,
          maxStragglers: 3,
        }
      : {
          particlesPerBurst: 28,
          minSpeed: 110,
          maxSpeed: 320,
          minLife: 0.9,
          maxLife: 2.0,
          minSize: 1.5,
          maxSize: 4,
          maxChargeTime: 1.6,
          tapThreshold: 0.15,
          minBursts: 1,
          maxBursts: 25,
          chargeBurstInterval: 0.3,
          autoReleaseDelay: 0.5,
          minStragglers: 2,
          maxStragglers: 5,
        };

  let chargeTime = 0;
  let charging = false;
  let chargeTickTimer = CONFIG.chargeBurstInterval;
  let autoReleaseTimer = 0;
  let hasAutoReleased = false;
  const stragglers = [];

  function randRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function randomHue() {
    return Math.floor(Math.random() * 360);
  }

  function randomScreenPos(margin) {
    return {
      x: randRange(margin, window.innerWidth - margin),
      y: randRange(margin, window.innerHeight - margin),
    };
  }

  function activate(emit) {
    chargeTime = 0;
    charging = false;
    chargeTickTimer = CONFIG.chargeBurstInterval;
    autoReleaseTimer = 0;
    hasAutoReleased = false;
    stragglers.length = 0;
    if (emit) emit('background-change', { color: DEFAULT_BACKGROUND_COLOR });
  }

  function deactivate() {
    particles.length = 0;
    chargeTime = 0;
    charging = false;
    chargeTickTimer = CONFIG.chargeBurstInterval;
    autoReleaseTimer = 0;
    hasAutoReleased = false;
    stragglers.length = 0;
  }

  function createBurst(x, y) {
    const hue = randomHue();
    for (let i = 0; i < CONFIG.particlesPerBurst; i++) {
      const angle = (Math.PI * 2 * i) / CONFIG.particlesPerBurst;
      const speed = randRange(CONFIG.minSpeed, CONFIG.maxSpeed);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: randRange(CONFIG.minSize, CONFIG.maxSize),
        hue,
        age: 0,
        life: randRange(CONFIG.minLife, CONFIG.maxLife),
      });
    }
  }

  function spawn() {
    // No-op: handled by tap/charge logic in update().
  }

  function triggerCascade(emit) {
    const ratio = chargeTime / CONFIG.maxChargeTime;
    const burstCount = Math.round(CONFIG.minBursts + (CONFIG.maxBursts - CONFIG.minBursts) * ratio);
    const margin = 60;

    for (let i = 0; i < burstCount; i++) {
      const { x, y } = randomScreenPos(margin);
      createBurst(x, y);
    }

    if (emit) emit('sound', { id: 'firework-cascade', intensity: ratio });
  }

  function scheduleStragglers() {
    const margin = 60;
    const count = Math.round(randRange(CONFIG.minStragglers, CONFIG.maxStragglers + 1));
    for (let i = 0; i < count; i++) {
      const { x, y } = randomScreenPos(margin);
      stragglers.push({ x, y, timer: randRange(0.15, 0.7) });
    }
  }

  function update(dt, pointer, emit) {
    if (pointer.active && !hasAutoReleased) {
      charging = true;
      chargeTime = Math.min(chargeTime + dt, CONFIG.maxChargeTime);

      // Small random fireworks while charging.
      chargeTickTimer -= dt;
      if (chargeTickTimer <= 0) {
        const { x, y } = randomScreenPos(60);
        createBurst(x, y);
        if (emit) emit('sound', { id: 'fireworks-pop', x, y, intensity: 0.6 });
        chargeTickTimer += CONFIG.chargeBurstInterval;
      }

      // Auto-release if fully charged and held a bit longer.
      if (chargeTime >= CONFIG.maxChargeTime) {
        autoReleaseTimer += dt;
        if (autoReleaseTimer >= CONFIG.autoReleaseDelay) {
          triggerCascade(emit);
          scheduleStragglers();
          hasAutoReleased = true;
          charging = false;
          chargeTime = 0;
          autoReleaseTimer = 0;
        }
      }
    } else if (!pointer.active) {
      if (charging) {
        if (chargeTime < CONFIG.tapThreshold) {
          // Quick tap: a single firework right where the user clicked.
          createBurst(pointer.x, pointer.y);
          if (emit)
            emit('sound', { id: 'fireworks-pop', x: pointer.x, y: pointer.y, intensity: 1 });
        } else {
          triggerCascade(emit);
          scheduleStragglers();
        }
      }
      charging = false;
      chargeTime = 0;
      chargeTickTimer = CONFIG.chargeBurstInterval;
      autoReleaseTimer = 0;
      hasAutoReleased = false;
    }
    // else: pointer still down after auto-release — wait for lift-off to reset.

    // Fire off any pending stragglers.
    for (let i = stragglers.length - 1; i >= 0; i--) {
      const s = stragglers[i];
      s.timer -= dt;
      if (s.timer <= 0) {
        createBurst(s.x, s.y);
        if (emit) emit('sound', { id: 'fireworks-pop', x: s.x, y: s.y, intensity: 0.6 });
        stragglers.splice(i, 1);
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age += dt;
      if (p.age >= p.life) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      // gravity
      p.vy += 120 * dt;
      p.vx *= 0.99;
      p.vy *= 0.99;
    }
  }

  function draw(ctx, pointer) {
    for (const p of particles) {
      const lifeRatio = 1 - p.age / p.life;
      ctx.save();
      ctx.globalAlpha = lifeRatio;
      ctx.strokeStyle = `hsl(${p.hue}, 100%, 70%)`;
      ctx.lineWidth = p.size;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
      ctx.stroke();
      ctx.restore();
    }
    if (charging && pointer.active && chargeTime >= CONFIG.tapThreshold) {
      const ratio = chargeTime / CONFIG.maxChargeTime;
      ctx.save();
      ctx.globalAlpha = 0.5 + ratio * 0.5;
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, 10 + ratio * 40, 0, Math.PI * 2);
      ctx.strokeStyle = `hsl(${(performance.now() / 5) % 360}, 100%, 60%)`;
      ctx.lineWidth = 3 + ratio * 5;
      ctx.stroke();
      ctx.restore();
    }
  }

  EffectManager.register('fireworks', {
    activate,
    deactivate,
    spawn,
    update,
    draw,
  });
})();
