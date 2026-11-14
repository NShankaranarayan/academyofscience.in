# Academy of Science

Static website for [academyofscience.in](https://academyofscience.in), an independent AI research and development lab. The site is designed for GitHub Pages and has no runtime framework, package manager, database, or third-party JavaScript dependency.

The homepage and profile pages are hand-authored HTML. Field Notes are authored in Markdown and converted into complete static HTML by a dependency-free Python build script.

## Requirements

- Python 3.9 or newer
- A local HTTP server for previewing the site

No Python packages need to be installed.

## Quick start

From the repository root:

```bash
python3 scripts/build_theme.py
python3 scripts/build_site.py
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000).

Always run the build before committing changes to Field Notes. The generated HTML is committed because GitHub Pages serves the repository directly without running a build step.

## Repository structure

```text
.
├── index.html                 # Main landing page; note previews are generated
├── notes.html                 # Generated Field Notes library
├── shankaranarayan.html       # Researcher profile
├── satwik.html                # Researcher profile
├── styles.css                 # Shared site and article design system
├── script.js                  # Homepage Normal/Geek mode interactions
├── CNAME                      # GitHub Pages custom domain
│
├── assets/
│   ├── logo.svg                # Editable vector master emblem
│   ├── logo-gold.svg           # Generated gold accent variant
│   ├── logo-mark.svg           # Compact vector emblem used in Geek chrome
│   ├── logo-mark-gold.svg      # Generated gold compact emblem
│   ├── profiles/              # Profile project illustration atlases
│   └── research/              # Homepage research illustrations
│
├── content/
│   ├── about.md               # Durable source copy about the lab
│   └── notes/                 # Authoritative Markdown Field Notes
│
├── templates/
│   ├── note.html              # Static article template
│   └── notes.html             # Field Notes library template
│
├── scripts/
│   ├── build_site.py          # Markdown renderer and static-site generator
│   └── build_theme.py         # Compiles the repository-selected theme
│
├── themes/
│   ├── active.json            # Repository-owned active theme selection
│   ├── red.json               # Red and black palette
│   ├── gold.json              # Gold accent palette
│   └── active-theme.js        # Generated early-loading theme variables
│
└── notes/                     # Generated, publishable article HTML
```

`content/`, `templates/`, and `scripts/` are source. The root `notes.html`, the homepage note-card block, and `notes/*.html` are generated output.

### Changing the site theme

Edit `themes/active.json` to select `red` or `gold`, then run `python3 scripts/build_theme.py`. This generates `themes/active-theme.js` and the selected vector logo variant from `assets/logo.svg`. The homepage animation and Geek mode dot logo both render from that same SVG. Edit the SVG artwork itself to change the emblem; change the accent value in a theme JSON file to recolor it.

## Writing a Field Note

Create a Markdown file under `content/notes/` with this front matter:

```yaml
---
title: Example note title
slug: example-note-title
date: 2026-11-13
category: Knowledge Blog
status: published
readTime: 5 min read
number: 002
home: true
excerpt: One concise sentence used in cards and search metadata.
---
```

Then write the article in Markdown below the front matter and run:

```bash
python3 scripts/build_site.py
```

### Metadata fields

| Field | Purpose |
|---|---|
| `title` | Article title and social-preview title |
| `slug` | Output filename under `notes/` |
| `date` | Publication date in ISO `YYYY-MM-DD` form |
| `category` | `Ideas in Progress` or `Knowledge Blog` |
| `status` | Only `published` notes are built |
| `readTime` | Reader-facing estimate such as `5 min read` |
| `number` | Sequence number within the category |
| `home` | Set to `true` to include the note on the homepage |
| `excerpt` | Library card, article introduction, and meta description |
| `shareImage` | Optional image under `assets/` used for LinkedIn and social link previews; defaults to the XAI research illustration |

The generator supports headings, paragraphs, emphasis, inline code, safe Markdown links, unordered and ordered lists, blockquotes, horizontal rules, and fenced code blocks. Raw HTML is escaped rather than executed.

### Sharing a Field Note

Open any published article and choose **Prepare a share card**. The share studio lets you write a short personal summary, preview the theme-colored card, download it as a PNG, or copy a caption with the article URL. **Copy caption & open LinkedIn** opens LinkedIn's composer and copies the caption for you to paste. For a LinkedIn image post, upload the downloaded card and paste the caption with its link. The linked article also includes Open Graph metadata and the note's `shareImage` for link previews.

## Selecting the site theme

Theme selection is controlled in the repository. Visitors do not get a theme picker. Edit `themes/active.json` and set `active` to `red` or `gold`:

```json
{
  "active": "gold"
}
```

Then run the site build so the selected theme is compiled into the early-loading theme script and propagated to generated Field Notes:

```bash
python3 scripts/build_site.py
```

Set `active` back to `red` to restore the original red palette. Palette values live in `themes/red.json` and `themes/gold.json`; both Normal and Geek Mode read the same selected accent. Logo artwork uses the shared source logo and recolors its red components to match.

## Generated output policy

Do not manually edit:

- `notes.html`
- `notes/*.html`
- content between `<!-- FIELD_NOTES:START -->` and `<!-- FIELD_NOTES:END -->` in `index.html`

Those files are deterministically rebuilt from Markdown and templates. Edit the corresponding source and run the build instead.

## Validation

Run the build twice when changing the generator or templates; the second run should produce no Git diff.

Useful checks:

```bash
python3 scripts/build_site.py
git diff --check
git status --short
```

Preview these representative routes:

- `/`
- `/notes.html`
- `/notes/xai-for-dummies.html`
- `/shankaranarayan.html`
- `/satwik.html`

## Content and design

- Normal Mode is an editorial research-lab presentation.
- Geek Mode is an interactive terminal-style presentation available on the homepage.
- The site uses system fonts and local assets only.
- Styles and scripts are governed by restrictive per-page Content Security Policies.
- Article HTML is pre-rendered for accessibility, search indexing, link previews, and operation without JavaScript.

See [DESIGN.md](DESIGN.md) for the visual system and [SECURITY.md](SECURITY.md) for hosting and account guidance.

## GitHub Pages deployment

The root `CNAME` points to `academyofscience.in`. Configure GitHub Pages to publish from the intended branch and repository root. Enable **Enforce HTTPS** after DNS and certificate verification.

Because generated HTML is committed, deployment requires no server-side or CI build process. A future CI workflow can run `python3 scripts/build_site.py` and fail when generated files are stale.
