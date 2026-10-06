(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const ui = {
    header: document.querySelector('.header'),
    overlay: document.getElementById('overlay'),
    eyebrow: document.getElementById('overlayEyebrow'),
    title: document.getElementById('overlayTitle'),
    body: document.getElementById('overlayBody'),
    play: document.getElementById('play'),
    rotate: document.getElementById('rotatePrompt'),
    playPortrait: document.getElementById('playPortrait'),
    rotateBack: document.getElementById('rotateBack'),
    pause: document.getElementById('pauseScreen'),
    mobilePause: document.getElementById('mobilePause'),
    resume: document.getElementById('resume'),
    message: document.getElementById('message'),
    hero: document.getElementById('heroName'),
    lives: document.getElementById('lives'),
    level: document.getElementById('levelName'),
    score: document.getElementById('score'),
    mute: document.getElementById('mute'),
    fullscreen: document.getElementById('fullscreen'),
    fullscreenHelp: document.getElementById('fullscreenHelp'),
    ability: document.getElementById('abilityLabel'),
    roster: document.getElementById('rosterUnlock'),
  };
  const sprites = {
    heroes: new Image(),
    javierAnimated: new Image(),
    karinaAnimated: new Image(),
    patriciaAnimated: new Image(),
    patricia: new Image(),
    cristina: new Image(),
    enemies: new Image(),
    crowd: new Image(),
  };
  sprites.heroes.src = './assets/heroes.png';
  sprites.javierAnimated.src = './assets/javier-animated.png';
  sprites.karinaAnimated.src = './assets/karina-animated.png';
  sprites.patriciaAnimated.src = './assets/patricia-animated.png';
  sprites.patricia.src = './assets/patricia.png';
  sprites.cristina.src = './assets/cristina.png';
  sprites.enemies.src = './assets/enemies.png';
  sprites.crowd.src = './assets/piquetero-crowd.png';
  const openingTrack = new Audio('./assets/avenida-rock.mp3');
  openingTrack.loop = true;
  openingTrack.volume = 0;
  const soundtrack = new Audio('./assets/ciudad-new-wave.mp3');
  soundtrack.loop = true;
  soundtrack.volume = 0;
  const crowdTrack = new Audio('./assets/crowd-rock.mp3');
  crowdTrack.loop = true;
  crowdTrack.volume = 0;
  const bossTrack = new Audio('./assets/boss-battle.mp3');
  bossTrack.loop = true;
  bossTrack.volume = 0;
  const bossMarch = new Audio('./assets/boss-march.mp3');
  bossMarch.volume = 0;
  const musicTracks = [
    { audio: openingTrack, volume: .35 },
    { audio: soundtrack, volume: .34 },
    { audio: crowdTrack, volume: .38 },
    { audio: bossTrack, volume: .38 },
    { audio: bossMarch, volume: .42 },
  ];

  let W = 480;
  const H = 270;
  const RENDER_SCALE = 2;
  const WORLD = 1760;
  const GRAVITY = 650;
  const held = new Set();
  const touchHeld = new Set();
  const activeTouches = new Map();
  const buttonHeld = new Set();
  const controlPointers = new Map();
  const heroes = [
    { name: 'JAVIER', speed: 133, jump: 285, ability: 'RUGIDO DEL LEÓN', sprite: sprites.javierAnimated },
    { name: 'KARINA', speed: 146, jump: 315, ability: 'ESCUDO ESTRATÉGICO', sprite: sprites.karinaAnimated },
    { name: 'PATRICIA', speed: 150, jump: 290, ability: 'EMBESTIDA', sprite: sprites.patriciaAnimated },
  ];

  const levelData = [{
    name: 'BUENOS AIRES · LA AVENIDA', sky: '#72b8c3', far: '#6689a1', near: '#344b69',
    ground: [[0, 380], [420, 900], [940, 1360], [1400, WORLD]],
    ledges: [[145, 192, 86], [290, 166, 74], [510, 189, 86], [680, 168, 80], [810, 184, 65], [1030, 178, 90], [1210, 158, 82], [1480, 183, 78]],
    enemies: [
      ['piquetero', 245, 208], ['noqui', 535, 212], ['piquetero', 720, 208],
      ['bill', 1080, 126], ['noqui', 1225, 212], ['piquetero', 1470, 208],
    ],
    coins: [[130, 164], [164, 164], [308, 139], [342, 139], [520, 164], [690, 141], [1020, 148], [1052, 148], [1225, 128], [1495, 155]],
  }];

  let state = 'menu';
  let levelIndex = 0;
  let score = 0;
  let lives = 3;
  let heroIndex = 0;
  let player;
  let companion;
  let enemies = [];
  let coins = [];
  let shots = [];
  let particles = [];
  let effects = [];
  let encountered = new Set();
  let boss = null;
  let cam = 0;
  let elapsed = 0;
  let noticeTime = 0;
  let jumpQueued = false;
  let switchQueued = false;
  let attackQueued = false;
  let abilityQueued = false;
  let shieldTime = 0;
  let abilityCd = 0;
  let conanCollected = false;
  let unlockedPatricia = false;
  let muted = false;
  let crowdNearby = false;
  let bossMarchStart = null;
  let portraitAllowed = false;
  let audio = null;
  let noiseBuffer = null;
  let lastLaughAt = -Infinity;
  let lastFrame = performance.now();
  try { unlockedPatricia = localStorage.getItem('smb-patricia-unlocked') === 'yes'; } catch { /* Private browsing can block storage. */ }

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const current = () => levelData[levelIndex];
  const floorRects = () => [
    ...current().ground.map(([a, b]) => ({ x: a, y: 230, w: b - a, h: 40 })),
    ...current().ledges.map(([x, y, w]) => ({ x, y, w, h: 12 })),
  ];

  function resizeCanvas() {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    W = Math.round(H * bounds.width / bounds.height);
    canvas.width = W * RENDER_SCALE;
    canvas.height = H * RENDER_SCALE;
    ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
    ctx.imageSmoothingEnabled = false;
    if (player) cam = clamp(player.x - W * .32, 0, Math.max(0, WORLD - W));
  }

  function setState(next) {
    state = next;
    document.body.dataset.gameState = next;
    ui.mobilePause.setAttribute('aria-label', next === 'paused' ? 'Continuar' : 'Pausar');
    ui.mobilePause.setAttribute('aria-pressed', String(next === 'paused'));
    ui.mobilePause.textContent = next === 'paused' ? '▶' : 'Ⅱ';
    if (next !== 'playing') {
      touchHeld.clear();
      buttonHeld.clear();
      controlPointers.clear();
      document.querySelectorAll('.mobile-controls button').forEach(button => button.classList.remove('is-held'));
      jumpQueued = false;
      switchQueued = false;
      attackQueued = false;
      abilityQueued = false;
      activeTouches.clear();
    }
  }

  function togglePause() {
    if (state !== 'playing' && state !== 'paused') return;
    setState(state === 'playing' ? 'paused' : 'playing');
    ui.pause.hidden = state !== 'paused';
    if (state === 'playing') startMusic();
    syncMusic();
  }

  function playSfx(kind) {
    if (muted) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      const now = audio.currentTime;
      const tone = (from, to, duration, volume, type = 'sine', delay = 0) => {
        const start = now + delay;
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(from, start);
        oscillator.frequency.exponentialRampToValueAtTime(to, start + duration);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(.012, duration / 3));
        gain.gain.exponentialRampToValueAtTime(.001, start + duration);
        oscillator.connect(gain).connect(audio.destination);
        oscillator.start(start);
        oscillator.stop(start + duration);
      };
      const noise = (duration, volume, frequency, delay = 0) => {
        if (!noiseBuffer) {
          noiseBuffer = audio.createBuffer(1, audio.sampleRate / 2, audio.sampleRate);
          const data = noiseBuffer.getChannelData(0);
          for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        }
        const start = now + delay;
        const source = audio.createBufferSource();
        const filter = audio.createBiquadFilter();
        const gain = audio.createGain();
        source.buffer = noiseBuffer;
        filter.type = 'bandpass';
        filter.frequency.value = frequency;
        filter.Q.value = .7;
        gain.gain.setValueAtTime(.001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + .008);
        gain.gain.exponentialRampToValueAtTime(.001, start + duration);
        source.connect(filter).connect(gain).connect(audio.destination);
        source.start(start);
        source.stop(start + duration);
      };
      const chainsaw = () => {
        const duration = .32;
        const engine = audio.createOscillator();
        const throttle = audio.createOscillator();
        const throttleDepth = audio.createGain();
        const filter = audio.createBiquadFilter();
        const gain = audio.createGain();
        engine.type = 'sawtooth';
        engine.frequency.setValueAtTime(82, now);
        engine.frequency.exponentialRampToValueAtTime(165, now + .09);
        engine.frequency.exponentialRampToValueAtTime(112, now + duration);
        throttle.type = 'square';
        throttle.frequency.value = 29;
        throttleDepth.gain.value = .024;
        filter.type = 'lowpass';
        filter.frequency.value = 930;
        gain.gain.setValueAtTime(.001, now);
        gain.gain.exponentialRampToValueAtTime(.12, now + .035);
        gain.gain.setValueAtTime(.12, now + .23);
        gain.gain.exponentialRampToValueAtTime(.001, now + duration);
        throttle.connect(throttleDepth).connect(gain.gain);
        engine.connect(filter).connect(gain).connect(audio.destination);
        engine.start(now);
        throttle.start(now);
        engine.stop(now + duration);
        throttle.stop(now + duration);
        noise(.3, .19, 1650);
      };
      switch (kind) {
        case 'coin':
          tone(880, 1100, .085, .12, 'sine');
          tone(1320, 1500, .13, .11, 'sine', .075);
          break;
        case 'life':
          [523, 659, 784, 1047].forEach((note, i) => tone(note, note * 1.03, .16, .12, 'triangle', i * .105));
          break;
        case 'attackJavier':
          chainsaw();
          break;
        case 'attackKarina':
          tone(430, 1250, .2, .16, 'triangle');
          noise(.13, .13, 2900, .025);
          break;
        case 'attackPatricia':
        case 'dash':
          noise(.2, .16, 850);
          tone(330, 105, .2, .08, 'sawtooth');
          break;
        case 'hit':
        case 'stomp':
          noise(.105, .15, 620);
          tone(220, 85, .12, .09, 'triangle');
          break;
        case 'hurt':
          noise(.2, .13, 430);
          tone(300, 105, .28, .13, 'sawtooth');
          break;
        case 'roar':
          noise(.3, .18, 480);
          tone(145, 65, .34, .13, 'sawtooth');
          break;
        case 'shield':
          tone(440, 900, .26, .12, 'sine');
          tone(660, 1320, .25, .07, 'triangle', .04);
          break;
        case 'jump': tone(220, 420, .13, .075, 'sine'); break;
        case 'switch': tone(510, 760, .12, .08, 'triangle'); break;
        case 'bossShot':
          tone(370, 105, .23, .13, 'sawtooth');
          noise(.12, .1, 1050);
          break;
        case 'laugh':
          [210, 170, 195].forEach((note, i) => {
            tone(note, note * .78, .105, .075, 'sawtooth', i * .13);
            noise(.055, .035, 780, i * .13);
          });
          break;
        case 'victory':
          [523, 659, 784, 1047].forEach((note, i) => tone(note, note, .23, .11, 'triangle', i * .13));
          break;
        case 'defeat': tone(390, 110, .45, .12, 'triangle'); break;
        case 'start': tone(440, 660, .22, .09, 'triangle'); break;
        case 'mute': tone(660, 880, .09, .06); break;
      }
    } catch { /* Sound is optional. */ }
  }

  function startMusic() {
    if (muted) return;
    for (const { audio: track } of musicTracks) {
      if (track.loop && track.paused) track.play().catch(() => {});
    }
  }

  function syncMusic(dt = 0) {
    const distance = player ? Math.min(Infinity, ...enemies
      .filter(enemy => enemy.alive && enemy.type === 'piquetero')
      .map(enemy => Math.abs(enemy.x + enemy.w / 2 - player.x - player.w / 2))) : Infinity;
    if (distance < 135) crowdNearby = true;
    else if (distance > 190) crowdNearby = false;
    let active = player && player.x > 860 ? soundtrack : openingTrack;
    if (crowdNearby && player && player.x <= 1390) active = crowdTrack;
    const bossEncounter = boss && boss.alive && player && player.x > 1390;
    if (bossEncounter && bossMarchStart === null) {
      bossMarchStart = elapsed;
      bossMarch.currentTime = 0;
    }
    if (bossEncounter) active = elapsed - bossMarchStart < 7 ? bossMarch : bossTrack;
    for (const { audio: track, volume } of musicTracks) {
      if (muted || state !== 'playing') {
        track.pause();
        track.volume = 0;
        continue;
      }
      const target = track === active ? volume : 0;
      if (target && track.paused) track.play().catch(() => {});
      track.volume += (target - track.volume) * Math.min(1, dt * 4);
      if (!target && track.volume < .01) track.volume = 0;
      if (track === bossMarch && !target && track.volume === 0) track.pause();
    }
  }

  function message(text, seconds = 2) {
    ui.message.textContent = text;
    ui.message.classList.add('show');
    noticeTime = seconds;
  }

  function syncUi() {
    ui.hero.textContent = heroes[heroIndex].name;
    ui.lives.textContent = '♥ '.repeat(lives).trim() || '—';
    ui.level.textContent = '1-1';
    ui.score.textContent = String(score).padStart(6, '0');
    ui.ability.textContent = heroes[heroIndex].ability;
    ui.roster.textContent = unlockedPatricia ? 'PATRICIA ✓ DESBLOQUEADA' : 'PATRICIA 🔒';
  }

  function loadLevel(index) {
    levelIndex = index;
    const data = current();
    player = { x: 35, y: 170, w: 14, h: 22, vx: 0, vy: 0, grounded: false, facing: 1, invulnerable: 0, attackCd: 0, attackPose: 0, stride: 0, checkpoint: 35 };
    companion = { x: 12, y: 170, vx: 0, stride: 0 };
    enemies = data.enemies.map(([type, x, y]) => ({
      type, x, y, w: type === 'piquetero' ? 48 : type === 'bill' ? 19 : 17, h: type === 'bill' ? 17 : 22,
      startX: x, startY: y, direction: -1, hp: type === 'piquetero' ? 3 : 2, alive: true, phase: Math.random() * 6,
    }));
    coins = data.coins.map(([x, y]) => ({ x, y, got: false }));
    shots = [];
    particles = [];
    effects = [];
    encountered = new Set();
    boss = { x: 1615, y: 168, w: 35, h: 60, hp: 14, maxHp: 14, shotCd: 1.5, invulnerable: 0, alive: true };
    openingTrack.currentTime = 0;
    soundtrack.currentTime = 0;
    crowdTrack.currentTime = 0;
    bossTrack.currentTime = 0;
    bossMarch.pause();
    bossMarch.currentTime = 0;
    bossMarchStart = null;
    lastLaughAt = -Infinity;
    crowdNearby = false;
    conanCollected = false;
    shieldTime = 0;
    abilityCd = 0;
    cam = 0;
    elapsed = 0;
    syncUi();
    message(`NIVEL 1-1: ${data.name}`, 2.1);
  }

  function begin() {
    closeRotatePrompt();
    score = 0;
    lives = 3;
    heroIndex = 0;
    loadLevel(0);
    setState('playing');
    ui.overlay.hidden = true;
    ui.overlay.classList.remove('result');
    ui.pause.hidden = true;
    syncMusic();
    playSfx('start');
  }

  function closeRotatePrompt() {
    ui.rotate.hidden = true;
    ui.overlay.inert = false;
    ui.header.inert = false;
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (document.fullscreenEnabled) {
      document.documentElement.requestFullscreen().catch(() => {
        message('AGREGÁ EL JUEGO A INICIO PARA OCULTAR LA BARRA', 3.5);
      });
    }
  }

  function syncFullscreenButton() {
    ui.fullscreen.hidden = !document.fullscreenEnabled;
    const mobile = window.matchMedia('(max-width: 780px), (hover: none) and (pointer: coarse)').matches;
    ui.fullscreenHelp.hidden = !mobile || document.fullscreenEnabled || window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    const active = Boolean(document.fullscreenElement);
    ui.fullscreen.setAttribute('aria-label', active ? 'Salir de pantalla completa' : 'Pantalla completa');
    ui.fullscreen.setAttribute('aria-pressed', String(active));
    ui.fullscreen.textContent = active ? '⤡' : '⛶';
  }

  function requestPlay() {
    if (window.matchMedia('(max-width: 780px), (hover: none) and (pointer: coarse)').matches && !document.fullscreenElement) toggleFullscreen();
    startMusic();
    if (!portraitAllowed && window.matchMedia('(orientation: portrait) and (max-width: 780px), (orientation: portrait) and (hover: none) and (pointer: coarse)').matches) {
      ui.rotate.hidden = false;
      ui.overlay.inert = true;
      ui.header.inert = true;
      ui.playPortrait.focus();
      return;
    }
    begin();
  }

  function showEnd(win) {
    setState(win ? 'won' : 'lost');
    syncMusic();
    if (win) {
      unlockedPatricia = true;
      try { localStorage.setItem('smb-patricia-unlocked', 'yes'); } catch { /* The unlock remains available this session. */ }
      syncUi();
    }
    ui.overlay.hidden = false;
    ui.overlay.classList.add('result');
    ui.eyebrow.textContent = win ? 'NIVEL 1-1 COMPLETADO' : 'FIN DE PARTIDA';
    ui.title.innerHTML = win ? '¡LO <em>LOGRAMOS!</em>' : 'VOLVÉ A <em>INTENTARLO</em>';
    ui.body.textContent = win
      ? `Cristina fue derrotada. ¡Patricia desbloqueada para la próxima partida! Puntaje: ${score}. La Casta llegará en futuros niveles.`
      : `Sumaste ${score} puntos. Podés volver a intentar el nivel desde el comienzo.`;
    ui.play.innerHTML = win ? 'JUGAR DE NUEVO <span>▶</span>' : 'REINTENTAR <span>▶</span>';
    playSfx(win ? 'victory' : 'defeat');
  }

  function hurt() {
    if (player.invulnerable > 0 || shieldTime > 0 || state !== 'playing') return;
    lives--;
    playSfx('hurt');
    if (lives <= 0) {
      syncUi();
      showEnd(false);
      return;
    }
    player.invulnerable = 1.7;
    player.x = player.checkpoint;
    player.y = 165;
    player.vx = 0;
    player.vy = 0;
    shots = shots.filter(s => s.friendly);
    syncUi();
    message('¡CUIDADO! UNA VIDA MENOS', 1.3);
  }

  function spawnParticles(x, y, color, amount = 7) {
    for (let i = 0; i < amount; i++) {
      particles.push({ x, y, vx: (Math.random() - .5) * 95, vy: (Math.random() - .7) * 95, life: .45 + Math.random() * .3, color });
    }
  }

  function effect(type, x, y, facing = 1, duration = .24) {
    effects.push({ type, x, y, facing, life: duration, duration });
  }

  function attack() {
    if (player.attackCd > 0 || state !== 'playing') return;
    player.attackCd = heroIndex === 1 ? .32 : .44;
    player.attackPose = .28;
    if (heroIndex === 1) {
      shots.push({ x: player.x + (player.facing > 0 ? 14 : -5), y: player.y + 7, w: 11, h: 10, vx: player.facing * 270, vy: 0, friendly: true, color: '#a4e7f2', life: 1.5 });
      effect('launch', player.x + 7, player.y + 12, player.facing, .18);
    } else {
      effect('slash', player.x + 7, player.y + 10, player.facing, .25);
      const hit = { x: player.facing > 0 ? player.x + 8 : player.x - 29, y: player.y - 5, w: 35, h: 30 };
      for (const enemy of enemies) {
        if (enemy.alive && overlap(hit, enemy)) damageEnemy(enemy, 2);
      }
      if (boss && boss.alive && boss.invulnerable <= 0 && overlap(hit, boss)) damageBoss(2);
    }
    playSfx(['attackJavier', 'attackKarina', 'attackPatricia'][heroIndex]);
  }

  function ability() {
    if (abilityCd > 0 || state !== 'playing') return;
    abilityCd = heroIndex === 1 ? 6 : 5;
    if (heroIndex === 1) {
      shieldTime = 1.8;
      effect('shield', player.x + 7, player.y + 10, 1, .45);
      message('ESCUDO ESTRATÉGICO', .9);
      playSfx('shield');
    } else if (heroIndex === 0) {
      message('¡RUGIDO DEL LEÓN!', .9);
      effect('roar', player.x + 7, player.y + 10, player.facing, .5);
      shots = shots.filter(shot => shot.friendly || Math.abs(shot.x - player.x) > 125);
      enemies.forEach(enemy => { if (enemy.alive && Math.abs(enemy.x - player.x) < 90) damageEnemy(enemy, 2); });
      if (boss && boss.alive && Math.abs(boss.x - player.x) < 95) damageBoss(2);
      spawnParticles(player.x + 7, player.y + 7, '#ffe07a', 20);
      playSfx('roar');
    } else {
      const oldX = player.x;
      player.x = clamp(player.x + player.facing * 62, 0, WORLD - player.w);
      effect('dash', oldX + 7, player.y + 10, player.facing, .38);
      player.invulnerable = .65;
      for (const enemy of enemies) if (enemy.alive && Math.abs(enemy.x - player.x) < 35) damageEnemy(enemy, 2);
      if (boss && boss.alive && Math.abs(boss.x - player.x) < 46) damageBoss(2);
      message('¡EMBESTIDA!', .8);
      playSfx('dash');
    }
  }

  function switchHero() {
    heroIndex = (heroIndex + 1) % (unlockedPatricia ? heroes.length : 2);
    player.attackPose = 0;
    syncUi();
    message(`AHORA JUGÁS CON ${heroes[heroIndex].name}`, 1);
    playSfx('switch');
  }

  function damageEnemy(enemy, amount) {
    enemy.hp -= amount;
    playSfx('hit');
    spawnParticles(enemy.x + enemy.w / 2, enemy.y + 8, '#ffe2a3', 12);
    effect('hit', enemy.x + enemy.w / 2, enemy.y + 9, 1, .22);
    if (enemy.hp <= 0) {
      enemy.alive = false;
      score += enemy.type === 'bill' ? 180 : 120;
      maybeLaugh();
      syncUi();
    }
  }

  function maybeLaugh() {
    if (heroIndex !== 0 || elapsed - lastLaughAt < 10 || Math.random() >= .25) return;
    lastLaughAt = elapsed;
    playSfx('laugh');
  }

  function damageBoss(amount) {
    if (boss.invulnerable > 0 || !boss.alive) return;
    boss.hp -= amount;
    playSfx('hit');
    boss.invulnerable = .22;
    spawnParticles(boss.x + 15, boss.y + 23, '#f37d63', 18);
    effect('hit', boss.x + 15, boss.y + 23, 1, .3);
    if (boss.hp <= 0) {
      boss.alive = false;
      maybeLaugh();
      syncMusic();
      score += 2000;
      shots = shots.filter(shot => shot.friendly);
      message('¡CRISTINA DERROTADA! LLEGÁ A LA META', 2.5);
      playSfx('victory');
      syncUi();
    }
  }

  function update(dt) {
    elapsed += dt;
    if (noticeTime > 0) {
      noticeTime -= dt;
      if (noticeTime <= 0) ui.message.classList.remove('show');
    }

    const keys = key => held.has(key) || touchHeld.has(key) || buttonHeld.has(key);
    const left = keys('ArrowLeft') || keys('KeyA') || keys('left');
    const right = keys('ArrowRight') || keys('KeyD') || keys('right');
    const jump = jumpQueued || keys('Space') || keys('ArrowUp') || keys('KeyW') || keys('jump');
    const fire = attackQueued || keys('KeyJ') || keys('attack');
    if (abilityQueued) { ability(); abilityQueued = false; }
    if (switchQueued) { switchHero(); switchQueued = false; }
    if (fire) attack();
    attackQueued = false;

    const hero = heroes[heroIndex];
    player.attackCd = Math.max(0, player.attackCd - dt);
    player.attackPose = Math.max(0, player.attackPose - dt);
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    boss.invulnerable = Math.max(0, boss.invulnerable - dt);
    shieldTime = Math.max(0, shieldTime - dt);
    abilityCd = Math.max(0, abilityCd - dt);
    player.vx = (Number(right) - Number(left)) * hero.speed;
    if (player.vx) player.facing = Math.sign(player.vx);
    if (jump && player.grounded) {
      player.vy = -hero.jump;
      player.grounded = false;
      playSfx('jump');
    }
    jumpQueued = false;

    const platforms = floorRects();
    const oldX = player.x;
    player.x = clamp(player.x + player.vx * dt, 0, WORLD - player.w);
    for (const p of platforms) {
      if (!overlap(player, p)) continue;
      if (oldX + player.w <= p.x + 2) player.x = p.x - player.w;
      else if (oldX >= p.x + p.w - 2) player.x = p.x + p.w;
    }
    if (player.grounded) player.stride += Math.abs(player.x - oldX) / 14;

    const oldBottom = player.y + player.h;
    const oldTop = player.y;
    player.vy = Math.min(player.vy + GRAVITY * dt, 470);
    player.y += player.vy * dt;
    player.grounded = false;
    for (const p of platforms) {
      if (!overlap(player, p)) continue;
      if (player.vy >= 0 && oldBottom <= p.y + 4) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.grounded = true;
      } else if (player.vy < 0 && oldTop >= p.y + p.h - 3) {
        player.y = p.y + p.h;
        player.vy = 0;
      }
    }
    if (player.y > H + 35) hurt();
    if (player.x > 850) player.checkpoint = 965;
    if (player.x > 1370) player.checkpoint = 1410;
    const companionX = companion.x;
    companion.x += (player.x - player.facing * 31 - companion.x) * Math.min(1, dt * 6);
    companion.vx = (companion.x - companionX) / Math.max(dt, .001);
    companion.stride += Math.abs(companion.x - companionX) / 14;
    companion.y += (player.y - companion.y) * Math.min(1, dt * 9);
    cam = clamp(player.x - W * .32, 0, Math.max(0, WORLD - W));
    syncMusic(dt);

    for (const coin of coins) {
      if (coin.got) continue;
      if (overlap(player, { x: coin.x - 5, y: coin.y - 6, w: 10, h: 12 })) {
        coin.got = true;
        score += 100;
        spawnParticles(coin.x, coin.y, '#ffe789', 5);
        playSfx('coin');
        syncUi();
      }
    }
    if (!conanCollected && Math.abs(player.x - 850) < 16 && Math.abs(player.y + player.h - 230) < 20) {
      conanCollected = true;
      const gainedLife = lives < 3;
      lives = Math.min(3, lives + 1);
      score += 250;
      spawnParticles(850, 210, '#ffe493', 15);
      message(gainedLife ? '¡CONAN TE DA UNA VIDA!' : '¡CONAN TE DA 250 PUNTOS!', 1.4);
      playSfx(gainedLife ? 'life' : 'coin');
      syncUi();
    }

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      if (!encountered.has(enemy.type) && enemy.x > player.x && enemy.x - player.x < 105) {
        encountered.add(enemy.type);
        const introductions = { piquetero: 'APARECEN LOS PIQUETEROS', noqui: 'CUIDADO CON LOS ÑOQUIS', bill: 'SE DISPARA LA INFLACIÓN' };
        message(introductions[enemy.type], 3.2);
      }
      enemy.phase += dt;
      if (enemy.type === 'bill') {
        enemy.x = enemy.startX + Math.sin(enemy.phase * 1.6) * 24;
        enemy.y = enemy.startY + Math.sin(enemy.phase * 2.1) * 9;
      } else {
        enemy.x += enemy.direction * (enemy.type === 'noqui' ? 43 : 28) * dt;
        if (Math.abs(enemy.x - enemy.startX) > 42) enemy.direction *= -1;
        if (enemy.type === 'noqui') enemy.y = enemy.startY - Math.abs(Math.sin(enemy.phase * 2.2)) * 19;
      }
      if (overlap(player, enemy)) {
        if (oldBottom <= enemy.y + 7 && player.vy > 0 && enemy.type !== 'bill') {
          damageEnemy(enemy, 3);
          player.vy = -190;
          playSfx('stomp');
        } else hurt();
      }
    }

    if (boss && boss.alive) {
      boss.y = 167 + Math.sin(elapsed * 1.9) * 8;
      boss.shotCd -= dt;
      if (boss.shotCd <= 0 && Math.abs(player.x - boss.x) < 420) {
        boss.shotCd = boss.hp < 7 ? .95 : 1.5;
        for (let i = -1; i <= 1; i++) {
          shots.push({ x: boss.x - 6, y: boss.y + 25, w: 8, h: 7, vx: -118, vy: i * 51, friendly: false, color: '#f18d5d', life: 3 });
        }
        playSfx('bossShot');
      }
      if (overlap(player, boss)) hurt();
      if (player.x > boss.x - 18 && player.x < boss.x + boss.w) player.x = boss.x - 18;
    }

    for (const shot of shots) {
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      shot.life -= dt;
      if (shot.friendly) {
        for (const enemy of enemies) {
          if (shot.life <= 0 || !enemy.alive || !overlap(shot, enemy)) continue;
          damageEnemy(enemy, 1);
          shot.life = 0;
        }
        if (boss && boss.alive && shot.life > 0 && overlap(shot, boss)) {
          damageBoss(1);
          shot.life = 0;
        }
      } else if (overlap(player, shot)) {
        shot.life = 0;
        hurt();
      }
    }
    shots = shots.filter(s => s.life > 0 && s.x > cam - 40 && s.x < cam + W + 45 && s.y > -20 && s.y < H + 20);
    for (const particle of particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 160 * dt;
      particle.life -= dt;
    }
    particles = particles.filter(p => p.life > 0);
    for (const item of effects) item.life -= dt;
    effects = effects.filter(item => item.life > 0);
    if (player.x > WORLD - 72 && !boss.alive) {
      score += 500;
      showEnd(true);
    }
  }

  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  function text(label, x, y, color = '#fff', size = 8, align = 'left') {
    ctx.font = `bold ${Math.max(size, 11)}px Arial, sans-serif`;
    ctx.textAlign = align;
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#08111b';
    ctx.strokeText(label, Math.round(x), Math.round(y));
    ctx.fillStyle = color;
    ctx.fillText(label, Math.round(x), Math.round(y));
    ctx.textAlign = 'left';
  }

  function background() {
    const data = current();
    if (levelIndex === 0) {
      const sky = ctx.createLinearGradient(0, 0, 0, 195);
      sky.addColorStop(0, '#78b6c8');
      sky.addColorStop(1, '#c9d8bf');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.fillStyle = '#fff0ba';
      ctx.shadowColor = '#ffefbd';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(355 - cam * .05, 48, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#eaf0db';
      ctx.globalAlpha = .36;
      for (let i = 0; i < 5; i++) {
        const x = i * 145 - cam * .07 + 25;
        ctx.beginPath();
        ctx.ellipse(x, 58 + i % 2 * 24, 25, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (levelIndex === 1) {
      rect(0, 0, W, H, data.sky);
      rect(0, 96, W, 134, '#3b3b64');
      rect(390 - cam * .05, 38, 27, 27, '#e2b78b');
    } else {
      rect(0, 0, W, H, data.sky);
      rect(0, 100, W, 130, '#323952');
      rect(390 - cam * .05, 35, 27, 27, '#a4b9c6');
    }
    for (let i = -1; i < 14; i++) {
      const x = i * 63 - (cam * .18 % 63);
      const tall = 34 + (i * 19 % 42);
      rect(x, 153 - tall, 52, tall + 78, data.far);
      rect(x - 2, 151 - tall, 56, 3, '#688fa0');
      for (let wx = 8; wx < 48; wx += 15) for (let wy = 9; wy < tall; wy += 15) rect(x + wx, 153 - tall + wy, 4, 6, '#d0bc91');
    }
    if (levelIndex === 0) {
      const x = 155 - cam * .18;
      rect(x - 7, 150, 25, 5, '#d9d0bb');
      rect(x - 4, 145, 19, 5, '#eee2c9');
      rect(x, 72, 11, 73, '#e7ddc9');
      rect(x + 2, 66, 7, 6, '#f4e7ce');
      ctx.fillStyle = '#f4e7ce';
      ctx.beginPath();
      ctx.moveTo(x + 2, 66);
      ctx.lineTo(x + 5.5, 59);
      ctx.lineTo(x + 9, 66);
      ctx.fill();
      rect(x + 3, 82, 2, 3, '#8da6a4');
      rect(x + 7, 82, 2, 3, '#8da6a4');
    }
    for (let i = -1; i < 11; i++) {
      const x = i * 83 - (cam * .36 % 83);
      const tall = 37 + (i * 23 % 43);
      rect(x, 196 - tall, 70, tall + 38, data.near);
      rect(x - 1, 193 - tall, 72, 3, '#263f53');
      rect(x + 3, 196 - tall, 3, tall + 38, '#506981');
      rect(x + 9, 196 - tall + 8, 13, 17, '#7d98a0');
      rect(x + 9, 196 - tall + 8, 13, 2, '#bfd0be');
      rect(x + 42, 196 - tall + 8, 13, 17, '#7d98a0');
      rect(x + 42, 196 - tall + 8, 13, 2, '#bfd0be');
      rect(x + 29, 196 - 29, 12, 29, '#152238');
    }
    const castleX = 1500 - cam;
    if (castleX < W && castleX + 260 > 0) {
      rect(castleX, 82, 260, 148, '#263349');
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 13; col++) {
          const bx = castleX + col * 20 + (row % 2 ? 8 : 0);
          rect(bx, 82 + row * 15, 18, 13, (row + col) % 3 === 0 ? '#39475a' : '#303e52');
        }
      }
      rect(castleX + 80, 103, 100, 126, '#111824');
      rect(castleX + 92, 113, 76, 117, '#4b2b34');
      rect(castleX + 102, 120, 56, 110, '#603840');
      rect(castleX + 63, 89, 134, 23, '#742f36');
      rect(castleX + 67, 92, 126, 17, '#2a1d2b');
      text('INFLACIÓN', castleX + 130, 104, '#ffd596', 9, 'center');
      rect(castleX + 57, 126, 7, 28, '#df8d3d');
      rect(castleX + 196, 126, 7, 28, '#df8d3d');
      rect(castleX + 56, 123, 9, 7, '#f9d26b');
      rect(castleX + 195, 123, 9, 7, '#f9d26b');
    }
    for (const signX of [80, 630, 1120]) {
      const x = signX - cam;
      if (x < -30 || x > W + 30) continue;
      rect(x, 143, 3, 87, '#3c4146');
      rect(x - 12, 129, 27, 23, '#d1a254');
      rect(x - 10, 131, 23, 19, '#794c2d');
      text('♌', x + 1, 145, '#ffe093', 15, 'center');
    }
  }

  function ground() {
    for (const [a, b] of current().ground) {
      const sx = a - cam;
      if (sx > W || b - cam < 0) continue;
      rect(sx, 230, b - a, 40, levelIndex === 0 ? '#415465' : '#707d82');
      rect(sx, 230, b - a, 4, levelIndex === 0 ? '#d9bf92' : '#adbb9e');
      rect(sx, 234, b - a, 4, '#7d8d8d');
      for (let x = a; x < b; x += 20) {
        const screen = x - cam;
        if (screen < -25 || screen > W) continue;
        rect(screen, 239, 1, 6, '#273b4b');
        rect(screen + 3, 253, 11, 2, '#b5b9aa');
      }
    }
    for (const [x, y, w] of current().ledges) {
      const sx = x - cam;
      if (sx > W || sx + w < 0) continue;
      rect(sx, y, w, 12, '#263b4d');
      rect(sx, y, w, 4, '#d5a66d');
      for (let i = 0; i < w; i += 16) rect(sx + i, y + 5, 2, 7, '#799198');
    }
  }

  function drawCoin(coin) {
    if (coin.got) return;
    const x = Math.round(coin.x - cam);
    const y = Math.round(coin.y + Math.sin(elapsed * 5 + coin.x) * 2);
    ctx.fillStyle = '#9d6729';
    ctx.beginPath();
    ctx.ellipse(x, y, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe381';
    ctx.beginPath();
    ctx.ellipse(x - 1, y - 1, 3.5, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    rect(x - 2, y - 4, 1, 6, '#fff5bf');
  }

  function drawHero(x, y, who, active, facing = 1, motion = null) {
    x = Math.round(x - cam);
    y = Math.round(y);
    const animated = heroes[who].sprite;
    const sheet = animated && animated.complete && animated.naturalWidth ? animated : who === 2 ? sprites.patricia : sprites.heroes;
    const ready = sheet.complete && sheet.naturalWidth > 0;
    if (ready) {
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      if (facing < 0) {
        ctx.translate(x * 2 + 14, 0);
        ctx.scale(-1, 1);
      }
      if (sheet === animated) {
        const runFrames = [1, 0, 2, 0];
        const frame = active && motion.attackPose > 0 ? 3
          : Math.abs(motion.vx) > 8 ? runFrames[Math.floor(motion.stride) % runFrames.length] : 0;
        const width = frame === 3 ? 49 : 44;
        ctx.drawImage(sheet, frame * 543, 40, 543, 610, x + 7 - width / 2, y - 24, width, 46);
      } else if (who === 2) {
        ctx.drawImage(sheet, 0, 0, sheet.naturalWidth, sheet.naturalHeight, x - 14, y - 21, 43, 43);
      } else {
        const crop = who === 0 ? [100, 0, 750, 887] : [970, 0, 770, 887];
        ctx.drawImage(sheet, ...crop, x - 15, y - 24, 44, 46);
      }
      ctx.restore();
    } else {
      rect(x - 3, y - 12, 20, 34, who === 1 ? '#e4d1ba' : '#253750');
    }
    if (active && shieldTime > 0) {
      ctx.strokeStyle = who === 1 ? '#a9f5fa' : '#ffe185';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x + 7, y + 1, 22, 27, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (active) text(heroes[who].name, x + 7, y - 24, '#fff2ae', 6, 'center');
  }

  function drawEnemy(enemy) {
    if (!enemy.alive) return;
    const x = Math.round(enemy.x - cam);
    const y = Math.round(enemy.y);
    if (enemy.type === 'piquetero' && sprites.crowd.complete && sprites.crowd.naturalWidth) {
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(sprites.crowd, x + enemy.w / 2 - 35, y + enemy.h - 46 + Math.sin(enemy.phase * 8), 70, 46);
      ctx.restore();
      return;
    }
    if (sprites.enemies.complete && sprites.enemies.naturalWidth) {
      const index = enemy.type === 'piquetero' ? 0 : enemy.type === 'bill' ? 1 : 2;
      const crops = [[35, 25, 500, 625], [555, 65, 840, 575], [1405, 55, 730, 605]];
      const sizes = [[38, 47], [51, 37], [45, 40]];
      const [sx, sy, sw, sh] = crops[index];
      const [width, height] = sizes[index];
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.translate(x + enemy.w / 2, y + enemy.h);
      ctx.scale(-1, 1);
      ctx.drawImage(sprites.enemies, sx, sy, sw, sh, -width / 2, -height, width, height);
      ctx.restore();
    } else {
      rect(x, y, enemy.w, enemy.h, enemy.type === 'bill' ? '#7ed276' : '#c75b58');
    }
  }

  function drawEffects() {
    for (const item of effects) {
      const x = item.x - cam;
      const y = item.y;
      const progress = 1 - item.life / item.duration;
      ctx.save();
      ctx.globalAlpha = Math.min(1, item.life / .12);
      ctx.lineCap = 'round';
      if (item.type === 'slash') {
        ctx.translate(x, y);
        ctx.scale(item.facing, 1);
        ctx.strokeStyle = '#fff4c1';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(4, 0, 29, -.95 + progress * .65, .8 + progress * .65);
        ctx.stroke();
        ctx.strokeStyle = '#f59a3e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(4, 0, 34, -.95 + progress * .65, .8 + progress * .65);
        ctx.stroke();
        for (let i = 0; i < 4; i++) rect(15 + i * 5, -12 + i * 8, 4, 3, '#ffe396');
      } else if (item.type === 'roar' || item.type === 'shield') {
        const radius = item.type === 'roar' ? 18 + progress * 82 : 17 + progress * 14;
        ctx.strokeStyle = item.type === 'roar' ? '#ffd05d' : '#9ceff8';
        ctx.lineWidth = item.type === 'roar' ? 5 - progress * 3 : 3;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (item.type === 'launch') {
        ctx.fillStyle = '#c7fcff';
        ctx.beginPath();
        ctx.arc(x + item.facing * (8 + progress * 9), y, 10 * (1 - progress), 0, Math.PI * 2);
        ctx.fill();
      } else if (item.type === 'dash') {
        ctx.strokeStyle = '#f7d76a';
        ctx.lineWidth = 4;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(x - item.facing * (i * 9), y - 11 + i * 10);
          ctx.lineTo(x + item.facing * (62 - progress * 24), y - 11 + i * 10);
          ctx.stroke();
        }
      } else {
        ctx.strokeStyle = '#fff2ac';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 6 + progress * 18, 0, Math.PI * 2);
        ctx.stroke();
        for (let i = 0; i < 8; i++) {
          const a = i * Math.PI / 4;
          const r = 8 + progress * 19;
          ctx.beginPath();
          ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
          ctx.lineTo(x + Math.cos(a) * (r + 7), y + Math.sin(a) * (r + 7));
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  function drawBoss() {
    if (!boss || !boss.alive) return;
    const x = Math.round(boss.x - cam);
    const y = Math.round(boss.y);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (boss.invulnerable > 0) ctx.globalAlpha = .55 + .45 * Math.sin(elapsed * 48) ** 2;
    if (sprites.cristina.complete && sprites.cristina.naturalWidth) {
      ctx.drawImage(sprites.cristina, x - 22, y - 14, 79, 73);
    } else {
      rect(x - 5, y, 48, 58, '#9b3156');
    }
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = false;
    text('CRISTINA', x + 19, y - 24, '#ffe38c', 7, 'center');
    rect(x - 4, y - 44, 45, 4, '#311d28');
    rect(x - 4, y - 44, 45 * boss.hp / boss.maxHp, 4, '#e56d60');
  }

  function drawFinish() {
    const x = WORLD - 65 - cam;
    rect(x, 159, 3, 71, '#f7ead0');
    rect(x + 3, 159, 30, 18, '#f1c659');
    rect(x + 3, 177, 23, 6, '#e16a4b');
    text('META', x + 16, 171, '#17253b', 7, 'center');
    if (!boss.alive && x > -50 && x < W + 50) {
      if (sprites.patricia.complete && sprites.patricia.naturalWidth) {
        ctx.drawImage(sprites.patricia, x - 54, 188, 41, 43);
      }
      text('PATRICIA', x - 35, 183, '#f6eccb', 7, 'center');
    }
  }

  function drawConan() {
    if (conanCollected) return;
    const x = 850 - cam;
    if (x < -30 || x > W + 30) return;
    rect(x - 10, 217, 24, 11, '#7b5848');
    rect(x + 7, 209, 11, 12, '#87644f');
    rect(x + 9, 205, 5, 7, '#5b3c31');
    rect(x + 16, 207, 4, 9, '#5b3c31');
    rect(x + 14, 214, 2, 2, '#f1e6ce');
    rect(x - 8, 226, 4, 4, '#392d2b');
    rect(x + 5, 226, 4, 4, '#392d2b');
    text('CONAN ♥', x + 2, 202, '#fff0ba', 7, 'center');
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    background();
    ground();
    for (const coin of coins) drawCoin(coin);
    for (const enemy of enemies) drawEnemy(enemy);
    drawConan();
    drawBoss();
    drawFinish();
    for (const shot of shots) {
      const x = shot.x - cam + shot.w / 2;
      const y = shot.y + shot.h / 2;
      ctx.save();
      ctx.shadowBlur = shot.friendly ? 13 : 7;
      ctx.shadowColor = shot.friendly ? '#5cefff' : '#ff754f';
      ctx.fillStyle = shot.color;
      ctx.beginPath();
      ctx.arc(x, y, shot.friendly ? 6 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      rect(x - Math.sign(shot.vx) * 11, y - 1, 6, 2, shot.friendly ? '#d7ffff' : '#ffb18a');
    }
    drawHero(companion.x, companion.y, heroIndex === 0 ? 1 : 0, false, player.facing, companion);
    if (player.invulnerable <= 0 || Math.floor(elapsed * 12) % 2 === 0) drawHero(player.x, player.y, heroIndex, true, player.facing, player);
    drawEffects();
    for (const p of particles) rect(p.x - cam, p.y, 2, 2, p.color);
    if (boss && boss.alive && player.x > 1370) {
      text('JEFA INTERMEDIA', W / 2, 91, '#ffe09d', 9, 'center');
    }
  }

  function frame(now) {
    const dt = Math.min((now - lastFrame) / 1000, .033);
    lastFrame = now;
    if (state === 'playing') update(dt);
    if (player) draw();
    requestAnimationFrame(frame);
  }

  const keyMap = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space', 'KeyA', 'KeyD', 'KeyW', 'KeyJ', 'KeyK', 'KeyQ', 'KeyP', 'Enter']);
  window.addEventListener('keydown', event => {
    if (!ui.rotate.hidden && event.code === 'Escape') {
      closeRotatePrompt();
      ui.play.focus();
      return;
    }
    if (!ui.rotate.hidden && event.code === 'Tab') {
      if (event.shiftKey && document.activeElement === ui.playPortrait) {
        event.preventDefault();
        ui.rotateBack.focus();
      } else if (!event.shiftKey && document.activeElement === ui.rotateBack) {
        event.preventDefault();
        ui.playPortrait.focus();
      }
    }
    if (!ui.rotate.hidden) return;
    if (keyMap.has(event.code)) event.preventDefault();
    if (event.repeat) { held.add(event.code); return; }
    held.add(event.code);
    if (event.code === 'KeyQ') switchQueued = true;
    if (event.code === 'KeyJ') attackQueued = true;
    if (event.code === 'KeyK') abilityQueued = true;
    if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') jumpQueued = true;
    if (event.code === 'KeyP') togglePause();
    if (event.code === 'Enter' && ui.rotate.hidden && (state === 'menu' || state === 'won' || state === 'lost')) requestPlay();
  });
  window.addEventListener('keyup', event => held.delete(event.code));
  window.addEventListener('blur', () => {
    held.clear();
    touchHeld.clear();
    if (state === 'playing') togglePause();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'playing') togglePause();
  });
  const setMoveDirection = x => {
    const bounds = canvas.getBoundingClientRect();
    const side = x < bounds.left + bounds.width / 4 ? 'left' : 'right';
    touchHeld.delete('left');
    touchHeld.delete('right');
    touchHeld.add(side);
  };
  canvas.addEventListener('pointerdown', event => {
    if (state !== 'playing' || event.button !== 0
      || (event.pointerType === 'mouse' && !window.matchMedia('(max-width: 780px)').matches)) return;
    event.preventDefault();
    const bounds = canvas.getBoundingClientRect();
    const inMoveZone = event.clientX < bounds.left + bounds.width / 2;
    const moving = inMoveZone && ![...activeTouches.values()].some(touch => touch.moving);
    activeTouches.set(event.pointerId, { moving, ignored: inMoveZone && !moving, x: event.clientX, y: event.clientY, gestured: false });
    canvas.setPointerCapture(event.pointerId);
    if (moving) setMoveDirection(event.clientX);
  });
  canvas.addEventListener('pointermove', event => {
    const touch = activeTouches.get(event.pointerId);
    if (!touch || touch.ignored || state !== 'playing') return;
    event.preventDefault();
    if (touch.moving) {
      setMoveDirection(event.clientX);
      return;
    }
    if (touch.gestured) return;
    const dx = event.clientX - touch.x;
    const dy = event.clientY - touch.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return;
    touch.gestured = true;
    if (Math.abs(dx) > Math.abs(dy)) attackQueued = true;
    else if (dy < 0) abilityQueued = true;
    else switchQueued = true;
  });
  const releaseTouch = event => {
    const touch = activeTouches.get(event.pointerId);
    if (!touch) return;
    activeTouches.delete(event.pointerId);
    if (!touch.moving && !touch.ignored && !touch.gestured && state === 'playing' && event.type === 'pointerup') jumpQueued = true;
    if (touch.moving) {
      touchHeld.delete('left');
      touchHeld.delete('right');
    }
  };
  canvas.addEventListener('pointerup', releaseTouch);
  canvas.addEventListener('pointercancel', releaseTouch);
  canvas.addEventListener('lostpointercapture', releaseTouch);
  canvas.addEventListener('contextmenu', event => {
    if (state === 'playing') event.preventDefault();
  });
  canvas.addEventListener('dblclick', event => {
    if (state === 'playing') event.preventDefault();
  });
  const controls = document.querySelectorAll('.mobile-controls button');
  const pressControl = control => {
    if (control === 'jump') jumpQueued = true;
    else if (control === 'attack') attackQueued = true;
    else if (control === 'ability') abilityQueued = true;
    else if (control === 'switch') switchQueued = true;
  };
  controls.forEach(button => {
    const control = button.dataset.control;
    button.addEventListener('pointerdown', event => {
      if (state !== 'playing' || event.button !== 0) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      controlPointers.set(event.pointerId, control);
      button.classList.add('is-held');
      if (control === 'left' || control === 'right') buttonHeld.add(control);
      else pressControl(control);
    });
    const release = event => {
      if (controlPointers.get(event.pointerId) !== control) return;
      controlPointers.delete(event.pointerId);
      if (![...controlPointers.values()].includes(control)) {
        buttonHeld.delete(control);
        button.classList.remove('is-held');
      }
    };
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
    button.addEventListener('click', event => {
      if (event.detail === 0 && state === 'playing') pressControl(control);
    });
    button.addEventListener('contextmenu', event => event.preventDefault());
  });
  ui.play.addEventListener('click', requestPlay);
  ui.playPortrait.addEventListener('click', () => {
    portraitAllowed = true;
    if (!document.fullscreenElement) toggleFullscreen();
    begin();
  });
  ui.rotateBack.addEventListener('click', () => {
    closeRotatePrompt();
    syncMusic();
    ui.play.focus();
  });
  window.addEventListener('resize', () => {
    syncFullscreenButton();
    if (!ui.rotate.hidden && window.matchMedia('(orientation: landscape)').matches) begin();
  });
  ui.mobilePause.addEventListener('click', togglePause);
  ui.fullscreen.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', syncFullscreenButton);
  ui.resume.addEventListener('click', togglePause);
  ui.mute.addEventListener('click', () => {
    muted = !muted;
    ui.mute.setAttribute('aria-pressed', String(!muted));
    ui.mute.setAttribute('aria-label', muted ? 'Activar sonido' : 'Silenciar');
    ui.mute.textContent = muted ? '♪' : '♫';
    if (!muted && state === 'playing') startMusic();
    syncMusic();
    playSfx('mute');
  });
  loadLevel(0);
  setState('menu');
  syncFullscreenButton();
  resizeCanvas();
  new ResizeObserver(resizeCanvas).observe(document.querySelector('.stage-shell'));
  ui.message.classList.remove('show');
  requestAnimationFrame(frame);
})();
