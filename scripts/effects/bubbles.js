(function () {
  const particles = [];

  const CONFIG = {
    minSize: 12,
    maxSize: 70,
    minLife: 2.5,
    maxLife: 4.4,
    spawnPerFrame: 1,
  };

  function randRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function randomHue() {
    return Math.floor(Math.random() * 360);
  }

  function activate() {}

  function deactivate() {
    particles.length = 0;
  }

  function spawn(x, y) {
    for (let i = 0; i < CONFIG.spawnPerFrame; i++) {
      particles.push({
        x: x + randRange(-50, 50),
        y: y + randRange(-50, 50),
        vx: randRange(-15, 15),
        vy: randRange(-60, -20),
        size: randRange(CONFIG.minSize, CONFIG.maxSize),
        hue: randomHue(),
        age: 0,
        life: randRange(CONFIG.minLife, CONFIG.maxLife),
      });
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

      p.vx *= 0.995;
      p.vy *= 0.995;
    }
  }

  function draw(ctx) {
    for (const p of particles) {
      const lifeRatio = 1 - p.age / p.life;

      ctx.save();
      ctx.globalAlpha = lifeRatio * 0.8;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, 0.2)`;
      ctx.fill();

      ctx.lineWidth = 3;
      ctx.strokeStyle = `hsl(${p.hue}, 90%, 85%)`;
      ctx.stroke();

      // shiny highlight
      ctx.beginPath();

      ctx.arc(p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fill();
      ctx.restore();
    }
  }

  EffectManager.register('bubbles', {
    activate,
    deactivate,
    spawn,
    update,
    draw,
  });
})();
