# HARNAS hero: from still to motion

Source of truth: `brand/blender_logo.py` builds `brand/harnas.blend` and renders `team/hero-still.png` (Cycles, about 12 s per frame at 1600x1000 on this Mac).

## Option A: glTF into Three.js, animated with GSAP

Export the five plates as one Draco-compressed .glb, load it in `logo3d.js`, rebuild the look with MeshPhysicalMaterial (it supports anisotropy) and a small studio HDR that copies the softbox layout.

- Pros: interactive (cursor parallax, scroll-driven assembly), cheap to tweak timing.
- Cons: real-time PBR will not match Cycles. The premium in the still comes from area-light reflections and denoised soft falloff; in WebGL that becomes an approximation, which is the "a bit unprofessional" problem we already have.
- Size: .glb about 40 KB, HDR about 300 KB (1k, compressed). Three.js is already on the page.

## Option B: rendered loop from Blender

Animate the plates in Blender (lames slide up and lock, chest plates close the V, slow light sweep across the steel, 6 to 8 s, seamless loop), render with the same lights, encode two files plus a poster.

- Pros: exactly the quality of the approved still, identical on every device, no WebGL.
- Cons: not interactive, fixed framing (need a second, portrait render for mobile), re-render for any change (about 40 min for 200 frames).
- Size: WebM VP9 1.2 to 2 MB, MP4 H.264 fallback 2 to 3 MB, poster JPEG about 90 KB. Lazy-load the video after first paint, the poster is the LCP image.

## Recommendation

Option B. The founder asked for elite, and the only thing that looks elite here is the path-traced light; a video ships that light untouched. Poster frame = this still, `prefers-reduced-motion` shows the still only, and `hero3d.js` stays as the fallback until the video is approved. Confidence: moderate.

## How to re-render

From the harnashq folder, with `B=/Applications/Blender.app/Contents/MacOS/Blender`:

- Still: `$B -b --python brand/blender_logo.py -- still 384` writes `team/hero-still.png` (on #07080B) and `team/hero-still-alpha.png`.
- Loop: `$B -b --python brand/blender_logo.py -- loop 128` renders 240 frames to `/tmp/harnas-loop`, then ffmpeg writes `team/hero-loop.webm` (VP9, two-pass 1700k), `team/hero-loop.mp4` (H.264 CRF 22) and `team/hero-poster.png` (frame 1, identical to the still).
- Both runs rebuild `brand/harnas.blend` from scratch. Edit the script, not the .blend. Add a third number for a quick draft at lower size, e.g. `-- still 64 50`.
- Loop tuning lives at the top of the script: `YAW_AMP` (degrees each side), `FPS`, `SECONDS`; the softbox sweep is in the animation block.
