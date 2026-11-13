# Academy of Science

Static, database-free website for Academy of Science, designed for GitHub Pages. The configured domain is [academyofscience.in](https://academyofscience.in).

## Local preview

Run a static server from the repository root:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Content

Long-form source content lives in `content/` as Markdown. The current landing page is a buildless HTML/CSS/JavaScript implementation with two presentations:

- Normal Mode: editorial research-lab site
- Geek Mode: interactive terminal interface

The selected mode is stored only in the visitor's browser.

## GitHub Pages and domain

The root `CNAME` points GitHub Pages to `academyofscience.in`. In the repository settings, enable Pages from the main branch/root, then configure the domain registrar with GitHub's required DNS records. Enable **Enforce HTTPS** after DNS verification succeeds.

See [SECURITY.md](SECURITY.md) for the static site's security policy and the GitHub account/domain settings to enable.
