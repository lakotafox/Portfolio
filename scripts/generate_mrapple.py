#!/usr/bin/env python3
"""Mr Apple — the fruit map's mascot, 7 expression frames.

Draws a chunky pixel-art apple guy at 34x40 logical pixels, upscales x5
nearest-neighbor, writes public/olliesfruitmap/mrapple/<frame>.png with
the same frame names as Gifsmith's Floppy, so hand-drawn art can replace
these files any time without code changes.

Frames: idle, blink, talk, talk2, look, look2, squint.
"""
import pathlib

from PIL import Image, ImageDraw

OUT = pathlib.Path(__file__).resolve().parent.parent / "public" / "olliesfruitmap" / "mrapple"
OUT.mkdir(parents=True, exist_ok=True)

W, H, SCALE = 34, 40, 5

RED = (224, 49, 49, 255)
RED_D = (176, 37, 37, 255)
RED_HI = (255, 135, 135, 255)
STEM = (121, 92, 52, 255)
LEAF = (102, 168, 15, 255)
LEAF_D = (74, 124, 10, 255)
WHITE = (255, 255, 255, 255)
BLACK = (20, 12, 12, 255)
MOUTH = (92, 31, 31, 255)
CHEEK = (255, 122, 122, 255)
FOOT = (121, 92, 52, 255)


def base():
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # feet first (peek out under the body)
    d.ellipse([7, 34, 14, 38], fill=FOOT)
    d.ellipse([19, 34, 26, 38], fill=FOOT)
    # body: two lobes up top like a real apple
    d.ellipse([2, 10, 31, 36], fill=RED)
    d.ellipse([2, 8, 17, 24], fill=RED)
    d.ellipse([16, 8, 31, 24], fill=RED)
    # bottom shading + top notch
    d.ellipse([6, 26, 27, 35], fill=RED_D)
    d.ellipse([5, 12, 28, 33], fill=RED)
    d.rectangle([15, 8, 18, 11], fill=(0, 0, 0, 0))
    # highlight
    d.ellipse([7, 13, 13, 19], fill=RED_HI)
    # stem + leaf
    d.rectangle([16, 3, 18, 9], fill=STEM)
    d.ellipse([19, 2, 28, 8], fill=LEAF)
    d.line([20, 6, 27, 3], fill=LEAF_D, width=1)
    return im, ImageDraw.Draw(im)


def eyes(d, style, dx=0, dy=0):
    if style != "happy":
        # whites
        d.rectangle([10, 18, 13, 22], fill=WHITE)
        d.rectangle([20, 18, 23, 22], fill=WHITE)
    if style == "open":
        d.rectangle([11 + dx, 20 + dy, 12 + dx, 21 + dy], fill=BLACK)
        d.rectangle([21 + dx, 20 + dy, 22 + dx, 21 + dy], fill=BLACK)
    elif style == "shut":
        d.rectangle([10, 20, 13, 20], fill=BLACK)
        d.rectangle([20, 20, 23, 20], fill=BLACK)
    elif style == "happy":
        # ^ ^ eyes, no whites so they read as pure joy
        for x0 in (10, 20):
            d.line([x0, 21, x0 + 2, 19], fill=BLACK, width=2)
            d.line([x0 + 2, 19, x0 + 4, 21], fill=BLACK, width=2)


def cheeks(d):
    d.rectangle([7, 23, 9, 24], fill=CHEEK)
    d.rectangle([24, 23, 26, 24], fill=CHEEK)


def mouth(d, style):
    if style == "smile":
        d.line([13, 26, 15, 27], fill=MOUTH, width=1)
        d.line([15, 27, 18, 27], fill=MOUTH, width=1)
        d.line([18, 27, 20, 26], fill=MOUTH, width=1)
    elif style == "grin":
        d.line([12, 25, 14, 27], fill=MOUTH, width=1)
        d.line([14, 27, 19, 27], fill=MOUTH, width=1)
        d.line([19, 27, 21, 25], fill=MOUTH, width=1)
    elif style == "open":
        d.ellipse([14, 25, 19, 29], fill=MOUTH)
    elif style == "wide":
        d.ellipse([12, 24, 21, 30], fill=MOUTH)
        d.rectangle([13, 25, 20, 26], fill=WHITE)  # lil teeth


FRAMES = {
    "idle": lambda d: (eyes(d, "open"), cheeks(d), mouth(d, "smile")),
    "blink": lambda d: (eyes(d, "shut"), cheeks(d), mouth(d, "smile")),
    "talk": lambda d: (eyes(d, "open"), cheeks(d), mouth(d, "open")),
    "talk2": lambda d: (eyes(d, "open"), cheeks(d), mouth(d, "wide")),
    "look": lambda d: (eyes(d, "open", dx=-1, dy=-2), cheeks(d), mouth(d, "smile")),
    "look2": lambda d: (eyes(d, "open", dx=1, dy=-2), cheeks(d), mouth(d, "smile")),
    "squint": lambda d: (eyes(d, "happy"), cheeks(d), mouth(d, "grin")),
}

for name, paint in FRAMES.items():
    im, d = base()
    paint(d)
    im.resize((W * SCALE, H * SCALE), Image.NEAREST).save(OUT / f"{name}.png")
    print(f"wrote mrapple/{name}.png")
