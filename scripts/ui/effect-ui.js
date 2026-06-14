(function () {
  const effects = [
    ['stars', '⭐'],
    ['paint', '🎨'],
    ['bubbles', '🫧'],
    ['fireworks', '🎆'],
    ['rainbow', '🌈'],
    ['snowfall', '❄️'],
    ['ink-bloom', '🫟'],
    ['magnet', '🧲'],
  ];

  const container = document.getElementById('effect-picker');
  const buttons = {};

  for (const [name, icon] of effects) {
    const btn = document.createElement('button');
    btn.textContent = icon;
    btn.dataset.effect = name;

    btn.addEventListener('click', () => {
      EffectManager.setEffect(name);
    });

    container.appendChild(btn);
    buttons[name] = btn;
  }

  function setActive(name) {
    for (const key in buttons) {
      buttons[key].classList.toggle('active', key === name);
    }
  }

  EffectManager.on('effect-change', ({ name }) => setActive(name));
  setActive(effects[0][0]);
})();
