# Advanced animation recipe

Use this recipe when a graphic needs a small visual story instead of a single
entrance. A good example is ten cubes that spin independently, orbit a shared
axis, gather into one larger cube, and keep rotating as a finished mark. The
same choreography works for particles, cards, product parts, or a data object.

The native counter, bar-chart, and progress-ring templates are shortcuts for
common graphics. Choose them when they describe the request. A custom render
path keeps the model free to choose Blender, Three.js, SVG, Canvas, or another
renderer when the scene needs its own geometry, lighting, camera, or shader.
Cadre receives the rendered pixels; it does not execute the authoring code
inside Cadre.

## Choreograph the phases

Give each phase a job and leave enough overlap for the eye to understand the
change. For an eight-second, 30 fps example (240 frames), a useful starting
plan is:

| Frames | Time | Phase | Visual intent |
| ---: | ---: | --- | --- |
| 0–35 | 0.0–1.17 s | Establish | Reveal the group and camera; keep motion calm. |
| 30–105 | 1.0–3.5 s | Individual motion | Each cube spins on its own local axis while the group orbits a central axis. Stagger phase or speed slightly, but keep a shared rhythm. |
| 96–165 | 3.2–5.5 s | Assembly | Reduce the orbit radius and ease every cube toward its target face. Let local spin decelerate as the pieces lock. |
| 156–239 | 5.2–8.0 s | Hero hold | Treat the assembled cube as one object and rotate it around a single global axis. Hold long enough to read the silhouette. |

The overlaps avoid hard cuts: individual motion is still visible as assembly
begins, and the final rotation arrives before the last piece has completely
stopped. Use an ease-in-out or critically damped spring for radius and spacing;
avoid changing direction at a phase boundary. Seed any random offsets so a
second render produces the same choreography.

## Compose transforms deliberately

Keep the cube's local pose separate from its group pose. Use one shared scene
coordinate system for every cube. At frame `f`, sample time deterministically
as `t = f / fps` and compute:

```text
assemblyProgress = phaseProgress(t)
localCenter = lerp(orbitCenter_i(t), assemblyTarget_i, assemblyProgress)
worldPoint = groupRotation(t) * (localCenter + localRotation_i(t) * vertex)
```

Here `vertex` is a cube-local point, `localRotation_i` is that cube's
independent spin, and `groupRotation` is the shared central-axis rotation.
During assembly, `localRotation_i` eases to identity modulo `2π` at the lock
time while `groupRotation` keeps moving. This makes the assembled object read
as one rigid body without applying the assembly target outside the group
matrix. Use the equivalent matrix or scene-graph operations for the chosen
renderer, and keep the phase functions pure: no wall-clock reads, mutable frame
counters, or random values generated during rendering.

## Make the motion readable

- Start with a camera that shows the whole group and leaves breathing room for
  transparent compositing. A three-quarter view usually separates cube faces
  better than a straight-on view.
- Use one key light, a soft fill, and restrained contact shadows. Distinct face
  values, a simple groundless background, and a small accent are easier to read
  than a busy environment.
- Keep the camera, focal length, and exposure fixed unless a camera move is part
  of the design. A locked camera makes orbit and assembly legible.
- Render RGBA with a transparent background. Check edge antialiasing and
  premultiplied-alpha settings so dark or light halos do not appear when Cadre
  places the clip over footage.
- Review motion at the early, middle, and late points: one frame during the
  individual spin, one while pieces converge, and one during the hero hold.
  Then play the exported Cadre video; a still frame cannot reveal cadence,
  looping, held final frames, or a seam at the imported clip boundary.

## Portable authoring and import loop

Blender, Three.js, SVG, and Canvas are all valid. Pick the smallest tool that
gives the requested control, and render a numbered PNG sequence when alpha
video encoding is unavailable. The repository's Blender example can be run
portably with:

```sh
blender --background --python scripts/render-cube-assembly.py -- --output output/complex-cube-animation
```

The command writes an editable `scene.blend`, a `scene-manifest.json`, and
transparent frames under `output/complex-cube-animation/frames/`. The baked
scene remains editable in Blender; the recipe is an authoring workflow, not an
internal Cadre runtime. For a custom renderer, the corresponding handoff is:

```text
add_animation_overlay {
  path: "/absolute/path/to/output/complex-cube-animation/frames/",
  fps: 30,
  startTime: 12_000,
  endTime: 20_000,
  loop: false,
  position: { x: 0.78, y: 0.34 },
  width: 0.28,
  animation: { enter: "fade", exit: "fade" }
}
```

For this eight-second example, export exactly 240 numbered PNGs at 30 fps.
Import the directory through `add_animation_overlay`, preserve its background
job receipt, poll to completion, and confirm the returned overlay's recording-
time bounds and placement. The overlay's `fps` describes source-frame
sampling; it does not change Cadre's recording-time coordinate system.

After import, inspect an early, middle, and late `get_edited_frame`, including
the held-final-frame point when `loop: false`. Finally export and play the
result from start to finish to check phase timing, alpha edges, and the
transition from the assembled object to its final rotation.

The portable gate for the real Electron path is:

```sh
CADRE_COMPLEX_ANIMATION_DIR=... pnpm playwright test tests/e2e/complex-animation-export.spec.ts --workers=1
```

Set `CADRE_COMPLEX_ANIMATION_DIR` to the output parent directory containing
`scene-manifest.json`; the gate resolves its `frames/` child for import and
checks the real Electron import/export path. It does not turn the custom
renderer into a Cadre runtime feature.
