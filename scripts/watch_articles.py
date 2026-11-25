#!/usr/bin/env python3
"""Rebuild article pages and social cards whenever a note changes."""

from __future__ import annotations

import subprocess
import sys
import time
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = ROOT / "content" / "notes"
POLL_SECONDS = 0.75
DEBOUNCE_SECONDS = 0.5


def snapshot() -> dict[str, tuple[int, int]]:
    files: dict[str, tuple[int, int]] = {}
    for path in CONTENT_DIR.glob("*.md"):
        try:
            info = path.stat()
        except FileNotFoundError:
            continue
        files[str(path.relative_to(CONTENT_DIR))] = (info.st_mtime_ns, info.st_size)
    return files


def build() -> int:
    print("Rebuilding site and article social images...", flush=True)
    result = subprocess.run([sys.executable, str(ROOT / "scripts" / "build_site.py")], cwd=ROOT)
    if result.returncode == 0:
        print("Build complete; watching for article changes.", flush=True)
    else:
        print(f"Build failed with exit code {result.returncode}; fix the article and save to retry.", flush=True)
    return result.returncode


def build_until_stable() -> dict[str, tuple[int, int]]:
    while True:
        before = snapshot()
        build()
        after = snapshot()
        if after == before:
            return after
        time.sleep(DEBOUNCE_SECONDS)


def main() -> None:
    current = build_until_stable()
    print("Watching content/notes for edits, new articles, and deletions.", flush=True)

    while True:
        time.sleep(POLL_SECONDS)
        changed = snapshot()
        if changed == current:
            continue
        time.sleep(DEBOUNCE_SECONDS)
        stable = snapshot()
        if stable != changed:
            continue
        current = build_until_stable()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Stopped article watcher.", flush=True)
