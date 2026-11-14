const root = document.documentElement;
const modeSwitch = document.querySelector('#modeSwitch');
const themeMeta = document.querySelector('meta[name="theme-color"]');

function setMode(mode) {
  root.dataset.mode = mode;
  modeSwitch.setAttribute('aria-pressed', String(mode === 'geek'));
  themeMeta.content = mode === 'geek' ? '#0d0d0e' : '#f2efe8';
  try { localStorage.setItem('aos-mode', mode); } catch {}
}

let savedMode = 'normal';
try { savedMode = localStorage.getItem('aos-mode') === 'geek' ? 'geek' : 'normal'; } catch {}
setMode(savedMode);
modeSwitch.addEventListener('click', () => {
  const mode = root.dataset.mode === 'geek' ? 'normal' : 'geek';
  setMode(mode);
  if (mode === 'geek') startLogoMotion();
  else { logoState.paused = true; drawLogo(); startHeroMotion(); }
});
document.querySelector('#geekExit').addEventListener('click', () => setMode('normal'));

const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
}), { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// The Geek emblem is reconstructed from the active vector logo as a high-density particle field.
const logoCanvas = document.querySelector('#digitalLogo');
const logoContext = logoCanvas.getContext('2d');
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
const heroMotion = { angle: 0, speed: 0.2, paused: false, dragging: false, moved: false, lastPointerAngle: 0, lastPointerTime: 0 };
let heroFrame = 0;
let heroLastFrameTime = 0;
const particleSource = document.createElement('canvas');
const particleContext = particleSource.getContext('2d', { willReadFrequently: true });
const logoParticles = [];
const particleLayers = [];
const ambientParticles = [];
const logoPointer = { x: -1000, y: -1000, active: false };
const logoState = { angle: 0, speed: .012, yaw: 0, pitch: 0, paused: false, dragging: false, lastPointerAngle: 0, moved: false, lastFrame: 0, width: 0, height: 0, dpr: 1 };
let logoFrame = 0;
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
  const paused = String(heroMotion.paused);
  if (heroContainer.dataset.paused !== paused) {
    heroContainer.dataset.paused = paused;
    heroContainer.setAttribute('aria-label', `Animated Academy of Science logo. Fans ${heroMotion.paused ? 'paused' : 'spinning'}. Drag around the hub to redirect them. Use the adjacent control or Space to pause or resume.`);
    heroToggle.textContent = heroMotion.paused ? 'Start emblem' : 'Pause emblem';
    heroToggle.setAttribute('aria-pressed', String(!heroMotion.paused));
  }
}

function animateHeroLogo(timestamp) {
  heroFrame = 0;
  if (root.dataset.mode !== 'normal' || heroMotion.paused || document.hidden) return;
  const elapsed = heroLastFrameTime ? Math.min((timestamp - heroLastFrameTime) / 1000, 0.05) : 0;
  heroLastFrameTime = timestamp;
  heroMotion.angle += heroMotion.speed * elapsed;
  const restingSpeed = 0.2;
  heroMotion.speed = restingSpeed + (heroMotion.speed - restingSpeed) * Math.exp(-elapsed / 2.6);
  drawHeroLogo();
  heroFrame = requestAnimationFrame(animateHeroLogo);
}

function startHeroMotion() {
  if (!heroFrame && root.dataset.mode === 'normal' && !heroMotion.paused && !document.hidden) {
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

heroCanvas.addEventListener('pointerup', () => {
  if (!heroMotion.dragging) return;
  heroMotion.dragging = false;
  if (!heroMotion.moved || Math.abs(heroMotion.speed) < .02) heroMotion.speed = .2;
  heroMotion.paused = false;
  heroLastFrameTime = 0;
  startHeroMotion();
  drawHeroLogo();
});
heroCanvas.addEventListener('pointercancel', () => {
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
    tx += Math.sin(time * p.drift + p.phase) * p.float;
    ty += Math.cos(time * p.drift * .83 + p.phase) * p.float;
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

  drawDots(accentDots, particleAccent, true, .72);
  drawDots(whiteDots, '#A7D6D4', true, .72);
  drawDots(accentDots, '#A67B3F', false, .66);
  drawDots(whiteDots, '#68A7A7', false, .66);

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
      drawDots(layerAccent, particleAccent, true, 1);
      drawDots(layerWhite, '#F7F6F0', true, 1);
      drawDots(layerAccent, particleAccent, false, 1);
      drawDots(layerWhite, '#F7F6F0', false, 1);
    } else {
      drawDots(layerAccent, '#9A7946', false, .35);
      drawDots(layerWhite, '#538B8D', false, .34);
    }
  }
  ctx.globalAlpha = 1;
  document.querySelector('#visualState').textContent = `${logoState.dragging ? 'INTERACTING' : 'LIVE'} PARTICLE VOLUME · ${logoParticles.length.toLocaleString()}`;
  logoCanvas.setAttribute('aria-label', `Interactive particle rendering of the Academy of Science logo with ${logoParticles.length} particles. Move a pointer to scatter and gather particles; drag the fan blades to spin them.`);
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
  const sampleSize = 900;
  const samples = [];
  logoParticles.length = 0;
  particleLayers.length = 0;
  ambientParticles.length = 0;
  particleSource.width = particleSource.height = sampleSize;
  particleContext.clearRect(0, 0, sampleSize, sampleSize);
  particleContext.drawImage(logoImage, 0, 0, sampleSize, sampleSize);
  const { data } = particleContext.getImageData(0, 0, sampleSize, sampleSize);
  for (let y = 0; y < sampleSize; y += 4) for (let x = 0; x < sampleSize; x += 4) {
    const sx = Math.min(sampleSize - 1, x + Math.random() * 2);
    const sy = Math.min(sampleSize - 1, y + Math.random() * 2);
    const i = (Math.floor(sy) * sampleSize + Math.floor(sx)) * 4;
    if (Math.max(data[i], data[i + 1], data[i + 2]) < 42) continue;
    const nx = sx / sampleSize, ny = sy / sampleSize;
    const sourceX = nx * 1254, sourceY = ny * 1254;
    const blade = heroFan.blades.some(points => pointInPolygon(sourceX, sourceY, points));
    samples.push({
      nx, ny, blade,
      accent: data[i] > data[i + 1] * 1.12 && data[i + 1] > data[i + 2] * 1.15,
      size: .92 + Math.random() * .62,
      alpha: .74 + Math.random() * .26,
      phase: Math.random() * Math.PI * 2,
      drift: .22 + Math.random() * .62,
      float: .08 + Math.random() * .34
    });
  }
  const layerCount = matchMedia('(max-width: 680px)').matches ? 3 : 4;
  for (let layerIndex = 0; layerIndex < layerCount; layerIndex++) {
    const front = layerIndex === layerCount - 1;
    const particles = samples.map(sample => ({
      ...sample,
      depth: (layerIndex - (layerCount - 1)) * .009,
      front,
      size: front ? sample.size : sample.size * .78,
      alpha: front ? sample.alpha : sample.alpha * (.56 + layerIndex * .06),
      x: 0, y: 0, vx: 0, vy: 0
    }));
    particleLayers.push({ particles, front });
    logoParticles.push(...particles);
  }
  for (let i = 0; i < 240; i++) {
    const angle = Math.random() * Math.PI * 2, radius = .42 + Math.random() * .31;
    ambientParticles.push({
      nx: Math.cos(angle) * radius, ny: Math.sin(angle) * radius,
      x: 0, y: 0, vx: 0, vy: 0,
      size: .45 + Math.random() * .75, alpha: .12 + Math.random() * .38,
      accent: Math.random() < .36, phase: Math.random() * Math.PI * 2, drift: .08 + Math.random() * .22,
      float: 2 + Math.random() * 4
    });
  }
  resizeLogoCanvas();
  if (root.dataset.mode === 'geek') startLogoMotion();
}

function animateLogo(timestamp) {
  logoFrame = 0;
  if (root.dataset.mode !== 'geek' || document.hidden) return;
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
  logoState.paused = false;
  if (!logoFrame && root.dataset.mode === 'geek') logoFrame = requestAnimationFrame(animateLogo);
}

logoImage.addEventListener('load', () => {
  prepareHeroLogo();
  buildLogoParticles();
});
logoImage.src = activeTheme.logo;
new ResizeObserver(resizeLogoCanvas).observe(logoCanvas);

logoCanvas.addEventListener('pointerdown', event => {
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
  const rect = logoCanvas.getBoundingClientRect();
  const rx = (event.clientX - rect.left) / rect.width, ry = (event.clientY - rect.top) / rect.height;
  logoPointer.x = event.clientX - rect.left;
  logoPointer.y = event.clientY - rect.top;
  logoPointer.active = true;
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
  if (event.pointerType !== 'mouse') logoPointer.active = false;
  if (logoState.dragging) {
    logoState.dragging = false;
    if (!logoState.moved) logoState.speed = .012;
    startLogoMotion();
  }
});
logoCanvas.addEventListener('pointercancel', () => {
  logoPointer.active = false;
  logoState.dragging = false;
  startLogoMotion();
});
logoCanvas.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    logoState.speed = event.key === 'ArrowLeft' ? -.018 : .018;
    startLogoMotion();
  }
  if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); }
});
