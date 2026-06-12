(function () {
  const particles = [];

  const CONFIG = {
    minSize: 8,
    maxSize: 18,
    minLife: 0.6,
    maxLife: 1.4,
    minSpeed: 80,
    maxSpeed: 180,
    spawnPerFrame: 2,
    colors: ['#FFD700', '#FFEC8B', '#FFF8DC', '#FFA500'],
  };

  function activate() {}

  function deactivate() {
    particles.length = 0;
  }

  function randRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function spawnParticle(x, y) {
    const angle = Math.random() * Math.PI * 2;
    const speed = randRange(CONFIG.minSpeed, CONFIG.maxSpeed);

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: randRange(CONFIG.minSize, CONFIG.maxSize),
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: randRange(-2, 2),
      color: CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)],
      life: randRange(CONFIG.minLife, CONFIG.maxLife),
      age: 0,
    });
  }

  function spawn(x, y) {
    for (let i = 0; i < CONFIG.spawnPerFrame; i++) {
      spawnParticle(x, y);
    }
  }

  function update(dt) {
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

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
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
  }

  EffectManager.register('stars', {
    activate,
    deactivate,
    spawn,
    update,
    draw,
  });
})();
