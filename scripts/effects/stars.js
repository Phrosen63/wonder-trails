(function () {
  const particles = [];
  const DEFAULT_BACKGROUND_COLOR = '#000000';

  const CONFIG = {
    minSize: 8,
    maxSize: 18,
    minLife: 0.6,
    maxLife: 1.4,
    minSpeed: 80,
    maxSpeed: 180,
    spawnPerFrame: 2,
    colors: ['#FFD700', '#FFEC8B', '#FFF8DC', '#FFA500'],
    superStarThreshold: 1000, // how many spawns between super stars
    superStarDuration: 1.2, // seconds to zoom in before exploding
    superStarStartSize: 6, // initial radius
    superStarPeakSize: 160, // radius at explosion
    superStarShrapnel: 42, // star particles spawned on explosion
    superStarShrapnelSpeed: [160, 380],
    superStarColor: '#FFD700',
  };

  let soundCooldown = 0;
  let spawnCount = 0;
  let superStar = null; // null = not active

  function activate(emit) {
    if (emit) emit('background-change', { color: DEFAULT_BACKGROUND_COLOR });
  }

  function deactivate() {
    particles.length = 0;
    superStar = null;
    spawnCount = 0;
  }

  function randRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function spawnParticle(x, y, speedOverride, colorOverride) {
    const angle = Math.random() * Math.PI * 2;
    const speed = speedOverride ?? randRange(CONFIG.minSpeed, CONFIG.maxSpeed);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: randRange(CONFIG.minSize, CONFIG.maxSize),
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: randRange(-2, 2),
      color: colorOverride ?? CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)],
      life: randRange(CONFIG.minLife, CONFIG.maxLife),
      age: 0,
    });
  }

  function triggerSuperStar() {
    superStar = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      age: 0,
      exploded: false,
    };
  }

  function explodeSuperStar(emit) {
    const { x, y } = superStar;
    for (let i = 0; i < CONFIG.superStarShrapnel; i++) {
      spawnParticle(
        x,
        y,
        randRange(...CONFIG.superStarShrapnelSpeed),
        CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)],
      );
    }
    if (emit) emit('sound', { id: 'star-sparkle', intensity: 1 });
    superStar = null;
  }

  function spawn(x, y, emit) {
    for (let i = 0; i < CONFIG.spawnPerFrame; i++) {
      spawnParticle(x, y);
      spawnCount++;
      if (spawnCount >= CONFIG.superStarThreshold) {
        spawnCount = 0;
        triggerSuperStar();
      }
    }
    if (emit && soundCooldown <= 0) {
      emit('sound', { id: 'star-sparkle', x, y });
      soundCooldown = 0.08;
    }
  }

  function update(dt, pointer, emit) {
    soundCooldown -= dt;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age += dt;

      if (p.age >= p.life) {
        particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.rotationSpeed * dt;
      p.vx *= 0.995;
      p.vy *= 0.995;
    }

    if (superStar) {
      superStar.age += dt;
      const t = superStar.age / CONFIG.superStarDuration;
      if (t >= 1 && !superStar.exploded) {
        superStar.exploded = true;
        explodeSuperStar(emit);
      }
    }
  }

  function drawStarShape(ctx, outerRadius) {
    const innerRadius = outerRadius * 0.5;
    const spikes = 5;
    const step = Math.PI / spikes;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = i * step - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function drawSuperStar(ctx) {
    if (!superStar) return;
    const t = Math.min(1, superStar.age / CONFIG.superStarDuration);
    // Ease in: slow start, accelerates toward viewer
    const eased = t * t * t;
    const size = randRange(
      CONFIG.superStarStartSize +
        (CONFIG.superStarPeakSize - CONFIG.superStarStartSize) * eased * 0.97,
      CONFIG.superStarStartSize + (CONFIG.superStarPeakSize - CONFIG.superStarStartSize) * eased,
    );
    // Subtle shimmer: flicker alpha slightly as it rushes in
    const alpha = 0.7 + eased * 0.3;
    // Glow ring behind the star
    ctx.save();
    ctx.translate(superStar.x, superStar.y);
    ctx.globalAlpha = eased * 0.35;
    const glow = ctx.createRadialGradient(0, 0, size * 0.3, 0, 0, size * 2.2);
    glow.addColorStop(0, '#FFFFFF');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, size * 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // The star itself, slowly rotating as it zooms in
    ctx.save();
    ctx.translate(superStar.x, superStar.y);
    ctx.rotate(t * Math.PI * 0.5);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = CONFIG.superStarColor;
    ctx.shadowColor = '#FFFDE0';
    ctx.shadowBlur = 24 * eased;
    drawStarShape(ctx, size);
    ctx.fill();
    ctx.restore();
  }

  function draw(ctx) {
    for (const p of particles) {
      const lifeRatio = 1 - p.age / p.life;
      const size = p.size * lifeRatio;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = lifeRatio;
      ctx.fillStyle = p.color;

      drawStarShape(ctx, size);

      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    drawSuperStar(ctx);
  }

  EffectManager.register('stars', {
    activate,
    deactivate,
    spawn,
    update,
    draw,
  });
})();
