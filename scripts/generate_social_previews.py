#!/usr/bin/env python3
"""Generate fixed, article-specific PNG cards used by link previews.

Install Pillow with ``python3 -m pip install Pillow`` before running this
optional asset-generation script. The regular static-site build stays stdlib-only.
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional, Union

from PIL import Image, ImageDraw, ImageFont

from build_site import ROOT, load_notes


WIDTH, HEIGHT = 1200, 627
OUTPUT_DIR = ROOT / "assets" / "social-previews"
BACKGROUND = "#090a0a"
GOLD = "#d4aa60"
INK = "#f2efe8"
MUTED = "#b7b8b2"
LINE = "#343735"


def load_font(size: int, *, bold: bool = False, mono: bool = False) -> Union[ImageFont.FreeTypeFont, ImageFont.ImageFont]:
    if mono:
        candidates = [
            "/System/Library/Fonts/Supplemental/Courier New.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
        ]
    elif bold:
        candidates = [
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
            "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
        ]
    else:
        candidates = [
            "/System/Library/Fonts/Supplemental/Arial.ttf",
            "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
        ]
    for candidate in candidates:
        if Path(candidate).is_file():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def wrap(
    draw: ImageDraw.ImageDraw,
    text: str,
    font: ImageFont.ImageFont,
    max_width: int,
    max_lines: Optional[int],
) -> list[str]:
    words = text.split()
    lines: list[str] = []
    line = ""
    for word in words:
        test = f"{line} {word}".strip()
        if draw.textlength(test, font=font) > max_width and line:
            lines.append(line)
            line = word
        else:
            line = test
    if line:
        lines.append(line)
    if max_lines is not None and len(lines) > max_lines:
        lines = lines[:max_lines]
        final = lines[-1]
        while final and draw.textlength(f"{final}…", font=font) > max_width:
            final = final[:-1]
        lines[-1] = f"{final.rstrip()}…"
    return lines


def make_preview(note) -> Image.Image:
    image = Image.new("RGB", (WIDTH, HEIGHT), BACKGROUND)
    draw = ImageDraw.Draw(image)
    draw.rectangle((16, 16, WIDTH - 16, HEIGHT - 16), outline="#292c2a", width=2)
    draw.rectangle((16, 16, 24, HEIGHT - 16), fill=GOLD)

    category = note.content_type.upper()
    mono = load_font(16, bold=True, mono=True)
    draw.text((72, 76), f"PORTFOLIO / {category}", fill=GOLD, font=mono)
    draw.text((1128, 76), f"{note.number.zfill(2)} / ACADEMY OF SCIENCE", fill=GOLD, font=mono, anchor="ra")
    draw.line((72, 104, 1128, 104), fill=LINE, width=1)

    draw.text((72, 160), f"{note.number.zfill(2)} / {category}", fill=GOLD, font=load_font(16, bold=True, mono=True))
    title_size = 58 if len(note.title) <= 42 else 50
    title_font = load_font(title_size, bold=True)
    title_lines = wrap(draw, note.title, title_font, 780, None)
    while (len(title_lines) > 3 or any(draw.textlength(line, font=title_font) > 780 for line in title_lines)) and title_size > 32:
        title_size -= 2
        title_font = load_font(title_size, bold=True)
        title_lines = wrap(draw, note.title, title_font, 780, None)
    title_lines = wrap(draw, note.title, title_font, 780, 3)

    y = 194
    title_spacing = title_size + 8
    for line in title_lines:
        draw.text((72, y), line, fill=INK, font=title_font)
        y += title_spacing

    summary_font = load_font(25)
    summary_lines = wrap(draw, note.excerpt, summary_font, 760, 3)
    summary_y = y + 16
    for line in summary_lines:
        draw.text((76, summary_y), line, fill=MUTED, font=summary_font)
        summary_y += 40

    orbit = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    orbit_draw = ImageDraw.Draw(orbit)
    center_x, center_y = 1000, 344
    orbit_color = (212, 170, 96, 72)
    for radius in (88, 120, 150):
        orbit_draw.ellipse(
            (center_x - radius, center_y - radius, center_x + radius, center_y + radius),
            outline=orbit_color,
            width=1,
        )
    orbit_draw.line((center_x - 168, center_y, center_x + 168, center_y), fill=(255, 255, 255, 36), width=1)
    orbit_draw.line((center_x, center_y - 168, center_x, center_y + 168), fill=(255, 255, 255, 36), width=1)
    orbit_draw.ellipse((center_x + 82, center_y - 84, center_x + 96, center_y - 70), fill=GOLD)
    orbit_draw.ellipse((center_x - 119, center_y + 53, center_x - 111, center_y + 61), fill=(212, 170, 96, 200))
    image = Image.alpha_composite(image.convert("RGBA"), orbit)
    draw = ImageDraw.Draw(image)

    footer_y = 548
    draw.line((72, footer_y, 1128, footer_y), fill=LINE, width=1)
    footer_font = load_font(14, bold=True, mono=True)
    draw.text((72, footer_y + 27), "ACADEMY OF SCIENCE", fill=INK, font=footer_font)
    draw.text((1128, footer_y + 27), "ACADEMYOFSCIENCE.IN", fill=GOLD, font=footer_font, anchor="ra")
    return image.convert("RGB")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    notes = load_notes()
    for note in notes:
        destination = OUTPUT_DIR / f"{note.slug}.png"
        make_preview(note).save(destination, format="PNG", optimize=True)
        size_kb = destination.stat().st_size / 1024
        if size_kb >= 600:
            raise ValueError(f"{destination} is {size_kb:.0f} KB; WhatsApp preview images must be under 600 KB")
        print(f"Generated {destination.relative_to(ROOT)} ({size_kb:.0f} KB)")


if __name__ == "__main__":
    main()
