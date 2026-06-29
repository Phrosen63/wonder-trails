(function () {
  const specks = [];
  const DEFAULT_BACKGROUND_COLOR = '#f9c468';

  const COLORS = [
    '#1A1A2E', // deep indigo-black
    '#2C0A0A', // deep crimson-black
    '#0A2C0A', // deep forest-black
    '#0A1A2C', // deep ocean-black
    '#2C1A00', // dark amber-black
    '#1A002C', // deep violet-black
    '#002C2C', // deep teal-black
    '#2C2000', // dark olive-black
    '#8B1A1A', // deep red
    '#1A5C1A', // deep green
    '#1A1A8B', // deep blue
    '#7B2D8B', // deep purple
    '#8B5A00', // deep amber
    '#006B6B', // deep teal
    '#8B3A00', // deep burnt orange
    '#3A008B', // deep violet
  ];

  const BASE_CONFIG = {
    colors: COLORS,
    damping: 0.86,
  };

  const CONFIG =
    window.innerWidth <= 768
      ? {
          ...BASE_CONFIG,
          count: 180,
          magnetRadius: 140,
          attractForce: 4000,
          repelForce: 17,
          drift: 11,
          minSize: 2.2,
          maxSize: 4.8,
        }
      : {
          ...BASE_CONFIG,
          count: 300,
          magnetRadius: 225,
          attractForce: 5000,
          repelForce: 20,
          drift: 14,
          minSize: 2.4,
          maxSize: 5.6,
        };

  function randRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16),
    };
  }

  function activate(emit) {
    specks.length = 0;
    const W = window.innerWidth;
    const H = window.innerHeight;
    for (let i = 0; i < CONFIG.count; i++) {
      const hex = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
      specks.push({
        x: randRange(0, W),
        y: randRange(0, H),
        vx: 0,
        vy: 0,
        size: randRange(CONFIG.minSize, CONFIG.maxSize),
        brightness: randRange(0.5, 1.0),
        color: hexToRgb(hex),
      });
    }
    if (emit) emit('background-change', { color: DEFAULT_BACKGROUND_COLOR });
  }

  function deactivate() {
    specks.length = 0;
  }

  function spawn(x, y) {}

  function update(dt, pointer, emit) {
    for (const s of specks) {
      const dx = pointer.x - s.x;
      const dy = pointer.y - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
      if (pointer.active && dist < CONFIG.magnetRadius) {
        // Linear falloff (was strength²) so the full radius actually feels attracted
        const strength = 1 - dist / CONFIG.magnetRadius;
        const force = CONFIG.attractForce * strength;
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

  function speckColor(s, alpha, pull) {
    const boost = Math.round(pull * 40);
    const r = Math.min(255, s.color.r + boost);
    const g = Math.min(255, s.color.g + boost);
    const b = Math.min(255, s.color.b + boost);
    return `rgba(${r}, ${g}, ${b}, ${alpha * s.brightness})`;
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
        ctx.strokeStyle = speckColor(s, alpha, pull);
        ctx.lineWidth = s.size * (1 + pull * 0.8);
        ctx.lineCap = 'round';
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * (1 + pull * 0.6), 0, Math.PI * 2);
        const alpha = 0.35 + pull * 0.55;
        ctx.fillStyle = speckColor(s, alpha, pull);
        ctx.fill();
      }
      ctx.restore();
    }

    if (pointer.active) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, CONFIG.magnetRadius, 0, Math.PI * 2);
      // Solid dark stroke with a thick white glow underneath for contrast on any background
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 10]);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, CONFIG.magnetRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(30, 20, 0, 0.7)';
      ctx.lineWidth = 1.5;
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
