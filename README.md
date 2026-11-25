# Academy of Science

Static website for [academyofscience.in](https://academyofscience.in), an independent AI research and development lab. The site is designed for GitHub Pages and has no runtime framework, package manager, database, or third-party JavaScript dependency.

The homepage and profile pages are hand-authored HTML. Portfolio articles are authored in Markdown and converted into static HTML by a dependency-free Python build script. Normal and Geek modes share the same page content; Geek Mode is a visual theme, not a parallel copy of each page.

## Requirements

- Python 3.9 or newer
- A local HTTP server for previewing the site
- Optional: Pillow, only needed to generate or refresh article social preview images

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

### Normal and Geek modes

Each page has one content source. The mode control stores the selected appearance and applies it across the homepage, contributor profiles, Portfolio library, and article pages. To publish a Portfolio item, add one Markdown file under `content/notes/` and build the site; the generated article and library entry automatically support both modes through the shared templates and stylesheet. Do not create a separate Geek version of the same content.

## Adding a Portfolio Item

Create a Markdown file under `content/notes/` with this front matter:

```yaml
---
title: Example note title
slug: example-note-title
date: 2026-11-13
type: Articles
category: Articles
format: article
contributors: shankaranarayan|Author
tags: Explainable AI, AI fundamentals
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

### Optional video summary

An item can include a 30–90-second video summary near the start of its article, hosted on YouTube or in a public, embed-enabled Instagram post or Reel. The page loads the player only after a reader chooses Play/Load. YouTube uses its privacy-enhanced embed and requests host captions; Instagram uses Meta's embed script after the reader chooses Load. Include an accurate transcript in the item metadata as well. YouTube posters default to the host thumbnail. `videoThumbnail` can point to a local file under `assets/`; YouTube also accepts an `i.ytimg.com` image. Instagram thumbnails must be local assets.

```yaml
videoUrl: https://www.youtube.com/watch?v=VIDEO_ID
videoDuration: 60
videoThumbnail: assets/research/video-summary.jpg # optional
videoCaption: A concise description of the video.
videoTranscript: |
  [00:00] Transcript text begins here.
  [00:30] Continue with the spoken words and timestamps.
```

For Instagram, use a public post or Reel URL instead, such as `https://www.instagram.com/reel/SHORTCODE/`. A local `videoThumbnail` is optional; without one, the article shows a branded load poster. Private posts and posts whose owner has disabled embedding cannot be embedded.

Keep these optional fields inside the item's front matter. The video block includes a visible “Read full work” link to the written report.

### Metadata fields

| Field | Purpose |
|---|---|
| `title` | Article title and social-preview title |
| `slug` | Output filename under `notes/` |
| `date` | Publication date in ISO `YYYY-MM-DD` form |
| `type` | `R&D` or `Articles` |
| `category` | `Research and Development` or `Articles`; used by the Portfolio filters |
| `format` | `research` or `article`; selects the required content outline |
| `contributors` | Ordered credits in `person-id|role` form, separated by semicolons. Use `shankaranarayan` or `satwik`; each credit links to that contributor's profile. |
| `status` | Only `published` notes are built |
| `readTime` | Reader-facing estimate such as `5 min read` |
| `number` | Sequence number within the content type |
| `home` | Set to `true` to include the note on the homepage |
| `excerpt` | Library card, article introduction, and meta description |
| `tags` | Comma-separated topics used by Portfolio topic filters |
| `sourceUrl` | Optional canonical publication or project link shown on the Portfolio card |

### Standard content outlines

Keep the same generated article page. The `format` field validates the matching Markdown headings before publishing:

- `research` (category `Research and Development`): `Problem`, `Approach`, `Findings`, `Citations and publications`.
- `article` (category `Articles`): `Explanation`, `Visuals`, `References`, `Related work`. Add images with Markdown image syntax; the generator renders them safely.

Every published item uses the same Portfolio card and article template. The build stops with a clear error if a required section is missing.

The generator supports headings, paragraphs, emphasis, inline code, safe Markdown links, unordered and ordered lists, blockquotes, horizontal rules, and fenced code blocks. Raw HTML is escaped rather than executed.

### Sharing a Portfolio entry

Detail pages provide a LinkedIn share link and a copy-URL action. Browsers with the Web Share API also show a device share action. **Create social image** opens the Share Kit, where visitors can personalize a caption and download a PNG sized for a LinkedIn post (1200 × 627), Instagram post (1080 × 1350), or Instagram story (1080 × 1920). Visitors upload Instagram images in the Instagram app; the website does not claim to publish directly to Instagram. Each article URL also has a fixed, article-specific 1200 × 627 social card in its Open Graph metadata for WhatsApp and other link previews. That card uses the article title and excerpt; the visitor-customized download remains separate. Generate or refresh those static images with `python3 scripts/generate_social_previews.py`.

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
- `/notes/why-explainability-matters.html` (the former XAI for Dummies article redirects here)
- `/shankaranarayan.html`
- `/satwik.html`

## Content and design

- Normal Mode is an editorial research-lab presentation.
- Geek Mode is the site-wide night theme. It keeps the same page structure and content, with the homepage fluid logo and optional UFO companion.
- The site uses system fonts and local assets only.
- Styles and scripts are governed by restrictive per-page Content Security Policies.
- Article HTML is pre-rendered for accessibility, search indexing, link previews, and operation without JavaScript.

See [DESIGN.md](DESIGN.md) for the visual system and [SECURITY.md](SECURITY.md) for hosting and account guidance.

## GitHub Pages deployment

The root `CNAME` points to `academyofscience.in`. Configure GitHub Pages to publish from the intended branch and repository root. Enable **Enforce HTTPS** after DNS and certificate verification.

Because generated HTML is committed, deployment requires no server-side or CI build process. A future CI workflow can run `python3 scripts/build_site.py` and fail when generated files are stale.
