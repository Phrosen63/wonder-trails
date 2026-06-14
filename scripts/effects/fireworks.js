(function () {
  const particles = [];

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
        }
      : {
          particlesPerBurst: 28,
          minSpeed: 110,
          maxSpeed: 320,
          minLife: 0.9,
          maxLife: 2.0,
          minSize: 1.5,
          maxSize: 4,
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

    emit('sound', { id: 'firework-burst', x, y, intensity: 1 });
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

      // gravity
      p.vy += 120 * dt;
      p.vx *= 0.99;
      p.vy *= 0.99;
    }
  }

  function draw(ctx) {
    for (const p of particles) {
      const lifeRatio = 1 - p.age / p.life;
      const tailLength = 8;

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
  }

  EffectManager.register('fireworks', {
    activate,
    deactivate,
    spawn,
    update,
    draw,
  });
})();
