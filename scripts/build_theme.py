#!/usr/bin/env python3
"""Compile the repository-selected theme into a tiny early-loading script."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
THEMES = ROOT / "themes"
ACTIVE = json.loads((THEMES / "active.json").read_text(encoding="utf-8"))["active"]
if ACTIVE not in {"red", "gold"}:
    raise ValueError("themes/active.json: active must name an existing supported theme")
THEME = json.loads((THEMES / f"{ACTIVE}.json").read_text(encoding="utf-8"))
for key in ("accent", "accent-bright", "dark-background", "header-footer", "paper", "paper-secondary", "logo", "logo-mark"):
    if key not in THEME:
        raise ValueError(f"themes/{ACTIVE}.json: missing {key}")

values = {
    "theme": ACTIVE,
    "accent": THEME["accent"],
    "accentBright": THEME["accent-bright"],
    "darkBackground": THEME["dark-background"],
    "headerFooter": THEME["header-footer"],
    "paper": THEME["paper"],
    "paperSecondary": THEME["paper-secondary"],
    "logo": THEME["logo"].replace("../", ""),
    "logoMark": THEME["logo-mark"].replace("../", ""),
}
for source_name, theme_key in (("logo.svg", "logo"), ("logo-mark.svg", "logo-mark")):
    source_logo = (ROOT / "assets" / source_name).read_text(encoding="utf-8")
    accented_logo = source_logo.replace("#ED3326", THEME["accent"])
    logo_name = THEME[theme_key].split("/")[-1]
    (ROOT / "assets" / logo_name).write_text(accented_logo, encoding="utf-8")
script = "/* Generated from themes/active.json; run python3 scripts/build_theme.py after changing themes. */\n"
script += "const activeTheme = " + json.dumps(values, separators=(",", ":")) + ";\n"
script += "document.documentElement.dataset.theme = activeTheme.theme;\n"
script += "for (const [key, value] of Object.entries(activeTheme)) { if (key !== 'theme') document.documentElement.style.setProperty('--' + key.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase()), value); }\n"
(THEMES / "active-theme.js").write_text(script, encoding="utf-8")
