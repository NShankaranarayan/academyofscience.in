const noteSources = Object.freeze({
  'why-explainability-matters': 'content/notes/001-why-explainability-matters.md',
  'xai-for-dummies': 'content/notes/xai-for-dummies.md'
});

const params = new URLSearchParams(location.search);
const slug = params.get('note') || 'xai-for-dummies';
const source = noteSources[slug];

const escapeHTML = value => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const inline = value => escapeHTML(value)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/\*([^*]+)\*/g, '<em>$1</em>');

function splitFrontMatter(markdown) {
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  const meta = {};
  if (match) match[1].split('\n').forEach(line => {
    const separator = line.indexOf(':');
    if (separator > -1) meta[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  });
  return { meta, body: match ? markdown.slice(match[0].length) : markdown };
}

function renderMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const output = [];
  let paragraph = [];
  let listOpen = false;
  const flushParagraph = () => { if (paragraph.length) { output.push(`<p>${inline(paragraph.join(' '))}</p>`); paragraph = []; } };
  const closeList = () => { if (listOpen) { output.push('</ul>'); listOpen = false; } };

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) { flushParagraph(); closeList(); return; }
    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) { flushParagraph(); closeList(); const level = Math.min(heading[1].length, 4); output.push(`<h${level}>${inline(heading[2])}</h${level}>`); return; }
    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) { flushParagraph(); if (!listOpen) { output.push('<ul>'); listOpen = true; } output.push(`<li>${inline(bullet[1])}</li>`); return; }
    const quote = trimmed.match(/^>\s?(.*)$/);
    if (quote) { flushParagraph(); closeList(); output.push(`<blockquote>${inline(quote[1])}</blockquote>`); return; }
    const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
    if (ordered) { flushParagraph(); closeList(); output.push(`<p class="numbered-point">${inline(ordered[1])}</p>`); return; }
    paragraph.push(trimmed);
  });
  flushParagraph(); closeList();
  return output.join('');
}

function showError(message) {
  document.querySelector('#articleTitle').textContent = 'Field note unavailable';
  document.querySelector('#markdownBody').innerHTML = `<p>${escapeHTML(message)}</p><p><a href="notes.html">Return to all field notes →</a></p>`;
}

if (!source) {
  showError('The requested note is not part of the published field-note library.');
} else {
  fetch(source).then(response => {
    if (!response.ok) throw new Error('The Markdown source could not be loaded.');
    return response.text();
  }).then(markdown => {
    const { meta, body } = splitFrontMatter(markdown);
    document.title = `${meta.title || 'Field Note'} — Academy of Science`;
    document.querySelector('#articleTitle').textContent = meta.title || 'Field Note';
    document.querySelector('#articleCategory').textContent = meta.category || 'Field Note';
    document.querySelector('#articleReadTime').textContent = meta.readTime || '';
    document.querySelector('#articleExcerpt').textContent = meta.excerpt || '';
    const date = document.querySelector('#articleDate');
    date.textContent = meta.date || '';
    date.dateTime = meta.date || '';
    document.querySelector('#markdownBody').innerHTML = renderMarkdown(body.replace(/^#\s+.*\n+/, ''));
  }).catch(error => showError(error.message));
}
