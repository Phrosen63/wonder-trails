(function () {
  const scripts = [
    'stars.js',
    'paint.js',
    'bubbles.js',
    'fireworks.js',
    'rainbow.js',
    'snowfall.js',
    'ink-bloom.js',
    'magnet.js',
    'rain.js',
  ];

  const base = 'scripts/effects/';
  let loaded = 0;

  for (const file of scripts) {
    const s = document.createElement('script');
    s.src = base + file;
    s.onload = () => {
      loaded++;
      if (loaded === scripts.length) {
        EffectManager.setEffect('stars');
      }
    };
    document.body.appendChild(s);
  }
})();
