(function () {
  const points = [];

  const CONFIG = {
    maxPoints: 90,
    minWidth: 10,
    maxWidth: 28,
    hueSpeed: 80,
  };

  let hue = 0;

  function activate(emit) {
    points.length = 0;
    if (emit) emit('background-change', { color: '#000' });
  }

  function deactivate() {
    points.length = 0;
  }

  function spawn(x, y) {
    const last = points[points.length - 1];

    if (last) {
      const dx = x - last.x;
      const dy = y - last.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 1.5) return;
    }

    points.push({ x, y });

    if (points.length > CONFIG.maxPoints) {
      points.shift();
    }
  }

  function update(dt) {
    hue = (hue + CONFIG.hueSpeed * dt) % 360;

    if (points.length > CONFIG.maxPoints) {
      points.splice(0, points.length - CONFIG.maxPoints);
    }
  }

  function draw(ctx) {
    if (points.length < 2) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const t = i / points.length;
      const width = CONFIG.minWidth + (CONFIG.maxWidth - CONFIG.minWidth) * Math.pow(t, 0.6);
      const alpha = Math.pow(t, 0.8);

      ctx.beginPath();
      ctx.strokeStyle = `hsla(${hue + i * 2}, 100%, 60%, ${alpha})`;
      ctx.lineWidth = width;
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  EffectManager.register('rainbow', {
    activate,
    deactivate,
    spawn,
    update,
    draw,
  });
})();
