(function () {
  const effects = {};
  let activeEffect = null;
  const listeners = {};

  function on(eventName, callback) {
    const list = (listeners[eventName] = listeners[eventName] || []);
    if (!list.includes(callback)) list.push(callback);
  }

  function off(eventName, callback) {
    if (!listeners[eventName]) return;
    listeners[eventName] = listeners[eventName].filter((cb) => cb !== callback);
  }

  function emit(eventName, data) {
    const cbs = listeners[eventName];
    if (!cbs) return;
    for (const cb of cbs) cb(data);
  }

  function register(name, effect) {
    effects[name] = effect;
  }

  function setEffect(name) {
    const nextEffect = effects[name];
    if (!nextEffect) return;

    if (activeEffect && typeof activeEffect.deactivate === 'function') {
      activeEffect.deactivate(emit);
    }

    activeEffect = nextEffect;
    emit('stop-all-loops');
    if (typeof activeEffect.activate === 'function') {
      activeEffect.activate(emit);
    }
    emit('effect-change', { name });
  }

  function spawn(x, y) {
    if (!activeEffect) return;
    activeEffect.spawn(x, y, emit);
  }

  function update(dt) {
    if (!activeEffect) return;
    activeEffect.update(dt, window.pointer, emit);
  }

  function draw(ctx) {
    if (!activeEffect) return;
    activeEffect.draw(ctx, window.pointer);
  }

  window.EffectManager = {
    register,
    setEffect,
    spawn,
    update,
    draw,
    on,
    off,
  };
})();
