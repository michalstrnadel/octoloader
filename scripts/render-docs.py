"""Render the README's animated examples straight from the sprite data.

The CSS is the spec: every clock here is evaluated exactly the way the
stylesheet evaluates it, so a GIF can never drift from what the component
actually does. Frame step is 40ms and the swim period is nudged to 0.96s
(8 x 120ms) so a sprite frame is always a whole number of GIF frames —
otherwise every third frame would be held 50% longer and the swim would
visibly limp.
"""
import json, math, os
from PIL import Image, ImageDraw, ImageFont

FONT = '/System/Library/Fonts/Helvetica.ttc'
SAY = 'One moment please…'
MUTED_LIGHT, MUTED_DARK = '#57606a', '#8b949e'

HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, 'sprite.json')))
FRAMES = D['FRAMES']
LIFT = D['FRAME_LIFT']
BLINK, LOOK_L, LOOK_R = D['FRAME_BLINK'], D['FRAME_LOOK_LEFT'], D['FRAME_LOOK_RIGHT']
BUBBLES = D['BUBBLES']
W, H = D['SPRITE_WIDTH'], D['SPRITE_HEIGHT']
VIEW_H, HEAD = D['VIEW_HEIGHT'], D['BUBBLE_HEADROOM']
BAR_TOP, BAR_STEPS = D['BAR_TOP'], D['BAR_STEPS']
BAR_H, BAR_ROOM, TRACK_Y = D['BAR_HEIGHT'], D['BAR_ROOM'], D['BAR_TRACK_Y']

STEP = 0.04                      # GIF frame, 40ms
SWIM = 0.96                      # 8 x 120ms, a whole number of GIF frames
BLINK_P, GLANCE_P = 4.64, 7.28
WARM = 12.0                      # start past every delay, so nothing is missing

COLOR = {k: v for k, v in D['COLOR_PALETTE'].items()}
def mono(ink, paper, pupil):
    return {'.': None, 'o': ink, 'b': ink, 'h': ink, 'H': ink, 's': ink, 'k': ink,
            'w': paper, 'c': paper, 'g': paper, 'p': pupil,
            'B': ink, 'T': paper, 'F': pupil}

MONO_LIGHT = mono('#24292f', '#ffffff', '#24292f')
MONO_DARK = mono('#adbac7', '#f0f6fc', '#0d1117')


def rgb(h):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def clocks(t):
    """Frame index, lift, and which expression is showing — as the CSS has it."""
    i = int((t / SWIM % 1) * len(FRAMES))
    u, v = t / BLINK_P % 1, t / GLANCE_P % 1
    grid = FRAMES[i]
    if 0.21 <= v < 0.34:
        grid = LOOK_L
    elif 0.58 <= v < 0.71:
        grid = LOOK_R
    if 0.955 <= u < 0.98:
        grid = BLINK
    return grid, LIFT[i]


def bubbles_at(t):
    """(x, y, size, alpha) for each bubble that is currently in the water."""
    out = []
    for b in BUBBLES:
        if t < b['delay']:
            continue
        q = (t - b['delay']) / b['period'] % 1
        s = math.floor(q * b['rise'])
        a = 0.85 * (1 - s / b['rise'])
        if a > 0.02:
            out.append((b['x'], b['y'] - s, b['size'], a))
    return out


def blend(base, top, a):
    return tuple(round(base[i] * (1 - a) + top[i] * a) for i in range(3))


def draw(t, palette, bg, scale, progress=None):
    """One sprite, one moment, as a flat RGB image on `bg`."""
    foot = 0 if progress is None else BAR_ROOM
    cw, ch = W, VIEW_H + HEAD + foot
    px = [[bg] * cw for _ in range(ch)]

    grid, lift = clocks(t)
    for y, row in enumerate(grid):
        for x, ch_ in enumerate(row):
            fill = palette.get(ch_)
            if fill:
                py = y + HEAD + lift
                if 0 <= py < len(px):
                    px[py][x] = rgb(fill)

    ink = rgb(palette['B'])
    for bx, by, size, a in bubbles_at(t):
        for dy in range(size):
            for dx in range(size):
                py, pxx = by + dy + HEAD, bx + dx
                if 0 <= py < len(px) and 0 <= pxx < cw:
                    px[py][pxx] = blend(px[py][pxx], ink, a)

    if progress is not None:
        top = BAR_TOP + HEAD
        frame, track, bar = rgb(palette['o']), rgb(palette['T']), rgb(palette['F'])
        for x in range(cw):
            for dy in range(BAR_H):
                px[top + dy][x] = frame
        ty = TRACK_Y - BAR_TOP
        for x in range(BAR_STEPS):
            px[top + ty][1 + x] = track
        for x in range(round(max(0.0, min(1.0, progress)) * BAR_STEPS)):
            px[top + ty][1 + x] = bar

    img = Image.new('RGB', (cw, ch))
    img.putdata([c for row in px for c in row])
    return img.resize((cw * scale, ch * scale), Image.NEAREST)


def caption(text, size, colour, bg):
    """The label under the animal — the other half of the loader."""
    font = ImageFont.truetype(FONT, size)
    probe = ImageDraw.Draw(Image.new('RGB', (1, 1)))
    box = probe.textbbox((0, 0), text, font=font)
    img = Image.new('RGB', (box[2] - box[0] + 2, box[3] - box[1] + 2), bg)
    ImageDraw.Draw(img).text((-box[0] + 1, -box[1] + 1), text, font=font, fill=colour)
    return img


def stack(sprite, text, bg, gap):
    """Sprite over label, centred on each other — the component's own layout."""
    w = max(sprite.width, text.width)
    out = Image.new('RGB', (w, sprite.height + gap + text.height), bg)
    out.paste(sprite, ((w - sprite.width) // 2, 0))
    out.paste(text, ((w - text.width) // 2, sprite.height + gap))
    return out


def framed(content, bg, width, min_height=208, pad_y=48, radius=14):
    """The `frame` prop: a hairline panel with the loader centred in it.

    The border is one neutral grey at low alpha rather than the page's ink,
    because a single value has to hold on a light ground and a dark one — the
    same reason the component itself does not paint it in `currentColor`.
    """
    h = max(min_height, content.height + pad_y * 2)
    out = Image.new('RGB', (width, h), bg)
    line = blend(bg, (128, 128, 128), 0.28)
    ImageDraw.Draw(out).rounded_rectangle([0, 0, width - 1, h - 1], radius, outline=line, width=1)
    out.paste(content, ((width - content.width) // 2, (h - content.height) // 2))
    return out


def strip(images, bg, gap, pad):
    """Lay images out in a row, bottom-aligned, on one ground."""
    w = sum(i.width for i in images) + gap * (len(images) - 1) + pad * 2
    h = max(i.height for i in images) + pad * 2
    out = Image.new('RGB', (w, h), bg)
    x = pad
    for i in images:
        out.paste(i, (x, pad + (h - pad * 2 - i.height)))
        x += i.width + gap
    return out


def save_gif(path, frames, ms=40):
    frames[0].save(path, save_all=True, append_images=frames[1:], duration=ms,
                   loop=0, optimize=True, disposal=1)
    return os.path.getsize(path)


OUT = os.path.join(os.path.dirname(HERE), 'docs')
os.makedirs(OUT, exist_ok=True)
CYCLES = 9
N = round(CYCLES * SWIM / STEP)
LIGHT, DARK = rgb('#ffffff'), rgb('#0d1117')

# 1. Hero — the whole loader, label and all. Sprite and text are kept near the
#    ratio the component ships at, so it reads as a screenshot of the thing
#    rather than a mascot with a caption bolted on.
for name, bg, muted in (('hero-light', LIGHT, MUTED_LIGHT), ('hero-dark', DARK, MUTED_DARK)):
    say = caption(SAY, 19, rgb(muted), bg)
    fs = [strip([stack(draw(WARM + n * STEP, COLOR, bg, 6), say, bg, 14)], bg, 0, 18)
          for n in range(N)]
    print(name, save_gif(f'{OUT}/{name}.gif', fs))

# 2. Both variants side by side, on the ground each theme actually has.
for name, bg, mp, muted in (('variants-light', LIGHT, MONO_LIGHT, MUTED_LIGHT),
                            ('variants-dark', DARK, MONO_DARK, MUTED_DARK)):
    say = caption(SAY, 15, rgb(muted), bg)
    fs = []
    for n in range(N):
        t = WARM + n * STEP
        fs.append(strip([stack(draw(t, COLOR, bg, 4), say, bg, 11),
                         stack(draw(t, mp, bg, 4), say, bg, 11)], bg, 44, 16))
    print(name, save_gif(f'{OUT}/{name}.gif', fs))

# 3. Determinate — the bar walking its 28 positions while the animal swims. The
#    label counts along with it, because a bar with no number is half a report.
PN = round(6 * SWIM / STEP)
for name, bg, mp, muted in (('progress-light', LIGHT, MONO_LIGHT, MUTED_LIGHT),
                            ('progress-dark', DARK, MONO_DARK, MUTED_DARK)):
    fs = []
    for n in range(PN):
        t = WARM + n * STEP
        p = n / (PN - 1)
        say = caption(f'Uploading… {round(p * 100)}%', 15, rgb(muted), bg)
        fs.append(strip([stack(draw(t, COLOR, bg, 4, p), say, bg, 11),
                         stack(draw(t, mp, bg, 4, p), say, bg, 11)], bg, 44, 16))
    print(name, save_gif(f'{OUT}/{name}.gif', fs))

# 4. The panel, which is how a loader marks out the region that is waiting.
for name, bg, muted in (('frame-light', LIGHT, MUTED_LIGHT), ('frame-dark', DARK, MUTED_DARK)):
    # 60px sprite and a 14px label — the component's own defaults, so the
    # picture shows what `<OctoLoader frame />` actually gives you.
    say = caption(SAY, 14, rgb(muted), bg)
    fs = []
    for n in range(N):
        inner = stack(draw(WARM + n * STEP, COLOR, bg, 2), say, bg, 9)
        fs.append(strip([framed(inner, bg, 620)], bg, 0, 10))
    print(name, save_gif(f'{OUT}/{name}.gif', fs))

# 5. Sizes — one still, three scales, so the 30px case is judged at 30px.
for name, bg in (('sizes-light', LIGHT), ('sizes-dark', DARK)):
    imgs = [draw(WARM, COLOR, bg, sc) for sc in (1, 2, 4)]
    strip(imgs, bg, 32, 16).save(f'{OUT}/{name}.png')
    print(name, os.path.getsize(f'{OUT}/{name}.png'))

# 6. The eight frames laid out, which is what the strip really is.
for name, bg in (('frames-light', LIGHT), ('frames-dark', DARK)):
    imgs = []
    for i in range(len(FRAMES)):
        img = Image.new('RGB', (W, VIEW_H), bg)
        px = [[bg] * W for _ in range(VIEW_H)]
        for y, row in enumerate(FRAMES[i]):
            for x, c in enumerate(row):
                f = COLOR.get(c)
                if f:
                    px[y + LIFT[i]][x] = rgb(f)
        img.putdata([c for row in px for c in row])
        imgs.append(img.resize((W * 3, VIEW_H * 3), Image.NEAREST))
    strip(imgs, bg, 10, 14).save(f'{OUT}/{name}.png')
    print(name, os.path.getsize(f'{OUT}/{name}.png'))
