# Sensei — the Dojo's mascot, drawn the same way Floppy was: every pixel placed
# by hand on a 20x24 grid and scaled 6x with NEAREST. No AI, no drift, no
# licence questions, and an exact style match with gifsmith/floppy.
#
# Structure is lifted from ~/gifworkshop/scripts/gen_floppy.py, including its
# most important idea: ONE base() head, and the only things that ever change
# between frames are the eyes and the mouth. That is what stops a talking
# mascot from jiggling.
#
#   public/dojo/sensei/idle.png    eyes open, mouth closed
#   public/dojo/sensei/blink.png   eyes shut
#   public/dojo/sensei/talk.png    mouth wide   (flap frame A)
#   public/dojo/sensei/talk2.png   mouth half   (flap frame B)
#   public/dojo/sensei/look.png    glance left
#   public/dojo/sensei/look2.png   glance right
#   public/dojo/sensei/squint.png  eased in/out of a glance
#   public/dojo/sensei/bow.png     eyes closed, head lowered — belt earned
#
# Run: python3 scripts/gen_sensei.py
import os

from PIL import Image

W, H, S = 20, 24, 6

K = (10, 10, 16)            # outline
SKIN = (226, 178, 136)
SKIN_HI = (243, 205, 168)
SKIN_SH = (186, 138, 100)
HAIR = (68, 64, 72)         # greying black, swept back at the sides
HAIR_HI = (118, 114, 124)
BAND = (196, 40, 44)        # the headband
BAND_HI = (232, 92, 84)
BAND_SH = (146, 24, 30)
GI = (246, 246, 242)        # the gi collar
GI_SH = (202, 202, 198)
BROW = (58, 54, 62)
WHT = (255, 255, 255)
PUPIL = (38, 44, 60)
TONGUE = (190, 96, 110)


class Sprite:
    def __init__(self):
        self.img = Image.new("RGBA", (W, H), (0, 0, 0, 0))

    def px(self, x, y, c):
        if 0 <= x < W and 0 <= y < H:
            self.img.putpixel((x, y), (*c, 255))

    def clear(self, x, y):
        if 0 <= x < W and 0 <= y < H:
            self.img.putpixel((x, y), (0, 0, 0, 0))

    def rect(self, x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.px(x, y, c)

    def frame(self, x0, y0, x1, y1, c):
        for x in range(x0, x1 + 1):
            self.px(x, y0, c)
            self.px(x, y1, c)
        for y in range(y0, y1 + 1):
            self.px(x0, y, c)
            self.px(x1, y, c)


def base(drop=0):
    """The head. `drop` shifts the face down a row for the bow frame.

    Proportion rules that took a couple of passes to land: the face is only 12
    columns wide, so hair gets ONE column per side — two reads as a balaclava,
    not sideburns. And the collar has to be wider than the jaw or the head
    looks like it is floating above a white bar.
    """
    s = Sprite()
    d = drop

    # ---- shoulders + gi collar ----
    s.rect(1, 20, 18, 23, GI)
    s.frame(1, 20, 18, 23, K)
    for i in range(3):                    # the lapel V, neck showing through
        s.px(8 - i, 21 + i, K)
        s.px(11 + i, 21 + i, K)
    s.rect(9, 20, 10, 22, SKIN_SH)
    s.rect(9, 23, 10, 23, GI_SH)

    # ---- skull. 14 columns wide, not 12: two Floppy-sized eyes need 5 each
    # plus a nose gap plus margins, and anything narrower forces eyes so small
    # the outline eats them. ----
    s.rect(3, 2 + d, 16, 19 + d, SKIN)
    s.frame(3, 2 + d, 16, 19 + d, K)
    for (x, y) in ((3, 2), (16, 2), (3, 19), (16, 19)):
        s.clear(x, y + d)                 # round crown and jaw
    s.rect(5, 3 + d, 14, 4 + d, SKIN_HI)  # bald crown catches light
    s.rect(5, 18 + d, 14, 18 + d, SKIN_SH)

    # ---- hair: ONLY at the temples, above the band. Anything beside the eyes
    # reads as a mask at this size rather than as hair. ----
    for y in range(3 + d, 6 + d):
        s.px(3, y, HAIR)
        s.px(16, y, HAIR)
    s.px(3, 3 + d, HAIR_HI); s.px(16, 3 + d, HAIR_HI)

    # ---- headband, low on the forehead. Edges are drawn as individual pixels:
    # a frame() here would overwrite the band's own bottom row with outline. ----
    s.rect(3, 6 + d, 16, 8 + d, BAND)
    s.rect(4, 6 + d, 15, 6 + d, BAND_HI)
    s.rect(4, 8 + d, 15, 8 + d, BAND_SH)
    for y in range(6 + d, 9 + d):
        s.px(2, y, K)
        s.px(17, y, K)
    s.px(3, 5 + d, K); s.px(16, 5 + d, K)
    s.px(3, 9 + d, K); s.px(16, 9 + d, K)
    # knot + tail, on one side so the face is not perfectly mirrored
    s.px(1, 7 + d, BAND); s.px(1, 8 + d, BAND_SH)
    s.px(1, 6 + d, K); s.px(0, 7 + d, K); s.px(0, 8 + d, K); s.px(1, 9 + d, K)

    # ---- brows: thin, separated from the hair by skin ----
    s.rect(5, 10 + d, 7, 10 + d, BROW)
    s.rect(12, 10 + d, 14, 10 + d, BROW)

    # ---- nose ----
    s.px(9, 13 + d, SKIN_SH); s.px(10, 13 + d, SKIN_SH)
    s.px(9, 14 + d, SKIN_SH); s.px(10, 14 + d, K)

    # ---- moustache: a long drooping horseshoe that frames the mouth.
    # The old flat bar sat one row under the eyes and read as a second pair of
    # brows; this hangs lower and gives the face an actual silhouette. ----
    s.rect(6, 16 + d, 13, 16 + d, HAIR)
    s.px(5, 16 + d, HAIR_HI); s.px(14, 16 + d, HAIR_HI)
    s.px(5, 17 + d, HAIR); s.px(6, 17 + d, HAIR)     # droops down the sides
    s.px(13, 17 + d, HAIR); s.px(14, 17 + d, HAIR)
    s.px(5, 18 + d, HAIR_HI); s.px(14, 18 + d, HAIR_HI)

    return s


# ---- the only two things that change between frames ----------------------

def eyes_open(s, pupil=1, top=11, d=0):
    """A heavy upper lid and open sides — a full black box around each eye
    reads as a domino mask once it sits on skin rather than on Floppy's dark
    plastic. pupil: 0 left, 1 centre, 2 right. top 11 straight, 12 squints."""
    for ex in (5, 11):
        s.rect(ex, top + 1 + d, ex + 3, top + 2 + d, WHT)
        s.rect(ex, top + d, ex + 3, top + d, K)          # lid
        s.px(ex, top + 1 + d, SKIN_SH)                   # soften outer corners
        s.px(ex + 3, top + 1 + d, SKIN_SH)
        s.px(ex + 1 + pupil, top + 2 + d, PUPIL)


def eyes_shut(s, top=11, d=0):
    for ex in (5, 11):
        s.rect(ex, top + 1 + d, ex + 3, top + 1 + d, K)
        s.px(ex, top + 2 + d, SKIN_SH)
        s.px(ex + 3, top + 2 + d, SKIN_SH)


# The mouth opens WIDER rather than taller — there is only one spare row above
# the jaw outline, so height cannot carry the difference between the flap frames.
def mouth_closed(s, d=0):
    s.rect(8, 18 + d, 11, 18 + d, K)


def mouth_half(s, d=0):
    s.rect(8, 18 + d, 11, 18 + d, K)
    s.rect(9, 18 + d, 10, 18 + d, TONGUE)


def mouth_wide(s, d=0):
    s.rect(7, 17 + d, 12, 18 + d, K)
    s.px(7, 17 + d, SKIN); s.px(12, 17 + d, SKIN)   # rounded top corners
    s.rect(9, 18 + d, 10, 18 + d, TONGUE)


OUT = os.path.join(os.path.dirname(__file__), "..", "public", "dojo", "sensei")


def save(s, name):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, f"{name}.png")
    s.img.resize((W * S, H * S), Image.NEAREST).save(path)
    print(f"sensei/{name}.png")


s = base(); eyes_open(s); mouth_closed(s); save(s, "idle")
s = base(); eyes_shut(s); mouth_closed(s); save(s, "blink")
s = base(); eyes_open(s); mouth_wide(s); save(s, "talk")
s = base(); eyes_open(s); mouth_half(s); save(s, "talk2")
s = base(); eyes_open(s, pupil=0, top=12); mouth_closed(s); save(s, "look")
s = base(); eyes_open(s, pupil=2, top=12); mouth_closed(s); save(s, "look2")
s = base(); eyes_open(s, pupil=1, top=12); mouth_closed(s); save(s, "squint")

# the bow: eyes closed, head dropped a row. Shown when a belt is earned.
s = base(drop=1); eyes_shut(s, d=1); mouth_closed(s, d=1); save(s, "bow")
