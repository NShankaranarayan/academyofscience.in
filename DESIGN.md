# Academy of Science — Design System

## Direction

The site has one shared content model with two visual modes.

- **Normal Mode:** an editorial research publication — warm paper, black ink, restrained red, generous type, and analytical diagrams.
- **Geek Mode:** the same pages, content, layout, and typography in a dark palette. On the homepage, the fluid particle emblem replaces the normal emblem in the existing right-side hero illustration area. The optional UFO companion remains available on eligible desktop devices.

Geek Mode is the site’s night mode. It does not add a second homepage or rearrange page sections. Profiles, portfolio pages, and articles keep their Normal Mode structure and use the same HTML or Markdown source in both modes.

## Tokens

| Role | Normal | Geek |
|---|---|---|
| Background | `#F2EFE8` | `#090A0A` |
| Secondary background | `#E8E3D9` | `#111313` |
| Text | `#171716` | `#EFEDE6` |
| Muted | `#68665F` | `#A2A49F` |
| Accent | `#ED3326` or `#D4AA60` | Active theme accent |
| Border | 18% ink | `rgba(239,237,230,.17)` |

Typography uses system sans, monospace, and serif stacks to keep the page independent of external font services.

## Layout and responsiveness

- Fluid side padding: `clamp(1.25rem, 4vw, 4.75rem)`.
- Desktop: editorial hero, research areas, connected engagement flow, portfolio cards, and contributor cards.
- Tablet: stacked hero, two-column research cards, single-column contributors.
- Phone: single-column flow and compressed header.
- Geek Mode preserves these responsive layouts and changes the site palette; the homepage fluid logo replaces the normal emblem in the existing hero illustration area.

## Components

- Header with logo, anchor navigation, and persistent mode switch.
- Editorial hero with animated orbital measurement graphic.
- The page leads with the lab's broad independent AI R&D capability. Research cards establish Shankar's Explainable AI and Satwik's Physical AI as specializations rather than boundaries. Separate work-model and application-domain sections distinguish original research from commissioned R&D and show where the lab can apply its capabilities.
- Markdown-generated Field Note previews, library cards, pre-rendered article pages, contributor cards, and high-contrast footer.
- Fluid particle logo with pointer and keyboard controls in Geek Mode, theme-colored accents, keyboard focus indicators, and the optional UFO launcher. The UFO is hidden outside eligible Geek Mode sessions and ignores page input.

## Assets

- Editable vector emblem: `assets/logo.svg` is the master artwork. `scripts/build_theme.py` generates the active accent-color variant from `themes/active.json`; Normal and Geek modes use this same SVG source for the animated fan and dot-rendered emblem.
- Original generated research illustrations: `assets/research/explainable-ai.png`, `assets/research/computer-vision-ads.png`, and `assets/research/embodied-physical-ai.png`.
- Generated profile-project atlases: `assets/profiles/shankaranarayan-projects.png` and `assets/profiles/satwik-projects.png`.
- No third-party photography or invented portraits. Contributor monograms are intentionally used until profile images and biographies are supplied.

## Content implementation

The site is static and database-free. Portfolio items use Markdown files in `content/notes/` as their single source of truth. `scripts/build_site.py` validates front matter and pre-renders the library, homepage previews, canonical metadata, and complete article HTML using templates in `templates/`. The same output is themed by the saved Normal/Geek mode selection; no separate article content is maintained for Geek Mode.
