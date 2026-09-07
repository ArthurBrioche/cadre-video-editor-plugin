# Layout zones — where a graphic is allowed to go

Everything here is arithmetic over the **output frame**: origin top-left, x
right, y down, both axes normalised 0–1. An overlay's `position` is its
**centre**, its `width` is a fraction of frame **width**, and neither moves with
a zoom — overlays are composited on the output, like captions.

---

## 1. The content rect

Cadre draws the recording inside the frame's padding, centred, with the
background showing around it. Under **Camera Only** the camera occupies that
same slot. Graphics belong inside this rect; ink that falls on the background
band reads as a mistake unless you meant a full-bleed title card.

`frame.padding` is in **reference pixels at a 1080-tall canvas**, so it scales
with the output. For linked padding `p` and a source whose aspect matches the
output, the content rect is inset by the same fraction on **both** normalised
axes:

```
inset = p / 1080
content rect = [ inset, 1 − inset ] on x and on y
```

Cadre's shipped default is `p = 72` → **inset 0.067**, content rect
`[0.067, 0.933]`. (Verified against a live 768 × 432 capture: the picture's
left edge measured ≈ 51 px of 768 = 0.066, its top edge ≈ 29 px of 432 = 0.067.)

The identity is not a coincidence: with equal pixel padding and a matching
aspect the fit is height-limited, so the horizontal inset in pixels is `p × A`,
which is `p / 1080` of the frame width.

When the source aspect does **not** match the output — a 4:3 camera in a 16:9
frame, or an export reframed to 9:16 — the rect is letterboxed further on one
axis. Do not compute it; capture one `get_edited_frame` and read the edges.

### The safe box

Keep the whole graphic — box, not just ink — one clear step inside the content
rect:

```
safe box ≈ [ inset + 0.03 , 1 − inset − 0.03 ]  →  [0.10, 0.90] at default padding
```

A graphic's own half-extents decide whether its centre fits:

```
half width  hx = width / 2
half height hy = width × frameAspect ÷ viewBoxAspect ÷ 2        (SVG, exact)
half height hy = fontSizeFrac × (1.25 × lines + 2 × paddingFrac) ÷ 2   (text, estimate)
```

so a legal centre satisfies `0.10 + hx ≤ x ≤ 0.90 − hx` and the same on y. The
text estimate counts explicit `\n` breaks only — automatic word wrap is not
simulated.

### The caption band

`DEFAULT_CAPTION_STYLE` is 34 reference px at `marginBottom: 48`, positioned
bottom. That occupies roughly the bottom 9 % of the frame, and a two-line
caption more. **When `timeline.captions` is non-null, keep every overlay box
above `y = 0.84`.** Check `get_timeline` before placing anything low; a caption
track added later will collide with graphics you already placed.

---

## 2. The free zone beside a speaker

There is no API that reports where the presenter is. Measure it once:

```
get_edited_frame { timeMs: <a moment mid-sentence>, maxDimension: 768 }
```

and read off the head and shoulder bounds. A typical seated talking head shot at
a laptop occupies `x ∈ [0.32, 0.70]`, from `y ≈ 0.15` down to the bottom of the
frame — which leaves two usable strips:

```
left strip   x ∈ [0.10, 0.30]
right strip  x ∈ [0.72, 0.90]
```

Both were verified on a live 1280 × 720 presenter take: a card spanning
`x ∈ [0.65, 0.91]` sat clear of her hair and shoulder, while an arrow whose tip
landed at `x = 0.68, y = 0.61` was on her sweater and had to be moved.

Judgement that follows from the geometry:

- **Pick the side the presenter is not leaning into**, and keep that side for
  the whole video. Graphics that alternate sides make the viewer hunt.
- A card is only as wide as the strip: `width ≤ 0.20` for the left strip,
  `≤ 0.26` for a card centred at `x = 0.78`. Anything wider crosses the subject.
- **Vertical position beats horizontal squeezing.** A card at `y = 0.30` clears
  a shoulder that a card at `y = 0.55` does not, at the same width.
- Contrast is part of the zone. A window behind the presenter is the brightest
  region of the shot: a charcoal card sits well there, light ink does not.

### Making the zone wider

You cannot: in Camera Only the camera fills the content rect, and there is no
layout that shrinks the camera while hiding the screen. `mode: "hide"` hides the
*camera*, not the screen. The options are:

1. Live with the strip the presenter's framing gives you (usually right).
2. Compose the shot differently at record time — the presenter sits to one side.
3. Switch composition: a `default`-mode camera layout at `middle-left` with
   `customSize: 0.38–0.45` puts the presenter in the left half and shows the
   **screen recording** in the rest. That is a screen composition with a large
   presenter, not a camera-only one, and it only makes sense when the screen has
   something worth seeing.

---

## 3. Camera layouts over time

`add_camera_layout` overrides `style.webcam` for a span of **recording time**.
Three modes:

| mode | what the frame is |
|---|---|
| `fullscreen` | Camera Only for that span: camera is the content; screen, cursor, click ripples, keyboard pills and zoom framing are suppressed. Captions, masks and overlay segments keep rendering. |
| `default` | the ordinary corner pip over the screen, optionally overriding `position` and `customSize`. |
| `hide` | no camera; screen only. |

Four rules that decide how graphics sit against them:

1. **A gap is how you go back.** The stretch after a segment already *is* the
   global layout. One segment, not two.
2. **Segments may not overlap**, and a disabled one still owns its span. A
   conflicting range is rejected naming the blocker.
3. **The camera flies for `CAMERA_LAYOUT_TRANSITION_MS = 700 ms`** at every
   boundary, and the transition belongs to the *later* layout's opening. Do not
   start a graphic inside that window — start it at least 700 ms after the
   boundary, or the card arrives while the frame is still rearranging.
4. A segment starting at `0` opens already settled: the video *opens*
   fullscreen, it does not fly there.

For reference, Cadre's other clock is the zoom spring: `SPRING_SETTLE_MS = 350`.
A graphic timed to a zoom should land after the spring has settled.

---

## 4. Anchors, and when not to use them

`add_text_overlay` / `add_svg_overlay` accept an `anchor` instead of a
`position`. It is resolved **once, at the call** — the stored segment holds
coordinates, so an anchored overlay does not follow the camera if the user moves
it later.

`target: "screen-region"` maps the nine regions onto the frame, placing the
overlay's **box** one `marginFrac` (default 0.03) in from the edge:

```
x = m + hx        (left regions)     0.5    (centre)     1 − m − hx   (right)
y = m + hy        (top regions)      0.5    (middle)     1 − m − hy   (bottom)
```

Verified: `{ region: "top-left", marginFrac: 0.05 }` on a text overlay of
`width: 0.24` and the default style resolved to `{ x: 0.170, y: 0.100 }` —
exactly `0.05 + 0.12` and `0.05 + 0.048 × (1.25 + 0.84) / 2`.

**The caveat that matters.** For a text overlay the anchor uses the *declared*
`width` as the half-extent, but the rendered pill shrinks to the measured text.
A short label with a generous `width` therefore sits well inside the corner
rather than against the margin. Either set `width` close to the real text width,
or pass an explicit `position`.

`target: "webcam"` places the overlay one margin clear of a named side of the
camera rectangle (`left-of`, `right-of`, `above`, `below`), centred on the other
axis. It reads the camera rect from the current style at call time, and it
refuses with `INVALID_ARGS` when the webcam is disabled or the project has no
camera track — which makes it a useful probe for exactly that question. Under
Camera Only the rectangle is the content rect the camera fills, so
`left-of`/`right-of` place the overlay in the background band, not in the
picture: for a graphic *on* the presenter's shot, use an explicit position.

Nothing lands off-frame: after mapping, the centre is clamped so the whole box
fits with at least `m / 2` around it. An overlay too large for an axis is
centred on that axis rather than resized — a graphic that appears suspiciously
centred is one that did not fit.

---

## 5. The corner pip, for screen recordings

When the camera is a corner overlay (`mode: "default"`, or the global style),
its rectangle is worth knowing so graphics do not land under it:

```
sizeX = webcam.size                                    # fraction of frame width
sizeY = webcam.size ÷ cameraAspect × frameAspect        # fraction of frame height
margin = 0.02                                          # WEBCAM_EDGE_MARGIN
offset = webcam.offsetX / frameWidthPx  (and offsetY / frameHeightPx),
         where the pixel offsets are reference pixels at a 1080-tall canvas
```

with the corner positions placing it at `margin + offset` from the anchored
edges, or `1 − size − margin − offset` on the far side. The shipped default is
`size: 0.20` at `bottom-right` with 32 px offsets, so the pip occupies roughly
`x ∈ [0.75, 0.95]`, `y ∈ [0.68, 0.95]` on a 16:9 frame with a 16:9 camera.

Keep callouts out of that box, and prefer the opposite corner for a chip.

---

## 6. Collision arithmetic

Before placing, compute the box; after placing, look at the frame. Both.

```
box = [ x − hx , x + hx ] × [ y − hy , y + hy ]
```

Reject the placement if the box:

- leaves the safe box on any side,
- intersects the speaker's bounds as you measured them,
- intersects another overlay's box that is on screen at the same time,
- dips below `y = 0.84` while captions exist,
- overlaps the corner pip when one is showing.

The check is cheap and it is not a substitute for `get_edited_frame`: the box
tells you about geometry, the frame tells you about contrast, glyph clipping and
whether the thing rendered at all.
