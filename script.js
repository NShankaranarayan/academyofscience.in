const root = document.documentElement;
const modeSwitch = document.querySelector('#modeSwitch');
const themeMeta = document.querySelector('meta[name="theme-color"]');
const terminalInput = document.querySelector('#terminalInput');
const terminalOutput = document.querySelector('#terminalOutput');
const geekConsole = document.querySelector('.geek-console');
const history = [];
let historyIndex = 0;

function setMode(mode, focus = false) {
  root.dataset.mode = mode;
  modeSwitch.setAttribute('aria-pressed', String(mode === 'geek'));
  themeMeta.content = mode === 'geek' ? '#0d0d0e' : '#f2efe8';
  try { localStorage.setItem('aos-mode', mode); } catch {}
  if (mode === 'geek' && focus) setTimeout(() => terminalInput.focus(), 150);
}

let savedMode = 'normal';
try { savedMode = localStorage.getItem('aos-mode') === 'geek' ? 'geek' : 'normal'; } catch {}
setMode(savedMode);
modeSwitch.addEventListener('click', () => {
  const mode = root.dataset.mode === 'geek' ? 'normal' : 'geek';
  setMode(mode, true);
  if (mode === 'geek') startRotor();
  else { logoState.paused = true; logoState.speed = 0; drawLogo(); }
});

const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
}), { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const responses = {
  help: ['available commands:', '  ls research     list research pillars and application areas', '  cat about.md    read the lab statement', '  whoami          describe this visitor session', '  members         list current contributors', '  clear           clear terminal output', '  normal          return to normal mode'],
  'ls research': ['research pillars/', '  explainable_ai/', '  computer_vision/', '  embodied_physical_ai/', 'specialization/', '  automated_driving_systems/', 'application areas/', '  medical_ai/', '  defence/'],
  'cat about.md': ['# Academy of Science', '', 'An independent AI research lab working across XAI, computer vision,', 'and embodied AI systems, with a specialization in Automated Driving Systems.', 'Application interests include medical AI and defence.'],
  'cat xai.md': ['# Explainable AI (XAI)', 'Inspect model behaviour, evidence, and uncertainty.'],
  'cat computer-vision.md': ['# Computer Vision', 'Scene understanding and reliable visual perception in context.'],
  'cat embodied-ai.md': ['# Embodied and Physical AI', 'Systems connecting perception, reasoning, and action in the physical world.'],
  'cat ads.md': ['# Automated Driving Systems (ADS)', 'Our application specialization: perception, explanation, and reliable action in dynamic environments.'],
  'cat medical-ai.md': ['# Medical AI', 'Research direction: reliability, interpretability, and human oversight.'],
  'cat defence-ai.md': ['# Defence AI', 'Research direction: assurance, safety, and accountable use.'],
  whoami: ['guest — curious human, local session, no tracking required'],
  members: ['01  Shankaranarayan N', '02  Satwik Ramsetti']
};

function printCommand(command) {
  const clean = command.trim().toLowerCase();
  if (!clean) return;
  if (clean === 'clear') { terminalOutput.replaceChildren(); return; }
  if (clean === 'normal') { setMode('normal'); return; }
  const block = document.createElement('div');
  const prompt = document.createElement('p');
  const promptLabel = document.createElement('span');
  promptLabel.className = 'dim';
  promptLabel.textContent = 'guest@aos:~$ ';
  prompt.append(promptLabel, document.createTextNode(command));
  block.append(prompt);
  const lines = responses[clean] || [`command not found: ${clean}`, 'type “help” for available commands'];
  lines.forEach(line => { const p = document.createElement('p'); p.textContent = line; if (line === 'available commands:') p.className = 'term-red'; block.append(p); });
  terminalOutput.append(block);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

terminalInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') { const value = terminalInput.value; if (value.trim()) { history.push(value); historyIndex = history.length; } printCommand(value); terminalInput.value = ''; }
  if (event.key === 'ArrowUp') { event.preventDefault(); historyIndex = Math.max(0, historyIndex - 1); terminalInput.value = history[historyIndex] || ''; }
  if (event.key === 'ArrowDown') { event.preventDefault(); historyIndex = Math.min(history.length, historyIndex + 1); terminalInput.value = history[historyIndex] || ''; }
  if (event.key === 'Tab') { event.preventDefault(); const match = Object.keys(responses).find(key => key.startsWith(terminalInput.value.toLowerCase())); if (match) terminalInput.value = match; }
});

document.querySelectorAll('[data-command]').forEach(button => button.addEventListener('click', () => { printCommand(button.dataset.command); terminalInput.focus(); }));
document.querySelector('#crtToggle').addEventListener('click', event => {
  geekConsole.classList.toggle('crt-off');
  const active = !geekConsole.classList.contains('crt-off');
  event.currentTarget.textContent = `crt:${active ? 'on' : 'off'}`;
  event.currentTarget.setAttribute('aria-pressed', String(active));
});

// Reduce the supplied logo to a clean 90×90 pixel atlas, then enlarge without smoothing.
const logoCanvas = document.querySelector('#digitalLogo');
const logoContext = logoCanvas.getContext('2d');
const logoImage = new Image();
const pixelArt = document.createElement('canvas');
pixelArt.width = pixelArt.height = 90;
const pixelContext = pixelArt.getContext('2d', { willReadFrequently: true });
const bladeCanvases = [];
const logoState = { angle: 0, speed: .01, paused: false, dragging: false, lastPointerAngle: 0, moved: false, render: 0, palette: false };
let rotorAnimating = false;
const renderModes = ['pixels', 'dots'];
const fan = { centerX: .5, centerY: .36, leftStart: .155, bladeWidth: .285, rightStart: .56, top: .295, height: .078 };

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
  if (logoState.palette) logoContext.filter = 'sepia(1) saturate(2.5) hue-rotate(75deg) brightness(1.12)';
  if (logoState.render === 0) {
    logoContext.imageSmoothingEnabled = false;
    logoContext.drawImage(pixelArt, 0, 0, w, h);
  } else {
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
  }
  logoContext.restore();
  document.querySelector('#renderMode').textContent = renderModes[logoState.render];
  document.querySelector('#sideRender').textContent = renderModes[logoState.render];
  document.querySelector('#spinValue').textContent = `${logoState.speed < 0 ? '−' : '+'}${Math.abs(logoState.angle % (Math.PI * 2) * 180 / Math.PI).toFixed(1).padStart(4, '0')}°`;
  document.querySelector('#visualState').textContent = `${logoState.paused ? 'PAUSED' : 'LIVE'} ${renderModes[logoState.render].toUpperCase()} RENDER`;
  logoCanvas.setAttribute('aria-label', `Interactive ${renderModes[logoState.render]} rendering of the Academy of Science logo. Fan ${logoState.paused ? 'paused' : 'spinning'}. Touch a blade to stop; drag around the hub to spin it. Arrow keys spin; Space pauses.`);
}

function animateRotor() {
  if (root.dataset.mode !== 'geek' || logoState.paused || Math.abs(logoState.speed) < .001) {
    logoState.speed = 0;
    logoState.paused = true;
    rotorAnimating = false;
    drawLogo();
    return;
  }
  logoState.angle += logoState.speed;
  logoState.speed *= .997;
  drawLogo();
  requestAnimationFrame(animateRotor);
}

function startRotor() {
  logoState.paused = false;
  if (!rotorAnimating) { rotorAnimating = true; requestAnimationFrame(animateRotor); }
}

logoImage.addEventListener('load', () => {
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
      const isRed = red > green * 1.25 && red > blue * 1.25;
      const coverage = isRed ? red / 255 : (red + green + blue) / (3 * 255);
      pixels.data[i] = 255;
      pixels.data[i + 1] = isRed ? 0 : 255;
      pixels.data[i + 2] = isRed ? 0 : 255;
      pixels.data[i + 3] = coverage < .08 ? 0 : Math.round(coverage * 255);
    }
    cropContext.putImageData(pixels, 0, 0);
    bladeCanvases.push({ canvas: crop, destinationX });
  });
  if (root.dataset.mode === 'geek') startRotor();
  else { logoState.paused = true; logoState.speed = 0; drawLogo(); }
});
logoImage.src = 'assets/logo.png';

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
    logoState.speed = 0;
    logoState.lastPointerAngle = Math.atan2(y - logoCanvas.height * fan.centerY, x - logoCanvas.width * fan.centerX);
  } else {
    logoState.render = (logoState.render + 1) % renderModes.length;
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
  logoState.speed = Math.max(-.35, Math.min(.35, delta * 4));
  logoState.lastPointerAngle = angle;
  logoState.moved ||= Math.abs(delta) > .012;
  drawLogo();
});
logoCanvas.addEventListener('pointerup', () => {
  if (!logoState.dragging) return;
  logoState.dragging = false;
  if (logoState.moved) startRotor();
  drawLogo();
});
logoCanvas.addEventListener('pointercancel', () => { logoState.dragging = false; drawLogo(); });
logoCanvas.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    logoState.speed = event.key === 'ArrowLeft' ? -.08 : .08;
    startRotor();
  }
  if (event.key === ' ') { event.preventDefault(); logoState.paused = true; logoState.speed = 0; drawLogo(); }
  if (event.key === 'Enter') { event.preventDefault(); logoState.render = (logoState.render + 1) % renderModes.length; drawLogo(); }
});

document.querySelector('#renderToggle').addEventListener('click', () => { logoState.render = (logoState.render + 1) % renderModes.length; drawLogo(); });
document.querySelector('#paletteToggle').addEventListener('click', event => {
  logoState.palette = !logoState.palette;
  geekConsole.classList.toggle('light-palette', logoState.palette);
  event.currentTarget.textContent = logoState.palette ? 'red' : 'light';
  event.currentTarget.setAttribute('aria-pressed', String(logoState.palette));
  drawLogo();
});
