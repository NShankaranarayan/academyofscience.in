# Academy of Science — Design System

## Direction

The site deliberately has two visual identities sharing one content model.

- **Normal Mode:** an editorial research publication — warm paper, black ink, restrained red, generous type, and analytical diagrams.
- **Geek Mode:** a terminal-style research console influenced by the panel arrangement and pixel rendering in the supplied lukasstoll.com reference screenshot.

## Reference evidence

The reference screenshot shows a compact command bar, large central visual panel, terminal output and prompt below, and a telemetry/project sidebar to the right. The site adopts that arrangement with its own red-accented palette and content. The logo is downsampled to a 90×90 source grid and enlarged with nearest-neighbour rendering for visible square pixels; the paired blades are separately drawn around the fixed hub for the touch/drag interaction.

## Tokens

| Role | Normal | Geek |
|---|---|---|
| Background | `#F2EFE8` | `#0D0D0E` |
| Secondary background | `#E8E3D9` | `#111113` |
| Text | `#171716` | `#F3F0EB` |
| Muted | `#68665F` | `#777674` |
| Accent | `#ED3326` | `#FF574C` |
| Border | 18% ink | `#29292B` |

Typography uses system sans, monospace, and serif stacks to keep the page independent of external font services.

## Layout and responsiveness

- Fluid side padding: `clamp(1.25rem, 4vw, 4.75rem)`.
- Desktop: two-column hero, two specialization cards, two contributor cards.
- Tablet: stacked hero, two-column research cards, single-column contributors.
- Phone: single-column flow, compressed header, terminal telemetry hidden so the command interface remains usable.
- Geek Mode uses a viewport-height console with the visualizer at left, telemetry and research links at right, terminal panel below the visual, then command chips and footer. On phones, these panels stack and the console can scroll vertically.

## Components

- Header with logo, anchor navigation, and persistent mode switch.
- Editorial hero with animated orbital measurement graphic.
- The page leads with the lab's broad independent AI R&D capability. Research cards establish Shankar's Explainable AI and Satwik's Physical AI as specializations rather than boundaries. Separate work-model and application-domain sections distinguish original research from commissioned R&D and show where the lab can apply its capabilities.
- Markdown-generated Field Note previews, library cards, pre-rendered article pages, contributor cards, and high-contrast footer.
- Pixel-rendered logo visualizer, terminal output and prompt with history/completion, telemetry/projects panel, render and palette controls, shortcut chips, and CRT toggle.

## Assets

- User-supplied logo: `assets/logo.png`, presented unchanged except for browser scaling.
- Original generated research illustrations: `assets/research/explainable-ai.png`, `assets/research/computer-vision-ads.png`, and `assets/research/embodied-physical-ai.png`.
- Generated profile-project atlases: `assets/profiles/shankaranarayan-projects.png` and `assets/profiles/satwik-projects.png`.
- No third-party photography or invented portraits. Contributor monograms are intentionally used until profile images and biographies are supplied.

## Content implementation

The site is static and database-free. Field Notes use Markdown files in `content/notes/` as their single source of truth. `scripts/build_site.py` validates front matter and pre-renders the library, homepage previews, canonical metadata, and complete article HTML using templates in `templates/`. Generated article pages require no client-side JavaScript.
