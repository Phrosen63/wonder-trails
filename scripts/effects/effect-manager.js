(function () {
  const effects = {};

  let activeEffect = null;

  function register(name, effect) {
    effects[name] = effect;

    if (!activeEffect) {
      activeEffect = effect;
    }
  }

  function setEffect(name) {
    const nextEffect = effects[name];
    if (!nextEffect) return;

    if (activeEffect && typeof activeEffect.deactivate === 'function') {
      activeEffect.deactivate();
    }

    activeEffect = nextEffect;
    if (typeof activeEffect.activate === 'function') {
      activeEffect.activate();
    }
  }

  function spawn(x, y) {
    if (!activeEffect) return;
    activeEffect.spawn(x, y);
  }

  function update(dt) {
    if (!activeEffect) return;
    activeEffect.update(dt, window.pointer);
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
  };
})();
