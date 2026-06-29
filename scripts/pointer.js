window.pointer = {
  x: 0,
  y: 0,
  active: false,
};

window.pointers = [];

(function () {
  function isUIElement(target) {
    return !!target.closest('#effect-picker, #fullscreen-btn, #ui-bar');
  }

  function setPointer(x, y, active) {
    pointer.x = x;
    pointer.y = y;
    pointer.active = active;
  }

  function touchesToPointers(touches) {
    return Array.from(touches).map((t) => ({ id: t.identifier, x: t.clientX, y: t.clientY }));
  }

  window.addEventListener('mousemove', (e) => {
    if (isUIElement(e.target)) return;
    setPointer(e.clientX, e.clientY, pointer.active);
    if (pointer.active) window.pointers = [{ id: 'mouse', x: e.clientX, y: e.clientY }];
  });

  window.addEventListener('mousedown', (e) => {
    if (isUIElement(e.target)) return;
    setPointer(e.clientX, e.clientY, true);
    window.pointers = [{ id: 'mouse', x: e.clientX, y: e.clientY }];
  });

  window.addEventListener('mouseup', (e) => {
    setPointer(e.clientX, e.clientY, false);
    window.pointers = [];
  });

  // --- Touch events (for mobile) ---
  window.addEventListener(
    'touchstart',
    (e) => {
      if (isUIElement(e.target)) return;
      const t = e.touches[0];
      setPointer(t.clientX, t.clientY, true);
      window.pointers = touchesToPointers(e.touches);
    },
    { passive: true },
  );

  window.addEventListener(
    'touchmove',
    (e) => {
      if (isUIElement(e.target)) return;
      const t = e.touches[0];
      setPointer(t.clientX, t.clientY, true);
      window.pointers = touchesToPointers(e.touches);
    },
    { passive: true },
  );

  window.addEventListener(
    'touchend',
    (e) => {
      // e.touches only contains *still-active* touches after the finger lifts
      if (e.touches.length === 0) {
        setPointer(pointer.x, pointer.y, false);
        window.pointers = [];
      } else {
        const t = e.touches[0];
        setPointer(t.clientX, t.clientY, true);
        window.pointers = touchesToPointers(e.touches);
      }
    },
    { passive: true },
  );

  window.addEventListener(
    'touchcancel',
    (e) => {
      setPointer(pointer.x, pointer.y, false);
      window.pointers = [];
    },
    { passive: true },
  );
})();
