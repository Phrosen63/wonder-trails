(function () {
  const blooms = [];
  const DEFAULT_BACKGROUND_COLOR = '#000000';

  const CONFIG =
    window.innerWidth <= 768
      ? {
          spawnPerTap: 1,
          minRadius: 12,
          maxRadius: 45,
          expansionSpeed: 14,
          fadeSpeed: 0.25,
          hueSpeed: 12,
        }
      : {
          spawnPerTap: 1,
          minRadius: 16,
          maxRadius: 60,
          expansionSpeed: 16,
          fadeSpeed: 0.25,
          hueSpeed: 12,
        };

  let hue = 0;

  function activate(emit) {
    blooms.length = 0;
    if (emit) emit('background-change', { color: DEFAULT_BACKGROUND_COLOR });
  }

  function deactivate() {
    blooms.length = 0;
  }

  function randRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function spawn(x, y) {
    for (let i = 0; i < CONFIG.spawnPerTap; i++) {
      blooms.push({
        x,
        y,
        radius: randRange(CONFIG.minRadius, CONFIG.maxRadius),
        life: 1,
        expansion: randRange(0.6, 1.2),
        wobbleSeed: Math.random() * 1000,
      });
    }
  }

  function update(dt) {
    hue = (hue + CONFIG.hueSpeed * dt) % 360;

    for (let i = blooms.length - 1; i >= 0; i--) {
      const b = blooms[i];

      b.life -= CONFIG.fadeSpeed * dt;
      b.radius += CONFIG.expansionSpeed * b.expansion * dt;

      if (b.life <= 0) {
        blooms.splice(i, 1);
      }
    }
  }

  function draw(ctx) {
    ctx.save();

    for (const b of blooms) {
      const alpha = Math.max(0, b.life);
      const color = `hsla(${hue + (b.wobbleSeed % 60)}, 80%, 60%, ${alpha})`;

      for (let i = 0; i < 3; i++) {
        const r = b.radius * (1 + i * 0.25);
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha * (0.6 / (i + 1));
        ctx.lineWidth = 6 - i * 2;
        ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.globalAlpha = alpha * 0.25;
      const gradient = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius * 0.8);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(b.x - b.radius, b.y - b.radius, b.radius * 2, b.radius * 2);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  EffectManager.register('ink-bloom', {
    activate,
    deactivate,
    spawn,
    update,
    draw,
  });
})();
