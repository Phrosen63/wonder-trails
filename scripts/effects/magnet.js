(function () {
  const specks = [];
  const CONFIG =
    window.innerWidth <= 768
      ? {
          count: 180,
          magnetRadius: 140,
          attractForce: 2300,
          repelForce: 17,
          damping: 0.86,
          drift: 11,
          minSize: 1.7,
          maxSize: 3.7,
        }
      : {
          count: 300,
          magnetRadius: 225,
          attractForce: 2600,
          repelForce: 20,
          damping: 0.86,
          drift: 14,
          minSize: 1.8,
          maxSize: 4.3,
        };

  function randRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function activate() {
    specks.length = 0;
    const W = window.innerWidth;
    const H = window.innerHeight;
    for (let i = 0; i < CONFIG.count; i++) {
      specks.push({
        x: randRange(0, W),
        y: randRange(0, H),
        vx: 0,
        vy: 0,
        size: randRange(CONFIG.minSize, CONFIG.maxSize),
        brightness: randRange(0.5, 1.0),
      });
    }
  }

  function deactivate() {
    specks.length = 0;
  }

  function spawn(x, y) {}

  function update(dt, pointer) {
    for (const s of specks) {
      const dx = pointer.x - s.x;
      const dy = pointer.y - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;

      if (pointer.active && dist < CONFIG.magnetRadius) {
        const strength = 1 - dist / CONFIG.magnetRadius;
        const force = CONFIG.attractForce * strength * strength;
        s.vx += (dx / dist) * force * dt;
        s.vy += (dy / dist) * force * dt;
        s.vx *= CONFIG.damping;
        s.vy *= CONFIG.damping;
      } else {
        s.vx *= 0.97;
        s.vy *= 0.97;
        s.vx += randRange(-CONFIG.drift, CONFIG.drift) * dt;
        s.vy += randRange(-CONFIG.drift, CONFIG.drift) * dt;
      }

      s.x += s.vx * dt;
      s.y += s.vy * dt;

      const margin = 20;
      if (s.x < margin) s.vx += CONFIG.repelForce * dt;
      if (s.x > window.innerWidth - margin) s.vx -= CONFIG.repelForce * dt;
      if (s.y < margin) s.vy += CONFIG.repelForce * dt;
      if (s.y > window.innerHeight - margin) s.vy -= CONFIG.repelForce * dt;
    }
  }

  function draw(ctx, pointer) {
    for (const s of specks) {
      const dx = pointer.x - s.x;
      const dy = pointer.y - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const inField = pointer.active && dist < CONFIG.magnetRadius;
      const pull = inField ? 1 - dist / CONFIG.magnetRadius : 0;
      const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);

      ctx.save();

      if (speed > 8 && (s.vx !== 0 || s.vy !== 0)) {
        const angle = Math.atan2(s.vy, s.vx);
        const tailLen = Math.min(speed * 0.12, 10);
        ctx.translate(s.x, s.y);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(-tailLen, 0);
        ctx.lineTo(s.size * 0.5, 0);
        const alpha = 0.4 + pull * 0.5;
        const light = Math.round(55 + pull * 40);
        ctx.strokeStyle = `hsla(200, 20%, ${light}%, ${alpha * s.brightness})`;
        ctx.lineWidth = s.size * (1 + pull * 0.8);
        ctx.lineCap = 'round';
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * (1 + pull * 0.6), 0, Math.PI * 2);
        const alpha = 0.35 + pull * 0.55;
        const light = Math.round(55 + pull * 40);
        ctx.fillStyle = `hsla(200, 15%, ${light}%, ${alpha * s.brightness})`;
        ctx.fill();
      }

      ctx.restore();
    }

    if (pointer.active) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, CONFIG.magnetRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(180, 200, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  EffectManager.register('magnet', {
    activate,
    deactivate,
    spawn,
    update,
    draw,
  });
})();
