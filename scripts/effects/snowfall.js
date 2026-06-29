(function () {
  const particles = [];
  const COLS = 200;
  let colWidth = 1;
  let heights = [];
  let canvasW = window.innerWidth;
  let canvasH = window.innerHeight;

  const MAX_PILE_FRACTION = 0.35;

  const CONFIG =
    window.innerWidth <= 768
      ? {
          spawnPerFrame: 3,
          minSize: 3,
          maxSize: 6,
          minLife: 3,
          maxLife: 5.5,
          spread: 43,
          windStrength: 18,
          gravity: 38,
          maxParticles: 600,
        }
      : {
          spawnPerFrame: 5,
          minSize: 3,
          maxSize: 9,
          minLife: 4.0,
          maxLife: 7.0,
          spread: 100,
          windStrength: 25,
          gravity: 40,
          maxParticles: 600,
        };

  function initHeights() {
    canvasW = window.innerWidth;
    canvasH = window.innerHeight;
    colWidth = canvasW / COLS;
    heights = new Array(COLS).fill(0);
  }

  function activate(emit) {
    particles.length = 0;
    initHeights();
    if (emit) emit('background-change', { color: '#000' });
  }

  function deactivate() {
    particles.length = 0;
    heights.fill(0);
  }

  function randRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function spawn(x, y) {
    for (let i = 0; i < CONFIG.spawnPerFrame; i++) {
      particles.push({
        x: x + randRange(-CONFIG.spread, CONFIG.spread),
        y: y + randRange(-CONFIG.spread * 0.3, CONFIG.spread * 0.3),
        vx: randRange(-CONFIG.windStrength, CONFIG.windStrength),
        vy: randRange(-20, 10),
        size: randRange(CONFIG.minSize, CONFIG.maxSize),
        phase: Math.random() * Math.PI * 2,
        age: 0,
        life: randRange(CONFIG.minLife, CONFIG.maxLife),
      });
    }
    if (particles.length > CONFIG.maxParticles) {
      particles.splice(0, particles.length - CONFIG.maxParticles);
    }
  }

  function settle(x, amount) {
    const col = Math.floor(x / colWidth);
    const maxPile = canvasH * MAX_PILE_FRACTION;
    const spread = 3;
    for (let dc = -spread; dc <= spread; dc++) {
      const c = col + dc;
      if (c < 0 || c >= COLS) continue;
      const weight = 1 - Math.abs(dc) / (spread + 1);
      heights[c] = Math.min(maxPile, heights[c] + amount * weight * 0.4);
    }

    if (col > 0) heights[col - 1] = (heights[col - 1] + heights[col]) / 2;
    if (col < COLS - 1) heights[col + 1] = (heights[col + 1] + heights[col]) / 2;
  }

  function update(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age += dt;
      if (p.age >= p.life) {
        settle(p.x, p.size * 0.6);
        particles.splice(i, 1);
        continue;
      }
      p.vy += CONFIG.gravity * dt;
      const flutter = Math.sin(p.phase + p.age * 2.5) * 1.5;
      p.x += (p.vx + flutter) * dt;
      p.y += p.vy * dt;

      const col = Math.clamp
        ? Math.clamp(Math.floor(p.x / colWidth), 0, COLS - 1)
        : Math.max(0, Math.min(COLS - 1, Math.floor(p.x / colWidth)));
      const surfaceY = canvasH - heights[col];
      if (p.y + p.size >= surfaceY) {
        settle(p.x, p.size * 0.8);
        particles.splice(i, 1);
      }
    }
  }

  function draw(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';

    for (const p of particles) {
      const lifeRatio = 1 - p.age / p.life;
      ctx.globalAlpha = lifeRatio * 0.85;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.restore();

    // draw snow pile
    if (heights.some((h) => h > 0)) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, canvasH);
      for (let c = 0; c < COLS; c++) {
        const x = c * colWidth;
        const y = canvasH - heights[c];
        ctx.lineTo(x, y);
      }
      ctx.lineTo(canvasW, canvasH);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(
        0,
        canvasH - canvasH * MAX_PILE_FRACTION,
        0,
        canvasH,
      );
      gradient.addColorStop(0, 'rgba(200, 220, 255, 0.85)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
      ctx.fillStyle = gradient;
      ctx.fill();

      // soft top edge
      ctx.beginPath();
      ctx.moveTo(0, canvasH - heights[0]);
      for (let c = 1; c < COLS; c++) {
        const x = c * colWidth;
        const y = canvasH - heights[c];
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
  }

  window.addEventListener('resize', initHeights);

  EffectManager.register('snowfall', {
    activate,
    deactivate,
    spawn,
    update,
    draw,
  });
})();
