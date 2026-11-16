const root = document.documentElement;
const modeSwitch = document.querySelector('#modeSwitch');
const themeMeta = document.querySelector('meta[name="theme-color"]');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const touchInputPreference = matchMedia('(pointer: coarse)');

function setMode(mode) {
  root.dataset.mode = mode;
  modeSwitch.setAttribute('aria-pressed', String(mode === 'geek'));
  themeMeta.content = mode === 'geek' ? '#090a0a' : '#f2efe8';
  try { localStorage.setItem('aos-mode', mode); } catch {}
}

let savedMode = 'normal';
try { savedMode = localStorage.getItem('aos-mode') === 'geek' ? 'geek' : 'normal'; } catch {}
setMode(savedMode);
modeSwitch.addEventListener('click', () => {
  const mode = root.dataset.mode === 'geek' ? 'normal' : 'geek';
  setMode(mode);
  if (mode === 'geek') {
    if (heroFrame) cancelAnimationFrame(heroFrame);
    heroFrame = 0;
    heroMotion.paused = true;
    drawHeroLogo();
    ensureLogoParticles();
    startLogoMotion();
  } else {
    if (logoFrame) cancelAnimationFrame(logoFrame);
    logoFrame = 0;
    logoState.paused = true;
    heroMotion.paused = false;
    drawLogo();
    drawHeroLogo();
    startHeroMotion();
  }
});
const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
}), { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// The Geek emblem is reconstructed from the active vector logo as a high-density particle field.
const logoCanvas = document.querySelector('#digitalLogo');
const logoContext = logoCanvas.getContext('2d');
const logoInteractionHint = document.querySelector('#logoInteractionHint');
const logoImage = new Image();
const heroContainer = document.querySelector('#heroLogo');
const heroCanvas = document.querySelector('#heroLogoFan');
const heroContext = heroCanvas.getContext('2d');
const heroToggle = document.querySelector('#heroLogoToggle');
const heroBase = document.querySelector('#heroLogoBase');
const heroBlades = document.createElement('canvas');
const heroFan = {
  centerX: 626,
  centerY: 456,
  hubRadius: 74,
  blades: [
    [[200, 409], [246, 385], [489, 377], [551, 406], [535, 450], [471, 462]],
    [[703, 406], [764, 377], [1007, 385], [1053, 409], [781, 462], [718, 450]]
  ]
};
const heroMotion = { angle: 0, speed: 0.2, paused: false, dragging: false, moved: false, lastPointerAngle: 0, lastPointerTime: 0, touchGesture: false, touchDidSpin: false, touchWasPaused: false, touchStartX: 0, touchStartY: 0, touchLastX: 0 };
let heroFrame = 0;
let heroLastFrameTime = 0;
let heroLogoVisible = false;
const particleSource = document.createElement('canvas');
const particleContext = particleSource.getContext('2d', { willReadFrequently: true });
const logoParticles = [];
let logoParticlesReady = false;
const particleLayers = [];
const ambientParticles = [];
const logoPointer = { x: -1000, y: -1000, active: false };
const logoState = { angle: 0, speed: .012, yaw: 0, pitch: 0, paused: false, dragging: false, lastPointerAngle: 0, moved: false, lastFrame: 0, width: 0, height: 0, dpr: 1, touchGesture: false, touchDidSpin: false, touchWasPaused: false, touchStartX: 0, touchStartY: 0, touchLastX: 0 };
let logoFrame = 0;
let logoCanvasVisible = false;
let logoUserPaused = false;
const fan = { centerX: heroFan.centerX / 1254, centerY: heroFan.centerY / 1254 };
const particleAccent = getComputedStyle(root).getPropertyValue('--accent').trim() || '#D4AA60';

function traceHeroBlades(context) {
  context.beginPath();
  heroFan.blades.forEach(points => {
    context.moveTo(points[0][0], points[0][1]);
    points.slice(1).forEach(([x, y]) => context.lineTo(x, y));
    context.closePath();
  });
}

function prepareHeroLogo() {
  const width = logoImage.naturalWidth;
  const height = logoImage.naturalHeight;
  [heroBase, heroBlades, heroCanvas].forEach(layer => { layer.width = width; layer.height = height; });

  const baseContext = heroBase.getContext('2d');
  baseContext.drawImage(logoImage, 0, 0);
  const basePixels = baseContext.getImageData(0, 0, width, height);
  const hubKeepRadiusSquared = (heroFan.hubRadius + 4) ** 2;
  for (let y = 365; y <= 475; y++) {
    for (let x = 185; x <= 1065; x++) {
      const dx = x - heroFan.centerX, dy = y - heroFan.centerY;
      if (dx * dx + dy * dy <= hubKeepRadiusSquared) continue;
      const i = (y * width + x) * 4;
      const red = basePixels.data[i], green = basePixels.data[i + 1], blue = basePixels.data[i + 2];
      const brightest = Math.max(red, green, blue), darkest = Math.min(red, green, blue);
      if (brightest > 4 && brightest - darkest < 32) {
        basePixels.data[i] = basePixels.data[i + 1] = basePixels.data[i + 2] = 0;
        basePixels.data[i + 3] = 255;
      }
    }
  }
  baseContext.putImageData(basePixels, 0, 0);

  const bladeContext = heroBlades.getContext('2d');
  bladeContext.save();
  traceHeroBlades(bladeContext);
  bladeContext.clip();
  bladeContext.drawImage(logoImage, 0, 0);
  bladeContext.restore();

  drawHeroLogo();
  if (!heroMotion.paused && root.dataset.mode === 'normal') startHeroMotion();
}

function drawHeroLogo() {
  if (!logoImage.complete || !logoImage.naturalWidth || !heroBase.width) return;
  heroContext.clearRect(0, 0, heroCanvas.width, heroCanvas.height);
  heroContext.save();
  heroContext.translate(heroFan.centerX, heroFan.centerY);
  heroContext.rotate(heroMotion.angle);
  heroContext.drawImage(heroBlades, -heroFan.centerX, -heroFan.centerY);
  heroContext.restore();
  heroContext.globalCompositeOperation = 'destination-out';
  heroContext.beginPath();
  heroContext.arc(heroFan.centerX, heroFan.centerY, heroFan.hubRadius, 0, Math.PI * 2);
  heroContext.fill();
  heroContext.globalCompositeOperation = 'source-over';
  const paused = String(heroMotion.paused || motionPreference.matches);
  if (heroContainer.dataset.paused !== paused) {
    heroContainer.dataset.paused = paused;
    const interactionHint = touchInputPreference.matches
      ? 'Tap the emblem to pause or resume. Swipe horizontally to spin it.'
      : 'Drag around the hub to redirect the fans. Use the adjacent control or Space to pause or resume.';
    heroContainer.setAttribute('aria-label', `Animated Academy of Science logo. Fans ${paused === 'true' ? 'paused' : 'spinning'}. ${interactionHint}`);
    heroToggle.textContent = motionPreference.matches ? 'Motion reduced' : (heroMotion.paused ? 'Start emblem' : 'Pause emblem');
    heroToggle.disabled = motionPreference.matches;
    heroToggle.setAttribute('aria-pressed', String(!heroMotion.paused && !motionPreference.matches));
  }
}

function animateHeroLogo(timestamp) {
  heroFrame = 0;
  if (root.dataset.mode !== 'normal' || heroMotion.paused || motionPreference.matches || document.hidden) return;
  const elapsed = heroLastFrameTime ? Math.min((timestamp - heroLastFrameTime) / 1000, 0.05) : 0;
  heroLastFrameTime = timestamp;
  heroMotion.angle += heroMotion.speed * elapsed;
  const restingSpeed = 0.2;
  heroMotion.speed = restingSpeed + (heroMotion.speed - restingSpeed) * Math.exp(-elapsed / 2.6);
  drawHeroLogo();
  heroFrame = requestAnimationFrame(animateHeroLogo);
}

function startHeroMotion() {
  if (!heroFrame && heroLogoVisible && root.dataset.mode === 'normal' && !heroMotion.paused && !motionPreference.matches && !document.hidden) {
    heroFrame = requestAnimationFrame(animateHeroLogo);
  }
}

function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i], [xj, yj] = points[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function pointOnOrNearPolygon(x, y, points, padding = 8) {
  if (pointInPolygon(x, y, points)) return true;
  const paddingSquared = padding * padding;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i], [x2, y2] = points[(i + 1) % points.length];
    const dx = x2 - x1, dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSquared));
    const nearestX = x1 + dx * t, nearestY = y1 + dy * t;
    if ((x - nearestX) ** 2 + (y - nearestY) ** 2 <= paddingSquared) return true;
  }
  return false;
}

function pointerOnHeroBlade(event) {
  const rect = heroCanvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width * heroCanvas.width;
  const y = (event.clientY - rect.top) / rect.height * heroCanvas.height;
  const dx = x - heroFan.centerX, dy = y - heroFan.centerY;
  const c = Math.cos(heroMotion.angle), s = Math.sin(heroMotion.angle);
  const localX = heroFan.centerX + dx * c + dy * s;
  const localY = heroFan.centerY - dx * s + dy * c;
  return heroFan.blades.some(points => pointInPolygon(localX, localY, points));
}

heroCanvas.addEventListener('pointerdown', event => {
  if (event.pointerType === 'touch') {
    heroMotion.touchGesture = true;
    heroMotion.touchDidSpin = false;
    heroMotion.touchWasPaused = heroMotion.paused;
    heroMotion.touchStartX = heroMotion.touchLastX = event.clientX;
    heroMotion.touchStartY = event.clientY;
    heroMotion.lastPointerTime = event.timeStamp;
    heroMotion.paused = true;
    heroMotion.speed = 0;
    heroMotion.dragging = true;
    heroMotion.moved = false;
    heroCanvas.setPointerCapture(event.pointerId);
    drawHeroLogo();
    return;
  }
  if (!pointerOnHeroBlade(event)) return;
  heroMotion.paused = true;
  heroMotion.speed = 0;
  heroMotion.dragging = true;
  heroMotion.moved = false;
  const rect = heroCanvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width * heroCanvas.width;
  const y = (event.clientY - rect.top) / rect.height * heroCanvas.height;
  heroMotion.lastPointerAngle = Math.atan2(y - heroFan.centerY, x - heroFan.centerX);
  heroMotion.lastPointerTime = event.timeStamp;
  heroCanvas.setPointerCapture(event.pointerId);
  drawHeroLogo();
});

heroCanvas.addEventListener('pointermove', event => {
  if (heroMotion.touchGesture && event.pointerType === 'touch') {
    const totalX = event.clientX - heroMotion.touchStartX;
    const totalY = event.clientY - heroMotion.touchStartY;
    if (Math.hypot(totalX, totalY) > 8) heroMotion.moved = true;
    if (Math.abs(totalX) > 6 && Math.abs(totalX) > Math.abs(totalY) * 1.1) {
      const deltaX = event.clientX - heroMotion.touchLastX;
      heroMotion.angle += deltaX * .012;
      heroMotion.speed = Math.max(-6, Math.min(6, deltaX / Math.max((event.timeStamp - heroMotion.lastPointerTime) / 1000, 1 / 240) * .012));
      heroMotion.lastPointerTime = event.timeStamp;
      heroMotion.touchLastX = event.clientX;
      heroMotion.touchDidSpin = true;
      drawHeroLogo();
    }
    return;
  }
  if (!heroMotion.dragging) return;
  const rect = heroCanvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width * heroCanvas.width;
  const y = (event.clientY - rect.top) / rect.height * heroCanvas.height;
  const angle = Math.atan2(y - heroFan.centerY, x - heroFan.centerX);
  let delta = angle - heroMotion.lastPointerAngle;
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  const elapsed = Math.max((event.timeStamp - heroMotion.lastPointerTime) / 1000, 1 / 240);
  heroMotion.angle += delta;
  heroMotion.speed = Math.max(-12, Math.min(12, delta / elapsed));
  heroMotion.lastPointerAngle = angle;
  heroMotion.lastPointerTime = event.timeStamp;
  heroMotion.moved ||= Math.abs(delta) > 0.01;
  drawHeroLogo();
});

heroCanvas.addEventListener('pointerup', event => {
  if (heroMotion.touchGesture && event.pointerType === 'touch') {
    heroMotion.touchGesture = false;
    heroMotion.dragging = false;
    if (!heroMotion.moved) heroMotion.paused = !heroMotion.touchWasPaused;
    else heroMotion.paused = heroMotion.touchDidSpin ? false : heroMotion.touchWasPaused;
    if (!heroMotion.paused && (!heroMotion.touchDidSpin || Math.abs(heroMotion.speed) < .02)) heroMotion.speed = .2;
    heroLastFrameTime = 0;
    if (!heroMotion.paused) startHeroMotion();
    drawHeroLogo();
    return;
  }
  if (!heroMotion.dragging) return;
  heroMotion.dragging = false;
  if (!heroMotion.moved || Math.abs(heroMotion.speed) < .02) heroMotion.speed = .2;
  heroMotion.paused = false;
  heroLastFrameTime = 0;
  startHeroMotion();
  drawHeroLogo();
});
heroCanvas.addEventListener('pointercancel', () => {
  if (heroMotion.touchGesture) {
    heroMotion.touchGesture = false;
    heroMotion.dragging = false;
    heroMotion.paused = heroMotion.touchWasPaused;
    if (!heroMotion.paused) startHeroMotion();
    drawHeroLogo();
    return;
  }
  heroMotion.dragging = false;
  if (Math.abs(heroMotion.speed) < .02) heroMotion.speed = .2;
  heroMotion.paused = false;
  heroLastFrameTime = 0;
  startHeroMotion();
  drawHeroLogo();
});

heroContainer.addEventListener('keydown', event => {
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    heroMotion.paused = !heroMotion.paused;
    if (!heroMotion.paused) { heroLastFrameTime = 0; startHeroMotion(); }
    drawHeroLogo();
  } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    heroMotion.paused = false;
    heroMotion.speed = Math.max(-12, Math.min(12, heroMotion.speed + (event.key === 'ArrowRight' ? 0.5 : -0.5)));
    heroLastFrameTime = 0;
    startHeroMotion();
    drawHeroLogo();
  }
});

heroToggle.addEventListener('click', () => {
  heroMotion.paused = !heroMotion.paused;
  if (!heroMotion.paused) { heroLastFrameTime = 0; startHeroMotion(); }
  drawHeroLogo();
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) { heroLastFrameTime = 0; logoState.lastFrame = 0; startHeroMotion(); startLogoMotion(); }
});

function drawLogo() {
  if (!logoParticles.length || !logoState.width) return;
  const ctx = logoContext;
  const width = logoState.width, height = logoState.height;
  const scale = Math.min(width, height) * 1.14;
  const left = (width - scale) / 2, top = (height - scale) / 2;
  const time = performance.now() * .001;
  ctx.setTransform(logoState.dpr, 0, 0, logoState.dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';
  const yaw = .24 + logoState.yaw + Math.sin(time * .34) * .012;
  const pitch = -.035 + logoState.pitch + Math.cos(time * .27) * .009;
  const cosYaw = Math.cos(yaw), sinYaw = Math.sin(yaw);
  const cosPitch = Math.cos(pitch), sinPitch = Math.sin(pitch);
  const accentDots = [], whiteDots = [];

  function repelAndFloat(p, tx, ty, radius = 118, strength = 20, rigid = false) {
    // Keep the rotor edges clean; free-float on these samples leaves a faint
    // horizontal echo around the moving blades.
    if (!rigid) {
      tx += Math.sin(time * p.drift + p.phase) * p.float;
      ty += Math.cos(time * p.drift * .83 + p.phase) * p.float;
    }
    if (rigid) {
      if (logoPointer.active) {
        const px = tx - logoPointer.x, py = ty - logoPointer.y;
        const distance = Math.hypot(px, py);
        if (distance < radius && distance > .01) {
          const force = ((radius - distance) / radius) ** 2 * strength;
          tx += px / distance * force;
          ty += py / distance * force;
        }
      }
      p.x = tx; p.y = ty; p.vx = p.vy = 0;
      return;
    }
    let dx = tx - p.x, dy = ty - p.y;
    if (logoPointer.active) {
      const px = p.x - logoPointer.x, py = p.y - logoPointer.y;
      const distance = Math.hypot(px, py);
      if (distance < radius && distance > .01) {
        const force = ((radius - distance) / radius) ** 2 * strength;
        dx += px / distance * force;
        dy += py / distance * force;
      }
    }
    p.vx = (p.vx + dx * .055) * .84;
    p.vy = (p.vy + dy * .055) * .84;
    p.x += p.vx; p.y += p.vy;
  }

  for (const p of ambientParticles) {
    const tx = width * (.5 + p.nx), ty = height * (.5 + p.ny);
    repelAndFloat(p, tx, ty, 100, 9);
    (p.accent ? accentDots : whiteDots).push(p);
  }

  function drawDots(dots, color, glow = false, brightness = 1) {
    for (let bin = 0; bin < 4; bin++) {
      ctx.beginPath();
      for (let i = 0; i < dots.length; i++) {
        const p = dots[i];
        if (Math.min(3, Math.floor(p.alpha * 4)) !== bin || (glow && i % 6 !== 0)) continue;
        ctx.moveTo(p.x + p.size, p.y);
        ctx.arc(p.x, p.y, p.size * (glow ? 2.2 : 1), 0, Math.PI * 2);
      }
      ctx.globalAlpha = ((glow ? .1 : .55) + bin * (glow ? .055 : .15)) * brightness;
      ctx.fillStyle = color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawDots(accentDots, particleAccent, true, .48);
  drawDots(whiteDots, '#F5E9CC', true, .42);
  drawDots(accentDots, '#A67B3F', false, .38);
  drawDots(whiteDots, '#D8D5CC', false, .34);

  for (const layer of particleLayers) {
    const layerAccent = [], layerWhite = [];
    for (const p of layer.particles) {
      let nx = p.nx, ny = p.ny;
      if (p.blade) {
        const dx = nx - fan.centerX, dy = ny - fan.centerY;
        const c = Math.cos(logoState.angle), s = Math.sin(logoState.angle);
        nx = fan.centerX + dx * c - dy * s;
        ny = fan.centerY + dx * s + dy * c;
      }
      const x = (nx - .5) * scale;
      const y = (ny - .5) * scale;
      const z = p.depth * scale;
      const rotatedX = x * cosYaw + z * sinYaw;
      const rotatedZ = -x * sinYaw + z * cosYaw;
      const rotatedY = y * cosPitch - rotatedZ * sinPitch;
      const depth = y * sinPitch + rotatedZ * cosPitch;
      const perspective = 900 / (900 + depth);
      const tx = width / 2 + rotatedX * perspective;
      const ty = height / 2 + rotatedY * perspective;
      repelAndFloat(p, tx, ty, 118, layer.front ? 20 : 10, p.blade);
      (p.accent ? layerAccent : layerWhite).push(p);
    }
    if (layer.front) {
      drawDots(layerAccent, particleAccent, true, .38);
      drawDots(layerWhite, '#FFFDF6', true, .34);
      drawDots(layerAccent, particleAccent, false, 1.08);
      drawDots(layerWhite, '#FFFDF6', false, 1.12);
    } else {
      drawDots(layerAccent, '#B28E53', false, .24);
      drawDots(layerWhite, '#D8D5CC', false, .2);
    }
  }
  ctx.globalAlpha = 1;
  document.querySelector('#visualState').textContent = `${logoState.dragging ? 'INTERACTING' : 'LIVE'} PARTICLE VOLUME · ${logoParticles.length.toLocaleString()}`;
  const touchHint = motionPreference.matches
    ? 'Motion reduced · animation paused'
    : 'Swipe sideways to spin · tap to pause or resume';
  const motionHint = motionPreference.matches
    ? 'Animation is paused by your reduced motion setting.'
    : (touchInputPreference.matches
      ? 'Swipe horizontally across the logo to spin it. Tap the logo to pause or resume.'
      : 'Move a pointer to scatter particles, use left and right arrows to rotate, and press Space or Enter to pause or resume.');
  if (logoInteractionHint && touchInputPreference.matches && logoInteractionHint.textContent !== touchHint) {
    logoInteractionHint.textContent = touchHint;
  }
  logoCanvas.setAttribute('aria-label', `Interactive particle rendering of the Academy of Science logo with ${logoParticles.length} particles. ${motionHint}`);
}

function resizeLogoCanvas() {
  const rect = logoCanvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  logoState.width = rect.width;
  logoState.height = rect.height;
  logoState.dpr = dpr;
  logoCanvas.width = Math.round(rect.width * dpr);
  logoCanvas.height = Math.round(rect.height * dpr);
  const scale = Math.min(rect.width, rect.height) * 1.14;
  const left = (rect.width - scale) / 2, top = (rect.height - scale) / 2;
  for (const p of logoParticles) { p.x = left + p.nx * scale; p.y = top + p.ny * scale; p.vx = p.vy = 0; }
  for (const p of ambientParticles) { p.x = rect.width * (.5 + p.nx); p.y = rect.height * (.5 + p.ny); p.vx = p.vy = 0; }
  drawLogo();
}

function buildLogoParticles() {
  // Sample the master SVG at native resolution; a uniform 4 px grid gives
  // crisp letterforms without multiplying the animation cost excessively.
  const sampleSize = 1254;
  const sampleStep = 4;
  const samples = [];
  logoParticles.length = 0;
  particleLayers.length = 0;
  ambientParticles.length = 0;
  particleSource.width = particleSource.height = sampleSize;
  particleContext.clearRect(0, 0, sampleSize, sampleSize);
  particleContext.drawImage(logoImage, 0, 0, sampleSize, sampleSize);
  const { data } = particleContext.getImageData(0, 0, sampleSize, sampleSize);
  for (let y = 0; y < sampleSize; y += sampleStep) for (let x = 0; x < sampleSize; x += sampleStep) {
    const sx = Math.min(sampleSize - 1, x + Math.random() * sampleStep);
    const sy = Math.min(sampleSize - 1, y + Math.random() * sampleStep);
    const i = (Math.floor(sy) * sampleSize + Math.floor(sx)) * 4;
    if (Math.max(data[i], data[i + 1], data[i + 2]) < 42) continue;
    const nx = sx / sampleSize, ny = sy / sampleSize;
    const sourceX = nx * 1254, sourceY = ny * 1254;
    // Include antialiased edge samples so the old blade position cannot linger
    // as a faint trace after the rotor moves.
    const blade = heroFan.blades.some(points => pointOnOrNearPolygon(sourceX, sourceY, points));
    samples.push({
      nx, ny, blade,
      accent: data[i] > data[i + 1] * 1.12 && data[i + 1] > data[i + 2] * 1.15,
      size: .72 + Math.random() * .44,
      alpha: .74 + Math.random() * .26,
      phase: Math.random() * Math.PI * 2,
      drift: .22 + Math.random() * .62,
      float: .08 + Math.random() * .34
    });
  }
  // Two depth planes are enough to retain the fluid feel while keeping the
  // native-resolution particle field responsive on both desktop and phones.
  const layerCount = 2;
  for (let layerIndex = 0; layerIndex < layerCount; layerIndex++) {
    const front = layerIndex === layerCount - 1;
    const particles = samples.map(sample => ({
      ...sample,
      depth: (layerIndex - (layerCount - 1)) * .004,
      front,
      size: front ? sample.size : sample.size * .78,
      alpha: front ? sample.alpha : sample.alpha * (.56 + layerIndex * .06),
      x: 0, y: 0, vx: 0, vy: 0
    }));
    particleLayers.push({ particles, front });
    logoParticles.push(...particles);
  }
  for (let i = 0; i < 112; i++) {
    const angle = Math.random() * Math.PI * 2, radius = .48 + Math.random() * .24;
    ambientParticles.push({
      nx: Math.cos(angle) * radius, ny: Math.sin(angle) * radius,
      x: 0, y: 0, vx: 0, vy: 0,
      size: .4 + Math.random() * .42, alpha: .1 + Math.random() * .24,
      accent: Math.random() < .36, phase: Math.random() * Math.PI * 2, drift: .08 + Math.random() * .22,
      float: 2 + Math.random() * 4
    });
  }
  resizeLogoCanvas();
  if (root.dataset.mode === 'geek') startLogoMotion();
}

function ensureLogoParticles() {
  if (logoParticlesReady || !logoImage.complete || !logoImage.naturalWidth) return;
  logoParticlesReady = true;
  buildLogoParticles();
}

function animateLogo(timestamp) {
  logoFrame = 0;
  if (root.dataset.mode !== 'geek' || logoState.paused || motionPreference.matches || document.hidden) return;
  const elapsed = logoState.lastFrame ? Math.min((timestamp - logoState.lastFrame) / 1000, .05) : 0;
  logoState.lastFrame = timestamp;
  const targetYaw = logoPointer.active ? (logoPointer.x / logoState.width - .5) * .54 : 0;
  const targetPitch = logoPointer.active ? (.5 - logoPointer.y / logoState.height) * .34 : 0;
  logoState.yaw += (targetYaw - logoState.yaw) * .045;
  logoState.pitch += (targetPitch - logoState.pitch) * .045;
  if (!logoState.dragging) logoState.angle += logoState.speed * elapsed * 60;
  drawLogo();
  logoFrame = requestAnimationFrame(animateLogo);
}

function startLogoMotion() {
  if (motionPreference.matches) { logoState.paused = true; return; }
  if (logoUserPaused) { logoState.paused = true; return; }
  if (!logoCanvasVisible) return;
  logoState.paused = false;
  if (!logoFrame && root.dataset.mode === 'geek' && !motionPreference.matches && !document.hidden) logoFrame = requestAnimationFrame(animateLogo);
}

const onMotionPreferenceChange = () => {
  if (motionPreference.matches) {
    if (heroFrame) cancelAnimationFrame(heroFrame);
    if (logoFrame) cancelAnimationFrame(logoFrame);
    heroFrame = logoFrame = 0;
    heroMotion.paused = true;
    logoState.paused = true;
  } else if (root.dataset.mode === 'normal') {
    heroMotion.paused = false;
    startHeroMotion();
  } else {
    logoState.paused = logoUserPaused;
    startLogoMotion();
  }
  drawHeroLogo();
  drawLogo();
};
if (motionPreference.addEventListener) motionPreference.addEventListener('change', onMotionPreferenceChange);
else motionPreference.addListener(onMotionPreferenceChange);

logoImage.addEventListener('load', () => {
  prepareHeroLogo();
  if (root.dataset.mode === 'geek') ensureLogoParticles();
});
logoImage.src = activeTheme.logo;
new ResizeObserver(resizeLogoCanvas).observe(logoCanvas);

new IntersectionObserver(([entry]) => {
  heroLogoVisible = entry.isIntersecting;
  if (heroLogoVisible) startHeroMotion();
  else {
    if (heroFrame) cancelAnimationFrame(heroFrame);
    heroFrame = 0;
    heroLastFrameTime = 0;
  }
}, { threshold: .05 }).observe(heroContainer);

new IntersectionObserver(([entry]) => {
  logoCanvasVisible = entry.isIntersecting;
  if (logoCanvasVisible) startLogoMotion();
  else {
    if (logoFrame) cancelAnimationFrame(logoFrame);
    logoFrame = 0;
    logoState.lastFrame = 0;
  }
}, { threshold: .05 }).observe(logoCanvas);

logoCanvas.addEventListener('pointerdown', event => {
  if (motionPreference.matches) return;
  if (event.pointerType === 'touch') {
    const rect = logoCanvas.getBoundingClientRect();
    logoState.touchGesture = true;
    logoState.touchDidSpin = false;
    logoState.touchWasPaused = logoUserPaused;
    logoState.touchStartX = logoState.touchLastX = event.clientX;
    logoState.touchStartY = event.clientY;
    logoState.moved = false;
    logoState.dragging = true;
    logoState.paused = true;
    logoPointer.x = event.clientX - rect.left;
    logoPointer.y = event.clientY - rect.top;
    logoPointer.active = true;
    logoCanvas.setPointerCapture(event.pointerId);
    drawLogo();
    return;
  }
  const rect = logoCanvas.getBoundingClientRect();
  const rx = (event.clientX - rect.left) / rect.width, ry = (event.clientY - rect.top) / rect.height;
  logoPointer.x = event.clientX - rect.left;
  logoPointer.y = event.clientY - rect.top;
  logoPointer.active = true;
  const dx = rx - fan.centerX, dy = ry - fan.centerY;
  const localX = fan.centerX + dx * Math.cos(logoState.angle) + dy * Math.sin(logoState.angle);
  const localY = fan.centerY - dx * Math.sin(logoState.angle) + dy * Math.cos(logoState.angle);
  const onBlade = heroFan.blades.some(points => pointInPolygon(localX * 1254, localY * 1254, points));
  logoState.moved = false;
  logoState.dragging = onBlade;
  if (onBlade) {
    logoState.paused = true;
    logoState.lastPointerAngle = Math.atan2(ry - fan.centerY, rx - fan.centerX);
    logoCanvas.setPointerCapture(event.pointerId);
  }
  drawLogo();
});
logoCanvas.addEventListener('pointermove', event => {
  if (motionPreference.matches) return;
  const rect = logoCanvas.getBoundingClientRect();
  const rx = (event.clientX - rect.left) / rect.width, ry = (event.clientY - rect.top) / rect.height;
  logoPointer.x = event.clientX - rect.left;
  logoPointer.y = event.clientY - rect.top;
  logoPointer.active = true;
  if (logoState.touchGesture && event.pointerType === 'touch') {
    const totalX = event.clientX - logoState.touchStartX;
    const totalY = event.clientY - logoState.touchStartY;
    if (Math.hypot(totalX, totalY) > 8) logoState.moved = true;
    if (Math.abs(totalX) > 6 && Math.abs(totalX) > Math.abs(totalY) * 1.1) {
      const deltaX = event.clientX - logoState.touchLastX;
      logoState.angle += deltaX * .012;
      logoState.speed = Math.max(-.045, Math.min(.045, deltaX * .0025));
      logoState.touchLastX = event.clientX;
      logoState.touchDidSpin = true;
      drawLogo();
    }
    return;
  }
  if (!logoState.dragging) { drawLogo(); return; }
  const angle = Math.atan2(ry - fan.centerY, rx - fan.centerX);
  let delta = angle - logoState.lastPointerAngle;
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  logoState.angle += delta;
  logoState.speed = Math.max(-.08, Math.min(.08, delta * 1.8));
  logoState.lastPointerAngle = angle;
  logoState.moved ||= Math.abs(delta) > .012;
  drawLogo();
});
logoCanvas.addEventListener('pointerleave', () => { if (!logoState.dragging) logoPointer.active = false; });
logoCanvas.addEventListener('pointerup', event => {
  if (logoState.touchGesture && event.pointerType === 'touch') {
    logoState.touchGesture = false;
    logoState.dragging = false;
    logoPointer.active = false;
    if (!logoState.moved) {
      logoUserPaused = !logoState.touchWasPaused;
      logoState.paused = logoUserPaused;
    } else if (logoState.touchDidSpin) {
      logoUserPaused = false;
      logoState.paused = false;
      if (Math.abs(logoState.speed) < .008) logoState.speed = .012;
    } else {
      logoUserPaused = logoState.touchWasPaused;
      logoState.paused = logoUserPaused;
    }
    if (!logoState.paused) startLogoMotion();
    drawLogo();
    return;
  }
  if (event.pointerType !== 'mouse') logoPointer.active = false;
  if (logoState.dragging) {
    logoState.dragging = false;
    if (!logoState.moved) logoState.speed = .012;
    startLogoMotion();
  }
});
logoCanvas.addEventListener('pointercancel', () => {
  if (logoState.touchGesture) {
    logoState.touchGesture = false;
    logoState.dragging = false;
  }
  logoState.dragging = false;
  logoState.paused = logoUserPaused;
  logoPointer.active = false;
  if (!logoState.paused) startLogoMotion();
  drawLogo();
});
logoCanvas.addEventListener('keydown', event => {
  if (motionPreference.matches) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    logoUserPaused = false;
    logoState.speed = event.key === 'ArrowLeft' ? -.018 : .018;
    startLogoMotion();
  }
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    logoUserPaused = !logoUserPaused;
    logoState.paused = logoUserPaused;
    if (logoState.paused) {
      if (logoFrame) cancelAnimationFrame(logoFrame);
      logoFrame = 0;
    } else startLogoMotion();
    drawLogo();
  }
});

// The UFO companion runs only in Geek Mode on a touch-free desktop with motion enabled.
const cursorUfo = document.querySelector('#cursorUfo');
const cursorUfoMotion = document.querySelector('#cursorUfoMotion');
const ufoShots = document.querySelector('#ufoShots');
const ufoControlCell = document.querySelector('#ufoControlCell');
const ufoTrigger = document.querySelector('#ufoLaunch');
const ufoSplitControls = document.querySelector('#ufoSplitControls');
const ufoSurrender = document.querySelector('#ufoSurrender');
const ufoWeapon = document.querySelector('#ufoWeapon');
if (cursorUfo && cursorUfoMotion && ufoShots && ufoControlCell && ufoTrigger && ufoSplitControls && ufoSurrender && ufoWeapon) {
  const ufoDesktop = matchMedia('(min-width: 681px) and (hover: hover) and (pointer: fine)');
  const ufoReducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const ufoTouchFirst = navigator.maxTouchPoints > 0
    || navigator.userAgentData?.mobile === true
    || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const ufoTriggerLabel = document.querySelector('#ufoLaunchLabel');
  const ufoWeaponLabel = document.querySelector('#ufoWeaponLabel');
  const ufoWeaponState = document.querySelector('#ufoWeaponState');
  let ufoEnabled = false, ufoDeployed = false, ufoLaunching = false, ufoReturning = false, ufoFollowing = false;
  let ufoFrame = 0, ufoHasPointer = false, ufoCombat = false, ufoFireTimer = 0, ufoStageTimer = 0;
  let ufoStageDeadline = 0, ufoStageRemaining = 0, ufoStageCallback = null;
  let pointerX = 0, pointerY = 0;
  let ufoX = 0, ufoY = 0, ufoTargetX = 0, ufoTargetY = 0, ufoVelocityX = 0, ufoVelocityY = 0;
  let ufoLastFrame = 0;

  function updateUfoTrigger() {
    ufoTrigger.disabled = !ufoEnabled || ufoDeployed;
    ufoTrigger.hidden = ufoDeployed && !ufoLaunching && !ufoReturning;
    ufoTriggerLabel.textContent = ufoReducedMotion.matches
      ? 'REDUCED MOTION ENABLED'
      : (!ufoDesktop.matches || ufoTouchFirst ? 'DESKTOP MOUSE REQUIRED' : (ufoLaunching ? 'LAUNCHING...' : (ufoReturning ? 'RETURNING...' : 'DO NOT CLICK')));
    ufoSplitControls.hidden = !ufoDeployed || ufoLaunching || ufoReturning;
    ufoWeapon.setAttribute('aria-pressed', String(ufoCombat));
    ufoWeaponLabel.textContent = ufoCombat ? 'TAKE AWAY WEAPON' : 'GIVE IT ABILITY TO SHOOT';
    ufoWeaponState.textContent = ufoCombat ? 'WEAPON ARMED' : 'WEAPON DISARMED';
  }

  function clearUfoShots() {
    while (ufoShots.firstChild) ufoShots.firstChild.remove();
  }

  function clearUfoStage() {
    if (ufoStageTimer) clearTimeout(ufoStageTimer);
    ufoStageTimer = 0;
    ufoStageDeadline = 0;
    ufoStageRemaining = 0;
    ufoStageCallback = null;
  }

  function startUfoStageTimer() {
    if (document.hidden || !ufoStageCallback || ufoStageTimer) return;
    ufoStageDeadline = performance.now() + ufoStageRemaining;
    ufoStageTimer = setTimeout(() => {
      const callback = ufoStageCallback;
      clearUfoStage();
      if (callback) callback();
    }, ufoStageRemaining);
  }

  function scheduleUfoStage(callback, delay) {
    clearUfoStage();
    ufoStageCallback = callback;
    ufoStageRemaining = delay;
    startUfoStageTimer();
  }

  function pauseUfoStage() {
    if (!ufoStageTimer) return;
    clearTimeout(ufoStageTimer);
    ufoStageTimer = 0;
    ufoStageRemaining = Math.max(0, ufoStageDeadline - performance.now());
    ufoStageDeadline = 0;
  }

  function stopUfoFrame() {
    if (ufoFrame) cancelAnimationFrame(ufoFrame);
    ufoFrame = 0;
    ufoLastFrame = 0;
  }

  function startUfoFireTimer() {
    if (ufoFireTimer || !ufoCombat || !ufoEnabled || document.hidden || !ufoHasPointer) return;
    fireUfoShot();
    ufoFireTimer = setInterval(fireUfoShot, 900);
  }

  function placeAtPointer() {
    ufoTargetX = Math.max(0, Math.min(innerWidth - 120, pointerX - 104));
    ufoTargetY = Math.max(0, Math.min(innerHeight - 82, pointerY - 48));
  }

  function setUfoCombat(active) {
    ufoCombat = active && ufoEnabled && ufoDeployed && ufoFollowing;
    if (ufoFireTimer) clearInterval(ufoFireTimer);
    ufoFireTimer = 0;
    updateUfoTrigger();
    if (ufoCombat) startUfoFireTimer();
    else clearUfoShots();
  }

  function syncUfoMode() {
    ufoEnabled = root.dataset.mode === 'geek' && ufoDesktop.matches && !ufoTouchFirst && !ufoReducedMotion.matches;
    root.toggleAttribute('data-ufo-eligible', ufoEnabled);
    if (!ufoEnabled) {
      clearUfoStage();
      setUfoCombat(false);
      stopUfoFrame();
      ufoDeployed = false;
      ufoLaunching = false;
      ufoReturning = false;
      ufoFollowing = false;
      cursorUfo.setAttribute('hidden', '');
      cursorUfo.removeAttribute('data-launch-state');
    }
    updateUfoTrigger();
  }

  function fireUfoShot() {
    if (!ufoEnabled || !ufoCombat || !ufoFollowing || !ufoHasPointer || document.hidden) return;
    const startX = ufoX + 60;
    const startY = ufoY + 45;
    const namespace = 'http://www.w3.org/2000/svg';
    for (const className of ['ufo-shot-glow', 'ufo-shot-core']) {
      const shot = document.createElementNS(namespace, 'line');
      shot.setAttribute('class', `ufo-shot ${className}`);
      shot.setAttribute('x1', String(startX));
      shot.setAttribute('y1', String(startY));
      shot.setAttribute('x2', String(pointerX));
      shot.setAttribute('y2', String(pointerY));
      ufoShots.append(shot);
      window.setTimeout(() => shot.remove(), 240);
    }
  }

  function animateUfo(timestamp) {
    ufoFrame = 0;
    if (!ufoEnabled || !ufoDeployed || document.hidden) return;
    const elapsed = ufoLastFrame ? Math.min((timestamp - ufoLastFrame) / 1000, .032) : 1 / 60;
    ufoLastFrame = timestamp;
    const spring = 94, damping = 15;
    ufoVelocityX += ((ufoTargetX - ufoX) * spring - ufoVelocityX * damping) * elapsed;
    ufoVelocityY += ((ufoTargetY - ufoY) * spring - ufoVelocityY * damping) * elapsed;
    ufoX += ufoVelocityX * elapsed;
    ufoY += ufoVelocityY * elapsed;
    cursorUfoMotion.setAttribute('transform', `translate(${Math.round(ufoX)} ${Math.round(ufoY)})`);
    if (Math.abs(ufoTargetX - ufoX) > .35 || Math.abs(ufoTargetY - ufoY) > .35 || Math.abs(ufoVelocityX) > 1 || Math.abs(ufoVelocityY) > 1) {
      ufoFrame = requestAnimationFrame(animateUfo);
    } else { ufoX = ufoTargetX; ufoY = ufoTargetY; ufoVelocityX = 0; ufoVelocityY = 0; ufoLastFrame = 0; }
  }

  function launchUfo() {
    if (!ufoEnabled || ufoDeployed) return;
    clearUfoStage();
    const rect = ufoTrigger.getBoundingClientRect();
    ufoX = rect.left + rect.width / 2 - 60;
    ufoY = rect.top + rect.height / 2 - 36;
    if (!ufoHasPointer) {
      pointerX = rect.left + rect.width / 2;
      pointerY = rect.top + rect.height / 2;
      ufoHasPointer = true;
    }
    ufoTargetX = Math.max(0, ufoX - 48);
    ufoTargetY = Math.max(0, ufoY - 132);
    ufoVelocityX = 0;
    ufoVelocityY = 0;
    ufoLastFrame = 0;
    ufoDeployed = true;
    ufoLaunching = true;
    ufoReturning = false;
    ufoFollowing = false;
    cursorUfo.removeAttribute('hidden');
    cursorUfo.setAttribute('data-launch-state', 'launching');
    cursorUfoMotion.setAttribute('transform', `translate(${Math.round(ufoX)} ${Math.round(ufoY)})`);
    updateUfoTrigger();
    if (!ufoFrame && !document.hidden) ufoFrame = requestAnimationFrame(animateUfo);
    scheduleUfoStage(() => {
      if (!ufoEnabled || !ufoDeployed) return;
      ufoLaunching = false;
      ufoFollowing = true;
      cursorUfo.removeAttribute('data-launch-state');
      placeAtPointer();
      if (!ufoHasPointer) cursorUfo.setAttribute('hidden', '');
      updateUfoTrigger();
      if (ufoHasPointer && !ufoFrame && !document.hidden) ufoFrame = requestAnimationFrame(animateUfo);
    }, 680);
  }

  function returnUfo() {
    if (!ufoEnabled || !ufoDeployed || ufoLaunching || ufoReturning) return;
    clearUfoStage();
    setUfoCombat(false);
    const rect = ufoControlCell.getBoundingClientRect();
    ufoTargetX = rect.left + rect.width / 2 - 60;
    ufoTargetY = rect.top + rect.height / 2 - 36;
    ufoFollowing = false;
    ufoReturning = true;
    cursorUfo.setAttribute('data-launch-state', 'returning');
    updateUfoTrigger();
    if (!ufoFrame && !document.hidden) ufoFrame = requestAnimationFrame(animateUfo);
    scheduleUfoStage(() => {
      ufoDeployed = false;
      ufoReturning = false;
      ufoFollowing = false;
      cursorUfo.setAttribute('hidden', '');
      cursorUfo.removeAttribute('data-launch-state');
      clearUfoShots();
      updateUfoTrigger();
      clearUfoStage();
    }, 620);
  }

  window.addEventListener('pointermove', event => {
    if (!ufoEnabled || event.pointerType !== 'mouse') return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    ufoHasPointer = true;
    if (ufoCombat) startUfoFireTimer();
    if (ufoDeployed && ufoFollowing) {
      placeAtPointer();
      cursorUfo.removeAttribute('hidden');
      if (!ufoFrame) ufoFrame = requestAnimationFrame(animateUfo);
    }
  }, { passive: true });

  ufoTrigger.addEventListener('click', launchUfo);
  ufoSurrender.addEventListener('click', returnUfo);
  ufoWeapon.addEventListener('click', () => setUfoCombat(!ufoCombat));

  window.addEventListener('pointerout', event => {
    if (event.relatedTarget === null) {
      ufoHasPointer = false;
      if (ufoFireTimer) clearInterval(ufoFireTimer);
      ufoFireTimer = 0;
      if (ufoFollowing) {
        cursorUfo.setAttribute('hidden', '');
        stopUfoFrame();
      }
    }
  });
  window.addEventListener('blur', () => {
    ufoHasPointer = false;
    if (ufoFireTimer) clearInterval(ufoFireTimer);
    ufoFireTimer = 0;
    if (ufoFollowing) {
      cursorUfo.setAttribute('hidden', '');
      stopUfoFrame();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      ufoHasPointer = false;
      stopUfoFrame();
      pauseUfoStage();
      if (ufoFireTimer) clearInterval(ufoFireTimer);
      ufoFireTimer = 0;
      clearUfoShots();
      if (ufoDeployed) cursorUfo.setAttribute('hidden', '');
    } else {
      startUfoStageTimer();
      if (ufoDeployed && (ufoLaunching || ufoReturning)) {
        cursorUfo.removeAttribute('hidden');
        ufoFrame = requestAnimationFrame(animateUfo);
      } else if (ufoFollowing && ufoHasPointer) {
        placeAtPointer();
        cursorUfo.removeAttribute('hidden');
        ufoFrame = requestAnimationFrame(animateUfo);
      }
      if (ufoCombat) startUfoFireTimer();
    }
  });
  new MutationObserver(syncUfoMode).observe(root, { attributes: true, attributeFilter: ['data-mode'] });
  if (ufoDesktop.addEventListener) ufoDesktop.addEventListener('change', syncUfoMode);
  else ufoDesktop.addListener(syncUfoMode);
  if (ufoReducedMotion.addEventListener) ufoReducedMotion.addEventListener('change', syncUfoMode);
  else ufoReducedMotion.addListener(syncUfoMode);
  syncUfoMode();
}
