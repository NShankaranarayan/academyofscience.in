try {
  document.documentElement.dataset.mode = localStorage.getItem('aos-mode') === 'geek' ? 'geek' : 'normal';
} catch {
  document.documentElement.dataset.mode = 'normal';
}
