(function () {
  const particles = [];

  const CONFIG =
    window.innerWidth <= 768
      ? {
          minSize: 20,
          maxSize: 50,
          minLife: 2.5,
          maxLife: 4.5,
          spawnPerFrame: 1,
          hueSpeed: 40,
          saturation: 80,
          lightness: 60,
        }
      : {
          minSize: 35,
          maxSize: 80,
          minLife: 2.5,
          maxLife: 4.5,
          spawnPerFrame: 1,
          hueSpeed: 40,
          saturation: 80,
          lightness: 60,
        };

  let currentHue = 0;

  function activate() {}

  function deactivate() {
    particles.length = 0;
  }

  function randRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function spawn(x, y) {
    for (let i = 0; i < CONFIG.spawnPerFrame; i++) {
      particles.push({
        x,
        y,
        size: randRange(CONFIG.minSize, CONFIG.maxSize),
        hue: currentHue,
        life: randRange(CONFIG.minLife, CONFIG.maxLife),
        age: 0,
      });
    }
  }

  function update(dt) {
    currentHue = (currentHue + CONFIG.hueSpeed * dt) % 360;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      p.age += dt;

      if (p.age >= p.life) {
        particles.splice(i, 1);
      }
    }
  }

  function draw(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const p of particles) {
      const lifeRatio = 1 - p.age / p.life;
      const color = `hsl(${p.hue}, ${CONFIG.saturation}%, ${CONFIG.lightness}%)`;
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);

      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'transparent');

      ctx.globalAlpha = lifeRatio * 0.6;
      ctx.fillStyle = gradient;

      ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  EffectManager.register('paint', {
    activate,
    deactivate,
    spawn,
    update,
    draw,
  });
})();
