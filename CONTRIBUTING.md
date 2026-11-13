# Contributing

Create working branches with one of these prefixes:

- `feat/` for new features and content
- `fix/` for bug fixes
- `chore/` for maintenance and configuration

Every commit subject and pull request title must start with `feat: `, `fix: `, or `chore: `.

Open a pull request into `main` and get an approval from the other contributor before merging. The `Repository policy` GitHub Actions check validates the source branch name, pull request title, and commit subjects. In **Settings → Branches**, protect `main` by requiring a pull request, one approval, resolved conversations, and the `Branch and commit conventions` status check. Squash merging keeps the resulting commit subject aligned with the pull request title.

## Content and generated files

Field Notes are authored in `content/notes/`. After changing Markdown, article templates, or the generator, run:

```bash
python3 scripts/build_site.py
```

Commit the resulting updates to `notes.html`, `notes/*.html`, and the generated Field Notes block in `index.html`. Do not edit those generated sections directly. See [README.md](README.md) for the complete repository structure and local setup.
