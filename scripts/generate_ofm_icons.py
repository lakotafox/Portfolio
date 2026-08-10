#!/usr/bin/env python3
"""Pixel icons for Ollie's fruit map — the app's no-emoji icon set.

Every icon is a hand-placed 12x12 grid (ASCII art below), upscaled x4
nearest-neighbor to 48px PNGs in public/olliesfruitmap/icons/. Same
palette family as Mr Apple (scripts/generate_mrapple.py) so it all reads
as one sprite sheet. Re-run this script to regenerate; hand-drawn art can
replace any file without code changes.
"""
import pathlib

from PIL import Image

OUT = pathlib.Path(__file__).resolve().parent.parent / "public" / "olliesfruitmap" / "icons"
OUT.mkdir(parents=True, exist_ok=True)

SIZE, SCALE = 12, 4

PALETTE = {
    ".": (0, 0, 0, 0),
    "K": (20, 12, 12, 255),      # near-black
    "W": (255, 255, 255, 255),
    "R": (224, 49, 49, 255),     # Mr Apple red
    "h": (255, 135, 135, 255),   # highlight
    "S": (121, 92, 52, 255),     # stem / basket brown
    "L": (102, 168, 15, 255),    # leaf green
    "l": (74, 124, 10, 255),     # leaf dark
    "v": (112, 72, 232, 255),    # fig violet
    "P": (156, 54, 181, 255),    # plum purple
    "C": (194, 37, 92, 255),     # cherry crimson
    "O": (255, 146, 43, 255),    # peach orange
    "o": (217, 72, 15, 255),     # persimmon orange
    "N": (132, 99, 88, 255),     # walnut
    "n": (99, 71, 62, 255),      # walnut vein / basket weave
    "B": (54, 79, 199, 255),     # berry blue
    "b": (120, 140, 235, 255),   # berry shine
    "U": (0, 0, 128, 255),       # w95 navy
    "D": (64, 64, 64, 255),      # speaker gray
    "d": (150, 150, 150, 255),   # map fold gray
    "F": (255, 204, 153, 255),   # hand skin
}

ICONS = {
    "apple": [
        ".....S.LL...",
        ".....S.LLL..",
        ".....SS.....",
        "...RRRRRR...",
        "..RRRRRRRR..",
        ".RRRRRRRRRR.",
        ".RhRRRRRRRR.",
        ".RhhRRRRRRR.",
        ".RRRRRRRRRR.",
        "..RRRRRRRR..",
        "...RRRRRR...",
        "............",
    ],
    "fig": [
        ".....S......",
        ".....S......",
        "....vv......",
        "...vvvv.....",
        "..vvvvvv....",
        ".vvvvvvvv...",
        ".vhvvvvvv...",
        ".vhvvvvvvv..",
        ".vvvvvvvvv..",
        "..vvvvvvv...",
        "...vvvvv....",
        "............",
    ],
    "plum": [
        "......S.L...",
        ".....SS.LL..",
        "....PPPPPP..",
        "...PPPPPPPP.",
        "..PhPPPPPPP.",
        "..PhhPPPPPP.",
        "..PhPPPPPPP.",
        "..PPPPPPPP..",
        "...PPPPPPP..",
        "....PPPPP...",
        "............",
        "............",
    ],
    "cherry": [
        ".....SS.....",
        "....S..S....",
        "...S....S...",
        "...S....S...",
        "..CC....CC..",
        ".CCCC..CCCC.",
        ".ChCC..ChCC.",
        ".CCCC..CCCC.",
        "..CC....CC..",
        "............",
        "............",
        "............",
    ],
    "pear": [
        ".....SS.....",
        ".....S.LL...",
        "....LL.LLL..",
        "....LLL.....",
        "....LLLL....",
        "...LLLLLL...",
        "..LLLLLLLL..",
        "..LhLLLLLL..",
        "..LhLLLLLL..",
        "..LLLLLLLL..",
        "...LLLLLL...",
        "............",
    ],
    "peach": [
        "......S.....",
        "....LLS.....",
        "...LLLOO....",
        "...OOOOOOO..",
        "..OOOOOoOO..",
        "..OhOOOoOOO.",
        "..OhOOOoOOO.",
        "..OOOOOoOO..",
        "...OOOOoOO..",
        "....OOOOO...",
        "............",
        "............",
    ],
    "persimmon": [
        ".....SS.....",
        "...LLLLLL...",
        "..LLLLLLLL..",
        "..oooooooo..",
        ".oohooooooo.",
        ".oohooooooo.",
        ".oooooooooo.",
        "..oooooooo..",
        "...oooooo...",
        "............",
        "............",
        "............",
    ],
    "walnut": [
        "............",
        "....NNNN....",
        "..NNNNNNNN..",
        "..NNnNNnNN..",
        ".NNNnNNnNNN.",
        ".NNnNNNNnNN.",
        ".NNnNNNNnNN.",
        ".NNNnNNnNNN.",
        "..NNnNNnNN..",
        "..NNNNNNNN..",
        "....NNNN....",
        "............",
    ],
    "berry": [
        ".....S......",
        ".....S.L....",
        "....BBB.....",
        "...BBBBB....",
        "..BBbBBBB...",
        "..BBBBBBB...",
        "...BBbBBB...",
        "...BBBBB....",
        "....BBB.....",
        ".....B......",
        "............",
        "............",
    ],
    "pin": [
        "....RRRR....",
        "...RRRRRR...",
        "..RRRRRRRR..",
        "..RRWWRRRR..",
        "..RRWWRRRR..",
        "..RRRRRRRR..",
        "...RRRRRR...",
        "....RRRR....",
        ".....RR.....",
        ".....RR.....",
        "......R.....",
        "............",
    ],
    "basket": [
        "...SSSSSS...",
        "..S......S..",
        "..S......S..",
        ".SSSSSSSSSS.",
        ".SnSnSnSnSS.",
        ".SSSSSSSSSS.",
        ".SnSnSnSnSS.",
        "..SSSSSSSS..",
        "..SSSSSSSS..",
        "...SSSSSS...",
        "............",
        "............",
    ],
    "compass": [
        "....UUUU....",
        "..UUWWWWUU..",
        "..UWWRRWWU..",
        ".UWWWRRWWWU.",
        ".UWWRRRRWWU.",
        ".UWWUUUUWWU.",
        ".UWWWUUWWWU.",
        "..UWWUUWWU..",
        "..UUWWWWUU..",
        "....UUUU....",
        "............",
        "............",
    ],
    "map": [
        "............",
        "............",
        ".WWWdWWdWWW.",
        ".WLLdWWdWWW.",
        ".WLWdWRdLWW.",
        ".WWWdWWdLLW.",
        ".WWWdRWdWWW.",
        ".WWWdWWdWWW.",
        ".WWWdWWdWWW.",
        "............",
        "............",
        "............",
    ],
    "tree": [
        "....LLLL....",
        "..LLLLLLLL..",
        ".LLlLLLLLLL.",
        ".LLLLLLlLLL.",
        ".LlLLLLLLLL.",
        "..LLLLLLLL..",
        "...LLLLLL...",
        ".....SS.....",
        ".....SS.....",
        "....SSSS....",
        "............",
        "............",
    ],
    "info": [
        "..UUUUUUUU..",
        ".UUUUUUUUUU.",
        ".UUUUWWUUUU.",
        ".UUUUWWUUUU.",
        ".UUUUUUUUUU.",
        ".UUUWWWUUUU.",
        ".UUUUWWUUUU.",
        ".UUUUWWUUUU.",
        ".UUUUWWUUUU.",
        ".UUUWWWWUUU.",
        "..UUUUUUUU..",
        "............",
    ],
    "hand": [
        "...FF.......",
        "...FF.......",
        "...FF.......",
        "...FF.FFFF..",
        "...FFFFFFFF.",
        "..FFFFFFFFF.",
        "..FFFFFFFFF.",
        "...FFFFFFFF.",
        "...FFFFFFF..",
        "....FFFFFF..",
        "............",
        "............",
    ],
    "sound-on": [
        "............",
        "......K.....",
        ".....KK..D..",
        "..KKKKK.D...",
        "..KKKKK.D.D.",
        "..KKKKK..D.D",
        "..KKKKK.D.D.",
        "..KKKKK.D...",
        ".....KK..D..",
        "......K.....",
        "............",
        "............",
    ],
    "sound-off": [
        "............",
        "......K.....",
        ".....KK.....",
        "..KKKKK.R.R.",
        "..KKKKK..R..",
        "..KKKKK.R.R.",
        "..KKKKK.....",
        "..KKKKK.....",
        ".....KK.....",
        "......K.....",
        "............",
        "............",
    ],
}

for name, rows in ICONS.items():
    assert len(rows) == SIZE, f"{name}: {len(rows)} rows"
    im = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    for y, row in enumerate(rows):
        assert len(row) == SIZE, f"{name} row {y}: {len(row)} chars"
        for x, ch in enumerate(row):
            im.putpixel((x, y), PALETTE[ch])
    im.resize((SIZE * SCALE, SIZE * SCALE), Image.NEAREST).save(OUT / f"{name}.png")
    print(f"wrote icons/{name}.png")
