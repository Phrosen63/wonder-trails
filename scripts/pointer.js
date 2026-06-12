window.pointer = {
  x: 0,
  y: 0,
  active: false, // true while a touch/mouse-button is down
};

(function () {
  function isUIElement(target) {
    return !!target.closest('#effect-picker, #fullscreen-btn');
  }

  function setPointer(x, y, active) {
    pointer.x = x;
    pointer.y = y;
    pointer.active = active;
  }

  // --- Mouse events (for desktop development) ---
  window.addEventListener('mousemove', (e) => {
    if (isUIElement(e.target)) return;

    setPointer(e.clientX, e.clientY, pointer.active);
  });

  window.addEventListener('mousedown', (e) => {
    if (isUIElement(e.target)) return;

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
      if (isUIElement(e.target)) return;
      const t = e.touches[0];
      setPointer(t.clientX, t.clientY, true);
    },
    { passive: true },
  );

  window.addEventListener(
    'touchmove',
    (e) => {
      if (isUIElement(e.target)) return;
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
})();
