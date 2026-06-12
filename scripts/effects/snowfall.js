(function () {
  const particles = [];

  const CONFIG = {
    spawnPerFrame: 2,
    minSize: 2,
    maxSize: 6,
    minSpeed: 20,
    maxSpeed: 60,
    windStrength: 25,
    windVariation: 0.8,
    gravity: 18,
    maxParticles: 250,
  };

  let windOffset = 0;

  function activate() {
    particles.length = 0;
  }

  function deactivate() {
    particles.length = 0;
  }

  function randRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function spawn(x, y) {
    for (let i = 0; i < CONFIG.spawnPerFrame; i++) {
      particles.push({
        x: x + randRange(-30, 30),
        y: y + randRange(-10, 10),
        vx: randRange(-10, 10),
        vy: randRange(CONFIG.minSpeed, CONFIG.maxSpeed),
        size: randRange(CONFIG.minSize, CONFIG.maxSize),
        phase: Math.random() * Math.PI * 2,
        life: 0,
      });
    }

    if (particles.length > CONFIG.maxParticles) {
      particles.splice(0, particles.length - CONFIG.maxParticles);
    }
  }

  function update(dt) {
    windOffset += dt * 0.6;

    const wind = Math.sin(windOffset) * CONFIG.windStrength;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      p.life += dt;
      p.vy += CONFIG.gravity * dt;
      const flutter = Math.sin(p.phase + p.life * 3) * CONFIG.windVariation;
      p.x += (p.vx + wind * flutter) * dt;
      p.y += p.vy * dt;

      if (p.y > window.innerHeight + 50) {
        particles.splice(i, 1);
      }
    }
  }

  function draw(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';

    for (const p of particles) {
      const alpha = Math.max(0, 1 - p.life / 8);
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  EffectManager.register('snowfall', {
    activate,
    deactivate,
    spawn,
    update,
    draw,
  });
})();
