const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const bgPicker = document.getElementById('bg-picker');
let backgroundColor = '#000000';
let userBackgroundColor = backgroundColor;
document.body.style.background = backgroundColor;

bgPicker.addEventListener('input', (e) => {
  backgroundColor = e.target.value;
  userBackgroundColor = e.target.value;
  document.body.style.background = backgroundColor;
});

EffectManager.on('background-change', (data) => {
  backgroundColor = data && data.color ? data.color : userBackgroundColor;
  document.body.style.background = backgroundColor;
  bgPicker.value = backgroundColor;
});

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;

  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener('resize', resizeCanvas);

resizeCanvas();

const fullscreenBtn = document.getElementById('fullscreen-btn');

fullscreenBtn.addEventListener('click', () => {
  const el = document.documentElement;

  if (!document.fullscreenElement) {
    if (el.requestFullscreen) {
      el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
});

document.querySelectorAll('#effect-picker button').forEach((button) => {
  button.addEventListener('click', () => {
    EffectManager.setEffect(button.dataset.effect);
  });
});

let lastTime = performance.now();

function render(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);

  lastTime = now;

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  if (pointer.active) {
    EffectManager.spawn(window.pointers);
  }

  EffectManager.update(dt);
  EffectManager.draw(ctx);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
