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

// Reduce the supplied logo to a clean 90×90 pixel atlas, then enlarge without smoothing.
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
const pixelArt = document.createElement('canvas');
pixelArt.width = pixelArt.height = 90;
const pixelContext = pixelArt.getContext('2d', { willReadFrequently: true });
const bladeCanvases = [];
const logoState = { angle: 0, speed: .012, paused: false, dragging: false, lastPointerAngle: 0, moved: false };
let logoFrame = 0;
const fan = { centerX: .5, centerY: .36, leftStart: .155, bladeWidth: .285, rightStart: .56, top: .295, height: .078 };

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
  if (!document.hidden) { heroLastFrameTime = 0; startHeroMotion(); }
});

function drawLogo() {
  if (!logoImage.complete || !logoImage.naturalWidth || bladeCanvases.length !== 2) return;
  const size = pixelArt.width;
  const cx = fan.centerX * size;
  const cy = fan.centerY * size;
  pixelContext.clearRect(0, 0, size, size);
  pixelContext.imageSmoothingEnabled = true;
  pixelContext.drawImage(logoImage, 0, 0, size, size);
  pixelContext.fillStyle = '#000';
  pixelContext.fillRect(fan.leftStart * size - 1, fan.top * size - 1, fan.bladeWidth * size + 2, fan.height * size + 2);
  pixelContext.fillRect(fan.rightStart * size - 1, fan.top * size - 1, fan.bladeWidth * size + 2, fan.height * size + 2);
  pixelContext.save();
  pixelContext.translate(cx, cy);
  pixelContext.rotate(logoState.angle);
  bladeCanvases.forEach(({ canvas, destinationX }) => pixelContext.drawImage(canvas, destinationX * size - cx, fan.top * size - cy));
  pixelContext.restore();

  const w = logoCanvas.width;
  const h = logoCanvas.height;
  logoContext.clearRect(0, 0, w, h);
  logoContext.save();
  const pixels = pixelContext.getImageData(0, 0, size, size).data;
  const cellW = w / size;
  const cellH = h / size;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    if (pixels[i] + pixels[i + 1] + pixels[i + 2] < 100) continue;
    logoContext.fillStyle = `rgb(${pixels[i]},${pixels[i + 1]},${pixels[i + 2]})`;
    logoContext.beginPath();
    logoContext.arc((x + .5) * cellW, (y + .5) * cellH, Math.min(cellW, cellH) * .34, 0, Math.PI * 2);
    logoContext.fill();
  }
  logoContext.restore();
  document.querySelector('#visualState').textContent = `${logoState.paused ? 'PAUSED' : 'LIVE'} DOT RENDER`;
  logoCanvas.setAttribute('aria-label', `Animated dot rendering of the Academy of Science logo. The blades are ${logoState.paused ? 'paused' : 'spinning'}; drag them to change their motion. Clicking does nothing.`);
}

function animateLogo() {
  if (root.dataset.mode !== 'geek' || logoState.paused || logoState.dragging) { logoFrame = 0; drawLogo(); return; }
  logoState.angle += logoState.speed;
  drawLogo();
  logoFrame = requestAnimationFrame(animateLogo);
}

function startLogoMotion() {
  logoState.paused = false;
  if (!logoFrame) logoFrame = requestAnimationFrame(animateLogo);
}

logoImage.addEventListener('load', () => {
  prepareHeroLogo();
  pixelContext.imageSmoothingEnabled = true;
  pixelContext.drawImage(logoImage, 0, 0, pixelArt.width, pixelArt.height);
  const cropY = fan.top * pixelArt.height;
  const cropH = fan.height * pixelArt.height;
  const cropW = fan.bladeWidth * pixelArt.width;
  [fan.leftStart, fan.rightStart].forEach(destinationX => {
    const crop = document.createElement('canvas');
    crop.width = Math.round(cropW);
    crop.height = Math.round(cropH);
    const cropContext = crop.getContext('2d', { willReadFrequently: true });
    cropContext.drawImage(pixelArt, destinationX * pixelArt.width, cropY, cropW, cropH, 0, 0, crop.width, crop.height);
    const pixels = cropContext.getImageData(0, 0, crop.width, crop.height);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const red = pixels.data[i], green = pixels.data[i + 1], blue = pixels.data[i + 2];
      const coverage = (red + green + blue) / (3 * 255);
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = 255;
      pixels.data[i + 3] = coverage < .08 ? 0 : Math.round(coverage * 255);
    }
    cropContext.putImageData(pixels, 0, 0);
    bladeCanvases.push({ canvas: crop, destinationX });
  });
  if (root.dataset.mode === 'geek') startLogoMotion();
  else drawLogo();
});
logoImage.src = activeTheme.logo;

logoCanvas.addEventListener('pointerdown', event => {
  const rect = logoCanvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width * logoCanvas.width;
  const y = (event.clientY - rect.top) / rect.height * logoCanvas.height;
  const rx = x / logoCanvas.width, ry = y / logoCanvas.height;
  const dx = rx - fan.centerX, dy = ry - fan.centerY;
  const localX = fan.centerX + dx * Math.cos(logoState.angle) + dy * Math.sin(logoState.angle);
  const localY = fan.centerY - dx * Math.sin(logoState.angle) + dy * Math.cos(logoState.angle);
  const onBlade = localY >= fan.top && localY <= fan.top + fan.height &&
    ((localX >= fan.leftStart && localX <= fan.leftStart + fan.bladeWidth) || (localX >= fan.rightStart && localX <= fan.rightStart + fan.bladeWidth));
  logoState.moved = false;
  logoState.dragging = onBlade;
  if (onBlade) {
    logoState.paused = true;
    logoState.lastPointerAngle = Math.atan2(y - logoCanvas.height * fan.centerY, x - logoCanvas.width * fan.centerX);
  }
  drawLogo();
  logoCanvas.setPointerCapture(event.pointerId);
});
logoCanvas.addEventListener('pointermove', event => {
  if (!logoState.dragging) return;
  const rect = logoCanvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width * logoCanvas.width;
  const y = (event.clientY - rect.top) / rect.height * logoCanvas.height;
  const angle = Math.atan2(y - logoCanvas.height * fan.centerY, x - logoCanvas.width * fan.centerX);
  let delta = angle - logoState.lastPointerAngle;
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  logoState.angle += delta;
  logoState.speed = Math.max(-.08, Math.min(.08, delta * 1.8));
  logoState.lastPointerAngle = angle;
  logoState.moved ||= Math.abs(delta) > .012;
  drawLogo();
});
logoCanvas.addEventListener('pointerup', () => {
  if (!logoState.dragging) return;
  logoState.dragging = false;
  if (!logoState.moved) logoState.speed ||= .012;
  startLogoMotion();
});
logoCanvas.addEventListener('pointercancel', () => { logoState.dragging = false; startLogoMotion(); });
logoCanvas.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    logoState.speed = event.key === 'ArrowLeft' ? -.018 : .018;
    startLogoMotion();
  }
  if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); }
});
