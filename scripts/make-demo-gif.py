"""Render docs/demo.gif from the real queue-plus CSS."""

from __future__ import annotations

import re
import sys
from io import BytesIO
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
HTML_PATH = ROOT / "docs" / "demo.html"
GIF_PATH = ROOT / "docs" / "demo.gif"
STYLES_PATH = ROOT / "src" / "client" / "styles.ts"


def plugin_css() -> str:
    text = STYLES_PATH.read_text(encoding="utf-8")
    match = re.search(r"export const STYLE_TEXT = String\.raw`\n(.*)\n`", text, re.S)
    if match is None:
        raise SystemExit("STYLE_TEXT not found")
    return match.group(1)


def prepare_html() -> str:
    html = HTML_PATH.read_text(encoding="utf-8")
    if "PLACEHOLDER_STYLE" not in html:
        raise SystemExit("demo.html is missing PLACEHOLDER_STYLE")
    return html.replace("PLACEHOLDER_STYLE", plugin_css())


def frame(page, scene: str, *args) -> Image.Image:
    if args:
        page.evaluate("([name, arg]) => setScene(name, arg)", [scene, args[0]])
    else:
        page.evaluate("name => setScene(name)", scene)
    page.wait_for_timeout(40)
    png = page.screenshot(type="png")
    image = Image.open(BytesIO(png)).convert("RGBA")
    # Flatten onto the page background so GIF transparency does not flicker.
    bg = Image.new("RGB", image.size, (232, 234, 238))
    bg.paste(image, mask=image.split()[-1])
    return bg


def point(page, selector: str, visible: bool = True) -> None:
    page.evaluate(
        """([selector, visible]) => {
          const { x, y } = targetCenter(selector)
          placePointer(x, y, visible)
        }""",
        [selector, visible],
    )


def hide_pointer(page) -> None:
    page.evaluate("placePointer(0, 0, false)")


def lerp(a: tuple[float, float], b: tuple[float, float], t: float) -> tuple[float, float]:
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def pointer_to(page, selector: str) -> None:
    box = page.locator(selector).bounding_box()
    if box is None:
        return
    page.evaluate(
        "([x, y]) => placePointer(x, y, true)",
        [box["x"] + box["width"] / 2, box["y"] + box["height"] / 2],
    )


def collect(page) -> list[tuple[Image.Image, int]]:
    frames: list[tuple[Image.Image, int]] = []

    def add(image: Image.Image, ms: int) -> None:
        frames.append((image, ms))

    hide_pointer(page)
    add(frame(page, "manage"), 900)

    pointer_to(page, "#modeBtn")
    add(frame(page, "sortHover"), 500)
    add(frame(page, "sorting"), 900)

    pointer_to(page, ".dsh-queue-plus-row:nth-child(3) .dsh-queue-plus-drag-handle")
    add(frame(page, "sorting"), 350)
    add(frame(page, "dragging"), 700)
    hide_pointer(page)
    add(frame(page, "moved"), 1000)

    pointer_to(page, "#modeBtn")
    add(frame(page, "moved"), 350)
    hide_pointer(page)
    add(frame(page, "managedNew"), 800)

    pointer_to(page, "#clearBtn")
    add(frame(page, "clearHover"), 450)
    hide_pointer(page)
    add(frame(page, "clear", 10), 700)
    add(frame(page, "clear", 9), 400)
    add(frame(page, "clear", 8), 400)

    pointer_to(page, "#undoBtn")
    add(frame(page, "undoHover"), 500)
    hide_pointer(page)
    add(frame(page, "restored"), 1400)

    return frames


def write_gif(frames: list[tuple[Image.Image, int]]) -> None:
    if not frames:
        raise SystemExit("no frames")
    quantized = [image.convert("P", palette=Image.Palette.ADAPTIVE, colors=64) for image, _ in frames]
    durations = [ms for _, ms in frames]
    GIF_PATH.parent.mkdir(parents=True, exist_ok=True)
    quantized[0].save(
        GIF_PATH,
        save_all=True,
        append_images=quantized[1:],
        duration=durations,
        loop=0,
        optimize=True,
        disposal=2,
    )


def main() -> int:
    html = prepare_html()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="msedge")
        page = browser.new_page(viewport={"width": 720, "height": 430}, device_scale_factor=2)
        page.set_content(html, wait_until="domcontentloaded")
        frames = collect(page)
        browser.close()
    write_gif(frames)
    size_kb = GIF_PATH.stat().st_size / 1024
    print(f"wrote {GIF_PATH} ({size_kb:.0f} KB, {len(frames)} frames)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
