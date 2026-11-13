const pageRoot = document.documentElement;
const pageTheme = document.querySelector('meta[name="theme-color"]');
const pageModeToggle = document.querySelector('#pageModeToggle');

function applyPageMode(mode) {
  pageRoot.dataset.mode = mode;
  if (pageTheme) pageTheme.content = mode === 'geek' ? '#090a0a' : '#f2efe8';
  if (pageModeToggle) {
    pageModeToggle.setAttribute('aria-pressed', String(mode === 'geek'));
    pageModeToggle.innerHTML = mode === 'geek' ? '<span></span> Normal mode' : '<span></span> Geek mode';
  }
  try { localStorage.setItem('aos-mode', mode); } catch {}
}

let pageMode = 'normal';
try { pageMode = localStorage.getItem('aos-mode') === 'geek' ? 'geek' : 'normal'; } catch {}
applyPageMode(pageMode);

pageModeToggle?.addEventListener('click', () => {
  applyPageMode(pageRoot.dataset.mode === 'geek' ? 'normal' : 'geek');
});
