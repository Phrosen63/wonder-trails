// pointer.js
// Tracks the current pointer (mouse or touch) position and exposes it
// globally as `window.pointer`. Also updates the on-screen debug overlay,
// since console.log isn't visible on a phone.

window.pointer = {
  x: 0,
  y: 0,
  active: false, // true while a touch/mouse-button is down
};

(function () {
  const debugEl = document.getElementById('debug');

  function updateDebug() {
    debugEl.textContent =
      `x: ${pointer.x.toFixed(1)}\n` + `y: ${pointer.y.toFixed(1)}\n` + `active: ${pointer.active}`;
  }

  function setPointer(x, y, active) {
    pointer.x = x;
    pointer.y = y;
    pointer.active = active;
    updateDebug();
  }

  // --- Mouse events (for desktop development) ---
  window.addEventListener('mousemove', (e) => {
    setPointer(e.clientX, e.clientY, pointer.active);
  });

  window.addEventListener('mousedown', (e) => {
    setPointer(e.clientX, e.clientY, true);
  });

  window.addEventListener('mouseup', (e) => {
    setPointer(e.clientX, e.clientY, false);
  });

  // --- Touch events (for mobile) ---
  // Using the first touch point only, since this is meant to be
  // a single-finger interaction for young children.
  window.addEventListener(
    'touchstart',
    (e) => {
      const t = e.touches[0];
      setPointer(t.clientX, t.clientY, true);
    },
    { passive: true },
  );

  window.addEventListener(
    'touchmove',
    (e) => {
      const t = e.touches[0];
      setPointer(t.clientX, t.clientY, true);
    },
    { passive: true },
  );

  window.addEventListener(
    'touchend',
    (e) => {
      setPointer(pointer.x, pointer.y, false);
    },
    { passive: true },
  );

  window.addEventListener(
    'touchcancel',
    (e) => {
      setPointer(pointer.x, pointer.y, false);
    },
    { passive: true },
  );

  // Initial debug paint
  updateDebug();
})();
