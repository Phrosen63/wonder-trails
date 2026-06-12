// particles.js
// Two particle systems:
//   1. Star particles - short-lived, gold/yellow, drift and fade quickly.
//   2. Paint particles - long-lived, soft glowing color blobs that "paint"
//      the screen following a slowly shifting hue, lingering before fading.
//
// Exposes:
//   - particles: array of active star particles
//   - paintParticles: array of active paint particles
//   - spawnParticle(x, y): adds a new star particle at (x, y)
//   - spawnPaintParticle(x, y): adds a new paint blob at (x, y)
//   - updateParticles(dt): advances all star particles, removes dead ones
//   - updatePaintParticles(dt): advances all paint particles, removes dead ones
//   - drawParticles(ctx): renders all star particles
//   - drawPaintParticles(ctx): renders all paint particles

const particles = [];
const paintParticles = [];

// Tunables - feel free to adjust for the "settings" feature later.
const PARTICLE_CONFIG = {
  minSize: 8,
  maxSize: 18,
  minLife: 0.6, // seconds
  maxLife: 1.4, // seconds
  minSpeed: 20, // px/sec
  maxSpeed: 60, // px/sec
  colors: ['#FFD700', '#FFEC8B', '#FFF8DC', '#FFA500'], // golden/yellow tones
  spawnPerMove: 2, // how many particles to spawn per pointer-move event
};

const PAINT_CONFIG = {
  minSize: 40,
  maxSize: 90,
  minLife: 2.5, // seconds - lingers much longer than stars
  maxLife: 4.5,
  spawnPerMove: 1,
  hueSpeed: 40, // degrees per second the gradient shifts through
  saturation: 80, // %
  lightness: 60, // %
};

// Slowly-shifting hue, advanced once per frame in updatePaintParticles.
let currentHue = 0;

function randRange(min, max) {
  return min + Math.random() * (max - min);
}

function spawnParticle(x, y) {
  const angle = Math.random() * Math.PI * 2;
  const speed = randRange(PARTICLE_CONFIG.minSpeed, PARTICLE_CONFIG.maxSpeed);

  particles.push({
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: randRange(PARTICLE_CONFIG.minSize, PARTICLE_CONFIG.maxSize),
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: randRange(-2, 2), // radians/sec
    color: PARTICLE_CONFIG.colors[Math.floor(Math.random() * PARTICLE_CONFIG.colors.length)],
    life: randRange(PARTICLE_CONFIG.minLife, PARTICLE_CONFIG.maxLife),
    age: 0,
  });
}

function updateParticles(dt) {
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

    // Slow down over time
    p.vx *= 0.97;
    p.vy *= 0.97;
  }
}

// Draws a 5-pointed star centered at (0, 0) with the given outer radius.
// Assumes the canvas context is already translated/rotated into place.
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

function drawParticles(ctx) {
  for (const p of particles) {
    const lifeRatio = 1 - p.age / p.life; // 1 -> 0 over lifetime
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
  ctx.globalAlpha = 1; // reset
}

// --- Paint particles ---

function spawnPaintParticle(x, y) {
  paintParticles.push({
    x,
    y,
    size: randRange(PAINT_CONFIG.minSize, PAINT_CONFIG.maxSize),
    hue: currentHue,
    life: randRange(PAINT_CONFIG.minLife, PAINT_CONFIG.maxLife),
    age: 0,
  });
}

function updatePaintParticles(dt) {
  // Slowly cycle the hue so consecutive blobs shift through the spectrum.
  currentHue = (currentHue + PAINT_CONFIG.hueSpeed * dt) % 360;

  for (let i = paintParticles.length - 1; i >= 0; i--) {
    const p = paintParticles[i];
    p.age += dt;

    if (p.age >= p.life) {
      paintParticles.splice(i, 1);
    }
  }
}

function drawPaintParticles(ctx) {
  // "Lighter" composite makes overlapping color blobs blend additively,
  // giving a glowing paint effect rather than flat overlapping circles.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (const p of paintParticles) {
    const lifeRatio = 1 - p.age / p.life; // 1 -> 0 over lifetime
    const color = `hsl(${p.hue}, ${PAINT_CONFIG.saturation}%, ${PAINT_CONFIG.lightness}%)`;

    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'transparent');

    ctx.globalAlpha = lifeRatio * 0.6; // keep it soft even at full life
    ctx.fillStyle = gradient;
    ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}
