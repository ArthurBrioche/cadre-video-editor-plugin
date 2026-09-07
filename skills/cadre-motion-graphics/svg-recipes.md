# SVG recipes

Twelve graphics, built only from features verified to render in Cadre on
2026-09-03 (see `VERIFICATION-2026-09-03.md`). Recipes 1, 3, 4 and 5 are the
markup that was captured from the live app, character for character apart from
the `SANS` placeholder below; the rest are assembled from the same primitives.

Every one of them obeys the two silent-failure rules:

- the root carries `xmlns="http://www.w3.org/2000/svg"`,
- the root carries a `viewBox`, trimmed to the ink.

None uses `<use>` — it is stripped without an error, so shapes are inlined.

`SANS` below stands for `'Helvetica Neue', Helvetica, Arial, sans-serif`. Write
it out in the markup; the placeholder is only to keep this file readable. Do not
use `-apple-system` inside an SVG.

Positions assume a 16:9 output with Cadre's default 72 px frame padding, giving
a content rect of roughly `[0.067, 0.933]` on both axes. `layout-zones.md` has
the arithmetic if the project differs.

---

## 1. Numbered list card

Three steps, one accent bullet each. The workhorse for "here is the process".

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 300">
  <rect x="6" y="6" width="408" height="288" rx="26" fill="#1D1D1F" fill-opacity="0.92"/>
  <circle cx="54" cy="60" r="20" fill="#007AFF"/>
  <text x="54" y="69" text-anchor="middle" font-family="SANS" font-size="24" font-weight="700" fill="#FFFFFF">1</text>
  <text x="92" y="70" font-family="SANS" font-size="30" font-weight="600" fill="#F5F5F7">Record</text>
  <circle cx="54" cy="150" r="20" fill="#007AFF"/>
  <text x="54" y="159" text-anchor="middle" font-family="SANS" font-size="24" font-weight="700" fill="#FFFFFF">2</text>
  <text x="92" y="160" font-family="SANS" font-size="30" font-weight="600" fill="#F5F5F7">Zoom</text>
  <circle cx="54" cy="240" r="20" fill="#007AFF"/>
  <text x="54" y="249" text-anchor="middle" font-family="SANS" font-size="24" font-weight="700" fill="#FFFFFF">3</text>
  <text x="92" y="250" font-family="SANS" font-size="30" font-weight="600" fill="#F5F5F7">Ship</text>
</svg>
```

```jsonc
{ "name": "add_svg_overlay", "arguments": {
    "startTime": 4500, "endTime": 7500,
    "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 420 300\">…</svg>",
    "position": { "x": 0.78, "y": 0.34 }, "width": 0.26,
    "animation": { "enter": "slide-left", "enterDurationMs": 420,
                   "exit": "fade", "exitDurationMs": 260 } } }
```

Renders 0.26 × 0.33 of the frame; the labels land at 0.033 of frame height
(36 px at 1080p). One row per point, three rows maximum — a fourth row needs a
taller viewBox and drops the type below the legible floor at this width.

**To light rows one at a time**, add the same card three times as abutting
segments with the unlit rows' `text` and `circle` at `fill-opacity="0.35"`.
Give only the first an `enter` and only the last an `exit`.

## 2. Quote card

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 260">
  <rect x="6" y="6" width="508" height="248" rx="26" fill="#1D1D1F" fill-opacity="0.92"/>
  <rect x="6" y="6" width="10" height="248" fill="#007AFF"/>
  <text x="48" y="96" font-family="SANS" font-size="34" font-weight="600" fill="#F5F5F7">It cut our edit time</text>
  <text x="48" y="140" font-family="SANS" font-size="34" font-weight="600" fill="#F5F5F7">from a day to an hour.</text>
  <text x="48" y="196" font-family="SANS" font-size="24" font-weight="400" fill="#A1A1A6">Priya N., Head of Design</text>
</svg>
```

`position { x: 0.30, y: 0.72 }`, `width: 0.38`, `enter: "slide-right"`.
Two quote lines maximum; break them yourself — SVG `<text>` does not wrap.

## 3. Stat callout

A single number with a unit. The gradient is verified to render
(`fill="url(#id)"` survives sanitisation because it is a `#fragment`).

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 240">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1D1D1F"/>
      <stop offset="1" stop-color="#3A3A3C"/>
    </linearGradient>
  </defs>
  <rect x="4" y="4" width="352" height="232" rx="24" fill="url(#g)"/>
  <text x="180" y="122" text-anchor="middle" font-family="SANS" font-size="76" font-weight="700" fill="#FFFFFF">3.2x</text>
  <text x="180" y="172" text-anchor="middle" font-family="SANS" font-size="24" font-weight="500" fill="#A1A1A6">faster edits</text>
</svg>
```

```jsonc
{ "name": "add_svg_overlay", "arguments": {
    "startTime": 21600, "endTime": 25600,
    "svg": "…", "position": { "x": 0.79, "y": 0.30 }, "width": 0.22,
    "animation": { "enter": "pop", "enterDurationMs": 420,
                   "exit": "fade", "exitDurationMs": 260 } } }
```

Give every gradient/filter `id` a name unique across the project — ids live in
one raster document each, but a copy-pasted `id="g"` in a card you later edit is
how two graphics end up sharing a mistake.

## 4. Arrow / pointer

A curved stroke with an inline arrowhead. No `marker` element is needed and no
`<use>` is possible, so the head is two line segments.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 120">
  <path d="M206 30 C150 10 60 22 30 70" stroke="#007AFF" stroke-width="9" fill="none" stroke-linecap="round"/>
  <path d="M30 70 L56 56 M30 70 L31 40" stroke="#007AFF" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**Aiming it.** The tip is the path's end point, `(30, 70)` of a `220 × 120`
viewBox — i.e. at `(0.136, 0.583)` inside the sticker's own box. To land the tip
on an output-frame point `(tx, ty)` with sticker width `w` and frame aspect `A`:

```
h  = w × A ÷ viewBoxAspect            # sticker height as a fraction of frame height
x  = tx − (0.136 − 0.5) × w
y  = ty − (0.583 − 0.5) × h
```

Worked: `w = 0.16`, `A = 1.778`, viewBox aspect `220/120 = 1.833` → `h = 0.155`;
tip at `(0.75, 0.63)` → `position { x: 0.808, y: 0.617 }`. That is the placement
that was verified on screen. Mirror the path horizontally (`transform="scale(-1,1) translate(-220,0)"`
on a wrapping `<g>`) for an arrow pointing right.

`enter: "pop"` for the arrival, `exit: "fade"`. `loop: "bob"` at 2000 ms is the
one loop that is defensible here, and only if the arrow is the sole graphic.

## 5. Lower-third name plate

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 470 170">
  <rect x="0" y="30" width="470" height="120" rx="22" fill="#1D1D1F" fill-opacity="0.92"/>
  <rect x="0" y="30" width="10" height="120" fill="#007AFF"/>
  <text x="36" y="80" font-family="SANS" font-size="38" font-weight="600" fill="#F5F5F7">Amina Okoye</text>
  <text x="36" y="122" font-family="SANS" font-size="26" font-weight="400" fill="#A1A1A6">Head of Platform</text>
</svg>
```

```jsonc
{ "name": "add_svg_overlay", "arguments": {
    "startTime": 1000, "endTime": 4000,
    "svg": "…", "position": { "x": 0.235, "y": 0.80 }, "width": 0.33,
    "animation": { "enter": "slide-right", "enterDurationMs": 420,
                   "exit": "fade", "exitDurationMs": 260 } } }
```

**Trim the viewBox to the longest line.** The first version of this plate used
`viewBox="0 0 640 170"` at `width: 0.44`; the empty right half of the pill sat
across the speaker's arm. Narrowing the box to 470 units and the width to 0.33
fixed it without touching the type. The accent bar is 10 units on 470 — a
6-on-640 bar was invisible at 1080p.

Name once, near the start, for 3–4 s. It does not come back.

## 6. Progress steps

A rail with filled and hollow stops — smaller than the numbered card, good under
a title.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 90">
  <rect x="0" y="0" width="520" height="90" rx="26" fill="#1D1D1F" fill-opacity="0.90"/>
  <line x1="70" y1="45" x2="450" y2="45" stroke="#48484A" stroke-width="6" stroke-linecap="round"/>
  <line x1="70" y1="45" x2="260" y2="45" stroke="#007AFF" stroke-width="6" stroke-linecap="round"/>
  <circle cx="70" cy="45" r="15" fill="#007AFF"/>
  <circle cx="260" cy="45" r="15" fill="#007AFF"/>
  <circle cx="450" cy="45" r="15" fill="#1D1D1F" stroke="#48484A" stroke-width="6"/>
</svg>
```

`position { x: 0.5, y: 0.88 }` — but only when there is **no** caption track.
With captions, move it to `y: 0.14`. `width: 0.34`, `enter: "fade"`.

Advance it by adding the next state as an abutting segment with
`enter: "none"`; do not animate the rail itself.

## 7. Icon badge

A filled disc with an inlined glyph. Use for a status mark, not as decoration.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="54" fill="#007AFF"/>
  <path d="M38 62 L54 78 L84 44" stroke="#FFFFFF" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

`width: 0.07`, `enter: "pop"`, 1800 ms. Swap the disc to `#FF3B30` and the glyph
to `M42 42 L78 78 M78 42 L42 78` for a failure mark — and only for a real one.

Add a soft shadow when the badge sits on light footage (`feDropShadow` is
verified to render):

```xml
<defs><filter id="bs" x="-40%" y="-40%" width="180%" height="180%">
  <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.45"/>
</filter></defs>
```

then `filter="url(#bs)"` on the disc.

## 8. Comparison, two columns

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 250">
  <rect x="4" y="4" width="552" height="242" rx="26" fill="#1D1D1F" fill-opacity="0.92"/>
  <line x1="280" y1="40" x2="280" y2="210" stroke="#48484A" stroke-width="2"/>
  <text x="150" y="86" text-anchor="middle" font-family="SANS" font-size="22" font-weight="500" fill="#A1A1A6">Before</text>
  <text x="150" y="150" text-anchor="middle" font-family="SANS" font-size="54" font-weight="700" fill="#F5F5F7">6 h</text>
  <text x="410" y="86" text-anchor="middle" font-family="SANS" font-size="22" font-weight="500" fill="#A1A1A6">After</text>
  <text x="410" y="150" text-anchor="middle" font-family="SANS" font-size="54" font-weight="700" fill="#007AFF">40 m</text>
</svg>
```

`position { x: 0.72, y: 0.34 }`, `width: 0.32`, `enter: "fade"`. The accent
belongs on the side you want believed — using it on both makes neither land.

## 9. Section title

Prefer a **text overlay** here: it inherits the shipped type stack and its pill
sizes itself to the words.

```jsonc
{ "name": "add_text_overlay", "arguments": {
    "startTime": 47900, "endTime": 52400,
    "text": "What ships in October",
    "position": { "x": 0.5, "y": 0.16 }, "width": 0.55,
    "animation": { "enter": "fade", "enterDurationMs": 380,
                   "exit": "fade", "exitDurationMs": 260 } } }
```

For a title with a rule under it, pair the text overlay with a hairline SVG at
the same times:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 12">
  <rect x="0" y="3" width="400" height="6" rx="3" fill="#007AFF"/>
</svg>
```

`position { x: 0.5, y: 0.225 }`, `width: 0.16`, `enter: "slide-left"`. That is
two graphics, which is the ceiling — nothing else on screen with it.

`enter: "typewriter"` at 1200–1800 ms is available for a title and is an
editorial choice, not a default. It is text-only and has no exit form.

## 10. Checklist reveal

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 260">
  <rect x="4" y="4" width="432" height="252" rx="26" fill="#1D1D1F" fill-opacity="0.92"/>
  <path d="M44 62 L58 76 L86 46" stroke="#007AFF" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="108" y="72" font-family="SANS" font-size="28" font-weight="600" fill="#F5F5F7">Captions</text>
  <path d="M44 140 L58 154 L86 124" stroke="#007AFF" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="108" y="150" font-family="SANS" font-size="28" font-weight="600" fill="#F5F5F7">Auto zoom</text>
  <path d="M44 218 L58 232 L86 202" stroke="#48484A" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="108" y="228" font-family="SANS" font-size="28" font-weight="600" fill="#8E8E93">Multicam</text>
</svg>
```

`position { x: 0.77, y: 0.36 }`, `width: 0.28`. Reveal by re-adding with the
next tick promoted from `#48484A`/`#8E8E93` to `#007AFF`/`#F5F5F7`, as abutting
segments with `enter: "none"`.

## 11. Accent underline

An accent swipe that arrives under a word the presenter stresses. The whole
graphic is one rule; the motion is the point.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 16">
  <rect x="0" y="4" width="300" height="8" rx="4" fill="#007AFF"/>
</svg>
```

```jsonc
{ "svg": "…", "position": { "x": 0.30, "y": 0.72 }, "width": 0.20,
  "animation": { "enter": "slide-left", "enterDurationMs": 320,
                 "exit": "fade", "exitDurationMs": 200 },
  "keyframes": [ { "atMs": 0,   "scale": 0.1 },
                 { "atMs": 320, "scale": 1, "easing": "ease-out" } ] }
```

The keyframe track scales it out from a stub, which reads as a wipe. Keyframes
replace the base pose and the `enter` still composes on top — that is why the
fade and the growth happen together.

## 12. Corner chip

A small standing tag: chapter name, "live", a date. The one graphic that may
stay on screen for a long stretch.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 76">
  <rect x="0" y="0" width="260" height="76" rx="38" fill="#1D1D1F" fill-opacity="0.90"/>
  <circle cx="42" cy="38" r="10" fill="#007AFF"/>
  <text x="70" y="49" font-family="SANS" font-size="30" font-weight="600" fill="#F5F5F7">Q3 review</text>
</svg>
```

`position { x: 0.20, y: 0.13 }`, `width: 0.17`, `enter: "fade"`. Counts as one
of your two simultaneous graphics for as long as it is up, so a chip that runs
the whole video means everything else is solo.

---

## Sizing quick reference

For a sticker of `width` w on a 16:9 frame, with viewBox `VBW × VBH`:

```
drawn height (fraction of frame height) = w × 1.778 ÷ (VBW / VBH)
font-size F (viewBox units) renders at   = F × w × 1.778 ÷ VBW  of frame height
minimum legible font-size (units)        = 0.020 × VBW ÷ (w × 1.778)
```

| Recipe | viewBox | width | drawn size (W × H of frame) |
|---|---|---|---|
| 1 numbered card | 420 × 300 | 0.26 | 0.26 × 0.33 |
| 3 stat callout | 360 × 240 | 0.22 | 0.22 × 0.26 |
| 4 arrow | 220 × 120 | 0.16 | 0.16 × 0.155 |
| 5 lower third | 470 × 170 | 0.33 | 0.33 × 0.21 |
| 12 corner chip | 260 × 76 | 0.17 | 0.17 × 0.088 |

Keep `width ≤ 0.5`: above roughly 0.53 on a 1080p frame the 2× raster
oversample hits the 2048 px cap and the sticker softens.
