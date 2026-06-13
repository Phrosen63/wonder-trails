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

  for (const [name, icon] of effects) {
    const btn = document.createElement('button');
    btn.textContent = icon;
    btn.dataset.effect = name;

    btn.addEventListener('click', () => {
      EffectManager.setEffect(name);
    });

    container.appendChild(btn);
  }
})();
