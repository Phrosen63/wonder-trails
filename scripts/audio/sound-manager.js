(function () {
  const SOUND_MAP = {
    'bubble-pop': [
      'resources/audio/bubbles/pop1.mp3',
      'resources/audio/bubbles/pop2.mp3',
      'resources/audio/bubbles/pop3.mp3',
      'resources/audio/bubbles/pop4.mp3',
      'resources/audio/bubbles/pop5.mp3',
    ],
    'star-sparkle': [
      'resources/audio/stars/sparkle1.mp3',
      'resources/audio/stars/sparkle2.mp3',
      'resources/audio/stars/sparkle3.wav',
    ],
    'fireworks-pop': [
      'resources/audio/fireworks/fireworks-pop1.mp3',
      'resources/audio/fireworks/fireworks-pop2.mp3',
      'resources/audio/fireworks/fireworks-pop3.mp3',
      'resources/audio/fireworks/fireworks-pop4.mp3',
      'resources/audio/fireworks/fireworks-pop5.mp3',
      'resources/audio/fireworks/fireworks-pop6.mp3',
      'resources/audio/fireworks/fireworks-pop7.mp3',
      'resources/audio/fireworks/fireworks-pop8.mp3',
      'resources/audio/fireworks/fireworks-pop9.mp3',
      'resources/audio/fireworks/fireworks-pop10.mp3',
    ],
  };

  const MAX_CONCURRENT = 8;
  const buffers = {};
  let audioCtx = null;
  let activeCount = 0;

  function playCascade(options = {}) {
    if (!audioCtx) return;
    const intensity = Math.min(Math.max(options.intensity ?? 1, 0), 1);
    // more charge = more pops, spread over a slightly wider window
    const popCount = Math.round(10 + intensity * 30); // ~10 to 40 pops
    const spread = 300 + intensity * 900; // ms window the pops land in
    for (let i = 0; i < popCount; i++) {
      const delay = Math.random() * spread;
      setTimeout(() => {
        play('fireworks-pop', { intensity: 0.35 + Math.random() * 0.65 });
      }, delay);
    }
  }

  async function loadSound(id, url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
      const arrayBuffer = await response.arrayBuffer();
      const decoded = await audioCtx.decodeAudioData(arrayBuffer);
      buffers[id].push(decoded);
    } catch (err) {
      console.error(`Failed to load ${url}:`, err);
    }
  }

  function init() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    for (const [id, urls] of Object.entries(SOUND_MAP)) {
      buffers[id] = [];
      for (const url of urls) {
        loadSound(id, url);
      }
    }
  }

  function pickBuffer(id) {
    const list = buffers[id];
    if (!list || list.length === 0) return null;
    return list[Math.floor(Math.random() * list.length)];
  }

  function play(id, options = {}) {
    if (!audioCtx) return;
    const buffer = pickBuffer(id);
    if (!buffer) return;
    if (activeCount >= MAX_CONCURRENT) return;

    const source = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    source.buffer = buffer;

    const intensity = options.intensity ?? 1;
    gain.gain.value = 0.3 + intensity * 0.4;
    source.playbackRate.value = 0.9 + Math.random() * 0.2;

    source.connect(gain);
    gain.connect(audioCtx.destination);
    source.start();

    activeCount++;
    setTimeout(() => {
      activeCount--;
    }, 120);

    source.onended = () => {
      source.disconnect();
      gain.disconnect();
    };
  }

  EffectManager.on('sound', (data) => {
    if (data.id === 'fireworks-cascade') {
      playCascade(data);
    } else {
      play(data.id, data);
    }
  });

  window.addEventListener(
    'pointerdown',
    () => {
      if (!audioCtx) init();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    },
    { once: true },
  );

  window.SoundManager = { play, playCascade };
})();
