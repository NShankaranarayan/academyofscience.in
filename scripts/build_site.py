#!/usr/bin/env python3
"""Build Markdown field notes into static, search-friendly HTML.

Uses only the Python standard library so the site remains dependency-free.
"""

from __future__ import annotations

import html
import re
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = ROOT / "content" / "notes"
TEMPLATE_DIR = ROOT / "templates"
OUTPUT_DIR = ROOT / "notes"
INDEX_PATH = ROOT / "index.html"
NOTES_INDEX_PATH = ROOT / "notes.html"
HOME_START = "<!-- FIELD_NOTES:START -->"
HOME_END = "<!-- FIELD_NOTES:END -->"


@dataclass(frozen=True)
class Contributor:
    name: str
    profile: str
    role: str


PEOPLE = {
    "shankaranarayan": ("Shankaranarayan N", "shankaranarayan.html"),
    "satwik": ("Satwik Ramsetti", "satwik.html"),
}


@dataclass(frozen=True)
class Note:
    title: str
    slug: str
    content_type: str
    category: str
    format: str
    published: str
    read_time: str
    excerpt: str
    number: str
    home: bool
    body: str
    share_image: str
    contributors: list[Contributor]
    tags: list[str]
    source_url: str
    video_url: str
    video_provider: str
    video_id: str
    video_duration: int
    video_thumbnail: str
    video_caption: str
    video_transcript: str

    @property
    def type_code(self) -> str:
        return "RD" if self.content_type == "R&D" else "ART"

    @property
    def display_date(self) -> str:
        try:
            parsed = date.fromisoformat(self.published)
            if parsed.month == 1 and parsed.day == 1:
                return str(parsed.year)
            return f"{parsed.day} {parsed.strftime('%B %Y')}"
        except ValueError:
            return self.published


def parse_front_matter(path: Path) -> tuple[dict[str, str], str]:
    source = path.read_text(encoding="utf-8")
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n", source, re.DOTALL)
    if not match:
        raise ValueError(f"{path}: missing YAML-style front matter")
    metadata: dict[str, str] = {}
    block_key: str | None = None
    block_lines: list[str] = []
    for line in match.group(1).splitlines():
        if block_key and (not line.strip() or line.startswith((" ", "\t"))):
            block_lines.append(line[2:] if line.startswith("  ") else line.lstrip())
            continue
        if block_key:
            metadata[block_key] = "\n".join(block_lines).strip()
            block_key = None
            block_lines = []
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        key, separator, value = line.partition(":")
        if not separator:
            raise ValueError(f"{path}: malformed front-matter line: {line!r}")
        value = value.strip()
        if value in {"|", "|-", "|+"}:
            block_key = key.strip()
        else:
            metadata[key.strip()] = value.strip('"\'')
    if block_key:
        metadata[block_key] = "\n".join(block_lines).strip()
    return metadata, source[match.end():]


def parse_video_source(raw_url: str, path: Path) -> tuple[str, str, str]:
    safe_video_url = safe_url(raw_url)
    parsed = urlparse(safe_video_url or "")
    if parsed.scheme != "https":
        raise ValueError(f"{path}: videoUrl must be an HTTPS YouTube or Instagram URL")

    instagram_hosts = {"instagram.com", "www.instagram.com", "m.instagram.com"}
    if parsed.hostname in instagram_hosts:
        match = re.fullmatch(r"/(p|reel|tv)/([A-Za-z0-9_-]{5,32})/?", parsed.path)
        if not match:
            raise ValueError(f"{path}: Instagram videoUrl must be a public post, reel, or video URL")
        return f"https://www.instagram.com/{match.group(1)}/{match.group(2)}/", "instagram", match.group(2)

    allowed_hosts = {"youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "youtube-nocookie.com", "www.youtube-nocookie.com"}
    if parsed.hostname not in allowed_hosts:
        raise ValueError(f"{path}: videoUrl must be an HTTPS YouTube or Instagram URL")
    if parsed.hostname == "youtu.be":
        video_id = parsed.path.strip("/").split("/")[0]
    elif parsed.path == "/watch":
        from urllib.parse import parse_qs
        video_id = parse_qs(parsed.query).get("v", [""])[0]
    else:
        match = re.match(r"^/(?:embed|shorts)/([A-Za-z0-9_-]{11})/?$", parsed.path)
        video_id = match.group(1) if match else ""
    if not re.fullmatch(r"[A-Za-z0-9_-]{11}", video_id):
        raise ValueError(f"{path}: videoUrl must identify one valid YouTube video")
    return safe_video_url, "youtube", video_id


def load_notes() -> list[Note]:
    required = {"title", "slug", "date", "type", "category", "format", "readTime", "excerpt", "number", "contributors", "tags"}
    required_sections = {
        "research": {"Problem", "Approach", "Findings", "Citations and publications"},
        "article": {"Explanation", "Visuals", "References", "Related work"},
    }
    notes: list[Note] = []
    for path in sorted(CONTENT_DIR.glob("*.md")):
        metadata, body = parse_front_matter(path)
        if metadata.get("status") != "published":
            continue
        missing = required - metadata.keys()
        if missing:
            raise ValueError(f"{path}: missing metadata: {', '.join(sorted(missing))}")
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", metadata["slug"]):
            raise ValueError(f"{path}: slug must contain lowercase words separated by hyphens")
        if metadata["type"] not in {"R&D", "Articles"}:
            raise ValueError(f"{path}: type must be R&D or Articles")
        if metadata["category"] not in {"Research and Development", "Articles"}:
            raise ValueError(f"{path}: category must be Research and Development or Articles")
        if (metadata["type"] == "Articles") != (metadata["category"] == "Articles"):
            raise ValueError(f"{path}: Articles type and category must match")
        entry_format = metadata["format"].lower()
        if entry_format not in required_sections:
            raise ValueError(f"{path}: format must be research or article")
        expected_category = "Articles" if entry_format == "article" else "Research and Development"
        if metadata["category"] != expected_category:
            raise ValueError(f"{path}: {entry_format} entries must use category {expected_category}")
        headings = set(re.findall(r"^##\s+(.+?)\s*$", body, re.MULTILINE))
        missing_sections = required_sections[entry_format] - headings
        if missing_sections:
            raise ValueError(f"{path}: {entry_format} entry missing sections: {', '.join(sorted(missing_sections))}")
        contributors = []
        for credit in metadata["contributors"].split(";"):
            person_id, separator, role = credit.strip().partition("|")
            if not separator or person_id not in PEOPLE or not role.strip():
                raise ValueError(f"{path}: invalid contributor credit {credit!r}")
            name, profile = PEOPLE[person_id]
            contributors.append(Contributor(name, profile, role.strip()))
        if not contributors:
            raise ValueError(f"{path}: at least one contributor is required")
        try:
            date.fromisoformat(metadata["date"])
        except ValueError as error:
            raise ValueError(f"{path}: date must use YYYY-MM-DD") from error
        if not metadata["number"].isdigit():
            raise ValueError(f"{path}: number must contain digits only")
        share_image = metadata.get("shareImage", "assets/research/explainable-ai.png")
        share_image_path = (ROOT / share_image).resolve()
        if not share_image.startswith("assets/") or not share_image_path.is_file() or ROOT not in share_image_path.parents:
            raise ValueError(f"{path}: shareImage must point to an existing file under assets/")
        source_url = metadata.get("sourceUrl", "")
        if source_url:
            safe_source_url = safe_url(source_url)
            parsed_source_url = urlparse(safe_source_url) if safe_source_url else None
            if not parsed_source_url or parsed_source_url.scheme not in {"http", "https"} or not parsed_source_url.hostname:
                raise ValueError(f"{path}: sourceUrl must be a valid HTTP(S) URL")
        video_url = metadata.get("videoUrl", "").strip()
        video_provider = ""
        video_id = ""
        video_duration = 0
        video_thumbnail = ""
        video_caption = metadata.get("videoCaption", "").strip()
        video_transcript = metadata.get("videoTranscript", "").strip()
        optional_video_fields = {"videoDuration", "videoThumbnail", "videoCaption", "videoTranscript"}
        if video_url:
            safe_video_url, video_provider, video_id = parse_video_source(video_url, path)
            try:
                video_duration = int(metadata.get("videoDuration", ""))
            except ValueError as error:
                raise ValueError(f"{path}: videoDuration must be an integer from 30 to 90 seconds") from error
            if not 30 <= video_duration <= 90:
                raise ValueError(f"{path}: videoDuration must be from 30 to 90 seconds")
            video_url = safe_video_url
            raw_thumbnail = metadata.get("videoThumbnail", "").strip()
            if raw_thumbnail.startswith("assets/"):
                thumbnail_path = (ROOT / raw_thumbnail).resolve()
                if ROOT not in thumbnail_path.parents or not thumbnail_path.is_file():
                    raise ValueError(f"{path}: videoThumbnail must point to an existing asset or an i.ytimg.com URL")
                video_thumbnail = "../" + raw_thumbnail
            elif raw_thumbnail:
                safe_thumbnail = safe_url(raw_thumbnail)
                parsed_thumbnail = urlparse(safe_thumbnail or "")
                allowed_thumbnail_host = video_provider == "youtube" and parsed_thumbnail.hostname == "i.ytimg.com"
                if parsed_thumbnail.scheme != "https" or not allowed_thumbnail_host:
                    raise ValueError(f"{path}: use a local assets/ thumbnail, or https://i.ytimg.com for YouTube")
                video_thumbnail = safe_thumbnail
            elif video_provider == "youtube":
                video_thumbnail = f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
        elif optional_video_fields.intersection(metadata):
            raise ValueError(f"{path}: videoDuration, videoThumbnail, videoCaption, and videoTranscript require videoUrl")
        notes.append(Note(
            title=metadata["title"], slug=metadata["slug"], content_type=metadata["type"], category=metadata["category"], format=entry_format,
            published=metadata["date"], read_time=metadata["readTime"],
            excerpt=metadata["excerpt"], number=metadata["number"],
            home=metadata.get("home", "false").lower() == "true", body=body,
            share_image=share_image, contributors=contributors,
            tags=[tag.strip() for tag in metadata["tags"].split(",") if tag.strip()],
            source_url=source_url,
            video_url=video_url, video_provider=video_provider, video_id=video_id, video_duration=video_duration,
            video_thumbnail=video_thumbnail, video_caption=video_caption,
            video_transcript=video_transcript,
        ))
    slugs = [note.slug for note in notes]
    if len(slugs) != len(set(slugs)):
        raise ValueError("Duplicate field-note slug")
    return sorted(notes, key=lambda note: (note.published, note.number), reverse=True)


def safe_url(raw: str) -> str | None:
    value = html.unescape(raw).strip()
    if not value or "\\" in value or any(ord(character) < 0x20 or ord(character) == 0x7f for character in value):
        return None
    parsed = urlparse(value)
    if parsed.scheme:
        if parsed.scheme in {"http", "https"}:
            try:
                if not parsed.hostname or parsed.username or parsed.password:
                    return None
            except ValueError:
                return None
        elif parsed.scheme == "mailto":
            if not parsed.path or parsed.netloc:
                return None
        else:
            return None
    elif parsed.netloc or value.startswith("//"):
        return None
    return value


def render_inline(raw: str) -> str:
    escaped = html.escape(raw, quote=True)
    code_tokens: list[str] = []

    def preserve_code(match: re.Match[str]) -> str:
        code_tokens.append(f"<code>{match.group(1)}</code>")
        return f"\x00CODE{len(code_tokens) - 1}\x00"

    escaped = re.sub(r"`([^`]+)`", preserve_code, escaped)

    def replace_image(match: re.Match[str]) -> str:
        target = safe_url(match.group(2))
        if target is None:
            return match.group(1)
        return (f'<img class="article-inline-visual" src="{html.escape(target, quote=True)}" '
                f'alt="{match.group(1)}" loading="lazy">')

    escaped = re.sub(r"!\[([^\]]*)\]\(([^)]+)\)", replace_image, escaped)

    def replace_link(match: re.Match[str]) -> str:
        target = safe_url(match.group(2))
        if target is None:
            return match.group(1)
        external = urlparse(target).scheme in {"http", "https"}
        rel = ' rel="noopener noreferrer"' if external else ""
        return f'<a href="{html.escape(target, quote=True)}"{rel}>{match.group(1)}</a>'

    escaped = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", replace_link, escaped)
    escaped = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", escaped)
    escaped = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<em>\1</em>", escaped)
    for index, token in enumerate(code_tokens):
        escaped = escaped.replace(f"\x00CODE{index}\x00", token)
    return escaped


def render_markdown(markdown: str) -> str:
    lines = markdown.lstrip("\n").splitlines()
    if lines and re.match(r"^#\s+", lines[0].strip()):
        lines = lines[1:]
    output: list[str] = []
    paragraph: list[str] = []
    list_kind: str | None = None
    quote_lines: list[str] = []
    code_lines: list[str] = []
    code_language = ""
    in_code = False

    def flush_paragraph() -> None:
        if paragraph:
            output.append(f"<p>{render_inline(' '.join(paragraph))}</p>")
            paragraph.clear()

    def close_list() -> None:
        nonlocal list_kind
        if list_kind:
            output.append(f"</{list_kind}>")
            list_kind = None

    def flush_quote() -> None:
        if quote_lines:
            output.append(f"<blockquote><p>{render_inline(' '.join(quote_lines))}</p></blockquote>")
            quote_lines.clear()

    for line in lines:
        stripped = line.strip()
        fence = re.match(r"^```([A-Za-z0-9_-]*)$", stripped)
        if fence:
            flush_paragraph(); close_list(); flush_quote()
            if in_code:
                language = f' class="language-{code_language}"' if code_language else ""
                output.append(f"<pre><code{language}>{html.escape(chr(10).join(code_lines))}</code></pre>")
                code_lines.clear(); in_code = False; code_language = ""
            else:
                in_code = True; code_language = fence.group(1)
            continue
        if in_code:
            code_lines.append(line)
            continue
        if not stripped:
            flush_paragraph(); close_list(); flush_quote(); continue
        heading = re.match(r"^(#{2,6})\s+(.+)$", stripped)
        if heading:
            flush_paragraph(); close_list(); flush_quote()
            level = len(heading.group(1))
            output.append(f"<h{level}>{render_inline(heading.group(2))}</h{level}>")
            continue
        if re.match(r"^(-{3,}|\*{3,})$", stripped):
            flush_paragraph(); close_list(); flush_quote(); output.append("<hr>"); continue
        quote = re.match(r"^>\s?(.*)$", stripped)
        if quote:
            flush_paragraph(); close_list(); quote_lines.append(quote.group(1)); continue
        bullet = re.match(r"^[-*]\s+(.+)$", stripped)
        ordered = re.match(r"^\d+\.\s+(.+)$", stripped)
        if bullet or ordered:
            flush_paragraph(); flush_quote()
            required_kind = "ul" if bullet else "ol"
            if list_kind != required_kind:
                close_list(); output.append(f"<{required_kind}>"); list_kind = required_kind
            output.append(f"<li>{render_inline((bullet or ordered).group(1))}</li>")
            continue
        flush_quote(); close_list(); paragraph.append(stripped)

    if in_code:
        raise ValueError("Unclosed fenced code block")
    flush_paragraph(); close_list(); flush_quote()
    return "\n".join(output)


def fill_template(name: str, values: dict[str, str]) -> str:
    template = (TEMPLATE_DIR / name).read_text(encoding="utf-8")
    for key, value in values.items():
        template = template.replace("{{" + key + "}}", value)
    leftovers = re.findall(r"{{[A-Z_]+}}", template)
    if leftovers:
        raise ValueError(f"{name}: unresolved placeholders: {leftovers}")
    return template


def note_card(note: Note, *, home: bool = False) -> str:
    title = html.escape(note.title)
    excerpt = html.escape(note.excerpt)
    href = f"notes/{html.escape(note.slug)}.html"
    if home:
        contributors = " · ".join(html.escape(person.name) for person in note.contributors)
    else:
        contributors = " · ".join(
            f'<a href="{html.escape(person.profile, quote=True)}">{html.escape(person.name)}</a>'
            for person in note.contributors
        )
    if home:
        extra = " knowledge" if note.content_type == "Articles" else ""
        return (f'<article class="home-note reveal{extra}"><span>{html.escape(note.content_type)} / '
                f'{html.escape(note.number)}</span><div><h3><a href="{href}">{title}</a></h3><p>{excerpt}</p>'
                f'<small class="note-contributors">{contributors}</small></div><a class="note-card-arrow" href="{href}" aria-label="Open {title}">↗</a></article>')
    extra = " featured-note" if note.content_type == "Articles" else ""
    author_ids = " ".join(person.profile.removesuffix(".html") for person in note.contributors)
    category = html.escape(note.category, quote=True)
    tags = "".join(f'<span>{html.escape(tag)}</span>' for tag in note.tags)
    safe_source_url = safe_url(note.source_url) if note.source_url else None
    source_link = (f'<a href="{html.escape(safe_source_url, quote=True)}" rel="noopener noreferrer">Source ↗</a>'
                   if safe_source_url else "")
    return (f'<article class="library-note{extra}" data-category="{category}" data-authors="{html.escape(author_ids, quote=True)}" '
            f'data-tags="{html.escape("|".join(tag.casefold() for tag in note.tags), quote=True)}">'
            f'<a class="library-cover" href="{href}" aria-label="Open {title}"><img src="{html.escape(note.share_image, quote=True)}" alt="" loading="lazy"></a>'
            f'<div class="library-note-body"><p class="portfolio-card-meta"><span>{category}</span><time datetime="{html.escape(note.published, quote=True)}">{html.escape(note.display_date)}</time></p>'
            f'<h3><a href="{href}">{title}</a></h3><span class="portfolio-card-excerpt">{excerpt}</span>'
            f'<small class="note-contributors">{contributors}</small><div class="portfolio-tags">{tags}</div>'
            f'<div class="portfolio-card-links"><a href="{href}">View item ↗</a>{source_link}</div></div></article>')


def video_summary_markup(note: Note) -> str:
    if not note.video_url:
        return ""
    duration_label = f"{note.video_duration // 60:02d}:{note.video_duration % 60:02d}"
    embed_url = (f"https://www.youtube-nocookie.com/embed/{note.video_id}"
                 f"?end={note.video_duration}&cc_load_policy=1&playsinline=1&rel=0") if note.video_provider == "youtube" else note.video_url
    title = html.escape(f"Play {duration_label} video summary for {note.title}", quote=True)
    poster_visual = (f'<img src="{html.escape(note.video_thumbnail, quote=True)}" alt="" loading="lazy">'
                     if note.video_thumbnail else
                     '<span class="video-placeholder" aria-hidden="true"><b>INSTAGRAM VIDEO</b><small>Click to load the public post</small></span>')
    play_label = "Play summary" if note.video_provider == "youtube" else "Load Instagram video"
    transcript = ""
    if note.video_transcript:
        transcript = (f'<details class="video-transcript"><summary>Read video transcript</summary>'
                      f'<p>{html.escape(note.video_transcript)}</p></details>')
    return (f'<section class="article-video-summary" aria-label="Video summary">'
            f'<div class="article-video-heading"><p>VIDEO SUMMARY <span>{duration_label}</span></p>'
            f'<a href="#article-content">Read full work <b aria-hidden="true">↓</b></a></div>'
            f'<figure><a class="video-poster" href="{html.escape(note.video_url, quote=True)}" target="_blank" '
            f'rel="noopener noreferrer" data-video-provider="{note.video_provider}" data-video-embed="{html.escape(embed_url, quote=True)}" '
            f'data-video-title="{title}" aria-label="Load video summary; opens the video host if playback is unavailable">'
            f'{poster_visual}<span class="video-play-button" aria-hidden="true"><i>▶</i> {play_label}</span></a>'
            f'<figcaption>{html.escape(note.video_caption or "Video summary")}</figcaption></figure>{transcript}</section>')


def build_articles(notes: list[Note]) -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)
    expected: set[Path] = set()
    for note in notes:
        path = OUTPUT_DIR / f"{note.slug}.html"
        expected.add(path)
        video_csp = {
            "VIDEO_FRAME_CSP": "'none'",
            "VIDEO_SCRIPT_CSP": "",
            "VIDEO_STYLE_CSP": "",
            "VIDEO_IMAGE_CSP": "",
            "VIDEO_CONNECT_CSP": "",
        }
        if note.video_provider == "youtube":
            video_csp["VIDEO_FRAME_CSP"] = "https://www.youtube-nocookie.com"
            if note.video_thumbnail.startswith("https://i.ytimg.com/"):
                video_csp["VIDEO_IMAGE_CSP"] = "https://i.ytimg.com"
        elif note.video_provider == "instagram":
            video_csp.update({
                "VIDEO_FRAME_CSP": "https://www.instagram.com",
                "VIDEO_SCRIPT_CSP": "https://www.instagram.com",
                "VIDEO_STYLE_CSP": "'unsafe-inline'",
                "VIDEO_CONNECT_CSP": "https://www.instagram.com",
            })
        path.write_text(fill_template("note.html", {
            "TITLE": html.escape(note.title, quote=True), "DESCRIPTION": html.escape(note.excerpt, quote=True),
            "SHARE_IMAGE_URL": html.escape(f"https://academyofscience.in/{note.share_image}", quote=True),
            "CATEGORY": html.escape(note.content_type, quote=True), "READ_TIME": html.escape(note.read_time),
            "FORMAT": html.escape(note.format, quote=True),
            "EXCERPT": html.escape(note.excerpt), "DATE": html.escape(note.published, quote=True),
            "DISPLAY_DATE": html.escape(note.display_date), "SLUG": html.escape(note.slug, quote=True),
            "NUMBER": html.escape(note.number, quote=True),
            **video_csp,
            "CONTRIBUTORS": " · ".join(
                f'<a href="../{html.escape(person.profile, quote=True)}">{html.escape(person.name)}</a>'
                f' <span>{html.escape(person.role)}</span>' for person in note.contributors
            ),
            "VIDEO_SUMMARY": video_summary_markup(note),
            "ARTICLE_BODY": render_markdown(note.body),
        }), encoding="utf-8")
    for stale in OUTPUT_DIR.glob("*.html"):
        if stale not in expected:
            stale.unlink()


def build_notes_index_legacy(notes: list[Note]) -> None:
    sections = []
    content_types = (("R&D", "Studies, publications, implementations, benchmarks, and prototypes."),
                     ("Articles", "Tutorials, reviews, and explainers."))
    for index, (content_type, description) in enumerate(content_types, 1):
        entries = [note for note in notes if note.content_type == content_type]
        cards = "\n".join(note_card(note) for note in entries)
        if not entries:
            cards = '<p class="portfolio-empty">Coming soon.</p>'
        sections.append(
            f'<div class="note-stream{" knowledge-stream" if index == 2 else ""}">\n'
            f'  <div class="stream-heading"><span>{index:02d}</span><div><p class="section-kicker">{content_type}</p>'
            f'<h2>{description}</h2></div></div>\n  <div class="library-note-list">{cards}</div>\n</div>'
        )
    NOTES_INDEX_PATH.write_text(fill_template("notes.html", {"NOTE_STREAMS": "\n".join(sections)}), encoding="utf-8")


def build_notes_index(notes: list[Note]) -> None:
    cards = "\n".join(note_card(note) for note in notes)
    authors = {}
    for note in notes:
        for person in note.contributors:
            person_id = person.profile.removesuffix(".html")
            authors[person_id] = person.name
    author_options = [
        f'<option value="{html.escape(person_id, quote=True)}">{html.escape(name)}</option>'
        for person_id, name in sorted(authors.items(), key=lambda item: item[1].casefold())
    ]
    topics = sorted({tag for note in notes for tag in note.tags}, key=str.casefold)
    topic_options = [
        f'<option value="{html.escape(tag.casefold(), quote=True)}">{html.escape(tag)}</option>'
        for tag in topics
    ]
    NOTES_INDEX_PATH.write_text(fill_template("notes.html", {
        "NOTE_STREAMS": cards,
        "AUTHOR_OPTIONS": "\n          ".join(author_options),
        "TOPIC_OPTIONS": "\n          ".join(topic_options),
    }), encoding="utf-8")


def update_homepage(notes: list[Note]) -> None:
    source = INDEX_PATH.read_text(encoding="utf-8")
    if source.count(HOME_START) != 1 or source.count(HOME_END) != 1:
        raise ValueError("index.html must contain exactly one Field Notes marker pair")
    selected = [note for note in notes if note.home]
    cards = "\n        ".join(note_card(note, home=True) for note in sorted(selected, key=lambda item: item.content_type))
    replacement = f"{HOME_START}\n      <div class=\"home-note-grid\">\n        {cards}\n      </div>\n      {HOME_END}"
    pattern = re.escape(HOME_START) + r".*?" + re.escape(HOME_END)
    INDEX_PATH.write_text(re.sub(pattern, replacement, source, flags=re.DOTALL), encoding="utf-8")


def update_contributor_profiles(notes: list[Note]) -> None:
    for person_id, (_, profile) in PEOPLE.items():
        profile_path = ROOT / profile
        source = profile_path.read_text(encoding="utf-8")
        start = f"<!-- SELECTED_WORK:{person_id}:START -->"
        end = f"<!-- SELECTED_WORK:{person_id}:END -->"
        if source.count(start) != 1 or source.count(end) != 1:
            raise ValueError(f"{profile}: expected exactly one selected-work marker pair")
        items = []
        for note in notes:
            for credit in note.contributors:
                if credit.profile == profile:
                    items.append(
                        f'<li><span>{html.escape(credit.role)} · {html.escape(note.content_type)}</span>'
                        f'<a href="notes/{html.escape(note.slug)}.html">{html.escape(note.title)} ↗</a></li>'
                    )
                    break
        generated = '<ol class="publication-list selected-work-list">\n        ' + "\n        ".join(items) + "\n      </ol>"
        pattern = re.escape(start) + r".*?" + re.escape(end)
        replacement = f"{start}\n      {generated}\n      {end}"
        profile_path.write_text(re.sub(pattern, replacement, source, flags=re.DOTALL), encoding="utf-8")


def main() -> None:
    import subprocess
    subprocess.run(["python3", str(ROOT / "scripts" / "build_theme.py")], check=True)
    notes = load_notes()
    if not notes:
        raise ValueError("No published field notes found")
    build_articles(notes)
    build_notes_index(notes)
    update_homepage(notes)
    update_contributor_profiles(notes)
    print(f"Built {len(notes)} field notes, notes.html, and homepage previews")


if __name__ == "__main__":
    main()
