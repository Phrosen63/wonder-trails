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

  for (const file of scripts) {
    const s = document.createElement('script');
    s.src = base + file;
    document.body.appendChild(s);
  }
})();
