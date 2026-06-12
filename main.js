// main.js
// Sets up the canvas, handles resizing/fullscreen, and runs the render loop.
// Particle logic will be added in a later step - for now this just clears
// the canvas each frame and draws a marker at the pointer position so we
// can visually confirm tracking works.

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  // Use the actual pixel ratio so drawings stay crisp on high-DPI phone screens.
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- Fullscreen handling ---
// Mobile browsers require fullscreen to be triggered by a user gesture,
// so this is wired to a button tap rather than happening automatically.
const fullscreenBtn = document.getElementById('fullscreen-btn');

fullscreenBtn.addEventListener('click', () => {
  const el = document.documentElement;
  if (!document.fullscreenElement) {
    if (el.requestFullscreen) {
      el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen(); // iOS Safari
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
});

// --- Render loop ---
function render() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  // Clear the frame
  ctx.clearRect(0, 0, w, h);

  // Draw a simple marker at the current pointer position
  if (pointer.active) {
    ctx.beginPath();
    ctx.arc(pointer.x, pointer.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd700';
    ctx.fill();
  }

  requestAnimationFrame(render);
}

render();
